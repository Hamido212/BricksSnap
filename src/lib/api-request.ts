import { z } from "zod";
import { PROVIDERS } from "./ai-config";
import { SECTION_TYPES } from "./presets";

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = "RequestError"; }
}

/**
 * Also matches a RequestError from another route's bundle: the local ChatGPT bridge lives on globalThis,
 * so an error thrown by it may come from a different copy of this class than `instanceof` expects.
 */
export function isRequestError(error: unknown): error is RequestError {
  return error instanceof RequestError || (error instanceof Error && error.name === "RequestError" && typeof (error as { status?: unknown }).status === "number");
}

export const connectionSchema = z.object({
  provider: z.enum(PROVIDERS).default("openai"),
  apiKey: z.string().trim().max(1024).optional(),
  model: z.string().trim().max(160).regex(/^[a-zA-Z0-9._:/-]*$/).optional(),
  azureEndpoint: z.string().trim().max(300).optional(),
  azureDeployment: z.string().trim().max(160).regex(/^[a-zA-Z0-9._-]*$/).optional(),
  openrouterModel: z.string().trim().max(160).regex(/^[a-zA-Z0-9._:/-]*$/).optional(),
});
export const generationSchema = connectionSchema.extend({
  prompt: z.string().trim().min(1).max(12000),
  useAI: z.boolean().default(false),
  useChatGPT: z.boolean().default(false),
  chatgptModel: z.string().trim().max(160).regex(/^[a-zA-Z0-9._:/-]*$/).optional(),
  sections: z.array(z.string().refine(s => SECTION_TYPES.some(x => x.id === s), "Unknown section")).max(22).optional(),
  stylePreset: z.object({ id: z.string().max(100) }).optional(),
  colorPalette: z.object({ id: z.string().max(100) }).optional(),
  referenceImage: z.string().max(5_600_000).regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/).optional(),
});
export type ConnectionConfig = z.infer<typeof connectionSchema>;

export async function readJson(request: Request, maxBytes = 6_000_000): Promise<unknown> {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next may construct the route URL with its internal listener hostname.
  // Compare the browser Origin with the actual request Host, never an arbitrary
  // X-Forwarded-Host supplied by the caller.
  const host = request.headers.get("host") || url.host;
  if (origin) {
    let source: URL;
    try { source = new URL(origin); } catch { throw new RequestError("Invalid origin", 403); }
    if (source.host !== host || !["http:", "https:"].includes(source.protocol)) throw new RequestError("Cross-origin requests are not allowed", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) throw new RequestError("Expected application/json", 415);
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestError("Request is too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Request body is required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new RequestError("Request is too large", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new RequestError("Invalid JSON request"); }
}

export function resolveKey(config: ConnectionConfig): string {
  if (config.apiKey) return config.apiKey;
  // Server-funded generation must be explicitly enabled; BYOK is the public default.
  if (process.env.BRICKSSNAP_ALLOW_SERVER_KEYS !== "true") throw new RequestError("Add an API key in Settings, or switch off AI mode.");
  const key = config.provider === "openai" ? process.env.OPENAI_API_KEY : config.provider === "anthropic" ? process.env.ANTHROPIC_API_KEY : undefined;
  if (!key?.trim()) throw new RequestError("No API key configured for this provider. Open Settings or switch off AI mode.");
  return key.trim();
}

export function errorResponse(error: unknown): Response {
  if (error instanceof z.ZodError) return Response.json({ error: error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
  if (isRequestError(error)) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) return Response.json({ error: "Generation timed out or was cancelled. Try fewer sections." }, { status: 504 });
  return Response.json({ error: "Unable to complete the request. Please retry." }, { status: 500 });
}
