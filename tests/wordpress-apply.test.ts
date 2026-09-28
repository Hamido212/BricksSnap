import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { wpRequestSchema, type WordPressApplyResult, type WordPressCredentials, type WordPressRestoreResult } from "../src/lib/wordpress-contract";
import { stableJson } from "../src/lib/template-staging";
import type { BricksElement } from "../src/lib/bricks-engine";

// A stateful stand-in for a Bricks 2.4.2 site behind the MCP Adapter dispatcher, following the
// captured schemas: set-page-elements checks expectedDocumentDigest and snapshots a revision first;
// restore-revision snapshots the current state before restoring.
class FakeBricksSite {
  elements: BricksElement[];
  revisions = new Map<number, BricksElement[]>();
  nextRevision = 100;
  locked = false;
  enabled = new Set(["bricks/set-page-elements", "bricks/restore-revision"]);
  classes = [{ id: "cls001", name: "btn", settings: { _padding: { top: "1rem" } } }];
  writes = 0;
  /** Simulates another editor saving between BricksSnap's check and its write. */
  editBeforeWrite = false;
  /** Simulates Bricks normalizing a setting on save. */
  normalize = false;
  /** Simulates the live host firewall that answered writes with external image URLs with an HTML page. */
  firewall = false;

  constructor(elements: BricksElement[]) { this.elements = structuredClone(elements); }
  digest() { return createHash("sha256").update(stableJson(this.elements)).digest("hex"); }
  otherEdit() { this.elements = this.elements.map(el => el.parent === 0 ? { ...el, label: `${el.label ?? el.name} (edited)` } : el); }

  handle(ability: string, params: Record<string, unknown>): unknown {
    switch (ability) {
      case "bricks/list-ability-status":
        return { abilities: (params.abilityNames as string[]).map(name => ({ name, enabled: this.enabled.has(name), defaultEnabled: true })), total: 2 };
      case "bricks/find-post":
        return { results: [{ id: 7, title: "Home", postType: "page", locked: this.locked }], total: 1 };
      case "bricks/get-page-elements":
        // Like PHP's json_encode, empty settings arrive as [] (observed live on Bricks 2.4.2).
        return { elements: structuredClone(this.elements).map(el => Object.keys(el.settings).length ? el : { ...el, settings: [] }), postId: 7, documentDigest: this.digest() };
      case "bricks/list-global-classes":
        return { items: this.classes, hasMore: false };
      case "bricks/set-page-elements": {
        if (this.editBeforeWrite) this.otherEdit();
        if (params.expectedDocumentDigest !== this.digest()) throw new Error("bricks_document_digest_mismatch: The document changed since it was read.");
        const revisionId = this.elements.length ? this.nextRevision++ : null;
        if (revisionId) this.revisions.set(revisionId, structuredClone(this.elements));
        this.elements = structuredClone(params.elements as BricksElement[]);
        if (this.normalize) this.elements = this.elements.map(el => { const { _cssCustom, ...settings } = el.settings; void _cssCustom; return { ...el, settings }; });
        this.writes++;
        return { elementIds: this.elements.map(el => el.id), elementCount: this.elements.length, revisionId, documentDigest: this.digest(), changed: true };
      }
      case "bricks/restore-revision": {
        const snapshot = this.revisions.get(params.revisionId as number);
        if (!snapshot) throw new Error("Revision not found.");
        const newRevisionId = this.nextRevision++;
        this.revisions.set(newRevisionId, structuredClone(this.elements));
        this.elements = structuredClone(snapshot);
        return { restored: true, postId: 7, fromRevisionId: params.revisionId, newRevisionId, areas: ["content"] };
      }
    }
    throw new Error(`Unknown ability ${ability}`);
  }
}

const creds: WordPressCredentials = { endpoint: "https://example.com/wp-json/mcp/mcp-adapter-default-server", username: "u", password: "p" };
const section = (id: string, label: string, extra: Record<string, unknown> = {}): BricksElement[] => [
  { id, name: "section", parent: 0, children: [`${id.slice(0, 5)}h`], settings: { ...extra }, label },
  { id: `${id.slice(0, 5)}h`, name: "heading", parent: id, children: [], settings: { text: label, tag: "h2" } },
];

async function connectTo(site: FakeBricksSite) {
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
  vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
  vi.spyOn(Client.prototype, "listTools").mockResolvedValue({ tools: [{ name: "mcp-adapter-execute-ability", inputSchema: { type: "object" as const } }] });
  vi.spyOn(Client.prototype, "callTool").mockImplementation(async params => {
    const { ability_name: ability, parameters } = params.arguments as { ability_name: string; parameters: Record<string, unknown> };
    if (site.firewall && ability === "bricks/set-page-elements" && JSON.stringify(parameters).includes("https://images.")) {
      const { RequestError } = await import("../src/lib/api-request");
      throw new RequestError('The web host answered with a page ("503 Service Unavailable") instead of WordPress. A firewall, rate limit or maintenance mode may have blocked the request; a write was not confirmed. Wait, reload the page and retry.', 502);
    }
    try {
      return { content: [{ type: "text", text: JSON.stringify({ success: true, data: site.handle(ability, parameters) }) }] } as never;
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: (error as Error).message }] } as never;
    }
  });
  const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
  const signal = new AbortController().signal;
  return {
    apply: (template: unknown, expectedDocumentDigest: string, allowLocked = false) =>
      handleWordPressRequest({ action: "apply", credentials: creds, postId: 7, template, expectedDocumentDigest, confirm: true, allowLocked }, signal) as Promise<WordPressApplyResult>,
    restore: (revisionId: number, expectedDocumentDigest: string) =>
      handleWordPressRequest({ action: "restore", credentials: creds, postId: 7, revisionId, expectedDocumentDigest, confirm: true }, signal) as Promise<WordPressRestoreResult>,
  };
}

describe("guarded apply and restore", () => {
  afterEach(() => vi.restoreAllMocks());

  it("applies a reviewed page, verifies the read-back and restores the snapshot", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    const baseline = site.digest();
    const { apply, restore } = await connectTo(site);
    const proposal = { content: [...section("hero01", "Hero"), ...section("feat01", "Features")] };

    const applied = await apply(proposal, baseline);
    expect(applied).toMatchObject({ postId: 7, applied: true, revisionId: 100, verification: { matches: true, added: 0, removed: 0, changed: 0 } });
    expect(applied.documentDigest).toBe(site.digest());
    expect(applied.template.content).toHaveLength(4);
    expect(applied.source).toMatchObject({ postId: 7, postTitle: "Home", documentDigest: site.digest() });

    const restored = await restore(applied.revisionId!, applied.documentDigest);
    expect(restored).toMatchObject({ restored: true, fromRevisionId: 100, newRevisionId: 101 });
    expect(restored.documentDigest).toBe(baseline);
    expect(restored.template.content).toHaveLength(2);
  });

  it("refuses to write when the page changed since it was loaded", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    const baseline = site.digest();
    site.otherEdit();
    const { apply } = await connectTo(site);
    await expect(apply({ content: section("feat01", "Features") }, baseline)).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/changed since it was loaded/) });
    expect(site.writes).toBe(0);
  });

  it("maps Bricks' own digest rejection during a race to a conflict", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.editBeforeWrite = true;
    const { apply } = await connectTo(site);
    await expect(apply({ content: section("feat01", "Features") }, site.digest())).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/refused the change because the page was modified/) });
    expect(site.writes).toBe(0);
  });

  it("requires confirmation to overwrite a page open in the builder", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.locked = true;
    const { apply } = await connectTo(site);
    await expect(apply({ content: section("feat01", "Features") }, site.digest())).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/open in the Bricks builder/) });
    expect(site.writes).toBe(0);
    await expect(apply({ content: section("feat01", "Features") }, site.digest(), true)).resolves.toMatchObject({ applied: true });
  });

  it("does not route around a disabled write ability", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.enabled.delete("bricks/set-page-elements");
    const { apply } = await connectTo(site);
    await expect(apply({ content: section("feat01", "Features") }, site.digest())).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/Enable bricks\/set-page-elements/) });
    expect(site.writes).toBe(0);
  });

  it("rejects sections that need global classes the site does not have", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    const { apply } = await connectTo(site);
    const proposal = { content: section("feat01", "Features", { _cssGlobalClasses: ["cls001", "new999"] }), globalClasses: [{ id: "new999", name: "fresh", settings: {} }] };
    await expect(apply(proposal, site.digest())).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/new999/) });
    expect(site.writes).toBe(0);
  });

  it("reports Bricks normalization in the read-back verification", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.normalize = true;
    const { apply } = await connectTo(site);
    const result = await apply({ content: section("feat01", "Features", { _cssCustom: "#brxe-feat01 { color: red; }" }) }, site.digest());
    expect(result.verification).toMatchObject({ matches: false, changed: 1, fields: ["settings._cssCustom"] });
  });

  it("names external URLs when a host firewall blocks the write", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.firewall = true;
    const { apply } = await connectTo(site);
    const proposal = { content: section("feat01", "Features", { _background: { image: { url: "https://images.unsplash.com/photo-1?w=1200" } } }) };
    await expect(apply(proposal, site.digest())).rejects.toMatchObject({ status: 502, message: expect.stringMatching(/external URLs \(https:\/\/images\.unsplash\.com\)/) });
    expect(site.writes).toBe(0);
  });

  it("lists external URL origins but ignores the site's own host", async () => {
    const { externalUrls } = await import("../src/lib/wordpress-client");
    const template = { content: [
      ...section("feat01", "A", { _background: { image: { url: "https://images.unsplash.com/a.jpg?w=1" } }, link: { url: "https://example.com/kontakt" } }),
      ...section("feat02", "B", { _cssCustom: "#x { background: url('https://cdn.test/b.png') }" }),
    ], globalClasses: [], globalElements: [], components: [] };
    expect(externalUrls(template as never, "example.com")).toEqual(["https://images.unsplash.com", "https://cdn.test"]);
  });

  it("refuses to restore over edits made after the apply", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    const { apply, restore } = await connectTo(site);
    const applied = await apply({ content: section("feat01", "Features") }, site.digest());
    site.otherEdit();
    await expect(restore(applied.revisionId!, applied.documentDigest)).rejects.toMatchObject({ status: 409 });
  });

  it("requires explicit confirmation and a digest in the request", () => {
    const base = { action: "apply", credentials: creds, postId: 7, template: { content: [] }, expectedDocumentDigest: "a".repeat(64) };
    expect(() => wpRequestSchema.parse({ ...base, confirm: false })).toThrow();
    expect(() => wpRequestSchema.parse({ ...base, confirm: true, expectedDocumentDigest: "abc" })).toThrow();
    expect(wpRequestSchema.parse({ ...base, confirm: true })).toMatchObject({ action: "apply", allowLocked: false });
  });
});
