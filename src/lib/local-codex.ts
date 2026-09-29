import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { mkdir } from "node:fs/promises";
import { join, win32 } from "node:path";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { EventEmitter } from "node:events";
import { RequestError } from "./api-request";
import { BRICKS_SYSTEM_PROMPT } from "./bricks-prompt";

type Message = { id?: number; method?: string; params?: Record<string, unknown>; result?: unknown; error?: unknown };
type Account = { account: { type: string; planType?: string } | null };
type Model = { id: string; model: string; displayName: string; isDefault: boolean };

/** This bridge is only for a single user's loopback-bound installation. */
export function assertLocalCodex(request: Request) {
  if (process.env.BRICKSSNAP_LOCAL_CODEX !== "true") throw new RequestError("ChatGPT sign-in is available in local mode. Start with npm run dev:local.", 403);
  const host = request.headers.get("host") || new URL(request.url).host;
  const forwarded = request.headers.get("x-forwarded-for");
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) || (forwarded && !forwarded.split(",").every(ip => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip.trim())))) throw new RequestError("ChatGPT account access is restricted to this computer.", 403);
  const origin = request.headers.get("origin");
  if (origin && origin !== `http://${host}`) throw new RequestError("Cross-origin account access is not allowed.", 403);
  if (request.headers.get("x-brickssnap-local") !== "1") throw new RequestError("Local client header required.", 403);
}

/**
 * How to start the Codex CLI without a shell. On Windows, npm installs `codex` as a `codex.cmd` shim,
 * which Node cannot spawn without a shell; run the package's script with this Node binary instead.
 */
export function codexCommand(env: Record<string, string | undefined> = process.env, platform: NodeJS.Platform = process.platform, exists: (path: string) => boolean = existsSync): { command: string; args: string[] } {
  const configured = env.BRICKSSNAP_CODEX_BIN;
  if (platform !== "win32") return { command: configured || "codex", args: [] };
  const npmScript = (dir: string) => win32.join(dir, "node_modules", "@openai", "codex", "bin", "codex.js");
  if (configured) {
    if (!/\.(cmd|bat)$/i.test(configured)) return { command: configured, args: [] };
    const script = npmScript(win32.dirname(configured));
    return exists(script) ? { command: process.execPath, args: [script] } : { command: configured, args: [] };
  }
  for (const dir of (env.PATH ?? env.Path ?? "").split(";").map(d => d.trim()).filter(Boolean)) {
    if (exists(win32.join(dir, "codex.exe"))) return { command: win32.join(dir, "codex.exe"), args: [] };
    if (exists(win32.join(dir, "codex.cmd")) && exists(npmScript(dir))) return { command: process.execPath, args: [npmScript(dir)] };
  }
  return { command: "codex", args: [] };
}

class CodexBridge {
  child?: ChildProcessWithoutNullStreams;
  ready?: Promise<void>;
  sequence = 0;
  pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  events = new EventEmitter();
  busy = false;
  idle?: ReturnType<typeof setTimeout>;
  workspace = "";
  /** Why the last start failed, for a message that says what to do. */
  failure = "";

  async start() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      // Separate auth/config home: never read or copy the user's Codex tokens.
      const root = join(process.env.LOCALAPPDATA || join(homedir(), ".local", "share"), "BricksSnap", "codex");
      this.workspace = join(root, "workspace");
      await mkdir(this.workspace, { recursive: true });
      const env: NodeJS.ProcessEnv = { CODEX_HOME: root, NODE_ENV: "production" };
      for (const key of ["PATH", "Path", "PATHEXT", "SYSTEMROOT", "SystemRoot", "WINDIR", "TEMP", "TMP", "HOME", "USERPROFILE", "LOCALAPPDATA", "APPDATA"]) if (process.env[key]) env[key] = process.env[key];
      const disabled = ["shell_tool", "unified_exec", "apply_patch_freeform", "apps", "connectors", "plugins", "hooks", "codex_hooks", "plugin_hooks", "multi_agent", "collab", "code_mode", "js_repl", "browser_use", "computer_use", "image_generation", "view_image", "memories", "memory_tool", "skill_search"];
      const args = ["app-server", "--stdio", "-c", 'web_search="disabled"', "-c", 'sandbox_mode="read-only"', "-c", 'approval_policy="never"', ...disabled.flatMap(f => ["-c", `features.${f}=false`])];
      // The CLI is installed on the local host; it must never be bundled into a deployment.
      const codex = codexCommand();
      this.failure = "";
      this.child = spawn(/* turbopackIgnore: true */ codex.command, [...codex.args, ...args], { env, cwd: this.workspace, windowsHide: true, shell: false, stdio: "pipe" });
      this.child.stderr.resume(); // Never echo subprocess output that could contain auth data.
      createInterface({ input: this.child.stdout }).on("line", line => {
        if (line.length > 4_000_000) { this.stop(); return; }
        try {
          const message = JSON.parse(line) as Message;
          if (message.method && message.id !== undefined) {
            // This template generator never grants tool, filesystem or permission requests.
            this.send({ id: message.id, error: { code: -32601, message: "Interactive tools are disabled in BricksSnap." } });
          } else if (message.id !== undefined) {
            const pending = this.pending.get(message.id);
            if (pending) { clearTimeout(pending.timer); this.pending.delete(message.id); if (message.error) pending.reject(new RequestError("Codex rejected the request. Check your account, model and available quota.", 502)); else pending.resolve(message.result); }
          } else if (message.method) this.events.emit(message.method, message.params);
        } catch { /* Ignore non-protocol diagnostics. */ }
      });
      this.child.on("error", (error: NodeJS.ErrnoException) => {
        this.failure = error.code === "ENOENT"
          ? "Codex CLI was not found. Install it with npm install -g @openai/codex, check with codex --version, then restart npm run dev:local."
          : `Codex CLI could not be started (${error.code ?? "error"}). Set BRICKSSNAP_CODEX_BIN to the full path of codex and restart npm run dev:local.`;
        this.stop();
      });
      this.child.on("exit", () => this.stop());
      await this.rpc("initialize", { clientInfo: { name: "brickssnap", title: "BricksSnap", version: "0.2.0" } });
      this.send({ method: "initialized", params: {} });
    })();
    try { await this.ready; } catch (error) { this.stop(); throw error; }
  }

  send(message: Message) { this.child?.stdin.write(JSON.stringify(message) + "\n"); }
  rpc<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    clearTimeout(this.idle);
    this.idle = setTimeout(() => { if (!this.busy) this.stop(); }, 15 * 60_000); this.idle.unref();
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new RequestError("Codex did not respond. Install/update Codex CLI and retry.", 504)); }, 25_000);
      this.pending.set(id, { resolve: value => resolve(value as T), reject, timer });
      this.send({ id, method, params });
    });
  }
  stop() {
    const child = this.child; this.child = undefined; this.ready = undefined;
    child?.removeAllListeners(); child?.kill(); clearTimeout(this.idle);
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new RequestError(this.failure || "Local Codex stopped. Ensure Codex CLI is installed and retry.", 503)); }
    this.pending.clear(); this.events.emit("bridgeStopped");
  }

  async status() {
    await this.start();
    const { account } = await this.rpc<Account>("account/read", { refreshToken: false });
    const connected = account?.type === "chatgpt";
    const models = connected ? (await this.rpc<{ data: Model[] }>("model/list", { limit: 100, includeHidden: false })).data.map(({ model, displayName, isDefault }) => ({ model, displayName, isDefault })) : [];
    return { connected, plan: connected ? account?.planType : undefined, models };
  }
  async login() {
    await this.start();
    const result = await this.rpc<{ authUrl: string }>("account/login/start", { type: "chatgpt" });
    const url = new URL(result.authUrl);
    if (url.protocol !== "https:" || !["auth.openai.com", "chatgpt.com"].includes(url.hostname)) throw new RequestError("Codex returned an unexpected login destination.", 502);
    return { authUrl: result.authUrl };
  }
  async logout() { await this.start(); await this.rpc("account/logout"); return { connected: false }; }

  async generate(prompt: string, model: string | undefined, signal: AbortSignal) {
    if (this.busy) throw new RequestError("A ChatGPT generation is already running.", 429);
    this.busy = true;
    let threadId: string | undefined;
    try {
      const status = await this.status();
      if (!status.connected) throw new RequestError("Sign in with ChatGPT in Settings first.");
      const selected = model || status.models.find(m => m.isDefault)?.model || status.models[0]?.model;
      if (!selected || !status.models.some(m => m.model === selected)) throw new RequestError("Choose an available ChatGPT model in Settings.");
      const thread = await this.rpc<{ thread: { id: string } }>("thread/start", { model: selected, modelProvider: "openai", cwd: this.workspace, sandbox: "read-only", approvalPolicy: "never", ephemeral: true, baseInstructions: BRICKS_SYSTEM_PROMPT + "\nOnly produce template JSON. Never use tools or read files.", developerInstructions: "Return the complete JSON in your final message. No tool calls." });
      threadId = thread.thread.id;
      const output = await new Promise<string>((resolve, reject) => {
        let text = "";
        const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); this.events.off("item/completed", item); this.events.off("turn/completed", complete); this.events.off("bridgeStopped", stopped); };
        const fail = (message: string) => { cleanup(); reject(new RequestError(message, 422)); };
        const abort = () => { this.stop(); fail("ChatGPT generation was cancelled."); };
        const stopped = () => fail("ChatGPT connection stopped. Retry the generation.");
        const item = (params: { threadId?: string; item?: { type: string; text?: string } }) => { if (params.threadId === threadId && params.item?.type === "agentMessage") text = params.item.text || text; };
        const complete = (params: { threadId?: string; turn?: { status: string } }) => { if (params.threadId !== threadId) return; cleanup(); if (params.turn?.status === "completed" && text) resolve(text); else reject(new RequestError("ChatGPT could not finish. Check your quota and retry with fewer sections.", 422)); };
        const timer = setTimeout(() => { this.stop(); fail("ChatGPT generation timed out. Try fewer sections."); }, 120_000);
        this.events.on("item/completed", item); this.events.on("turn/completed", complete); this.events.on("bridgeStopped", stopped);
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) { abort(); return; }
        this.rpc("turn/start", { threadId, input: [{ type: "text", text: prompt, text_elements: [] }] }).catch(() => fail("Could not start ChatGPT generation."));
      });
      try { const parsed = JSON.parse(output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); return { elements: Array.isArray(parsed) ? parsed : parsed.elements, model: selected }; }
      catch { throw new RequestError("ChatGPT returned invalid JSON. Retry with fewer sections.", 422); }
    } finally { this.busy = false; if (threadId && this.child) void this.rpc("thread/unsubscribe", { threadId }).catch(() => {}); }
  }
}

const globalBridge = globalThis as typeof globalThis & { bricksCodex?: CodexBridge };
export const localCodex = globalBridge.bricksCodex ??= new CodexBridge();
