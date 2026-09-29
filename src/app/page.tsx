"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import GeneratorForm, { GeneratorConfig } from "@/components/GeneratorForm";
import JsonPreview from "@/components/JsonPreview";
import StructurePreview from "@/components/StructurePreview";
import VisualPreview from "@/components/VisualPreview";
import TemplateCard from "@/components/TemplateCard";
import SettingsPanel from "@/components/SettingsPanel";
import { TEMPLATES, CATEGORIES, TemplateDefinition, searchTemplates, getTemplatesByCategory } from "@/lib/templates";
import { wrapTemplate, BricksElement, BricksTemplate } from "@/lib/bricks-engine";
import { loadApiKey, clearApiKey, Provider } from "@/lib/secure-storage";

import ConnectionGuide from "@/components/ConnectionGuide";
import { templateWarnings } from "@/lib/template-warnings";
import StagingWorkspace from "@/components/StagingWorkspace";
import KitStudio, { type KitSelection } from "@/components/kit/KitStudio";
import { VARIANTS } from "@/lib/kit/sections";
import { version } from "../../package.json";

type Tab = "studio" | "generator" | "library" | "staging";
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "studio", label: "Studio" },
  { id: "generator", label: "Generator" },
  { id: "library", label: "Library" },
  { id: "staging", label: "Staging" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  // The latest Studio export, with its design system for installing on a connected site.
  const [kitSelection, setKitSelection] = useState<KitSelection | null>(null);
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

  const [generationError, setGenerationError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [useChatGPT, setUseChatGPT] = useState(false);
  const [chatgptModel, setChatgptModel] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  // BYOK state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [azureDeployment, setAzureDeployment] = useState("");
  const [openrouterModel, setOpenrouterModel] = useState("");

  // Load saved settings from obfuscated secure storage (sessionStorage by default).
  // Also migrate any legacy plain-text keys from localStorage and wipe them.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Legacy migration: if an old plain-text key exists, remove it.
    // We do NOT auto-import it into the new store, since the user may be
    // on a shared machine and should re-enter it consciously.
    try {
    const legacyKey = localStorage.getItem("brickssnap_apikey");
    if (legacyKey) {
      localStorage.removeItem("brickssnap_apikey");
      localStorage.removeItem("brickssnap_provider");
      clearApiKey();
    }
    } catch { /* Storage can be unavailable in private or restricted browsers. */ }

    const loaded = loadApiKey();
    if (loaded.model) setModel(loaded.model);
    if (loaded.key) setApiKey(loaded.key);
    if (loaded.provider) setProvider(loaded.provider);
    if (loaded.azureEndpoint) setAzureEndpoint(loaded.azureEndpoint);
    if (loaded.azureDeployment) setAzureDeployment(loaded.azureDeployment);
    if (loaded.openrouterModel) setOpenrouterModel(loaded.openrouterModel);
  }, []);

  const handleGenerate = useCallback(async (config: GeneratorConfig) => {
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerationError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(150000)]),
        headers: { "Content-Type": "application/json", ...(useChatGPT ? { "X-BricksSnap-Local": "1" } : {}) },
        body: JSON.stringify({
          prompt: config.prompt,
          useChatGPT,
          chatgptModel: chatgptModel || undefined,
          model: model || undefined,
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
          referenceImage: config.referenceImage,
          azureEndpoint: azureEndpoint || undefined,
          azureDeployment: azureDeployment || undefined,
          openrouterModel: openrouterModel || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) throw new Error(data.error || "Generation failed. Please retry.");
      if (data.success) {
        setWarnings(data.validation?.warnings ?? []);
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
      setGenerationError(controller.signal.aborted ? "Generation cancelled." : error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [apiKey, provider, azureEndpoint, azureDeployment, openrouterModel, model, useChatGPT, chatgptModel]);

  const handleTemplateSelect = useCallback((template: TemplateDefinition) => {
    setGenerationError(""); setWarnings([]); setLastMode("builtin");
    const elements = template.generator();
    setWarnings(templateWarnings(elements));
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

  const openKitInStaging = (selection: KitSelection) => {
    setKitSelection(selection);
    setGeneratedTemplate(selection.template);
    setGeneratedElements(selection.template.content);
    setActiveTab("staging");
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-2 px-4 pt-3 sm:px-6 md:h-16 md:flex-nowrap md:pt-0">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary" aria-hidden>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="#fff"><rect x="2" y="3" width="7" height="6" rx="1"/><rect x="11" y="3" width="7" height="6" rx="1"/><rect x="2" y="11" width="4" height="6" rx="1"/><rect x="8" y="11" width="10" height="6" rx="1"/></svg>
            </span>
            <h1 className="text-[15px] font-semibold tracking-tight">BricksSnap</h1>
            <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted">v{version}</span>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="ml-auto inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-text hover:border-border-hover md:order-last">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
            {apiKey && <span className="h-1.5 w-1.5 rounded-full bg-success" aria-label="API key saved" />}
          </button>
          <nav aria-label="Main" className="-mx-4 flex w-[calc(100%+2rem)] gap-6 overflow-x-auto px-4 md:mx-0 md:h-full md:w-auto md:px-0">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined}
                className={`-mb-px shrink-0 border-b-2 py-3 text-sm font-medium transition-colors md:h-full md:py-0 ${activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 md:py-10">
        <div hidden={activeTab !== "staging"}><StagingWorkspace generatedTemplate={generatedTemplate} designSystem={kitSelection?.designSystem ?? null}/></div>

        {activeTab === "studio" && (
          <div className="animate-fade-in space-y-8">
            <div className="max-w-3xl">
              <p className="label-mono mb-3">Template studio</p>
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">Pick a layout. Make it yours.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text">{VARIANTS.length} layouts in five style directions, written for your industry in German or English. Set your color, fonts and spacing, see every section update live, and export native Bricks JSON with global classes and a design system. No AI and no account needed.</p>
            </div>
            <KitStudio onOpenInStaging={openKitInStaging}/>
          </div>
        )}

        {activeTab === "generator" && (
          <div className="animate-fade-in">
            <div className="mb-8 max-w-3xl">
              <p className="label-mono mb-3">Generator</p>
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">Describe a page, get Bricks JSON.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text">Use the built-in engine for free, your own AI provider key, your ChatGPT connection, or Claude through MCP. {TEMPLATES.length}+ templates, 45+ color palettes and 30+ style presets to start from.</p>
            </div>

            <div className="mb-10 max-w-4xl">
              <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} aiAvailable={aiAvailable} lastMode={lastMode} />
              {isLoading && <button onClick={() => abortRef.current?.abort()} className="mt-3 text-sm text-text underline">Cancel generation</button>}
              {generationError && <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{generationError}</p>}
              {warnings.length > 0 && <details className="mt-3 text-sm"><summary className="cursor-pointer">{warnings.length} validation notes – review before importing</summary><ul className="mt-2 list-disc pl-5 text-text">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}
              <ConnectionGuide disabled={isLoading} onImport={(template, notes) => {
                setGeneratedTemplate(template); setGeneratedElements(template.content); setWarnings(notes); setGenerationError(""); setLastMode(null);
                setGenerationInfo({ elementCount: template.content.length, sections: template.content.filter(e => e.parent === 0).map(e => e.label || e.name) });
              }} />
            </div>

            {isLoading && (
              <div className="mb-8 max-w-4xl rounded-xl border border-border bg-card p-8">
                <p className="text-sm font-medium">Generating your template…</p>
                <p className="mt-1 text-xs text-muted">Analyzing your description and building elements</p>
                <div className="mt-4 h-1 w-64 overflow-hidden rounded-full bg-border"><div className="loading-shimmer h-full rounded-full" /></div>
              </div>
            )}

            {generatedTemplate && !isLoading && (
              <div className="animate-fade-in space-y-6">
                {generationInfo && (
                  <div className="flex max-w-4xl flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success/10 text-success" aria-hidden>✓</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {generationError ? "Previous template retained." : lastMode === null ? "Template imported." : "Template generated."}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{generationInfo.elementCount} elements across {generationInfo.sections.length} sections: {generationInfo.sections.join(", ")}</p>
                    </div>
                  </div>
                )}
                <details className="max-w-4xl rounded-xl border border-border bg-card p-4 text-sm">
                  <summary className="cursor-pointer font-medium">How to import the template in Bricks</summary>
                  <ol className="mt-3 list-inside list-decimal space-y-1 text-text">
                    <li>Click <strong>Download for Bricks import</strong>.</li>
                    <li>Open the Bricks editor on your site.</li>
                    <li>Click <strong>+</strong> at the top left, then <strong>Templates</strong>.</li>
                    <li>Choose <strong>My templates</strong> and click the <strong>Import</strong> button (arrow up).</li>
                    <li>Select the downloaded JSON file and click <strong>Insert</strong>.</li>
                  </ol>
                  <p className="mt-2 text-xs text-muted">Or click <strong>Copy for Bricks</strong> and paste with Ctrl+V in the editor.</p>
                </details>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-1">
                    <VisualPreview elements={generatedElements} />
                    <StructurePreview elements={generatedElements} />
                  </div>
                  <div className="lg:col-span-2">
                    <JsonPreview data={generatedTemplate} maxHeight="600px" />
                  </div>
                </div>
              </div>
            )}

            {!generatedTemplate && !isLoading && (
              <div className="mt-12">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <h3 className="text-lg font-semibold tracking-tight">Popular templates</h3>
                  <button onClick={() => setActiveTab("library")} className="text-sm font-medium text-primary hover:text-primary-hover">All {TEMPLATES.length} templates →</button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {TEMPLATES.slice(0, 8).map((template) => (
                    <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "library" && (
          <div className="animate-fade-in">
            <div className="mb-8 max-w-3xl">
              <p className="label-mono mb-3">Library</p>
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em]">Classic templates</h2>
              <p className="mt-3 text-[15px] text-text">Ready-made sections and pages with inline styles. For modern layouts with global classes and a design system, use the Studio.</p>
            </div>
            <div className="flex flex-col gap-8 md:flex-row">
              <aside className="flex-shrink-0 md:w-56">
                <div className="md:sticky md:top-24">
                  <h3 className="label-mono mb-3">Categories</h3>
                  <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0" aria-label="Template categories">
                    {CATEGORIES.map((cat) => {
                      const count = cat.id === "all" ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === cat.id).length;
                      const active = selectedCategory === cat.id && !searchQuery;
                      return (
                        <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSearchQuery(""); }} aria-pressed={active}
                          className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-primary-soft font-medium text-primary-hover" : "text-text hover:bg-subtle"}`}>
                          <span>{cat.name}</span>
                          <span className="font-mono text-[11px] text-muted">{count}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </aside>
              <div className="min-w-0 flex-1">
                <div className="relative mb-6">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="search" aria-label="Search templates" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search templates…"
                    className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted focus:border-primary focus:outline-none" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
                  ))}
                </div>
                {filteredTemplates.length === 0 && <p className="py-12 text-center text-sm text-muted">No templates found matching your search.</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:px-6">
          <p>BricksSnap v{version} · Free template generator for Bricks Builder</p>
          <p className="font-mono text-[11px]">{VARIANTS.length} studio layouts · {TEMPLATES.length} classic templates · Bricks 2.4 schema</p>
        </div>
      </footer>

      <SettingsPanel
        useChatGPT={useChatGPT}
        setUseChatGPT={setUseChatGPT}
        chatgptModel={chatgptModel}
        setChatgptModel={setChatgptModel}
        model={model}
        setModel={setModel}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        provider={provider}
        setProvider={setProvider}
        azureEndpoint={azureEndpoint}
        setAzureEndpoint={setAzureEndpoint}
        azureDeployment={azureDeployment}
        setAzureDeployment={setAzureDeployment}
        openrouterModel={openrouterModel}
        setOpenrouterModel={setOpenrouterModel}
      />
    </div>
  );
}
