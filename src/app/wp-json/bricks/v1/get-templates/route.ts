import { buildRemoteTemplates, checkLibraryAccess } from "@/lib/remote-library";

export const runtime = "nodejs";

// Legacy list variant: the templates array without library metadata.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const denied = checkLibraryAccess(url.searchParams);
  if (denied) return Response.json(denied, { headers: { "Cache-Control": "no-store" } });
  return Response.json(buildRemoteTemplates(url.origin), { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
}
