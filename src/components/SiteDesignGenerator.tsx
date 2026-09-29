"use client";

import { useMemo, useState } from "react";
import { SECTION_TYPES } from "@/lib/presets";
import { COLOR_ROLES, generateInSiteDesign, siteColors, suggestRoles, type ColorRole, type RoleMapping, type SiteFont, type SitePalette } from "@/lib/site-design";

const control = "w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs focus:outline-2 focus:outline-primary";

/** Palettes may include the colors of the loaded page; `fonts` are the page's font stacks, most used first. */
export default function SiteDesignGenerator({ palettes, fonts, host, onGenerate }: { palettes: SitePalette[]; fonts: string[]; host: string; onGenerate: (json: string) => void }) {
  const colors = useMemo(() => siteColors(palettes), [palettes]);
  const [mapping, setMapping] = useState<RoleMapping>(() => suggestRoles(colors));
  const [sections, setSections] = useState<string[]>(["hero"]);
  const [next, setNext] = useState("features");
  const [prompt, setPrompt] = useState("");
  const [linkPalette, setLinkPalette] = useState(true);
  // A page that sets its own font usually has no theme typography to inherit.
  const [font, setFont] = useState(fonts.length ? `family:${fonts[0]}` : "inherit");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const hexOf = (role: ColorRole) => colors.find(c => c.id === mapping[role])?.hex;

  function generate() {
    setError(""); setStatus("");
    try {
      const siteFont: SiteFont = font.startsWith("family:") ? { family: font.slice(7) } : font === "default" ? "default" : "inherit";
      const result = generateInSiteDesign({ prompt: prompt.trim() || sections.join(" "), sections, mapping, colors, linkPalette, font: siteFont });
      onGenerate(JSON.stringify(result.template, null, 2));
      setStatus(`Generated ${result.template.content.length} elements in ${host}'s design as the new section. ${result.warnings.length - 1} content warnings.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate the section."); }
  }

  if (!colors.length) return null;
  return <div className="rounded-xl border border-border bg-card p-4 space-y-4" aria-labelledby="site-design-title">
    <div>
      <h3 id="site-design-title" className="font-medium text-sm">Generate in the site&apos;s design</h3>
      <p className="text-xs text-muted mt-1">Built-in sections in {host}&apos;s colors and fonts. Colors are suggested per role from the site palette and the loaded page; adjust them before generating.</p>
    </div>
    <div className="grid gap-2 sm:grid-cols-3">
      {COLOR_ROLES.map(role => <label key={role} className="min-w-0 text-xs space-y-1">
        <span className="flex items-center gap-2 capitalize"><span className="inline-block h-3 w-3 rounded-full border border-border" style={{ background: hexOf(role) ?? "transparent" }}/>{role}</span>
        <select className={control} value={mapping[role] ?? ""} onChange={e => setMapping(m => ({ ...m, [role]: e.target.value || undefined }))} aria-label={`${role} color`}>
          <option value="">BricksSnap default</option>
          {colors.map(c => <option key={c.id} value={c.id}>{c.label} · {c.hex}{c.isDefault ? "" : ` · ${c.palette}`}</option>)}
        </select>
      </label>)}
    </div>
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {sections.map((id, i) => <span key={`${id}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs">{SECTION_TYPES.find(s => s.id === id)?.name ?? id}<button aria-label={`Remove ${id}`} className="text-muted hover:text-foreground" onClick={() => setSections(s => s.filter((_, j) => j !== i))}>×</button></span>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <select className={`${control} sm:w-auto`} value={next} onChange={e => setNext(e.target.value)} aria-label="Section type">{SECTION_TYPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card-hover disabled:opacity-40" disabled={sections.length >= 12} onClick={() => setSections(s => [...s, next])}>Add section</button>
      </div>
      <input className={control} value={prompt} maxLength={4000} onChange={e => setPrompt(e.target.value)} placeholder="Optional: topic keywords, e.g. vehicle registration service Bremen"/>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
      <label className="flex items-center gap-2"><input type="checkbox" checked={linkPalette} onChange={e => setLinkPalette(e.target.checked)}/>Link palette colors to their CSS variables</label>
      <label className="flex min-w-0 items-center gap-2">Font
        <select className={`${control} sm:w-auto`} value={font} onChange={e => setFont(e.target.value)}>
          {fonts.map(stack => <option key={stack} value={`family:${stack}`}>{stack} (page)</option>)}
          <option value="inherit">Site typography (theme styles)</option>
          <option value="default">BricksSnap default (Inter)</option>
        </select>
      </label>
    </div>
    <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40" disabled={!sections.length} onClick={generate}>Generate as new section</button>
    {status && <p role="status" className="text-xs text-muted">{status}</p>}
    {error && <p role="alert" className="text-xs text-danger break-words">{error}</p>}
  </div>;
}
