import { button, div, heading, image, node, text, textLink } from "../build";
import { PHOTOS } from "../images";
import { merge, sx } from "../styles";
import type { ResolvedKit } from "../tokens";
import { actions, band, intro, photo, type Ctx, type Variant } from "./common";
import { legalRow, form, socials } from "./more";

/** More layouts for articles, galleries, footers and single-purpose pages. */
function morePlusClasses(r: ResolvedKit) {
  const x = sx(r);
  const none = { top: "0", bottom: "0" };
  const bottomLine = { _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: x.color("border") } };
  return {
    // Articles
    "bs-blog-feature": { _display: "grid", _gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "start", _width: "100%" },
    "bs-blog-side": { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _width: "100%" },
    "bs-post-row": merge({ _display: "grid", _gridTemplateColumns: "140px minmax(0, 1fr)", "_gridTemplateColumns:mobile_portrait": "96px minmax(0, 1fr)", _columnGap: x.v("space-m"), _alignItems: "start", _padding: { top: "0", right: "0", bottom: x.v("space-m"), left: "0" } }, bottomLine),
    "bs-post-row__img": merge(x.round("radius-m"), { _width: "100%", _aspectRatio: "1/1", _objectFit: "cover" }),
    "bs-post-list": { _display: "flex", _direction: "column", _width: "100%" },
    "bs-post-line": merge({ _display: "grid", _gridTemplateColumns: "minmax(0, 1fr) 280px", "_gridTemplateColumns:mobile_landscape": "minmax(0, 1fr)", _gridGap: x.v("space-l"), _alignItems: "center", _padding: { top: x.v("space-l"), right: "0", bottom: x.v("space-l"), left: "0" } }, bottomLine),
    "bs-post-line__img": merge(x.round("radius-m"), { _width: "100%", _aspectRatio: "4/3", _objectFit: "cover", "_order:mobile_landscape": "-1" }),

    // Galleries
    "bs-masonry": { _display: "block", _width: "100%", _columnGap: x.v("space-s"), _cssCustom: ".bs-masonry { columns: 3 150px; }" },
    "bs-masonry__img": merge(x.round("radius-m"), { _display: "block", _width: "100%", _objectFit: "cover", _margin: { top: "0", bottom: x.v("space-s") }, _cssCustom: ".bs-masonry__img { break-inside: avoid; }" }),
    "bs-gbento": { _display: "grid", _gridTemplateColumns: "repeat(4, minmax(0, 1fr))", "_gridTemplateColumns:mobile_landscape": "repeat(2, minmax(0, 1fr))", _gridAutoRows: "clamp(130px, 15vw, 220px)", _gridGap: x.v("space-s"), _width: "100%" },
    "bs-gbento__cell": { _overflow: "hidden" },
    "bs-gbento__cell--big": { _gridItemColumnSpan: "2", _gridItemRowSpan: "2", "_gridItemRowSpan:mobile_landscape": "1" },
    "bs-gbento__cell--wide": { _gridItemColumnSpan: "2" },

    // Footers
    "bs-footer__giant": merge(x.type({ size: "clamp(48px, 9vw, 150px)", weight: "heading-weight", ls: "-0.04em", lh: "0.95", color: "inherit" }), { _margin: none, _width: "100%" }, x.font("bs-footer__giant", "heading", " overflow-wrap: anywhere; text-wrap: balance;")),
    "bs-footer__top": merge({ _display: "flex", _direction: "row", "_direction:tablet_portrait": "column", _justifyContent: "space-between", _alignItems: "center", "_alignItems:tablet_portrait": "flex-start", _columnGap: x.v("space-l"), _rowGap: x.v("space-m"), _width: "100%", _padding: { top: "0", right: "0", bottom: x.v("space-l"), left: "0" } }, {
      _border: { width: { top: "0", right: "0", bottom: "1px", left: "0" }, style: "solid", color: { raw: "currentColor" } }, _cssCustom: ".bs-footer__top { border-bottom-color: color-mix(in srgb, currentColor 18%, transparent); }",
    }),

    // Single-purpose pages
    "bs-screen-split": { _display: "grid", _gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", "_gridTemplateColumns:tablet_portrait": "minmax(0, 1fr)", _gridGap: x.v("space-xl"), _alignItems: "center", _width: "100%" },
    "bs-screen-split__text": { _display: "flex", _direction: "column", _rowGap: x.v("space-m"), _alignItems: "flex-start", _widthMax: "560px" },
    "bs-link-row": { _display: "flex", _direction: "row", _flexWrap: "wrap", _columnGap: x.v("space-m"), _rowGap: "8px" },
    "bs-notify": { _width: "100%", _widthMax: "480px" },
  };
}

const postMeta = (post: Ctx["c"]["blog"]["posts"][number]) => text(`${post.category} · ${post.date}`, "bs-post__meta");
const readMore = (ctx: Ctx) => textLink(ctx.c.ui.readMore, "#", "bs-link", "arrow-forward");

export const blogPlusVariants: Variant[] = [
  {
    type: "blog", id: "featured", name: { de: "Ein Beitrag groß", en: "One post featured" }, classes: morePlusClasses,
    build: ctx => {
      const [first, ...rest] = ctx.c.blog.posts;
      return band({ surface: "page", label: "Blog" }, [
        intro({ eyebrow: ctx.c.blog.eyebrow, title: ctx.c.blog.title, lead: ctx.c.blog.lead }),
        div("bs-blog-feature", [
          div("bs-post", [photo(ctx, first.image, "16x10"), postMeta(first), heading("h3", first.title, "bs-title bs-size--s"), text(first.excerpt, "bs-card__text"), readMore(ctx)], first.title),
          div("bs-blog-side", rest.slice(0, 3).map(post => div("bs-post-row", [
            image(PHOTOS[post.image].url, PHOTOS[post.image].alt[ctx.c.lang], "bs-post-row__img"),
            div("bs-post", [postMeta(post), heading("h3", post.title, "bs-card__title"), readMore(ctx)]),
          ], post.title)), "More articles"),
        ]),
      ]);
    },
  },
  {
    type: "blog", id: "list", name: { de: "Liste", en: "List" }, classes: morePlusClasses,
    build: ctx => band({ surface: "page", label: "Blog" }, [
      intro({ eyebrow: ctx.c.blog.eyebrow, title: ctx.c.blog.title, lead: ctx.c.blog.lead }),
      div("bs-post-list", ctx.c.blog.posts.map(post => div("bs-post-line", [
        div("bs-post", [postMeta(post), heading("h3", post.title, "bs-title bs-size--s"), text(post.excerpt, "bs-card__text"), readMore(ctx)]),
        image(PHOTOS[post.image].url, PHOTOS[post.image].alt[ctx.c.lang], "bs-post-line__img"),
      ], post.title)), "Articles"),
    ]),
  },
];

export const galleryPlusVariants: Variant[] = [
  {
    type: "gallery", id: "masonry", name: { de: "Mauerwerk", en: "Masonry" }, classes: morePlusClasses,
    build: ctx => band({ surface: "page", label: "Gallery" }, [
      intro({ eyebrow: ctx.c.gallery.eyebrow, title: ctx.c.gallery.title }),
      div("bs-masonry", ctx.c.gallery.images.map((key, i) => { const p = PHOTOS[key]; return image(p.url, p.alt[ctx.c.lang], `bs-masonry__img bs-ratio--${["4x5", "1x1", "4x3"][i % 3]}`); }), "Images"),
    ]),
  },
  {
    type: "gallery", id: "bento", name: { de: "Bento", en: "Bento" }, classes: morePlusClasses,
    build: ctx => band({ surface: "alt", label: "Gallery" }, [
      intro({ eyebrow: ctx.c.gallery.eyebrow, title: ctx.c.gallery.title }),
      // Six photos fill four columns and three rows: one big, three wide, two small.
      div("bs-gbento", ctx.c.gallery.images.slice(0, 6).map((key, i) => {
        const p = PHOTOS[key];
        const size = i === 0 ? " bs-gbento__cell--big" : [1, 4, 5].includes(i) ? " bs-gbento__cell--wide" : "";
        return div(`bs-gbento__cell${size}`, [image(p.url, p.alt[ctx.c.lang], "bs-gallery__item")]);
      }), "Images"),
    ]),
  },
];

export const footerPlusVariants: Variant[] = [
  {
    type: "footer", id: "big", name: { de: "Großer Name", en: "Big name" }, classes: morePlusClasses,
    build: ctx => band({ surface: "inverse", space: "tight", label: "Footer", classes: "bs-footer" }, [
      div("bs-footer__grid", [
        div("bs-footer__col", [text(ctx.c.footer.tagline, "bs-footer__small"), socials()], "Brand"),
        ...ctx.c.footer.columns.map(col => div("bs-footer__col", [text(col.title, "bs-footer__title"), ...col.links.map(link => textLink(link.label, link.href, "bs-footer__link"))], col.title)),
        div("bs-footer__col", [text(ctx.c.contact.eyebrow, "bs-footer__title"), text(ctx.c.brand.phone, "bs-footer__small"), text(ctx.c.brand.address, "bs-footer__small")], "Contact"),
      ]),
      text(ctx.c.brand.name, "bs-footer__giant"),
      legalRow(ctx),
    ]),
  },
  {
    type: "footer", id: "cta", name: { de: "Mit Aufruf", en: "With call to action" }, classes: morePlusClasses,
    build: ctx => band({ surface: "inverse", space: "tight", label: "Footer", classes: "bs-footer" }, [
      div("bs-footer__top", [intro({ title: ctx.c.cta.title, lead: ctx.c.cta.lead, size: "l" }), actions([ctx.c.cta.primary, ctx.c.cta.secondary], "inverse")], "Call to action"),
      div("bs-footer__row", [
        textLink(ctx.c.brand.name, "/", "bs-brand"),
        node("div", "bs-footer__nav", { tag: "nav" }, ctx.c.nav.map(link => textLink(link.label, link.href, "bs-footer__link"))),
        socials(),
      ]),
      legalRow(ctx),
    ]),
  },
];

export const screenPlusVariants: Variant[] = [
  {
    type: "login", id: "split", name: { de: "Mit Bild", en: "With image" }, classes: morePlusClasses,
    build: ctx => band({ surface: "page", label: "Login", classes: "bs-screen" }, [
      div("bs-screen-split", [
        photo(ctx, ctx.c.hero.image, "hero"),
        div("bs-screen-split__text", [
          text(ctx.c.brand.name, "bs-eyebrow"),
          heading("h1", ctx.c.login.title, "bs-title bs-size--l"),
          text(ctx.c.login.text, "bs-lead"),
          div("bs-form-card", [form(ctx, [{ type: "email", label: ctx.c.login.email, required: true }, { type: "password", label: ctx.c.login.password, required: true }], ctx.c.login.submit, ["login"]), textLink(ctx.c.login.forgot, "#", "bs-link")]),
        ], "Sign in"),
      ]),
    ]),
  },
  {
    type: "404", id: "split", name: { de: "Mit Bild und Links", en: "With image and links" }, classes: morePlusClasses,
    build: ctx => band({ surface: "alt", label: "404", classes: "bs-screen" }, [
      div("bs-screen-split", [
        div("bs-screen-split__text", [
          text("404", "bs-code"),
          heading("h1", ctx.c.notFound.title, "bs-title bs-size--l"),
          text(ctx.c.notFound.text, "bs-lead"),
          button(ctx.c.notFound.cta.label, ctx.c.notFound.cta.href, "bs-btn bs-btn-size--m bs-btn--primary"),
          node("div", "bs-link-row", { tag: "nav" }, ctx.c.nav.map(link => textLink(link.label, link.href, "bs-link"))),
        ], "Not found"),
        photo(ctx, ctx.c.about.image, "4x3"),
      ]),
    ]),
  },
  {
    type: "coming-soon", id: "split", name: { de: "Mit Bild und Benachrichtigung", en: "With image and notify form" }, classes: morePlusClasses,
    build: ctx => band({ surface: "page", label: "Coming soon", classes: "bs-screen" }, [
      div("bs-screen-split", [
        div("bs-screen-split__text", [
          text(ctx.c.comingSoon.eyebrow, "bs-eyebrow"),
          heading("h1", ctx.c.comingSoon.title, "bs-title bs-size--display"),
          text(ctx.c.comingSoon.text, "bs-lead"),
          div("bs-notify", [form(ctx, [{ type: "email", label: ctx.c.contact.labels.email, required: true }], ctx.c.lang === "de" ? "Benachrichtigen" : "Notify me")], "Notify form"),
          text(`${ctx.c.brand.phone} · ${ctx.c.brand.address}`, "bs-small"),
        ], "Coming soon"),
        photo(ctx, ctx.c.hero.image, "hero"),
      ]),
    ]),
  },
];
