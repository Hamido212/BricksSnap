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

### 2. VALID ELEMENT NAMES AND USAGE:
- **"section"** - Main container for sections
- **"container"** - Constrained container (max-width: 1200px)
- **"heading"** - Headlines with "tag": "h1" | "h2" | "h3"
- **"text-basic"** - Paragraphs AND BUTTONS/LINKS!
  - For regular text: "tag": "p" or omit tag
  - For BUTTONS/LINKS: "tag": "a", "link": { "type": "external", "url": "#" }
- **"div"** - Generic container for layouts
- **"image"** - Images with "image": { "url": "https://...", "filename": "..." }
- **"form"** - Contact forms with "fields": Array of field objects

### 3. REQUIRED SETTINGS POLICY:
- Use realistic settings for each element type.
- For sections/containers/cards/buttons/links always include sizing/spacing/typography/background/border where appropriate.
- Prefer explicit values over empty objects.
- NEVER invent unsupported element names.

### 3a. REQUIRED SETTINGS FOR EVERY ELEMENT:
- _padding: { top, bottom, left, right } (strings like "100", "40")
- _background: { color: { hex: "#HEX" } }
- _typography: { "font-size", "font-weight", "color": { hex: "#HEX" }, "text-decoration" (for links: "none"), ... }
- _border: { radius: { top, right, bottom, left }, width, style, color: { hex } }
- _margin: { ... }
- _display: "flex" | "grid" | "block"
- _direction: "row" | "column"
- _justifyContent: "center" | "flex-start" | "space-between" | "flex-end"
- _alignItems: "center" | "flex-start" | "stretch"
- _gap: String (e.g., "32")
- _width: "100%" | "50%" | "auto" | "1200px"
- _height: String (e.g., "100vh", "48px")
- _gridTemplateColumns: CSS grid template (e.g., "repeat(auto-fill, minmax(320px, 1fr))")
- _textAlign: "center" | "left" | "right"
- _minHeight: String (e.g., "100vh")
- _zIndex: String (e.g., "50")

### 3b. LAYOUT QUALITY GUARDRAILS (CRITICAL):
- Build clean, usable layouts first. Avoid experimental compositions that break readability.
- Hero content must stay readable on desktop: do NOT split text into very narrow columns.
- Never place CTA buttons as full-height vertical bars.
- Use practical widths:
  - content columns in hero: around 45-60% + 40-55% for split layouts
  - text blocks should generally have max width around 520-680px
  - button elements should use auto width and clear horizontal padding
- Keep spacing balanced with clear hierarchy (headline > subtext > CTA).
- Use display:flex or grid only when it improves clarity.

### 3c. EXTEND INSTEAD OF REMOVE:
- If the user asks to improve/enhance an existing concept, preserve the concept and visual direction.
- Improve layout, hierarchy, spacing, and polish; do not replace the whole idea with a different structure.

### 4. BUTTON/LINK STRUCTURE (CRITICAL!):
- name: "text-basic"
- text: "<p>Button Text</p>"
- tag: "a" (MAKES IT A BUTTON!)
- link: { "type": "external", "url": "#" }
- _padding: { top, bottom, left, right }
- _background: { color: { hex: "#HEX" } }
- _border: { radius: { top, right, bottom, left }, width, style, color }
- _typography: { font-size, font-weight, color: { hex }, text-decoration: "none" }

### 5. IMAGE STRUCTURE:
- name: "image"
- image: { url: "https://...", filename: "name.jpg" }
- _width: "100%" | "50%" | "auto"
- _height: "400px" | "100vh"
- _objectFit: "cover"
- _border: { radius: { top, right, bottom, left } }

### 6. REQUIRED SECTIONS (based on prompt):
Choose appropriate sections: navbar, hero, features, pricing, testimonials, cta, gallery, team, stats, faq, blog, steps, portfolio, services, timeline, content, contact, footer, login, 404, coming-soon

### 7. MINIMUM CONTENT PER SECTION:
- **navbar**: Logo/Brand, 3-5 Links, 1 CTA Button
- **hero**: H1 headline, Subtext, 1-2 Buttons, (optional: image for split layout)
- **features**: 4-6 Feature Cards with Icon, Title, Description
- **pricing**: 3 Pricing Cards with Name, Price, Features List, Button
- **testimonials**: 3 Cards with Quote, Author, Role, Rating
- **cta**: H2, Subtext, Button
- **footer**: Brand, 4 Columns Links, Copyright

### 8. INDUSTRY-SPECIFIC DIRECTION:
- For restaurants/pizzerias, prefer warm premium palette (e.g. deep red, tomato, basil green, mozzarella cream, charcoal).
- Use appetizing, modern hero composition with one strong focal image.
- Optional animation feel should be subtle and elegant (hover emphasis, glow/shadow depth, gentle visual rhythm), never chaotic.
- Keep copy coherent to the requested brand and language.

## CREATIVE FREEDOM - YOU DECIDE:
- All colors (primary, background, text, accent) - HEX values
- All font sizes and font weights
- Border radius (none, small, medium, large, full)
- Shadows (none, small, medium, large)
- Spacing/Gap values
- Layout decisions (flex vs grid, row vs column)
- Content texts (appropriate to the industry)
- Icons (use HTML entities like ★, ◆, ●)
- Image placeholder URLs from unsplash

## YOUR RESPONSE:
Return ONLY a valid JSON array of Bricks elements.
No markdown, no comments, no prose, no code fences.

## IMPORTANT RULES:
- IDs must be 6 characters random (a-z0-9)
- parents MUST be correctly set (parent=0 for sections)
- children array must contain all child element IDs
- settings MUST include ALL required settings per element type
- Colors as HEX (#RRGGBB)
- "tag": "a" MAKES A BUTTON when used with text-basic
- "link": { "type": "external", "url": "#" } for buttons/links
- Prioritize readability and UX quality over visual gimmicks

Answer ONLY with the JSON array!`;

const ALLOWED_ELEMENT_NAMES = new Set([
  "section",
  "container",
  "heading",
  "text-basic",
  "div",
  "image",
  "form",
]);

function randomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function sanitizeBricksElements(input: unknown): BricksElement[] {
  if (!Array.isArray(input)) return [];

  const usedIds = new Set<string>();
  const sanitized: BricksElement[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Partial<BricksElement> & { settings?: unknown };
    const name = typeof candidate.name === "string" ? candidate.name : "div";
    if (!ALLOWED_ELEMENT_NAMES.has(name)) continue;

    let id = typeof candidate.id === "string" ? candidate.id.toLowerCase() : "";
    if (!/^[a-z0-9]{6}$/.test(id) || usedIds.has(id)) {
      do {
        id = randomId();
      } while (usedIds.has(id));
    }
    usedIds.add(id);

    const parent =
      candidate.parent === 0 || typeof candidate.parent === "string"
        ? candidate.parent
        : 0;

    sanitized.push({
      id,
      name,
      parent,
      children: [],
      settings:
        candidate.settings && typeof candidate.settings === "object"
          ? (candidate.settings as Record<string, unknown>)
          : {},
      ...(typeof candidate.label === "string" ? { label: candidate.label } : {}),
    });
  }

  const byId = new Map(sanitized.map((el) => [el.id, el]));
  for (const el of sanitized) {
    if (el.parent !== 0 && !byId.has(el.parent)) {
      el.parent = 0;
    }
  }
  for (const el of sanitized) {
    if (el.parent !== 0) byId.get(el.parent)?.children.push(el.id);
  }

  return sanitized;
}

async function generateDirectBricksJSON(
  prompt: string,
  apiKey: string,
  isAnthropic: boolean
): Promise<BricksElement[]> {
  let responseText: string;

  if (isAnthropic) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: BRICKS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    responseText = data.content[0].text;
  } else {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: BRICKS_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    responseText = data.choices[0].message.content;
  }

  // Extract JSON array from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON array");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const sanitized = sanitizeBricksElements(parsed);

  if (sanitized.length === 0) {
    throw new Error("AI response contained no valid Bricks elements");
  }

  return sanitized;
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

  return elements;
}

// ============================================================
// API Endpoint
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, useAI, apiKey: requestApiKey, provider } = body as {
      prompt?: string;
      useAI?: boolean;
      apiKey?: string;
      provider?: "openai" | "anthropic";
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Please provide a description (prompt)" },
        { status: 400 }
      );
    }

    // Detect API keys (request key has priority, then environment variables)
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const bodyApiKey = requestApiKey?.trim();

    let apiKey: string | undefined;
    let isAnthropicKey = false;

    if (bodyApiKey && bodyApiKey.length > 10) {
      apiKey = bodyApiKey;
      if (provider === "anthropic") {
        isAnthropicKey = true;
      } else if (provider === "openai") {
        isAnthropicKey = false;
      } else {
        // Auto-detect by key prefix for BYOK payloads
        isAnthropicKey = bodyApiKey.startsWith("sk-ant-");
      }
    } else if (provider === "anthropic" && anthropicKey && anthropicKey.length > 10) {
      apiKey = anthropicKey;
      isAnthropicKey = true;
    } else if (provider === "openai" && openaiKey && openaiKey.length > 10) {
      apiKey = openaiKey;
      isAnthropicKey = false;
    } else if (anthropicKey && anthropicKey.length > 10) {
      apiKey = anthropicKey;
      isAnthropicKey = true;
    } else if (openaiKey && openaiKey.length > 10) {
      apiKey = openaiKey;
      isAnthropicKey = false;
    }

    const aiAvailable = !!apiKey;
    const shouldUseAI = aiAvailable && useAI !== false;

    let elements: BricksElement[];
    let mode: "ai" | "builtin";

    if (shouldUseAI) {
      // PHASE 2: AI generates DIRECT Bricks JSON (Creative Mode)
      try {
        elements = await generateDirectBricksJSON(prompt, apiKey!, isAnthropicKey);
        mode = "ai";
      } catch (err) {
        console.error("Direct AI generation failed, falling back to built-in:", err);
        // Fallback: Analyze prompt and use built-in engine
        const config = analyzePromptWithBasicDetection(prompt);
        elements = generateFromConfig(config);
        mode = "builtin";
      }
    } else {
      // Built-in mode: Analyze prompt and use built-in engine
      const config = analyzePromptWithBasicDetection(prompt);
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

function analyzePromptWithBasicDetection(prompt: string): GenerationConfig {
  const lower = prompt.toLowerCase();
  
  // Simple section detection based on keywords
  const sections: string[] = [];
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

  // Basic design tokens from keywords
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
    designTokens.accentColor = "#F4B400";
    designTokens.headingColor = "#FFF4E6";
    designTokens.textColor = "#F6EAD9";
  }

  return {
    sections,
    brandName: "BrandName",
    headline: "Build Something Amazing",
    subtext: "Create stunning websites with our powerful tools.",
    heroStyle: "centered",
    buttonText: "Get Started",
    features: [{ title: "Feature", description: "Description" }],
    plans: [{ name: "Basic", price: "$9", period: "/month", features: ["Feature 1"], buttonText: "Start" }],
    testimonials: [{ quote: "Great!", author: "User", role: "Customer", rating: 5 }],
    navLinks: [{ text: "Home", url: "/" }, { text: "Features", url: "#features" }],
    ctaHeadline: "Ready to Get Started?",
    ctaSubtext: "Join thousands of happy customers.",
    ctaButtonText: "Start Now",
    galleryItems: [{ title: "Project 1", category: "Work" }],
    gallerySectionTitle: "Our Work",
    gallerySectionSubtitle: "Explore our projects",
    teamMembers: [{ name: "Team Member", role: "Role" }],
    stats: [{ value: "100+", label: "Happy Clients" }],
    faqItems: [{ question: "How?", answer: "Easy!" }],
    logoNames: [{ name: "Partner 1" }],
    blogPosts: [{ title: "Latest Post", excerpt: "Read more...", category: "News", date: "Feb 2026", readTime: "5 min" }],
    steps: [{ title: "Step 1", description: "Start here" }],
    portfolioProjects: [{ title: "Project", category: "Work" }],
    services: [{ title: "Service", description: "Description" }],
    timelineEvents: [{ year: "2024", title: "Started", description: "Our journey began" }],
    contentTitle: "About Us",
    contentText: "We create amazing things.",
    contentImagePosition: "right",
    errorHeadline: "404",
    errorSubtext: "Page not found",
    comingSoonHeadline: "Coming Soon",
    comingSoonSubtext: "We're working on something amazing",
    loginHeading: "Welcome Back",
    loginSubtext: "Sign in to continue",
    designTokens,
  };
}
