"use client";

import { useState, FormEvent } from "react";

interface GeneratorFormProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "Modern SaaS landing page with hero, features, pricing, and footer",
  "Dark tech startup website with gradient hero section",
  "Restaurant website with menu, reservations, and testimonials",
  "Digital agency portfolio with split hero and contact form",
  "E-Commerce shop landing page with product features",
  "Fitness studio website with training plans and pricing",
  "Real estate agency with property listings and contact",
  "Freelancer portfolio with services and pricing section",
];

export default function GeneratorForm({ onGenerate, isLoading }: GeneratorFormProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim());
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
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Supports German & English descriptions</span>
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
