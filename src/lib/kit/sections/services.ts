import { div, heading, icon, text, textLink, type KitNode } from "../build";
import { PHOTOS } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import { band, iconCard, intro, photo, type Ctx, type Variant } from "./common";

function serviceClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    "bs-price-tag": merge(x.type({ size: "text-s", weight: "600", color: "heading" }), { _margin: { top: "auto", bottom: "0" } }),
    "bs-svc-layout": { _display: "grid", _gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "start", _width: "100%" },
    "bs-svc-layout__intro": { _position: "sticky", _top: "32px", "_position:tablet_portrait": "static" },
    "bs-svc-list": { _display: "flex", _direction: "column", _width: "100%" },
    "bs-svc-row": merge({ _display: "grid", _gridTemplateColumns: "48px minmax(0, 1fr) auto", _gridGap: x.v("space-s"), _alignItems: "start", _padding: { top: x.v("space-m"), right: "0", bottom: x.v("space-m"), left: "0" } }, {
      _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") },
    }),
    "bs-svc-row__body": { _display: "flex", _direction: "column", _rowGap: "6px" },
    "bs-svc-row__price": merge(x.type({ size: "text-m", weight: "600", color: "heading" }), { _margin: { top: "0", bottom: "0" }, _cssCustom: ".bs-svc-row__price { white-space: nowrap; }" }),
    "bs-rows": { _display: "flex", _direction: "column", _rowGap: x.v("space-xl"), _width: "100%" },
    "bs-row": { _display: "grid", _gridTemplateColumns: "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "center", _width: "100%" },
    "bs-row__media--end": { _order: "2", "_order:tablet_portrait": "0" },
    "bs-row__text": { _display: "flex", _direction: "column", _rowGap: x.v("space-s"), _alignItems: "flex-start" },
    "bs-bento": { _display: "grid", _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _width: "100%" },
    "bs-bento__feature": merge(x.round("radius-l"), {
      _gridItemColumnSpan: "2", "_gridItemColumnSpan:mobile_landscape": "1", _gridItemRowSpan: "2", "_gridItemRowSpan:mobile_landscape": "1",
      _position: "relative", _overflow: "hidden", _heightMin: "420px", _display: "flex", _direction: "column", _justifyContent: "flex-end", _alignItems: "flex-start", _rowGap: "10px",
      _padding: { top: x.v("space-l"), right: x.v("space-l"), bottom: x.v("space-l"), left: x.v("space-l") },
      _cssCustom: `.bs-bento__feature::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 30%, color-mix(in srgb, ${x.v("inverse")} 85%, transparent) 100%); }\n.bs-bento__feature > * { position: relative; z-index: 1; }\n.bs-bento__feature :is(.bs-card__title, .bs-card__text) { color: ${x.v("on-inverse")}; }`,
    }),
    "bs-icon-grid": { _display: "grid", _gridTemplateColumns: "repeat(4, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-l"), _width: "100%" },
    "bs-icon-item": { _display: "flex", _direction: "column", _rowGap: "12px", _alignItems: "flex-start" },
    "bs-benefits": { _display: "grid", _gridTemplateColumns: "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _width: "100%" },
  };
}

const serviceBand = (ctx: Ctx, children: KitNode[], surface: "page" | "alt" = "page") =>
  band({ surface, label: "Services", id: ctx.c.anchors.services, classes: "bs-services" }, children);

export const servicesVariants: Variant[] = [
  {
    type: "services", id: "grid", name: { de: "Karten-Raster", en: "Card grid" }, classes: serviceClasses,
    build: ctx => serviceBand(ctx, [
      intro({ eyebrow: ctx.c.services.eyebrow, title: ctx.c.services.title, lead: ctx.c.services.lead }),
      div("bs-grid bs-cols--3", ctx.c.services.items.map(item => iconCard(item, item.price ? text(item.price, "bs-price-tag") : null)), "Services"),
    ]),
  },
  {
    type: "services", id: "list", name: { de: "Liste mit Preisen", en: "List with prices" }, classes: serviceClasses,
    build: ctx => serviceBand(ctx, [
      div("bs-svc-layout", [
        div("bs-svc-layout__intro", [intro({ eyebrow: ctx.c.services.eyebrow, title: ctx.c.services.title, lead: ctx.c.services.lead })]),
        div("bs-svc-list", ctx.c.services.items.map(item => div("bs-svc-row", [
          icon(item.icon, "bs-card__icon"),
          div("bs-svc-row__body", [heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text")]),
          item.price ? text(item.price, "bs-svc-row__price") : null,
        ], item.title)), "Service list"),
      ]),
    ]),
  },
  {
    type: "services", id: "rows", name: { de: "Bild und Text im Wechsel", en: "Alternating image and text" }, classes: serviceClasses,
    build: ctx => serviceBand(ctx, [
      intro({ eyebrow: ctx.c.services.eyebrow, title: ctx.c.services.title, lead: ctx.c.services.lead, center: true }),
      div("bs-rows", ctx.c.services.items.slice(0, 3).map((item, i) => div("bs-row", [
        div(i % 2 ? "bs-row__media--end" : "", [photo(ctx, item.image, "4x3")]),
        div("bs-row__text", [icon(item.icon, "bs-card__icon"), heading("h3", item.title, "bs-title bs-size--l"), text(item.text, "bs-lead"), textLink(ctx.c.navCta.label, ctx.c.navCta.href, "bs-link", "arrow-forward")]),
      ], item.title)), "Service rows"),
    ], "alt"),
  },
  {
    type: "services", id: "bento", name: { de: "Bento-Raster", en: "Bento grid" }, classes: serviceClasses,
    build: ctx => {
      const [first, ...rest] = ctx.c.services.items;
      return serviceBand(ctx, [
        intro({ eyebrow: ctx.c.services.eyebrow, title: ctx.c.services.title, lead: ctx.c.services.lead }),
        div("bs-bento", [
          { name: "div", classes: ["bs-bento__feature"], settings: { _background: { image: { url: PHOTOS[first.image].url, size: "full" }, size: "cover", position: "center center" } }, children: [heading("h3", first.title, "bs-card__title"), text(first.text, "bs-card__text")], label: first.title },
          ...rest.slice(0, 4).map(item => iconCard(item)),
        ], "Bento"),
      ]);
    },
  },
];

export const featuresVariants: Variant[] = [
  {
    type: "features", id: "icons", name: { de: "Vier Vorteile", en: "Four benefits" }, classes: serviceClasses,
    build: ctx => band({ surface: "page", label: "Benefits", classes: "bs-features" }, [
      intro({ eyebrow: ctx.c.features.eyebrow, title: ctx.c.features.title, lead: ctx.c.features.lead, center: true }),
      div("bs-icon-grid", ctx.c.features.items.map(item => div("bs-icon-item", [icon(item.icon, "bs-card__icon"), heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text")], item.title)), "Benefits"),
    ]),
  },
  {
    type: "features", id: "split", name: { de: "Bild mit Vorteilen", en: "Image with benefits" }, classes: serviceClasses,
    build: ctx => band({ surface: "alt", label: "Benefits", classes: "bs-features" }, [
      div("bs-split", [
        photo(ctx, ctx.c.about.secondImage, "4x5"),
        div("bs-stack", [
          intro({ eyebrow: ctx.c.features.eyebrow, title: ctx.c.features.title, lead: ctx.c.features.lead }),
          div("bs-benefits", ctx.c.features.items.map(item => div("bs-icon-item", [icon(item.icon, "bs-card__icon"), heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text")], item.title)), "Benefits"),
        ]),
      ]),
    ]),
  },
];
