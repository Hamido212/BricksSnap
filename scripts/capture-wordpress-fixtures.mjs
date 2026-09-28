// Records real, read-only Bricks ability responses from a WordPress MCP Adapter endpoint.
// Uses the same variables as the Bricks → AI client config:
//   WP_API_URL=https://site/wp-json/mcp/mcp-adapter-default-server WP_API_USERNAME=… WP_API_PASSWORD=… node scripts/capture-wordpress-fixtures.mjs
// Optional: CAPTURE_POST_ID (page to read), CAPTURE_SEARCH (find-post query).
// Only abilities whose registered annotations declare readonly: true are executed; write abilities are
// recorded as schema information only. Output goes to artifacts/ (ignored by Git) with secrets redacted.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { mkdir, writeFile } from "node:fs/promises";

const { WP_API_URL, WP_API_USERNAME, WP_API_PASSWORD, CAPTURE_POST_ID, CAPTURE_SEARCH } = process.env;
if (!WP_API_URL || !WP_API_USERNAME || !WP_API_PASSWORD) {
  console.error("Set WP_API_URL, WP_API_USERNAME and WP_API_PASSWORD.");
  process.exit(1);
}
const endpoint = new URL(WP_API_URL);
if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) {
  console.error("WP_API_URL must be an HTTPS URL without embedded credentials.");
  process.exit(1);
}

const EXECUTE = [
  "bricks/get-mcp-version",
  "bricks/list-ability-status",
  "bricks/find-post",
  "bricks/get-page-elements",
  "bricks/get-page-structure",
  "bricks/get-page-settings",
  "bricks/get-design-context",
  "bricks/list-templates",
  "bricks/list-breakpoints",
  "bricks/list-revisions",
];
// Schemas needed to plan v0.5; never executed by this script.
const INFO_ONLY = [
  "bricks/add-element",
  "bricks/update-element",
  "bricks/remove-element",
  "bricks/set-page-elements",
  "bricks/render-elements",
  "bricks/resolve-agent-file",
  "bricks/commit-agent-file",
  "bricks/commit-exact-site-edits",
  "bricks/checkout-site-edit-map",
  "bricks/commit-site-edit-plan",
  "bricks/list-remote-templates",
  "bricks/insert-remote-template",
];

const secret = WP_API_PASSWORD;
const redact = value => {
  if (typeof value === "string") return value.includes(secret) || value.includes(secret.replace(/\s/g, "")) ? "[redacted]" : value;
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, v]) =>
      /password|secret|token|api_?key|license|authorization|nonce/i.test(key) && typeof v === "string" ? [key, "[redacted]"] : [key, redact(v)]));
  }
  return value;
};

const auth = `Basic ${Buffer.from(`${WP_API_USERNAME}:${WP_API_PASSWORD.replace(/\s/g, "")}`).toString("base64")}`;
const transport = new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { Authorization: auth } } });
const client = new Client({ name: "brickssnap-fixture-capture", version: "0.4.0" }, { capabilities: {} });
const record = { capturedAt: new Date().toISOString(), endpoint: endpoint.href, tools: [], abilityInfo: {}, calls: [], skipped: [] };

const payloadOf = result => {
  if (result.structuredContent !== undefined) return result.structuredContent;
  const text = result.content?.find(c => c.type === "text")?.text;
  if (text === undefined) return result.content;
  try { return JSON.parse(text); } catch { return text; }
};

try {
  await client.connect(transport);
  record.server = { info: client.getServerVersion(), capabilities: client.getServerCapabilities(), protocolVersion: transport.protocolVersion };

  let cursor;
  do {
    const page = await client.listTools(cursor ? { cursor } : undefined);
    record.tools.push(...page.tools);
    cursor = page.nextCursor;
  } while (cursor && record.tools.length < 1000);
  const tools = new Set(record.tools.map(t => t.name));
  const direct = name => [name, name.replace(/\//g, "-")].find(n => tools.has(n));
  const dispatcher = ["mcp-adapter-execute-ability", "mcp-adapter/execute-ability"].find(n => tools.has(n));
  const infoTool = ["mcp-adapter-get-ability-info", "mcp-adapter/get-ability-info"].find(n => tools.has(n));
  const discoverTool = ["mcp-adapter-discover-abilities", "mcp-adapter/discover-abilities"].find(n => tools.has(n));

  const rawCall = async (name, args) => {
    const started = Date.now();
    try {
      const result = await client.callTool({ name, arguments: args });
      return { ok: !result.isError, ms: Date.now() - started, payload: payloadOf(result) };
    } catch (error) {
      return { ok: false, ms: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
    }
  };
  const info = async ability => {
    if (!(ability in record.abilityInfo)) record.abilityInfo[ability] = infoTool ? await rawCall(infoTool, { ability_name: ability }) : { ok: false, error: "no ability-info tool" };
    const entry = record.abilityInfo[ability];
    return entry.ok && entry.payload && typeof entry.payload === "object" ? (entry.payload.data ?? entry.payload) : undefined;
  };
  const readOnly = async ability => {
    const meta = (await info(ability))?.meta;
    if (meta?.annotations?.readonly === true) return true;
    const tool = record.tools.find(t => t.name === direct(ability));
    return tool?.annotations?.readOnlyHint === true;
  };
  const execute = async (ability, parameters = {}) => {
    if (!EXECUTE.includes(ability)) throw new Error(`${ability} is not on the read allow-list`);
    if (!(await readOnly(ability))) { record.skipped.push({ ability, reason: "not annotated read-only or not registered" }); return undefined; }
    const name = direct(ability);
    const result = name ? await rawCall(name, parameters) : dispatcher ? await rawCall(dispatcher, { ability_name: ability, parameters }) : { ok: false, error: "no dispatcher" };
    record.calls.push({ ability, via: name ?? dispatcher, parameters, ...result });
    console.log(`${result.ok ? "ok  " : "fail"} ${ability} (${result.ms} ms)`);
    return result.ok ? result.payload : undefined;
  };
  const properties = async ability => (await info(ability))?.input_schema?.properties ?? {};
  const pick = (props, names) => names.find(n => n in props);

  if (discoverTool) record.discovered = await rawCall(discoverTool, {});
  for (const ability of INFO_ONLY) await info(ability);

  await execute("bricks/get-mcp-version");
  const statusProps = await properties("bricks/list-ability-status");
  await execute("bricks/list-ability-status", "includeDisabled" in statusProps ? { includeDisabled: true } : {});

  const findProps = await properties("bricks/find-post");
  const searchKey = pick(findProps, ["search", "query", "s", "title"]);
  const found = await execute("bricks/find-post", searchKey ? { [searchKey]: CAPTURE_SEARCH ?? "" } : {});

  const firstId = value => {
    const rows = Array.isArray(value) ? value : value?.data ?? value?.posts ?? value?.results ?? value?.items;
    const row = Array.isArray(rows) ? rows.find(r => r && typeof r === "object") : undefined;
    return Number(row?.id ?? row?.ID ?? row?.postId ?? row?.post_id) || undefined;
  };
  const postId = Number(CAPTURE_POST_ID) || firstId(found);
  if (postId) {
    for (const ability of ["bricks/get-page-elements", "bricks/get-page-structure", "bricks/get-page-settings", "bricks/list-revisions"]) {
      const key = pick(await properties(ability), ["postId", "post_id", "id"]);
      await execute(ability, { [key ?? "postId"]: postId });
    }
  } else record.skipped.push({ ability: "bricks/get-page-elements", reason: "no post ID; set CAPTURE_POST_ID" });

  const designProps = await properties("bricks/get-design-context");
  await execute("bricks/get-design-context", "responseFormat" in designProps ? { responseFormat: "summary" } : {});
  await execute("bricks/get-design-context");
  await execute("bricks/list-templates");
  await execute("bricks/list-breakpoints");
} catch (error) {
  record.fatal = error instanceof Error ? error.message : String(error);
  console.error(`Capture stopped: ${record.fatal}`);
} finally {
  await transport.terminateSession().catch(() => {});
  await client.close().catch(() => {});
  await mkdir("artifacts/wordpress-fixtures", { recursive: true });
  const file = `artifacts/wordpress-fixtures/capture-${record.capturedAt.replace(/[:.]/g, "-")}.json`;
  await writeFile(file, JSON.stringify(redact(record), null, 2));
  console.log(`Saved ${file}: ${record.tools.length} tools, ${record.calls.length} calls, ${record.skipped.length} skipped.`);
}
