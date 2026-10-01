import { button, container, div, heading, icon, image, node, section, text, textLink, type ClassLibrary, type KitNode } from "../build";
import type { Content, Link } from "../content";
import { PHOTOS, type PhotoKey } from "../images";
import type { IconKey } from "../icons";
import { merge, sx } from "../styles";
import type { Language, ResolvedKit } from "../tokens";

export const SECTION_TYPES = [
  "navbar", "hero", "services", "features", "steps", "stats", "pricing", "testimonials", "team", "portfolio",
  "timeline", "content", "faq", "blog", "logos", "gallery", "cta", "contact", "footer", "login", "404", "coming-soon",
] as const;
export type SectionType = typeof SECTION_TYPES[number];

export type Ctx = { r: ResolvedKit; c: Content; x: ReturnType<typeof sx> };

export type Variant = {
  type: SectionType;
  id: string;
  name: Record<Language, string>;
  build: (ctx: Ctx) => KitNode;
  /** Section-specific classes; shared ones come from baseClasses. */
  classes?: (r: ResolvedKit) => ClassLibrary;
};

export type Surface = "page" | "alt" | "inverse" | "primary";
export type Space = "section" | "tight" | "bar" | "micro";

/** A full-width band with its container: section.bs-section.bs-surface--*.bs-space--* > .bs-container */
export function band(o: { surface: Surface; space?: Space; label: string; id?: string; classes?: string; containerClasses?: string; settings?: Record<string, unknown> }, children: Array<KitNode | false | null | undefined>): KitNode {
  const classes = ["bs-section", `bs-surface--${o.surface}`, `bs-space--${o.space ?? "section"}`, o.classes ?? ""].join(" ");
  return section(classes, [container(["bs-container", o.containerClasses ?? ""].join(" ").trim(), children)], o.label, { ...(o.id ? { _cssId: o.id } : {}), ...(o.settings ?? {}) });
}

/** Eyebrow, title and lead. */
export function intro(o: { eyebrow?: string; title: string; lead?: string; center?: boolean; tag?: "h1" | "h2"; size?: "display" | "xl" | "l" }): KitNode {
  return div(o.center ? "bs-intro--center" : "bs-intro", [
    o.eyebrow ? text(o.eyebrow, "bs-eyebrow") : null,
    heading(o.tag ?? "h2", o.title, `bs-title bs-size--${o.size ?? "xl"}`),
    o.lead ? text(o.lead, "bs-lead") : null,
  ], "Intro");
}

export type ButtonTone = "page" | "inverse" | "primary";
/** Primary and secondary action, styled for the band they sit on. */
export function actions(links: Array<Link | undefined>, tone: ButtonTone = "page", size: "m" | "s" = "m"): KitNode {
  const [first, second] = links;
  const primary = tone === "inverse" ? "bs-btn--on-dark" : tone === "primary" ? "bs-btn--on-primary" : "bs-btn--primary";
  const secondary = tone === "page" ? "bs-btn--secondary" : "bs-btn--ghost";
  return div("bs-btn-row", [
    first ? button(first.label, first.href, `bs-btn bs-btn-size--${size} ${primary}`) : null,
    second ? button(second.label, second.href, `bs-btn bs-btn-size--${size} ${secondary}`) : null,
  ], "Buttons");
}

export function checklist(points: string[], textClass = "bs-small"): KitNode {
  return div("bs-checklist", points.map(point => div("bs-check", [icon("checkmark-circle", "bs-check__icon"), text(point, textClass)])), "Checklist");
}

export function iconCard(item: { icon: IconKey; title: string; text: string }, extra?: KitNode | null): KitNode {
  return div("bs-card", [icon(item.icon, "bs-card__icon"), heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text"), extra ?? null], item.title);
}

export function photo(ctx: Ctx, key: PhotoKey, ratio: "4x3" | "16x10" | "4x5" | "1x1" | "hero", classes = ""): KitNode {
  const p = PHOTOS[key];
  return image(p.url, p.alt[ctx.c.lang], `bs-media bs-ratio--${ratio} ${classes}`.trim());
}

/** Five star icons as one row. */
export function stars(): KitNode {
  return div("bs-stars", Array.from({ length: 5 }, () => icon("star", "bs-stars__icon")), "Rating");
}

/** Wraps a label/value pair such as "Phone: …". */
export function infoRow(iconKey: IconKey, label: string, value: string, href?: string): KitNode {
  return div("bs-info", [
    icon(iconKey, "bs-info__icon"),
    div("bs-info__body", [text(label, "bs-info__label"), href ? textLink(value, href, "bs-info__value") : text(value, "bs-info__value")]),
  ], label);
}

/**
 * Bricks' nested tabs: a tab menu and one pane per tab. Bricks marks the parts through _hidden
 * classes (tab-menu, tab-title, tab-content, tab-pane) and its script opens a tab with brx-open, so
 * pane classes never set display. The look is "pill" (a switch) or "line" (underlined tabs).
 */
export function tabs(look: "pill" | "line", items: Array<{ label: string; pane: KitNode }>, label: string): KitNode {
  return node("tabs-nested", "bs-tabs", {}, [
    node("block", `bs-tabs__menu bs-tabs__menu--${look}`, { _hidden: { _cssClasses: "tab-menu" } }, items.map(item => node("div", `bs-tabs__title bs-tabs__title--${look}`, { _hidden: { _cssClasses: "tab-title" } }, [text(item.label, "bs-tabs__label", "span")], "Tab")), "Tab menu"),
    node("block", "bs-tabs__content", { _hidden: { _cssClasses: "tab-content" } }, items.map(item => node("block", "bs-tabs__pane", { _hidden: { _cssClasses: "tab-pane" } }, [item.pane], "Pane")), "Tab content"),
  ], label);
}

/** Bricks' nested accordion with FAQ schema; Bricks' script opens an item (brx-open), so content never sets display. */
export function accordion(items: Array<{ title: string; body: KitNode[] }>, label: string): KitNode {
  return node("accordion-nested", "bs-acc", { faqSchema: true }, items.map(item => node("block", "bs-acc__item", {}, [
    node("block", "bs-acc__title", { _hidden: { _cssClasses: "accordion-title-wrapper" } }, [heading("h3", item.title, "bs-acc__q"), icon("add", "bs-acc__icon")], "Title"),
    node("block", "bs-acc__content", { _hidden: { _cssClasses: "accordion-content-wrapper" } }, item.body, "Content"),
  ], item.title)), label);
}

/**
 * Bricks' nested slider (Splide). Splide options go in as custom JSON: Bricks refuses breakpoint
 * keys on its slider controls, while Splide's own breakpoints work (verified on Bricks 2.4.2).
 * Every child becomes a slide. Navigation is by swipe and the dots (buttons, also by keyboard):
 * Splide's arrows sit on top of the slides' content at narrow widths.
 */
export function slider(ctx: Ctx, slides: KitNode[], o: { perPage: number; label: string }): KitNode {
  const { x } = ctx;
  const options = {
    type: "loop", perPage: o.perPage, perMove: 1, gap: x.v("space-m"), autoHeight: true, arrows: false, pagination: true,
    breakpoints: { 991: { perPage: Math.min(o.perPage, 2) }, 767: { perPage: 1 } },
  };
  return node("slider-nested", "bs-slider", {
    optionsType: "custom", options: JSON.stringify(options),
    paginationColor: x.color("border-strong"), paginationColorActive: x.color("primary"),
  }, slides, o.label);
}

/** Classes used by the helpers above beyond the shared library. */
export function commonClasses(r: ResolvedKit): ClassLibrary {
  const x = sx(r);
  return {
    "bs-stars": { _display: "flex", _direction: "row", _columnGap: "2px" },
    "bs-stars__icon": x.type({ size: "18px", color: "accent" }),
    "bs-info": { _display: "flex", _direction: "row", _columnGap: "14px", _alignItems: "flex-start" },
    "bs-info__icon": { ...x.type({ size: "22px", color: "link" }), _flexShrink: "0", _margin: { top: "2px" } },
    "bs-info__body": { _display: "flex", _direction: "column", _rowGap: "2px" },
    "bs-info__label": { ...x.type({ size: "text-xs", weight: "600", ls: "0.08em", transform: "uppercase", color: "muted" }), _margin: { top: "0", bottom: "0" } },
    "bs-info__value": { ...x.type({ size: "text-m", weight: "500", color: "heading", decoration: "none" }), _margin: { top: "0", bottom: "0" } },

    // Tabs: layout classes plus one look per part.
    // Bricks lays tabs out as a column; tabs-nested has _gap but no row gap or direction control.
    "bs-tabs": { _display: "flex", _gap: x.v("space-l"), _alignItems: "stretch", _width: "100%" },
    "bs-tabs__menu": { _direction: "row", _flexWrap: "wrap", _rowGap: "4px" },
    "bs-tabs__menu--pill": merge(x.bg("surface"), x.line("1px", "border"), x.round("999px"), x.pad("4px"), { _columnGap: "4px", _width: "auto", _alignSelf: "center" }),
    "bs-tabs__menu--line": { _columnGap: x.v("space-m"), _width: "100%", _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") } },
    "bs-tabs__title": { _cursor: "pointer", _cssTransition: "background-color .2s ease, color .2s ease, border-color .2s ease" },
    "bs-tabs__title--pill": merge(x.pad("10px", "20px"), x.round("999px"), x.type({ size: "text-s", weight: "600", lh: "1.2", color: "muted" }), {
      _cssCustom: `.bs-tabs__title--pill.brx-open { background-color: ${x.v("primary")}; color: ${x.v("on-primary")}; }`,
    }),
    "bs-tabs__title--line": merge(x.pad("12px", "2px"), x.type({ size: "text-m", weight: "600", lh: "1.3", color: "muted" }), {
      _border: { width: { top: "0", right: "0", bottom: "2px", left: "0" }, style: "solid", color: { raw: "transparent" } }, _margin: { bottom: "-1px" },
      _cssCustom: `.bs-tabs__title--line.brx-open { color: ${x.v("heading")}; border-bottom-color: ${x.v("primary")}; }`,
    }),
    "bs-tabs__label": { _cssCustom: ".bs-tabs__label { white-space: nowrap; }" },
    "bs-tabs__content": { _width: "100%" },
    "bs-tabs__pane": { _width: "100%" },

    // Slider: room below the slides for Splide's dots.
    "bs-slider": { _padding: { top: "0", right: "0", bottom: "48px", left: "0" }, _cssCustom: ".bs-slider .splide__slide > * { width: 100%; height: 100%; }" },

    // Accordion
    "bs-acc": { _width: "100%", _widthMax: "860px", _margin: { left: "auto", right: "auto" } },
    "bs-acc__item": { _width: "100%", _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") }, _cssCustom: `.bs-acc__item:first-child { border-top: 1px solid ${x.v("border")}; }` },
    "bs-acc__title": { _direction: "row", _flexWrap: "nowrap", _justifyContent: "space-between", _alignItems: "center", _columnGap: x.v("space-m"), _padding: { top: x.v("space-m"), right: "0", bottom: x.v("space-m"), left: "0" }, _cursor: "pointer", _width: "100%" },
    "bs-acc__q": merge(x.type({ size: "text-l", weight: "heading-weight", ls: "heading-tracking", lh: "1.35", color: "heading" }), { _margin: { top: "0", bottom: "0" } }, x.font("bs-acc__q", "heading", " text-wrap: balance;")),
    "bs-acc__icon": merge(x.type({ size: "22px", color: "link" }), {
      _flexShrink: "0", _cssTransition: "transform .2s ease",
      // One rule per selector: Bricks splits selector lists when it saves a class.
      _cssCustom: `.bs-acc__item.brx-open .bs-acc__icon { transform: rotate(45deg); }\n.bs-acc__title[aria-expanded="true"] .bs-acc__icon { transform: rotate(45deg); }`,
    }),
    "bs-acc__content": { _widthMax: "720px", _padding: { top: "0", right: "0", bottom: x.v("space-m"), left: "0" } },
  };
}
