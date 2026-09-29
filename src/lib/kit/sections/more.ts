import { button, div, heading, icon, image, node, text, textLink, type KitNode } from "../build";
import { PHOTOS } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import { actions, band, checklist, infoRow, intro, photo, type Ctx, type Variant } from "./common";

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

function footerClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    "bs-footer__grid": { _display: "grid", _gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", "_gridTemplateColumns:mobile_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-l"), _width: "100%" },
    "bs-footer__col": { _display: "flex", _direction: "column", _rowGap: "10px", _alignItems: "flex-start" },
    "bs-footer__title": merge(x.type({ size: "text-xs", weight: "700", ls: "0.1em", transform: "uppercase", color: "inherit" }), { _margin: { top: "0", bottom: "6px" } }),
    "bs-footer__link": merge(x.type({ size: "15px", color: "inherit", decoration: "none" }), { _opacity: "0.8", "_opacity:hover": "1", _cssTransition: "opacity .2s ease" }),
    "bs-footer__bottom": merge({ _display: "flex", _direction: "row", "_direction:mobile_landscape": "column", _justifyContent: "space-between", _columnGap: x.v("space-m"), _rowGap: "8px", _width: "100%", _padding: { top: x.v("space-m"), right: "0", bottom: "0", left: "0" } }, {
      _border: { width: { top: "1px", right: "0", bottom: "0", left: "0" }, style: "solid", color: { raw: "currentColor" } }, _cssCustom: ".bs-footer__bottom { border-top-color: color-mix(in srgb, currentColor 18%, transparent); }",
    }),
    "bs-footer__legal": { _display: "flex", _direction: "row", _columnGap: x.v("space-m"), _flexWrap: "wrap" },
    "bs-footer__small": merge(x.type({ size: "14px", color: "inherit" }), { _margin: { top: "0", bottom: "0" }, _opacity: "0.72" }),
    "bs-socials": { _display: "flex", _direction: "row", _columnGap: "14px" },
    "bs-socials__icon": merge(x.type({ size: "20px", color: "inherit" }), { _opacity: "0.8", "_opacity:hover": "1" }),
    "bs-footer__row": { _display: "flex", _direction: "row", "_direction:mobile_landscape": "column", _justifyContent: "space-between", _alignItems: "center", "_alignItems:mobile_landscape": "flex-start", _columnGap: x.v("space-m"), _rowGap: x.v("space-s"), _width: "100%" },
    "bs-footer__nav": { _display: "flex", _direction: "row", _columnGap: x.v("space-m"), _rowGap: "8px", _flexWrap: "wrap" },
    "bs-footer__contact": { _display: "grid", _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-m"), _width: "100%" },
  };
}

const socials = () => div("bs-socials", (["logo-instagram", "logo-facebook", "logo-linkedin"] as const).map(key => icon(key, "bs-socials__icon", "#")), "Social links");
const legalRow = (ctx: Ctx) => div("bs-footer__bottom", [
  text(ctx.c.footer.copyright, "bs-footer__small"),
  div("bs-footer__legal", ctx.c.footer.legal.map(link => textLink(link.label, link.href, "bs-footer__link"))),
], "Legal");

export const footerVariants: Variant[] = [
  {
    type: "footer", id: "columns", name: { de: "Spalten", en: "Columns" }, classes: footerClasses,
    build: ctx => band({ surface: "inverse", space: "tight", label: "Footer", classes: "bs-footer" }, [
      div("bs-footer__grid", [
        div("bs-footer__col", [textLink(ctx.c.brand.name, "/", "bs-brand"), text(ctx.c.footer.tagline, "bs-footer__small"), socials()], "Brand"),
        ...ctx.c.footer.columns.map(col => div("bs-footer__col", [text(col.title, "bs-footer__title"), ...col.links.map(link => textLink(link.label, link.href, "bs-footer__link"))], col.title)),
        div("bs-footer__col", [
          text(ctx.c.contact.eyebrow, "bs-footer__title"),
          textLink(ctx.c.brand.phone, telHref(ctx.c.brand.phone), "bs-footer__link"),
          ctx.c.brand.email ? textLink(ctx.c.brand.email, `mailto:${ctx.c.brand.email}`, "bs-footer__link") : null,
          text(ctx.c.brand.address, "bs-footer__small"),
        ], "Contact"),
      ]),
      legalRow(ctx),
    ]),
  },
  {
    type: "footer", id: "simple", name: { de: "Schlicht", en: "Simple" }, classes: footerClasses,
    build: ctx => band({ surface: "alt", space: "tight", label: "Footer", classes: "bs-footer" }, [
      div("bs-footer__row", [
        textLink(ctx.c.brand.name, "/", "bs-brand"),
        node("div", "bs-footer__nav", { tag: "nav" }, ctx.c.nav.map(link => textLink(link.label, link.href, "bs-footer__link"))),
        socials(),
      ]),
      legalRow(ctx),
    ]),
  },
  {
    type: "footer", id: "contact", name: { de: "Mit Kontaktdaten", en: "With contact details" }, classes: footerClasses,
    build: ctx => band({ surface: "inverse", space: "tight", label: "Footer", classes: "bs-footer" }, [
      div("bs-footer__row", [textLink(ctx.c.brand.name, "/", "bs-brand"), text(ctx.c.footer.tagline, "bs-footer__small")]),
      div("bs-footer__contact", [
        infoRow("call", ctx.c.ui.callUs, ctx.c.brand.phone, telHref(ctx.c.brand.phone)),
        infoRow("pin", ctx.c.ui.visitUs, ctx.c.brand.address),
        infoRow("time", ctx.c.ui.openingHours, ctx.c.brand.hours.join(" · ")),
      ], "Contact"),
      legalRow(ctx),
    ]),
  },
];

function moreClasses(r: ResolvedKit) {
  const x = sx(r);
  return {
    "bs-step__num": merge(x.type({ size: "text-xs", weight: "700", ls: "0.08em", color: "link" }), x.bg("primary-soft"), x.round("999px"), x.pad("6px", "12px"), { _margin: { top: "0", bottom: "0" } }),
    "bs-stats": { _display: "grid", _gridTemplateColumns: "repeat(4, minmax(0, 1fr))", "_gridTemplateColumns:tablet_portrait": "repeat(2, minmax(0, 1fr))", _gridGap: x.v("space-l"), _width: "100%" },
    "bs-stat": { _display: "flex", _direction: "column", _rowGap: "6px" },
    "bs-stat__value": merge(x.type({ size: "text-3xl", weight: "heading-weight", ls: "heading-tracking", lh: "1", color: "heading" }), { _margin: { top: "0", bottom: "0" } }, x.font("bs-stat__value", "heading")),
    "bs-stat__label": merge(x.type({ size: "text-s", color: "muted" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-member": { _display: "flex", _direction: "column", _rowGap: "6px" },
    "bs-member__photo": { _margin: { bottom: "10px" } },
    "bs-work": { _display: "flex", _direction: "column", _rowGap: "12px", _alignItems: "flex-start" },
    "bs-timeline": merge({ _display: "flex", _direction: "column", _rowGap: x.v("space-l"), _widthMax: "760px", _width: "100%", _padding: { top: "0", right: "0", bottom: "0", left: x.v("space-m") } }, {
      _border: { width: { top: "0", right: "0", bottom: "0", left: "2px" }, style: "solid", color: x.color("border") },
    }),
    "bs-timeline__item": { _display: "flex", _direction: "column", _rowGap: "6px", _position: "relative", _cssCustom: `.bs-timeline__item::before { content: ""; position: absolute; left: calc(-1 * ${x.v("space-m")} - 7px); top: 6px; width: 12px; height: 12px; border-radius: 50%; background: ${x.v("primary")}; box-shadow: 0 0 0 4px ${x.v("bg")}; }` },
    "bs-year": merge(x.type({ size: "text-s", weight: "700", color: "link" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-faq": { _display: "grid", _gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "start", _width: "100%" },
    "bs-faq__list": { _display: "flex", _direction: "column", _width: "100%" },
    "bs-faq__item": merge({ _display: "flex", _direction: "column", _rowGap: "8px", _padding: { top: x.v("space-m"), right: "0", bottom: x.v("space-m"), left: "0" } }, {
      _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") },
    }),
    "bs-post": { _display: "flex", _direction: "column", _rowGap: "12px", _alignItems: "flex-start" },
    "bs-post__meta": merge(x.type({ size: "text-xs", weight: "600", ls: "0.04em", color: "muted" }), { _margin: { top: "0", bottom: "0" } }),
    "bs-logos": { _display: "flex", _direction: "row", _flexWrap: "wrap", _justifyContent: "center", _alignItems: "center", _columnGap: "clamp(28px, 5vw, 64px)", _rowGap: "16px", _width: "100%" },
    "bs-logos__name": merge(x.type({ size: "text-l", weight: "700", ls: "-0.01em", color: "muted" }), { _margin: { top: "0", bottom: "0" }, _opacity: "0.75" }, x.font("bs-logos__name", "heading", " white-space: nowrap;")),
    // Fixed row height: every photo fills its cell, wide ones span two columns.
    "bs-gallery": { _display: "grid", _gridTemplateColumns: "repeat(3, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "repeat(2, minmax(0, 1fr))", _gridAutoRows: "clamp(150px, 20vw, 280px)", _gridGap: x.v("space-s"), _width: "100%" },
    "bs-gallery__item": merge(x.round("radius-m"), { _width: "100%", _height: "100%", _objectFit: "cover", _overflow: "hidden" }),
    // Bricks has no grid span control on image elements, so the span lives in class CSS.
    "bs-gallery__wide": { _cssCustom: ".bs-gallery__wide { grid-column: span 2; }" },
    "bs-contact": { _display: "grid", _gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "start", _width: "100%" },
    "bs-contact__info": { _display: "flex", _direction: "column", _rowGap: x.v("space-m") },
    "bs-form-card": merge(x.bg("surface"), x.line("1px", "border"), x.round("radius-l"), x.pad("space-card"), { _display: "flex", _direction: "column", _rowGap: x.v("space-s"), _width: "100%" }),
    "bs-center": merge({ _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "center", _widthMax: "640px", _margin: { left: "auto", right: "auto" } }, x.type({ align: "center" })),
    "bs-code": merge(x.type({ size: "clamp(88px, 60px + 8vw, 160px)", weight: "heading-weight", ls: "heading-tracking", lh: "1", color: "link" }), { _margin: { top: "0", bottom: "0" } }, x.font("bs-code", "heading")),
    "bs-screen": { _heightMin: "min(80vh, 760px)", _justifyContent: "center" },
    "bs-form": { _width: "100%" },
  };
}

/** Bricks form with the kit's colors; fields depend on the purpose. */
function form(ctx: Ctx, fields: Array<{ type: string; label: string; required?: boolean; width?: number }>, submit: string, actions: string[] = ["email"]): KitNode {
  const { x } = ctx;
  const fieldId = (i: number) => `f${String(i + 1).padStart(5, "0")}`;
  return node("form", "bs-form", {
    fields: fields.map((f, i) => ({ id: fieldId(i), type: f.type, label: f.label, required: !!f.required, ...(f.width ? { width: f.width } : {}) })),
    ...(actions.includes("login") ? { loginName: fieldId(0), loginPassword: fieldId(1) } : {}),
    submitButtonText: submit,
    actions,
    ...(actions.includes("email") ? { emailSubject: `${ctx.c.brand.name}: ${ctx.c.contact.formTitle}`, emailTo: "admin_email", successMessage: ctx.c.lang === "de" ? "Danke! Wir melden uns in Kürze." : "Thank you! We’ll be in touch shortly." } : {}),
    // Form controls take values per element; they reference the design system variables.
    labelTypography: { "font-size": "14px", "font-weight": "600", color: x.color("heading") },
    fieldTypography: { "font-size": "16px", color: x.color("text") },
    fieldBackgroundColor: x.color("bg"),
    fieldBorder: { width: x.sides("1px"), style: "solid", color: x.color("border-strong"), radius: x.sides(x.v("radius-s")) },
    fieldPadding: { top: "12px", right: "14px", bottom: "12px", left: "14px" },
    fieldMargin: { bottom: "14px" },
    submitButtonBackgroundColor: x.color("primary"),
    submitButtonTypography: { "font-size": "16px", "font-weight": "600", color: x.color("on-primary") },
    submitButtonBorder: { radius: x.sides(x.v("radius-btn")) },
    submitButtonPadding: { top: "14px", right: "24px", bottom: "14px", left: "24px" },
  });
}

export const moreVariants: Variant[] = [
  {
    type: "steps", id: "cards", name: { de: "Schritte", en: "Steps" }, classes: moreClasses,
    build: ctx => band({ surface: "alt", label: "Process" }, [
      intro({ eyebrow: ctx.c.steps.eyebrow, title: ctx.c.steps.title, lead: ctx.c.steps.lead }),
      div(`bs-grid ${ctx.c.steps.items.length === 4 ? "bs-cols--4" : "bs-cols--3"}`, ctx.c.steps.items.map((step, i) => div("bs-card", [text(String(i + 1).padStart(2, "0"), "bs-step__num"), heading("h3", step.title, "bs-card__title"), text(step.text, "bs-card__text")], step.title)), "Steps"),
    ]),
  },
  {
    type: "stats", id: "row", name: { de: "Zahlenreihe", en: "Number row" }, classes: moreClasses,
    build: ctx => band({ surface: "page", space: "tight", label: "Stats" }, [
      div("bs-stats", ctx.c.stats.items.map(stat => div("bs-stat", [text(stat.value, "bs-stat__value"), text(stat.label, "bs-stat__label")], stat.label)), "Stats"),
    ]),
  },
  {
    type: "stats", id: "band", name: { de: "Zahlen im Farbband", en: "Numbers on colour" }, classes: moreClasses,
    build: ctx => band({ surface: "primary", label: "Stats" }, [
      intro({ eyebrow: ctx.c.stats.eyebrow, title: ctx.c.stats.title }),
      div("bs-stats", ctx.c.stats.items.map(stat => div("bs-stat", [text(stat.value, "bs-stat__value"), text(stat.label, "bs-stat__label")], stat.label)), "Stats"),
    ]),
  },
  {
    type: "team", id: "grid", name: { de: "Team", en: "Team" }, classes: moreClasses,
    build: ctx => band({ surface: "page", label: "Team", id: ctx.c.anchors.team }, [
      intro({ eyebrow: ctx.c.team.eyebrow, title: ctx.c.team.title, lead: ctx.c.team.lead }),
      div("bs-grid bs-cols--4", ctx.c.team.members.map(m => div("bs-member", [photo(ctx, m.photo, "1x1", "bs-member__photo"), heading("h3", m.name, "bs-card__title"), text(m.role, "bs-small")], m.name)), "Members"),
    ]),
  },
  {
    type: "portfolio", id: "grid", name: { de: "Referenzen", en: "Work" }, classes: moreClasses,
    build: ctx => band({ surface: "page", label: "Portfolio", id: ctx.c.anchors.portfolio }, [
      intro({ eyebrow: ctx.c.portfolio.eyebrow, title: ctx.c.portfolio.title, lead: ctx.c.portfolio.lead }),
      div("bs-grid bs-cols--2", ctx.c.portfolio.items.map(item => div("bs-work", [photo(ctx, item.image, "16x10"), text(item.category, "bs-badge"), heading("h3", item.title, "bs-title bs-size--s")], item.title)), "Projects"),
    ]),
  },
  {
    type: "timeline", id: "line", name: { de: "Zeitleiste", en: "Timeline" }, classes: moreClasses,
    build: ctx => band({ surface: "page", label: "Timeline" }, [
      intro({ eyebrow: ctx.c.timeline.eyebrow, title: ctx.c.timeline.title }),
      div("bs-timeline", ctx.c.timeline.items.map(item => div("bs-timeline__item", [text(item.year, "bs-year"), heading("h3", item.title, "bs-card__title"), text(item.text, "bs-card__text")], item.year)), "Timeline"),
    ]),
  },
  {
    type: "content", id: "split", name: { de: "Über uns", en: "About" }, classes: moreClasses,
    build: ctx => band({ surface: "page", label: "About", id: ctx.c.anchors.about }, [
      div("bs-split", [
        photo(ctx, ctx.c.about.image, "4x5"),
        div("bs-stack", [
          intro({ eyebrow: ctx.c.about.eyebrow, title: ctx.c.about.title }),
          ...ctx.c.about.paragraphs.map(p => text(p, "bs-text")),
          checklist(ctx.c.about.points, "bs-text"),
        ], "About text"),
      ]),
    ]),
  },
  {
    type: "faq", id: "split", name: { de: "Fragen und Antworten", en: "Questions and answers" }, classes: moreClasses,
    build: ctx => band({ surface: "page", label: "FAQ", id: ctx.c.anchors.faq }, [
      div("bs-faq", [
        intro({ eyebrow: ctx.c.faq.eyebrow, title: ctx.c.faq.title, lead: ctx.c.faq.lead }),
        div("bs-faq__list", ctx.c.faq.items.map(item => div("bs-faq__item", [heading("h3", item.q, "bs-card__title"), text(item.a, "bs-text")], item.q)), "Questions"),
      ]),
    ]),
  },
  {
    type: "blog", id: "cards", name: { de: "Beiträge", en: "Articles" }, classes: moreClasses,
    build: ctx => band({ surface: "alt", label: "Blog" }, [
      intro({ eyebrow: ctx.c.blog.eyebrow, title: ctx.c.blog.title, lead: ctx.c.blog.lead }),
      div("bs-grid bs-cols--3", ctx.c.blog.posts.map(post => div("bs-post", [photo(ctx, post.image, "16x10"), text(`${post.category} · ${post.date}`, "bs-post__meta"), heading("h3", post.title, "bs-card__title"), text(post.excerpt, "bs-card__text"), textLink(ctx.c.ui.readMore, "#", "bs-link", "arrow-forward")], post.title)), "Articles"),
    ]),
  },
  {
    type: "logos", id: "row", name: { de: "Partner", en: "Partners" }, classes: moreClasses,
    build: ctx => band({ surface: "page", space: "tight", label: "Logos", containerClasses: "bs-align--center" }, [
      text(ctx.c.logos.title, "bs-small"),
      div("bs-logos", ctx.c.logos.names.map(name => text(name, "bs-logos__name")), "Logos"),
    ]),
  },
  {
    type: "gallery", id: "grid", name: { de: "Galerie", en: "Gallery" }, classes: moreClasses,
    build: ctx => band({ surface: "page", label: "Gallery" }, [
      intro({ eyebrow: ctx.c.gallery.eyebrow, title: ctx.c.gallery.title }),
      div("bs-gallery", ctx.c.gallery.images.map((key, i) => { const p = PHOTOS[key]; return image(p.url, p.alt[ctx.c.lang], `bs-gallery__item${i === 0 || i === 5 ? " bs-gallery__wide" : ""}`); }), "Images"),
    ]),
  },
  {
    type: "contact", id: "split", name: { de: "Kontakt mit Formular", en: "Contact with form" }, classes: moreClasses,
    build: ctx => band({ surface: "alt", label: "Contact", id: ctx.c.anchors.contact }, [
      div("bs-contact", [
        div("bs-contact__info", [
          intro({ eyebrow: ctx.c.contact.eyebrow, title: ctx.c.contact.title, lead: ctx.c.contact.lead }),
          infoRow("call", ctx.c.ui.callUs, ctx.c.brand.phone, telHref(ctx.c.brand.phone)),
          ctx.c.brand.email ? infoRow("mail", ctx.c.ui.writeUs, ctx.c.brand.email, `mailto:${ctx.c.brand.email}`) : null,
          infoRow("pin", ctx.c.contact.addressTitle, ctx.c.brand.address),
          infoRow("time", ctx.c.contact.hoursTitle, ctx.c.brand.hours.join(" · ")),
        ], "Contact details"),
        div("bs-form-card", [
          heading("h3", ctx.c.contact.formTitle, "bs-card__title"),
          form(ctx, [
            { type: "text", label: ctx.c.contact.labels.name, required: true },
            { type: "email", label: ctx.c.contact.labels.email, required: true, width: 50 },
            { type: "tel", label: ctx.c.contact.labels.phone, width: 50 },
            { type: "textarea", label: ctx.c.contact.labels.message, required: true },
            { type: "checkbox", label: ctx.c.contact.labels.privacy, required: true },
          ], ctx.c.contact.labels.submit),
        ], "Form"),
      ]),
    ]),
  },
  {
    type: "login", id: "card", name: { de: "Anmeldung", en: "Sign in" }, classes: moreClasses,
    build: ctx => band({ surface: "alt", label: "Login", classes: "bs-screen" }, [
      div("bs-center", [
        heading("h1", ctx.c.login.title, "bs-title bs-size--l"),
        text(ctx.c.login.text, "bs-lead"),
        div("bs-form-card", [form(ctx, [{ type: "email", label: ctx.c.login.email, required: true }, { type: "password", label: ctx.c.login.password, required: true }], ctx.c.login.submit, ["login"]), textLink(ctx.c.login.forgot, "#", "bs-link")]),
      ]),
    ]),
  },
  {
    type: "404", id: "center", name: { de: "Seite nicht gefunden", en: "Not found" }, classes: moreClasses,
    build: ctx => band({ surface: "page", label: "404", classes: "bs-screen" }, [
      div("bs-center", [text("404", "bs-code"), heading("h1", ctx.c.notFound.title, "bs-title bs-size--l"), text(ctx.c.notFound.text, "bs-lead"), button(ctx.c.notFound.cta.label, ctx.c.notFound.cta.href, "bs-btn bs-btn-size--m bs-btn--primary")]),
    ]),
  },
  {
    type: "coming-soon", id: "center", name: { de: "Bald online", en: "Coming soon" }, classes: moreClasses,
    build: ctx => band({ surface: "alt", label: "Coming soon", classes: "bs-screen" }, [
      div("bs-center", [
        text(ctx.c.comingSoon.eyebrow, "bs-eyebrow"),
        heading("h1", ctx.c.comingSoon.title, "bs-title bs-size--display"),
        text(ctx.c.comingSoon.text, "bs-lead"),
        actions([{ label: ctx.c.comingSoon.cta.label, href: ctx.c.comingSoon.cta.href }]),
        text(`${ctx.c.brand.phone} · ${ctx.c.brand.address}`, "bs-small"),
      ]),
    ]),
  },
];
