import { div, heading, icon, image, text, textLink, type KitNode } from "../build";
import { PHOTOS, type PhotoKey } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import { band, checklist, intro, photo, slider, tabs, type Ctx, type Variant } from "./common";

/** More layouts for services, benefits, process, numbers, about, history, team and work. */
function bodyPlusClasses(r: ResolvedKit) {
  const x = sx(r);
  const none = { top: "0", bottom: "0" };
  const topLine = (width = "1px", color: string | null = "border") => ({ _border: { width: { top: width, right: "0", bottom: "0", left: "0" }, style: "solid", color: color ? x.color(color) : { raw: "color-mix(in srgb, currentColor 22%, transparent)" } } });
  const bottomLine = { _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") } };
  // A photo as background with a dark scrim and white text: photos need it in light and dark mode alike.
  const overlay = (className: string) => ({
    _position: "relative", _overflow: "hidden",
    _cssCustom: `.${className}::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 35%, rgb(0 0 0 / 0.78) 100%); }\n.${className} > * { position: relative; z-index: 1; }`,
  });
  const onPhoto = { raw: "#ffffff" };
  return {
    // Services
    "bs-num-grid": { _display: "grid", _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _columnGap: x.v("space-l"), _rowGap: x.v("space-l"), _width: "100%" },
    "bs-num-item": merge({ _display: "flex", _direction: "column", _rowGap: "10px", _alignItems: "flex-start", _padding: { top: x.v("space-m"), right: "0", bottom: "0", left: "0" } }, topLine()),
    "bs-num-item__num": merge(x.type({ size: "text-2xl", weight: "heading-weight", ls: "heading-tracking", lh: "1", color: "link" }), { _margin: none }, x.font("bs-num-item__num", "heading")),
    "bs-photo-card": merge(x.bg("surface"), x.line("1px", "border"), x.round("radius-l"), { _display: "flex", _direction: "column", _overflow: "hidden", _cssTransition: "transform .2s ease, box-shadow .2s ease", "_transform:hover": { translateY: "-3px" } }),
    "bs-photo-card__img": { _width: "100%", _aspectRatio: "4/3", _objectFit: "cover" },
    "bs-photo-card__body": merge(x.pad("space-card"), { _display: "flex", _direction: "column", _rowGap: "10px", _alignItems: "flex-start", _flexGrow: "1" }),
    "bs-photo-card__foot": { _display: "flex", _direction: "row", _justifyContent: "space-between", _alignItems: "center", _columnGap: x.v("space-s"), _flexWrap: "wrap", _width: "100%", _margin: { top: "auto" } },
    "bs-price-inline": merge(x.type({ size: "text-s", weight: "600", color: "heading" }), { _margin: none }),
    "bs-tab-panel": { _display: "grid", _gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "center", _width: "100%" },

    // Benefits
    "bs-hcard": { _display: "flex", _direction: "row", _columnGap: x.v("space-s"), _alignItems: "flex-start", _width: "100%" },
    "bs-hcard__body": { _display: "flex", _direction: "column", _rowGap: "6px" },
    "bs-trio": { _display: "grid", _gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-l"), _alignItems: "center", _width: "100%" },
    "bs-trio__col": { _display: "flex", _direction: "column", _rowGap: x.v("space-l") },
    "bs-trio__img": { "_order:tablet_portrait": "-1" },
    "bs-line-item": merge({ _padding: { top: x.v("space-m"), right: "0", bottom: "0", left: "0" } }, topLine("1px", null)),

    // Process
    "bs-vsteps": { _display: "flex", _direction: "column", _width: "100%" },
    "bs-vstep": {
      _display: "grid", _gridTemplateColumns: "56px minmax(0, 1fr)", _columnGap: x.v("space-m"), _position: "relative", _padding: { top: "0", right: "0", bottom: x.v("space-l"), left: "0" },
      _cssCustom: `.bs-vstep:not(:last-child)::before { content: ""; position: absolute; left: 27px; top: 60px; bottom: 4px; width: 2px; background: ${x.v("border")}; }`,
    },
    "bs-vstep__body": { _display: "flex", _direction: "column", _rowGap: "6px", _padding: { top: "12px", right: "0", bottom: "0", left: "0" } },
    "bs-circle-num": merge(x.bg("primary"), x.round("999px"), x.type({ size: "text-l", weight: "700", lh: "1", color: "on-primary" }), {
      _display: "flex", _alignItems: "center", _justifyContent: "center", _width: "56px", _height: "56px", _flexShrink: "0", _margin: none,
    }, x.font("bs-circle-num", "heading")),
    "bs-hstep": merge({ _display: "flex", _direction: "column", _rowGap: "12px", _alignItems: "center" }, x.type({ align: "center" })),

    // Numbers
    "bs-stats-2": { _display: "grid", _gridTemplateColumns: "repeat(2, minmax(0, 1fr))", _gridGap: x.v("space-m"), _width: "100%" },
    "bs-stat--line": merge({ _padding: { top: x.v("space-s"), right: "0", bottom: "0", left: "0" } }, topLine("2px", "primary")),

    // About
    "bs-collage": { _position: "relative", _width: "100%", _padding: { top: "0", right: "0", bottom: x.v("space-l"), left: "0" } },
    "bs-collage__main": { _widthMax: "82%" },
    "bs-collage__inset": merge(x.round("radius-l"), x.line("6px", "bg"), { _position: "absolute", _right: "0", _bottom: "0", _width: "46%", _aspectRatio: "1/1", _objectFit: "cover" }, x.shadow("18px", "40px", "-20px")),
    "bs-statement": { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "flex-start", _width: "100%" },
    "bs-statement__title": { _widthMax: "980px" },
    "bs-statement__cols": { _display: "grid", _gridTemplateColumns: "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _gridGap: x.v("space-l"), _width: "100%" },

    // History
    "bs-htimeline": { _display: "grid", _gridTemplateColumns: "repeat(4, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-l"), _width: "100%" },
    "bs-htimeline__item": merge({ _display: "flex", _direction: "column", _rowGap: "8px", _position: "relative", _padding: { top: x.v("space-m"), right: "0", bottom: "0", left: "0" } }, topLine("2px"), {
      _cssCustom: `.bs-htimeline__item::before { content: ""; position: absolute; top: -7px; left: 0; width: 12px; height: 12px; border-radius: 50%; background: ${x.v("primary")}; box-shadow: 0 0 0 4px ${x.v("surface-alt")}; }`,
    }),

    // Team
    // Photo cards stay two per row on phones instead of four very tall ones.
    "bs-team-grid": { _display: "grid", _gridTemplateColumns: "repeat(4, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", _gridGap: x.v("space-m"), "_gridGap:mobile_portrait": x.v("space-s"), _width: "100%" },
    "bs-team-card": merge(x.round("radius-l"), x.pad("space-m"), overlay("bs-team-card"), { _display: "flex", _direction: "column", _justifyContent: "flex-end", _rowGap: "2px", _aspectRatio: "3/4" }),
    "bs-team-card__name": merge(x.type({ size: "text-l", weight: "heading-weight", lh: "1.25" }), { _typography: { color: onPhoto }, _margin: none }, x.font("bs-team-card__name", "heading")),
    "bs-team-card__role": merge(x.type({ size: "text-s" }), { _typography: { color: onPhoto }, _margin: none, _opacity: "0.85" }),
    "bs-member-list": { _display: "flex", _direction: "column", _width: "100%" },
    "bs-member-row": merge({ _display: "flex", _direction: "row", _alignItems: "center", _columnGap: x.v("space-m"), _padding: { top: x.v("space-s"), right: "0", bottom: x.v("space-s"), left: "0" } }, bottomLine),
    "bs-member-row__body": { _display: "flex", _direction: "column", _rowGap: "2px" },

    // Work
    "bs-work-bento": { _display: "grid", _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _gridAutoRows: "clamp(220px, 24vw, 320px)", _gridGap: x.v("space-s"), _width: "100%" },
    "bs-work-tile": merge(x.round("radius-l"), x.pad("space-m"), overlay("bs-work-tile"), { _display: "flex", _direction: "column", _justifyContent: "flex-end", _alignItems: "flex-start", _rowGap: "10px" }),
    "bs-work-tile--tall": { _gridItemRowSpan: "2", "_gridItemRowSpan:tablet_portrait": "1" },
    "bs-work-tile--wide": { _gridItemColumnSpan: "2", "_gridItemColumnSpan:tablet_portrait": "1" },
    "bs-work-tile__title": merge(x.type({ size: "text-xl", weight: "heading-weight", lh: "1.25" }), { _typography: { color: onPhoto }, _margin: none }, x.font("bs-work-tile__title", "heading", " text-wrap: balance;")),
    "bs-work-list": { _display: "flex", _direction: "column", _width: "100%" },
    "bs-work-row": merge({ _display: "grid", _gridTemplateColumns: "56px minmax(0, 1fr) 200px", "_gridTemplateColumns:mobile_landscape": "40px minmax(0, 1fr)", _columnGap: x.v("space-m"), _alignItems: "center", _padding: { top: x.v("space-m"), right: "0", bottom: x.v("space-m"), left: "0" } }, bottomLine),
    "bs-work-row__num": merge(x.type({ size: "text-s", weight: "700", color: "muted" }), { _margin: none }),
    "bs-work-row__body": { _display: "flex", _direction: "column", _rowGap: "6px", _alignItems: "flex-start" },
    "bs-work-row__img": merge(x.round("radius-m"), { _width: "100%", _aspectRatio: "16/10", _objectFit: "cover", "_display:mobile_landscape": "none" }),
  };
}

const serviceBand = (ctx: Ctx, children: KitNode[], surface: "page" | "alt" = "page") =>
  band({ surface, label: "Services", id: ctx.c.anchors.services, classes: "bs-services" }, children);
const pad2 = (i: number) => String(i + 1).padStart(2, "0");
const bgPhoto = (key: PhotoKey) => ({ _background: { image: { url: PHOTOS[key].url, size: "full" }, size: "cover", position: "center center", repeat: "no-repeat" } });
const iconItem = (item: Ctx["c"]["features"]["items"][number], classes = "bs-icon-item") => div(classes, [icon(item.icon, "bs-card__icon"), heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text")], item.title);
const stat = (item: Ctx["c"]["stats"]["items"][number], classes = "bs-stat") => div(classes, [text(item.value, "bs-stat__value"), text(item.label, "bs-stat__label")], item.label);

export const servicesPlusVariants: Variant[] = [
  {
    type: "services", id: "numbered", name: { de: "Nummeriert", en: "Numbered" }, classes: bodyPlusClasses,
    build: ctx => serviceBand(ctx, [
      intro({ eyebrow: ctx.c.services.eyebrow, title: ctx.c.services.title, lead: ctx.c.services.lead }),
      div("bs-num-grid", ctx.c.services.items.map((item, i) => div("bs-num-item", [
        text(pad2(i), "bs-num-item__num"), heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text"), item.price ? text(item.price, "bs-price-tag") : null,
      ], item.title)), "Services"),
    ]),
  },
  {
    type: "services", id: "photos", name: { de: "Bildkarten", en: "Photo cards" }, classes: bodyPlusClasses,
    build: ctx => serviceBand(ctx, [
      intro({ eyebrow: ctx.c.services.eyebrow, title: ctx.c.services.title, lead: ctx.c.services.lead, center: true }),
      div("bs-grid bs-cols--3", ctx.c.services.items.map(item => div("bs-photo-card", [
        image(PHOTOS[item.image].url, PHOTOS[item.image].alt[ctx.c.lang], "bs-photo-card__img"),
        div("bs-photo-card__body", [
          heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text"),
          div("bs-photo-card__foot", [item.price ? text(item.price, "bs-price-inline") : null, textLink(ctx.c.navCta.label, ctx.c.navCta.href, "bs-link", "arrow-forward")]),
        ]),
      ], item.title)), "Services"),
    ], "alt"),
  },
  {
    type: "services", id: "tabs", name: { de: "Tabs", en: "Tabs" }, classes: bodyPlusClasses,
    build: ctx => serviceBand(ctx, [
      intro({ eyebrow: ctx.c.services.eyebrow, title: ctx.c.services.title, lead: ctx.c.services.lead }),
      tabs("line", ctx.c.services.items.slice(0, 4).map(item => ({
        label: item.title,
        pane: div("bs-tab-panel", [
          photo(ctx, item.image, "4x3"),
          div("bs-row__text", [icon(item.icon, "bs-card__icon"), heading("h3", item.title, "bs-title bs-size--l"), text(item.text, "bs-lead"), item.price ? text(item.price, "bs-price-inline") : null, textLink(ctx.c.navCta.label, ctx.c.navCta.href, "bs-link", "arrow-forward")]),
        ]),
      })), "Service tabs"),
    ]),
  },
];

export const featuresPlusVariants: Variant[] = [
  {
    type: "features", id: "cards", name: { de: "Karten mit Symbol", en: "Cards with icons" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "alt", label: "Benefits", classes: "bs-features" }, [
      intro({ eyebrow: ctx.c.features.eyebrow, title: ctx.c.features.title, lead: ctx.c.features.lead, center: true }),
      div("bs-grid bs-cols--2", ctx.c.features.items.map(item => div("bs-card", [
        div("bs-hcard", [icon(item.icon, "bs-card__icon"), div("bs-hcard__body", [heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text")])]),
      ], item.title)), "Benefits"),
    ]),
  },
  {
    type: "features", id: "trio", name: { de: "Bild in der Mitte", en: "Image in the middle" }, classes: bodyPlusClasses,
    build: ctx => {
      const items = ctx.c.features.items;
      return band({ surface: "page", label: "Benefits", classes: "bs-features" }, [
        intro({ eyebrow: ctx.c.features.eyebrow, title: ctx.c.features.title, lead: ctx.c.features.lead, center: true }),
        div("bs-trio", [
          div("bs-trio__col", items.slice(0, 2).map(item => iconItem(item))),
          photo(ctx, ctx.c.about.secondImage, "hero", "bs-trio__img"),
          div("bs-trio__col", items.slice(2, 4).map(item => iconItem(item))),
        ], "Benefits"),
      ]);
    },
  },
  {
    type: "features", id: "dark", name: { de: "Dunkel mit Linien", en: "Dark with rules" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "inverse", label: "Benefits", classes: "bs-features" }, [
      intro({ eyebrow: ctx.c.features.eyebrow, title: ctx.c.features.title, lead: ctx.c.features.lead }),
      div("bs-icon-grid", ctx.c.features.items.map(item => iconItem(item, "bs-icon-item bs-line-item")), "Benefits"),
    ]),
  },
];

export const stepsPlusVariants: Variant[] = [
  {
    type: "steps", id: "vertical", name: { de: "Senkrecht mit Linie", en: "Vertical with line" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "page", label: "Process" }, [
      div("bs-svc-layout", [
        div("bs-svc-layout__intro", [intro({ eyebrow: ctx.c.steps.eyebrow, title: ctx.c.steps.title, lead: ctx.c.steps.lead })]),
        div("bs-vsteps", ctx.c.steps.items.map((step, i) => div("bs-vstep", [
          text(String(i + 1), "bs-circle-num"),
          div("bs-vstep__body", [heading("h3", step.title, "bs-card__title"), text(step.text, "bs-card__text")]),
        ], step.title)), "Steps"),
      ]),
    ]),
  },
  {
    type: "steps", id: "numbers", name: { de: "Zentriert mit Nummern", en: "Centred with numbers" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "alt", label: "Process" }, [
      intro({ eyebrow: ctx.c.steps.eyebrow, title: ctx.c.steps.title, lead: ctx.c.steps.lead, center: true }),
      div(`bs-grid ${ctx.c.steps.items.length === 4 ? "bs-cols--4" : "bs-cols--3"}`, ctx.c.steps.items.map((step, i) => div("bs-hstep", [
        text(String(i + 1), "bs-circle-num"), heading("h3", step.title, "bs-card__title"), text(step.text, "bs-card__text"),
      ], step.title)), "Steps"),
    ]),
  },
];

export const statsPlusVariants: Variant[] = [
  {
    type: "stats", id: "cards", name: { de: "Zahlenkarten", en: "Number cards" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "alt", label: "Stats" }, [
      intro({ eyebrow: ctx.c.stats.eyebrow, title: ctx.c.stats.title, center: true }),
      div("bs-grid bs-cols--4", ctx.c.stats.items.map(item => div("bs-card", [text(item.value, "bs-stat__value"), text(item.label, "bs-stat__label")], item.label)), "Stats"),
    ]),
  },
  {
    type: "stats", id: "split", name: { de: "Bild mit Zahlen", en: "Image with numbers" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "page", label: "Stats" }, [
      div("bs-split", [
        photo(ctx, ctx.c.about.image, "4x3"),
        div("bs-stack", [intro({ eyebrow: ctx.c.stats.eyebrow, title: ctx.c.stats.title }), div("bs-stats-2", ctx.c.stats.items.map(item => stat(item, "bs-stat bs-stat--line")), "Stats")]),
      ]),
    ]),
  },
];

export const contentPlusVariants: Variant[] = [
  {
    type: "content", id: "numbers", name: { de: "Über uns mit Zahlen", en: "About with numbers" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "page", label: "About", id: ctx.c.anchors.about }, [
      div("bs-split", [
        div("bs-stack", [intro({ eyebrow: ctx.c.about.eyebrow, title: ctx.c.about.title }), ...ctx.c.about.paragraphs.map(p => text(p, "bs-text"))], "About text"),
        div("bs-stats-2", ctx.c.stats.items.map(item => div("bs-card", [text(item.value, "bs-stat__value"), text(item.label, "bs-stat__label")], item.label)), "Stats"),
      ]),
    ]),
  },
  {
    type: "content", id: "collage", name: { de: "Bildcollage", en: "Photo collage" }, classes: bodyPlusClasses,
    build: ctx => {
      const second = PHOTOS[ctx.c.about.secondImage];
      return band({ surface: "alt", label: "About", id: ctx.c.anchors.about }, [
        div("bs-split", [
          div("bs-collage", [photo(ctx, ctx.c.about.image, "4x5", "bs-collage__main"), image(second.url, second.alt[ctx.c.lang], "bs-collage__inset")], "Photos"),
          div("bs-stack", [
            intro({ eyebrow: ctx.c.about.eyebrow, title: ctx.c.about.title }),
            ...ctx.c.about.paragraphs.map(p => text(p, "bs-text")),
            checklist(ctx.c.about.points, "bs-text"),
            textLink(ctx.c.navCta.label, ctx.c.navCta.href, "bs-link", "arrow-forward"),
          ], "About text"),
        ]),
      ]);
    },
  },
  {
    type: "content", id: "statement", name: { de: "Leitsatz mit Bildband", en: "Statement with wide image" }, classes: bodyPlusClasses,
    build: ctx => {
      const p = PHOTOS[ctx.c.about.image];
      return band({ surface: "page", label: "About", id: ctx.c.anchors.about }, [
        div("bs-statement", [
          text(ctx.c.about.eyebrow, "bs-eyebrow"),
          heading("h2", ctx.c.about.title, "bs-title bs-size--xl bs-statement__title"),
          div("bs-statement__cols", ctx.c.about.paragraphs.map(par => text(par, "bs-lead"))),
        ], "Statement"),
        image(p.url, p.alt[ctx.c.lang], "bs-media bs-ratio--wide"),
      ]);
    },
  },
];

export const timelinePlusVariants: Variant[] = [
  {
    type: "timeline", id: "horizontal", name: { de: "Waagrecht", en: "Horizontal" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "alt", label: "Timeline" }, [
      intro({ eyebrow: ctx.c.timeline.eyebrow, title: ctx.c.timeline.title }),
      div("bs-htimeline", ctx.c.timeline.items.map(item => div("bs-htimeline__item", [text(item.year, "bs-year"), heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text")], item.year)), "Timeline"),
    ]),
  },
];

export const teamPlusVariants: Variant[] = [
  {
    type: "team", id: "overlay", name: { de: "Fotokarten", en: "Photo cards" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "alt", label: "Team", id: ctx.c.anchors.team }, [
      intro({ eyebrow: ctx.c.team.eyebrow, title: ctx.c.team.title, lead: ctx.c.team.lead, center: true }),
      div("bs-team-grid", ctx.c.team.members.map(m => ({
        name: "div", classes: ["bs-team-card"], settings: bgPhoto(m.photo), label: m.name,
        children: [heading("h3", m.name, "bs-team-card__name"), text(m.role, "bs-team-card__role")],
      })), "Members"),
    ]),
  },
  {
    type: "team", id: "list", name: { de: "Liste", en: "List" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "page", label: "Team", id: ctx.c.anchors.team }, [
      div("bs-svc-layout", [
        div("bs-svc-layout__intro", [intro({ eyebrow: ctx.c.team.eyebrow, title: ctx.c.team.title, lead: ctx.c.team.lead })]),
        div("bs-member-list", ctx.c.team.members.map(m => div("bs-member-row", [
          image(PHOTOS[m.photo].url, PHOTOS[m.photo].alt[ctx.c.lang], "bs-avatar--l"),
          div("bs-member-row__body", [heading("h3", m.name, "bs-card__title"), text(m.role, "bs-small")]),
        ], m.name)), "Members"),
      ]),
    ]),
  },
];

export const portfolioPlusVariants: Variant[] = [
  {
    type: "portfolio", id: "bento", name: { de: "Bento", en: "Bento" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "page", label: "Portfolio", id: ctx.c.anchors.portfolio }, [
      intro({ eyebrow: ctx.c.portfolio.eyebrow, title: ctx.c.portfolio.title, lead: ctx.c.portfolio.lead }),
      // Four tiles fill three columns: a tall one, a wide one and two small ones.
      div("bs-work-bento", ctx.c.portfolio.items.slice(0, 4).map((item, i) => ({
        name: "div", classes: ["bs-work-tile", ...(i === 0 ? ["bs-work-tile--tall"] : i === 1 ? ["bs-work-tile--wide"] : [])], settings: bgPhoto(item.image), label: item.title,
        children: [text(item.category, "bs-badge"), heading("h3", item.title, "bs-work-tile__title")],
      })), "Projects"),
    ]),
  },
  {
    type: "portfolio", id: "index", name: { de: "Projektliste", en: "Project index" }, classes: bodyPlusClasses,
    build: ctx => band({ surface: "page", label: "Portfolio", id: ctx.c.anchors.portfolio }, [
      intro({ eyebrow: ctx.c.portfolio.eyebrow, title: ctx.c.portfolio.title, lead: ctx.c.portfolio.lead }),
      div("bs-work-list", ctx.c.portfolio.items.map((item, i) => div("bs-work-row", [
        text(pad2(i), "bs-work-row__num"),
        div("bs-work-row__body", [heading("h3", item.title, "bs-title bs-size--l"), text(item.category, "bs-small")]),
        image(PHOTOS[item.image].url, PHOTOS[item.image].alt[ctx.c.lang], "bs-work-row__img"),
      ], item.title)), "Projects"),
    ]),
  },
];

portfolioPlusVariants.push({
  type: "portfolio", id: "carousel", name: { de: "Karussell", en: "Carousel" }, classes: bodyPlusClasses,
  build: ctx => band({ surface: "alt", label: "Portfolio", id: ctx.c.anchors.portfolio }, [
    intro({ eyebrow: ctx.c.portfolio.eyebrow, title: ctx.c.portfolio.title, lead: ctx.c.portfolio.lead }),
    slider(ctx, ctx.c.portfolio.items.map(item => div("bs-work", [photo(ctx, item.image, "4x3"), text(item.category, "bs-badge"), heading("h3", item.title, "bs-title bs-size--s")], item.title)), { perPage: 3, label: "Projects" }),
  ]),
});
