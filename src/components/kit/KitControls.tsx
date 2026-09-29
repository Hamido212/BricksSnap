"use client";

import { useState } from "react";
import { INDUSTRIES, INDUSTRY_IDS, type BusinessProfile, type IndustryId } from "@/lib/kit/content";
import { normalizeHex } from "@/lib/kit/color";
import { contrastChecks, FONT_PAIR_IDS, FONT_PAIRS, kitForStyle, RADIUS_IDS, resolveKit, SPACING_IDS, STYLE_IDS, STYLES, type BrandKit, type FontPairId } from "@/lib/kit/tokens";

const SWATCHES = ["#2563eb", "#0b5fff", "#0f766e", "#16a34a", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#b45309", "#1f4d3a", "#1f2937"];
const RADIUS_LABELS = { none: "None", small: "S", medium: "M", large: "L", round: "Round" } as const;
const SPACING_LABELS = { compact: "Compact", normal: "Normal", airy: "Airy" } as const;
const input = "h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none";

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: ReadonlyArray<{ id: T; label: string }>; onChange: (value: T) => void }) {
  return <fieldset>
    <legend className="mb-2 text-xs font-medium text-text">{label}</legend>
    <div className="flex rounded-lg border border-border bg-subtle p-0.5">
      {options.map(option => <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)}
        className={`h-8 min-w-0 flex-1 rounded-md px-2 text-xs transition-colors ${value === option.id ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(28,25,23,.08)]" : "text-muted hover:text-foreground"}`}>{option.label}</button>)}
    </div>
  </fieldset>;
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  // Follow outside changes (swatches, style presets) without a sync effect.
  if (shown !== value) { setShown(value); setDraft(value); }
  return <div>
    <label htmlFor={id} className="mb-2 block text-xs font-medium text-text">{label}</label>
    <div className="flex items-center gap-2">
      <input type="color" aria-label={`${label} picker`} value={value} onChange={e => onChange(e.target.value)} className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-border bg-card p-1"/>
      <input id={id} className={`${input} font-mono uppercase`} value={draft} maxLength={7} spellCheck={false}
        onChange={e => { setDraft(e.target.value); const hex = normalizeHex(e.target.value); if (hex) onChange(hex); }}
        onBlur={() => setDraft(value)}/>
    </div>
  </div>;
}

export default function KitControls({ kit, onKit, profile, onProfile }: { kit: BrandKit; onKit: (kit: BrandKit) => void; profile: BusinessProfile; onProfile: (profile: BusinessProfile) => void }) {
  const [services, setServices] = useState(profile.services?.join("\n") ?? "");
  const checks = contrastChecks(resolveKit(kit)).filter(check => !check.ok);
  const field = (key: "name" | "city" | "phone" | "email" | "address", label: string, placeholder: string, type = "text") =>
    <div key={key}>
      <label htmlFor={`kit-${key}`} className="mb-1.5 block text-xs font-medium text-text">{label}</label>
      <input id={`kit-${key}`} type={type} className={input} placeholder={placeholder} value={profile[key] ?? ""} maxLength={key === "address" ? 160 : 120}
        onChange={e => onProfile({ ...profile, [key]: e.target.value || undefined })}/>
    </div>;
  const de = profile.language === "de";

  return <div className="space-y-8">
    <section aria-labelledby="kit-brand" className="space-y-5">
      <h3 id="kit-brand" className="label-mono">Brand kit</h3>
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-text">Style direction</legend>
        <div className="grid gap-1.5">
          {STYLE_IDS.map(id => <button key={id} type="button" aria-pressed={kit.style === id} onClick={() => onKit(kitForStyle(id, kit))}
            className={`rounded-lg border px-3 py-2 text-left transition-colors ${kit.style === id ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-border-hover"}`}>
            <span className={`block text-sm font-medium ${kit.style === id ? "text-primary-hover" : "text-foreground"}`}>{STYLES[id].label.en}</span>
            <span className="block text-xs text-muted">{STYLES[id].description.en}</span>
          </button>)}
        </div>
      </fieldset>
      <div className="space-y-2">
        <ColorField id="kit-primary" label="Brand color" value={kit.primary} onChange={primary => onKit({ ...kit, primary })}/>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested brand colors">
          {SWATCHES.map(color => <button key={color} type="button" title={color} aria-label={`Use ${color}`} aria-pressed={kit.primary === color} onClick={() => onKit({ ...kit, primary: color })}
            className={`h-6 w-6 rounded-full border ${kit.primary === color ? "ring-2 ring-foreground ring-offset-2" : "border-black/10"}`} style={{ background: color }}/>)}
        </div>
        {checks.length > 0 && <p className="text-xs text-warning">{checks.map(c => `${c.pair}: ${c.ratio}:1 (needs ${c.required}:1)`).join(" · ")}</p>}
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-text">
          <input type="checkbox" className="accent-[var(--primary)]" checked={!!kit.accent} onChange={e => onKit({ ...kit, accent: e.target.checked ? "#f59e0b" : undefined })}/>
          Second color for highlights
        </label>
        {kit.accent && <ColorField id="kit-accent" label="Highlight color" value={kit.accent} onChange={accent => onKit({ ...kit, accent })}/>}
      </div>
      <div>
        <label htmlFor="kit-fonts" className="mb-2 block text-xs font-medium text-text">Fonts</label>
        <select id="kit-fonts" className={input} value={kit.fonts} onChange={e => onKit({ ...kit, fonts: e.target.value as FontPairId })}>
          {FONT_PAIR_IDS.map(id => <option key={id} value={id}>{FONT_PAIRS[id].label}</option>)}
        </select>
      </div>
      <Segmented label="Corners" value={kit.radius} options={RADIUS_IDS.map(id => ({ id, label: RADIUS_LABELS[id] }))} onChange={radius => onKit({ ...kit, radius })}/>
      <Segmented label="Spacing" value={kit.spacing} options={SPACING_IDS.map(id => ({ id, label: SPACING_LABELS[id] }))} onChange={spacing => onKit({ ...kit, spacing })}/>
      <Segmented label="Mode" value={kit.mode} options={[{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }]} onChange={mode => onKit({ ...kit, mode })}/>
    </section>

    <section aria-labelledby="kit-business" className="space-y-4">
      <h3 id="kit-business" className="label-mono">Business</h3>
      <div>
        <label htmlFor="kit-industry" className="mb-1.5 block text-xs font-medium text-text">Industry</label>
        <select id="kit-industry" className={input} value={profile.industry} onChange={e => onProfile({ ...profile, industry: e.target.value as IndustryId })}>
          {INDUSTRY_IDS.map(id => <option key={id} value={id}>{INDUSTRIES[id].label.en} · {INDUSTRIES[id].description.en}</option>)}
        </select>
      </div>
      <Segmented label="Sample text language" value={profile.language} options={[{ id: "de", label: "Deutsch" }, { id: "en", label: "English" }]} onChange={language => onProfile({ ...profile, language })}/>
      {field("name", "Business name", INDUSTRIES[profile.industry].label[profile.language])}
      <div className="grid grid-cols-2 gap-3">
        {field("city", "City", de ? "Bremen" : "Bristol")}
        {field("phone", "Phone", "0421 123 456", "tel")}
      </div>
      {field("email", "Email", "info@example.com", "email")}
      {field("address", "Address", de ? "Hauptstraße 1, 28195 Bremen" : "1 High Street, Bristol")}
      <div>
        <label htmlFor="kit-services" className="mb-1.5 block text-xs font-medium text-text">Your services <span className="font-normal text-muted">(one per line, up to 6)</span></label>
        <textarea id="kit-services" rows={4} className={`${input} h-auto py-2 leading-relaxed`} value={services} placeholder="Leave empty for sample services"
          onChange={e => { setServices(e.target.value); const list = e.target.value.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 6); onProfile({ ...profile, services: list.length ? list : undefined }); }}/>
      </div>
      <p className="text-xs leading-relaxed text-muted">Texts are written for the industry and filled with your details. Nothing leaves your browser.</p>
    </section>
  </div>;
}
