// Bricks Builder JSON Template Engine
// Generates valid Bricks Builder element JSON for copy-paste

export interface BricksElement {
  id: string;
  name: string;
  parent: string | 0;
  children: string[];
  settings: Record<string, unknown>;
  label?: string;
}

export interface BricksTemplate {
  content: BricksElement[];
  source: string;
  sourceUrl: string;
  version: string;
  globalClasses: BricksGlobalClass[];
  globalElements: unknown[];
}

export interface BricksGlobalClass {
  id: string;
  name: string;
  settings: Record<string, unknown>;
}

// ============================================================
// DESIGN TOKENS - Customizable colors, shadows, radius, etc.
// ============================================================
export interface DesignTokens {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  headingColor: string;
  mutedTextColor: string;
  borderColor: string;
  borderRadius: "none" | "small" | "medium" | "large" | "full";
  shadow: "none" | "small" | "medium" | "large";
  darkMode: boolean;
  spacing: "compact" | "default" | "spacious";
  typography: "compact" | "default" | "large";
}

const LIGHT_DEFAULTS: DesignTokens = {
  primaryColor: "#3b82f6",
  secondaryColor: "#8b5cf6",
  backgroundColor: "#ffffff",
  surfaceColor: "#f8fafc",
  textColor: "#334155",
  headingColor: "#0f172a",
  mutedTextColor: "#64748b",
  borderColor: "#e2e8f0",
  borderRadius: "medium",
  shadow: "none",
  darkMode: false,
  spacing: "default",
  typography: "default",
};

const DARK_DEFAULTS: DesignTokens = {
  primaryColor: "#3b82f6",
  secondaryColor: "#8b5cf6",
  backgroundColor: "#0f172a",
  surfaceColor: "#1e293b",
  textColor: "#e2e8f0",
  headingColor: "#ffffff",
  mutedTextColor: "#94a3b8",
  borderColor: "#334155",
  borderRadius: "medium",
  shadow: "none",
  darkMode: true,
  spacing: "default",
  typography: "default",
};

/** Merge partial tokens with smart defaults based on darkMode */
export function resolveDesignTokens(partial: Partial<DesignTokens> = {}): DesignTokens {
  const isDark = partial.darkMode ?? false;
  const base = isDark ? { ...DARK_DEFAULTS } : { ...LIGHT_DEFAULTS };
  // Only override non-undefined values
  for (const key of Object.keys(partial) as (keyof DesignTokens)[]) {
    if (partial[key] !== undefined) {
      (base as Record<string, unknown>)[key] = partial[key];
    }
  }
  return base;
}

// ============================================================
// DESIGN TOKEN HELPERS
// ============================================================

/** Get border-radius value string from token */
function rad(tokens: DesignTokens, scale: number = 1): string {
  const baseMap: Record<string, number> = {
    none: 0,
    small: 4,
    medium: 8,
    large: 16,
    full: 9999,
  };
  const base = baseMap[tokens.borderRadius] ?? 8;
  return String(Math.round(base * scale));
}

/** Get radius object { top, right, bottom, left } */
function radObj(tokens: DesignTokens, scale: number = 1): Record<string, string> {
  const v = rad(tokens, scale);
  return { top: v, right: v, bottom: v, left: v };
}

/** Get box-shadow settings or undefined */
function shadowSettings(tokens: DesignTokens): Record<string, unknown> | undefined {
  switch (tokens.shadow) {
    case "small":
      return { values: { offsetY: "2", blur: "8", spread: "-2" }, color: { hex: tokens.darkMode ? "#00000040" : "#00000010" } };
    case "medium":
      return { values: { offsetY: "4", blur: "20", spread: "-4" }, color: { hex: tokens.darkMode ? "#00000050" : "#00000015" } };
    case "large":
      return { values: { offsetY: "8", blur: "40", spread: "-8" }, color: { hex: tokens.darkMode ? "#00000060" : "#00000020" } };
    default:
      return undefined;
  }
}

/** Lighten/darken a hex color by mixing with white/black */
function adjustColor(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  if (amount > 0) {
    // lighten (mix with white)
    return `#${clamp(r + (255 - r) * amount).toString(16).padStart(2, "0")}${clamp(g + (255 - g) * amount).toString(16).padStart(2, "0")}${clamp(b + (255 - b) * amount).toString(16).padStart(2, "0")}`;
  } else {
    // darken (mix with black)
    const a = Math.abs(amount);
    return `#${clamp(r * (1 - a)).toString(16).padStart(2, "0")}${clamp(g * (1 - a)).toString(16).padStart(2, "0")}${clamp(b * (1 - a)).toString(16).padStart(2, "0")}`;
  }
}

/** Add alpha to hex color (returns hex8 format) */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "").substring(0, 6);
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `#${h}${a}`;
}

/** Get section padding based on spacing token */
function sectionPad(tokens: DesignTokens): { top: string; bottom: string; left: string; right: string } {
  const map = { compact: { v: "60", h: "24" }, default: { v: "100", h: "40" }, spacious: { v: "140", h: "60" } };
  const s = map[tokens.spacing] || map.default;
  return { top: s.v, bottom: s.v, left: s.h, right: s.h };
}

/** Get container max-width based on spacing token */
function containerWidth(tokens: DesignTokens): string {
  const map = { compact: "960px", default: "1200px", spacious: "1400px" };
  return map[tokens.spacing] || "1200px";
}

/** Get gap size based on spacing token */
function gapSize(tokens: DesignTokens, scale: number = 1): string {
  const map = { compact: 20, default: 32, spacious: 48 };
  return String(Math.round((map[tokens.spacing] || 32) * scale));
}

/** Get font size based on typography token */
function fontSize(tokens: DesignTokens, level: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "xs"): string {
  const sizes: Record<string, Record<string, string>> = {
    compact: { h1: "40px", h2: "32px", h3: "18px", h4: "16px", body: "14px", small: "13px", xs: "11px" },
    default: { h1: "48px", h2: "40px", h3: "20px", h4: "16px", body: "16px", small: "14px", xs: "12px" },
    large: { h1: "64px", h2: "48px", h3: "24px", h4: "18px", body: "18px", small: "16px", xs: "13px" },
  };
  return (sizes[tokens.typography] || sizes.default)[level] || "16px";
}

// ============================================================
// CORE HELPERS
// ============================================================

/** Generate a random 6-character ID (Bricks format) */
export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Create a Bricks element */
export function createElement(
  name: string,
  parent: string | 0,
  settings: Record<string, unknown> = {},
  label?: string
): BricksElement {
  return {
    id: generateId(),
    name,
    parent,
    children: [],
    settings,
    ...(label ? { label } : {}),
  };
}

/** Link parent and child elements */
function linkElements(parent: BricksElement, child: BricksElement): void {
  parent.children.push(child.id);
  child.parent = parent.id;
}

/** Wrap content in a template export format */
export function wrapTemplate(
  elements: BricksElement[],
  globalClasses: BricksGlobalClass[] = []
): BricksTemplate {
  return {
    content: elements,
    source: "bricksCopiedElements",
    sourceUrl: "",
    version: "1.12.2",
    globalClasses,
    globalElements: [],
  };
}

// ============================================================
// SECTION GENERATORS
// ============================================================

export function generateHeroSection(
  headline: string = "Build Something Amazing",
  subtext: string = "Create stunning websites with our powerful tools and intuitive design system.",
  buttonText: string = "Get Started",
  buttonLink: string = "#",
  style: "centered" | "split" | "gradient" = "centered",
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const isGradient = style === "gradient";
  const sectionBg = isGradient
    ? (tokens.darkMode ? tokens.backgroundColor : "#0f172a")
    : tokens.backgroundColor;
  const headingClr = isGradient
    ? (tokens.darkMode ? tokens.headingColor : "#ffffff")
    : tokens.headingColor;
  const subtextClr = isGradient
    ? (tokens.darkMode ? tokens.mutedTextColor : "#94a3b8")
    : tokens.mutedTextColor;

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: sectionBg } },
  }, "Hero Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: style === "split" ? "row" : "column",
    _justifyContent: "center",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    ...(style === "split" ? { _gap: "60px" } : {}),
  });
  linkElements(section, container);
  elements.push(container);

  const contentBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: style === "split" ? "flex-start" : "center",
    _gap: "24px",
    ...(style === "split" ? { _width: "50%" } : { _width: "100%", _textAlign: "center" }),
  });
  linkElements(container, contentBlock);
  elements.push(contentBlock);

  const heading = createElement("heading", contentBlock.id, {
    text: headline,
    tag: "h1",
    _typography: {
      "font-size": isGradient ? "56px" : "48px",
      "font-weight": "800",
      "line-height": "1.1",
      "letter-spacing": "-0.02em",
      color: { hex: headingClr },
    },
    _margin: { bottom: "16" },
  });
  linkElements(contentBlock, heading);
  elements.push(heading);

  const text = createElement("text-basic", contentBlock.id, {
    text: `<p>${subtext}</p>`,
    _typography: {
      "font-size": "20px",
      "line-height": "1.6",
      color: { hex: subtextClr },
    },
    _width: style === "split" ? "100%" : "600px",
    _margin: { bottom: "16" },
  });
  linkElements(contentBlock, text);
  elements.push(text);

  const buttonWrapper = createElement("div", contentBlock.id, {
    _display: "flex",
    _direction: "row",
    _gap: "16px",
    _justifyContent: style === "split" ? "flex-start" : "center",
    _flexWrap: "wrap",
  });
  linkElements(contentBlock, buttonWrapper);
  elements.push(buttonWrapper);

  const primaryBtn = createElement("text-basic", buttonWrapper.id, {
    text: `<p>${buttonText}</p>`,
    tag: "a",
    link: { type: "external", url: buttonLink },
    _padding: { top: "16", bottom: "16", left: "32", right: "32" },
    _background: { color: { hex: tokens.primaryColor } },
    _border: { radius: radObj(tokens) },
    _typography: {
      "font-size": "16px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
    _attributes: [{ name: "role", value: "button" }],
  });
  linkElements(buttonWrapper, primaryBtn);
  elements.push(primaryBtn);

  const secondaryBorderColor = isGradient
    ? (tokens.darkMode ? tokens.borderColor : "#475569")
    : tokens.borderColor;
  const secondaryTextColor = isGradient
    ? (tokens.darkMode ? tokens.textColor : "#e2e8f0")
    : tokens.textColor;

  const secondaryBtn = createElement("text-basic", buttonWrapper.id, {
    text: "<p>Learn More</p>",
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "16", bottom: "16", left: "32", right: "32" },
    _background: { color: { hex: "transparent" } },
    _border: {
      radius: radObj(tokens),
      width: { top: "2", right: "2", bottom: "2", left: "2" },
      style: "solid",
      color: { hex: secondaryBorderColor },
    },
    _typography: {
      "font-size": "16px",
      "font-weight": "600",
      color: { hex: secondaryTextColor },
      "text-decoration": "none",
    },
  });
  linkElements(buttonWrapper, secondaryBtn);
  elements.push(secondaryBtn);

  if (style === "split") {
    const imageBlock = createElement("div", container.id, {
      _width: "50%",
    });
    linkElements(container, imageBlock);
    elements.push(imageBlock);

    const image = createElement("image", imageBlock.id, {
      image: {
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
        filename: "hero-image.jpg",
      },
      _border: { radius: radObj(tokens, 2) },
      _width: "100%",
      _objectFit: "cover",
    });
    linkElements(imageBlock, image);
    elements.push(image);
  }

  return elements;
}

export function generateNavbar(
  brandName: string = "BrandName",
  links: Array<{ text: string; url: string }> = [
    { text: "Home", url: "/" },
    { text: "Features", url: "#features" },
    { text: "Pricing", url: "#pricing" },
    { text: "Contact", url: "#contact" },
  ],
  ctaText: string = "Sign Up",
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "0", bottom: "0", left: "0", right: "0" },
    _background: { color: { hex: tokens.backgroundColor } },
    _border: {
      width: { bottom: "1" },
      style: "solid",
      color: { hex: tokens.borderColor },
    },
    _position: "sticky",
    _top: "0",
    _zIndex: "50",
  }, "Navbar");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "row",
    _justifyContent: "space-between",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _padding: { top: "16", bottom: "16", left: "24", right: "24" },
  });
  linkElements(section, container);
  elements.push(container);

  const brand = createElement("heading", container.id, {
    text: brandName,
    tag: "h3",
    _typography: {
      "font-size": "24px",
      "font-weight": "700",
      color: { hex: tokens.headingColor },
    },
  });
  linkElements(container, brand);
  elements.push(brand);

  const navBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "row",
    _gap: "32px",
    _alignItems: "center",
  });
  linkElements(container, navBlock);
  elements.push(navBlock);

  for (const link of links) {
    const navLink = createElement("text-basic", navBlock.id, {
      text: `<p>${link.text}</p>`,
      tag: "a",
      link: { type: "external", url: link.url },
      _typography: {
        "font-size": "15px",
        "font-weight": "500",
        color: { hex: tokens.mutedTextColor },
        "text-decoration": "none",
      },
    });
    linkElements(navBlock, navLink);
    elements.push(navLink);
  }

  const ctaBtn = createElement("text-basic", navBlock.id, {
    text: `<p>${ctaText}</p>`,
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "10", bottom: "10", left: "24", right: "24" },
    _background: { color: { hex: tokens.primaryColor } },
    _border: { radius: radObj(tokens) },
    _typography: {
      "font-size": "15px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
  });
  linkElements(navBlock, ctaBtn);
  elements.push(ctaBtn);

  return elements;
}

export function generateFeaturesSection(
  sectionTitle: string = "Why Choose Us",
  sectionSubtitle: string = "Everything you need to build modern websites",
  features: Array<{ title: string; description: string; icon?: string }> = [
    { title: "Lightning Fast", description: "Optimized for speed with instant load times and smooth interactions." },
    { title: "Fully Responsive", description: "Looks perfect on every device, from mobile to desktop." },
    { title: "Easy to Customize", description: "Modify colors, fonts, and layouts with a few clicks." },
    { title: "SEO Optimized", description: "Built with best practices for search engine visibility." },
    { title: "Secure by Default", description: "Enterprise-grade security built into every component." },
    { title: "24/7 Support", description: "Our team is always here to help you succeed." },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.surfaceColor } },
  }, "Features Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
    _width: "600px",
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  // Responsive grid: auto-fill with minmax so it wraps automatically
  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    _gap: "32px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const cardShadow = shadowSettings(tokens);
  const iconColors = [tokens.primaryColor, tokens.secondaryColor, "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "32", bottom: "32", left: "32", right: "32" },
      _background: { color: { hex: tokens.backgroundColor } },
      _border: {
        radius: radObj(tokens, 1.5),
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: tokens.borderColor },
      },
      _gap: "16px",
      ...(cardShadow ? { _boxShadow: cardShadow } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    const iconColor = iconColors[i % iconColors.length];
    const iconWrapper = createElement("div", card.id, {
      _width: "48px",
      _height: "48px",
      _background: { color: { hex: withAlpha(iconColor, 0.1) } },
      _border: { radius: radObj(tokens, 1.25) },
      _justifyContent: "center",
      _alignItems: "center",
      _display: "flex",
    });
    linkElements(card, iconWrapper);
    elements.push(iconWrapper);

    const iconText = createElement("text-basic", iconWrapper.id, {
      text: `<p style="font-size:24px">&#9733;</p>`,
      _typography: {
        "font-size": "24px",
        color: { hex: iconColor },
      },
    });
    linkElements(iconWrapper, iconText);
    elements.push(iconText);

    const featureTitle = createElement("heading", card.id, {
      text: feature.title,
      tag: "h3",
      _typography: {
        "font-size": "20px",
        "font-weight": "600",
        "line-height": "1.4",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(card, featureTitle);
    elements.push(featureTitle);

    const featureDesc = createElement("text-basic", card.id, {
      text: `<p>${feature.description}</p>`,
      _typography: {
        "font-size": "15px",
        "line-height": "1.6",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(card, featureDesc);
    elements.push(featureDesc);
  }

  return elements;
}

export function generatePricingSection(
  plans: Array<{
    name: string;
    price: string;
    period: string;
    features: string[];
    highlighted?: boolean;
    buttonText?: string;
  }> = [
    { name: "Starter", price: "$9", period: "/month", features: ["5 Projects", "Basic Analytics", "Email Support", "1GB Storage"], buttonText: "Start Free" },
    { name: "Professional", price: "$29", period: "/month", features: ["Unlimited Projects", "Advanced Analytics", "Priority Support", "50GB Storage", "Custom Domain", "API Access"], highlighted: true, buttonText: "Get Started" },
    { name: "Enterprise", price: "$99", period: "/month", features: ["Everything in Pro", "Dedicated Support", "Unlimited Storage", "SSO & SAML", "SLA Guarantee", "Custom Integrations"], buttonText: "Contact Sales" },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  // Pricing always uses a dark-ish look - but respects tokens
  const pricingBg = tokens.darkMode ? tokens.backgroundColor : "#0f172a";
  const pricingHeading = tokens.darkMode ? tokens.headingColor : "#ffffff";
  const pricingMuted = tokens.darkMode ? tokens.mutedTextColor : "#94a3b8";
  const cardBg = tokens.darkMode ? tokens.surfaceColor : "#111827";
  const cardHighlightBg = tokens.darkMode ? adjustColor(tokens.surfaceColor, 0.1) : "#1e293b";
  const cardBorder = tokens.darkMode ? tokens.borderColor : "#1e293b";
  const cardText = tokens.darkMode ? tokens.textColor : "#cbd5e1";
  const cardHeading = tokens.darkMode ? tokens.headingColor : "#e2e8f0";

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: pricingBg } },
  }, "Pricing Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const badge = createElement("text-basic", headerBlock.id, {
    text: "<p>Pricing</p>",
    _padding: { top: "6", bottom: "6", left: "16", right: "16" },
    _background: { color: { hex: withAlpha(tokens.primaryColor, 0.15) } },
    _border: { radius: { top: "100", right: "100", bottom: "100", left: "100" } },
    _typography: {
      "font-size": "13px",
      "font-weight": "600",
      color: { hex: tokens.primaryColor },
      "text-transform": "uppercase",
      "letter-spacing": "0.05em",
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, badge);
  elements.push(badge);

  const title = createElement("heading", headerBlock.id, {
    text: "Simple, transparent pricing",
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: pricingHeading },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: "<p>Choose the plan that fits your needs. Upgrade or downgrade anytime.</p>",
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: pricingMuted },
    },
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  // Responsive grid for pricing cards
  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    _gap: "24px",
    _justifyContent: "center",
    _alignItems: "stretch",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  for (const plan of plans) {
    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "40", bottom: "40", left: "32", right: "32" },
      _background: { color: { hex: plan.highlighted ? cardHighlightBg : cardBg } },
      _border: {
        radius: radObj(tokens, 2),
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: plan.highlighted ? tokens.primaryColor : cardBorder },
      },
      _gap: "24px",
      ...(plan.highlighted ? {
        _boxShadow: { values: { offsetY: "8", blur: "40", spread: "-12" }, color: { hex: withAlpha(tokens.primaryColor, 0.3) } },
      } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    if (plan.highlighted) {
      const popularBadge = createElement("text-basic", card.id, {
        text: "<p>Most Popular</p>",
        _padding: { top: "4", bottom: "4", left: "12", right: "12" },
        _background: { color: { hex: tokens.primaryColor } },
        _border: { radius: radObj(tokens, 0.75) },
        _typography: {
          "font-size": "12px",
          "font-weight": "600",
          color: { hex: "#ffffff" },
        },
        _alignSelf: "flex-start",
      });
      linkElements(card, popularBadge);
      elements.push(popularBadge);
    }

    const planName = createElement("heading", card.id, {
      text: plan.name,
      tag: "h3",
      _typography: {
        "font-size": "20px",
        "font-weight": "600",
        color: { hex: cardHeading },
      },
    });
    linkElements(card, planName);
    elements.push(planName);

    const priceBlock = createElement("div", card.id, {
      _display: "flex",
      _direction: "row",
      _alignItems: "baseline",
      _gap: "4px",
    });
    linkElements(card, priceBlock);
    elements.push(priceBlock);

    const price = createElement("heading", priceBlock.id, {
      text: plan.price,
      tag: "custom",
      customTag: "span",
      _typography: {
        "font-size": "48px",
        "font-weight": "800",
        color: { hex: pricingHeading },
      },
    });
    linkElements(priceBlock, price);
    elements.push(price);

    const period = createElement("text-basic", priceBlock.id, {
      text: `<p>${plan.period}</p>`,
      _typography: {
        "font-size": "16px",
        color: { hex: pricingMuted },
      },
    });
    linkElements(priceBlock, period);
    elements.push(period);

    const featureList = createElement("div", card.id, {
      _display: "flex",
      _direction: "column",
      _gap: "12px",
      _margin: { top: "8", bottom: "8" },
    });
    linkElements(card, featureList);
    elements.push(featureList);

    for (const feature of plan.features) {
      const featureItem = createElement("text-basic", featureList.id, {
        text: `<p>&#10003;  ${feature}</p>`,
        _typography: {
          "font-size": "15px",
          "line-height": "1.6",
          color: { hex: cardText },
        },
      });
      linkElements(featureList, featureItem);
      elements.push(featureItem);
    }

    const button = createElement("text-basic", card.id, {
      text: `<p>${plan.buttonText || "Get Started"}</p>`,
      tag: "a",
      link: { type: "external", url: "#" },
      _padding: { top: "14", bottom: "14", left: "24", right: "24" },
      _background: { color: { hex: plan.highlighted ? tokens.primaryColor : "transparent" } },
      _border: {
        radius: radObj(tokens, 1.25),
        ...(plan.highlighted ? {} : {
          width: { top: "1", right: "1", bottom: "1", left: "1" },
          style: "solid",
          color: { hex: cardBorder },
        }),
      },
      _typography: {
        "font-size": "16px",
        "font-weight": "600",
        color: { hex: "#ffffff" },
        "text-align": "center",
        "text-decoration": "none",
      },
      _margin: { top: "auto" },
    });
    linkElements(card, button);
    elements.push(button);
  }

  return elements;
}

export function generateTestimonialsSection(
  testimonials: Array<{
    quote: string;
    author: string;
    role: string;
    rating?: number;
  }> = [
    { quote: "This product completely transformed how we build websites. The speed and quality are unmatched.", author: "Sarah Johnson", role: "CEO, TechStart", rating: 5 },
    { quote: "I've tried dozens of tools, but nothing comes close to the flexibility and power offered here.", author: "Michael Chen", role: "Lead Developer, Acme Corp", rating: 5 },
    { quote: "The templates saved us weeks of development time. Our clients are thrilled with the results.", author: "Emily Rodriguez", role: "Design Director, Creative Labs", rating: 5 },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.backgroundColor } },
  }, "Testimonials");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: "What Our Customers Say",
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  // RESPONSIVE GRID: uses auto-fill + minmax to wrap cards automatically
  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    _gap: "24px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const cardShadow = shadowSettings(tokens);

  for (const testimonial of testimonials) {
    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "32", bottom: "32", left: "32", right: "32" },
      _background: { color: { hex: tokens.surfaceColor } },
      _border: {
        radius: radObj(tokens, 2),
        ...(tokens.darkMode ? {
          width: { top: "1", right: "1", bottom: "1", left: "1" },
          style: "solid",
          color: { hex: tokens.borderColor },
        } : {}),
      },
      _gap: "20px",
      ...(cardShadow ? { _boxShadow: cardShadow } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    if (testimonial.rating) {
      const stars = createElement("text-basic", card.id, {
        text: `<p>${"&#9733;".repeat(testimonial.rating)}</p>`,
        _typography: {
          "font-size": "20px",
          color: { hex: "#f59e0b" },
        },
      });
      linkElements(card, stars);
      elements.push(stars);
    }

    const quote = createElement("text-basic", card.id, {
      text: `<p>"${testimonial.quote}"</p>`,
      _typography: {
        "font-size": "16px",
        "line-height": "1.7",
        color: { hex: tokens.textColor },
        "font-style": "italic",
      },
    });
    linkElements(card, quote);
    elements.push(quote);

    const authorBlock = createElement("div", card.id, {
      _display: "flex",
      _direction: "column",
      _gap: "4px",
      _margin: { top: "auto" },
    });
    linkElements(card, authorBlock);
    elements.push(authorBlock);

    const authorName = createElement("heading", authorBlock.id, {
      text: testimonial.author,
      tag: "h4",
      _typography: {
        "font-size": "16px",
        "font-weight": "600",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(authorBlock, authorName);
    elements.push(authorName);

    const authorRole = createElement("text-basic", authorBlock.id, {
      text: `<p>${testimonial.role}</p>`,
      _typography: {
        "font-size": "14px",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(authorBlock, authorRole);
    elements.push(authorRole);
  }

  return elements;
}

export function generateFooterSection(
  brandName: string = "BrandName",
  columns: Array<{
    title: string;
    links: Array<{ text: string; url: string }>;
  }> = [
    { title: "Product", links: [{ text: "Features", url: "#" }, { text: "Pricing", url: "#" }, { text: "Templates", url: "#" }, { text: "Integrations", url: "#" }] },
    { title: "Company", links: [{ text: "About", url: "#" }, { text: "Blog", url: "#" }, { text: "Careers", url: "#" }, { text: "Contact", url: "#" }] },
    { title: "Resources", links: [{ text: "Documentation", url: "#" }, { text: "Help Center", url: "#" }, { text: "Community", url: "#" }, { text: "Status", url: "#" }] },
    { title: "Legal", links: [{ text: "Privacy", url: "#" }, { text: "Terms", url: "#" }, { text: "Cookie Policy", url: "#" }] },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  // Footer always dark-ish
  const footerBg = tokens.darkMode ? tokens.backgroundColor : "#0f172a";
  const footerHeading = tokens.darkMode ? tokens.headingColor : "#ffffff";
  const footerText = tokens.darkMode ? tokens.mutedTextColor : "#94a3b8";
  const footerSubheading = tokens.darkMode ? tokens.textColor : "#e2e8f0";
  const footerDivider = tokens.darkMode ? tokens.borderColor : "#1e293b";

  const section = createElement("section", 0, {
    _padding: { top: "80", bottom: "40", left: "40", right: "40" },
    _background: { color: { hex: footerBg } },
  }, "Footer");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _gap: "60px",
  });
  linkElements(section, container);
  elements.push(container);

  // Responsive top row: wraps on smaller screens
  const topRow = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "280px repeat(auto-fill, minmax(140px, 1fr))",
    _gap: "40px",
    _width: "100%",
  });
  linkElements(container, topRow);
  elements.push(topRow);

  const brandBlock = createElement("div", topRow.id, {
    _display: "flex",
    _direction: "column",
    _gap: "16px",
  });
  linkElements(topRow, brandBlock);
  elements.push(brandBlock);

  const brand = createElement("heading", brandBlock.id, {
    text: brandName,
    tag: "h3",
    _typography: {
      "font-size": "24px",
      "font-weight": "700",
      color: { hex: footerHeading },
    },
  });
  linkElements(brandBlock, brand);
  elements.push(brand);

  const brandDesc = createElement("text-basic", brandBlock.id, {
    text: "<p>Building the future of web design, one template at a time.</p>",
    _typography: {
      "font-size": "15px",
      "line-height": "1.6",
      color: { hex: footerText },
    },
  });
  linkElements(brandBlock, brandDesc);
  elements.push(brandDesc);

  for (const column of columns) {
    const colBlock = createElement("div", topRow.id, {
      _display: "flex",
      _direction: "column",
      _gap: "16px",
    });
    linkElements(topRow, colBlock);
    elements.push(colBlock);

    const colTitle = createElement("heading", colBlock.id, {
      text: column.title,
      tag: "h4",
      _typography: {
        "font-size": "14px",
        "font-weight": "600",
        color: { hex: footerSubheading },
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
      },
      _margin: { bottom: "8" },
    });
    linkElements(colBlock, colTitle);
    elements.push(colTitle);

    for (const link of column.links) {
      const linkEl = createElement("text-basic", colBlock.id, {
        text: `<p>${link.text}</p>`,
        tag: "a",
        link: { type: "external", url: link.url },
        _typography: {
          "font-size": "15px",
          color: { hex: footerText },
          "text-decoration": "none",
        },
      });
      linkElements(colBlock, linkEl);
      elements.push(linkEl);
    }
  }

  const divider = createElement("div", container.id, {
    _width: "100%",
    _height: "1px",
    _background: { color: { hex: footerDivider } },
  });
  linkElements(container, divider);
  elements.push(divider);

  const bottomRow = createElement("div", container.id, {
    _display: "flex",
    _direction: "row",
    _justifyContent: "space-between",
    _alignItems: "center",
    _width: "100%",
    _flexWrap: "wrap",
    _gap: "16px",
  });
  linkElements(container, bottomRow);
  elements.push(bottomRow);

  const copyright = createElement("text-basic", bottomRow.id, {
    text: `<p>&copy; 2026 ${brandName}. All rights reserved.</p>`,
    _typography: {
      "font-size": "14px",
      color: { hex: footerText },
    },
  });
  linkElements(bottomRow, copyright);
  elements.push(copyright);

  return elements;
}

export function generateCTASection(
  headline: string = "Ready to Get Started?",
  subtext: string = "Join thousands of creators who are already building amazing websites.",
  buttonText: string = "Start Building Now",
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.surfaceColor } },
  }, "CTA Section");
  elements.push(section);

  const ctaBg = tokens.darkMode ? adjustColor(tokens.surfaceColor, 0.15) : "#1e293b";

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "900px",
    _margin: { left: "auto", right: "auto" },
    _padding: { top: "80", bottom: "80", left: "60", right: "60" },
    _background: { color: { hex: ctaBg } },
    _border: { radius: radObj(tokens, 3) },
    _textAlign: "center",
    _gap: "24px",
  });
  linkElements(section, container);
  elements.push(container);

  const title = createElement("heading", container.id, {
    text: headline,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: "#ffffff" },
    },
  });
  linkElements(container, title);
  elements.push(title);

  const text = createElement("text-basic", container.id, {
    text: `<p>${subtext}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: "#94a3b8" },
    },
    _width: "600px",
  });
  linkElements(container, text);
  elements.push(text);

  const button = createElement("text-basic", container.id, {
    text: `<p>${buttonText}</p>`,
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "16", bottom: "16", left: "40", right: "40" },
    _background: { color: { hex: tokens.primaryColor } },
    _border: { radius: radObj(tokens, 1.25) },
    _typography: {
      "font-size": "18px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
    _margin: { top: "8" },
  });
  linkElements(container, button);
  elements.push(button);

  return elements;
}

export function generateContactSection(
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.backgroundColor } },
  }, "Contact Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "row",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _gap: "60px",
    _alignItems: "flex-start",
    _flexWrap: "wrap",
  });
  linkElements(section, container);
  elements.push(container);

  const infoBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _width: "40%",
    _minWidth: "280px",
    _gap: "24px",
  });
  linkElements(container, infoBlock);
  elements.push(infoBlock);

  const title = createElement("heading", infoBlock.id, {
    text: "Get in Touch",
    tag: "h2",
    _typography: {
      "font-size": "36px",
      "font-weight": "700",
      color: { hex: tokens.headingColor },
    },
  });
  linkElements(infoBlock, title);
  elements.push(title);

  const desc = createElement("text-basic", infoBlock.id, {
    text: "<p>Have a question or want to work together? We'd love to hear from you.</p>",
    _typography: {
      "font-size": "16px",
      "line-height": "1.7",
      color: { hex: tokens.mutedTextColor },
    },
  });
  linkElements(infoBlock, desc);
  elements.push(desc);

  const contactItems = [
    { label: "Email", value: "hello@example.com" },
    { label: "Phone", value: "+1 (555) 123-4567" },
    { label: "Address", value: "123 Main Street, City, Country" },
  ];

  for (const item of contactItems) {
    const itemBlock = createElement("div", infoBlock.id, {
      _display: "flex",
      _direction: "column",
      _gap: "4px",
    });
    linkElements(infoBlock, itemBlock);
    elements.push(itemBlock);

    const label = createElement("text-basic", itemBlock.id, {
      text: `<p><strong>${item.label}</strong></p>`,
      _typography: {
        "font-size": "14px",
        "font-weight": "600",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(itemBlock, label);
    elements.push(label);

    const value = createElement("text-basic", itemBlock.id, {
      text: `<p>${item.value}</p>`,
      _typography: {
        "font-size": "15px",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(itemBlock, value);
    elements.push(value);
  }

  const formBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _width: "55%",
    _minWidth: "300px",
    _padding: { top: "40", bottom: "40", left: "40", right: "40" },
    _background: { color: { hex: tokens.surfaceColor } },
    _border: { radius: radObj(tokens, 2) },
    _gap: "20px",
  });
  linkElements(container, formBlock);
  elements.push(formBlock);

  const form = createElement("form", formBlock.id, {
    fields: [
      { type: "text", label: "Full Name", placeholder: "John Doe", required: true, id: generateId() },
      { type: "email", label: "Email", placeholder: "john@example.com", required: true, id: generateId() },
      { type: "text", label: "Subject", placeholder: "How can we help?", required: false, id: generateId() },
      { type: "textarea", label: "Message", placeholder: "Tell us more...", required: true, id: generateId() },
    ],
    submitButtonText: "Send Message",
    submitButtonStyle: "primary",
    submitButtonBackgroundColor: { hex: tokens.primaryColor },
    submitButtonTypography: {
      "font-size": "16px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
    },
    submitButtonBorder: { radius: radObj(tokens) },
    fieldBackgroundColor: { hex: tokens.backgroundColor },
    fieldBorder: {
      radius: radObj(tokens),
      width: { top: "1", right: "1", bottom: "1", left: "1" },
      style: "solid",
      color: { hex: tokens.borderColor },
    },
    fieldTypography: {
      "font-size": "15px",
      color: { hex: tokens.textColor },
    },
    labelTypography: {
      "font-size": "14px",
      "font-weight": "500",
      color: { hex: tokens.textColor },
    },
    showLabels: true,
    actions: ["email"],
    emailTo: "admin_email",
    successMessage: "Thank you! Your message has been sent successfully.",
  });
  linkElements(formBlock, form);
  elements.push(form);

  return elements;
}

export function generateGallerySection(
  sectionTitle: string = "Our Gallery",
  sectionSubtitle: string = "Explore our latest work and projects",
  items: Array<{ title: string; category: string }> = [
    { title: "Project Alpha", category: "Web Design" },
    { title: "Brand Identity", category: "Branding" },
    { title: "Mobile App UI", category: "UI/UX" },
    { title: "E-Commerce Store", category: "Development" },
    { title: "Marketing Campaign", category: "Strategy" },
    { title: "Product Photography", category: "Photography" },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.backgroundColor } },
  }, "Gallery");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
    _width: "600px",
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  // Responsive grid
  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    _gap: "24px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const placeholderColors = [
    withAlpha(tokens.primaryColor, 0.12),
    withAlpha(tokens.secondaryColor, 0.12),
    "#fce7f3",
    "#d1fae5",
    "#fef3c7",
    "#ede9fe",
  ];
  const cardShadow = shadowSettings(tokens);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _background: { color: { hex: tokens.surfaceColor } },
      _border: {
        radius: radObj(tokens, 1.5),
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: tokens.borderColor },
      },
      _overflow: "hidden",
      ...(cardShadow ? { _boxShadow: cardShadow } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    const imagePlaceholder = createElement("div", card.id, {
      _width: "100%",
      _height: "240px",
      _background: { color: { hex: placeholderColors[i % placeholderColors.length] } },
      _display: "flex",
      _justifyContent: "center",
      _alignItems: "center",
    });
    linkElements(card, imagePlaceholder);
    elements.push(imagePlaceholder);

    const imageIcon = createElement("text-basic", imagePlaceholder.id, {
      text: "<p>&#128247;</p>",
      _typography: {
        "font-size": "48px",
        color: { hex: tokens.mutedTextColor },
      },
      _opacity: "0.4",
    });
    linkElements(imagePlaceholder, imageIcon);
    elements.push(imageIcon);

    const cardContent = createElement("div", card.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "20", bottom: "20", left: "20", right: "20" },
      _gap: "8px",
    });
    linkElements(card, cardContent);
    elements.push(cardContent);

    const categoryTag = createElement("text-basic", cardContent.id, {
      text: `<p>${item.category}</p>`,
      _typography: {
        "font-size": "12px",
        "font-weight": "600",
        color: { hex: tokens.primaryColor },
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
      },
    });
    linkElements(cardContent, categoryTag);
    elements.push(categoryTag);

    const itemTitle = createElement("heading", cardContent.id, {
      text: item.title,
      tag: "h3",
      _typography: {
        "font-size": "18px",
        "font-weight": "600",
        "line-height": "1.4",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(cardContent, itemTitle);
    elements.push(itemTitle);
  }

  return elements;
}

// ============================================================
// TEAM SECTION
// ============================================================
export function generateTeamSection(
  sectionTitle: string = "Meet Our Team",
  sectionSubtitle: string = "The talented people behind our success",
  members: Array<{
    name: string;
    role: string;
    bio?: string;
  }> = [
    { name: "Sarah Johnson", role: "CEO & Founder", bio: "Visionary leader with 15+ years in tech." },
    { name: "Michael Chen", role: "CTO", bio: "Full-stack architect passionate about scalable systems." },
    { name: "Emily Rodriguez", role: "Design Director", bio: "Award-winning designer crafting pixel-perfect experiences." },
    { name: "David Park", role: "Head of Marketing", bio: "Data-driven strategist growing brands globally." },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.surfaceColor } },
  }, "Team Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
    _width: "600px",
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    _gap: "32px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const cardShadow = shadowSettings(tokens);
  const avatarColors = [tokens.primaryColor, tokens.secondaryColor, "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _alignItems: "center",
      _padding: { top: "40", bottom: "40", left: "32", right: "32" },
      _background: { color: { hex: tokens.backgroundColor } },
      _border: {
        radius: radObj(tokens, 2),
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: tokens.borderColor },
      },
      _gap: "16px",
      _textAlign: "center",
      ...(cardShadow ? { _boxShadow: cardShadow } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    // Avatar placeholder circle
    const avatar = createElement("div", card.id, {
      _width: "96px",
      _height: "96px",
      _background: { color: { hex: withAlpha(avatarColors[i % avatarColors.length], 0.15) } },
      _border: {
        radius: { top: "9999", right: "9999", bottom: "9999", left: "9999" },
      },
      _display: "flex",
      _justifyContent: "center",
      _alignItems: "center",
    });
    linkElements(card, avatar);
    elements.push(avatar);

    const initials = createElement("text-basic", avatar.id, {
      text: `<p>${member.name.split(" ").map(n => n[0]).join("")}</p>`,
      _typography: {
        "font-size": "28px",
        "font-weight": "700",
        color: { hex: avatarColors[i % avatarColors.length] },
      },
    });
    linkElements(avatar, initials);
    elements.push(initials);

    const memberName = createElement("heading", card.id, {
      text: member.name,
      tag: "h3",
      _typography: {
        "font-size": "20px",
        "font-weight": "600",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(card, memberName);
    elements.push(memberName);

    const memberRole = createElement("text-basic", card.id, {
      text: `<p>${member.role}</p>`,
      _typography: {
        "font-size": "14px",
        "font-weight": "600",
        color: { hex: tokens.primaryColor },
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
      },
    });
    linkElements(card, memberRole);
    elements.push(memberRole);

    if (member.bio) {
      const memberBio = createElement("text-basic", card.id, {
        text: `<p>${member.bio}</p>`,
        _typography: {
          "font-size": "15px",
          "line-height": "1.6",
          color: { hex: tokens.mutedTextColor },
        },
      });
      linkElements(card, memberBio);
      elements.push(memberBio);
    }
  }

  return elements;
}

// ============================================================
// STATS / COUNTER SECTION
// ============================================================
export function generateStatsSection(
  sectionTitle: string = "Our Impact in Numbers",
  stats: Array<{
    value: string;
    label: string;
    description?: string;
  }> = [
    { value: "10,000+", label: "Active Users", description: "Growing every day" },
    { value: "99.9%", label: "Uptime", description: "Enterprise reliability" },
    { value: "150+", label: "Countries", description: "Global presence" },
    { value: "4.9/5", label: "Rating", description: "Customer satisfaction" },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "80", bottom: "80", left: "40", right: "40" },
    _background: { color: { hex: tokens.darkMode ? tokens.surfaceColor : tokens.primaryColor } },
  }, "Stats Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _gap: "48px",
  });
  linkElements(section, container);
  elements.push(container);

  if (sectionTitle) {
    const title = createElement("heading", container.id, {
      text: sectionTitle,
      tag: "h2",
      _typography: {
        "font-size": "36px",
        "font-weight": "700",
        "line-height": "1.2",
        color: { hex: tokens.darkMode ? tokens.headingColor : "#ffffff" },
      },
      _textAlign: "center",
    });
    linkElements(container, title);
    elements.push(title);
  }

  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    _gap: "40px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  for (const stat of stats) {
    const statBlock = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _alignItems: "center",
      _textAlign: "center",
      _gap: "8px",
    });
    linkElements(grid, statBlock);
    elements.push(statBlock);

    const value = createElement("heading", statBlock.id, {
      text: stat.value,
      tag: "custom",
      customTag: "span",
      _typography: {
        "font-size": "48px",
        "font-weight": "800",
        "line-height": "1.1",
        color: { hex: tokens.darkMode ? tokens.primaryColor : "#ffffff" },
      },
    });
    linkElements(statBlock, value);
    elements.push(value);

    const label = createElement("heading", statBlock.id, {
      text: stat.label,
      tag: "h4",
      _typography: {
        "font-size": "18px",
        "font-weight": "600",
        color: { hex: tokens.darkMode ? tokens.headingColor : "#ffffff" },
      },
    });
    linkElements(statBlock, label);
    elements.push(label);

    if (stat.description) {
      const desc = createElement("text-basic", statBlock.id, {
        text: `<p>${stat.description}</p>`,
        _typography: {
          "font-size": "14px",
          color: { hex: tokens.darkMode ? tokens.mutedTextColor : "rgba(255,255,255,0.7)" },
        },
      });
      linkElements(statBlock, desc);
      elements.push(desc);
    }
  }

  return elements;
}

// ============================================================
// FAQ SECTION
// ============================================================
export function generateFaqSection(
  sectionTitle: string = "Frequently Asked Questions",
  sectionSubtitle: string = "Everything you need to know",
  items: Array<{
    question: string;
    answer: string;
  }> = [
    { question: "How do I get started?", answer: "Simply sign up for a free account and follow our quick-start guide. You'll be up and running in under 5 minutes." },
    { question: "Is there a free plan?", answer: "Yes! We offer a generous free plan that includes all core features. Upgrade anytime for advanced functionality." },
    { question: "Can I cancel my subscription?", answer: "Absolutely. You can cancel your subscription at any time with no questions asked. No hidden fees or lock-in periods." },
    { question: "Do you offer customer support?", answer: "We provide 24/7 email support for all plans. Priority and live chat support are available on Professional and Enterprise plans." },
    { question: "Is my data secure?", answer: "Security is our top priority. We use bank-level encryption, are SOC 2 certified, and perform regular security audits." },
    { question: "Can I import my existing data?", answer: "Yes, we support imports from all major platforms. Our migration team can also assist with custom data transfers." },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.backgroundColor } },
  }, "FAQ Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "900px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const faqList = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _width: "100%",
    _gap: "0px",
  });
  linkElements(container, faqList);
  elements.push(faqList);

  for (const item of items) {
    const faqItem = createElement("div", faqList.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "24", bottom: "24", left: "0", right: "0" },
      _border: {
        width: { bottom: "1" },
        style: "solid",
        color: { hex: tokens.borderColor },
      },
      _gap: "12px",
    });
    linkElements(faqList, faqItem);
    elements.push(faqItem);

    const question = createElement("heading", faqItem.id, {
      text: item.question,
      tag: "h3",
      _typography: {
        "font-size": "18px",
        "font-weight": "600",
        "line-height": "1.4",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(faqItem, question);
    elements.push(question);

    const answer = createElement("text-basic", faqItem.id, {
      text: `<p>${item.answer}</p>`,
      _typography: {
        "font-size": "16px",
        "line-height": "1.7",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(faqItem, answer);
    elements.push(answer);
  }

  return elements;
}

// ============================================================
// LOGO CLOUD SECTION
// ============================================================
export function generateLogoCloudSection(
  sectionTitle: string = "Trusted by Industry Leaders",
  logos: Array<{ name: string }> = [
    { name: "TechCorp" },
    { name: "InnovateLab" },
    { name: "CloudBase" },
    { name: "DataFlow" },
    { name: "ScaleUp" },
    { name: "NextGen" },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "60", bottom: "60", left: "40", right: "40" },
    _background: { color: { hex: tokens.surfaceColor } },
  }, "Logo Cloud");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _gap: "40px",
  });
  linkElements(section, container);
  elements.push(container);

  const title = createElement("text-basic", container.id, {
    text: `<p>${sectionTitle}</p>`,
    _typography: {
      "font-size": "15px",
      "font-weight": "500",
      color: { hex: tokens.mutedTextColor },
      "text-transform": "uppercase",
      "letter-spacing": "0.08em",
    },
    _textAlign: "center",
  });
  linkElements(container, title);
  elements.push(title);

  const logoRow = createElement("div", container.id, {
    _display: "flex",
    _direction: "row",
    _justifyContent: "center",
    _alignItems: "center",
    _gap: "48px",
    _flexWrap: "wrap",
    _width: "100%",
  });
  linkElements(container, logoRow);
  elements.push(logoRow);

  for (const logo of logos) {
    const logoBox = createElement("div", logoRow.id, {
      _display: "flex",
      _justifyContent: "center",
      _alignItems: "center",
      _padding: { top: "12", bottom: "12", left: "20", right: "20" },
      _opacity: "0.5",
    });
    linkElements(logoRow, logoBox);
    elements.push(logoBox);

    const logoText = createElement("heading", logoBox.id, {
      text: logo.name,
      tag: "custom",
      customTag: "span",
      _typography: {
        "font-size": "22px",
        "font-weight": "700",
        "letter-spacing": "-0.02em",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(logoBox, logoText);
    elements.push(logoText);
  }

  return elements;
}

// ============================================================
// BLOG GRID SECTION
// ============================================================
export function generateBlogSection(
  sectionTitle: string = "Latest from Our Blog",
  sectionSubtitle: string = "Insights, tutorials, and updates from our team",
  posts: Array<{
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readTime?: string;
  }> = [
    { title: "10 Tips for Better Web Design", excerpt: "Learn the fundamental principles that separate good web design from great web design.", category: "Design", date: "Feb 5, 2026", readTime: "5 min read" },
    { title: "The Future of No-Code Tools", excerpt: "How no-code platforms are democratizing web development and what it means for developers.", category: "Technology", date: "Feb 2, 2026", readTime: "8 min read" },
    { title: "SEO Best Practices for 2026", excerpt: "Stay ahead of the curve with these essential SEO strategies for the new year.", category: "Marketing", date: "Jan 28, 2026", readTime: "6 min read" },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.backgroundColor } },
  }, "Blog Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    _gap: "32px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const cardShadow = shadowSettings(tokens);
  const imgColors = [
    withAlpha(tokens.primaryColor, 0.1),
    withAlpha(tokens.secondaryColor, 0.1),
    "#fef3c7",
  ];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];

    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _background: { color: { hex: tokens.surfaceColor } },
      _border: {
        radius: radObj(tokens, 2),
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: tokens.borderColor },
      },
      _overflow: "hidden",
      ...(cardShadow ? { _boxShadow: cardShadow } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    // Image placeholder
    const imgPlaceholder = createElement("div", card.id, {
      _width: "100%",
      _height: "200px",
      _background: { color: { hex: imgColors[i % imgColors.length] } },
      _display: "flex",
      _justifyContent: "center",
      _alignItems: "center",
    });
    linkElements(card, imgPlaceholder);
    elements.push(imgPlaceholder);

    const imgIcon = createElement("text-basic", imgPlaceholder.id, {
      text: "<p>&#128196;</p>",
      _typography: { "font-size": "40px", color: { hex: tokens.mutedTextColor } },
      _opacity: "0.3",
    });
    linkElements(imgPlaceholder, imgIcon);
    elements.push(imgIcon);

    // Content
    const content = createElement("div", card.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "24", bottom: "24", left: "24", right: "24" },
      _gap: "12px",
    });
    linkElements(card, content);
    elements.push(content);

    // Meta row: category + date
    const meta = createElement("div", content.id, {
      _display: "flex",
      _direction: "row",
      _justifyContent: "space-between",
      _alignItems: "center",
    });
    linkElements(content, meta);
    elements.push(meta);

    const category = createElement("text-basic", meta.id, {
      text: `<p>${post.category}</p>`,
      _typography: {
        "font-size": "12px",
        "font-weight": "600",
        color: { hex: tokens.primaryColor },
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
      },
    });
    linkElements(meta, category);
    elements.push(category);

    const date = createElement("text-basic", meta.id, {
      text: `<p>${post.date}</p>`,
      _typography: {
        "font-size": "13px",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(meta, date);
    elements.push(date);

    const postTitle = createElement("heading", content.id, {
      text: post.title,
      tag: "h3",
      _typography: {
        "font-size": "20px",
        "font-weight": "600",
        "line-height": "1.4",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(content, postTitle);
    elements.push(postTitle);

    const excerpt = createElement("text-basic", content.id, {
      text: `<p>${post.excerpt}</p>`,
      _typography: {
        "font-size": "15px",
        "line-height": "1.6",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(content, excerpt);
    elements.push(excerpt);

    // Read more + read time
    const bottomRow = createElement("div", content.id, {
      _display: "flex",
      _direction: "row",
      _justifyContent: "space-between",
      _alignItems: "center",
      _margin: { top: "8" },
    });
    linkElements(content, bottomRow);
    elements.push(bottomRow);

    const readMore = createElement("text-basic", bottomRow.id, {
      text: "<p>Read More &rarr;</p>",
      tag: "a",
      link: { type: "external", url: "#" },
      _typography: {
        "font-size": "15px",
        "font-weight": "600",
        color: { hex: tokens.primaryColor },
        "text-decoration": "none",
      },
    });
    linkElements(bottomRow, readMore);
    elements.push(readMore);

    if (post.readTime) {
      const readTime = createElement("text-basic", bottomRow.id, {
        text: `<p>${post.readTime}</p>`,
        _typography: {
          "font-size": "13px",
          color: { hex: tokens.mutedTextColor },
        },
      });
      linkElements(bottomRow, readTime);
      elements.push(readTime);
    }
  }

  return elements;
}

// ============================================================
// STEPS / PROCESS SECTION
// ============================================================
export function generateStepsSection(
  sectionTitle: string = "How It Works",
  sectionSubtitle: string = "Get started in just a few simple steps",
  steps: Array<{
    title: string;
    description: string;
  }> = [
    { title: "Create Account", description: "Sign up for free in seconds. No credit card required." },
    { title: "Choose Template", description: "Pick from hundreds of professionally designed templates." },
    { title: "Customize", description: "Make it yours with our intuitive drag-and-drop editor." },
    { title: "Launch", description: "Publish your website and share it with the world." },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: tokens.surfaceColor } },
  }, "Steps Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    _gap: "32px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    const stepBlock = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _alignItems: "center",
      _textAlign: "center",
      _gap: "16px",
      _padding: { top: "24", bottom: "24", left: "16", right: "16" },
    });
    linkElements(grid, stepBlock);
    elements.push(stepBlock);

    // Step number circle
    const numberCircle = createElement("div", stepBlock.id, {
      _width: "56px",
      _height: "56px",
      _background: { color: { hex: tokens.primaryColor } },
      _border: {
        radius: { top: "9999", right: "9999", bottom: "9999", left: "9999" },
      },
      _display: "flex",
      _justifyContent: "center",
      _alignItems: "center",
    });
    linkElements(stepBlock, numberCircle);
    elements.push(numberCircle);

    const number = createElement("text-basic", numberCircle.id, {
      text: `<p>${i + 1}</p>`,
      _typography: {
        "font-size": "22px",
        "font-weight": "700",
        color: { hex: "#ffffff" },
      },
    });
    linkElements(numberCircle, number);
    elements.push(number);

    const stepTitle = createElement("heading", stepBlock.id, {
      text: step.title,
      tag: "h3",
      _typography: {
        "font-size": "20px",
        "font-weight": "600",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(stepBlock, stepTitle);
    elements.push(stepTitle);

    const stepDesc = createElement("text-basic", stepBlock.id, {
      text: `<p>${step.description}</p>`,
      _typography: {
        "font-size": "15px",
        "line-height": "1.6",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(stepBlock, stepDesc);
    elements.push(stepDesc);
  }

  return elements;
}

// ============================================================
// PORTFOLIO SECTION
// ============================================================
export function generatePortfolioSection(
  sectionTitle: string = "Our Portfolio",
  sectionSubtitle: string = "Selected projects from our creative team",
  projects: Array<{
    title: string;
    category: string;
    description?: string;
    tags?: string[];
  }> = [
    { title: "Brand Redesign", category: "Branding", description: "Complete brand overhaul for a Fortune 500 company", tags: ["Identity", "Strategy"] },
    { title: "E-Commerce Platform", category: "Development", description: "Custom online store with 50,000+ products", tags: ["React", "Node.js"] },
    { title: "Mobile Banking App", category: "UI/UX", description: "Award-winning fintech app with 1M+ downloads", tags: ["iOS", "Android"] },
    { title: "Corporate Website", category: "Web Design", description: "Modern responsive site for a tech enterprise", tags: ["WordPress", "Design"] },
    { title: "Marketing Dashboard", category: "SaaS", description: "Real-time analytics platform for agencies", tags: ["SaaS", "Data"] },
    { title: "Restaurant Chain", category: "Branding", description: "Multi-location restaurant identity system", tags: ["Print", "Digital"] },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];
  const pad = sectionPad(tokens);
  const cWidth = containerWidth(tokens);
  const gap = gapSize(tokens);

  const section = createElement("section", 0, {
    _padding: pad,
    _background: { color: { hex: tokens.backgroundColor } },
  }, "Portfolio Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: cWidth,
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const badge = createElement("text-basic", headerBlock.id, {
    text: "<p>Portfolio</p>",
    _padding: { top: "6", bottom: "6", left: "16", right: "16" },
    _background: { color: { hex: withAlpha(tokens.primaryColor, 0.1) } },
    _border: { radius: { top: "100", right: "100", bottom: "100", left: "100" } },
    _typography: {
      "font-size": fontSize(tokens, "xs"),
      "font-weight": "600",
      color: { hex: tokens.primaryColor },
      "text-transform": "uppercase",
      "letter-spacing": "0.05em",
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, badge);
  elements.push(badge);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": fontSize(tokens, "h2"),
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
    _width: "600px",
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    _gap: gap,
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const cardShadow = shadowSettings(tokens);
  const imgColors = [
    withAlpha(tokens.primaryColor, 0.08),
    withAlpha(tokens.secondaryColor, 0.08),
    "#fef3c7", "#d1fae5", "#ede9fe", "#fce7f3",
  ];

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];

    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _background: { color: { hex: tokens.surfaceColor } },
      _border: {
        radius: radObj(tokens, 2),
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: tokens.borderColor },
      },
      _overflow: "hidden",
      ...(cardShadow ? { _boxShadow: cardShadow } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    // Image placeholder
    const imgPlaceholder = createElement("div", card.id, {
      _width: "100%",
      _height: "220px",
      _background: { color: { hex: imgColors[i % imgColors.length] } },
      _display: "flex",
      _justifyContent: "center",
      _alignItems: "center",
    });
    linkElements(card, imgPlaceholder);
    elements.push(imgPlaceholder);

    const imgIcon = createElement("text-basic", imgPlaceholder.id, {
      text: "<p>&#128196;</p>",
      _typography: { "font-size": "40px", color: { hex: tokens.mutedTextColor } },
      _opacity: "0.3",
    });
    linkElements(imgPlaceholder, imgIcon);
    elements.push(imgIcon);

    // Content
    const content = createElement("div", card.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "24", bottom: "24", left: "24", right: "24" },
      _gap: "12px",
    });
    linkElements(card, content);
    elements.push(content);

    const category = createElement("text-basic", content.id, {
      text: `<p>${project.category}</p>`,
      _typography: {
        "font-size": fontSize(tokens, "xs"),
        "font-weight": "600",
        color: { hex: tokens.primaryColor },
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
      },
    });
    linkElements(content, category);
    elements.push(category);

    const projectTitle = createElement("heading", content.id, {
      text: project.title,
      tag: "h3",
      _typography: {
        "font-size": fontSize(tokens, "h3"),
        "font-weight": "600",
        "line-height": "1.4",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(content, projectTitle);
    elements.push(projectTitle);

    if (project.description) {
      const desc = createElement("text-basic", content.id, {
        text: `<p>${project.description}</p>`,
        _typography: {
          "font-size": fontSize(tokens, "small"),
          "line-height": "1.6",
          color: { hex: tokens.mutedTextColor },
        },
      });
      linkElements(content, desc);
      elements.push(desc);
    }

    if (project.tags && project.tags.length > 0) {
      const tagRow = createElement("div", content.id, {
        _display: "flex",
        _direction: "row",
        _gap: "8px",
        _flexWrap: "wrap",
        _margin: { top: "4" },
      });
      linkElements(content, tagRow);
      elements.push(tagRow);

      for (const tag of project.tags) {
        const tagEl = createElement("text-basic", tagRow.id, {
          text: `<p>${tag}</p>`,
          _padding: { top: "4", bottom: "4", left: "10", right: "10" },
          _background: { color: { hex: withAlpha(tokens.primaryColor, 0.08) } },
          _border: { radius: radObj(tokens, 0.75) },
          _typography: {
            "font-size": fontSize(tokens, "xs"),
            "font-weight": "500",
            color: { hex: tokens.primaryColor },
          },
        });
        linkElements(tagRow, tagEl);
        elements.push(tagEl);
      }
    }
  }

  return elements;
}

// ============================================================
// SERVICES SECTION
// ============================================================
export function generateServicesSection(
  sectionTitle: string = "Our Services",
  sectionSubtitle: string = "Comprehensive solutions tailored for your business",
  services: Array<{
    title: string;
    description: string;
    features?: string[];
  }> = [
    { title: "Web Design & Development", description: "Custom websites that look great and perform even better.", features: ["Responsive Design", "CMS Integration", "Performance"] },
    { title: "Brand Identity", description: "Memorable brands that stand out in a crowded market.", features: ["Logo Design", "Brand Guidelines", "Visual Identity"] },
    { title: "Digital Marketing", description: "Data-driven strategies that deliver measurable results.", features: ["SEO/SEM", "Content Strategy", "Social Media"] },
    { title: "E-Commerce Solutions", description: "Online stores built to convert visitors into customers.", features: ["WooCommerce", "Custom Cart", "Payments"] },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];
  const pad = sectionPad(tokens);
  const cWidth = containerWidth(tokens);
  const gap = gapSize(tokens);

  const section = createElement("section", 0, {
    _padding: pad,
    _background: { color: { hex: tokens.surfaceColor } },
  }, "Services Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: cWidth,
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": fontSize(tokens, "h2"),
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
    _width: "600px",
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const grid = createElement("div", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    _gap: gap,
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const cardShadow = shadowSettings(tokens);
  const accentColors = [tokens.primaryColor, tokens.secondaryColor, "#06b6d4", "#f59e0b"];

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const accent = accentColors[i % accentColors.length];

    const card = createElement("div", grid.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "36", bottom: "36", left: "32", right: "32" },
      _background: { color: { hex: tokens.backgroundColor } },
      _border: {
        radius: radObj(tokens, 2),
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: tokens.borderColor },
      },
      _gap: "20px",
      ...(cardShadow ? { _boxShadow: cardShadow } : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    // Accent top border
    const accentBar = createElement("div", card.id, {
      _width: "48px",
      _height: "4px",
      _background: { color: { hex: accent } },
      _border: { radius: { top: "9999", right: "9999", bottom: "9999", left: "9999" } },
    });
    linkElements(card, accentBar);
    elements.push(accentBar);

    const serviceTitle = createElement("heading", card.id, {
      text: service.title,
      tag: "h3",
      _typography: {
        "font-size": fontSize(tokens, "h3"),
        "font-weight": "600",
        "line-height": "1.4",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(card, serviceTitle);
    elements.push(serviceTitle);

    const serviceDesc = createElement("text-basic", card.id, {
      text: `<p>${service.description}</p>`,
      _typography: {
        "font-size": fontSize(tokens, "body"),
        "line-height": "1.7",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(card, serviceDesc);
    elements.push(serviceDesc);

    if (service.features && service.features.length > 0) {
      const featureList = createElement("div", card.id, {
        _display: "flex",
        _direction: "column",
        _gap: "8px",
        _margin: { top: "4" },
      });
      linkElements(card, featureList);
      elements.push(featureList);

      for (const feat of service.features) {
        const featEl = createElement("text-basic", featureList.id, {
          text: `<p>&#10003; ${feat}</p>`,
          _typography: {
            "font-size": fontSize(tokens, "small"),
            color: { hex: tokens.textColor },
          },
        });
        linkElements(featureList, featEl);
        elements.push(featEl);
      }
    }

    const learnMore = createElement("text-basic", card.id, {
      text: "<p>Learn More &rarr;</p>",
      tag: "a",
      link: { type: "external", url: "#" },
      _typography: {
        "font-size": fontSize(tokens, "small"),
        "font-weight": "600",
        color: { hex: accent },
        "text-decoration": "none",
      },
      _margin: { top: "auto" },
    });
    linkElements(card, learnMore);
    elements.push(learnMore);
  }

  return elements;
}

// ============================================================
// TIMELINE SECTION
// ============================================================
export function generateTimelineSection(
  sectionTitle: string = "Our Journey",
  sectionSubtitle: string = "Key milestones in our story",
  events: Array<{
    year: string;
    title: string;
    description: string;
  }> = [
    { year: "2018", title: "Founded", description: "Started with a small team and a big vision to transform the industry." },
    { year: "2019", title: "First Product Launch", description: "Released our flagship product to overwhelming positive response." },
    { year: "2020", title: "Series A Funding", description: "Raised $5M to accelerate growth and expand the team." },
    { year: "2022", title: "10,000 Customers", description: "Reached a major milestone in user adoption worldwide." },
    { year: "2024", title: "Global Expansion", description: "Opened offices in Europe and Asia to serve customers globally." },
    { year: "2026", title: "Industry Leader", description: "Recognized as a market leader by top industry analysts." },
  ],
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];
  const pad = sectionPad(tokens);
  const cWidth = containerWidth(tokens);

  const section = createElement("section", 0, {
    _padding: pad,
    _background: { color: { hex: tokens.backgroundColor } },
  }, "Timeline Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: cWidth,
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": fontSize(tokens, "h2"),
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  // Timeline container - vertical layout with center line
  const timelineContainer = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _width: "800px",
    _margin: { left: "auto", right: "auto" },
    _gap: "0px",
    _position: "relative",
  });
  linkElements(container, timelineContainer);
  elements.push(timelineContainer);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventRow = createElement("div", timelineContainer.id, {
      _display: "flex",
      _direction: "row",
      _alignItems: "flex-start",
      _gap: "24px",
      _padding: { top: "0", bottom: "32", left: "36", right: "0" },
      _margin: { left: "19" },
      ...(i < events.length - 1 ? {
        _border: {
          width: { left: "2" },
          style: "solid",
          color: { hex: tokens.borderColor },
        },
      } : {}),
    });
    linkElements(timelineContainer, eventRow);
    elements.push(eventRow);

    // Dot indicator
    const dot = createElement("div", eventRow.id, {
      _width: "14px",
      _height: "14px",
      _minWidth: "14px",
      _background: { color: { hex: tokens.primaryColor } },
      _border: {
        radius: { top: "9999", right: "9999", bottom: "9999", left: "9999" },
        width: { top: "3", right: "3", bottom: "3", left: "3" },
        style: "solid",
        color: { hex: tokens.backgroundColor },
      },
      _boxShadow: { values: { offsetY: "0", blur: "0", spread: "3" }, color: { hex: withAlpha(tokens.primaryColor, 0.3) } },
      _position: "absolute",
      _left: "13px",
      _margin: { top: "4" },
    });
    linkElements(eventRow, dot);
    elements.push(dot);

    const eventContent = createElement("div", eventRow.id, {
      _display: "flex",
      _direction: "column",
      _gap: "8px",
    });
    linkElements(eventRow, eventContent);
    elements.push(eventContent);

    const yearBadge = createElement("text-basic", eventContent.id, {
      text: `<p>${event.year}</p>`,
      _typography: {
        "font-size": fontSize(tokens, "xs"),
        "font-weight": "700",
        color: { hex: tokens.primaryColor },
        "letter-spacing": "0.05em",
      },
    });
    linkElements(eventContent, yearBadge);
    elements.push(yearBadge);

    const eventTitle = createElement("heading", eventContent.id, {
      text: event.title,
      tag: "h3",
      _typography: {
        "font-size": fontSize(tokens, "h3"),
        "font-weight": "600",
        color: { hex: tokens.headingColor },
      },
    });
    linkElements(eventContent, eventTitle);
    elements.push(eventTitle);

    const eventDesc = createElement("text-basic", eventContent.id, {
      text: `<p>${event.description}</p>`,
      _typography: {
        "font-size": fontSize(tokens, "body"),
        "line-height": "1.7",
        color: { hex: tokens.mutedTextColor },
      },
    });
    linkElements(eventContent, eventDesc);
    elements.push(eventDesc);
  }

  return elements;
}

// ============================================================
// 404 ERROR SECTION
// ============================================================
export function generate404Section(
  headline: string = "404",
  subtext: string = "Oops! The page you're looking for doesn't exist or has been moved.",
  buttonText: string = "Go Back Home",
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "120", bottom: "120", left: "40", right: "40" },
    _background: { color: { hex: tokens.backgroundColor } },
    _minHeight: "80vh",
    _display: "flex",
    _justifyContent: "center",
    _alignItems: "center",
  }, "404 Error Page");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _width: "600px",
    _margin: { left: "auto", right: "auto" },
    _gap: "24px",
  });
  linkElements(section, container);
  elements.push(container);

  // Large 404 number
  const bigNumber = createElement("heading", container.id, {
    text: headline,
    tag: "h1",
    _typography: {
      "font-size": "120px",
      "font-weight": "800",
      "line-height": "1",
      "letter-spacing": "-0.04em",
      color: { hex: withAlpha(tokens.primaryColor, 0.15) },
    },
  });
  linkElements(container, bigNumber);
  elements.push(bigNumber);

  const subHeading = createElement("heading", container.id, {
    text: "Page Not Found",
    tag: "h2",
    _typography: {
      "font-size": fontSize(tokens, "h2"),
      "font-weight": "700",
      color: { hex: tokens.headingColor },
    },
    _margin: { top: "-16" },
  });
  linkElements(container, subHeading);
  elements.push(subHeading);

  const text = createElement("text-basic", container.id, {
    text: `<p>${subtext}</p>`,
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "line-height": "1.6",
      color: { hex: tokens.mutedTextColor },
    },
    _width: "480px",
  });
  linkElements(container, text);
  elements.push(text);

  const btnRow = createElement("div", container.id, {
    _display: "flex",
    _direction: "row",
    _gap: "16px",
    _justifyContent: "center",
    _margin: { top: "8" },
  });
  linkElements(container, btnRow);
  elements.push(btnRow);

  const homeBtn = createElement("text-basic", btnRow.id, {
    text: `<p>${buttonText}</p>`,
    tag: "a",
    link: { type: "external", url: "/" },
    _padding: { top: "14", bottom: "14", left: "32", right: "32" },
    _background: { color: { hex: tokens.primaryColor } },
    _border: { radius: radObj(tokens) },
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
  });
  linkElements(btnRow, homeBtn);
  elements.push(homeBtn);

  const contactBtn = createElement("text-basic", btnRow.id, {
    text: "<p>Contact Support</p>",
    tag: "a",
    link: { type: "external", url: "#contact" },
    _padding: { top: "14", bottom: "14", left: "32", right: "32" },
    _background: { color: { hex: "transparent" } },
    _border: {
      radius: radObj(tokens),
      width: { top: "2", right: "2", bottom: "2", left: "2" },
      style: "solid",
      color: { hex: tokens.borderColor },
    },
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "font-weight": "600",
      color: { hex: tokens.textColor },
      "text-decoration": "none",
    },
  });
  linkElements(btnRow, contactBtn);
  elements.push(contactBtn);

  return elements;
}

// ============================================================
// COMING SOON SECTION
// ============================================================
export function generateComingSoonSection(
  headline: string = "Coming Soon",
  subtext: string = "We're working on something amazing. Be the first to know when we launch.",
  brandName: string = "BrandName",
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "0", bottom: "0", left: "40", right: "40" },
    _background: { color: { hex: tokens.darkMode ? tokens.backgroundColor : "#0f172a" } },
    _minHeight: "100vh",
    _display: "flex",
    _justifyContent: "center",
    _alignItems: "center",
  }, "Coming Soon Page");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _width: "700px",
    _margin: { left: "auto", right: "auto" },
    _gap: "32px",
  });
  linkElements(section, container);
  elements.push(container);

  // Brand name
  const brand = createElement("heading", container.id, {
    text: brandName,
    tag: "h3",
    _typography: {
      "font-size": "24px",
      "font-weight": "700",
      "letter-spacing": "-0.02em",
      color: { hex: tokens.primaryColor },
    },
  });
  linkElements(container, brand);
  elements.push(brand);

  const mainHeading = createElement("heading", container.id, {
    text: headline,
    tag: "h1",
    _typography: {
      "font-size": "64px",
      "font-weight": "800",
      "line-height": "1.1",
      "letter-spacing": "-0.03em",
      color: { hex: tokens.darkMode ? tokens.headingColor : "#ffffff" },
    },
  });
  linkElements(container, mainHeading);
  elements.push(mainHeading);

  const text = createElement("text-basic", container.id, {
    text: `<p>${subtext}</p>`,
    _typography: {
      "font-size": "20px",
      "line-height": "1.6",
      color: { hex: tokens.darkMode ? tokens.mutedTextColor : "#94a3b8" },
    },
    _width: "560px",
  });
  linkElements(container, text);
  elements.push(text);

  // Email signup form
  const formRow = createElement("div", container.id, {
    _display: "flex",
    _direction: "row",
    _gap: "12px",
    _justifyContent: "center",
    _alignItems: "center",
    _width: "480px",
    _margin: { top: "8" },
    _flexWrap: "wrap",
  });
  linkElements(container, formRow);
  elements.push(formRow);

  const emailInput = createElement("text-basic", formRow.id, {
    text: "<p>Enter your email</p>",
    _padding: { top: "14", bottom: "14", left: "20", right: "20" },
    _background: { color: { hex: tokens.darkMode ? tokens.surfaceColor : "#1e293b" } },
    _border: {
      radius: radObj(tokens),
      width: { top: "1", right: "1", bottom: "1", left: "1" },
      style: "solid",
      color: { hex: tokens.darkMode ? tokens.borderColor : "#334155" },
    },
    _typography: {
      "font-size": "15px",
      color: { hex: tokens.darkMode ? tokens.mutedTextColor : "#64748b" },
    },
    _width: "300px",
  });
  linkElements(formRow, emailInput);
  elements.push(emailInput);

  const notifyBtn = createElement("text-basic", formRow.id, {
    text: "<p>Notify Me</p>",
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "14", bottom: "14", left: "28", right: "28" },
    _background: { color: { hex: tokens.primaryColor } },
    _border: { radius: radObj(tokens) },
    _typography: {
      "font-size": "15px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
  });
  linkElements(formRow, notifyBtn);
  elements.push(notifyBtn);

  // Social links placeholder
  const socialRow = createElement("div", container.id, {
    _display: "flex",
    _direction: "row",
    _gap: "20px",
    _justifyContent: "center",
    _margin: { top: "24" },
  });
  linkElements(container, socialRow);
  elements.push(socialRow);

  for (const social of ["Twitter", "LinkedIn", "GitHub"]) {
    const socialLink = createElement("text-basic", socialRow.id, {
      text: `<p>${social}</p>`,
      tag: "a",
      link: { type: "external", url: "#" },
      _typography: {
        "font-size": "14px",
        "font-weight": "500",
        color: { hex: tokens.darkMode ? tokens.mutedTextColor : "#64748b" },
        "text-decoration": "none",
      },
    });
    linkElements(socialRow, socialLink);
    elements.push(socialLink);
  }

  return elements;
}

// ============================================================
// LOGIN SECTION
// ============================================================
export function generateLoginSection(
  heading: string = "Welcome Back",
  subtext: string = "Sign in to your account to continue",
  brandName: string = "BrandName",
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "0", bottom: "0", left: "0", right: "0" },
    _background: { color: { hex: tokens.surfaceColor } },
    _minHeight: "100vh",
    _display: "flex",
    _justifyContent: "center",
    _alignItems: "center",
  }, "Login Page");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "440px",
    _margin: { left: "auto", right: "auto" },
    _padding: { top: "48", bottom: "48", left: "40", right: "40" },
    _background: { color: { hex: tokens.backgroundColor } },
    _border: {
      radius: radObj(tokens, 2),
      width: { top: "1", right: "1", bottom: "1", left: "1" },
      style: "solid",
      color: { hex: tokens.borderColor },
    },
    _gap: "28px",
  });
  linkElements(section, container);
  elements.push(container);

  // Brand
  const brand = createElement("heading", container.id, {
    text: brandName,
    tag: "h3",
    _typography: {
      "font-size": "24px",
      "font-weight": "700",
      color: { hex: tokens.primaryColor },
    },
    _textAlign: "center",
  });
  linkElements(container, brand);
  elements.push(brand);

  // Heading
  const headerBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _gap: "8px",
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: heading,
    tag: "h2",
    _typography: {
      "font-size": fontSize(tokens, "h3"),
      "font-weight": "700",
      color: { hex: tokens.headingColor },
    },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const sub = createElement("text-basic", headerBlock.id, {
    text: `<p>${subtext}</p>`,
    _typography: {
      "font-size": fontSize(tokens, "small"),
      color: { hex: tokens.mutedTextColor },
    },
  });
  linkElements(headerBlock, sub);
  elements.push(sub);

  // Login form
  const form = createElement("form", container.id, {
    fields: [
      { type: "email", label: "Email", placeholder: "you@example.com", required: true, id: generateId() },
      { type: "password", label: "Password", placeholder: "Enter your password", required: true, id: generateId() },
    ],
    submitButtonText: "Sign In",
    submitButtonStyle: "primary",
    submitButtonBackgroundColor: { hex: tokens.primaryColor },
    submitButtonTypography: {
      "font-size": "16px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
    },
    submitButtonBorder: { radius: radObj(tokens) },
    submitButtonPadding: { top: "14", bottom: "14", left: "24", right: "24" },
    fieldBackgroundColor: { hex: tokens.surfaceColor },
    fieldBorder: {
      radius: radObj(tokens),
      width: { top: "1", right: "1", bottom: "1", left: "1" },
      style: "solid",
      color: { hex: tokens.borderColor },
    },
    fieldTypography: {
      "font-size": "15px",
      color: { hex: tokens.textColor },
    },
    labelTypography: {
      "font-size": "14px",
      "font-weight": "500",
      color: { hex: tokens.textColor },
    },
    showLabels: true,
  });
  linkElements(container, form);
  elements.push(form);

  // Forgot password link
  const forgotLink = createElement("text-basic", container.id, {
    text: "<p>Forgot your password?</p>",
    tag: "a",
    link: { type: "external", url: "#" },
    _typography: {
      "font-size": fontSize(tokens, "small"),
      "font-weight": "500",
      color: { hex: tokens.primaryColor },
      "text-decoration": "none",
    },
    _textAlign: "center",
    _margin: { top: "-12" },
  });
  linkElements(container, forgotLink);
  elements.push(forgotLink);

  // Divider
  const dividerRow = createElement("div", container.id, {
    _display: "flex",
    _direction: "row",
    _alignItems: "center",
    _gap: "16px",
    _width: "100%",
  });
  linkElements(container, dividerRow);
  elements.push(dividerRow);

  const dividerLeft = createElement("div", dividerRow.id, {
    _height: "1px",
    _background: { color: { hex: tokens.borderColor } },
    _width: "100%",
  });
  linkElements(dividerRow, dividerLeft);
  elements.push(dividerLeft);

  const dividerText = createElement("text-basic", dividerRow.id, {
    text: "<p>or</p>",
    _typography: {
      "font-size": "13px",
      color: { hex: tokens.mutedTextColor },
    },
    _minWidth: "24px",
    _textAlign: "center",
  });
  linkElements(dividerRow, dividerText);
  elements.push(dividerText);

  const dividerRight = createElement("div", dividerRow.id, {
    _height: "1px",
    _background: { color: { hex: tokens.borderColor } },
    _width: "100%",
  });
  linkElements(dividerRow, dividerRight);
  elements.push(dividerRight);

  // Social login button placeholder
  const socialBtn = createElement("text-basic", container.id, {
    text: "<p>Continue with Google</p>",
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "12", bottom: "12", left: "24", right: "24" },
    _background: { color: { hex: "transparent" } },
    _border: {
      radius: radObj(tokens),
      width: { top: "1", right: "1", bottom: "1", left: "1" },
      style: "solid",
      color: { hex: tokens.borderColor },
    },
    _typography: {
      "font-size": "15px",
      "font-weight": "500",
      color: { hex: tokens.textColor },
      "text-decoration": "none",
      "text-align": "center",
    },
    _width: "100%",
  });
  linkElements(container, socialBtn);
  elements.push(socialBtn);

  // Sign up link
  const signupLink = createElement("text-basic", container.id, {
    text: `<p>Don't have an account? <strong>Sign up</strong></p>`,
    _typography: {
      "font-size": fontSize(tokens, "small"),
      color: { hex: tokens.mutedTextColor },
    },
    _textAlign: "center",
  });
  linkElements(container, signupLink);
  elements.push(signupLink);

  return elements;
}

// ============================================================
// CONTENT / INTRODUCTION SECTION
// ============================================================
export function generateContentSection(
  sectionTitle: string = "About Our Company",
  content: string = "We are a team of passionate designers and developers dedicated to creating exceptional digital experiences. With over a decade of experience, we've helped hundreds of businesses transform their online presence and achieve their goals.",
  imagePosition: "left" | "right" | "none" = "right",
  tokens: DesignTokens = LIGHT_DEFAULTS
): BricksElement[] {
  const elements: BricksElement[] = [];
  const pad = sectionPad(tokens);
  const cWidth = containerWidth(tokens);

  const section = createElement("section", 0, {
    _padding: pad,
    _background: { color: { hex: tokens.backgroundColor } },
  }, "Content Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: imagePosition === "none" ? "column" : "row",
    _alignItems: imagePosition === "none" ? "center" : "center",
    _width: cWidth,
    _margin: { left: "auto", right: "auto" },
    _gap: "60px",
    _flexWrap: "wrap",
  });
  linkElements(section, container);
  elements.push(container);

  // Text content
  const textBlock = createElement("div", container.id, {
    _display: "flex",
    _direction: "column",
    _gap: "24px",
    _width: imagePosition === "none" ? "800px" : "50%",
    _minWidth: "300px",
    ...(imagePosition === "none" ? { _textAlign: "center", _alignItems: "center" } : {}),
    ...(imagePosition === "left" ? { _order: "2" } : {}),
  });
  linkElements(container, textBlock);
  elements.push(textBlock);

  const badge = createElement("text-basic", textBlock.id, {
    text: "<p>About Us</p>",
    _padding: { top: "6", bottom: "6", left: "16", right: "16" },
    _background: { color: { hex: withAlpha(tokens.primaryColor, 0.1) } },
    _border: { radius: { top: "100", right: "100", bottom: "100", left: "100" } },
    _typography: {
      "font-size": fontSize(tokens, "xs"),
      "font-weight": "600",
      color: { hex: tokens.primaryColor },
      "text-transform": "uppercase",
      "letter-spacing": "0.05em",
    },
    _alignSelf: imagePosition === "none" ? "center" : "flex-start",
  });
  linkElements(textBlock, badge);
  elements.push(badge);

  const title = createElement("heading", textBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": fontSize(tokens, "h2"),
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: tokens.headingColor },
    },
  });
  linkElements(textBlock, title);
  elements.push(title);

  const text = createElement("text-basic", textBlock.id, {
    text: `<p>${content}</p>`,
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "line-height": "1.8",
      color: { hex: tokens.mutedTextColor },
    },
  });
  linkElements(textBlock, text);
  elements.push(text);

  // CTA button
  const ctaBtn = createElement("text-basic", textBlock.id, {
    text: "<p>Learn More &rarr;</p>",
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "14", bottom: "14", left: "28", right: "28" },
    _background: { color: { hex: tokens.primaryColor } },
    _border: { radius: radObj(tokens) },
    _typography: {
      "font-size": fontSize(tokens, "body"),
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
    _alignSelf: imagePosition === "none" ? "center" : "flex-start",
  });
  linkElements(textBlock, ctaBtn);
  elements.push(ctaBtn);

  // Image block (if not "none")
  if (imagePosition !== "none") {
    const imageBlock = createElement("div", container.id, {
      _width: "45%",
      _minWidth: "300px",
      ...(imagePosition === "left" ? { _order: "1" } : {}),
    });
    linkElements(container, imageBlock);
    elements.push(imageBlock);

    const imgPlaceholder = createElement("div", imageBlock.id, {
      _width: "100%",
      _height: "400px",
      _background: { color: { hex: withAlpha(tokens.primaryColor, 0.08) } },
      _border: { radius: radObj(tokens, 2) },
      _display: "flex",
      _justifyContent: "center",
      _alignItems: "center",
    });
    linkElements(imageBlock, imgPlaceholder);
    elements.push(imgPlaceholder);

    const imgIcon = createElement("text-basic", imgPlaceholder.id, {
      text: "<p>&#128247;</p>",
      _typography: { "font-size": "56px", color: { hex: tokens.mutedTextColor } },
      _opacity: "0.3",
    });
    linkElements(imgPlaceholder, imgIcon);
    elements.push(imgIcon);
  }

  return elements;
}

// Full page generator (uses default tokens if none provided)
export function generateFullPage(
  config: {
    brandName?: string;
    headline?: string;
    subtext?: string;
    includeNavbar?: boolean;
    includeHero?: boolean;
    includeFeatures?: boolean;
    includePricing?: boolean;
    includeTestimonials?: boolean;
    includeCTA?: boolean;
    includeContact?: boolean;
    includeFooter?: boolean;
    includeServices?: boolean;
    includePortfolio?: boolean;
    includeTimeline?: boolean;
    includeContent?: boolean;
    tokens?: DesignTokens;
  } = {}
): BricksElement[] {
  const {
    brandName = "BrandName",
    headline,
    subtext,
    includeNavbar = true,
    includeHero = true,
    includeFeatures = true,
    includePricing = true,
    includeTestimonials = true,
    includeCTA = true,
    includeContact = false,
    includeFooter = true,
    includeServices = false,
    includePortfolio = false,
    includeTimeline = false,
    includeContent = false,
    tokens = LIGHT_DEFAULTS,
  } = config;

  let elements: BricksElement[] = [];

  if (includeNavbar) elements = [...elements, ...generateNavbar(brandName, undefined, undefined, tokens)];
  if (includeHero) elements = [...elements, ...generateHeroSection(headline, subtext, undefined, undefined, undefined, tokens)];
  if (includeContent) elements = [...elements, ...generateContentSection(undefined, undefined, undefined, tokens)];
  if (includeFeatures) elements = [...elements, ...generateFeaturesSection(undefined, undefined, undefined, tokens)];
  if (includeServices) elements = [...elements, ...generateServicesSection(undefined, undefined, undefined, tokens)];
  if (includePortfolio) elements = [...elements, ...generatePortfolioSection(undefined, undefined, undefined, tokens)];
  if (includeTestimonials) elements = [...elements, ...generateTestimonialsSection(undefined, tokens)];
  if (includeTimeline) elements = [...elements, ...generateTimelineSection(undefined, undefined, undefined, tokens)];
  if (includePricing) elements = [...elements, ...generatePricingSection(undefined, tokens)];
  if (includeCTA) elements = [...elements, ...generateCTASection(undefined, undefined, undefined, tokens)];
  if (includeContact) elements = [...elements, ...generateContactSection(tokens)];
  if (includeFooter) elements = [...elements, ...generateFooterSection(brandName, undefined, tokens)];

  return elements;
}
