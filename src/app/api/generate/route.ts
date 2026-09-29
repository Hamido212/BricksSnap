import { wrapTemplate } from "@/lib/bricks-engine";
import { validateBricksElements } from "@/lib/bricks-validator";
import { generateBuiltin } from "@/lib/builtin-generator";
import { generateAI } from "@/lib/ai-client";
import { errorResponse, generationSchema, readJson, RequestError, resolveKey } from "@/lib/api-request";
import { COLOR_PALETTES, STYLE_PRESETS } from "@/lib/presets";
import { templateWarnings } from "@/lib/template-warnings";
import { assertLocalCodex, localCodex } from "@/lib/local-codex";

export const runtime = "nodejs";
export const maxDuration = 300;
let activeRequests = 0;

export async function POST(request: Request) {
  if (activeRequests >= 4) return Response.json({ error: "The generator is busy. Please retry shortly." }, { status: 429 });
  activeRequests++;
  try {
    const body = generationSchema.parse(await readJson(request));
    const preset = STYLE_PRESETS.find(p => p.id === body.stylePreset?.id);
    const palette = COLOR_PALETTES.find(p => p.id === body.colorPalette?.id);
    if (body.stylePreset && !preset) throw new RequestError("Unknown style preset");
    if (body.colorPalette && !palette) throw new RequestError("Unknown color palette");
    let elements: unknown;
    let model: string | undefined;
    if (body.useAI) {
      const prompt = [body.prompt, preset ? `Style direction: ${preset.aiDirective} Design tokens: ${JSON.stringify(preset.tokens)}` : "",
        palette ? `Use this palette: ${JSON.stringify(palette.colors)}` : "",
        body.sections?.length ? `Required sections in order: ${body.sections.join(", ")}` : "",
        body.referenceImage ? "Recreate the reference image layout, colors and typography with native editable elements." : ""].filter(Boolean).join("\n\n");
      if (body.useChatGPT) {
        assertLocalCodex(request);
        if (body.referenceImage) throw new RequestError("Image references currently require an API provider. ChatGPT local mode supports text prompts.");
        ({ elements, model } = await localCodex.generate(prompt, body.chatgptModel, request.signal));
      } else {
        ({ elements, model } = await generateAI(body, resolveKey(body), prompt, body.referenceImage, request.signal));
      }
    } else {
      if (body.referenceImage) throw new RequestError("Reference images require AI mode.");
      elements = generateBuiltin(body.prompt, body.sections, preset?.tokens, palette?.colors);
    }
    const validation = validateBricksElements(elements);
    if (!validation.valid) throw new RequestError(`Template validation failed: ${validation.violations[0] ?? "No elements returned"}`, 422);
    return Response.json({ success: true, template: wrapTemplate(validation.elements),
      elementCount: validation.elements.length,
      sections: validation.elements.filter(e => e.parent === 0).map(e => e.label || e.name),
      mode: body.useAI ? "ai" : "builtin", aiAvailable: body.useAI, model,
      visionMode: body.useAI && !!body.referenceImage,
      validation: { warnings: [...validation.violations, ...templateWarnings(validation.elements)], stats: validation.stats },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
  finally { activeRequests--; }
}
