import { baseDe, industriesDe } from "./de";
import { baseEn, industriesEn } from "./en";
import { resolveContent, type LanguagePack } from "./model";
import { INDUSTRY_IDS, type BusinessProfile, type Content, type IndustryId } from "./types";
import type { Language } from "../tokens";

export * from "./types";

const PACKS: Record<Language, LanguagePack> = {
  de: { base: baseDe, industries: industriesDe },
  en: { base: baseEn, industries: industriesEn },
};

export const INDUSTRIES: Record<IndustryId, { label: Record<Language, string>; description: Record<Language, string> }> = {
  kfz: { label: { de: "Kfz-Zulassungsdienst", en: "Vehicle registration" }, description: { de: "Zulassung, Ummeldung, Kennzeichen", en: "Registration, transfers, plates" } },
  handwerk: { label: { de: "Handwerk", en: "Trades" }, description: { de: "Elektro, Sanitär, Heizung", en: "Electrical, plumbing, heating" } },
  praxis: { label: { de: "Arztpraxis", en: "Medical practice" }, description: { de: "Hausarzt, Vorsorge, Termine", en: "GP, prevention, appointments" } },
  zahnarzt: { label: { de: "Zahnarztpraxis", en: "Dental practice" }, description: { de: "Prophylaxe, Aligner, Angstpatienten", en: "Hygiene, aligners, nervous patients" } },
  restaurant: { label: { de: "Restaurant", en: "Restaurant" }, description: { de: "Speisekarte, Reservierung, Events", en: "Menu, bookings, events" } },
  agentur: { label: { de: "Agentur", en: "Agency" }, description: { de: "Webdesign, Branding, Marketing", en: "Web design, branding, marketing" } },
  business: { label: { de: "Unternehmen", en: "Business" }, description: { de: "Beratung und Dienstleistung", en: "Consulting and services" } },
};

/** Accepts partial or foreign input and returns a complete profile. */
export function normalizeProfile(input: Partial<BusinessProfile> = {}): BusinessProfile {
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : undefined);
  return {
    industry: INDUSTRY_IDS.includes(input.industry as IndustryId) ? input.industry as IndustryId : "business",
    language: input.language === "en" ? "en" : "de",
    ...(text(input.name, 120) ? { name: text(input.name, 120) } : {}),
    ...(text(input.city, 60) ? { city: text(input.city, 60) } : {}),
    ...(text(input.phone, 40) ? { phone: text(input.phone, 40) } : {}),
    ...(text(input.email, 120) ? { email: text(input.email, 120) } : {}),
    ...(text(input.address, 160) ? { address: text(input.address, 160) } : {}),
    ...(text(input.tagline, 160) ? { tagline: text(input.tagline, 160) } : {}),
    ...(Array.isArray(input.services) ? { services: input.services.filter((s): s is string => typeof s === "string").slice(0, 6).map(s => s.slice(0, 60)) } : {}),
  };
}

export function contentFor(profile: Partial<BusinessProfile>): Content {
  return resolveContent(normalizeProfile(profile), PACKS);
}
