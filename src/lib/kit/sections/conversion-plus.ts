import { button, div, heading, icon, image, node, text, textLink, type KitNode } from "../build";
import { PHOTOS } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import { accordion, actions, band, checklist, infoRow, intro, stars, tabs, type Ctx, type Variant } from "./common";
import { planCard, quoteCard } from "./conversion";
import { telHref } from "./header-hero";
import { form } from "./more";

/** More layouts for pricing, testimonials, FAQ, calls to action, contact and logos. */
function convertPlusClasses(r: ResolvedKit) {
  const x = sx(r);
  const none = { top: "0", bottom: "0" };
  return {
    // Pricing
    "bs-plan-rows": { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _width: "100%" },
    "bs-plan-row": merge(x.bg("surface"), x.round("radius-l"), x.pad("space-card"), {
      _display: "grid", _gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr) minmax(0, 0.8fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _alignItems: "center", _width: "100%",
    }),
    "bs-plan-row--default": x.line("1px", "border"),
    "bs-plan-row--featured": merge(x.line("2px", "primary-edge"), x.shadow("24px", "60px", "-30px")),
    "bs-plan-row__head": { _display: "flex", _direction: "column", _rowGap: "6px", _alignItems: "flex-start" },
    "bs-plan-row__buy": { _display: "flex", _direction: "column", _rowGap: x.v("space-s"), _alignItems: "stretch" },
    "bs-badge--solid": merge(x.type({ size: "text-xs", weight: "700", ls: "0.06em", transform: "uppercase", color: "on-primary" }), x.bg("primary"), x.pad("4px", "10px"), x.round("999px"), { _display: "inline-flex", _margin: none }),
    "bs-price-tiles": { _display: "grid", _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _gridGap: x.v("space-s"), _width: "100%" },

    // Testimonials
    "bs-wall": { _display: "block", _width: "100%", _cssCustom: `.bs-wall { columns: 3 260px; column-gap: ${x.v("space-m")}; }\n.bs-wall > * { break-inside: avoid; margin-bottom: ${x.v("space-m")}; }` },
    "bs-wall__rating": merge(x.bg("primary"), x.round("radius-l"), x.pad("space-card"), x.type({ color: "on-primary" }), {
      _display: "flex", _direction: "column", _rowGap: "8px", _alignItems: "flex-start",
      _cssCustom: `.bs-wall__rating .bs-stars__icon { color: ${x.v("on-primary")}; }`,
    }),
    "bs-wall__score": merge(x.type({ size: "text-display", weight: "heading-weight", ls: "heading-tracking", lh: "1", color: "inherit" }), { _margin: none }, x.font("bs-wall__score", "heading")),
    "bs-wall__meta": merge(x.type({ size: "text-s", color: "inherit" }), { _margin: none, _opacity: "0.88" }),
    "bs-quote-bento": { _display: "grid", _gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _width: "100%" },
    "bs-quote-feature": merge(x.bg("primary"), x.round("radius-l"), x.pad("space-l"), x.type({ color: "on-primary" }), {
      _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _justifyContent: "space-between", _gridItemRowSpan: "2", "_gridItemRowSpan:tablet_portrait": "1",
    }),
    "bs-quote-feature__mark": merge(x.type({ size: "40px", color: "inherit" }), { _opacity: "0.7" }),
    "bs-quote-feature__text": merge(x.type({ size: "text-xl", lh: "1.4", weight: "heading-weight", ls: "heading-tracking", color: "inherit" }), { _margin: none }, x.font("bs-quote-feature__text", "heading", " text-wrap: pretty;")),
    "bs-quote-feature__name": merge(x.type({ size: "text-s", weight: "600", color: "inherit" }), { _margin: none }),
    "bs-quote-feature__role": merge(x.type({ size: "text-s", color: "inherit" }), { _margin: none, _opacity: "0.85" }),
    "bs-quote-large": merge(x.type({ size: "text-2xl", lh: "1.35", weight: "heading-weight", ls: "heading-tracking", color: "heading" }), { _margin: none }, x.font("bs-quote-large", "heading", " text-wrap: pretty;")),

    // Calls to action
    "bs-cta-image": { _position: "relative", _overflow: "hidden", _cssCustom: `.bs-cta-image::before { content: ""; position: absolute; inset: 0; background: color-mix(in srgb, ${x.v("inverse")} 80%, transparent); }\n.bs-cta-image > * { position: relative; z-index: 1; }` },
    "bs-cta-lines": merge({ _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "center", _width: "100%", _padding: { top: x.v("space-l"), right: "0", bottom: x.v("space-l"), left: "0" } }, x.type({ align: "center" }), {
      _border: { width: { top: "1px", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") },
    }),
    "bs-cta-card": merge(x.round("radius-l"), { _display: "grid", _gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _overflow: "hidden", _width: "100%" }),
    "bs-cta-card__text": merge(x.pad("space-l"), { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _justifyContent: "center", _alignItems: "flex-start" }),
    "bs-cta-card__img": { _width: "100%", _height: "100%", _heightMin: "280px", _objectFit: "cover" },

    // Contact
    "bs-contact-card__value": merge(x.type({ size: "text-m", weight: "600", color: "heading", decoration: "none" }), { _margin: none, _cssCustom: ".bs-contact-card__value { overflow-wrap: anywhere; }" }),
    "bs-center-form": { _display: "flex", _direction: "column", _rowGap: x.v("space-l"), _alignItems: "center", _width: "100%" },
    "bs-narrow": { _widthMax: "720px" },
    "bs-contact-inline": { _display: "flex", _direction: "row", "_direction:mobile_landscape": "column", _flexWrap: "wrap", _justifyContent: "center", _alignItems: "flex-start", _columnGap: x.v("space-l"), _rowGap: x.v("space-s") },

    // Logos
    "bs-logo-tiles": { _display: "grid", _gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", _gridGap: x.v("space-s"), _width: "100%" },
    "bs-logo-tile": merge(x.bg("surface-alt"), x.round("radius-m"), x.pad("space-s"), { _display: "flex", _alignItems: "center", _justifyContent: "center", _heightMin: "96px", _cssCustom: ".bs-logo-tile .bs-logos__name { white-space: normal; text-align: center; }" }),
    "bs-marquee": { _width: "100%", _overflow: "hidden", _cssCustom: ".bs-marquee { mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }" },
    "bs-marquee__track": { _display: "flex", _direction: "row", _width: "max-content", _cssCustom: ".bs-marquee__track { animation: bs-marquee 32s linear infinite; }\n.bs-marquee:hover .bs-marquee__track { animation-play-state: paused; }\n@keyframes bs-marquee { to { transform: translateX(-50%); } }\n@media (prefers-reduced-motion: reduce) { .bs-marquee__track { animation: none; } }" },
    "bs-marquee__group": { _display: "flex", _direction: "row", _alignItems: "center", _columnGap: "clamp(40px, 6vw, 80px)", _padding: { top: "8px", right: "clamp(40px, 6vw, 80px)", bottom: "8px", left: "0" } },
  };
}

const pricingBand = (ctx: Ctx, children: Array<KitNode | null>, surface: "page" | "alt" = "page") => band({ surface, label: "Pricing", id: ctx.c.anchors.pricing, classes: "bs-pricing" }, children);
const priceRows = (ctx: Ctx) => div("bs-menu", ctx.c.pricing.list.map(row => div("bs-menu__row", [div("bs-menu__name", [heading("h3", row.name, "bs-plan__name"), text(row.detail, "bs-small")]), text(row.price, "bs-menu__price")], row.name)), "Price list");
const quoted = (ctx: Ctx, quote: string) => (ctx.c.lang === "de" ? `„${quote}“` : `“${quote}”`);

export const pricingPlusVariants: Variant[] = [
  {
    // Bricks' nested tabs as a switch; rename the tabs (e.g. monthly/yearly) and edit the panes in Bricks.
    type: "pricing", id: "switch", name: { de: "Mit Umschalter", en: "With switch" }, classes: convertPlusClasses,
    build: ctx => pricingBand(ctx, [
      intro({ eyebrow: ctx.c.pricing.eyebrow, title: ctx.c.pricing.title, lead: ctx.c.pricing.lead, center: true }),
      tabs("pill", [
        { label: ctx.c.lang === "de" ? "Pakete" : "Packages", pane: div("bs-plans", ctx.c.pricing.plans.map(plan => planCard(ctx, plan)), "Plans") },
        { label: ctx.c.lang === "de" ? "Einzelpreise" : "Single prices", pane: priceRows(ctx) },
      ], "Pricing switch"),
      text(ctx.c.pricing.note, "bs-note"),
    ], "alt"),
  },
  {
    type: "pricing", id: "rows", name: { de: "Pakete als Zeilen", en: "Plans as rows" }, classes: convertPlusClasses,
    build: ctx => pricingBand(ctx, [
      intro({ eyebrow: ctx.c.pricing.eyebrow, title: ctx.c.pricing.title, lead: ctx.c.pricing.lead }),
      div("bs-plan-rows", ctx.c.pricing.plans.map(plan => div(`bs-plan-row ${plan.featured ? "bs-plan-row--featured" : "bs-plan-row--default"}`, [
        div("bs-plan-row__head", [plan.featured ? text(ctx.c.ui.mostPopular, "bs-badge--solid") : null, heading("h3", plan.name, "bs-title bs-size--s"), text(plan.description, "bs-card__text")]),
        checklist(plan.features),
        div("bs-plan-row__buy", [
          div("bs-price-row", [text(plan.price, "bs-price"), text(plan.unit, "bs-small")]),
          button(plan.cta.label, plan.cta.href, `bs-btn bs-btn-size--m ${plan.featured ? "bs-btn--primary" : "bs-btn--secondary"}`),
        ]),
      ], plan.name)), "Plans"),
      text(ctx.c.pricing.note, "bs-note"),
    ]),
  },
  {
    type: "pricing", id: "tiles", name: { de: "Preiskacheln", en: "Price tiles" }, classes: convertPlusClasses,
    build: ctx => pricingBand(ctx, [
      intro({ eyebrow: ctx.c.pricing.eyebrow, title: ctx.c.pricing.title, lead: ctx.c.pricing.lead, center: true }),
      div("bs-price-tiles", ctx.c.pricing.list.map(row => div("bs-card", [heading("h3", row.name, "bs-plan__name"), text(row.detail, "bs-card__text"), text(row.price, "bs-menu__price")], row.name)), "Prices"),
      text(ctx.c.pricing.note, "bs-note"),
    ], "alt"),
  },
];

export const testimonialPlusVariants: Variant[] = [
  {
    type: "testimonials", id: "wall", name: { de: "Stimmen-Wand", en: "Quote wall" }, classes: convertPlusClasses,
    build: ctx => band({ surface: "alt", label: "Testimonials" }, [
      intro({ eyebrow: ctx.c.testimonials.eyebrow, title: ctx.c.testimonials.title }),
      div("bs-wall", [
        div("bs-wall__rating", [stars(), text(ctx.c.testimonials.rating.score, "bs-wall__score"), text(`${ctx.c.testimonials.rating.count} · ${ctx.c.testimonials.rating.source}`, "bs-wall__meta")], "Rating"),
        ...ctx.c.testimonials.items.map(item => quoteCard(ctx, item)),
      ], "Quotes"),
    ]),
  },
  {
    type: "testimonials", id: "featured", name: { de: "Ein Zitat groß", en: "One quote featured" }, classes: convertPlusClasses,
    build: ctx => {
      const [first, ...rest] = ctx.c.testimonials.items;
      const p = PHOTOS[first.photo];
      return band({ surface: "page", label: "Testimonials" }, [
        intro({ eyebrow: ctx.c.testimonials.eyebrow, title: ctx.c.testimonials.title }),
        div("bs-quote-bento", [
          div("bs-quote-feature", [
            icon("quote", "bs-quote-feature__mark"),
            text(first.quote, "bs-quote-feature__text"),
            div("bs-quote__author", [image(p.url, p.alt[ctx.c.lang], "bs-avatar"), div("bs-quote__meta", [text(first.name, "bs-quote-feature__name"), text(first.role, "bs-quote-feature__role")])]),
          ], first.name),
          ...rest.slice(0, 2).map(item => quoteCard(ctx, item)),
        ], "Quotes"),
      ]);
    },
  },
  {
    type: "testimonials", id: "photo", name: { de: "Mit großem Foto", en: "With large photo" }, classes: convertPlusClasses,
    build: ctx => {
      const item = ctx.c.testimonials.items[0];
      const p = PHOTOS[item.photo];
      return band({ surface: "alt", label: "Testimonial" }, [
        div("bs-split", [
          image(p.url, p.alt[ctx.c.lang], "bs-media bs-ratio--4x5"),
          div("bs-stack", [
            text(ctx.c.testimonials.eyebrow, "bs-eyebrow"),
            heading("h2", ctx.c.testimonials.title, "bs-title bs-size--s"),
            stars(),
            text(quoted(ctx, item.quote), "bs-quote-large"),
            div("bs-quote__meta", [text(item.name, "bs-quote__name"), text(item.role, "bs-small")]),
            text(`${ctx.c.testimonials.rating.score} · ${ctx.c.testimonials.rating.count} · ${ctx.c.testimonials.rating.source}`, "bs-small"),
          ], "Quote"),
        ]),
      ]);
    },
  },
];

export const faqPlusVariants: Variant[] = [
  {
    type: "faq", id: "accordion", name: { de: "Aufklappbar", en: "Accordion" }, classes: convertPlusClasses,
    build: ctx => band({ surface: "page", label: "FAQ", id: ctx.c.anchors.faq }, [
      intro({ eyebrow: ctx.c.faq.eyebrow, title: ctx.c.faq.title, lead: ctx.c.faq.lead, center: true }),
      accordion(ctx.c.faq.items.map(item => ({ title: item.q, body: [text(item.a, "bs-text")] })), "Questions"),
    ]),
  },
  {
    type: "faq", id: "cards", name: { de: "Karten", en: "Cards" }, classes: convertPlusClasses,
    build: ctx => band({ surface: "alt", label: "FAQ", id: ctx.c.anchors.faq }, [
      intro({ eyebrow: ctx.c.faq.eyebrow, title: ctx.c.faq.title, lead: ctx.c.faq.lead, center: true }),
      div("bs-grid bs-cols--2", ctx.c.faq.items.map(item => div("bs-card", [heading("h3", item.q, "bs-card__title"), text(item.a, "bs-card__text")], item.q)), "Questions"),
    ]),
  },
];

export const ctaPlusVariants: Variant[] = [
  {
    type: "cta", id: "image", name: { de: "Mit Hintergrundbild", en: "With background image" }, classes: convertPlusClasses,
    build: ctx => band({
      surface: "inverse", label: "Call to action", classes: "bs-cta-image", containerClasses: "bs-align--center",
      settings: { _background: { image: { url: PHOTOS[ctx.c.about.image].url, size: "full" }, size: "cover", position: "center center", repeat: "no-repeat" } },
    }, [
      intro({ eyebrow: ctx.c.cta.eyebrow, title: ctx.c.cta.title, lead: ctx.c.cta.lead, center: true }),
      actions([ctx.c.cta.primary, ctx.c.cta.secondary], "inverse"),
    ]),
  },
  {
    type: "cta", id: "minimal", name: { de: "Schlicht mit Linien", en: "Minimal with rules" }, classes: convertPlusClasses,
    build: ctx => band({ surface: "page", space: "tight", label: "Call to action" }, [
      div("bs-cta-lines", [heading("h2", ctx.c.cta.title, "bs-title bs-size--l"), actions([ctx.c.cta.primary, ctx.c.cta.secondary])], "CTA"),
    ]),
  },
  {
    type: "cta", id: "photo", name: { de: "Karte mit Foto", en: "Card with photo" }, classes: convertPlusClasses,
    build: ctx => {
      const p = PHOTOS[ctx.c.about.secondImage];
      return band({ surface: "page", label: "Call to action" }, [
        // bs-surface--primary on the card colours its text like a primary band.
        div("bs-surface--primary bs-cta-card", [
          div("bs-cta-card__text", [intro({ eyebrow: ctx.c.cta.eyebrow, title: ctx.c.cta.title, lead: ctx.c.cta.lead, size: "l" }), actions([ctx.c.cta.primary, ctx.c.cta.secondary], "primary")]),
          image(p.url, p.alt[ctx.c.lang], "bs-cta-card__img"),
        ], "CTA card"),
      ]);
    },
  },
];

function contactItems(ctx: Ctx): Array<{ icon: "call" | "mail" | "pin" | "time"; title: string; value: string; href?: string }> {
  return [
    { icon: "call", title: ctx.c.ui.callUs, value: ctx.c.brand.phone, href: telHref(ctx.c.brand.phone) },
    ...(ctx.c.brand.email ? [{ icon: "mail" as const, title: ctx.c.ui.writeUs, value: ctx.c.brand.email, href: `mailto:${ctx.c.brand.email}` }] : []),
    { icon: "pin", title: ctx.c.contact.addressTitle, value: ctx.c.brand.address },
    { icon: "time", title: ctx.c.contact.hoursTitle, value: ctx.c.brand.hours.join(" · ") },
  ];
}

export const contactPlusVariants: Variant[] = [
  {
    type: "contact", id: "cards", name: { de: "Kontaktkarten", en: "Contact cards" }, classes: convertPlusClasses,
    build: ctx => {
      const items = contactItems(ctx);
      return band({ surface: "page", label: "Contact", id: ctx.c.anchors.contact }, [
        intro({ eyebrow: ctx.c.contact.eyebrow, title: ctx.c.contact.title, lead: ctx.c.contact.lead, center: true }),
        div(`bs-grid ${items.length === 4 ? "bs-cols--4" : "bs-cols--3"}`, items.map(item => div("bs-card", [
          icon(item.icon, "bs-card__icon"), heading("h3", item.title, "bs-card__title"),
          item.href ? textLink(item.value, item.href, "bs-contact-card__value") : text(item.value, "bs-card__text"),
        ], item.title)), "Contact details"),
      ]);
    },
  },
  {
    type: "contact", id: "centered", name: { de: "Formular zentriert", en: "Centred form" }, classes: convertPlusClasses,
    build: ctx => band({ surface: "alt", label: "Contact", id: ctx.c.anchors.contact }, [
      div("bs-center-form", [
        intro({ eyebrow: ctx.c.contact.eyebrow, title: ctx.c.contact.title, lead: ctx.c.contact.lead, center: true }),
        div("bs-form-card bs-narrow", [form(ctx, [
          { type: "text", label: ctx.c.contact.labels.name, required: true, width: 50 },
          { type: "email", label: ctx.c.contact.labels.email, required: true, width: 50 },
          { type: "tel", label: ctx.c.contact.labels.phone },
          { type: "textarea", label: ctx.c.contact.labels.message, required: true },
          { type: "checkbox", label: ctx.c.contact.labels.privacy, required: true },
        ], ctx.c.contact.labels.submit)], "Form"),
        div("bs-contact-inline", contactItems(ctx).slice(0, 3).map(item => infoRow(item.icon, item.title, item.value, item.href)), "Contact details"),
      ]),
    ]),
  },
];

export const logosPlusVariants: Variant[] = [
  {
    type: "logos", id: "tiles", name: { de: "Kacheln", en: "Tiles" }, classes: convertPlusClasses,
    build: ctx => band({ surface: "page", space: "tight", label: "Logos", containerClasses: "bs-align--center" }, [
      text(ctx.c.logos.title, "bs-small"),
      div("bs-logo-tiles", ctx.c.logos.names.map(name => div("bs-logo-tile", [text(name, "bs-logos__name")], name)), "Logos"),
    ]),
  },
  {
    type: "logos", id: "marquee", name: { de: "Laufband", en: "Marquee" }, classes: convertPlusClasses,
    build: ctx => band({ surface: "page", space: "tight", label: "Logos", containerClasses: "bs-align--center" }, [
      text(ctx.c.logos.title, "bs-small"),
      // The second copy closes the loop and is hidden from screen readers.
      div("bs-marquee", [div("bs-marquee__track", [
        div("bs-marquee__group", ctx.c.logos.names.map(name => text(name, "bs-logos__name")), "Logos"),
        node("div", "bs-marquee__group", { _attributes: [{ name: "aria-hidden", value: "true" }] }, ctx.c.logos.names.map(name => text(name, "bs-logos__name")), "Logos (loop)"),
      ])], "Marquee"),
    ]),
  },
];
