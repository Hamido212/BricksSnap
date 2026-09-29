import { afterEach, describe, expect, it, vi } from "vitest";
import type { BricksElement } from "../src/lib/bricks-engine";

const creds = { endpoint: "https://example.com/wp-json/mcp/mcp-adapter-default-server", username: "u", password: "p" };
const element = (id: string, settings: Record<string, unknown>): BricksElement => ({ id, name: "image", parent: 0, children: [], settings });
const template = {
  content: [
    element("img001", { image: { url: "https://images.unsplash.com/photo-1?w=800", filename: "hero.jpg" }, link: { type: "external", url: "https://partner.example/" } }),
    element("img002", { _background: { color: { hex: "#000000" }, image: { url: "https://images.unsplash.com/photo-2?w=1200", filename: "bg.jpg" } } }),
    element("img003", { image: { url: "https://images.unsplash.com/photo-1?w=800", filename: "hero.jpg" } }),
    element("img004", { image: { url: "https://example.com/wp-content/uploads/own.jpg", filename: "own.jpg", id: 5 } }),
  ],
};

afterEach(() => { vi.unstubAllGlobals(); vi.doUnmock("node:dns/promises"); vi.resetModules(); vi.restoreAllMocks(); });

describe("external image detection and rewriting", () => {
  it("finds external image controls once each and ignores links and site media", async () => {
    const { findExternalImages } = await import("../src/lib/wordpress-media");
    expect(findExternalImages(template, "example.com")).toEqual([
      { url: "https://images.unsplash.com/photo-1?w=800", filename: "hero.jpg" },
      { url: "https://images.unsplash.com/photo-2?w=1200", filename: "bg.jpg" },
    ]);
  });

  it("points image controls at media-library items and keeps other settings", async () => {
    const { replaceImages } = await import("../src/lib/wordpress-media");
    const result = replaceImages(template, new Map([["https://images.unsplash.com/photo-1?w=800", { id: 11, url: "https://example.com/wp-content/uploads/a.jpg", filename: "a.jpg" }]]));
    expect(result.content[0].settings).toEqual({
      image: { url: "https://example.com/wp-content/uploads/a.jpg", filename: "a.jpg", id: 11, size: "full", full: "https://example.com/wp-content/uploads/a.jpg" },
      link: { type: "external", url: "https://partner.example/" },
    });
    expect((result.content[2].settings.image as { id: number }).id).toBe(11);
    expect(result.content[1].settings).toEqual(template.content[1].settings);
  });
});

describe("guarded image download", () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  const dns = (address: string) => vi.doMock("node:dns/promises", () => ({ lookup: vi.fn(async () => [{ address, family: 4 }]) }));

  it("rejects non-HTTPS URLs, private hosts and non-image responses", async () => {
    dns("10.0.0.5");
    const { downloadImage } = await import("../src/lib/wordpress-media");
    const signal = new AbortController().signal;
    await expect(downloadImage("http://images.example/a.png", signal)).rejects.toMatchObject({ status: 422 });
    await expect(downloadImage("https://intranet.example/a.png", signal)).rejects.toThrow(/not a public address/);
  });

  it("follows redirects with a public-address check per hop and enforces image types", async () => {
    dns("93.184.216.34");
    const { downloadImage } = await import("../src/lib/wordpress-media");
    const fetchImpl = vi.fn(async (url: URL | RequestInfo) => String(url).includes("start")
      ? new Response(null, { status: 302, headers: { location: "https://cdn.example/final.png" } })
      : String(url).includes("final") ? new Response(png, { headers: { "content-type": "image/png" } }) : new Response("<html>", { headers: { "content-type": "text/html" } }));
    const result = await downloadImage("https://img.example/start", new AbortController().signal, fetchImpl as unknown as typeof fetch);
    expect(result).toMatchObject({ contentType: "image/png" });
    expect(result.data.length).toBe(4);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    await expect(downloadImage("https://img.example/page", new AbortController().signal, fetchImpl as unknown as typeof fetch)).rejects.toThrow(/Not a supported image type/);
  });
});

describe("media import through the WordPress connection", () => {
  it("uploads each external image once as base64, reuses earlier uploads and rewrites the proposal", async () => {
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]) }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([255, 216, 255]), { headers: { "content-type": "image/jpeg" } })));
    const { uploadName } = await import("../src/lib/wordpress-media");
    const earlier = uploadName("https://images.unsplash.com/photo-2?w=1200", "image/jpeg");
    const uploads: Array<Record<string, unknown>> = [];
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({ tools: [{ name: "mcp-adapter-execute-ability", inputSchema: { type: "object" as const } }] });
    vi.spyOn(Client.prototype, "callTool").mockImplementation(async params => {
      const { ability_name: ability, parameters } = params.arguments as { ability_name: string; parameters: Record<string, unknown> };
      const data = ability === "bricks/list-ability-status"
        ? { abilities: [{ name: "bricks/upload-media", enabled: true }] }
        : ability === "bricks/find-media"
        ? { results: earlier.startsWith(String(parameters.query)) ? [{ id: 77, url: `https://example.com/wp-content/uploads/${earlier}`, filename: earlier }] : [], total: 0 }
        : (uploads.push(parameters), { id: 90 + uploads.length, url: `https://example.com/wp-content/uploads/${parameters.filename}`, filename: parameters.filename });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, data }) }] } as never;
    });
    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest({ action: "media", credentials: creds, template, confirm: true }, new AbortController().signal) as {
      template: { content: BricksElement[] }; imported: Array<{ id: number; reused: boolean }>; skipped: unknown[];
    };
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatchObject({ base64: "/9j/", filename: expect.stringMatching(/^brickssnap-[a-f0-9]{12}\.jpg$/), title: "hero" });
    expect(JSON.stringify(uploads[0])).not.toContain("unsplash");
    expect(result.imported).toEqual([expect.objectContaining({ id: 91, reused: false }), expect.objectContaining({ id: 77, reused: true })]);
    expect(result.skipped).toEqual([]);
    expect(JSON.stringify(result.template.content)).not.toContain("images.unsplash.com");
    expect(result.template.content[0].settings.link).toEqual({ type: "external", url: "https://partner.example/" });
  });
});
