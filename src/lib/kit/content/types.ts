import type { IconKey } from "../icons";
import type { PhotoKey } from "../images";
import type { Language } from "../tokens";

export const INDUSTRY_IDS = ["kfz", "handwerk", "praxis", "restaurant", "agentur", "business"] as const;
export type IndustryId = typeof INDUSTRY_IDS[number];

/** What the user tells BricksSnap about the business; everything is optional except the industry. */
export type BusinessProfile = {
  industry: IndustryId;
  language: Language;
  name?: string;
  city?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Own service names; they replace the industry's sample services in order. */
  services?: string[];
  tagline?: string;
};

export type Link = { label: string; href: string };
export type Item = { icon: IconKey; title: string; text: string };

/** Section anchors (CSS IDs) the navigation links point to. */
export type Anchors = { services: string; pricing: string; about: string; contact: string; faq: string; team: string; portfolio: string };

/** Fully resolved copy for every section type, in one language. */
export type Content = {
  lang: Language;
  anchors: Anchors;
  brand: { name: string; city: string; phone: string; email: string; address: string; tagline: string; hours: string[] };
  nav: Link[];
  navCta: Link;
  hero: { eyebrow: string; title: string; lead: string; primary: Link; secondary: Link; points: string[]; image: PhotoKey; panelTitle: string; panelLines: string[] };
  services: { eyebrow: string; title: string; lead: string; items: Array<Item & { image: PhotoKey; price?: string }> };
  features: { eyebrow: string; title: string; lead: string; items: Item[] };
  steps: { eyebrow: string; title: string; lead: string; items: Array<{ title: string; text: string }> };
  stats: { eyebrow: string; title: string; items: Array<{ value: string; label: string }> };
  pricing: {
    eyebrow: string; title: string; lead: string; note: string;
    plans: Array<{ name: string; price: string; unit: string; description: string; features: string[]; featured?: boolean; cta: Link }>;
    list: Array<{ name: string; detail: string; price: string }>;
  };
  testimonials: { eyebrow: string; title: string; rating: { score: string; count: string; source: string }; items: Array<{ quote: string; name: string; role: string; photo: PhotoKey }> };
  team: { eyebrow: string; title: string; lead: string; members: Array<{ name: string; role: string; photo: PhotoKey }> };
  about: { eyebrow: string; title: string; paragraphs: string[]; points: string[]; image: PhotoKey; secondImage: PhotoKey };
  faq: { eyebrow: string; title: string; lead: string; items: Array<{ q: string; a: string }> };
  cta: { eyebrow: string; title: string; lead: string; primary: Link; secondary: Link };
  contact: { eyebrow: string; title: string; lead: string; formTitle: string; labels: { name: string; email: string; phone: string; message: string; submit: string; privacy: string }; hoursTitle: string; addressTitle: string };
  gallery: { eyebrow: string; title: string; images: PhotoKey[] };
  portfolio: { eyebrow: string; title: string; lead: string; items: Array<{ title: string; category: string; image: PhotoKey }> };
  blog: { eyebrow: string; title: string; lead: string; posts: Array<{ title: string; excerpt: string; category: string; date: string; image: PhotoKey }> };
  logos: { title: string; names: string[] };
  timeline: { eyebrow: string; title: string; items: Array<{ year: string; title: string; text: string }> };
  footer: { tagline: string; columns: Array<{ title: string; links: Link[] }>; legal: Link[]; copyright: string };
  notFound: { title: string; text: string; cta: Link };
  comingSoon: { eyebrow: string; title: string; text: string; cta: Link };
  login: { title: string; text: string; email: string; password: string; submit: string; forgot: string };
  ui: { readMore: string; perMonth: string; mostPopular: string; openingHours: string; callUs: string; writeUs: string; visitUs: string; allRightsReserved: string };
};
