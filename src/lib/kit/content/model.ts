import type { Anchors, BusinessProfile, Content, IndustryId, Link } from "./types";

/** Copy shared by every industry in one language. */
export type BaseCopy = {
  anchors: Anchors;
  nav: Link[];
  contact: Content["contact"];
  footerColumns: Content["footer"]["columns"];
  legal: Link[];
  notFound: Content["notFound"];
  comingSoon: Content["comingSoon"];
  login: Content["login"];
  ui: Content["ui"];
};

/** Industry-specific copy; brand values are samples the profile overrides. */
export type IndustryCopy = Omit<Content, "lang" | "anchors" | "brand" | "nav" | "contact" | "footer" | "notFound" | "comingSoon" | "login" | "ui"> & {
  brand: Omit<Content["brand"], "email">;
};

export type LanguagePack = { base: BaseCopy; industries: Record<IndustryId, IndustryCopy> };

const clean = (value: string | undefined, max = 120) => (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Replace {name} and {city} everywhere in a copy tree. */
function fill<T>(value: T, vars: Record<string, string>): T {
  if (typeof value === "string") return value.replace(/\{(name|city)\}/g, (_, key: string) => vars[key]) as T;
  if (Array.isArray(value)) return value.map(v => fill(v, vars)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, vars)])) as T;
  return value;
}

const telHref = (phone: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#kontakt");

/** Resolve complete copy for a business profile in its language. */
export function resolveContent(profile: BusinessProfile, packs: Record<"de" | "en", LanguagePack>): Content {
  const pack = packs[profile.language] ?? packs.de;
  const industry = pack.industries[profile.industry] ?? pack.industries.business;
  const name = clean(profile.name) || industry.brand.name;
  const city = clean(profile.city, 60) || industry.brand.city;
  const phone = clean(profile.phone, 40) || industry.brand.phone;
  const email = clean(profile.email, 120);
  const address = clean(profile.address, 160) || industry.brand.address.replace(industry.brand.city, city);
  const tagline = clean(profile.tagline, 160) || industry.brand.tagline;
  const vars = { name, city };
  const copy = fill(industry, vars);
  const base = fill(pack.base, vars);

  // Own service names replace the samples in order; the sample text stays until the user edits it.
  const own = (profile.services ?? []).map(s => clean(s, 60)).filter(Boolean).slice(0, 6);
  const services = own.length
    ? { ...copy.services, items: copy.services.items.map((item, i) => (own[i] ? { ...item, title: own[i], text: profile.language === "de" ? `${own[i]} von ${name}: zuverlässig, termintreu und zum fairen Preis.` : `${own[i]} by ${name}: reliable, on time and fairly priced.`, price: undefined } : item)).slice(0, Math.max(3, own.length)) }
    : copy.services;

  const tel = telHref(phone);
  const withTel = (link: Link): Link => (link.href === "tel:" ? { ...link, href: tel } : link);
  return {
    lang: profile.language,
    anchors: base.anchors,
    brand: { ...copy.brand, name, city, phone, email, address, tagline },
    nav: base.nav,
    navCta: copy.navCta,
    hero: { ...copy.hero, primary: withTel(copy.hero.primary), secondary: withTel(copy.hero.secondary) },
    services,
    features: copy.features,
    steps: copy.steps,
    stats: copy.stats,
    pricing: copy.pricing,
    testimonials: copy.testimonials,
    team: copy.team,
    about: copy.about,
    faq: copy.faq,
    cta: { ...copy.cta, primary: withTel(copy.cta.primary), secondary: withTel(copy.cta.secondary) },
    contact: base.contact,
    gallery: copy.gallery,
    portfolio: copy.portfolio,
    blog: copy.blog,
    logos: copy.logos,
    timeline: copy.timeline,
    footer: { tagline, columns: base.footerColumns, legal: base.legal, copyright: `© ${new Date().getFullYear()} ${name}. ${base.ui.allRightsReserved}` },
    notFound: base.notFound,
    comingSoon: { ...base.comingSoon, cta: withTel(base.comingSoon.cta) },
    login: base.login,
    ui: base.ui,
  };
}
