import type { BusinessProfile, IndustryId } from "./content";
import { generateKitTemplate, type KitResult, type SectionPick } from "./generate";
import { renderPreview } from "./preview";
import type { SectionType } from "./sections";
import type { BrandKit } from "./tokens";

/** App-facing names of the section types, in the order the gallery shows them. */
export const SECTION_LABELS: Record<SectionType, string> = {
  navbar: "Header", hero: "Hero", services: "Services", features: "Benefits", steps: "Steps", stats: "Numbers",
  pricing: "Pricing", testimonials: "Reviews", team: "Team", portfolio: "Portfolio", timeline: "Timeline", content: "About",
  faq: "FAQ", blog: "Blog", logos: "Logos", gallery: "Gallery", cta: "Call to action", contact: "Contact", footer: "Footer",
  login: "Login", "404": "404 page", "coming-soon": "Coming soon",
};

const p = (type: SectionType, variant: string): SectionPick => ({ type, variant });

/** A sensible first page per industry; users reorder, swap layouts and add sections from there. */
export const STARTER_PAGES: Record<IndustryId, SectionPick[]> = {
  kfz: [p("navbar", "topbar"), p("hero", "panel"), p("services", "list"), p("steps", "cards"), p("testimonials", "rating"), p("faq", "split"), p("cta", "band"), p("contact", "split"), p("footer", "contact")],
  handwerk: [p("navbar", "topbar"), p("hero", "cover"), p("services", "rows"), p("stats", "band"), p("content", "split"), p("testimonials", "grid"), p("cta", "split"), p("contact", "split"), p("footer", "columns")],
  praxis: [p("navbar", "classic"), p("hero", "split"), p("services", "grid"), p("features", "icons"), p("team", "grid"), p("faq", "split"), p("contact", "split"), p("footer", "contact")],
  zahnarzt: [p("navbar", "classic"), p("hero", "split"), p("features", "icons"), p("services", "grid"), p("pricing", "list"), p("testimonials", "rating"), p("faq", "split"), p("cta", "band"), p("contact", "split"), p("footer", "contact")],
  restaurant: [p("navbar", "minimal"), p("hero", "cover"), p("content", "split"), p("pricing", "list"), p("gallery", "grid"), p("testimonials", "spotlight"), p("contact", "split"), p("footer", "simple")],
  agentur: [p("navbar", "minimal"), p("hero", "centered"), p("logos", "row"), p("services", "bento"), p("portfolio", "grid"), p("stats", "row"), p("testimonials", "grid"), p("cta", "box"), p("footer", "columns")],
  business: [p("navbar", "classic"), p("hero", "split"), p("logos", "row"), p("features", "icons"), p("services", "grid"), p("pricing", "plans"), p("testimonials", "grid"), p("faq", "split"), p("cta", "band"), p("footer", "columns")],
};

/** Where a newly added section goes: headers first, footers last, everything else before the footer. */
export function insertSection(page: SectionPick[], pick: SectionPick, at?: number): SectionPick[] {
  // An explicit position (e.g. "add after this section") wins over the smart placement.
  if (at !== undefined) { const i = Math.max(0, Math.min(page.length, at)); return [...page.slice(0, i), pick, ...page.slice(i)]; }
  if (pick.type === "navbar") return [pick, ...page];
  const footer = page.findIndex(s => s.type === "footer");
  if (pick.type === "footer" || footer < 0) return [...page, pick];
  return [...page.slice(0, footer), pick, ...page.slice(footer)];
}

export type KitPreview = { result: KitResult; html: string; css: string };

/** Sample photos at a smaller width, for scaled-down thumbnails. */
const resizePhotos = (markup: string, width: number) => markup.replace(/(https:\/\/images\.unsplash\.com\/[\w-]+\?w=)\d+/g, `$1${width}`);

/**
 * Generate a kit template and its HTML/CSS preview. `fonts` maps font families to self-hosted CSS values;
 * `imageWidth` requests smaller sample photos for the preview only (the template keeps full-size URLs).
 */
export function kitPreview(kit: BrandKit, profile: BusinessProfile, sections: SectionPick[], options: { fonts?: Record<string, string>; imageWidth?: number } = {}): KitPreview {
  const result = generateKitTemplate({ kit, profile, sections });
  const declarations = result.designSystem.css.replace(/^:root \{\n/, "").replace(/\n\}$/, "");
  const rendered = renderPreview(result.template, { variables: declarations, fonts: options.fonts });
  // The page language, as Bricks sets it on <html>: headings hyphenate long words by it.
  const html = `<div lang="${result.content.lang}">${rendered.html}</div>`, css = rendered.css;
  return options.imageWidth ? { result, html: resizePhotos(html, options.imageWidth), css: resizePhotos(css, options.imageWidth) } : { result, html, css };
}
