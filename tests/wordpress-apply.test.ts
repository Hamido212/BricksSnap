import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { wpRequestSchema, type WordPressApplyResult, type WordPressClassesResult, type WordPressConditionsResult, type WordPressCreateTemplateResult, type WordPressCredentials, type WordPressRestoreResult, type WordPressTemplatesResult } from "../src/lib/wordpress-contract";
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
  enabled = new Set(["bricks/set-page-elements", "bricks/restore-revision", "bricks/batch-create-global-classes", "bricks/create-template", "bricks/set-template-conditions"]);
  templates = new Map<number, { title: string; type: string; status: string; settings: Record<string, unknown> | unknown[]; elements: unknown[] }>([
    [81, { title: "Coming soon", type: "content", status: "publish", settings: [], elements: [] }],
    [90, { title: "Main header", type: "header", status: "publish", settings: { templateConditions: [{ id: "c1a2b3", main: "any" }], headerSticky: true }, elements: [] }],
  ]);
  nextTemplate = 200;
  /** Simulates another editor changing a template's conditions between BricksSnap's reads. */
  conditionEditBeforeWrite = false;
  classes: Array<{ id: string; name: string; settings: Record<string, unknown>; selectors?: unknown[] }> = [{ id: "cls001", name: "btn", settings: { _padding: { top: "1rem" } } }];
  classVersion = 0;
  classWrites = 0;
  /** Simulates another editor changing classes between BricksSnap's read and its write. */
  classEditBeforeWrite = false;
  writes = 0;
  /** Simulates another editor saving between BricksSnap's check and its write. */
  editBeforeWrite = false;
  /** Simulates Bricks normalizing a setting on save. */
  normalize = false;
  /** Simulates the live host firewall that answered writes with external image URLs with an HTML page. */
  firewall = false;

  constructor(elements: BricksElement[]) { this.elements = structuredClone(elements); }
  digest() { return createHash("sha256").update(stableJson(this.elements)).digest("hex"); }
  classOwnership() { return { resource: "globalClasses", siteId: 1, version: this.classVersion, resourceDigest: createHash("sha256").update(stableJson(this.classes)).digest("hex") }; }
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
      case "bricks/list-global-classes": {
        // Paginated like Bricks 2.4.2, with an ownership envelope per read.
        const perPage = Number(params.perPage ?? 25), page = Number(params.page ?? 1);
        const items = this.classes.slice((page - 1) * perPage, page * perPage).map(c => ({ ...c, itemDigest: "0".repeat(64), itemOwnership: this.classOwnership() }));
        return { items, total: this.classes.length, page, perPage, hasMore: page * perPage < this.classes.length, categories: [], locked: [], ownership: this.classOwnership() };
      }
      case "bricks/batch-create-global-classes": {
        if (this.classEditBeforeWrite) { this.classes = [...this.classes, { id: "oth001", name: "other", settings: {} }]; this.classVersion++; }
        if (stableJson(params.expectedOwnership) !== stableJson(this.classOwnership())) throw new Error("Global classes changed since they were read (bricks_conflict_ownership_mismatch).");
        const incoming = params.classes as Array<{ id?: string; name: string; settings?: Record<string, unknown>; category?: string }>;
        if (incoming.some(c => this.classes.some(e => e.name === c.name) || c.category !== undefined)) throw new Error("Invalid class batch.");
        const created = incoming.map(c => ({ id: c.id ?? "gen001", name: c.name, settings: c.settings ?? {} }));
        this.classes = [...this.classes, ...created]; this.classVersion++; this.classWrites++;
        return { createdClassIds: created.map(c => c.id), classNameToId: Object.fromEntries(created.map(c => [c.name, c.id])), classCount: this.classes.length, dryRun: false, valid: true, ownership: this.classOwnership(), ...(params.returnClasses ? { classes: created } : {}) };
      }
      case "bricks/set-page-elements": {
        if (this.editBeforeWrite) this.otherEdit();
        // Error text as returned live by Bricks 2.4.2 for a stale digest.
        if (params.expectedDocumentDigest !== this.digest()) throw new Error(`The Bricks document changed after the candidate was prepared. Re-read the page and preview the write again. | data: {"code":"bricks_conflict_document_digest_mismatch"}`);
        const revisionId = this.elements.length ? this.nextRevision++ : null;
        if (revisionId) this.revisions.set(revisionId, structuredClone(this.elements));
        this.elements = structuredClone(params.elements as BricksElement[]);
        if (this.normalize) this.elements = this.elements.map(el => { const { _cssCustom, ...settings } = el.settings; void _cssCustom; return { ...el, settings }; });
        this.writes++;
        return { elementIds: this.elements.map(el => el.id), elementCount: this.elements.length, revisionId, documentDigest: this.digest(), changed: true };
      }
      case "bricks/list-templates": {
        const items = [...this.templates].filter(([, t]) => !params.type || t.type === params.type)
          .map(([id, t]) => ({ id, title: t.title, type: t.type, status: t.status, editUrl: `https://example.com/?p=${id}&bricks=run`, conditionCount: Array.isArray((t.settings as Record<string, unknown>).templateConditions) ? ((t.settings as Record<string, unknown[]>).templateConditions).length : 0 }));
        return { items, total: items.length, page: 1, perPage: 100, hasMore: false };
      }
      case "bricks/get-template-settings": {
        const template = this.templates.get(params.templateId as number);
        if (!template) throw new Error("Template not found.");
        if (this.conditionEditBeforeWrite) template.settings = { templateConditions: [{ id: "zzz999", main: "frontpage" }] };
        return { settings: structuredClone(template.settings), templateId: params.templateId };
      }
      case "bricks/set-template-conditions": {
        const template = this.templates.get(params.templateId as number)!;
        const conditions = (params.conditions as Array<Record<string, unknown>>).map((c, i) => ({ id: `row${String(i).padStart(3, "0")}`, ...c }));
        template.settings = { ...(Array.isArray(template.settings) ? {} : template.settings), templateConditions: conditions };
        this.writes++;
        return { templateId: params.templateId, conditions, conditionCount: conditions.length };
      }
      case "bricks/create-template": {
        const templateId = this.nextTemplate++;
        this.templates.set(templateId, { title: params.title as string, type: params.type as string, status: (params.status as string) ?? "draft", settings: [], elements: structuredClone(params.elements as unknown[]) ?? [] });
        this.writes++;
        return { templateId, editUrl: `https://example.com/?p=${templateId}&bricks=run`, status: (params.status as string) ?? "draft" };
      }
      case "bricks/render-elements": {
        const elements = (params.elements as BricksElement[] | undefined) ?? this.elements;
        return { html: elements.map(el => `<div id="brxe-${el.id}">${el.label ?? el.name}</div>`).join(""), css: elements.map(el => `#brxe-${el.id}{margin:0}`).join("") };
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
    createClasses: (template: unknown) =>
      handleWordPressRequest({ action: "classes", credentials: creds, template, confirm: true }, signal) as Promise<WordPressClassesResult>,
    request: <T>(body: Record<string, unknown>) => handleWordPressRequest(wpRequestSchema.parse({ credentials: creds, ...body }), signal) as Promise<T>,
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
    await expect(apply(proposal, site.digest())).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/do not exist on the site: fresh\. Create the missing global classes/) });
    expect(site.writes).toBe(0);
  });

  it("creates missing classes in one guarded batch, then applies", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    // Enough site classes to need two pages of the listing.
    site.classes.push(...Array.from({ length: 120 }, (_, i) => ({ id: `s${String(i).padStart(5, "0")}`, name: `site-${i}`, settings: {} })));
    const { apply, createClasses } = await connectTo(site);
    const card = { id: "new001", name: "card", settings: { _padding: { top: "2rem" } }, selectors: [{ id: "sel001", selector: "&:hover", settings: { _opacity: "0.9" } }], category: "cat-from-other-site", modified: 1 };
    const btn = { id: "new002", name: "btn", settings: { _padding: { top: "1rem" } } };
    const proposal = { content: section("feat01", "Features", { _cssGlobalClasses: ["cls001", "new001", "new002"] }), globalClasses: [card, btn] };

    const result = await createClasses(proposal);
    expect(result.created).toEqual([{ id: "new001", name: "card" }]);
    expect(result.reused).toEqual([{ id: "new002", siteId: "cls001", name: "btn" }]);
    expect(site.classWrites).toBe(1);
    // Created with its ID, without the foreign category or bookkeeping fields.
    expect(site.classes.find(c => c.id === "new001")).toEqual({ id: "new001", name: "card", settings: card.settings });
    expect(result.template.content[0].settings._cssGlobalClasses).toEqual(["cls001", "new001"]);
    expect(result.template.globalClasses.map(c => c.id).sort()).toEqual(["cls001", "new001"]);

    const applied = await apply(result.template, site.digest());
    expect(applied.applied).toBe(true);
    // Nothing left to create.
    expect((await createClasses(result.template)).created).toEqual([]);
    expect(site.classWrites).toBe(1);
  });

  it("never overwrites a site class and reports conflicts and undefined references", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    const { createClasses } = await connectTo(site);
    const proposal = { content: section("feat01", "Features", { _cssGlobalClasses: ["new002", "zzz999"] }), globalClasses: [{ id: "new002", name: "btn", settings: { _padding: { top: "3rem" } } }] };
    const result = await createClasses(proposal);
    expect(result).toMatchObject({ created: [], reused: [], conflicts: [{ id: "new002", siteId: "cls001", name: "btn" }], undefinedIds: ["zzz999"] });
    expect(site.classWrites).toBe(0);
    expect(site.classes).toHaveLength(1);
  });

  it("refuses class creation when classes changed after the read, or when disabled", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.classEditBeforeWrite = true;
    const { createClasses } = await connectTo(site);
    const proposal = { content: section("feat01", "Features", { _cssGlobalClasses: ["new001"] }), globalClasses: [{ id: "new001", name: "card", settings: {} }] };
    await expect(createClasses(proposal)).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/nothing was saved/) });
    expect(site.classes.some(c => c.id === "new001")).toBe(false);

    site.classEditBeforeWrite = false;
    site.enabled.delete("bricks/batch-create-global-classes");
    await expect(createClasses(proposal)).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/batch-create-global-classes/) });
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

  it("renders the saved page and the proposal without saving", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    await connectTo(site);
    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest({ action: "render", credentials: creds, postId: 7, template: { content: [...section("hero01", "Hero"), ...section("feat01", "Features")] } }, new AbortController().signal) as { before: { html: string }; after: { html: string; css: string }; stylesheets: string[]; siteUrl: string };
    expect(result.before.html).not.toContain("Features");
    expect(result.after.html).toContain("Features");
    expect(result.after.css).toContain("#brxe-feat01");
    expect(result.stylesheets).toEqual(["https://example.com/wp-content/themes/bricks/assets/css/frontend-layer.min.css"]);
    expect(site.writes).toBe(0);
  });

  it("derives the site root from both endpoint forms", async () => {
    const { siteRoot } = await import("../src/lib/wordpress-client");
    expect(siteRoot("https://example.com/wp-json/mcp/mcp-adapter-default-server")).toBe("https://example.com/");
    expect(siteRoot("https://example.com/blog/wp-json/mcp/mcp-adapter-default-server/")).toBe("https://example.com/blog/");
    expect(siteRoot("https://example.com/?rest_route=/mcp/mcp-adapter-default-server")).toBe("https://example.com/");
  });

  it("requires explicit confirmation and a digest in the request", () => {
    const base = { action: "apply", credentials: creds, postId: 7, template: { content: [] }, expectedDocumentDigest: "a".repeat(64) };
    expect(() => wpRequestSchema.parse({ ...base, confirm: false })).toThrow();
    expect(() => wpRequestSchema.parse({ ...base, confirm: true, expectedDocumentDigest: "abc" })).toThrow();
    expect(wpRequestSchema.parse({ ...base, confirm: true })).toMatchObject({ action: "apply", allowLocked: false });
  });

  describe("site templates", () => {
    it("lists templates by type and reads their conditions", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      const { request } = await connectTo(site);
      expect((await request<WordPressTemplatesResult>({ action: "templates" })).templates.map(t => t.id)).toEqual([81, 90]);
      expect((await request<WordPressTemplatesResult>({ action: "templates", type: "header" })).templates).toEqual([{ id: 90, title: "Main header", type: "header", status: "publish", conditionCount: 1 }]);
      expect(await request<WordPressConditionsResult>({ action: "template-conditions", templateId: 90 })).toEqual({ templateId: 90, conditions: [{ main: "any" }], unsupported: [] });
      // PHP's empty settings array.
      expect(await request<WordPressConditionsResult>({ action: "template-conditions", templateId: 81 })).toEqual({ templateId: 81, conditions: [], unsupported: [] });
    });

    it("replaces conditions only while the stored ones are unchanged", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      const { request } = await connectTo(site);
      const conditions = [{ main: "postType", postType: ["page"] }, { main: "ids", ids: [114], exclude: true }];
      const saved = await request<WordPressConditionsResult>({ action: "set-conditions", templateId: 90, conditions, expectedConditions: [{ main: "any" }], confirm: true });
      expect(saved.conditions).toEqual(conditions);
      // Other template settings are untouched.
      expect(site.templates.get(90)!.settings).toMatchObject({ headerSticky: true });

      await expect(request({ action: "set-conditions", templateId: 90, conditions: [], expectedConditions: [{ main: "any" }], confirm: true })).rejects.toMatchObject({ status: 409 });
      site.conditionEditBeforeWrite = true;
      await expect(request({ action: "set-conditions", templateId: 90, conditions: [], expectedConditions: conditions, confirm: true })).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/changed since they were loaded/) });
      expect(site.writes).toBe(1);
    });

    it("keeps conditions with settings it cannot edit read-only", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      site.templates.get(90)!.settings = { templateConditions: [{ id: "c1", main: "any", userRole: ["editor"] }] };
      const { request } = await connectTo(site);
      expect(await request<WordPressConditionsResult>({ action: "template-conditions", templateId: 90 })).toMatchObject({ unsupported: ["userRole"] });
      await expect(request({ action: "set-conditions", templateId: 90, conditions: [], expectedConditions: [], confirm: true })).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/userRole/) });
      expect(site.writes).toBe(0);
    });

    it("creates a draft template from a proposal, guarding classes and landmarks", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      const { request } = await connectTo(site);
      const header = { content: section("head01", "Header", { tag: "header" }) };
      const created = await request<WordPressCreateTemplateResult>({ action: "create-template", title: "Main header", type: "header", template: header, confirm: true });
      expect(created).toMatchObject({ templateId: 200, status: "draft", editUrl: "https://example.com/?p=200&bricks=run" });
      expect(created.warnings[0]).toMatch(/<header> landmark.*Header/);
      expect(site.templates.get(200)).toMatchObject({ title: "Main header", type: "header", status: "draft" });
      expect(site.templates.get(200)!.elements).toHaveLength(2);

      const withClass = { content: section("feat01", "Features", { _cssGlobalClasses: ["new999"] }), globalClasses: [{ id: "new999", name: "fresh", settings: {} }] };
      await expect(request({ action: "create-template", title: "X", type: "section", template: withClass, confirm: true })).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/fresh/) });
      site.enabled.delete("bricks/create-template");
      await expect(request({ action: "create-template", title: "X", type: "section", template: header, confirm: true })).rejects.toMatchObject({ status: 403 });
      expect(site.templates.size).toBe(3);
      // Publishing is explicit; unknown types and missing confirmation are rejected.
      expect(() => wpRequestSchema.parse({ action: "create-template", credentials: creds, title: "X", type: "banner", template: header, confirm: true })).toThrow();
      expect(() => wpRequestSchema.parse({ action: "create-template", credentials: creds, title: "X", type: "header", template: header })).toThrow();
    });
  });
});
