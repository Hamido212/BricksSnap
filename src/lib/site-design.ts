import { wrapTemplate, type BricksTemplate } from "./bricks-engine";
import { generateBuiltin } from "./builtin-generator";
import { readStagingTemplate } from "./template-staging";
import { templateWarnings } from "./template-warnings";

/** Color roles the built-in generators understand (see builtin-generator palette merge). */
export const COLOR_ROLES = ["primary", "secondary", "accent", "background", "surface", "text", "heading", "muted", "border"] as const;
export type ColorRole = typeof COLOR_ROLES[number];

export type SitePalette = { id: string; name: string; colors: Array<{ id: string; raw?: string; light?: string; name?: string; uses?: number }> };
export type SiteColor = { id: string; label: string; hex: string; raw?: string; palette: string; isDefault: boolean; uses: number };
export type RoleMapping = Partial<Record<ColorRole, string>>; // role -> SiteColor.id

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/** Lowercase #rrggbb, or null for anything else (alpha and named colors are not mapped). */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split("").map(c => c + c).join("") : match[1];
  return `#${hex.toLowerCase()}`;
}

/** Palette colors with a usable hex value; Bricks' built-in palette is flagged so site colors win. */
export function siteColors(palettes: SitePalette[]): SiteColor[] {
  const colors: SiteColor[] = [];
  for (const palette of palettes) {
    for (const color of palette.colors) {
      const hex = normalizeHex(color.light);
      if (!hex) continue;
      const variable = typeof color.raw === "string" ? /^var\((--[\w-]+)\)$/.exec(color.raw.trim())?.[1] : undefined;
      const label = color.name || (variable ? variable.replace(/^--(bricks-color-)?/, "") : color.id);
      colors.push({ id: color.id, label, hex, ...(color.raw ? { raw: color.raw } : {}), palette: palette.name, isDefault: !!variable?.startsWith("--bricks-color-"), uses: color.uses ?? 0 });
    }
  }
  return colors;
}

// Chroma rather than HSL saturation decides neutrality: tinted near-black text colors have a high saturation.
function hsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, chroma = max - min;
  const s = max === min ? 0 : chroma / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max !== min) h = max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
  return { h: (h * 60 + 360) % 360, s, l, chroma };
}

const KEYWORDS: Record<ColorRole, string[]> = {
  primary: ["primary", "brand", "main"],
  secondary: ["secondary"],
  accent: ["accent", "highlight", "tertiary"],
  background: ["background", "bg", "base", "white"],
  surface: ["surface", "card", "panel", "offwhite"],
  text: ["text", "body", "copy", "paragraph"],
  heading: ["heading", "headings", "title", "black"],
  muted: ["muted", "subtle", "secondary-text"],
  border: ["border", "line", "divider", "stroke"],
};

/**
 * Suggest a site color per role: names first (site palettes before Bricks' default palette),
 * then lightness and chroma (lightest neutral → background, darkest → heading, most colorful → primary).
 * Colors counted on a page (`uses`) rank by frequency first.
 */
export function suggestRoles(colors: SiteColor[]): RoleMapping {
  const mapping: RoleMapping = {};
  const used = new Set<string>();
  const ordered = [...colors.filter(c => !c.isDefault), ...colors.filter(c => c.isDefault)];
  const assign = (role: ColorRole, color?: SiteColor) => { if (color && !mapping[role]) { mapping[role] = color.id; used.add(color.id); } };

  for (const role of COLOR_ROLES) {
    assign(role, ordered.find(c => !used.has(c.id) && c.label.toLowerCase().split(/[^a-z0-9]+/).some(word => KEYWORDS[role].includes(word))));
  }

  const pool = (reuse = false) => {
    const own = colors.filter(c => !c.isDefault && (reuse || !used.has(c.id)));
    return own.length ? own : colors.filter(c => reuse || !used.has(c.id));
  };
  type Candidate = { c: SiteColor; h: number; s: number; l: number; chroma: number };
  const withHsl = (list: SiteColor[]): Candidate[] => list.map(c => ({ c, ...hsl(c.hex) }));
  const neutrals = (reuse = false) => withHsl(pool(reuse)).filter(x => x.chroma < 0.12);
  // Frequency first, then the role's own measure.
  const byUses = (measure: (x: Candidate) => number) => (a: Candidate, b: Candidate) => (b.c.uses - a.c.uses) || (measure(a) - measure(b));
  const pick = (role: ColorRole, list: Candidate[]) => assign(role, list[0]?.c);

  if (!mapping.background) pick("background", neutrals().filter(x => x.l >= 0.9).sort(byUses(x => -x.l)));
  if (!mapping.heading) pick("heading", neutrals().filter(x => x.l <= 0.25).sort((a, b) => a.l - b.l));
  if (!mapping.text) pick("text", neutrals().filter(x => x.l <= 0.45).sort(byUses(x => x.l)));
  if (!mapping.surface) pick("surface", neutrals().filter(x => x.l >= 0.85).sort((a, b) => b.l - a.l));
  // Small palettes have few light greys; the border may share the surface color.
  const borderCandidates = (reuse: boolean) => neutrals(reuse).filter(x => x.l >= 0.75 && x.l < 0.95 && x.c.id !== mapping.background).sort(byUses(x => Math.abs(x.l - 0.87)));
  if (!mapping.border) pick("border", borderCandidates(false).length ? borderCandidates(false) : borderCandidates(true));
  if (!mapping.muted) pick("muted", neutrals().filter(x => x.l > 0.3 && x.l < 0.7).sort(byUses(x => Math.abs(x.l - 0.5))));

  const vivid = () => withHsl(pool()).filter(x => x.chroma >= 0.2 && x.l >= 0.2 && x.l <= 0.75).sort(byUses(x => Math.abs(x.l - 0.5) - x.s));
  if (!mapping.primary) pick("primary", vivid());
  const hueOf = (id?: string) => { const c = colors.find(x => x.id === id); return c ? hsl(c.hex).h : undefined; };
  const distinct = (list: Candidate[]) => list.filter(x => [mapping.primary, mapping.secondary].every(id => { const h = hueOf(id); return h === undefined || Math.min(Math.abs(h - x.h), 360 - Math.abs(h - x.h)) > 30; }));
  if (!mapping.secondary) pick("secondary", distinct(vivid()));
  if (!mapping.accent) pick("accent", distinct(vivid()));
  return mapping;
}

const cssDeclarations = (css: string, property: string) =>
  [...css.matchAll(new RegExp(`(?:^|[;{\\s])${property}\\s*:\\s*([^;{}]+)`, "gi"))].map(m => m[1].replace(/!important/i, "").trim());

/** A font stack as Bricks stores it: letters, digits, spaces, quotes, commas, dots, hyphens and var(). */
const safeFontStack = (value: string) => /^[\w\s,'".()-]{1,200}$/.test(value) ? value.replace(/\s+/g, " ").trim() : null;

/**
 * The design a page actually uses: solid colors from its settings and custom CSS (most used first)
 * and its font stacks (most used first, grouped by the first family). For sites that style pages
 * directly instead of through palettes and theme styles.
 */
export function pageDesign(template: Pick<BricksTemplate, "content">, name: string): { palette: SitePalette | null; fonts: string[] } {
  const colors = new Map<string, number>();
  const fonts = new Map<string, { stack: string; uses: number }>();
  const addColor = (value: unknown) => { const hex = normalizeHex(value); if (hex) colors.set(hex, (colors.get(hex) ?? 0) + 1); };
  const addFont = (value: unknown) => {
    const stack = typeof value === "string" ? safeFontStack(value) : null;
    if (!stack) return;
    const family = stack.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    const known = fonts.get(family);
    // Keep the most complete stack (with fallbacks) for each family.
    fonts.set(family, { stack: known && known.stack.length >= stack.length ? known.stack : stack, uses: (known?.uses ?? 0) + 1 });
  };
  const visit = (value: unknown, key = "") => {
    if (typeof value === "string") {
      if (key === "hex") addColor(value);
      else if (key.startsWith("_cssCustom")) {
        for (const declaration of cssDeclarations(value, "(?:color|background-color|background|border-color|border|fill|stroke)")) {
          for (const match of declaration.matchAll(/#[0-9a-f]{6}(?![0-9a-f])|#[0-9a-f]{3}(?![0-9a-f])/gi)) addColor(match[0]);
        }
        cssDeclarations(value, "font-family").forEach(addFont);
      }
    } else if (Array.isArray(value)) value.forEach(child => visit(child));
    else if (isRecord(value)) {
      // Typography: the family plus Bricks' native fallback stack.
      if (typeof value["font-family"] === "string") addFont(typeof value.fallback === "string" && value.fallback.trim() ? `${value["font-family"]}, ${value.fallback}` : value["font-family"]);
      for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
    }
  };
  for (const el of template.content) visit(el.settings);

  const ranked = [...colors].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 16);
  const palette = ranked.length ? {
    id: "page-colors", name,
    colors: ranked.map(([hex, uses]) => ({ id: `page-${hex.slice(1)}`, light: hex, name: `used ${uses}×`, uses })),
  } : null;
  return { palette, fonts: [...fonts.values()].sort((a, b) => b.uses - a.uses).map(font => font.stack).slice(0, 6) };
}

/** Role → hex for the generator, from a role mapping. */
export function roleColors(mapping: RoleMapping, colors: SiteColor[]): Partial<Record<ColorRole, string>> {
  const result: Partial<Record<ColorRole, string>> = {};
  for (const role of COLOR_ROLES) {
    const color = colors.find(c => c.id === mapping[role]);
    if (color) result[role] = color.hex;
  }
  return result;
}

/** CSS variable reference with the hex as fallback, so markup also renders where the palette CSS is absent. */
function variableWithFallback(color: SiteColor): string | null {
  const name = color.raw ? /^var\((--[\w-]+)\)$/.exec(color.raw.trim())?.[1] : undefined;
  return name ? `var(${name}, ${color.hex})` : null;
}

/**
 * Replace `{ hex }` color values that equal a mapped site color with a palette reference
 * (`{ raw: "var(--name, #hex)" }`), so later palette changes on the site apply to the section.
 */
export function linkSiteColors<T extends Pick<BricksTemplate, "content">>(template: T, mapping: RoleMapping, colors: SiteColor[]): T {
  const links = new Map<string, string>();
  for (const role of COLOR_ROLES) {
    const color = colors.find(c => c.id === mapping[role]);
    const raw = color && variableWithFallback(color);
    if (color && raw && !links.has(color.hex)) links.set(color.hex, raw);
  }
  const rewrite = (value: unknown): unknown => {
    if (isRecord(value)) {
      const hex = typeof value.hex === "string" ? normalizeHex(value.hex) : null;
      if (hex && links.has(hex) && Object.keys(value).every(key => key === "hex")) return { raw: links.get(hex) };
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]));
    }
    return Array.isArray(value) ? value.map(rewrite) : value;
  };
  return { ...template, content: template.content.map(el => ({ ...el, settings: rewrite(el.settings) as typeof el.settings })) };
}

/** Remove BricksSnap's font families (typography controls and generated CSS) so the site's typography applies. */
export function inheritSiteFonts<T extends Pick<BricksTemplate, "content">>(template: T): T {
  return {
    ...template,
    content: template.content.map(el => {
      const settings: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(el.settings)) {
        if (key.startsWith("_typography") && isRecord(value)) {
          const { "font-family": _family, fallback: _fallback, ...rest } = value;
          void _family; void _fallback;
          if (Object.keys(rest).length) settings[key] = rest;
        } else if (key.startsWith("_cssCustom") && typeof value === "string") {
          // Drop the declarations, then rules left empty (repeat for nested @media blocks).
          let css = value.replace(/font-family\s*:[^;{}]*;?/gi, "");
          for (let previous = ""; previous !== css;) { previous = css; css = css.replace(/[^{}]*\{\s*\}/g, ""); }
          css = css.trim();
          if (css) settings[key] = css;
        } else settings[key] = value;
      }
      return { ...el, settings };
    }),
  };
}

/** `inherit` leaves fonts to the site's typography, `default` keeps BricksSnap's, a stack sets that font. */
export type SiteFont = "inherit" | "default" | { family: string };
export type SiteDesignOptions = { prompt: string; sections: string[]; mapping: RoleMapping; colors: SiteColor[]; linkPalette: boolean; font: SiteFont };

/** Built-in sections in the connected site's colors, optionally linked to its palette, in its font. */
export function generateInSiteDesign(options: SiteDesignOptions) {
  const family = typeof options.font === "object" ? safeFontStack(options.font.family) : null;
  if (typeof options.font === "object" && !family) throw new Error("Choose a font stack of letters, spaces, quotes, commas and hyphens.");
  let template: BricksTemplate = wrapTemplate(generateBuiltin(options.prompt, options.sections, family ? { fontFamily: family } : undefined, roleColors(options.mapping, options.colors)));
  if (options.linkPalette) template = linkSiteColors(template, options.mapping, options.colors);
  if (options.font === "inherit") template = inheritSiteFonts(template);
  template = readStagingTemplate(template);
  return { template, warnings: ["Built-in content uses sample copy. Review all text before publishing.", ...templateWarnings(template.content)] };
}
