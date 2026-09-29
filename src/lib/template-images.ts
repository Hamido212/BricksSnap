import type { BricksTemplate } from "./bricks-engine";

export type ExternalImage = { url: string; filename: string; alt?: string };
export type SiteImage = { id: number; url: string; filename: string };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/** An image control value (`{ url, filename }` under an `image` key, or with a filename) — not a link. */
function isImageObject(key: string, value: unknown): value is Record<string, unknown> & { url: string } {
  return isRecord(value) && typeof value.url === "string" && /^https?:\/\//i.test(value.url) && (key === "image" || typeof value.filename === "string");
}

/** External images referenced by element settings, one entry per distinct URL. */
export function findExternalImages(template: Pick<BricksTemplate, "content">, siteHost: string): ExternalImage[] {
  const found = new Map<string, ExternalImage>();
  const visit = (value: unknown, key: string) => {
    if (isImageObject(key, value)) {
      let host = "";
      try { host = new URL(value.url).hostname; } catch { return; }
      if (host !== siteHost && !found.has(value.url)) found.set(value.url, { url: value.url, filename: typeof value.filename === "string" ? value.filename : "", ...(typeof value.alt === "string" ? { alt: value.alt } : {}) });
      return;
    }
    if (Array.isArray(value)) value.forEach(item => visit(item, key));
    else if (isRecord(value)) for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
  };
  for (const el of template.content) visit(el.settings, "settings");
  return [...found.values()];
}

/** Replace external image objects with media-library references (Bricks image control shape). */
export function replaceImages<T extends Pick<BricksTemplate, "content">>(template: T, media: Map<string, SiteImage>): T {
  const rewrite = (value: unknown, key: string): unknown => {
    if (isImageObject(key, value) && media.has(value.url)) {
      const item = media.get(value.url)!;
      return { ...value, id: item.id, url: item.url, filename: item.filename, size: typeof value.size === "string" ? value.size : "full", full: item.url };
    }
    if (Array.isArray(value)) return value.map(item => rewrite(item, key));
    if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, rewrite(child, childKey)]));
    return value;
  };
  return { ...template, content: template.content.map(el => ({ ...el, settings: rewrite(el.settings, "settings") as typeof el.settings })) };
}
