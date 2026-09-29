"use client";

import { useState } from "react";
import type { WordPressConditionsResult, WordPressCredentials, WordPressTemplateSummary, WordPressTemplatesResult } from "@/lib/wordpress-contract";
import { conditionFields, describeCondition, fieldsToCondition, TEMPLATE_TYPES, type ConditionFields, type TemplateCondition, type TemplateType } from "@/lib/template-conditions";
import { postWordPress } from "@/lib/wordpress-request";
import { stableJson } from "@/lib/template-staging";

interface WordPressTemplatesProps {
  credentials: WordPressCredentials;
  /** Load a template's elements as the staging baseline. */
  onLoad: (templateId: number) => Promise<void>;
  /** The template currently loaded as baseline, if any. */
  currentId?: number;
}

type Editor = { template: WordPressTemplateSummary; loaded: TemplateCondition[]; unsupported: string[]; rows: ConditionFields[]; confirm: boolean };

const control = "w-full min-w-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-2 focus:outline-primary";
const small = "rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed";
const MAIN_LABELS: Record<ConditionFields["main"], string> = {
  any: "Entire website", frontpage: "Front page", postType: "Post types", archiveType: "Archives",
  search: "Search results", error: "404 error page", terms: "Terms", ids: "Specific posts",
};
const VALUE_HINTS: Partial<Record<ConditionFields["main"], string>> = {
  postType: "page, post (empty: all)", terms: "category::5, post_tag::12", ids: "7, 114", archiveType: "any, postType, author, date, term",
};
const emptyRow = (): ConditionFields => conditionFields({ main: "any" });

/** List the site's Bricks templates, load one into staging, and edit where it applies. */
export default function WordPressTemplates({ credentials, onLoad, currentId }: WordPressTemplatesProps) {
  const [type, setType] = useState<TemplateType | "">("");
  const [templates, setTemplates] = useState<WordPressTemplateSummary[] | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function run(task: () => Promise<void>) {
    setBusy(true); setError("");
    try { await task(); } catch (e) { setError(e instanceof Error ? e.message : "The request failed."); } finally { setBusy(false); }
  }
  const refresh = (filter = type) => run(async () => {
    const result = await postWordPress<WordPressTemplatesResult>({ action: "templates", credentials, ...(filter ? { type: filter } : {}) });
    setTemplates(result.templates);
  });
  const openConditions = (template: WordPressTemplateSummary) => run(async () => {
    setStatus("");
    const result = await postWordPress<WordPressConditionsResult>({ action: "template-conditions", credentials, templateId: template.id });
    setEditor({ template, loaded: result.conditions, unsupported: result.unsupported, rows: result.conditions.map(conditionFields), confirm: false });
  });
  const load = (template: WordPressTemplateSummary) => run(async () => {
    setStatus("");
    await onLoad(template.id);
    setStatus(`Loaded ${template.title} (#${template.id}) as the baseline. Add or compare a change, review it and apply it to the template.`);
  });

  let rowsError = "";
  let conditions: TemplateCondition[] = [];
  if (editor) {
    try { conditions = editor.rows.map(fieldsToCondition); } catch (e) { rowsError = e instanceof Error ? e.message : "Check the conditions."; }
  }
  const updateRow = (index: number, patch: Partial<ConditionFields>) => setEditor(current => current && { ...current, confirm: false, rows: current.rows.map((row, i) => (i === index ? { ...row, ...patch } : row)) });
  const save = () => run(async () => {
    if (!editor) return;
    const result = await postWordPress<WordPressConditionsResult>({ action: "set-conditions", credentials, templateId: editor.template.id, conditions, expectedConditions: editor.loaded, confirm: true });
    setEditor({ ...editor, loaded: result.conditions, rows: result.conditions.map(conditionFields), confirm: false });
    setTemplates(list => list?.map(t => (t.id === editor.template.id ? { ...t, conditionCount: result.conditions.length } : t)) ?? list);
    setStatus(`Saved ${result.conditions.length} ${result.conditions.length === 1 ? "condition" : "conditions"} for ${editor.template.title}.`);
  });
  const unchanged = editor ? stableJson(conditions) === stableJson(editor.loaded) : true;

  return <details className="rounded-xl border border-border bg-card p-4" onToggle={e => { if ((e.target as HTMLDetailsElement).open && !templates && !busy) void refresh(); }}>
    <summary className="cursor-pointer text-sm font-medium">Site templates · headers, footers and sections</summary>
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${control} sm:w-auto`} aria-label="Template type" value={type} onChange={e => { const next = e.target.value as TemplateType | ""; setType(next); setEditor(null); void refresh(next); }}>
          <option value="">All types</option>{TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className={small} disabled={busy} onClick={() => refresh()}>{busy ? "Loading…" : "Refresh"}</button>
      </div>
      {templates && !templates.length && <p className="text-xs text-muted">No {type || "Bricks"} templates on this site yet. Review a change and use “Save as a new Bricks template”.</p>}
      {templates && templates.length > 0 && <ul className="divide-y divide-border rounded-lg border border-border">
        {templates.map(t => <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 text-xs">
          <span className="min-w-0 grow break-words"><strong className="text-sm font-medium">{t.title}</strong> <span className="text-muted">#{t.id} · {t.type} · {t.status} · {t.conditionCount} {t.conditionCount === 1 ? "condition" : "conditions"}{t.id === currentId ? " · baseline" : ""}</span></span>
          <button className={small} disabled={busy} onClick={() => load(t)}>Load into baseline</button>
          <button className={small} disabled={busy} onClick={() => openConditions(t)}>Conditions</button>
        </li>)}
      </ul>}

      {editor && <section className="rounded-lg border border-border bg-background p-3 space-y-3" aria-label={`Conditions of ${editor.template.title}`}>
        <div>
          <h4 className="text-sm font-medium">Where “{editor.template.title}” applies</h4>
          <p className="text-xs text-muted mt-1">{editor.template.status === "publish" ? "Published: saved conditions take effect on the site immediately." : `Status ${editor.template.status}: conditions take effect once the template is published.`} Exclusions win over inclusions.</p>
        </div>
        {editor.unsupported.length > 0
          ? <p className="text-xs text-amber-300 break-words">These conditions use settings BricksSnap cannot edit ({editor.unsupported.join(", ")}). Edit them in Bricks.</p>
          : <>
            {!editor.rows.length && <p className="text-xs text-muted">No conditions: Bricks does not use this template anywhere yet.</p>}
            {editor.rows.map((row, i) => <div key={i} className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[10rem_1fr_auto]">
              <select className={control} aria-label={`Condition ${i + 1} type`} value={row.main} onChange={e => updateRow(i, { main: e.target.value as ConditionFields["main"], values: "" })}>
                {Object.entries(MAIN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <div className="space-y-2 min-w-0">
                {VALUE_HINTS[row.main] && <input className={control} aria-label={`Condition ${i + 1} values`} value={row.values} onChange={e => updateRow(i, { values: e.target.value })} placeholder={VALUE_HINTS[row.main]}/>}
                {row.main === "archiveType" && /postType/.test(row.values) && <input className={control} aria-label={`Condition ${i + 1} archive post types`} value={row.archivePostTypes} onChange={e => updateRow(i, { archivePostTypes: e.target.value })} placeholder="Archive post types: post, product"/>}
                {row.main === "archiveType" && /term/.test(row.values) && <input className={control} aria-label={`Condition ${i + 1} archive terms`} value={row.archiveTerms} onChange={e => updateRow(i, { archiveTerms: e.target.value })} placeholder="Archive terms: category::5, category::all"/>}
                {editor.template.type === "section" && <input className={control} aria-label={`Condition ${i + 1} hook`} value={row.hookName} onChange={e => updateRow(i, { hookName: e.target.value })} placeholder="Optional hook, e.g. bricks_before_footer"/>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.exclude} onChange={e => updateRow(i, { exclude: e.target.checked })}/>Exclude</label>
                  {(row.main === "ids" || (row.main === "archiveType" && /term/.test(row.values))) && <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.includeChildren} onChange={e => updateRow(i, { includeChildren: e.target.checked })}/>Include children</label>}
                </div>
              </div>
              <button className={small} aria-label={`Remove condition ${i + 1}`} onClick={() => setEditor(current => current && { ...current, confirm: false, rows: current.rows.filter((_, j) => j !== i) })}>Remove</button>
            </div>)}
            <button className={small} disabled={editor.rows.length >= 50} onClick={() => setEditor(current => current && { ...current, confirm: false, rows: [...current.rows, emptyRow()] })}>Add condition</button>
            {rowsError
              ? <p role="alert" className="text-xs text-red-400">{rowsError}</p>
              : conditions.length > 0 && <ul className="text-xs text-muted list-disc pl-5">{conditions.map((c, i) => <li key={i}>{describeCondition(c)}</li>)}</ul>}
            {!unchanged && !rowsError && <>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={editor.confirm} onChange={e => setEditor({ ...editor, confirm: e.target.checked })}/>Replace the conditions of {editor.template.title} (#{editor.template.id}) on the site.</label>
              <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-40" disabled={busy || !editor.confirm} onClick={save}>{busy ? "Saving…" : "Save conditions"}</button>
            </>}
          </>}
      </section>}
      {status && <p role="status" className="text-xs text-muted">{status}</p>}
      {error && <p role="alert" className="text-xs text-red-400 break-words">{error}</p>}
    </div>
  </details>;
}
