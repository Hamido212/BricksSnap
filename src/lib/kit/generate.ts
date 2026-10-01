import type { BricksElement, BricksTemplate } from "../bricks-engine";
import type { TemplateType } from "../bricks-export";
import { flatten, globalClassesFor, classId } from "./build";
import { contentFor, INDUSTRIES, INDUSTRY_IDS, type BusinessProfile, type Content } from "./content";
import { findVariant, isSectionType, classLibrary, SECTION_TYPES, variantsFor, type SectionType } from "./sections";
import { DESIGNS } from "./library";
import { addMotion } from "./motion";
import { sx } from "./styles";
import { COLOR_TOKENS, contrastChecks, FONT_PAIR_IDS, FONT_PAIRS, RADIUS_IDS, resolveKit, SPACING_IDS, STYLE_IDS, STYLES, type BrandKit, type ResolvedKit } from "./tokens";

export type SectionPick = { type: SectionType; variant?: string };

export type DesignSystem = {
  /** A Bricks color palette: each color defines its CSS variable (raw). */
  palette: { id: string; name: string; colors: Array<{ id: string; name: string; raw: string; light: string }> };
  /** Bricks global variables (name without --). */
  variables: Array<{ id: string; name: string; value: string; category: string }>;
  category: { id: string; name: string };
  /** The same values as CSS custom properties, for Bricks → Settings → Custom code or the preview. */
  css: string;
  /** Web fonts the kit uses (Google Fonts families); empty for system fonts. */
  fonts: string[];
};

const idFor = (name: string) => classId(`ds:${name}`);

export function designSystemFor(r: ResolvedKit): DesignSystem {
  const category = { id: idFor("category"), name: "BricksSnap" };
  const colors = COLOR_TOKENS.map(token => ({ id: idFor(`color:${token}`), name: `bs-${token}`, raw: `var(--bs-${token})`, light: r.colors[token] }));
  const variables = Object.entries(r.vars).map(([name, value]) => ({ id: idFor(`var:${name}`), name: `bs-${name}`, value, category: category.id }));
  const css = `:root {\n${[...colors.map(c => `  --${c.name}: ${c.light};`), ...variables.map(v => `  --${v.name}: ${v.value};`)].join("\n")}\n}`;
  const fonts = [...new Set([r.fonts.heading.family, r.fonts.body.family].filter(Boolean))];
  return { palette: { id: idFor("palette"), name: "BricksSnap", colors }, variables, category, css, fonts };
}

export type Quality = { level: "ok" | "warning"; message: string };

/** Contrast, heading order, alt texts and placeholder links for a generated page. */
export function qualityChecks(r: ResolvedKit, elements: BricksElement[], lang: "de" | "en", isPage = true): Quality[] {
  const de = lang === "de";
  const out: Quality[] = [];
  for (const check of contrastChecks(r)) {
    if (!check.ok) out.push({ level: "warning", message: de ? `Kontrast zu gering: ${check.pair} (${check.ratio}:1, nötig ${check.required}:1).` : `Low contrast: ${check.pair} (${check.ratio}:1, needs ${check.required}:1).` });
  }
  const headings = elements.filter(el => el.name === "heading").map(el => Number(String(el.settings.tag ?? "h3").replace("h", ""))).filter(n => n >= 1 && n <= 6);
  const h1 = headings.filter(n => n === 1).length;
  // A page needs exactly one h1; a single section only must not add a second.
  if (isPage ? h1 !== 1 : h1 > 1) out.push({ level: "warning", message: de ? `Die Seite hat ${h1} Hauptüberschriften (h1); empfohlen ist genau eine.` : `The page has ${h1} main headings (h1); exactly one is recommended.` });
  let previous = 0;
  for (const level of headings) {
    if (previous && level > previous + 1) { out.push({ level: "warning", message: de ? `Überschriftenebene springt von h${previous} auf h${level}.` : `Heading level jumps from h${previous} to h${level}.` }); break; }
    previous = level;
  }
  const missingAlt = elements.filter(el => el.name === "image" && !String(el.settings.altText ?? "").trim()).length;
  if (missingAlt) out.push({ level: "warning", message: de ? `${missingAlt} Bilder ohne Alternativtext.` : `${missingAlt} images without alt text.` });
  const placeholders = elements.filter(el => { const link = el.settings.link as { url?: string } | undefined; return link?.url === "#"; }).length;
  if (placeholders) out.push({ level: "warning", message: de ? `${placeholders} Links zeigen noch auf „#“ (z. B. Social Media, Blog). Ersetzen Sie sie vor dem Veröffentlichen.` : `${placeholders} links still point to “#” (e.g. social media, blog). Replace them before publishing.` });
  const photos = elements.filter(el => el.name === "image" || (el.settings._background as { image?: unknown } | undefined)?.image).length;
  if (photos) out.push({ level: "ok", message: de ? `${photos} Beispielfotos (Unsplash) – ersetzen Sie sie durch eigene Bilder oder übernehmen Sie sie vor dem Speichern in die Mediathek.` : `${photos} sample photos (Unsplash) – replace them with your own or import them into the media library before saving.` });
  if (!out.some(q => q.level === "warning")) out.unshift({ level: "ok", message: de ? "Kontrast, Überschriften und Alternativtexte sind in Ordnung." : "Contrast, headings and alt texts are fine." });
  return out;
}

/** Everything a client can choose, with display names in both languages. */
export function kitCatalog() {
  return {
    styles: STYLE_IDS.map(id => ({ id, name: STYLES[id].label, description: STYLES[id].description, fonts: STYLES[id].fonts, samplePrimary: STYLES[id].samplePrimary })),
    fontPairs: FONT_PAIR_IDS.map(id => ({ id, name: FONT_PAIRS[id].label })),
    radius: [...RADIUS_IDS], spacing: [...SPACING_IDS], modes: ["light", "dark"], languages: ["de", "en"],
    industries: INDUSTRY_IDS.map(id => ({ id, name: INDUSTRIES[id].label, description: INDUSTRIES[id].description })),
    sections: SECTION_TYPES.map(type => ({ type, variants: variantsFor(type).map(v => ({ id: v.id, name: v.name })) })),
    // Ready-made designs: pass their kit and page to bricks_kit_page to rebuild one.
    designs: DESIGNS.map(d => ({ id: d.id, name: d.name, industry: d.industry, description: d.description, kit: d.kit, sections: d.page })),
  };
}

/** Bricks template type for a pick list: a lone navbar is a header, a lone footer a footer. */
export function kitTemplateType(sections: Array<SectionPick | SectionType>): TemplateType {
  const types = sections.map(s => (typeof s === "string" ? s : s.type));
  if (types.length === 1 && types[0] === "navbar") return "header";
  if (types.length === 1 && types[0] === "footer") return "footer";
  return types.length > 1 ? "content" : "section";
}

export type KitResult = { template: BricksTemplate; resolved: ResolvedKit; content: Content; designSystem: DesignSystem; quality: Quality[] };

/** Build Bricks elements, their BEM classes and the design system for a brand kit and business profile. */
export function generateKitTemplate(input: { kit: Partial<BrandKit>; profile: Partial<BusinessProfile>; sections: Array<SectionPick | SectionType> }): KitResult {
  const resolved = resolveKit(input.kit);
  const content = contentFor(input.profile);
  const ctx = { r: resolved, c: content, x: sx(resolved) };
  const picks = input.sections.map(s => (typeof s === "string" ? { type: s } : s)).filter(s => isSectionType(s.type));
  if (!picks.length) throw new Error("Choose at least one section.");
  if (picks.length > 16) throw new Error("Choose at most 16 sections.");
  const roots = picks.map(pick => {
    const root = findVariant(pick.type, pick.variant).build(ctx);
    return resolved.kit.motion === "subtle" ? addMotion(root, pick.type) : root;
  });
  const { elements, classNames } = flatten(roots);
  // Two sections of one kind (e.g. two service layouts) would share an anchor; keep IDs unique.
  const anchors = new Map<string, number>();
  for (const el of elements) {
    const id = el.settings._cssId;
    if (typeof id !== "string") continue;
    const seen = (anchors.get(id) ?? 0) + 1;
    anchors.set(id, seen);
    if (seen > 1) el.settings._cssId = `${id}-${seen}`;
  }
  const globalClasses = globalClassesFor(classNames, classLibrary(resolved));
  const template: BricksTemplate = { content: elements, source: "bricksCopiedElements", sourceUrl: "", version: "2.4.1", globalClasses, globalElements: [] };
  return { template, resolved, content, designSystem: designSystemFor(resolved), quality: qualityChecks(resolved, elements, content.lang, picks.some(p => ["hero", "404", "login", "coming-soon"].includes(p.type))) };
}
