import { afterEach, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/mcp/route";
afterEach(() => vi.unstubAllEnvs());
async function rpc(method: string, params = {}) {
  return POST(new Request("http://localhost:3000/api/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }));
}
it("disables MCP until explicitly enabled", async () => {
  vi.stubEnv("BRICKSSNAP_MCP_ENABLED", "false"); expect((await rpc("tools/list")).status).toBe(404);
});
it("initializes, discovers tools and validates a ChatGPT-created template over HTTP", async () => {
  vi.stubEnv("BRICKSSNAP_MCP_ENABLED", "true");
  const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  expect(init.status).toBe(200); expect((await init.json()).result.serverInfo.name).toBe("BricksSnap");
  const list = await rpc("tools/list"); const tools = (await list.json()).result.tools;
  expect(tools).toHaveLength(8); expect(tools.every((t: { annotations: { readOnlyHint: boolean } }) => t.annotations.readOnlyHint)).toBe(true);
  const call = await rpc("tools/call", { name: "bricks_validate_template", arguments: { json: JSON.stringify([{ id: "abc123", name: "text-link", parent: 0, children: [], settings: { text: "Contact" } }]), title: "ChatGPT Test" } });
  const result = (await call.json()).result;
  expect(result.isError).not.toBe(true); expect(result.structuredContent.template.title).toBe("ChatGPT Test");
});
