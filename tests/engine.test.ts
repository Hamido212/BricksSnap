import { describe, expect, it } from "vitest";
import { TEMPLATES } from "../src/lib/templates";
import { SECTION_TYPES } from "../src/lib/presets";
import { generateBuiltin } from "../src/lib/builtin-generator";
import { validateBricksElements } from "../src/lib/bricks-validator";
import { wrapTemplate, type BricksElement } from "../src/lib/bricks-engine";
import { buildBricksImportJson } from "../src/lib/bricks-export";
import { importTemplate } from "../src/lib/template-import";
import { syntaxHighlight } from "../src/lib/json-highlight";
import { normalizeSettings } from "../src/lib/bricks-settings";

function assertTree(elements: BricksElement[]) {
  expect(elements.length).toBeGreaterThan(0);
  const ids = new Set(elements.map(e => e.id));
  expect(ids.size).toBe(elements.length);
  for (const el of elements) {
    expect(el.id).toMatch(/^[a-z0-9]{6}$/);
    if (el.parent !== 0) expect(elements.find(e => e.id === el.parent)?.children).toContain(el.id);
    for (const id of el.children) expect(elements.find(e => e.id === id)?.parent).toBe(el.id);
    const seen = new Set([el.id]);
    let parent = el.parent;
    while (parent !== 0) {
      expect(seen.has(parent)).toBe(false); seen.add(parent);
      parent = elements.find(e => e.id === parent)!.parent;
    }
  }
}
describe("built-in engine", () => {
  for (const template of TEMPLATES) it(`exports ${template.id}`, () => {
    const elements = template.generator(); assertTree(elements);
    const result = validateBricksElements(elements);
    expect(result.valid, result.violations.join("\n")).toBe(true);
    expect(result.violations).toEqual([]);
    for (const el of elements.filter(e => e.settings._display === "grid")) expect(el.settings["_gridTemplateColumns:mobile_landscape"]).toBe("1fr");
  });
  it("generates every supported section in requested order", () => {
    const elements = generateBuiltin("Test", SECTION_TYPES.map(s => s.id)); assertTree(elements);
    expect(elements.filter(e => e.parent === 0)).toHaveLength(SECTION_TYPES.length);
  });
});
const element = (id: string, parent: string | 0 = 0, children: string[] = []): BricksElement => ({ id, name: "div", parent, children, settings: {} });
describe("validation and round trips", () => {
  it("migrates gradients and alpha colors without losing responsive backgrounds", () => {
    const migrated = normalizeSettings("div", { "_background:hover": { color: { hex: "transparent" }, gradient: { type: "linear", angle: "135", colors: [{ color: { hex: "#11223380" }, position: "0" }] } } });
    expect(migrated.settings["_background:hover"]).toEqual({ color: { raw: "transparent" } });
    expect(migrated.settings["_gradient:hover"]).toEqual({ applyTo: "background", type: "linear", angle: "135", stops: [{ color: { raw: "#11223380" }, position: "0" }] });
    expect(normalizeSettings("div", migrated.settings).changes).toEqual([]);
  });
  it("rejects malformed dependencies with a useful error", () => {
    expect(() => importTemplate({ content: [element("abc123")], globalClasses: [null] })).toThrow("Each global class");
  });
  it("remaps malformed and uppercase IDs without detaching children", () => {
    const result = validateBricksElements([element("ROOT"), element("ABC123", "ROOT"), element("child1", "ABC123")]);
    expect(result.valid).toBe(true); assertTree(result.elements);
    expect(result.elements[1].parent).toBe(result.elements[0].id);
    expect(result.elements[2].parent).toBe("abc123");
  });
  it("preserves explicit child order", () => {
    const result = validateBricksElements([element("root01", 0, ["child2", "child1"]), element("child1", "root01"), element("child2", "root01")]);
    expect(result.elements[0].children).toEqual(["child2", "child1"]);
  });
  it("rejects ambiguous duplicate IDs and unsupported elements", () => {
    expect(validateBricksElements([element("sameid"), element("sameid")]).valid).toBe(false);
    expect(validateBricksElements([{ ...element("root01"), name: "invented" }]).valid).toBe(false);
  });
  it("breaks cycles and reports the repair", () => {
    const result = validateBricksElements([element("aaaaaa", "bbbbbb"), element("bbbbbb", "aaaaaa")]);
    assertTree(result.elements); expect(result.violations.join()).toContain("cycle");
  });
  it("preserves component metadata, global classes and responsive settings on download", () => {
    const content = [{ ...element("root01"), cid: "comp01", properties: { title: "Hello" }, settings: { "_typography:mobile_landscape": { "font-size": "20px" }, _cssGlobalClasses: ["class1"] } }];
    const template = { ...wrapTemplate(content, [{ id: "class1", name: "card", settings: { _display: "flex" } }]), components: [{ id: "comp01", elements: [] }] };
    const result = importTemplate(buildBricksImportJson(template, "Round Trip", "content"));
    expect(result.template.content).toEqual(content); expect(result.template.globalClasses).toEqual(template.globalClasses);
    expect(result.template.components).toEqual(template.components); expect(result.template.type).toBe("content");
  });
  it("accepts standalone native text links", () => expect(validateBricksElements([{ ...element("link01"), name: "text-link" }]).valid).toBe(true));
  it("renders HTML in JSON as text, never as executable markup", () => {
    const highlighted = syntaxHighlight(JSON.stringify({ text: '<img src=x onerror="alert(1)"><script>alert(1)</script>&lt;' }));
    expect(highlighted).not.toContain("<img"); expect(highlighted).not.toContain("<script");
    expect(highlighted).toContain("&lt;img"); expect(highlighted).toContain("&amp;lt;");
  });
});
