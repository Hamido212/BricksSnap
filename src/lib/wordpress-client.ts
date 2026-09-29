import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHash } from "node:crypto";
import { RequestError } from "./api-request";
import { wordpressFetch } from "./wordpress-http";
import {
  WP_READ_ABILITIES,
  WP_WRITE_ABILITIES,
  type WordPressApplyResult,
  type WordPressClassesResult,
  type WordPressConditionsResult,
  type WordPressCreateTemplateResult,
  type WordPressTemplatesResult,
  type WordPressMediaResult,
  type RenderedMarkup,
  type WordPressRenderResult,
  type WordPressRestoreResult,
  type WordPressCredentials,
  type WordPressRequest,
  type WordPressConnectResult,
  type WordPressPageResult,
  type WordPressDesignResult,
  type WordPressPageSummary,
  type WordPressSource,
} from "./wordpress-contract";
import { diffTemplates, readStagingTemplate, stableJson } from "./template-staging";
import type { BricksGlobalClass, BricksTemplate, DesignTokens } from "./bricks-engine";
import packageJson from "../../package.json";
import { downloadImage, findExternalImages, MAX_IMAGES, replaceImages, uploadName, type SiteImage } from "./wordpress-media";
import { planGlobalClasses, referencedClassIds, remapGlobalClasses } from "./template-classes";
import { readTemplateConditions, type TemplateCondition, type TemplateType } from "./template-conditions";

type JsonRecord = Record<string, unknown>;
type InputSchema = { properties?: JsonRecord } | undefined;

/** One MCP connection plus the tool/ability input schemas learned during it. */
type Session = {
  client: Client;
  transport: StreamableHTTPClientTransport;
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
  const client = new Client({ name: "brickssnap", version: packageJson.version }, { capabilities: {} });
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
    return { client, transport, tools, abilitySchemas: new Map() };
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
    // DELETE ends the adapter's HTTP session instead of leaving it to expire.
    await session.transport.terminateSession().catch(() => {});
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
export function readVersion(result: unknown): { version?: string; wordpressVersion?: string; abilitiesVersion?: string } {
  if (typeof result === "string") return { version: result };
  if (!isRecord(result)) return {};
  const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);
  const abilitiesVersion = text(result.bricksAbilitiesVersion);
  return { version: text(result.bricksVersion) ?? text(result.version), wordpressVersion: text(result.wordpressVersion), ...(abilitiesVersion ? { abilitiesVersion } : {}) };
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
      ...(versionInfo.abilitiesVersion ? { abilitiesVersion: versionInfo.abilitiesVersion } : {}),
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
    const postArg = postArgument(postId);
    const document = await readDocument(session, postId);
    const { template, documentDigest } = document;
    let title = document.title;

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

    const pageHash = shortHash(template);

    // Include the site's definitions of referenced global classes so staging can check class conflicts.
    const warnings: string[] = [];
    const referenced = new Set(template.content.flatMap(el => Array.isArray(el.settings._cssGlobalClasses) ? el.settings._cssGlobalClasses.filter((id): id is string => typeof id === "string") : []));
    if (referenced.size) {
      try {
        const classes = (await listAll(session, "bricks/list-global-classes")).filter(isRecord);
        template.globalClasses = classes.filter(c => typeof c.id === "string" && typeof c.name === "string" && referenced.has(c.id)).map(siteClass);
        const found = new Set(template.globalClasses.map(c => c.id));
        const missing = [...referenced].filter(id => !found.has(id));
        if (missing.length) warnings.push(`The page references global classes that do not exist on the site: ${missing.join(", ")}.`);
      } catch {
        warnings.push("Could not read the site's global classes (bricks/list-global-classes); class conflicts are not checked.");
      }
    }
    // Response shapes follow the abilities version; record it with the baseline.
    let versions: ReturnType<typeof readVersion> = {};
    try { versions = readVersion(await callAbility(session, "bricks/get-mcp-version")); } catch { /* optional */ }

    const postTitle = title ?? `Page #${postId}`;
    const source: WordPressSource = {
      endpoint: credentials.endpoint, postId, postTitle, fetchedAt, pageHash,
      ...(documentDigest ? { documentDigest } : {}),
      ...(versions.version ? { bricksVersion: versions.version } : {}),
      ...(versions.abilitiesVersion ? { abilitiesVersion: versions.abilitiesVersion } : {}),
    };

    return { postId, postTitle, template, pageHash, ...(documentDigest ? { documentDigest } : {}), fetchedAt, endpoint: credentials.endpoint, source, settings, ...(warnings.length ? { warnings } : {}) };
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

/** A global class as the site stores it, without the write-precondition fields list abilities add. */
function siteClass(cls: JsonRecord): BricksGlobalClass {
  const kept = Object.fromEntries(Object.entries(cls).filter(([key]) => !/(Ownership|Digest)$/.test(key)));
  return { ...kept, id: String(cls.id), name: String(cls.name), settings: isRecord(cls.settings) ? cls.settings : {} };
}

/** Read every page of a paginated Bricks list ability ({ items, hasMore }). */
async function listAll(session: Session, abilityName: string, filters: Argument[] = []): Promise<unknown[]> {
  const items: unknown[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await callAbility(session, abilityName, [...filters, { names: ["page"], value: page }, { names: ["perPage"], value: 100 }]);
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
      if (isRecord(cls) && typeof cls.id === "string" && typeof cls.name === "string") globalClasses.push(siteClass(cls));
    }

    const text = (value: unknown) => (typeof value === "string" ? value : undefined);
    const sitePalettes = (palettes as unknown[]).filter(isRecord).map((palette, p) => {
      const id = String(palette.id ?? "") || `palette-${p}`;
      return {
        id,
        name: text(palette.name) ?? "Palette",
        colors: (Array.isArray(palette.colors) ? palette.colors as unknown[] : []).filter(isRecord).map((color, c) => {
          // Older palettes store the value as `hex` instead of `light`.
          const light = text(color.light) ?? text(color.hex);
          return { id: String(color.id ?? "") || `${id}-${c}`, ...(text(color.raw) ? { raw: text(color.raw) } : {}), ...(light ? { light } : {}), ...(text(color.name) ? { name: text(color.name) } : {}) };
        }),
      };
    });
    return { endpoint: credentials.endpoint, fetchedAt, designTokens, globalClasses, palettes: sitePalettes, rawDesignContext: result };
  });
}

const postArgument = (postId: number): Argument => ({ names: ["postId", "post_id", "id"], value: postId, required: true });
const shortHash = (template: BricksTemplate) => createHash("sha256").update(stableJson(template.content)).digest("hex").slice(0, 16);

/** PHP's JSON encoder writes an empty associative array as []; Bricks stores empty settings that way. */
export function fromPhpElements(elements: unknown[]): unknown[] {
  return elements.map(el => isRecord(el) && Array.isArray(el.settings) && el.settings.length === 0 ? { ...el, settings: {} } : el);
}

/** Current element tree and Bricks' document digest of a page or template. */
async function readDocument(session: Session, postId: number): Promise<{ template: BricksTemplate; documentDigest?: string; title?: string }> {
  const result = await callAbility(session, "bricks/get-page-elements", [postArgument(postId)]);
  const record = isRecord(result) ? result : {};
  const elements = Array.isArray(result) ? result : Array.isArray(record.elements) ? record.elements : Array.isArray(record.content) ? record.content : [];
  const title = [record.title, record.postTitle].find(t => typeof t === "string" && t.trim()) as string | undefined;
  return {
    template: readStagingTemplate({ content: fromPhpElements(elements) }, true),
    ...(typeof record.documentDigest === "string" ? { documentDigest: record.documentDigest } : {}),
    ...(title ? { title: title.trim() } : {}),
  };
}

/** Writes must be enabled by the site administrator; never route around a disabled ability. */
async function requireWriteAbility(session: Session, ability: typeof WP_WRITE_ABILITIES[number]) {
  let status: Record<string, boolean> | undefined;
  try {
    status = readAbilityStatus(await callAbility(session, "bricks/list-ability-status", [{ names: ["abilityNames"], value: [...WP_WRITE_ABILITIES] }]));
  } catch {
    // Execution reports the authoritative error below.
  }
  if (status && status[ability] !== true) throw new RequestError(`Saving is disabled on this site. Enable ${ability} under Bricks → AI → Abilities.`, 403);
}

/** Bricks rejects a stale expectedDocumentDigest; surface that as a conflict rather than a gateway error. */
async function guardedWrite(session: Session, ability: string, args: Argument[]): Promise<unknown> {
  try {
    return await callAbility(session, ability, args);
  } catch (error) {
    if (error instanceof RequestError && /digest|conflict|stale|changed/i.test(error.message)) throw new RequestError(`WordPress refused the change because the page was modified: ${error.message}`, 409);
    throw error;
  }
}

const numberOrNull = (value: unknown) => (typeof value === "number" && Number.isInteger(value) ? value : null);

/** Absolute http(s) URLs in element settings that point to hosts other than the site. */
export function externalUrls(template: BricksTemplate, siteHost: string): string[] {
  const found = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      for (const match of value.matchAll(/https?:\/\/[^\s"'()<>]+/gi)) {
        try { if (new URL(match[0]).hostname !== siteHost) found.add(new URL(match[0]).origin); } catch { /* not a URL */ }
      }
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (isRecord(value)) Object.values(value).forEach(visit);
  };
  template.content.forEach(el => visit(el.settings));
  return [...found];
}

/** Email addresses in element settings (text, links, placeholders). */
export function emailAddresses(template: BricksTemplate): string[] {
  const found = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === "string") for (const match of value.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)) found.add(match[0]);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (isRecord(value)) Object.values(value).forEach(visit);
  };
  template.content.forEach(el => visit(el.settings));
  return [...found];
}

const sample = (values: string[]) => `${values.slice(0, 3).join(", ")}${values.length > 3 ? ", …" : ""}`;

/**
 * Observed live: a host firewall answered MCP requests carrying external URLs or email addresses with an
 * HTML error page. Name what in the request may have triggered it.
 */
function explainHostBlock(error: unknown, template: BricksTemplate, siteHost: string): unknown {
  if (!(error instanceof RequestError) || !error.message.startsWith("The web host answered")) return error;
  const urls = externalUrls(template, siteHost), emails = emailAddresses(template);
  if (!urls.length && !emails.length) return error;
  const parts = [...(urls.length ? [`external URLs (${sample(urls)})`] : []), ...(emails.length ? [`email addresses (${sample(emails)})`] : [])];
  const advice = [...(urls.length ? ["import the images into the media library first"] : []), ...(emails.length ? ["ask your host to allow requests to /wp-json/mcp/ or remove the addresses for now"] : [])].join("; ");
  return new RequestError(`${error.message} The change contains ${parts.join(" and ")}; some host firewalls block these. ${advice[0].toUpperCase()}${advice.slice(1)}, then retry.`, error.status);
}

export async function applyWordPressPage(
  credentials: WordPressCredentials,
  request: { postId: number; expectedDocumentDigest: string; template: unknown; allowLocked: boolean },
  signal: AbortSignal
): Promise<WordPressApplyResult> {
  const proposal = readStagingTemplate(request.template);
  const { postId, expectedDocumentDigest } = request;
  return withSession(credentials, signal, async session => {
    await requireWriteAbility(session, "bricks/set-page-elements");

    let title: string | undefined;
    try {
      const found = await callAbility(session, "bricks/find-post", [postArgument(postId)]);
      const row = (isRecord(found) && Array.isArray(found.results) ? found.results : []).find(r => isRecord(r) && Number(r.id) === postId);
      if (isRecord(row)) {
        if (typeof row.title === "string") title = row.title;
        if (row.locked === true && !request.allowLocked) throw new RequestError(`${title ?? `Post #${postId}`} is open in the Bricks builder. Saving there later would overwrite this change. Close the builder, or confirm applying anyway.`, 409);
      }
    } catch (error) {
      if (error instanceof RequestError && error.status === 409) throw error;
    }

    // Fail fast with a clear message; Bricks enforces the same digest atomically on write.
    const current = await readDocument(session, postId);
    if (!current.documentDigest) throw new RequestError("This Bricks version does not report a document digest; guarded writes are unavailable.", 422);
    if (current.documentDigest !== expectedDocumentDigest) throw new RequestError("The page changed since it was loaded. Load it into the baseline again and review the change.", 409);

    // set-page-elements saves elements only; class definitions must already exist on the site.
    const warnings: string[] = [];
    const referenced = new Set(referencedClassIds(proposal));
    if (referenced.size) {
      const site = new Map((await listAll(session, "bricks/list-global-classes")).filter(isRecord).map(c => [String(c.id), c]));
      const missing = [...referenced].filter(id => !site.has(id));
      if (missing.length) {
        const names = missing.map(id => proposal.globalClasses?.find(c => c.id === id)?.name ?? id);
        throw new RequestError(`The change uses global classes that do not exist on the site: ${names.join(", ")}. Create the missing global classes first, or remove them from the section.`, 422);
      }
      for (const cls of proposal.globalClasses ?? []) {
        const existing = site.get(cls.id);
        if (referenced.has(cls.id) && existing && stableJson(isRecord(existing.settings) ? existing.settings : {}) !== stableJson(cls.settings ?? {})) warnings.push(`Global class ${cls.name} keeps the site's definition; staged settings for it are not saved.`);
      }
    }

    let written: unknown;
    try {
      written = await guardedWrite(session, "bricks/set-page-elements", [
        postArgument(postId),
        { names: ["elements"], value: proposal.content, required: true },
        { names: ["expectedDocumentDigest"], value: expectedDocumentDigest, required: true },
      ]);
    } catch (error) {
      throw explainHostBlock(error, proposal, new URL(credentials.endpoint).hostname);
    }
    const saved = isRecord(written) ? written : {};

    const after = await readDocument(session, postId);
    const diff = diffTemplates({ content: proposal.content }, { content: after.template.content });
    // Name changed setting keys (e.g. settings._cssCustom) so normalization by Bricks is reviewable.
    const proposed = new Map(proposal.content.map(el => [el.id, el]));
    const settingKeys = new Set<string>();
    for (const el of after.template.content) {
      const sent = proposed.get(el.id);
      if (!sent) continue;
      for (const key of new Set([...Object.keys(sent.settings), ...Object.keys(el.settings)])) if (stableJson(sent.settings[key]) !== stableJson(el.settings[key])) settingKeys.add(`settings.${key}`);
    }
    const fields = [...new Set([...diff.elements.flatMap(e => e.fields).filter(f => f !== "settings"), ...settingKeys])];
    if (typeof saved.documentDigest === "string" && after.documentDigest && saved.documentDigest !== after.documentDigest) warnings.push("The page changed again right after saving. Reload it before further changes.");
    const documentDigest = after.documentDigest ?? (typeof saved.documentDigest === "string" ? saved.documentDigest : "");
    const template = { ...after.template, globalClasses: (proposal.globalClasses ?? []).filter(c => referenced.has(c.id)) };
    const fetchedAt = new Date().toISOString();

    return {
      postId,
      applied: saved.changed !== false,
      revisionId: numberOrNull(saved.revisionId),
      documentDigest,
      template,
      source: { endpoint: credentials.endpoint, postId, postTitle: title ?? current.title ?? `Page #${postId}`, fetchedAt, pageHash: shortHash(template), ...(documentDigest ? { documentDigest } : {}) },
      verification: { matches: diff.elements.length === 0, ...diff.counts, fields },
      ...(warnings.length ? { warnings } : {}),
    };
  });
}

/**
 * Copy the proposal's external images into the media library. BricksSnap downloads each file and uploads
 * it as base64, so the write carries no external URL. Earlier imports of the same URL are reused.
 */
export async function importWordPressMedia(
  credentials: WordPressCredentials,
  request: { template: unknown },
  signal: AbortSignal
): Promise<WordPressMediaResult> {
  const proposal = readStagingTemplate(request.template);
  const images = findExternalImages(proposal, new URL(credentials.endpoint).hostname);
  if (!images.length) return { template: proposal, imported: [], skipped: [] };
  if (images.length > MAX_IMAGES) throw new RequestError(`The change uses ${images.length} external images; import at most ${MAX_IMAGES} at once.`, 422);

  return withSession(credentials, signal, async session => {
    await requireWriteAbility(session, "bricks/upload-media");
    const media = new Map<string, SiteImage>();
    const imported: WordPressMediaResult["imported"] = [];
    const skipped: WordPressMediaResult["skipped"] = [];

    for (const image of images) {
      const base = uploadName(image.url, "").replace(/\.\w*$/, "");
      try {
        let existing: SiteImage | undefined;
        try {
          const found = await callAbility(session, "bricks/find-media", [
            { names: ["query"], value: base, required: true },
            { names: ["mimeType"], value: "image" },
            { names: ["detailLevel"], value: "compact" },
          ]);
          const row = (isRecord(found) && Array.isArray(found.results) ? found.results : []).find(r => isRecord(r) && typeof r.filename === "string" && r.filename.startsWith(base));
          if (isRecord(row) && typeof row.id === "number" && typeof row.url === "string") existing = { id: row.id, url: row.url, filename: String(row.filename) };
        } catch {
          // Lookup is an optimization; upload below.
        }
        if (existing) {
          media.set(image.url, existing);
          imported.push({ source: image.url, id: existing.id, url: existing.url, reused: true });
          continue;
        }

        const { data, contentType } = await downloadImage(image.url, signal);
        const filename = uploadName(image.url, contentType);
        const uploaded = await callAbility(session, "bricks/upload-media", [
          { names: ["base64"], value: data.toString("base64"), required: true },
          { names: ["filename"], value: filename, required: true },
          { names: ["title"], value: image.filename.replace(/\.\w+$/, "") || base },
          ...(image.alt ? [{ names: ["alt"], value: image.alt }] : []),
        ]);
        if (!isRecord(uploaded) || typeof uploaded.id !== "number" || typeof uploaded.url !== "string") throw new RequestError("WordPress did not return the uploaded file.", 502);
        const item = { id: uploaded.id, url: uploaded.url, filename: typeof uploaded.filename === "string" ? uploaded.filename : filename };
        media.set(image.url, item);
        imported.push({ source: image.url, ...item, reused: false });
      } catch (error) {
        skipped.push({ source: image.url, reason: error instanceof Error ? error.message : "Import failed." });
      }
    }
    return { template: replaceImages(proposal, media), imported: imported.map(({ source, id, url, reused }) => ({ source, id, url, reused })), skipped };
  });
}

/** The site's Bricks templates, optionally of one type. */
export async function listWordPressTemplates(credentials: WordPressCredentials, type: TemplateType | undefined, signal: AbortSignal): Promise<WordPressTemplatesResult> {
  return withSession(credentials, signal, async session => {
    const rows = await listAll(session, "bricks/list-templates", type ? [{ names: ["type"], value: type }] : []);
    const templates = rows.filter(isRecord).filter(row => Number.isInteger(row.id)).map(row => ({
      id: Number(row.id),
      title: typeof row.title === "string" && row.title.trim() ? row.title.trim() : `Template #${row.id}`,
      type: typeof row.type === "string" ? row.type : "unknown",
      status: typeof row.status === "string" ? row.status : "unknown",
      conditionCount: typeof row.conditionCount === "number" ? row.conditionCount : 0,
    }));
    return { templates };
  });
}

const templateArgument = (templateId: number): Argument => ({ names: ["templateId"], value: templateId, required: true });

async function readConditions(session: Session, templateId: number): Promise<WordPressConditionsResult> {
  const result = await callAbility(session, "bricks/get-template-settings", [templateArgument(templateId)]);
  // PHP encodes empty settings as [].
  const settings = isRecord(result) && "settings" in result ? result.settings : result;
  return { templateId, ...readTemplateConditions(settings) };
}

export async function getWordPressTemplateConditions(credentials: WordPressCredentials, templateId: number, signal: AbortSignal): Promise<WordPressConditionsResult> {
  return withSession(credentials, signal, session => readConditions(session, templateId));
}

/**
 * Replace a template's conditions. set-template-conditions has no concurrency guard, so the stored
 * conditions are re-read and must still equal the ones the user started from; the result is read back.
 */
export async function setWordPressTemplateConditions(
  credentials: WordPressCredentials,
  request: { templateId: number; conditions: TemplateCondition[]; expectedConditions: TemplateCondition[] },
  signal: AbortSignal
): Promise<WordPressConditionsResult> {
  return withSession(credentials, signal, async session => {
    await requireWriteAbility(session, "bricks/set-template-conditions");
    const current = await readConditions(session, request.templateId);
    if (current.unsupported.length) throw new RequestError(`This template has condition settings BricksSnap cannot edit (${current.unsupported.join(", ")}). Edit its conditions in Bricks.`, 422);
    if (stableJson(current.conditions) !== stableJson(request.expectedConditions)) throw new RequestError("The template's conditions changed since they were loaded. Reload them and edit again.", 409);
    await callAbility(session, "bricks/set-template-conditions", [templateArgument(request.templateId), { names: ["conditions"], value: request.conditions, required: true }]);
    return readConditions(session, request.templateId);
  });
}

/** Header and footer templates render inside <header>/<footer>; a root with the same landmark nests it. */
function landmarkWarnings(template: BricksTemplate, type: TemplateType): string[] {
  if (type !== "header" && type !== "footer") return [];
  const nested = template.content.filter(el => el.parent === 0 && [el.settings.tag, el.settings.customTag].some(tag => typeof tag === "string" && /^(header|footer)$/i.test(tag)));
  return nested.length ? [`Bricks wraps ${type} templates in a <${type}> landmark. Set the tag of ${nested.map(el => el.label || el.id).join(", ")} back to its default to avoid nested landmarks.`] : [];
}

/**
 * Create a Bricks template from a reviewed proposal. Like applying, the global classes it uses must
 * exist on the site; the template starts as a draft unless publishing is chosen explicitly.
 */
export async function createWordPressTemplate(
  credentials: WordPressCredentials,
  request: { title: string; type: TemplateType; status: "draft" | "publish"; template: unknown },
  signal: AbortSignal
): Promise<WordPressCreateTemplateResult> {
  const proposal = readStagingTemplate(request.template);
  if (!proposal.content.length) throw new RequestError("The reviewed template has no elements.", 422);
  return withSession(credentials, signal, async session => {
    await requireWriteAbility(session, "bricks/create-template");
    const referenced = referencedClassIds(proposal);
    if (referenced.length) {
      const site = new Set((await listAll(session, "bricks/list-global-classes")).filter(isRecord).map(c => String(c.id)));
      const missing = referenced.filter(id => !site.has(id));
      if (missing.length) {
        const names = missing.map(id => proposal.globalClasses?.find(c => c.id === id)?.name ?? id);
        throw new RequestError(`The template uses global classes that do not exist on the site: ${names.join(", ")}. Create the missing global classes first, or remove them from the section.`, 422);
      }
    }
    let created: unknown;
    try {
      created = await callAbility(session, "bricks/create-template", [
        { names: ["title"], value: request.title, required: true },
        { names: ["type"], value: request.type, required: true },
        { names: ["status"], value: request.status },
        { names: ["elements"], value: proposal.content },
      ]);
    } catch (error) {
      throw explainHostBlock(error, proposal, new URL(credentials.endpoint).hostname);
    }
    const templateId = isRecord(created) ? Number(created.templateId ?? created.id) : NaN;
    if (!Number.isInteger(templateId) || templateId <= 0) throw new RequestError("WordPress did not return the new template.", 502);
    return {
      templateId,
      status: isRecord(created) && typeof created.status === "string" ? created.status : request.status,
      ...(isRecord(created) && typeof created.editUrl === "string" ? { editUrl: created.editUrl } : {}),
      warnings: landmarkWarnings(proposal, request.type),
    };
  });
}

/** Every global class with the ownership envelope Bricks requires for writes, from one consistent read. */
async function listGlobalClasses(session: Session): Promise<{ classes: BricksGlobalClass[]; ownership: JsonRecord }> {
  const classes: BricksGlobalClass[] = [];
  let ownership: JsonRecord | undefined;
  for (let page = 1; page <= 20; page++) {
    const result = await callAbility(session, "bricks/list-global-classes", [{ names: ["page"], value: page }, { names: ["perPage"], value: 100 }]);
    if (!isRecord(result) || !isRecord(result.ownership)) throw new RequestError("This Bricks version does not report class ownership; classes cannot be created safely.", 422);
    if (ownership && stableJson(ownership) !== stableJson(result.ownership)) throw new RequestError("Global classes changed on the site while they were read. Try again.", 409);
    ownership = result.ownership;
    const rows = Array.isArray(result.items) ? result.items : [];
    for (const row of rows) if (isRecord(row) && typeof row.id === "string" && typeof row.name === "string") classes.push(siteClass(row));
    if (result.hasMore !== true || !rows.length) break;
  }
  return { classes, ownership: ownership ?? {} };
}

/**
 * Create the global classes a proposal uses but the site lacks, in one atomic batch guarded by the
 * class store's ownership digest. Existing classes are never changed: a staged class whose name
 * exists with the same definition reuses the site's class, one with another definition is reported.
 */
export async function createWordPressClasses(
  credentials: WordPressCredentials,
  request: { template: unknown },
  signal: AbortSignal
): Promise<WordPressClassesResult> {
  const proposal = readStagingTemplate(request.template);
  if (!referencedClassIds(proposal).length) return { template: proposal, created: [], reused: [], conflicts: [], undefinedIds: [] };

  return withSession(credentials, signal, async session => {
    const { classes: siteClasses, ownership } = await listGlobalClasses(session);
    const plan = planGlobalClasses(proposal, siteClasses);
    const ids = new Map(plan.reuse.map(r => [r.id, r.siteId]));
    const definitions = siteClasses.filter(c => plan.reuse.some(r => r.siteId === c.id));
    const created: WordPressClassesResult["created"] = [];

    if (plan.create.length) {
      await requireWriteAbility(session, "bricks/batch-create-global-classes");
      let result: unknown;
      try {
        result = await callAbility(session, "bricks/batch-create-global-classes", [
          { names: ["classes"], value: plan.create, required: true },
          { names: ["expectedOwnership"], value: ownership, required: true },
          { names: ["returnClasses"], value: true },
        ]);
      } catch (error) {
        if (error instanceof RequestError && /ownership|digest|conflict|stale|changed/i.test(error.message)) throw new RequestError(`Global classes changed on the site before they could be created; nothing was saved. Try again. (${error.message})`, 409);
        throw error;
      }
      const saved = isRecord(result) ? result : {};
      // Bricks keeps the given six-character IDs; follow its name → ID map in case it assigned others.
      const byName = isRecord(saved.classNameToId) ? saved.classNameToId : {};
      const returned = Array.isArray(saved.classes) ? saved.classes.filter(isRecord) : [];
      for (const cls of plan.create) {
        const siteId = typeof byName[cls.name] === "string" ? String(byName[cls.name]) : cls.id;
        if (siteId !== cls.id) ids.set(cls.id, siteId);
        const stored = returned.find(r => r.id === siteId);
        definitions.push(stored ? siteClass(stored) : { ...cls, id: siteId });
        created.push({ id: siteId, name: cls.name });
      }
    }

    return { template: remapGlobalClasses(proposal, ids, definitions), created, reused: plan.reuse, conflicts: plan.conflicts, undefinedIds: plan.undefinedIds };
  });
}

/** Site root for an MCP endpoint (/wp-json/mcp/… or /?rest_route=/mcp/…). */
export function siteRoot(endpoint: string): string {
  const url = new URL(endpoint);
  const path = url.pathname.replace(/wp-json\/mcp\/[^/]+\/?$/, "");
  return `${url.origin}${path.endsWith("/") ? path : `${path}/`}`;
}

function readMarkup(value: unknown): { html: string; css: string } {
  const record = isRecord(value) ? value : {};
  return { html: typeof record.html === "string" ? record.html : "", css: typeof record.css === "string" ? record.css : "" };
}

/** Bricks renders the saved page and the proposal (render-elements is read-only; nothing is saved). */
export async function renderWordPressPreview(
  credentials: WordPressCredentials,
  request: { postId: number; template: unknown },
  signal: AbortSignal
): Promise<WordPressRenderResult> {
  const proposal = readStagingTemplate(request.template);
  const { postId } = request;
  return withSession(credentials, signal, async session => {
    const format: Argument = { names: ["responseFormat"], value: "detailed" };
    const before = readMarkup(await callAbility(session, "bricks/render-elements", [postArgument(postId), format]));
    let after: RenderedMarkup;
    try {
      after = readMarkup(await callAbility(session, "bricks/render-elements", [postArgument(postId), { names: ["elements"], value: proposal.content, required: true }, format]));
    } catch (error) {
      throw explainHostBlock(error, proposal, new URL(credentials.endpoint).hostname);
    }
    const siteUrl = siteRoot(credentials.endpoint);
    // Standard location of Bricks' frontend styles; theme styles and global class CSS are not included.
    return { postId, before, after, stylesheets: [`${siteUrl}wp-content/themes/bricks/assets/css/frontend-layer.min.css`], siteUrl };
  });
}

export async function restoreWordPressRevision(
  credentials: WordPressCredentials,
  request: { postId: number; revisionId: number; expectedDocumentDigest: string },
  signal: AbortSignal
): Promise<WordPressRestoreResult> {
  const { postId, revisionId, expectedDocumentDigest } = request;
  return withSession(credentials, signal, async session => {
    await requireWriteAbility(session, "bricks/restore-revision");
    // restore-revision has no digest precondition; refuse when someone edited after the apply.
    const current = await readDocument(session, postId);
    if (current.documentDigest !== expectedDocumentDigest) throw new RequestError("The page changed after the change was applied. Restoring would discard those edits; use Bricks → Revisions instead.", 409);

    const result = await callAbility(session, "bricks/restore-revision", [
      { names: ["revisionId"], value: revisionId, required: true },
      postArgument(postId),
    ]);
    const restored = isRecord(result) ? result : {};
    const after = await readDocument(session, postId);
    const documentDigest = after.documentDigest ?? "";
    const newRevisionId = numberOrNull(restored.newRevisionId);
    return {
      postId,
      restored: restored.restored !== false,
      fromRevisionId: numberOrNull(restored.fromRevisionId) ?? revisionId,
      ...(newRevisionId ? { newRevisionId } : {}),
      documentDigest,
      template: after.template,
      source: { endpoint: credentials.endpoint, postId, postTitle: current.title ?? `Page #${postId}`, fetchedAt: new Date().toISOString(), pageHash: shortHash(after.template), ...(documentDigest ? { documentDigest } : {}) },
    };
  });
}

export async function handleWordPressRequest(
  request: WordPressRequest,
  signal: AbortSignal
): Promise<WordPressConnectResult | { pages: WordPressPageSummary[] } | WordPressPageResult | WordPressDesignResult | WordPressApplyResult | WordPressRestoreResult | WordPressRenderResult | WordPressMediaResult | WordPressClassesResult | WordPressTemplatesResult | WordPressConditionsResult | WordPressCreateTemplateResult> {
  switch (request.action) {
    case "connect":
      return connectWordPress(request.credentials, signal);
    case "search":
      return searchWordPressPages(request.credentials, request.search, signal);
    case "page":
      return getWordPressPage(request.credentials, request.postId, signal);
    case "design":
      return getWordPressDesignContext(request.credentials, signal);
    case "render":
      return renderWordPressPreview(request.credentials, request, signal);
    case "media":
      return importWordPressMedia(request.credentials, request, signal);
    case "classes":
      return createWordPressClasses(request.credentials, request, signal);
    case "templates":
      return listWordPressTemplates(request.credentials, request.type, signal);
    case "template-conditions":
      return getWordPressTemplateConditions(request.credentials, request.templateId, signal);
    case "set-conditions":
      return setWordPressTemplateConditions(request.credentials, request, signal);
    case "create-template":
      return createWordPressTemplate(request.credentials, request, signal);
    case "apply":
      return applyWordPressPage(request.credentials, request, signal);
    case "restore":
      return restoreWordPressRevision(request.credentials, request, signal);
  }
}
