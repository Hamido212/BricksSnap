"use client";

import { useMemo, useRef, useState } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import { diffTemplates, mergeTemplates, readStagingTemplate } from "@/lib/template-staging";
import { generateMcpPage } from "@/lib/mcp-generation";
import JsonPreview from "./JsonPreview";
import StructurePreview from "./StructurePreview";

type Review = { before: BricksTemplate; template: BricksTemplate; diff: ReturnType<typeof diffTemplates>; warnings: string[] };
const control = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-2 focus:outline-primary";
const button = "rounded-lg border border-border px-3 py-2 text-sm hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed";

export default function StagingWorkspace({ generatedTemplate }: { generatedTemplate: BricksTemplate | null }) {
  const [baseline, setBaseline] = useState("");
  const [candidate, setCandidate] = useState("");
  const [mode, setMode] = useState<"append" | "prepend" | "after" | "compare">("append");
  const [afterId, setAfterId] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState("");
  // A slow file read must not overwrite a subsequent edit or show a stale review.
  const revision = useRef(0);
  const invalidate = () => { revision.current++; setReview(null); setError(""); };
  const edit = (side: "baseline" | "candidate", text: string) => {
    invalidate(); (side === "baseline" ? setBaseline : setCandidate)(text);
  };
  const loadFile = async (side: "baseline" | "candidate", file?: File) => {
    if (!file) return;
    invalidate(); const started = revision.current;
    try {
      if (file.size > 2_000_000) throw new Error("Choose a JSON file smaller than 2 MB.");
      const text = await file.text();
      if (started === revision.current) edit(side, text);
    } catch (e) { if (started === revision.current) setError(e instanceof Error ? e.message : "Could not read file."); }
  };
  const inspect = () => {
    invalidate();
    try {
      const before = readStagingTemplate(JSON.parse(baseline.trim() || "[]"), true);
      const addition = JSON.parse(candidate);
      if (mode === "compare") {
        const template = readStagingTemplate(addition, true);
        setReview({ before, template, diff: diffTemplates(before, template), warnings: ["Comparison can include removals. Export contains the full candidate, not only the differences.", "Structure comparison only. Check layout, dynamic data, links and forms in Bricks before publishing."] });
      } else {
        const merged = mergeTemplates(before, addition, mode === "after" ? { mode, afterId: afterId.trim() } : { mode });
        setReview({ before, ...merged });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not review templates."); }
  };
  const demo = () => {
    invalidate();
    const page = generateMcpPage({ prompt: "A modern studio website", sections: ["hero", "footer"] }).template;
    setBaseline(JSON.stringify(page, null, 2));
    setCandidate(JSON.stringify(generateMcpPage({ prompt: "A modern studio website", sections: ["features"] }).template, null, 2));
    setMode("after"); setAfterId(page.content.find(el => el.parent === 0)?.id ?? "");
  };
  const roots = useMemo(() => {
    try { return readStagingTemplate(JSON.parse(baseline.trim() || "[]"), true).content.filter(el => el.parent === 0).map(el => ({ id: el.id, label: el.label || el.name })); }
    catch { return []; } // Keep invalid drafts editable; report errors on Review.
  }, [baseline]);

  return <section className="space-y-6" aria-labelledby="staging-title">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-primary mb-2">Template staging</p>
        <h2 id="staging-title" className="text-3xl font-semibold tracking-tight">Build on what you already have.</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">Add a section to an existing Bricks export, or compare two versions. Review the structure and download the result. Templates stay in this browser tab until you export them.</p>
      </div>
      <button className={button} onClick={demo}>Load demo</button>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      {(["baseline", "candidate"] as const).map((side, i) => <div key={side} className="min-w-0 rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-medium">{i + 1}. {side === "baseline" ? "Existing page" : "New section or version"}</h3>
          {side === "candidate" && <button className={button} disabled={!generatedTemplate} onClick={() => edit(side, JSON.stringify(generatedTemplate, null, 2))}>Use generator result</button>}
        </div>
        <p className="text-xs text-muted">{side === "baseline" ? "Paste a Bricks JSON export. Leave empty to start a new page." : "Add a section, or supply a complete version when comparing."}</p>
        <label className="block text-xs text-muted" htmlFor={`staging-${side}-file`}>Import JSON file</label>
        <input id={`staging-${side}-file`} type="file" accept=".json,application/json" className="block w-full min-w-0 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-background file:px-3 file:py-2 file:text-foreground" onChange={e => { void loadFile(side, e.target.files?.[0]); e.target.value = ""; }} />
        <label className="sr-only" htmlFor={`staging-${side}`}>{side === "baseline" ? "Existing page JSON" : "Candidate JSON"}</label>
        <textarea id={`staging-${side}`} spellCheck={false} value={side === "baseline" ? baseline : candidate} onChange={e => edit(side, e.target.value)} maxLength={2_000_000} rows={7} className={`${control} resize-y font-mono text-xs`} placeholder={side === "baseline" ? "[]" : '{"content": [...]}'}/>
      </div>)}
    </div>
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border p-5">
      <div className="grow sm:grow-0"><label className="block text-xs text-muted mb-2" htmlFor="staging-mode">Operation</label>
        <select id="staging-mode" className={control} value={mode} onChange={e => { invalidate(); setMode(e.target.value as typeof mode); }}>
          <option value="append">Add at the end</option><option value="prepend">Add at the beginning</option><option value="after">Add after a section</option><option value="compare">Compare complete versions</option>
        </select>
      </div>
      {mode === "after" && <div className="grow sm:grow-0 min-w-0"><label className="block text-xs text-muted mb-2" htmlFor="staging-after">After section</label>
        <select id="staging-after" className={control} value={afterId} onChange={e => { invalidate(); setAfterId(e.target.value); }}><option value="">Choose a section</option>{roots.map(root => <option key={root.id} value={root.id}>{root.label} · {root.id}</option>)}</select>
      </div>}
      <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-40" disabled={!candidate.trim()} onClick={inspect}>Review changes</button>
      <p className="text-xs text-muted sm:ml-auto">No WordPress connection required</p>
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400 break-words">{error}</p>}
    {review && <div className="space-y-5" aria-live="polite">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-medium mb-4">3. Review changes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{Object.entries(review.diff.counts).map(([label, count]) => <div key={label} className="rounded-lg bg-background p-3"><p className="text-2xl font-semibold tabular-nums">{count}</p><p className="text-xs text-muted capitalize">{label}</p></div>)}</div>
        {review.diff.metadata.length > 0 && <p className="text-xs text-muted mt-4 break-words">Changed metadata: {review.diff.metadata.join(", ")}</p>}
        <details className="mt-4 text-sm"><summary className="cursor-pointer">Element changes ({review.diff.elements.length})</summary><ul className="mt-3 max-h-64 overflow-auto space-y-2">{review.diff.elements.map(el => <li key={el.id} className="break-words"><span className="font-mono text-xs text-muted">{el.id}</span> · {el.label} · <strong>{el.status}</strong>{el.fields.length > 0 && ` (${el.fields.join(", ")})`}</li>)}</ul></details>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="min-w-0 rounded-xl border border-border p-4"><h4 className="font-medium mb-3">Before · structure</h4><StructurePreview elements={review.before.content}/></div>
        <div className="min-w-0 rounded-xl border border-border p-4"><h4 className="font-medium mb-3">After · structure</h4><StructurePreview elements={review.template.content}/></div>
      </div>
      <ul className="rounded-xl border border-border p-5 space-y-2 text-xs text-muted">{review.warnings.map((warning, i) => <li className="break-words" key={i}>{warning}</li>)}</ul>
      <div className="min-w-0"><h3 className="font-medium mb-3">4. Export reviewed template</h3><JsonPreview data={review.template} templateName="BricksSnap Staged Page" initialType="content" maxHeight="320px"/></div>
    </div>}
  </section>;
}
