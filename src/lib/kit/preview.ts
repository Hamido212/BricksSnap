import type { BricksElement, BricksTemplate } from "../bricks-engine";
import { ICONS } from "./icons";

/**
 * Renders Bricks JSON to HTML and CSS for an in-app preview. It follows Bricks' frontend markup and
 * base styles closely enough to judge a layout, but it is not Bricks: "Render with Bricks" on a
 * connected site remains the final check. Breakpoints become container queries, so a scaled
 * preview reacts to its own width rather than the browser window.
 */

type Settings = Record<string, unknown>;
const BREAKPOINTS: Record<string, number> = { tablet_portrait: 991, mobile_landscape: 767, mobile_portrait: 478 };
const PSEUDO = /^(hover|focus|focus-visible|active|before|after|focus-within|visited)$/;

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Tags a text control may keep in the preview (rich text); they are rebuilt without attributes. */
const INLINE_TAGS = new Set(["br", "strong", "em", "b", "i", "span", "small", "p", "ul", "ol", "li"]);
/**
 * Text controls hold HTML. Allowlist, not blacklist: every tag outside INLINE_TAGS and every attribute
 * is shown as text, so nothing executable reaches the preview. Existing entities (&amp;) stay intact.
 */
function safeHtml(value: string): string {
  return value.split(/(<[^<>]*>)/g).map(part => {
    const tag = part.match(/^<(\/?)([a-z]+)\s*\/?>$/i);
    if (tag && INLINE_TAGS.has(tag[2].toLowerCase())) return `<${tag[1]}${tag[2].toLowerCase()}>`;
    return part.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }).join("");
}
/** Only web, mail, phone and same-page or site-relative links; anything else becomes "#". */
const safeUrl = (value: unknown) => (typeof value === "string" && /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(value.trim()) ? value.trim() : "#");
/** A URL inside CSS url("…"). */
const cssUrl = (value: unknown) => safeUrl(value).replace(/["\\\n\r()]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);

const LENGTH = /^(-?\d+(\.\d+)?)$/;
const len = (value: unknown) => { const s = String(value ?? "").trim(); return LENGTH.test(s) ? `${s}px` : s; };

function color(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Record<string, unknown>;
  const v = c.raw ?? c.rgb ?? c.hsl ?? c.hex;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function sides(prefix: string, value: unknown, suffix = ""): string[] {
  if (!value || typeof value !== "object") return [];
  const v = value as Record<string, unknown>;
  return (["top", "right", "bottom", "left"] as const).filter(k => v[k] !== undefined && v[k] !== "").map(k => `${prefix}-${k}${suffix}: ${len(v[k])}`);
}

function radius(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const v = value as Record<string, unknown>;
  const map: Record<string, string> = { top: "top-left", right: "top-right", bottom: "bottom-right", left: "bottom-left" };
  return Object.entries(map).filter(([k]) => v[k] !== undefined && v[k] !== "").map(([k, corner]) => `border-${corner}-radius: ${len(v[k])}`);
}

const SIMPLE: Record<string, string> = {
  _display: "display", _direction: "flex-direction", _flexDirection: "flex-direction", _flexWrap: "flex-wrap", _justifyContent: "justify-content", _alignItems: "align-items",
  _alignSelf: "align-self", _flexGrow: "flex-grow", _flexShrink: "flex-shrink", _flexBasis: "flex-basis", _order: "order", _gap: "gap", _rowGap: "row-gap", _columnGap: "column-gap",
  _gridGap: "gap", _gridTemplateColumns: "grid-template-columns", _gridTemplateRows: "grid-template-rows", _gridAutoFlow: "grid-auto-flow", _gridAutoRows: "grid-auto-rows", _gridAutoColumns: "grid-auto-columns", _width: "width", _widthMax: "max-width",
  _widthMin: "min-width", _height: "height", _heightMin: "min-height", _heightMax: "max-height", _aspectRatio: "aspect-ratio", _objectFit: "object-fit", _position: "position",
  _top: "top", _right: "right", _bottom: "bottom", _left: "left", _zIndex: "z-index", _overflow: "overflow", _opacity: "opacity", _cssTransition: "transition", _cursor: "cursor",
};
const UNITLESS = new Set(["_flexGrow", "_flexShrink", "_order", "_zIndex", "_opacity", "_display", "_direction", "_flexDirection", "_flexWrap", "_justifyContent", "_alignItems", "_alignSelf", "_gridTemplateColumns", "_gridTemplateRows", "_gridAutoFlow", "_gridAutoRows", "_gridAutoColumns", "_aspectRatio", "_objectFit", "_position", "_overflow", "_cssTransition", "_cursor"]);

/** CSS declarations for one Bricks control. */
function declarations(control: string, value: unknown): string[] {
  if (value === undefined || value === null || value === "") return [];
  if (SIMPLE[control]) return [`${SIMPLE[control]}: ${UNITLESS.has(control) ? String(value) : len(value)}`];
  switch (control) {
    case "_padding": return sides("padding", value);
    case "_margin": return sides("margin", value);
    case "_gridItemColumnSpan": return [`grid-column: span ${value}`];
    case "_gridItemRowSpan": return [`grid-row: span ${value}`];
    case "_typography": {
      const t = value as Record<string, unknown>;
      const out: string[] = [];
      if (typeof t["font-family"] === "string" && t["font-family"]) out.push(`font-family: "${t["font-family"]}"${typeof t.fallback === "string" && t.fallback ? `, ${t.fallback}` : ""}`);
      for (const key of ["font-size", "font-weight", "line-height", "letter-spacing", "text-transform", "text-align", "font-style", "text-decoration"]) if (t[key] !== undefined && t[key] !== "") out.push(`${key}: ${key === "font-size" || key === "letter-spacing" ? len(t[key]) : t[key]}`);
      const c = color(t.color);
      if (c) out.push(`color: ${c}`);
      return out;
    }
    case "_background": {
      const b = value as Record<string, unknown>;
      const out: string[] = [];
      const c = color(b.color);
      if (c) out.push(`background-color: ${c}`);
      const img = b.image as { url?: string } | undefined;
      if (img?.url) out.push(`background-image: url("${cssUrl(img.url)}")`, `background-size: ${b.size ?? "cover"}`, `background-position: ${b.position ?? "center center"}`, `background-repeat: ${b.repeat ?? "no-repeat"}`);
      return out;
    }
    case "_border": {
      const b = value as Record<string, unknown>;
      const out = [...sides("border", b.width, "-width"), ...radius(b.radius)];
      if (b.style) out.push(`border-style: ${b.style}`);
      const c = color(b.color);
      if (c) out.push(`border-color: ${c}`);
      return out;
    }
    case "_boxShadow": {
      const s = value as { values?: Record<string, unknown>; color?: unknown };
      const v = s.values && !Array.isArray(s.values) ? s.values : null;
      if (!v) return [];
      return [`box-shadow: ${v.inset ? "inset " : ""}${len(v.offsetX ?? 0)} ${len(v.offsetY ?? 0)} ${len(v.blur ?? 0)} ${len(v.spread ?? 0)} ${color(s.color) ?? "rgba(0,0,0,.1)"}`];
    }
    case "_transform": {
      const t = value as Record<string, unknown>;
      const parts: string[] = [];
      if (t.translateX || t.translateY) parts.push(`translate(${len(t.translateX ?? 0)}, ${len(t.translateY ?? 0)})`);
      if (t.scaleX || t.scaleY) parts.push(`scale(${t.scaleX ?? 1}, ${t.scaleY ?? 1})`);
      if (t.rotateZ) parts.push(`rotate(${t.rotateZ})`);
      return parts.length ? [`transform: ${parts.join(" ")}`] : [];
    }
    default: return [];
  }
}

type Rule = { selector: string; decls: string[]; breakpoint?: number };

/** CSS property keys ("property|breakpoint|pseudo") a settings object writes; used to find class conflicts. */
export function settingsProperties(settings: Settings): Set<string> {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(settings)) {
    const [control, ...mods] = key.split(":");
    if (control === "_cssCustom") continue;
    const scope = `${mods.find(m => BREAKPOINTS[m]) ?? ""}|${mods.find(m => PSEUDO.test(m)) ?? ""}`;
    for (const decl of declarations(control, value)) keys.add(`${decl.split(":")[0].trim()}|${scope}`);
  }
  return keys;
}

/** Rules for one settings object under a base selector (class or element ID). */
function rulesFor(selector: string, settings: Settings, element?: string): { rules: Rule[]; custom: string } {
  const rules: Rule[] = [];
  let custom = "";
  for (const [key, value] of Object.entries(settings)) {
    const [control, ...mods] = key.split(":");
    if (control === "_cssCustom") { if (typeof value === "string") custom += `${value.replaceAll("%root%", selector)}\n`; continue; }
    const breakpoint = mods.map(m => BREAKPOINTS[m]).find(Boolean);
    const pseudo = mods.find(m => PSEUDO.test(m));
    const decls = declarations(control, value);
    if (!decls.length) continue;
    // Bricks applies object-fit and aspect ratio to the image itself.
    const sel = `${selector}${pseudo ? (/^(before|after)$/.test(pseudo) ? `::${pseudo}` : `:${pseudo}`) : ""}`;
    rules.push({ selector: element === "image" && (control === "_objectFit") ? `${sel}, ${sel} img` : sel, decls, ...(breakpoint ? { breakpoint } : {}) });
  }
  return { rules, custom };
}

function serialize(rules: Rule[]): string {
  const base = rules.filter(r => !r.breakpoint).map(r => `${r.selector} { ${r.decls.join("; ")}; }`).join("\n");
  const byBreakpoint = new Map<number, Rule[]>();
  for (const r of rules) if (r.breakpoint) byBreakpoint.set(r.breakpoint, [...(byBreakpoint.get(r.breakpoint) ?? []), r]);
  // Wider breakpoints first, like Bricks' desktop-first cascade.
  const responsive = [...byBreakpoint.entries()].sort((a, b) => b[0] - a[0]).map(([bp, list]) => `@container bsp (max-width: ${bp}px) {\n${list.map(r => `${r.selector} { ${r.decls.join("; ")}; }`).join("\n")}\n}`).join("\n");
  return `${base}\n${responsive}`;
}

/**
 * A scaled preview measures widths against its own container. Heights have no container, so
 * viewport heights become a fixed 800px screen.
 */
const toContainerUnits = (css: string) => css.replace(/(\d)vw\b/g, "$1cqw").replace(/(\d+(?:\.\d+)?)vh\b/g, (_, n: string) => `${Math.round(Number(n) * 8)}px`);

function iconSvg(settings: Settings): string {
  const iconDef = settings.icon as { icon?: string } | undefined;
  const match = Object.values(ICONS).find(i => i.ion === iconDef?.icon);
  if (!match) return `<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".25"/></svg>`;
  return `<svg viewBox="${match.viewBox}" width="1em" height="1em" fill="currentColor" aria-hidden="true">${match.svg}</svg>`;
}

function formHtml(el: BricksElement): string {
  const s = el.settings;
  const fields = Array.isArray(s.fields) ? s.fields as Array<Record<string, unknown>> : [];
  const input = (f: Record<string, unknown>) => {
    const label = esc(String(f.label ?? ""));
    if (f.type === "checkbox") return `<label class="bsp-check"><input type="checkbox" disabled> <span>${label}</span></label>`;
    const control = f.type === "textarea" ? `<textarea disabled rows="4"></textarea>` : `<input type="${esc(String(f.type ?? "text"))}" disabled>`;
    return `<div class="form-group" style="width:${Number(f.width) > 0 ? `calc(${Number(f.width)}% - 8px)` : "100%"}"><label>${label}</label>${control}</div>`;
  };
  return `<form class="brxe-form">${fields.map(input).join("")}<div class="form-group submit-button-wrapper"><button type="button" class="bricks-button">${esc(String(s.submitButtonText ?? "Send"))}</button></div></form>`;
}

/** Element-level form controls → CSS (labels, fields, submit button). */
function formCss(selector: string, s: Settings): string {
  const part = (sub: string, decls: string[]) => (decls.length ? `${selector} ${sub} { ${decls.join("; ")}; }` : "");
  const fieldBorder = s.fieldBorder as Record<string, unknown> | undefined;
  const submitBorder = s.submitButtonBorder as Record<string, unknown> | undefined;
  return [
    part("label", declarations("_typography", s.labelTypography)),
    part(":is(input, textarea)", [...declarations("_typography", s.fieldTypography), ...(color(s.fieldBackgroundColor) ? [`background-color: ${color(s.fieldBackgroundColor)}`] : []), ...sides("padding", s.fieldPadding), ...(fieldBorder ? declarations("_border", fieldBorder) : [])]),
    part(".form-group", sides("margin", s.fieldMargin)),
    part(".bricks-button", [...declarations("_typography", s.submitButtonTypography), ...(color(s.submitButtonBackgroundColor) ? [`background-color: ${color(s.submitButtonBackgroundColor)}`] : []), ...sides("padding", s.submitButtonPadding), ...(submitBorder ? declarations("_border", submitBorder) : [])]),
  ].filter(Boolean).join("\n");
}

const TAGS = new Set(["div", "section", "nav", "header", "footer", "article", "aside", "ul", "ol", "li", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "address"]);
const tagOf = (value: unknown, fallback: string) => (typeof value === "string" && TAGS.has(value) ? value : fallback);

export type PreviewOptions = {
  /** CSS custom properties for the design system, applied to the preview root. */
  variables?: string;
  /** Font family → CSS value (e.g. a next/font variable) for self-hosted fonts in the app. */
  fonts?: Record<string, string>;
};

export function renderPreview(template: Pick<BricksTemplate, "content" | "globalClasses">, options: PreviewOptions = {}): { html: string; css: string } {
  const elements = template.content;
  const byId = new Map(elements.map(el => [el.id, el]));
  const classNames = new Map((template.globalClasses ?? []).map(c => [c.id, c.name]));
  const rules: Rule[] = [];
  let custom = "";

  for (const cls of template.globalClasses ?? []) {
    const r = rulesFor(`.${cls.name}`, cls.settings ?? {});
    rules.push(...r.rules); custom += r.custom;
  }

  const render = (el: BricksElement): string => {
    const s = el.settings;
    const idAttr = typeof s._cssId === "string" && /^[A-Za-z][\w-]*$/.test(s._cssId) ? s._cssId : `brxe-${el.id}`;
    const selector = `#${idAttr}`;
    const own = Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("_") && k !== "_cssGlobalClasses" && k !== "_cssId" && k !== "_attributes" && k !== "_hidden"));
    const r = rulesFor(selector, own, el.name);
    rules.push(...r.rules); custom += r.custom;
    // Nestable elements mark their parts with _hidden classes; Bricks' script opens the first tab.
    const hidden = String((s._hidden as { _cssClasses?: unknown } | undefined)?._cssClasses ?? "").split(/\s+/).filter(c => /^[a-z][a-z-]*$/.test(c));
    const firstChild = el.parent !== 0 && byId.get(String(el.parent))?.children[0] === el.id;
    const open = firstChild && hidden.some(c => c === "tab-title" || c === "tab-pane") ? ["brx-open"] : [];
    const classes = [`brxe-${el.name}`, ...hidden, ...open, ...(Array.isArray(s._cssGlobalClasses) ? s._cssGlobalClasses.map(id => classNames.get(String(id))).filter(Boolean) : [])];
    const attrs = `id="${esc(idAttr)}" class="${esc(classes.join(" "))}"${Array.isArray(s._attributes) ? (s._attributes as Array<{ name?: string; value?: string }>).filter(a => a.name && /^(aria-[\w-]+|role|data-[\w-]+)$/.test(a.name)).map(a => ` ${a.name}="${esc(String(a.value ?? ""))}"`).join("") : ""}`;
    const children = el.children.map(id => byId.get(id)).filter((c): c is BricksElement => !!c).map(render).join("");
    const text = typeof s.text === "string" ? safeHtml(s.text) : "";
    const href = safeUrl((s.link as { url?: string } | undefined)?.url);
    switch (el.name) {
      case "section": return `<${tagOf(s.tag, "section")} ${attrs}>${children}</${tagOf(s.tag, "section")}>`;
      case "container": case "block": case "div": return `<${tagOf(s.tag, "div")} ${attrs}>${children}</${tagOf(s.tag, "div")}>`;
      case "heading": { const tag = tagOf(s.tag, "h3"); return `<${tag} ${attrs}>${text}</${tag}>`; }
      case "text-basic": case "text": { const tag = tagOf(s.tag, "div"); return `<${tag} ${attrs}>${text}</${tag}>`; }
      case "text-link": return `<a ${attrs} href="${esc(href)}"><span>${text}</span>${s.icon ? `<span class="icon">${iconSvg(s)}</span>` : ""}</a>`;
      case "button": return `<a ${attrs.replace('class="', 'class="bricks-button ')} href="${esc(href)}">${text}</a>`;
      case "image": { const img = s.image as { url?: string } | undefined; return `<img ${attrs} src="${esc(safeUrl(img?.url))}" alt="${esc(String(s.altText ?? ""))}" loading="lazy">`; }
      case "icon": return s.link ? `<a ${attrs} href="${esc(href)}">${iconSvg(s)}</a>` : `<span ${attrs}>${iconSvg(s)}</span>`;
      case "form": custom += `${formCss(selector, s)}\n`; return `<div ${attrs}>${formHtml(el)}</div>`;
      default: return `<div ${attrs}>${text}${children}</div>`;
    }
  };
  const html = elements.filter(el => el.parent === 0).map(render).join("");

  let css = `${BASE_CSS}\n.bsp { ${options.variables ?? ""} }\n${serialize(rules)}\n${custom}`;
  for (const [family, value] of Object.entries(options.fonts ?? {})) css = css.replaceAll(`"${family}"`, value);
  return { html, css: toContainerUnits(css) };
}

/** Bricks' frontend base styles for the elements the kit uses, in a lower cascade layer like Bricks. */
const BASE_CSS = `@layer bricks {
.bsp { container: bsp / inline-size; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #363636; background: #fff; -webkit-font-smoothing: antialiased; text-align: left; }
.bsp *, .bsp *::before, .bsp *::after { box-sizing: border-box; }
.bsp :where(h1, h2, h3, h4, h5, h6) { margin: 0; line-height: 1.4; font-weight: 700; }
.bsp :where(p) { margin: 1em 0; }
.bsp :where(a) { color: currentcolor; text-decoration: none; }
.bsp img { max-width: 100%; height: auto; vertical-align: middle; display: inline-block; }
.bsp .brxe-section { display: flex; flex-direction: column; align-items: center; margin-left: auto; margin-right: auto; width: 100%; flex-wrap: wrap; }
.bsp .brxe-container { display: flex; flex-direction: column; align-items: flex-start; margin-left: auto; margin-right: auto; width: 1100px; max-width: 100%; flex-wrap: wrap; }
.bsp .brxe-block { display: flex; flex-direction: column; align-items: flex-start; width: 100%; flex-wrap: wrap; }
.bsp .brxe-text-link { display: inline-flex; align-items: center; gap: 5px; }
.bsp .brxe-text-link .icon { display: inline-flex; }
.bsp .bricks-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; border-width: 0; letter-spacing: .5px; padding: .5em 1em; text-align: center; cursor: pointer; }
.bsp .brxe-icon { font-size: 60px; display: inline-flex; line-height: 1; }
.bsp .brxe-icon svg { width: 1em; height: 1em; }
.bsp .brxe-form form { display: flex; flex-wrap: wrap; justify-content: space-between; }
.bsp .brxe-form label { display: block; margin-bottom: 5px; color: #9e9e9e; }
.bsp .brxe-form :is(input, textarea) { width: 100%; font: inherit; border: 1px solid #dddedf; padding: 8px 12px; background: #fff; }
.bsp .brxe-form .form-group { width: 100%; margin-bottom: 12px; }
.bsp .brxe-form .bsp-check { display: flex; gap: 8px; align-items: baseline; width: 100%; margin-bottom: 12px; font-size: 14px; }
.bsp .brxe-form .bsp-check input { width: auto; }
.bsp .brxe-tabs-nested { display: flex; flex-direction: column; width: 100%; }
.bsp .brxe-tabs-nested .tab-menu { display: flex; }
.bsp .brxe-tabs-nested .tab-title { cursor: pointer; }
.bsp .brxe-tabs-nested .tab-pane { display: none; }
.bsp .brxe-tabs-nested .tab-pane.brx-open { display: block; }
.bsp .brxe-accordion-nested { display: flex; flex-direction: column; width: 100%; }
.bsp .brxe-accordion-nested .accordion-content-wrapper { display: none; }
.bsp .brxe-accordion-nested .brx-open > .accordion-content-wrapper { display: block; }
}`;
