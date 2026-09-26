"use client";

import { useState, useCallback } from "react";
import { syntaxHighlight } from "@/lib/json-highlight";
import { buildBricksImportJson, TemplateType } from "@/lib/bricks-export";
import type { BricksTemplate } from "@/lib/bricks-engine";

interface JsonPreviewProps {
  data: BricksTemplate;
  maxHeight?: string;
  templateName?: string;
  initialType?: TemplateType;
}

// Clipboard fallback for non-secure contexts (HTTP)
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback: create textarea, select, execCommand
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Clipboard unavailable");
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
      {/* Toolbar */}
      <div className="flex flex-col border-b border-border bg-[#111113]">
        {/* Top: file info + view toggle */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-xs text-muted ml-3 font-mono">bricks-template.json</span>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["formatted", "compact"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground hover:bg-card-hover"
                }`}
              >
                {mode === "formatted" ? "Formatted" : "Compact"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs">
          <label htmlFor="template-type">Import as</label>
          <select id="template-type" value={templateType} onChange={e => setTemplateType(e.target.value as TemplateType)} className="bg-background border border-border rounded p-2">
            <option value="section">Section</option><option value="content">Full page / Content</option><option value="header">Header</option><option value="footer">Footer</option>
          </select>
          {copyError && <p role="alert">{copyError}</p>}
        </div>
        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-border/50">
          {/* PRIMARY: Download for Bricks Import */}
          <button
            onClick={downloadForBricks}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-success hover:bg-success/90 text-white transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download for Bricks Import
          </button>

          {/* Copy for Bricks paste */}
          <button
            onClick={copyForBricks}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy for Bricks (Ctrl+V)
          </button>

          {/* Copy full */}
          <button
            onClick={copyFullJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-card-hover text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Full
          </button>

          {/* Copied indicator */}
          {copied && (
            <span className="flex items-center gap-1.5 text-xs text-success font-medium animate-fade-in">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {copiedWhat} copied!
            </span>
          )}
        </div>
      </div>

      {/* Code */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-[#111113] text-xs text-muted">
        <span>
          {((data as { content?: unknown[] })?.content || []).length} elements
        </span>
        <span>{(jsonString.length / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}
