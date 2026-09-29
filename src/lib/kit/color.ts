/** Small color helpers for deriving a design system from one brand color (sRGB, WCAG 2.x contrast). */

export type Rgb = [number, number, number];

export function parseHex(value: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split("").map(c => c + c).join("") : match[1];
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
}

/** Lowercase #rrggbb, or null. */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const rgb = parseHex(value);
  return rgb ? toHex(rgb) : null;
}

/** Mix `a` toward `b` by `amount` (0 = a, 1 = b). */
export function mix(a: string, b: string, amount: number): string {
  const x = parseHex(a), y = parseHex(b);
  if (!x || !y) return a;
  return toHex([0, 1, 2].map(i => x[i] + (y[i] - x[i]) * amount) as Rgb);
}

export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors (1–21). */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** The candidate with the best contrast against `background`, preferring earlier ones that reach `target`. */
export function readable(background: string, candidates: string[], target = 4.5): string {
  return candidates.find(c => contrast(c, background) >= target) ?? [...candidates].sort((a, b) => contrast(b, background) - contrast(a, background))[0];
}

/**
 * Shift a color toward black or white until it reaches `target` contrast against `background`,
 * keeping its hue: used for brand-colored text (links, eyebrows) on light and dark pages.
 */
export function ensureContrast(color: string, background: string, target = 4.5): string {
  if (contrast(color, background) >= target) return color;
  const toward = luminance(background) > 0.4 ? "#000000" : "#ffffff";
  for (let step = 1; step <= 20; step++) {
    const candidate = mix(color, toward, step * 0.05);
    if (contrast(candidate, background) >= target) return candidate;
  }
  return toward;
}

export function rgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex) ?? [0, 0, 0];
  return `rgba(${rgb.join(", ")}, ${alpha})`;
}
