import type { BricksElement } from "./bricks-engine";

/** %root% is editor shorthand, not a portable stored JSON selector. */
export function resolveElementCss(elements: BricksElement[]): BricksElement[] {
  return elements.map(el => {
    if (typeof el.settings._cssCustom !== "string" || !el.settings._cssCustom.includes("%root%")) return el;
    const customId = el.settings._cssId;
    const selector = typeof customId === "string" && /^[a-zA-Z_][\w-]*$/.test(customId) ? `#${customId}` : `#brxe-${el.id}`;
    return { ...el, settings: { ...el.settings, _cssCustom: el.settings._cssCustom.replaceAll("%root%", selector) } };
  });
}

/**
 * Bricks reformats custom CSS when it stores it: line breaks, indentation, spaces around braces,
 * semicolons, colons, parentheses, ">" combinators and commas, and the last semicolon in a rule.
 * Layout is not a difference, so both sides of a comparison are normalized the same way.
 */
export const normalizeCssLayout = (css: string) => css
  .replace(/\s+/g, " ")
  .replace(/\s*([{};>,])\s*/g, "$1")
  .replace(/\(\s+/g, "(").replace(/\s+\)/g, ")")
  .replace(/([{;(])([-\w]+)\s*:\s*/g, "$1$2:")
  .replace(/;+}/g, "}")
  .trim();

const isCssIdentifier = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z_][\w-]*$/.test(value);
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The element's custom CSS in a form that survives a save: %root%, #brxe-<id> and the element's own
 * CSS ID all name the element itself (Bricks writes %root% back as #brxe-<id>), and layout is ignored.
 */
export function comparableElementCss(el: BricksElement): BricksElement {
  const keys = Object.keys(el.settings).filter(key => key.startsWith("_cssCustom") && typeof el.settings[key] === "string");
  if (!keys.length) return el;
  const own = [`brxe-${escapeRegExp(el.id)}`, ...(isCssIdentifier(el.settings._cssId) ? [el.settings._cssId] : [])];
  const selector = new RegExp(`#(?:${own.join("|")})(?![\\w-])`, "g");
  const settings = { ...el.settings };
  for (const key of keys) settings[key] = normalizeCssLayout((settings[key] as string).replace(selector, "%root%"));
  return { ...el, settings };
}
