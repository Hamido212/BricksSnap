import type { BricksElement, BricksGlobalClass, BricksTemplate } from "./bricks-engine";
import { validateBricksElements } from "./bricks-validator";
import { stableJson } from "./template-staging";
import { classId } from "./kit/build";
import { designSystemFor, qualityChecks, type DesignSystem, type Quality } from "./kit/generate";
import { cssVar, resolveKit, type BrandKit, type ColorToken, type ResolvedKit } from "./kit/tokens";

/**
 * Import & Modernize: turn any Bricks JSON (a copied section, a template export, a component from a
 * library) into BricksSnap's system. Colors become design tokens by role, font sizes, spacing and radii
 * land on the token scale, each element's styles move into one deduplicated `bs-<block>-<role>` class,
 * and missing mobile rules are added. Afterwards the brand kit (color, fonts, radius, spacing, dark
 * mode) restyles the block like any Studio section. Nothing is fetched: the user brings the JSON.
 */

type Settings = Record<string, unknown>;
type Rgba = { r: number; g: number; b: number; a: number };
type Role = "section-bg" | "bg" | "heading" | "text" | "border" | "button-bg" | "button-text" | "shadow" | "icon";
type Context = "light" | "dark" | "primary";

export type ModernizeOptions = {
  kit?: Partial<BrandKit>;
  /** Class prefix after "bs-": letters, digits and dashes (default: from the first heading). */
  block?: string;
  lang?: "de" | "en";
};

export type ModernizeReport = {
  elements: number;
  /** Source colors and the token each one became, most used first. */
  colors: Array<{ from: string; to: ColorToken | "shadow-color"; count: number }>;
  /** The source's brand colors, as detected. */
  brand: { primary?: string; accent?: string };
  fontSizes: Array<{ from: string; to: string; count: number }>;
  spacing: number;
  radii: number;
  fontsReplaced: string[];
  variables: { mapped: string[]; unknown: string[] };
  classes: { created: string[]; sourceMerged: string[]; sourceMissing: string[] };
  mobile: string[];
  warnings: string[];
};

export type ModernizeResult = { template: BricksTemplate; source: BricksTemplate; resolved: ResolvedKit; designSystem: DesignSystem; report: ModernizeReport; quality: Quality[]; block: string };

// Controls that are not styles: they stay on the element.
const META = new Set(["_cssGlobalClasses", "_cssId", "_attributes", "_conditions", "_interactions", "_hidden", "_cssClasses", "_cssGlobalClassesSkipped"]);
const isStyleKey = (key: string) => key.startsWith("_") && !META.has(key.split(":")[0]);
const isRecord = (value: unknown): value is Settings => !!value && typeof value === "object" && !Array.isArray(value);

// ─── Colors ─────────────────────────────────────────────────────────────────

const NAMED: Record<string, string> = { white: "#ffffff", black: "#000000", transparent: "#00000000" };

export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase();
  if (NAMED[value]) return parseColor(NAMED[value]);
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (hex) {
    const h = hex[1].length <= 4 ? hex[1].split("").map(c => c + c).join("") : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  const fn = /^(rgba?|hsla?)\(([^)]+)\)$/.exec(value);
  if (!fn) return null;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  if (fn[1].startsWith("rgb")) {
    const [r, g, b] = parts.slice(0, 3).map(p => (p.endsWith("%") ? parseFloat(p) * 2.55 : parseFloat(p)));
    return [r, g, b, alpha].some(Number.isNaN) ? null : { r, g, b, a: alpha };
  }
  const h = parseFloat(parts[0]) / 360, s = parseFloat(parts[1]) / 100, l = parseFloat(parts[2]) / 100;
  if ([h, s, l, alpha].some(Number.isNaN)) return null;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const hue = (t: number) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return { r: hue(h + 1 / 3) * 255, g: hue(h) * 255, b: hue(h - 1 / 3) * 255, a: alpha };
}

function hsl({ r, g, b }: Rgba): { h: number; s: number; l: number } {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === R ? ((G - B) / d + 6) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: h * 60, s, l };
}

const hexOf = ({ r, g, b }: Rgba) => `#${[r, g, b].map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
const isChromatic = (c: Rgba) => { const { s, l } = hsl(c); return s > 0.28 && l > 0.12 && l < 0.94; };
const hueDistance = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** Framework color variables (Automatic CSS, Core Framework, Bricks defaults) as stand-in colors. */
function colorForVariable(name: string): Rgba | "primary" | "primary-soft" | "primary-hover" | "accent" | null {
  const n = name.replace(/^--/, "").toLowerCase();
  if (/(primary|brand|action)/.test(n)) return /(ultra-light|light|trans|soft|tint|-10$|-20$|-bg$)/.test(n) ? "primary-soft" : /(dark|hover|-80$|-90$)/.test(n) ? "primary-hover" : "primary";
  if (/(secondary|accent|tertiary|highlight)/.test(n)) return "accent";
  if (/(white|ultra-light$|bg-body|body-bg|^bg$|^light$|base-ultra-light|bg-light|surface)/.test(n)) return parseColor(/(surface|bg-light|base-ultra-light)/.test(n) ? "#f4f4f5" : "#ffffff");
  if (/(black|heading|title|text-dark|^dark$|base-ultra-dark|bg-dark|^base-dark)/.test(n)) return parseColor("#111111");
  if (/(text-light|on-dark)/.test(n)) return parseColor("#ffffff");
  if (/(border|divider|line)/.test(n)) return parseColor("#e4e4e7");
  if (/(muted|gray|grey|neutral|shade|base|body|text)/.test(n)) return parseColor(/(text|body)/.test(n) ? "#3f3f46" : "#71717a");
  return null;
}

type SizeKind = "font" | "space" | "radius";
/** Framework size variables → a BricksSnap token name (without --bs-). */
function tokenForSizeVariable(name: string, kind: SizeKind): string | null {
  const n = name.replace(/^--/, "").toLowerCase();
  if (kind === "font") {
    const heading = /^(?:heading-|h|fs-h)([1-6])$/.exec(n);
    if (heading) return ["text-display", "text-3xl", "text-2xl", "text-xl", "text-l", "text-m"][Number(heading[1]) - 1];
    if (/(display|4xl|xxxl)/.test(n)) return "text-display";
    if (/(3xl|xxl)/.test(n)) return "text-2xl";
    if (/(2xl|-xl$|xl$)/.test(n)) return "text-xl";
    if (/(-l$|-lg$|large)/.test(n)) return "text-l";
    if (/(-xs$|xsmall)/.test(n)) return "text-xs";
    if (/(-s$|-sm$|small)/.test(n)) return "text-s";
    if (/(-m$|-md$|base|body|text$)/.test(n)) return "text-m";
    return null;
  }
  if (kind === "radius") {
    if (!/radius|round/.test(n)) return null;
    if (/(btn|button)/.test(n)) return "radius-btn";
    if (/(-s$|-sm$|small|-xs$)/.test(n)) return "radius-s";
    if (/(-l$|-lg$|-xl$|large)/.test(n)) return "radius-l";
    return "radius-m";
  }
  if (/(section|padding-block|space-section)/.test(n)) return "space-section";
  if (/(gutter|padding-inline|container-gap|section-padding-x)/.test(n)) return "gutter";
  if (!/(space|gap|spacing|pad)/.test(n)) return null;
  if (/(-xxs$|-xs$|-2xs$)/.test(n)) return "space-xs";
  if (/(-s$|-sm$)/.test(n)) return "space-s";
  if (/(-l$|-lg$)/.test(n)) return "space-l";
  if (/(-xl$|-xxl$|-2xl$)/.test(n)) return "space-xl";
  return "space-m";
}

// ─── Sizes ──────────────────────────────────────────────────────────────────

/** A length in px at a desktop width; Bricks sets html to 62.5%, so 1rem is 10px. */
export function toPx(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const v = value.trim();
  const clamp = /^clamp\(([^,]+),([^,]+),([^)]+)\)$/.exec(v);
  if (clamp) return toPx(clamp[3]);
  const m = /^(-?\d*\.?\d+)(px|rem)?$/.exec(v);
  if (!m) return null;
  return parseFloat(m[1]) * (m[2] === "rem" ? 10 : 1);
}

// ─── The engine ─────────────────────────────────────────────────────────────

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plainText = (value: unknown) => (typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim() : "");

const ROLE_NAMES: Record<string, string> = {
  section: "section", container: "container", block: "box", div: "box", heading: "title", "text-basic": "text", text: "text", "rich-text": "text",
  button: "btn", "text-link": "link", image: "media", icon: "icon", list: "list", form: "form", "icon-box": "feature", video: "video", "nav-menu": "nav", "nav-nested": "nav", accordion: "accordion", "accordion-nested": "accordion", tabs: "tabs", "tabs-nested": "tabs",
};

/** Deep-merge Bricks settings the way the cascade applies them: later controls win per property. */
function mergeStyles(target: Settings, source: Settings) {
  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("_cssCustom")) { target[key] = [target[key], value].filter(v => typeof v === "string" && v.trim()).join("\n"); continue; }
    const prev = target[key];
    if (isRecord(prev) && isRecord(value) && !("hex" in value) && !("raw" in value) && !("rgb" in value)) {
      const merged: Settings = { ...prev };
      for (const [k, v] of Object.entries(value)) merged[k] = isRecord(merged[k]) && isRecord(v) ? { ...(merged[k] as Settings), ...v } : v;
      target[key] = merged;
    } else target[key] = value;
  }
}

function readInput(input: unknown): BricksTemplate {
  const object = isRecord(input) ? input : {};
  const raw = Array.isArray(input) ? input : Array.isArray(object.content) ? object.content : Array.isArray(object.elements) ? object.elements : null;
  if (!raw) throw new Error("Paste Bricks JSON: an element list, a copied section or a template export with “content”.");
  const validation = validateBricksElements(raw);
  if (!validation.valid || !validation.elements.length) throw new Error(validation.violations[0] ?? "No usable Bricks elements found.");
  const classes = Array.isArray(object.globalClasses) ? object.globalClasses.filter((c): c is BricksGlobalClass => isRecord(c) && typeof c.id === "string") : [];
  return { content: validation.elements, source: "bricksCopiedElements", sourceUrl: "", version: "2.4.1", globalClasses: classes.map(c => ({ id: c.id, name: typeof c.name === "string" ? c.name : c.id, settings: isRecord(c.settings) ? c.settings : {} })), globalElements: [] };
}

export function modernizeTemplate(input: unknown, options: ModernizeOptions = {}): ModernizeResult {
  const source = readInput(input);
  const resolved = resolveKit(options.kit ?? {});
  const v = (name: string) => cssVar(resolved, name);
  const byId = new Map(source.content.map(el => [el.id, el]));
  const sourceClasses = new Map(source.globalClasses.map(c => [c.id, c]));
  const report: ModernizeReport = {
    elements: source.content.length, colors: [], brand: {}, fontSizes: [], spacing: 0, radii: 0, fontsReplaced: [],
    variables: { mapped: [], unknown: [] }, classes: { created: [], sourceMerged: [], sourceMissing: [] }, mobile: [], warnings: [],
  };
  const colorUse = new Map<string, { to: ColorToken | "shadow-color"; count: number }>();
  const sizeUse = new Map<string, { to: string; count: number }>();
  const fonts = new Set<string>();
  const mappedVars = new Set<string>(), unknownVars = new Set<string>();

  // Effective styles per element: source classes in order, then the element's own settings.
  const effective = new Map<string, Settings>();
  for (const el of source.content) {
    const styles: Settings = {};
    const refs = Array.isArray(el.settings._cssGlobalClasses) ? el.settings._cssGlobalClasses.filter((id): id is string => typeof id === "string") : [];
    for (const id of refs) {
      const cls = sourceClasses.get(id);
      if (!cls) { report.classes.sourceMissing.push(id); continue; }
      const own = Object.fromEntries(Object.entries(cls.settings).filter(([k]) => isStyleKey(k)));
      if (!Object.keys(own).length) { report.classes.sourceMissing.push(cls.name); continue; }
      // A class's custom CSS targets its own name; on the new class it targets %root%.
      for (const key of Object.keys(own)) if (key.startsWith("_cssCustom") && typeof own[key] === "string") own[key] = (own[key] as string).replace(new RegExp(`\\.${cls.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, "g"), "%root%");
      mergeStyles(styles, own);
      report.classes.sourceMerged.push(cls.name);
    }
    const own = Object.fromEntries(Object.entries(el.settings).filter(([k]) => isStyleKey(k)));
    const ownId = typeof el.settings._cssId === "string" ? el.settings._cssId : "";
    for (const key of Object.keys(own)) if (key.startsWith("_cssCustom") && typeof own[key] === "string") {
      own[key] = (own[key] as string).replace(new RegExp(`#(?:brxe-${el.id}${ownId ? `|${ownId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` : ""})(?![\\w-])`, "g"), "%root%");
    }
    mergeStyles(styles, own);
    effective.set(el.id, styles);
  }

  // Brand colors: the most used chromatic source colors, weighted by where they appear.
  const weights = new Map<string, { c: Rgba; w: number }>();
  const weigh = (value: unknown, w: number) => {
    const c = sourceColor(value);
    if (c && typeof c !== "string" && c.a > 0.5 && isChromatic(c)) { const key = hexOf(c); const e = weights.get(key) ?? { c, w: 0 }; e.w += w; weights.set(key, e); }
  };
  for (const [id, styles] of effective) {
    const el = byId.get(id)!;
    for (const [key, value] of Object.entries(styles)) {
      if (!isRecord(value)) continue;
      if (key.startsWith("_background")) weigh(value.color, el.name === "button" ? 5 : 2);
      if (key.startsWith("_typography")) weigh(value.color, el.name === "text-link" || el.name === "button" ? 3 : 2);
      if (key.startsWith("_border")) weigh(value.color, 1);
    }
  }
  const ranked = [...weights.values()].sort((a, b) => b.w - a.w);
  const primary = ranked[0]?.c;
  const accent = ranked.find(e => primary && hueDistance(hsl(e.c).h, hsl(primary).h) > 30)?.c;
  if (primary) report.brand.primary = hexOf(primary);
  if (accent) report.brand.accent = hexOf(accent);

  function sourceColor(value: unknown): Rgba | "primary" | "primary-soft" | "primary-hover" | "accent" | null {
    if (!isRecord(value)) return typeof value === "string" ? fromString(value) : null;
    for (const key of ["hex", "rgb", "hsl"]) if (typeof value[key] === "string") { const c = parseColor(value[key] as string); if (c) return c; }
    if (typeof value.raw === "string") return fromString(value.raw);
    return null;
  }
  function fromString(value: string): Rgba | "primary" | "primary-soft" | "primary-hover" | "accent" | null {
    const direct = parseColor(value);
    if (direct) return direct;
    const variable = /^var\(\s*(--[\w-]+)/.exec(value.trim());
    if (!variable) return null;
    if (/^--bs-/.test(variable[1])) return null;
    const mapped = colorForVariable(variable[1]);
    (mapped ? mappedVars : unknownVars).add(variable[1]);
    return mapped;
  }

  /** The token a source color becomes, by role and by the background it sits on. */
  function tokenFor(c: Rgba | "primary" | "primary-soft" | "primary-hover" | "accent", role: Role, context: Context): ColorToken | "shadow-color" {
    if (role === "shadow") return "shadow-color";
    if (typeof c === "string") {
      if (c === "primary") return role === "heading" || role === "text" || role === "icon" ? (context === "light" ? "link" : "on-inverse") : role === "border" ? "primary-edge" : "primary";
      if (c === "primary-hover") return role === "text" || role === "heading" ? "link" : "primary-hover";
      if (c === "primary-soft") return role === "text" || role === "heading" ? "on-inverse" : "primary-soft";
      return "accent";
    }
    const { h, l } = hsl(c);
    if (isChromatic(c)) {
      const brand = primary && hueDistance(h, hsl(primary).h) <= 30 ? primary : accent && hueDistance(h, hsl(accent).h) <= 30 ? accent : primary;
      const family = brand === accent && accent !== primary ? "accent" : "primary";
      const bl = brand ? hsl(brand).l : 0.5;
      if (role === "heading" || role === "text" || role === "icon") return family === "accent" ? "accent" : context === "light" ? "link" : "on-inverse";
      if (role === "border") return family === "accent" ? "accent" : "primary-edge";
      if (l > bl + 0.25 || l > 0.88) return "primary-soft";
      if (family === "primary" && l < bl - 0.1) return "primary-hover";
      return family;
    }
    // Neutrals, read as a light-mode design; a dark kit then flips them together.
    switch (role) {
      case "section-bg": return l >= 0.995 ? "bg" : l >= 0.8 ? "surface-alt" : l < 0.35 ? "inverse" : "surface-alt";
      case "bg": return l >= 0.97 ? (context === "light" ? "surface" : "on-inverse") : l >= 0.8 ? "surface-alt" : l < 0.35 ? "inverse" : "surface-alt";
      case "button-bg": return l >= 0.9 ? (context === "light" ? "surface" : context === "primary" ? "on-primary" : "on-inverse") : "inverse";
      case "button-text": return l >= 0.7 ? (context === "primary" ? "on-primary" : "on-inverse") : context === "light" ? "heading" : "inverse";
      case "border": return context !== "light" ? "inverse-muted" : l >= 0.85 ? "border" : "border-strong";
      case "heading": return l >= 0.8 ? (context === "primary" ? "on-primary" : "on-inverse") : l >= 0.55 ? (context === "light" ? "muted" : "inverse-muted") : context === "light" ? "heading" : "on-inverse";
      default: return l >= 0.8 ? (context === "primary" ? "on-primary" : "on-inverse") : l >= 0.4 ? (context === "light" ? "muted" : "inverse-muted") : context === "light" ? (role === "icon" ? "heading" : "text") : "on-inverse";
    }
  }

  function mapColor(value: unknown, role: Role, context: Context): Settings | null {
    const c = sourceColor(value);
    if (!c) return null;
    const alpha = typeof c === "string" ? 1 : c.a;
    if (alpha === 0) return { raw: "transparent" };
    const token = tokenFor(c, role, context);
    const from = typeof c === "string" ? String(isRecord(value) ? value.raw ?? c : value) : alpha < 1 ? `${hexOf(c)} ${Math.round(alpha * 100)}%` : hexOf(c);
    const use = colorUse.get(from) ?? { to: token, count: 0 };
    use.count++; colorUse.set(from, use);
    const raw = alpha < 1 && token !== "shadow-color" ? `color-mix(in srgb, ${v(token)} ${Math.round(alpha * 100)}%, transparent)` : v(token);
    return { raw };
  }

  // A neutral reference scale (Clean style at desktop): the source's hierarchy picks the step, the
  // chosen style then sets how large each step is.
  const typeSteps = ([["text-xs", 13], ["text-s", 15], ["text-m", 17], ["text-l", 21], ["text-xl", 25], ["text-2xl", 34], ["text-3xl", 46], ["text-display", 72]] as const).map(([t, px]) => ({ t, px }));
  function fontSize(value: unknown): string | null {
    if (typeof value === "string" && /var\(/.test(value)) return mapVars(value, "font");
    const px = toPx(value);
    if (px === null || px <= 0) return null;
    const step = typeSteps.reduce((best, s) => (Math.abs(Math.log(px / s.px)) < Math.abs(Math.log(px / best.px)) ? s : best));
    const key = `${Math.round(px)}px`;
    const use = sizeUse.get(key) ?? { to: `--bs-${step.t}`, count: 0 };
    use.count++; sizeUse.set(key, use);
    return v(step.t);
  }
  function space(value: unknown, where: "section-y" | "section-x" | "other"): unknown {
    if (value === "" || value === undefined || value === null) return value;
    if (typeof value === "string" && /var\(/.test(value)) return mapVars(value, "space");
    const px = toPx(value);
    if (px === null || px < 0) return value;
    if (where === "section-x" && px > 0) { report.spacing++; return v("gutter"); }
    if (px <= 4) return value;
    report.spacing++;
    if (where === "section-y" && px >= 48) return v("space-section");
    return v(px < 12 ? "space-xs" : px < 20 ? "space-s" : px < 32 ? "space-m" : px < 56 ? "space-l" : "space-xl");
  }
  function radius(value: unknown, button: boolean): unknown {
    if (value === "" || value === undefined || value === null) return value;
    if (typeof value === "string" && /var\(/.test(value)) return mapVars(value, "radius");
    if (typeof value === "string" && /%$/.test(value.trim()) && parseFloat(value) >= 50) return "999px";
    const px = toPx(value);
    if (px === null || px === 0) return value;
    report.radii++;
    if (button) return px >= 40 ? "999px" : v("radius-btn");
    if (px >= 200) return "999px";
    const steps = (["radius-s", "radius-m", "radius-l"] as const).map(t => ({ t, px: toPx(resolved.vars[t]) ?? 8 }));
    return v(steps.reduce((best, s) => (Math.abs(s.px - px) < Math.abs(best.px - px) ? s : best)).t);
  }
  /** Framework variables inside a value (e.g. calc(var(--space-m) * 2)) become BricksSnap tokens. */
  function mapVars(value: string, kind: SizeKind): string {
    return value.replace(/var\(\s*(--[\w-]+)\s*(?:,[^()]*(?:\([^()]*\)[^()]*)*)?\)/g, (match, name: string) => {
      if (name.startsWith("--bs-")) return match;
      const token = tokenForSizeVariable(name, kind);
      if (!token) { unknownVars.add(name); return match; }
      mappedVars.add(name);
      return v(token);
    });
  }
  /** Custom CSS: colors and framework variables by the property they sit in. */
  function mapCss(css: string, context: Context): string {
    return css.replace(/([\w-]+)(\s*:\s*)([^;{}]+)/g, (all, prop: string, sep: string, value: string) => {
      const p = prop.toLowerCase();
      const role: Role | null = p === "color" || p === "fill" ? "text" : /background/.test(p) ? "bg" : /shadow/.test(p) ? "shadow" : /^(border|outline|stroke)/.test(p) && !/radius|width|style/.test(p) ? "border" : null;
      let mapped = value;
      if (role) mapped = mapped.replace(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|var\(\s*--[\w-]+[^)]*\)/gi, c => (/^var\(\s*--bs-/.test(c) ? c : (mapColor(c, role, context)?.raw as string | undefined) ?? c));
      const kind: SizeKind | null = /font-size/.test(p) ? "font" : /radius/.test(p) ? "radius" : /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)/.test(p) ? "space" : null;
      if (kind) mapped = mapVars(mapped, kind);
      return `${prop}${sep}${mapped}`;
    });
  }

  // Every other color object (icon colors, form fields, gradients) by the name of its control.
  function mapNestedColors(value: unknown, keyHint: string, context: Context): unknown {
    if (Array.isArray(value)) return value.map(item => mapNestedColors(item, keyHint, context));
    if (!isRecord(value)) return value;
    if (("hex" in value || "rgb" in value || "raw" in value || "hsl" in value) && Object.keys(value).every(k => ["hex", "rgb", "raw", "hsl", "id", "name", "light", "dark"].includes(k))) {
      const role: Role = /background|bg|gradient/i.test(keyHint) ? "bg" : /border/i.test(keyHint) ? "border" : /shadow/i.test(keyHint) ? "shadow" : /icon/i.test(keyHint) ? "icon" : "text";
      return mapColor(value, role, context) ?? value;
    }
    return Object.fromEntries(Object.entries(value).map(([k, v2]) => [k, mapNestedColors(v2, `${keyHint}.${k}`, context)]));
  }

  const lightness = (value: unknown) => { const c = sourceColor(value); return c && typeof c !== "string" ? hsl(c).l : c === "primary" || c === "accent" || c === "primary-hover" ? 0.45 : c === "primary-soft" ? 0.95 : null; };

  // ── Walk the tree top-down, with the background context each element sits on.
  const out = new Map<string, { settings: Settings; styles: Settings }>();
  const visit = (el: BricksElement, context: Context) => {
    const styles = structuredClone(effective.get(el.id) ?? {});
    const settings = Object.fromEntries(Object.entries(el.settings).filter(([k]) => !isStyleKey(k) && k !== "_cssGlobalClasses"));
    const isSection = el.name === "section";
    const isButton = el.name === "button";
    const isHeading = el.name === "heading";

    // Bricks button presets (primary, secondary, outline …) become explicit brand colors.
    if (isButton) {
      const preset = typeof settings.style === "string" ? settings.style : "";
      const outline = settings.outline === true;
      delete settings.style; delete settings.size; delete settings.outline; delete settings.circle;
      const background = isRecord(styles._background) ? styles._background as Settings : {};
      const typography = isRecord(styles._typography) ? styles._typography as Settings : {};
      if (!background.color && !outline) {
        const fill = preset === "secondary" ? "accent" : preset === "dark" ? "inverse" : preset === "light" ? "surface" : "primary";
        styles._background = { ...background, color: { raw: v(fill) } };
        if (!typography.color) styles._typography = { ...typography, color: { raw: v(fill === "primary" ? "on-primary" : fill === "inverse" ? "on-inverse" : fill === "surface" ? "heading" : "on-primary") } };
      } else if (outline && !background.color) {
        styles._border = { ...(isRecord(styles._border) ? styles._border as Settings : {}), width: { top: "1px", right: "1px", bottom: "1px", left: "1px" }, style: "solid", color: { raw: v(context === "light" ? "border-strong" : "inverse-muted") } };
        if (!typography.color) styles._typography = { ...typography, color: { raw: v(context === "light" ? "heading" : "on-inverse") } };
      }
      if (!styles._padding) styles._padding = { top: "14px", right: "24px", bottom: "14px", left: "24px" };
      const border = isRecord(styles._border) ? styles._border as Settings : {};
      if (!border.radius) styles._border = { ...border, radius: { top: v("radius-btn"), right: v("radius-btn"), bottom: v("radius-btn"), left: v("radius-btn") } };
    }

    // This element's own background decides the context for its content.
    const bg = isRecord(styles._background) ? (styles._background as Settings).color : undefined;
    const bgColor = bg !== undefined ? sourceColor(bg) : null;
    let own: Context = context;
    const token = isRecord(bg) && typeof bg.raw === "string" ? /^var\(--bs-([\w-]+)/.exec(bg.raw)?.[1] : undefined;
    if (token) own = ["primary", "accent", "primary-hover"].includes(token) ? "primary" : token === "inverse" ? "dark" : "light";
    else if (bgColor) {
      const l = lightness(bg) ?? 1;
      const chroma = typeof bgColor === "string" ? bgColor !== "primary-soft" : isChromatic(bgColor);
      own = chroma && l < 0.75 ? "primary" : l < 0.4 ? "dark" : l >= 0.75 ? "light" : own;
    }
    if (!bgColor && isRecord(styles._background) && (styles._background as Settings).image && !isButton) own = context === "light" ? "dark" : context;

    for (const [key, value] of Object.entries(styles)) {
      const [control] = key.split(":");
      if (!isRecord(value) && control !== "_cssCustom" && typeof value !== "string" && typeof value !== "number") continue;
      switch (control) {
        case "_typography": {
          const t = { ...(value as Settings) };
          if (t["font-family"]) { fonts.add(String(t["font-family"])); delete t["font-family"]; delete t.fallback; }
          if (t["font-size"] !== undefined) { const size = fontSize(t["font-size"]); if (size) t["font-size"] = size; }
          if (t.color !== undefined) t.color = mapColor(t.color, isButton ? "button-text" : isHeading ? "heading" : el.name === "icon" ? "icon" : "text", own) ?? t.color;
          if (isHeading && t["font-weight"] !== undefined && Number(t["font-weight"]) >= 500) t["font-weight"] = v("heading-weight");
          styles[key] = t;
          break;
        }
        case "_background": {
          const b = { ...(value as Settings) };
          if (b.color !== undefined) b.color = mapColor(b.color, isButton ? "button-bg" : isSection ? "section-bg" : "bg", context) ?? b.color;
          styles[key] = mapNestedColors(b, key, context) as Settings;
          break;
        }
        case "_border": {
          const b = { ...(value as Settings) };
          if (b.color !== undefined) b.color = mapColor(b.color, "border", own) ?? b.color;
          if (isRecord(b.radius)) b.radius = Object.fromEntries(Object.entries(b.radius).map(([side, r]) => [side, radius(r, isButton)]));
          styles[key] = b;
          break;
        }
        case "_boxShadow": {
          const s = { ...(value as Settings) };
          if (s.color !== undefined) s.color = mapColor(s.color, "shadow", context) ?? s.color;
          styles[key] = s;
          break;
        }
        case "_padding": case "_margin": {
          if (!isRecord(value)) break;
          styles[key] = Object.fromEntries(Object.entries(value).map(([side, amount]) => [side, control === "_margin" && (amount === "auto" || toPx(amount) === 0)
            ? amount : space(amount, isSection && control === "_padding" ? (side === "top" || side === "bottom" ? "section-y" : "section-x") : "other")]));
          break;
        }
        case "_gap": case "_rowGap": case "_columnGap": case "_gridGap":
          styles[key] = space(value, "other");
          break;
        case "_cssCustom":
          if (typeof value === "string") styles[key] = mapCss(value, own);
          break;
        default:
          if (typeof value === "string" && /var\(/.test(value)) styles[key] = mapVars(value, "space");
          else if (isRecord(value)) styles[key] = mapNestedColors(value, key, own);
      }
    }

    // Element-specific controls (icon colors, form fields …) keep their place, with mapped colors.
    for (const [key, value] of Object.entries(settings)) if (isRecord(value) || Array.isArray(value)) settings[key] = mapNestedColors(value, key, own);

    // Base typography: fonts come from the design system (Bricks quotes its font-family control).
    const typography = isRecord(styles._typography) ? styles._typography as Settings : {};
    if (isHeading) {
      const size = String(typography["font-size"] ?? "");
      const lineHeight = /text-display/.test(size) ? "1.05" : /text-3xl/.test(size) ? "1.12" : /text-2xl/.test(size) ? "1.18" : "1.28";
      styles._typography = { ...typography, ...(typography["line-height"] ? {} : { "line-height": lineHeight }), ...(typography.color ? {} : { color: { raw: v(own === "light" ? "heading" : own === "primary" ? "on-primary" : "on-inverse") } }), ...(typography["font-weight"] ? {} : { "font-weight": v("heading-weight") }), ...(typography["letter-spacing"] !== undefined || typography["text-transform"] === "uppercase" ? {} : { "letter-spacing": v("heading-tracking") }) };
      styles._cssCustom = [styles._cssCustom, `%root% { font-family: ${v("font-heading")}; text-wrap: balance; overflow-wrap: anywhere; }`].filter(Boolean).join("\n");
    }
    if (el.parent === 0) {
      if (!typography.color && !isHeading) styles._typography = { ...(styles._typography as Settings ?? {}), color: { raw: v(own === "light" ? "text" : own === "primary" ? "on-primary" : "on-inverse") } };
      styles._cssCustom = [styles._cssCustom, `%root% { font-family: ${v("font-body")}; -webkit-font-smoothing: antialiased; }`].filter(Boolean).join("\n");
    }

    // ── Mobile rules, only where the source has none.
    const label = el.label || plainText(el.settings.text).slice(0, 30) || el.name;
    const hasResponsive = (control: string) => Object.keys(styles).some(k => k.startsWith(`${control}:`) && /tablet|mobile/.test(k));
    if (isSection) {
      const padding = isRecord(styles._padding) ? styles._padding as Settings : {};
      if (!padding.top && !padding.bottom) { styles._padding = { ...padding, top: v("space-section"), bottom: v("space-section") }; report.mobile.push(`Section “${label}”: vertical rhythm from --bs-space-section.`); }
      const p = styles._padding as Settings;
      if (!toPx(p.left) && !toPx(p.right) && !/var\(/.test(String(p.left ?? "") + String(p.right ?? ""))) { styles._padding = { ...p, left: v("gutter"), right: v("gutter") }; report.mobile.push(`Section “${label}”: side gutter so content never touches the screen edge.`); }
    }
    if (el.name === "container" && !styles._widthMax && !styles._width) { styles._width = "100%"; styles._widthMax = v("container"); }
    const columns = typeof styles._gridTemplateColumns === "string" ? countColumns(styles._gridTemplateColumns) : 0;
    if (styles._display === "grid" && columns >= 2 && !hasResponsive("_gridTemplateColumns")) {
      if (columns >= 3) styles["_gridTemplateColumns:tablet_portrait"] = "repeat(2, minmax(0, 1fr))";
      styles[columns >= 4 ? "_gridTemplateColumns:mobile_portrait" : "_gridTemplateColumns:mobile_landscape"] = "minmax(0, 1fr)";
      report.mobile.push(`Grid “${label}” (${columns} columns): ${columns >= 3 ? "2 columns on tablets, " : ""}1 column on phones.`);
    }
    const direction = styles._direction ?? styles._flexDirection;
    const kids = el.children.map(id => byId.get(id)).filter((c): c is BricksElement => !!c);
    if (direction === "row" && kids.length >= 2 && !hasResponsive("_direction") && !hasResponsive("_flexDirection")) {
      const actions = kids.every(k => ["button", "text-link", "icon"].includes(k.name));
      if (actions) {
        styles._flexWrap = "wrap";
        if (!styles._rowGap && !styles._gap) styles._rowGap = styles._columnGap ?? v("space-s");
        styles["_direction:mobile_portrait"] = "column"; styles["_alignItems:mobile_portrait"] = "stretch"; styles["_width:mobile_portrait"] = "100%";
        report.mobile.push(`Buttons “${label}”: wrap, and stack at full width on phones.`);
      } else if (kids.some(k => ["block", "div", "container", "image"].includes(k.name))) {
        styles["_direction:mobile_landscape"] = "column"; styles["_alignItems:mobile_landscape"] = "stretch";
        if (!styles._rowGap && !styles._gap) styles["_rowGap:mobile_landscape"] = styles._columnGap ?? v("space-m");
        report.mobile.push(`Row “${label}”: stacks on phones.`);
      }
    }
    // Rhythm: stacked content without any gap or margins gets the kit's spacing.
    const column = direction === undefined || direction === "column";
    const spaced = styles._rowGap || styles._gap || styles._gridGap || kids.some(k => { const m = effective.get(k.id)?._margin; return isRecord(m) && (toPx(m.top) || toPx(m.bottom) || /var\(/.test(String(m.top ?? "") + String(m.bottom ?? ""))); });
    if (column && styles._display !== "grid" && kids.length >= 2 && !spaced && ["container", "block", "div"].includes(el.name)) {
      styles._rowGap = v(el.name === "container" ? "space-m" : "space-s");
      report.mobile.push(`“${label}”: spacing between its ${kids.length} items from the kit.`);
    }
    for (const control of ["_width", "_widthMin"]) {
      const px = toPx(styles[control]);
      if (px !== null && px > 480 && el.parent !== 0) {
        styles._widthMax = styles._widthMax ?? `${px}px`; styles[control] = control === "_width" ? "100%" : undefined;
        if (styles[control] === undefined) delete styles[control];
        report.mobile.push(`“${label}”: fixed width ${Math.round(px)}px became a maximum, so it shrinks on small screens.`);
      }
    }
    if (typeof styles._widthMax === "string" && (toPx(styles._widthMax) ?? 0) >= 1000 && (el.name === "container" || isSection)) styles._widthMax = v("container");

    out.set(el.id, { settings, styles });
    for (const child of kids) visit(child, own);
  };
  for (const root of source.content.filter(el => el.parent === 0)) visit(root, "light");

  // ── Classes: identical styles share one class, named after the element's role.
  const firstHeading = source.content.find(el => el.name === "heading");
  const STOP = new Set(["the", "a", "an", "our", "your", "we", "why", "how", "what", "who", "meet", "get", "der", "die", "das", "ein", "eine", "unser", "unsere", "ihr", "ihre", "wir", "so", "was", "wie", "und", "and"]);
  const block = slugify(options.block ?? "").slice(0, 24) || slugify(plainText(firstHeading?.settings.text)).split("-").find(w => w.length >= 3 && !STOP.has(w))?.slice(0, 16) || "block";
  const byStyle = new Map<string, string>();
  const used = new Map<string, number>();
  const classes: BricksGlobalClass[] = [];
  const content: BricksElement[] = source.content.map(el => {
    const { settings, styles } = out.get(el.id)!;
    const clean = Object.fromEntries(Object.entries(styles).filter(([, value]) => value !== undefined && value !== ""));
    if (!Object.keys(clean).length) return { ...el, settings };
    const key = `${el.name}|${stableJson(clean)}`;
    let name = byStyle.get(key);
    if (!name) {
      const labelRole = el.label ? slugify(el.label).split("-").slice(0, 2).join("-") : "";
      const role = labelRole && labelRole !== slugify(el.name) ? labelRole : ROLE_NAMES[el.name] ?? slugify(el.name);
      const n = (used.get(role) ?? 0) + 1;
      used.set(role, n);
      name = `bs-${block}-${role}${n > 1 ? `-${n}` : ""}`;
      byStyle.set(key, name);
      // %root% in custom CSS targets the class.
      const customised = Object.fromEntries(Object.entries(clean).map(([k, value]) => [k, k.startsWith("_cssCustom") && typeof value === "string" ? value.replaceAll("%root%", `.${name}`) : value]));
      classes.push({ id: classId(name), name, settings: customised });
    }
    return { ...el, settings: { ...settings, _cssGlobalClasses: [classId(name)] } };
  });

  report.classes.created = classes.map(c => c.name);
  report.classes.sourceMerged = [...new Set(report.classes.sourceMerged)];
  report.classes.sourceMissing = [...new Set(report.classes.sourceMissing)];
  report.colors = [...colorUse].map(([from, u]) => ({ from, to: u.to, count: u.count })).sort((a, b) => b.count - a.count);
  report.fontSizes = [...sizeUse].map(([from, u]) => ({ from, to: u.to, count: u.count })).sort((a, b) => parseFloat(b.from) - parseFloat(a.from));
  report.fontsReplaced = [...fonts];
  report.variables = { mapped: [...mappedVars], unknown: [...unknownVars] };
  report.mobile = [...new Set(report.mobile)];
  if (report.classes.sourceMissing.length) report.warnings.push(`Classes without styles in the file (framework utilities such as Automatic CSS): ${report.classes.sourceMissing.slice(0, 8).join(", ")}${report.classes.sourceMissing.length > 8 ? ", …" : ""}. Their look is not included; spacing comes from BricksSnap's tokens instead.`);
  if (unknownVars.size) report.warnings.push(`Unknown variables kept as they are: ${[...unknownVars].slice(0, 8).join(", ")}. Define them on the site or replace them.`);
  if (fonts.size) report.warnings.push(`Fonts replaced by the brand kit's fonts: ${[...fonts].join(", ")}.`);
  const images = source.content.filter(el => el.name === "image" || (isRecord(el.settings._background) && isRecord((el.settings._background as Settings).image))).length;
  if (images) report.warnings.push(`${images} images keep their source URLs. Replace them or import them into the media library before publishing.`);

  const template: BricksTemplate = { content, source: "bricksCopiedElements", sourceUrl: "", version: "2.4.1", globalClasses: classes, globalElements: [] };
  return { template, source, resolved, designSystem: designSystemFor(resolved), report, quality: qualityChecks(resolved, content, options.lang ?? "en", false), block };
}

/** Columns in a grid-template-columns value: repeat(3, …), "1fr 1fr 2fr", minmax(…) … */
function countColumns(value: string): number {
  const repeat = /^repeat\(\s*(\d+)\s*,/.exec(value.trim());
  if (repeat) return Number(repeat[1]);
  const tracks = value.trim().replace(/\([^()]*(?:\([^()]*\)[^()]*)*\)/g, "x").split(/\s+/).filter(Boolean);
  return tracks.length;
}
