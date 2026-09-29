import { button, container, div, heading, icon, image, section, text, textLink, type ClassLibrary, type KitNode } from "../build";
import type { Content, Link } from "../content";
import { PHOTOS, type PhotoKey } from "../images";
import type { IconKey } from "../icons";
import { sx } from "../styles";
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
  };
}
