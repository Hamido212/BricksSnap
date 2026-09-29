import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { RequestError } from "./api-request";
import { isPublicAddress } from "./wordpress-http";

export { findExternalImages, replaceImages, type ExternalImage, type SiteImage } from "./template-images";

const MAX_IMAGES = 30;
const MAX_BYTES = 8 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

/** Stable upload name per source URL, so a repeated import finds the earlier upload. */
export function uploadName(url: string, contentType: string): string {
  return `brickssnap-${createHash("sha256").update(url).digest("hex").slice(0, 12)}.${EXTENSIONS[contentType] ?? "jpg"}`;
}

/**
 * Download one image for re-upload: HTTPS only, public addresses only (checked per redirect hop),
 * image content types only, bounded size. BricksSnap fetches the file so WordPress receives data,
 * not an external URL that host firewalls may block.
 */
export async function downloadImage(source: string, signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<{ data: Buffer; contentType: string }> {
  let url = new URL(source);
  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== "https:" || url.username || url.password) throw new RequestError(`Only public HTTPS images can be imported: ${source}`, 422);
    const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
    if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new RequestError(`Image host is not a public address: ${url.hostname}`, 422);
    const response = await fetchImpl(url, { redirect: "manual", signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]) });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      url = new URL(response.headers.get("location")!, url);
      continue;
    }
    if (!response.ok) throw new RequestError(`Image download failed (HTTP ${response.status}): ${source}`, 502);
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!EXTENSIONS[contentType]) throw new RequestError(`Not a supported image type (${contentType || "unknown"}): ${source}`, 422);
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new RequestError(`Image larger than 8 MB: ${source}`, 422);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > MAX_BYTES) throw new RequestError(`Image larger than 8 MB: ${source}`, 422);
    return { data, contentType };
  }
  throw new RequestError(`Too many redirects: ${source}`, 502);
}

export { MAX_IMAGES };
