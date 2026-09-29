import type { ClassLibrary, Settings } from "./build";
import { cssVar, type ResolvedKit } from "./tokens";

/** Helpers that write Bricks control values with `var(--bs-…, fallback)`. */
export function sx(r: ResolvedKit) {
  const isToken = (name: string) => name in r.vars || name in r.colors;
  const v = (name: string) => cssVar(r, name);
  const val = (value: string) => (isToken(value) ? v(value) : value);
  const color = (name: string) => ({ raw: v(name) });
  const sides = (value: string) => ({ top: value, right: value, bottom: value, left: value });
  return {
    v,
    color,
    sides,
    pad: (top: string, right = top, bottom = top, left = right): Settings => ({ _padding: { top: val(top), right: val(right), bottom: val(bottom), left: val(left) } }),
    /** Border lines (width, style, color) without the radius, so line and radius can live in different classes. */
    line: (width: string, colorName: string | null, style = "solid"): Settings => ({ _border: { width: sides(width), style, color: colorName ? color(colorName) : { raw: "currentColor" } } }),
    round: (value: string): Settings => ({ _border: { radius: sides(val(value)) } }),
    bg: (name: string): Settings => ({ _background: { color: name === "transparent" ? { raw: "transparent" } : color(name) } }),
    type: (o: { size?: string; weight?: string; lh?: string; ls?: string; color?: string; transform?: string; align?: string; style?: string; decoration?: string }): Settings => ({
      _typography: {
        ...(o.size ? { "font-size": val(o.size) } : {}),
        ...(o.weight ? { "font-weight": val(o.weight) } : {}),
        ...(o.lh ? { "line-height": o.lh } : {}),
        ...(o.ls ? { "letter-spacing": val(o.ls) } : {}),
        ...(o.color ? { color: o.color === "inherit" || o.color === "currentColor" ? { raw: o.color } : color(o.color) } : {}),
        ...(o.transform ? { "text-transform": o.transform } : {}),
        ...(o.align ? { "text-align": o.align } : {}),
        ...(o.style ? { "font-style": o.style } : {}),
        ...(o.decoration ? { "text-decoration": o.decoration } : {}),
      },
    }),
    /** Font families come from custom CSS: Bricks quotes its font-family control, which breaks var(). */
    font: (className: string, which: "heading" | "body", extra = ""): Settings => ({ _cssCustom: `.${className} { font-family: ${v(`font-${which}`)};${extra} }` }),
    // Bricks 2.4 reads this object form; the array form renders as "0 0 0 0 transparent".
    shadow: (offsetY: string, blur: string, spread: string): Settings => ({ _boxShadow: { values: { offsetX: "0", offsetY, blur, spread }, color: { raw: v("shadow-color") } } }),
  };
}

/** Merge Bricks settings, joining custom CSS and deep-merging object controls (border, typography). */
export function merge(...parts: Settings[]): Settings {
  const out: Settings = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      const prev = out[key];
      if (key.startsWith("_cssCustom") && typeof prev === "string" && typeof value === "string") out[key] = `${prev}\n${value}`;
      else if (prev && value && typeof prev === "object" && typeof value === "object" && !Array.isArray(prev) && !Array.isArray(value)) out[key] = { ...(prev as Settings), ...(value as Settings) };
      else out[key] = value;
    }
  }
  return out;
}

/**
 * Classes every section shares. Each CSS property is set by exactly one class per group
 * (surface, spacing, size, variant), so the result never depends on the order in which a site
 * outputs its global classes.
 */
export function baseClasses(r: ResolvedKit): ClassLibrary {
  const x = sx(r);
  const { v } = x;
  const style = r.style;
  const headingBase = (className: string) => merge(x.type({ weight: "heading-weight", ls: "heading-tracking", color: "heading" }), { _margin: { top: "0", bottom: "0" } }, x.font(className, "heading", " text-wrap: balance;"));

  const eyebrow: Record<typeof style.eyebrow, Settings> = {
    text: x.type({ size: "text-xs", weight: "600", ls: "0.12em", transform: "uppercase", color: "link" }),
    pill: merge(x.type({ size: "text-xs", weight: "600", ls: "0.02em", color: "link" }), x.bg("primary-soft"), x.pad("6px", "12px"), x.round("999px"), { _display: "inline-flex" }),
    rule: merge(x.type({ size: "text-xs", weight: "700", ls: "0.14em", transform: "uppercase", color: "heading" }), { _display: "inline-flex", _alignItems: "center", _cssCustom: `.bs-eyebrow { gap: 12px; }\n.bs-eyebrow::before { content: ""; width: 28px; height: 2px; background: ${v("primary")}; }` }),
    italic: merge(x.type({ size: "text-m", weight: "400", style: "italic", color: "link" }), x.font("bs-eyebrow", "heading")),
    dot: merge(x.type({ size: "text-s", weight: "600", color: "link" }), { _display: "inline-flex", _alignItems: "center", _cssCustom: `.bs-eyebrow { gap: 10px; }\n.bs-eyebrow::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: ${v("primary")}; }` }),
  };

  const card: Record<typeof style.card, Settings> = {
    border: merge(x.bg("surface"), x.line("1px", "border"), x.round("radius-m"), { "_border:hover": { color: x.color("border-strong") } }),
    tint: merge(x.bg("surface"), x.round("radius-m"), x.shadow("14px", "40px", "-18px")),
    strong: merge(x.bg("surface"), x.line("1.5px", "border-strong"), x.round("radius-m"), { "_border:hover": { color: x.color("heading") }, "_transform:hover": { translateY: "-3px" } }),
    rule: { _background: { color: { raw: "transparent" } }, _border: { width: { top: "1px", right: "0", bottom: "0", left: "0" }, style: "solid", color: x.color("heading") } },
    warm: merge(x.bg("surface"), x.line("1px", "border"), x.round("radius-m"), x.shadow("1px", "2px", "0")),
  };
  const cardPad = style.card === "rule" ? x.pad("space-m", "0", "0", "0") : x.pad("space-card");
  const btnWeight = style.headingWeight >= 600 ? "600" : "500";

  // Empty marker classes: hooks for styling all sections of one kind in Bricks.
  const markers = Object.fromEntries(["bs-hero", "bs-services", "bs-features", "bs-pricing", "bs-footer"].map(name => [name, {}]));
  return {
    ...markers,
    // Band: typography base. Exactly one surface class and one space class per section.
    "bs-section": merge(x.type({ size: "text-m", lh: "1.65" }), { _width: "100%" }, x.font("bs-section", "body", " -webkit-font-smoothing: antialiased;")),
    "bs-surface--page": merge(x.bg("bg"), x.type({ color: "text" })),
    "bs-surface--alt": merge(x.bg("surface-alt"), x.type({ color: "text" })),
    "bs-surface--inverse": merge(x.bg("inverse"), x.type({ color: "on-inverse" }), {
      _cssCustom: `.bs-surface--inverse :is(.bs-title, .bs-card__title, .bs-stat__value, .bs-quote__text, .bs-eyebrow, .bs-price, .bs-brand, .bs-info__value) { color: ${v("on-inverse")}; }\n.bs-surface--inverse :is(.bs-lead, .bs-small, .bs-card__text, .bs-stat__label, .bs-quote__meta, .bs-nav__link, .bs-info__label) { color: ${v("inverse-muted")}; }\n.bs-surface--inverse .bs-card { background: transparent; border-color: ${v("inverse-muted")}; box-shadow: none; }`,
    }),
    "bs-surface--primary": merge(x.bg("primary"), x.type({ color: "on-primary" }), {
      _cssCustom: `.bs-surface--primary :is(.bs-title, .bs-lead, .bs-eyebrow, .bs-small, .bs-card__title, .bs-card__text, .bs-stat__value, .bs-stat__label) { color: ${v("on-primary")}; }\n.bs-surface--primary :is(.bs-lead, .bs-small, .bs-stat__label) { opacity: 0.88; }\n.bs-surface--primary .bs-eyebrow { background: transparent; }\n.bs-surface--primary .bs-eyebrow::before { background: currentColor; }`,
    }),
    "bs-space--section": x.pad("space-section", "gutter"),
    "bs-space--tight": x.pad("space-l", "gutter"),
    "bs-space--bar": x.pad("16px", "gutter"),
    "bs-space--micro": x.pad("8px", "gutter"),

    "bs-container": { _width: "100%", _widthMax: v("container"), _rowGap: v("space-l"), _margin: { left: "auto", right: "auto" } },
    "bs-intro": { _display: "flex", _direction: "column", _rowGap: v("space-s"), _widthMax: "760px", _alignItems: "flex-start" },
    "bs-intro--center": merge({ _display: "flex", _direction: "column", _rowGap: v("space-s"), _widthMax: "760px", _alignItems: "center", _alignSelf: "center", _margin: { left: "auto", right: "auto" } }, x.type({ align: "center" })),
    "bs-eyebrow": merge(eyebrow[style.eyebrow], { _margin: { top: "0", bottom: "0" } }),

    // Headings: bs-title plus exactly one size class.
    "bs-title": headingBase("bs-title"),
    "bs-size--display": x.type({ size: "text-display", lh: "1.04" }),
    "bs-size--xl": x.type({ size: "text-3xl", lh: "1.12" }),
    "bs-size--l": x.type({ size: "text-2xl", lh: "1.18" }),
    "bs-size--s": x.type({ size: "text-xl", lh: "1.28" }),

    "bs-lead": merge(x.type({ size: "text-l", lh: "1.6", color: "muted" }), { _margin: { top: "0", bottom: "0" }, _widthMax: "640px", _cssCustom: ".bs-lead { text-wrap: pretty; }" }),
    "bs-text": merge(x.type({ color: "text" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-small": merge(x.type({ size: "text-s", lh: "1.55", color: "muted" }), { _margin: { top: "0", bottom: "0" } }),

    "bs-btn-row": { _display: "flex", _direction: "row", _flexWrap: "wrap", _alignItems: "center", _columnGap: "12px", _rowGap: "12px" },
    // Buttons: bs-btn (shape and type), exactly one size and exactly one variant (colors and border line).
    "bs-btn-size--m": merge(x.pad("14px", "24px"), x.type({ size: "16px" })),
    "bs-btn-size--s": merge(x.pad("10px", "18px"), x.type({ size: "15px" })),
    "bs-btn": merge(x.round("radius-btn"), x.type({ weight: btnWeight, lh: "1.2", ls: "0", decoration: "none" }), {
      _cssTransition: "background-color .2s ease, border-color .2s ease, color .2s ease, transform .2s ease",
      "_transform:hover": { translateY: "-1px" },
    }),
    "bs-btn--primary": merge(x.bg("primary"), x.line("1px", "primary-edge"), x.type({ color: "on-primary" }), { "_background:hover": { color: x.color("primary-hover") }, "_border:hover": { color: x.color("primary-hover") } }),
    "bs-btn--secondary": merge(x.bg("transparent"), x.line(style.card === "strong" ? "1.5px" : "1px", style.card === "strong" ? "heading" : "border-strong"), x.type({ color: "heading" }), { "_background:hover": { color: x.color("surface-alt") } }),
    "bs-btn--on-dark": merge(x.bg("on-inverse"), x.line("1px", "on-inverse"), x.type({ color: "inverse" })),
    "bs-btn--on-primary": merge(x.bg("on-primary"), x.line("1px", "on-primary"), x.type({ color: "primary" })),
    "bs-btn--ghost": merge(x.bg("transparent"), x.line("1px", null), x.type({ color: "inherit" })),
    "bs-link": merge(x.type({ size: "text-m", weight: "600", color: "link", decoration: "none" }), { _cssCustom: ".bs-link:hover { text-decoration: underline; text-underline-offset: 4px; }" }),

    // Grids: bs-grid plus exactly one column class.
    "bs-grid": { _display: "grid", _gridGap: v("space-m"), _width: "100%" },
    "bs-cols--2": { _gridTemplateColumns: "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)" },
    "bs-cols--3": { _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)" },
    "bs-cols--4": { _gridTemplateColumns: "repeat(4, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_portrait": "minmax(0, 1fr)" },
    "bs-split": { _display: "grid", _gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: v("space-xl"), _alignItems: "center", _width: "100%" },
    "bs-stack": { _display: "flex", _direction: "column", _rowGap: v("space-m"), _alignItems: "flex-start", _width: "100%" },

    "bs-card": merge(card[style.card], cardPad, { _display: "flex", _direction: "column", _rowGap: "12px", _alignItems: "flex-start", _cssTransition: "border-color .2s ease, transform .2s ease, box-shadow .2s ease" }),
    "bs-card__icon": merge(x.type({ size: "24px", color: "link" }), x.bg("primary-soft"), x.round("radius-s"), { _display: "inline-flex", _alignItems: "center", _justifyContent: "center", _width: "48px", _height: "48px", _flexShrink: "0" }),
    "bs-card__title": merge(headingBase("bs-card__title"), x.type({ size: "text-xl", lh: "1.3" })),
    "bs-card__text": merge(x.type({ size: "text-s", lh: "1.6", color: "muted" }), { _margin: { top: "0", bottom: "0" } }),

    // Images: bs-media plus exactly one ratio class.
    "bs-media": merge(x.round("radius-l"), { _width: "100%", _objectFit: "cover", _overflow: "hidden" }),
    "bs-ratio--4x3": { _aspectRatio: "4/3" },
    "bs-ratio--16x10": { _aspectRatio: "16/10" },
    "bs-ratio--4x5": { _aspectRatio: "4/5" },
    "bs-ratio--1x1": { _aspectRatio: "1/1" },
    "bs-ratio--hero": { _aspectRatio: "4/5", "_aspectRatio:tablet_portrait": "16/10" },
    "bs-align--center": { _alignItems: "center" },

    "bs-badge": merge(x.type({ size: "text-xs", weight: "600", color: "link" }), x.bg("primary-soft"), x.pad("4px", "10px"), x.round("999px"), { _display: "inline-flex" }),
    "bs-checklist": { _display: "flex", _direction: "column", _rowGap: "10px", _width: "100%" },
    "bs-check": { _display: "flex", _direction: "row", _columnGap: "10px", _alignItems: "flex-start" },
    "bs-check__icon": merge(x.type({ size: "20px", color: "link" }), { _flexShrink: "0", _margin: { top: "3px" } }),
  };
}
