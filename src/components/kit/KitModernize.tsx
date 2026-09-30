"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { buildBricksImportJson } from "@/lib/bricks-export";
import { copyToClipboard, downloadText } from "@/lib/clipboard";
import { KIT_FONT_VARS } from "@/lib/kit/app-fonts";
import { renderPreview } from "@/lib/kit/preview";
import { DEFAULT_KIT, normalizeKit, resolveKit, type BrandKit } from "@/lib/kit/tokens";
import { modernizeTemplate, parseColor } from "@/lib/modernize";
import { MODERNIZE_EXAMPLE } from "@/lib/modernize-example";
import KitControls from "./KitControls";
import KitPreviewFrame from "./KitPreviewFrame";
import type { KitSelection } from "./KitStudio";

const VIEWPORTS = { desktop: 1280, tablet: 820, phone: 390 } as const;
type Viewport = keyof typeof VIEWPORTS;
const secondary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:border-border-hover hover:bg-subtle disabled:opacity-40";
const primary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-40";
const segment = (active: boolean) => `h-8 rounded-md px-3 text-xs ${active ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(28,25,23,.08)]" : "text-muted hover:text-foreground"}`;

/** Starts from the Studio's last kit in this browser. */
function studioKit(): BrandKit {
  try { const saved = JSON.parse(localStorage.getItem("brickssnap_kit_studio") ?? "null"); if (saved?.kit) return normalizeKit(saved.kit); } catch { /* Not essential. */ }
  return DEFAULT_KIT;
}

function Swatch({ color }: { color: string }) {
  return <span className="inline-block h-4 w-4 shrink-0 rounded-full border border-black/10 align-middle" style={{ background: color }} aria-hidden/>;
}

/** Import any Bricks JSON and rebuild it on the brand kit's tokens and bs- classes. */
export default function KitModernize({ onOpenInStaging }: { onOpenInStaging: (selection: KitSelection) => void }) {
  const [kit, setKit] = useState<BrandKit>(studioKit);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<unknown>(null);
  const [parseError, setParseError] = useState("");
  const [block, setBlock] = useState("");
  const [view, setView] = useState<"after" | "before" | "compare">("after");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [status, setStatus] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const shownKit = useDeferredValue(kit);
  const shownBlock = useDeferredValue(block);
  const outcome = useMemo(() => {
    if (parsed === null) return null;
    try { return { result: modernizeTemplate(parsed, { kit: shownKit, block: shownBlock || undefined }) }; }
    catch (error) { return { error: error instanceof Error ? error.message : "This JSON could not be read." }; }
  }, [parsed, shownKit, shownBlock]);
  const result = outcome && "result" in outcome ? outcome.result : null;
  const previews = useMemo(() => {
    if (!result) return null;
    const variables = result.designSystem.css.replace(/^:root \{\n/, "").replace(/\n\}$/, "");
    return { before: renderPreview(result.source), after: renderPreview(result.template, { variables, fonts: KIT_FONT_VARS }) };
  }, [result]);
  const colors = resolveKit(shownKit).colors as Record<string, string>;

  const flash = (message: string) => { setStatus(message); window.setTimeout(() => setStatus(s => (s === message ? "" : s)), 2500); };
  const read = (value: string) => {
    setText(value);
    if (!value.trim()) { setParsed(null); setParseError(""); return; }
    try { setParsed(JSON.parse(value)); setParseError(""); }
    catch { setParsed(null); setParseError("This is not valid JSON. Copy a section in Bricks (Ctrl+C) or export a template, and paste the whole text."); }
  };
  const loadFile = async (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) { setParseError("Choose a JSON file smaller than 2 MB."); return; }
    read(await f.text());
  };
  const title = result ? `Modernized ${result.block}` : "Modernized";
  const type = result && result.template.content.filter(el => el.parent === 0).length > 1 ? "content" : "section";
  const r = result?.report;

  const frame = (which: "before" | "after", width: number) => previews && <div className="overflow-hidden rounded-xl border border-border bg-subtle">
    <div className="mx-auto bg-white" style={{ maxWidth: width }}><KitPreviewFrame html={previews[which].html} css={previews[which].css} width={width} title={`${which === "before" ? "Before" : "After"}: ${title}`}/></div>
  </div>;

  return <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
    <aside className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto lg:pr-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <KitControls kit={kit} onKit={setKit} profile={{ industry: "business", language: "en" }} onProfile={() => {}} showBusiness={false}/>
      </div>
    </aside>

    <div className="min-w-0 space-y-6">
      <section aria-labelledby="mz-input" className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="mz-input" className="text-base font-semibold">1. Paste Bricks JSON</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted">In Bricks, select a section in the structure panel and press <kbd className="rounded border border-border px-1 font-mono text-xs">Ctrl+C</kbd>, or export a template. Components from a library work too, as long as you may use them. Everything runs in your browser; nothing is uploaded.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondary} onClick={() => file.current?.click()}>Import JSON file</button>
            <button type="button" className={secondary} onClick={() => read(JSON.stringify(MODERNIZE_EXAMPLE, null, 2))}>Load example</button>
          </div>
        </div>
        <input ref={file} type="file" accept="application/json,.json" className="sr-only" onChange={e => { void loadFile(e.target.files?.[0]); e.target.value = ""; }}/>
        <label htmlFor="mz-json" className="sr-only">Bricks JSON</label>
        <textarea id="mz-json" value={text} onChange={e => read(e.target.value)} spellCheck={false} rows={7} placeholder='{"content":[{"id":"abc123","name":"section", …}], "globalClasses":[…]}'
          className="w-full resize-y rounded-lg border border-border bg-subtle p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"/>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="mz-block" className="text-sm text-text">Class prefix</label>
          <div className="flex items-center rounded-lg border border-border bg-card pl-3 text-sm focus-within:border-primary">
            <span className="font-mono text-xs text-muted">bs-</span>
            <input id="mz-block" value={block} onChange={e => setBlock(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24))} placeholder={result?.block ?? "auto"} className="h-9 w-40 bg-transparent px-1 font-mono text-xs focus:outline-none"/>
            <span className="pr-3 font-mono text-xs text-muted">-card</span>
          </div>
          <span className="text-xs text-muted">Give each imported block its own prefix, so classes of different blocks never mix.</span>
        </div>
        {(parseError || (outcome && "error" in outcome)) && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{parseError || (outcome && "error" in outcome ? outcome.error : "")}</p>}
      </section>

      {result && previews && r && <>
        <section aria-labelledby="mz-preview" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="mz-preview" className="text-base font-semibold">2. Before and after</h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-lg border border-border bg-subtle p-0.5" role="group" aria-label="Show">
                {(["after", "before", "compare"] as const).map(v => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={segment(view === v)}>{v === "after" ? "After" : v === "before" ? "Before" : "Side by side"}</button>)}
              </div>
              <div className="flex rounded-lg border border-border bg-subtle p-0.5" role="group" aria-label="Preview width">
                {(Object.keys(VIEWPORTS) as Viewport[]).map(v => <button key={v} type="button" aria-pressed={viewport === v} onClick={() => setViewport(v)} className={segment(viewport === v)}>{v[0].toUpperCase() + v.slice(1)} <span className="font-mono text-[11px] text-muted">{VIEWPORTS[v]}</span></button>)}
              </div>
            </div>
          </div>
          {view === "compare"
            ? <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 space-y-2"><p className="label-mono">Before · as in the file</p>{frame("before", VIEWPORTS[viewport])}</div>
              <div className="min-w-0 space-y-2"><p className="label-mono">After · on your brand kit</p>{frame("after", VIEWPORTS[viewport])}</div>
            </div>
            : frame(view, VIEWPORTS[viewport])}
          {view !== "after" && <p className="text-xs text-muted">“Before” shows the file&apos;s own styles only; styles from a framework such as Automatic CSS are not part of the file.</p>}
        </section>

        <section aria-labelledby="mz-report" className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 id="mz-report" className="text-base font-semibold">3. What changed</h3>
          <ul className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
            {[
              [r.colors.length, "colors → tokens"], [r.fontSizes.length, "font sizes on the scale"], [r.spacing + r.radii, "spacing and radii"],
              [r.classes.created.length, `bs- classes${r.classes.sourceMerged.length ? ` (from ${r.classes.sourceMerged.length} source)` : ""}`], [r.mobile.length, "mobile and rhythm rules"],
            ].map(([n, label]) => <li key={String(label)} className="rounded-lg border border-border bg-subtle p-3"><span className="block text-xl font-semibold">{n}</span><span className="text-xs text-muted">{label}</span></li>)}
          </ul>
          {r.brand.primary && <p className="text-sm text-text">Brand colors found: <Swatch color={r.brand.primary}/> <span className="font-mono text-xs">{r.brand.primary}</span> → primary{r.brand.accent && <>, <Swatch color={r.brand.accent}/> <span className="font-mono text-xs">{r.brand.accent}</span> → accent</>}.</p>}
          <details className="text-sm"><summary className="font-medium">Colors ({r.colors.length})</summary>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">{r.colors.map(c => {
              const rgb = parseColor(c.from.split(" ")[0]);
              return <li key={c.from} className="flex items-center gap-2 font-mono text-xs">{rgb ? <Swatch color={c.from.split(" ")[0]}/> : <span className="w-4"/>}<span className="truncate">{c.from}</span><span aria-hidden>→</span>{colors[c.to] && <Swatch color={colors[c.to]}/>}<span>--bs-{c.to}</span><span className="text-muted">×{c.count}</span></li>;
            })}</ul>
          </details>
          {r.fontSizes.length > 0 && <details className="text-sm"><summary className="font-medium">Font sizes ({r.fontSizes.length})</summary>
            <ul className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-3">{r.fontSizes.map(f => <li key={f.from}>{f.from} → {f.to}</li>)}</ul>
          </details>}
          {r.mobile.length > 0 && <details className="text-sm"><summary className="font-medium">Mobile and rhythm rules ({r.mobile.length})</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-text">{r.mobile.map(m => <li key={m}>{m}</li>)}</ul>
          </details>}
          <details className="text-sm"><summary className="font-medium">Classes ({r.classes.created.length})</summary>
            <p className="mt-2 break-words font-mono text-xs text-text">{r.classes.created.join(" · ")}</p>
          </details>
          {(r.warnings.length > 0 || result.quality.some(q => q.level === "warning")) && <ul className="space-y-1.5 text-sm">
            {[...r.warnings, ...result.quality.filter(q => q.level === "warning").map(q => q.message)].map(w => <li key={w} className="flex gap-2 text-text"><span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning"/>{w}</li>)}
          </ul>}
        </section>

        <section aria-labelledby="mz-export" className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 id="mz-export" className="text-base font-semibold">4. Take it to Bricks</h3>
          <p className="text-sm text-muted">The block now uses <span className="font-mono text-xs">var(--bs-…)</span> tokens with fallbacks, so it looks like this preview on any site. Install the design system in Staging to change color, fonts, radius and spacing for it and every Studio section in one place.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={primary} onClick={() => downloadText(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`, JSON.stringify(buildBricksImportJson(result.template, title, type), null, 2))}>Download for Bricks import</button>
            <button type="button" className={secondary} onClick={async () => { try { await copyToClipboard(JSON.stringify(result.template)); flash("Copied. Paste it in Bricks with Ctrl+V."); } catch { flash("Clipboard unavailable. Download the file instead."); } }}>Copy for Bricks (Ctrl+V)</button>
            <button type="button" className={secondary} onClick={() => onOpenInStaging({ template: result.template, designSystem: result.designSystem, kit: result.resolved.kit, title })}>Open in Staging</button>
            <span role="status" className="text-xs text-muted">{status}</span>
          </div>
        </section>
      </>}
    </div>
  </div>;
}
