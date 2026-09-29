import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { wpRequestSchema, type WordPressDesignSystemResult, type WordPressDesignSystemRevertResult, type WordPressDesignSystemUninstallResult, type WordPressApplyResult, type WordPressClassesResult, type WordPressConditionsResult, type WordPressCreateTemplateResult, type WordPressCredentials, type WordPressRestoreResult, type WordPressTemplatesResult } from "../src/lib/wordpress-contract";
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
  enabled = new Set(["bricks/set-page-elements", "bricks/restore-revision", "bricks/batch-create-global-classes", "bricks/create-template", "bricks/set-template-conditions",
    "bricks/create-color-palette", "bricks/create-color", "bricks/update-color", "bricks/set-global-variable-categories", "bricks/set-global-variables",
    "bricks/delete-color-palette", "bricks/delete-color", "bricks/delete-global-variable"]);
  /** Simulates a variable write that fails after the palette was saved. */
  failVariableWrite = false;
  palettes: Array<{ id: string; name: string; colors: Array<{ id: string; light: string; raw: string }> }> = [{ id: "449b69", name: "Default", colors: [{ id: "047244", light: "#f5f5f5", raw: "var(--bricks-color-grey-100)" }] }];
  variables: Array<{ id: string; name: string; value: string; category: string }> = [];
  categories: Array<{ id: string; name: string }> = [];
  designWrites = 0;
  /** Simulates another editor adding a color between BricksSnap's read and its write. */
  paletteEditBeforeWrite = false;
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
  /** Simulates the live host firewall that answered requests with external image URLs or email addresses with an HTML page. */
  firewall = false;

  constructor(elements: BricksElement[]) { this.elements = structuredClone(elements); }
  digest() { return createHash("sha256").update(stableJson(this.elements)).digest("hex"); }
  classOwnership() { return { resource: "globalClasses", siteId: 1, version: this.classVersion, resourceDigest: createHash("sha256").update(stableJson(this.classes)).digest("hex") }; }
  sha(value: unknown) { return createHash("sha256").update(stableJson(value)).digest("hex"); }
  // Like Bricks 2.4.2, palettes, variables and categories share one design version that every write bumps.
  designVersion = 6;
  own(resource: string, value: unknown) { return { resource, siteId: 1, version: this.designVersion, resourceDigest: this.sha(value) }; }
  checkOwnership(expected: unknown, resource: string, value: unknown) {
    const { itemDigest: _item, ...rest } = (expected ?? {}) as Record<string, unknown>; void _item;
    if (stableJson(rest) !== stableJson(this.own(resource, value))) throw new Error(`${resource} changed since they were read (bricks_conflict_ownership_mismatch).`);
  }
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
      case "bricks/list-color-palettes": {
        const ownership = this.own("colorPalettes", this.palettes);
        return { items: this.palettes.map(p => ({ ...p, paletteDigest: this.sha(p), colors: p.colors.map(c => ({ ...c, colorDigest: this.sha(c), itemOwnership: { ...ownership, itemDigest: this.sha(c) } })) })), total: this.palettes.length, page: 1, perPage: 200, hasMore: false, ownership };
      }
      case "bricks/create-color-palette": {
        if (this.paletteEditBeforeWrite) this.palettes[0].colors.push({ id: "zzz111", light: "#000000", raw: "var(--other)" });
        this.checkOwnership(params.expectedOwnership, "colorPalettes", this.palettes);
        const colors = (params.colors as Array<{ id: string; light: string; raw: string }>) ?? [];
        const used = new Set(this.palettes.flatMap(p => p.colors.map(c => c.raw)));
        if (colors.some(c => used.has(c.raw) || Object.keys(c).some(k => !["id", "light", "raw"].includes(k)))) throw new Error("Duplicate or invalid color variable.");
        this.palettes.push({ id: "pal777", name: params.name as string, colors: structuredClone(colors) });
        this.designWrites++; this.designVersion++;
        return { palette: this.palettes.at(-1), ownership: this.own("colorPalettes", this.palettes), changed: true };
      }
      case "bricks/create-color": {
        this.checkOwnership(params.expectedOwnership, "colorPalettes", this.palettes);
        const palette = this.palettes.find(p => p.id === params.paletteId)!;
        palette.colors.push({ id: `c${String(palette.colors.length).padStart(5, "0")}`, light: params.light as string, raw: params.raw as string });
        this.designWrites++; this.designVersion++;
        return { color: palette.colors.at(-1), ownership: this.own("colorPalettes", this.palettes), changed: true };
      }
      case "bricks/update-color": {
        this.checkOwnership(params.expectedOwnership, "colorPalettes", this.palettes);
        const color = this.palettes.flatMap(p => p.colors).find(c => c.id === params.colorId)!;
        if ((params.expectedOwnership as Record<string, unknown>).itemDigest !== this.sha(color)) throw new Error("Color digest mismatch.");
        color.light = params.light as string;
        this.designWrites++; this.designVersion++;
        return { color, ownership: this.own("colorPalettes", this.palettes), changed: true };
      }
      case "bricks/delete-color-palette": {
        this.checkOwnership(params.expectedOwnership, "colorPalettes", this.palettes);
        const palette = this.palettes.find(p => p.id === params.paletteId)!;
        if ((params.expectedOwnership as Record<string, unknown>).itemDigest !== this.sha(palette)) throw new Error("Palette digest mismatch.");
        if (params.allowOrphans !== true) throw new Error("allowOrphans must be true.");
        this.palettes = this.palettes.filter(p => p !== palette);
        this.designWrites++; this.designVersion++;
        return { deleted: true, ownership: this.own("colorPalettes", this.palettes) };
      }
      case "bricks/delete-color": {
        this.checkOwnership(params.expectedOwnership, "colorPalettes", this.palettes);
        const palette = this.palettes.find(p => p.colors.some(c => c.id === params.colorId))!;
        const color = palette.colors.find(c => c.id === params.colorId)!;
        if ((params.expectedOwnership as Record<string, unknown>).itemDigest !== this.sha(color)) throw new Error("Color digest mismatch.");
        if (params.allowOrphans !== true) throw new Error("allowOrphans must be true.");
        palette.colors = palette.colors.filter(c => c !== color);
        this.designWrites++; this.designVersion++;
        return { deleted: true, ownership: this.own("colorPalettes", this.palettes) };
      }
      case "bricks/delete-global-variable": {
        const row = this.variables.find(v => v.id === params.variableId)!;
        const expected = { ...this.own("globalVariables", this.variables), itemDigest: this.sha(row) };
        if (stableJson(params.expectedOwnership) !== stableJson(expected)) throw new Error("globalVariables changed since they were read (bricks_conflict_ownership_mismatch).");
        if (params.allowOrphans !== true) throw new Error("allowOrphans must be true.");
        this.variables = this.variables.filter(v => v !== row);
        this.designWrites++; this.designVersion++;
        return { deleted: true, variableId: row.id, beforeDelete: row, variableOwnership: this.own("globalVariables", this.variables), changed: true };
      }
      case "bricks/list-global-variables":
        return {
          items: this.variables.map(v => ({ ...v, itemOwnership: { ...this.own("globalVariables", this.variables), itemDigest: this.sha(v) } })), total: this.variables.length, page: 1, perPage: 200, hasMore: false,
          categories: this.categories.map(c => ({ ...c, itemOwnership: { ...this.own("globalVariableCategories", this.categories), itemDigest: this.sha(c) } })),
          variableOwnership: this.own("globalVariables", this.variables), categoryOwnership: this.own("globalVariableCategories", this.categories),
        };
      case "bricks/set-global-variable-categories": {
        this.checkOwnership(params.expectedOwnership, "globalVariableCategories", this.categories);
        this.checkOwnership(params.expectedVariableOwnership, "globalVariables", this.variables);
        this.categories = (params.categories as Array<{ id: string; name: string }>).map(c => ({ id: c.id, name: c.name }));
        this.designWrites++; this.designVersion++;
        return { categories: this.categories, categoryOwnership: this.own("globalVariableCategories", this.categories), changed: true };
      }
      case "bricks/set-global-variables": {
        if (this.failVariableWrite) throw new Error("Internal error while saving variables.");
        this.checkOwnership(params.expectedVariableOwnership, "globalVariables", this.variables);
        this.checkOwnership(params.expectedCategoryOwnership, "globalVariableCategories", this.categories);
        for (const row of params.variables as Array<{ id: string; name: string; value: string; category: string }>) {
          if (!this.categories.some(c => c.id === row.category)) throw new Error("Unknown variable category.");
          const index = this.variables.findIndex(v => v.id === row.id);
          if (index >= 0) this.variables[index] = { ...row }; else this.variables.push({ ...row });
        }
        this.designWrites++; this.designVersion++;
        return { variables: this.variables, categories: this.categories, variableOwnership: this.own("globalVariables", this.variables), changed: true };
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
    if (site.firewall && ["bricks/set-page-elements", "bricks/render-elements", "bricks/create-template"].includes(ability) && /https:\/\/images\.|@example\.com/.test(JSON.stringify(parameters))) {
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

  it("gives a staged class a new ID when the site uses its ID for another class, then applies", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    // A foreign class that happens to have the staged class's ID.
    site.classes.push({ id: "bsx123", name: "footer-grid", settings: { _gap: "4px" } });
    const { apply, createClasses } = await connectTo(site);
    const proposal = { content: section("feat01", "Features", { _cssGlobalClasses: ["bsx123"] }), globalClasses: [{ id: "bsx123", name: "bs-title", settings: { _margin: { top: "0" } } }] };

    // Saving first is refused instead of pointing the element at the foreign class.
    await expect(apply(proposal, site.digest())).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/uses the ID of bs-title \(bsx123\) for another class \(footer-grid\)/) });
    expect(site.writes).toBe(0);

    const result = await createClasses(proposal);
    expect(result.remapped).toHaveLength(1);
    const newId = result.remapped[0].newId;
    expect(result.remapped[0]).toMatchObject({ id: "bsx123", name: "bs-title", siteName: "footer-grid" });
    expect(newId).toMatch(/^[a-z0-9]{6}$/);
    expect(newId).not.toBe("bsx123");
    expect(result.created).toEqual([{ id: newId, name: "bs-title" }]);
    expect(site.classes.find(c => c.id === "bsx123")).toEqual({ id: "bsx123", name: "footer-grid", settings: { _gap: "4px" } });
    expect(result.template.content[0].settings._cssGlobalClasses).toEqual([newId]);
    expect(result.template.globalClasses.map(c => c.id)).toEqual([newId]);
    await expect(apply(result.template, site.digest())).resolves.toMatchObject({ applied: true });
  });

  it("reports a class the site defines differently under the same ID and name, and keeps it", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.classes.push({ id: "bst001", name: "bs-title", settings: { _typography: { "font-weight": "700" } } });
    const { createClasses } = await connectTo(site);
    const proposal = { content: section("feat01", "Features", { _cssGlobalClasses: ["bst001"] }), globalClasses: [{ id: "bst001", name: "bs-title", settings: { _typography: { "font-weight": "500" } } }] };
    const result = await createClasses(proposal);
    expect(result).toMatchObject({ created: [], remapped: [], mismatched: [{ id: "bst001", name: "bs-title" }] });
    expect(site.classWrites).toBe(0);
    expect(site.classes.find(c => c.id === "bst001")!.settings).toEqual({ _typography: { "font-weight": "700" } });
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
    await expect(apply(proposal, site.digest())).rejects.toMatchObject({ status: 502, message: expect.stringMatching(/external URLs \(https:\/\/images\.unsplash\.com\).*Import the images/) });
    expect(site.writes).toBe(0);
  });

  it("names email addresses when a host firewall blocks a render or template creation", async () => {
    const site = new FakeBricksSite(section("hero01", "Hero"));
    site.firewall = true;
    const { request } = await connectTo(site);
    const proposal = { content: section("cont01", "Contact", { text: "Write to hello@example.com" }) };
    await expect(request({ action: "render", postId: 7, template: proposal })).rejects.toMatchObject({ status: 502, message: expect.stringMatching(/email addresses \(hello@example\.com\).*allow requests to \/wp-json\/mcp\//) });
    await expect(request({ action: "create-template", title: "Contact", type: "section", template: proposal, confirm: true })).rejects.toMatchObject({ message: expect.stringMatching(/email addresses/) });
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

  describe("design system", () => {
    it("plans, installs and verifies the kit's palette and variables, then finds nothing to change", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      const { request } = await connectTo(site);
      const kit = { style: "warm", primary: "#0b5fff" };
      const plan = await request<WordPressDesignSystemResult>({ action: "design-system-plan", kit });
      expect(plan).toMatchObject({ installed: false, palette: { name: "BricksSnap", exists: false, create: 18, update: 0 }, category: { create: true }, conflicts: [] });
      expect(plan.variables.create).toBeGreaterThan(20);
      expect(plan.warnings.join(" ")).toMatch(/Bitter.*Custom fonts/);
      expect(site.designWrites).toBe(0);

      const installed = await request<WordPressDesignSystemResult>({ action: "design-system", kit, confirm: true });
      expect(installed).toMatchObject({ installed: true, verified: true });
      const palette = site.palettes.find(p => p.name === "BricksSnap")!;
      expect(palette.colors).toHaveLength(18);
      expect(palette.colors.find(c => c.raw === "var(--bs-primary)")?.light).toBe("#0b5fff");
      expect(site.categories).toEqual([{ id: expect.any(String), name: "BricksSnap" }]);
      expect(site.variables.find(v => v.name === "bs-font-heading")?.value).toMatch(/^"Bitter"/);
      expect(site.variables.every(v => v.category === site.categories[0].id)).toBe(true);

      const writes = site.designWrites;
      const again = await request<WordPressDesignSystemResult>({ action: "design-system", kit, confirm: true });
      expect(again).toMatchObject({ installed: false, palette: { exists: true, create: 0, update: 0, unchanged: 18 }, variables: { create: 0, update: 0 }, category: { create: false } });
      expect(site.designWrites).toBe(writes);
    });

    it("updates only what changed when the kit changes", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      const { request } = await connectTo(site);
      await request({ action: "design-system", kit: { style: "clean", primary: "#2563eb" }, confirm: true });
      const count = site.variables.length;
      const result = await request<WordPressDesignSystemResult>({ action: "design-system", kit: { style: "clean", primary: "#dc2626", spacing: "airy" }, confirm: true });
      expect(result).toMatchObject({ installed: true, verified: true, palette: { create: 0 }, variables: { create: 0 } });
      expect(result.palette.update).toBeGreaterThan(0);
      expect(result.changes.find(c => c.name === "--bs-primary")).toMatchObject({ action: "update", from: "#2563eb", to: "#dc2626" });
      expect(site.variables).toHaveLength(count);
      expect(site.palettes.find(p => p.name === "BricksSnap")!.colors.find(c => c.raw === "var(--bs-primary)")?.light).toBe("#dc2626");
    });

    it("leaves variables defined elsewhere alone and reports them", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      site.palettes[0].colors.push({ id: "own001", light: "#123456", raw: "var(--bs-primary)" });
      const { request } = await connectTo(site);
      const result = await request<WordPressDesignSystemResult>({ action: "design-system", kit: {}, confirm: true });
      expect(result).toMatchObject({ installed: true, verified: true, conflicts: ["--bs-primary"], palette: { create: 17 } });
      expect(result.warnings[0]).toMatch(/--bs-primary/);
      expect(site.palettes[0].colors.find(c => c.id === "own001")?.light).toBe("#123456");
    });

    it("refuses when palettes change during the install or writing is disabled", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      site.paletteEditBeforeWrite = true;
      const { request } = await connectTo(site);
      await expect(request({ action: "design-system", kit: {}, confirm: true })).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/changed during the install/) });
      expect(site.palettes.some(p => p.name === "BricksSnap")).toBe(false);
      site.paletteEditBeforeWrite = false;
      site.enabled.delete("bricks/create-color-palette");
      await expect(request({ action: "design-system", kit: {}, confirm: true })).rejects.toMatchObject({ status: 403 });
      expect(site.designWrites).toBe(0);
    });

    it("records a manifest with the design, kit and version, and rewrites it only when the install changes", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      const { request } = await connectTo(site);
      const kit = { style: "soft", primary: "#c8472d" };
      const plan = await request<WordPressDesignSystemResult>({ action: "design-system-plan", kit });
      expect(plan.manifest).toEqual({ current: null, write: true });
      const installed = await request<WordPressDesignSystemResult>({ action: "design-system", kit, label: "Lachfalte <script>", confirm: true });
      expect(installed).toMatchObject({ installed: true, verified: true, manifest: { current: { label: "Lachfalte script", style: "soft", primary: "#c8472d" } } });
      const row = site.variables.find(v => v.name === "bs-manifest")!;
      expect(row.category).toBe(site.categories[0].id);
      const manifest = JSON.parse(row.value.slice(1, -1));
      expect(manifest).toMatchObject({ v: 1, app: expect.stringMatching(/^\d+\.\d+\.\d+$/), label: "Lachfalte script", palette: site.palettes.find(p => p.name === "BricksSnap")!.id, category: site.categories[0].id });
      expect(manifest.colors).toContain("--bs-primary");
      expect(manifest.variables).toContain("bs-font-heading");

      const writes = site.designWrites;
      const again = await request<WordPressDesignSystemResult>({ action: "design-system", kit, label: "Lachfalte <script>", confirm: true });
      expect(again).toMatchObject({ installed: false, manifest: { write: false } });
      expect(site.designWrites).toBe(writes);
    });

    it("undoes an install: restores replaced values, removes what it added, keeps later edits", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      const { request } = await connectTo(site);
      await request({ action: "design-system", kit: { style: "clean", primary: "#2563eb" }, confirm: true });
      const before = structuredClone({ palettes: site.palettes, variables: site.variables });

      const second = await request<WordPressDesignSystemResult>({ action: "design-system", kit: { style: "clean", primary: "#dc2626", spacing: "airy" }, confirm: true });
      expect(second.snapshot!.colors.find(c => c.raw === "--bs-primary")).toEqual({ raw: "--bs-primary", prior: "#2563eb", installed: "#dc2626" });
      // Someone edits one variable in Bricks after the install.
      site.variables.find(v => v.name === "bs-space-section")!.value = "99px";

      const undo = await request<WordPressDesignSystemRevertResult>({ action: "design-system-undo", snapshot: second.snapshot, confirm: true });
      expect(undo).toMatchObject({ done: true, verified: true, palette: false, category: false, skipped: [{ name: "--bs-space-section", reason: "changed" }] });
      expect(site.palettes).toEqual(before.palettes);
      expect(site.variables.find(v => v.name === "bs-space-section")!.value).toBe("99px");
      expect(site.variables.filter(v => v.name !== "bs-space-section")).toEqual(before.variables.filter(v => v.name !== "bs-space-section"));
    });

    it("undoes a first install completely, and hands back a snapshot when a write fails halfway", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      site.failVariableWrite = true;
      const { request } = await connectTo(site);
      const initial = structuredClone({ palettes: site.palettes, variables: site.variables, categories: site.categories });
      const failed = await request<WordPressDesignSystemResult>({ action: "design-system", kit: {}, confirm: true });
      expect(failed).toMatchObject({ installed: false, failed: expect.stringMatching(/Internal error/) });
      // The palette and category were saved before the variable write failed.
      expect(site.palettes.some(p => p.name === "BricksSnap")).toBe(true);
      expect(site.categories).toHaveLength(1);

      const undo = await request<WordPressDesignSystemRevertResult>({ action: "design-system-undo", snapshot: failed.snapshot, confirm: true });
      expect(undo).toMatchObject({ done: true, verified: true, palette: true, category: true });
      expect({ palettes: site.palettes, variables: site.variables, categories: site.categories }).toEqual(initial);
    });

    it("uninstalls BricksSnap's palette, variables, manifest and category, keeping edited values unless asked", async () => {
      const site = new FakeBricksSite(section("hero01", "Hero"));
      site.classes.push({ id: "bst001", name: "bs-title", settings: {} });
      const { request } = await connectTo(site);
      await request({ action: "design-system", kit: { style: "warm", primary: "#0f766e" }, label: "Nord", confirm: true });
      const total = site.variables.length;
      site.variables.find(v => v.name === "bs-radius-m")!.value = "3px";
      site.palettes.find(p => p.name === "BricksSnap")!.colors.find(c => c.raw === "var(--bs-accent)")!.light = "#ff00ff";

      const preview = await request<WordPressDesignSystemUninstallResult>({ action: "design-system-uninstall-plan" });
      expect(preview).toMatchObject({ done: false, manifest: { label: "Nord", style: "warm" }, modified: ["--bs-accent", "--bs-radius-m"], classes: 1, palette: false, category: false });
      expect(preview.variables).toBe(total - 1);
      expect(site.designWrites).toBeGreaterThan(0);

      const kept = await request<WordPressDesignSystemUninstallResult>({ action: "design-system-uninstall", confirm: true });
      expect(kept).toMatchObject({ done: true, verified: true, palette: false, category: false });
      expect(site.variables.map(v => v.name)).toEqual(["bs-radius-m"]);
      expect(site.palettes.find(p => p.name === "BricksSnap")!.colors.map(c => c.raw)).toEqual(["var(--bs-accent)"]);

      const all = await request<WordPressDesignSystemUninstallResult>({ action: "design-system-uninstall", includeModified: true, confirm: true });
      expect(all).toMatchObject({ done: true, verified: true, palette: true, category: true });
      expect(site.palettes.map(p => p.name)).toEqual(["Default"]);
      expect(site.variables).toEqual([]);
      expect(site.categories).toEqual([]);
      // Global classes are kept: pages use them, and their var() fallbacks keep the look.
      expect(site.classes.some(c => c.name === "bs-title")).toBe(true);
    });

    it("requires confirmation and known kit choices", () => {
      expect(() => wpRequestSchema.parse({ action: "design-system", credentials: creds, kit: {} })).toThrow();
      expect(() => wpRequestSchema.parse({ action: "design-system-plan", credentials: creds, kit: { style: "neon" } })).toThrow();
      expect(() => wpRequestSchema.parse({ action: "design-system-plan", credentials: creds, kit: { primary: "#fff", css: "x" } })).toThrow();
    });
  });
});
