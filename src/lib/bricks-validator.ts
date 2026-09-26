/** Validate native element trees, repair unambiguous references, and report every repair.
 * Unknown elements and ambiguous duplicate IDs fail validation instead of silently losing content.
 * Control names come from the published Bricks schema; this is not a WordPress runtime validator.
 */
import type { BricksElement } from "./bricks-engine";

import { normalizeSettings } from "./bricks-settings";
import schema from "../data/bricks-schema.json";
export const BRICKS_ELEMENT_NAMES = new Set<string>(Object.keys(schema.elements));
const metaControls = new Set(["_cssGlobalClasses", "_conditions", "_interactions", "_hideElementBuilder", "_hideElementFrontend", "_attributes"]);
const controlSets = new Map(Object.entries(schema.elements).map(([name, element]) => [name, new Set([...schema.commonControls, ...element.controls, ...metaControls])]));

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

  if (!Array.isArray(input) || input.length > 1500) {
    return {
      elements: [],
      valid: false,
      violations: ["Expected an array of at most 1500 elements"],
      stats,
    };
  }

  stats.total = input.length;
  const usedIds = new Set<string>();
  const cleaned: BricksElement[] = [];
  const idMap = new Map<string, string>();
  const childOrder = new Map<string, string[]>();
  let ambiguousIds = false;

  // ── Pass 1: shape + name + id repair ────────────────────────────────────
  for (let i = 0; i < input.length; i++) {
    const raw = input[i];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      violations.push(`Element at index ${i} is not an object`);
      stats.dropped++;
      continue;
    }

    const candidate = raw as Partial<BricksElement> & {
      settings?: unknown;
      label?: unknown;
    };

    // Element name – must be from the allowed set
    const component = typeof candidate.cid === "string" && candidate.cid.length > 0;
    const rawName = typeof candidate.name === "string" ? candidate.name : "";
    const name = rawName === "rich-text" ? "text" : rawName;
    if (!component && (!name || !BRICKS_ELEMENT_NAMES.has(name))) {
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
      ambiguousIds = true;
      violations.push(`Element "${name}" at index ${i} had duplicate id "${id}" – regenerated`);
      id = uniqueId(usedIds);
      stats.idsRegenerated++;
    } else {
      usedIds.add(id);
    }

    const oldId = typeof candidate.id === "string" ? candidate.id : "";
    if (oldId) {
      if (idMap.has(oldId)) ambiguousIds = true;
      else idMap.set(oldId, id);
    }
    childOrder.set(id, Array.isArray(candidate.children) ? candidate.children.filter((x): x is string => typeof x === "string") : []);

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

    const normalized = normalizeSettings(name, settings);
    settings = normalized.settings;
    for (const change of normalized.changes) violations.push(`Element "${name}" (${id}): ${change}`);
    const allowed = controlSets.get(name);
    if (allowed) {
      const unknown = Object.keys(settings).filter(key => !allowed.has(key.split(":")[0]));
      if (unknown.length) violations.push(`Element "${name}" (${id}) uses undocumented controls: ${unknown.join(", ")}. Retained for review.`);
    }

    // Parent – 0 or a string id (resolved in pass 2)
    const parent: string | 0 =
      candidate.parent === 0 || typeof candidate.parent === "string"
        ? (candidate.parent as string | 0)
        : 0;

    cleaned.push({
      ...candidate,
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
    if (el.parent !== 0) el.parent = idMap.get(el.parent) ?? el.parent;

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
    while (cursor !== 0) {
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

  // Keep the original visual order, even when the flat array uses a different order.
  for (const el of cleaned) {
    const order = (childOrder.get(el.id) ?? []).map(id => idMap.get(id) ?? id);
    el.children.sort((a, b) => {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
    });
  }
  if (ambiguousIds) violations.push("Duplicate source IDs are ambiguous; fix them before exporting.");

  // Root elements may also be standalone buttons, headers, or component instances.
  stats.sectionCount = cleaned.filter((el) => el.parent === 0 && el.name === "section").length;


  return {
    elements: cleaned,
    valid: !ambiguousIds && stats.dropped === 0 && cleaned.length > 0 && cleaned.some(el => el.parent === 0),
    violations,
    stats,
  };
}
