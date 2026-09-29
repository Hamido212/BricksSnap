"use client";

import { useState } from "react";
import type { BricksTemplate } from "@/lib/bricks-engine";
import type { WordPressCreateTemplateResult, WordPressCredentials } from "@/lib/wordpress-contract";
import { TEMPLATE_TYPES, type TemplateType } from "@/lib/template-conditions";
import { isMissingClassesError, postWordPress } from "@/lib/wordpress-request";

interface WordPressCreateTemplateProps {
  credentials: WordPressCredentials;
  proposal: BricksTemplate;
  /** The template exists on the site; load it as the new baseline. */
  onCreated: (templateId: number) => void;
  onMissingClasses?: () => void;
}

const control = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-2 focus:outline-primary";

/** Save the reviewed template as a new Bricks template (header, footer, section, …) on the connected site. */
export default function WordPressCreateTemplate({ credentials, proposal, onCreated, onMissingClasses }: WordPressCreateTemplateProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TemplateType>("section");
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<WordPressCreateTemplateResult | null>(null);
  const host = new URL(credentials.endpoint).host;

  async function create() {
    setBusy(true); setError(""); setCreated(null);
    try {
      const result = await postWordPress<WordPressCreateTemplateResult>({ action: "create-template", credentials, title: title.trim(), type, status: publish ? "publish" : "draft", template: proposal, confirm: true });
      setCreated(result); setPublish(false);
      onCreated(result.templateId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not create the template.";
      if (isMissingClassesError(message)) onMissingClasses?.();
      setError(message);
    } finally { setBusy(false); }
  }

  return <details className="rounded-xl border border-border bg-card p-5 group">
    <summary className="cursor-pointer font-medium">Save as a new Bricks template</summary>
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted">Creates a template on {host} with the {proposal.content.length} reviewed elements. Headers and footers apply where their conditions say, once published. Set conditions under Site templates after creating it.</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="text-xs text-muted space-y-1 min-w-0">Title
          <input className={control} value={title} maxLength={200} onChange={e => setTitle(e.target.value)} placeholder="e.g. Main header"/>
        </label>
        <label className="text-xs text-muted space-y-1 min-w-0">Type
          <select className={control} value={type} onChange={e => setType(e.target.value as TemplateType)}>{TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={publish} onChange={e => setPublish(e.target.checked)}/>Publish immediately. Otherwise the template is created as a draft and has no effect on the site.</label>
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40" disabled={busy || !title.trim()} onClick={create}>{busy ? "Creating…" : publish ? "Create and publish template" : "Create draft template"}</button>
      {created && <div role="status" className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm space-y-1">
        <p>Created template #{created.templateId} ({created.status}). It is now the baseline, so further changes apply to it.{created.editUrl && <> <a className="underline" href={created.editUrl} target="_blank" rel="noreferrer">Open in Bricks</a></>}</p>
        {created.warnings.map((w, i) => <p key={i} className="text-xs text-warning break-words">{w}</p>)}
      </div>}
      {error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger break-words">{error}</p>}
    </div>
  </details>;
}
