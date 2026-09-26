import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";
import { readJson, errorResponse } from "@/lib/api-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.BRICKSSNAP_MCP_ENABLED !== "true") return Response.json({ error: "Enable BRICKSSNAP_MCP_ENABLED to use this endpoint." }, { status: 404 });
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    const parsedBody = await readJson(request, 2_100_000);
    await server.connect(transport);
    const response = await transport.handleRequest(request, { parsedBody });
    // Materialize JSON before closing the per-request transport.
    return new Response(await response.text(), { status: response.status, headers: response.headers });
  } catch (error) { return errorResponse(error); }
  finally { await server.close(); }
}

export async function GET() { return new Response(null, { status: 405, headers: { Allow: "POST" } }); }
export async function DELETE() { return new Response(null, { status: 405, headers: { Allow: "POST" } }); }
