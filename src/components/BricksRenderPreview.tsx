"use client";

import { useEffect, useRef, useState } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import type { RenderedMarkup, WordPressCredentials, WordPressRenderResult, WordPressSource } from "@/lib/wordpress-contract";

const VIEWPORTS = { desktop: 1280, mobile: 390 } as const;
type Viewport = keyof typeof VIEWPORTS;

const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** A standalone document for Bricks' rendered markup; the iframe sandbox blocks scripts and same-origin access. */
function documentFor(markup: RenderedMarkup, result: WordPressRenderResult, highlight: string[] = []): string {
  const links = result.stylesheets.map(href => `<link rel="stylesheet" href="${attr(href)}">`).join("");
  // Outline added/changed elements; IDs are validated six-character Bricks IDs.
  const outline = highlight.filter(id => /^[a-z0-9]{6}$/.test(id)).map(id => `#brxe-${id}`).join(",");
  const css = markup.css.replace(/<\/style/gi, "<\\/style") + (outline ? `${outline}{outline:3px dashed #f59e0b !important;outline-offset:-3px}` : "");
  // The site stylesheet goes last so a slow or blocked request cannot keep the preview blank;
  // Bricks' frontend CSS uses cascade layers, so element CSS keeps precedence regardless of order.
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${attr(result.siteUrl)}" target="_blank"><style>${css}</style></head><body class="brx-body bricks-is-frontend"><main id="brx-content">${markup.html}</main>${links}</body></html>`;
}

function ScaledFrame({ title, html, width }: { title: string; html: string; width: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  const height = 720;
  return <div ref={box} className="mx-auto min-w-0 overflow-hidden rounded-lg border border-border bg-white" style={{ height: height * scale, maxWidth: width }}>
    <iframe title={title} sandbox="" srcDoc={html} style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0 }}/>
  </div>;
}

export default function BricksRenderPreview({ source, credentials, proposal, changedIds = [] }: { source: WordPressSource; credentials: WordPressCredentials; proposal: BricksTemplate; changedIds?: string[] }) {
  const [result, setResult] = useState<WordPressRenderResult | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function render() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/wordpress", { method: "POST", headers: { "Content-Type": "application/json", "X-BricksSnap-Local": "1" }, body: JSON.stringify({ action: "render", credentials, postId: source.postId, template: proposal }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bricks could not render the preview.");
      setResult(data as WordPressRenderResult);
    } catch (e) { setError(e instanceof Error ? e.message : "Bricks could not render the preview."); }
    finally { setBusy(false); }
  }

  return <div className="rounded-xl border border-border p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h4 className="font-medium">Rendered by Bricks</h4>
        <p className="text-xs text-muted">Bricks on {new URL(source.endpoint).host} renders the saved page and the reviewed version without saving. Added and changed elements are outlined; scroll inside each preview. Theme styles and global class CSS are not included.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {result && (Object.keys(VIEWPORTS) as Viewport[]).map(v => <button key={v} aria-pressed={viewport === v} onClick={() => setViewport(v)} className={`rounded-lg border px-3 py-1.5 text-xs ${viewport === v ? "border-primary bg-primary text-white" : "border-border"}`}>{v === "desktop" ? "Desktop 1280 px" : "Mobile 390 px"}</button>)}
        <button className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card-hover disabled:opacity-40" disabled={busy} onClick={render}>{busy ? "Rendering…" : result ? "Render again" : "Render with Bricks"}</button>
      </div>
    </div>
    {error && <p role="alert" className="text-xs text-danger break-words">{error}</p>}
    {result && <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0 space-y-2"><p className="text-xs text-muted">Before · saved page</p><ScaledFrame title="Saved page rendered by Bricks" html={documentFor(result.before, result)} width={VIEWPORTS[viewport]}/></div>
      <div className="min-w-0 space-y-2"><p className="text-xs text-muted">After · reviewed version</p><ScaledFrame title="Reviewed version rendered by Bricks" html={documentFor(result.after, result, changedIds)} width={VIEWPORTS[viewport]}/></div>
    </div>}
  </div>;
}
