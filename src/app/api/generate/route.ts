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
  wrapTemplate,
  BricksElement,
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
}

// ============================================================
// BUILT-IN: Keyword-based prompt analysis (works without API)
// ============================================================
function analyzePrompt(prompt: string): GenerationConfig {
  const lower = prompt.toLowerCase();

  let brandName = "BrandName";
  const brandMatch = prompt.match(
    /(?:brand|company|firma|name|marke|website|seite)\s*(?:name|:)?\s*["']?([A-Z][a-zA-Z0-9\s]{1,20})["']?/i
  );
  if (brandMatch) brandName = brandMatch[1].trim();

  const sections: string[] = [];

  const hasNavbar = /nav|menu|header|navigation|menü/i.test(lower);
  const hasHero = /hero|banner|landing|header|startseite|hauptbereich/i.test(lower);
  const hasFeatures = /feature|service|leistung|dienst|vorteile|funktion/i.test(lower);
  const hasPricing = /preis|pric|plan|paket|tarif/i.test(lower);
  const hasTestimonials = /testimonial|review|bewertung|kundenstimme|referenz/i.test(lower);
  const hasCTA = /cta|call.to.action|aufforderung|handlungsaufforderung/i.test(lower);
  const hasContact = /contact|kontakt|form|formular/i.test(lower);
  const hasFooter = /footer|fußzeile|fusszeile/i.test(lower);
  const hasGallery = /gallery|galerie|portfolio|showcase|work|projekte|arbeiten|bilder|photos?|fotos?/i.test(lower);
  const isFullPage = /full.page|complete|ganze.seite|komplette.seite|landing.?page|website|webseite/i.test(lower);

  if (isFullPage) {
    sections.push("navbar", "hero", "features", "testimonials", "pricing", "cta", "footer");
    if (hasContact) sections.push("contact");
    if (hasGallery) sections.splice(3, 0, "gallery"); // after features
  } else {
    if (hasNavbar) sections.push("navbar");
    if (hasHero) sections.push("hero");
    if (hasFeatures) sections.push("features");
    if (hasGallery) sections.push("gallery");
    if (hasTestimonials) sections.push("testimonials");
    if (hasPricing) sections.push("pricing");
    if (hasCTA) sections.push("cta");
    if (hasContact) sections.push("contact");
    if (hasFooter) sections.push("footer");
    // Default: if nothing matched, generate gallery for gallery-like prompts, otherwise hero
    if (sections.length === 0) sections.push("hero");
  }

  let heroStyle: "centered" | "split" | "gradient" = "centered";
  if (/split|bild|image|photo|foto/i.test(lower)) {
    heroStyle = "split";
  } else if (/dark|dunkel|gradient|tech|modern/i.test(lower)) {
    heroStyle = "gradient";
  }

  let headline = "Build Something Amazing";
  let subtext = "Create stunning websites with our powerful tools and intuitive design system.";
  let buttonText = "Get Started";
  let ctaHeadline = "Ready to Get Started?";
  let ctaSubtext = "Join thousands of creators who are already building amazing websites.";
  let ctaButtonText = "Start Building Now";
  let gallerySectionTitle = "Our Gallery";
  let gallerySectionSubtitle = "Explore our latest work and projects";
  let galleryItems: Array<{ title: string; category: string }> = [
    { title: "Project Alpha", category: "Web Design" },
    { title: "Brand Identity", category: "Branding" },
    { title: "Mobile App UI", category: "UI/UX" },
    { title: "E-Commerce Store", category: "Development" },
    { title: "Marketing Campaign", category: "Strategy" },
    { title: "Product Photography", category: "Photography" },
  ];

  let features: Array<{ title: string; description: string }> = [
    { title: "Lightning Fast", description: "Optimized for speed with instant load times and smooth interactions." },
    { title: "Fully Responsive", description: "Looks perfect on every device, from mobile to desktop." },
    { title: "Easy to Customize", description: "Modify colors, fonts, and layouts with a few clicks." },
    { title: "SEO Optimized", description: "Built with best practices for search engine visibility." },
    { title: "Secure by Default", description: "Enterprise-grade security built into every component." },
    { title: "24/7 Support", description: "Our team is always here to help you succeed." },
  ];

  let plans = [
    { name: "Starter", price: "$9", period: "/month", features: ["5 Projects", "Basic Analytics", "Email Support"], buttonText: "Start Free" },
    { name: "Professional", price: "$29", period: "/month", features: ["Unlimited Projects", "Advanced Analytics", "Priority Support", "Custom Domain"], highlighted: true as const, buttonText: "Get Started" },
    { name: "Enterprise", price: "$99", period: "/month", features: ["Everything in Pro", "Dedicated Support", "SLA Guarantee", "Custom Integrations"], buttonText: "Contact Sales" },
  ];

  let testimonials = [
    { quote: "This product completely transformed how we work. The results are incredible.", author: "Sarah Johnson", role: "CEO, TechStart", rating: 5 },
    { quote: "Best investment we've made this year. The ROI has been phenomenal.", author: "Michael Chen", role: "Marketing Director", rating: 5 },
    { quote: "Outstanding quality and support. Highly recommended for any business.", author: "Emily Rodriguez", role: "Founder, Creative Labs", rating: 5 },
  ];

  // Industry detection
  if (/restaurant|food|essen|küche|gastro/i.test(lower)) {
    headline = "Exquisite Dining Experience";
    subtext = "Discover culinary excellence with our carefully crafted dishes made from the finest ingredients.";
    buttonText = "Reserve a Table";
    ctaHeadline = "Ready to Dine With Us?";
    ctaSubtext = "Book your table today and experience unforgettable flavors.";
    ctaButtonText = "Make Reservation";
    features = [
      { title: "Fresh Ingredients", description: "We source only the finest local and seasonal ingredients for every dish." },
      { title: "Expert Chefs", description: "Our award-winning culinary team brings decades of experience." },
      { title: "Cozy Atmosphere", description: "A warm and inviting setting perfect for any occasion." },
      { title: "Private Events", description: "Host your special celebrations in our exclusive event spaces." },
      { title: "Takeout & Delivery", description: "Enjoy our dishes from the comfort of your home." },
      { title: "Wine Selection", description: "Curated wine list to perfectly complement your meal." },
    ];
  } else if (/agency|agentur|design|kreativ/i.test(lower)) {
    headline = "We Craft Digital Experiences";
    subtext = "Award-winning design agency specializing in brand identity, web design, and digital strategy.";
    buttonText = "View Our Work";
    ctaHeadline = "Let's Create Together";
    ctaSubtext = "Ready to bring your vision to life? Let's discuss your next project.";
    ctaButtonText = "Start a Project";
    features = [
      { title: "Brand Identity", description: "Memorable brands that stand out and resonate with your audience." },
      { title: "Web Design", description: "Beautiful, functional websites that convert visitors into customers." },
      { title: "UI/UX Design", description: "Intuitive interfaces backed by thorough user research." },
      { title: "Motion Design", description: "Engaging animations that bring your digital presence to life." },
      { title: "Digital Strategy", description: "Data-driven strategies that deliver measurable results." },
      { title: "Content Creation", description: "Compelling content that tells your story and drives engagement." },
    ];
  } else if (/shop|store|ecommerce|e-commerce|laden|woocommerce/i.test(lower)) {
    headline = "Shop the Latest Collection";
    subtext = "Discover premium products crafted with care. Free shipping on orders over $50.";
    buttonText = "Shop Now";
    ctaHeadline = "Don't Miss Out";
    ctaSubtext = "Sign up for exclusive deals and early access to new arrivals.";
    ctaButtonText = "Join Now";
    features = [
      { title: "Free Shipping", description: "Enjoy free shipping on all orders over $50. No hidden fees." },
      { title: "Easy Returns", description: "30-day hassle-free return policy on all purchases." },
      { title: "Secure Payment", description: "Your transactions are protected with bank-level encryption." },
      { title: "Premium Quality", description: "Every product is carefully curated for exceptional quality." },
      { title: "Fast Delivery", description: "Express delivery available. Most orders ship within 24 hours." },
      { title: "Customer Support", description: "Our friendly team is here 7 days a week to help you." },
    ];
  } else if (/fitness|gym|sport|training|health|gesundheit/i.test(lower)) {
    headline = "Transform Your Body & Mind";
    subtext = "Join our world-class fitness programs and achieve your health goals with expert guidance.";
    buttonText = "Start Training";
    ctaHeadline = "Begin Your Journey Today";
    ctaSubtext = "Your first week is on us. No commitment, no contracts.";
    ctaButtonText = "Claim Free Trial";
    features = [
      { title: "Personal Training", description: "One-on-one sessions with certified fitness professionals." },
      { title: "Group Classes", description: "High-energy group workouts from yoga to HIIT." },
      { title: "Nutrition Plans", description: "Customized meal plans tailored to your fitness goals." },
      { title: "Modern Equipment", description: "State-of-the-art facilities with the latest equipment." },
      { title: "Flexible Hours", description: "Open 24/7 so you can train on your schedule." },
      { title: "Progress Tracking", description: "Track your fitness journey with our advanced app." },
    ];
  } else if (/saas|software|app|platform|plattform|tool/i.test(lower)) {
    headline = "Streamline Your Workflow";
    subtext = "The all-in-one platform for managing projects, teams, and clients. Built for modern businesses.";
    buttonText = "Start Free Trial";
    ctaHeadline = "Ready to Scale?";
    ctaSubtext = "Join 10,000+ teams already using our platform to work smarter.";
    ctaButtonText = "Try It Free";
  } else if (/immobilien|real.estate|property|makler/i.test(lower)) {
    headline = "Find Your Dream Home";
    subtext = "Premium real estate services with a personal touch. We make finding your perfect home effortless.";
    buttonText = "Browse Properties";
    ctaHeadline = "Ready to Move?";
    ctaSubtext = "Schedule a free consultation with our experienced agents today.";
    ctaButtonText = "Book Consultation";
    features = [
      { title: "Expert Agents", description: "Our experienced team knows the local market inside and out." },
      { title: "Premium Listings", description: "Access exclusive properties not found on public listings." },
      { title: "Virtual Tours", description: "Explore properties from anywhere with immersive 3D tours." },
      { title: "Market Analysis", description: "Data-driven insights to help you make informed decisions." },
      { title: "Mortgage Support", description: "We connect you with the best lenders for competitive rates." },
      { title: "Full Service", description: "From search to closing, we handle every detail." },
    ];
  }

  const headlineMatch = prompt.match(
    /(?:headline|überschrift|titel|heading)\s*[:=]\s*["']([^"']+)["']/i
  );
  if (headlineMatch) headline = headlineMatch[1];

  const navLinks = [
    { text: "Home", url: "/" },
    { text: "Features", url: "#features" },
    { text: "Pricing", url: "#pricing" },
    { text: "Contact", url: "#contact" },
  ];

  return {
    sections, brandName, headline, subtext, heroStyle, buttonText,
    features, plans, testimonials, navLinks, ctaHeadline, ctaSubtext, ctaButtonText,
    galleryItems, gallerySectionTitle, gallerySectionSubtitle,
  };
}

// ============================================================
// AI MODE: AI generates content, our engine builds the structure
// -> Structure is ALWAYS correct, AI just makes content smarter
// ============================================================
async function generateContentWithAI(
  prompt: string,
  apiKey: string,
  isAnthropic: boolean
): Promise<GenerationConfig> {
  const systemPrompt = `Du bist ein Content-Generator für Website-Templates. Der User beschreibt eine Website, du lieferst passende Inhalte als JSON zurück.

Antworte NUR mit einem JSON-Objekt in diesem exakten Format:
{
  "sections": ["navbar", "hero", "gallery", "features", "testimonials", "pricing", "cta", "footer"],
  "brandName": "Firmenname",
  "headline": "Hauptüberschrift der Hero-Section",
  "subtext": "Beschreibungstext unter der Überschrift",
  "heroStyle": "centered",
  "buttonText": "Button-Text",
  "features": [
    {"title": "Feature 1", "description": "Beschreibung"},
    {"title": "Feature 2", "description": "Beschreibung"},
    {"title": "Feature 3", "description": "Beschreibung"},
    {"title": "Feature 4", "description": "Beschreibung"},
    {"title": "Feature 5", "description": "Beschreibung"},
    {"title": "Feature 6", "description": "Beschreibung"}
  ],
  "galleryItems": [
    {"title": "Projekt 1", "category": "Kategorie"},
    {"title": "Projekt 2", "category": "Kategorie"},
    {"title": "Projekt 3", "category": "Kategorie"},
    {"title": "Projekt 4", "category": "Kategorie"},
    {"title": "Projekt 5", "category": "Kategorie"},
    {"title": "Projekt 6", "category": "Kategorie"}
  ],
  "gallerySectionTitle": "Galerie-Überschrift",
  "gallerySectionSubtitle": "Galerie-Beschreibung",
  "plans": [
    {"name": "Basic", "price": "$9", "period": "/Monat", "features": ["Feature 1", "Feature 2", "Feature 3"], "buttonText": "Starten"},
    {"name": "Pro", "price": "$29", "period": "/Monat", "features": ["Alles aus Basic", "Feature 4", "Feature 5", "Feature 6"], "highlighted": true, "buttonText": "Jetzt starten"},
    {"name": "Enterprise", "price": "$99", "period": "/Monat", "features": ["Alles aus Pro", "Feature 7", "Feature 8", "Feature 9"], "buttonText": "Kontakt"}
  ],
  "testimonials": [
    {"quote": "Zitat 1", "author": "Name", "role": "Position, Firma", "rating": 5},
    {"quote": "Zitat 2", "author": "Name", "role": "Position, Firma", "rating": 5},
    {"quote": "Zitat 3", "author": "Name", "role": "Position, Firma", "rating": 5}
  ],
  "navLinks": [
    {"text": "Home", "url": "/"},
    {"text": "Features", "url": "#features"},
    {"text": "Preise", "url": "#pricing"},
    {"text": "Kontakt", "url": "#contact"}
  ],
  "ctaHeadline": "CTA Überschrift",
  "ctaSubtext": "CTA Beschreibung",
  "ctaButtonText": "CTA Button"
}

Regeln:
- "sections" muss ein Array sein mit Werten aus: "navbar", "hero", "gallery", "features", "testimonials", "pricing", "cta", "contact", "footer"
- Wähle NUR die Sections, die zum Prompt des Users passen! Wenn der User z.B. nur "gallery" will, gib nur ["gallery"] zurück
- Wenn der User "gallery", "portfolio", "showcase", "Galerie", "Bilder", "Fotos" erwähnt, MUSS "gallery" in sections enthalten sein
- "heroStyle" muss eines von "centered", "split", "gradient" sein
- Passe ALLE Texte an die beschriebene Branche/Nische an
- Features sollten genau 6 sein, galleryItems genau 6
- Plans sollten genau 3 sein, Testimonials genau 3
- Wenn der User Deutsch schreibt, antworte mit deutschen Inhalten
- Antworte NUR mit dem JSON, kein anderer Text`;

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
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: "user", content: prompt },
        ],
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
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    responseText = data.choices[0].message.content;
  }

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and fill defaults for any missing fields
  return {
    sections: Array.isArray(parsed.sections) ? parsed.sections : ["hero"],
    brandName: parsed.brandName || "BrandName",
    headline: parsed.headline || "Build Something Amazing",
    subtext: parsed.subtext || "Create stunning websites.",
    heroStyle: ["centered", "split", "gradient"].includes(parsed.heroStyle) ? parsed.heroStyle : "centered",
    buttonText: parsed.buttonText || "Get Started",
    features: Array.isArray(parsed.features) && parsed.features.length > 0
      ? parsed.features.slice(0, 6)
      : [{ title: "Feature", description: "Description" }],
    plans: Array.isArray(parsed.plans) && parsed.plans.length > 0
      ? parsed.plans
      : [{ name: "Basic", price: "$9", period: "/month", features: ["Feature 1"], buttonText: "Start" }],
    testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
      ? parsed.testimonials
      : [{ quote: "Great product!", author: "User", role: "Customer", rating: 5 }],
    navLinks: Array.isArray(parsed.navLinks) && parsed.navLinks.length > 0
      ? parsed.navLinks
      : [{ text: "Home", url: "/" }],
    ctaHeadline: parsed.ctaHeadline || "Ready to Get Started?",
    ctaSubtext: parsed.ctaSubtext || "Join thousands of happy customers.",
    ctaButtonText: parsed.ctaButtonText || "Start Now",
    galleryItems: Array.isArray(parsed.galleryItems) && parsed.galleryItems.length > 0
      ? parsed.galleryItems.slice(0, 6)
      : [
          { title: "Project Alpha", category: "Web Design" },
          { title: "Brand Identity", category: "Branding" },
          { title: "Mobile App UI", category: "UI/UX" },
          { title: "E-Commerce Store", category: "Development" },
          { title: "Marketing Campaign", category: "Strategy" },
          { title: "Product Photography", category: "Photography" },
        ],
    gallerySectionTitle: parsed.gallerySectionTitle || "Our Gallery",
    gallerySectionSubtitle: parsed.gallerySectionSubtitle || "Explore our latest work and projects",
  };
}

// ============================================================
// Build Bricks elements from config (ALWAYS used for structure)
// ============================================================
function generateFromConfig(config: GenerationConfig): BricksElement[] {
  let elements: BricksElement[] = [];

  for (const section of config.sections) {
    switch (section) {
      case "navbar":
        elements = [...elements, ...generateNavbar(config.brandName, config.navLinks)];
        break;
      case "hero":
        elements = [...elements, ...generateHeroSection(config.headline, config.subtext, config.buttonText, "#", config.heroStyle)];
        break;
      case "features":
        elements = [...elements, ...generateFeaturesSection(undefined, undefined, config.features)];
        break;
      case "gallery":
        elements = [...elements, ...generateGallerySection(config.gallerySectionTitle, config.gallerySectionSubtitle, config.galleryItems)];
        break;
      case "pricing":
        elements = [...elements, ...generatePricingSection(config.plans)];
        break;
      case "testimonials":
        elements = [...elements, ...generateTestimonialsSection(config.testimonials)];
        break;
      case "cta":
        elements = [...elements, ...generateCTASection(config.ctaHeadline, config.ctaSubtext, config.ctaButtonText)];
        break;
      case "contact":
        elements = [...elements, ...generateContactSection()];
        break;
      case "footer":
        elements = [...elements, ...generateFooterSection(config.brandName)];
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
    const { prompt, useAI } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Please provide a description (prompt)" },
        { status: 400 }
      );
    }

    // Detect API keys by env variable name (not key format)
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    let apiKey: string | undefined;
    let isAnthropicKey = false;

    if (anthropicKey && anthropicKey.length > 10) {
      apiKey = anthropicKey;
      isAnthropicKey = true;
    } else if (openaiKey && openaiKey.length > 10) {
      apiKey = openaiKey;
      isAnthropicKey = false;
    }

    const aiAvailable = !!apiKey;
    const shouldUseAI = aiAvailable && useAI !== false;

    let config: GenerationConfig;
    let mode: "ai" | "builtin";

    if (shouldUseAI) {
      try {
        config = await generateContentWithAI(prompt, apiKey!, isAnthropicKey);
        mode = "ai";
      } catch (err) {
        console.error("AI generation failed, falling back to built-in:", err);
        config = analyzePrompt(prompt);
        mode = "builtin";
      }
    } else {
      config = analyzePrompt(prompt);
      mode = "builtin";
    }

    // ALWAYS use our engine for the Bricks structure
    const elements = generateFromConfig(config);
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
