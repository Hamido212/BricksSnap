import type { DesignSystem } from "./kit/generate";

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" ? value : "");

/** A palette color as list-color-palettes returns it (older palettes use `hex`). */
export type SiteColor = { id: string; light: string; raw: string; itemOwnership?: JsonRecord };
export type SitePalette = { id: string; name: string; colors: SiteColor[]; itemOwnership?: JsonRecord };
export type SiteVariable = JsonRecord & { id: string; name: string; value: string; category: string };
export type SiteCategory = JsonRecord & { id: string; name: string };

export function readSitePalettes(rows: unknown[]): SitePalette[] {
  return rows.filter(isRecord).map(p => ({
    id: text(p.id), name: text(p.name),
    colors: (Array.isArray(p.colors) ? p.colors : []).filter(isRecord).map(c => ({ id: text(c.id), light: text(c.light) || text(c.hex), raw: text(c.raw), ...(isRecord(c.itemOwnership) ? { itemOwnership: c.itemOwnership } : {}) })),
    ...(isRecord(p.itemOwnership) ? { itemOwnership: p.itemOwnership } : {}),
  }));
}

export function readSiteVariables(rows: unknown[]): SiteVariable[] {
  return rows.filter(isRecord).map(v => ({ ...v, id: text(v.id), name: text(v.name), value: text(v.value), category: text(v.category) }));
}

export function readSiteCategories(rows: unknown[]): SiteCategory[] {
  return rows.filter(isRecord).map(c => ({ ...c, id: text(c.id), name: text(c.name) }));
}

/** The CSS custom property a palette color defines: `var(--bs-primary)` → `--bs-primary`. */
export function colorVariable(raw: string): string {
  const match = raw.trim().match(/^var\(\s*(--[\w-]+)/) ?? raw.trim().match(/^(--[\w-]+)$/);
  return match ? match[1] : "";
}

const sameValue = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export type DesignSystemChange = { kind: "color" | "variable"; name: string; action: "create" | "update"; from?: string; to: string };

export type DesignSystemPlan = {
  palette: { name: string; siteId: string | null; create: DesignSystem["palette"]["colors"]; update: Array<{ siteColor: SiteColor; light: string; name: string }>; unchanged: number };
  category: { id: string; name: string; create: boolean };
  variables: { create: SiteVariable[]; update: SiteVariable[]; unchanged: number };
  /** Names another palette color or variable already defines; they are left alone. */
  conflicts: string[];
  changes: DesignSystemChange[];
};

/**
 * Compare the kit's design system with the site. The "BricksSnap" palette and variables with the same
 * names are BricksSnap's own and get updated; a CSS variable defined by anything else is a conflict.
 */
export function planDesignSystem(ds: DesignSystem, palettes: SitePalette[], variables: SiteVariable[], categories: SiteCategory[]): DesignSystemPlan {
  const own = palettes.find(p => p.name === ds.palette.name) ?? null;
  const otherColors = new Map(palettes.filter(p => p !== own).flatMap(p => p.colors.map(c => [colorVariable(c.raw), p.name] as const)).filter(([name]) => name));
  const ownColors = new Map((own?.colors ?? []).map(c => [colorVariable(c.raw), c]));
  const variableNames = new Set(variables.map(v => `--${v.name}`));
  const conflicts: string[] = [];
  const changes: DesignSystemChange[] = [];

  const palette: DesignSystemPlan["palette"] = { name: ds.palette.name, siteId: own?.id ?? null, create: [], update: [], unchanged: 0 };
  for (const color of ds.palette.colors) {
    const name = colorVariable(color.raw);
    const existing = ownColors.get(name);
    if (existing) {
      if (sameValue(existing.light, color.light)) palette.unchanged++;
      else { palette.update.push({ siteColor: existing, light: color.light, name }); changes.push({ kind: "color", name, action: "update", from: existing.light, to: color.light }); }
    } else if (otherColors.has(name) || variableNames.has(name)) conflicts.push(name);
    else { palette.create.push(color); changes.push({ kind: "color", name, action: "create", to: color.light }); }
  }

  const existingCategory = categories.find(c => c.name === ds.category.name) ?? categories.find(c => c.id === ds.category.id);
  const category = { id: existingCategory?.id ?? ds.category.id, name: ds.category.name, create: !existingCategory };

  const byName = new Map(variables.map(v => [v.name, v]));
  const ids = new Set(variables.map(v => v.id));
  const paletteNames = new Set(palettes.flatMap(p => p.colors.map(c => colorVariable(c.raw))));
  const planned: DesignSystemPlan["variables"] = { create: [], update: [], unchanged: 0 };
  for (const variable of ds.variables) {
    const existing = byName.get(variable.name);
    if (existing) {
      if (sameValue(existing.value, variable.value) && existing.category === category.id) planned.unchanged++;
      else {
        // Keep the site's row (opaque fields, ID) and change only value and category.
        const row = Object.fromEntries(Object.entries(existing).filter(([key]) => key !== "itemDigest" && key !== "itemOwnership"));
        planned.update.push({ ...row, value: variable.value, category: category.id } as SiteVariable);
        changes.push({ kind: "variable", name: `--${variable.name}`, action: "update", from: existing.value, to: variable.value });
      }
    } else if (paletteNames.has(`--${variable.name}`) || ids.has(variable.id)) conflicts.push(`--${variable.name}`);
    else {
      planned.create.push({ id: variable.id, name: variable.name, value: variable.value, category: category.id });
      changes.push({ kind: "variable", name: `--${variable.name}`, action: "create", to: variable.value });
    }
  }
  return { palette, category, variables: planned, conflicts, changes };
}

/** True when every color and variable of the design system is on the site with its value. */
export function designSystemInstalled(ds: DesignSystem, palettes: SitePalette[], variables: SiteVariable[]): { ok: boolean; missing: string[] } {
  const own = palettes.find(p => p.name === ds.palette.name);
  const colors = new Map((own?.colors ?? []).map(c => [colorVariable(c.raw), c.light]));
  const values = new Map(variables.map(v => [v.name, v.value]));
  const missing = [
    ...ds.palette.colors.filter(c => !sameValue(colors.get(colorVariable(c.raw)) ?? "", c.light)).map(c => colorVariable(c.raw)),
    ...ds.variables.filter(v => !sameValue(values.get(v.name) ?? "", v.value)).map(v => `--${v.name}`),
  ];
  return { ok: !missing.length, missing };
}
