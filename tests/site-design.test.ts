import { describe, expect, it } from "vitest";
import type { BricksElement } from "../src/lib/bricks-engine";
import { generateInSiteDesign, inheritSiteFonts, linkSiteColors, normalizeHex, pageDesign, siteColors, suggestRoles, type SitePalette } from "../src/lib/site-design";
import { generateMcpPage } from "../src/lib/mcp-generation";

// Bricks' default palette as list-color-palettes returns it (ids shortened).
const bricksDefault: SitePalette = {
  id: "b4c022", name: "Default",
  colors: [
    ["g100", "grey-100", "#f5f5f5"], ["g300", "grey-300", "#e0e0e0"], ["g500", "grey-500", "#9e9e9e"], ["g700", "grey-700", "#616161"],
    ["g900", "grey-900", "#212121"], ["lblue", "light-blue", "#03a9f4"], ["blue", "blue", "#2196f3"], ["indigo", "indigo", "#3f51b5"],
    ["green", "light-green", "#8bc34a"], ["lime", "lime", "#cddc39"],
  ].map(([id, name, light]) => ({ id, raw: `var(--bricks-color-${name})`, light })),
};
const brand: SitePalette = {
  id: "brand", name: "Brand",
  colors: [
    { id: "c1", raw: "var(--brand-primary)", light: "#0B5FFF" },
    { id: "c2", raw: "var(--brand-accent)", light: "#f59e0b" },
    { id: "c3", raw: "var(--text-body)", light: "#1f2937" },
    { id: "c4", raw: "var(--bg-base)", light: "#FFF" },
    { id: "c5", light: "rgba(0,0,0,.5)" },
  ],
};

describe("site colors and role suggestions", () => {
  it("normalizes hex values and skips colors without one", () => {
    expect(normalizeHex("#FFF")).toBe("#ffffff");
    expect(normalizeHex(" #0B5FFF ")).toBe("#0b5fff");
    expect(normalizeHex("#0b5fff80")).toBeNull();
    expect(normalizeHex("rgba(0,0,0,.5)")).toBeNull();
    const colors = siteColors([brand]);
    expect(colors.map(c => c.id)).toEqual(["c1", "c2", "c3", "c4"]);
    expect(colors[0]).toMatchObject({ label: "brand-primary", hex: "#0b5fff", palette: "Brand", isDefault: false });
    expect(siteColors([bricksDefault])[0]).toMatchObject({ label: "grey-100", isDefault: true });
  });

  it("maps Bricks' default palette by lightness and saturation", () => {
    const colors = siteColors([bricksDefault]);
    const mapping = suggestRoles(colors);
    const hex = (role: keyof typeof mapping) => colors.find(c => c.id === mapping[role])?.hex;
    expect(hex("background")).toBe("#f5f5f5");
    expect(hex("heading")).toBe("#212121");
    expect(hex("border")).toBe("#e0e0e0");
    expect(hex("muted")).toMatch(/^#(9e9e9e|616161)$/);
    expect(mapping.primary).toBeDefined();
    // Secondary and accent differ in hue from the primary color.
    expect(new Set([mapping.primary, mapping.secondary, mapping.accent]).size).toBe(3);
    // The light-blue default color is not treated as a background.
    expect(hex("background")).not.toBe("#03a9f4");
  });

  it("prefers named site colors over Bricks' default palette", () => {
    const colors = siteColors([bricksDefault, brand]);
    const mapping = suggestRoles(colors);
    expect(mapping).toMatchObject({ primary: "c1", accent: "c2", text: "c3", background: "c4" });
    expect(Object.values(mapping).filter(id => id === "c1")).toHaveLength(1);
  });
});

const el = (id: string, settings: Record<string, unknown>): BricksElement => ({ id, name: "section", parent: 0, children: [], settings });

describe("palette links and site fonts", () => {
  it("links exact palette colors to CSS variables with the hex as fallback", () => {
    const colors = siteColors([brand]);
    const mapping = { primary: "c1", background: "c4" };
    const { content } = linkSiteColors({ content: [el("a", {
      _background: { color: { hex: "#0b5fff" } },
      _typography: { color: { hex: "#FFFFFF" }, "font-size": "18px" },
      _gradient: { colors: [{ color: { hex: "#0b5fff" }, stop: "0" }, { color: { hex: "#123456" }, stop: "100" }] },
      _border: { color: { hex: "#0b5fff", rgb: "rgba(11,95,255,.5)" } },
    })] }, mapping, colors);
    expect(content[0].settings).toEqual({
      _background: { color: { raw: "var(--brand-primary, #0b5fff)" } },
      _typography: { color: { raw: "var(--bg-base, #ffffff)" }, "font-size": "18px" },
      _gradient: { colors: [{ color: { raw: "var(--brand-primary, #0b5fff)" }, stop: "0" }, { color: { hex: "#123456" }, stop: "100" }] },
      // Colors with alpha keep their literal value.
      _border: { color: { hex: "#0b5fff", rgb: "rgba(11,95,255,.5)" } },
    });
  });

  it("removes font families from typography controls and custom CSS", () => {
    const { content } = inheritSiteFonts({ content: [
      el("a", { _typography: { "font-family": "Inter", fallback: "sans-serif", "font-weight": "700" }, "_typography:mobile_portrait": { "font-family": "Inter" } }),
      el("b", { _cssCustom: "#brxe-b { font-family: 'Inter', sans-serif; }\n@media (max-width: 767px) { #brxe-b { font-family: Inter; } }\n#brxe-b:hover { color: red; font-family: Inter }" }),
    ] });
    expect(content[0].settings).toEqual({ _typography: { "font-weight": "700" } });
    expect(content[1].settings._cssCustom).toBe("#brxe-b:hover { color: red; }");
  });
});

describe("design of a loaded page", () => {
  it("ranks the page's solid colors and fonts by use", () => {
    const design = pageDesign({ content: [
      el("a", { _background: { color: { hex: "#F5F7F3" } }, _typography: { color: { hex: "#14291f" }, "font-family": "Segoe UI" } }),
      el("e", { _typography: { "font-family": "Segoe UI", fallback: "Arial, sans-serif" } }),
      el("b", { _typography: { color: { hex: "#14291f" } }, _border: { color: { hex: "#d6dfd5" } }, _gradient: { colors: [{ color: { hex: "#14291f" } }] } }),
      el("c", { _cssCustom: "#brxe-c { font-family: Segoe UI, Arial, sans-serif; color: #56645b; border: 1px solid #d6dfd5; }\n#brxe-c .x { background: #abc; font-family: 'Georgia', serif }\n#fade { opacity: .5 }" }),
      el("d", { _typography: { color: { hex: "#11223380" } }, text: "#123456 in text is ignored" }),
    ] }, "Colors on Home");
    expect(design.palette?.name).toBe("Colors on Home");
    expect(design.palette?.colors.map(c => [c.light, c.uses])).toEqual([["#14291f", 3], ["#d6dfd5", 2], ["#56645b", 1], ["#aabbcc", 1], ["#f5f7f3", 1]]);
    expect(design.fonts).toEqual(["Segoe UI, Arial, sans-serif", "'Georgia', serif"]);
    expect(pageDesign({ content: [el("a", {})] }, "x")).toEqual({ palette: null, fonts: [] });
  });

  it("suggests roles from a page's colors, tinted text included", () => {
    const { palette } = pageDesign({ content: [
      ...Array.from({ length: 7 }, (_, i) => el(`h${i}`, { _typography: { color: { hex: "#14291f" } } })),
      ...Array.from({ length: 3 }, (_, i) => el(`t${i}`, { _typography: { color: { hex: "#56645b" } }, _border: { color: { hex: "#d6dfd5" } } })),
      el("bg", { _background: { color: { hex: "#f5f7f3" } } }), el("blue", { _background: { color: { hex: "#244d85" } } }),
    ] }, "Colors on Home");
    const colors = siteColors([bricksDefault, palette!]);
    const hex = (id?: string) => colors.find(c => c.id === id)?.hex;
    const mapping = suggestRoles(colors);
    expect({ background: hex(mapping.background), heading: hex(mapping.heading), text: hex(mapping.text), border: hex(mapping.border), primary: hex(mapping.primary) })
      .toEqual({ background: "#f5f7f3", heading: "#14291f", text: "#56645b", border: "#d6dfd5", primary: "#244d85" });
  });
});

describe("generating in the site's design", () => {
  const colors = siteColors([bricksDefault, brand]);
  const mapping = suggestRoles(colors);

  it("builds a valid section in the site's palette without its own fonts", () => {
    const { template, warnings } = generateInSiteDesign({ prompt: "vehicle registration service", sections: ["hero", "features"], mapping, colors, linkPalette: true, font: "inherit" });
    expect(template.content.filter(e => e.parent === 0)).toHaveLength(2);
    const json = JSON.stringify(template.content);
    expect(json).toContain("var(--brand-primary, #0b5fff)");
    expect(json).not.toMatch(/font-family/);
    expect(warnings[0]).toMatch(/sample copy/);
  });

  it("keeps literal colors and fonts when linking is off", () => {
    const { template } = generateInSiteDesign({ prompt: "studio", sections: ["hero"], mapping, colors, linkPalette: false, font: "default" });
    const json = JSON.stringify(template.content).toLowerCase();
    expect(json).toContain("#0b5fff");
    expect(json).not.toContain("var(--brand-primary");
    expect(json).toContain("inter");
  });

  it("sets a chosen font stack and rejects CSS injection", () => {
    const { template } = generateInSiteDesign({ prompt: "studio", sections: ["hero"], mapping, colors, linkPalette: true, font: { family: "'Segoe UI', Arial, sans-serif" } });
    // Bricks' font control holds one family; the rest of the stack is its native fallback.
    const typography = template.content.flatMap(e => Object.entries(e.settings).filter(([key]) => key.startsWith("_typography")).map(([, value]) => value as Record<string, unknown>));
    expect(new Set(typography.map(t => `${t["font-family"]} | ${t.fallback}`))).toEqual(new Set(["Segoe UI | Arial, sans-serif"]));
    expect(JSON.stringify(template.content)).not.toMatch(/Inter|font-family:/);
    expect(() => generateInSiteDesign({ prompt: "x", sections: ["hero"], mapping, colors, linkPalette: false, font: { family: "Arial; } body { display:none" } })).toThrow(/font stack/);
  });

  it("lets MCP clients pass role colors that override a catalog palette", () => {
    const page = generateMcpPage({ prompt: "studio", sections: ["hero"], colors: { primary: "#0b5fff" } });
    expect(JSON.stringify(page.template.content).toLowerCase()).toContain("#0b5fff");
  });
});
