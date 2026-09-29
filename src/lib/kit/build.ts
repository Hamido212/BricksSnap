import type { BricksElement, BricksGlobalClass } from "../bricks-engine";
import { generateId } from "../bricks-engine";
import { ICONS, type IconKey } from "./icons";

export type Settings = Record<string, unknown>;

/** A section as a tree; flattened into Bricks' element list with class references. */
export type KitNode = { name: string; classes?: string[]; settings?: Settings; label?: string; children?: KitNode[] };

type Kids = Array<KitNode | false | null | undefined>;
const kids = (children: Kids = []) => children.filter((c): c is KitNode => !!c);
const cls = (classes: string | string[] = []) => (Array.isArray(classes) ? classes : classes.split(/\s+/)).filter(Boolean);

export const node = (name: string, classes: string | string[], settings: Settings = {}, children: Kids = [], label?: string): KitNode =>
  ({ name, classes: cls(classes), settings, children: kids(children), ...(label ? { label } : {}) });

export const section = (classes: string, children: Kids, label: string, settings: Settings = {}) => node("section", classes, settings, children, label);
export const container = (classes: string, children: Kids) => node("container", classes, {}, children);
export const block = (classes: string, children: Kids, label?: string) => node("block", classes, {}, children, label);
export const div = (classes: string, children: Kids, label?: string) => node("div", classes, {}, children, label);

/** Escapes text for Bricks' HTML-capable text controls; line breaks in the source are not kept. */
export const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const heading = (tag: "h1" | "h2" | "h3" | "h4" | "p", text: string, classes: string) => node("heading", classes, { tag, text: escapeHtml(text) });
/** Paragraph text; `html` is trusted markup built by the kit (e.g. <strong>), never user input. */
export const text = (value: string, classes: string, tag = "p", html = false) => node("text-basic", classes, { tag, text: html ? value : escapeHtml(value) });

const linkTo = (href: string) => ({ type: "external", url: href });

export const button = (label: string, href: string, classes: string) => node("button", classes, { text: escapeHtml(label), link: linkTo(href) });
export const textLink = (label: string, href: string, classes: string, icon?: IconKey) =>
  node("text-link", classes, { text: escapeHtml(label), link: linkTo(href), ...(icon ? { icon: { library: "ionicons", icon: ICONS[icon].ion }, iconPosition: "right" } : {}) });
export const image = (url: string, alt: string, classes: string) => node("image", classes, { image: { url, filename: url.split("/").pop()?.split("?")[0] || "image.jpg", size: "full" }, altText: escapeHtml(alt) });
export const icon = (key: IconKey, classes: string, href?: string) =>
  node("icon", classes, { icon: { library: "ionicons", icon: ICONS[key].ion }, ...(href ? { link: linkTo(href) } : {}) });

/**
 * Stable 6-character class IDs from the class name: the same class keeps its ID across generated
 * sections and brand kits, so pasting or applying twice reuses it instead of creating copies.
 */
export function classId(name: string): string {
  let hash = 0x811c9dc5;
  for (const ch of `brickssnap:${name}`) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  let id = "";
  for (let i = 0; i < 6; i++) { id += "abcdefghijklmnopqrstuvwxyz0123456789"[hash % 36]; hash = Math.floor(hash / 36) + (i + 1) * 7919; }
  return id;
}

/** Flatten trees into Bricks elements and collect the classes they use (in order of first use). */
export function flatten(roots: KitNode[]): { elements: BricksElement[]; classNames: string[] } {
  const elements: BricksElement[] = [];
  const used = new Set<string>();
  const ids = new Set<string>();
  const nextId = () => { let id = generateId(); while (ids.has(id)) id = generateId(); ids.add(id); return id; };
  const visit = (n: KitNode, parent: string | 0): string => {
    const id = nextId();
    const settings: Settings = { ...(n.settings ?? {}) };
    if (n.classes?.length) {
      n.classes.forEach(c => used.add(c));
      settings._cssGlobalClasses = n.classes.map(classId);
    }
    const element: BricksElement = { id, name: n.name, parent, children: [], settings, ...(n.label ? { label: n.label } : {}) };
    elements.push(element);
    element.children = (n.children ?? []).map(child => visit(child, id));
    return id;
  };
  roots.forEach(root => visit(root, 0));
  return { elements, classNames: [...used] };
}

export type ClassLibrary = Record<string, Settings>;

export function globalClassesFor(names: string[], library: ClassLibrary): BricksGlobalClass[] {
  return names.map(name => {
    const settings = library[name];
    if (!settings) throw new Error(`BricksSnap class ${name} has no definition.`);
    return { id: classId(name), name, settings };
  });
}
