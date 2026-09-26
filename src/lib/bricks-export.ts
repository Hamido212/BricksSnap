import type { BricksTemplate } from "./bricks-engine";
import { resolveElementCss } from "./bricks-css";

export type TemplateType = "section" | "content" | "header" | "footer";

/** Preserve the entire payload, including global classes and component dependencies. */
export function buildBricksImportJson(template: BricksTemplate, title: string, type: TemplateType = "section") {
  return {
    ...template,
    content: resolveElementCss(template.content),
    name: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brickssnap-template",
    title,
    type,
    templateType: type,
    date: new Date().toISOString().replace("T", " ").slice(0, 19),
    author: { name: "BricksSnap" },
  };
}
