import { assertLocalWordPress } from "@/lib/wordpress-http";
import { wpRequestSchema } from "@/lib/wordpress-contract";
import { handleWordPressRequest } from "@/lib/wordpress-client";
import { errorResponse, readJson } from "@/lib/api-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertLocalWordPress(request);
    const body = wpRequestSchema.parse(await readJson(request, 100_000));
    const result = await handleWordPressRequest(
      body,
      AbortSignal.any([request.signal, AbortSignal.timeout(30_000)])
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
