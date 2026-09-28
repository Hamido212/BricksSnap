import { checkLibraryAccess, remoteLibraryData } from "@/lib/remote-library";

export const runtime = "nodejs";

// Legacy Bricks remote template endpoint; Bricks reports errors as HTTP 200 with { error }.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const denied = checkLibraryAccess(url.searchParams);
  if (denied) return Response.json(denied, { headers: { "Cache-Control": "no-store" } });
  return Response.json(remoteLibraryData(url.origin), { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
}
