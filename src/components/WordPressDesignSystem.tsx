"use client";

import { useState } from "react";
import { designSystemFor } from "@/lib/kit/generate";
import { resolveKit, STYLES, type BrandKit } from "@/lib/kit/tokens";
import type { WordPressCredentials, WordPressDesignSystemResult } from "@/lib/wordpress-contract";
import { postWordPress } from "@/lib/wordpress-request";

const SWATCH_TOKENS = ["primary", "accent", "bg", "surface-alt", "heading", "text", "muted", "inverse"] as const;

/** Install the Studio kit's colors and variables on the connected site, after showing what changes. */
export default function WordPressDesignSystem({ credentials, kit }: { credentials: WordPressCredentials; kit: BrandKit }) {
  const [plan, setPlan] = useState<WordPressDesignSystemResult | null>(null);
  const [result, setResult] = useState<WordPressDesignSystemResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const host = new URL(credentials.endpoint).host;
  const resolved = resolveKit(kit);
  const ds = designSystemFor(resolved);

  async function run(install: boolean) {
    setBusy(true); setError("");
    try {
      const response = await postWordPress<WordPressDesignSystemResult>(install ? { action: "design-system", credentials, kit, confirm: true } : { action: "design-system-plan", credentials, kit });
      if (install) { setResult(response); setPlan(null); setConfirmed(false); } else { setPlan(response); setResult(null); }
    } catch (e) { setError(e instanceof Error ? e.message : "The request failed."); }
    finally { setBusy(false); }
  }
  const nothingToDo = plan && !plan.changes.length && !plan.category.create;

  return <section className="space-y-4 rounded-xl border border-border bg-card p-5" aria-labelledby="wp-ds-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h3 id="wp-ds-title" className="font-medium">Design system for {host}</h3>
        <p className="mt-1 text-sm text-muted">The Studio kit ({STYLES[resolved.kit.style].label.en}, {resolved.fonts.label}) as a “{ds.palette.name}” color palette and global variables. Installed, every <span className="font-mono text-xs">bs-</span> class on the site follows them, so colors, fonts and spacing change in one place in Bricks.</p>
      </div>
      <div className="flex gap-1" aria-hidden>{SWATCH_TOKENS.map(token => <span key={token} title={`--bs-${token}`} className="h-6 w-6 rounded-full border border-black/10" style={{ background: resolved.colors[token] }}/>)}</div>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => run(false)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:border-border-hover disabled:opacity-40">{busy && !confirmed ? "Checking…" : "Check what changes"}</button>
    </div>
    {plan && <div className="space-y-3 rounded-lg border border-border bg-subtle p-4 text-sm" aria-live="polite">
      {nothingToDo ? <p>Everything is installed: {plan.palette.unchanged} colors and {plan.variables.unchanged} variables already match.</p> : <>
        <ul className="space-y-1 text-text">
          <li>Palette “{plan.palette.name}”: {plan.palette.exists ? "exists" : "new"}, {plan.palette.create} colors to add, {plan.palette.update} to update, {plan.palette.unchanged} unchanged.</li>
          <li>Variables: {plan.variables.create} to add, {plan.variables.update} to update, {plan.variables.unchanged} unchanged{plan.category.create ? `, in a new category “${plan.category.name}”` : ""}.</li>
        </ul>
        {plan.changes.some(c => c.action === "update") && <details><summary className="cursor-pointer text-xs">Values that change ({plan.changes.filter(c => c.action === "update").length})</summary>
          <ul className="mt-2 max-h-48 space-y-1 overflow-auto font-mono text-xs">{plan.changes.filter(c => c.action === "update").map(c => <li key={c.name} className="break-words">{c.name}: {c.from} → {c.to}</li>)}</ul>
        </details>}
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>
          <span>Add and update these on {host}. Nothing is deleted; each step is refused if someone else changed palettes or variables meanwhile.</span></label>
        <button type="button" disabled={!confirmed || busy} onClick={() => run(true)} className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-40">{busy && confirmed ? "Installing…" : "Install design system"}</button>
      </>}
      {plan.warnings.map((w, i) => <p key={i} className="break-words text-xs text-warning">{w}</p>)}
    </div>}
    {result && <div role="status" className={`space-y-1 rounded-lg border p-4 text-sm ${result.verified === false ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"}`}>
      <p className="font-medium">{result.installed ? (result.verified ? "Installed and verified." : "Installed, but the read-back differs. Check the palette and variables in Bricks.") : "Nothing to change: the design system is already installed."}</p>
      <p className="text-text">{result.palette.create} colors added, {result.palette.update} updated; {result.variables.create} variables added, {result.variables.update} updated.</p>
      {result.warnings.map((w, i) => <p key={i} className="break-words text-xs text-warning">{w}</p>)}
    </div>}
    {error && <p role="alert" className="break-words rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
  </section>;
}
