"use client";

import { useState } from "react";
import type { DesignSnapshot } from "@/lib/design-system-lifecycle";
import type { ManifestSummary, WordPressCredentials, WordPressDesignSystemRevertResult, WordPressDesignSystemUninstallResult } from "@/lib/wordpress-contract";
import { postWordPress } from "@/lib/wordpress-request";

export type LastInstall = { snapshot: DesignSnapshot; at: string; label?: string; failed?: boolean };

const KEY = (endpoint: string) => `brickssnap_ds_last:${endpoint}`;

/** The last install's snapshot for a site, kept in this browser so it can be undone after a reload. */
export function loadLastInstall(endpoint: string): LastInstall | null {
  try { return JSON.parse(localStorage.getItem(KEY(endpoint)) ?? "null"); } catch { return null; }
}
export function saveLastInstall(endpoint: string, value: LastInstall | null) {
  try { if (value) localStorage.setItem(KEY(endpoint), JSON.stringify(value)); else localStorage.removeItem(KEY(endpoint)); } catch { /* Not essential. */ }
}

const button = "h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:border-border-hover disabled:opacity-40";
const danger = "h-9 rounded-lg bg-danger px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40";
const when = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(); };
export const manifestLine = (m: ManifestSummary) => `${m.label ? `${m.label} · ` : ""}${m.style} ${m.primary} · BricksSnap ${m.app} · ${when(m.installedAt)}`;

/** Undo the last install from this browser, or uninstall BricksSnap's palette and variables from the site. */
export default function WordPressDesignSystemManage({ credentials, lastInstall, onLastInstallChange }: {
  credentials: WordPressCredentials; lastInstall: LastInstall | null; onLastInstallChange: (value: LastInstall | null) => void;
}) {
  const host = new URL(credentials.endpoint).host;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [undoResult, setUndoResult] = useState<WordPressDesignSystemRevertResult | null>(null);
  const [preview, setPreview] = useState<WordPressDesignSystemUninstallResult | null>(null);
  const [includeModified, setIncludeModified] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [removed, setRemoved] = useState<WordPressDesignSystemUninstallResult | null>(null);

  async function call<T>(body: Record<string, unknown>): Promise<T | null> {
    setBusy(true); setError("");
    try { return await postWordPress<T>({ credentials, ...body } as never); }
    catch (e) { setError(e instanceof Error ? e.message : "The request failed."); return null; }
    finally { setBusy(false); }
  }
  const undo = async () => {
    if (!lastInstall) return;
    const result = await call<WordPressDesignSystemRevertResult>({ action: "design-system-undo", snapshot: lastInstall.snapshot, confirm: true });
    if (result) { setUndoResult(result); setConfirmUndo(false); onLastInstallChange(null); setPreview(null); }
  };
  const check = async (include = includeModified) => {
    setRemoved(null); setConfirmUninstall(false);
    const result = await call<WordPressDesignSystemUninstallResult>({ action: "design-system-uninstall-plan", includeModified: include });
    if (result) setPreview(result);
  };
  const uninstall = async () => {
    const result = await call<WordPressDesignSystemUninstallResult>({ action: "design-system-uninstall", includeModified, confirm: true });
    if (result) { setRemoved(result); setPreview(null); setConfirmUninstall(false); onLastInstallChange(null); }
  };
  const nothingInstalled = preview && !preview.colors && !preview.variables;

  return <section className="space-y-4 rounded-xl border border-border bg-card p-5" aria-labelledby="wp-ds-manage-title">
    <div>
      <h3 id="wp-ds-manage-title" className="font-medium">Undo or uninstall the design system</h3>
      <p className="mt-1 text-sm text-muted">Bricks keeps no revisions of palettes and variables. BricksSnap records what each install replaced, and only reverts values that nobody changed since.</p>
    </div>

    {lastInstall && <div className="space-y-2 rounded-lg border border-border bg-subtle p-4 text-sm">
      <p><span className="font-medium">{lastInstall.failed ? "Last install stopped halfway" : "Last install"}</span> from this browser: {lastInstall.label ? `${lastInstall.label}, ` : ""}{when(lastInstall.at)}. {lastInstall.snapshot.colors.length} colors and {lastInstall.snapshot.variables.length} variables recorded.</p>
      {!confirmUndo
        ? <button type="button" className={button} disabled={busy} onClick={() => setConfirmUndo(true)}>Undo this install…</button>
        : <div className="flex flex-wrap items-center gap-2">
          <span>Set replaced values back and remove what it added on {host}?</span>
          <button type="button" className={danger} disabled={busy} onClick={undo}>{busy ? "Undoing…" : "Yes, undo"}</button>
          <button type="button" className={button} disabled={busy} onClick={() => setConfirmUndo(false)}>Cancel</button>
        </div>}
    </div>}
    {undoResult && <div role="status" className={`space-y-1 rounded-lg border p-4 text-sm ${undoResult.verified ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
      <p className="font-medium">{undoResult.verified ? "Undone and verified." : "Undone, but the read-back differs. Check the palette and variables in Bricks."}</p>
      <p className="text-text">{undoResult.restored} values restored, {undoResult.removed} removed{undoResult.palette ? ", palette removed" : ""}{undoResult.category ? ", category removed" : ""}.</p>
      {undoResult.skipped.length > 0 && <p className="break-words text-xs text-warning">Left alone because they changed after the install or are gone: {undoResult.skipped.map(s => s.name).join(", ")}.</p>}
    </div>}

    <details className="rounded-lg border border-border p-4 text-sm" onToggle={e => { if ((e.target as HTMLDetailsElement).open && !preview && !removed) void check(); }}>
      <summary className="cursor-pointer font-medium">Uninstall from {host}</summary>
      <div className="mt-3 space-y-3">
        {busy && !preview && <p className="text-muted">Checking…</p>}
        {nothingInstalled && <p>No BricksSnap palette or variables on this site.</p>}
        {preview && !nothingInstalled && <>
          {preview.manifest ? <p>Installed: {manifestLine(preview.manifest)}.</p> : <p className="text-warning">No manifest found (installed before BricksSnap 0.10). Everything in the “BricksSnap” palette and category counts as BricksSnap&apos;s.</p>}
          <ul className="space-y-1 text-text">
            <li>{preview.colors} palette colors{preview.palette ? " and the “BricksSnap” palette" : ""}</li>
            <li>{preview.variables} variables (including the manifest){preview.category ? " and the “BricksSnap” category" : ""}</li>
            <li>{preview.classes} <span className="font-mono text-xs">bs-</span> global classes stay: pages use them, and every value they use has a fallback, so pages keep their look without the variables.</li>
          </ul>
          {preview.modified.length > 0 && <div className="space-y-2">
            <p className="break-words text-warning">Changed in Bricks since the install{preview.manifest ? "" : " or unknown"}: {preview.modified.join(", ")}.</p>
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={includeModified} onChange={e => { setIncludeModified(e.target.checked); void check(e.target.checked); }}/>
              <span>Remove these too</span></label>
          </div>}
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={confirmUninstall} onChange={e => setConfirmUninstall(e.target.checked)}/>
            <span>Remove these from {host}. Each step is refused if someone changed palettes or variables meanwhile.</span></label>
          <button type="button" className={danger} disabled={!confirmUninstall || busy} onClick={uninstall}>{busy ? "Uninstalling…" : "Uninstall design system"}</button>
        </>}
        {removed && <div role="status" className={`space-y-1 rounded-lg border p-3 ${removed.verified ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
          <p className="font-medium">{removed.verified ? "Uninstalled and verified." : "Uninstalled, but the read-back differs. Check the palette and variables in Bricks."}</p>
          <p className="text-text">{removed.removed ?? 0} items removed{removed.palette ? ", palette removed" : ""}{removed.category ? ", category removed" : ""}.</p>
          {(removed.skipped?.length ?? 0) > 0 && <p className="break-words text-xs text-warning">Kept: {removed.skipped!.map(s => s.name).join(", ")}.</p>}
        </div>}
      </div>
    </details>
    {error && <p role="alert" className="break-words rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
  </section>;
}
