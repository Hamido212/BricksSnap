import { generateBuiltin } from "./builtin-generator";
import { COLOR_PALETTES, SECTION_TYPES, STYLE_PRESETS } from "./presets";
import { wrapTemplate } from "./bricks-engine";
import { readStagingTemplate } from "./template-staging";
import { templateWarnings } from "./template-warnings";

/** Built-in generators, not a paid AI call. The connected agent supplies the design intent. */
export function generateMcpPage(input: { prompt: string; sections: string[]; stylePreset?: string; colorPalette?: string; colors?: Record<string, string> }) {
  if (!input.sections.length || input.sections.length > 12 || input.sections.some(id => !SECTION_TYPES.some(s => s.id === id))) throw new Error("Choose 1–12 known section IDs from bricks_list_templates.");
  const preset = STYLE_PRESETS.find(p => p.id === input.stylePreset);
  const palette = COLOR_PALETTES.find(p => p.id === input.colorPalette);
  if (input.stylePreset && !preset) throw new Error("Unknown style preset.");
  if (input.colorPalette && !palette) throw new Error("Unknown color palette.");
  // Explicit role colors (for example a site's palette) take precedence over a catalog palette.
  const colors = palette || input.colors ? { ...palette?.colors, ...input.colors } : undefined;
  const template = readStagingTemplate(wrapTemplate(generateBuiltin(input.prompt, input.sections, preset?.tokens as Record<string, unknown> | undefined, colors)));
  return { template, warnings: ["Built-in content uses prompt keywords and sample copy. Review all text before publishing.", ...templateWarnings(template.content)], sections: input.sections };
}
