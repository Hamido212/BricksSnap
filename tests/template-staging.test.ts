import { describe, expect, it } from "vitest";
import { diffTemplates, mergeTemplates, readStagingTemplate, siteClassWarnings } from "../src/lib/template-staging";
import { type BricksElement, wrapTemplate } from "../src/lib/bricks-engine";
import { TEMPLATES } from "../src/lib/templates";
import { generateMcpPage } from "../src/lib/mcp-generation";

const el = (id: string, parent: string | 0 = 0, children: string[] = [], settings = {}): BricksElement => ({ id, parent, children, name: "section", settings });
const base = () => wrapTemplate([el("aaaaaa", 0, ["bbbbbb"]), el("bbbbbb", "aaaaaa"), el("cccccc")]);

describe("strict staging", () => {
  it("preserves all existing elements and metadata without mutating inputs", () => {
    const before = { ...base(), pageSettings: { test: "keep" } };
    const addition = wrapTemplate([el("dddddd")]);
    const snapshot = structuredClone(before);
    const result = mergeTemplates(before, addition, { mode: "after", afterId: "aaaaaa" });
    expect(result.template.content.map(e => e.id)).toEqual(["aaaaaa", "bbbbbb", "dddddd", "cccccc"]);
    expect(result.template.content.filter(e => e.id !== "dddddd")).toEqual(snapshot.content);
    expect(result.template.pageSettings).toEqual(snapshot.pageSettings);
    expect(before).toEqual(snapshot);
    expect(result.diff.counts).toEqual({ added: 1, removed: 0, changed: 0, moved: 0, unchanged: 3 });
  });
  it.each(["append", "prepend"] as const)("supports %s and an empty baseline", mode => {
    const merged = mergeTemplates(base(), [el("dddddd")], { mode });
    expect(merged.template.content[mode === "prepend" ? 0 : 3].id).toBe("dddddd");
    expect(mergeTemplates([], [el("dddddd")], { mode }).template.content).toHaveLength(1);
  });
  it("remaps colliding IDs including parent, children, CSS selectors and anchor links", () => {
    const addition = wrapTemplate([el("aaaaaa", 0, ["bbbbbb", "000001"], { _cssCustom: "#brxe-aaaaaa {color:red} #brxe-bbbbbb:hover {color:blue}" }), el("bbbbbb", "aaaaaa", [], { link: { type: "external", url: "#brxe-aaaaaa" } }), el("000001", "aaaaaa")]);
    const result = mergeTemplates(base(), addition, { mode: "append" });
    expect(result.remappedIds).toEqual({ aaaaaa: "000002", bbbbbb: "000003" });
    expect(result.template.content[3]).toMatchObject({ id: "000002", children: ["000003", "000001"], settings: { _cssCustom: "#brxe-000002 {color:red} #brxe-000003:hover {color:blue}" } });
    expect(result.template.content[4]).toMatchObject({ parent: "000002", settings: { link: { url: "#brxe-000002" } } });
    expect(result.template.content[5].parent).toBe("000002");
  });
  it("rejects ambiguous ID references instead of silently breaking interactions", () => {
    expect(() => mergeTemplates(base(), [el("aaaaaa", 0, [], { _interactions: [{ target: "aaaaaa" }] })], { mode: "append" })).toThrow(/ambiguous/);
  });
  it("deduplicates identical dependencies and rejects conflicting IDs and class names", () => {
    const globalClass = { id: "class1", name: "brand", settings: { color: "red" } };
    const before = { ...base(), globalClasses: [globalClass] };
    const incoming = { ...wrapTemplate([el("dddddd")]), globalClasses: [globalClass] };
    expect(mergeTemplates(before, incoming, { mode: "append" }).template.globalClasses).toEqual([globalClass]);
    expect(() => mergeTemplates(before, { ...incoming, globalClasses: [{ ...globalClass, settings: {} }] }, { mode: "append" })).toThrow(/Conflicting/);
    expect(() => mergeTemplates(before, { ...incoming, globalClasses: [{ ...globalClass, id: "class2" }] }, { mode: "append" })).toThrow(/name collision/);
  });
  it("rejects shared CSS IDs and conflicting page metadata", () => {
    expect(() => mergeTemplates([el("aaaaaa", 0, [], { _cssId: "hero" })], [el("bbbbbb", 0, [], { _cssId: "hero" })], { mode: "append" })).toThrow(/Duplicate CSS ID/);
    expect(() => mergeTemplates({ ...base(), pageSettings: { a: 1 } }, { ...wrapTemplate([el("dddddd")]), pageSettings: { a: 2 } }, { mode: "append" })).toThrow(/metadata/);
  });
  it("rejects malformed, cyclic, oversized and inconsistent baseline trees", () => {
    expect(() => readStagingTemplate([{ ...el("aaaaaa"), label: { unexpected: true } }])).toThrow(/label/);
    expect(() => readStagingTemplate([{ ...el("aaaaaa"), cid: {} }])).toThrow(/component/);
    for (const input of [undefined, {}, [el("bad")], [el("aaaaaa"), el("aaaaaa")], [el("aaaaaa", "bbbbbb")], [el("aaaaaa", 0, ["bbbbbb"])] ]) expect(() => readStagingTemplate(input)).toThrow();
    expect(() => readStagingTemplate([el("aaaaaa", "bbbbbb", ["bbbbbb"]), el("bbbbbb", "aaaaaa", ["aaaaaa"])])).toThrow(/cycle/);
    expect(() => readStagingTemplate([el("aaaaaa", 0, [], { text: "x".repeat(2_000_000) })])).toThrow(/2 MB/);
    expect(() => mergeTemplates(base(), [el("dddddd")], { mode: "after", afterId: "bbbbbb" })).toThrow(/top-level/);
  });
  it("reports removals, setting changes, reordered siblings and metadata changes", () => {
    expect(diffTemplates(base(), { ...base(), pageSettings: null }).metadata).toContain("pageSettings");
    const before = base();
    const after = { ...wrapTemplate([el("cccccc"), el("aaaaaa", 0, [], { tag: "main" })]), title: "New title" };
    const diff = diffTemplates(before, after);
    expect(diff.counts).toEqual({ added: 0, removed: 1, changed: 1, moved: 1, unchanged: 0 });
    expect(diff.metadata).toContain("title");
    expect(diff.elements.find(e => e.id === "aaaaaa")?.fields).toContain("position");
    const nested = wrapTemplate([el("aaaaaa", 0, ["bbbbbb", "cccccc"]), el("bbbbbb", "aaaaaa"), el("cccccc", "aaaaaa")]);
    const reordered = structuredClone(nested); reordered.content[0].children.reverse();
    expect(diffTemplates(nested, reordered).counts).toMatchObject({ changed: 1, moved: 2 });
  });
  it("enforces combined size and rejects conflicting component definitions", () => {
    const large = Array.from({ length: 800 }, (_, i) => el(i.toString(36).padStart(6, "0")));
    expect(() => mergeTemplates(large, large, { mode: "append" })).toThrow(/1500/);
    const before = { ...base(), components: [{ id: "component1", content: [] }] };
    const incoming = { ...wrapTemplate([el("dddddd")]), components: [{ id: "component1", content: [el("eeeeee")] }] };
    expect(() => mergeTemplates(before, incoming, { mode: "append" })).toThrow(/Conflicting components/);
    expect(() => mergeTemplates(base(), JSON.parse('{"content":[{"id":"dddddd","name":"section","parent":0,"children":[],"settings":{}}],"__proto__":{"changed":true}}'), { mode: "append" })).toThrow(/metadata/);
  });
  it("stages every built-in catalog template and the same template twice", () => {
    for (const entry of TEMPLATES) {
      const template = wrapTemplate(entry.generator());
      expect(() => readStagingTemplate(template), entry.id).not.toThrow();
      const merged = mergeTemplates(template, template, { mode: "append" });
      expect(merged.template.content.length, entry.id).toBe(template.content.length * 2);
      expect(merged.diff.counts.changed, entry.id).toBe(0);
    }
  });
  it("assembles ordered sections with shared tokens and rejects unknown presets", () => {
    const result = generateMcpPage({ prompt: "Studio", sections: ["hero", "features", "footer"], colorPalette: "ocean-blue" });
    expect(result.template.content.filter(e => e.parent === 0)).toHaveLength(3);
    expect(() => generateMcpPage({ prompt: "x", sections: ["nope"] })).toThrow(/section/);
    expect(() => generateMcpPage({ prompt: "x", sections: ["hero"], stylePreset: "nope" })).toThrow(/preset/);
  });
});

describe("site class checks", () => {
  const el = (id: string, classes: string[]): BricksElement => ({ id, name: "section", parent: 0, children: [], settings: { _cssGlobalClasses: classes } });
  const site = [{ id: "cls001", name: "btn", settings: { _padding: { top: "1rem" } } }, { id: "cls002", name: "card", settings: {} }];

  it("accepts classes identical to the site's definitions", () => {
    const template = { ...wrapTemplate([el("aaa001", ["cls001"])]), globalClasses: [site[0]] };
    expect(siteClassWarnings(template, site)).toEqual([]);
  });

  it("ignores how Bricks lays out a class's custom CSS", () => {
    const stored = [{ id: "cls003", name: "bs-x", settings: { _cssCustom: ".bs-x::before {\n  content: \"\";\n}\n.a>.bs-x {\n  color: red;\n}" } }];
    const template = { ...wrapTemplate([el("aaa001", ["cls003"])]), globalClasses: [{ id: "cls003", name: "bs-x", settings: { _cssCustom: ".bs-x::before { content: \"\"; }\n.a > .bs-x { color: red; }" } }] };
    expect(siteClassWarnings(template, stored)).toEqual([]);
  });

  it("reports a reused name under another ID, changed settings and undefined references", () => {
    const template = {
      ...wrapTemplate([el("aaa001", ["new001", "cls002", "ghost1"])]),
      globalClasses: [{ id: "new001", name: "btn", settings: {} }, { id: "cls002", name: "card", settings: { _gap: "2rem" } }],
    };
    expect(siteClassWarnings(template, site)).toEqual([
      "Global class name btn already exists on the site with ID cls001; importing would create a second class.",
      "Global class card already exists on the site with a different definition (for example from another BricksSnap design). The page will use the site's version; it is never overwritten.",
      "Global classes not defined in the template or on the site: ghost1.",
    ]);
  });

  it("reports a site class that uses a staged class's ID under another name", () => {
    const template = { ...wrapTemplate([el("aaa001", ["cls001"])]), globalClasses: [{ id: "cls001", name: "bs-title", settings: {} }] };
    expect(siteClassWarnings(template, site)).toEqual([
      "The site uses the ID cls001 of global class bs-title for another class (btn). \"Create missing global classes\" gives bs-title a new ID before saving.",
    ]);
  });
});
