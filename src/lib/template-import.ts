import { wrapTemplate, type BricksTemplate } from "./bricks-engine";
import { validateBricksElements } from "./bricks-validator";
import { templateWarnings } from "./template-warnings";
import { resolveElementCss } from "./bricks-css";

export function importTemplate(input: unknown): { template: BricksTemplate; warnings: string[] } {
  const object = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const validation = validateBricksElements(Array.isArray(input) ? input : object.content ?? object.elements);
  if (!validation.valid) throw new Error(validation.violations[0] ?? "No usable elements found.");
  // Preserve documented dependencies/metadata instead of rebuilding only content.
  const template = { ...wrapTemplate(validation.elements), ...object, content: resolveElementCss(validation.elements) } as BricksTemplate;
  const warnings = [...validation.violations, ...templateWarnings(validation.elements)];
  if (!Array.isArray(template.globalClasses)) throw new Error("globalClasses must be an array.");
  if (!Array.isArray(template.globalElements)) throw new Error("globalElements must be an array.");
  if (template.globalClasses.some(c => !c || typeof c !== "object" || typeof c.id !== "string")) throw new Error("Each global class must be an object with a string id.");
  const classes = new Set(template.globalClasses.map(c => c.id));
  for (const element of template.content) {
    const refs = element.settings._cssGlobalClasses;
    if (Array.isArray(refs) && refs.some(id => !classes.has(id))) warnings.push(`Element ${element.id} references global classes not included in this file. They must already exist on the destination site.`);
    if (element.cid) warnings.push(`Component ${element.cid} requires its definition on the destination site or in the imported dependencies.`);
    if (["code", "html", "shortcode", "form"].includes(element.name)) warnings.push(`${element.name} (${element.id}): review code, actions and site-specific settings in Bricks before publishing.`);
  }
  return { template, warnings: [...new Set(warnings)] };
}
