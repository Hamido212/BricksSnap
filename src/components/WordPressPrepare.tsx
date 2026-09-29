"use client";

import { useState } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import type { WordPressClassesResult, WordPressCredentials, WordPressMediaResult } from "@/lib/wordpress-contract";
import { findExternalImages } from "@/lib/template-images";
import { referencedClassIds } from "@/lib/template-classes";
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
  const createClasses = () => run<WordPressClassesResult>("classes", result => {
    setClassResult(result);
    if (result.created.length || result.reused.length) onProposalChange(result.template);
  });

  if (!externalImages.length && !classesOpen && !mediaResult && !classResult && !error) return null;
  return <section className="rounded-xl border border-border bg-card p-5 space-y-3" aria-labelledby="wp-prepare-title">
    <h3 id="wp-prepare-title" className="font-medium">Before saving to {siteHost}</h3>
    {mediaResult && <div role="status" className="rounded-lg border border-border bg-background p-3 text-xs space-y-1">
      <p>Media library: {mediaResult.imported.filter(i => !i.reused).length} images imported, {mediaResult.imported.filter(i => i.reused).length} reused from earlier imports.</p>
      {mediaResult.skipped.map(s => <p key={s.source} className="text-amber-300 break-words">Not imported: {s.source} — {s.reason}</p>)}
    </div>}
    {externalImages.length > 0 && <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <p className="text-sm">This change uses {externalImages.length} external {externalImages.length === 1 ? "image" : "images"} ({imageHosts.join(", ")}). Some host firewalls block saving such URLs, and the page would depend on another server.</p>
      <button className={button} disabled={busy} onClick={importImages}>{busy ? "Working…" : `Import ${externalImages.length === 1 ? "image" : `${externalImages.length} images`} into the media library`}</button>
    </div>}
    {classResult && <div role="status" className="rounded-lg border border-border bg-background p-3 text-xs space-y-1">
      <p>Global classes: {classResult.created.length} created{classResult.created.length ? ` (${classResult.created.map(c => c.name).join(", ")})` : ""}, {classResult.reused.length} identical site {classResult.reused.length === 1 ? "class" : "classes"} reused.</p>
      {classResult.conflicts.map(c => <p key={c.id} className="text-amber-300 break-words">Not created: {c.name} {c.siteId ? "exists on the site with a different definition. Rename it in the staged JSON, or use the site's class." : "is defined twice in the change."}</p>)}
      {classResult.undefinedIds.length > 0 && <p className="text-amber-300 break-words">No definition in the change for class IDs {classResult.undefinedIds.join(", ")}. Remove them from the elements or add their definitions.</p>}
    </div>}
    {classesOpen && <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <p className="text-sm break-words">{newClasses.length > 0
        ? `This change uses global classes that may not exist on the site yet: ${newClasses.join(", ")}.`
        : "The site lacks global classes this change uses."} Missing classes are created from the change&apos;s definitions in one step. Existing classes are never changed.</p>
      <button className={button} disabled={busy} onClick={createClasses}>{busy ? "Working…" : "Create missing global classes"}</button>
    </div>}
    {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-400 break-words">{error}</p>}
  </section>;
}
