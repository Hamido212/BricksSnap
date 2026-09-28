import { templateThumbnail } from "@/lib/remote-library";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svg = templateThumbnail(id);
  if (!svg) return new Response("Not found", { status: 404 });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } });
}
