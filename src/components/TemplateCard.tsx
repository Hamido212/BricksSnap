"use client";

import { TemplateDefinition } from "@/lib/templates";

interface TemplateCardProps {
  template: TemplateDefinition;
  onSelect: (template: TemplateDefinition) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-border-hover"
    >
      <div className="relative h-32 w-full border-b border-border" style={{ background: template.preview }}>
        <span className="absolute left-3 top-3 rounded-md bg-card/90 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-text">
          {template.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-sm font-medium text-foreground">{template.name}</h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">{template.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">{tag}</span>
            ))}
          </div>
          <span className="shrink-0 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Use →</span>
        </div>
      </div>
    </button>
  );
}
