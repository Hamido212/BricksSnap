// BricksSnap does not implement Bricks' versioned remote-library package protocol. Answer like WordPress
// for an unknown route so Bricks falls back to the legacy get-templates-data response.
export async function GET() {
  return Response.json({ code: "rest_no_route", message: "No route was found matching the URL and request method.", data: { status: 404 } }, { status: 404 });
}
