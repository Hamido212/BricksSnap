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
  generateFullPage,
  wrapTemplate,
  BricksElement,
} from "@/lib/bricks-engine";

// Intelligent template generation based on text description
// This works without any external API - it uses keyword matching
// to generate appropriate Bricks Builder templates

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
}

function analyzePrompt(prompt: string): GenerationConfig {
  const lower = prompt.toLowerCase();

  // Detect brand name
  let brandName = "BrandName";
  const brandMatch = prompt.match(
    /(?:brand|company|firma|name|marke|website|seite)\s*(?:name|:)?\s*["']?([A-Z][a-zA-Z0-9\s]{1,20})["']?/i
  );
  if (brandMatch) brandName = brandMatch[1].trim();

  // Detect sections to include
  const sections: string[] = [];

  const hasNavbar =
    lower.includes("nav") ||
    lower.includes("menu") ||
    lower.includes("header") ||
    lower.includes("navigation") ||
    lower.includes("menü");
  const hasHero =
    lower.includes("hero") ||
    lower.includes("banner") ||
    lower.includes("landing") ||
    lower.includes("header") ||
    lower.includes("startseite") ||
    lower.includes("hauptbereich");
  const hasFeatures =
    lower.includes("feature") ||
    lower.includes("service") ||
    lower.includes("leistung") ||
    lower.includes("dienst") ||
    lower.includes("vorteile") ||
    lower.includes("funktion");
  const hasPricing =
    lower.includes("preis") ||
    lower.includes("pric") ||
    lower.includes("plan") ||
    lower.includes("paket") ||
    lower.includes("tarif");
  const hasTestimonials =
    lower.includes("testimonial") ||
    lower.includes("review") ||
    lower.includes("bewertung") ||
    lower.includes("kundenstimme") ||
    lower.includes("referenz");
  const hasCTA =
    lower.includes("cta") ||
    lower.includes("call to action") ||
    lower.includes("aufforderung") ||
    lower.includes("handlungsaufforderung");
  const hasContact =
    lower.includes("contact") ||
    lower.includes("kontakt") ||
    lower.includes("form") ||
    lower.includes("formular");
  const hasFooter =
    lower.includes("footer") ||
    lower.includes("fußzeile") ||
    lower.includes("fusszeile");
  const isFullPage =
    lower.includes("full page") ||
    lower.includes("complete") ||
    lower.includes("ganze seite") ||
    lower.includes("komplette seite") ||
    lower.includes("landing page") ||
    lower.includes("landingpage") ||
    lower.includes("website") ||
    lower.includes("webseite");

  if (isFullPage) {
    sections.push("navbar", "hero", "features", "testimonials", "pricing", "cta", "footer");
    if (hasContact) sections.push("contact");
  } else {
    if (hasNavbar) sections.push("navbar");
    if (hasHero || sections.length === 0) sections.push("hero");
    if (hasFeatures) sections.push("features");
    if (hasTestimonials) sections.push("testimonials");
    if (hasPricing) sections.push("pricing");
    if (hasCTA) sections.push("cta");
    if (hasContact) sections.push("contact");
    if (hasFooter) sections.push("footer");
  }

  // Detect hero style
  let heroStyle: "centered" | "split" | "gradient" = "centered";
  if (
    lower.includes("split") ||
    lower.includes("bild") ||
    lower.includes("image") ||
    lower.includes("photo") ||
    lower.includes("foto")
  ) {
    heroStyle = "split";
  } else if (
    lower.includes("dark") ||
    lower.includes("dunkel") ||
    lower.includes("gradient") ||
    lower.includes("tech") ||
    lower.includes("modern")
  ) {
    heroStyle = "gradient";
  }

  // Detect industry / niche for content
  let headline = "Build Something Amazing";
  let subtext =
    "Create stunning websites with our powerful tools and intuitive design system.";
  let buttonText = "Get Started";
  let ctaHeadline = "Ready to Get Started?";
  let ctaSubtext =
    "Join thousands of creators who are already building amazing websites.";
  let ctaButtonText = "Start Building Now";

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
    { name: "Professional", price: "$29", period: "/month", features: ["Unlimited Projects", "Advanced Analytics", "Priority Support", "Custom Domain"], highlighted: true, buttonText: "Get Started" },
    { name: "Enterprise", price: "$99", period: "/month", features: ["Everything in Pro", "Dedicated Support", "SLA Guarantee", "Custom Integrations"], buttonText: "Contact Sales" },
  ];

  let testimonials = [
    { quote: "This product completely transformed how we work. The results are incredible.", author: "Sarah Johnson", role: "CEO, TechStart", rating: 5 },
    { quote: "Best investment we've made this year. The ROI has been phenomenal.", author: "Michael Chen", role: "Marketing Director", rating: 5 },
    { quote: "Outstanding quality and support. Highly recommended for any business.", author: "Emily Rodriguez", role: "Founder, Creative Labs", rating: 5 },
  ];

  // Industry detection
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("essen") || lower.includes("küche") || lower.includes("gastro")) {
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
  } else if (lower.includes("agency") || lower.includes("agentur") || lower.includes("design") || lower.includes("kreativ")) {
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
  } else if (lower.includes("shop") || lower.includes("store") || lower.includes("ecommerce") || lower.includes("e-commerce") || lower.includes("laden") || lower.includes("woocommerce")) {
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
  } else if (lower.includes("fitness") || lower.includes("gym") || lower.includes("sport") || lower.includes("training") || lower.includes("health") || lower.includes("gesundheit")) {
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
  } else if (lower.includes("saas") || lower.includes("software") || lower.includes("app") || lower.includes("platform") || lower.includes("plattform") || lower.includes("tool")) {
    headline = "Streamline Your Workflow";
    subtext = "The all-in-one platform for managing projects, teams, and clients. Built for modern businesses.";
    buttonText = "Start Free Trial";
    ctaHeadline = "Ready to Scale?";
    ctaSubtext = "Join 10,000+ teams already using our platform to work smarter.";
    ctaButtonText = "Try It Free";
  } else if (lower.includes("immobilien") || lower.includes("real estate") || lower.includes("property") || lower.includes("makler")) {
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

  // Extract custom headline from prompt if available
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
    sections,
    brandName,
    headline,
    subtext,
    heroStyle,
    buttonText,
    features,
    plans,
    testimonials,
    navLinks,
    ctaHeadline,
    ctaSubtext,
    ctaButtonText,
  };
}

function generateFromConfig(config: GenerationConfig): BricksElement[] {
  let elements: BricksElement[] = [];

  for (const section of config.sections) {
    switch (section) {
      case "navbar":
        elements = [...elements, ...generateNavbar(config.brandName, config.navLinks)];
        break;
      case "hero":
        elements = [
          ...elements,
          ...generateHeroSection(
            config.headline,
            config.subtext,
            config.buttonText,
            "#",
            config.heroStyle
          ),
        ];
        break;
      case "features":
        elements = [
          ...elements,
          ...generateFeaturesSection(undefined, undefined, config.features),
        ];
        break;
      case "pricing":
        elements = [...elements, ...generatePricingSection(config.plans)];
        break;
      case "testimonials":
        elements = [
          ...elements,
          ...generateTestimonialsSection(config.testimonials),
        ];
        break;
      case "cta":
        elements = [
          ...elements,
          ...generateCTASection(
            config.ctaHeadline,
            config.ctaSubtext,
            config.ctaButtonText
          ),
        ];
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, type } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Please provide a description (prompt)" },
        { status: 400 }
      );
    }

    // Check if we should try external AI API
    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    let elements: BricksElement[];

    if (apiKey && type === "ai") {
      // Use external AI to generate more customized templates
      try {
        elements = await generateWithAI(prompt, apiKey);
      } catch {
        // Fallback to built-in generation
        const config = analyzePrompt(prompt);
        elements = generateFromConfig(config);
      }
    } else {
      // Use built-in intelligent generation
      const config = analyzePrompt(prompt);
      elements = generateFromConfig(config);
    }

    const template = wrapTemplate(elements);

    return NextResponse.json({
      success: true,
      template,
      elementCount: elements.length,
      sections: [...new Set(elements.filter((e) => e.parent === 0).map((e) => e.label || e.name))],
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}

async function generateWithAI(
  prompt: string,
  apiKey: string
): Promise<BricksElement[]> {
  const systemPrompt = `You are a Bricks Builder template generator. Given a description, output a JSON array of Bricks Builder elements.

Each element must have:
- id: 6-character lowercase alphanumeric string (unique)
- name: element type (section, container, block, heading, text-basic, image, button, form, div, icon, video)
- parent: parent element's id (string) or 0 for root-level
- children: array of child element IDs
- settings: object with element configuration

Common settings:
- text: HTML text content
- tag: HTML tag (h1-h6, p, span, a, custom)
- _typography: { font-size, font-weight, line-height, color: { hex }, font-family, letter-spacing }
- _background: { color: { hex }, image: { url } }
- _padding: { top, bottom, left, right } (values as strings in px)
- _margin: { top, bottom, left, right }
- _border: { radius: { top, right, bottom, left }, width: { top, right, bottom, left }, style, color: { hex } }
- _width, _height: CSS values
- _direction: "row" or "column"
- _justifyContent, _alignItems: flexbox values
- _gap: CSS gap value
- _display: "flex", "grid", etc.
- link: { type: "external", url: "..." }

Always start with a section (parent: 0), then container, then blocks with content elements.
Output ONLY the JSON array, no explanation.`;

  const isAnthropic = apiKey.startsWith("sk-ant-");

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
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Generate a Bricks Builder template for: ${prompt}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
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
          {
            role: "user",
            content: `Generate a Bricks Builder template for: ${prompt}`,
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }

  throw new Error("Could not parse AI response");
}
