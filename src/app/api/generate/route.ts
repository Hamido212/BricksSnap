import { NextRequest, NextResponse } from "next/server";
import {
  generateHeroSection,
  generateNavbar,
  generateFeaturesSection,
  generatePricingSection,
  generateTestimonialsSection,
  generateFooterSection,
  generateCTASection,
  generateContactSection,
  generateGallerySection,
  generateTeamSection,
  generateStatsSection,
  generateFaqSection,
  generateLogoCloudSection,
  generateBlogSection,
  generateStepsSection,
  generatePortfolioSection,
  generateServicesSection,
  generateTimelineSection,
  generate404Section,
  generateComingSoonSection,
  generateLoginSection,
  generateContentSection,
  wrapTemplate,
  resolveDesignTokens,
  BricksElement,
  DesignTokens,
} from "@/lib/bricks-engine";
import { validateBricksElements } from "@/lib/bricks-validator";

// Generation config that both built-in and AI modes produce
interface GenerationConfig {
  sections: string[];
  brandName: string;
  headline: string;
  subtext: string;
  heroStyle: "centered" | "split" | "gradient";
  buttonText: string;
  features: Array<{ title: string; description: string }>;
  plans: Array<{
    name: string;
    price: string;
    period: string;
    features: string[];
    highlighted?: boolean;
    buttonText?: string;
  }>;
  testimonials: Array<{
    quote: string;
    author: string;
    role: string;
    rating: number;
  }>;
  navLinks: Array<{ text: string; url: string }>;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButtonText: string;
  galleryItems: Array<{ title: string; category: string }>;
  gallerySectionTitle: string;
  gallerySectionSubtitle: string;
  teamMembers: Array<{ name: string; role: string; bio?: string }>;
  stats: Array<{ value: string; label: string; description?: string }>;
  faqItems: Array<{ question: string; answer: string }>;
  logoNames: Array<{ name: string }>;
  blogPosts: Array<{ title: string; excerpt: string; category: string; date: string; readTime?: string }>;
  steps: Array<{ title: string; description: string }>;
  portfolioProjects: Array<{ title: string; category: string; description?: string; tags?: string[] }>;
  services: Array<{ title: string; description: string; features?: string[] }>;
  timelineEvents: Array<{ year: string; title: string; description: string }>;
  contentTitle: string;
  contentText: string;
  contentImagePosition: "left" | "right" | "none";
  errorHeadline: string;
  errorSubtext: string;
  comingSoonHeadline: string;
  comingSoonSubtext: string;
  loginHeading: string;
  loginSubtext: string;
  designTokens: Partial<DesignTokens>;
}

// ============================================================
// PHASE 2: AI GENERATES DIREKTES BRICKS JSON (Creative Mode)
// ============================================================

const BRICKS_SYSTEM_PROMPT = `You are a Bricks Builder JSON Generator.

## YOUR TASK:
The user describes a website. You generate DIRECT valid Bricks Builder JSON.

## REQUIRED (MUST follow):

### 1. JSON STRUCTURE (CANNOT change):
- Each element needs: id (6 chars), name, parent (0 or parent ID), children (Array), settings
- Section containers: parent=0 (root)
- Nested elements: parent = parent element's ID
- children Array contains all child element IDs

### 2. ALL VALID BRICKS ELEMENT NAMES:

**Layout Elements:**
- **"section"** – Root-level section wrapper (parent=0). Use for every major page section.
- **"container"** – Constrained container (max-width). Nest inside section.
- **"block"** – Generic block-level wrapper (like a div but Bricks-native).
- **"div"** – Generic flex/grid container for layouts.

**Basic Elements:**
- **"heading"** – Headlines. Settings: text, tag ("h1"|"h2"|"h3"|"h4"|"h5"|"h6")
- **"text-basic"** – Paragraphs, inline text, AND buttons/links.
  - For text: "tag": "p" or omit tag. "text": "<p>Content</p>"
  - For BUTTONS/LINKS: "tag": "a", "link": { "type": "external", "url": "#" }
- **"text"** – Rich text element (alias: rich text). Settings: text (HTML string)
- **"button"** – Standalone button. Settings: text, link: { type, url }, size, style, icon
- **"icon"** – Icon element. Settings: icon: { library, icon }, iconSize, iconColor
- **"image"** – Image. Settings: image: { url, filename }, _objectFit, _width, _height
- **"video"** – Video embed. Settings: videoType ("youtube"|"vimeo"|"media"), videoId or videoUrl

**General Elements:**
- **"divider"** – Horizontal rule/divider. Settings: _width, _height, _background
- **"icon-box"** – Icon + heading + text combo. Settings: icon, title, content
- **"icon-list"** – List with icons. Settings: items: [{ icon, title, text }]
- **"list"** – Ordered/unordered list. Settings: items: [{ text }], listType
- **"accordion"** – Accordion FAQ. Settings: items: [{ title, content }]
- **"accordion-nested"** – Nestable accordion with child elements
- **"tabs"** – Tab panels. Settings: items: [{ title, content }]
- **"tabs-nested"** – Nestable tabs with child elements
- **"form"** – Contact forms. Settings: fields: [{ type, label, placeholder, required }], submitButton, actions
- **"map"** – Google Map. Settings: address, zoom, height
- **"alert"** – Alert/notice box. Settings: type ("info"|"success"|"warning"|"danger"), content
- **"countdown"** – Countdown timer. Settings: date, format
- **"counter"** – Animated counter. Settings: countTo, prefix, suffix, duration
- **"progress-bar"** – Progress bar. Settings: percentage, label, color
- **"pie-chart"** – Pie/donut chart. Settings: percentage, size, color
- **"pricing-tables"** – Built-in pricing. Settings: items: [{ title, price, period, features, button }]
- **"team-members"** – Built-in team. Settings: items: [{ name, role, image, socialLinks }]
- **"testimonials"** – Built-in testimonials. Settings: items: [{ content, name, role, image }]
- **"code"** – Code block. Settings: code, language
- **"logo"** – Logo/brand. Settings: image, link
- **"social-icons"** – Social media icons. Settings: items: [{ icon, link }]

**Media Elements:**
- **"image-gallery"** – Image gallery grid. Settings: items: [{ image }], columns, gap
- **"audio"** – Audio player. Settings: audioUrl
- **"carousel"** – Image/content carousel. Settings: items, slidesToShow, autoplay
- **"slider"** – Slider. Settings: items, autoplay, arrows, dots
- **"slider-nested"** – Nestable slider with child elements per slide
- **"svg"** – Inline SVG. Settings: svgCode, _width, _height, fill

**WordPress Elements:**
- **"posts"** – Post loop/grid. Settings: query: { post_type, posts_per_page, orderby }
- **"pagination"** – Post pagination
- **"nav-menu"** – WP nav menu. Settings: menu (menu ID/slug)
- **"sidebar"** – WP sidebar widget area
- **"search"** – Search form
- **"shortcode"** – Shortcode embed. Settings: shortcode
- **"post-title"** – Dynamic post title
- **"post-content"** – Dynamic post content
- **"post-excerpt"** – Dynamic excerpt
- **"post-meta"** – Post meta data
- **"template"** – Embed another Bricks template by ID

IMPORTANT: For simple/static site generation, prefer these core elements: section, container, div, block, heading, text-basic, text, button, icon, image, video, divider, icon-box, list, accordion, form, svg. Only use WP-dynamic elements when the user explicitly asks for them.

### 3. COMPLETE CUSTOMIZATION PARAMETERS (settings keys):

**Layout:**
- _display: "block" | "flex" | "grid" | "inline" | "inline-flex" | "inline-block" | "none"
- _position: "static" | "relative" | "absolute" | "fixed" | "sticky"
- _zIndex: String (e.g., "50")
- _overflow: "visible" | "hidden" | "scroll" | "auto"
- _width: "100%" | "50%" | "auto" | "1200px" | any CSS value
- _height: String (e.g., "100vh", "48px", "auto")
- _minWidth: String
- _minHeight: String (e.g., "100vh")
- _maxWidth: String (e.g., "1200px", "680px")
- _maxHeight: String
- _aspectRatio: String (e.g., "16/9", "1/1")
- _objectFit: "cover" | "contain" | "fill" | "none" | "scale-down"
- _objectPosition: String (e.g., "center center", "top left")
- _top, _right, _bottom, _left: String (for positioned elements)
- _float: "left" | "right" | "none"

**Flex (when _display: "flex"):**
- _direction: "row" | "column" | "row-reverse" | "column-reverse"
- _flexWrap: "nowrap" | "wrap" | "wrap-reverse"
- _justifyContent: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly"
- _alignItems: "flex-start" | "flex-end" | "center" | "stretch" | "baseline"
- _alignContent: "flex-start" | "flex-end" | "center" | "stretch" | "space-between" | "space-around"
- _gap: String (e.g., "32px", "24")
- _rowGap: String
- _columnGap: String
- _flexGrow: String (child property)
- _flexShrink: String (child property)
- _flexBasis: String (child property, e.g., "0%", "auto")
- _order: String (child property)
- _alignSelf: "auto" | "flex-start" | "flex-end" | "center" | "stretch" (child property)

**Grid (when _display: "grid"):**
- _gridTemplateColumns: CSS grid template (e.g., "repeat(3, 1fr)", "repeat(auto-fill, minmax(320px, 1fr))")
- _gridTemplateRows: String
- _gridAutoFlow: "row" | "column" | "dense"
- _gridColumnSpan: String (child, e.g., "span 2")
- _gridRowSpan: String (child)
- _justifyItems: "start" | "end" | "center" | "stretch"
- _alignItems: "start" | "end" | "center" | "stretch"

**Spacing:**
- _margin: { top: String, right: String, bottom: String, left: String } (values in px as strings, e.g., "40")
- _padding: { top: String, right: String, bottom: String, left: String }

**Typography:**
- _typography: {
    "font-family": String (e.g., "Inter", "Poppins", "system-ui"),
    "font-size": String (e.g., "48px", "16px", "1.125rem"),
    "font-weight": String ("100" to "900", "normal", "bold"),
    "line-height": String (e.g., "1.2", "1.6", "28px"),
    "letter-spacing": String (e.g., "0.05em", "-0.02em"),
    "text-transform": "uppercase" | "lowercase" | "capitalize" | "none",
    "text-decoration": "none" | "underline" | "line-through",
    "font-style": "normal" | "italic",
    "text-align": "left" | "center" | "right" | "justify",
    "color": { hex: "#HEX" },
    "white-space": "normal" | "nowrap" | "pre-wrap",
    "word-break": "normal" | "break-all" | "break-word"
  }
- _textAlign: "center" | "left" | "right" (shorthand for text-align on container)

**Background:**
- _background: {
    color: { hex: "#HEX" },
    image: { url: "https://...", size: "cover" | "contain" | "custom", position: "center center", repeat: "no-repeat" | "repeat", attachment: "scroll" | "fixed" },
    gradient: { type: "linear" | "radial", angle: "180", colors: [{ color: { hex: "#HEX" }, position: "0" }, { color: { hex: "#HEX" }, position: "100" }] },
    overlay: { color: { hex: "#00000080" } }
  }

**Border & Radius:**
- _border: {
    width: { top: String, right: String, bottom: String, left: String } | String,
    style: "solid" | "dashed" | "dotted" | "double" | "none",
    color: { hex: "#HEX" },
    radius: { top: String, right: String, bottom: String, left: String }
  }

**Box Shadow:**
- _boxShadow: {
    values: { offsetX: String, offsetY: String, blur: String, spread: String },
    color: { hex: "#HEX" },
    inset: boolean
  }

**Filter & Backdrop Filter (via _cssCustom):**
- _cssCustom: "%root% { filter: blur(Xpx) brightness(X) contrast(X%) saturate(X%) hue-rotate(Xdeg) drop-shadow(X Y blur color); }"
- _cssCustom: "%root% { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }" (for glass effects)

**Transitions (via _cssCustom):**
- _cssCustom: "%root% { transition: all 0.3s ease; }" or "%root%:hover { transform: translateY(-4px); box-shadow: ...; }"

**Transform (via _cssCustom):**
- _cssCustom: "%root% { transform: translateX(0) translateY(0) scale(1) rotate(0deg) skew(0deg); transform-origin: center center; }"

**Opacity:**
- _opacity: String (e.g., "0.5", "1")

**Custom CSS (POWERFUL - use for hover, transitions, animations, backdrop, etc.):**
- _cssCustom: String using %root% selector. Examples:
  - "%root% { transition: all 0.3s ease; }\n%root%:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }"
  - "%root%::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); opacity: 0.1; z-index: -1; }"

**Custom Attributes:**
- _attributes: [{ name: "data-aos", value: "fade-up" }, { name: "role", value: "navigation" }]
- _cssClasses: String (space-separated class names)
- _cssId: String (element ID)

### 4. ELEMENT-SPECIFIC SETTINGS:

**Heading:** text (string), tag ("h1"-"h6")
**Text-basic:** text ("<p>HTML</p>"), tag ("p"|"span"|"a"|"div"), link: { type, url } (when tag="a")
**Button:** text, link: { type: "external", url: "#" }, size ("sm"|"md"|"lg"), style ("primary"|"secondary"|"outline"), icon: { library, icon }, iconPosition ("left"|"right")
**Image:** image: { url, filename, alt }, _objectFit, _width, _height, _border
**Video:** videoType, videoId/videoUrl, overlay, autoplay, loop, muted
**Icon:** icon: { library: "fontawesome5", icon: "fas fa-star" }, iconSize, iconColor: { hex }
**Divider:** _width, _height: "1px"|"2px", _background, _margin
**Form:** fields: [{ type: "text"|"email"|"textarea"|"select"|"checkbox"|"radio"|"tel"|"url"|"number"|"date"|"file", label, placeholder, required, options }], submitButton: { text, ... }, actions: ["email"], emailTo, emailSubject
**Accordion:** items: [{ title: String, content: String }]
**Icon-box:** icon: {...}, title, content, iconPosition ("top"|"left"|"right")
**List:** items: [{ text: String }], listType ("ul"|"ol"), icon: {...}
**Counter:** countTo: String, prefix, suffix, duration: String
**Progress-bar:** percentage: String, label, _background (bar bg), progressColor: { hex }
**SVG:** svgCode: String, _width, _height, fill: { hex }

### 5. BUTTON/LINK STRUCTURES:

**Option A – text-basic as button (ALWAYS WORKS):**
- name: "text-basic", tag: "a", link: { type: "external", url: "#" }
- text: "<p>Button Text</p>"
- _padding, _background, _border, _typography

**Option B – button element:**
- name: "button", text: "Button Text", link: { type: "external", url: "#" }
- size, style, icon, _padding, _background, _border, _typography

Both are valid. Use text-basic for maximum compatibility.

### 6. IMAGE STRUCTURE:
- name: "image"
- image: { url: "https://images.unsplash.com/photo-XXXXX?w=800", filename: "name.jpg", alt: "Description" }
- _width, _height, _objectFit: "cover", _border: { radius: {...} }

### 7. REQUIRED SECTIONS (based on prompt):
Choose appropriate sections: navbar, hero, features, pricing, testimonials, cta, gallery, team, stats, faq, blog, steps, portfolio, services, timeline, content, contact, footer, login, 404, coming-soon

### 8. MINIMUM CONTENT PER SECTION:
- **navbar**: Logo/Brand heading, 3-5 nav links, 1 CTA button
- **hero**: H1 headline, subtext paragraph, 1-2 CTA buttons, optional image
- **features**: Section title, subtitle, 4-6 feature cards (icon/title/description each)
- **services**: Section title, 3-4 service cards with title, description, features list
- **pricing**: 3 pricing cards with name, price, period, 4-6 features, button
- **testimonials**: 3 testimonial cards with quote, author name, role, rating stars
- **faq**: Section title, 5-6 FAQ items with question + answer
- **contact**: Heading, subtext, contact form with name/email/message fields
- **cta**: H2 headline, subtext, button
- **footer**: Brand name, description, 3-4 link columns, copyright bar
- **team**: 3-4 team member cards with name, role, optional image
- **stats**: 3-4 stat counters with value and label
- **gallery/portfolio**: Section title, 4-6 project cards
- **blog**: Section title, 3 blog post cards
- **steps**: Section title, 3-4 numbered steps

### 9. INDUSTRY-SPECIFIC DIRECTION:
- For restaurants/pizzerias: warm premium palette (deep red, basil green, cream, charcoal).
- For tech/SaaS: modern gradients, blues/purples, clean spacing.
- For agencies: bold typography, dark backgrounds, accent colors.
- For medical/health: clean whites, blues, greens, trust-building.
- Keep copy coherent to the brand language and industry.

## CREATIVE FREEDOM - YOU DECIDE:
- All colors (primary, bg, text, accent) as HEX
- Font sizes and weights
- Border radius amounts
- Shadow depths
- Spacing/gap values
- Layout decisions (flex vs grid)
- Content texts (industry-appropriate)
- Icons (use HTML entities ★ ◆ ● ✦ ▸ ✓ ✗ ⚡ etc.)
- Image URLs from unsplash

## YOUR RESPONSE:
Return ONLY a valid JSON array of Bricks elements.
No markdown, no comments, no prose, no code fences.
IMPORTANT: Ensure the JSON is COMPLETE and VALID. Do NOT truncate. Close all brackets and braces properly. If running low on space, finish the current element and close the array rather than leaving incomplete JSON.

## IMPORTANT RULES:
- IDs must be 6 characters random (a-z0-9)
- parents MUST be correctly set (parent=0 for sections)
- children array must contain all child element IDs
- settings MUST include ALL required settings per element type
- Colors as HEX (#RRGGBB or #RRGGBBAA for alpha)
- Prioritize readability and UX quality over visual gimmicks
- Use _cssCustom with %root% for hover effects, transitions, backdrop-filter, transforms

### 10. GLASSMORPHISM IMPLEMENTATION (when requested):
When the user requests glassmorphism or frosted glass style:
- Cards/blocks MUST use semi-transparent backgrounds: _background: { color: { hex: "#ffffffa6" } } (light) or "#ffffff0f" (dark)
- Cards/blocks MUST add backdrop blur: _cssCustom: "%root% { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }"
- Borders: 1px solid with semi-transparent color, e.g. hex "#ffffff80"
- Shadows: soft blur like _boxShadow: { values: { offsetY: "8", blur: "32", spread: "-4" }, color: { hex: "#00000010" } }
- Section backgrounds should be tinted/gradient so glass cards are visible
- Navbar should also have glass: semi-transparent bg + backdrop blur
- Use large border radius (16px+)

Answer ONLY with the JSON array!`;

/**
 * Run the AI output through the schema validator + auto-repair layer.
 * This handles ID uniqueness, parent/children rebuilding, cycle detection
 * and dropping unknown element types. See bricks-validator.ts.
 */
function validateAndRepairAIOutput(input: unknown): BricksElement[] {
  const result = validateBricksElements(input);
  if (result.violations.length > 0) {
    // Log up to the first 25 violations so we can iterate on the prompt
    // when the same mistakes recur. We never surface these to the user.
    console.log(
      `[AI Validate] ${result.stats.total} elements, ${result.stats.dropped} dropped, ` +
        `${result.stats.idsRegenerated} ids regenerated, ${result.stats.parentsReset} parents reset, ` +
        `${result.stats.childrenRebuilt} children rebuilt, ${result.stats.sectionCount} sections.`
    );
    for (const v of result.violations.slice(0, 25)) {
      console.log(`[AI Validate]   · ${v}`);
    }
  }
  if (!result.valid) {
    throw new Error(
      `AI output failed validation (${result.elements.length} elements, ${result.stats.sectionCount} sections): ${result.violations[0] ?? "unknown"}`
    );
  }
  return result.elements;
}

/**
 * Parse a base64 data URL and return media type + raw base64 data.
 * Supports data:image/png;base64,... and data:image/jpeg;base64,...
 */
function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
  if (!match) return null;
  return { mediaType: match[1].toLowerCase().replace("jpg", "jpeg"), data: match[2] };
}

async function generateDirectBricksJSON(
  prompt: string,
  apiKey: string,
  provider: "openai" | "anthropic" | "azure" | "openrouter",
  referenceImage?: string, // base64 data URL (optional — activates vision mode)
  azureEndpoint?: string,
  azureDeployment?: string,
  openrouterModel?: string,
): Promise<BricksElement[]> {
  let responseText: string;

  // Build the user message content – plain text, or multimodal when image provided
  const hasImage = !!referenceImage;
  const imageInfo = hasImage ? parseDataUrl(referenceImage!) : null;

  if (provider === "anthropic") {
    // Anthropic vision: messages[].content can be array of blocks
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

    const userContent: ContentBlock[] = [];

    if (imageInfo) {
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: imageInfo.mediaType, data: imageInfo.data },
      });
      userContent.push({
        type: "text",
        text: `[REFERENCE IMAGE ABOVE]\nAnalyze the design in the image and recreate it as Bricks Builder JSON matching the layout, color palette, typography style, and component arrangement. Then apply any additional user instructions:\n\n${prompt}`,
      });
    } else {
      userContent.push({ type: "text", text: prompt });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 32000,
        system: BRICKS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Anthropic API error: ${response.status} – ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    responseText = data.content[0].text;
    if (data.stop_reason === "max_tokens") {
      console.warn("[AI Parse] WARNING: Anthropic response truncated! Length:", responseText.length);
    }
  } else if (provider === "openai" || provider === "azure" || provider === "openrouter") {
    // OpenAI-compatible: OpenAI, Azure OpenAI, and OpenRouter all use the same message format
    type OAIContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" | "low" | "auto" } };

    const userContent: OAIContentPart[] | string = imageInfo
      ? [
          {
            type: "image_url",
            image_url: { url: referenceImage!, detail: "high" },
          },
          {
            type: "text",
            text: `[REFERENCE IMAGE ABOVE]\nAnalyze the design in the image and recreate it as Bricks Builder JSON matching the layout, color palette, typography style, and component arrangement. Then apply any additional user instructions:\n\n${prompt}`,
          },
        ]
      : prompt;

    let url: string;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let model: string;

    if (provider === "azure") {
      const endpoint = (azureEndpoint ?? "").replace(/\/$/, "");
      const deployment = azureDeployment ?? "";
      url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`;
      headers["api-key"] = apiKey;
      model = deployment; // Azure uses deployment name as model field (ignored by API but kept for logging)
    } else if (provider === "openrouter") {
      url = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = "https://brickssnap.io";
      headers["X-Title"] = "BricksSnap";
      model = openrouterModel || "anthropic/claude-sonnet-4-5";
    } else {
      // Standard OpenAI
      url = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      model = "gpt-4o";
    }

    // Azure requires max_completion_tokens (max_tokens is rejected for newer deployments).
    // OpenAI and OpenRouter still accept max_tokens for gpt-4o class models.
    const tokenParam = provider === "azure" ? "max_completion_tokens" : "max_tokens";

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: BRICKS_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        [tokenParam]: 32000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      const label = provider === "azure" ? "Azure OpenAI" : provider === "openrouter" ? "OpenRouter" : "OpenAI";
      throw new Error(`${label} API error: ${response.status} – ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    responseText = data.choices[0].message.content;
    if (data.choices[0].finish_reason === "length") {
      console.warn("[AI Parse] WARNING: response truncated! Length:", responseText.length);
    }
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // ── Extract JSON array from response ──────────────────────────────────────
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const firstBracket = cleaned.indexOf("[");
  if (firstBracket > 0) cleaned = cleaned.substring(firstBracket);
  const lastBracket = cleaned.lastIndexOf("]");
  if (lastBracket > 0) cleaned = cleaned.substring(0, lastBracket + 1);

  if (!cleaned.startsWith("[")) {
    console.error("[AI Parse] No JSON array in response. First 500 chars:", responseText.substring(0, 500));
    throw new Error("AI response did not contain a valid JSON array");
  }

  console.log("[AI Parse] Extracted JSON length:", cleaned.length, "chars. First 200:", cleaned.substring(0, 200));

  let parsed: unknown;
  try {
    parsed = robustJSONParse(cleaned);
  } catch (parseErr) {
    console.error("[AI Parse] All repair attempts failed. Last 300 chars:", cleaned.substring(cleaned.length - 300));
    throw parseErr;
  }

  return validateAndRepairAIOutput(parsed);
}

/**
 * Robust JSON parser that attempts multiple repair strategies.
 * AI models frequently produce slightly malformed JSON (trailing commas,
 * truncated output, comments, unescaped control chars, etc.).
 */
function robustJSONParse(raw: string): unknown {
  const attempts: { name: string; fn: () => unknown }[] = [];

  // ── Attempt 1: direct parse ──
  attempts.push({
    name: "direct",
    fn: () => JSON.parse(raw),
  });

  // ── Build cleaned text for subsequent attempts ──
  let text = raw;
  // Strip BOM / zero-width chars
  text = text.replace(/^\uFEFF/, "");
  // Remove single-line comments (// ...)
  text = text.replace(/\/\/[^\n]*/g, "");
  // Remove multi-line comments (/* ... */)
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove trailing commas before ] or }
  text = text.replace(/,\s*([\]}])/g, "$1");
  // Replace unescaped control chars inside strings (except \n \r \t)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  // ── Attempt 2: after basic cleanup ──
  attempts.push({ name: "cleanup", fn: () => JSON.parse(text) });

  // ── Attempt 3: fix unescaped newlines/tabs inside JSON strings ──
  // This is a very common AI problem: literal newlines inside "..." strings
  const fixedNewlines = text.replace(
    /"(?:[^"\\]|\\.)*"/g,
    (match) =>
      match
        .replace(/(?<!\\)\n/g, "\\n")
        .replace(/(?<!\\)\r/g, "\\r")
        .replace(/(?<!\\)\t/g, "\\t")
  );
  attempts.push({
    name: "fix-newlines-in-strings",
    fn: () => JSON.parse(fixedNewlines),
  });

  // ── Attempt 4: fix truncated JSON – close unclosed brackets/braces ──
  const buildRepaired = (src: string): string => {
    let repaired = src;
    const openBrackets: string[] = [];
    let inStr = false;
    let esc = false;
    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "[") openBrackets.push("]");
      else if (ch === "{") openBrackets.push("}");
      else if (ch === "]" || ch === "}") openBrackets.pop();
    }
    // If we were inside a string when truncated, close it
    if (inStr) repaired += '"';
    // If last non-whitespace before closing is a ":" add an empty string value
    const trimmed = repaired.trimEnd();
    if (trimmed.endsWith(":")) repaired = trimmed + '""';
    // Close any unclosed brackets/braces in reverse order
    while (openBrackets.length > 0) {
      repaired += openBrackets.pop();
    }
    // Clean up trailing commas again after repair
    repaired = repaired.replace(/,\s*([\]}])/g, "$1");
    return repaired;
  };

  const repaired = buildRepaired(text);
  attempts.push({ name: "close-brackets", fn: () => JSON.parse(repaired) });

  // ── Attempt 5: close brackets on newline-fixed text ──
  const repairedNL = buildRepaired(fixedNewlines);
  attempts.push({
    name: "close-brackets+fix-newlines",
    fn: () => JSON.parse(repairedNL),
  });

  // ── Attempt 6: truncate to last complete object in the array ──
  for (const src of [repairedNL, repaired, text]) {
    const lastCompleteObj = src.lastIndexOf("},");
    if (lastCompleteObj > 0) {
      const truncated = src.substring(0, lastCompleteObj + 1) + "]";
      attempts.push({
        name: "truncate-last-complete-obj",
        fn: () => JSON.parse(truncated),
      });
    }
  }

  // ── Attempt 7: find last "}" and close array ──
  for (const src of [repairedNL, repaired, text]) {
    const lastBrace = src.lastIndexOf("}");
    if (lastBrace > 0) {
      const truncated = src.substring(0, lastBrace + 1) + "]";
      attempts.push({
        name: "truncate-last-brace",
        fn: () => JSON.parse(truncated),
      });
    }
  }

  // ── Attempt 8: progressive truncation – remove last object(s) ──
  // Find all top-level object boundaries and keep removing the last one
  const objEndPattern = /\}\s*,/g;
  const boundaries: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = objEndPattern.exec(text)) !== null) {
    boundaries.push(m.index + 1); // position right after the }
  }
  // Try from the 2nd-to-last boundary backwards (skip the very last, already tried above)
  for (let i = boundaries.length - 2; i >= Math.max(0, boundaries.length - 5); i--) {
    const truncated = text.substring(0, boundaries[i]) + "]";
    attempts.push({
      name: `progressive-truncate-${boundaries.length - i}`,
      fn: () => JSON.parse(truncated),
    });
  }

  // ── Run all attempts ──
  for (const attempt of attempts) {
    try {
      const result = attempt.fn();
      if (attempt.name !== "direct") {
        console.log(`[AI Parse] Succeeded with strategy: "${attempt.name}"`);
      }
      return result;
    } catch {
      // continue to next strategy
    }
  }

  throw new Error("Failed to parse AI JSON response after multiple repair attempts");
}

// ============================================================
// Build Bricks elements from config (used for built-in mode)
// ============================================================
function generateFromConfig(config: GenerationConfig): BricksElement[] {
  let elements: BricksElement[] = [];
  const tokens = resolveDesignTokens(config.designTokens);

  for (const section of config.sections) {
    switch (section) {
      case "navbar":
        elements = [...elements, ...generateNavbar(config.brandName, config.navLinks, undefined, tokens)];
        break;
      case "hero":
        elements = [...elements, ...generateHeroSection(config.headline, config.subtext, config.buttonText, "#", config.heroStyle, tokens)];
        break;
      case "features":
        elements = [...elements, ...generateFeaturesSection(undefined, undefined, config.features, tokens)];
        break;
      case "gallery":
        elements = [...elements, ...generateGallerySection(config.gallerySectionTitle, config.gallerySectionSubtitle, config.galleryItems, tokens)];
        break;
      case "pricing":
        elements = [...elements, ...generatePricingSection(config.plans, tokens)];
        break;
      case "testimonials":
        elements = [...elements, ...generateTestimonialsSection(config.testimonials, tokens)];
        break;
      case "cta":
        elements = [...elements, ...generateCTASection(config.ctaHeadline, config.ctaSubtext, config.ctaButtonText, tokens)];
        break;
      case "contact":
        elements = [...elements, ...generateContactSection(tokens)];
        break;
      case "team":
        elements = [...elements, ...generateTeamSection(undefined, undefined, config.teamMembers, tokens)];
        break;
      case "stats":
        elements = [...elements, ...generateStatsSection(undefined, config.stats, tokens)];
        break;
      case "faq":
        elements = [...elements, ...generateFaqSection(undefined, undefined, config.faqItems, tokens)];
        break;
      case "logos":
        elements = [...elements, ...generateLogoCloudSection(undefined, config.logoNames, tokens)];
        break;
      case "blog":
        elements = [...elements, ...generateBlogSection(undefined, undefined, config.blogPosts, tokens)];
        break;
      case "steps":
        elements = [...elements, ...generateStepsSection(undefined, undefined, config.steps, tokens)];
        break;
      case "footer":
        elements = [...elements, ...generateFooterSection(config.brandName, undefined, tokens)];
        break;
      case "portfolio":
        elements = [...elements, ...generatePortfolioSection(undefined, undefined, config.portfolioProjects, tokens)];
        break;
      case "services":
        elements = [...elements, ...generateServicesSection(undefined, undefined, config.services, tokens)];
        break;
      case "timeline":
        elements = [...elements, ...generateTimelineSection(undefined, undefined, config.timelineEvents, tokens)];
        break;
      case "content":
        elements = [...elements, ...generateContentSection(config.contentTitle, config.contentText, config.contentImagePosition, tokens)];
        break;
      case "404":
        elements = [...elements, ...generate404Section(config.errorHeadline, config.errorSubtext, undefined, tokens)];
        break;
      case "coming-soon":
        elements = [...elements, ...generateComingSoonSection(config.comingSoonHeadline, config.comingSoonSubtext, config.brandName, tokens)];
        break;
      case "login":
        elements = [...elements, ...generateLoginSection(config.loginHeading, config.loginSubtext, config.brandName, tokens)];
        break;
    }
  }

  return injectFontFamily(elements, tokens.fontFamily);
}

/**
 * Post-process elements to inject font-family into all _typography objects.
 * This ensures every element gets the font regardless of whether the section
 * generator remembered to add it.
 */
function injectFontFamily(elements: BricksElement[], fontFamily: string): BricksElement[] {
  for (const el of elements) {
    const typo = el.settings._typography;
    if (typo && typeof typo === "object" && !Array.isArray(typo)) {
      const t = typo as Record<string, unknown>;
      if (!t["font-family"]) {
        t["font-family"] = fontFamily;
      }
    }
    // Inject ARIA role on section elements for accessibility
    if (el.name === "section" && !el.settings._attributes) {
      const sectionLabel = (el as unknown as Record<string, unknown>).label as string | undefined;
      el.settings._attributes = [
        { name: "role", value: "region" },
        ...(sectionLabel ? [{ name: "aria-label", value: sectionLabel }] : []),
      ];
    }
  }
  return elements;
}

// ============================================================
// API Endpoint
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      useAI,
      apiKey: requestApiKey,
      provider,
      sections: requestedSections,
      stylePreset,
      colorPalette,
      referenceImage,
      azureEndpoint,
      azureDeployment,
      openrouterModel,
    } = body as {
      prompt?: string;
      useAI?: boolean;
      apiKey?: string;
      provider?: "openai" | "anthropic" | "azure" | "openrouter";
      sections?: string[];
      stylePreset?: { id: string; name: string; aiDirective: string; tokens: Record<string, unknown> };
      colorPalette?: { id: string; name: string; colors: Record<string, string> };
      /** Optional base64 data URL (data:image/...) – activates vision mode */
      referenceImage?: string;
      azureEndpoint?: string;
      azureDeployment?: string;
      openrouterModel?: string;
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Please provide a description (prompt)" },
        { status: 400 }
      );
    }

    // Build enhanced prompt with preset/palette context
    let enhancedPrompt = prompt;

    if (stylePreset?.aiDirective) {
      enhancedPrompt += `\n\n[Style Direction: ${stylePreset.aiDirective}]`;
    }
    // Include design token values so AI knows exact design parameters
    if (stylePreset?.tokens) {
      const t = stylePreset.tokens;
      const tokenParts: string[] = [];
      if (t.borderRadius) tokenParts.push(`Border Radius: ${t.borderRadius}`);
      if (t.shadow) tokenParts.push(`Shadow: ${t.shadow}`);
      if (t.spacing) tokenParts.push(`Spacing: ${t.spacing}`);
      if (t.darkMode !== undefined) tokenParts.push(`Dark Mode: ${t.darkMode}`);
      if (t.typography) tokenParts.push(`Typography: ${t.typography}`);
      if (tokenParts.length > 0) {
        enhancedPrompt += `\n[Design Tokens: ${tokenParts.join(", ")}]`;
      }
      // Glassmorphism-specific critical instructions for AI
      if (t.styleMode === "glassmorphism" || stylePreset.id === "glassmorphism") {
        enhancedPrompt += `\n\n[GLASSMORPHISM CRITICAL - EVERY card/block element MUST have ALL of these:
1. Semi-transparent background: _background: { color: { hex: "#ffffffa6" } } for light, "#ffffff0f" for dark
2. Glass blur effect: _cssCustom: "%root% { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }"
3. Subtle glass border: 1px solid with color hex "#ffffff80" (light) or "#ffffff1f" (dark)
4. Soft shadow: _boxShadow: { values: { offsetY: "8", blur: "32", spread: "-4" }, color: { hex: "#00000010" } }
5. Section backgrounds should be tinted/gradient (not plain white) so glass effect is visible
6. Navbar should also have glass effect with backdrop blur
7. Large border radius (16px minimum)]`;
      }
    }
    if (colorPalette?.colors) {
      const c = colorPalette.colors;
      enhancedPrompt += `\n\n[Color Palette "${colorPalette.name}": Primary=${c.primary}, Secondary=${c.secondary}, Background=${c.background}, Surface=${c.surface}, Text=${c.text}, Heading=${c.heading}, Muted=${c.muted}, Border=${c.border}, Accent=${c.accent}. Use these exact colors throughout the design.]`;
    }
    if (requestedSections && requestedSections.length > 0) {
      enhancedPrompt += `\n\n[Required Sections (in order): ${requestedSections.join(", ")}. Generate ALL of these sections.]`;
    }

    // Detect API keys (request key has priority, then environment variables)
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const bodyApiKey = requestApiKey?.trim();

    let apiKey: string | undefined;
    // Resolve effective provider (azure/openrouter only work with user-supplied keys)
    let effectiveProvider: "openai" | "anthropic" | "azure" | "openrouter" = provider ?? "openai";

    if (bodyApiKey && bodyApiKey.length > 10) {
      apiKey = bodyApiKey;
      if (!provider) {
        // Auto-detect from key prefix when provider not explicitly set
        effectiveProvider = bodyApiKey.startsWith("sk-ant-") ? "anthropic" : "openai";
      }
    } else if ((provider === "anthropic" || !provider) && anthropicKey && anthropicKey.length > 10) {
      apiKey = anthropicKey;
      effectiveProvider = "anthropic";
    } else if ((provider === "openai" || !provider) && openaiKey && openaiKey.length > 10) {
      apiKey = openaiKey;
      effectiveProvider = "openai";
    } else if (!provider && anthropicKey && anthropicKey.length > 10) {
      apiKey = anthropicKey;
      effectiveProvider = "anthropic";
    } else if (!provider && openaiKey && openaiKey.length > 10) {
      apiKey = openaiKey;
      effectiveProvider = "openai";
    }

    const aiAvailable = !!apiKey;
    const shouldUseAI = aiAvailable && useAI !== false;

    let elements: BricksElement[];
    let mode: "ai" | "builtin";

    // Validate referenceImage: must be a data URL, max 5 MB base64
    const validatedImage =
      referenceImage &&
      typeof referenceImage === "string" &&
      /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(referenceImage) &&
      referenceImage.length < 7_000_000 // ~5 MB base64 ceiling
        ? referenceImage
        : undefined;

    if (shouldUseAI) {
      try {
        elements = await generateDirectBricksJSON(
          enhancedPrompt,
          apiKey!,
          effectiveProvider,
          validatedImage,
          azureEndpoint,
          azureDeployment,
          openrouterModel,
        );
        mode = "ai";
      } catch (err) {
        console.error("Direct AI generation failed, falling back to built-in:", err);
        const config = analyzePromptWithBasicDetection(prompt, requestedSections, stylePreset?.tokens, colorPalette?.colors);
        elements = generateFromConfig(config);
        mode = "builtin";
      }
    } else {
      const config = analyzePromptWithBasicDetection(prompt, requestedSections, stylePreset?.tokens, colorPalette?.colors);
      elements = generateFromConfig(config);
      mode = "builtin";
    }

    const template = wrapTemplate(elements);

    return NextResponse.json({
      success: true,
      template,
      elementCount: elements.length,
      sections: [...new Set(elements.filter((e) => e.parent === 0).map((e) => e.label || e.name))],
      mode,
      aiAvailable,
      visionMode: mode === "ai" && !!validatedImage,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}

// ============================================================
// Built-in mode: Simple keyword-based analysis (no AI needed)
// ============================================================

function analyzePromptWithBasicDetection(
  prompt: string,
  requestedSections?: string[],
  presetTokens?: Record<string, unknown>,
  paletteColors?: Record<string, string>
): GenerationConfig {
  const lower = prompt.toLowerCase();
  
  // Use explicitly requested sections if provided, otherwise detect from keywords
  let sections: string[] = [];
  
  if (requestedSections && requestedSections.length > 0) {
    sections = [...requestedSections];
  } else {
    if (/nav|menu|header/i.test(lower)) sections.push("navbar");
    if (/hero|banner|landing/i.test(lower)) sections.push("hero");
    if (/feature/i.test(lower)) sections.push("features");
    if (/service/i.test(lower)) sections.push("services");
    if (/gallery|showcase|portfolio grid/i.test(lower)) sections.push("gallery");
    if (/pricing|price|plan/i.test(lower)) sections.push("pricing");
    if (/testimonial|review/i.test(lower)) sections.push("testimonials");
    if (/cta|call.to.action/i.test(lower)) sections.push("cta");
    if (/contact|form/i.test(lower)) sections.push("contact");
    if (/team|about us|founder/i.test(lower)) sections.push("team");
    if (/stats|numbers|counter|kpi/i.test(lower)) sections.push("stats");
    if (/faq|question/i.test(lower)) sections.push("faq");
    if (/logo|partners|clients/i.test(lower)) sections.push("logos");
    if (/blog|articles|news/i.test(lower)) sections.push("blog");
    if (/steps|process|how it works/i.test(lower)) sections.push("steps");
    if (/portfolio|projects|case studies/i.test(lower)) sections.push("portfolio");
    if (/timeline|history|roadmap/i.test(lower)) sections.push("timeline");
    if (/content|about|story/i.test(lower)) sections.push("content");
    if (/404|not found/i.test(lower)) sections.push("404");
    if (/coming soon|launch soon|waitlist/i.test(lower)) sections.push("coming-soon");
    if (/login|sign in|auth/i.test(lower)) sections.push("login");
    if (/footer/i.test(lower)) sections.push("footer");
    if (/restaurant|pizzeria|pizza/i.test(lower)) {
      if (!sections.includes("hero")) sections.push("hero");
      if (!sections.includes("gallery")) sections.push("gallery");
      if (!sections.includes("testimonials")) sections.push("testimonials");
      if (!sections.includes("cta")) sections.push("cta");
    }
    if (sections.length === 0) sections.push("hero");
  }

  // Basic design tokens from keywords + preset/palette overrides
  const designTokens: Partial<DesignTokens> = {};
  if (/dark|dunkel/i.test(lower)) {
    designTokens.darkMode = true;
    designTokens.backgroundColor = "#0f172a";
    designTokens.headingColor = "#ffffff";
  }
  if (/rounded|round/i.test(lower)) {
    designTokens.borderRadius = "large";
  }
  if (/restaurant|pizzeria|pizza/i.test(lower)) {
    designTokens.darkMode = true;
    designTokens.backgroundColor = "#130908";
    designTokens.primaryColor = "#D62828";
    designTokens.secondaryColor = "#F4B400";
    designTokens.headingColor = "#FFF4E6";
    designTokens.textColor = "#F6EAD9";
  }

  // Merge preset tokens
  if (presetTokens) {
    Object.assign(designTokens, presetTokens);
  }

  // Merge palette colors (highest priority)
  if (paletteColors) {
    if (paletteColors.primary) designTokens.primaryColor = paletteColors.primary;
    if (paletteColors.secondary) designTokens.secondaryColor = paletteColors.secondary;
    if (paletteColors.background) designTokens.backgroundColor = paletteColors.background;
    if (paletteColors.surface) designTokens.surfaceColor = paletteColors.surface;
    if (paletteColors.text) designTokens.textColor = paletteColors.text;
    if (paletteColors.heading) designTokens.headingColor = paletteColors.heading;
    if (paletteColors.muted) designTokens.mutedTextColor = paletteColors.muted;
    if (paletteColors.border) designTokens.borderColor = paletteColors.border;
    if (paletteColors.accent) designTokens.accentColor = paletteColors.accent;
  }

  return {
    sections,
    brandName: "BrandName",
    headline: "Build Something Amazing",
    subtext: "Create stunning websites with our powerful tools. Trusted by thousands of businesses worldwide.",
    heroStyle: "centered",
    buttonText: "Get Started",
    features: [
      { title: "Lightning Fast", description: "Optimized for speed with instant load times and smooth interactions across all devices." },
      { title: "Fully Responsive", description: "Looks perfect on every device, from mobile phones to large desktop screens." },
      { title: "Easy to Customize", description: "Modify colors, fonts, and layouts with an intuitive drag-and-drop interface." },
      { title: "SEO Optimized", description: "Built with best practices for search engine visibility and organic traffic growth." },
      { title: "Secure by Default", description: "Enterprise-grade security built into every component to protect your data." },
      { title: "24/7 Support", description: "Our dedicated team is always here to help you succeed with your project." },
    ],
    plans: [
      { name: "Starter", price: "$9", period: "/month", features: ["1 Project", "5 GB Storage", "Community Support", "Basic Analytics"], buttonText: "Get Started" },
      { name: "Professional", price: "$29", period: "/month", features: ["Unlimited Projects", "50 GB Storage", "Priority Support", "Advanced Analytics", "Custom Domain", "Team Collaboration"], highlighted: true, buttonText: "Start Free Trial" },
      { name: "Enterprise", price: "$99", period: "/month", features: ["Everything in Pro", "Unlimited Storage", "Dedicated Account Manager", "SLA Guarantee", "Custom Integrations", "White Label"], buttonText: "Contact Sales" },
    ],
    testimonials: [
      { quote: "This platform transformed the way we build websites. The speed and quality are unmatched.", author: "Sarah Johnson", role: "CEO, TechStart", rating: 5 },
      { quote: "We cut our development time in half. The templates are beautiful and easy to customize.", author: "Michael Chen", role: "Lead Developer, PixelCraft", rating: 5 },
      { quote: "Outstanding support team and incredible features. Highly recommend for any business.", author: "Emily Rodriguez", role: "Marketing Director, GrowthLab", rating: 5 },
    ],
    navLinks: [
      { text: "Home", url: "/" },
      { text: "Features", url: "#features" },
      { text: "Services", url: "#services" },
      { text: "Pricing", url: "#pricing" },
      { text: "Contact", url: "#contact" },
    ],
    ctaHeadline: "Ready to Get Started?",
    ctaSubtext: "Join thousands of happy customers building amazing websites today.",
    ctaButtonText: "Start Building Now",
    galleryItems: [
      { title: "E-Commerce Redesign", category: "Web Design" },
      { title: "Brand Identity System", category: "Branding" },
      { title: "Mobile App UI", category: "App Design" },
      { title: "SaaS Dashboard", category: "Product" },
      { title: "Marketing Campaign", category: "Digital" },
      { title: "Corporate Website", category: "Web Design" },
    ],
    gallerySectionTitle: "Our Work",
    gallerySectionSubtitle: "Explore our latest projects and creative solutions",
    teamMembers: [
      { name: "Alex Thompson", role: "CEO & Founder" },
      { name: "Maria Garcia", role: "Head of Design" },
      { name: "James Wilson", role: "Lead Developer" },
      { name: "Lisa Park", role: "Marketing Director" },
    ],
    stats: [
      { value: "10,000+", label: "Happy Clients" },
      { value: "500+", label: "Projects Delivered" },
      { value: "99.9%", label: "Uptime Guarantee" },
      { value: "24/7", label: "Customer Support" },
    ],
    faqItems: [
      { question: "How do I get started?", answer: "Simply sign up for a free account, choose a template, and start customizing. No credit card required." },
      { question: "Can I cancel my subscription anytime?", answer: "Yes, you can cancel your subscription at any time. No long-term contracts or hidden fees." },
      { question: "Do you offer custom development?", answer: "Absolutely! Our enterprise plan includes custom development and dedicated support for your specific needs." },
      { question: "Is there a free trial available?", answer: "Yes, we offer a 14-day free trial on all plans so you can explore all features risk-free." },
      { question: "What kind of support do you provide?", answer: "We offer email support on all plans, priority support for Pro users, and a dedicated account manager for Enterprise clients." },
    ],
    logoNames: [
      { name: "TechCorp" },
      { name: "DesignHub" },
      { name: "CloudSync" },
      { name: "DataFlow" },
      { name: "InnovateLab" },
    ],
    blogPosts: [
      { title: "10 Web Design Trends for 2026", excerpt: "Discover the latest design trends shaping the future of web experiences.", category: "Design", date: "Jan 2026", readTime: "5 min" },
      { title: "How to Boost Your SEO Rankings", excerpt: "Practical tips and strategies to improve your search engine visibility.", category: "Marketing", date: "Feb 2026", readTime: "7 min" },
      { title: "The Future of AI in Web Dev", excerpt: "How artificial intelligence is transforming the way we build websites.", category: "Technology", date: "Mar 2026", readTime: "6 min" },
    ],
    steps: [
      { title: "Sign Up", description: "Create your free account in just 30 seconds. No credit card required." },
      { title: "Choose a Template", description: "Browse our library of professionally designed templates for every industry." },
      { title: "Customize Your Design", description: "Use our intuitive editor to personalize colors, fonts, content, and layouts." },
      { title: "Launch Your Site", description: "Publish your website with one click and share it with the world." },
    ],
    portfolioProjects: [
      { title: "Modern E-Commerce", category: "Web Development", description: "Full-stack e-commerce platform with real-time inventory management." },
      { title: "Brand Identity Refresh", category: "Branding", description: "Complete visual identity redesign for a Fortune 500 company." },
      { title: "SaaS Analytics Dashboard", category: "Product Design", description: "Data visualization dashboard handling millions of data points." },
      { title: "Mobile Banking App", category: "App Development", description: "Secure mobile banking experience with biometric authentication." },
    ],
    services: [
      { title: "Web Design", description: "Custom website designs tailored to your brand and target audience.", features: ["Responsive Design", "UI/UX Optimization", "Brand Integration"] },
      { title: "Web Development", description: "Full-stack development with modern technologies and best practices.", features: ["Custom Functionality", "API Integration", "Performance Optimization"] },
      { title: "SEO & Marketing", description: "Data-driven strategies to increase your online visibility and organic growth.", features: ["Keyword Research", "Content Strategy", "Analytics Setup"] },
      { title: "Maintenance & Support", description: "Ongoing support to keep your website secure, fast, and up-to-date.", features: ["Security Updates", "Performance Monitoring", "Content Updates"] },
    ],
    timelineEvents: [
      { year: "2020", title: "Company Founded", description: "Started with a vision to make web design accessible to everyone." },
      { year: "2021", title: "First 1,000 Users", description: "Reached a major milestone with our growing community of creators." },
      { year: "2023", title: "Global Expansion", description: "Expanded operations to serve clients in over 50 countries." },
      { year: "2025", title: "AI-Powered Tools", description: "Launched next-generation AI features for automated design assistance." },
    ],
    contentTitle: "About Us",
    contentText: "We are a passionate team of designers and developers dedicated to creating beautiful, high-performance websites. Our mission is to empower businesses of all sizes with professional web presence.",
    contentImagePosition: "right",
    errorHeadline: "404",
    errorSubtext: "The page you're looking for doesn't exist or has been moved.",
    comingSoonHeadline: "Coming Soon",
    comingSoonSubtext: "We're working on something amazing. Stay tuned for the big reveal!",
    loginHeading: "Welcome Back",
    loginSubtext: "Sign in to your account to continue",
    designTokens,
  };
}
