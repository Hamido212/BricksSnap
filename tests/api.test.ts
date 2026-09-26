import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/generate/route";
import { POST as connect } from "../src/app/api/connection/route";
import { azureOrigin } from "../src/lib/ai-config";

const req = (body: unknown) => new Request("http://localhost:3000/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("generation API", () => {
  it("generates without AI keys", async () => {
    const response = await POST(req({ prompt: "Hero and footer", useAI: false }));
    expect(response.status).toBe(200); expect((await response.json()).mode).toBe("builtin");
  });
  for (const body of [null, [], { prompt: 12 }, { prompt: " " }, { prompt: "a", sections: ["unknown"] }, { prompt: "a", provider: "evil" }, { prompt: "a", referenceImage: "https://evil.test/x" }, { prompt: "a", useAI: "true" }, { prompt: "x".repeat(12001) }]) {
    it(`rejects invalid input ${JSON.stringify(body).slice(0, 90)}`, async () => expect((await POST(req(body))).status).toBe(400));
  }
  it("rejects malformed JSON and cross-origin requests", async () => {
    expect((await POST(new Request("http://localhost/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
    const request = req({ prompt: "test" }); request.headers.set("Origin", "https://evil.test");
    expect((await POST(request)).status).toBe(403);
  });
  it("does not silently substitute built-in templates for missing keys", async () => {
    vi.stubEnv("BRICKSSNAP_ALLOW_SERVER_KEYS", "false");
    expect((await POST(req({ prompt: "test", useAI: true }))).status).toBe(400);
  });
  it("accepts same-host requests when Next uses an internal route URL", async () => {
    const request = req({ prompt: "hero" });
    request.headers.set("Host", "127.0.0.1:3001");
    request.headers.set("Origin", "http://127.0.0.1:3001");
    expect((await POST(request)).status).toBe(200);
    request.headers.set("Origin", "https://evil.test");
    request.headers.set("X-Forwarded-Host", "evil.test");
    expect((await POST(request)).status).toBe(403);
  });
  for (const provider of ["anthropic", "azure", "openrouter"]) it(`accepts complete ${provider} output`, async () => {
    const text = JSON.stringify({ elements: [{ id: "abc123", name: "heading", parent: 0, children: [], settings: { text: "Test" } }] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(provider === "anthropic" ? { stop_reason: "end_turn", content: [{ type: "text", text }] } : { choices: [{ finish_reason: "stop", message: { content: text } }] })));
    const response = await POST(req({ prompt: "test", useAI: true, provider, apiKey: "fake", azureEndpoint: "https://example.openai.azure.com", azureDeployment: "test" }));
    expect(response.status).toBe(200); expect((await response.json()).mode).toBe("ai");
  });
  it("surfaces provider errors without echoing sensitive upstream data or falling back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("secret-key-prompt", { status: 401 })));
    const response = await POST(req({ prompt: "test", useAI: true, apiKey: "fake-key" }));
    expect(response.status).toBe(502); const body = await response.text();
    expect(body).not.toContain("secret-key-prompt"); expect(body).not.toContain('"template"');
  });
  it("uses Responses JSON mode, configurable model and store:false", async () => {
    const elements = [{ id: "abc123", name: "heading", parent: 0, children: [], settings: { text: "Hello" } }];
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ elements }) }] }] })); vi.stubGlobal("fetch", fetch);
    const response = await POST(req({ prompt: "test", useAI: true, apiKey: "fake-key", model: "gpt-4.1-mini" }));
    expect(response.status).toBe(200);
    expect(fetch.mock.calls[0][0]).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ model: "gpt-4.1-mini", store: false, text: { format: { type: "json_object" } } });
    expect((await response.json()).template.content).toEqual(elements);
  });
  it("rejects incomplete AI output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "incomplete", output: [] })));
    expect((await POST(req({ prompt: "test", useAI: true, apiKey: "fake" }))).status).toBe(422);
  });
  it("checks model access without a generation call", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ id: "gpt-4.1" })); vi.stubGlobal("fetch", fetch);
    expect((await connect(req({ provider: "openai", apiKey: "fake" }))).status).toBe(200);
    expect(fetch.mock.calls[0][0]).toBe("https://api.openai.com/v1/models/gpt-4.1");
  });
});
describe("Azure endpoint boundary", () => {
  for (const url of ["http://localhost", "https://127.0.0.1", "https://a.openai.azure.com.evil.test", "https://user:pass@a.openai.azure.com", "https://a.openai.azure.com/path", "https://a.openai.azure.com?redirect=x"]) it(`rejects ${url}`, () => expect(() => azureOrigin(url)).toThrow());
  it("accepts a genuine Azure resource origin", () => expect(azureOrigin("https://example.openai.azure.com/")).toBe("https://example.openai.azure.com"));
});
