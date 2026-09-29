import { afterEach, describe, expect, it, vi } from "vitest";
import { assertLocalCodex, codexCommand, localCodex } from "../src/lib/local-codex";
import { errorResponse, RequestError } from "../src/lib/api-request";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
const request = (headers: Record<string, string> = {}) => new Request("http://127.0.0.1:3001/api/codex", {
  headers: { Host: "127.0.0.1:3001", Origin: "http://127.0.0.1:3001", "X-BricksSnap-Local": "1", ...headers },
});

describe("local ChatGPT boundary", () => {
  it("requires explicit local mode", () => {
    vi.stubEnv("BRICKSSNAP_LOCAL_CODEX", "false");
    expect(() => assertLocalCodex(request())).toThrow("local mode");
  });
  it("accepts loopback and rejects public, forwarded and cross-origin access", () => {
    vi.stubEnv("BRICKSSNAP_LOCAL_CODEX", "true");
    expect(() => assertLocalCodex(request({ "X-Forwarded-For": "127.0.0.1" }))).not.toThrow();
    const rejectedHeaders: Record<string, string>[] = [
      { Host: "bricks.example.com" }, { Host: "localhost.evil.test" },
      { Origin: "https://evil.test" }, { "X-Forwarded-For": "203.0.113.1" },
      { "X-Forwarded-For": "127.0.0.1, 203.0.113.1" }, { "X-BricksSnap-Local": "" },
    ];
    for (const headers of rejectedHeaders) expect(() => assertLocalCodex(request(headers))).toThrow();
  });
});

describe("Codex app-server protocol", () => {
  it("starts a read-only thread and returns the completed native element payload", async () => {
    const elements = [{ id: "abc123", name: "heading", parent: 0, children: [], settings: { text: "Hello" } }];
    vi.spyOn(localCodex, "status").mockResolvedValue({ connected: true, plan: "plus", models: [{ model: "test-model", displayName: "Test", isDefault: true }] });
    const rpc = vi.spyOn(localCodex, "rpc").mockImplementation(async method => {
      if (method === "thread/start") return { thread: { id: "test-thread" } };
      if (method === "turn/start") queueMicrotask(() => {
        localCodex.events.emit("item/completed", { threadId: "test-thread", item: { type: "agentMessage", text: JSON.stringify({ elements }) } });
        localCodex.events.emit("turn/completed", { threadId: "test-thread", turn: { status: "completed" } });
      });
      return {};
    });
    expect(await localCodex.generate("Test template", undefined, new AbortController().signal)).toEqual({ elements, model: "test-model" });
    expect(rpc).toHaveBeenCalledWith("thread/start", expect.objectContaining({ sandbox: "read-only", approvalPolicy: "never", ephemeral: true }));
    expect(rpc).toHaveBeenCalledWith("turn/start", { threadId: "test-thread", input: [{ type: "text", text: "Test template", text_elements: [] }] });
    expect(localCodex.events.listenerCount("turn/completed")).toBe(0);
    expect(localCodex.busy).toBe(false);
  });
  it("does not start a generation for a disconnected account", async () => {
    vi.spyOn(localCodex, "status").mockResolvedValue({ connected: false, plan: undefined, models: [] });
    const rpc = vi.spyOn(localCodex, "rpc");
    await expect(localCodex.generate("Test", undefined, new AbortController().signal)).rejects.toThrow("Sign in");
    expect(rpc).not.toHaveBeenCalled();
    expect(localCodex.busy).toBe(false);
  });
});

describe("Codex command", () => {
  const files = (...paths: string[]) => (path: string) => paths.includes(path);
  it("uses codex on PATH outside Windows and honours BRICKSSNAP_CODEX_BIN", () => {
    expect(codexCommand({}, "darwin")).toEqual({ command: "codex", args: [] });
    expect(codexCommand({ BRICKSSNAP_CODEX_BIN: "/opt/codex" }, "linux")).toEqual({ command: "/opt/codex", args: [] });
  });
  it("runs the npm package script on Windows instead of the codex.cmd shim", () => {
    const dir = "C:\\Users\\a\\AppData\\Roaming\\npm";
    const script = `${dir}\\node_modules\\@openai\\codex\\bin\\codex.js`;
    expect(codexCommand({ Path: `C:\\Windows;${dir}` }, "win32", files(`${dir}\\codex.cmd`, script))).toEqual({ command: process.execPath, args: [script] });
    expect(codexCommand({ BRICKSSNAP_CODEX_BIN: `${dir}\\codex.cmd` }, "win32", files(script))).toEqual({ command: process.execPath, args: [script] });
  });
  it("prefers a native codex.exe and falls back to codex", () => {
    expect(codexCommand({ PATH: "C:\\tools" }, "win32", files("C:\\tools\\codex.exe"))).toEqual({ command: "C:\\tools\\codex.exe", args: [] });
    expect(codexCommand({ PATH: "C:\\tools" }, "win32", files())).toEqual({ command: "codex", args: [] });
  });
});

describe("ChatGPT errors across route bundles", () => {
  it("keeps the message of a RequestError from another copy of the class", async () => {
    // Each route can bundle its own copy; the shared bridge may throw the other one.
    class OtherRequestError extends Error { constructor(message: string, public status = 400) { super(message); this.name = "RequestError"; } }
    const response = errorResponse(new OtherRequestError("ChatGPT generation timed out. Try fewer sections.", 422));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "ChatGPT generation timed out. Try fewer sections." });
    expect(errorResponse(new RequestError("Nope", 409)).status).toBe(409);
    expect(errorResponse(new Error("internal detail")).status).toBe(500);
  });
});
