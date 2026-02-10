"use client";

import { useState } from "react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  provider: "openai" | "anthropic";
  setProvider: (p: "openai" | "anthropic") => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  provider,
  setProvider,
}: SettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(tempKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("brickssnap_apikey", tempKey);
      localStorage.setItem("brickssnap_provider", provider);
    }
    onClose();
  };

  const handleClearKey = () => {
    setTempKey("");
    setApiKey("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("brickssnap_apikey");
    }
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

          {/* BYOK Section */}
          <div className="space-y-6">
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

            {/* Provider Select */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-3 block">AI Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProvider("openai")}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    provider === "openai"
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  {provider === "openai" && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 flex items-center justify-center">
                    <span className="text-lg font-black text-[#10a37f]">G</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">OpenAI</p>
                    <p className="text-[10px] text-muted mt-0.5">GPT-4o / GPT-4o Mini</p>
                  </div>
                </button>

                <button
                  onClick={() => setProvider("anthropic")}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    provider === "anthropic"
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  {provider === "anthropic" && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-[#d4a27f]/10 flex items-center justify-center">
                    <span className="text-lg font-black text-[#d4a27f]">A</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Anthropic</p>
                    <p className="text-[10px] text-muted mt-0.5">Claude Sonnet / Opus</p>
                  </div>
                </button>
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
                  placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
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
                <p className="text-[10px] text-muted">
                  {provider === "openai"
                    ? "Get your key at platform.openai.com/api-keys"
                    : "Get your key at console.anthropic.com"}
                </p>
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

            {/* Status */}
            <div className="p-3 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${tempKey && tempKey.length > 10 ? "bg-success animate-pulse" : "bg-muted"}`} />
                <span className="text-xs text-muted">
                  {tempKey && tempKey.length > 10
                    ? `AI Mode active (${provider === "openai" ? "OpenAI" : "Anthropic"})`
                    : "No API key — Built-in engine will be used (still works!)"}
                </span>
              </div>
            </div>

            {/* Model info */}
            <div className="p-4 rounded-xl border border-border bg-background">
              <h3 className="text-xs font-semibold text-foreground mb-3">Model Selection</h3>
              <div className="space-y-2">
                {provider === "openai" ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Primary</span>
                      <span className="font-mono text-foreground">gpt-4o</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Speed</span>
                      <span className="text-success">Fast</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Quality</span>
                      <span className="text-accent">Excellent</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Primary</span>
                      <span className="font-mono text-foreground">claude-sonnet-4</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Speed</span>
                      <span className="text-success">Fast</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Quality</span>
                      <span className="text-accent">Excellent</span>
                    </div>
                  </>
                )}
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
