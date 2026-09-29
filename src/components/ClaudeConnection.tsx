"use client";

import { useState } from "react";

type Status = "unknown" | "checking" | "active" | "disabled" | "error";

/**
 * Claude with the user's own plan: Claude connects to BricksSnap over MCP. Anthropic does not permit
 * third-party apps to offer Claude.ai sign-in or to route requests through Free/Pro/Max credentials.
 */
export default function ClaudeConnection() {
  const [status, setStatus] = useState<Status>("unknown");
  const [copied, setCopied] = useState("");
  const endpoint = typeof window === "undefined" ? "/api/mcp" : `${window.location.origin}/api/mcp`;
  const isLocal = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  const snippets = {
    code: "claude mcp add brickssnap -- node /absolute/path/to/BricksSnap/dist/mcp-server.mjs",
    desktop: JSON.stringify({ mcpServers: { brickssnap: { command: "node", args: ["/absolute/path/to/BricksSnap/dist/mcp-server.mjs"] } } }, null, 2),
  };

  async function check() {
    setStatus("checking");
    try {
      const res = await fetch("/api/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }), signal: AbortSignal.timeout(15000) });
      setStatus(res.ok ? "active" : res.status === 404 ? "disabled" : "error");
    } catch { setStatus("error"); }
  }
  async function copy(key: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); } catch { setCopied(""); }
  }
  const copyButton = (key: string, text: string) => <button type="button" onClick={() => copy(key, text)} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-card-hover">{copied === key ? "Copied" : "Copy"}</button>;

  return <section className="mb-6 p-4 rounded-xl border border-border bg-background space-y-3" aria-labelledby="claude-connection-title">
    <h3 id="claude-connection-title" className="font-semibold text-sm">Claude · with your Claude plan (MCP)</h3>
    <p className="text-xs text-muted leading-relaxed">Anthropic does not allow third-party apps to offer a Claude sign-in. Instead, Claude connects to BricksSnap: add BricksSnap as an MCP server in Claude, then ask Claude to build sections with BricksSnap&apos;s tools. Claude runs in its own app on your plan. To use Claude inside BricksSnap, select Anthropic below and enter an API key.</p>

    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium">Claude Code (this computer)</p>{copyButton("code", snippets.code)}</div>
      <pre className="text-[11px] p-2 rounded-md bg-card border border-border overflow-x-auto"><code>{snippets.code}</code></pre>
      <p className="text-[11px] text-muted">Run <code>npm run build:mcp</code> in the BricksSnap folder first and use its absolute path.</p>
    </div>

    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium">Claude Desktop (this computer)</p>{copyButton("desktop", snippets.desktop)}</div>
      <pre className="text-[11px] p-2 rounded-md bg-card border border-border overflow-x-auto"><code>{snippets.desktop}</code></pre>
      <p className="text-[11px] text-muted">Add to <code>claude_desktop_config.json</code> (Settings → Developer → Edit config) and restart Claude Desktop.</p>
    </div>

    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium">claude.ai and the Claude apps (custom connector)</p>{copyButton("url", endpoint)}</div>
      <pre className="text-[11px] p-2 rounded-md bg-card border border-border overflow-x-auto"><code>{endpoint}</code></pre>
      <p className="text-[11px] text-muted leading-relaxed">In Claude: Customize → Connectors → + → Add custom connector, and enter this URL. Claude reaches the server from Anthropic&apos;s cloud, so it must be a public HTTPS deployment with <code>BRICKSSNAP_MCP_ENABLED=true</code>.{isLocal ? " A localhost address does not work here." : ""}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={check} disabled={status === "checking"} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-card-hover disabled:opacity-50">Check endpoint</button>
        <span role="status" className="text-[11px] text-muted">{{
          unknown: "",
          checking: "Checking…",
          active: "Active: the endpoint answers MCP requests.",
          disabled: "Disabled on this deployment. Set BRICKSSNAP_MCP_ENABLED=true and redeploy.",
          error: "Could not reach the endpoint.",
        }[status]}</span>
      </div>
    </div>
    <p className="text-[11px] text-muted leading-relaxed">Example: “Use BricksSnap to build a homepage for a vehicle registration service in Bremen in the Warm style with a green brand color, in German, and give me the Bricks JSON.”</p>
  </section>;
}
