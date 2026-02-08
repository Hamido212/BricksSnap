"use client";

import { useState, useCallback } from "react";

interface JsonPreviewProps {
  data: unknown;
  maxHeight?: string;
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
          // Remove the colon from the match for styling, we'll add it back
          return `<span class="${cls}">${match.slice(0, -1)}</span>:`;
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export default function JsonPreview({ data, maxHeight = "500px" }: JsonPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"formatted" | "raw" | "compact">("formatted");

  const jsonString = JSON.stringify(data, null, viewMode === "compact" ? 0 : 2);
  const highlighted = syntaxHighlight(jsonString);

  const copyToClipboard = useCallback(async () => {
    // For Bricks paste, we need just the content array
    const copyData = (data as { content?: unknown })?.content || data;
    await navigator.clipboard.writeText(JSON.stringify(copyData));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bricks-template.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const copyContentOnly = useCallback(async () => {
    const contentArray = (data as { content?: unknown })?.content || data;
    await navigator.clipboard.writeText(JSON.stringify(contentArray));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#111113]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs text-muted ml-3 font-mono">bricks-template.json</span>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["formatted", "raw", "compact"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground hover:bg-card-hover"
                }`}
              >
                {mode === "formatted" ? "Formatted" : mode === "raw" ? "Raw" : "Compact"}
              </button>
            ))}
          </div>

          {/* Copy for Bricks (content array only) */}
          <button
            onClick={copyContentOnly}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary-hover text-white transition-colors"
            title="Copy content array for Bricks Builder paste"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy for Bricks
              </>
            )}
          </button>

          {/* Copy full JSON */}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-card-hover text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Full JSON
          </button>

          {/* Download */}
          <button
            onClick={downloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-card-hover text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
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
