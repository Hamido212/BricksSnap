// Style Presets & Color Palettes - Inspired by BricksFusion's 62 presets & 70 palettes
import { DesignTokens } from "./bricks-engine";

// ============================================================
// COLOR PALETTES (50+ curated palettes)
// ============================================================
export interface ColorPalette {
  id: string;
  name: string;
  category: "trust" | "bold" | "elegant" | "creative" | "calm" | "dark" | "warm" | "nature" | "tech";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    heading: string;
    muted: string;
    border: string;
    accent: string;
  };
  preview: string[]; // 4-5 colors for mini preview
}

export const COLOR_PALETTES: ColorPalette[] = [
  // TRUST
  { id: "ocean-blue", name: "Ocean Blue", category: "trust", colors: { primary: "#2563eb", secondary: "#3b82f6", background: "#ffffff", surface: "#f8fafc", text: "#334155", heading: "#0f172a", muted: "#64748b", border: "#e2e8f0", accent: "#06b6d4" }, preview: ["#2563eb", "#06b6d4", "#f8fafc", "#0f172a"] },
  { id: "corporate-navy", name: "Corporate Navy", category: "trust", colors: { primary: "#1e3a5f", secondary: "#2563eb", background: "#ffffff", surface: "#f1f5f9", text: "#334155", heading: "#0f172a", muted: "#64748b", border: "#e2e8f0", accent: "#0ea5e9" }, preview: ["#1e3a5f", "#2563eb", "#f1f5f9", "#0f172a"] },
  { id: "steel-blue", name: "Steel Blue", category: "trust", colors: { primary: "#475569", secondary: "#64748b", background: "#ffffff", surface: "#f8fafc", text: "#334155", heading: "#1e293b", muted: "#94a3b8", border: "#e2e8f0", accent: "#3b82f6" }, preview: ["#475569", "#3b82f6", "#f8fafc", "#1e293b"] },
  { id: "royal-blue", name: "Royal Blue", category: "trust", colors: { primary: "#1d4ed8", secondary: "#6366f1", background: "#ffffff", surface: "#eef2ff", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#e5e7eb", accent: "#818cf8" }, preview: ["#1d4ed8", "#6366f1", "#eef2ff", "#111827"] },
  { id: "sapphire", name: "Sapphire", category: "trust", colors: { primary: "#2563eb", secondary: "#7c3aed", background: "#fafafa", surface: "#f4f4f5", text: "#3f3f46", heading: "#18181b", muted: "#71717a", border: "#e4e4e7", accent: "#8b5cf6" }, preview: ["#2563eb", "#7c3aed", "#f4f4f5", "#18181b"] },

  // BOLD
  { id: "electric-red", name: "Electric Red", category: "bold", colors: { primary: "#dc2626", secondary: "#ef4444", background: "#ffffff", surface: "#fef2f2", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#fecaca", accent: "#f97316" }, preview: ["#dc2626", "#f97316", "#fef2f2", "#111827"] },
  { id: "hot-orange", name: "Hot Orange", category: "bold", colors: { primary: "#ea580c", secondary: "#f97316", background: "#ffffff", surface: "#fff7ed", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#fed7aa", accent: "#dc2626" }, preview: ["#ea580c", "#dc2626", "#fff7ed", "#111827"] },
  { id: "neon-green", name: "Neon Green", category: "bold", colors: { primary: "#16a34a", secondary: "#22c55e", background: "#ffffff", surface: "#f0fdf4", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#bbf7d0", accent: "#06b6d4" }, preview: ["#16a34a", "#06b6d4", "#f0fdf4", "#111827"] },
  { id: "magenta-pop", name: "Magenta Pop", category: "bold", colors: { primary: "#c026d3", secondary: "#d946ef", background: "#ffffff", surface: "#fdf4ff", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#f0abfc", accent: "#ec4899" }, preview: ["#c026d3", "#ec4899", "#fdf4ff", "#111827"] },
  { id: "crimson-fire", name: "Crimson Fire", category: "bold", colors: { primary: "#be123c", secondary: "#e11d48", background: "#fff1f2", surface: "#ffe4e6", text: "#4c0519", heading: "#1c0009", muted: "#9f1239", border: "#fda4af", accent: "#fb923c" }, preview: ["#be123c", "#fb923c", "#fff1f2", "#1c0009"] },

  // ELEGANT
  { id: "rose-gold", name: "Rose Gold", category: "elegant", colors: { primary: "#be185d", secondary: "#ec4899", background: "#fffbfe", surface: "#fdf2f8", text: "#4a044e", heading: "#1e0024", muted: "#a21caf", border: "#f9a8d4", accent: "#d4a574" }, preview: ["#be185d", "#d4a574", "#fdf2f8", "#1e0024"] },
  { id: "champagne", name: "Champagne", category: "elegant", colors: { primary: "#92400e", secondary: "#b45309", background: "#fffbeb", surface: "#fef3c7", text: "#451a03", heading: "#1c0a00", muted: "#78350f", border: "#fcd34d", accent: "#d97706" }, preview: ["#92400e", "#d97706", "#fffbeb", "#1c0a00"] },
  { id: "midnight-gold", name: "Midnight Gold", category: "elegant", colors: { primary: "#d4a574", secondary: "#c9a96e", background: "#0a0a0a", surface: "#171717", text: "#d4d4d4", heading: "#fafafa", muted: "#737373", border: "#262626", accent: "#f59e0b" }, preview: ["#d4a574", "#f59e0b", "#0a0a0a", "#fafafa"] },
  { id: "pearl-white", name: "Pearl White", category: "elegant", colors: { primary: "#6b7280", secondary: "#9ca3af", background: "#ffffff", surface: "#fafafa", text: "#374151", heading: "#111827", muted: "#9ca3af", border: "#f3f4f6", accent: "#be185d" }, preview: ["#6b7280", "#be185d", "#fafafa", "#111827"] },
  { id: "luxury-black", name: "Luxury Black", category: "elegant", colors: { primary: "#a5a5a5", secondary: "#d4d4d4", background: "#000000", surface: "#0a0a0a", text: "#a3a3a3", heading: "#ffffff", muted: "#525252", border: "#262626", accent: "#fbbf24" }, preview: ["#a5a5a5", "#fbbf24", "#000000", "#ffffff"] },

  // CREATIVE
  { id: "candy-gradient", name: "Candy Gradient", category: "creative", colors: { primary: "#8b5cf6", secondary: "#a78bfa", background: "#ffffff", surface: "#faf5ff", text: "#4c1d95", heading: "#1e1b4b", muted: "#7c3aed", border: "#ddd6fe", accent: "#ec4899" }, preview: ["#8b5cf6", "#ec4899", "#faf5ff", "#1e1b4b"] },
  { id: "sunset-vibes", name: "Sunset Vibes", category: "creative", colors: { primary: "#f43f5e", secondary: "#fb923c", background: "#ffffff", surface: "#fff1f2", text: "#44403c", heading: "#1c1917", muted: "#78716c", border: "#fecdd3", accent: "#a855f7" }, preview: ["#f43f5e", "#fb923c", "#fff1f2", "#1c1917"] },
  { id: "aurora-borealis", name: "Aurora Borealis", category: "creative", colors: { primary: "#06b6d4", secondary: "#8b5cf6", background: "#0f172a", surface: "#1e293b", text: "#e2e8f0", heading: "#f8fafc", muted: "#94a3b8", border: "#334155", accent: "#22d3ee" }, preview: ["#06b6d4", "#8b5cf6", "#0f172a", "#f8fafc"] },
  { id: "tropical", name: "Tropical", category: "creative", colors: { primary: "#0d9488", secondary: "#14b8a6", background: "#ffffff", surface: "#f0fdfa", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#99f6e4", accent: "#f97316" }, preview: ["#0d9488", "#f97316", "#f0fdfa", "#111827"] },
  { id: "cosmic-purple", name: "Cosmic Purple", category: "creative", colors: { primary: "#7c3aed", secondary: "#a78bfa", background: "#0c0015", surface: "#1a0033", text: "#c4b5fd", heading: "#f5f3ff", muted: "#8b5cf6", border: "#2e1065", accent: "#f0abfc" }, preview: ["#7c3aed", "#f0abfc", "#0c0015", "#f5f3ff"] },

  // CALM
  { id: "meadow-green", name: "Meadow Green", category: "calm", colors: { primary: "#059669", secondary: "#10b981", background: "#ffffff", surface: "#ecfdf5", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#a7f3d0", accent: "#0d9488" }, preview: ["#059669", "#0d9488", "#ecfdf5", "#111827"] },
  { id: "sky-serenity", name: "Sky Serenity", category: "calm", colors: { primary: "#0284c7", secondary: "#38bdf8", background: "#ffffff", surface: "#f0f9ff", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#bae6fd", accent: "#06b6d4" }, preview: ["#0284c7", "#06b6d4", "#f0f9ff", "#111827"] },
  { id: "lavender-mist", name: "Lavender Mist", category: "calm", colors: { primary: "#7c3aed", secondary: "#a78bfa", background: "#faf5ff", surface: "#f3e8ff", text: "#6b21a8", heading: "#3b0764", muted: "#9333ea", border: "#e9d5ff", accent: "#c084fc" }, preview: ["#7c3aed", "#c084fc", "#faf5ff", "#3b0764"] },
  { id: "sage-wellness", name: "Sage Wellness", category: "calm", colors: { primary: "#65a30d", secondary: "#84cc16", background: "#ffffff", surface: "#f7fee7", text: "#374151", heading: "#111827", muted: "#6b7280", border: "#d9f99d", accent: "#16a34a" }, preview: ["#65a30d", "#16a34a", "#f7fee7", "#111827"] },
  { id: "soft-peach", name: "Soft Peach", category: "calm", colors: { primary: "#ea580c", secondary: "#fb923c", background: "#fffbf5", surface: "#fff7ed", text: "#431407", heading: "#1a0500", muted: "#9a3412", border: "#fed7aa", accent: "#f59e0b" }, preview: ["#ea580c", "#f59e0b", "#fffbf5", "#1a0500"] },

  // DARK
  { id: "dark-default", name: "Dark Default", category: "dark", colors: { primary: "#3b82f6", secondary: "#8b5cf6", background: "#09090b", surface: "#18181b", text: "#e4e4e7", heading: "#fafafa", muted: "#71717a", border: "#27272a", accent: "#a78bfa" }, preview: ["#3b82f6", "#8b5cf6", "#09090b", "#fafafa"] },
  { id: "dark-emerald", name: "Dark Emerald", category: "dark", colors: { primary: "#10b981", secondary: "#34d399", background: "#0a0f0d", surface: "#132019", text: "#d1fae5", heading: "#ecfdf5", muted: "#6ee7b7", border: "#1a3a2b", accent: "#06b6d4" }, preview: ["#10b981", "#06b6d4", "#0a0f0d", "#ecfdf5"] },
  { id: "dark-crimson", name: "Dark Crimson", category: "dark", colors: { primary: "#ef4444", secondary: "#f87171", background: "#0f0505", surface: "#1a0a0a", text: "#fecaca", heading: "#fef2f2", muted: "#fca5a5", border: "#3b1010", accent: "#f97316" }, preview: ["#ef4444", "#f97316", "#0f0505", "#fef2f2"] },
  { id: "dark-ocean", name: "Dark Ocean", category: "dark", colors: { primary: "#06b6d4", secondary: "#22d3ee", background: "#0a0f14", surface: "#0e1a24", text: "#cffafe", heading: "#ecfeff", muted: "#67e8f9", border: "#164e63", accent: "#2dd4bf" }, preview: ["#06b6d4", "#2dd4bf", "#0a0f14", "#ecfeff"] },
  { id: "dark-violet", name: "Dark Violet", category: "dark", colors: { primary: "#8b5cf6", secondary: "#a78bfa", background: "#0c0a14", surface: "#1a1528", text: "#ddd6fe", heading: "#f5f3ff", muted: "#c4b5fd", border: "#2e1d5e", accent: "#ec4899" }, preview: ["#8b5cf6", "#ec4899", "#0c0a14", "#f5f3ff"] },
  { id: "dark-charcoal", name: "Dark Charcoal", category: "dark", colors: { primary: "#f59e0b", secondary: "#fbbf24", background: "#0a0a0a", surface: "#171717", text: "#d4d4d4", heading: "#fafafa", muted: "#737373", border: "#262626", accent: "#f97316" }, preview: ["#f59e0b", "#f97316", "#0a0a0a", "#fafafa"] },

  // WARM
  { id: "terracotta", name: "Terracotta", category: "warm", colors: { primary: "#c2410c", secondary: "#dc2626", background: "#fffbf0", surface: "#fef3c7", text: "#451a03", heading: "#1c0a00", muted: "#9a3412", border: "#fdba74", accent: "#b45309" }, preview: ["#c2410c", "#b45309", "#fffbf0", "#1c0a00"] },
  { id: "autumn-harvest", name: "Autumn Harvest", category: "warm", colors: { primary: "#d97706", secondary: "#f59e0b", background: "#fffbeb", surface: "#fef3c7", text: "#78350f", heading: "#451a03", muted: "#92400e", border: "#fcd34d", accent: "#dc2626" }, preview: ["#d97706", "#dc2626", "#fffbeb", "#451a03"] },
  { id: "coffee-cream", name: "Coffee & Cream", category: "warm", colors: { primary: "#78350f", secondary: "#92400e", background: "#fefce8", surface: "#fef9c3", text: "#422006", heading: "#1c0a00", muted: "#854d0e", border: "#fde68a", accent: "#b45309" }, preview: ["#78350f", "#b45309", "#fefce8", "#1c0a00"] },
  { id: "restaurant-red", name: "Restaurant Red", category: "warm", colors: { primary: "#D62828", secondary: "#F77F00", background: "#130908", surface: "#1a0f0c", text: "#F6EAD9", heading: "#FFF4E6", muted: "#c4a882", border: "#2a1a14", accent: "#F4B400" }, preview: ["#D62828", "#F4B400", "#130908", "#FFF4E6"] },
  { id: "tuscan-sun", name: "Tuscan Sun", category: "warm", colors: { primary: "#b45309", secondary: "#d97706", background: "#fdf8f0", surface: "#fef3e2", text: "#44403c", heading: "#1c1917", muted: "#78716c", border: "#e7e5e4", accent: "#16a34a" }, preview: ["#b45309", "#16a34a", "#fdf8f0", "#1c1917"] },

  // NATURE
  { id: "forest-pine", name: "Forest Pine", category: "nature", colors: { primary: "#166534", secondary: "#15803d", background: "#fafdf7", surface: "#f0fdf0", text: "#14532d", heading: "#052e16", muted: "#166534", border: "#bbf7d0", accent: "#65a30d" }, preview: ["#166534", "#65a30d", "#fafdf7", "#052e16"] },
  { id: "ocean-breeze", name: "Ocean Breeze", category: "nature", colors: { primary: "#0891b2", secondary: "#06b6d4", background: "#ffffff", surface: "#ecfeff", text: "#155e75", heading: "#083344", muted: "#0e7490", border: "#a5f3fc", accent: "#14b8a6" }, preview: ["#0891b2", "#14b8a6", "#ecfeff", "#083344"] },
  { id: "desert-sand", name: "Desert Sand", category: "nature", colors: { primary: "#a16207", secondary: "#ca8a04", background: "#fefdf5", surface: "#fefce8", text: "#713f12", heading: "#422006", muted: "#854d0e", border: "#fef08a", accent: "#ea580c" }, preview: ["#a16207", "#ea580c", "#fefdf5", "#422006"] },

  // TECH
  { id: "github-dark", name: "GitHub Dark", category: "tech", colors: { primary: "#238636", secondary: "#3fb950", background: "#0d1117", surface: "#161b22", text: "#c9d1d9", heading: "#f0f6fc", muted: "#8b949e", border: "#30363d", accent: "#58a6ff" }, preview: ["#238636", "#58a6ff", "#0d1117", "#f0f6fc"] },
  { id: "vercel-mono", name: "Vercel Mono", category: "tech", colors: { primary: "#000000", secondary: "#333333", background: "#ffffff", surface: "#fafafa", text: "#666666", heading: "#000000", muted: "#999999", border: "#eaeaea", accent: "#0070f3" }, preview: ["#000000", "#0070f3", "#ffffff", "#000000"] },
  { id: "stripe-indigo", name: "Stripe Indigo", category: "tech", colors: { primary: "#635bff", secondary: "#7a73ff", background: "#ffffff", surface: "#f6f9fc", text: "#425466", heading: "#0a2540", muted: "#8898aa", border: "#e6ebf1", accent: "#00d4aa" }, preview: ["#635bff", "#00d4aa", "#f6f9fc", "#0a2540"] },
  { id: "linear-purple", name: "Linear Purple", category: "tech", colors: { primary: "#5e6ad2", secondary: "#8b93e6", background: "#111114", surface: "#1b1b1f", text: "#b5b3c4", heading: "#eeeef0", muted: "#787691", border: "#2c2c35", accent: "#f6c177" }, preview: ["#5e6ad2", "#f6c177", "#111114", "#eeeef0"] },
  { id: "notion-clean", name: "Notion Clean", category: "tech", colors: { primary: "#2f3437", secondary: "#505558", background: "#ffffff", surface: "#f7f6f3", text: "#37352f", heading: "#37352f", muted: "#787774", border: "#e3e2de", accent: "#2eaadc" }, preview: ["#2f3437", "#2eaadc", "#ffffff", "#37352f"] },
];

export const PALETTE_CATEGORIES = [
  { id: "all", name: "All Palettes" },
  { id: "trust", name: "Trust & Professional" },
  { id: "bold", name: "Bold & High-Impact" },
  { id: "elegant", name: "Elegant & Luxury" },
  { id: "creative", name: "Creative & Fresh" },
  { id: "calm", name: "Calm & Peaceful" },
  { id: "dark", name: "Dark Themes" },
  { id: "warm", name: "Warm & Inviting" },
  { id: "nature", name: "Nature & Organic" },
  { id: "tech", name: "Tech & Startup" },
];

// ============================================================
// STYLE PRESETS (30+ design directions)
// ============================================================
export interface StylePreset {
  id: string;
  name: string;
  category: "industry" | "aesthetic" | "mood" | "trends" | "purpose";
  description: string;
  tokens: Partial<DesignTokens>;
  aiDirective: string; // Extra instruction for AI prompt
}

export const STYLE_PRESETS: StylePreset[] = [
  // INDUSTRY
  { id: "saas", name: "SaaS Product", category: "industry", description: "Clean, professional SaaS landing page with focus on features and pricing", tokens: { borderRadius: "medium", shadow: "small", spacing: "default" }, aiDirective: "Build a modern SaaS product page. Focus on clarity, trust signals, and conversion. Use feature grids, social proof, and clear pricing tiers." },
  { id: "ecommerce", name: "E-Commerce", category: "industry", description: "Product-focused layout with emphasis on visuals and purchase CTAs", tokens: { borderRadius: "medium", shadow: "medium", spacing: "default" }, aiDirective: "Design an e-commerce layout. Focus on product showcasing, trust badges, customer reviews, and clear add-to-cart CTAs." },
  { id: "agency", name: "Creative Agency", category: "industry", description: "Portfolio-driven agency site with case studies and services", tokens: { borderRadius: "large", shadow: "small", spacing: "spacious" }, aiDirective: "Create a premium agency website. Emphasize portfolio, creative work, team expertise, and a strong brand narrative." },
  { id: "restaurant", name: "Restaurant / Food", category: "industry", description: "Warm, appetizing design with menu focus and reservations", tokens: { borderRadius: "large", shadow: "medium", spacing: "default" }, aiDirective: "Design a restaurant website with warm, appetizing visuals. Use rich imagery, menu showcasing, reservation CTA, and warm color accents." },
  { id: "healthcare", name: "Healthcare", category: "industry", description: "Professional, trustworthy healthcare provider layout", tokens: { borderRadius: "medium", shadow: "small", spacing: "default" }, aiDirective: "Create a healthcare website. Prioritize trust, professionalism, accessibility, and clear calls-to-action for appointments." },
  { id: "law-firm", name: "Law Firm", category: "industry", description: "Authoritative professional services with team and practice areas", tokens: { borderRadius: "small", shadow: "none", spacing: "default" }, aiDirective: "Design a law firm website. Use authoritative typography, professional imagery, practice area cards, and trust-building testimonials." },
  { id: "real-estate", name: "Real Estate", category: "industry", description: "Property listings with search, filtering, and agent profiles", tokens: { borderRadius: "medium", shadow: "medium", spacing: "default" }, aiDirective: "Build a real estate website. Focus on property showcasing, search functionality, agent profiles, and location-based content." },
  { id: "fitness", name: "Fitness & Gym", category: "industry", description: "High-energy fitness brand with programs and membership", tokens: { borderRadius: "medium", shadow: "medium", spacing: "default" }, aiDirective: "Design a fitness/gym website. Use dynamic, high-energy imagery, membership tiers, class schedules, and motivational CTAs." },
  { id: "education", name: "Education / LMS", category: "industry", description: "Course platform with clean structure and learning focus", tokens: { borderRadius: "medium", shadow: "small", spacing: "default" }, aiDirective: "Create an education platform layout. Focus on course cards, instructor profiles, learning paths, and enrollment CTAs." },

  // AESTHETIC
  { id: "minimalist", name: "Minimalist", category: "aesthetic", description: "Clean, whitespace-heavy design with essential elements only", tokens: { borderRadius: "none", shadow: "none", spacing: "spacious", typography: "large", styleMode: "minimalist" as const }, aiDirective: "Ultra-minimal design. Maximum whitespace, essential content only. Thin typography, subtle borders, no shadows. Let content breathe." },
  { id: "brutalist", name: "Brutalist", category: "aesthetic", description: "Raw, bold design with thick borders and monospace type", tokens: { borderRadius: "none", shadow: "none", spacing: "compact", styleMode: "brutalist" as const }, aiDirective: "Brutalist web design. Use thick black borders, monospace fonts, raw unstyled elements, high contrast, and intentionally 'ugly' aesthetics." },
  { id: "glassmorphism", name: "Glassmorphism", category: "aesthetic", description: "Frosted glass effect with transparency and blur", tokens: { borderRadius: "large", shadow: "medium", spacing: "default", styleMode: "glassmorphism" as const }, aiDirective: "Use glassmorphism: frosted glass cards with semi-transparent backgrounds (rgba white ~0.6 opacity for light, ~0.06 for dark), backdrop-filter blur(16px), subtle glass borders (1px solid rgba primary 0.2), layered depth with soft shadows. Section backgrounds should be slightly tinted so glass is visible. Every card and content block MUST have the glass effect." },
  { id: "neo-brutalism", name: "Neo-Brutalism", category: "aesthetic", description: "Bold colors, thick borders, and playful shadows", tokens: { borderRadius: "medium", shadow: "large", spacing: "default", styleMode: "neo-brutalism" as const }, aiDirective: "Neo-brutalist design. Bold solid colors, thick 3-4px black borders, offset box shadows, playful but functional layout." },
  { id: "elegant-serif", name: "Elegant Serif", category: "aesthetic", description: "Sophisticated design with serif fonts and refined spacing", tokens: { borderRadius: "small", shadow: "none", spacing: "spacious", typography: "large" }, aiDirective: "Elegant editorial design. Use serif headings, generous whitespace, refined color palette, and sophisticated typography hierarchy." },
  { id: "retro-vintage", name: "Retro / Vintage", category: "aesthetic", description: "Nostalgic design with muted colors and classic typography", tokens: { borderRadius: "small", shadow: "small", spacing: "default" }, aiDirective: "Retro/vintage design direction. Muted earth tones, classic typography, card-based layout with subtle textures." },

  // MOOD
  { id: "dark-mode", name: "Dark Mode", category: "mood", description: "Full dark theme with rich accents", tokens: { darkMode: true, borderRadius: "medium", shadow: "medium" }, aiDirective: "Full dark mode design. Dark backgrounds, light text, neon or vibrant accent colors for CTAs and important elements." },
  { id: "light-airy", name: "Light & Airy", category: "mood", description: "Bright, open design with pastel accents", tokens: { darkMode: false, borderRadius: "large", shadow: "small", spacing: "spacious" }, aiDirective: "Light and airy design. Lots of white space, pastel accents, soft rounded corners, gentle shadows. Fresh and inviting." },
  { id: "warm-cozy", name: "Warm & Cozy", category: "mood", description: "Inviting warmth with earth-tone accents", tokens: { borderRadius: "large", shadow: "small", spacing: "default" }, aiDirective: "Warm, cozy design. Earth tones, warm amber/orange accents, inviting imagery, rounded elements, comfortable spacing." },
  { id: "vibrant-energetic", name: "Vibrant & Energetic", category: "mood", description: "High-energy design with bold gradients and colors", tokens: { borderRadius: "large", shadow: "large", spacing: "default" }, aiDirective: "Vibrant, high-energy design. Bold gradients, saturated colors, dynamic layout, energetic CTAs. Make it pop." },
  { id: "serene-zen", name: "Serene & Zen", category: "mood", description: "Peaceful, calming design with muted natural tones", tokens: { borderRadius: "medium", shadow: "none", spacing: "spacious", typography: "large" }, aiDirective: "Serene, zen-like design. Muted natural tones, lots of breathing room, calming imagery, gentle transitions." },

  // TRENDS
  { id: "bento-grid", name: "Bento Grid", category: "trends", description: "Apple-inspired bento box grid layout", tokens: { borderRadius: "large", shadow: "small", spacing: "default" }, aiDirective: "Use bento grid layout (like Apple). Cards of varying sizes in a grid, each showcasing a different feature or data point. Clean, modern, visual." },
  { id: "split-screen", name: "Split Screen", category: "trends", description: "50/50 split layouts with contrasting sides", tokens: { borderRadius: "none", shadow: "none", spacing: "default" }, aiDirective: "Split-screen design. 50/50 layouts, contrasting colors or content on each side. Bold visual impact." },
  { id: "scroll-storytelling", name: "Scroll Storytelling", category: "trends", description: "Full-width sections that tell a story as you scroll", tokens: { borderRadius: "medium", shadow: "medium", spacing: "spacious" }, aiDirective: "Design for scroll-based storytelling. Full-width sections, each telling part of a narrative. Use large imagery, bold headings, sequential content." },
  { id: "dashboard-style", name: "Dashboard Style", category: "trends", description: "Data-rich layout with cards, charts, and metrics", tokens: { borderRadius: "medium", shadow: "small", spacing: "compact" }, aiDirective: "Dashboard-inspired design. Metric cards, stat displays, organized grid layout. Data-rich but clean presentation." },

  // PURPOSE
  { id: "lead-generation", name: "Lead Generation", category: "purpose", description: "Conversion-focused with prominent forms and social proof", tokens: { borderRadius: "medium", shadow: "medium", spacing: "default" }, aiDirective: "Conversion-optimized landing page. Prominent lead capture forms, trust badges, testimonials, urgency elements, clear value proposition." },
  { id: "product-launch", name: "Product Launch", category: "purpose", description: "Announcement-style with countdown and features reveal", tokens: { borderRadius: "large", shadow: "large", spacing: "spacious" }, aiDirective: "Product launch page. Feature reveals, countdown elements, early access CTAs, progressive disclosure of product details." },
  { id: "personal-brand", name: "Personal Brand", category: "purpose", description: "Personal website focused on identity and portfolio", tokens: { borderRadius: "medium", shadow: "small", spacing: "spacious", typography: "large" }, aiDirective: "Personal branding website. Focus on the person, their story, skills, portfolio of work, and personal narrative." },
  { id: "event-conference", name: "Event / Conference", category: "purpose", description: "Event landing page with speakers, schedule, and registration", tokens: { borderRadius: "medium", shadow: "medium", spacing: "default" }, aiDirective: "Event/conference landing page. Speaker lineup, schedule/timeline, venue info, ticket tiers, countdown to event." },
];

export const PRESET_CATEGORIES = [
  { id: "all", name: "All Presets" },
  { id: "industry", name: "Industry" },
  { id: "aesthetic", name: "Aesthetic" },
  { id: "mood", name: "Mood" },
  { id: "trends", name: "Trends" },
  { id: "purpose", name: "Purpose" },
];

// ============================================================
// SECTION TYPES for explicit section selection
// ============================================================
export interface SectionType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const SECTION_TYPES: SectionType[] = [
  { id: "navbar", name: "Header / Nav", icon: "☰", description: "Navigation bar with logo and links" },
  { id: "hero", name: "Hero Section", icon: "🏠", description: "Main hero with headline and CTA" },
  { id: "features", name: "Features", icon: "✦", description: "Feature cards grid" },
  { id: "services", name: "Services", icon: "💼", description: "Service offerings with details" },
  { id: "pricing", name: "Pricing", icon: "💰", description: "Pricing tiers comparison" },
  { id: "testimonials", name: "Testimonials", icon: "💬", description: "Customer reviews and quotes" },
  { id: "team", name: "Team", icon: "👥", description: "Team member profiles" },
  { id: "portfolio", name: "Portfolio", icon: "📁", description: "Project showcase grid" },
  { id: "gallery", name: "Gallery", icon: "🖼", description: "Image gallery grid" },
  { id: "stats", name: "Stats", icon: "📊", description: "Key metrics and numbers" },
  { id: "steps", name: "Steps / Process", icon: "🔢", description: "Step-by-step process flow" },
  { id: "faq", name: "FAQ", icon: "❓", description: "Frequently asked questions" },
  { id: "blog", name: "Blog", icon: "📝", description: "Blog post cards" },
  { id: "logos", name: "Logo Cloud", icon: "🏆", description: "Partner/client logos" },
  { id: "cta", name: "Call to Action", icon: "📣", description: "Conversion-focused CTA" },
  { id: "contact", name: "Contact", icon: "✉", description: "Contact form and info" },
  { id: "timeline", name: "Timeline", icon: "📅", description: "Chronological events" },
  { id: "content", name: "Content / About", icon: "📄", description: "About section with text" },
  { id: "footer", name: "Footer", icon: "▬", description: "Site footer with links" },
  { id: "login", name: "Login", icon: "🔒", description: "Authentication form" },
  { id: "404", name: "404 Error", icon: "⚠", description: "Error page" },
  { id: "coming-soon", name: "Coming Soon", icon: "⏳", description: "Pre-launch page" },
];

// ============================================================
// HELPER: Convert palette to design tokens
// ============================================================
export function paletteToTokens(palette: ColorPalette): Partial<DesignTokens> {
  const isDark = isColorDark(palette.colors.background);
  return {
    primaryColor: palette.colors.primary,
    secondaryColor: palette.colors.secondary,
    backgroundColor: palette.colors.background,
    surfaceColor: palette.colors.surface,
    textColor: palette.colors.text,
    headingColor: palette.colors.heading,
    mutedTextColor: palette.colors.muted,
    borderColor: palette.colors.border,
    darkMode: isDark,
  };
}

function isColorDark(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// ============================================================
// HELPER: Merge preset + palette into design tokens
// ============================================================
export function mergePresetAndPalette(
  preset?: StylePreset,
  palette?: ColorPalette
): Partial<DesignTokens> {
  let tokens: Partial<DesignTokens> = {};

  if (preset) {
    tokens = { ...tokens, ...preset.tokens };
  }

  if (palette) {
    tokens = { ...tokens, ...paletteToTokens(palette) };
  }

  return tokens;
}
