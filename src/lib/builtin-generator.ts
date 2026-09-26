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
  resolveDesignTokens,
  BricksElement,
  DesignTokens,
} from "./bricks-engine";

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

export function generateBuiltin(prompt: string, sections?: string[], tokens?: Record<string, unknown>, colors?: Record<string, string>) {
  return generateFromConfig(analyzePromptWithBasicDetection(prompt, sections, tokens, colors));
}
