"use client";

import { useState, FormEvent, useCallback } from "react";
import {
  STYLE_PRESETS,
  PRESET_CATEGORIES,
  COLOR_PALETTES,
  PALETTE_CATEGORIES,
  SECTION_TYPES,
  StylePreset,
  ColorPalette,
} from "@/lib/presets";

interface GeneratorFormProps {
  onGenerate: (config: GeneratorConfig) => void;
  isLoading: boolean;
  aiAvailable?: boolean;
  lastMode?: "ai" | "builtin" | null;
}

export interface GeneratorConfig {
  prompt: string;
  useAI: boolean;
  sections: string[];
  stylePreset?: StylePreset;
  colorPalette?: ColorPalette;
}

type ConfigPanel = "none" | "presets" | "palettes" | "sections";

const EXAMPLE_PROMPTS = [
  "SaaS landing page with hero, features, stats, pricing, FAQ, and footer",
  "Agency website with services, portfolio, timeline, team, and contact",
  "Dark tech startup with gradient hero, steps, team, and testimonials",
  "Restaurant website schwarzer Hintergrund, goldene Akzente, runde Ecken",
  "E-Commerce shop landing page with product sections and FAQ",
  "Developer portfolio dark mode with projects, blog, and stats",
  "Consulting firm with about us, services, stats, and FAQ",
  "Coming soon page for a new tech startup product",
  "Login page with dark theme and rounded corners",
  "Fitness gym website with classes, pricing, and testimonials",
  "Real estate agency with listings, team, and contact form",
  "Medical clinic with services, team, FAQ, and appointment booking",
];

export default function GeneratorForm({
  onGenerate,
  isLoading,
  aiAvailable,
  lastMode,
}: GeneratorFormProps) {
  const [prompt, setPrompt] = useState("");
  const [useAI, setUseAI] = useState(true);
  const [activePanel, setActivePanel] = useState<ConfigPanel>("none");
  const [selectedPreset, setSelectedPreset] = useState<StylePreset | undefined>();
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | undefined>();
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [presetFilter, setPresetFilter] = useState("all");
  const [paletteFilter, setPaletteFilter] = useState("all");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate({
        prompt: prompt.trim(),
        useAI,
        sections: selectedSections,
        stylePreset: selectedPreset,
        colorPalette: selectedPalette,
      });
    }
  };

  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  const togglePanel = (panel: ConfigPanel) => {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
  };

  const filteredPresets =
    presetFilter === "all"
      ? STYLE_PRESETS
      : STYLE_PRESETS.filter((p) => p.category === presetFilter);

  const filteredPalettes =
    paletteFilter === "all"
      ? COLOR_PALETTES
      : COLOR_PALETTES.filter((p) => p.category === paletteFilter);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-xl border border-border bg-card focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary-glow transition-all duration-300">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the template you want to generate... (e.g., 'Modern SaaS landing page with dark hero, features grid, pricing table, and footer')"
            className="w-full min-h-[120px] p-5 bg-transparent text-foreground placeholder:text-muted/60 resize-none focus:outline-none text-[15px] leading-relaxed"
            disabled={isLoading}
          />

          {/* Active selections bar */}
          {(selectedPreset || selectedPalette || selectedSections.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 px-5 py-2 border-t border-border/30">
              {selectedPreset && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent/10 text-accent border border-accent/20">
                  <span>🎨</span>
                  {selectedPreset.name}
                  <button type="button" onClick={() => setSelectedPreset(undefined)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                </span>
              )}
              {selectedPalette && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                  <span className="flex gap-0.5">
                    {selectedPalette.preview.slice(0, 3).map((c, i) => (
                      <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  {selectedPalette.name}
                  <button type="button" onClick={() => setSelectedPalette(undefined)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                </span>
              )}
              {selectedSections.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-success/10 text-success border border-success/20">
                  {selectedSections.length} sections selected
                  <button type="button" onClick={() => setSelectedSections([])} className="ml-1 opacity-60 hover:opacity-100">×</button>
                </span>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* AI Toggle */}
              <button
                type="button"
                onClick={() => setUseAI(!useAI)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  useAI
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-muted hover:text-foreground hover:border-border-hover"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                AI {useAI ? "ON" : "OFF"}
                <div className={`w-7 h-4 rounded-full relative transition-colors ${useAI ? "bg-accent" : "bg-border"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useAI ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </div>
              </button>

              {/* Style Preset Button */}
              <button
                type="button"
                onClick={() => togglePanel("presets")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  activePanel === "presets" || selectedPreset
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-muted hover:text-foreground hover:border-border-hover"
                }`}
              >
                🎨 Style
              </button>

              {/* Color Palette Button */}
              <button
                type="button"
                onClick={() => togglePanel("palettes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  activePanel === "palettes" || selectedPalette
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted hover:text-foreground hover:border-border-hover"
                }`}
              >
                <span className="flex gap-0.5">
                  {(selectedPalette?.preview || ["#3b82f6", "#8b5cf6", "#eee"]).slice(0, 3).map((c, i) => (
                    <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </span>
                Colors
              </button>

              {/* Section Picker Button */}
              <button
                type="button"
                onClick={() => togglePanel("sections")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  activePanel === "sections" || selectedSections.length > 0
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted hover:text-foreground hover:border-border-hover"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Sections{selectedSections.length > 0 ? ` (${selectedSections.length})` : ""}
              </button>

              {/* Status indicators */}
              {aiAvailable !== undefined && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted ml-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${aiAvailable ? "bg-success" : "bg-muted"}`} />
                  {aiAvailable ? "API Connected" : "Built-in Mode"}
                </div>
              )}
              {lastMode && (
                <span className={`hidden sm:inline px-2 py-0.5 rounded text-[10px] font-medium ${
                  lastMode === "ai"
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-border text-muted"
                }`}>
                  {lastMode === "ai" ? "AI generated" : "Built-in"}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Configuration Panels */}
      {activePanel !== "none" && (
        <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
          {activePanel === "presets" && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Style Presets</h3>
                <span className="text-[10px] text-muted">{STYLE_PRESETS.length} presets</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESET_CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => setPresetFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      presetFilter === cat.id ? "bg-primary text-white" : "text-muted hover:text-foreground hover:bg-card-hover border border-border"
                    }`}
                  >{cat.name}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[240px] overflow-y-auto">
                {filteredPresets.map((preset) => (
                  <button key={preset.id}
                    onClick={() => setSelectedPreset(selectedPreset?.id === preset.id ? undefined : preset)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedPreset?.id === preset.id ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-border-hover hover:bg-card-hover"
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground truncate">{preset.name}</p>
                    <p className="text-[10px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{preset.description}</p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-border text-muted capitalize">{preset.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === "palettes" && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Color Palettes</h3>
                <span className="text-[10px] text-muted">{COLOR_PALETTES.length} palettes</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PALETTE_CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => setPaletteFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      paletteFilter === cat.id ? "bg-primary text-white" : "text-muted hover:text-foreground hover:bg-card-hover border border-border"
                    }`}
                  >{cat.name}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-[240px] overflow-y-auto">
                {filteredPalettes.map((palette) => (
                  <button key={palette.id}
                    onClick={() => setSelectedPalette(selectedPalette?.id === palette.id ? undefined : palette)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedPalette?.id === palette.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-border-hover hover:bg-card-hover"
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      {palette.preview.map((color, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <p className="text-[11px] font-semibold text-foreground truncate">{palette.name}</p>
                    <span className="text-[9px] text-muted capitalize">{palette.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === "sections" && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Select Sections</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">{selectedSections.length} selected</span>
                  {selectedSections.length > 0 && (
                    <button type="button" onClick={() => setSelectedSections([])} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Clear</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
                {SECTION_TYPES.map((section) => (
                  <button key={section.id} type="button" onClick={() => toggleSection(section.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                      selectedSections.includes(section.id)
                        ? "border-success bg-success/5 text-success" : "border-border hover:border-border-hover hover:bg-card-hover text-muted"
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="text-[10px] font-medium truncate w-full text-center">{section.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                <span className="text-[10px] text-muted font-medium mr-1">Quick combos:</span>
                {[
                  { label: "SaaS Landing", sections: ["navbar", "hero", "features", "pricing", "testimonials", "faq", "cta", "footer"] },
                  { label: "Agency", sections: ["navbar", "hero", "services", "portfolio", "team", "testimonials", "contact", "footer"] },
                  { label: "Portfolio", sections: ["navbar", "hero", "content", "portfolio", "stats", "blog", "contact", "footer"] },
                  { label: "Restaurant", sections: ["navbar", "hero", "features", "gallery", "testimonials", "cta", "contact", "footer"] },
                  { label: "Full Page", sections: ["navbar", "hero", "features", "stats", "pricing", "testimonials", "faq", "cta", "footer"] },
                ].map((combo) => (
                  <button key={combo.label} type="button" onClick={() => setSelectedSections(combo.sections)}
                    className="px-2 py-0.5 rounded text-[10px] text-muted border border-border hover:text-foreground hover:border-border-hover transition-colors"
                  >{combo.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Example prompts */}
      <div className="mt-4">
        <p className="text-xs text-muted mb-2.5 font-medium">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.slice(0, 8).map((example, i) => (
            <button key={i} onClick={() => setPrompt(example)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted border border-border hover:border-border-hover hover:text-foreground hover:bg-card-hover transition-all duration-200"
            >
              {example.length > 55 ? example.substring(0, 55) + "..." : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
