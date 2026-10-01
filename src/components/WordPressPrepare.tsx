"use client";

import { useState } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import type { WordPressClassesResult, WordPressClassUpdateResult, WordPressCredentials, WordPressMediaResult } from "@/lib/wordpress-contract";
import { findExternalImages } from "@/lib/template-images";
import { isBricksSnapClass, referencedClassIds } from "@/lib/template-classes";
import { postWordPress } from "@/lib/wordpress-request";

interface WordPressPrepareProps {
  credentials: WordPressCredentials;
  /** The reviewed template. */
  proposal: BricksTemplate;
  /** Images were imported or classes created; the reviewed template now points at the site's items. */
  onProposalChange: (template: BricksTemplate) => void;
  /** Global class IDs known to exist on the site (loaded page and imported design context). */
  knownClassIds: string[];
  /** A save was refused because classes are missing although none looked new. */
  classesMissing: boolean;
}

const button = "rounded-lg px-4 py-2 text-sm font-medium border border-border disabled:opacity-40 disabled:cursor-not-allowed";

/** Steps before saving to WordPress: copy external images into the media library, create missing global classes. */
export default function WordPressPrepare({ credentials, proposal, onProposalChange, knownClassIds, classesMissing }: WordPressPrepareProps) {
  const [mediaResult, setMediaResult] = useState<WordPressMediaResult | null>(null);
  const [classResult, setClassResult] = useState<WordPressClassesResult | null>(null);
  // The change's own definitions of BricksSnap classes the site has in another version.
  const [outdated, setOutdated] = useState<Array<{ name: string; settings: Record<string, unknown> }>>([]);
  const [updateResult, setUpdateResult] = useState<WordPressClassUpdateResult | null>(null);
  const [undone, setUndone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const siteHost = new URL(credentials.endpoint).hostname;
  const externalImages = findExternalImages(proposal, siteHost);
  const imageHosts = [...new Set(externalImages.map(image => new URL(image.url).hostname))];
  // Classes the change uses that the loaded page and design context do not show on the site.
  const known = new Set([...knownClassIds, ...(classResult?.created.map(c => c.id) ?? []), ...(classResult?.reused.map(c => c.siteId) ?? [])]);
  const newClasses = referencedClassIds(proposal).filter(id => !known.has(id)).map(id => proposal.globalClasses?.find(c => c.id === id)?.name ?? id);
  const classesOpen = newClasses.length > 0 || (classesMissing && !classResult);

  async function run<T>(action: "media" | "classes", onResult: (result: T) => void) {
    setBusy(true); setError("");
    try { onResult(await postWordPress<T>({ action, credentials, template: proposal, confirm: true })); }
    catch (e) { setError(e instanceof Error ? e.message : "The request failed."); }
    finally { setBusy(false); }
  }
  const importImages = () => run<WordPressMediaResult>("media", result => {
    setMediaResult(result);
    if (result.imported.length) onProposalChange(result.template);
  });
  const createClasses = () => {
    const staged = proposal.globalClasses ?? [];
    return run<WordPressClassesResult>("classes", result => {
      setClassResult(result);
      setOutdated(result.mismatched.filter(c => isBricksSnapClass(c.name)).flatMap(c => staged.filter(d => d.name === c.name).map(d => ({ name: d.name, settings: d.settings ?? {} }))));
      setUpdateResult(null); setUndone(false);
      if (result.created.length || result.reused.length || result.remapped.length) onProposalChange(result.template);
    });
  };
  async function updateClasses(classes: Array<{ name: string; settings: Record<string, unknown> }>, onResult: (result: WordPressClassUpdateResult) => void) {
    setBusy(true); setError("");
    try { onResult(await postWordPress<WordPressClassUpdateResult>({ action: "update-classes", credentials, classes, confirm: true })); }
    catch (e) { setError(e instanceof Error ? e.message : "The request failed."); }
    finally { setBusy(false); }
  }
  const applyUpdate = () => updateClasses(outdated, result => {
    setUpdateResult(result); setUndone(false);
    if (result.updated.length) onProposalChange({ ...proposal, globalClasses: (proposal.globalClasses ?? []).map(c => { const next = outdated.find(o => o.name === c.name); return next ? { ...c, settings: next.settings } : c; }) });
  });
  const undoUpdate = () => updateResult && updateClasses(updateResult.previous, result => { if (!result.error) setUndone(true); else setError(result.error); });

  if (!externalImages.length && !classesOpen && !mediaResult && !classResult && !updateResult && !error) return null;
  return <section className="rounded-xl border border-border bg-card p-5 space-y-3" aria-labelledby="wp-prepare-title">
    <h3 id="wp-prepare-title" className="font-medium">Before saving to {siteHost}</h3>
    {mediaResult && <div role="status" className="rounded-lg border border-border bg-subtle p-3 text-xs space-y-1">
      <p>Media library: {mediaResult.imported.filter(i => !i.reused).length} images imported, {mediaResult.imported.filter(i => i.reused).length} reused from earlier imports.</p>
      {mediaResult.skipped.map(s => <p key={s.source} className="text-warning break-words">Not imported: {s.source} — {s.reason}</p>)}
    </div>}
    {externalImages.length > 0 && <div className="rounded-lg border border-border bg-subtle p-3 space-y-2">
      <p className="text-sm">This change uses {externalImages.length} external {externalImages.length === 1 ? "image" : "images"} ({imageHosts.join(", ")}). Some host firewalls block saving such URLs, and the page would depend on another server.</p>
      <button className={button} disabled={busy} onClick={importImages}>{busy ? "Working…" : `Import ${externalImages.length === 1 ? "image" : `${externalImages.length} images`} into the media library`}</button>
    </div>}
    {classResult && <div role="status" className="rounded-lg border border-border bg-subtle p-3 text-xs space-y-1">
      <p>Global classes: {classResult.created.length} created{classResult.created.length ? ` (${classResult.created.map(c => c.name).join(", ")})` : ""}, {classResult.reused.length} identical site {classResult.reused.length === 1 ? "class" : "classes"} reused.</p>
      {classResult.conflicts.map(c => <p key={c.id} className="text-warning break-words">Not created: {c.name} {c.siteId ? "exists on the site with a different definition. Rename it in the staged JSON, or use the site's class." : "is defined twice in the change."}</p>)}
      {classResult.remapped.map(c => <p key={c.id} className="break-words">New ID for {c.name}: the site already used {c.id} for {c.siteName}, so it was created as {c.newId}.</p>)}
      {classResult.mismatched.filter(c => !isBricksSnapClass(c.name)).map(c => <p key={c.id} className="text-warning break-words">Kept the site&apos;s {c.name}: it has a different definition on the site. The page shows the site&apos;s version.</p>)}
      {classResult.undefinedIds.length > 0 && <p className="text-warning break-words">No definition in the change for class IDs {classResult.undefinedIds.join(", ")}. Remove them from the elements or add their definitions.</p>}
    </div>}
    {outdated.length > 0 && !updateResult && <div className="rounded-lg border border-border bg-subtle p-3 space-y-2">
      <p className="text-sm break-words">{outdated.length} BricksSnap {outdated.length === 1 ? "class has" : "classes have"} another version on the site (an older BricksSnap release or another design): {outdated.map(c => c.name).join(", ")}. The page shows the site&apos;s version until you update {outdated.length === 1 ? "it" : "them"}.</p>
      <p className="text-xs text-muted">Updating changes these classes everywhere on the site, also on pages that already use them. Only <code>bs-</code> classes are changed, each write is guarded, the result is read back, and you can undo it.</p>
      <button className={button} disabled={busy} onClick={applyUpdate}>{busy ? "Working…" : `Update ${outdated.length} BricksSnap ${outdated.length === 1 ? "class" : "classes"}`}</button>
    </div>}
    {updateResult && <div role="status" className="rounded-lg border border-border bg-subtle p-3 text-xs space-y-1">
      {undone
        ? <p>Undone: {updateResult.previous.length} {updateResult.previous.length === 1 ? "class is" : "classes are"} back on the site&apos;s earlier version.</p>
        : <p>BricksSnap classes: {updateResult.updated.length} updated{updateResult.updated.length ? ` (${updateResult.updated.map(c => c.name).join(", ")})` : ""}{updateResult.unchanged.length ? `, ${updateResult.unchanged.length} already current` : ""}{updateResult.updated.length ? (updateResult.verified ? ", verified." : ", but the read-back differs. Check the classes in Bricks.") : "."}</p>}
      {updateResult.missing.length > 0 && <p className="text-warning break-words">Not on the site: {updateResult.missing.join(", ")}.</p>}
      {updateResult.error && <p className="text-warning break-words">{updateResult.error}</p>}
      {!undone && updateResult.previous.length > 0 && <button className={button} disabled={busy} onClick={undoUpdate}>{busy ? "Working…" : "Undo the update"}</button>}
    </div>}
    {classesOpen && <div className="rounded-lg border border-border bg-subtle p-3 space-y-2">
      <p className="text-sm break-words">{newClasses.length > 0
        ? `This change uses global classes that may not exist on the site yet: ${newClasses.join(", ")}.`
        : "The site lacks global classes this change uses."} Missing classes are created from the change&apos;s definitions in one step. Existing classes are never changed.</p>
      <button className={button} disabled={busy} onClick={createClasses}>{busy ? "Working…" : "Create missing global classes"}</button>
    </div>}
    {error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger break-words">{error}</p>}
  </section>;
}
