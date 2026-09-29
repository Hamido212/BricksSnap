"use client";

import { useState } from "react";
import type { BricksGlobalClass, BricksTemplate, DesignTokens } from "@/lib/bricks-engine";
import type {
  WordPressCredentials,
  WordPressPageSummary,
  WordPressSource,
  WordPressConnectResult,
  WordPressPageResult,
  WordPressDesignResult,
} from "@/lib/wordpress-contract";

interface WordPressConnectionProps {
  onImportBaseline: (template: BricksTemplate, source: WordPressSource) => void;
  onImportDesign?: (tokens: Partial<DesignTokens>, classes: BricksGlobalClass[], palettes: WordPressDesignResult["palettes"]) => void;
  /** Credentials of the verified connection (memory only), or null after disconnecting or a failed check. */
  onCredentials?: (credentials: WordPressCredentials | null) => void;
  currentSource: WordPressSource | null;
}

const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:outline-2 focus:outline-primary";
const buttonClass = "rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed";

export default function WordPressConnection({
  onImportBaseline,
  onImportDesign,
  onCredentials,
  currentSource,
}: WordPressConnectionProps) {
  const [open, setOpen] = useState(false);
  const [endpoint, setEndpoint] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [connected, setConnected] = useState(false);
  const [version, setVersion] = useState<string>("");
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState<WordPressPageSummary[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  function getCredentials(): WordPressCredentials {
    return {
      endpoint: endpoint.trim(),
      username: username.trim(),
      password: password.trim(),
    };
  }

  async function handleConnect() {
    setBusy(true);
    setError("");
    setStatus("Connecting to WordPress MCP endpoint...");
    try {
      const credentials = getCredentials();
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BricksSnap-Local": "1",
        },
        body: JSON.stringify({ action: "connect", credentials }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not connect to WordPress site.");

      const result = data as WordPressConnectResult;
      setConnected(true);
      onCredentials?.(credentials);
      setVersion(result.version || "unknown");
      setStatus(`Connected to Bricks ${result.version || "unknown"}${result.wordpressVersion ? ` on WordPress ${result.wordpressVersion}` : ""}. Abilities discovered.`);

      if (result.warnings?.length) {
        setStatus(`Connected with warnings: ${result.warnings.join("; ")}`);
      }

      // Automatically search for initial pages
      void handleSearch("", true);
    } catch (err) {
      setConnected(false);
      onCredentials?.(null);
      setError(err instanceof Error ? err.message : "Connection failed.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  // Right after connecting, the `connected` state in this closure is still false.
  async function handleSearch(query = search, justConnected = false) {
    if (!connected && !justConnected) return;
    setBusy(true);
    setError("");
    try {
      const credentials = getCredentials();
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BricksSnap-Local": "1",
        },
        body: JSON.stringify({ action: "search", credentials, search: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      const list = (data.pages || []) as WordPressPageSummary[];
      setPages(list);
      if (list.length > 0 && selectedPostId === null) {
        setSelectedPostId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadPage() {
    if (!selectedPostId || !connected) return;
    setBusy(true);
    setError("");
    setStatus(`Fetching page elements for post #${selectedPostId}...`);
    try {
      const credentials = getCredentials();
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BricksSnap-Local": "1",
        },
        body: JSON.stringify({ action: "page", credentials, postId: selectedPostId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read page elements.");

      const pageResult = data as WordPressPageResult;
      onImportBaseline(pageResult.template, pageResult.source);
      const classCount = pageResult.template.globalClasses?.length ?? 0;
      setStatus([`Imported ${pageResult.postTitle} (#${pageResult.postId}): ${pageResult.template.content.length} elements${classCount ? `, ${classCount} global classes` : ""}.`, ...(pageResult.warnings ?? [])].join(" "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load page.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadDesign() {
    if (!connected) return;
    setBusy(true);
    setError("");
    setStatus("Fetching design context from Bricks site...");
    try {
      const credentials = getCredentials();
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BricksSnap-Local": "1",
        },
        body: JSON.stringify({ action: "design", credentials }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read design context.");

      const designResult = data as WordPressDesignResult;
      if (onImportDesign) {
        onImportDesign(designResult.designTokens, designResult.globalClasses, designResult.palettes ?? []);
      }
      const colors = Object.keys(designResult.designTokens).length;
      setStatus(`Imported design context: ${designResult.globalClasses.length} global classes${colors ? `, ${colors} brand colors` : ""}. Review now checks staged classes against the site.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load design context.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-muted"}`} />
            <h3 className="font-semibold text-sm">Connect WordPress site · local MCP{connected && version ? ` · Bricks ${version}` : ""}</h3>
          </div>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Read page elements and site design directly through the official WordPress MCP Adapter. Start with <code>npm run dev:local</code>. Passwords remain only in this browser tab.
          </p>
        </div>
        <button
          className={buttonClass}
          onClick={() => setOpen(!open)}
        >
          {open ? "Hide connection setup" : connected ? "Change WordPress connection" : "Set up WordPress connection"}
        </button>
      </div>

      {currentSource && (
        <div className="rounded-lg border border-border bg-card p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-medium text-foreground">Active baseline source: </span>
            <span className="text-muted">{currentSource.endpoint}</span>
            <span className="mx-2 text-muted">·</span>
            <span className="font-mono text-primary">Post #{currentSource.postId}</span>
            {currentSource.postTitle && <span className="ml-1 text-muted">({currentSource.postTitle})</span>}
          </div>
          <div className="text-muted font-mono text-[11px]">
            Hash: {currentSource.pageHash} · {new Date(currentSource.fetchedAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {open && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] text-muted mb-1" htmlFor="wp-endpoint">
                MCP Endpoint
              </label>
              <input
                id="wp-endpoint"
                type="url"
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                placeholder="https://example.com/wp-json/mcp/server-name"
                className={inputClass}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1" htmlFor="wp-username">
                WordPress Username
              </label>
              <input
                id="wp-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className={inputClass}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1" htmlFor="wp-password">
                Application Password
              </label>
              <input
                id="wp-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className={inputClass}
                disabled={busy}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              disabled={busy || !endpoint.trim() || !username.trim() || !password.trim()}
              onClick={handleConnect}
            >
              {busy ? "Checking..." : connected ? "Reconnect" : "Check WordPress connection"}
            </button>
            {connected && (
              <>
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={handleLoadDesign}
                >
                  Import site design context
                </button>
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={() => {
                    setConnected(false);
                    onCredentials?.(null);
                    setStatus("Disconnected.");
                  }}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>

          {connected && (
            <div className="rounded-lg border border-border bg-subtle p-3 space-y-3">
              <h4 className="font-medium text-xs">Select a page or template to import into staging</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter pages..."
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs grow sm:max-w-xs"
                />
                <button className={buttonClass} onClick={() => handleSearch()} disabled={busy}>
                  Search
                </button>
                {pages.length > 0 && (
                  <select
                    value={selectedPostId ?? ""}
                    onChange={e => setSelectedPostId(Number(e.target.value))}
                    className="w-full min-w-0 rounded-lg border border-border bg-card px-2.5 py-1 text-xs sm:w-auto sm:grow sm:max-w-md"
                  >
                    {pages.map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.id} · {p.title} {p.type ? `(${p.type})` : ""}{p.locked ? " · open in builder" : ""}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
                  disabled={busy || !selectedPostId}
                  onClick={handleLoadPage}
                >
                  Load page into baseline
                </button>
              </div>
            </div>
          )}

          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          {status && <p role="status" className="text-xs text-muted">{status}</p>}
        </div>
      )}
    </div>
  );
}
