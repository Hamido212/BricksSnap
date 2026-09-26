import type { BricksElement } from "./bricks-engine";

export function templateWarnings(elements: BricksElement[]): string[] {
  const warnings: string[] = [];
  if (elements.some(e => e.name === "form")) warnings.push("Forms need their actions, recipients, spam protection and any login/newsletter integration configured in Bricks before publishing.");
  if (elements.some(e => ["code", "html", "shortcode"].includes(e.name))) warnings.push("Review code, HTML and shortcodes before importing into WordPress. Validation does not make executable content safe.");
  if (elements.some(e => JSON.stringify(e.settings).includes('"url":"#"'))) warnings.push("This template contains placeholder links. Replace them with your own destinations.");
  if (elements.some(e => e.name === "countdown")) warnings.push("Set the countdown date and timezone for your event in Bricks.");
  return warnings;
}
