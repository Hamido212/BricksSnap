"use client";

import { useState, useCallback, useEffect } from "react";
import GeneratorForm, { GeneratorConfig } from "@/components/GeneratorForm";
import JsonPreview from "@/components/JsonPreview";
import StructurePreview from "@/components/StructurePreview";
import VisualPreview from "@/components/VisualPreview";
import TemplateCard from "@/components/TemplateCard";
import SettingsPanel from "@/components/SettingsPanel";
import { TEMPLATES, CATEGORIES, TemplateDefinition, searchTemplates, getTemplatesByCategory } from "@/lib/templates";
import { wrapTemplate, BricksElement, BricksTemplate } from "@/lib/bricks-engine";

type Tab = "generator" | "library";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("generator");
  const [generatedTemplate, setGeneratedTemplate] = useState<BricksTemplate | null>(null);
  const [generatedElements, setGeneratedElements] = useState<BricksElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generationInfo, setGenerationInfo] = useState<{
    elementCount: number;
    sections: string[];
  } | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | undefined>(undefined);
  const [lastMode, setLastMode] = useState<"ai" | "builtin" | null>(null);

  // BYOK state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("brickssnap_apikey") || "";
      const savedProvider = localStorage.getItem("brickssnap_provider") as "openai" | "anthropic" | null;
      if (savedKey) setApiKey(savedKey);
      if (savedProvider) setProvider(savedProvider);
    }
  }, []);

  const handleGenerate = useCallback(async (config: GeneratorConfig) => {
    setIsLoading(true);
    setGeneratedTemplate(null);
    setGeneratedElements([]);
    setGenerationInfo(null);
    setLastMode(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: config.prompt,
          useAI: config.useAI,
          apiKey: apiKey || undefined,
          provider: provider,
          sections: config.sections.length > 0 ? config.sections : undefined,
          stylePreset: config.stylePreset ? {
            id: config.stylePreset.id,
            name: config.stylePreset.name,
            aiDirective: config.stylePreset.aiDirective,
            tokens: config.stylePreset.tokens,
          } : undefined,
          colorPalette: config.colorPalette ? {
            id: config.colorPalette.id,
            name: config.colorPalette.name,
            colors: config.colorPalette.colors,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedTemplate(data.template);
        setGeneratedElements(data.template.content);
        setGenerationInfo({
          elementCount: data.elementCount,
          sections: data.sections,
        });
        setAiAvailable(data.aiAvailable);
        setLastMode(data.mode);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, provider]);

  const handleTemplateSelect = useCallback((template: TemplateDefinition) => {
    const elements = template.generator();
    const wrapped = wrapTemplate(elements);
    setGeneratedTemplate(wrapped);
    setGeneratedElements(elements);
    setGenerationInfo({
      elementCount: elements.length,
      sections: elements.filter((e) => e.parent === 0).map((e) => e.label || e.name),
    });
    setActiveTab("generator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : getTemplatesByCategory(selectedCategory);

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                BricksSnap
              </h1>
              <p className="text-[11px] text-muted -mt-0.5">
                Template Generator for Bricks Builder
              </p>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card">
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "generator"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generator
              </span>
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "library"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Library
              </span>
            </button>
          </nav>

          <div className="flex items-center gap-3 text-xs text-muted">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-border-hover hover:bg-card-hover transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
              {apiKey && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
            </button>
            <span className="px-2.5 py-1 rounded-md border border-border font-mono">
              v2.0
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Generator Tab */}
        {activeTab === "generator" && (
          <div className="animate-fade-in">
            {/* Hero header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Free Bricks Builder Template Generator
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
                Generate Bricks Templates
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  in Seconds
                </span>
              </h2>
              <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                {TEMPLATES.length}+ pre-built templates, 45+ color palettes, 30+ style presets.
                <br className="hidden sm:inline" />
                Describe what you need and get production-ready Bricks Builder JSON instantly.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted border border-border bg-card">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> OpenAI & Anthropic
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted border border-border bg-card">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" /> BYOK Support
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted border border-border bg-card">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" /> 100% Free
                </span>
              </div>
            </div>

            {/* Generator form */}
            <div className="max-w-4xl mx-auto mb-10">
              <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} aiAvailable={aiAvailable} lastMode={lastMode} />
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
                      <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Generating your template...</p>
                      <p className="text-xs text-muted mt-1">Analyzing your description and building elements</p>
                    </div>
                    <div className="w-64 h-1 rounded-full overflow-hidden bg-border">
                      <div className="h-full rounded-full loading-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {generatedTemplate && !isLoading && (
              <div className="animate-fade-in space-y-6">
                {/* Generation info */}
                {generationInfo && (
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-success/20 bg-success/5">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Template generated successfully!
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {generationInfo.elementCount} elements across{" "}
                          {generationInfo.sections.length} sections:{" "}
                          {generationInfo.sections.join(", ")}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className="px-2.5 py-1 rounded-md bg-card border border-border text-xs text-muted font-mono">
                          {generationInfo.elementCount} elements
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* How to use */}
                <div className="max-w-4xl mx-auto">
                  <div className="p-4 rounded-xl border border-success/20 bg-success/5">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-xs text-muted leading-relaxed">
                        <p className="font-medium text-foreground mb-1">So verwendest du das Template in Bricks Builder:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Klicke auf den gr&uuml;nen <strong className="text-success">&quot;Download for Bricks Import&quot;</strong> Button</li>
                          <li>&Ouml;ffne den Bricks Builder Editor auf deiner Seite</li>
                          <li>Klicke oben links auf das <strong>+</strong> Zeichen &rarr; <strong>Templates</strong></li>
                          <li>W&auml;hle &quot;My Templates&quot; und klicke auf den <strong>Import</strong> Button (Pfeil nach oben)</li>
                          <li>W&auml;hle die heruntergeladene JSON-Datei aus</li>
                          <li>Klicke auf <strong>&quot;Insert&quot;</strong> um das Template einzuf&uuml;gen</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two column layout: Visual + Structure + JSON */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <VisualPreview elements={generatedElements} />
                    <StructurePreview elements={generatedElements} />
                  </div>
                  <div className="lg:col-span-2">
                    <JsonPreview data={generatedTemplate} maxHeight="600px" />
                  </div>
                </div>
              </div>
            )}

            {/* Features section when no template */}
            {!generatedTemplate && !isLoading && (
              <div className="mt-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
                  <div className="p-5 rounded-xl border border-border bg-card hover:border-border-hover transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">AI + Built-in Engine</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Use GPT-4o or Claude for creative AI generation, or the built-in engine for instant offline templates.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-card hover:border-border-hover transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                      <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">45+ Color Palettes</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Pre-built palettes from Trust & Professional to Dark Themes and Tech Startups, applied to every element.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-card hover:border-border-hover transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">30+ Style Presets</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Industry, aesthetic, mood, and trend presets. From SaaS to Restaurant, Minimalist to Neo-Brutalism.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-card hover:border-border-hover transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center mb-4">
                      <svg className="w-5 h-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">BYOK - Your Keys</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Bring Your Own Key for OpenAI or Anthropic. Direct billing, zero markup. Keys stored locally only.
                    </p>
                  </div>
                </div>

                {/* Quick access templates */}
                <div className="mt-16">
                  <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
                    Popular Templates
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {TEMPLATES.slice(0, 8).map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={handleTemplateSelect}
                      />
                    ))}
                  </div>
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setActiveTab("library")}
                      className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                    >
                      View all {TEMPLATES.length} templates in library &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Library Tab */}
        {activeTab === "library" && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar */}
              <aside className="md:w-56 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    Categories
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {CATEGORIES.map((cat) => {
                      const count =
                        cat.id === "all"
                          ? TEMPLATES.length
                          : TEMPLATES.filter((t) => t.category === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSearchQuery("");
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedCategory === cat.id && !searchQuery
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted hover:text-foreground hover:bg-card-hover"
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span className="text-xs text-muted bg-border rounded px-1.5 py-0.5">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:shadow-lg focus:shadow-primary-glow transition-all"
                    />
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                    />
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted text-sm">No templates found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted">
            BricksSnap v2.0 - Free Template Generator for Bricks Builder
          </div>
          <div className="flex items-center gap-6 text-xs text-muted">
            <span>{TEMPLATES.length}+ templates</span>
            <span>45+ palettes</span>
            <span>30+ presets</span>
            <span>Bricks 1.x &amp; 2.x</span>
          </div>
        </div>
      </footer>

      {/* Settings Panel (BYOK) */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        provider={provider}
        setProvider={setProvider}
      />
    </div>
  );
}
