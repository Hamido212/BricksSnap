import { wrapTemplate, type BricksElement, type BricksTemplate } from "./bricks-engine";
import { BRICKS_ELEMENT_NAMES } from "./bricks-validator";
import { templateWarnings } from "./template-warnings";
import { resolveElementCss } from "./bricks-css";

export type InsertPosition = { mode: "prepend" | "append" } | { mode: "after"; afterId: string };
export type ElementDelta = { id: string; name: string; label: string; status: "added" | "removed" | "changed" | "moved"; fields: string[] };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/** Stable comparison of JSON data; deliberately not a WordPress concurrency token. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}

/** Staging is strict: silently repairing an existing page would alter the baseline. */
export function readStagingTemplate(input: unknown, allowEmpty = false): BricksTemplate {
  const stack: Array<[unknown, number]> = [[input, 0]];
  while (stack.length) {
    const [value, depth] = stack.pop()!;
    if (depth > 80) throw new Error("Template data is nested too deeply.");
    if (value && typeof value === "object") for (const child of Object.values(value)) stack.push([child, depth + 1]);
  }
  if ((JSON.stringify(input)?.length ?? 0) > 2_000_000) throw new Error("Use a template smaller than 2 MB.");
  const raw = Array.isArray(input) ? { content: input } : input;
  if (!object(raw) || !Array.isArray(raw.content)) throw new Error("Expected an element array or a template with content.");
  const template = { ...wrapTemplate([]), ...structuredClone(raw) } as BricksTemplate;
  if ((!allowEmpty && !template.content.length) || template.content.length > 1500) throw new Error("Use 1–1500 elements (an empty baseline is allowed).");
  const byId = new Map<string, BricksElement>();
  for (const el of template.content) {
    if (!object(el) || typeof el.id !== "string" || !/^[a-z0-9]{6}$/.test(el.id) || byId.has(el.id)) throw new Error("Element IDs must be unique six-character lowercase letters/digits. Validate and repair the file before staging.");
    if (typeof el.name !== "string" || (!BRICKS_ELEMENT_NAMES.has(el.name) && typeof el.cid !== "string")) throw new Error(`Unsupported element ${el.id}.`);
    if (el.label !== undefined && typeof el.label !== "string") throw new Error(`Invalid label on ${el.id}.`);
    if (el.cid !== undefined && (typeof el.cid !== "string" || !el.cid)) throw new Error(`Invalid component reference on ${el.id}.`);
    if (!object(el.settings) || !Array.isArray(el.children) || el.children.some(id => typeof id !== "string") || new Set(el.children).size !== el.children.length) throw new Error(`Invalid settings or children on ${el.id}.`);
    if (el.parent !== 0 && typeof el.parent !== "string") throw new Error(`Invalid parent on ${el.id}.`);
    byId.set(el.id, el);
  }
  const renderedIds = new Set<string>();
  for (const el of template.content) {
    const cssId = el.settings._cssId;
    if (cssId !== undefined && (typeof cssId !== "string" || !/^[a-zA-Z_][\w-]*$/.test(cssId))) throw new Error(`Invalid CSS ID on ${el.id}.`);
    const renderedId = typeof cssId === "string" ? cssId : `brxe-${el.id}`;
    if (renderedIds.has(renderedId)) throw new Error(`Duplicate CSS ID ${renderedId}.`);
    renderedIds.add(renderedId);
    if (el.parent !== 0 && !byId.get(el.parent)?.children.includes(el.id)) throw new Error(`Parent/children mismatch on ${el.id}. Repair explicitly before staging.`);
    for (const id of el.children) if (byId.get(id)?.parent !== el.id) throw new Error(`Child/parent mismatch on ${el.id}.`);
    const seen = new Set([el.id]);
    let parent = el.parent;
    while (parent !== 0) {
      if (seen.has(parent) || seen.size > 80) throw new Error("The element tree contains a cycle or is too deep.");
      const ancestor = byId.get(parent);
      if (!ancestor) throw new Error(`Missing parent ${parent}.`);
      seen.add(parent); parent = ancestor.parent;
    }
  }
  for (const key of ["globalClasses", "globalElements", "components"]) {
    const entries = template[key];
    if (entries === undefined) continue;
    if (!Array.isArray(entries)) throw new Error(`${key} must be an array.`);
    const ids = new Set<string>();
    for (const entry of entries) {
      if (!object(entry) || typeof entry.id !== "string" || !entry.id || ids.has(entry.id)) throw new Error(`${key} requires unique nonempty string IDs.`);
      ids.add(entry.id);
    }
  }
  return template;
}

function combineDependencies(before: unknown[], incoming: unknown[], key: string): unknown[] {
  const result = structuredClone(before);
  for (const value of incoming) {
    const entry = value as Record<string, unknown>;
    const existing = result.find(v => (v as Record<string, unknown>).id === entry.id);
    if (existing && stableJson(existing) !== stableJson(entry)) throw new Error(`Conflicting ${key} definition: ${entry.id}. Resolve the conflict before merging.`);
    if (!existing) {
      if (key === "globalClasses" && entry.name && result.some(v => (v as Record<string, unknown>).name === entry.name)) throw new Error(`Global class name collision: ${entry.name}.`);
      result.push(structuredClone(entry));
    }
  }
  return result;
}

function referencesId(value: unknown, ids: Map<string, string>): boolean {
  if (typeof value === "string") return [...ids.keys()].some(id => value === id || value.includes(`#brxe-${id}`));
  if (value && typeof value === "object") return Object.values(value).some(v => referencesId(v, ids));
  return false;
}

export function mergeTemplates(baseline: unknown, addition: unknown, position: InsertPosition) {
  const before = readStagingTemplate(baseline, true);
  const incoming = readStagingTemplate(addition);
  if (before.content.length + incoming.content.length > 1500) throw new Error("Merged page exceeds 1500 elements.");
  if (!["append", "prepend", "after"].includes(position.mode)) throw new Error("Unknown insertion position.");
  const roots = before.content.filter(el => el.parent === 0);
  const afterIndex = position.mode === "after" ? roots.findIndex(el => el.id === position.afterId) : -1;
  if (position.mode === "after" && afterIndex < 0) throw new Error("Choose an existing top-level section to insert after.");
  // Reserve incoming IDs as well: generated replacements cannot collide with a later incoming node.
  const occupied = new Set([...before.content, ...incoming.content].map(el => el.id));
  const existingIds = new Set(before.content.map(el => el.id));
  const remapped = new Map<string, string>();
  let counter = 1;
  for (const el of incoming.content) if (existingIds.has(el.id)) {
    let id: string;
    do { id = (counter++).toString(36).padStart(6, "0"); } while (occupied.has(id));
    occupied.add(id); remapped.set(el.id, id);
  }
  const newElements = incoming.content.map(el => {
    const { _cssCustom, link, ...otherSettings } = el.settings;
    const { id, parent, children, settings: _settings, ...otherFields } = el;
    void _settings;
    if (referencesId(otherSettings, remapped) || referencesId(otherFields, remapped)) throw new Error(`Element ${id} contains an ambiguous reference to a colliding ID. Rename it explicitly before merging.`);
    const css = typeof _cssCustom === "string" ? _cssCustom.replace(/#brxe-([a-z0-9]{6})(?![\w-])/g, (selector, old: string) => remapped.has(old) ? `#brxe-${remapped.get(old)}` : selector) : _cssCustom;
    let updatedLink = link;
    if (object(link) && typeof link.url === "string" && /^#brxe-[a-z0-9]{6}$/.test(link.url)) {
      const target = remapped.get(link.url.slice(6));
      if (target) updatedLink = { ...link, url: `#brxe-${target}` };
    } else if (referencesId(link, remapped)) throw new Error(`Unsupported link reference on ${id}. Resolve it before merging.`);
    return { ...el, id: remapped.get(id) ?? id, parent: parent === 0 ? 0 : remapped.get(parent) ?? parent, children: children.map(child => remapped.get(child) ?? child), settings: { ...otherSettings, ...(_cssCustom !== undefined ? { _cssCustom: css } : {}), ...(link !== undefined ? { link: updatedLink } : {}) } } as BricksElement;
  });
  const metadata = { ...before };
  const fileKeys = new Set(["content", "source", "sourceUrl", "version", "title", "name", "type", "templateType", "date", "author"]);
  for (const [key, value] of Object.entries(incoming)) {
    if (fileKeys.has(key)) continue;
    if (["__proto__", "prototype", "constructor"].includes(key)) throw new Error(`Unsupported template metadata: ${key}.`);
    if (referencesId(value, remapped)) throw new Error(`Metadata ${key} contains references to colliding element IDs.`);
    if (["globalClasses", "globalElements", "components"].includes(key)) metadata[key] = combineDependencies((before[key] as unknown[]) ?? [], value as unknown[], key);
    else if (before[key] === undefined) metadata[key] = structuredClone(value);
    else if (stableJson(before[key]) !== stableJson(value)) throw new Error(`Conflicting template metadata: ${key}.`);
  }
  const nextRoot = roots[afterIndex + 1];
  const index = position.mode === "prepend" ? 0 : position.mode === "append" || !nextRoot ? before.content.length : before.content.findIndex(el => el.id === nextRoot.id);
  const template = readStagingTemplate({ ...metadata, content: [...before.content.slice(0, index), ...resolveElementCss(newElements), ...before.content.slice(index)] });
  const warnings = [...templateWarnings(template.content), "Structure comparison only: review rendering, dynamic data, links and forms in Bricks before publishing."];
  if (remapped.size) warnings.push(`${remapped.size} incoming element IDs were remapped to avoid collisions. Existing elements were preserved.`);
  const classes = new Set(template.globalClasses.map(c => c.id));
  for (const el of template.content) {
    if (Array.isArray(el.settings._cssGlobalClasses) && el.settings._cssGlobalClasses.some(id => !classes.has(id))) warnings.push(`Element ${el.id} needs global classes already present on the destination site.`);
    if (el.cid) warnings.push(`Component ${el.cid} needs a compatible definition on the destination site.`);
  }
  return { template, diff: diffTemplates(before, template), remappedIds: Object.fromEntries(remapped), warnings: [...new Set(warnings)] };
}

export function diffTemplates(baseline: unknown, proposal: unknown) {
  const before = readStagingTemplate(baseline, true);
  const after = readStagingTemplate(proposal, true);
  const old = new Map(before.content.map(el => [el.id, el]));
  const current = new Map(after.content.map(el => [el.id, el]));
  const deltas: ElementDelta[] = [];
  const siblings = (template: BricksTemplate, el: BricksElement) => (el.parent === 0 ? template.content.filter(e => e.parent === 0).map(e => e.id) : template.content.find(e => e.id === el.parent)!.children).filter(id => old.has(id) && current.has(id));
  for (const el of [...after.content, ...before.content.filter(el => !current.has(el.id))]) {
    const previous = old.get(el.id);
    let status: ElementDelta["status"] | undefined;
    const fields: string[] = [];
    if (!previous) status = "added";
    else if (!current.has(el.id)) status = "removed";
    else {
      for (const key of new Set([...Object.keys(previous), ...Object.keys(el)])) if (stableJson(previous[key]) !== stableJson(el[key])) fields.push(key);
      const moved = previous.parent !== el.parent || siblings(before, previous).indexOf(el.id) !== siblings(after, el).indexOf(el.id);
      if (fields.length) status = "changed";
      else if (moved) status = "moved";
      if (moved) fields.push("position");
    }
    if (status) deltas.push({ id: el.id, name: el.name, label: el.label || el.name, status, fields });
  }
  const metadata = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => key !== "content" && stableJson(before[key]) !== stableJson(after[key]));
  return { elements: deltas, metadata, counts: { added: deltas.filter(e => e.status === "added").length, removed: deltas.filter(e => e.status === "removed").length, changed: deltas.filter(e => e.status === "changed").length, moved: deltas.filter(e => e.status === "moved").length, unchanged: after.content.length - deltas.filter(e => e.status !== "removed").length } };
}
