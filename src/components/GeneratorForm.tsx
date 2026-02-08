"use client";

import { useState, FormEvent } from "react";

interface GeneratorFormProps {
  onGenerate: (prompt: string, useAI: boolean) => void;
  isLoading: boolean;
  aiAvailable?: boolean;
  lastMode?: "ai" | "builtin" | null;
}

const EXAMPLE_PROMPTS = [
  "SaaS landing page with hero, features, stats, pricing, FAQ, and footer",
  "Agency website with services, portfolio, timeline, team, and contact",
  "Dark tech startup with gradient hero, steps, team, and testimonials",
  "Restaurant website schwarzer Hintergrund, goldene Akzente, runde Ecken",
  "Consulting firm with about us, services, stats, timeline, and FAQ",
  "Developer portfolio dark mode with projects, blog, and stats",
  "Coming soon page für ein neues Startup-Produkt",
  "Login page mit dunklem theme und runden Ecken",
  "404 error page with custom styling",
  "E-Commerce shop landing page mit blauer primary farbe und FAQ",
];

export default function GeneratorForm({ onGenerate, isLoading, aiAvailable, lastMode }: GeneratorFormProps) {
  const [prompt, setPrompt] = useState("");
  const [useAI, setUseAI] = useState(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim(), useAI);
    }
  };

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
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
            <div className="flex items-center gap-4">
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
                AI Mode {useAI ? "ON" : "OFF"}
                {/* Toggle indicator */}
                <div className={`w-7 h-4 rounded-full relative transition-colors ${useAI ? "bg-accent" : "bg-border"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useAI ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </div>
              </button>

              {/* Status */}
              {aiAvailable !== undefined && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className={`w-1.5 h-1.5 rounded-full ${aiAvailable ? "bg-success" : "bg-muted"}`} />
                  {aiAvailable ? "API Key connected" : "No API Key (built-in mode)"}
                </div>
              )}

              {lastMode && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
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
                  Generate Template
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example prompts */}
      <div className="mt-4">
        <p className="text-xs text-muted mb-2.5 font-medium">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted border border-border hover:border-border-hover hover:text-foreground hover:bg-card-hover transition-all duration-200"
            >
              {example.length > 50 ? example.substring(0, 50) + "..." : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
