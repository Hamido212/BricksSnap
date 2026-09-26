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
