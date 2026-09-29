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
  expect(tools).toHaveLength(10); expect(tools.every((t: { annotations: { readOnlyHint: boolean } }) => t.annotations.readOnlyHint)).toBe(true);
  const call = await rpc("tools/call", { name: "bricks_validate_template", arguments: { json: JSON.stringify([{ id: "abc123", name: "text-link", parent: 0, children: [], settings: { text: "Contact" } }]), title: "ChatGPT Test" } });
  const result = (await call.json()).result;
  expect(result.isError).not.toBe(true); expect(result.structuredContent.template.title).toBe("ChatGPT Test");
});
it("generates a section in explicit role colors and rejects unknown roles", async () => {
  vi.stubEnv("BRICKSSNAP_MCP_ENABLED", "true");
  await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  const call = await rpc("tools/call", { name: "bricks_generate_section", arguments: { prompt: "studio", section: "hero", colors: { primary: "#0B5FFF", heading: "#14291f" } } });
  const result = (await call.json()).result;
  expect(result.isError).not.toBe(true);
  const json = JSON.stringify(result.structuredContent.template.content).toLowerCase();
  expect(json).toContain("#0b5fff"); expect(json).toContain("#14291f");
  const bad = await rpc("tools/call", { name: "bricks_generate_section", arguments: { prompt: "studio", section: "hero", colors: { brand: "#000000" } } });
  expect(JSON.stringify(await bad.json())).toMatch(/brand|Unrecognized|invalid/i);
});
it("lists kit options and builds a kit page with design system and quality checks", async () => {
  vi.stubEnv("BRICKSSNAP_MCP_ENABLED", "true");
  await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  const options = (await (await rpc("tools/call", { name: "bricks_kit_options", arguments: {} })).json()).result.structuredContent;
  expect(options.styles.map((s: { id: string }) => s.id)).toEqual(["clean", "soft", "bold", "editorial", "warm"]);
  expect(options.sections.find((s: { type: string }) => s.type === "hero").variants.length).toBeGreaterThan(1);
  const call = await rpc("tools/call", { name: "bricks_kit_page", arguments: {
    sections: [{ type: "navbar" }, { type: "hero", variant: "panel" }, { type: "services", variant: "list" }, { type: "footer" }],
    kit: { style: "warm", primary: "#0b5fff" }, profile: { industry: "kfz", language: "de", name: "Muster Zulassung", city: "Bremen" }, title: "Kfz Seite",
  } });
  const result = (await call.json()).result;
  expect(result.isError).not.toBe(true);
  const { template, designSystem, quality } = result.structuredContent;
  expect(template.type).toBe("content");
  expect(template.globalClasses.every((c: { name: string }) => c.name.startsWith("bs-"))).toBe(true);
  expect(JSON.stringify(template.content)).toContain("Muster Zulassung");
  expect(designSystem.css).toContain("--bs-primary: #0b5fff");
  expect(quality.length).toBeGreaterThan(0);
  const bad = await rpc("tools/call", { name: "bricks_kit_page", arguments: { sections: [{ type: "nope" }] } });
  expect(JSON.stringify(await bad.json())).toMatch(/invalid|nope/i);
});
