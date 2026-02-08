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
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-border-hover hover:shadow-lg hover:shadow-primary-glow hover:-translate-y-1 text-left"
    >
      {/* Preview gradient */}
      <div
        className="h-36 w-full relative overflow-hidden"
        style={{ background: template.preview }}
      >
        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-3 gap-2 p-4 h-full">
            <div className="bg-white/20 rounded" />
            <div className="bg-white/10 rounded col-span-2" />
            <div className="bg-white/10 rounded col-span-2" />
            <div className="bg-white/20 rounded" />
          </div>
        </div>
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/30 backdrop-blur-sm text-white/90 uppercase tracking-wider">
            {template.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {template.name}
        </h3>
        <p className="text-xs text-muted leading-relaxed line-clamp-2">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-border text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-lg">
          Generate Template
        </span>
      </div>
    </button>
  );
}
