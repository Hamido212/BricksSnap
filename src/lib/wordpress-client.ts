import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHash } from "node:crypto";
import { RequestError } from "./api-request";
import { wordpressFetch } from "./wordpress-http";
import {
  WP_READ_ABILITIES,
  type WordPressCredentials,
  type WordPressRequest,
  type WordPressConnectResult,
  type WordPressPageResult,
  type WordPressDesignResult,
  type WordPressPageSummary,
  type WordPressSource,
} from "./wordpress-contract";
import { readStagingTemplate, stableJson } from "./template-staging";
import type { BricksGlobalClass, DesignTokens } from "./bricks-engine";

type JsonRecord = Record<string, unknown>;
type InputSchema = { properties?: JsonRecord } | undefined;

/** One MCP connection plus the tool/ability input schemas learned during it. */
type Session = {
  client: Client;
  tools: Map<string, InputSchema>;
  abilitySchemas: Map<string, InputSchema>;
};

/** A semantic argument with the parameter names Bricks has used for it, preferred name first. */
type Argument = { names: string[]; value: unknown; required?: boolean };

// MCP Adapter registers abilities with "/" and exposes tools with "-" (McpNameSanitizer).
const DISPATCHERS = ["mcp-adapter-execute-ability", "mcp-adapter/execute-ability"];
const ABILITY_INFO = ["mcp-adapter-get-ability-info", "mcp-adapter/get-ability-info"];
const CRITICAL_ABILITIES = ["bricks/get-page-elements", "bricks/get-design-context"];

const isRecord = (value: unknown): value is JsonRecord => !!value && typeof value === "object" && !Array.isArray(value);

/** Connect a scoped MCP client using the hardened loopback-isolated transport. */
async function openSession(credentials: WordPressCredentials, signal: AbortSignal): Promise<Session> {
  const client = new Client({ name: "brickssnap", version: "0.4.0" }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL(credentials.endpoint), {
    fetch: wordpressFetch(credentials, signal),
  });
  await client.connect(transport);
  try {
    const tools = new Map<string, InputSchema>();
    let cursor: string | undefined;
    for (let page = 0; page < 10; page++) {
      const result = await client.listTools(cursor ? { cursor } : undefined);
      for (const tool of result.tools || []) tools.set(tool.name, tool.inputSchema as InputSchema);
      cursor = result.nextCursor;
      if (!cursor) break;
    }
    return { client, tools, abilitySchemas: new Map() };
  } catch (error) {
    await client.close().catch(() => {});
    throw error;
  }
}

async function withSession<T>(credentials: WordPressCredentials, signal: AbortSignal, run: (session: Session) => Promise<T>): Promise<T> {
  const session = await openSession(credentials, signal);
  try {
    return await run(session);
  } finally {
    await session.client.close().catch(() => {});
  }
}

const directTool = (session: Session, abilityName: string) =>
  [abilityName, abilityName.replace(/\//g, "-")].find(name => session.tools.has(name));

const firstTool = (session: Session, names: string[]) => names.find(name => session.tools.has(name));

/** Extract the ability payload from an MCP tool result, unwrapping the adapter's { success, data } envelope. */
function readToolPayload(toolResult: Awaited<ReturnType<Client["callTool"]>>, label: string): unknown {
  const content = toolResult.content as Array<{ type: string; text?: string }> | undefined;
  const text = content?.find(c => c.type === "text")?.text;
  if (toolResult.isError) throw new RequestError(text || `Error executing ${label}`, 502);

  let payload: unknown;
  if ("structuredContent" in toolResult && toolResult.structuredContent !== undefined) payload = toolResult.structuredContent;
  else if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }

  if (isRecord(payload) && typeof payload.success === "boolean") {
    if (!payload.success) {
      const error = payload.error;
      const message = typeof error === "string" ? error : isRecord(error) && typeof error.message === "string" ? error.message : `${label} failed.`;
      throw new RequestError(message, 502);
    }
    return payload.data !== undefined ? payload.data : payload;
  }
  return payload;
}

/**
 * Input schema of an ability. Direct tools publish it in tools/list; dispatcher-only abilities
 * publish it through mcp-adapter-get-ability-info. Unknown when neither is available.
 */
async function abilityInputSchema(session: Session, abilityName: string): Promise<InputSchema> {
  const direct = directTool(session, abilityName);
  if (direct) return session.tools.get(direct);
  if (session.abilitySchemas.has(abilityName)) return session.abilitySchemas.get(abilityName);

  let schema: InputSchema;
  const infoTool = firstTool(session, ABILITY_INFO);
  if (infoTool) {
    try {
      const info = readToolPayload(await session.client.callTool({ name: infoTool, arguments: { ability_name: abilityName } }), abilityName);
      const candidate = isRecord(info) ? info.input_schema ?? info.inputSchema : undefined;
      if (isRecord(candidate)) schema = candidate as InputSchema;
    } catch {
      // Schema lookup is advisory; execution reports the authoritative error.
    }
  }
  session.abilitySchemas.set(abilityName, schema);
  return schema;
}

/**
 * Send each argument under the one name the ability's schema declares, instead of guessing
 * several aliases that a strict schema (additionalProperties: false) would reject.
 */
export function pickArguments(schema: InputSchema, abilityName: string, args: Argument[]): JsonRecord {
  const properties = isRecord(schema?.properties) ? schema.properties : undefined;
  const picked: JsonRecord = {};
  for (const arg of args) {
    const name = properties ? arg.names.find(n => n in properties) : arg.names[0];
    if (name) picked[name] = arg.value;
    else if (arg.required) throw new RequestError(`The installed ${abilityName} ability does not accept a ${arg.names[0]} parameter. Check the Bricks version.`, 502);
  }
  return picked;
}

/** Execute a Bricks ability either through a direct tool or through mcp-adapter-execute-ability. */
async function callAbility(session: Session, abilityName: string, args: Argument[] = []): Promise<unknown> {
  const parameters = args.length ? pickArguments(await abilityInputSchema(session, abilityName), abilityName, args) : {};
  const direct = directTool(session, abilityName);
  if (direct) return readToolPayload(await session.client.callTool({ name: direct, arguments: parameters }), abilityName);

  const dispatcher = firstTool(session, DISPATCHERS);
  if (!dispatcher) throw new RequestError(`The ability "${abilityName}" is not available on this WordPress site. Check Bricks → AI → Abilities.`, 502);
  return readToolPayload(await session.client.callTool({ name: dispatcher, arguments: { ability_name: abilityName, parameters } }), abilityName);
}

/**
 * bricks/list-ability-status returns { abilities: [{ name, enabled, defaultEnabled, category }], total, enabled, disabled }.
 * Arrays and name→boolean maps are accepted for older builds. Returns undefined when no rows are recognizable.
 */
export function readAbilityStatus(result: unknown): Record<string, boolean> | undefined {
  const rows = Array.isArray(result) ? result : isRecord(result) && Array.isArray(result.abilities) ? result.abilities : undefined;
  const status: Record<string, boolean> = {};
  if (rows) {
    for (const row of rows) {
      if (isRecord(row) && typeof row.name === "string") status[row.name] = row.enabled !== false && row.status !== "disabled";
    }
  } else if (isRecord(result)) {
    for (const [key, value] of Object.entries(result)) {
      if (!key.includes("/")) continue;
      if (typeof value === "boolean") status[key] = value;
      else if (isRecord(value)) status[key] = value.enabled !== false;
    }
  }
  return Object.keys(status).length ? status : undefined;
}

/** bricks/get-mcp-version returns bricksVersion, wordpressVersion, abilitiesApiActive and related fields. */
export function readVersion(result: unknown): { version?: string; wordpressVersion?: string } {
  if (typeof result === "string") return { version: result };
  if (!isRecord(result)) return {};
  const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);
  return { version: text(result.bricksVersion) ?? text(result.version), wordpressVersion: text(result.wordpressVersion) };
}

export async function connectWordPress(credentials: WordPressCredentials, signal: AbortSignal): Promise<WordPressConnectResult> {
  return withSession(credentials, signal, async session => {
    const warnings: string[] = [];

    let versionInfo: ReturnType<typeof readVersion> = {};
    try {
      versionInfo = readVersion(await callAbility(session, "bricks/get-mcp-version"));
    } catch {
      warnings.push("Could not read the Bricks version (bricks/get-mcp-version).");
    }

    // The summary hides disabled rows unless exact abilityNames are requested.
    let status: Record<string, boolean> | undefined;
    try {
      status = readAbilityStatus(await callAbility(session, "bricks/list-ability-status", [{ names: ["abilityNames"], value: [...WP_READ_ABILITIES] }]));
    } catch {
      warnings.push("Could not read ability status (bricks/list-ability-status); availability is inferred from the tool list.");
    }

    const dispatcher = !!firstTool(session, DISPATCHERS);
    const abilities: Record<string, boolean> = {};
    for (const name of WP_READ_ABILITIES) abilities[name] = status ? status[name] === true : !!directTool(session, name) || dispatcher;

    const missingAbilities = CRITICAL_ABILITIES.filter(name => !abilities[name]);
    for (const name of missingAbilities) {
      warnings.push(status && name in status
        ? `Ability ${name} is disabled in Bricks → AI → Abilities.`
        : `Ability ${name} is not available. Check that Bricks abilities and the MCP Adapter are active.`);
    }

    return {
      connected: true,
      endpoint: credentials.endpoint,
      version: versionInfo.version ?? "unknown",
      wordpressVersion: versionInfo.wordpressVersion,
      abilities,
      missingAbilities,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  });
}

export async function searchWordPressPages(
  credentials: WordPressCredentials,
  search: string,
  signal: AbortSignal
): Promise<{ pages: WordPressPageSummary[] }> {
  return withSession(credentials, signal, async session => {
    const result = await callAbility(session, "bricks/find-post", [
      { names: ["query", "search", "s"], value: search.trim(), required: true },
      { names: ["bricksOnly"], value: true },
      { names: ["limit"], value: 50 },
    ]);

    const items = Array.isArray(result)
      ? result
      : isRecord(result) && Array.isArray(result.posts) ? result.posts
      : isRecord(result) && Array.isArray(result.results) ? result.results
      : [];

    const pages: WordPressPageSummary[] = [];
    for (const item of items) {
      if (!isRecord(item)) continue;
      const id = Number(item.id ?? item.ID ?? item.postId ?? item.post_id ?? 0);
      if (!id || id <= 0) continue;
      pages.push({
        id,
        title: String(item.title ?? item.post_title ?? item.name ?? `Page #${id}`),
        slug: typeof item.slug === "string" ? item.slug : typeof item.post_name === "string" ? item.post_name : undefined,
        type: typeof item.type === "string" ? item.type : typeof item.postType === "string" ? item.postType : typeof item.post_type === "string" ? item.post_type : undefined,
        modified: typeof item.modifiedGmt === "string" ? item.modifiedGmt : typeof item.modified === "string" ? item.modified : typeof item.post_modified === "string" ? item.post_modified : undefined,
        ...(typeof item.locked === "boolean" ? { locked: item.locked } : {}),
      });
    }
    return { pages };
  });
}

export async function getWordPressPage(
  credentials: WordPressCredentials,
  postId: number,
  signal: AbortSignal
): Promise<WordPressPageResult> {
  return withSession(credentials, signal, async session => {
    const postArg: Argument = { names: ["postId", "post_id", "id"], value: postId, required: true };
    const elementsResult = await callAbility(session, "bricks/get-page-elements", [postArg]);

    const fetchedAt = new Date().toISOString();

    // Returns { settings, postId }; PHP encodes empty settings as [].
    let settings: JsonRecord | undefined;
    try {
      const s = await callAbility(session, "bricks/get-page-settings", [postArg]);
      const value = isRecord(s) && "settings" in s ? s.settings : s;
      settings = isRecord(value) ? value : {};
    } catch {
      // Optional settings read
    }

    let rawElements: unknown[] = [];
    let title: string | undefined;
    let documentDigest: string | undefined;
    if (Array.isArray(elementsResult)) rawElements = elementsResult;
    else if (isRecord(elementsResult)) {
      if (Array.isArray(elementsResult.elements)) rawElements = elementsResult.elements;
      else if (Array.isArray(elementsResult.content)) rawElements = elementsResult.content;
      const t = elementsResult.title ?? elementsResult.postTitle;
      if (typeof t === "string" && t.trim()) title = t.trim();
      if (typeof elementsResult.documentDigest === "string") documentDigest = elementsResult.documentDigest;
    }

    // get-page-elements carries no title; find-post by ID does.
    if (!title) {
      try {
        const found = await callAbility(session, "bricks/find-post", [postArg]);
        const rows = isRecord(found) && Array.isArray(found.results) ? found.results : Array.isArray(found) ? found : [];
        const row = rows.find(r => isRecord(r) && Number(r.id) === postId);
        if (isRecord(row) && typeof row.title === "string" && row.title.trim()) title = row.title.trim();
      } catch {
        // Title is cosmetic
      }
    }

    const template = readStagingTemplate({ content: rawElements }, true);
    const pageHash = createHash("sha256").update(stableJson(template.content)).digest("hex").slice(0, 16);
    const postTitle = title ?? `Page #${postId}`;
    const source: WordPressSource = { endpoint: credentials.endpoint, postId, postTitle, fetchedAt, pageHash, ...(documentDigest ? { documentDigest } : {}) };

    return { postId, postTitle, template, pageHash, ...(documentDigest ? { documentDigest } : {}), fetchedAt, endpoint: credentials.endpoint, source, settings };
  });
}

/** Bricks 2.4 palette colors are { id, raw, light, dark }; older exports used { name, hex }. */
function readColors(context: JsonRecord): Array<{ name: string; value: string }> {
  const colors: Array<{ name: string; value: string }> = [];
  const add = (item: unknown) => {
    if (!isRecord(item)) return;
    const value = [item.hex, item.light, item.color, item.value].find(v => typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v)) as string | undefined;
    const name = [item.name, item.label, item.raw, item.id].find(v => typeof v === "string" && v) as string | undefined;
    if (value) colors.push({ name: (name || "").replace(/^var\(--|\)$/g, "").toLowerCase(), value });
  };
  for (const key of ["colorPalettes", "palettes", "colorPalette", "colors"]) {
    const list = context[key];
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (isRecord(entry) && Array.isArray(entry.colors)) entry.colors.forEach(add);
      else add(entry);
    }
  }
  return colors;
}

/** Read every page of a paginated Bricks list ability ({ items, hasMore }). */
async function listAll(session: Session, abilityName: string): Promise<unknown[]> {
  const items: unknown[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await callAbility(session, abilityName, [{ names: ["page"], value: page }, { names: ["perPage"], value: 100 }]);
    const rows = isRecord(result) && Array.isArray(result.items) ? result.items : Array.isArray(result) ? result : [];
    items.push(...rows);
    if (!isRecord(result) || result.hasMore !== true || !rows.length) break;
  }
  return items;
}

export async function getWordPressDesignContext(credentials: WordPressCredentials, signal: AbortSignal): Promise<WordPressDesignResult> {
  return withSession(credentials, signal, async session => {
    // The design context only summarizes palettes and classes (counts, hasSettings); values come from the list abilities.
    const result = await callAbility(session, "bricks/get-design-context");
    const fetchedAt = new Date().toISOString();
    const palettes = await listAll(session, "bricks/list-color-palettes").catch(() => []);
    const classes = await listAll(session, "bricks/list-global-classes").catch(() => []);

    const designTokens: Partial<DesignTokens> = {};
    for (const { name, value } of readColors({ colorPalettes: palettes })) {
      // Bricks' built-in palette (--bricks-color-light-blue, …) is not a brand system.
      if (name.startsWith("bricks-color-")) continue;
      const words = new Set(name.split(/[^a-z0-9]+/));
      const has = (...candidates: string[]) => candidates.some(word => words.has(word));
      if (has("primary") && !designTokens.primaryColor) designTokens.primaryColor = value;
      else if (has("secondary") && !designTokens.secondaryColor) designTokens.secondaryColor = value;
      else if (has("background", "bg", "base", "light") && !designTokens.backgroundColor) designTokens.backgroundColor = value;
      else if (has("surface", "card", "muted") && !designTokens.surfaceColor) designTokens.surfaceColor = value;
      else if (has("text", "body", "dark") && !designTokens.textColor) designTokens.textColor = value;
    }

    const globalClasses: BricksGlobalClass[] = [];
    for (const cls of classes) {
      if (isRecord(cls) && typeof cls.id === "string" && typeof cls.name === "string") {
        globalClasses.push({ id: cls.id, name: cls.name, settings: isRecord(cls.settings) ? cls.settings : {} });
      }
    }

    return { endpoint: credentials.endpoint, fetchedAt, designTokens, globalClasses, rawDesignContext: result };
  });
}

export async function handleWordPressRequest(
  request: WordPressRequest,
  signal: AbortSignal
): Promise<WordPressConnectResult | { pages: WordPressPageSummary[] } | WordPressPageResult | WordPressDesignResult> {
  switch (request.action) {
    case "connect":
      return connectWordPress(request.credentials, signal);
    case "search":
      return searchWordPressPages(request.credentials, request.search, signal);
    case "page":
      return getWordPressPage(request.credentials, request.postId, signal);
    case "design":
      return getWordPressDesignContext(request.credentials, signal);
  }
}
