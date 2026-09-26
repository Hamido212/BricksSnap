import { connectionSchema, errorResponse, readJson, resolveKey } from "@/lib/api-request";
import { testConnection } from "@/lib/ai-client";

export async function POST(request: Request) {
  try {
    const config = connectionSchema.parse(await readJson(request, 8000));
    const result = await testConnection(config, resolveKey(config), AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]));
    return Response.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
