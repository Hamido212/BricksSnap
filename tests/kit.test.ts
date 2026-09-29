import { describe, expect, it } from "vitest";
import { classId } from "../src/lib/kit/build";
import { contentFor, INDUSTRY_IDS } from "../src/lib/kit/content";
import { designSystemFor, generateKitTemplate } from "../src/lib/kit/generate";
import { renderPreview, settingsProperties } from "../src/lib/kit/preview";
import { classLibrary, SECTION_TYPES, variantsFor } from "../src/lib/kit/sections";
import { contrast } from "../src/lib/kit/color";
import { contrastChecks, normalizeKit, resolveKit, STYLE_IDS } from "../src/lib/kit/tokens";
import { validateBricksElements } from "../src/lib/bricks-validator";
import { readStagingTemplate } from "../src/lib/template-staging";
import { insertSection, kitPreview, SECTION_LABELS, STARTER_PAGES } from "../src/lib/kit/studio";
import { kitCatalog, kitTemplateType } from "../src/lib/kit/generate";

const LAYOUTS = SECTION_TYPES.flatMap(type => variantsFor(type).map(v => ({ type, variant: v.id })));

describe("brand kit tokens", () => {
  it("normalizes foreign input to a valid kit", () => {
    expect(normalizeKit({ style: "nope" as never, primary: "red", fonts: "comic" as never, mode: "dim" as never })).toEqual({ style: "clean", primary: "#2563eb", fonts: "inter", radius: "medium", spacing: "normal", mode: "light" });
    expect(normalizeKit({ style: "warm", primary: "#ABC" }).primary).toBe("#aabbcc");
  });

  it("passes every contrast check for all styles, both modes and difficult brand colors", () => {
    for (const style of STYLE_IDS) for (const mode of ["light", "dark"] as const) for (const primary of ["#2563eb", "#facc15", "#22c55e", "#0f172a", "#f5f5f4", "#e11d48"]) {
      const failing = contrastChecks(resolveKit({ style, mode, primary })).filter(c => !c.ok);
      expect(failing, `${style} ${mode} ${primary}`).toEqual([]);
    }
  });

  it("picks readable text on light brand colors", () => {
    const r = resolveKit({ primary: "#facc15" });
    expect(r.colors["on-primary"]).not.toBe("#ffffff");
    expect(contrast(r.colors.link, r.colors.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("describes the design system as a Bricks palette, variables and CSS", () => {
    const ds = designSystemFor(resolveKit({ style: "editorial", primary: "#1f4d3a" }));
    expect(ds.palette.colors.find(c => c.name === "bs-primary")).toMatchObject({ raw: "var(--bs-primary)", light: "#1f4d3a" });
    expect(ds.variables.find(v => v.name === "bs-font-heading")?.value).toMatch(/^"Fraunces", Georgia/);
    expect(ds.css).toMatch(/--bs-primary: #1f4d3a;/);
    expect(ds.fonts).toEqual(["Fraunces", "Inter"]);
    // No rem: Bricks sets html { font-size: 62.5% }.
    expect(ds.css).not.toMatch(/\drem/);
  });
});

describe("generated templates", () => {
  it("builds every layout as valid Bricks JSON in every style", () => {
    for (const style of STYLE_IDS) {
      for (let i = 0; i < LAYOUTS.length; i += 10) {
        const { template } = generateKitTemplate({ kit: { style }, profile: { industry: "kfz", language: "de" }, sections: LAYOUTS.slice(i, i + 10) });
        expect(validateBricksElements(template.content).valid).toBe(true);
        expect(() => readStagingTemplate(template)).not.toThrow();
        const ids = new Set(template.globalClasses.map(c => c.id));
        for (const el of template.content) for (const id of (el.settings._cssGlobalClasses as string[] | undefined) ?? []) expect(ids.has(id)).toBe(true);
      }
    }
  });

  it("never lets two classes on one element set the same CSS property", () => {
    for (const style of STYLE_IDS) {
      const pages = [0, 16, 32].map(start => generateKitTemplate({ kit: { style }, profile: { industry: "agentur", language: "en" }, sections: LAYOUTS.slice(start, start + 16) }).template);
      const classes = new Map(pages.flatMap(t => t.globalClasses).map(c => [c.id, c]));
      for (const el of pages.flatMap(t => t.content)) {
        const seen = new Map<string, string>();
        for (const id of (el.settings._cssGlobalClasses as string[] | undefined) ?? []) {
          const cls = classes.get(id)!;
          for (const prop of settingsProperties(cls.settings)) {
            expect(seen.get(prop), `${style}: ${cls.name} and ${seen.get(prop)} both set ${prop} on ${el.label ?? el.name}`).toBeUndefined();
            seen.set(prop, cls.name);
          }
        }
      }
    }
  });

  it("uses stable, unique class IDs", () => {
    const names = Object.keys(classLibrary(resolveKit({})));
    const ids = names.map(classId);
    expect(new Set(ids).size).toBe(names.length);
    expect(ids.every(id => /^[a-z0-9]{6}$/.test(id))).toBe(true);
    expect(classId("bs-btn")).toBe(classId("bs-btn"));
  });

  it("writes colors, sizes and radii as variables with fallbacks", () => {
    const { template } = generateKitTemplate({ kit: { style: "clean", primary: "#0055ff" }, profile: { industry: "business", language: "de" }, sections: [{ type: "hero", variant: "split" }] });
    const primary = template.globalClasses.find(c => c.name === "bs-btn--primary")!;
    expect(JSON.stringify(primary.settings)).toContain("var(--bs-primary, #0055ff)");
    const title = template.globalClasses.find(c => c.name === "bs-title")!;
    // Font families live in custom CSS because Bricks quotes its font-family control.
    expect(title.settings._cssCustom).toMatch(/font-family: var\(--bs-font-heading, "Inter"/);
    expect(JSON.stringify(title.settings._typography)).not.toContain("font-family");
  });

  it("reports quality issues per page and not for single sections", () => {
    const section = generateKitTemplate({ kit: {}, profile: { industry: "kfz", language: "de" }, sections: ["services"] });
    expect(section.quality.some(q => /h1/.test(q.message))).toBe(false);
    const twoHeroes = generateKitTemplate({ kit: {}, profile: { industry: "kfz", language: "en" }, sections: ["hero", { type: "hero", variant: "centered" }] });
    expect(twoHeroes.quality.some(q => q.level === "warning" && /2 main headings/.test(q.message))).toBe(true);
  });

  it("keeps anchors unique when a page repeats a section type", () => {
    const { template } = generateKitTemplate({ kit: {}, profile: { industry: "kfz", language: "de" }, sections: ["services", { type: "services", variant: "list" }] });
    expect(template.content.filter(el => el.settings._cssId).map(el => el.settings._cssId)).toEqual(["leistungen", "leistungen-2"]);
  });
});

describe("business profiles and copy", () => {
  it("resolves complete copy for every industry in both languages", () => {
    for (const industry of INDUSTRY_IDS) for (const language of ["de", "en"] as const) {
      const c = contentFor({ industry, language });
      const json = JSON.stringify(c);
      expect(json, `${industry} ${language}`).not.toMatch(/\{name\}|\{city\}|undefined/);
      // Sample copy carries no email addresses (some host firewalls block them); the profile's own one is used.
      expect(json).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]/i);
      expect(c.services.items.length).toBeGreaterThanOrEqual(3);
      for (const link of c.nav) expect(Object.values(c.anchors)).toContain(link.href.slice(1));
    }
  });

  it("uses the profile's name, city, phone and own services", () => {
    const c = contentFor({ industry: "handwerk", language: "de", name: "Elektro Schulz", city: "Kassel", phone: "0561 12345", email: "info@example.org", services: ["Photovoltaik", "Wallbox"] });
    expect(c.brand).toMatchObject({ name: "Elektro Schulz", city: "Kassel", phone: "0561 12345", email: "info@example.org" });
    expect(c.hero.eyebrow).toBe("Meisterbetrieb in Kassel");
    expect(c.services.items.map(i => i.title).slice(0, 2)).toEqual(["Photovoltaik", "Wallbox"]);
    expect(c.cta.secondary.href).toBe("tel:056112345");
  });

  it("escapes profile values in Bricks text and in the preview", () => {
    const { template } = generateKitTemplate({ kit: {}, profile: { industry: "business", language: "en", name: "<script>alert(1)</script> & Co" }, sections: ["navbar", "hero"] });
    const brand = template.content.find(el => el.name === "text-link")!;
    expect(brand.settings.text).toBe("&lt;script&gt;alert(1)&lt;/script&gt; &amp; Co");
    const { html } = renderPreview(template);
    expect(html).not.toMatch(/<script/i);
  });
});

describe("preview renderer", () => {
  it("renders classes, breakpoints as container queries and icons as inline SVG", () => {
    const { template, designSystem } = generateKitTemplate({ kit: { style: "soft" }, profile: { industry: "praxis", language: "de" }, sections: ["navbar", "services"] });
    const { html, css } = renderPreview(template, { variables: designSystem.css.replace(/^:root \{|\}$/g, ""), fonts: { "Plus Jakarta Sans": "var(--font-jakarta)" } });
    expect(html).toContain('class="brxe-section bs-section');
    expect(html).toMatch(/<svg viewBox="0 0 512 512"/);
    expect(css).toMatch(/@container bsp \(max-width: 991px\)/);
    expect(css).toContain("var(--font-jakarta)");
    expect(css).not.toMatch(/\d(vw|vh)\b/);
    expect(css).toMatch(/@layer bricks/);
  });
});

describe("studio helpers", () => {
  it("names every section type and builds every starter page with known layouts and no quality warnings about structure", () => {
    expect(Object.keys(SECTION_LABELS).sort()).toEqual([...SECTION_TYPES].sort());
    for (const industry of INDUSTRY_IDS) {
      const page = STARTER_PAGES[industry];
      for (const pick of page) expect(variantsFor(pick.type).map(v => v.id)).toContain(pick.variant);
      const { result } = kitPreview(normalizeKit({}), { industry, language: "de" }, page);
      expect(result.quality.filter(q => /h1|Überschrift|Alternativtext/.test(q.message) && q.level === "warning")).toEqual([]);
    }
  });

  it("inserts headers first, footers last and other sections before the footer", () => {
    const page = [{ type: "hero" as const }, { type: "footer" as const }];
    expect(insertSection(page, { type: "navbar" }).map(s => s.type)).toEqual(["navbar", "hero", "footer"]);
    expect(insertSection(page, { type: "faq" }).map(s => s.type)).toEqual(["hero", "faq", "footer"]);
    expect(insertSection([{ type: "hero" }], { type: "faq" }).map(s => s.type)).toEqual(["hero", "faq"]);
  });

  it("uses smaller sample photos for thumbnails only", () => {
    const { result, html, css } = kitPreview(normalizeKit({}), { industry: "handwerk", language: "de" }, [{ type: "hero", variant: "cover" }, { type: "services", variant: "rows" }], { imageWidth: 640 });
    expect(`${html}${css}`).toContain("?w=640");
    expect(`${html}${css}`).not.toContain("?w=1600");
    expect(JSON.stringify(result.template)).toContain("?w=1600");
  });

  it("lists options and picks the Bricks template type", () => {
    const catalog = kitCatalog();
    expect(catalog.sections.reduce((n, s) => n + s.variants.length, 0)).toBe(LAYOUTS.length);
    expect(kitTemplateType(["navbar"])).toBe("header");
    expect(kitTemplateType([{ type: "footer" }])).toBe("footer");
    expect(kitTemplateType(["hero"])).toBe("section");
    expect(kitTemplateType(["navbar", "hero"])).toBe("content");
  });
});
