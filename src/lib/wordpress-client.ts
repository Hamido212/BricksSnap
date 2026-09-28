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

/** Connect a scoped MCP client using the hardened loopback-isolated transport. */
async function createClient(credentials: WordPressCredentials, signal: AbortSignal) {
  const client = new Client(
    { name: "brickssnap", version: "0.4.0" },
    { capabilities: {} }
  );

  const transport = new StreamableHTTPClientTransport(new URL(credentials.endpoint), {
    fetch: wordpressFetch(credentials, signal),
  });

  await client.connect(transport);
  return client;
}

/** Execute a Bricks ability either through a direct tool or through mcp-adapter-execute-ability. */
async function callAbility(
  client: Client,
  availableTools: Set<string>,
  abilityName: string,
  parameters: Record<string, unknown> = {}
): Promise<unknown> {
  const hyphenName = abilityName.replace(/\//g, "-");
  let directName: string | undefined;

  if (availableTools.has(abilityName)) directName = abilityName;
  else if (availableTools.has(hyphenName)) directName = hyphenName;

  let toolResult: Awaited<ReturnType<Client["callTool"]>>;

  if (directName) {
    toolResult = await client.callTool({ name: directName, arguments: parameters });
  } else {
    const dispatcher = ["mcp-adapter-execute-ability", "mcp-adapter/execute-ability"].find(d => availableTools.has(d));
    if (!dispatcher) {
      throw new RequestError(
        `The ability "${abilityName}" is not available on this WordPress site. Check Bricks → AI → Abilities.`,
        502
      );
    }
    toolResult = await client.callTool({
      name: dispatcher,
      arguments: {
        ability_name: abilityName,
        parameters,
      },
    });
  }

  if (toolResult.isError) {
    const content = toolResult.content as Array<{ type: string; text?: string }> | undefined;
    const errorText = content?.find(c => c.type === "text")?.text || `Error executing ability ${abilityName}`;
    throw new RequestError(errorText, 502);
  }

  let payload: unknown;
  if ("structuredContent" in toolResult && toolResult.structuredContent !== undefined) {
    payload = toolResult.structuredContent;
  } else {
    const content = toolResult.content as Array<{ type: string; text?: string }> | undefined;
    const textItem = content?.find(c => c.type === "text");
    if (textItem?.text) {
      try {
        payload = JSON.parse(textItem.text);
      } catch {
        payload = textItem.text;
      }
    }
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const wrapper = payload as { success: boolean; data?: unknown; error?: string };
    if (!wrapper.success) {
      throw new RequestError(wrapper.error || `Ability ${abilityName} failed.`, 502);
    }
    return wrapper.data !== undefined ? wrapper.data : payload;
  }

  return payload;
}

export async function connectWordPress(
  credentials: WordPressCredentials,
  signal: AbortSignal
): Promise<WordPressConnectResult> {
  const client = await createClient(credentials, signal);
  try {
    const toolsResult = await client.listTools();
    const availableTools = new Set((toolsResult.tools || []).map(t => t.name));

    let version = "unknown";
    try {
      const versionResult = await callAbility(client, availableTools, "bricks/get-mcp-version");
      if (typeof versionResult === "string") version = versionResult;
      else if (versionResult && typeof versionResult === "object") {
        const v = (versionResult as Record<string, unknown>).version;
        if (typeof v === "string") version = v;
      }
    } catch {
      // Fallback if version ability is restricted
    }

    const abilitiesStatus: Record<string, boolean> = {};
    try {
      const statusResult = await callAbility(client, availableTools, "bricks/list-ability-status");
      if (Array.isArray(statusResult)) {
        for (const item of statusResult) {
          if (item && typeof item === "object" && "name" in item) {
            const name = String(item.name);
            const enabled = (item as Record<string, unknown>).enabled !== false && (item as Record<string, unknown>).status !== "disabled";
            abilitiesStatus[name] = enabled;
          }
        }
      } else if (statusResult && typeof statusResult === "object") {
        for (const [key, val] of Object.entries(statusResult as Record<string, unknown>)) {
          if (typeof val === "boolean") abilitiesStatus[key] = val;
          else if (val && typeof val === "object") {
            abilitiesStatus[key] = (val as Record<string, unknown>).enabled !== false;
          }
        }
      }
    } catch {
      // If list-ability-status is unavailable, infer from tools list
      for (const name of WP_READ_ABILITIES) {
        const hyphen = name.replace(/\//g, "-");
        abilitiesStatus[name] = availableTools.has(name) || availableTools.has(hyphen);
      }
    }

    const missingAbilities: string[] = [];
    const warnings: string[] = [];

    const criticalAbilities = ["bricks/get-page-elements", "bricks/get-design-context"];
    for (const ability of criticalAbilities) {
      const hyphen = ability.replace(/\//g, "-");
      const isAvailable =
        abilitiesStatus[ability] === true ||
        availableTools.has(ability) ||
        availableTools.has(hyphen) ||
        availableTools.has("mcp-adapter-execute-ability") ||
        availableTools.has("mcp-adapter/execute-ability");

      if (!isAvailable) {
        missingAbilities.push(ability);
        warnings.push(`Ability ${ability} is not enabled in Bricks → AI → Abilities.`);
      }
    }

    return {
      connected: true,
      endpoint: credentials.endpoint,
      version,
      abilities: abilitiesStatus,
      missingAbilities,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } finally {
    await client.close().catch(() => {});
  }
}

export async function searchWordPressPages(
  credentials: WordPressCredentials,
  search: string,
  signal: AbortSignal
): Promise<{ pages: WordPressPageSummary[] }> {
  const client = await createClient(credentials, signal);
  try {
    const toolsResult = await client.listTools();
    const availableTools = new Set((toolsResult.tools || []).map(t => t.name));

    const result = await callAbility(client, availableTools, "bricks/find-post", {
      search: search.trim(),
      query: search.trim(),
      s: search.trim(),
    });

    const pages: WordPressPageSummary[] = [];
    const items = Array.isArray(result)
      ? result
      : result && typeof result === "object" && "posts" in result && Array.isArray((result as { posts: unknown[] }).posts)
      ? (result as { posts: unknown[] }).posts
      : [];

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const id = Number(rec.id ?? rec.ID ?? rec.post_id ?? 0);
      if (!id || id <= 0) continue;

      pages.push({
        id,
        title: String(rec.title ?? rec.post_title ?? rec.name ?? `Page #${id}`),
        slug: typeof rec.slug === "string" ? rec.slug : typeof rec.post_name === "string" ? rec.post_name : undefined,
        type: typeof rec.type === "string" ? rec.type : typeof rec.post_type === "string" ? rec.post_type : undefined,
        modified: typeof rec.modified === "string" ? rec.modified : typeof rec.post_modified === "string" ? rec.post_modified : undefined,
      });
    }

    return { pages };
  } finally {
    await client.close().catch(() => {});
  }
}

export async function getWordPressPage(
  credentials: WordPressCredentials,
  postId: number,
  signal: AbortSignal
): Promise<WordPressPageResult> {
  const client = await createClient(credentials, signal);
  try {
    const toolsResult = await client.listTools();
    const availableTools = new Set((toolsResult.tools || []).map(t => t.name));

    const elementsResult = await callAbility(client, availableTools, "bricks/get-page-elements", {
      post_id: postId,
      postId: postId,
    });

    let settingsResult: Record<string, unknown> | undefined;
    try {
      const s = await callAbility(client, availableTools, "bricks/get-page-settings", {
        post_id: postId,
        postId: postId,
      });
      if (s && typeof s === "object" && !Array.isArray(s)) settingsResult = s as Record<string, unknown>;
    } catch {
      // Optional settings read
    }

    let rawElements: unknown[] = [];
    if (Array.isArray(elementsResult)) {
      rawElements = elementsResult;
    } else if (elementsResult && typeof elementsResult === "object") {
      const obj = elementsResult as Record<string, unknown>;
      if (Array.isArray(obj.elements)) rawElements = obj.elements;
      else if (Array.isArray(obj.content)) rawElements = obj.content;
    }

    const template = readStagingTemplate(
      Array.isArray(rawElements) ? { content: rawElements } : rawElements,
      true
    );

    const pageHash = createHash("sha256")
      .update(stableJson(template.content))
      .digest("hex")
      .slice(0, 16);

    const fetchedAt = new Date().toISOString();
    const postTitle = `Page #${postId}`;

    const source: WordPressSource = {
      endpoint: credentials.endpoint,
      postId,
      postTitle,
      fetchedAt,
      pageHash,
    };

    return {
      postId,
      postTitle,
      template,
      pageHash,
      fetchedAt,
      endpoint: credentials.endpoint,
      source,
      settings: settingsResult,
    };
  } finally {
    await client.close().catch(() => {});
  }
}

export async function getWordPressDesignContext(
  credentials: WordPressCredentials,
  signal: AbortSignal
): Promise<WordPressDesignResult> {
  const client = await createClient(credentials, signal);
  try {
    const toolsResult = await client.listTools();
    const availableTools = new Set((toolsResult.tools || []).map(t => t.name));

    const result = await callAbility(client, availableTools, "bricks/get-design-context", {});
    const fetchedAt = new Date().toISOString();

    const designTokens: Partial<DesignTokens> = {};
    const globalClasses: BricksGlobalClass[] = [];

    if (result && typeof result === "object") {
      const ctx = result as Record<string, unknown>;

      // Extract colors from palettes
      const colors = (Array.isArray(ctx.colors) ? ctx.colors : Array.isArray(ctx.colorPalette) ? ctx.colorPalette : []) as Array<Record<string, unknown>>;
      for (const item of colors) {
        if (!item || typeof item !== "object") continue;
        const name = String(item.name || "").toLowerCase();
        const hex = String(item.hex || item.color || item.value || "");
        if (!hex || !/^#[0-9a-fA-F]{3,8}$/.test(hex)) continue;

        if (name.includes("primary") && !designTokens.primaryColor) designTokens.primaryColor = hex;
        else if (name.includes("secondary") && !designTokens.secondaryColor) designTokens.secondaryColor = hex;
        else if ((name.includes("background") || name.includes("base") || name.includes("light")) && !designTokens.backgroundColor) designTokens.backgroundColor = hex;
        else if (name.includes("surface") || name.includes("card") || name.includes("muted")) designTokens.surfaceColor = hex;
        else if (name.includes("text") || name.includes("body") || name.includes("dark")) designTokens.textColor = hex;
      }

      // Extract global classes
      if (Array.isArray(ctx.globalClasses)) {
        for (const cls of ctx.globalClasses) {
          if (cls && typeof cls === "object" && typeof (cls as Record<string, unknown>).id === "string" && typeof (cls as Record<string, unknown>).name === "string") {
            globalClasses.push({
              id: String((cls as Record<string, unknown>).id),
              name: String((cls as Record<string, unknown>).name),
              settings: ((cls as Record<string, unknown>).settings && typeof (cls as Record<string, unknown>).settings === "object"
                ? (cls as Record<string, unknown>).settings
                : {}) as Record<string, unknown>,
            });
          }
        }
      }
    }

    return {
      endpoint: credentials.endpoint,
      fetchedAt,
      designTokens,
      globalClasses,
      rawDesignContext: result,
    };
  } finally {
    await client.close().catch(() => {});
  }
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
