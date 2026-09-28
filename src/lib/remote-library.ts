import { timingSafeEqual } from "node:crypto";
import { TEMPLATES, type TemplateDefinition } from "./templates";
import { wrapTemplate } from "./bricks-engine";
import { buildBricksImportJson, type TemplateType } from "./bricks-export";

/**
 * BricksSnap's catalog as a Bricks remote template source. Bricks 2.4 first asks a source for its
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

export function remoteTemplateType(entry: Pick<TemplateDefinition, "category">): TemplateType {
  if (entry.category === "fullpage") return "content";
  if (entry.category === "navbar") return "header";
  if (entry.category === "footer") return "footer";
  return "section";
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

export function buildRemoteTemplates(siteUrl: string, now = new Date()) {
  const date = now.toISOString().replace("T", " ").slice(0, 19);
  const dateFormatted = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return TEMPLATES.map(entry => {
    const type = remoteTemplateType(entry);
    const exported = buildBricksImportJson(wrapTemplate(entry.generator()), entry.name, type);
    return {
      id: remoteTemplateId(entry.id),
      name: entry.id,
      title: entry.name,
      date,
      date_formatted: dateFormatted,
      author: { name: LIBRARY_AUTHOR, avatar: "", url: "https://github.com/Hamido212/BricksSnap" },
      permalink: `${siteUrl}/?template=${encodeURIComponent(entry.id)}`,
      thumbnail: `${siteUrl}/api/library/thumbnail/${encodeURIComponent(entry.id)}`,
      bundles: [entry.category],
      tags: entry.tags,
      type,
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

/** A simple card image for the Bricks template library, from the catalog's preview gradient. */
export function templateThumbnail(slug: string): string | null {
  const entry = TEMPLATES.find(t => t.id === slug);
  if (!entry) return null;
  const colors = entry.preview.match(/#[0-9a-fA-F]{3,8}/g) ?? ["#1e293b", "#3b82f6"];
  const [from, to] = [colors[0], colors[colors.length - 1]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/><text x="40" y="330" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${escapeXml(entry.name)}</text><text x="40" y="370" font-family="Inter, Arial, sans-serif" font-size="20" fill="#ffffffcc">${escapeXml(entry.category)} · BricksSnap</text></svg>`;
}
