import type { BricksGlobalClass, BricksTemplate } from "./bricks-engine";
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
};

const definition = (cls: Pick<BricksGlobalClass, "settings"> & { selectors?: unknown }) =>
  stableJson({ settings: cls.settings ?? {}, selectors: Array.isArray(cls.selectors) && cls.selectors.length ? cls.selectors : [] });

/** Decide per referenced class that is missing on the site whether to create it, reuse a site class, or stop. */
export function planGlobalClasses(proposal: BricksTemplate, siteClasses: BricksGlobalClass[]): ClassPlan {
  const siteIds = new Set(siteClasses.map(c => c.id));
  const siteByName = new Map(siteClasses.map(c => [c.name, c]));
  const staged = new Map((proposal.globalClasses ?? []).map(c => [c.id, c]));
  const plan: ClassPlan = { create: [], reuse: [], conflicts: [], undefinedIds: [] };
  const creating = new Set<string>();

  for (const id of referencedClassIds(proposal)) {
    if (siteIds.has(id)) continue;
    const cls = staged.get(id);
    if (!cls) { plan.undefinedIds.push(id); continue; }
    const named = siteByName.get(cls.name);
    if (named) {
      (definition(named) === definition(cls) ? plan.reuse : plan.conflicts).push({ id, siteId: named.id, name: cls.name });
    } else if (creating.has(cls.name)) {
      // Two staged IDs with one name: Bricks requires unique names.
      plan.conflicts.push({ id, siteId: "", name: cls.name });
    } else {
      creating.add(cls.name);
      const selectors = (cls as { selectors?: unknown }).selectors;
      // Category IDs belong to the source site; other stored fields are Bricks bookkeeping.
      plan.create.push({ id, name: cls.name, settings: cls.settings ?? {}, ...(Array.isArray(selectors) && selectors.length ? { selectors } : {}) } as BricksGlobalClass);
    }
  }
  return plan;
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
