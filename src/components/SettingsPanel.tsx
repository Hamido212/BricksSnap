"use client";

import { useState } from "react";
import { storeApiKey, clearApiKey, getPersistPreference, Provider } from "@/lib/secure-storage";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  provider: Provider;
  setProvider: (p: Provider) => void;
  azureEndpoint: string;
  setAzureEndpoint: (v: string) => void;
  azureDeployment: string;
  setAzureDeployment: (v: string) => void;
  openrouterModel: string;
  setOpenrouterModel: (v: string) => void;
}

export default function SettingsPanel(props: SettingsPanelProps) {
  if (!props.isOpen) return null;
  return <SettingsPanelBody {...props} />;
}

const PROVIDER_CONFIG = {
  openai: {
    label: "OpenAI",
    sub: "GPT-4o / o3",
    icon: "G",
    color: "#10a37f",
    placeholder: "sk-...",
    keyHint: "platform.openai.com/api-keys",
    model: "gpt-4o",
    speed: "Fast",
    quality: "Excellent",
  },
  anthropic: {
    label: "Anthropic",
    sub: "Claude Sonnet / Opus",
    icon: "A",
    color: "#d4a27f",
    placeholder: "sk-ant-...",
    keyHint: "console.anthropic.com",
    model: "claude-sonnet-4-6",
    speed: "Fast",
    quality: "Excellent",
  },
  azure: {
    label: "Azure OpenAI",
    sub: "AI Foundry / GPT-4o",
    icon: "Az",
    color: "#0078d4",
    placeholder: "Your Azure API key",
    keyHint: "portal.azure.com → Azure OpenAI → Keys",
    model: "Your deployment",
    speed: "Fast",
    quality: "Excellent",
  },
  openrouter: {
    label: "OpenRouter",
    sub: "100+ models",
    icon: "OR",
    color: "#6366f1",
    placeholder: "sk-or-...",
    keyHint: "openrouter.ai/keys",
    model: "Custom model",
    speed: "Varies",
    quality: "Varies",
  },
} as const;

const OPENROUTER_POPULAR = [
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-opus-4",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp",
  "meta-llama/llama-3.3-70b-instruct",
  "mistralai/mistral-large",
];

function SettingsPanelBody({
  onClose,
  apiKey,
  setApiKey,
  provider,
  setProvider,
  azureEndpoint,
  setAzureEndpoint,
  azureDeployment,
  setAzureDeployment,
  openrouterModel,
  setOpenrouterModel,
}: SettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(() => apiKey);
  const [persistKey, setPersistKey] = useState(() => getPersistPreference());
  const [tempAzureEndpoint, setTempAzureEndpoint] = useState(() => azureEndpoint);
  const [tempAzureDeployment, setTempAzureDeployment] = useState(() => azureDeployment);
  const [tempOpenrouterModel, setTempOpenrouterModel] = useState(() => openrouterModel || OPENROUTER_POPULAR[0]);

  const handleSave = () => {
    setApiKey(tempKey);
    setAzureEndpoint(tempAzureEndpoint);
    setAzureDeployment(tempAzureDeployment);
    setOpenrouterModel(tempOpenrouterModel);
    storeApiKey(
      tempKey,
      provider,
      persistKey,
      tempAzureEndpoint,
      tempAzureDeployment,
      tempOpenrouterModel,
    );
    onClose();
  };

  const handleClearKey = () => {
    setTempKey("");
    setApiKey("");
    clearApiKey();
  };

  const cfg = PROVIDER_CONFIG[provider];

  const providerLabel = (p: Provider) => {
    const isSelected = provider === p;
    const c = PROVIDER_CONFIG[p];
    return (
      <button
        key={p}
        onClick={() => setProvider(p)}
        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
          isSelected
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border hover:border-border-hover"
        }`}
      >
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black"
          style={{ background: `${c.color}18`, color: c.color }}
        >
          {c.icon}
        </div>
        <div className="text-center">
          <p className="text-[11px] font-semibold text-foreground leading-tight">{c.label}</p>
          <p className="text-[9px] text-muted mt-0.5 leading-tight">{c.sub}</p>
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-card border-l border-border overflow-y-auto animate-slide-in-right">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-foreground">Settings</h2>
              <p className="text-xs text-muted mt-0.5">Configure your AI provider and API key</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* BYOK Section */}
            <div className="p-4 rounded-xl border border-accent/20 bg-accent/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-foreground mb-1">BYOK - Bring Your Own Key</p>
                  <p className="text-muted leading-relaxed">
                    Use your own API key. Direct billing from your provider. We charge nothing extra.
                    Your key is stored locally in your browser only.
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Select — 2×2 grid */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-3 block">AI Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {(["openai", "anthropic", "azure", "openrouter"] as Provider[]).map(providerLabel)}
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder={cfg.placeholder}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:shadow-lg focus:shadow-primary-glow transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showKey ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-muted">Get your key at {cfg.keyHint}</p>
                {tempKey && (
                  <button
                    onClick={handleClearKey}
                    className="text-[10px] text-red-400 hover:text-red-300 font-medium"
                  >
                    Clear Key
                  </button>
                )}
              </div>
            </div>

            {/* Azure-specific fields */}
            {provider === "azure" && (
              <div className="space-y-3 p-4 rounded-xl border border-[#0078d4]/20 bg-[#0078d4]/5">
                <p className="text-xs font-semibold text-foreground">Azure Configuration</p>
                <div>
                  <label className="text-[10px] text-muted mb-1 block">Endpoint URL</label>
                  <input
                    type="text"
                    value={tempAzureEndpoint}
                    onChange={(e) => setTempAzureEndpoint(e.target.value)}
                    placeholder="https://my-resource.openai.azure.com"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted mb-1 block">Deployment Name</label>
                  <input
                    type="text"
                    value={tempAzureDeployment}
                    onChange={(e) => setTempAzureDeployment(e.target.value)}
                    placeholder="my-gpt4o-deployment"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-all font-mono"
                  />
                  <p className="text-[10px] text-muted mt-1">The name you gave when deploying a model in Azure AI Foundry.</p>
                </div>
              </div>
            )}

            {/* OpenRouter model selector */}
            {provider === "openrouter" && (
              <div className="space-y-3 p-4 rounded-xl border border-[#6366f1]/20 bg-[#6366f1]/5">
                <p className="text-xs font-semibold text-foreground">Model Selection</p>
                <div>
                  <label className="text-[10px] text-muted mb-1 block">Model ID</label>
                  <input
                    type="text"
                    value={tempOpenrouterModel}
                    onChange={(e) => setTempOpenrouterModel(e.target.value)}
                    placeholder="anthropic/claude-sonnet-4-5"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-all font-mono"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-muted mb-1.5">Popular models:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {OPENROUTER_POPULAR.map((m) => (
                      <button
                        key={m}
                        onClick={() => setTempOpenrouterModel(m)}
                        className={`text-[9px] px-2 py-0.5 rounded-full border font-mono transition-colors ${
                          tempOpenrouterModel === m
                            ? "border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]"
                            : "border-border text-muted hover:border-[#6366f1]/50"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Persist toggle */}
            <div className="p-3 rounded-lg border border-border bg-background">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={persistKey}
                  onChange={(e) => setPersistKey(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Remember across sessions</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-relaxed">
                    {persistKey
                      ? "Key is obfuscated and persisted in browser storage. Stays logged in across restarts."
                      : "Key is obfuscated and kept only for this tab. Safer default — cleared when you close the tab."}
                  </p>
                </div>
              </label>
            </div>

            {/* Status */}
            <div className="p-3 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${tempKey && tempKey.length > 10 ? "bg-success animate-pulse" : "bg-muted"}`} />
                <span className="text-xs text-muted">
                  {tempKey && tempKey.length > 10
                    ? `AI Mode active (${cfg.label})`
                    : "No API key — Built-in engine will be used (still works!)"}
                </span>
              </div>
            </div>

            {/* Model info */}
            <div className="p-4 rounded-xl border border-border bg-background">
              <h3 className="text-xs font-semibold text-foreground mb-3">Model Selection</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Provider</span>
                  <span className="font-medium text-foreground">{cfg.label}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Primary</span>
                  <span className="font-mono text-foreground">
                    {provider === "azure"
                      ? tempAzureDeployment || "—"
                      : provider === "openrouter"
                      ? tempOpenrouterModel || "—"
                      : cfg.model}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Speed</span>
                  <span className="text-success">{cfg.speed}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Quality</span>
                  <span className="text-accent">{cfg.quality}</span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="p-4 rounded-xl border border-border bg-background">
              <h3 className="text-xs font-semibold text-foreground mb-3">How BricksSnap Works</h3>
              <div className="space-y-3 text-xs text-muted leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p><strong className="text-foreground">With API Key:</strong> AI generates custom Bricks JSON based on your exact prompt, style preset, and color palette.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p><strong className="text-foreground">Without API Key:</strong> Built-in engine detects sections from your prompt and generates templates using our curated designs.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p><strong className="text-foreground">Library:</strong> Browse {">"}60 pre-built templates across 24 categories. One click to generate.</p>
                </div>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors shadow-lg shadow-primary/20"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
