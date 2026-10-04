import { describe, expect, it } from "vitest";
import type { BricksElement } from "../src/lib/bricks-engine";
import { classId } from "../src/lib/kit/build";
import { contentFor, INDUSTRY_IDS } from "../src/lib/kit/content";
import { designSystemFor, generateKitTemplate } from "../src/lib/kit/generate";
import { renderPreview, settingsProperties } from "../src/lib/kit/preview";
import { classLibrary, SECTION_TYPES, variantsFor } from "../src/lib/kit/sections";
import { contrast } from "../src/lib/kit/color";
import { contrastChecks, normalizeKit, resolveKit, STYLE_IDS } from "../src/lib/kit/tokens";
import { validateBricksElements, verifiedControls } from "../src/lib/bricks-validator";
import schema from "../src/data/bricks-schema.json";
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
        const validation = validateBricksElements(template.content);
        expect(validation.valid).toBe(true);
        // Bricks' set-page-elements rejects controls it has not registered (e.g. a form's submitButtonPadding).
        expect(validation.violations.filter(v => /undocumented/.test(v))).toEqual([]);
        expect(() => readStagingTemplate(template)).not.toThrow();
        const ids = new Set(template.globalClasses.map(c => c.id));
        for (const el of template.content) for (const id of (el.settings._cssGlobalClasses as string[] | undefined) ?? []) expect(ids.has(id)).toBe(true);
      }
    }
  });

  it("never lets two classes on one element set the same CSS property", () => {
    for (const style of STYLE_IDS) {
      const starts = Array.from({ length: Math.ceil(LAYOUTS.length / 16) }, (_, i) => i * 16);
      const pages = starts.map(start => generateKitTemplate({ kit: { style }, profile: { industry: "agentur", language: "en" }, sections: LAYOUTS.slice(start, start + 16) }).template);
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

  it("offers at least 80 layouts, every class defined once", () => {
    expect(LAYOUTS.length).toBeGreaterThanOrEqual(80);
    expect(new Set(LAYOUTS.map(l => `${l.type}/${l.variant}`)).size).toBe(LAYOUTS.length);
    // A class name defined by two factories would silently overwrite the other one.
    const r = resolveKit({});
    const owners = new Map<string, number>();
    for (const factory of new Set(SECTION_TYPES.flatMap(type => variantsFor(type).map(v => v.classes)).filter(Boolean))) {
      for (const name of Object.keys(factory!(r))) owners.set(name, (owners.get(name) ?? 0) + 1);
    }
    expect([...owners].filter(([, n]) => n > 1).map(([name]) => name)).toEqual([]);
  });

  it("builds switches and FAQs from Bricks' nested tabs and accordion", () => {
    const { template } = generateKitTemplate({ kit: {}, profile: { industry: "handwerk", language: "de" }, sections: [{ type: "pricing", variant: "switch" }, { type: "faq", variant: "accordion" }] });
    const byId = new Map(template.content.map(el => [el.id, el]));
    const hidden = (id: string) => (byId.get(id)!.settings._hidden as { _cssClasses: string })._cssClasses;
    const tabsEl = template.content.find(el => el.name === "tabs-nested")!;
    const [menu, content] = tabsEl.children;
    expect([hidden(menu), hidden(content)]).toEqual(["tab-menu", "tab-content"]);
    expect(byId.get(menu)!.children.map(hidden)).toEqual(["tab-title", "tab-title"]);
    expect(byId.get(content)!.children.map(hidden)).toEqual(["tab-pane", "tab-pane"]);
    const acc = template.content.find(el => el.name === "accordion-nested")!;
    expect(acc.settings.faqSchema).toBe(true);
    const item = byId.get(acc.children[0])!;
    expect(item.children.map(hidden)).toEqual(["accordion-title-wrapper", "accordion-content-wrapper"]);
    expect(validateBricksElements(template.content).violations.filter(v => /undocumented/.test(v))).toEqual([]);
    // Pane and content classes never set display: Bricks shows and hides them.
    const library = classLibrary(resolveKit({}));
    for (const name of ["bs-tabs__pane", "bs-tabs__content", "bs-acc__content"]) expect(Object.keys(library[name]).some(k => k.startsWith("_display"))).toBe(false);
    const { html } = renderPreview(template);
    expect(html.match(/tab-title brx-open/g)).toHaveLength(1);
    expect(html.match(/tab-pane brx-open/g)).toHaveLength(1);
    expect(html).toContain("accordion-content-wrapper");
  });

  it("gives every header with links Bricks' nestable nav with a mobile menu", () => {
    for (const variant of variantsFor("navbar").filter(v => v.id !== "minimal")) {
      const { template } = generateKitTemplate({ kit: {}, profile: { industry: "kfz", language: "de" }, sections: [{ type: "navbar", variant: variant.id }] });
      const byId = new Map(template.content.map(el => [el.id, el]));
      const hidden = (id: string) => (byId.get(id)!.settings._hidden as { _cssClasses?: string } | undefined)?._cssClasses;
      const nav = template.content.find(el => el.name === "nav-nested")!;
      expect(nav.settings).toMatchObject({ mobileMenu: "tablet_portrait", ariaLabel: "Hauptnavigation" });
      // Bricks 2.4.2's own structure: the item list, then the open toggle; the close toggle inside the list.
      const [list, open] = nav.children.map(id => byId.get(id)!);
      expect([list.name, list.settings.tag, hidden(list.id), open.name, open.settings.animation]).toEqual(["block", "ul", "brx-nav-nested-items", "toggle", "squeeze"]);
      const items = list.children.map(id => byId.get(id)!);
      expect(items.filter(el => el.name === "text-link")).toHaveLength(4);
      expect(items.at(-1)!.name).toBe("toggle");
      expect(hidden(items.at(-1)!.id)).toBe("brx-toggle-div");
      expect(validateBricksElements(template.content).violations.filter(v => /undocumented/.test(v))).toEqual([]);
      const { html } = renderPreview(template);
      expect(html).toMatch(/<nav [^>]*class="brxe-nav-nested[^"]*bs-mainnav/);
      expect(html.match(/<li class="menu-item">/g)!.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("fades content in with Bricks interactions only when the kit asks for motion", () => {
    const sections = [{ type: "navbar" as const }, { type: "hero" as const }, { type: "services" as const }, { type: "faq" as const, variant: "accordion" }, { type: "footer" as const }];
    const still = generateKitTemplate({ kit: {}, profile: { industry: "kfz", language: "de" }, sections }).template;
    expect(still.content.some(el => el.settings._interactions)).toBe(false);
    const moving = generateKitTemplate({ kit: { motion: "subtle" }, profile: { industry: "kfz", language: "de" }, sections }).template;
    const animated = moving.content.filter(el => el.settings._interactions);
    expect(animated.length).toBeGreaterThan(3);
    expect(animated[0].settings._interactions).toEqual([expect.objectContaining({ trigger: "enterView", action: "startAnimation", target: "self", animationType: "fadeInUp", runOnce: true })]);
    // Headers, heroes and footers stay still; nothing inside Bricks' accordion is animated.
    const byId = new Map(moving.content.map(el => [el.id, el]));
    const rootOf = (el: (typeof moving.content)[number]): string => (el.parent === 0 ? el.label ?? "" : rootOf(byId.get(String(el.parent))!));
    expect(new Set(animated.map(rootOf))).toEqual(new Set(["Services", "FAQ"]));
    const insideAccordion = (el: (typeof moving.content)[number]): boolean => el.parent !== 0 && (byId.get(String(el.parent))!.name === "accordion-nested" || insideAccordion(byId.get(String(el.parent))!));
    expect(animated.some(insideAccordion)).toBe(false);
    const motion = moving.globalClasses.find(c => c.name === "bs-motion")!;
    expect(String(motion.settings._cssCustom)).toMatch(/prefers-reduced-motion: reduce/);
    expect(animated.every(el => (el.settings._cssGlobalClasses as string[]).includes(motion.id))).toBe(true);
    expect(validateBricksElements(moving.content).valid).toBe(true);
  });

  it("builds carousels from Bricks' nested slider with Splide breakpoints", () => {
    const { template } = generateKitTemplate({ kit: {}, profile: { industry: "agentur", language: "en" }, sections: [{ type: "portfolio", variant: "carousel" }, { type: "testimonials", variant: "carousel" }] });
    const sliders = template.content.filter(el => el.name === "slider-nested");
    expect(sliders).toHaveLength(2);
    const options = JSON.parse(String(sliders[0].settings.options));
    expect(sliders[0].settings.optionsType).toBe("custom");
    expect(options).toMatchObject({ type: "loop", perPage: 3, breakpoints: { 991: { perPage: 2 }, 767: { perPage: 1 } }, pagination: true, arrows: false });
    expect(JSON.stringify(sliders[0].settings.paginationColorActive)).toContain("var(--bs-primary");
    expect(validateBricksElements(template.content).violations.filter(v => /undocumented/.test(v))).toEqual([]);
    expect(renderPreview(template).html).toContain('class="bsp-slides"');
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
    // An explicit position ("add after this section") wins, clamped to the page.
    expect(insertSection(page, { type: "cta" }, 1).map(s => s.type)).toEqual(["hero", "cta", "footer"]);
    expect(insertSection(page, { type: "navbar" }, 2).map(s => s.type)).toEqual(["hero", "footer", "navbar"]);
    expect(insertSection(page, { type: "faq" }, 99).map(s => s.type)).toEqual(["hero", "footer", "faq"]);
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

describe("preview sanitizing", () => {
  const el = (id: string, name: string, settings: Record<string, unknown>): BricksElement => ({ id, name, parent: 0, children: [], settings });
  it("keeps only attribute-free inline tags in text and safe URLs in links and backgrounds", () => {
    const { html, css } = renderPreview({ content: [
      el("aaaaaa", "text-basic", { tag: "p", text: 'A &amp; B<br/><strong class="x">bold</strong><script>alert(1)</script><img src=x onerror=alert(1)><scr<script>ipt>' }),
      el("bbbbbb", "text-link", { text: "Go", link: { url: "javascript:alert(1)" } }),
      el("cccccc", "button", { text: "Up", link: { url: "//evil.example/x" } }),
      el("dddddd", "text-link", { text: "Call", link: { url: "tel:+49421" } }),
      el("eeeeee", "div", { _background: { image: { url: 'https://images.example/a.jpg")} body{color:red' } } }),
    ], globalClasses: [] });
    expect(html).toContain('A &amp; B<br>&lt;strong class="x"&gt;bold</strong>&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;&lt;scr&lt;script&gt;ipt&gt;');
    expect(html).not.toMatch(/<script|<img|<strong class/);
    expect(html).toContain('href="#"');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("//evil.example");
    expect(html).toContain('href="tel:+49421"');
    expect(css).toContain('url("https://images.example/a.jpg%22%29} body{color:red")');
    expect(css).not.toContain('a.jpg")');
  });
});

describe("design library", () => {
  it("has unique designs whose pages use known layouts, pass contrast and structure checks in both languages", async () => {
    const { DESIGNS } = await import("../src/lib/kit/library");
    expect(new Set(DESIGNS.map(d => d.id)).size).toBe(DESIGNS.length);
    for (const design of DESIGNS) {
      for (const pick of design.page) expect(variantsFor(pick.type).map(v => v.id)).toContain(pick.variant);
      expect(contrastChecks(resolveKit(design.kit)).filter(c => !c.ok)).toEqual([]);
      for (const language of ["de", "en"] as const) {
        const result = generateKitTemplate({ kit: design.kit, profile: { industry: design.industry, language }, sections: design.page });
        expect(() => readStagingTemplate(result.template)).not.toThrow();
        expect(result.quality.filter(q => q.level === "warning" && !/„#“|“#”/.test(q.message))).toEqual([]);
      }
    }
  });
});

describe("phone layout", () => {
  it("stacks button rows on phones, lets headings wrap and previews in the page language", () => {
    const preview = kitPreview(normalizeKit({ style: "warm" }), { industry: "zahnarzt", language: "de" }, [{ type: "hero", variant: "cover" }]);
    const phone = preview.css.slice(preview.css.indexOf("@container bsp (max-width: 478px)"));
    expect(phone).toContain(".bs-btn-row { flex-direction: column; }");
    expect(phone).toContain(".bs-btn-row { align-items: stretch; }");
    expect(preview.css).toContain(".bs-hero .bs-btn-row { margin-top: 8px; }");
    expect(preview.css).toMatch(/\.bs-title \{[^}]*overflow-wrap: anywhere; hyphens: auto;/);
    expect(preview.html.startsWith('<div lang="de">')).toBe(true);
    expect(preview.html).toContain("Zahnarztpraxis in");
  });
});

/** Top-level rules of a class's custom CSS; at-rule blocks are kept whole. */
function cssRules(css: string): Array<{ selector: string; body: string; at: boolean }> {
  const rules: Array<{ selector: string; body: string; at: boolean }> = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    const selector = css.slice(i, open).trim();
    rules.push({ selector, body: css.slice(open + 1, j - 1).trim(), at: selector.startsWith("@") });
    i = j;
  }
  return rules;
}
/** Splits at commas and combinators outside parentheses. */
function splitOutside(value: string, separators: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0, current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (!depth && separators.test(ch)) { parts.push(current); current = ""; continue; }
    current += ch;
  }
  return [...parts, current].map(p => p.trim()).filter(Boolean);
}
/** Class-level specificity (classes, attributes, pseudo-classes; :is/:has/:not count their strongest argument). */
function classSpecificity(selector: string): number {
  let count = 0;
  const rest = selector.replace(/:(is|not|has|where)\(((?:[^()]|\([^()]*\))*)\)/g, (_, fn: string, args: string) => {
    if (fn !== "where") count += Math.max(0, ...splitOutside(args, /,/).map(classSpecificity));
    return "";
  });
  count += (rest.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  return count;
}

describe("class CSS as Bricks 2.4 stores and renders it", () => {
  const libraries = STYLE_IDS.flatMap(style => (["light", "dark"] as const).map(mode => classLibrary(resolveKit({ style, mode })) as Record<string, Record<string, unknown>>));
  const customCss = function* () {
    for (const lib of libraries) for (const [name, settings] of Object.entries(lib)) for (const [key, css] of Object.entries(settings)) if (key.startsWith("_cssCustom") && typeof css === "string") yield { name, css };
  };

  it("keeps properties Bricks turns into controls out of the class's own rule", () => {
    // Saving a class, Bricks moves these from `.class { … }` into controls (gap into _gridGap, which it
    // does not render on flex elements); the site then never matches the definition.
    const converted = /^(display|gap|row-gap|column-gap|color|grid-column|grid-row|opacity|visibility|padding|margin|width|height)$/;
    const found = new Set<string>();
    for (const { name, css } of customCss()) for (const rule of cssRules(css)) {
      if (rule.at || rule.selector !== `.${name}`) continue;
      for (const decl of rule.body.split(";")) { const prop = decl.split(":")[0].trim(); if (converted.test(prop)) found.add(`${name}: ${prop}`); }
    }
    expect([...found]).toEqual([]);
  });

  it("writes rules the way Bricks stores them: no selector lists, at-rules first", () => {
    const found = new Set<string>();
    for (const { name, css } of customCss()) {
      const rules = cssRules(css);
      for (const rule of rules) if (!rule.at && splitOutside(rule.selector, /,/).length > 1) found.add(`${name}: list ${rule.selector}`);
      const firstRule = rules.findIndex(r => !r.at);
      if (firstRule >= 0 && firstRule < rules.findLastIndex(r => r.at)) found.add(`${name}: at-rule after a rule`);
    }
    expect([...found]).toEqual([]);
  });

  it("gives each element's classes only controls Bricks renders for that element", () => {
    // Bricks stores any control on a class but prints only those the element has (no _columnGap on text).
    const controls = new Map(Object.entries(schema.elements).map(([name, element]) => [name, new Set([...schema.commonControls, ...element.controls, ...(verifiedControls[name] ?? []), "_cssCustom"])]));
    const found = new Set<string>();
    for (const style of STYLE_IDS) for (let i = 0; i < LAYOUTS.length; i += 10) {
      const { template } = generateKitTemplate({ kit: { style, motion: "subtle" }, profile: { industry: "kfz", language: "de" }, sections: LAYOUTS.slice(i, i + 10) });
      const classes = new Map(template.globalClasses.map(c => [c.id, c]));
      for (const el of template.content) for (const id of (el.settings._cssGlobalClasses as string[] | undefined) ?? []) {
        const cls = classes.get(id)!;
        for (const key of Object.keys(cls.settings ?? {})) if (!controls.get(el.name)?.has(key.split(":")[0])) found.add(`${cls.name} on ${el.name}: ${key}`);
      }
    }
    expect([...found]).toEqual([]);
  });

  it("overrides other classes with rules stronger than Bricks' `.class.brxe-element`", () => {
    // Equal specificity would make the result depend on which class Bricks prints first on a page.
    const weak = new Set<string>();
    for (const { name, css } of customCss()) for (const rule of cssRules(css).filter(r => !r.at)) for (const selector of splitOutside(rule.selector, /,/)) {
      const compounds = splitOutside(selector.replace(/::[\w-]+$/, ""), /[\s>+~]/);
      const target = compounds.at(-1)!.replace(/:has\((?:[^()]|\([^()]*\))*\)/g, "");
      if (compounds.length > 1 && /\.bs-/.test(target) && !target.includes(`.${name}`) && classSpecificity(selector) < 3) weak.add(`${name}: ${selector}`);
    }
    expect([...weak]).toEqual([]);
  });
});

describe("forms as Bricks renders them", () => {
  it("show their labels and give checkboxes the options Bricks prints", () => {
    const forms = LAYOUTS.flatMap(layout => generateKitTemplate({ kit: {}, profile: { industry: "kfz", language: "de" }, sections: [layout] }).template.content.filter(el => el.name === "form"));
    expect(forms.length).toBeGreaterThanOrEqual(6);
    for (const form of forms) {
      expect(form.settings.showLabels).toBe(true);
      for (const field of form.settings.fields as Array<Record<string, unknown>>) if (field.type === "checkbox") expect(String(field.options ?? "")).toMatch(/Datenschutzerklärung/);
    }
  });

  it("previews labels only when Bricks would show them", () => {
    const { template } = generateKitTemplate({ kit: {}, profile: { industry: "kfz", language: "de" }, sections: [{ type: "contact", variant: "split" }] });
    const html = renderPreview(template).html;
    expect(html).toContain("<label>Name</label>");
    expect(html).toContain("<span>Ich stimme der Verarbeitung meiner Daten gemäß Datenschutzerklärung zu.</span>");
    const form = template.content.find(el => el.name === "form")!;
    const unlabeled = { ...template, content: template.content.map(el => (el === form ? { ...el, settings: { ...el.settings, showLabels: false } } : el)) };
    expect(renderPreview(unlabeled).html).not.toContain("<label>Name</label>");
  });
});
