import { azureOrigin, DEFAULT_MODELS } from "./ai-config";
import { type ConnectionConfig, RequestError } from "./api-request";
import { BRICKS_SYSTEM_PROMPT } from "./bricks-prompt";

function modelFor(config: ConnectionConfig) {
  return config.model || (config.provider === "openrouter" ? config.openrouterModel : "") || DEFAULT_MODELS[config.provider];
}
async function checkedFetch(url: string, init: RequestInit) {
  let response: Response;
  try { response = await fetch(url, { ...init, redirect: "error" }); }
  catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw error;
    throw new RequestError("Cannot reach the AI provider. Check your connection and endpoint.", 502);
  }
  if (!response.ok) {
    const message = response.status === 401 || response.status === 403 ? "Provider rejected the API key or model permissions. Check Settings."
      : response.status === 429 ? "Provider rate limit or quota exceeded. Check billing or retry later."
      : response.status === 404 ? "Model or deployment not found. Check Settings."
      : `Provider rejected the request (HTTP ${response.status}). Check the selected model and try fewer sections.`;
    // Never relay arbitrary provider responses; they may echo submitted credentials/content.
    throw new RequestError(message, response.status === 429 ? 429 : 502);
  }
  return response.json();
}
function azureUrl(config: ConnectionConfig) {
  if (!config.azureEndpoint || !config.azureDeployment) throw new RequestError("Azure endpoint and deployment are required.");
  try { return `${azureOrigin(config.azureEndpoint)}/openai/deployments/${encodeURIComponent(config.azureDeployment)}/chat/completions?api-version=2024-10-21`; }
  catch { throw new RequestError("Use an HTTPS Azure resource origin and a valid deployment name."); }
}

export async function generateAI(config: ConnectionConfig, key: string, prompt: string, referenceImage?: string, signal?: AbortSignal) {
  const model = modelFor(config);
  const timeout = AbortSignal.timeout(120_000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let text: string | undefined;
  if (config.provider === "openai") {
    const content = [{ type: "input_text", text: prompt }, ...(referenceImage ? [{ type: "input_image", image_url: referenceImage, detail: "high" }] : [])];
    const data = await checkedFetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: requestSignal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, instructions: BRICKS_SYSTEM_PROMPT, input: [{ role: "user", content }],
        text: { format: { type: "json_object" } }, max_output_tokens: 16384, store: false }),
    });
    if (data.status !== "completed") throw new RequestError("AI output is incomplete. Try fewer sections or a model with a larger output limit.", 422);
    const blocks = (data.output ?? []).flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? []);
    if (blocks.some((item: { type: string }) => item.type === "refusal")) throw new RequestError("The model declined this request. Try a different description.", 422);
    text = blocks.filter((item: { type: string }) => item.type === "output_text").map((item: { text: string }) => item.text).join("");
  } else if (config.provider === "anthropic") {
    const image = referenceImage?.match(/^data:(image\/[^;]+);base64,(.+)$/);
    const data = await checkedFetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: requestSignal,
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 16384, system: BRICKS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: [...(image ? [{ type: "image", source: { type: "base64", media_type: image[1], data: image[2] } }] : []), { type: "text", text: prompt }] }] }),
    });
    if (data.stop_reason !== "end_turn") throw new RequestError("AI output is incomplete or declined. Try fewer sections.", 422);
    text = data.content?.filter((item: { type: string }) => item.type === "text").map((item: { text: string }) => item.text).join("");
  } else {
    const azure = config.provider === "azure";
    const data = await checkedFetch(azure ? azureUrl(config) : "https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: requestSignal,
      headers: { "Content-Type": "application/json", ...(azure ? { "api-key": key } : { Authorization: `Bearer ${key}` }) },
      body: JSON.stringify({ model: azure ? config.azureDeployment : model,
        messages: [{ role: "system", content: BRICKS_SYSTEM_PROMPT }, { role: "user", content: referenceImage ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: referenceImage } }] : prompt }],
        [azure ? "max_completion_tokens" : "max_tokens"]: 16384 }),
    });
    if (data.choices?.[0]?.finish_reason !== "stop") throw new RequestError("AI output is incomplete or declined. Try fewer sections.", 422);
    text = data.choices[0].message?.content;
  }
  if (typeof text !== "string" || !text.trim()) throw new RequestError("The model returned no template.", 422);
  try {
    const result = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
    return { elements: Array.isArray(result) ? result : result.elements, model: config.provider === "azure" ? config.azureDeployment : model };
  } catch { throw new RequestError("The model returned invalid JSON. Retry with fewer sections; incomplete templates are not exported.", 422); }
}

export async function testConnection(config: ConnectionConfig, key: string, signal?: AbortSignal) {
  const model = modelFor(config);
  const headers: Record<string, string> = {};
  let url: string;
  if (config.provider === "azure") {
    // A tiny request also verifies deployment permissions. This can incur a small API charge.
    await checkedFetch(azureUrl(config), { method: "POST", signal: signal ?? AbortSignal.timeout(20_000),
      headers: { "Content-Type": "application/json", "api-key": key },
      body: JSON.stringify({ messages: [{ role: "user", content: "Reply OK" }], max_completion_tokens: 16 }) });
    return { model: config.azureDeployment, message: "Azure deployment responded." };
  }
  if (config.provider === "anthropic") {
    url = `https://api.anthropic.com/v1/models/${encodeURIComponent(model)}`;
    headers["x-api-key"] = key; headers["anthropic-version"] = "2023-06-01";
  } else {
    url = config.provider === "openai" ? `https://api.openai.com/v1/models/${encodeURIComponent(model)}` : "https://openrouter.ai/api/v1/key";
    headers.Authorization = `Bearer ${key}`;
  }
  await checkedFetch(url, { headers, signal: signal ?? AbortSignal.timeout(20_000) });
  return { model, message: config.provider === "openrouter" ? "API key accepted. Model access is checked during generation." : "API key and model access verified. Generation quota is checked when generating." };
}
