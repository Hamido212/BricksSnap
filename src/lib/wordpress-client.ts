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
    const result = await callAbility(session, "bricks/find-post", [{ names: ["search", "query", "s"], value: search.trim(), required: true }]);

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
        modified: typeof item.modified === "string" ? item.modified : typeof item.post_modified === "string" ? item.post_modified : undefined,
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

    // Not listed in Bricks' published ability references; read only when the site provides it.
    let settings: JsonRecord | undefined;
    try {
      const s = await callAbility(session, "bricks/get-page-settings", [postArg]);
      if (isRecord(s)) settings = s;
    } catch {
      // Optional settings read
    }

    let rawElements: unknown[] = [];
    let title: string | undefined;
    if (Array.isArray(elementsResult)) rawElements = elementsResult;
    else if (isRecord(elementsResult)) {
      if (Array.isArray(elementsResult.elements)) rawElements = elementsResult.elements;
      else if (Array.isArray(elementsResult.content)) rawElements = elementsResult.content;
      const t = elementsResult.title ?? elementsResult.postTitle;
      if (typeof t === "string" && t.trim()) title = t.trim();
    }

    const template = readStagingTemplate({ content: rawElements }, true);
    const pageHash = createHash("sha256").update(stableJson(template.content)).digest("hex").slice(0, 16);
    const fetchedAt = new Date().toISOString();
    const postTitle = title ?? `Page #${postId}`;
    const source: WordPressSource = { endpoint: credentials.endpoint, postId, postTitle, fetchedAt, pageHash };

    return { postId, postTitle, template, pageHash, fetchedAt, endpoint: credentials.endpoint, source, settings };
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

export async function getWordPressDesignContext(credentials: WordPressCredentials, signal: AbortSignal): Promise<WordPressDesignResult> {
  return withSession(credentials, signal, async session => {
    const result = await callAbility(session, "bricks/get-design-context");
    const fetchedAt = new Date().toISOString();

    const designTokens: Partial<DesignTokens> = {};
    const globalClasses: BricksGlobalClass[] = [];

    if (isRecord(result)) {
      for (const { name, value } of readColors(result)) {
        if (name.includes("primary") && !designTokens.primaryColor) designTokens.primaryColor = value;
        else if (name.includes("secondary") && !designTokens.secondaryColor) designTokens.secondaryColor = value;
        else if ((name.includes("background") || name.includes("base") || name.includes("light")) && !designTokens.backgroundColor) designTokens.backgroundColor = value;
        else if (name.includes("surface") || name.includes("card") || name.includes("muted")) designTokens.surfaceColor = value;
        else if (name.includes("text") || name.includes("body") || name.includes("dark")) designTokens.textColor = value;
      }

      if (Array.isArray(result.globalClasses)) {
        for (const cls of result.globalClasses) {
          if (isRecord(cls) && typeof cls.id === "string" && typeof cls.name === "string") {
            globalClasses.push({ id: cls.id, name: cls.name, settings: isRecord(cls.settings) ? cls.settings : {} });
          }
        }
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
