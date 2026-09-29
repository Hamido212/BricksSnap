"use client";

import { useState, useCallback } from "react";
import { syntaxHighlight } from "@/lib/json-highlight";
import { buildBricksImportJson, TemplateType } from "@/lib/bricks-export";
import type { BricksTemplate } from "@/lib/bricks-engine";
import { copyToClipboard } from "@/lib/clipboard";

interface JsonPreviewProps {
  data: BricksTemplate;
  maxHeight?: string;
  templateName?: string;
  initialType?: TemplateType;
}

export default function JsonPreview({ data, maxHeight = "500px", templateName = "BricksSnap Template", initialType = "section" }: JsonPreviewProps) {
  const [templateType, setTemplateType] = useState<TemplateType>(initialType);
  const [copyError, setCopyError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState("");
  const [viewMode, setViewMode] = useState<"formatted" | "compact">("formatted");

  const jsonString = JSON.stringify(data, null, viewMode === "compact" ? 0 : 2);
  const highlighted = syntaxHighlight(jsonString);

  const showCopied = useCallback((what: string) => {
    setCopied(true);
    setCopiedWhat(what);
    setTimeout(() => { setCopied(false); setCopiedWhat(""); }, 2500);
  }, []);

  // RECOMMENDED: Download as Bricks-compatible template JSON for import
  const downloadForBricks = useCallback(() => {
    const bricksJson = buildBricksImportJson(data, templateName, templateType);
    const blob = new Blob([JSON.stringify(bricksJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, templateName, templateType]);

  // Copy for Bricks paste (full object with source: bricksCopiedElements)
  const copyForBricks = useCallback(async () => {
    const bricksData = {
      ...data,
      source: "bricksCopiedElements",
    };
    try { await copyToClipboard(JSON.stringify(bricksData)); setCopyError(""); showCopied("Bricks JSON"); } catch { setCopyError("Clipboard unavailable. Download the JSON file instead."); }
  }, [data, showCopied]);

  // Copy full formatted JSON (for debugging/inspection)
  const copyFullJson = useCallback(async () => {
    const bricksData = {
      ...data,
      source: "bricksCopiedElements",
    };
    try { await copyToClipboard(JSON.stringify(bricksData, null, 2)); setCopyError(""); showCopied("Full JSON"); } catch { setCopyError("Clipboard unavailable. Download the JSON file instead."); }
  }, [data, showCopied]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted">bricks-template.json</span>
          <div className="flex rounded-lg border border-border bg-subtle p-0.5" role="group" aria-label="JSON view">
            {(["formatted", "compact"] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}
                className={`h-7 rounded-md px-3 text-xs transition-colors ${viewMode === mode ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(28,25,23,.08)]" : "text-muted hover:text-foreground"}`}>
                {mode === "formatted" ? "Formatted" : "Compact"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="template-type" className="text-xs text-text">Import as</label>
          <select id="template-type" value={templateType} onChange={e => setTemplateType(e.target.value as TemplateType)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm">
            <option value="section">Section</option><option value="content">Full page / Content</option><option value="header">Header</option><option value="footer">Footer</option>
          </select>
          <button onClick={downloadForBricks} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">Download for Bricks import</button>
          <button onClick={copyForBricks} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium hover:border-border-hover hover:bg-subtle">Copy for Bricks (Ctrl+V)</button>
          <button onClick={copyFullJson} className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-text hover:bg-subtle">Copy formatted</button>
          <span role="status" className="text-xs font-medium text-success">{copied ? `${copiedWhat} copied.` : ""}</span>
          {copyError && <p role="alert" className="text-xs text-danger">{copyError}</p>}
        </div>
      </div>

      {/* Code */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <pre className="p-4 font-mono text-[13px] leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[11px] text-muted">
        <span>
          {((data as { content?: unknown[] })?.content || []).length} elements
        </span>
        <span>{(jsonString.length / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}
