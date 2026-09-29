import type { IndustryId } from "./content";
import type { SectionPick } from "./generate";
import type { SectionType } from "./sections";
import { normalizeKit, type BrandKit, type Language } from "./tokens";

/**
 * Ready-made designs: a brand kit, an industry and a page, chosen so that each one works as it is.
 * The library shows them; "Customize in Studio" continues from any of them.
 */
export type Design = {
  id: string;
  name: string;
  industry: IndustryId;
  kit: BrandKit;
  description: Record<Language, string>;
  page: SectionPick[];
};

const p = (type: SectionType, variant: string): SectionPick => ({ type, variant });
const design = (id: string, name: string, industry: IndustryId, kit: Partial<BrandKit>, description: Record<Language, string>, page: SectionPick[]): Design =>
  ({ id, name, industry, kit: normalizeKit(kit), description, page });

export const DESIGNS: Design[] = [
  design("nord", "Nord", "kfz", { style: "warm", primary: "#0f766e" },
    { de: "Zulassungsdienst mit Öffnungszeiten, Preisliste und Ablauf", en: "Registration service with opening hours, price list and steps" },
    [p("navbar", "topbar"), p("hero", "panel"), p("services", "list"), p("steps", "cards"), p("testimonials", "rating"), p("faq", "split"), p("cta", "band"), p("contact", "split"), p("footer", "contact")]),
  design("tempo", "Tempo", "kfz", { style: "bold", primary: "#dc2626" },
    { de: "Kräftiger Auftritt für Zulassung und Kennzeichen", en: "Bold look for registrations and plates" },
    [p("navbar", "minimal"), p("hero", "cover"), p("stats", "row"), p("services", "grid"), p("pricing", "offer"), p("testimonials", "grid"), p("cta", "split"), p("footer", "columns")]),
  design("werkbank", "Werkbank", "handwerk", { style: "bold", primary: "#ea580c" },
    { de: "Handwerksbetrieb mit Referenzen, Zahlen und Team", en: "Trade business with projects, numbers and team" },
    [p("navbar", "topbar"), p("hero", "cover"), p("services", "rows"), p("stats", "band"), p("portfolio", "grid"), p("team", "grid"), p("cta", "split"), p("contact", "split"), p("footer", "columns")]),
  design("volt", "Volt", "handwerk", { style: "clean", primary: "#1d4ed8", spacing: "compact" },
    { de: "Sachlich und kompakt für Elektro und Sanitär", en: "Precise and compact for electrical and plumbing" },
    [p("navbar", "classic"), p("hero", "split"), p("features", "icons"), p("services", "bento"), p("steps", "cards"), p("faq", "split"), p("cta", "box"), p("footer", "contact")]),
  design("lindenhof", "Lindenhof", "praxis", { style: "soft", primary: "#0e7490" },
    { de: "Freundliche Arztpraxis mit Team und Sprechzeiten", en: "Friendly practice with team and consultation hours" },
    [p("navbar", "classic"), p("hero", "split"), p("services", "grid"), p("features", "split"), p("team", "grid"), p("faq", "split"), p("contact", "split"), p("footer", "contact")]),
  design("balance", "Balance", "praxis", { style: "editorial", primary: "#1f4d3a" },
    { de: "Ruhig und elegant für Physiotherapie und Praxis", en: "Calm and elegant for therapy and practice" },
    [p("navbar", "minimal"), p("hero", "centered"), p("content", "split"), p("services", "list"), p("testimonials", "spotlight"), p("cta", "band"), p("footer", "simple")]),
  design("lachfalte", "Lachfalte", "zahnarzt", { style: "soft", primary: "#c8472d", accent: "#f59e0b", fonts: "fraunces", radius: "round" },
    { de: "Zahnarztpraxis mit Persönlichkeit statt Klinik-Blau", en: "Dental practice with personality instead of clinical blue" },
    [p("navbar", "classic"), p("hero", "split"), p("features", "icons"), p("services", "grid"), p("steps", "cards"), p("pricing", "list"), p("team", "grid"), p("testimonials", "rating"), p("faq", "split"), p("cta", "band"), p("contact", "split"), p("footer", "contact")]),
  design("trattoria", "Trattoria", "restaurant", { style: "editorial", primary: "#9f1239" },
    { de: "Restaurant mit Speisekarte, Galerie und Reservierung", en: "Restaurant with menu, gallery and bookings" },
    [p("navbar", "minimal"), p("hero", "cover"), p("content", "split"), p("pricing", "list"), p("gallery", "grid"), p("testimonials", "spotlight"), p("contact", "split"), p("footer", "simple")]),
  design("markthalle", "Markthalle", "restaurant", { style: "warm", primary: "#4d7c0f" },
    { de: "Bistro und Café, bodenständig und warm", en: "Bistro and café, grounded and warm" },
    [p("navbar", "topbar"), p("hero", "panel"), p("features", "icons"), p("pricing", "list"), p("gallery", "grid"), p("cta", "box"), p("footer", "contact")]),
  design("kontur", "Kontur", "agentur", { style: "clean", primary: "#4f46e5" },
    { de: "Agentur mit Projekten, Kunden und Leistungen", en: "Agency with projects, clients and services" },
    [p("navbar", "minimal"), p("hero", "centered"), p("logos", "row"), p("services", "bento"), p("portfolio", "grid"), p("stats", "row"), p("testimonials", "grid"), p("cta", "box"), p("footer", "columns")]),
  design("nachtschicht", "Nachtschicht", "agentur", { style: "bold", primary: "#a3e635", mode: "dark" },
    { de: "Dunkel und kontrastreich für Kreativstudios", en: "Dark and high-contrast for creative studios" },
    [p("navbar", "classic"), p("hero", "split"), p("logos", "row"), p("services", "rows"), p("timeline", "line"), p("blog", "cards"), p("cta", "band"), p("footer", "columns")]),
  design("fundament", "Fundament", "business", { style: "clean", primary: "#2563eb" },
    { de: "Beratung und Dienstleistung mit Preisen und FAQ", en: "Consulting and services with pricing and FAQ" },
    [p("navbar", "classic"), p("hero", "split"), p("logos", "row"), p("features", "icons"), p("services", "grid"), p("pricing", "plans"), p("testimonials", "grid"), p("faq", "split"), p("cta", "band"), p("footer", "columns")]),
  design("mandat", "Mandat", "business", { style: "editorial", primary: "#1e3a5f", fonts: "playfair" },
    { de: "Seriös und klassisch für Kanzleien und Beratung", en: "Serious and classic for law firms and consultants" },
    [p("navbar", "classic"), p("hero", "centered"), p("content", "split"), p("services", "list"), p("team", "grid"), p("testimonials", "spotlight"), p("contact", "split"), p("footer", "contact")]),
];

export const findDesign = (id: string) => DESIGNS.find(d => d.id === id);

/** The design whose look the library's single-section templates use. */
export const SECTION_DESIGN = DESIGNS.find(d => d.id === "fundament")!;
