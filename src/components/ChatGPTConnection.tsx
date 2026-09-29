"use client";
import { useState } from "react";
type Model = { model: string; displayName: string; isDefault: boolean };
export default function ChatGPTConnection({ enabled, setEnabled, model, setModel }: { enabled: boolean; setEnabled: (value: boolean) => void; model: string; setModel: (value: string) => void }) {
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  async function action(action: "status" | "login" | "logout") {
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/codex", { method: "POST", headers: { "Content-Type": "application/json", "X-BricksSnap-Local": "1" }, body: JSON.stringify({ action }), signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ChatGPT connection failed.");
      if (data.authUrl) { setAuthUrl(data.authUrl); setStatus("Open the sign-in page, finish with OpenAI, then check the connection here."); }
      else {
        setConnected(data.connected === true);
        if (data.connected) {
          setAuthUrl(""); setModels(data.models || []);
          if (!model || !data.models?.some((m: Model) => m.model === model)) setModel(data.models?.find((m: Model) => m.isDefault)?.model || data.models?.[0]?.model || "");
          setStatus(`ChatGPT connected${data.plan ? ` · ${data.plan}` : ""}. Uses your Codex account limits.`);
        } else { setEnabled(false); setStatus("Not signed in to BricksSnap's local ChatGPT connection."); }
      }
    } catch (error) { setStatus(error instanceof Error ? error.message : "Connection failed."); }
    finally { setBusy(false); }
  }
  return <section className="mb-6 space-y-3 rounded-xl border border-border p-4">
    <h3 className="font-semibold text-sm">ChatGPT account · local</h3>
    <p className="text-xs text-muted leading-relaxed">Sign in with ChatGPT through the official Codex CLI. No API key needed. Start BricksSnap with <code>npm run dev:local</code>. Sign-in is stored separately on this computer and uses your account’s Codex limits.</p>
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => action("login")} className="h-8 rounded-lg bg-foreground px-3 text-xs font-medium text-white disabled:opacity-50">Sign in with ChatGPT</button>
      <button disabled={busy} onClick={() => action("status")} className="h-8 rounded-lg border border-border px-3 text-xs hover:bg-subtle">Check ChatGPT connection</button>
      {connected && <button disabled={busy} onClick={() => action("logout")} className="h-8 rounded-lg border border-border px-3 text-xs hover:bg-subtle">Disconnect ChatGPT</button>}
    </div>
    {authUrl && <a href={authUrl} target="_blank" rel="noreferrer" className="block text-sm text-primary underline">Open OpenAI sign-in</a>}
    {status && <p role="status" className="text-xs leading-relaxed">{status}</p>}
    {models.length > 0 && <label className="block text-xs">ChatGPT model<select value={model} onChange={e => setModel(e.target.value)} className="block w-full mt-1 p-2 rounded-lg bg-card border border-border">{models.map(m => <option key={m.model} value={m.model}>{m.displayName}</option>)}</select></label>}
    <label className="flex gap-2 items-center text-xs"><input type="checkbox" checked={enabled} disabled={!connected && !enabled} onChange={e => setEnabled(e.target.checked)} />Use ChatGPT account for AI generation</label>
    <p className="text-xs text-muted">Text prompts only. This selection applies immediately to the current page. The API provider below is used when this option is off.</p>
  </section>;
}
