"use client";
import { useState } from "react";
import { importTemplate } from "@/lib/template-import";
import type { BricksTemplate } from "@/lib/bricks-engine";

export default function ConnectionGuide({ onImport, disabled }: { onImport: (template: BricksTemplate, warnings: string[]) => void; disabled: boolean }) {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  function importJson(text: string) {
    try {
      if (text.length > 2_000_000) throw new Error("Use a JSON file smaller than 2 MB.");
      const result = importTemplate(JSON.parse(text));
      onImport(result.template, result.warnings); setError(""); setJson("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not import JSON."); }
  }
  return <details className="mt-5 p-4 rounded-xl border border-border bg-card text-sm">
    <summary className="cursor-pointer font-semibold">Getting started · ChatGPT & import</summary>
    <div className="mt-4 space-y-5 text-muted leading-relaxed">
      <ol className="list-decimal pl-5 space-y-1"><li>Try a built-in template without an API key.</li><li>For AI generation, open Settings, select a provider, enter your API key and test the connection. Then enable AI mode.</li><li>Choose the export type and download JSON. In WordPress, go to Bricks → Templates → Import templates. Review responsive layouts, links, forms and images before publishing.</li></ol>
      <div><h3 className="font-semibold text-foreground">Use your ChatGPT subscription</h3>
        <p>ChatGPT can design your template and use BricksSnap to validate it, without a separate OpenAI API call. Enable <code>BRICKSSNAP_MCP_ENABLED=true</code> on your BricksSnap server, restart it, and connect its <code>/api/mcp</code> endpoint in ChatGPT developer mode through a secure MCP tunnel or public HTTPS URL. Availability depends on your account and workspace.</p>
        <p>The endpoint only provides the template catalog, schema guidance and JSON validation. It does not access your API keys or WordPress site.</p>
        <a href="https://developers.openai.com/plugins/deploy/connect-chatgpt" target="_blank" rel="noreferrer" className="text-primary underline">Official ChatGPT connection instructions</a>
        <p className="mt-2">Example: “Use BricksSnap to design a responsive restaurant landing page. Get the schema, create native elements, validate them and give me the template as a JSON file.”</p>
      </div>
      <div><h3 className="font-semibold text-foreground">Import from ChatGPT or Bricks</h3>
        <p>Paste an element array or a template object. Global classes and component metadata are retained; missing dependencies are reported.</p>
        <label className="block mt-2">JSON file <input disabled={disabled} type="file" accept=".json,application/json" className="block mt-2 max-w-full" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return;
          if (file.size > 2_000_000) { setError("Use a JSON file smaller than 2 MB."); return; }
          try { importJson(await file.text()); } catch { setError("Could not read this file."); }
          e.target.value = "";
        }} /></label>
        <textarea aria-label="Bricks JSON to import" maxLength={2_000_000} value={json} onChange={e => setJson(e.target.value)} placeholder='{"content": [...]}' className="w-full mt-3 h-28 p-3 border border-border rounded-lg bg-background font-mono text-xs" />
        <button disabled={disabled || !json.trim()} onClick={() => importJson(json)} className="mt-2 px-4 py-2 border border-primary rounded-lg text-foreground disabled:opacity-50">Validate & import JSON</button>
        {error && <p role="alert" className="mt-2 text-red-300">{error}</p>}
      </div>
      <div><h3 className="font-semibold text-foreground">Bricks 2.4</h3><p>Bricks now has native AI Abilities, HTML/CSS conversion, component management and global data transfers. For direct site editing, configure the official integration in WordPress → Bricks → AI. BricksSnap remains a standalone template workspace. Its preview is a structure sketch; Bricks is the final rendering check.</p>
        <a href="https://academy.bricksbuilder.io/builder/features/ai-abilities-and-skills/" target="_blank" rel="noreferrer" className="text-primary underline">Bricks AI setup</a>
      </div>
    </div>
  </details>;
}
