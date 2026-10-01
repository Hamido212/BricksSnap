import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TEMPLATES } from "./templates";
import { wrapTemplate } from "./bricks-engine";
import { buildBricksImportJson } from "./bricks-export";
import { BRICKS_SYSTEM_PROMPT } from "./bricks-prompt";
import { importTemplate } from "./template-import";
import schema from "../data/bricks-schema.json";
import { generateMcpPage } from "./mcp-generation";
import { COLOR_PALETTES, SECTION_TYPES, STYLE_PRESETS } from "./presets";
import { diffTemplates, mergeTemplates } from "./template-staging";
import packageJson from "../../package.json";
import { generateKitTemplate, kitCatalog, kitTemplateType } from "./kit/generate";
import { SECTION_TYPES as KIT_SECTION_TYPES } from "./kit/sections";
import { FONT_PAIR_IDS, RADIUS_IDS, SPACING_IDS, STYLE_IDS } from "./kit/tokens";
import { INDUSTRY_IDS } from "./kit/content";
import { modernizeTemplate } from "./modernize";

// Default import: webpack no longer supports named exports from JSON modules.
const { version } = packageJson;

/** Stateless local computation only. No provider keys, files, WordPress access or saved user data. */
export function createMcpServer() {
  const server = new McpServer({ name: "BricksSnap", version });
  const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  const reply = (value: Record<string, unknown>) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: value });
  const safely = (fn: () => Record<string, unknown>) => {
    try { return reply(fn()); }
    catch (error) { return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : "Invalid template" }], isError: true }; }
  };
  server.registerTool("bricks_get_schema", {
    description: "Get instructions for creating editable native Bricks 2.4 JSON. Use your own reasoning to design elements, then call bricks_validate_template. No separate OpenAI API key is used.",
    inputSchema: { element: z.string().max(100).optional().describe("Optional native element name to list its documented control names.") }, annotations,
  }, async ({ element }) => {
    const entry = element ? schema.elements[element as keyof typeof schema.elements] : undefined;
    if (element && !entry) return { content: [{ type: "text", text: "Unknown native element name." }], isError: true };
    return reply({ instructions: BRICKS_SYSTEM_PROMPT, schemaTarget: "2.4.1", schemaIndex: schema.source,
      ...(entry ? { element, controls: [...schema.commonControls, ...entry.controls], valueSchemaUrl: `https://academy.bricksbuilder.io/schema-resolved/elements/${element}.json` } : {}),
      importVerification: "Check the result in your installed Bricks version before publishing." });
  });
  server.registerTool("bricks_list_templates", {
    description: "List BricksSnap's built-in template catalog. Pure local lookup; no WordPress connection.",
    inputSchema: { search: z.string().max(200).optional() }, annotations,
  }, async ({ search }) => reply({ templates: TEMPLATES.filter(t => !search || `${t.name} ${t.description} ${t.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())).map(({ id, name, description, category }) => ({ id, name, description, category })), sectionTypes: SECTION_TYPES.map(({ id, name }) => ({ id, name })), stylePresets: STYLE_PRESETS.map(({ id, name }) => ({ id, name })), colorPalettes: COLOR_PALETTES.map(({ id, name }) => ({ id, name })) }));
  server.registerTool("bricks_get_template", {
    description: "Generate a fresh built-in template by catalog ID. Returns editable elements and a Bricks import file object; does not save or publish anything.",
    inputSchema: { id: z.string().max(100) }, annotations: { ...annotations, idempotentHint: false },
  }, async ({ id }) => {
    const entry = TEMPLATES.find(t => t.id === id);
    if (!entry) return { content: [{ type: "text", text: "Unknown template ID. Use bricks_list_templates." }], isError: true };
    return reply({ template: buildBricksImportJson(wrapTemplate(entry.generator()), entry.name, entry.category === "fullpage" ? "content" : "section") });
  });
  server.registerTool("bricks_validate_template", {
    description: "Validate and repair Bricks JSON designed in this chat. Pass a JSON string containing an element array or a template with content and globalClasses. Returns warnings and an import object. Does not execute code, store content, call paid AI APIs, or publish to WordPress. Return the template to the user as a JSON file for import into BricksSnap or Bricks.",
    inputSchema: { json: z.string().max(2_000_000), title: z.string().max(120).default("ChatGPT Template"), type: z.enum(["section", "content", "header", "footer"]).default("section") }, annotations,
  }, async ({ json, title, type }) => {
    try {
      const result = importTemplate(JSON.parse(json));
      return reply({ template: buildBricksImportJson(result.template, title, type), warnings: result.warnings });
    } catch (error) {
      return { content: [{ type: "text", text: error instanceof Error ? error.message : "Invalid template" }], isError: true };
    }
  });
  const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  const generationSchema = {
    prompt: z.string().min(1).max(4000), stylePreset: z.string().max(100).optional(), colorPalette: z.string().max(100).optional(),
    colors: z.object({ primary: hex, secondary: hex, accent: hex, background: hex, surface: hex, text: hex, heading: hex, muted: hex, border: hex }).partial().strict().optional()
      .describe("Optional role colors (hex), e.g. from a site's palette via bricks/list-color-palettes; they override colorPalette."),
  };
  server.registerTool("bricks_generate_section", {
    description: "Generate one editable native section using BricksSnap's built-in generators, optional preset/palette IDs from bricks_list_templates, or explicit role colors. Prompt keyword detection uses sample content; this is not an AI provider call or live preview.",
    inputSchema: { ...generationSchema, section: z.string().max(100) }, annotations: { ...annotations, idempotentHint: false },
  }, async ({ section, ...input }) => safely(() => generateMcpPage({ ...input, sections: [section] })));
  server.registerTool("bricks_assemble_page", {
    description: "Generate an ordered page of 1–12 built-in section types with shared preset/palette. Returns a template and content warnings. No files or WordPress writes.",
    inputSchema: { ...generationSchema, sections: z.array(z.string().max(100)).min(1).max(12) }, annotations: { ...annotations, idempotentHint: false },
  }, async input => safely(() => generateMcpPage(input)));
  server.registerTool("bricks_kit_options", {
    description: "List the template kit's choices: style directions, font pairs, radius, spacing, industries with ready-made German and English copy, every section type with its layout variants, and the ready-made designs (kit plus page). Use them with bricks_kit_page.",
    inputSchema: {}, annotations,
  }, async () => reply(kitCatalog()));
  server.registerTool("bricks_kit_page", {
    description: "Build modern sections or a whole page from the template kit, without an AI call: pick section types and layout variants, a brand kit (style, primary color, fonts, radius, spacing, light/dark) and a business profile (industry, language de/en, name, city, phone, services). Returns a Bricks import object whose styling lives in bs- global classes with var(--bs-*, fallback) values, the design system (palette colors and global variables) for central editing in Bricks, and quality checks (contrast, headings, alt texts). Sample photos come from Unsplash; nothing is saved or published.",
    inputSchema: {
      sections: z.array(z.object({ type: z.enum(KIT_SECTION_TYPES), variant: z.string().max(40).optional() })).min(1).max(16),
      kit: z.object({ style: z.enum(STYLE_IDS), primary: hex, accent: hex, fonts: z.enum(FONT_PAIR_IDS), radius: z.enum(RADIUS_IDS), spacing: z.enum(SPACING_IDS), mode: z.enum(["light", "dark"]), motion: z.enum(["none", "subtle"]) }).partial().strict().optional(),
      profile: z.object({ industry: z.enum(INDUSTRY_IDS), language: z.enum(["de", "en"]), name: z.string().max(120), city: z.string().max(60), phone: z.string().max(40), email: z.string().max(120), address: z.string().max(160), tagline: z.string().max(160), services: z.array(z.string().max(60)).max(6) }).partial().strict().optional(),
      title: z.string().max(120).default("BricksSnap Kit"),
    }, annotations,
  }, async ({ sections, kit, profile, title }) => safely(() => {
    const result = generateKitTemplate({ kit: kit ?? {}, profile: profile ?? {}, sections });
    const { palette, variables, category, css } = result.designSystem;
    return { template: buildBricksImportJson(result.template, title, kitTemplateType(sections)), designSystem: { palette, variables, category, css, fonts: result.designSystem.fonts }, quality: result.quality };
  }));
  server.registerTool("bricks_modernize_template", {
    description: "Import & Modernize: rebuild any Bricks JSON (a copied section, a template export, a library component the user may use) on the BricksSnap design system. Colors become design tokens by role (brand colors → primary/accent), font sizes, spacing and radii land on the token scale (px, rem at 62.5%, Automatic CSS / Core Framework variables), each element's styles move into one deduplicated bs-<block>-<role> global class, and missing mobile rules are added. Optional brand kit restyles it. Returns a Bricks import object, the design system, a report of every change and quality checks. Pure local computation; nothing is fetched or saved.",
    inputSchema: {
      json: z.string().max(2_000_000).describe("Bricks JSON: an element array, copied elements ({content, globalClasses}) or a template export."),
      kit: z.object({ style: z.enum(STYLE_IDS), primary: hex, accent: hex, fonts: z.enum(FONT_PAIR_IDS), radius: z.enum(RADIUS_IDS), spacing: z.enum(SPACING_IDS), mode: z.enum(["light", "dark"]), motion: z.enum(["none", "subtle"]) }).partial().strict().optional(),
      block: z.string().max(24).regex(/^[a-z0-9-]*$/).optional().describe("Class prefix after bs- (default: from the first heading)."),
      title: z.string().max(120).default("Modernized section"),
    }, annotations,
  }, async ({ json, kit, block, title }) => safely(() => {
    const result = modernizeTemplate(JSON.parse(json), { kit: kit ?? {}, ...(block ? { block } : {}) });
    const roots = result.template.content.filter(el => el.parent === 0).length;
    const { palette, variables, category, css, fonts } = result.designSystem;
    return { template: buildBricksImportJson(result.template, title, roots > 1 ? "content" : "section"), designSystem: { palette, variables, category, css, fonts }, report: result.report, quality: result.quality };
  }));
  server.registerTool("bricks_merge_templates", {
    description: "Stage an additive merge of two strict Bricks JSON templates: prepend, append, or after a top-level element. Preserves existing elements, remaps incoming ID collisions, rejects ambiguous references and dependency conflicts. Returns template, structural diff and warnings. Review in Bricks before publishing; never writes to WordPress.",
    inputSchema: { baseline: z.string().max(1_000_000), addition: z.string().max(1_000_000), position: z.enum(["prepend", "append", "after"]).default("append"), afterId: z.string().regex(/^[a-z0-9]{6}$/).optional() }, annotations,
  }, async ({ baseline, addition, position, afterId }) => safely(() => mergeTemplates(JSON.parse(baseline), JSON.parse(addition), position === "after" ? { mode: "after", afterId: afterId ?? "" } : { mode: position })));
  server.registerTool("bricks_compare_templates", {
    description: "Compare two strict Bricks templates by stable element ID: added, removed, changed and moved elements plus metadata changes. A structural comparison, not a rendered preview or a WordPress concurrency check.",
    inputSchema: { baseline: z.string().max(1_000_000), proposal: z.string().max(1_000_000) }, annotations,
  }, async ({ baseline, proposal }) => safely(() => diffTemplates(JSON.parse(baseline), JSON.parse(proposal))));
  return server;
}
