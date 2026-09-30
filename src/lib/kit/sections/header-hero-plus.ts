import { button, div, heading, image, node, text, type KitNode } from "../build";
import { PHOTOS } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import { actions, band, checklist, infoRow, photo, stars, type Ctx, type Variant } from "./common";
import { brand, navLinks, telHref } from "./header-hero";
import { form } from "./more";

/** More headers and heroes; shared parts come from header-hero.ts. */
function headerPlusClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    // Centred logo: navigation and actions share the free space, so the brand sits in the middle.
    "bs-nav--grow": { _flexGrow: "1", _flexBasis: "0" },
    "bs-header__actions--grow": { _flexGrow: "1", _flexBasis: "0", _justifyContent: "flex-end" },
    "bs-header__pill": merge(x.bg("surface"), x.line("1px", "border"), x.round("999px"), x.pad("10px", "10px", "10px", "24px"), x.shadow("10px", "30px", "-18px")),
  };
}

const bar = (ctx: Ctx, children: KitNode[], o: { surface?: "page" | "alt" | "inverse"; containerClasses?: string; classes?: string } = {}) =>
  band({ surface: o.surface ?? "page", space: "bar", label: "Header", classes: o.classes, containerClasses: `bs-header__bar ${o.containerClasses ?? ""}`.trim() }, children);

export const headerPlusVariants: Variant[] = [
  {
    type: "navbar", id: "centered", name: { de: "Logo in der Mitte", en: "Centred logo" }, classes: headerPlusClasses,
    build: ctx => bar(ctx, [
      { ...navLinks(ctx), classes: ["bs-nav", "bs-nav--grow"] },
      brand(ctx),
      div("bs-header__actions bs-header__actions--grow", [button(ctx.c.navCta.label, ctx.c.navCta.href, "bs-btn bs-btn-size--s bs-btn--primary")]),
    ], { classes: "bs-header" }),
  },
  {
    type: "navbar", id: "floating", name: { de: "Schwebende Leiste", en: "Floating bar" }, classes: headerPlusClasses,
    build: ctx => bar(ctx, [
      brand(ctx),
      navLinks(ctx),
      div("bs-header__actions", [button(ctx.c.navCta.label, ctx.c.navCta.href, "bs-btn bs-btn-size--s bs-btn--primary")]),
    ], { surface: "alt", containerClasses: "bs-header__pill" }),
  },
  {
    type: "navbar", id: "dark", name: { de: "Dunkel", en: "Dark" }, classes: headerPlusClasses,
    build: ctx => bar(ctx, [
      brand(ctx),
      navLinks(ctx),
      div("bs-header__actions", [button(ctx.c.navCta.label, ctx.c.navCta.href, "bs-btn bs-btn-size--s bs-btn--on-dark")]),
    ], { surface: "inverse" }),
  },
];

function heroPlusClasses(r: ResolvedKit) {
  const x = sx(r);
  const none = { top: "0", bottom: "0" };
  return {
    "bs-hero-bento": { _display: "grid", _gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", _gridGap: x.v("space-s"), _width: "100%" },
    // Bricks has no grid span control on image elements, so the span lives in class CSS.
    "bs-hero-bento__main": merge(x.round("radius-l"), { _width: "100%", _height: "100%", _heightMin: "340px", _objectFit: "cover", _cssCustom: ".bs-hero-bento__main { grid-row: span 2; }" }),
    "bs-hero-bento__tile": merge(x.round("radius-l"), x.pad("space-card"), { _display: "flex", _direction: "column", _justifyContent: "flex-end", _rowGap: "6px", _heightMin: "160px" }),
    "bs-hero-bento__tile--primary": merge(x.bg("primary"), x.type({ color: "on-primary" })),
    "bs-hero-bento__tile--soft": merge(x.bg("primary-soft"), x.type({ color: "heading" })),
    "bs-hero-bento__value": merge(x.type({ size: "text-3xl", weight: "heading-weight", ls: "heading-tracking", lh: "1", color: "inherit" }), { _margin: none }, x.font("bs-hero-bento__value", "heading")),
    "bs-hero-bento__label": merge(x.type({ size: "text-s", lh: "1.4", color: "inherit" }), { _margin: none, _opacity: "0.88" }),

    "bs-hero-stats": {
      _display: "grid", _gridTemplateColumns: "repeat(4, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "repeat(2, minmax(0, 1fr))", _gridGap: x.v("space-m"), _width: "100%",
      _padding: { top: x.v("space-l"), right: "0", bottom: "0", left: "0" }, _border: { width: { top: "1px", right: "0", bottom: "0", left: "0" }, style: "solid", color: x.color("border") },
    },
    "bs-hero-stats__item": merge({ _alignItems: "center" }, x.type({ align: "center" })),

    "bs-hero__statement": { _widthMax: "1000px" },
    "bs-hero-meta": { _display: "grid", _gridTemplateColumns: "minmax(0, 1fr) auto", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _alignItems: "end", _width: "100%" },
    "bs-ratio--wide": { _aspectRatio: "21/9", "_aspectRatio:mobile_landscape": "4/3" },

    "bs-hero__trust": { _display: "flex", _direction: "row", _flexWrap: "wrap", _alignItems: "center", _columnGap: "14px", _rowGap: "8px" },
    "bs-avatars": { _display: "flex", _direction: "row" },
    "bs-avatars__img": merge(x.round("999px"), x.line("2px", "bg"), { _width: "40px", _height: "40px", _objectFit: "cover", _cssCustom: ".bs-avatars__img + .bs-avatars__img { margin-left: -10px; }" }),
    "bs-hero__trust-text": { _display: "flex", _direction: "column", _rowGap: "2px" },
  };
}

const heroText = (ctx: Ctx, extra: Array<KitNode | null> = []) => div("bs-hero__content", [
  text(ctx.c.hero.eyebrow, "bs-eyebrow"),
  heading("h1", ctx.c.hero.title, "bs-title bs-size--display"),
  text(ctx.c.hero.lead, "bs-lead"),
  actions([ctx.c.hero.primary, ctx.c.hero.secondary]),
  ...extra,
], "Hero text");

const trust = (ctx: Ctx) => div("bs-hero__trust", [
  div("bs-avatars", ctx.c.testimonials.items.map(item => image(PHOTOS[item.photo].url, PHOTOS[item.photo].alt[ctx.c.lang], "bs-avatars__img")), "Customers"),
  div("bs-hero__trust-text", [stars(), text(`${ctx.c.testimonials.rating.score} · ${ctx.c.testimonials.rating.count}`, "bs-small")]),
], "Trust");

export const heroPlusVariants: Variant[] = [
  {
    type: "hero", id: "bento", name: { de: "Bento mit Kacheln", en: "Bento tiles" }, classes: heroPlusClasses,
    build: ctx => {
      const stat = ctx.c.stats.items[0];
      const main = PHOTOS[ctx.c.hero.image];
      return band({ surface: "page", label: "Hero", classes: "bs-hero" }, [
        div("bs-split", [
          heroText(ctx),
          div("bs-hero-bento", [
            image(main.url, main.alt[ctx.c.lang], "bs-hero-bento__main"),
            div("bs-hero-bento__tile bs-hero-bento__tile--primary", [text(stat.value, "bs-hero-bento__value"), text(stat.label, "bs-hero-bento__label")], stat.label),
            div("bs-hero-bento__tile bs-hero-bento__tile--soft", [stars(), text(ctx.c.testimonials.rating.score, "bs-hero-bento__value"), text(`${ctx.c.testimonials.rating.count} · ${ctx.c.testimonials.rating.source}`, "bs-hero-bento__label")], "Rating"),
          ], "Tiles"),
        ]),
      ]);
    },
  },
  {
    type: "hero", id: "stats", name: { de: "Zentriert mit Zahlen", en: "Centred with numbers" }, classes: heroPlusClasses,
    build: ctx => band({ surface: "page", label: "Hero", classes: "bs-hero", containerClasses: "bs-align--center" }, [
      node("div", "bs-intro--center", {}, [
        text(ctx.c.hero.eyebrow, "bs-eyebrow"),
        heading("h1", ctx.c.hero.title, "bs-title bs-size--display"),
        text(ctx.c.hero.lead, "bs-lead"),
        actions([ctx.c.hero.primary, ctx.c.hero.secondary]),
      ], "Hero text"),
      div("bs-hero-stats", ctx.c.stats.items.map(stat => div("bs-stat bs-hero-stats__item", [text(stat.value, "bs-stat__value"), text(stat.label, "bs-stat__label")], stat.label)), "Numbers"),
    ]),
  },
  {
    type: "hero", id: "statement", name: { de: "Große Aussage mit Bildband", en: "Statement with wide image" }, classes: heroPlusClasses,
    build: ctx => {
      const p = PHOTOS[ctx.c.hero.image];
      return band({ surface: "page", label: "Hero", classes: "bs-hero" }, [
        text(ctx.c.hero.eyebrow, "bs-eyebrow"),
        heading("h1", ctx.c.hero.title, "bs-title bs-size--display bs-hero__statement"),
        div("bs-hero-meta", [text(ctx.c.hero.lead, "bs-lead"), actions([ctx.c.hero.primary, ctx.c.hero.secondary])]),
        image(p.url, p.alt[ctx.c.lang], "bs-media bs-ratio--wide"),
      ]);
    },
  },
  {
    type: "hero", id: "reverse", name: { de: "Bild links mit Kundenstimmen", en: "Image left with social proof" }, classes: heroPlusClasses,
    build: ctx => band({ surface: "alt", label: "Hero", classes: "bs-hero" }, [
      div("bs-split", [
        photo(ctx, ctx.c.hero.image, "hero"),
        heroText(ctx, [checklist(ctx.c.hero.points), trust(ctx)]),
      ]),
    ]),
  },
  {
    type: "hero", id: "form", name: { de: "Mit Anfrageformular", en: "With enquiry form" }, classes: heroPlusClasses,
    build: ctx => band({ surface: "alt", label: "Hero", classes: "bs-hero" }, [
      div("bs-split", [
        div("bs-hero__content", [
          text(ctx.c.hero.eyebrow, "bs-eyebrow"),
          heading("h1", ctx.c.hero.title, "bs-title bs-size--display"),
          text(ctx.c.hero.lead, "bs-lead"),
          checklist(ctx.c.hero.points),
          infoRow("call", ctx.c.ui.callUs, ctx.c.brand.phone, telHref(ctx.c.brand.phone)),
        ], "Hero text"),
        div("bs-form-card", [
          heading("h2", ctx.c.contact.formTitle, "bs-card__title"),
          form(ctx, [
            { type: "text", label: ctx.c.contact.labels.name, required: true },
            { type: "tel", label: ctx.c.contact.labels.phone, required: true },
            { type: "textarea", label: ctx.c.contact.labels.message },
            { type: "checkbox", label: ctx.c.contact.labels.privacy, required: true },
          ], ctx.c.contact.labels.submit),
        ], "Form"),
      ]),
    ]),
  },
];
