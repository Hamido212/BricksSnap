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
// COLOR & DESIGN DETECTION (for built-in mode)
// ============================================================

const COLOR_MAP: Record<string, string> = {
  // German
  schwarz: "#000000", weiß: "#ffffff", weiss: "#ffffff", rot: "#ef4444",
  blau: "#3b82f6", grün: "#10b981", gruen: "#10b981", gelb: "#f59e0b",
  lila: "#8b5cf6", violett: "#7c3aed", pink: "#ec4899", rosa: "#f472b6",
  orange: "#f97316", türkis: "#06b6d4", tuerkis: "#06b6d4", grau: "#6b7280",
  braun: "#92400e", gold: "#d97706", silber: "#9ca3af",
  // English
  black: "#000000", white: "#ffffff", red: "#ef4444",
  blue: "#3b82f6", green: "#10b981", yellow: "#f59e0b",
  purple: "#8b5cf6", violet: "#7c3aed", teal: "#14b8a6",
  cyan: "#06b6d4", gray: "#6b7280", grey: "#6b7280",
  brown: "#92400e", silver: "#9ca3af", navy: "#1e3a5f",
  indigo: "#4f46e5", lime: "#84cc16", emerald: "#059669",
  amber: "#d97706", slate: "#475569", zinc: "#71717a",
  coral: "#f97316", crimson: "#dc2626", magenta: "#d946ef",
};

function detectDesignTokens(prompt: string): Partial<DesignTokens> {
  const lower = prompt.toLowerCase();
  const tokens: Partial<DesignTokens> = {};

  // Detect dark mode
  if (/dunkel|dark\s*mode|dark\s*theme|dunkler?\s*hintergrund|schwarzer?\s*hintergrund|dark\s*background/i.test(lower)) {
    tokens.darkMode = true;
  }

  // Detect hex colors in prompt: #RRGGBB or #RGB
  const hexMatches = prompt.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
  if (hexMatches && hexMatches.length > 0) {
    tokens.primaryColor = hexMatches[0];
    if (hexMatches.length > 1) tokens.secondaryColor = hexMatches[1];
    if (hexMatches.length > 2) tokens.backgroundColor = hexMatches[2];
  }

  // Detect named colors with context
  // "primary/haupt color/farbe: blue/blau" or "in blau" or "blaue buttons"
  const primaryColorMatch = lower.match(/(?:primary|haupt|accent|akzent|brand|marken)[\s-]*(?:color|farbe|colour)[\s:]*(\w+)/i)
    || lower.match(/(?:buttons?|knöpfe?|cta)\s+(?:in\s+)?(\w+)/i);
  if (primaryColorMatch && COLOR_MAP[primaryColorMatch[1]]) {
    tokens.primaryColor = COLOR_MAP[primaryColorMatch[1]];
  }

  const bgColorMatch = lower.match(/(?:background|hintergrund|bg)[\s-]*(?:color|farbe|colour)?[\s:]*(\w+)/i);
  if (bgColorMatch && COLOR_MAP[bgColorMatch[1]]) {
    const bgColor = COLOR_MAP[bgColorMatch[1]];
    tokens.backgroundColor = bgColor;
    // If bg is dark, auto-enable dark mode
    if (["#000000", "#0f172a", "#1e293b", "#111827"].includes(bgColor) || bgColorMatch[1].match(/schwarz|black|dunkel|dark/)) {
      tokens.darkMode = true;
    }
  }

  const textColorMatch = lower.match(/(?:text|schrift|font)[\s-]*(?:color|farbe|colour)?[\s:]*(\w+)/i);
  if (textColorMatch && COLOR_MAP[textColorMatch[1]]) {
    tokens.textColor = COLOR_MAP[textColorMatch[1]];
    tokens.headingColor = COLOR_MAP[textColorMatch[1]];
  }

  // Detect general color mentions (without context) as primary color fallback
  if (!tokens.primaryColor) {
    for (const [name, hex] of Object.entries(COLOR_MAP)) {
      if (name.length >= 3 && new RegExp(`\\b${name}\\b`, "i").test(lower)) {
        tokens.primaryColor = hex;
        break;
      }
    }
  }

  // Detect border radius
  if (/eckig|sharp|kantig|keine?\s*rundung|no\s*radius|square/i.test(lower)) {
    tokens.borderRadius = "none";
  } else if (/leicht\s*rund|slightly\s*round|subtle\s*radius/i.test(lower)) {
    tokens.borderRadius = "small";
  } else if (/sehr\s*rund|very\s*round|stark\s*gerundet|pill|rounded/i.test(lower)) {
    tokens.borderRadius = "large";
  } else if (/voll\s*rund|fully\s*round|komplett\s*rund|kreisförmig/i.test(lower)) {
    tokens.borderRadius = "full";
  } else if (/rund|round/i.test(lower)) {
    tokens.borderRadius = "large";
  }

  // Detect shadows
  if (/schatten|shadow/i.test(lower)) {
    if (/großer?\s*schatten|large\s*shadow|starker?\s*schatten|strong\s*shadow/i.test(lower)) {
      tokens.shadow = "large";
    } else if (/leichter?\s*schatten|subtle\s*shadow|kleiner?\s*schatten|small\s*shadow/i.test(lower)) {
      tokens.shadow = "small";
    } else {
      tokens.shadow = "medium";
    }
  }

  // Detect "no shadow" explicitly
  if (/kein(?:e|en)?\s*schatten|no\s*shadow|flat|flach/i.test(lower)) {
    tokens.shadow = "none";
  }

  return tokens;
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
  const hasTeam = /team|mitarbeiter|über\s*uns|about\s*us|people|leute|mannschaft/i.test(lower);
  const hasStats = /stats?|statistik|counter|zähler|zahlen|numbers?|kennzahlen|impact/i.test(lower);
  const hasFaq = /faq|häufige?\s*fragen?|frequently|fragen?\s*und\s*antworten?|q\s*&\s*a/i.test(lower);
  const hasLogos = /logos?|brands?|marken|partner|kunden|clients?|trusted/i.test(lower);
  const hasBlog = /blog|artikel|articles?|news|nachrichten|posts?|beiträge?|magazine?/i.test(lower);
  const hasSteps = /steps?|schritte?|prozess|process|how\s*it\s*works|ablauf|anleitung|wie\s*(es\s*)?funktioniert/i.test(lower);
  const hasPortfolio = /portfolio|projekte|projects?|case.stud|arbeitsproben|showcase|referenzen|work/i.test(lower);
  const hasServices = /services?|dienstleistungen?|leistungen|angebote?|offerings?|was\s*wir\s*bieten/i.test(lower);
  const hasTimeline = /timeline|zeitstrahl|chronik|history|geschichte|milestones?|meilensteine?|journey/i.test(lower);
  const has404 = /404|error\s*page|fehlerseite|not\s*found|seite\s*nicht\s*gefunden/i.test(lower);
  const hasComingSoon = /coming\s*soon|launch|bald|demnächst|demnaechst|under\s*construction|wartung/i.test(lower);
  const hasLogin = /login|anmelden|sign\s*in|einloggen|auth|authentifizierung|register|registrier/i.test(lower);
  const hasContent = /about|über\s*uns|ueber\s*uns|introduction|einleitung|content\s*section|vorstellung/i.test(lower);
  const isFullPage = /full.page|complete|ganze.seite|komplette.seite|landing.?page|website|webseite/i.test(lower);

  // Special standalone pages
  if (has404) {
    sections.push("404");
    return buildConfig(sections, lower, prompt, brandName);
  }
  if (hasComingSoon) {
    sections.push("coming-soon");
    return buildConfig(sections, lower, prompt, brandName);
  }
  if (hasLogin) {
    sections.push("login");
    return buildConfig(sections, lower, prompt, brandName);
  }

  if (isFullPage) {
    sections.push("navbar", "hero");
    if (hasLogos) sections.push("logos");
    if (hasContent) sections.push("content");
    sections.push("features");
    if (hasServices) sections.push("services");
    if (hasSteps) sections.push("steps");
    if (hasGallery || hasPortfolio) sections.push(hasPortfolio ? "portfolio" : "gallery");
    if (hasStats) sections.push("stats");
    sections.push("testimonials");
    if (hasTeam) sections.push("team");
    if (hasTimeline) sections.push("timeline");
    if (hasFaq) sections.push("faq");
    if (hasBlog) sections.push("blog");
    sections.push("pricing", "cta");
    if (hasContact) sections.push("contact");
    sections.push("footer");
  } else {
    if (hasNavbar) sections.push("navbar");
    if (hasHero) sections.push("hero");
    if (hasLogos) sections.push("logos");
    if (hasContent) sections.push("content");
    if (hasFeatures) sections.push("features");
    if (hasServices) sections.push("services");
    if (hasSteps) sections.push("steps");
    if (hasPortfolio) sections.push("portfolio");
    if (hasGallery && !hasPortfolio) sections.push("gallery");
    if (hasStats) sections.push("stats");
    if (hasTestimonials) sections.push("testimonials");
    if (hasTeam) sections.push("team");
    if (hasTimeline) sections.push("timeline");
    if (hasFaq) sections.push("faq");
    if (hasBlog) sections.push("blog");
    if (hasPricing) sections.push("pricing");
    if (hasCTA) sections.push("cta");
    if (hasContact) sections.push("contact");
    if (hasFooter) sections.push("footer");
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

  // Detect testimonial count from prompt
  let testimonialCount = 3;
  const countMatch = lower.match(/(\d+)\s*(?:testimonials?|bewertungen?|kundenstimmen?|reviews?)/i);
  if (countMatch) testimonialCount = Math.min(12, Math.max(1, parseInt(countMatch[1])));

  const defaultTestimonials = [
    { quote: "This product completely transformed how we work. The results are incredible.", author: "Sarah Johnson", role: "CEO, TechStart", rating: 5 },
    { quote: "Best investment we've made this year. The ROI has been phenomenal.", author: "Michael Chen", role: "Marketing Director", rating: 5 },
    { quote: "Outstanding quality and support. Highly recommended for any business.", author: "Emily Rodriguez", role: "Founder, Creative Labs", rating: 5 },
    { quote: "The level of detail and craftsmanship is absolutely outstanding.", author: "David Park", role: "CTO, InnovateTech", rating: 5 },
    { quote: "Exceeded all our expectations. A game-changer for our workflow.", author: "Lisa Mueller", role: "Product Manager, DataFlow", rating: 5 },
    { quote: "Incredible value and performance. Our team productivity has doubled.", author: "James Wilson", role: "VP Engineering, CloudBase", rating: 5 },
    { quote: "Simply the best solution we've ever used. Five stars without hesitation.", author: "Anna Schmidt", role: "Director, DesignHub", rating: 5 },
    { quote: "Transformed our entire approach to digital. Couldn't be happier.", author: "Robert Kim", role: "CEO, NextLevel Agency", rating: 5 },
    { quote: "Fast, reliable, and beautiful. Everything we needed and more.", author: "Maria Garcia", role: "Lead Designer, Artistry Co", rating: 5 },
    { quote: "The support team alone makes this worth every penny. Truly exceptional.", author: "Thomas Anderson", role: "Founder, MatrixApps", rating: 5 },
    { quote: "We saw immediate results after implementing this solution.", author: "Sophie Laurent", role: "CMO, BrightPath", rating: 5 },
    { quote: "Professional, polished, and powerful. The trifecta of great software.", author: "Carlos Rivera", role: "Tech Lead, Zenith Labs", rating: 5 },
  ];
  const testimonials = defaultTestimonials.slice(0, testimonialCount);

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

  // Detect design tokens from prompt
  const designTokens = detectDesignTokens(prompt);

  // Defaults for new section types
  const teamMembers = [
    { name: "Sarah Johnson", role: "CEO & Founder", bio: "Visionary leader with 15+ years in tech." },
    { name: "Michael Chen", role: "CTO", bio: "Full-stack architect passionate about scalable systems." },
    { name: "Emily Rodriguez", role: "Design Director", bio: "Award-winning designer crafting pixel-perfect experiences." },
    { name: "David Park", role: "Head of Marketing", bio: "Data-driven strategist growing brands globally." },
  ];

  const stats = [
    { value: "10,000+", label: "Active Users", description: "Growing every day" },
    { value: "99.9%", label: "Uptime", description: "Enterprise reliability" },
    { value: "150+", label: "Countries", description: "Global presence" },
    { value: "4.9/5", label: "Rating", description: "Customer satisfaction" },
  ];

  const faqItems = [
    { question: "How do I get started?", answer: "Simply sign up for a free account and follow our quick-start guide. You'll be up and running in under 5 minutes." },
    { question: "Is there a free plan?", answer: "Yes! We offer a generous free plan that includes all core features. Upgrade anytime for advanced functionality." },
    { question: "Can I cancel my subscription?", answer: "Absolutely. You can cancel your subscription at any time with no questions asked." },
    { question: "Do you offer customer support?", answer: "We provide 24/7 email support for all plans. Priority support is available on Professional and Enterprise plans." },
    { question: "Is my data secure?", answer: "Security is our top priority. We use bank-level encryption and are SOC 2 certified." },
  ];

  const logoNames = [
    { name: "TechCorp" }, { name: "InnovateLab" }, { name: "CloudBase" },
    { name: "DataFlow" }, { name: "ScaleUp" }, { name: "NextGen" },
  ];

  const blogPosts = [
    { title: "10 Tips for Better Web Design", excerpt: "Learn the fundamental principles that separate good web design from great.", category: "Design", date: "Feb 5, 2026", readTime: "5 min" },
    { title: "The Future of No-Code Tools", excerpt: "How no-code platforms are democratizing web development.", category: "Technology", date: "Feb 2, 2026", readTime: "8 min" },
    { title: "SEO Best Practices for 2026", excerpt: "Stay ahead with these essential SEO strategies for the new year.", category: "Marketing", date: "Jan 28, 2026", readTime: "6 min" },
  ];

  const steps = [
    { title: "Create Account", description: "Sign up for free in seconds. No credit card required." },
    { title: "Choose Template", description: "Pick from hundreds of professionally designed templates." },
    { title: "Customize", description: "Make it yours with our intuitive drag-and-drop editor." },
    { title: "Launch", description: "Publish your website and share it with the world." },
  ];

  const portfolioProjects = [
    { title: "Brand Redesign", category: "Branding", description: "Complete brand overhaul for a Fortune 500 company", tags: ["Identity", "Strategy"] },
    { title: "E-Commerce Platform", category: "Development", description: "Custom online store with 50,000+ products", tags: ["React", "Node.js"] },
    { title: "Mobile Banking App", category: "UI/UX", description: "Award-winning fintech app with 1M+ downloads", tags: ["iOS", "Android"] },
    { title: "Corporate Website", category: "Web Design", description: "Modern responsive site for a tech enterprise", tags: ["WordPress", "Design"] },
    { title: "Marketing Dashboard", category: "SaaS", description: "Real-time analytics platform for agencies", tags: ["SaaS", "Data"] },
    { title: "Restaurant Chain", category: "Branding", description: "Multi-location restaurant identity system", tags: ["Print", "Digital"] },
  ];

  const services = [
    { title: "Web Design & Development", description: "Custom websites that look great and perform even better.", features: ["Responsive Design", "CMS Integration", "Performance"] },
    { title: "Brand Identity", description: "Memorable brands that stand out in a crowded market.", features: ["Logo Design", "Brand Guidelines", "Visual Identity"] },
    { title: "Digital Marketing", description: "Data-driven strategies that deliver measurable results.", features: ["SEO/SEM", "Content Strategy", "Social Media"] },
    { title: "E-Commerce Solutions", description: "Online stores built to convert visitors into customers.", features: ["WooCommerce", "Custom Cart", "Payments"] },
  ];

  const timelineEvents = [
    { year: "2018", title: "Founded", description: "Started with a small team and a big vision." },
    { year: "2020", title: "Product Launch", description: "Released our flagship product to market." },
    { year: "2022", title: "10,000 Customers", description: "Reached a major milestone in user adoption." },
    { year: "2024", title: "Global Expansion", description: "Opened offices in Europe and Asia." },
    { year: "2026", title: "Industry Leader", description: "Recognized as a market leader by analysts." },
  ];

  return buildConfig(sections, lower, prompt, brandName);

  function buildConfig(sections: string[], lower: string, prompt: string, brandName: string): GenerationConfig {
    return {
      sections, brandName, headline, subtext, heroStyle, buttonText,
      features, plans, testimonials, navLinks, ctaHeadline, ctaSubtext, ctaButtonText,
      galleryItems, gallerySectionTitle, gallerySectionSubtitle,
      teamMembers, stats, faqItems, logoNames, blogPosts, steps,
      portfolioProjects, services, timelineEvents,
      contentTitle: "About Our Company",
      contentText: "We are a team of passionate professionals dedicated to creating exceptional experiences. With years of experience, we've helped hundreds of businesses transform their online presence.",
      contentImagePosition: "right" as const,
      errorHeadline: "404",
      errorSubtext: "The page you're looking for doesn't exist or has been moved.",
      comingSoonHeadline: "Coming Soon",
      comingSoonSubtext: "We're working on something amazing. Be the first to know when we launch.",
      loginHeading: "Welcome Back",
      loginSubtext: "Sign in to your account to continue",
      designTokens,
    };
  }
}

// ============================================================
// AI MODE: AI generates content + design tokens
// ============================================================
async function generateContentWithAI(
  prompt: string,
  apiKey: string,
  isAnthropic: boolean
): Promise<GenerationConfig> {
  const systemPrompt = `Du bist ein Content- und Design-Generator für Website-Templates. Der User beschreibt eine Website (inkl. Farben, Stil, Design-Vorgaben), du lieferst passende Inhalte UND Design-Tokens als JSON zurück.

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
  "ctaButtonText": "CTA Button",
  "teamMembers": [
    {"name": "Name", "role": "Position", "bio": "Kurze Beschreibung"}
  ],
  "stats": [
    {"value": "10.000+", "label": "Kunden", "description": "Weltweit"}
  ],
  "faqItems": [
    {"question": "Frage?", "answer": "Antwort"}
  ],
  "logoNames": [
    {"name": "Firmenname"}
  ],
  "blogPosts": [
    {"title": "Titel", "excerpt": "Kurzbeschreibung", "category": "Kategorie", "date": "Feb 2026", "readTime": "5 min"}
  ],
  "steps": [
    {"title": "Schritt", "description": "Beschreibung"}
  ],
  "portfolioProjects": [
    {"title": "Projekt", "category": "Kategorie", "description": "Beschreibung", "tags": ["Tag1", "Tag2"]}
  ],
  "services": [
    {"title": "Dienstleistung", "description": "Beschreibung", "features": ["Feature 1", "Feature 2"]}
  ],
  "timelineEvents": [
    {"year": "2024", "title": "Titel", "description": "Beschreibung"}
  ],
  "contentTitle": "Über Uns",
  "contentText": "Text über die Firma...",
  "contentImagePosition": "right",
  "designTokens": {
    "primaryColor": "#3b82f6",
    "secondaryColor": "#8b5cf6",
    "backgroundColor": "#ffffff",
    "surfaceColor": "#f8fafc",
    "textColor": "#334155",
    "headingColor": "#0f172a",
    "mutedTextColor": "#64748b",
    "borderColor": "#e2e8f0",
    "borderRadius": "medium",
    "shadow": "none",
    "darkMode": false
  }
}

DESIGN TOKEN REGELN:
- "primaryColor": Hauptfarbe für Buttons, Links, Akzente (Hex)
- "secondaryColor": Zweite Akzentfarbe (Hex)
- "backgroundColor": Seitenhintergrund (Hex)
- "surfaceColor": Hintergrund für Karten/Panels (Hex) - etwas anders als backgroundColor
- "textColor": Fließtext-Farbe (Hex)
- "headingColor": Überschriften-Farbe (Hex)
- "mutedTextColor": Dezente/sekundäre Textfarbe (Hex)
- "borderColor": Rahmenfarbe (Hex)
- "borderRadius": "none" | "small" | "medium" | "large" | "full" - Rundung der Ecken
- "shadow": "none" | "small" | "medium" | "large" - Schatten-Stärke
- "darkMode": true/false - Wenn true werden Hintergrundfarben dunkel und Textfarben hell
- WICHTIG: Wenn der User Farben nennt (z.B. "schwarz", "rot", "blau", "#FF0000"), setze diese als passende designTokens!
- Wenn der User "schwarzer Hintergrund" oder "dark" sagt → darkMode: true, backgroundColor: "#000000" oder "#0f172a"
- Wenn der User "weiße Texte" sagt → textColor: "#ffffff", headingColor: "#ffffff"
- Wenn der User "runde Ecken" oder "rounded" sagt → borderRadius: "large" oder "full"
- Wenn der User "Schatten" oder "shadow" sagt → shadow: "medium" oder "large"
- Alle Farben als Hex-Werte (#RRGGBB)

SECTION REGELN:
- "sections" muss ein Array sein mit Werten aus: "navbar", "hero", "logos", "features", "steps", "gallery", "stats", "testimonials", "team", "faq", "blog", "pricing", "cta", "contact", "footer", "portfolio", "services", "timeline", "content", "404", "coming-soon", "login"
- Wähle NUR die Sections, die zum Prompt des Users passen!
- "gallery/Galerie/Bilder/Fotos" → "gallery" in sections
- "portfolio/Projekte/case study/Referenzen" → "portfolio" in sections
- "services/Dienstleistungen/Angebote" → "services" in sections
- "timeline/Zeitstrahl/Geschichte/Meilensteine/journey" → "timeline" in sections
- "about/über uns/Vorstellung/content" → "content" in sections
- "404/error page/Fehlerseite" → "404" in sections (standalone)
- "coming soon/launch/bald/demnächst" → "coming-soon" in sections (standalone)
- "login/anmelden/sign in/register" → "login" in sections (standalone)
- "team/Mitarbeiter/über uns/about" → "team" in sections
- "FAQ/Fragen" → "faq" in sections
- "stats/Zahlen/counter" → "stats" in sections
- "blog/Artikel/news" → "blog" in sections
- "steps/Schritte/Prozess/how it works" → "steps" in sections
- "logos/Partner/Kunden/trusted" → "logos" in sections
- "heroStyle" muss eines von "centered", "split", "gradient" sein

CONTENT REGELN:
- Passe ALLE Texte an die beschriebene Branche/Nische an
- Features: 6, galleryItems: 6, Plans: 3, teamMembers: 4, stats: 4, faqItems: 5, logoNames: 6, blogPosts: 3, steps: 3-4
- portfolioProjects: 6 (mit title, category, description, tags)
- services: 3-4 (mit title, description, features Array)
- timelineEvents: 4-6 (mit year, title, description)
- contentTitle + contentText: Passend zur Firma
- contentImagePosition: "left" | "right" | "none"
- Testimonials: Anzahl passend zum Prompt (Standard: 3, max 12)
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

  // Parse design tokens from AI response
  const aiDesignTokens: Partial<DesignTokens> = {};
  if (parsed.designTokens && typeof parsed.designTokens === "object") {
    const dt = parsed.designTokens;
    if (typeof dt.primaryColor === "string" && dt.primaryColor.startsWith("#")) aiDesignTokens.primaryColor = dt.primaryColor;
    if (typeof dt.secondaryColor === "string" && dt.secondaryColor.startsWith("#")) aiDesignTokens.secondaryColor = dt.secondaryColor;
    if (typeof dt.backgroundColor === "string" && dt.backgroundColor.startsWith("#")) aiDesignTokens.backgroundColor = dt.backgroundColor;
    if (typeof dt.surfaceColor === "string" && dt.surfaceColor.startsWith("#")) aiDesignTokens.surfaceColor = dt.surfaceColor;
    if (typeof dt.textColor === "string" && dt.textColor.startsWith("#")) aiDesignTokens.textColor = dt.textColor;
    if (typeof dt.headingColor === "string" && dt.headingColor.startsWith("#")) aiDesignTokens.headingColor = dt.headingColor;
    if (typeof dt.mutedTextColor === "string" && dt.mutedTextColor.startsWith("#")) aiDesignTokens.mutedTextColor = dt.mutedTextColor;
    if (typeof dt.borderColor === "string" && dt.borderColor.startsWith("#")) aiDesignTokens.borderColor = dt.borderColor;
    if (["none", "small", "medium", "large", "full"].includes(dt.borderRadius)) aiDesignTokens.borderRadius = dt.borderRadius;
    if (["none", "small", "medium", "large"].includes(dt.shadow)) aiDesignTokens.shadow = dt.shadow;
    if (typeof dt.darkMode === "boolean") aiDesignTokens.darkMode = dt.darkMode;
  }

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
      ? parsed.testimonials.slice(0, 12)
      : [{ quote: "Great product!", author: "User", role: "Customer", rating: 5 }],
    navLinks: Array.isArray(parsed.navLinks) && parsed.navLinks.length > 0
      ? parsed.navLinks
      : [{ text: "Home", url: "/" }],
    ctaHeadline: parsed.ctaHeadline || "Ready to Get Started?",
    ctaSubtext: parsed.ctaSubtext || "Join thousands of happy customers.",
    ctaButtonText: parsed.ctaButtonText || "Start Now",
    galleryItems: Array.isArray(parsed.galleryItems) && parsed.galleryItems.length > 0
      ? parsed.galleryItems.slice(0, 12)
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
    teamMembers: Array.isArray(parsed.teamMembers) && parsed.teamMembers.length > 0
      ? parsed.teamMembers.slice(0, 8)
      : [{ name: "Team Member", role: "Role", bio: "Description" }],
    stats: Array.isArray(parsed.stats) && parsed.stats.length > 0
      ? parsed.stats.slice(0, 8)
      : [{ value: "1000+", label: "Users", description: "Growing" }],
    faqItems: Array.isArray(parsed.faqItems) && parsed.faqItems.length > 0
      ? parsed.faqItems.slice(0, 12)
      : [{ question: "How do I get started?", answer: "Sign up and follow our guide." }],
    logoNames: Array.isArray(parsed.logoNames) && parsed.logoNames.length > 0
      ? parsed.logoNames.slice(0, 10)
      : [{ name: "TechCorp" }, { name: "InnovateLab" }, { name: "CloudBase" }],
    blogPosts: Array.isArray(parsed.blogPosts) && parsed.blogPosts.length > 0
      ? parsed.blogPosts.slice(0, 6)
      : [{ title: "Latest Post", excerpt: "Read more...", category: "News", date: "Feb 2026", readTime: "5 min" }],
    steps: Array.isArray(parsed.steps) && parsed.steps.length > 0
      ? parsed.steps.slice(0, 6)
      : [{ title: "Step 1", description: "Get started" }],
    portfolioProjects: Array.isArray(parsed.portfolioProjects) && parsed.portfolioProjects.length > 0
      ? parsed.portfolioProjects.slice(0, 8)
      : [
          { title: "Brand Redesign", category: "Branding", description: "Complete brand overhaul", tags: ["Identity"] },
          { title: "E-Commerce Platform", category: "Development", description: "Custom online store", tags: ["React"] },
          { title: "Mobile App", category: "UI/UX", description: "Award-winning app", tags: ["iOS"] },
          { title: "Corporate Website", category: "Web Design", description: "Modern responsive site", tags: ["Design"] },
          { title: "Dashboard", category: "SaaS", description: "Analytics platform", tags: ["Data"] },
          { title: "Restaurant Chain", category: "Branding", description: "Identity system", tags: ["Digital"] },
        ],
    services: Array.isArray(parsed.services) && parsed.services.length > 0
      ? parsed.services.slice(0, 6)
      : [
          { title: "Web Design", description: "Custom websites that perform.", features: ["Responsive", "CMS"] },
          { title: "Branding", description: "Memorable brand identities.", features: ["Logo", "Guidelines"] },
          { title: "Marketing", description: "Data-driven strategies.", features: ["SEO", "Content"] },
        ],
    timelineEvents: Array.isArray(parsed.timelineEvents) && parsed.timelineEvents.length > 0
      ? parsed.timelineEvents.slice(0, 8)
      : [
          { year: "2020", title: "Founded", description: "Started with a big vision." },
          { year: "2022", title: "Growth", description: "Reached 10,000 customers." },
          { year: "2024", title: "Expansion", description: "Went global." },
          { year: "2026", title: "Leader", description: "Industry recognized." },
        ],
    contentTitle: parsed.contentTitle || "About Our Company",
    contentText: parsed.contentText || "We are a team of passionate professionals dedicated to creating exceptional experiences.",
    contentImagePosition: ["left", "right", "none"].includes(parsed.contentImagePosition) ? parsed.contentImagePosition : "right",
    errorHeadline: "404",
    errorSubtext: "The page you're looking for doesn't exist.",
    comingSoonHeadline: parsed.headline || "Coming Soon",
    comingSoonSubtext: parsed.subtext || "We're working on something amazing.",
    loginHeading: "Welcome Back",
    loginSubtext: "Sign in to your account to continue",
    designTokens: aiDesignTokens,
  };
}

// ============================================================
// Build Bricks elements from config (ALWAYS used for structure)
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
