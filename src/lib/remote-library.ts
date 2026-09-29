import { timingSafeEqual } from "node:crypto";
import { buildBricksImportJson, type TemplateType } from "./bricks-export";
import { INDUSTRIES } from "./kit/content";
import { generateKitTemplate, kitTemplateType, type SectionPick } from "./kit/generate";
import { DESIGNS, SECTION_DESIGN, type Design } from "./kit/library";
import { VARIANTS } from "./kit/sections";
import { SECTION_LABELS } from "./kit/studio";
import { resolveKit, STYLES, type Language } from "./kit/tokens";

/**
 * BricksSnap's design library as a Bricks remote template source. Bricks 2.4 first asks a source for its
 * versioned remote-library package and falls back to the legacy response implemented here:
 * GET /wp-json/bricks/v1/get-templates-data?site=<requesting site> (shape captured from Bricks 2.4.2).
 */
export const LIBRARY_AUTHOR = "BricksSnap";

type LibraryError = { error: { code: string; message: string } };
type Env = Record<string, string | undefined>;

/** Stable positive integer ID per catalog slug (FNV-1a), so IDs survive catalog reordering. */
export function remoteTemplateId(slug: string): number {
  let hash = 0x811c9dc5;
  for (const char of slug) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  return (hash >>> 0) % 2_000_000_000 + 1;
}

const origin = (value: string) => { try { return new URL(value).origin; } catch { return null; } };

/** Mirrors Bricks' source-side checks: requesting site required, optional whitelist and password. */
export function checkLibraryAccess(params: URLSearchParams, env: Env = process.env): LibraryError | null {
  if (env.BRICKSSNAP_REMOTE_LIBRARY === "false") return { error: { code: "my_templates_access_disabled", message: "This BricksSnap deployment does not share its template library." } };
  const site = params.get("site");
  if (!site || !origin(site)) return { error: { code: "no_site_url", message: "Sorry, but no site URL has been provided." } };
  const whitelist = (env.BRICKSSNAP_REMOTE_LIBRARY_WHITELIST ?? "").split(/[\s,]+/).map(origin).filter(Boolean);
  if (whitelist.length && !whitelist.includes(origin(site))) return { error: { code: "site_not_whitelisted", message: "This site is not allowed to request templates from BricksSnap." } };
  const password = env.BRICKSSNAP_REMOTE_LIBRARY_PASSWORD;
  if (password) {
    const given = Buffer.from(params.get("password") ?? "");
    const expected = Buffer.from(password);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { error: { code: "remote_templates_password_required", message: "The site you are requesting templates from requires a remote templates password." } };
  }
  return null;
}

type LibraryEntry = {
  slug: string; title: string; type: TemplateType; bundles: string[]; tags: string[];
  sections: SectionPick[]; design: Design; language: Language;
};

/**
 * The library as Bricks sees it: every design as a full page and every layout as a single section
 * (in the "Fundament" design), each in German and English. Sections share the kit's class names, so
 * they take on the look of the first design a site installed.
 */
export function libraryEntries(): LibraryEntry[] {
  const entries: LibraryEntry[] = [];
  for (const language of ["de", "en"] as const) {
    const lang = language === "de" ? "Deutsch" : "English";
    for (const design of DESIGNS) {
      entries.push({
        slug: `design-${design.id}-${language}`, title: `${design.name} · ${INDUSTRIES[design.industry].label[language]} (${language.toUpperCase()})`,
        type: "content", bundles: [`Pages · ${lang}`], tags: [STYLES[design.kit.style].label.en, INDUSTRIES[design.industry].label.en, lang],
        sections: design.page, design, language,
      });
    }
    for (const variant of VARIANTS) {
      const pick = { type: variant.type, variant: variant.id };
      entries.push({
        slug: `section-${variant.type}-${variant.id}-${language}`, title: `${SECTION_LABELS[variant.type]}: ${variant.name[language]} (${language.toUpperCase()})`,
        type: kitTemplateType([pick]), bundles: [`Sections · ${lang}`], tags: [SECTION_LABELS[variant.type], lang],
        sections: [pick], design: SECTION_DESIGN, language,
      });
    }
  }
  return entries;
}

export function buildRemoteTemplates(siteUrl: string, now = new Date()) {
  const date = now.toISOString().replace("T", " ").slice(0, 19);
  const dateFormatted = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return libraryEntries().map(entry => {
    const { template } = generateKitTemplate({ kit: entry.design.kit, profile: { industry: entry.design.industry, language: entry.language }, sections: entry.sections });
    const exported = buildBricksImportJson(template, entry.title, entry.type);
    return {
      id: remoteTemplateId(entry.slug),
      name: entry.slug,
      title: entry.title,
      date,
      date_formatted: dateFormatted,
      author: { name: LIBRARY_AUTHOR, avatar: "", url: "https://github.com/Hamido212/BricksSnap" },
      permalink: `${siteUrl}/?template=${encodeURIComponent(entry.slug)}`,
      thumbnail: `${siteUrl}/api/library/thumbnail/${encodeURIComponent(entry.slug)}`,
      bundles: entry.bundles,
      tags: entry.tags,
      type: entry.type,
      content: exported.content,
      ...(exported.globalClasses.length ? { globalClasses: exported.globalClasses } : {}),
    };
  });
}

export function remoteLibraryData(siteUrl: string, now = new Date()) {
  const templates = buildRemoteTemplates(siteUrl, now);
  return {
    timestamp: Math.floor(now.getTime() / 1000),
    // Same display format as Bricks, e.g. "September 28, 2026 (11:39 pm)".
    date: `${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} (${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).toLowerCase()})`,
    templates,
    authors: [LIBRARY_AUTHOR],
    bundles: [...new Set(templates.flatMap(t => t.bundles))],
    tags: [...new Set(templates.flatMap(t => t.tags))],
    globalVariables: [],
    globalVariablesCategories: [],
    colorPalette: [],
    styleManager: [],
  };
}

const escapeXml = (value: string) => value.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

/** A card image for the Bricks template library in the entry's design colors. */
export function templateThumbnail(slug: string): string | null {
  const entry = libraryEntries().find(e => e.slug === slug);
  if (!entry) return null;
  const c = resolveKit(entry.design.kit).colors;
  const [heading, sub] = [entry.title.replace(/ \((DE|EN)\)$/, ""), entry.tags.slice(0, 2).join(" · ")];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${c.bg}"/><rect width="600" height="56" fill="${c.surface}"/><rect y="56" width="600" height="1" fill="${c.border}"/><rect x="36" y="22" width="120" height="12" rx="3" fill="${c.heading}"/><rect x="470" y="16" width="94" height="24" rx="5" fill="${c.primary}"/><rect x="36" y="96" width="330" height="26" rx="4" fill="${c.heading}"/><rect x="36" y="132" width="250" height="26" rx="4" fill="${c.heading}"/><rect x="36" y="178" width="300" height="9" rx="3" fill="${c.muted}"/><rect x="36" y="196" width="260" height="9" rx="3" fill="${c.muted}"/><rect x="36" y="226" width="116" height="34" rx="6" fill="${c.primary}"/><rect x="400" y="96" width="164" height="164" rx="10" fill="${c["surface-alt"]}"/><rect y="296" width="600" height="104" fill="${c.inverse}"/><text x="36" y="342" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="${c["on-inverse"]}">${escapeXml(heading)}</text><text x="36" y="374" font-family="Inter, Arial, sans-serif" font-size="16" fill="${c["inverse-muted"]}">${escapeXml(sub)} · BricksSnap</text></svg>`;
}
