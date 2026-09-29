"use client";

import { useState } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import type { WordPressApplyResult, WordPressClassesResult, WordPressCredentials, WordPressMediaResult, WordPressRestoreResult, WordPressSource } from "@/lib/wordpress-contract";
import { findExternalImages } from "@/lib/template-images";
import { referencedClassIds } from "@/lib/template-classes";

interface WordPressApplyProps {
  source: WordPressSource;
  credentials: WordPressCredentials;
  /** The reviewed template, or null when there is no current review. */
  proposal: BricksTemplate | null;
  /** The page was saved or restored; the read-back becomes the new baseline. */
  onUpdated: (template: BricksTemplate, source: WordPressSource) => void;
  /** Images were imported or classes created; the reviewed template now points at the site's items. */
  onProposalChange?: (template: BricksTemplate) => void;
  /** Global class IDs known to exist on the site (loaded page and imported design context). */
  knownClassIds?: string[];
}

const button = "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed";

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/wordpress", { method: "POST", headers: { "Content-Type": "application/json", "X-BricksSnap-Local": "1" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "WordPress request failed."), { status: res.status });
  return data as T;
}

export default function WordPressApply({ source, credentials, proposal, onUpdated, onProposalChange, knownClassIds = [] }: WordPressApplyProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [mediaResult, setMediaResult] = useState<WordPressMediaResult | null>(null);
  const [classResult, setClassResult] = useState<WordPressClassesResult | null>(null);
  const [classesMissing, setClassesMissing] = useState(false);
  const [lockedPage, setLockedPage] = useState(false);
  const [allowLocked, setAllowLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<WordPressApplyResult | null>(null);
  const [restored, setRestored] = useState<WordPressRestoreResult | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const target = `${source.postTitle ?? `Post #${source.postId}`} (#${source.postId})`;
  const host = new URL(source.endpoint).host;
  const externalImages = proposal ? findExternalImages(proposal, new URL(source.endpoint).hostname) : [];
  const imageHosts = [...new Set(externalImages.map(image => new URL(image.url).hostname))];
  // Classes the change uses that the loaded page and design context do not show on the site.
  const known = new Set([...knownClassIds, ...(classResult?.created.map(c => c.id) ?? []), ...(classResult?.reused.map(c => c.siteId) ?? [])]);
  const newClasses = proposal ? referencedClassIds(proposal).filter(id => !known.has(id)).map(id => proposal.globalClasses?.find(c => c.id === id)?.name ?? id) : [];

  async function createClasses() {
    if (!proposal) return;
    setBusy(true); setError("");
    try {
      const result = await post<WordPressClassesResult>({ action: "classes", credentials, template: proposal, confirm: true });
      setClassResult(result); setClassesMissing(false);
      if (result.created.length || result.reused.length) onProposalChange?.(result.template);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the classes.");
    } finally { setBusy(false); }
  }

  async function importImages() {
    if (!proposal) return;
    setBusy(true); setError("");
    try {
      const result = await post<WordPressMediaResult>({ action: "media", credentials, template: proposal, confirm: true });
      setMediaResult(result);
      if (result.imported.length) onProposalChange?.(result.template);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import the images.");
    } finally { setBusy(false); }
  }

  async function apply() {
    if (!proposal || !source.documentDigest) return;
    setBusy(true); setError(""); setRestored(null); setConfirmRestore(false);
    try {
      const result = await post<WordPressApplyResult>({ action: "apply", credentials, postId: source.postId, expectedDocumentDigest: source.documentDigest, template: proposal, confirm: true, allowLocked });
      setApplied(result); setConfirmed(false); setLockedPage(false); setAllowLocked(false);
      onUpdated(result.template, result.source);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not apply the change.";
      if (/open in the Bricks builder/.test(message)) setLockedPage(true);
      if (/global classes that do not exist/.test(message)) setClassesMissing(true);
      setError(message);
    } finally { setBusy(false); }
  }

  async function restore() {
    if (!applied?.revisionId) return;
    setBusy(true); setError("");
    try {
      const result = await post<WordPressRestoreResult>({ action: "restore", credentials, postId: applied.postId, revisionId: applied.revisionId, expectedDocumentDigest: applied.documentDigest, confirm: true });
      setRestored(result); setApplied(null); setConfirmRestore(false);
      onUpdated(result.template, result.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore the revision.");
    } finally { setBusy(false); }
  }

  return <section className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5 space-y-4" aria-labelledby="wp-apply-title">
    <div>
      <h3 id="wp-apply-title" className="font-medium">5. Apply to WordPress</h3>
      <p className="text-xs text-muted mt-1 break-words">Target: <strong>{target}</strong> on {host} · baseline digest <span className="font-mono">{source.documentDigest?.slice(0, 12)}</span> · loaded {new Date(source.fetchedAt).toLocaleTimeString()}</p>
    </div>

    {mediaResult && <div role="status" className="rounded-lg border border-border bg-background p-3 text-xs space-y-1">
      <p>Media library: {mediaResult.imported.filter(i => !i.reused).length} images imported, {mediaResult.imported.filter(i => i.reused).length} reused from earlier imports.</p>
      {mediaResult.skipped.map(s => <p key={s.source} className="text-amber-300 break-words">Not imported: {s.source} — {s.reason}</p>)}
    </div>}
    {proposal && !applied && externalImages.length > 0 && <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <p className="text-sm">This change uses {externalImages.length} external {externalImages.length === 1 ? "image" : "images"} ({imageHosts.join(", ")}). Some host firewalls block saving such URLs, and the page would depend on another server.</p>
      <button className={`${button} border border-border`} disabled={busy} onClick={importImages}>{busy ? "Importing…" : `Import ${externalImages.length === 1 ? "image" : `${externalImages.length} images`} into the media library`}</button>
    </div>}
    {classResult && <div role="status" className="rounded-lg border border-border bg-background p-3 text-xs space-y-1">
      <p>Global classes: {classResult.created.length} created{classResult.created.length ? ` (${classResult.created.map(c => c.name).join(", ")})` : ""}, {classResult.reused.length} identical site {classResult.reused.length === 1 ? "class" : "classes"} reused.</p>
      {classResult.conflicts.map(c => <p key={c.id} className="text-amber-300 break-words">Not created: {c.name} {c.siteId ? "exists on the site with a different definition. Rename it in the staged JSON, or use the site's class." : "is defined twice in the change."}</p>)}
      {classResult.undefinedIds.length > 0 && <p className="text-amber-300 break-words">No definition in the change for class IDs {classResult.undefinedIds.join(", ")}. Remove them from the elements or add their definitions.</p>}
    </div>}
    {proposal && !applied && (newClasses.length > 0 || classesMissing) && <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <p className="text-sm break-words">{newClasses.length > 0
        ? `This change uses global classes that may not exist on the site yet: ${newClasses.join(", ")}.`
        : "The site lacks global classes this change uses."} Missing classes are created from the change&apos;s definitions in one step. Existing classes are never changed.</p>
      <button className={`${button} border border-border`} disabled={busy} onClick={createClasses}>{busy ? "Creating…" : "Create missing global classes"}</button>
    </div>}
    {proposal && !applied && <div className="space-y-3">
      <p className="text-sm">Saving replaces all elements of this page with the reviewed version. Bricks refuses the save if the page changed since it was loaded, and keeps a revision of the current state first.</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>I reviewed these changes and want to save them to {target}.</label>
      {lockedPage && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={allowLocked} onChange={e => setAllowLocked(e.target.checked)}/>Apply although the page is open in the builder. The next save in the builder can overwrite this change.</label>}
      <button className={`${button} bg-amber-500 text-black`} disabled={!confirmed || busy || (lockedPage && !allowLocked)} onClick={apply}>{busy ? "Saving…" : "Apply to WordPress"}</button>
    </div>}
    {!proposal && !applied && !restored && <p className="text-xs text-muted">Review a change above to apply it to this page.</p>}

    {applied && <div role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 space-y-2 text-sm">
      <p><strong>Saved to {target}.</strong> {applied.template.content.length} elements, new digest <span className="font-mono">{applied.documentDigest.slice(0, 12)}</span>.</p>
      <p>{applied.verification.matches
        ? "Read-back matches the reviewed version."
        : `Read-back differs in ${applied.verification.changed + applied.verification.added + applied.verification.removed + applied.verification.moved} elements, typically Bricks converting custom CSS into native style controls (${applied.verification.fields.slice(0, 6).join(", ")}${applied.verification.fields.length > 6 ? ", …" : ""}). Check the page in Bricks.`}</p>
      {applied.warnings?.map((w, i) => <p key={i} className="text-xs text-amber-300 break-words">{w}</p>)}
      {applied.revisionId
        ? <div className="flex flex-wrap items-center gap-2 pt-1">
            {!confirmRestore
              ? <button className={`${button} border border-border`} disabled={busy} onClick={() => setConfirmRestore(true)}>Restore previous version</button>
              : <><span className="text-xs">Restore revision #{applied.revisionId} and discard the applied change?</span>
                  <button className={`${button} bg-red-500 text-white`} disabled={busy} onClick={restore}>{busy ? "Restoring…" : "Confirm restore"}</button>
                  <button className={`${button} border border-border`} disabled={busy} onClick={() => setConfirmRestore(false)}>Cancel</button></>}
          </div>
        : <p className="text-xs text-muted">The page was empty before, so there is no previous version to restore.</p>}
    </div>}

    {restored && <p role="status" className="rounded-lg border border-border bg-background p-4 text-sm">Restored revision #{restored.fromRevisionId}: {restored.template.content.length} elements, digest <span className="font-mono">{restored.documentDigest.slice(0, 12)}</span>.{restored.newRevisionId ? ` Bricks kept revision #${restored.newRevisionId} of the replaced state.` : ""}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400 break-words">{error}</p>}
  </section>;
}
