/**
 * Bricks Builder Schema Validator & Auto-Repair Layer
 * ===================================================
 *
 * This layer sits between raw AI output and the wrapped template we hand
 * to the user. Its responsibilities:
 *
 *   1. Validate that the AI output respects the mandatory Bricks JSON shape
 *      (id / name / parent / children / settings) – this is the "contract"
 *      we give the AI in the system prompt.
 *   2. Repair common AI mistakes WITHOUT discarding creative content:
 *        - Missing / duplicate / malformed ids  -> regenerate
 *        - Wrong parent references               -> fallback to 0 (root)
 *        - Missing children arrays               -> rebuild from parent refs
 *        - Missing settings object               -> {}
 *        - Invalid element names                 -> drop the element
 *        - Sections with parent != 0             -> force to 0
 *   3. Report a list of violations so the API route can log what the AI
 *      got wrong and we can iterate on the prompt.
 *
 * The design philosophy is "repair, don't reject" – we want to preserve
 * AI creative freedom and only drop elements when they are fundamentally
 * unusable (e.g. unknown element name).
 */

import type { BricksElement } from "./bricks-engine";

// ─── Allowed element names (sourced from Bricks Builder docs) ──────────────
export const BRICKS_ELEMENT_NAMES = new Set<string>([
  // Layout
  "section", "container", "block", "div",
  // Basic
  "heading", "text-basic", "text", "rich-text", "button", "icon", "image", "video",
  // General
  "divider", "icon-box", "icon-list", "list", "accordion", "accordion-nested",
  "tabs", "tabs-nested", "form", "map", "alert", "animated-typing",
  "countdown", "counter", "pricing-tables", "progress-bar", "pie-chart",
  "team-members", "testimonials", "code", "template", "logo",
  "facebook-page", "social-icons",
  // Media
  "image-gallery", "audio", "carousel", "slider", "slider-nested", "svg",
  // WordPress
  "posts", "pagination", "nav-menu", "sidebar", "search", "shortcode",
  "post-title", "post-excerpt", "post-meta", "post-content",
  "social-sharing", "related-posts", "author", "comments",
  "taxonomy", "post-navigation",
  // WooCommerce
  "breadcrumbs", "mini-cart", "products", "products-pagination",
  "products-orderby", "products-total-results", "products-filter",
  "products-archive-description",
  "product-title", "product-gallery", "product-short-description",
  "product-price", "product-stock", "product-meta", "product-rating",
  "product-content", "add-to-cart", "related-products",
  "product-additional-information", "product-tabs", "product-upsells",
]);

// Elements that MUST be at the root level (parent === 0)
const ROOT_ONLY_NAMES = new Set<string>(["section"]);

// A Bricks id is always a 6-char lowercase alphanumeric string.
const BRICKS_ID_RE = /^[a-z0-9]{6}$/;

export interface ValidationResult {
  elements: BricksElement[];
  valid: boolean;
  violations: string[];
  stats: {
    total: number;
    dropped: number;
    idsRegenerated: number;
    parentsReset: number;
    childrenRebuilt: number;
    sectionCount: number;
  };
}

function randomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function uniqueId(used: Set<string>): string {
  let id = randomId();
  while (used.has(id)) id = randomId();
  used.add(id);
  return id;
}

/**
 * Validate + auto-repair an array of elements produced by the AI.
 *
 * Returns the cleaned array PLUS a report describing what was fixed.
 * This report is logged server-side so we can iterate on the AI prompt
 * when we see the same mistakes showing up repeatedly.
 */
export function validateBricksElements(input: unknown): ValidationResult {
  const violations: string[] = [];
  const stats = {
    total: 0,
    dropped: 0,
    idsRegenerated: 0,
    parentsReset: 0,
    childrenRebuilt: 0,
    sectionCount: 0,
  };

  if (!Array.isArray(input)) {
    return {
      elements: [],
      valid: false,
      violations: ["Top-level value is not an array"],
      stats,
    };
  }

  stats.total = input.length;
  const usedIds = new Set<string>();
  const cleaned: BricksElement[] = [];

  // ── Pass 1: shape + name + id repair ────────────────────────────────────
  for (let i = 0; i < input.length; i++) {
    const raw = input[i];
    if (!raw || typeof raw !== "object") {
      violations.push(`Element at index ${i} is not an object`);
      stats.dropped++;
      continue;
    }

    const candidate = raw as Partial<BricksElement> & {
      settings?: unknown;
      label?: unknown;
    };

    // Element name – must be from the allowed set
    const name = typeof candidate.name === "string" ? candidate.name : "";
    if (!name || !BRICKS_ELEMENT_NAMES.has(name)) {
      violations.push(`Element at index ${i} has invalid name "${name}" – dropped`);
      stats.dropped++;
      continue;
    }

    // ID – must be 6-char lowercase alphanumeric, unique across the page
    let id = typeof candidate.id === "string" ? candidate.id.toLowerCase() : "";
    if (!BRICKS_ID_RE.test(id)) {
      violations.push(`Element "${name}" at index ${i} had invalid id "${id}" – regenerated`);
      id = uniqueId(usedIds);
      stats.idsRegenerated++;
    } else if (usedIds.has(id)) {
      violations.push(`Element "${name}" at index ${i} had duplicate id "${id}" – regenerated`);
      id = uniqueId(usedIds);
      stats.idsRegenerated++;
    } else {
      usedIds.add(id);
    }

    // Settings – must exist as an object
    let settings: Record<string, unknown>;
    if (candidate.settings && typeof candidate.settings === "object" && !Array.isArray(candidate.settings)) {
      settings = candidate.settings as Record<string, unknown>;
    } else {
      if (candidate.settings !== undefined) {
        violations.push(`Element "${name}" (${id}) had non-object settings – replaced with {}`);
      }
      settings = {};
    }

    // Parent – 0 or a string id (resolved in pass 2)
    const parent: string | 0 =
      candidate.parent === 0 || typeof candidate.parent === "string"
        ? (candidate.parent as string | 0)
        : 0;

    cleaned.push({
      id,
      name,
      parent,
      children: [], // rebuilt in pass 3
      settings,
      ...(typeof candidate.label === "string" ? { label: candidate.label } : {}),
    });
  }

  // ── Pass 2: parent reference repair ─────────────────────────────────────
  const byId = new Map(cleaned.map((el) => [el.id, el]));

  for (const el of cleaned) {
    // Root-only elements (sections) must have parent=0
    if (ROOT_ONLY_NAMES.has(el.name) && el.parent !== 0) {
      violations.push(`Element "${el.name}" (${el.id}) had parent "${el.parent}" – forced to root`);
      el.parent = 0;
      stats.parentsReset++;
    }

    // Non-root elements: parent must either be 0 or reference a known id.
    // If the referenced id doesn't exist in the array, reset to 0 rather
    // than dropping the element (preserves AI creative content).
    if (el.parent !== 0 && !byId.has(el.parent)) {
      violations.push(`Element "${el.name}" (${el.id}) pointed at missing parent "${el.parent}" – reset to root`);
      el.parent = 0;
      stats.parentsReset++;
    }

    // Prevent self-parenting cycles
    if (el.parent === el.id) {
      violations.push(`Element "${el.name}" (${el.id}) was self-parented – reset to root`);
      el.parent = 0;
      stats.parentsReset++;
    }
  }

  // Detect & break parent cycles (A → B → A). This can happen if the AI
  // references ids inconsistently.
  for (const el of cleaned) {
    const seen = new Set<string>([el.id]);
    let cursor: string | 0 = el.parent;
    let safety = 0;
    while (cursor !== 0 && safety < 1000) {
      if (seen.has(cursor)) {
        violations.push(`Parent cycle detected at "${el.id}" – broken by resetting to root`);
        el.parent = 0;
        stats.parentsReset++;
        break;
      }
      seen.add(cursor);
      const parentEl = byId.get(cursor);
      if (!parentEl) break;
      cursor = parentEl.parent;
      safety++;
    }
  }

  // ── Pass 3: rebuild children arrays from parent refs ────────────────────
  for (const el of cleaned) el.children = [];
  for (const el of cleaned) {
    if (el.parent !== 0) {
      const parentEl = byId.get(el.parent);
      if (parentEl && !parentEl.children.includes(el.id)) {
        parentEl.children.push(el.id);
        stats.childrenRebuilt++;
      }
    }
  }

  // ── Count sections + validate we have at least one ──────────────────────
  stats.sectionCount = cleaned.filter((el) => el.parent === 0 && el.name === "section").length;
  if (stats.sectionCount === 0) {
    violations.push("No root-level section element found – AI output is probably unusable");
  }

  return {
    elements: cleaned,
    valid: stats.sectionCount > 0 && cleaned.length > 0,
    violations,
    stats,
  };
}
