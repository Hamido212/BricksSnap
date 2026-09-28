import { z } from "zod";
import type { BricksGlobalClass, BricksTemplate, DesignTokens } from "./bricks-engine";

// This release cannot accept arbitrary tool names, endpoints per call or write operations.
export const WP_READ_ABILITIES = [
  "bricks/get-mcp-version",
  "bricks/list-ability-status",
  "bricks/find-post",
  "bricks/get-page-elements",
  "bricks/get-page-settings",
  "bricks/get-design-context",
  "bricks/list-color-palettes",
  "bricks/list-global-classes",
] as const;

export type ReadAbility = typeof WP_READ_ABILITIES[number];

export const wpCredentialsSchema = z.object({
  endpoint: z.string().trim().url().max(500).refine(v => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password && !u.hash && !u.search && (!u.port || u.port === "443") && /\/wp-json\/mcp\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname);
    } catch {
      return false;
    }
  }, "Use an HTTPS MCP endpoint without embedded credentials, query parameters or a custom port, ending in /wp-json/mcp/server-name."),
  username: z.string().trim().min(1).max(100).refine(v => !/[:\r\n]/.test(v), "Username cannot contain colons or line breaks"),
  password: z.string().min(1).max(256).refine(v => !/[\r\n]/.test(v), "Password cannot contain line breaks"),
}).strict();

export type WordPressCredentials = z.infer<typeof wpCredentialsSchema>;

export const wpRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("connect"), credentials: wpCredentialsSchema }).strict(),
  // An empty search lists recently modified Bricks content.
  z.object({ action: z.literal("search"), credentials: wpCredentialsSchema, search: z.string().trim().max(200) }).strict(),
  z.object({ action: z.literal("page"), credentials: wpCredentialsSchema, postId: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("design"), credentials: wpCredentialsSchema }).strict(),
]);

export type WordPressRequest = z.infer<typeof wpRequestSchema>;

export type WordPressSource = {
  endpoint: string;
  postId: number;
  postTitle?: string;
  fetchedAt: string;
  pageHash: string;
  /** Bricks' own digest of the stored document; the precondition for guarded page writes. */
  documentDigest?: string;
};

export type WordPressPageSummary = {
  id: number;
  title: string;
  slug?: string;
  type?: string;
  modified?: string;
  /** Open in the Bricks builder by another session. */
  locked?: boolean;
};

export type WordPressConnectResult = {
  connected: boolean;
  endpoint: string;
  version?: string;
  wordpressVersion?: string;
  abilities: Record<string, boolean>;
  missingAbilities: string[];
  warnings?: string[];
};

export type WordPressPageResult = {
  postId: number;
  postTitle: string;
  template: BricksTemplate;
  pageHash: string;
  documentDigest?: string;
  fetchedAt: string;
  endpoint: string;
  source: WordPressSource;
  settings?: Record<string, unknown>;
  warnings?: string[];
};

export type WordPressDesignResult = {
  endpoint: string;
  fetchedAt: string;
  designTokens: Partial<DesignTokens>;
  globalClasses: BricksGlobalClass[];
  rawDesignContext?: unknown;
};
