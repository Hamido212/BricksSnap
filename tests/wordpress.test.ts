import { afterEach, describe, expect, it, vi } from "vitest";
import {
  wpCredentialsSchema,
  wpRequestSchema,
  WP_READ_ABILITIES,
  type WordPressCredentials,
} from "../src/lib/wordpress-contract";
import {
  assertLocalWordPress,
  wordpressEndpoint,
  isPublicAddress,
} from "../src/lib/wordpress-http";
import { POST } from "../src/app/api/wordpress/route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("WordPress contract validation", () => {
  const validCreds: WordPressCredentials = {
    endpoint: "https://example.com/wp-json/mcp/mcp-adapter-default-server",
    username: "admin",
    password: "xxxx xxxx xxxx xxxx",
  };

  it("accepts valid credentials", () => {
    const parsed = wpCredentialsSchema.parse(validCreds);
    expect(parsed.username).toBe("admin");
    expect(parsed.endpoint).toBe("https://example.com/wp-json/mcp/mcp-adapter-default-server");
  });

  it("rejects endpoints with embedded credentials, query parameters, or non-HTTPS", () => {
    for (const invalid of [
      "http://example.com/wp-json/mcp/server",
      "https://user:pass@example.com/wp-json/mcp/server",
      "https://example.com/wp-json/mcp/server?param=1",
      "https://example.com/wp-json/mcp/server#hash",
      "not-a-url",
    ]) {
      expect(() => wpCredentialsSchema.parse({ ...validCreds, endpoint: invalid })).toThrow();
    }
  });

  it("rejects CRLF characters in username and password to prevent header injection", () => {
    expect(() => wpCredentialsSchema.parse({ ...validCreds, username: "admin\r\nInjected: yes" })).toThrow();
    expect(() => wpCredentialsSchema.parse({ ...validCreds, username: "admin:colon" })).toThrow();
    expect(() => wpCredentialsSchema.parse({ ...validCreds, password: "pass\r\ninjection" })).toThrow();
  });

  it("validates all four action payloads", () => {
    expect(wpRequestSchema.parse({ action: "connect", credentials: validCreds }).action).toBe("connect");
    expect(wpRequestSchema.parse({ action: "search", credentials: validCreds, search: "landing" }).action).toBe("search");
    expect(wpRequestSchema.parse({ action: "page", credentials: validCreds, postId: 42 }).action).toBe("page");
    expect(wpRequestSchema.parse({ action: "design", credentials: validCreds }).action).toBe("design");

    // Invalid action or missing required parameters
    expect(() => wpRequestSchema.parse({ action: "unknown", credentials: validCreds })).toThrow();
    expect(() => wpRequestSchema.parse({ action: "page", credentials: validCreds, postId: -1 })).toThrow();
    expect(wpRequestSchema.parse({ action: "search", credentials: validCreds, search: " " })).toMatchObject({ search: "" });
    expect(() => wpRequestSchema.parse({ action: "search", credentials: validCreds, search: "x".repeat(201) })).toThrow();
  });

  it("includes all required read abilities in constant", () => {
    expect(WP_READ_ABILITIES).toContain("bricks/get-mcp-version");
    expect(WP_READ_ABILITIES).toContain("bricks/list-ability-status");
    expect(WP_READ_ABILITIES).toContain("bricks/find-post");
    expect(WP_READ_ABILITIES).toContain("bricks/get-page-elements");
    expect(WP_READ_ABILITIES).toContain("bricks/get-page-settings");
    expect(WP_READ_ABILITIES).toContain("bricks/get-design-context");
  });
});

describe("WordPress HTTP safety and SSRF protection", () => {
  it("parses endpoint and requires /wp-json/mcp/... path", () => {
    const url = wordpressEndpoint("https://example.com/wp-json/mcp/test-server");
    expect(url.pathname).toBe("/wp-json/mcp/test-server");

    expect(() => wordpressEndpoint("https://example.com/other-path")).toThrow(
      "ending in /wp-json/mcp/server-name"
    );
    expect(() => wordpressEndpoint("https://example.com:8443/wp-json/mcp/test")).toThrow(
      "custom port"
    );
  });

  it("correctly identifies private vs public IP addresses", () => {
    // Private/loopback ranges must be blocked
    expect(isPublicAddress("127.0.0.1")).toBe(false);
    expect(isPublicAddress("10.0.0.1")).toBe(false);
    expect(isPublicAddress("172.16.0.1")).toBe(false);
    expect(isPublicAddress("192.168.1.1")).toBe(false);
    expect(isPublicAddress("169.254.169.254")).toBe(false); // Cloud metadata
    expect(isPublicAddress("::1")).toBe(false);
    expect(isPublicAddress("fc00::1")).toBe(false);

    // Public unicast IPs must be allowed
    expect(isPublicAddress("93.184.216.34")).toBe(true);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(true);
  });

  it("enforces local-only loopback access for assertLocalWordPress", () => {
    vi.stubEnv("BRICKSSNAP_LOCAL_WORDPRESS", "true");

    const validReq = new Request("http://127.0.0.1:3000/api/wordpress", {
      headers: {
        Host: "127.0.0.1:3000",
        Origin: "http://127.0.0.1:3000",
        "X-BricksSnap-Local": "1",
      },
    });
    expect(() => assertLocalWordPress(validReq)).not.toThrow();

    // Missing env flag
    vi.stubEnv("BRICKSSNAP_LOCAL_WORDPRESS", "false");
    expect(() => assertLocalWordPress(validReq)).toThrow("Start BricksSnap with npm run dev:local");
    vi.stubEnv("BRICKSSNAP_LOCAL_WORDPRESS", "true");

    // Remote host
    const remoteHost = new Request("http://127.0.0.1:3000/api/wordpress", {
      headers: {
        Host: "evil.example.com",
        "X-BricksSnap-Local": "1",
      },
    });
    expect(() => assertLocalWordPress(remoteHost)).toThrow("restricted to this computer");

    // Remote forwarded IP
    const forwardedReq = new Request("http://127.0.0.1:3000/api/wordpress", {
      headers: {
        Host: "localhost:3000",
        "X-Forwarded-For": "203.0.113.195",
        "X-BricksSnap-Local": "1",
      },
    });
    expect(() => assertLocalWordPress(forwardedReq)).toThrow("Remote clients are not allowed");

    // Cross origin
    const crossOrigin = new Request("http://127.0.0.1:3000/api/wordpress", {
      headers: {
        Host: "localhost:3000",
        Origin: "https://malicious.test",
        "X-BricksSnap-Local": "1",
      },
    });
    expect(() => assertLocalWordPress(crossOrigin)).toThrow("Cross-origin access is not allowed");

    // Missing local header
    const noHeader = new Request("http://127.0.0.1:3000/api/wordpress", {
      headers: {
        Host: "localhost:3000",
      },
    });
    expect(() => assertLocalWordPress(noHeader)).toThrow("Local client header required");
  });
});

describe("WordPress API route POST /api/wordpress", () => {
  const localHeaders = {
    "Content-Type": "application/json",
    Host: "127.0.0.1:3000",
    Origin: "http://127.0.0.1:3000",
    "X-BricksSnap-Local": "1",
  };

  it("blocks non-local requests with HTTP 403", async () => {
    vi.stubEnv("BRICKSSNAP_LOCAL_WORDPRESS", "false");
    const req = new Request("http://127.0.0.1:3000/api/wordpress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connect" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects invalid request bodies with HTTP 400", async () => {
    vi.stubEnv("BRICKSSNAP_LOCAL_WORDPRESS", "true");
    const req = new Request("http://127.0.0.1:3000/api/wordpress", {
      method: "POST",
      headers: localHeaders,
      body: JSON.stringify({ action: "invalid_action" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("WordPress client operations", () => {
  const validCreds: WordPressCredentials = {
    endpoint: "https://example.com/wp-json/mcp/mcp-adapter-default-server",
    username: "admin",
    password: "secretpassword",
  };

  it("handles connect action and discovers abilities and version", async () => {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({
      tools: [
        { name: "bricks/get-mcp-version", description: "Get version", inputSchema: { type: "object" } },
        { name: "bricks/list-ability-status", description: "List status", inputSchema: { type: "object" } },
        { name: "bricks/get-page-elements", description: "Get page elements", inputSchema: { type: "object" } },
        { name: "bricks/get-design-context", description: "Get design context", inputSchema: { type: "object" } },
      ],
    });
    vi.spyOn(Client.prototype, "callTool").mockImplementation(async (params) => {
      if (params.name === "bricks/get-mcp-version") {
        return { content: [{ type: "text", text: JSON.stringify({ version: "2.4.1" }) }] };
      }
      if (params.name === "bricks/list-ability-status") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify([
                { name: "bricks/get-page-elements", enabled: true },
                { name: "bricks/get-design-context", enabled: true },
              ]),
            },
          ],
        };
      }
      return { content: [{ type: "text", text: "{}" }] };
    });

    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest(
      { action: "connect", credentials: validCreds },
      new AbortController().signal
    );

    expect(result).toMatchObject({
      connected: true,
      endpoint: validCreds.endpoint,
      version: "2.4.1",
      missingAbilities: [],
    });
  });

  it("handles search action and normalizes page results", async () => {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({
      tools: [{ name: "bricks/find-post", description: "Find post", inputSchema: { type: "object" } }],
    });
    vi.spyOn(Client.prototype, "callTool").mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { ID: 12, post_title: "Startseite", post_name: "home", post_type: "page", post_modified: "2026-09-28" },
            { id: 45, title: "Kontakt", slug: "kontakt", type: "page" },
          ]),
        },
      ],
    });

    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest(
      { action: "search", credentials: validCreds, search: "Home" },
      new AbortController().signal
    );

    expect(result).toEqual({
      pages: [
        { id: 12, title: "Startseite", slug: "home", type: "page", modified: "2026-09-28" },
        { id: 45, title: "Kontakt", slug: "kontakt", type: "page", modified: undefined },
      ],
    });
  });

  it("handles page action, wraps elements into BricksTemplate and computes pageHash", async () => {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({
      tools: [
        { name: "bricks-get-page-elements", description: "Get elements", inputSchema: { type: "object" } },
        { name: "bricks-get-page-settings", description: "Get settings", inputSchema: { type: "object" } },
      ],
    });
    vi.spyOn(Client.prototype, "callTool").mockImplementation(async (params) => {
      if (params.name === "bricks-get-page-elements") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify([
                { id: "sec001", name: "section", parent: 0, children: ["con001"], settings: {} },
                { id: "con001", name: "container", parent: "sec001", children: [], settings: {} },
              ]),
            },
          ],
        };
      }
      if (params.name === "bricks-get-page-settings") {
        return { content: [{ type: "text", text: JSON.stringify({ pageTitle: "Home Page" }) }] };
      }
      return { content: [{ type: "text", text: "{}" }] };
    });

    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest(
      { action: "page", credentials: validCreds, postId: 12 },
      new AbortController().signal
    );

    expect(result).toMatchObject({
      postId: 12,
      endpoint: validCreds.endpoint,
      template: {
        content: [
          { id: "sec001", name: "section", parent: 0, children: ["con001"] },
          { id: "con001", name: "container", parent: "sec001", children: [] },
        ],
      },
      source: {
        endpoint: validCreds.endpoint,
        postId: 12,
      },
    });
    expect((result as { pageHash: string }).pageHash).toMatch(/^[a-f0-9]{16}$/);
  });

  it("handles design action and extracts palettes and global classes", async () => {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({
      tools: ["bricks/get-design-context", "bricks/list-color-palettes", "bricks/list-global-classes"].map(name => ({ name, inputSchema: { type: "object" as const } })),
    });
    // The design context only summarizes; values come from the list abilities.
    vi.spyOn(Client.prototype, "callTool").mockImplementation(async params => {
      const body = params.name === "bricks/list-color-palettes"
        ? { items: [{ id: "p1", name: "Brand", colors: [{ name: "Primary Brand", hex: "#1d4ed8" }, { name: "Base Background", hex: "#f8fafc" }] }], hasMore: false }
        : params.name === "bricks/list-global-classes"
        ? { items: [{ id: "btn-primary", name: "btn-primary", settings: { color: { hex: "#ffffff" } } }], hasMore: false }
        : { counts: { colorPalettes: 1, globalClasses: 1 } };
      return { content: [{ type: "text", text: JSON.stringify(body) }] } as never;
    });

    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest(
      { action: "design", credentials: validCreds },
      new AbortController().signal
    );

    expect(result).toMatchObject({
      endpoint: validCreds.endpoint,
      designTokens: {
        primaryColor: "#1d4ed8",
        backgroundColor: "#f8fafc",
      },
      globalClasses: [
        { id: "btn-primary", name: "btn-primary" },
      ],
    });
  });

  it("throws RequestError when an ability execution fails", async () => {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({
      tools: [{ name: "bricks/find-post", description: "Find", inputSchema: { type: "object" } }],
    });
    vi.spyOn(Client.prototype, "callTool").mockResolvedValue({
      isError: true,
      content: [{ type: "text", text: "Permission denied for user" }],
    });

    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    await expect(
      handleWordPressRequest(
        { action: "search", credentials: validCreds, search: "test" },
        new AbortController().signal
      )
    ).rejects.toThrow("Permission denied for user");
  });
});


// Response shapes documented by the official Bricks skills (codeerhq/bricks-skills, bricks-ai-tab) and Bricks 2.4 schemas.
describe("WordPress client with documented Bricks 2.4 response shapes", () => {
  const validCreds: WordPressCredentials = {
    endpoint: "https://example.com/wp-json/mcp/mcp-adapter-default-server",
    username: "mcp-service-user",
    password: "xxxx xxxx xxxx xxxx",
  };
  const text = (value: unknown) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

  async function mockClient(tools: string[], respond: (name: string, args: Record<string, unknown>) => unknown) {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({ tools: tools.map(name => ({ name, inputSchema: { type: "object" as const } })) });
    return vi.spyOn(Client.prototype, "callTool").mockImplementation(async params => respond(params.name, (params.arguments ?? {}) as Record<string, unknown>) as never);
  }

  afterEach(() => vi.restoreAllMocks());

  it("reads bricksVersion and reports abilities disabled in the status envelope", async () => {
    const call = await mockClient(
      ["bricks-get-mcp-version", "bricks-get-page-elements", "bricks-get-design-context", "mcp-adapter-discover-abilities", "mcp-adapter-get-ability-info", "mcp-adapter-execute-ability"],
      (name, args) => {
        if (name === "bricks-get-mcp-version") return text({ bricksVersion: "2.4.1", bricksAbilitiesVersion: "2.0.0", wordpressVersion: "7.0", abilitiesApiActive: true, disabledAbilityCount: 1 });
        if (name === "mcp-adapter-get-ability-info") return text({ name: args.ability_name, input_schema: { type: "object", properties: { abilityNames: { type: "array" }, includeDisabled: { type: "boolean" }, responseFormat: { type: "string" } } } });
        if (name === "mcp-adapter-execute-ability" && args.ability_name === "bricks/list-ability-status") {
          return text({
            abilities: [
              { name: "bricks/get-page-elements", enabled: true, defaultEnabled: true, category: "bricks-elements" },
              { name: "bricks/get-design-context", enabled: false, defaultEnabled: true, category: "bricks-design" },
            ],
            total: 164, enabled: 163, disabled: 1,
          });
        }
        return text({});
      }
    );

    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest({ action: "connect", credentials: validCreds }, new AbortController().signal);

    expect(result).toMatchObject({
      version: "2.4.1",
      wordpressVersion: "7.0",
      missingAbilities: ["bricks/get-design-context"],
      abilities: { "bricks/get-page-elements": true, "bricks/get-design-context": false },
    });
    expect((result as { warnings: string[] }).warnings).toContain("Ability bricks/get-design-context is disabled in Bricks → AI → Abilities.");
    // Exact abilityNames are requested so that disabled rows are not hidden by the summary.
    const statusCall = call.mock.calls.find(([p]) => p.name === "mcp-adapter-execute-ability" && (p.arguments as Record<string, unknown>).ability_name === "bricks/list-ability-status");
    expect((statusCall?.[0].arguments as { parameters: { abilityNames: string[] } }).parameters.abilityNames).toContain("bricks/get-page-elements");
  });

  it("does not treat the dispatcher as proof that an unlisted ability is enabled", async () => {
    await mockClient(["mcp-adapter-execute-ability"], (name, args) =>
      args.ability_name === "bricks/list-ability-status"
        ? text({ abilities: [{ name: "bricks/get-page-elements", enabled: true }], total: 1, enabled: 1, disabled: 0 })
        : text({ bricksVersion: "2.4.1" })
    );
    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest({ action: "connect", credentials: validCreds }, new AbortController().signal);
    expect(result).toMatchObject({ missingAbilities: ["bricks/get-design-context"] });
  });

  it("sends only the parameter name declared by a dispatcher-only ability schema", async () => {
    const call = await mockClient(["mcp-adapter-get-ability-info", "mcp-adapter-execute-ability"], (name, args) => {
      if (name === "mcp-adapter-get-ability-info") {
        return args.ability_name === "bricks/get-page-elements"
          ? text({ input_schema: { type: "object", properties: { postId: { type: "integer" } }, additionalProperties: false } })
          : text({ input_schema: { type: "object", properties: {} } });
      }
      if (args.ability_name === "bricks/get-page-elements") {
        return text({ success: true, data: { postId: 12, title: "Startseite", elements: [{ id: "sec001", name: "section", parent: 0, children: [], settings: {} }] } });
      }
      return { isError: true, content: [{ type: "text", text: "Ability not found" }] };
    });

    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest({ action: "page", credentials: validCreds, postId: 12 }, new AbortController().signal);

    expect(result).toMatchObject({ postTitle: "Startseite", template: { content: [{ id: "sec001", name: "section" }] } });
    const pageCall = call.mock.calls.find(([p]) => p.name === "mcp-adapter-execute-ability" && (p.arguments as Record<string, unknown>).ability_name === "bricks/get-page-elements");
    expect((pageCall?.[0].arguments as { parameters: unknown }).parameters).toEqual({ postId: 12 });
  });

  it("rejects a required argument the installed ability schema does not declare", async () => {
    const { pickArguments } = await import("../src/lib/wordpress-client");
    expect(pickArguments({ properties: { query: {} } }, "bricks/find-post", [{ names: ["search", "query"], value: "home", required: true }])).toEqual({ query: "home" });
    expect(() => pickArguments({ properties: { title: {} } }, "bricks/find-post", [{ names: ["search", "query"], value: "home", required: true }])).toThrow("does not accept a search parameter");
    expect(pickArguments(undefined, "bricks/find-post", [{ names: ["search", "query"], value: "home" }])).toEqual({ search: "home" });
  });

  it("extracts Bricks 2.4 palette colors stored as { id, raw, light } across list pages", async () => {
    await mockClient(["bricks-get-design-context", "mcp-adapter-execute-ability"], (name, args) => {
      const params = (args.parameters ?? {}) as { page?: number };
      if (args.ability_name === "bricks/list-color-palettes") {
        return text({ success: true, data: params.page === 1
          ? { items: [{ id: "pal1", name: "Brand", colors: [{ id: "c1", raw: "var(--primary)", light: "#1d4ed8" }] }], hasMore: true }
          : { items: [{ id: "pal2", name: "Text", colors: [{ id: "c2", raw: "var(--text-dark)", light: "#0f172a", dark: "#f8fafc" }] }], hasMore: false } });
      }
      if (args.ability_name === "bricks/list-global-classes") return text({ success: true, data: { items: [{ id: "abc123", name: "btn", settings: { _padding: { top: "1rem" } } }], hasMore: false } });
      return text({ counts: {}, globalClasses: [{ id: "zzz999", name: "summary-only", hasSettings: true }] });
    });
    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const result = await handleWordPressRequest({ action: "design", credentials: validCreds }, new AbortController().signal);
    expect(result).toMatchObject({
      designTokens: { primaryColor: "#1d4ed8", textColor: "#0f172a" },
      globalClasses: [{ id: "abc123", name: "btn", settings: { _padding: { top: "1rem" } } }],
    });
    expect((result as { globalClasses: unknown[] }).globalClasses).toHaveLength(1);
  });

  it("parses ability status envelopes, arrays and legacy maps", async () => {
    const { readAbilityStatus, readVersion } = await import("../src/lib/wordpress-client");
    expect(readAbilityStatus({ abilities: [{ name: "bricks/a", enabled: false }], total: 1 })).toEqual({ "bricks/a": false });
    expect(readAbilityStatus([{ name: "bricks/a", enabled: true }])).toEqual({ "bricks/a": true });
    expect(readAbilityStatus({ "bricks/a": true, total: 3 })).toEqual({ "bricks/a": true });
    expect(readAbilityStatus({ total: 0 })).toBeUndefined();
    expect(readVersion({ bricksVersion: "2.4.1", wordpressVersion: "7.0" })).toEqual({ version: "2.4.1", wordpressVersion: "7.0" });
    expect(readVersion({ version: "2.4.0" })).toEqual({ version: "2.4.0", wordpressVersion: undefined });
  });
});

// Replays sanitized responses captured read-only from a real Bricks 2.4.2 site (see the fixture's _comment).
describe("WordPress client against captured Bricks 2.4.2 responses", () => {
  const creds: WordPressCredentials = { endpoint: "https://example.com/wp-json/mcp/mcp-adapter-default-server", username: "u", password: "p" };
  const text = (value: unknown) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

  async function replay() {
    const fixture = (await import("./fixtures/wordpress-bricks-2.4.2.json")).default as unknown as {
      tools: Array<{ name: string; inputSchema: Record<string, unknown> }>;
      abilityInfo: Record<string, unknown>;
      responses: Record<string, unknown>;
    };
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "close").mockResolvedValue(undefined);
    vi.spyOn(Client.prototype, "listTools").mockResolvedValue({ tools: fixture.tools as never });
    const call = vi.spyOn(Client.prototype, "callTool").mockImplementation(async params => {
      const args = (params.arguments ?? {}) as { ability_name?: string };
      if (params.name === "mcp-adapter-get-ability-info") return text(fixture.abilityInfo[args.ability_name!] ?? { success: false, error: "not found" }) as never;
      const ability = params.name === "mcp-adapter-execute-ability" ? args.ability_name! : params.name.replace(/^bricks-/, "bricks/");
      const response = fixture.responses[ability];
      return (response ? text(response) : { isError: true, content: [{ type: "text", text: `Unknown ability ${ability}` }] }) as never;
    });
    const { handleWordPressRequest } = await import("../src/lib/wordpress-client");
    const executed = (ability: string) => call.mock.calls
      .map(([p]) => p)
      .filter(p => p.name === "mcp-adapter-execute-ability" && (p.arguments as { ability_name: string }).ability_name === ability)
      .map(p => (p.arguments as { parameters: unknown }).parameters);
    return { handleWordPressRequest, executed };
  }

  afterEach(() => vi.restoreAllMocks());

  it("connects and reports versions and enabled read abilities", async () => {
    const { handleWordPressRequest, executed } = await replay();
    const result = await handleWordPressRequest({ action: "connect", credentials: creds }, new AbortController().signal);
    expect(result).toMatchObject({ version: "2.4.2", wordpressVersion: "7.1.2", missingAbilities: [] });
    expect((result as { abilities: Record<string, boolean> }).abilities["bricks/list-global-classes"]).toBe(true);
    expect(executed("bricks/list-ability-status")[0]).toEqual({ abilityNames: expect.arrayContaining(["bricks/get-page-elements"]) });
  });

  it("lists Bricks content with an empty query and keeps lock state", async () => {
    const { handleWordPressRequest, executed } = await replay();
    const result = await handleWordPressRequest({ action: "search", credentials: creds, search: "" }, new AbortController().signal);
    expect(executed("bricks/find-post")[0]).toEqual({ query: "", bricksOnly: true, limit: 50 });
    expect((result as { pages: unknown[] }).pages[0]).toEqual({ id: 7, title: "Home", slug: "home", type: "page", modified: "2026-09-28 19:25:51", locked: true });
  });

  it("imports the page tree with Bricks' document digest, title and empty settings", async () => {
    const { handleWordPressRequest, executed } = await replay();
    const result = await handleWordPressRequest({ action: "page", credentials: creds, postId: 7 }, new AbortController().signal) as {
      template: { content: unknown[] }; documentDigest: string; postTitle: string; settings: unknown; source: { documentDigest: string };
    };
    expect(executed("bricks/get-page-elements")[0]).toEqual({ postId: 7 });
    expect(result.template.content).toHaveLength(22);
    expect(result.documentDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.source.documentDigest).toBe(result.documentDigest);
    expect(result.postTitle).toBe("Home");
    expect(result.settings).toEqual({});
  });

  it("reads palette colors and class settings from the list abilities, not the summary", async () => {
    const { handleWordPressRequest, executed } = await replay();
    const result = await handleWordPressRequest({ action: "design", credentials: creds }, new AbortController().signal) as {
      globalClasses: Array<{ name: string; settings: Record<string, unknown> }>;
    };
    expect(executed("bricks/list-color-palettes")[0]).toEqual({ page: 1, perPage: 100 });
    expect(result.globalClasses.map(c => c.name)).toEqual(["timeline-1", "timeline-1__item"]);
    // Bricks' default palette (--bricks-color-*) must not become brand tokens.
    expect((result as unknown as { designTokens: object }).designTokens).toEqual({});
    expect(Object.keys(result.globalClasses[0].settings).length).toBeGreaterThan(0);
  });
});
