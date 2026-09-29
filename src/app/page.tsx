"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import GeneratorForm, { GeneratorConfig } from "@/components/GeneratorForm";
import JsonPreview from "@/components/JsonPreview";
import StructurePreview from "@/components/StructurePreview";
import VisualPreview from "@/components/VisualPreview";
import SettingsPanel from "@/components/SettingsPanel";
import type { BricksElement, BricksTemplate } from "@/lib/bricks-engine";
import { loadApiKey, clearApiKey, Provider } from "@/lib/secure-storage";
import { loadChatGPTSettings, saveChatGPTSettings, type ChatGPTSettings } from "@/lib/chatgpt-settings";

import ConnectionGuide from "@/components/ConnectionGuide";
import StagingWorkspace from "@/components/StagingWorkspace";
import KitStudio, { type KitSelection, type Saved } from "@/components/kit/KitStudio";
import KitLibrary, { type StudioPreset } from "@/components/kit/KitLibrary";
import { DESIGNS } from "@/lib/kit/library";
import { VARIANTS } from "@/lib/kit/sections";
import packageJson from "../../package.json";

// Default import: webpack no longer supports named exports from JSON modules.
const { version } = packageJson;

type Tab = "studio" | "generator" | "library" | "staging";
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "studio", label: "Studio" },
  { id: "library", label: "Library" },
  { id: "generator", label: "Generator" },
  { id: "staging", label: "Staging" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  // The latest Studio export, with its design system for installing on a connected site.
  const [kitSelection, setKitSelection] = useState<KitSelection | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<BricksTemplate | null>(null);
  const [generatedElements, setGeneratedElements] = useState<BricksElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // A library design the Studio should start from.
  const [studioPreset, setStudioPreset] = useState<(Saved & { nonce: number }) | null>(null);
  const [generationInfo, setGenerationInfo] = useState<{
    elementCount: number;
    sections: string[];
  } | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | undefined>(undefined);
  const [lastMode, setLastMode] = useState<"ai" | "builtin" | null>(null);

  const [generationError, setGenerationError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [chatgpt, setChatgpt] = useState<ChatGPTSettings>({ enabled: false, model: "" });
  const { enabled: useChatGPT, model: chatgptModel } = chatgpt;
  const updateChatGPT = useCallback((patch: Partial<ChatGPTSettings>) => setChatgpt(previous => {
    const next = { ...previous, ...patch };
    saveChatGPTSettings(next);
    return next;
  }), []);
  // The prompt the shown result was generated from; null for an imported template.
  const [resultPrompt, setResultPrompt] = useState<string | null>(null);
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

    setChatgpt(loadChatGPTSettings());
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
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(280000)]),
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
        setResultPrompt(config.prompt);
      }
    } catch (error) {
      setGenerationError(controller.signal.aborted ? "Generation cancelled." : error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [apiKey, provider, azureEndpoint, azureDeployment, openrouterModel, model, useChatGPT, chatgptModel]);

  const customizeDesign = (preset: StudioPreset) => {
    setStudioPreset({ ...preset, nonce: Date.now() });
    setActiveTab("studio");
    window.scrollTo({ top: 0 });
  };

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
        <div hidden={activeTab !== "staging"}><StagingWorkspace generatedTemplate={generatedTemplate} kit={kitSelection?.kit ?? null}/></div>

        {activeTab === "studio" && (
          <div className="animate-fade-in space-y-8">
            <div className="max-w-3xl">
              <p className="label-mono mb-3">Template studio</p>
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">Pick a layout. Make it yours.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text">{VARIANTS.length} layouts in five style directions, written for your industry in German or English. Set your color, fonts and spacing, see every section update live, and export native Bricks JSON with global classes and a design system. No AI and no account needed.</p>
            </div>
            <KitStudio preset={studioPreset} onOpenInStaging={openKitInStaging}/>
          </div>
        )}

        {activeTab === "generator" && (
          <div className="animate-fade-in">
            <div className="mb-8 max-w-3xl">
              <p className="label-mono mb-3">Generator</p>
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">Describe a page, get Bricks JSON.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text">Use the built-in engine for free, your own AI provider key, your ChatGPT connection, or Claude through MCP. 45+ color palettes and 30+ style presets to start from.</p>
            </div>

            <div className="mb-10 max-w-4xl">
              <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} aiAvailable={aiAvailable} lastMode={lastMode} />
              {isLoading && <button onClick={() => abortRef.current?.abort()} className="mt-3 text-sm text-text underline">Cancel generation</button>}
              {generationError && <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{generationError}</p>}
              {warnings.length > 0 && <details className="mt-3 text-sm"><summary className="cursor-pointer">{warnings.length} validation notes – review before importing</summary><ul className="mt-2 list-disc pl-5 text-text">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}
              <ConnectionGuide disabled={isLoading} onImport={(template, notes) => {
                setGeneratedTemplate(template); setGeneratedElements(template.content); setWarnings(notes); setGenerationError(""); setLastMode(null); setResultPrompt(null);
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
                  <div className={`flex max-w-4xl flex-wrap items-center gap-4 rounded-xl border p-4 ${generationError ? "border-warning/40 bg-warning/5" : "border-border bg-card"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${generationError ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`} aria-hidden>{generationError ? "!" : "✓"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {generationError ? "The new generation failed. This is still the previous result." : lastMode === null ? "Template imported." : "Template generated."}
                      </p>
                      {resultPrompt && <p className="mt-0.5 truncate text-xs text-text" title={resultPrompt}>{generationError ? "Previous prompt" : "Prompt"}: {resultPrompt}</p>}
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
              <div className="mt-12 flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
                <div>
                  <h3 className="text-base font-semibold">Prefer a ready-made design?</h3>
                  <p className="mt-1 text-sm text-muted">{DESIGNS.length} designs for different industries and styles, with global classes and a design system.</p>
                </div>
                <button onClick={() => setActiveTab("library")} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium hover:border-border-hover hover:bg-subtle">Browse the library →</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "library" && (
          <div className="animate-fade-in space-y-8">
            <div className="max-w-3xl">
              <p className="label-mono mb-3">Library</p>
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">Ready-made designs.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text">{DESIGNS.length} complete designs for different industries and styles, in German or English. Take a whole page or single sections as they are, or open a design in the Studio and make it yours.</p>
            </div>
            <KitLibrary onCustomize={customizeDesign} onOpenInStaging={openKitInStaging}/>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:px-6">
          <p>BricksSnap v{version} · Free for your own and your clients&apos; sites · <a className="underline hover:text-foreground" href="https://github.com/Hamido212/BricksSnap/blob/BricksSnap/LICENSING.md" target="_blank" rel="noreferrer">License</a> · <a className="underline hover:text-foreground" href="https://github.com/Hamido212/BricksSnap" target="_blank" rel="noreferrer">GitHub</a> · Not affiliated with Bricks</p>
          <p className="font-mono text-[11px]">{DESIGNS.length} designs · {VARIANTS.length} layouts · Bricks 2.4 schema</p>
        </div>
      </footer>

      <SettingsPanel
        useChatGPT={useChatGPT}
        setUseChatGPT={enabled => updateChatGPT({ enabled })}
        chatgptModel={chatgptModel}
        setChatgptModel={model => updateChatGPT({ model })}
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
