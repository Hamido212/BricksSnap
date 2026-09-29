import { z } from "zod";

/** Template types a BricksSnap user can create; conditions decide where Bricks uses them. */
export const TEMPLATE_TYPES = ["header", "footer", "section", "content", "popup", "archive", "search", "error"] as const;
export type TemplateType = typeof TEMPLATE_TYPES[number];

const slug = z.string().regex(/^[a-z0-9_-]{1,40}$/, "Use post type slugs such as page or post.");

/** One Bricks template condition as set-template-conditions accepts it (Bricks 2.4.2 schema). */
export const templateConditionSchema = z.object({
  main: z.enum(["any", "frontpage", "postType", "archiveType", "search", "error", "terms", "ids"]),
  postType: z.array(slug).max(50).optional(),
  archiveType: z.array(z.enum(["any", "postType", "author", "date", "term"])).max(5).optional(),
  archivePostTypes: z.array(slug).max(50).optional(),
  archiveTerms: z.array(z.string().regex(/^[a-z0-9_-]+::([0-9]+|all)$/, "Use terms such as category::5 or category::all.")).max(100).optional(),
  archiveTermsIncludeChildren: z.boolean().optional(),
  terms: z.array(z.string().regex(/^[a-z0-9_-]+::[0-9]+$/, "Use terms such as category::5.")).max(100).optional(),
  ids: z.array(z.number().int().positive()).max(200).optional(),
  idsIncludeChildren: z.boolean().optional(),
  hookName: z.string().regex(/^[a-zA-Z0-9_]{1,100}$/).optional(),
  hookPriority: z.number().int().min(-1000).max(1000).optional(),
  exclude: z.boolean().optional(),
}).strict();

export type TemplateCondition = z.infer<typeof templateConditionSchema>;
export const templateConditionsSchema = z.array(templateConditionSchema).max(50);

const EDITABLE = new Set(Object.keys(templateConditionSchema.shape));

/**
 * Stored conditions as BricksSnap can edit them. Bricks stores a row `id` per condition, which
 * set-template-conditions does not take. Anything else unknown makes the set read-only here,
 * so saving never drops settings BricksSnap does not understand.
 */
export function readTemplateConditions(settings: unknown): { conditions: TemplateCondition[]; unsupported: string[] } {
  const rows = settings && typeof settings === "object" && !Array.isArray(settings) ? (settings as Record<string, unknown>).templateConditions : undefined;
  if (!Array.isArray(rows)) return { conditions: [], unsupported: [] };
  const conditions: TemplateCondition[] = [];
  const unsupported = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) { unsupported.add("non-object condition"); continue; }
    const { id: _id, ...rest } = row as Record<string, unknown>;
    void _id;
    // Bricks keeps legacy hook conditions as main=hook with a hookName; the ability normalizes them to any.
    if (rest.main === "hook" && typeof rest.hookName === "string") rest.main = "any";
    // Numeric IDs are sometimes stored as strings.
    if (Array.isArray(rest.ids)) rest.ids = rest.ids.map(value => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));
    for (const key of Object.keys(rest)) if (!EDITABLE.has(key)) unsupported.add(key);
    const parsed = templateConditionSchema.safeParse(Object.fromEntries(Object.entries(rest).filter(([key, value]) => EDITABLE.has(key) && value !== "" && value !== null)));
    if (parsed.success) conditions.push(parsed.data);
    else unsupported.add(`${String(rest.main ?? "unknown")} condition`);
  }
  return { conditions, unsupported: [...unsupported] };
}

const list = (values?: Array<string | number>) => (values?.length ? values.join(", ") : "");

/** Plain-language summary of one condition. */
export function describeCondition(condition: TemplateCondition): string {
  let text: string;
  switch (condition.main) {
    case "any": text = "Entire website"; break;
    case "frontpage": text = "Front page"; break;
    case "search": text = "Search results"; break;
    case "error": text = "404 error page"; break;
    case "postType": text = condition.postType?.length ? `Post types: ${list(condition.postType)}` : "All post types"; break;
    case "archiveType": {
      const parts = (condition.archiveType ?? []).map(type => type === "postType" && condition.archivePostTypes?.length ? `post type archives (${list(condition.archivePostTypes)})` : type === "term" && condition.archiveTerms?.length ? `term archives (${list(condition.archiveTerms)}${condition.archiveTermsIncludeChildren ? ", with children" : ""})` : `${type} archives`);
      text = `Archives: ${parts.join(", ") || "none selected"}`;
      break;
    }
    case "terms": text = `Terms: ${list(condition.terms) || "none selected"}`; break;
    case "ids": text = `Posts: ${condition.ids?.map(id => `#${id}`).join(", ") || "none selected"}${condition.idsIncludeChildren ? " and their children" : ""}`; break;
  }
  if (condition.hookName) text += ` · hook ${condition.hookName}${condition.hookPriority !== undefined ? ` (${condition.hookPriority})` : ""}`;
  return condition.exclude ? `Exclude: ${text}` : text;
}

/** A condition as the editor shows it: comma-separated lists as text. */
export type ConditionFields = {
  main: TemplateCondition["main"];
  /** postType: post types · terms: terms · ids: post IDs · archiveType: archive kinds. */
  values: string;
  archivePostTypes: string;
  archiveTerms: string;
  /** idsIncludeChildren or archiveTermsIncludeChildren. */
  includeChildren: boolean;
  hookName: string;
  hookPriority: string;
  exclude: boolean;
};

const join = (values?: Array<string | number>) => values?.join(", ") ?? "";
const split = (text: string) => text.split(/[\s,]+/).filter(Boolean);

export function conditionFields(condition: TemplateCondition): ConditionFields {
  const values = condition.main === "postType" ? join(condition.postType)
    : condition.main === "terms" ? join(condition.terms)
    : condition.main === "ids" ? join(condition.ids)
    : condition.main === "archiveType" ? join(condition.archiveType) : "";
  return {
    main: condition.main, values,
    archivePostTypes: join(condition.archivePostTypes), archiveTerms: join(condition.archiveTerms),
    includeChildren: !!(condition.main === "ids" ? condition.idsIncludeChildren : condition.archiveTermsIncludeChildren),
    hookName: condition.hookName ?? "", hookPriority: condition.hookPriority === undefined ? "" : String(condition.hookPriority),
    exclude: !!condition.exclude,
  };
}

/** Build and validate a condition from editor fields; throws with a readable message. */
export function fieldsToCondition(fields: ConditionFields): TemplateCondition {
  const condition: Record<string, unknown> = { main: fields.main };
  const values = split(fields.values);
  if (fields.main === "postType" && values.length) condition.postType = values;
  if (fields.main === "terms") condition.terms = values;
  if (fields.main === "ids") {
    if (values.some(value => !/^\d+$/.test(value))) throw new Error("Post IDs are whole numbers, separated by commas.");
    condition.ids = values.map(Number);
    if (fields.includeChildren) condition.idsIncludeChildren = true;
  }
  if (fields.main === "archiveType") {
    condition.archiveType = values;
    if (values.includes("postType") && split(fields.archivePostTypes).length) condition.archivePostTypes = split(fields.archivePostTypes);
    if (values.includes("term")) {
      condition.archiveTerms = split(fields.archiveTerms);
      if (fields.includeChildren) condition.archiveTermsIncludeChildren = true;
    }
  }
  if (["terms", "ids", "archiveType"].includes(fields.main) && !values.length) throw new Error(`${describeCondition({ main: fields.main } as TemplateCondition).split(":")[0]} need at least one value.`);
  if (fields.hookName.trim()) {
    condition.hookName = fields.hookName.trim();
    if (fields.hookPriority.trim()) {
      if (!/^-?\d+$/.test(fields.hookPriority.trim())) throw new Error("The hook priority is a whole number.");
      condition.hookPriority = Number(fields.hookPriority.trim());
    }
  }
  if (fields.exclude) condition.exclude = true;
  const parsed = templateConditionSchema.safeParse(condition);
  if (!parsed.success) throw new Error(parsed.error.issues.map(issue => issue.message).join(" "));
  return parsed.data;
}
