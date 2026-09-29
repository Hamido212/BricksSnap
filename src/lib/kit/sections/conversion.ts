import { button, div, heading, icon, image, text, type KitNode } from "../build";
import { PHOTOS } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import { actions, band, checklist, intro, stars, type Ctx, type Variant } from "./common";

function pricingClasses(r: ResolvedKit) {
  const x = sx(r);
  const plan = { _display: "flex", _direction: "column", _rowGap: x.v("space-s"), _alignItems: "stretch", _position: "relative", ...x.round("radius-l"), ...x.pad("space-card") };
  return {
    "bs-plans": { _display: "grid", _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _alignItems: "stretch", _width: "100%" },
    "bs-plan": plan,
    "bs-plan--default": merge(x.bg("surface"), x.line("1px", "border")),
    "bs-plan--featured": merge(x.bg("surface"), x.line("2px", "primary-edge"), x.shadow("24px", "60px", "-30px")),
    "bs-plan__badge": merge(x.type({ size: "text-xs", weight: "700", ls: "0.06em", transform: "uppercase", color: "on-primary" }), x.bg("primary"), x.pad("4px", "10px"), x.round("999px"), { _position: "absolute", _top: "-13px", _left: x.v("space-card"), _margin: { top: "0", bottom: "0" } }),
    "bs-plan__name": merge(x.type({ size: "text-m", weight: "600", color: "heading" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-price-row": { _display: "flex", _direction: "row", _alignItems: "baseline", _columnGap: "8px", _flexWrap: "wrap" },
    "bs-price": merge(x.type({ size: "text-3xl", weight: "heading-weight", ls: "heading-tracking", lh: "1", color: "heading" }), { _margin: { top: "0", bottom: "0" } }, x.font("bs-price", "heading")),
    "bs-plan__rule": { _border: { width: { top: "1px", right: "0", bottom: "0", left: "0" }, style: "solid", color: x.color("border") }, _width: "100%", _height: "0", _margin: { top: "4px", bottom: "4px" } },
    "bs-plan__cta": { _margin: { top: "auto" }, _width: "100%", _justifyContent: "center" },
    "bs-menu": { _display: "grid", _gridTemplateColumns: "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _columnGap: x.v("space-xl"), _width: "100%" },
    "bs-menu__row": merge({ _display: "flex", _direction: "row", _justifyContent: "space-between", _alignItems: "baseline", _columnGap: x.v("space-s"), _padding: { top: "16px", right: "0", bottom: "16px", left: "0" } }, {
      _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "dashed", color: x.color("border-strong") },
    }),
    "bs-menu__name": { _display: "flex", _direction: "column", _rowGap: "2px" },
    "bs-menu__price": merge(x.type({ size: "text-l", weight: "600", color: "heading" }), { _margin: { top: "0", bottom: "0" }, _cssCustom: ".bs-menu__price { white-space: nowrap; }" }, x.font("bs-menu__price", "heading")),
    "bs-offer": merge(x.bg("surface"), x.line("1px", "border"), x.round("radius-l"), x.pad("space-l"), { _display: "grid", _gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-l"), _alignItems: "center", _width: "100%", _widthMax: "960px", _margin: { left: "auto", right: "auto" } }),
    "bs-offer__price": { _display: "flex", _direction: "column", _rowGap: x.v("space-s"), _alignItems: "flex-start" },
    "bs-note": merge(x.type({ size: "text-s", color: "muted", align: "center" }), { _margin: { top: "0", bottom: "0" }, _width: "100%" }),
  };
}

const pricingBand = (ctx: Ctx, children: Array<KitNode | null>, surface: "page" | "alt" = "page") => band({ surface, label: "Pricing", id: ctx.c.anchors.pricing, classes: "bs-pricing" }, children);

function planCard(ctx: Ctx, plan: Ctx["c"]["pricing"]["plans"][number]): KitNode {
  return div(`bs-plan ${plan.featured ? "bs-plan--featured" : "bs-plan--default"}`, [
    plan.featured ? text(ctx.c.ui.mostPopular, "bs-plan__badge") : null,
    heading("h3", plan.name, "bs-plan__name"),
    div("bs-price-row", [text(plan.price, "bs-price"), text(plan.unit, "bs-small")]),
    text(plan.description, "bs-card__text"),
    div("bs-plan__rule", []),
    checklist(plan.features),
    button(plan.cta.label, plan.cta.href, `bs-btn bs-btn-size--m ${plan.featured ? "bs-btn--primary" : "bs-btn--secondary"} bs-plan__cta`),
  ], plan.name);
}

export const pricingVariants: Variant[] = [
  {
    type: "pricing", id: "plans", name: { de: "Drei Pakete", en: "Three plans" }, classes: pricingClasses,
    build: ctx => pricingBand(ctx, [
      intro({ eyebrow: ctx.c.pricing.eyebrow, title: ctx.c.pricing.title, lead: ctx.c.pricing.lead, center: true }),
      div("bs-plans", ctx.c.pricing.plans.map(plan => planCard(ctx, plan)), "Plans"),
      text(ctx.c.pricing.note, "bs-note"),
    ], "alt"),
  },
  {
    type: "pricing", id: "list", name: { de: "Preisliste", en: "Price list" }, classes: pricingClasses,
    build: ctx => pricingBand(ctx, [
      intro({ eyebrow: ctx.c.pricing.eyebrow, title: ctx.c.pricing.title, lead: ctx.c.pricing.lead }),
      div("bs-menu", ctx.c.pricing.list.map(row => div("bs-menu__row", [div("bs-menu__name", [heading("h3", row.name, "bs-plan__name"), text(row.detail, "bs-small")]), text(row.price, "bs-menu__price")], row.name)), "Price list"),
      text(ctx.c.pricing.note, "bs-note"),
    ]),
  },
  {
    type: "pricing", id: "offer", name: { de: "Ein Angebot", en: "Single offer" }, classes: pricingClasses,
    build: ctx => {
      const plan = ctx.c.pricing.plans.find(p => p.featured) ?? ctx.c.pricing.plans[0];
      return pricingBand(ctx, [
        intro({ eyebrow: ctx.c.pricing.eyebrow, title: ctx.c.pricing.title, lead: ctx.c.pricing.lead, center: true }),
        div("bs-offer", [
          div("bs-offer__price", [heading("h3", plan.name, "bs-title bs-size--s"), div("bs-price-row", [text(plan.price, "bs-price"), text(plan.unit, "bs-small")]), text(plan.description, "bs-card__text"), button(plan.cta.label, plan.cta.href, "bs-btn bs-btn-size--m bs-btn--primary")]),
          checklist(plan.features, "bs-text"),
        ], "Offer"),
        text(ctx.c.pricing.note, "bs-note"),
      ], "alt");
    },
  },
];

function testimonialClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    // Always combined with bs-card, which provides the layout.
    "bs-quote": { _height: "100%" },
    "bs-quote__text": merge(x.type({ size: "text-m", lh: "1.6", color: "heading" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-quote__author": { _display: "flex", _direction: "row", _columnGap: "12px", _alignItems: "center", _margin: { top: "auto" } },
    "bs-avatar": merge(x.round("999px"), { _width: "48px", _height: "48px", _objectFit: "cover", _flexShrink: "0" }),
    "bs-avatar--l": merge(x.round("999px"), { _width: "72px", _height: "72px", _objectFit: "cover" }),
    "bs-quote__meta": { _display: "flex", _direction: "column" },
    "bs-quote__name": merge(x.type({ size: "text-s", weight: "600", color: "heading" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-spotlight": { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "center", _widthMax: "880px", _margin: { left: "auto", right: "auto" } },
    "bs-spotlight__quote": merge(x.type({ size: "text-2xl", lh: "1.35", weight: "heading-weight", ls: "heading-tracking", color: "heading", align: "center" }), { _margin: { top: "0", bottom: "0" } }, x.font("bs-spotlight__quote", "heading", " text-wrap: balance;")),
    "bs-spotlight__mark": x.type({ size: "40px", color: "link" }),
    "bs-rating": { _display: "grid", _gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "center", _width: "100%" },
    "bs-rating__score": merge(x.type({ size: "clamp(64px, 40px + 5vw, 104px)", weight: "heading-weight", ls: "heading-tracking", lh: "1", color: "heading" }), { _margin: { top: "0", bottom: "0" } }, x.font("bs-rating__score", "heading")),
    "bs-rating__quotes": { _display: "grid", _gridTemplateColumns: "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _width: "100%" },
  };
}

function quoteCard(ctx: Ctx, item: Ctx["c"]["testimonials"]["items"][number]): KitNode {
  const p = PHOTOS[item.photo];
  return div("bs-card bs-quote", [
    stars(),
    text(ctx.c.lang === "de" ? `„${item.quote}“` : `“${item.quote}”`, "bs-quote__text"),
    div("bs-quote__author", [image(p.url, p.alt[ctx.c.lang], "bs-avatar"), div("bs-quote__meta", [text(item.name, "bs-quote__name"), text(item.role, "bs-small")])]),
  ], item.name);
}

export const testimonialVariants: Variant[] = [
  {
    type: "testimonials", id: "grid", name: { de: "Drei Stimmen", en: "Three quotes" }, classes: testimonialClasses,
    build: ctx => band({ surface: "page", label: "Testimonials" }, [
      intro({ eyebrow: ctx.c.testimonials.eyebrow, title: ctx.c.testimonials.title, center: true }),
      div("bs-grid bs-cols--3", ctx.c.testimonials.items.map(item => quoteCard(ctx, item)), "Quotes"),
    ]),
  },
  {
    type: "testimonials", id: "spotlight", name: { de: "Ein großes Zitat", en: "Spotlight quote" }, classes: testimonialClasses,
    build: ctx => {
      const item = ctx.c.testimonials.items[0];
      const p = PHOTOS[item.photo];
      return band({ surface: "alt", label: "Testimonial" }, [
        div("bs-spotlight", [
          icon("quote", "bs-spotlight__mark"),
          text(item.quote, "bs-spotlight__quote"),
          image(p.url, p.alt[ctx.c.lang], "bs-avatar--l"),
          div("bs-intro--center", [text(item.name, "bs-quote__name"), text(item.role, "bs-small")]),
        ], "Quote"),
      ]);
    },
  },
  {
    type: "testimonials", id: "rating", name: { de: "Bewertung mit Stimmen", en: "Rating with quotes" }, classes: testimonialClasses,
    build: ctx => band({ surface: "page", label: "Testimonials" }, [
      div("bs-rating", [
        div("bs-stack", [
          text(ctx.c.testimonials.eyebrow, "bs-eyebrow"),
          text(ctx.c.testimonials.rating.score, "bs-rating__score"),
          stars(),
          text(`${ctx.c.testimonials.rating.count} · ${ctx.c.testimonials.rating.source}`, "bs-small"),
          heading("h2", ctx.c.testimonials.title, "bs-title bs-size--l"),
        ], "Rating"),
        div("bs-rating__quotes", ctx.c.testimonials.items.slice(0, 2).map(item => quoteCard(ctx, item)), "Quotes"),
      ]),
    ]),
  },
];

function ctaClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    "bs-cta-split": { _display: "flex", _direction: "row", "_direction:tablet_portrait": "column", _justifyContent: "space-between", _alignItems: "center", "_alignItems:tablet_portrait": "flex-start", _columnGap: x.v("space-l"), _rowGap: x.v("space-m"), _width: "100%" },
    "bs-cta-box": merge(x.bg("primary-soft"), x.round("radius-l"), x.pad("space-xl", "space-l"), { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "center", _width: "100%" }, x.type({ align: "center" })),
  };
}

export const ctaVariants: Variant[] = [
  {
    type: "cta", id: "band", name: { de: "Farbband", en: "Colour band" }, classes: ctaClasses,
    build: ctx => band({ surface: "primary", label: "Call to action", containerClasses: "bs-align--center" }, [
      intro({ eyebrow: ctx.c.cta.eyebrow, title: ctx.c.cta.title, lead: ctx.c.cta.lead, center: true }),
      actions([ctx.c.cta.primary, ctx.c.cta.secondary], "primary"),
    ]),
  },
  {
    type: "cta", id: "split", name: { de: "Dunkel, geteilt", en: "Dark split" }, classes: ctaClasses,
    build: ctx => band({ surface: "inverse", space: "tight", label: "Call to action" }, [
      div("bs-cta-split", [intro({ title: ctx.c.cta.title, lead: ctx.c.cta.lead, size: "l" }), actions([ctx.c.cta.primary, ctx.c.cta.secondary], "inverse")]),
    ]),
  },
  {
    type: "cta", id: "box", name: { de: "Box", en: "Boxed" }, classes: ctaClasses,
    build: ctx => band({ surface: "page", label: "Call to action" }, [
      div("bs-cta-box", [
        intro({ eyebrow: ctx.c.cta.eyebrow, title: ctx.c.cta.title, lead: ctx.c.cta.lead, center: true }),
        actions([ctx.c.cta.primary, ctx.c.cta.secondary]),
      ], "CTA box"),
    ]),
  },
];
