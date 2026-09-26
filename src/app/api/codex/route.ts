import { assertLocalCodex, localCodex } from "@/lib/local-codex";
import { errorResponse, readJson, RequestError } from "@/lib/api-request";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertLocalCodex(request);
    const body = await readJson(request, 1024) as { action?: string } | null;
    const result = body?.action === "status" ? await localCodex.status() : body?.action === "login" ? await localCodex.login() : body?.action === "logout" ? await localCodex.logout() : null;
    if (!result) throw new RequestError("Unknown account action.");
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
