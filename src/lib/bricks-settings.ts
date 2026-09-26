/** Migrate legacy generator spellings to published native Bricks controls. */
export function normalizeSettings(name: string, input: Record<string, unknown>) {
  const settings = { ...input };
  const changes: string[] = [];
  const aliases: Record<string, string> = {
    _minWidth: "_widthMin", _maxWidth: "_widthMax", _minHeight: "_heightMin", _maxHeight: "_heightMax",
    _gridColumnSpan: "_gridItemColumnSpan", _gridRowSpan: "_gridItemRowSpan",
    ...(name === "accordion" ? { items: "accordions" } : {}),
    ...(name === "social-icons" ? { iconGap: "gap" } : {}),
  };
  for (const key of Object.keys(settings)) {
    const [base, ...suffixes] = key.split(":");
    const suffix = suffixes.length ? `:${suffixes.join(":")}` : "";
    if (aliases[base]) {
      const target = aliases[base] + suffix;
      if (settings[target] === undefined) settings[target] = settings[key];
      delete settings[key]; changes.push(`${key} → ${target}`);
    } else if (base === "_textAlign") {
      const target = `_typography${suffix}`;
      const typography = settings[target];
      settings[target] = { "text-align": settings[key], ...(typography && typeof typography === "object" ? typography : {}) };
      delete settings[key]; changes.push(`${key} → ${target}.text-align`);
    }
  }
  for (const key of Object.keys(settings)) {
    if (key.split(":")[0] !== "_background") continue;
    const bg = settings[key];
    if (!bg || typeof bg !== "object" || Array.isArray(bg) || !("gradient" in bg)) continue;
    const { gradient, ...background } = bg;
    if (gradient && typeof gradient === "object" && !Array.isArray(gradient)) {
      const { colors, ...rest } = gradient as Record<string, unknown>;
      const target = key.replace("_background", "_gradient");
      if (settings[target] === undefined) settings[target] = { applyTo: "background", ...rest, ...(Array.isArray(colors) ? { stops: colors } : {}) };
      settings[key] = background;
      changes.push(`${key}.gradient → ${target}`);
    }
  }
  if (name === "icon-box" && typeof settings.iconPosition === "string") {
    if (settings.direction === undefined) settings.direction = settings.iconPosition === "top" ? "column" : settings.iconPosition === "right" ? "row-reverse" : "row";
    delete settings.iconPosition; changes.push("iconPosition → direction");
  }
  if (name === "image") {
    if (typeof settings._objectFit === "string" && /^(cover|contain|fill|none|scale-down)$/.test(settings._objectFit)) {
      settings._cssCustom = `${typeof settings._cssCustom === "string" ? settings._cssCustom : ""}\n%root%, %root% img { object-fit: ${settings._objectFit}; }`;
      delete settings._objectFit; changes.push("_objectFit → scoped image CSS");
    }
    const image = settings.image;
    if (image && typeof image === "object" && !Array.isArray(image) && "alt" in image) {
      const { alt, ...rest } = image;
      settings.image = rest;
      if (settings.altText === undefined && typeof alt === "string") settings.altText = alt;
      changes.push("image.alt → altText");
    }
  }
  // Native color.hex accepts three/six digit hex only. Preserve alpha, CSS
  // variables and named colors through the documented raw color format.
  function colors(value: unknown, depth = 0): unknown {
    if (!value || typeof value !== "object" || depth > 50) return value;
    if (Array.isArray(value)) return value.map(v => colors(v, depth + 1));
    const object = value as Record<string, unknown>;
    if (typeof object.hex === "string" && !/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(object.hex)) {
      const { hex, ...rest } = object;
      changes.push("Non-hex color → raw color");
      return { ...rest, raw: rest.raw ?? hex };
    }
    return Object.fromEntries(Object.entries(object).map(([key, v]) => [key, colors(v, depth + 1)]));
  }
  return { settings: colors(settings) as Record<string, unknown>, changes };
}
