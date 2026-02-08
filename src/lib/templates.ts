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
  { id: "services", name: "Services", icon: "briefcase" },
  { id: "steps", name: "Steps / Process", icon: "list" },
  { id: "stats", name: "Stats / Counters", icon: "bar-chart" },
  { id: "pricing", name: "Pricing", icon: "tag" },
  { id: "testimonials", name: "Testimonials", icon: "quote" },
  { id: "team", name: "Team", icon: "users" },
  { id: "portfolio", name: "Portfolio", icon: "briefcase" },
  { id: "timeline", name: "Timeline", icon: "clock" },
  { id: "content", name: "Content / About", icon: "file-text" },
  { id: "faq", name: "FAQ", icon: "help-circle" },
  { id: "blog", name: "Blog", icon: "book" },
  { id: "logos", name: "Logo Cloud", icon: "award" },
  { id: "cta", name: "Call to Action", icon: "megaphone" },
  { id: "gallery", name: "Gallery", icon: "image" },
  { id: "contact", name: "Contact", icon: "mail" },
  { id: "footer", name: "Footer", icon: "footer" },
  { id: "login", name: "Login / Auth", icon: "lock" },
  { id: "error", name: "Error Pages", icon: "alert-triangle" },
  { id: "coming-soon", name: "Coming Soon", icon: "clock" },
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
      "Start Free Trial"
    ),
  },

  // Gallery
  {
    id: "gallery-portfolio",
    name: "Gallery - Portfolio",
    description: "Clean portfolio gallery with 3-column grid, image placeholders, and category tags.",
    category: "gallery",
    tags: ["gallery", "portfolio", "grid", "images"],
    preview: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    generator: () => generateGallerySection("Our Portfolio", "Showcasing our best work and creative projects"),
  },
  {
    id: "gallery-photography",
    name: "Gallery - Photography",
    description: "Photography gallery with image grid for showcasing visual work.",
    category: "gallery",
    tags: ["gallery", "photography", "images", "visual"],
    preview: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
    generator: () => generateGallerySection(
      "Photo Gallery",
      "Capturing moments that tell a story",
      [
        { title: "Golden Hour", category: "Landscape" },
        { title: "Urban Dreams", category: "Street" },
        { title: "Natural Beauty", category: "Portrait" },
        { title: "City Lights", category: "Night" },
        { title: "Wild & Free", category: "Wildlife" },
        { title: "Abstract Vision", category: "Abstract" },
      ]
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

  // Team
  {
    id: "team-grid",
    name: "Team - Card Grid",
    description: "Team member cards with avatar, name, role, and bio in a responsive grid.",
    category: "team",
    tags: ["team", "about", "people", "cards"],
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    generator: () => generateTeamSection(),
  },
  {
    id: "team-agency",
    name: "Team - Agency",
    description: "Creative agency team section with colorful avatar placeholders.",
    category: "team",
    tags: ["team", "agency", "creative"],
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    generator: () => generateTeamSection(
      "The Creative Minds",
      "Our passionate team of designers, developers, and strategists",
      [
        { name: "Alex Morgan", role: "Creative Director", bio: "15 years shaping brand identities for Fortune 500 companies." },
        { name: "Jordan Lee", role: "Lead Developer", bio: "Full-stack wizard who turns designs into flawless code." },
        { name: "Sophie Chen", role: "UX Researcher", bio: "Obsessed with understanding users and crafting intuitive experiences." },
        { name: "Marcus Berg", role: "Project Manager", bio: "Keeps everything on track with precision and a good sense of humor." },
        { name: "Lisa Park", role: "Motion Designer", bio: "Brings static designs to life with fluid animations." },
        { name: "Tom Rivera", role: "Content Strategist", bio: "Crafts narratives that connect brands with their audience." },
      ]
    ),
  },
  {
    id: "team-small",
    name: "Team - Small Team",
    description: "Compact team section for startups with 3 key members.",
    category: "team",
    tags: ["team", "startup", "small"],
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    generator: () => generateTeamSection(
      "Our Founders",
      "Meet the people who started it all",
      [
        { name: "Anna Fischer", role: "CEO & Co-Founder", bio: "Serial entrepreneur with a passion for innovation." },
        { name: "Ben Williams", role: "CTO & Co-Founder", bio: "Engineering leader who built systems at scale." },
        { name: "Clara Santos", role: "COO & Co-Founder", bio: "Operations expert who makes everything run smoothly." },
      ]
    ),
  },

  // Stats / Counters
  {
    id: "stats-impact",
    name: "Stats - Impact Numbers",
    description: "Bold impact numbers on a colored background with labels and descriptions.",
    category: "stats",
    tags: ["stats", "counter", "numbers", "impact"],
    preview: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    generator: () => generateStatsSection(),
  },
  {
    id: "stats-company",
    name: "Stats - Company Metrics",
    description: "Business metrics with revenue, growth, and customer numbers.",
    category: "stats",
    tags: ["stats", "business", "metrics", "company"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => generateStatsSection(
      "Company at a Glance",
      [
        { value: "$2.5M", label: "Annual Revenue", description: "Year-over-year growth" },
        { value: "350+", label: "Enterprise Clients", description: "Across 40 industries" },
        { value: "50+", label: "Team Members", description: "4 global offices" },
        { value: "98%", label: "Client Retention", description: "Industry-leading loyalty" },
      ]
    ),
  },
  {
    id: "stats-saas",
    name: "Stats - SaaS Metrics",
    description: "SaaS-specific metrics with user count, uptime, and API calls.",
    category: "stats",
    tags: ["stats", "saas", "tech", "api"],
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    generator: () => generateStatsSection(
      "",
      [
        { value: "2M+", label: "API Calls / Day" },
        { value: "99.99%", label: "Uptime SLA" },
        { value: "<50ms", label: "Avg Response Time" },
        { value: "180+", label: "Countries Served" },
      ]
    ),
  },

  // FAQ
  {
    id: "faq-general",
    name: "FAQ - General",
    description: "Clean FAQ section with question-answer pairs separated by dividers.",
    category: "faq",
    tags: ["faq", "questions", "support"],
    preview: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
    generator: () => generateFaqSection(),
  },
  {
    id: "faq-saas",
    name: "FAQ - SaaS Product",
    description: "Product-focused FAQ with technical and billing questions.",
    category: "faq",
    tags: ["faq", "saas", "product", "billing"],
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    generator: () => generateFaqSection(
      "Product FAQ",
      "Common questions about our platform",
      [
        { question: "What integrations do you support?", answer: "We integrate with Slack, Jira, GitHub, GitLab, Notion, Figma, and 100+ other tools via our API and Zapier." },
        { question: "Can I export my data?", answer: "Yes, you can export all your data at any time in CSV, JSON, or PDF format. No vendor lock-in." },
        { question: "How does billing work?", answer: "We bill monthly or annually. Annual plans save 20%. You can upgrade, downgrade, or cancel at any time." },
        { question: "Do you offer a free trial?", answer: "Yes! Every plan comes with a 14-day free trial. No credit card required to start." },
        { question: "Is there an API?", answer: "Absolutely. Our RESTful API comes with comprehensive documentation, SDKs for popular languages, and a generous rate limit." },
        { question: "What about GDPR compliance?", answer: "We're fully GDPR compliant. We offer DPAs, data residency options, and tools for managing data subject requests." },
      ]
    ),
  },

  // Logo Cloud
  {
    id: "logos-trusted",
    name: "Logos - Trusted By",
    description: "Minimal logo cloud showing partner/client brand names.",
    category: "logos",
    tags: ["logos", "brands", "trust", "partners"],
    preview: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    generator: () => generateLogoCloudSection(),
  },
  {
    id: "logos-tech",
    name: "Logos - Tech Partners",
    description: "Technology partner logos for SaaS and tech companies.",
    category: "logos",
    tags: ["logos", "tech", "integrations", "partners"],
    preview: "linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)",
    generator: () => generateLogoCloudSection(
      "Integrates with your favorite tools",
      [
        { name: "Slack" }, { name: "GitHub" }, { name: "Notion" },
        { name: "Figma" }, { name: "Zapier" }, { name: "Stripe" },
        { name: "AWS" }, { name: "Vercel" },
      ]
    ),
  },

  // Blog
  {
    id: "blog-grid",
    name: "Blog - Post Grid",
    description: "Blog section with post cards featuring image, category, title, and excerpt.",
    category: "blog",
    tags: ["blog", "articles", "news", "posts"],
    preview: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    generator: () => generateBlogSection(),
  },
  {
    id: "blog-marketing",
    name: "Blog - Marketing",
    description: "Marketing-focused blog section with strategy and growth articles.",
    category: "blog",
    tags: ["blog", "marketing", "growth", "strategy"],
    preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    generator: () => generateBlogSection(
      "Marketing Insights",
      "Tips, strategies, and trends to grow your business",
      [
        { title: "Content Marketing Playbook 2026", excerpt: "A complete guide to building a content strategy that drives organic growth.", category: "Strategy", date: "Feb 6, 2026", readTime: "12 min" },
        { title: "Email Campaigns That Convert", excerpt: "How to write email sequences that turn subscribers into paying customers.", category: "Email", date: "Feb 3, 2026", readTime: "7 min" },
        { title: "Social Media Trends to Watch", excerpt: "The emerging platforms and formats that will shape marketing this year.", category: "Social", date: "Jan 30, 2026", readTime: "5 min" },
      ]
    ),
  },

  // Steps / Process
  {
    id: "steps-howto",
    name: "Steps - How It Works",
    description: "Numbered steps showing a simple process flow with circle indicators.",
    category: "steps",
    tags: ["steps", "process", "how-it-works"],
    preview: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    generator: () => generateStepsSection(),
  },
  {
    id: "steps-onboarding",
    name: "Steps - Onboarding",
    description: "User onboarding flow with clear numbered steps.",
    category: "steps",
    tags: ["steps", "onboarding", "getting-started"],
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    generator: () => generateStepsSection(
      "Getting Started Is Easy",
      "Be up and running in under 5 minutes",
      [
        { title: "Sign Up", description: "Create your free account with just your email. No credit card needed." },
        { title: "Connect", description: "Link your existing tools and import your data with one click." },
        { title: "Configure", description: "Set up your workspace, invite your team, and customize your workflow." },
        { title: "Go Live", description: "Start using your new setup. Our support team is here if you need help." },
      ]
    ),
  },
  {
    id: "steps-service",
    name: "Steps - Service Process",
    description: "Service delivery process for agencies and consultants.",
    category: "steps",
    tags: ["steps", "agency", "service", "process"],
    preview: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    generator: () => generateStepsSection(
      "Our Process",
      "How we deliver exceptional results, every time",
      [
        { title: "Discovery", description: "We learn about your business, goals, and audience to create a tailored strategy." },
        { title: "Design", description: "Our team crafts wireframes and visual designs for your approval." },
        { title: "Develop", description: "We build your project using modern technologies and best practices." },
        { title: "Launch & Support", description: "We deploy your project and provide ongoing support and optimization." },
      ]
    ),
  },

  // Portfolio
  {
    id: "portfolio-agency",
    name: "Portfolio - Agency",
    description: "Agency portfolio grid with project cards, categories, descriptions, and tags.",
    category: "portfolio",
    tags: ["portfolio", "agency", "projects", "case-study"],
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    generator: () => generatePortfolioSection(),
  },
  {
    id: "portfolio-developer",
    name: "Portfolio - Developer",
    description: "Developer portfolio showcasing technical projects with tech stack tags.",
    category: "portfolio",
    tags: ["portfolio", "developer", "tech", "projects"],
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    generator: () => generatePortfolioSection(
      "My Work",
      "Recent projects and open source contributions",
      [
        { title: "CLI Framework", category: "Open Source", description: "A fast, extensible CLI framework for Node.js", tags: ["TypeScript", "Node.js"] },
        { title: "Real-time Chat", category: "Full Stack", description: "WebSocket-based messaging with E2E encryption", tags: ["React", "Socket.io"] },
        { title: "ML Pipeline", category: "Data Science", description: "Automated machine learning pipeline for image classification", tags: ["Python", "TensorFlow"] },
        { title: "Design System", category: "Frontend", description: "Component library with 50+ reusable components", tags: ["React", "Storybook"] },
        { title: "API Gateway", category: "Backend", description: "High-performance API gateway with rate limiting", tags: ["Go", "Redis"] },
        { title: "Mobile App", category: "Mobile", description: "Cross-platform fitness tracking application", tags: ["React Native", "Firebase"] },
      ]
    ),
  },
  {
    id: "portfolio-minimal",
    name: "Portfolio - Minimal",
    description: "Clean minimal portfolio with focus on project visuals and brief descriptions.",
    category: "portfolio",
    tags: ["portfolio", "minimal", "clean"],
    preview: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ shadow: "small", borderRadius: "large" });
      return generatePortfolioSection(
        "Selected Work",
        "A curated selection of our favorite projects",
        [
          { title: "Luxury Brand", category: "Branding", description: "Premium brand identity for a luxury fashion house" },
          { title: "SaaS Dashboard", category: "Web App", description: "Analytics dashboard for marketing teams" },
          { title: "Magazine Redesign", category: "Editorial", description: "Digital transformation of a print magazine" },
          { title: "Startup Launch", category: "Strategy", description: "Go-to-market strategy and brand launch" },
        ],
        tokens
      );
    },
  },

  // Services
  {
    id: "services-agency",
    name: "Services - Agency",
    description: "Service cards with accent bars, descriptions, and feature lists for agencies.",
    category: "services",
    tags: ["services", "agency", "offerings"],
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    generator: () => generateServicesSection(),
  },
  {
    id: "services-consulting",
    name: "Services - Consulting",
    description: "Consulting firm services with strategic offerings and deliverables.",
    category: "services",
    tags: ["services", "consulting", "business"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => generateServicesSection(
      "What We Do",
      "Strategic consulting to accelerate your growth",
      [
        { title: "Strategy & Planning", description: "Define your vision and create a roadmap to achieve your business goals.", features: ["Market Analysis", "Competitive Audit", "Growth Roadmap"] },
        { title: "Digital Transformation", description: "Modernize your tech stack and processes for the digital age.", features: ["Process Automation", "Cloud Migration", "Data Strategy"] },
        { title: "Product Development", description: "From concept to launch, we build products users love.", features: ["UX Research", "Prototyping", "Agile Development"] },
        { title: "Performance Optimization", description: "Maximize efficiency and ROI across all digital channels.", features: ["Analytics Setup", "A/B Testing", "Conversion Optimization"] },
      ]
    ),
  },
  {
    id: "services-tech",
    name: "Services - Tech Company",
    description: "Technology services with technical features and capabilities.",
    category: "services",
    tags: ["services", "tech", "saas", "development"],
    preview: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    generator: () => generateServicesSection(
      "Our Solutions",
      "Enterprise-grade solutions for modern businesses",
      [
        { title: "Cloud Infrastructure", description: "Scalable, secure cloud solutions built for enterprise workloads.", features: ["Auto-scaling", "99.99% SLA", "Multi-region"] },
        { title: "Custom Development", description: "Bespoke software solutions tailored to your unique needs.", features: ["Full-stack", "API Development", "Microservices"] },
        { title: "Data & Analytics", description: "Turn your data into actionable insights with our analytics platform.", features: ["Real-time Dashboards", "ML Models", "ETL Pipelines"] },
        { title: "Security & Compliance", description: "Keep your systems and data secure with our security solutions.", features: ["Penetration Testing", "SOC 2", "GDPR Compliance"] },
      ]
    ),
  },

  // Timeline
  {
    id: "timeline-company",
    name: "Timeline - Company History",
    description: "Vertical timeline showing company milestones with year badges and descriptions.",
    category: "timeline",
    tags: ["timeline", "history", "milestones", "about"],
    preview: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    generator: () => generateTimelineSection(),
  },
  {
    id: "timeline-startup",
    name: "Timeline - Startup Journey",
    description: "Startup growth timeline from founding to market leadership.",
    category: "timeline",
    tags: ["timeline", "startup", "growth", "journey"],
    preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    generator: () => generateTimelineSection(
      "Our Story",
      "From garage startup to global platform",
      [
        { year: "2019", title: "The Spark", description: "Two founders, one laptop, and a vision to democratize web development." },
        { year: "2020", title: "First Users", description: "Launched beta and acquired our first 100 passionate early adopters." },
        { year: "2021", title: "Seed Funding", description: "Raised $2M seed round from top-tier investors to accelerate growth." },
        { year: "2022", title: "Product-Market Fit", description: "Hit 5,000 paying customers and achieved profitability." },
        { year: "2024", title: "Series A", description: "Raised $15M Series A to expand internationally and grow the team to 50." },
        { year: "2026", title: "Market Leader", description: "Serving 50,000+ businesses across 120 countries worldwide." },
      ]
    ),
  },

  // Content / About
  {
    id: "content-about",
    name: "Content - About Us",
    description: "Split layout with about text and image placeholder, including badge and CTA.",
    category: "content",
    tags: ["content", "about", "introduction", "split"],
    preview: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    generator: () => generateContentSection(),
  },
  {
    id: "content-mission",
    name: "Content - Mission Statement",
    description: "Centered mission statement without image for maximum text impact.",
    category: "content",
    tags: ["content", "mission", "centered", "text"],
    preview: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    generator: () => generateContentSection(
      "Our Mission",
      "We believe that great design should be accessible to everyone. Our mission is to empower creators, entrepreneurs, and businesses of all sizes to build beautiful, high-performing websites without writing a single line of code. We're committed to pushing the boundaries of what's possible in web design while keeping things simple, intuitive, and delightful to use.",
      "none"
    ),
  },
  {
    id: "content-image-left",
    name: "Content - Image Left",
    description: "Content section with image on the left and text on the right.",
    category: "content",
    tags: ["content", "about", "image-left", "split"],
    preview: "linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)",
    generator: () => generateContentSection(
      "Why Choose Us",
      "With over a decade of experience in the industry, we've built a reputation for delivering exceptional results. Our team combines creativity with technical expertise to create solutions that not only look stunning but also drive real business outcomes. Every project we take on is treated with the same level of care and attention to detail.",
      "left"
    ),
  },

  // 404 Error Pages
  {
    id: "error-404",
    name: "404 - Default",
    description: "Clean 404 error page with large number, message, and navigation buttons.",
    category: "error",
    tags: ["404", "error", "not-found"],
    preview: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
    generator: () => generate404Section(),
  },
  {
    id: "error-404-dark",
    name: "404 - Dark Mode",
    description: "Dark-themed 404 error page for modern websites.",
    category: "error",
    tags: ["404", "error", "dark", "modern"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ darkMode: true, primaryColor: "#8b5cf6" });
      return generate404Section("404", "Oops! This page seems to have vanished into the digital void.", "Return Home", tokens);
    },
  },

  // Coming Soon
  {
    id: "coming-soon-default",
    name: "Coming Soon - Default",
    description: "Dark coming soon page with email signup, brand name, and social links.",
    category: "coming-soon",
    tags: ["coming-soon", "launch", "pre-launch"],
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    generator: () => generateComingSoonSection(),
  },
  {
    id: "coming-soon-startup",
    name: "Coming Soon - Startup",
    description: "Startup launch page with vibrant accent color and email capture.",
    category: "coming-soon",
    tags: ["coming-soon", "startup", "launch"],
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ primaryColor: "#8b5cf6" });
      return generateComingSoonSection(
        "Something Big Is Coming",
        "We're building the future of web development. Join the waitlist and be the first to experience it.",
        "LaunchPad",
        tokens
      );
    },
  },

  // Login / Auth
  {
    id: "login-default",
    name: "Login - Default",
    description: "Clean login form with email/password fields, social login, and sign up link.",
    category: "login",
    tags: ["login", "auth", "sign-in", "form"],
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    generator: () => generateLoginSection(),
  },
  {
    id: "login-dark",
    name: "Login - Dark Mode",
    description: "Dark-themed login page for modern SaaS applications.",
    category: "login",
    tags: ["login", "auth", "dark", "saas"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ darkMode: true, primaryColor: "#6366f1", borderRadius: "large" });
      return generateLoginSection("Welcome Back", "Sign in to access your dashboard", "DarkApp", tokens);
    },
  },
  {
    id: "login-branded",
    name: "Login - Branded",
    description: "Branded login page with custom colors for enterprise applications.",
    category: "login",
    tags: ["login", "auth", "branded", "enterprise"],
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ primaryColor: "#e11d48", borderRadius: "small", shadow: "medium" });
      return generateLoginSection("Sign In", "Access your enterprise workspace", "EnterpriseCo", tokens);
    },
  },

  // Full Pages
  {
    id: "fullpage-saas",
    name: "Full Page - SaaS Landing",
    description: "Complete SaaS landing page: navbar, hero, logos, features, steps, stats, testimonials, pricing, FAQ, CTA, footer.",
    category: "fullpage",
    tags: ["fullpage", "saas", "landing", "complete"],
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({});
      return [
        ...generateNavbar("SaaSFlow", undefined, "Start Free Trial", tokens),
        ...generateHeroSection("Streamline Your Workflow", "The all-in-one platform for managing projects, teams, and clients.", "Start Free Trial", "#", "gradient", tokens),
        ...generateLogoCloudSection("Trusted by 10,000+ teams worldwide", undefined, tokens),
        ...generateFeaturesSection(undefined, undefined, undefined, tokens),
        ...generateStepsSection(undefined, undefined, undefined, tokens),
        ...generateStatsSection(undefined, undefined, tokens),
        ...generateTestimonialsSection(undefined, tokens),
        ...generatePricingSection(undefined, tokens),
        ...generateFaqSection(undefined, undefined, undefined, tokens),
        ...generateCTASection(undefined, undefined, undefined, tokens),
        ...generateFooterSection("SaaSFlow", undefined, tokens),
      ];
    },
  },
  {
    id: "fullpage-agency",
    name: "Full Page - Agency",
    description: "Creative agency site: navbar, hero, logos, gallery, team, testimonials, steps, CTA, contact, footer.",
    category: "fullpage",
    tags: ["fullpage", "agency", "portfolio", "creative"],
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({});
      return [
        ...generateNavbar("Creative Studio", [
          { text: "Home", url: "/" }, { text: "Work", url: "#gallery" },
          { text: "Team", url: "#team" }, { text: "Contact", url: "#contact" },
        ], "Start a Project", tokens),
        ...generateHeroSection("We Craft Digital Experiences", "Award-winning design agency specializing in brand identity, web design, and digital strategy.", "View Our Work", "#gallery", "split", tokens),
        ...generateLogoCloudSection("Trusted by leading brands", undefined, tokens),
        ...generateGallerySection("Our Work", "Selected projects from our portfolio", undefined, tokens),
        ...generateStepsSection("Our Process", "How we deliver exceptional results", [
          { title: "Discovery", description: "We learn about your goals and audience." },
          { title: "Strategy", description: "We create a tailored plan for success." },
          { title: "Design & Build", description: "Our team brings the vision to life." },
          { title: "Launch & Grow", description: "We launch and optimize for growth." },
        ], tokens),
        ...generateTeamSection(undefined, undefined, undefined, tokens),
        ...generateTestimonialsSection(undefined, tokens),
        ...generateCTASection("Let's Create Together", "Ready to bring your vision to life? Let's discuss your next project.", "Start a Project", tokens),
        ...generateContactSection(tokens),
        ...generateFooterSection("Creative Studio", undefined, tokens),
      ];
    },
  },
  {
    id: "fullpage-startup",
    name: "Full Page - Startup",
    description: "Startup landing page: navbar, hero, logos, features, stats, testimonials, pricing, CTA, blog, footer.",
    category: "fullpage",
    tags: ["fullpage", "startup", "modern"],
    preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({});
      return [
        ...generateNavbar("LaunchPad", undefined, "Get Early Access", tokens),
        ...generateHeroSection("Launch Faster, Scale Smarter", "The startup toolkit that takes you from idea to IPO. Everything you need in one platform.", "Get Early Access", "#", "gradient", tokens),
        ...generateLogoCloudSection("Backed by the best", [
          { name: "Y Combinator" }, { name: "Sequoia" }, { name: "a16z" },
          { name: "Accel" }, { name: "Founders Fund" },
        ], tokens),
        ...generateFeaturesSection(undefined, undefined, undefined, tokens),
        ...generateStatsSection(undefined, undefined, tokens),
        ...generateTestimonialsSection(undefined, tokens),
        ...generatePricingSection(undefined, tokens),
        ...generateCTASection(undefined, undefined, undefined, tokens),
        ...generateBlogSection(undefined, undefined, undefined, tokens),
        ...generateFooterSection("LaunchPad", undefined, tokens),
      ];
    },
  },
  {
    id: "fullpage-dark-saas",
    name: "Full Page - Dark SaaS",
    description: "Dark-themed SaaS page with all sections in dark mode.",
    category: "fullpage",
    tags: ["fullpage", "dark", "saas", "modern"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ darkMode: true, primaryColor: "#8b5cf6", shadow: "medium" });
      return [
        ...generateNavbar("DarkFlow", undefined, "Get Started", tokens),
        ...generateHeroSection("Next-Gen Developer Tools", "Build, deploy, and scale with confidence. The platform developers love.", "Start Building", "#", "centered", tokens),
        ...generateLogoCloudSection(undefined, undefined, tokens),
        ...generateFeaturesSection(undefined, undefined, undefined, tokens),
        ...generateStatsSection(undefined, undefined, tokens),
        ...generateTestimonialsSection(undefined, tokens),
        ...generatePricingSection(undefined, tokens),
        ...generateFaqSection(undefined, undefined, undefined, tokens),
        ...generateCTASection(undefined, undefined, undefined, tokens),
        ...generateFooterSection("DarkFlow", undefined, tokens),
      ];
    },
  },
  {
    id: "fullpage-restaurant",
    name: "Full Page - Restaurant",
    description: "Restaurant website with warm colors: navbar, hero, features, gallery, testimonials, contact, footer.",
    category: "fullpage",
    tags: ["fullpage", "restaurant", "food", "warm"],
    preview: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ primaryColor: "#d97706", secondaryColor: "#b45309", borderRadius: "large" });
      return [
        ...generateNavbar("Bella Cucina", [
          { text: "Home", url: "/" }, { text: "Menu", url: "#menu" },
          { text: "Gallery", url: "#gallery" }, { text: "Reservations", url: "#contact" },
        ], "Book a Table", tokens),
        ...generateHeroSection("Exquisite Dining Experience", "Discover culinary excellence with our carefully crafted dishes made from the finest ingredients.", "Reserve a Table", "#contact", "split", tokens),
        ...generateFeaturesSection("Why Bella Cucina?", "What makes our dining experience special", [
          { title: "Farm to Table", description: "Fresh ingredients sourced from local organic farms daily." },
          { title: "Master Chefs", description: "Our award-winning culinary team brings decades of experience." },
          { title: "Cozy Atmosphere", description: "A warm and inviting setting perfect for any occasion." },
          { title: "Wine Cellar", description: "Curated selection of 200+ wines from around the world." },
          { title: "Private Events", description: "Host your special celebrations in our exclusive event spaces." },
          { title: "Seasonal Menu", description: "Our menu evolves with the seasons for the freshest flavors." },
        ], tokens),
        ...generateGallerySection("Our Dishes", "A taste of what awaits you", [
          { title: "Truffle Risotto", category: "Main Course" },
          { title: "Seafood Platter", category: "Appetizer" },
          { title: "Tiramisu", category: "Dessert" },
          { title: "Wagyu Steak", category: "Main Course" },
          { title: "Caprese Salad", category: "Appetizer" },
          { title: "Crème Brûlée", category: "Dessert" },
        ], tokens),
        ...generateTestimonialsSection([
          { quote: "The best Italian restaurant in the city. Every dish is a masterpiece.", author: "James Wilson", role: "Food Critic, City Times", rating: 5 },
          { quote: "An unforgettable dining experience. The truffle risotto is divine!", author: "Maria Santos", role: "Regular Guest", rating: 5 },
          { quote: "Perfect for date nights. The ambiance and food are both exceptional.", author: "Sophie Laurent", role: "Lifestyle Blogger", rating: 5 },
        ], tokens),
        ...generateCTASection("Ready to Dine With Us?", "Book your table today and experience unforgettable flavors.", "Make Reservation", tokens),
        ...generateContactSection(tokens),
        ...generateFooterSection("Bella Cucina", undefined, tokens),
      ];
    },
  },
  {
    id: "fullpage-portfolio",
    name: "Full Page - Portfolio Agency",
    description: "Agency portfolio site: navbar, hero, services, portfolio, timeline, team, testimonials, CTA, contact, footer.",
    category: "fullpage",
    tags: ["fullpage", "portfolio", "agency", "services"],
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ primaryColor: "#e11d48", borderRadius: "large", shadow: "small" });
      return [
        ...generateNavbar("PixelCraft", [
          { text: "Home", url: "/" }, { text: "Services", url: "#services" },
          { text: "Work", url: "#portfolio" }, { text: "About", url: "#about" },
          { text: "Contact", url: "#contact" },
        ], "Hire Us", tokens),
        ...generateHeroSection("We Design Digital Products People Love", "Award-winning agency crafting exceptional web experiences, brands, and digital strategies for ambitious companies.", "See Our Work", "#portfolio", "split", tokens),
        ...generateLogoCloudSection("Trusted by innovative brands", undefined, tokens),
        ...generateServicesSection(undefined, undefined, undefined, tokens),
        ...generatePortfolioSection(undefined, undefined, undefined, tokens),
        ...generateTimelineSection("Our Journey", "15 years of creative excellence", [
          { year: "2011", title: "Founded", description: "Started as a two-person design studio in Berlin." },
          { year: "2014", title: "First Award", description: "Won our first Awwwards Site of the Day." },
          { year: "2017", title: "25 Team Members", description: "Grew to a full-service agency." },
          { year: "2020", title: "Global Clients", description: "Serving clients across 30+ countries." },
          { year: "2026", title: "500+ Projects", description: "Completed over 500 successful projects." },
        ], tokens),
        ...generateTeamSection(undefined, undefined, undefined, tokens),
        ...generateTestimonialsSection(undefined, tokens),
        ...generateCTASection("Ready to Start Your Project?", "Let's create something extraordinary together. Get in touch today.", "Start a Project", tokens),
        ...generateContactSection(tokens),
        ...generateFooterSection("PixelCraft", undefined, tokens),
      ];
    },
  },
  {
    id: "fullpage-consulting",
    name: "Full Page - Consulting Firm",
    description: "Professional consulting site: navbar, hero, content, services, stats, timeline, team, testimonials, FAQ, CTA, footer.",
    category: "fullpage",
    tags: ["fullpage", "consulting", "business", "corporate"],
    preview: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ primaryColor: "#1d4ed8", borderRadius: "small", shadow: "small" });
      return [
        ...generateNavbar("StrategyPro", [
          { text: "Home", url: "/" }, { text: "About", url: "#about" },
          { text: "Services", url: "#services" }, { text: "Contact", url: "#contact" },
        ], "Book Consultation", tokens),
        ...generateHeroSection("Unlock Your Business Potential", "Strategic consulting for companies ready to scale. We help you navigate complexity and seize opportunities.", "Schedule a Call", "#contact", "centered", tokens),
        ...generateContentSection("Who We Are", "StrategyPro is a management consulting firm founded on the belief that every business deserves access to world-class strategic advice. With a team of former Fortune 500 executives and industry specialists, we bring deep expertise to help companies navigate their most challenging business problems and capture new growth opportunities.", "right", tokens),
        ...generateServicesSection("What We Do", "End-to-end strategic consulting", [
          { title: "Growth Strategy", description: "Identify and capture new market opportunities.", features: ["Market Entry", "M&A Advisory", "Revenue Optimization"] },
          { title: "Operations", description: "Streamline operations for maximum efficiency.", features: ["Process Design", "Supply Chain", "Cost Reduction"] },
          { title: "Digital Transformation", description: "Modernize your technology and processes.", features: ["Tech Strategy", "Change Management", "Implementation"] },
          { title: "Leadership Development", description: "Build high-performing leadership teams.", features: ["Executive Coaching", "Team Building", "Succession Planning"] },
        ], tokens),
        ...generateStatsSection("Our Track Record", [
          { value: "$2B+", label: "Value Created", description: "For our clients" },
          { value: "200+", label: "Engagements", description: "Across 30 industries" },
          { value: "95%", label: "Client Retention", description: "Year over year" },
          { value: "40+", label: "Consultants", description: "Former C-suite execs" },
        ], tokens),
        ...generateTimelineSection("Our History", "Two decades of strategic impact", [
          { year: "2006", title: "Founded", description: "Established by three former McKinsey partners." },
          { year: "2010", title: "International", description: "Opened offices in London and Singapore." },
          { year: "2015", title: "Digital Practice", description: "Launched our digital transformation practice." },
          { year: "2020", title: "100th Client", description: "Celebrated our 100th Fortune 500 engagement." },
          { year: "2026", title: "Industry Leader", description: "Ranked #1 mid-size consulting firm globally." },
        ], tokens),
        ...generateTeamSection("Our Leadership", "Industry veterans guiding your success", [
          { name: "Richard Hayes", role: "Managing Partner", bio: "25 years of strategy consulting experience." },
          { name: "Dr. Sarah Kim", role: "Head of Digital", bio: "Former CTO of a Fortune 100 tech company." },
          { name: "Marcus Johnson", role: "Head of Operations", bio: "Supply chain expert with global experience." },
          { name: "Elena Petrova", role: "Head of Growth", bio: "Led $500M+ revenue growth initiatives." },
        ], tokens),
        ...generateTestimonialsSection([
          { quote: "StrategyPro helped us identify a $50M revenue opportunity we had completely overlooked.", author: "David Chen", role: "CEO, TechVentures", rating: 5 },
          { quote: "Their operations team reduced our costs by 30% while improving quality. Exceptional.", author: "Angela Morrison", role: "COO, GlobalManufacturing", rating: 5 },
          { quote: "The best strategic advisors we've worked with. They truly understand our industry.", author: "James White", role: "CFO, FinanceGroup", rating: 5 },
        ], tokens),
        ...generateFaqSection("Common Questions", "Answers to frequent client questions", [
          { question: "How long does a typical engagement last?", answer: "Most strategy engagements run 8-12 weeks. Implementation support can extend to 6-12 months." },
          { question: "What industries do you specialize in?", answer: "We have deep expertise in technology, financial services, healthcare, manufacturing, and consumer goods." },
          { question: "How do you structure your fees?", answer: "We offer project-based, retainer, and success-fee models depending on the engagement type." },
          { question: "Can you work with our existing teams?", answer: "Absolutely. We pride ourselves on collaborative engagements that build internal capability." },
        ], tokens),
        ...generateCTASection("Ready to Transform Your Business?", "Schedule a complimentary strategy session with our team.", "Book Your Consultation", tokens),
        ...generateFooterSection("StrategyPro", undefined, tokens),
      ];
    },
  },
  {
    id: "fullpage-developer",
    name: "Full Page - Developer Portfolio",
    description: "Personal developer portfolio: navbar, hero, content, portfolio, stats, steps, blog, contact, footer.",
    category: "fullpage",
    tags: ["fullpage", "developer", "personal", "portfolio"],
    preview: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
    generator: () => {
      const tokens = resolveDesignTokens({ darkMode: true, primaryColor: "#06b6d4", borderRadius: "large", shadow: "medium" });
      return [
        ...generateNavbar("alex.dev", [
          { text: "About", url: "#about" }, { text: "Work", url: "#portfolio" },
          { text: "Blog", url: "#blog" }, { text: "Contact", url: "#contact" },
        ], "Hire Me", tokens),
        ...generateHeroSection("Full-Stack Developer & Open Source Contributor", "I build fast, accessible, and scalable web applications. Currently available for freelance projects.", "View My Work", "#portfolio", "centered", tokens),
        ...generateContentSection("About Me", "I'm a full-stack developer with 8+ years of experience building web applications. I specialize in React, TypeScript, and Node.js, with a passion for clean code, performance optimization, and developer experience. When I'm not coding, I contribute to open source projects and write technical articles.", "none", tokens),
        ...generatePortfolioSection("Featured Projects", "Recent work and side projects", [
          { title: "Cloud IDE", category: "SaaS", description: "Browser-based code editor with real-time collaboration", tags: ["React", "WebSocket", "Monaco"] },
          { title: "CLI Framework", category: "Open Source", description: "1000+ stars on GitHub, used by 500+ projects", tags: ["TypeScript", "Node.js"] },
          { title: "E-Commerce Platform", category: "Freelance", description: "Custom headless commerce with 99.9% uptime", tags: ["Next.js", "Stripe"] },
          { title: "AI Chat Interface", category: "Side Project", description: "Real-time AI assistant with streaming responses", tags: ["React", "OpenAI"] },
        ], tokens),
        ...generateStatsSection("", [
          { value: "50+", label: "Projects Completed" },
          { value: "1.2K", label: "GitHub Stars" },
          { value: "30+", label: "Open Source PRs" },
          { value: "8+", label: "Years Experience" },
        ], tokens),
        ...generateBlogSection("Latest Articles", "Thoughts on code, tech, and building things", [
          { title: "Building Type-Safe APIs with tRPC", excerpt: "A deep dive into end-to-end type safety in modern web applications.", category: "TypeScript", date: "Feb 2026", readTime: "10 min" },
          { title: "Performance Patterns in React", excerpt: "Advanced techniques for optimizing React application performance.", category: "React", date: "Jan 2026", readTime: "8 min" },
          { title: "The Art of Code Review", excerpt: "How to give and receive code reviews that actually improve code quality.", category: "Engineering", date: "Jan 2026", readTime: "6 min" },
        ], tokens),
        ...generateContactSection(tokens),
        ...generateFooterSection("alex.dev", undefined, tokens),
      ];
    },
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
