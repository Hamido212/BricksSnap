import { contrast, ensureContrast, mix, normalizeHex, readable, rgba } from "./color";

/**
 * The brand kit: the few choices a user makes. Everything else (colors, type and space scales,
 * component styles) is derived from it and stored in Bricks as variables, a palette and classes.
 */
export const STYLE_IDS = ["clean", "soft", "bold", "editorial", "warm"] as const;
export type StyleId = typeof STYLE_IDS[number];
export const FONT_PAIR_IDS = ["inter", "jakarta", "grotesk", "fraunces", "bitter", "dmsans", "playfair", "outfit", "system"] as const;
export type FontPairId = typeof FONT_PAIR_IDS[number];
export const RADIUS_IDS = ["none", "small", "medium", "large", "round"] as const;
export type RadiusId = typeof RADIUS_IDS[number];
export const SPACING_IDS = ["compact", "normal", "airy"] as const;
export type SpacingId = typeof SPACING_IDS[number];
export type Mode = "light" | "dark";
export type Language = "de" | "en";

export type BrandKit = {
  style: StyleId;
  primary: string;
  /** Optional second brand color for highlights; defaults to the primary. */
  accent?: string;
  fonts: FontPairId;
  radius: RadiusId;
  spacing: SpacingId;
  mode: Mode;
};

type Font = { family: string; fallback: string };
export type FontPair = { label: string; heading: Font; body: Font };

const SANS = "system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, sans-serif";
const SERIF = "Georgia, \"Times New Roman\", serif";

export const FONT_PAIRS: Record<FontPairId, FontPair> = {
  inter: { label: "Inter", heading: { family: "Inter", fallback: SANS }, body: { family: "Inter", fallback: SANS } },
  jakarta: { label: "Plus Jakarta Sans", heading: { family: "Plus Jakarta Sans", fallback: SANS }, body: { family: "Plus Jakarta Sans", fallback: SANS } },
  grotesk: { label: "Space Grotesk + Inter", heading: { family: "Space Grotesk", fallback: SANS }, body: { family: "Inter", fallback: SANS } },
  fraunces: { label: "Fraunces + Inter", heading: { family: "Fraunces", fallback: SERIF }, body: { family: "Inter", fallback: SANS } },
  bitter: { label: "Bitter + Source Sans 3", heading: { family: "Bitter", fallback: SERIF }, body: { family: "Source Sans 3", fallback: SANS } },
  dmsans: { label: "DM Sans", heading: { family: "DM Sans", fallback: SANS }, body: { family: "DM Sans", fallback: SANS } },
  playfair: { label: "Playfair Display + Source Sans 3", heading: { family: "Playfair Display", fallback: SERIF }, body: { family: "Source Sans 3", fallback: SANS } },
  outfit: { label: "Outfit", heading: { family: "Outfit", fallback: SANS }, body: { family: "Outfit", fallback: SANS } },
  system: { label: "System fonts (no web fonts)", heading: { family: "", fallback: SANS }, body: { family: "", fallback: SANS } },
};

/** A CSS font-family value: the quoted web font first, then its fallbacks. */
export const fontStack = (font: Font) => (font.family ? `"${font.family}", ${font.fallback}` : font.fallback);

export type Eyebrow = "text" | "pill" | "rule" | "italic" | "dot";
export type CardStyle = "border" | "tint" | "strong" | "rule" | "warm";
type Neutral = "slate" | "zinc" | "stone";

export type StyleDefinition = {
  label: Record<Language, string>;
  description: Record<Language, string>;
  fonts: FontPairId;
  radius: RadiusId;
  spacing: SpacingId;
  neutral: Neutral;
  headingWeight: number;
  headingTracking: string;
  displayScale: number;
  eyebrow: Eyebrow;
  card: CardStyle;
  pillButtons: boolean;
  /** Warm, slightly tinted page background instead of white. */
  warmCanvas: boolean;
  container: number;
  /** A sample primary color that shows the direction at its best. */
  samplePrimary: string;
};

export const STYLES: Record<StyleId, StyleDefinition> = {
  clean: {
    label: { de: "Klar", en: "Clean" },
    description: { de: "Präzise, ruhig, mit feinen Linien", en: "Precise and quiet with hairline borders" },
    fonts: "inter", radius: "medium", spacing: "normal", neutral: "slate", headingWeight: 600, headingTracking: "-0.025em",
    displayScale: 1, eyebrow: "text", card: "border", pillButtons: false, warmCanvas: false, container: 1200, samplePrimary: "#2563eb",
  },
  soft: {
    label: { de: "Freundlich", en: "Soft" },
    description: { de: "Rund, hell und nahbar", en: "Rounded, airy and approachable" },
    fonts: "jakarta", radius: "large", spacing: "airy", neutral: "zinc", headingWeight: 700, headingTracking: "-0.02em",
    displayScale: 1, eyebrow: "pill", card: "tint", pillButtons: true, warmCanvas: false, container: 1200, samplePrimary: "#7c3aed",
  },
  bold: {
    label: { de: "Kräftig", en: "Bold" },
    description: { de: "Kontrastreich, große Typografie", en: "High contrast with large type" },
    fonts: "grotesk", radius: "small", spacing: "normal", neutral: "zinc", headingWeight: 700, headingTracking: "-0.035em",
    displayScale: 1.15, eyebrow: "rule", card: "strong", pillButtons: false, warmCanvas: false, container: 1280, samplePrimary: "#ea580c",
  },
  editorial: {
    label: { de: "Elegant", en: "Editorial" },
    description: { de: "Serifen, viel Weißraum, zurückhaltend", en: "Serif headings, generous whitespace" },
    fonts: "fraunces", radius: "none", spacing: "airy", neutral: "stone", headingWeight: 500, headingTracking: "-0.015em",
    displayScale: 1.05, eyebrow: "italic", card: "rule", pillButtons: false, warmCanvas: true, container: 1120, samplePrimary: "#1f4d3a",
  },
  warm: {
    label: { de: "Warm", en: "Warm" },
    description: { de: "Bodenständig und vertrauenswürdig, ideal für Handwerk und lokale Betriebe", en: "Grounded and trustworthy, made for trades and local businesses" },
    fonts: "bitter", radius: "medium", spacing: "normal", neutral: "stone", headingWeight: 700, headingTracking: "-0.01em",
    displayScale: 1, eyebrow: "dot", card: "warm", pillButtons: false, warmCanvas: true, container: 1200, samplePrimary: "#b45309",
  },
};

const NEUTRALS: Record<Neutral, Record<number, string>> = {
  slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" },
  zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" },
  stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" },
};

export const COLOR_TOKENS = ["primary", "primary-hover", "on-primary", "primary-soft", "primary-edge", "link", "accent", "bg", "surface", "surface-alt", "text", "heading", "muted", "border", "border-strong", "inverse", "on-inverse", "inverse-muted"] as const;
export type ColorToken = typeof COLOR_TOKENS[number];

const RADII: Record<RadiusId, { s: number; m: number; l: number; btn: number }> = {
  none: { s: 0, m: 0, l: 0, btn: 0 },
  small: { s: 4, m: 6, l: 8, btn: 6 },
  medium: { s: 6, m: 12, l: 16, btn: 8 },
  large: { s: 10, m: 20, l: 28, btn: 14 },
  round: { s: 12, m: 24, l: 32, btn: 999 },
};

const SECTION_SPACE: Record<SpacingId, string> = {
  compact: "clamp(56px, 40px + 4vw, 88px)",
  normal: "clamp(72px, 48px + 6vw, 128px)",
  airy: "clamp(88px, 56px + 8vw, 160px)",
};

export type ResolvedKit = {
  kit: BrandKit;
  style: StyleDefinition;
  fonts: FontPair;
  colors: Record<ColorToken, string>;
  /** Non-color variables (name without --bs-) → CSS value. */
  vars: Record<string, string>;
};

export const DEFAULT_KIT: BrandKit = { style: "clean", primary: STYLES.clean.samplePrimary, fonts: "inter", radius: "medium", spacing: "normal", mode: "light" };

/** Defaults of a style direction, keeping the user's brand color and mode. */
export function kitForStyle(style: StyleId, current?: Partial<BrandKit>): BrandKit {
  const s = STYLES[style];
  return { style, primary: current?.primary ?? s.samplePrimary, ...(current?.accent ? { accent: current.accent } : {}), fonts: s.fonts, radius: s.radius, spacing: s.spacing, mode: current?.mode ?? "light" };
}

/** Accepts partial or foreign input (URL, MCP arguments) and returns a complete, valid kit. */
export function normalizeKit(input: Partial<BrandKit> = {}): BrandKit {
  const style = STYLE_IDS.includes(input.style as StyleId) ? input.style as StyleId : DEFAULT_KIT.style;
  const base = kitForStyle(style);
  const accent = normalizeHex(input.accent);
  return {
    style,
    primary: normalizeHex(input.primary) ?? base.primary,
    ...(accent ? { accent } : {}),
    fonts: FONT_PAIR_IDS.includes(input.fonts as FontPairId) ? input.fonts as FontPairId : base.fonts,
    radius: RADIUS_IDS.includes(input.radius as RadiusId) ? input.radius as RadiusId : base.radius,
    spacing: SPACING_IDS.includes(input.spacing as SpacingId) ? input.spacing as SpacingId : base.spacing,
    mode: input.mode === "dark" ? "dark" : "light",
  };
}

export function resolveKit(input: Partial<BrandKit>): ResolvedKit {
  const kit = normalizeKit(input);
  const style = STYLES[kit.style];
  const n = NEUTRALS[style.neutral];
  const dark = kit.mode === "dark";
  const bg = dark ? n[950] : style.warmCanvas ? n[50] : "#ffffff";
  const surfaceAlt = dark ? n[900] : kit.style === "soft" ? mix(kit.primary, "#ffffff", 0.95) : style.warmCanvas ? n[100] : n[50];
  const surface = dark ? n[900] : "#ffffff";
  const heading = dark ? n[50] : n[900];
  // Brand color for filled buttons; lifted on dark pages when it would disappear.
  const primary = dark && contrast(kit.primary, bg) < 3 ? ensureContrast(kit.primary, bg, 3) : kit.primary;
  const onPrimary = readable(primary, ["#ffffff", n[950]]);
  const link = ensureContrast(primary, bg, 4.5);
  const accentBase = kit.accent ?? primary;
  const colors: Record<ColorToken, string> = {
    primary,
    "primary-hover": mix(primary, dark ? "#ffffff" : "#000000", 0.14),
    "on-primary": onPrimary,
    "primary-soft": mix(primary, bg, dark ? 0.82 : 0.9),
    // Light brand colors keep their fill; the edge is darkened until buttons stand out (3:1).
    "primary-edge": ensureContrast(primary, bg, 3),
    link,
    accent: ensureContrast(accentBase, bg, 3),
    bg,
    surface,
    "surface-alt": surfaceAlt,
    text: dark ? n[300] : n[700],
    heading,
    muted: ensureContrast(dark ? n[400] : n[500], surfaceAlt, 4.5),
    border: dark ? n[800] : n[200],
    "border-strong": dark ? n[700] : n[300],
    inverse: dark ? n[100] : n[900],
    "on-inverse": dark ? n[900] : n[50],
    "inverse-muted": dark ? n[600] : n[400],
  };
  const radius = RADII[kit.radius];
  const btn = style.pillButtons && kit.radius !== "none" ? 999 : radius.btn;
  const fonts = FONT_PAIRS[kit.fonts];
  const scale = style.displayScale;
  const vars: Record<string, string> = {
    "font-heading": fontStack(fonts.heading),
    "font-body": fontStack(fonts.body),
    "heading-weight": String(style.headingWeight),
    "heading-tracking": style.headingTracking,
    "text-xs": "13px",
    "text-s": "15px",
    "text-m": "17px",
    "text-l": "clamp(18px, 16.5px + 0.4vw, 21px)",
    "text-xl": "clamp(20px, 17.5px + 0.7vw, 25px)",
    "text-2xl": "clamp(24px, 19px + 1.3vw, 34px)",
    "text-3xl": `clamp(${Math.round(30 * scale)}px, ${Math.round(22 * scale)}px + ${(2.3 * scale).toFixed(1)}vw, ${Math.round(46 * scale)}px)`,
    "text-display": `clamp(${Math.round(38 * scale)}px, ${Math.round(24 * scale)}px + ${(4.2 * scale).toFixed(1)}vw, ${Math.round(72 * scale)}px)`,
    "space-xs": "8px",
    "space-s": "16px",
    "space-m": "24px",
    "space-l": "clamp(32px, 24px + 2vw, 48px)",
    "space-xl": "clamp(48px, 32px + 4vw, 80px)",
    "space-card": "clamp(22px, 18px + 1vw, 32px)",
    "space-section": SECTION_SPACE[kit.spacing],
    gutter: "clamp(20px, 4vw, 40px)",
    container: `${style.container}px`,
    "radius-s": `${radius.s}px`,
    "radius-m": `${radius.m}px`,
    "radius-l": `${radius.l}px`,
    "radius-btn": `${btn}px`,
    "shadow-color": rgba(n[900], dark ? 0.5 : 0.12),
  };
  return { kit, style, fonts, colors, vars };
}

/** `var(--bs-name, fallback)`: works with the design system installed and without it. */
export function cssVar(r: ResolvedKit, name: string): string {
  const value = (r.colors as Record<string, string>)[name] ?? r.vars[name];
  if (value === undefined) throw new Error(`Unknown design token ${name}`);
  return `var(--bs-${name}, ${value})`;
}

export type ContrastCheck = { pair: string; ratio: number; required: number; ok: boolean };

/** WCAG checks for the pairs the templates use. */
export function contrastChecks(r: ResolvedKit): ContrastCheck[] {
  const c = r.colors;
  const pairs: Array<[string, string, string, number]> = [
    ["Text on page", c.text, c.bg, 4.5],
    ["Muted text on page", c.muted, c.bg, 4.5],
    ["Muted text on alternate band", c.muted, c["surface-alt"], 4.5],
    ["Headings on page", c.heading, c.bg, 4.5],
    ["Links and eyebrows on page", c.link, c.bg, 4.5],
    ["Button text on primary", c["on-primary"], c.primary, 4.5],
    ["Text on dark band", c["on-inverse"], c.inverse, 4.5],
    ["Button edges against page", c["primary-edge"], c.bg, 3],
  ];
  return pairs.map(([pair, fg, bg, required]) => {
    const ratio = Math.round(contrast(fg, bg) * 100) / 100;
    return { pair, ratio, required, ok: ratio >= required };
  });
}
