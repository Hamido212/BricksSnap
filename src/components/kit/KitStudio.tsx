"use client";

import { useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import { buildBricksImportJson } from "@/lib/bricks-export";
import { copyToClipboard, downloadText } from "@/lib/clipboard";
import { KIT_FONT_VARS } from "@/lib/kit/app-fonts";
import { INDUSTRIES, normalizeProfile, type BusinessProfile } from "@/lib/kit/content";
import { kitTemplateType, type DesignSystem, type SectionPick } from "@/lib/kit/generate";
import { findVariant, isSectionType, SECTION_TYPES, VARIANTS, variantsFor, type SectionType } from "@/lib/kit/sections";
import { insertSection, kitPreview, SECTION_LABELS, STARTER_PAGES } from "@/lib/kit/studio";
import { DEFAULT_KIT, normalizeKit, type BrandKit } from "@/lib/kit/tokens";
import KitControls from "./KitControls";
import KitPreviewFrame from "./KitPreviewFrame";

const STORAGE_KEY = "brickssnap_kit_studio";
const VIEWPORTS = { desktop: 1280, tablet: 820, phone: 390 } as const;
type Viewport = keyof typeof VIEWPORTS;
const MAX_SECTIONS = 16;

const secondary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:border-border-hover hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40";
const primary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40";
const iconButton = "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground disabled:opacity-30";

const samePage = (a: SectionPick[], b: SectionPick[]) => a.length === b.length && a.every((s, i) => s.type === b[i].type && s.variant === b[i].variant);
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brickssnap";

export type KitSelection = { template: BricksTemplate; designSystem: DesignSystem; kit: BrandKit; title: string };

type Saved = { kit: BrandKit; profile: BusinessProfile; page: SectionPick[] };
const DEFAULTS: Saved = { kit: DEFAULT_KIT, profile: { industry: "kfz", language: "de" }, page: STARTER_PAGES.kfz };

// Read once per page load; a stable snapshot for useSyncExternalStore.
let savedCache: Saved | null | undefined;
function readSaved(): Saved | null {
  if (savedCache !== undefined) return savedCache;
  savedCache = null;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object") {
      const page = Array.isArray(saved.page) ? saved.page.filter((s: SectionPick) => isSectionType(s?.type)).slice(0, MAX_SECTIONS).map((s: SectionPick) => ({ type: s.type, variant: findVariant(s.type, s.variant).id })) : DEFAULTS.page;
      savedCache = { kit: normalizeKit(saved.kit), profile: normalizeProfile(saved.profile), page };
    }
  } catch { /* Storage can be unavailable or hold an old shape; start fresh. */ }
  return savedCache;
}
const noSubscription = () => () => {};

/** Restores the last session in this browser (after hydration) by remounting the studio with it. */
export default function KitStudio(props: { onOpenInStaging: (selection: KitSelection) => void }) {
  const saved = useSyncExternalStore(noSubscription, readSaved, () => null);
  return <Studio key={saved ? "saved" : "default"} initial={saved ?? DEFAULTS} {...props}/>;
}

function Studio({ initial, onOpenInStaging }: { initial: Saved; onOpenInStaging: (selection: KitSelection) => void }) {
  const [kit, setKit] = useState<BrandKit>(initial.kit);
  const [profile, setProfile] = useState<BusinessProfile>(initial.profile);
  const [page, setPage] = useState<SectionPick[]>(initial.page);
  const [view, setView] = useState<"sections" | "page">("sections");
  const [filter, setFilter] = useState<SectionType | "all">("all");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [panelOpen, setPanelOpen] = useState(false);
  const [status, setStatus] = useState("");

  // Per-browser convenience: remember the last kit, profile and page.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ kit, profile, page })); } catch { /* Not essential. */ }
  }, [kit, profile, page]);

  const updateProfile = (next: BusinessProfile) => {
    // An untouched starter page follows the industry.
    if (next.industry !== profile.industry && samePage(page, STARTER_PAGES[profile.industry])) setPage(STARTER_PAGES[next.industry]);
    setProfile(next);
  };

  // Previews render from deferred values so typing and color dragging stay responsive.
  const shownKit = useDeferredValue(kit);
  const shownProfile = useDeferredValue(profile);
  const variants = useMemo(() => VARIANTS.filter(v => filter === "all" || v.type === filter), [filter]);
  const gallery = useMemo(() => view === "sections"
    ? variants.map(v => ({ variant: v, preview: kitPreview(shownKit, shownProfile, [{ type: v.type, variant: v.id }], { fonts: KIT_FONT_VARS, imageWidth: 800 }) }))
    : [], [variants, shownKit, shownProfile, view]);
  const pagePreview = useMemo(() => {
    if (!page.length) return null;
    try { return kitPreview(shownKit, shownProfile, page, { fonts: KIT_FONT_VARS }); } catch { return null; }
  }, [page, shownKit, shownProfile]);

  const title = profile.name?.trim() || `${INDUSTRIES[profile.industry].label[profile.language]} ${profile.language === "de" ? "Seite" : "page"}`;
  const flash = (message: string) => { setStatus(message); window.setTimeout(() => setStatus(current => (current === message ? "" : current)), 2500); };
  const copyTemplate = async (template: BricksTemplate, what: string) => {
    try { await copyToClipboard(JSON.stringify({ ...template, source: "bricksCopiedElements" })); flash(`${what} copied. Paste it in Bricks with Ctrl+V.`); }
    catch { flash("Clipboard unavailable. Download the JSON file instead."); }
  };
  const add = (pick: SectionPick) => {
    if (page.length >= MAX_SECTIONS) { flash(`A page holds up to ${MAX_SECTIONS} sections.`); return; }
    setPage(current => insertSection(current, pick));
    flash(`${SECTION_LABELS[pick.type]} added to the page.`);
  };
  const move = (index: number, by: number) => setPage(current => {
    const next = [...current];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    return next;
  });

  return <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
    <aside className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto lg:pr-2">
      <button type="button" className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-4 text-sm font-medium lg:hidden" aria-expanded={panelOpen} aria-controls="kit-panel" onClick={() => setPanelOpen(o => !o)}>
        <span>Brand kit and business</span><span aria-hidden>{panelOpen ? "−" : "+"}</span>
      </button>
      <div id="kit-panel" className={`${panelOpen ? "mt-4 block" : "hidden"} rounded-xl border border-border bg-card p-5 lg:mt-0 lg:block`}>
        <KitControls kit={kit} onKit={setKit} profile={profile} onProfile={updateProfile}/>
      </div>
    </aside>

    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div role="tablist" aria-label="Studio view" className="flex gap-5">
          {(["sections", "page"] as const).map(v => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${view === v ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
            {v === "sections" ? `Sections · ${VARIANTS.length}` : `Your page · ${page.length}`}
          </button>)}
        </div>
        <p className="pb-3 text-xs text-muted" role="status" aria-live="polite">{status}</p>
      </div>

      {view === "sections" && <div className="space-y-8">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 sm:flex-wrap" role="group" aria-label="Filter by section type">
            {(["all", ...SECTION_TYPES] as const).map(type => <button key={type} type="button" aria-pressed={filter === type} onClick={() => setFilter(type)}
              className={`h-8 shrink-0 rounded-full border px-3 text-xs transition-colors ${filter === type ? "border-primary bg-primary-soft font-medium text-primary-hover" : "border-border bg-card text-text hover:border-border-hover"}`}>
              {type === "all" ? "All" : SECTION_LABELS[type]}
            </button>)}
          </div>
        </div>
        {SECTION_TYPES.filter(type => gallery.some(g => g.variant.type === type)).map(type => {
          const items = gallery.filter(g => g.variant.type === type);
          return <section key={type} aria-labelledby={`gallery-${type}`} className="space-y-3">
            <h3 id={`gallery-${type}`} className="label-mono">{SECTION_LABELS[type]} · {items.length}</h3>
            <div className="grid items-start gap-5 xl:grid-cols-2">
              {items.map(({ variant, preview }) => <article key={variant.id} className="min-w-0 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border-hover">
                <div className="border-b border-border bg-white"><KitPreviewFrame html={preview.html} css={preview.css} width={1280} maxHeight={340} title={`${SECTION_LABELS[variant.type]}: ${variant.name.en}`}/></div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <h4 className="min-w-0 truncate text-sm font-medium">{variant.name.en}</h4>
                  <div className="flex gap-2">
                    <button type="button" className={secondary} aria-label={`Copy ${variant.name.en} for Bricks`} onClick={() => copyTemplate(preview.result.template, variant.name.en)}>Copy</button>
                    <button type="button" className={secondary} aria-label={`Add ${variant.name.en} to the page`} onClick={() => add({ type: variant.type, variant: variant.id })}>Add to page</button>
                  </div>
                </div>
              </article>)}
            </div>
          </section>;
        })}
      </div>}

      {view === "page" && <div className="grid gap-6 xl:grid-cols-[288px_minmax(0,1fr)]">
        <div className="space-y-3">
          <ol className="divide-y divide-border rounded-xl border border-border bg-card">
            {page.map((pick, i) => <li key={`${i}:${pick.type}`} className="flex items-center gap-1 py-2 pl-3 pr-2">
              <span className="mr-1 w-5 shrink-0 font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{SECTION_LABELS[pick.type]}</p>
                <label className="sr-only" htmlFor={`page-variant-${i}`}>Layout of {SECTION_LABELS[pick.type]}</label>
                <select id={`page-variant-${i}`} className="-ml-1 w-full truncate rounded bg-transparent text-xs text-muted hover:text-foreground focus:outline-none" value={findVariant(pick.type, pick.variant).id}
                  onChange={e => setPage(current => current.map((s, j) => (j === i ? { ...s, variant: e.target.value } : s)))}>
                  {variantsFor(pick.type).map(v => <option key={v.id} value={v.id}>{v.name.en}</option>)}
                </select>
              </div>
              <button type="button" className={iconButton} aria-label={`Move ${SECTION_LABELS[pick.type]} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className={iconButton} aria-label={`Move ${SECTION_LABELS[pick.type]} down`} disabled={i === page.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className={iconButton} aria-label={`Remove ${SECTION_LABELS[pick.type]}`} onClick={() => setPage(current => current.filter((_, j) => j !== i))}>×</button>
            </li>)}
            {!page.length && <li className="px-3 py-6 text-center text-xs text-muted">Add sections from the gallery.</li>}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondary} onClick={() => setView("sections")}>Add sections</button>
            <button type="button" className={secondary} disabled={samePage(page, STARTER_PAGES[profile.industry])} onClick={() => setPage(STARTER_PAGES[profile.industry])}>Starter page</button>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-lg border border-border bg-subtle p-0.5" role="group" aria-label="Preview width">
              {(Object.keys(VIEWPORTS) as Viewport[]).map(v => <button key={v} type="button" aria-pressed={viewport === v} onClick={() => setViewport(v)}
                className={`h-8 rounded-md px-3 text-xs ${viewport === v ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(28,25,23,.08)]" : "text-muted hover:text-foreground"}`}>
                {v[0].toUpperCase() + v.slice(1)} <span className="font-mono text-[11px] text-muted">{VIEWPORTS[v]}</span>
              </button>)}
            </div>
            <a href="#kit-export" className="text-sm font-medium text-primary hover:text-primary-hover">Export ↓</a>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-subtle">
            {pagePreview ? <div className="mx-auto bg-white" style={{ maxWidth: VIEWPORTS[viewport] }}><KitPreviewFrame html={pagePreview.html} css={pagePreview.css} width={VIEWPORTS[viewport]} title={`Preview of ${title}`}/></div>
              : <p className="p-10 text-center text-sm text-muted">Your page is empty.</p>}
          </div>

          {pagePreview && <>
            <section aria-labelledby="kit-quality" className="rounded-xl border border-border bg-card p-5">
              <h3 id="kit-quality" className="label-mono mb-3">Quality checks</h3>
              <ul className="space-y-2 text-sm">
                {pagePreview.result.quality.map((q, i) => <li key={i} className="flex gap-2.5">
                  <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${q.level === "ok" ? "bg-success" : "bg-warning"}`}/>
                  <span className="text-text"><span className="sr-only">{q.level === "ok" ? "OK: " : "Warning: "}</span>{q.message}</span>
                </li>)}
              </ul>
            </section>

            <section id="kit-export" aria-labelledby="kit-export-title" className="scroll-mt-24 rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <h3 id="kit-export-title" className="text-base font-semibold">Export to Bricks</h3>
                <p className="mt-1 text-sm text-muted">Styling lives in <span className="font-mono text-xs">bs-</span> global classes that come with the template. Every value has a fallback, so the page looks the same on any site; install the design system to change colors, fonts and spacing for all sections in one place.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={primary} onClick={() => downloadText(`${slug(title)}.json`, JSON.stringify(buildBricksImportJson(pagePreview.result.template, title, kitTemplateType(page)), null, 2))}>Download for Bricks import</button>
                <button type="button" className={secondary} onClick={() => copyTemplate(pagePreview.result.template, "Page")}>Copy for Bricks (Ctrl+V)</button>
                <button type="button" className={secondary} onClick={() => onOpenInStaging({ template: pagePreview.result.template, designSystem: pagePreview.result.designSystem, kit: pagePreview.result.resolved.kit, title })}>Open in Staging</button>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium">Design system</p>
                <p className="mt-1 text-sm text-muted">{pagePreview.result.designSystem.palette.colors.length} colors and {pagePreview.result.designSystem.variables.length} variables named <span className="font-mono text-xs">--bs-…</span>. Install them on a connected site in Staging, or paste the CSS into Bricks → Settings → Custom code.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={secondary} onClick={async () => { try { await copyToClipboard(pagePreview.result.designSystem.css); flash("CSS variables copied."); } catch { flash("Clipboard unavailable."); } }}>Copy CSS variables</button>
                  <button type="button" className={secondary} onClick={() => downloadText(`${slug(title)}-design-system.json`, JSON.stringify({ kit: pagePreview.result.resolved.kit, ...pagePreview.result.designSystem }, null, 2))}>Download design system</button>
                </div>
              </div>
            </section>
          </>}
        </div>
      </div>}
    </div>
  </div>;
}
