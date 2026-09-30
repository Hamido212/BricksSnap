import { describe, expect, it } from "vitest";
import { modernizeTemplate, parseColor, toPx } from "../src/lib/modernize";
import { validateBricksElements } from "../src/lib/bricks-validator";
import { readStagingTemplate } from "../src/lib/template-staging";
import type { BricksElement } from "../src/lib/bricks-engine";

// Own test templates in the style of common Bricks libraries (Automatic CSS variables, rem at 62.5%,
// button presets, utility classes, custom CSS); not taken from any library.
const card = (id: string, parent: string, children: string[], extra: Record<string, unknown> = {}) => ({
  id, name: "block", parent, children, label: "Card",
  settings: { _cssGlobalClasses: ["crd001"], _cssCustom: `#brxe-${id} .price { color: #ff5a1f; }`, ...extra },
});
const PRICING = {
  content: [
    { id: "sec001", name: "section", parent: 0, children: ["con001"], settings: { _cssGlobalClasses: ["utl001"], _background: { color: { hex: "#f8fafc" } } } },
    { id: "con001", name: "container", parent: "sec001", children: ["hdg001", "txt001", "grd001"], settings: {} },
    { id: "hdg001", name: "heading", parent: "con001", children: [], settings: { tag: "h2", text: "Pricing that scales", _typography: { "font-size": "4.8rem", color: { hex: "#0b1320" }, "font-family": "Poppins", "font-weight": "700" } } },
    { id: "txt001", name: "text-basic", parent: "con001", children: [], settings: { text: "Simple plans for every team.", _typography: { "font-size": "1.8rem", color: { hex: "#6b7280" } } } },
    { id: "grd001", name: "div", parent: "con001", children: ["crd101", "crd102", "crd103"], settings: { _display: "grid", _gridTemplateColumns: "repeat(3, 1fr)", _gridGap: "3.2rem", _width: "100%" } },
    card("crd101", "grd001", ["ttl101", "btn101"]),
    card("crd102", "grd001", ["ttl102", "btn102"]),
    card("crd103", "grd001", ["ttl103", "btn103"], { _background: { color: { hex: "#ff5a1f" } } }),
    { id: "ttl101", name: "heading", parent: "crd101", children: [], settings: { tag: "h3", text: "Starter", _typography: { "font-size": "24px", color: { hex: "#0b1320" } } } },
    { id: "ttl102", name: "heading", parent: "crd102", children: [], settings: { tag: "h3", text: "Team", _typography: { "font-size": "24px", color: { hex: "#0b1320" } } } },
    { id: "ttl103", name: "heading", parent: "crd103", children: [], settings: { tag: "h3", text: "Scale", _typography: { "font-size": "24px", color: { hex: "#ffffff" } } } },
    { id: "btn101", name: "button", parent: "crd101", children: [], settings: { text: "Choose", style: "primary", size: "md", link: { type: "external", url: "#" } } },
    { id: "btn102", name: "button", parent: "crd102", children: [], settings: { text: "Choose", style: "primary", size: "md", link: { type: "external", url: "#" } } },
    { id: "btn103", name: "button", parent: "crd103", children: [], settings: { text: "Talk to us", link: { type: "external", url: "#" }, _background: { color: { hex: "#ffffff" } }, _typography: { color: { hex: "#ff5a1f" } } } },
  ],
  globalClasses: [
    { id: "utl001", name: "pad--l", settings: {} },
    { id: "crd001", name: "pricing-card", settings: {
      _background: { color: { raw: "var(--white)" } }, _padding: { top: "32px", right: "32px", bottom: "32px", left: "32px" },
      _border: { width: { top: "1px", right: "1px", bottom: "1px", left: "1px" }, style: "solid", color: { hex: "#e5e7eb" }, radius: { top: "12px", right: "12px", bottom: "12px", left: "12px" } },
      _boxShadow: { values: { offsetX: "0", offsetY: "8px", blur: "24px", spread: "0" }, color: { rgb: "rgba(0, 0, 0, 0.08)" } },
      _rowGap: "var(--space-m)", _cssCustom: ".pricing-card:hover { transform: translateY(-4px); border-color: var(--primary); }",
    } },
  ],
};

const HERO: BricksElement[] = [
  { id: "hro001", name: "section", parent: 0, children: ["row001"], settings: { _background: { color: { hex: "#0f172a" } }, _padding: { top: "120px", bottom: "120px" } } },
  { id: "row001", name: "div", parent: "hro001", children: ["col001", "col002"], settings: { _display: "flex", _direction: "row", _columnGap: "var(--grid-gap)" } },
  { id: "col001", name: "block", parent: "row001", children: ["hh1001", "ht1001", "act001"], settings: {} },
  { id: "col002", name: "block", parent: "row001", children: ["img001"], settings: { _width: "560px" } },
  { id: "hh1001", name: "heading", parent: "col001", children: [], settings: { tag: "h1", text: "Launch faster", _typography: { "font-size": "clamp(4rem, 5vw, 6.4rem)", color: { hex: "#ffffff" } } } },
  { id: "ht1001", name: "text-basic", parent: "col001", children: [], settings: { text: "Everything you need.", _typography: { color: { rgb: "rgba(255, 255, 255, 0.7)" }, "font-size": "var(--text-l)" } } },
  { id: "act001", name: "div", parent: "col001", children: ["hb1001", "hb2001"], settings: { _display: "flex", _direction: "row", _columnGap: "12px" } },
  { id: "hb1001", name: "button", parent: "act001", children: [], settings: { text: "Start", link: { type: "external", url: "#" }, _background: { color: { raw: "var(--primary)" } }, _typography: { color: { hex: "#ffffff" } } } },
  { id: "hb2001", name: "button", parent: "act001", children: [], settings: { text: "Docs", outline: true, link: { type: "external", url: "#" } } },
  { id: "img001", name: "image", parent: "col002", children: [], settings: { image: { url: "https://example.com/hero.jpg" }, altText: "Dashboard", _border: { radius: { top: "20px", right: "20px", bottom: "20px", left: "20px" } } } },
];

const colorsOf = (settings: unknown): string[] => {
  const found: string[] = [];
  const walk = (value: unknown, key = "") => {
    if (Array.isArray(value)) value.forEach(v => walk(v, key));
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) {
      if ((k === "hex" || k === "rgb" || k === "raw") && typeof v === "string") found.push(v);
      else walk(v, k);
    }
  };
  walk(settings);
  return found;
};

describe("modernize: parsing", () => {
  it("reads hex, rgb(a), hsl and px/rem/clamp sizes", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("rgba(0, 0, 0, 0.08)")).toMatchObject({ r: 0, a: 0.08 });
    expect(parseColor("rgb(255 90 31 / 50%)")).toMatchObject({ r: 255, g: 90, b: 31, a: 0.5 });
    expect(parseColor("hsl(0, 100%, 50%)")).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(toPx("4.8rem")).toBe(48);
    expect(toPx("24px")).toBe(24);
    expect(toPx("clamp(4rem, 5vw, 6.4rem)")).toBe(64);
    expect(toPx("1.2em")).toBeNull();
  });
});

describe("modernize: pricing block", () => {
  const result = modernizeTemplate(PRICING, { kit: { style: "clean", primary: "#2563eb" } });
  const { template, report } = result;
  const el = (id: string) => template.content.find(e => e.id === id)!;
  const cls = (id: string) => template.globalClasses.find(c => c.id === (el(id).settings._cssGlobalClasses as string[])[0])!;

  it("produces valid Bricks JSON with one bs- class per styled element", () => {
    expect(validateBricksElements(template.content).valid).toBe(true);
    expect(() => readStagingTemplate(template)).not.toThrow();
    for (const e of template.content) {
      const refs = e.settings._cssGlobalClasses as string[] | undefined;
      expect(refs?.length ?? 0).toBeLessThanOrEqual(1);
      expect(Object.keys(e.settings).filter(k => k.startsWith("_") && !["_cssGlobalClasses", "_cssId"].includes(k))).toEqual([]);
    }
    expect(template.globalClasses.every(c => c.name.startsWith("bs-pricing-"))).toBe(true);
    expect(result.block).toBe("pricing");
  });

  it("maps every color to a design token", () => {
    const raws = template.globalClasses.flatMap(c => colorsOf(c.settings));
    expect(raws.length).toBeGreaterThan(5);
    for (const raw of raws) expect(raw).toMatch(/^(var\(--bs-|color-mix\(in srgb, var\(--bs-|transparent)/);
    expect(report.brand.primary).toBe("#ff5a1f");
    // The featured card takes the brand color; its white heading becomes on-primary.
    expect(JSON.stringify(cls("crd103").settings._background)).toContain("var(--bs-primary,");
    expect(JSON.stringify(cls("ttl103").settings._typography)).toContain("var(--bs-on-primary,");
    expect(JSON.stringify(cls("hdg001").settings._typography)).toContain("var(--bs-heading,");
    expect(JSON.stringify(cls("txt001").settings._typography)).toContain("var(--bs-muted,");
    expect(JSON.stringify(cls("sec001").settings._background)).toContain("var(--bs-surface-alt,");
    expect(JSON.stringify(cls("crd101").settings._boxShadow)).toContain("var(--bs-shadow-color,");
  });

  it("puts sizes, spacing and radii on the token scale and replaces fonts", () => {
    expect((cls("hdg001").settings._typography as Record<string, string>)["font-size"]).toMatch(/^var\(--bs-text-3xl,/);
    expect((cls("ttl101").settings._typography as Record<string, string>)["font-size"]).toMatch(/^var\(--bs-text-xl,/);
    expect(cls("grd001").settings._gridGap).toMatch(/^var\(--bs-space-l,/);
    expect((cls("crd101").settings._padding as Record<string, string>).top).toMatch(/^var\(--bs-space-l,/);
    expect(cls("crd101").settings._rowGap).toMatch(/^var\(--bs-space-m,/);
    expect(((cls("crd101").settings._border as Record<string, Record<string, string>>).radius).top).toMatch(/^var\(--bs-radius-/);
    expect(JSON.stringify(cls("hdg001").settings)).not.toContain("Poppins");
    expect(cls("hdg001").settings._cssCustom).toContain("var(--bs-font-heading,");
    expect(report.fontsReplaced).toEqual(["Poppins"]);
    expect(report.variables.mapped).toEqual(expect.arrayContaining(["--white", "--space-m", "--primary"]));
  });

  it("merges source classes, deduplicates identical styles and rewrites custom CSS", () => {
    expect(el("crd101").settings._cssGlobalClasses).toEqual(el("crd102").settings._cssGlobalClasses);
    expect(el("crd103").settings._cssGlobalClasses).not.toEqual(el("crd101").settings._cssGlobalClasses);
    const css = String(cls("crd101").settings._cssCustom);
    expect(css).toContain(`.${cls("crd101").name}:hover`);
    expect(css).toContain(`.${cls("crd101").name} .price { color: var(--bs-link,`);
    expect(css).toContain("border-color: var(--bs-primary-edge,");
    expect(css).not.toMatch(/#brxe-|\.pricing-card|#ff5a1f/);
    expect(report.classes.sourceMerged).toEqual(["pricing-card"]);
    expect(report.classes.sourceMissing).toEqual(["pad--l"]);
    expect(report.warnings.join(" ")).toMatch(/pad--l/);
  });

  it("turns button presets into brand buttons", () => {
    const button = cls("btn101").settings;
    expect(el("btn101").settings.style).toBeUndefined();
    expect(JSON.stringify(button._background)).toContain("var(--bs-primary,");
    expect(JSON.stringify(button._typography)).toContain("var(--bs-on-primary,");
    expect(JSON.stringify(button._border)).toContain("var(--bs-radius-btn,");
    expect(el("btn101").settings._cssGlobalClasses).toEqual(el("btn102").settings._cssGlobalClasses);
  });

  it("adds the missing mobile rules and section rhythm", () => {
    const grid = cls("grd001").settings;
    expect(grid["_gridTemplateColumns:tablet_portrait"]).toBe("repeat(2, minmax(0, 1fr))");
    expect(grid["_gridTemplateColumns:mobile_landscape"]).toBe("minmax(0, 1fr)");
    const padding = cls("sec001").settings._padding as Record<string, string>;
    expect(padding.top).toMatch(/^var\(--bs-space-section,/);
    expect(padding.left).toMatch(/^var\(--bs-gutter,/);
    expect(report.mobile.join(" ")).toMatch(/Grid.*1 column on phones/);
  });
});

describe("modernize: dark hero", () => {
  const { template, report } = modernizeTemplate(HERO, { kit: { style: "bold", primary: "#dc2626" }, block: "Hero Dark!" });
  const cls = (id: string) => template.globalClasses.find(c => c.id === (template.content.find(e => e.id === id)!.settings._cssGlobalClasses as string[])[0])!;

  it("reads the dark background as inverse and light text on it", () => {
    expect(template.globalClasses.every(c => c.name.startsWith("bs-hero-dark-"))).toBe(true);
    expect(JSON.stringify(cls("hro001").settings._background)).toContain("var(--bs-inverse,");
    expect(JSON.stringify(cls("hh1001").settings._typography)).toContain("var(--bs-on-inverse,");
    expect(JSON.stringify(cls("ht1001").settings._typography)).toMatch(/color-mix\(in srgb, var\(--bs-on-inverse,[^)]*\) 70%, transparent\)/);
    expect((cls("ht1001").settings._typography as Record<string, string>)["font-size"]).toMatch(/^var\(--bs-text-l,/);
    expect((cls("hh1001").settings._typography as Record<string, string>)["font-size"]).toMatch(/^var\(--bs-text-display,/);
    expect((cls("hro001").settings._padding as Record<string, string>).top).toMatch(/^var\(--bs-space-section,/);
  });

  it("stacks the row, frees the fixed width and wraps the buttons on phones", () => {
    expect(cls("row001").settings["_direction:mobile_landscape"]).toBe("column");
    expect(cls("col002").settings._width).toBe("100%");
    expect(cls("col002").settings._widthMax).toBe("560px");
    expect(cls("act001").settings["_direction:mobile_portrait"]).toBe("column");
    expect(JSON.stringify(cls("hb1001").settings._background)).toContain("var(--bs-primary,");
    expect(JSON.stringify(cls("hb1001").settings._typography)).toContain("var(--bs-on-primary,");
    // The outline button on a dark band gets a light outline and text.
    expect(JSON.stringify(cls("hb2001").settings._border)).toContain("var(--bs-inverse-muted,");
    expect(JSON.stringify(cls("hb2001").settings._typography)).toContain("var(--bs-on-inverse,");
    expect(report.mobile.length).toBeGreaterThanOrEqual(3);
    expect(report.warnings.join(" ")).toMatch(/1 images keep their source URLs/);
  });

  it("rejects input without Bricks elements", () => {
    expect(() => modernizeTemplate({ foo: 1 })).toThrow(/Paste Bricks JSON/);
    expect(() => modernizeTemplate([])).toThrow();
  });
});
