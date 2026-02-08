// Pre-built template library
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
  BricksElement,
} from "./bricks-engine";

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  preview: string; // CSS gradient or color for preview card
  generator: () => BricksElement[];
}

export const CATEGORIES = [
  { id: "all", name: "All Templates", icon: "grid" },
  { id: "hero", name: "Hero Sections", icon: "layout" },
  { id: "navbar", name: "Navigation", icon: "menu" },
  { id: "features", name: "Features", icon: "star" },
  { id: "pricing", name: "Pricing", icon: "tag" },
  { id: "testimonials", name: "Testimonials", icon: "quote" },
  { id: "cta", name: "Call to Action", icon: "megaphone" },
  { id: "contact", name: "Contact", icon: "mail" },
  { id: "footer", name: "Footer", icon: "footer" },
  { id: "fullpage", name: "Full Pages", icon: "file" },
];

export const TEMPLATES: TemplateDefinition[] = [
  // Hero Sections
  {
    id: "hero-centered",
    name: "Hero - Centered",
    description: "Clean centered hero with headline, subtext, and dual CTA buttons. Perfect for SaaS landing pages.",
    category: "hero",
    tags: ["hero", "centered", "saas", "landing"],
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    generator: () => generateHeroSection(
      "Build Something Amazing",
      "Create stunning websites with our powerful tools and intuitive design system. No coding required.",
      "Get Started Free",
      "#",
      "centered"
    ),
  },
  {
    id: "hero-split",
    name: "Hero - Split Layout",
    description: "Two-column hero with text on the left and an image on the right. Great for product showcases.",
    category: "hero",
    tags: ["hero", "split", "image", "product"],
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    generator: () => generateHeroSection(
      "Design Without Limits",
      "Unleash your creativity with our drag-and-drop builder. Build responsive websites in minutes, not hours.",
      "Try It Free",
      "#",
      "split"
    ),
  },
  {
    id: "hero-gradient",
    name: "Hero - Dark Gradient",
    description: "Bold dark hero with gradient background. Ideal for tech and creative agencies.",
    category: "hero",
    tags: ["hero", "dark", "gradient", "tech"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => generateHeroSection(
      "The Future of Web Design",
      "Next-generation tools for next-generation websites. AI-powered, lightning fast, infinitely customizable.",
      "Start Building",
      "#",
      "gradient"
    ),
  },
  {
    id: "hero-agency",
    name: "Hero - Agency",
    description: "Professional hero for digital agencies with strong headline and modern typography.",
    category: "hero",
    tags: ["hero", "agency", "professional"],
    preview: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    generator: () => generateHeroSection(
      "We Build Digital Experiences",
      "Award-winning agency specializing in web design, branding, and digital marketing. Let's create something extraordinary together.",
      "View Our Work",
      "#portfolio",
      "centered"
    ),
  },
  {
    id: "hero-startup",
    name: "Hero - Startup",
    description: "Energetic hero for startups with bold messaging and clear CTA.",
    category: "hero",
    tags: ["hero", "startup", "bold"],
    preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    generator: () => generateHeroSection(
      "Launch Your Next Big Idea",
      "From concept to launch in record time. Our platform gives startups the tools they need to build, ship, and scale.",
      "Start Free Trial",
      "#",
      "split"
    ),
  },

  // Navigation
  {
    id: "navbar-simple",
    name: "Navbar - Simple",
    description: "Clean minimal navigation bar with logo, links, and CTA button.",
    category: "navbar",
    tags: ["navbar", "simple", "minimal"],
    preview: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    generator: () => generateNavbar("BrandName", [
      { text: "Home", url: "/" },
      { text: "Features", url: "#features" },
      { text: "Pricing", url: "#pricing" },
      { text: "Contact", url: "#contact" },
    ], "Sign Up"),
  },
  {
    id: "navbar-extended",
    name: "Navbar - Extended",
    description: "Navigation bar with more links for content-heavy websites.",
    category: "navbar",
    tags: ["navbar", "extended", "links"],
    preview: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    generator: () => generateNavbar("WebStudio", [
      { text: "Home", url: "/" },
      { text: "Services", url: "#services" },
      { text: "Portfolio", url: "#portfolio" },
      { text: "Blog", url: "/blog" },
      { text: "About", url: "#about" },
      { text: "Contact", url: "#contact" },
    ], "Get Quote"),
  },

  // Features
  {
    id: "features-grid",
    name: "Features - 3x2 Grid",
    description: "Six feature cards in a 3x2 grid layout with icons and descriptions.",
    category: "features",
    tags: ["features", "grid", "cards"],
    preview: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    generator: () => generateFeaturesSection(),
  },
  {
    id: "features-saas",
    name: "Features - SaaS",
    description: "Feature grid tailored for SaaS products with technical features.",
    category: "features",
    tags: ["features", "saas", "technical"],
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    generator: () => generateFeaturesSection(
      "Powerful Features",
      "Everything you need to build, deploy, and scale your application",
      [
        { title: "Cloud Infrastructure", description: "Deploy to any cloud provider with one click. Auto-scaling built in." },
        { title: "Real-time Analytics", description: "Monitor performance metrics and user behavior in real time." },
        { title: "Team Collaboration", description: "Work together seamlessly with built-in version control and commenting." },
        { title: "API First", description: "RESTful and GraphQL APIs with comprehensive documentation." },
        { title: "Security & Compliance", description: "SOC 2 certified with end-to-end encryption and GDPR compliance." },
        { title: "24/7 Monitoring", description: "Automated monitoring with instant alerts and incident response." },
      ]
    ),
  },

  // Pricing
  {
    id: "pricing-3col",
    name: "Pricing - Three Tiers",
    description: "Classic three-column pricing with highlighted popular plan.",
    category: "pricing",
    tags: ["pricing", "tiers", "cards"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => generatePricingSection(),
  },
  {
    id: "pricing-freelancer",
    name: "Pricing - Freelancer",
    description: "Pricing designed for freelancers and small agencies.",
    category: "pricing",
    tags: ["pricing", "freelancer", "agency"],
    preview: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    generator: () => generatePricingSection([
      {
        name: "Basic",
        price: "$19",
        period: "/month",
        features: ["3 Active Projects", "Basic Templates", "Community Support", "1 Team Member"],
        buttonText: "Get Started",
      },
      {
        name: "Professional",
        price: "$49",
        period: "/month",
        features: ["Unlimited Projects", "Premium Templates", "Priority Support", "5 Team Members", "Custom Branding", "Analytics Dashboard"],
        highlighted: true,
        buttonText: "Go Pro",
      },
      {
        name: "Agency",
        price: "$149",
        period: "/month",
        features: ["Everything in Pro", "White Label", "Unlimited Team", "API Access", "Dedicated Account Manager", "Custom Development"],
        buttonText: "Contact Us",
      },
    ]),
  },

  // Testimonials
  {
    id: "testimonials-cards",
    name: "Testimonials - Card Grid",
    description: "Three testimonial cards with ratings, quotes, and author info.",
    category: "testimonials",
    tags: ["testimonials", "cards", "reviews"],
    preview: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
    generator: () => generateTestimonialsSection(),
  },
  {
    id: "testimonials-tech",
    name: "Testimonials - Tech",
    description: "Testimonials from tech professionals and developers.",
    category: "testimonials",
    tags: ["testimonials", "tech", "developers"],
    preview: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    generator: () => generateTestimonialsSection([
      {
        quote: "The API documentation is excellent and integration was a breeze. We reduced our development time by 60%.",
        author: "Alex Rivera",
        role: "CTO, DevFlow",
        rating: 5,
      },
      {
        quote: "Finally a tool that developers actually enjoy using. The DX is top notch and the community is incredibly helpful.",
        author: "Priya Sharma",
        role: "Senior Engineer, CloudBase",
        rating: 5,
      },
      {
        quote: "We migrated our entire infrastructure in one weekend. The performance improvements were immediate and dramatic.",
        author: "Marcus Kim",
        role: "VP Engineering, ScaleUp",
        rating: 5,
      },
    ]),
  },

  // CTA
  {
    id: "cta-gradient-card",
    name: "CTA - Gradient Card",
    description: "Eye-catching CTA with dark card on light background.",
    category: "cta",
    tags: ["cta", "card", "gradient"],
    preview: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    generator: () => generateCTASection(),
  },
  {
    id: "cta-simple",
    name: "CTA - Simple Blue",
    description: "Clean simple CTA with blue background.",
    category: "cta",
    tags: ["cta", "simple", "blue"],
    preview: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    generator: () => generateCTASection(
      "Start Your Free Trial Today",
      "No credit card required. Get started in under 2 minutes.",
      "Start Free Trial",
      "simple"
    ),
  },

  // Contact
  {
    id: "contact-split",
    name: "Contact - Split Form",
    description: "Contact section with info on the left and form on the right.",
    category: "contact",
    tags: ["contact", "form", "split"],
    preview: "linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)",
    generator: () => generateContactSection(),
  },

  // Footer
  {
    id: "footer-4col",
    name: "Footer - 4 Columns",
    description: "Professional dark footer with brand info, 4 link columns, and copyright.",
    category: "footer",
    tags: ["footer", "columns", "dark"],
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    generator: () => generateFooterSection(),
  },

  // Full Pages
  {
    id: "fullpage-saas",
    name: "Full Page - SaaS Landing",
    description: "Complete SaaS landing page with navbar, hero, features, testimonials, pricing, CTA, and footer.",
    category: "fullpage",
    tags: ["fullpage", "saas", "landing", "complete"],
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    generator: () => generateFullPage({
      brandName: "SaaSFlow",
      headline: "Streamline Your Workflow",
      subtext: "The all-in-one platform for managing projects, teams, and clients. Built for modern businesses.",
    }),
  },
  {
    id: "fullpage-agency",
    name: "Full Page - Agency",
    description: "Complete agency website with all sections pre-configured.",
    category: "fullpage",
    tags: ["fullpage", "agency", "portfolio"],
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    generator: () => generateFullPage({
      brandName: "Creative Studio",
      headline: "We Craft Digital Experiences",
      subtext: "Award-winning design agency specializing in brand identity, web design, and digital strategy.",
      includeContact: true,
    }),
  },
  {
    id: "fullpage-startup",
    name: "Full Page - Startup",
    description: "Modern startup landing page with all essential sections.",
    category: "fullpage",
    tags: ["fullpage", "startup", "modern"],
    preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    generator: () => generateFullPage({
      brandName: "LaunchPad",
      headline: "Launch Faster, Scale Smarter",
      subtext: "The startup toolkit that takes you from idea to IPO. Everything you need in one platform.",
    }),
  },
];

export function getTemplatesByCategory(category: string): TemplateDefinition[] {
  if (category === "all") return TEMPLATES;
  return TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(query: string): TemplateDefinition[] {
  const lower = query.toLowerCase();
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some((tag) => tag.includes(lower))
  );
}
