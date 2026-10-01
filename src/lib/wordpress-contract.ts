import { z } from "zod";
import type { BricksGlobalClass, BricksTemplate, DesignTokens } from "./bricks-engine";
import { TEMPLATE_TYPES, templateConditionsSchema, type TemplateCondition } from "./template-conditions";
import { FONT_PAIR_IDS, RADIUS_IDS, SPACING_IDS, STYLE_IDS } from "./kit/tokens";
import type { DesignSystemChange } from "./design-system-install";
import { designSnapshotSchema, type DesignSnapshot } from "./design-system-lifecycle";

// Only these fixed abilities are called; no arbitrary tool names or endpoints per call.
export const WP_READ_ABILITIES = [
  "bricks/get-mcp-version",
  "bricks/list-ability-status",
  "bricks/find-post",
  "bricks/get-page-elements",
  "bricks/get-page-settings",
  "bricks/get-design-context",
  "bricks/list-color-palettes",
  "bricks/list-global-classes",
  "bricks/list-templates",
  "bricks/get-template-settings",
  "bricks/list-global-variables",
] as const;

export type ReadAbility = typeof WP_READ_ABILITIES[number];

/** Writes: guarded element replacement, restoring its revision, images, classes, templates and their conditions, the kit's design system. */
export const WP_WRITE_ABILITIES = [
  "bricks/set-page-elements", "bricks/restore-revision", "bricks/upload-media", "bricks/batch-create-global-classes",
  "bricks/create-template", "bricks/set-template-conditions",
  "bricks/create-color-palette", "bricks/create-color", "bricks/update-color", "bricks/set-global-variable-categories", "bricks/set-global-variables",
  "bricks/delete-color-palette", "bricks/delete-color", "bricks/delete-global-variable",
  "bricks/update-global-class",
] as const;

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/, "Reload the page into the baseline: Bricks' document digest is missing.");

/** Local/staging sites (private addresses, custom ports) are opt-in for the local server process. */
export const allowPrivateWordPress = () => typeof process !== "undefined" && process.env?.BRICKSSNAP_ALLOW_PRIVATE_WORDPRESS === "true";

/**
 * Returns why an MCP endpoint is not acceptable, or null. Accepts /wp-json/mcp/<server> and the
 * permalink-less form /?rest_route=/mcp/<server>; custom ports only when private sites are allowed.
 */
export function wordpressEndpointProblem(value: string, allowCustomPort = allowPrivateWordPress()): string | null {
  let u: URL;
  try { u = new URL(value); } catch { return "Enter the HTTPS MCP endpoint shown in Bricks → AI."; }
  if (u.protocol !== "https:" || u.username || u.password || u.hash) return "Use an HTTPS MCP endpoint without embedded credentials.";
  if (u.port && u.port !== "443" && !allowCustomPort) return "Use the default HTTPS port; a custom port requires BRICKSSNAP_ALLOW_PRIVATE_WORDPRESS=true (local/staging sites).";
  const pretty = !u.search && /\/wp-json\/mcp\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname);
  const plain = /^\?rest_route=\/mcp\/[a-zA-Z0-9_-]+\/?$/.test(u.search) && /\/$/.test(u.pathname);
  if (!pretty && !plain) return "Use the full MCP endpoint from Bricks → AI, ending in /wp-json/mcp/server-name (or ?rest_route=/mcp/server-name).";
  return null;
}

export const wpCredentialsSchema = z.object({
  endpoint: z.string().trim().url().max(500).superRefine((v, ctx) => {
    const problem = wordpressEndpointProblem(v);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
  username: z.string().trim().min(1).max(100).refine(v => !/[:\r\n]/.test(v), "Username cannot contain colons or line breaks"),
  password: z.string().min(1).max(256).refine(v => !/[\r\n]/.test(v), "Password cannot contain line breaks"),
}).strict();

export type WordPressCredentials = z.infer<typeof wpCredentialsSchema>;

// The server derives every value from the kit's choices; no CSS reaches the site from the request.
const kitSchema = z.object({
  style: z.enum(STYLE_IDS), primary: z.string().max(20), accent: z.string().max(20).optional(), fonts: z.enum(FONT_PAIR_IDS),
  radius: z.enum(RADIUS_IDS), spacing: z.enum(SPACING_IDS), mode: z.enum(["light", "dark"]),
}).partial().strict();

export const wpRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("connect"), credentials: wpCredentialsSchema }).strict(),
  // An empty search lists recently modified Bricks content.
  z.object({ action: z.literal("search"), credentials: wpCredentialsSchema, search: z.string().trim().max(200) }).strict(),
  z.object({ action: z.literal("page"), credentials: wpCredentialsSchema, postId: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("design"), credentials: wpCredentialsSchema }).strict(),
  // Let Bricks render the saved page and a proposal without saving (read-only).
  z.object({ action: z.literal("render"), credentials: wpCredentialsSchema, postId: z.number().int().positive(), template: z.unknown() }).strict(),
  // Copy external images of a proposal into the site's media library and point the settings at them.
  z.object({ action: z.literal("media"), credentials: wpCredentialsSchema, template: z.unknown(), confirm: z.literal(true) }).strict(),
  // Create the global classes a proposal uses but the site lacks (additive; existing classes are never changed).
  z.object({ action: z.literal("classes"), credentials: wpCredentialsSchema, template: z.unknown(), confirm: z.literal(true) }).strict(),
  // Bring the site's BricksSnap (bs-) classes to the proposal's definitions, or back to earlier ones (undo).
  z.object({
    action: z.literal("update-classes"), credentials: wpCredentialsSchema, confirm: z.literal(true),
    classes: z.array(z.object({ name: z.string().regex(/^bs-[a-z0-9_-]+$/).max(120), settings: z.record(z.string(), z.unknown()) }).strict()).min(1).max(200),
  }).strict(),
  // The site's Bricks templates (header, footer, section, …), optionally of one type.
  z.object({ action: z.literal("templates"), credentials: wpCredentialsSchema, type: z.enum(TEMPLATE_TYPES).optional() }).strict(),
  z.object({ action: z.literal("template-conditions"), credentials: wpCredentialsSchema, templateId: z.number().int().positive() }).strict(),
  // Replace a template's conditions only while the stored ones still equal those the user edited.
  z.object({
    action: z.literal("set-conditions"), credentials: wpCredentialsSchema, templateId: z.number().int().positive(),
    conditions: templateConditionsSchema, expectedConditions: templateConditionsSchema, confirm: z.literal(true),
  }).strict(),
  // Create a template from a reviewed proposal (draft unless publishing is chosen).
  z.object({
    action: z.literal("create-template"), credentials: wpCredentialsSchema, title: z.string().trim().min(1).max(200),
    type: z.enum(TEMPLATE_TYPES), status: z.enum(["draft", "publish"]).default("draft"), template: z.unknown(), confirm: z.literal(true),
  }).strict(),
  // Replace the page's elements only if Bricks' stored document still has the reviewed baseline digest.
  z.object({
    action: z.literal("apply"), credentials: wpCredentialsSchema, postId: z.number().int().positive(),
    expectedDocumentDigest: digestSchema, template: z.unknown(), confirm: z.literal(true), allowLocked: z.boolean().default(false),
  }).strict(),
  // Compare the Studio kit's palette and variables with the site (read-only), or install them.
  z.object({ action: z.literal("design-system-plan"), credentials: wpCredentialsSchema, kit: kitSchema, label: z.string().max(120).optional() }).strict(),
  z.object({ action: z.literal("design-system"), credentials: wpCredentialsSchema, kit: kitSchema, label: z.string().max(120).optional(), confirm: z.literal(true) }).strict(),
  // Set back what an install changed (its snapshot), only where nothing was edited since.
  z.object({ action: z.literal("design-system-undo"), credentials: wpCredentialsSchema, snapshot: designSnapshotSchema, confirm: z.literal(true) }).strict(),
  // Remove BricksSnap's palette, variables, manifest and category (preview first; values edited in Bricks only on request).
  z.object({ action: z.literal("design-system-uninstall-plan"), credentials: wpCredentialsSchema, includeModified: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal("design-system-uninstall"), credentials: wpCredentialsSchema, includeModified: z.boolean().default(false), confirm: z.literal(true) }).strict(),
  // Restore the snapshot an apply created, only while the page still has the applied digest.
  z.object({
    action: z.literal("restore"), credentials: wpCredentialsSchema, postId: z.number().int().positive(),
    revisionId: z.number().int().positive(), expectedDocumentDigest: digestSchema, confirm: z.literal(true),
  }).strict(),
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
  bricksVersion?: string;
  abilitiesVersion?: string;
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
  abilitiesVersion?: string;
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
  /** Site color palettes ({ id, raw, light }) for generating in the site's design. */
  palettes: Array<{ id: string; name: string; colors: Array<{ id: string; raw?: string; light?: string; name?: string }> }>;
  rawDesignContext?: unknown;
};

export type WordPressApplyResult = {
  postId: number;
  applied: boolean;
  /** Snapshot Bricks captured before saving; pass it to restore. Null when the page was empty. */
  revisionId: number | null;
  documentDigest: string;
  /** The page as read back after saving. */
  template: BricksTemplate;
  source: WordPressSource;
  /** Differences between the reviewed proposal and the read-back page (normalization by Bricks). */
  verification: { matches: boolean; added: number; removed: number; changed: number; moved: number; fields: string[] };
  warnings?: string[];
};

export type WordPressMediaResult = {
  /** The proposal with imported images pointing at the media library. */
  template: BricksTemplate;
  imported: Array<{ source: string; id: number; url: string; reused: boolean }>;
  skipped: Array<{ source: string; reason: string }>;
};

export type WordPressTemplateSummary = { id: number; title: string; type: string; status: string; conditionCount: number };
export type WordPressTemplatesResult = { templates: WordPressTemplateSummary[] };

export type WordPressConditionsResult = {
  templateId: number;
  conditions: TemplateCondition[];
  /** Stored condition fields BricksSnap cannot edit; when present the conditions are read-only here. */
  unsupported: string[];
};

export type WordPressCreateTemplateResult = { templateId: number; status: string; editUrl?: string; warnings: string[] };

export type WordPressClassUpdateResult = {
  /** Classes now on the given definition. */
  updated: Array<{ id: string; name: string }>;
  /** Their definitions before the update, for undo. */
  previous: Array<{ name: string; settings: Record<string, unknown> }>;
  /** Already on the given definition; not written. */
  unchanged: string[];
  /** Not on the site (create them first). */
  missing: string[];
  /** Every updated class read back with the given definition. */
  verified: boolean;
  /** Set when a write was refused partway; earlier updates stay and can be undone. */
  error?: string;
};

export type WordPressClassesResult = {
  /** The proposal with references to reused site classes switched and definitions as the site stores them. */
  template: BricksTemplate;
  created: Array<{ id: string; name: string }>;
  reused: Array<{ id: string; siteId: string; name: string }>;
  /** Same name on the site with a different definition (or duplicate staged names); not created. */
  conflicts: Array<{ id: string; siteId: string; name: string }>;
  /** Referenced class IDs without a definition in the proposal. */
  undefinedIds: string[];
  /** Staged classes whose ID the site uses for another class; created under a new ID. */
  remapped: Array<{ id: string; newId: string; name: string; siteName: string }>;
  /** Same ID and name on the site with another definition; the site's class is kept. */
  mismatched: Array<{ id: string; name: string }>;
};

export type RenderedMarkup = { html: string; css: string };

export type WordPressRenderResult = {
  postId: number;
  /** The page as currently saved, rendered by Bricks. */
  before: RenderedMarkup;
  /** The proposal rendered by Bricks without saving. */
  after: RenderedMarkup;
  /** Bricks' frontend stylesheet on the site, for rendering the markup outside WordPress. */
  stylesheets: string[];
  siteUrl: string;
};

export type WordPressRestoreResult = {
  postId: number;
  restored: boolean;
  fromRevisionId: number;
  /** Snapshot of the state before the restore, so the restore itself can be undone in Bricks. */
  newRevisionId?: number;
  documentDigest: string;
  template: BricksTemplate;
  source: WordPressSource;
};

export type WordPressDesignSystemResult = {
  installed: boolean;
  palette: { name: string; exists: boolean; create: number; update: number; unchanged: number };
  category: { name: string; create: boolean };
  variables: { create: number; update: number; unchanged: number };
  /** CSS variables already defined by another palette or variable; left alone. */
  conflicts: string[];
  changes: DesignSystemChange[];
  /** After an install: every color and variable read back with its value. */
  verified?: boolean;
  fonts: string[];
  warnings: string[];
  /** The manifest on the site, and whether this install writes (or rewrote) it. */
  manifest: { current: ManifestSummary | null; write: boolean };
  /** The replaced values, for undo; also returned when a write failed halfway. */
  snapshot?: DesignSnapshot;
  /** A write failed after the install started; some changes may be saved. */
  failed?: string;
};

export type ManifestSummary = { app: string; installedAt: string; label?: string; style: string; primary: string };

export type WordPressDesignSystemRevertResult = {
  done: boolean;
  verified: boolean;
  restored: number;
  removed: number;
  palette: boolean;
  category: boolean;
  /** Left alone: edited after the install, or already gone. */
  skipped: Array<{ name: string; reason: "changed" | "missing" }>;
};

export type WordPressDesignSystemUninstallResult = {
  manifest: ManifestSummary | null;
  colors: number;
  variables: number;
  palette: boolean;
  category: boolean;
  /** Values that differ from what the recorded kit installs; kept unless included. */
  modified: string[];
  /** bs- global classes on the site (kept). */
  classes: number;
  done: boolean;
  verified?: boolean;
  removed?: number;
  skipped?: Array<{ name: string; reason: "changed" | "missing" }>;
};
