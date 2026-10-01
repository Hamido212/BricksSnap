import { button, div, heading, icon, node, text, textLink, type KitNode } from "../build";
import { PHOTOS } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import type { Link } from "../content";
import { actions, band, checklist, photo, stars, type Ctx, type Variant } from "./common";

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function brand(ctx: Ctx): KitNode {
  return textLink(ctx.c.brand.name, "/", "bs-brand");
}
/**
 * Bricks' nestable nav with its mobile menu, in the structure Bricks 2.4 creates: a "Nav items"
 * list (brx-nav-nested-items) with the links and a close toggle (brx-toggle-div), then the open
 * toggle. Below the tablet breakpoint Bricks shows the toggle and opens the list as an overlay.
 */
export function navLinks(ctx: Ctx, classes = "bs-mainnav", cta: Link | null = ctx.c.navCta): KitNode {
  const de = ctx.c.lang === "de";
  return node("nav-nested", classes, { ariaLabel: de ? "Hauptnavigation" : "Main navigation", mobileMenu: "tablet_portrait" }, [
    node("block", "bs-mainnav__items", { tag: "ul", _hidden: { _cssClasses: "brx-nav-nested-items" } }, [
      ...ctx.c.nav.map(link => textLink(link.label, link.href, "bs-nav__link")),
      // On phones the header button moves into the open menu.
      cta ? button(cta.label, cta.href, "bs-btn bs-btn-size--m bs-btn--primary bs-mainnav__cta") : null,
      node("toggle", "bs-mainnav__toggle bs-mainnav__close", { ariaLabel: de ? "Menü schließen" : "Close menu", animation: "squeeze", _hidden: { _cssClasses: "brx-toggle-div" } }, [], "Toggle (close: mobile)"),
    ], "Nav items"),
    node("toggle", "bs-mainnav__toggle bs-mainnav__open", { ariaLabel: de ? "Menü öffnen" : "Open menu", animation: "squeeze" }, [], "Toggle (open: mobile)"),
  ], "Navigation");
}

function headerClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    "bs-header": merge({ _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") } }),
    "bs-header-group": { _display: "flex", _direction: "column", _width: "100%" },
    "bs-header__bar": { _direction: "row", _justifyContent: "space-between", _alignItems: "center", _columnGap: x.v("space-m"), _flexWrap: "nowrap" },
    // A long business name wraps on narrow screens instead of pushing the header button out.
    "bs-brand": merge(
      x.type({ size: "text-xl", weight: "heading-weight", ls: "heading-tracking", color: "heading", decoration: "none", lh: "1.15" }),
      x.font("bs-brand", "heading", " text-wrap: balance; overflow-wrap: break-word;"),
      { _flexShrink: "1", _widthMin: "0", "_typography:mobile_portrait": { "font-size": x.v("text-m") } },
    ),
    // Mobile menu: Bricks shows the toggles and the overlay below the tablet breakpoint. These
    // classes never set display, so Bricks' own show/hide rules stay in charge.
    "bs-mainnav": { "_order:tablet_portrait": "3" },
    "bs-mainnav__items": {
      _columnGap: "clamp(18px, 2.4vw, 36px)",
      _cssCustom: `.bs-mainnav.brx-open .bs-mainnav__items { background-color: ${x.v("bg")}; row-gap: ${x.v("space-m")}; align-items: stretch; padding: 88px ${x.v("gutter")} ${x.v("space-l")}; }\n.bs-mainnav.brx-open .bs-nav__link { font-size: ${x.v("text-xl")}; color: ${x.v("heading")}; }`,
    },
    // A compact hamburger: 26px wide bars instead of Bricks' 40px, so it leaves room on phones.
    "bs-mainnav__toggle": { _cursor: "pointer", _cssCustom: ".bs-mainnav__toggle { --brxe-toggle-bar-width: 26px; --brxe-toggle-bar-height: 3px; }\n.bs-mainnav__toggle .brxa-wrap { width: 26px; }" },
    // Its list item stays hidden in the desktop bar and shows in the open menu.
    "bs-mainnav__cta": { _cssCustom: `.bs-mainnav__items > li:has(> .bs-mainnav__cta) { display: none; }\n.bs-mainnav.brx-open .bs-mainnav__items > li:has(> .bs-mainnav__cta) { display: block; margin-top: ${x.v("space-s")}; }` },
    "bs-header__actions--collapse": { "_display:mobile_portrait": "none" },
    "bs-mainnav__open": x.type({ color: "inherit" }),
    "bs-mainnav__close": merge(x.type({ color: "heading" }), { _position: "absolute", _top: "20px", _right: x.v("gutter") }),
    "bs-nav__link": merge(x.type({ size: "15px", weight: "500", color: "text", decoration: "none" }), { _cssTransition: "color .2s ease", "_typography:hover": { color: x.color("link") } }),
    // From tablets on, the button sits next to the menu toggle on the right.
    "bs-header__actions": { _display: "flex", _direction: "row", _columnGap: x.v("space-s"), _alignItems: "center", _flexShrink: "0", "_margin:tablet_portrait": { left: "auto" } },
    "bs-header__phone": merge(x.type({ size: "15px", weight: "600", color: "heading", decoration: "none" }), { "_display:mobile_landscape": "none" }),
    "bs-topbar": merge(x.type({ size: "text-xs", color: "on-inverse" }), { _display: "flex", _direction: "row", _justifyContent: "space-between", _columnGap: x.v("space-m"), _rowGap: "4px", _flexWrap: "wrap", _width: "100%", _widthMax: x.v("container"), _margin: { left: "auto", right: "auto" } }),
    "bs-topbar__item": merge(x.type({ size: "text-xs", color: "on-inverse", decoration: "none" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-topbar__group": { _display: "flex", _direction: "row", _columnGap: x.v("space-m"), _flexWrap: "wrap" },
  };
}

export const headerVariants: Variant[] = [
  {
    type: "navbar", id: "classic", name: { de: "Klassisch", en: "Classic" }, classes: headerClasses,
    build: ctx => band({ surface: "page", space: "bar", label: "Header", classes: "bs-header", containerClasses: "bs-header__bar" }, [
      brand(ctx),
      navLinks(ctx),
      div("bs-header__actions bs-header__actions--collapse", [button(ctx.c.navCta.label, ctx.c.navCta.href, "bs-btn bs-btn-size--s bs-btn--primary")]),
    ]),
  },
  {
    type: "navbar", id: "topbar", name: { de: "Mit Kontaktleiste", en: "With contact bar" }, classes: headerClasses,
    build: ctx => node("div", "bs-header-group", {}, [
      band({ surface: "inverse", space: "micro", label: "Top bar" }, [
        div("bs-topbar", [
          div("bs-topbar__group", [textLink(ctx.c.brand.phone, telHref(ctx.c.brand.phone), "bs-topbar__item"), text(ctx.c.brand.address, "bs-topbar__item")]),
          text(ctx.c.brand.hours.join(" · "), "bs-topbar__item"),
        ]),
      ]),
      band({ surface: "page", space: "bar", label: "Header", classes: "bs-header", containerClasses: "bs-header__bar" }, [
        brand(ctx),
        navLinks(ctx),
        div("bs-header__actions bs-header__actions--collapse", [button(ctx.c.navCta.label, ctx.c.navCta.href, "bs-btn bs-btn-size--s bs-btn--primary")]),
      ]),
    ], "Header with contact bar"),
  },
  {
    type: "navbar", id: "minimal", name: { de: "Minimal mit Telefon", en: "Minimal with phone" }, classes: headerClasses,
    build: ctx => band({ surface: "page", space: "bar", label: "Header", classes: "bs-header", containerClasses: "bs-header__bar" }, [
      brand(ctx),
      div("bs-header__actions", [
        textLink(ctx.c.brand.phone, telHref(ctx.c.brand.phone), "bs-header__phone", "call"),
        button(ctx.c.navCta.label, ctx.c.navCta.href, "bs-btn bs-btn-size--s bs-btn--primary"),
      ]),
    ]),
  },
];

function heroClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    // The hero's buttons get extra room below the lead, most noticeable on phones.
    "bs-hero": { _cssCustom: ".bs-hero.bs-hero .bs-btn-row { margin-top: 8px; }" },
    "bs-hero__content": { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "flex-start" },
    "bs-hero__visual": { _position: "relative", _width: "100%" },
    "bs-hero__badge": merge(x.bg("surface"), x.round("radius-m"), x.pad("12px", "16px"), x.shadow("16px", "40px", "-16px"), {
      _position: "absolute", _left: "-20px", _bottom: "28px", "_left:tablet_portrait": "16px", _display: "flex", _direction: "row", _columnGap: "12px", _alignItems: "center",
    }),
    "bs-hero__badge-text": merge(x.type({ size: "14px", weight: "600", color: "heading", lh: "1.3" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-hero--cover": merge({ _position: "relative", _heightMin: "min(88vh, 820px)", _justifyContent: "center", _overflow: "hidden" }, {
      _cssCustom: `.bs-hero--cover::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, ${x.v("inverse")} 88%, transparent) 0%, color-mix(in srgb, ${x.v("inverse")} 55%, transparent) 55%, color-mix(in srgb, ${x.v("inverse")} 20%, transparent) 100%); }\n.bs-hero--cover > * { position: relative; z-index: 1; }`,
    }),
    "bs-hero__cover-content": { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "flex-start", _widthMax: "720px" },
    "bs-hero__wide": { _widthMax: "1120px", _margin: { left: "auto", right: "auto" } },
    "bs-panel": merge(x.bg("surface"), x.line("1px", "border"), x.round("radius-l"), x.pad("space-card"), x.shadow("24px", "60px", "-28px"), { _display: "flex", _direction: "column", _rowGap: "14px", _width: "100%" }),
    "bs-panel__head": { _display: "flex", _direction: "row", _columnGap: "12px", _alignItems: "center" },
    "bs-panel__line": merge(x.type({ size: "text-m", color: "text" }), {
      _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") }, _padding: { top: "0", right: "0", bottom: "12px", left: "0" }, _margin: { top: "0", bottom: "0" },
    }),
  };
}

export const heroVariants: Variant[] = [
  {
    type: "hero", id: "split", name: { de: "Text und Bild", en: "Text and image" }, classes: heroClasses,
    build: ctx => band({ surface: "page", label: "Hero", classes: "bs-hero" }, [
      div("bs-split", [
        div("bs-hero__content", [
          text(ctx.c.hero.eyebrow, "bs-eyebrow"),
          heading("h1", ctx.c.hero.title, "bs-title bs-size--display"),
          text(ctx.c.hero.lead, "bs-lead"),
          actions([ctx.c.hero.primary, ctx.c.hero.secondary]),
          checklist(ctx.c.hero.points),
        ], "Hero text"),
        div("bs-hero__visual", [
          photo(ctx, ctx.c.hero.image, "hero"),
          div("bs-hero__badge", [stars(), text(`${ctx.c.testimonials.rating.score} · ${ctx.c.testimonials.rating.count}`, "bs-hero__badge-text")], "Rating badge"),
        ], "Hero image"),
      ]),
    ]),
  },
  {
    type: "hero", id: "centered", name: { de: "Zentriert mit Bild", en: "Centred with image" }, classes: heroClasses,
    build: ctx => band({ surface: "page", label: "Hero", classes: "bs-hero", containerClasses: "bs-align--center" }, [
      node("div", "bs-intro--center", {}, [
        text(ctx.c.hero.eyebrow, "bs-eyebrow"),
        heading("h1", ctx.c.hero.title, "bs-title bs-size--display"),
        text(ctx.c.hero.lead, "bs-lead"),
        actions([ctx.c.hero.primary, ctx.c.hero.secondary]),
      ], "Hero text"),
      photo(ctx, ctx.c.hero.image, "16x10", "bs-hero__wide"),
    ]),
  },
  {
    type: "hero", id: "cover", name: { de: "Vollbild mit Titelbild", en: "Full-bleed cover" }, classes: heroClasses,
    build: ctx => band({
      surface: "inverse", label: "Hero", classes: "bs-hero bs-hero--cover",
      settings: { _background: { image: { url: PHOTOS[ctx.c.hero.image].url, size: "full" }, size: "cover", position: "center center", repeat: "no-repeat" } },
    }, [
      div("bs-hero__cover-content", [
        text(ctx.c.hero.eyebrow, "bs-eyebrow"),
        heading("h1", ctx.c.hero.title, "bs-title bs-size--display"),
        text(ctx.c.hero.lead, "bs-lead"),
        actions([ctx.c.hero.primary, ctx.c.hero.secondary], "inverse"),
      ], "Hero text"),
    ]),
  },
  {
    type: "hero", id: "panel", name: { de: "Mit Infobox", en: "With info panel" }, classes: heroClasses,
    build: ctx => band({ surface: "alt", label: "Hero", classes: "bs-hero" }, [
      div("bs-split", [
        div("bs-hero__content", [
          text(ctx.c.hero.eyebrow, "bs-eyebrow"),
          heading("h1", ctx.c.hero.title, "bs-title bs-size--display"),
          text(ctx.c.hero.lead, "bs-lead"),
          actions([ctx.c.hero.primary, ctx.c.hero.secondary]),
        ], "Hero text"),
        div("bs-panel", [
          div("bs-panel__head", [icon("time", "bs-card__icon"), heading("h2", ctx.c.hero.panelTitle, "bs-card__title")]),
          ...ctx.c.hero.panelLines.map(line => text(line, "bs-panel__line")),
          checklist(ctx.c.hero.points),
          button(ctx.c.brand.phone, telHref(ctx.c.brand.phone), "bs-btn bs-btn-size--m bs-btn--primary"),
        ], "Info panel"),
      ]),
    ]),
  },
];
