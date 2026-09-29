"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import { buildBricksImportJson } from "@/lib/bricks-export";
import { copyToClipboard, downloadText } from "@/lib/clipboard";
import { KIT_FONT_VARS } from "@/lib/kit/app-fonts";
import { INDUSTRIES, normalizeProfile, type BusinessProfile } from "@/lib/kit/content";
import { kitTemplateType, type DesignSystem, type SectionPick } from "@/lib/kit/generate";
import { findVariant, isSectionType, SECTION_TYPES, VARIANTS, variantsFor, type SectionType } from "@/lib/kit/sections";
import { insertSection, kitPreview, SECTION_LABELS, STARTER_PAGES } from "@/lib/kit/studio";
import { DEFAULT_KIT, normalizeKit, resolveKit, type BrandKit } from "@/lib/kit/tokens";
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

export type Saved = { kit: BrandKit; profile: BusinessProfile; page: SectionPick[]; ui?: { kitCollapsed?: boolean } };
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
      savedCache = { kit: normalizeKit(saved.kit), profile: normalizeProfile(saved.profile), page, ui: { kitCollapsed: saved.ui?.kitCollapsed === true } };
    }
  } catch { /* Storage can be unavailable or hold an old shape; start fresh. */ }
  return savedCache;
}
const noSubscription = () => () => {};
const onClient = () => true;
const onServer = () => false;

/** Restores the last session in this browser (after hydration) by remounting the studio with it. */
export default function KitStudio({ preset, ...props }: { onOpenInStaging: (selection: KitSelection) => void; preset?: (Saved & { nonce: number }) | null }) {
  const saved = useSyncExternalStore(noSubscription, readSaved, () => null);
  // The hydration render shows the defaults; it must not save them over the stored session before
  // the stored session is read (a child's effect runs before React re-reads the store).
  const hydrated = useSyncExternalStore(noSubscription, onClient, onServer);
  // A design chosen in the library replaces the current kit, profile and page.
  if (preset) return <Studio key={`preset:${preset.nonce}`} initial={preset} persist {...props}/>;
  return <Studio key={saved ? "saved" : "default"} initial={saved ?? DEFAULTS} persist={hydrated} {...props}/>;
}

function Studio({ initial, persist, onOpenInStaging }: { initial: Saved; persist: boolean; onOpenInStaging: (selection: KitSelection) => void }) {
  const [kit, setKit] = useState<BrandKit>(initial.kit);
  const [profile, setProfile] = useState<BusinessProfile>(initial.profile);
  const [page, setPage] = useState<SectionPick[]>(initial.page);
  const [view, setView] = useState<"sections" | "page">("sections");
  const [filter, setFilter] = useState<SectionType | "all">("all");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [panelOpen, setPanelOpen] = useState(false);
  // Desktop: the brand kit sidebar can shrink to a narrow rail to give the preview room.
  const [kitCollapsed, setKitCollapsed] = useState(initial.ui?.kitCollapsed === true);
  // The "add sections" modal; `at` inserts at a position instead of the smart placement.
  const [picker, setPicker] = useState<{ at?: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("");

  // Per-browser convenience: remember the last kit, profile, page and sidebar state.
  useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ kit, profile, page, ui: { kitCollapsed } })); } catch { /* Not essential. */ }
  }, [persist, kit, profile, page, kitCollapsed]);

  // The native dialog traps focus, closes on Escape and restores focus to the opener.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (picker && !el.open) el.showModal();
    if (!picker && el.open) el.close();
  }, [picker]);

  const updateProfile = (next: BusinessProfile) => {
    // An untouched starter page follows the industry.
    if (next.industry !== profile.industry && samePage(page, STARTER_PAGES[profile.industry])) setPage(STARTER_PAGES[next.industry]);
    setProfile(next);
  };

  // Previews render from deferred values so typing and color dragging stay responsive.
  const shownKit = useDeferredValue(kit);
  const shownProfile = useDeferredValue(profile);
  const variants = useMemo(() => VARIANTS.filter(v => filter === "all" || v.type === filter), [filter]);
  const pickerOpen = picker !== null;
  const gallery = useMemo(() => view === "sections" || pickerOpen
    ? variants.map(v => ({ variant: v, preview: kitPreview(shownKit, shownProfile, [{ type: v.type, variant: v.id }], { fonts: KIT_FONT_VARS, imageWidth: 800 }) }))
    : [], [variants, shownKit, shownProfile, view, pickerOpen]);
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
    const at = picker?.at;
    setPage(current => insertSection(current, pick, at));
    // Several additions at one position keep their order.
    if (at !== undefined) setPicker({ at: at + 1 });
    flash(`${SECTION_LABELS[pick.type]} added to the page.`);
  };
  const move = (index: number, by: number) => setPage(current => {
    const next = [...current];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    return next;
  });

  const swatches = resolveKit(shownKit).colors;
  const chips = (sticky: string) => <div className={`${sticky} -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0`}>
    <div className="flex gap-1.5 sm:flex-wrap" role="group" aria-label="Filter by section type">
      {(["all", ...SECTION_TYPES] as const).map(type => <button key={type} type="button" aria-pressed={filter === type} onClick={() => setFilter(type)}
        className={`h-8 shrink-0 rounded-full border px-3 text-xs transition-colors ${filter === type ? "border-primary bg-primary-soft font-medium text-primary-hover" : "border-border bg-card text-text hover:border-border-hover"}`}>
        {type === "all" ? "All" : SECTION_LABELS[type]}
      </button>)}
    </div>
  </div>;
  const galleryGrid = (inModal: boolean) => SECTION_TYPES.filter(type => gallery.some(g => g.variant.type === type)).map(type => {
    const items = gallery.filter(g => g.variant.type === type);
    const headingId = `${inModal ? "picker" : "gallery"}-${type}`;
    return <section key={type} aria-labelledby={headingId} className="space-y-3">
      <h3 id={headingId} className="label-mono">{SECTION_LABELS[type]} · {items.length}</h3>
      <div className={`grid items-start gap-5 ${inModal ? "md:grid-cols-2 2xl:grid-cols-3" : "xl:grid-cols-2"}`}>
        {items.map(({ variant, preview }) => <article key={variant.id} className="min-w-0 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border-hover">
          <div className="border-b border-border bg-white"><KitPreviewFrame html={preview.html} css={preview.css} width={1280} maxHeight={inModal ? 260 : 340} title={`${SECTION_LABELS[variant.type]}: ${variant.name.en}`}/></div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <h4 className="min-w-0 truncate text-sm font-medium">{variant.name.en}</h4>
            <div className="flex gap-2">
              {!inModal && <button type="button" className={secondary} aria-label={`Copy ${variant.name.en} for Bricks`} onClick={() => copyTemplate(preview.result.template, variant.name.en)}>Copy</button>}
              <button type="button" className={inModal ? primary : secondary} aria-label={`Add ${variant.name.en} to the page`} onClick={() => add({ type: variant.type, variant: variant.id })}>{inModal ? "Add" : "Add to page"}</button>
            </div>
          </div>
        </article>)}
      </div>
    </section>;
  });

  return <div className={`grid gap-6 lg:gap-8 ${kitCollapsed ? "lg:grid-cols-[56px_minmax(0,1fr)]" : "lg:grid-cols-[300px_minmax(0,1fr)]"}`}>
    <aside className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto lg:pr-2">
      <button type="button" className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-4 text-sm font-medium lg:hidden" aria-expanded={panelOpen} aria-controls="kit-panel" onClick={() => setPanelOpen(o => !o)}>
        <span>Brand kit and business</span><span aria-hidden>{panelOpen ? "−" : "+"}</span>
      </button>
      {kitCollapsed && <div className="hidden flex-col items-center gap-3 rounded-xl border border-border bg-card py-3 lg:flex">
        <button type="button" className={iconButton} aria-label="Show brand kit" title="Show brand kit" aria-expanded={false} aria-controls="kit-panel" onClick={() => setKitCollapsed(false)}>›</button>
        <span className="flex flex-col gap-1.5" aria-hidden>{(["primary", "accent", "bg", "heading"] as const).map(t => <span key={t} className="h-5 w-5 rounded-full border border-black/10" style={{ background: swatches[t] }}/>)}</span>
      </div>}
      <div id="kit-panel" className={`${panelOpen ? "mt-4 block" : "hidden"} rounded-xl border border-border bg-card p-5 lg:mt-0 ${kitCollapsed ? "lg:hidden" : "lg:block"}`}>
        <div className="mb-4 hidden items-center justify-between lg:flex">
          <p className="label-mono">Brand kit</p>
          <button type="button" className="text-xs text-muted hover:text-foreground" aria-expanded={true} aria-controls="kit-panel" onClick={() => setKitCollapsed(true)}>‹ Hide</button>
        </div>
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
        {chips("sticky top-[96px] z-10 bg-background/95 py-2 backdrop-blur-sm md:top-16")}
        {galleryGrid(false)}
      </div>}

      {view === "page" && <div className="grid gap-6 xl:grid-cols-[288px_minmax(0,1fr)]">
        <div className="space-y-3 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-104px)] xl:self-start xl:overflow-y-auto">
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
              <button type="button" className={iconButton} aria-label={`Add a section after ${SECTION_LABELS[pick.type]}`} title="Add a section after this one" onClick={() => setPicker({ at: i + 1 })}>+</button>
              <button type="button" className={iconButton} aria-label={`Move ${SECTION_LABELS[pick.type]} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className={iconButton} aria-label={`Move ${SECTION_LABELS[pick.type]} down`} disabled={i === page.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className={iconButton} aria-label={`Remove ${SECTION_LABELS[pick.type]}`} onClick={() => setPage(current => current.filter((_, j) => j !== i))}>×</button>
            </li>)}
            {!page.length && <li className="px-3 py-6 text-center text-xs text-muted">Add sections to start your page.</li>}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => setPicker({})}>Add sections</button>
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

    <dialog ref={dialog} aria-labelledby="picker-title" onClose={() => setPicker(null)}
      className="m-auto h-[min(92vh,960px)] w-[min(96vw,1280px)] max-w-none overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/40">
      {picker && <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id="picker-title" className="text-base font-semibold">{picker.at !== undefined && picker.at > 0 && page[picker.at - 1] ? `Add after ${SECTION_LABELS[page[picker.at - 1].type]}` : "Add sections"}</h2>
            <p className="text-xs text-muted">Your page · {page.length} of {MAX_SECTIONS} sections. Add as many as you like; the page updates behind this window.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted" role="status" aria-live="polite">{status}</p>
            <button type="button" className={primary} onClick={() => setPicker(null)}>Done</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 pb-8">
          {chips("sticky top-0 z-10 bg-background/95 py-3 backdrop-blur-sm")}
          {galleryGrid(true)}
        </div>
      </div>}
    </dialog>
  </div>;
}
