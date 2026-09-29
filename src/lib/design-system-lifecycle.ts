import { z } from "zod";
import { classId } from "./kit/build";
import { designSystemFor, type DesignSystem } from "./kit/generate";
import { normalizeKit, resolveKit, type BrandKit } from "./kit/tokens";
import { colorVariable, type DesignSystemPlan, type SitePalette, type SiteVariable, type SiteCategory } from "./design-system-install";

/**
 * What one design-system install owns, and the way back.
 *
 * The manifest is a global variable (--bs-manifest) in the BricksSnap category, written in the same
 * batch as the variables: design, kit, app version and the IDs of everything the install owns. Bricks
 * keeps no revisions of palettes and variables, so every install also returns a snapshot of the values
 * it replaces. Undo and uninstall both revert through that snapshot shape, and only touch an item
 * while it still holds the value BricksSnap wrote.
 */

export const MANIFEST_NAME = "bs-manifest";
export const MANIFEST_ID = classId("ds:var:manifest");

export type DesignManifest = {
  v: 1;
  /** BricksSnap version that installed it. */
  app: string;
  /** Design or page name, if the install came from one. */
  label?: string;
  kit: BrandKit;
  installedAt: string;
  palette: string;
  category: string;
  colors: string[];
  variables: string[];
};

const manifestSchema = z.object({
  v: z.literal(1), app: z.string().max(20), label: z.string().max(60).optional(), kit: z.record(z.string(), z.unknown()),
  installedAt: z.string().max(40), palette: z.string().max(40), category: z.string().max(40),
  colors: z.array(z.string().max(80)).max(100), variables: z.array(z.string().max(80)).max(200),
});

/** Letters, digits and simple punctuation only: the value is a CSS string on every page. */
export const safeLabel = (label?: string) => (label ?? "").replace(/[^\p{L}\p{N} .,:·&()+-]/gu, "").trim().slice(0, 60) || undefined;

export function buildManifest(o: { app: string; label?: string; kit: BrandKit; ds: DesignSystem; paletteId: string; categoryId: string; installedAt: string }): DesignManifest {
  const label = safeLabel(o.label);
  return {
    v: 1, app: o.app, ...(label ? { label } : {}), kit: normalizeKit(o.kit), installedAt: o.installedAt,
    palette: o.paletteId, category: o.categoryId,
    colors: o.ds.palette.colors.map(c => colorVariable(c.raw)), variables: o.ds.variables.map(v => v.name),
  };
}

/** A CSS string: valid as a custom property value and readable in Bricks' variable manager. */
export const manifestValue = (manifest: DesignManifest) => `'${JSON.stringify(manifest)}'`;

export function readManifest(value: string | undefined): DesignManifest | null {
  const text = (value ?? "").trim();
  if (!text.startsWith("'") || !text.endsWith("'")) return null;
  try {
    const parsed = manifestSchema.safeParse(JSON.parse(text.slice(1, -1)));
    return parsed.success ? { ...parsed.data, kit: normalizeKit(parsed.data.kit as Partial<BrandKit>) } as DesignManifest : null;
  } catch { return null; }
}

/** Two manifests describe the same install apart from its time. */
export const sameInstall = (a: DesignManifest | null, b: DesignManifest | null) =>
  !!a && !!b && JSON.stringify({ ...a, installedAt: "" }) === JSON.stringify({ ...b, installedAt: "" });

const text = z.string().max(400);
/** The values an install replaced, keyed by CSS variable (colors) and variable name. */
export const designSnapshotSchema = z.object({
  v: z.literal(1),
  palette: z.object({ id: z.string().max(40).nullable(), name: z.string().max(80), created: z.boolean() }),
  category: z.object({ id: z.string().max(40), name: z.string().max(80), created: z.boolean() }),
  colors: z.array(z.object({ raw: z.string().max(80), prior: text.nullable(), installed: text })).max(100),
  variables: z.array(z.object({ id: z.string().max(40), name: z.string().max(80), prior: z.object({ value: z.string().max(4000), category: z.string().max(40) }).nullable(), installed: z.string().max(4000) })).max(200),
}).strict();
export type DesignSnapshot = z.infer<typeof designSnapshotSchema>;

/** The snapshot of an install, taken from its plan before the first write. */
export function snapshotForInstall(plan: DesignSystemPlan, variables: SiteVariable[], manifest: { prior: string | null; installed: string }): DesignSnapshot {
  const byName = new Map(variables.map(v => [v.name, v]));
  return {
    v: 1,
    palette: { id: plan.palette.siteId, name: plan.palette.name, created: !plan.palette.siteId },
    category: { id: plan.category.id, name: plan.category.name, created: plan.category.create },
    colors: [
      ...plan.palette.create.map(c => ({ raw: colorVariable(c.raw), prior: null, installed: c.light })),
      ...plan.palette.update.map(u => ({ raw: u.name, prior: u.siteColor.light, installed: u.light })),
    ],
    variables: [
      ...plan.variables.create.map(v => ({ id: v.id, name: v.name, prior: null, installed: v.value })),
      ...plan.variables.update.map(v => {
        const before = byName.get(v.name)!;
        return { id: before.id, name: v.name, prior: { value: before.value, category: before.category }, installed: v.value };
      }),
      { id: byName.get(MANIFEST_NAME)?.id ?? MANIFEST_ID, name: MANIFEST_NAME, prior: manifest.prior === null ? null : { value: manifest.prior, category: byName.get(MANIFEST_NAME)!.category }, installed: manifest.installed },
    ],
  };
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export type RevertPlan = {
  /** Colors (CSS variable names) to set back to their prior value, or delete when they had none. */
  colors: { restore: Array<{ id: string; raw: string; light: string; digest: unknown }>; remove: Array<{ id: string; raw: string; digest: unknown }> };
  /** Delete the whole palette: every color it holds is removed. */
  removePalette: { id: string; digest: unknown } | null;
  variables: { restore: SiteVariable[]; remove: SiteVariable[] };
  removeCategory: string | null;
  /** Items left alone because they changed after the install, or are already gone. */
  skipped: Array<{ name: string; reason: "changed" | "missing" }>;
};

/**
 * Compare a snapshot with the site now. An item is reverted only while it still has the installed
 * value; anything edited since is reported and kept.
 */
export function planRevert(snapshot: DesignSnapshot, palettes: SitePalette[], variables: SiteVariable[], categories: SiteCategory[]): RevertPlan {
  const palette = palettes.find(p => p.id === snapshot.palette.id) ?? palettes.find(p => p.name === snapshot.palette.name) ?? null;
  const colors = new Map((palette?.colors ?? []).map(c => [colorVariable(c.raw), c]));
  const plan: RevertPlan = { colors: { restore: [], remove: [] }, removePalette: null, variables: { restore: [], remove: [] }, removeCategory: null, skipped: [] };

  for (const entry of snapshot.colors) {
    const current = colors.get(entry.raw);
    if (!current) { if (entry.prior !== null) plan.skipped.push({ name: entry.raw, reason: "missing" }); continue; }
    if (!same(current.light, entry.installed)) { plan.skipped.push({ name: entry.raw, reason: "changed" }); continue; }
    const digest = current.itemOwnership?.itemDigest;
    if (entry.prior === null) plan.colors.remove.push({ id: current.id, raw: entry.raw, digest });
    else plan.colors.restore.push({ id: current.id, raw: entry.raw, light: entry.prior, digest });
  }
  if (palette && snapshot.palette.created && !plan.colors.restore.length && plan.colors.remove.length === palette.colors.length) {
    plan.removePalette = { id: palette.id, digest: palette.itemOwnership?.itemDigest };
  }

  const byName = new Map(variables.map(v => [v.name, v]));
  for (const entry of snapshot.variables) {
    const current = byName.get(entry.name);
    if (!current) { if (entry.prior !== null) plan.skipped.push({ name: `--${entry.name}`, reason: "missing" }); continue; }
    if (current.value.trim() !== entry.installed.trim()) { plan.skipped.push({ name: `--${entry.name}`, reason: "changed" }); continue; }
    if (entry.prior === null) plan.variables.remove.push(current);
    else plan.variables.restore.push({ ...current, value: entry.prior.value, category: entry.prior.category });
  }

  const category = categories.find(c => c.id === snapshot.category.id) ?? categories.find(c => c.name === snapshot.category.name);
  if (category && snapshot.category.created) {
    const removed = new Set(plan.variables.remove.map(v => v.id));
    const restoredElsewhere = new Set(plan.variables.restore.filter(v => v.category !== category.id).map(v => v.id));
    if (variables.every(v => v.category !== category.id || removed.has(v.id) || restoredElsewhere.has(v.id))) plan.removeCategory = category.id;
  }
  return plan;
}

export type UninstallPreview = {
  manifest: DesignManifest | null;
  snapshot: DesignSnapshot;
  /** Items whose value differs from what the manifest's kit installs (edited in Bricks, or unknown). */
  modified: string[];
  /** bs- global classes stay: pages use them, and their values fall back when the variables are gone. */
  classes: number;
};

/**
 * Everything the BricksSnap palette and category hold, as a snapshot whose prior values are "none":
 * reverting it removes them. Values that differ from the manifest's kit are listed as modified and only
 * included on request.
 */
export function planUninstall(palettes: SitePalette[], variables: SiteVariable[], categories: SiteCategory[], classNames: string[], includeModified: boolean): UninstallPreview {
  const manifestRow = variables.find(v => v.name === MANIFEST_NAME);
  const manifest = readManifest(manifestRow?.value);
  const expected = manifest ? designSystemFor(resolveKit(manifest.kit)) : null;
  const expectedColors = new Map((expected?.palette.colors ?? []).map(c => [colorVariable(c.raw), c.light]));
  const expectedValues = new Map((expected?.variables ?? []).map(v => [v.name, v.value]));

  const palette = palettes.find(p => p.id === manifest?.palette) ?? palettes.find(p => p.name === "BricksSnap") ?? null;
  const category = categories.find(c => c.id === manifest?.category) ?? categories.find(c => c.name === "BricksSnap") ?? null;
  const modified: string[] = [];
  const keep = (name: string, current: string, want: string | undefined) => {
    const changed = want === undefined || !same(current, want);
    if (changed) modified.push(name);
    return !changed || includeModified;
  };

  const colors = (palette?.colors ?? [])
    .filter(c => keep(colorVariable(c.raw) || c.id, c.light, expectedColors.get(colorVariable(c.raw))))
    .map(c => ({ raw: colorVariable(c.raw), prior: null, installed: c.light }));
  const owned = variables.filter(v => v.name === MANIFEST_NAME || (category && v.category === category.id) || manifest?.variables.includes(v.name));
  const vars = owned
    .filter(v => v.name === MANIFEST_NAME || keep(`--${v.name}`, v.value, expectedValues.get(v.name)))
    .map(v => ({ id: v.id, name: v.name, prior: null, installed: v.value }));

  return {
    manifest,
    snapshot: {
      v: 1,
      palette: { id: palette?.id ?? null, name: palette?.name ?? "BricksSnap", created: true },
      category: { id: category?.id ?? "", name: category?.name ?? "BricksSnap", created: !!category },
      colors, variables: vars,
    },
    modified,
    classes: classNames.filter(name => name.startsWith("bs-")).length,
  };
}
