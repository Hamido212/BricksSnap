import { assertLocalWordPress } from "@/lib/wordpress-http";
import { wpRequestSchema } from "@/lib/wordpress-contract";
import { handleWordPressRequest } from "@/lib/wordpress-client";
import { errorResponse, readJson } from "@/lib/api-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertLocalWordPress(request);
    // Apply carries a complete page (up to the 2 MB staging limit).
    const body = wpRequestSchema.parse(await readJson(request, 2_200_000));
    const result = await handleWordPressRequest(
      body,
      AbortSignal.any([request.signal, AbortSignal.timeout(body.action === "apply" || body.action === "restore" ? 60_000 : 30_000)])
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
