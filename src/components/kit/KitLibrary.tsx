"use client";

import { useMemo, useState } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import { buildBricksImportJson } from "@/lib/bricks-export";
import { copyToClipboard, downloadText } from "@/lib/clipboard";
import { KIT_FONT_VARS } from "@/lib/kit/app-fonts";
import { INDUSTRIES, INDUSTRY_IDS, type IndustryId } from "@/lib/kit/content";
import { kitTemplateType, type SectionPick } from "@/lib/kit/generate";
import { DESIGNS, type Design } from "@/lib/kit/library";
import { findVariant } from "@/lib/kit/sections";
import { kitPreview, SECTION_LABELS } from "@/lib/kit/studio";
import { FONT_PAIRS, resolveKit, STYLE_IDS, STYLES, type BrandKit, type Language, type StyleId } from "@/lib/kit/tokens";
import KitPreviewFrame from "./KitPreviewFrame";
import type { KitSelection } from "./KitStudio";

export type StudioPreset = { kit: BrandKit; profile: { industry: IndustryId; language: Language }; page: SectionPick[] };

const secondary = "inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:border-border-hover hover:bg-subtle";
const primary = "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover";
const chip = (active: boolean) => `h-8 shrink-0 rounded-full border px-3 text-xs transition-colors ${active ? "border-primary bg-primary-soft font-medium text-primary-hover" : "border-border bg-card text-text hover:border-border-hover"}`;
const VIEWPORTS = { desktop: 1280, phone: 390 } as const;
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brickssnap";

function Swatches({ kit }: { kit: BrandKit }) {
  const r = resolveKit(kit);
  return <span className="flex gap-1" aria-hidden>{(["primary", "bg", "heading", "surface-alt"] as const).map(t => <span key={t} className="h-4 w-4 rounded-full border border-black/10" style={{ background: r.colors[t] }}/>)}</span>;
}

/** Ready-made designs: take a page or a section as it is, or continue in the Studio. */
export default function KitLibrary({ onCustomize, onOpenInStaging }: { onCustomize: (preset: StudioPreset) => void; onOpenInStaging: (selection: KitSelection) => void }) {
  const [language, setLanguage] = useState<Language>("de");
  const [industry, setIndustry] = useState<IndustryId | "all">("all");
  const [style, setStyle] = useState<StyleId | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [status, setStatus] = useState("");

  // Cards show each design's header and hero.
  const cards = useMemo(() => DESIGNS
    .filter(d => (industry === "all" || d.industry === industry) && (style === "all" || d.kit.style === style))
    .map(d => ({ design: d, preview: kitPreview(d.kit, { industry: d.industry, language }, d.page.slice(0, 2), { fonts: KIT_FONT_VARS, imageWidth: 800 }) })), [industry, style, language]);
  const open = openId ? DESIGNS.find(d => d.id === openId) ?? null : null;
  const detail = useMemo(() => open && {
    page: kitPreview(open.kit, { industry: open.industry, language }, open.page, { fonts: KIT_FONT_VARS }),
    sections: open.page.map(pick => ({ pick, preview: kitPreview(open.kit, { industry: open.industry, language }, [pick], { fonts: KIT_FONT_VARS, imageWidth: 800 }) })),
  }, [open, language]);

  const flash = (message: string) => { setStatus(message); window.setTimeout(() => setStatus(s => (s === message ? "" : s)), 2500); };
  const copy = async (template: BricksTemplate, what: string) => {
    try { await copyToClipboard(JSON.stringify({ ...template, source: "bricksCopiedElements" })); flash(`${what} copied. Paste it in Bricks with Ctrl+V.`); }
    catch { flash("Clipboard unavailable. Download the JSON file instead."); }
  };
  const customize = (d: Design) => onCustomize({ kit: d.kit, profile: { industry: d.industry, language }, page: d.page });
  const meta = (d: Design) => `${INDUSTRIES[d.industry].label.en} · ${STYLES[d.kit.style].label.en}${d.kit.mode === "dark" ? " · dark" : ""}`;

  const languageToggle = <div className="flex rounded-lg border border-border bg-subtle p-0.5" role="group" aria-label="Sample text language">
    {(["de", "en"] as const).map(l => <button key={l} type="button" aria-pressed={language === l} onClick={() => setLanguage(l)}
      className={`h-8 rounded-md px-3 text-xs ${language === l ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(28,25,23,.08)]" : "text-muted hover:text-foreground"}`}>{l === "de" ? "Deutsch" : "English"}</button>)}
  </div>;

  if (open && detail) {
    const title = `${open.name} · ${INDUSTRIES[open.industry].label[language]}`;
    return <div className="space-y-6">
      <button type="button" onClick={() => setOpenId(null)} className="text-sm text-muted hover:text-foreground">← All designs</button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono mb-2">{meta(open)}</p>
          <h3 className="text-[28px] font-semibold tracking-[-0.02em]">{open.name}</h3>
          <p className="mt-1 text-sm text-text">{open.description[language]}. {FONT_PAIRS[open.kit.fonts].label}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {languageToggle}
          <button type="button" className={primary} onClick={() => customize(open)}>Customize in Studio</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={secondary} onClick={() => downloadText(`${slug(open.name)}-${language}.json`, JSON.stringify(buildBricksImportJson(detail.page.result.template, title, kitTemplateType(open.page)), null, 2))}>Download page</button>
        <button type="button" className={secondary} onClick={() => copy(detail.page.result.template, "Page")}>Copy page (Ctrl+V)</button>
        <button type="button" className={secondary} onClick={() => onOpenInStaging({ template: detail.page.result.template, designSystem: detail.page.result.designSystem, kit: open.kit, title })}>Open in Staging</button>
        <span role="status" className="text-xs text-muted">{status}</span>
      </div>
      <div className="flex rounded-lg border border-border bg-subtle p-0.5 w-fit" role="group" aria-label="Preview width">
        {(Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>).map(v => <button key={v} type="button" aria-pressed={viewport === v} onClick={() => setViewport(v)}
          className={`h-8 rounded-md px-3 text-xs ${viewport === v ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(28,25,23,.08)]" : "text-muted hover:text-foreground"}`}>{v === "desktop" ? "Desktop" : "Phone"} <span className="font-mono text-[11px] text-muted">{VIEWPORTS[v]}</span></button>)}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-subtle">
        <div className="mx-auto bg-white" style={{ maxWidth: VIEWPORTS[viewport] }}><KitPreviewFrame html={detail.page.html} css={detail.page.css} width={VIEWPORTS[viewport]} title={`Preview of ${title}`}/></div>
      </div>
      <section aria-labelledby="design-sections" className="space-y-3">
        <h4 id="design-sections" className="label-mono">Sections of this design · {detail.sections.length}</h4>
        <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {detail.sections.map(({ pick, preview }, i) => <article key={`${i}:${pick.type}`} className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border bg-white"><KitPreviewFrame html={preview.html} css={preview.css} width={1280} maxHeight={260} title={`${SECTION_LABELS[pick.type]}: ${findVariant(pick.type, pick.variant).name.en}`}/></div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{SECTION_LABELS[pick.type]}</p><p className="truncate text-xs text-muted">{findVariant(pick.type, pick.variant).name.en}</p></div>
              <button type="button" className={secondary} onClick={() => copy(preview.result.template, SECTION_LABELS[pick.type])}>Copy</button>
            </div>
          </article>)}
        </div>
      </section>
    </div>;
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 sm:flex-wrap" role="group" aria-label="Filter by industry">
          <button type="button" className={chip(industry === "all")} aria-pressed={industry === "all"} onClick={() => setIndustry("all")}>All industries</button>
          {INDUSTRY_IDS.map(id => <button key={id} type="button" className={chip(industry === id)} aria-pressed={industry === id} onClick={() => setIndustry(id)}>{INDUSTRIES[id].label.en}</button>)}
        </div>
      </div>
      {languageToggle}
    </div>
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1.5 sm:flex-wrap" role="group" aria-label="Filter by style">
        <button type="button" className={chip(style === "all")} aria-pressed={style === "all"} onClick={() => setStyle("all")}>All styles</button>
        {STYLE_IDS.map(id => <button key={id} type="button" className={chip(style === id)} aria-pressed={style === id} onClick={() => setStyle(id)}>{STYLES[id].label.en}</button>)}
      </div>
    </div>
    <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ design: d, preview }) => <article key={d.id} className="group min-w-0 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border-hover">
        <button type="button" onClick={() => { setOpenId(d.id); window.scrollTo({ top: 0 }); }} className="block w-full text-left" aria-label={`Open design ${d.name}`}>
          <div className="border-b border-border bg-white"><KitPreviewFrame html={preview.html} css={preview.css} width={1280} maxHeight={300} title={`Design ${d.name}`}/></div>
          <div className="space-y-1 px-4 pt-3">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">{d.name}</h3><Swatches kit={d.kit}/></div>
            <p className="text-xs text-muted">{meta(d)} · {d.page.length} sections</p>
            <p className="text-xs text-text">{d.description[language]}</p>
          </div>
        </button>
        <div className="flex gap-2 px-4 pb-4 pt-3">
          <button type="button" className={secondary} onClick={() => { setOpenId(d.id); window.scrollTo({ top: 0 }); }}>View</button>
          <button type="button" className={secondary} onClick={() => customize(d)}>Customize</button>
        </div>
      </article>)}
    </div>
    {!cards.length && <p className="py-12 text-center text-sm text-muted">No design matches these filters yet.</p>}
  </div>;
}
