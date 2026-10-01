import type { BricksGlobalClass, BricksTemplate } from "./bricks-engine";
import { classId } from "./kit/build";
import { stableJson } from "./template-staging";

/** IDs of global classes the elements use (`_cssGlobalClasses`). */
export function referencedClassIds(template: Pick<BricksTemplate, "content">): string[] {
  const ids = new Set<string>();
  for (const el of template.content) {
    const classes = el.settings._cssGlobalClasses;
    if (Array.isArray(classes)) for (const id of classes) if (typeof id === "string") ids.add(id);
  }
  return [...ids];
}

export type ClassPlan = {
  /** Staged definitions to create on the site, with their IDs kept so element references stay valid. */
  create: BricksGlobalClass[];
  /** Same name and definition already on the site under another ID: elements switch to the site's class. */
  reuse: Array<{ id: string; siteId: string; name: string }>;
  /** Same name on the site with a different definition: never overwritten, nothing is created. */
  conflicts: Array<{ id: string; siteId: string; name: string }>;
  /** Referenced by elements, but neither on the site nor defined in the template. */
  undefinedIds: string[];
  /** The site uses the staged ID for a class with another name: the staged class is created under a new ID. */
  remapped: Array<{ id: string; newId: string; name: string; siteName: string }>;
  /**
   * Same ID and name on the site, but another definition (for example the same class from another
   * BricksSnap design). The site's class is kept; the page shows the site's version.
   */
  mismatched: Array<{ id: string; name: string }>;
};

/** Bricks reformats custom CSS when it stores a class (line breaks, indentation); layout is not a difference. */
const normalizeCss = (css: string) => css.replace(/\s+/g, " ").replace(/\s*([{};])\s*/g, "$1").trim();
const withoutCssLayout = (settings: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, key.startsWith("_cssCustom") && typeof value === "string" ? normalizeCss(value) : value]));

const definition = (cls: Pick<BricksGlobalClass, "settings"> & { selectors?: unknown }) =>
  stableJson({ settings: withoutCssLayout(cls.settings ?? {}), selectors: Array.isArray(cls.selectors) && cls.selectors.length ? cls.selectors : [] });

/** Same definition apart from how Bricks lays out custom CSS. */
export const sameClassDefinition = (a: Pick<BricksGlobalClass, "settings"> & { selectors?: unknown }, b: Pick<BricksGlobalClass, "settings"> & { selectors?: unknown }) => definition(a) === definition(b);

/** Classes BricksSnap owns and may update on a site: its `bs-` design system classes. */
export const isBricksSnapClass = (name: string) => /^bs-[a-z0-9_-]+$/.test(name);

const isPlainObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Settings for Bricks' update-global-class, which merges recursively: keys the target lacks are set
 * to null (Bricks then removes them), nested objects are patched the same way, the rest is replaced.
 */
export function classSettingsPatch(current: Record<string, unknown>, target: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(current)) if (!(key in target)) patch[key] = null;
  for (const [key, value] of Object.entries(target)) {
    const before = current[key];
    if (isPlainObject(before) && isPlainObject(value)) {
      const nested = classSettingsPatch(before, value);
      if (Object.keys(nested).length) patch[key] = nested;
    } else if (stableJson(before) !== stableJson(value)) patch[key] = value;
  }
  return patch;
}

/** A class ID that neither the site nor the change uses, derived from the colliding ID and name. */
function freshId(id: string, name: string, taken: Set<string>): string {
  for (let n = 0; ; n++) {
    const candidate = classId(`remap:${id}:${name}:${n}`);
    if (!taken.has(candidate)) { taken.add(candidate); return candidate; }
  }
}

/**
 * Decide per referenced class whether to create it, reuse a site class, or stop. A class ID alone never
 * proves it is the same class: an ID the site uses for another name is a collision, and the same ID and
 * name with another definition is reported instead of silently taking over the site's styling.
 */
export function planGlobalClasses(proposal: BricksTemplate, siteClasses: BricksGlobalClass[]): ClassPlan {
  const siteById = new Map(siteClasses.map(c => [c.id, c]));
  const siteByName = new Map(siteClasses.map(c => [c.name, c]));
  const staged = new Map((proposal.globalClasses ?? []).map(c => [c.id, c]));
  const plan: ClassPlan = { create: [], reuse: [], conflicts: [], undefinedIds: [], remapped: [], mismatched: [] };
  const creating = new Set<string>();
  const taken = new Set([...siteById.keys(), ...staged.keys()]);

  for (const id of referencedClassIds(proposal)) {
    const cls = staged.get(id);
    const onSite = siteById.get(id);
    if (onSite && !cls) continue; // The change relies on the site's class.
    if (!cls) { plan.undefinedIds.push(id); continue; }
    if (onSite && onSite.name === cls.name) {
      if (definition(onSite) !== definition(cls)) plan.mismatched.push({ id, name: cls.name });
      continue;
    }
    const named = siteByName.get(cls.name);
    if (named) {
      (definition(named) === definition(cls) ? plan.reuse : plan.conflicts).push({ id, siteId: named.id, name: cls.name });
    } else if (creating.has(cls.name)) {
      // Two staged IDs with one name: Bricks requires unique names.
      plan.conflicts.push({ id, siteId: "", name: cls.name });
    } else {
      creating.add(cls.name);
      const newId = onSite ? freshId(id, cls.name, taken) : id;
      if (onSite) plan.remapped.push({ id, newId, name: cls.name, siteName: onSite.name });
      const selectors = (cls as { selectors?: unknown }).selectors;
      // Category IDs belong to the source site; other stored fields are Bricks bookkeeping.
      plan.create.push({ id: newId, name: cls.name, settings: cls.settings ?? {}, ...(Array.isArray(selectors) && selectors.length ? { selectors } : {}) } as BricksGlobalClass);
    }
  }
  return plan;
}

/** Referenced staged classes whose ID the site uses for a class with another name. */
export function foreignClassIds(proposal: BricksTemplate, siteClasses: Array<{ id: string; name: string }>): Array<{ id: string; name: string; siteName: string }> {
  const siteById = new Map(siteClasses.map(c => [c.id, c.name]));
  const referenced = new Set(referencedClassIds(proposal));
  return (proposal.globalClasses ?? []).filter(c => referenced.has(c.id) && siteById.has(c.id) && siteById.get(c.id) !== c.name)
    .map(c => ({ id: c.id, name: c.name, siteName: siteById.get(c.id)! }));
}

/** IDs of classes the site already defines for the change, excluding IDs the site uses for another class name. */
export function knownClassIds(proposal: BricksTemplate, siteClasses: Array<{ id: string; name: string }>): string[] {
  const foreign = new Set(foreignClassIds(proposal, siteClasses).map(f => f.id));
  return siteClasses.map(c => c.id).filter(id => !foreign.has(id));
}

/** Point element references at other class IDs and replace the template's class definitions. */
export function remapGlobalClasses(template: BricksTemplate, ids: Map<string, string>, definitions: BricksGlobalClass[]): BricksTemplate {
  const content = template.content.map(el => {
    const classes = el.settings._cssGlobalClasses;
    if (!Array.isArray(classes) || !classes.some(id => typeof id === "string" && ids.has(id))) return el;
    const mapped = [...new Set(classes.map(id => (typeof id === "string" ? ids.get(id) ?? id : id)))];
    return { ...el, settings: { ...el.settings, _cssGlobalClasses: mapped } };
  });
  const replaced = new Map(definitions.map(c => [c.id, c]));
  const kept = (template.globalClasses ?? []).filter(c => !ids.has(c.id) && !replaced.has(c.id));
  return { ...template, content, globalClasses: [...kept, ...definitions] };
}
