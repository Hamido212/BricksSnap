"use client";

import { useMemo } from "react";
import { BricksElement } from "@/lib/bricks-engine";

interface VisualPreviewProps {
  elements: BricksElement[];
}

/**
 * Renders a mini visual wireframe preview of the generated Bricks sections.
 * Draws simplified colored blocks representing each top-level section.
 */
export default function VisualPreview({ elements }: VisualPreviewProps) {
  const sections = useMemo(() => {
    if (!elements.length) return [];

    const byId = new Map(elements.map((el) => [el.id, el]));
    const topLevel = elements.filter((el) => el.parent === 0);

    return topLevel.map((section) => {
      const sectionLabel =
        section.label || section.settings?.label || section.name;
      const bg =
        (section.settings?._background as { color?: { hex?: string } })?.color
          ?.hex || null;
      const children = (section.children || [])
        .map((cid) => byId.get(cid))
        .filter(Boolean) as BricksElement[];

      // Count grandchildren for complexity estimation
      let grandchildCount = 0;
      for (const child of children) {
        grandchildCount += (child.children || []).length;
      }

      const complexity = grandchildCount > 12 ? "complex" : grandchildCount > 4 ? "medium" : "simple";

      return {
        id: section.id,
        label: typeof sectionLabel === "string" ? sectionLabel : section.name,
        bg,
        childCount: children.length,
        grandchildCount,
        complexity,
        name: section.name,
      };
    });
  }, [elements]);

  if (sections.length === 0) return null;

  const sectionIcon = (name: string) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("nav") || lower.includes("header")) return "☰";
    if (lower.includes("hero") || lower.includes("banner")) return "🏠";
    if (lower.includes("feature")) return "✦";
    if (lower.includes("service")) return "💼";
    if (lower.includes("pricing") || lower.includes("price")) return "💰";
    if (lower.includes("testimonial") || lower.includes("review")) return "💬";
    if (lower.includes("team")) return "👥";
    if (lower.includes("portfolio") || lower.includes("project")) return "📁";
    if (lower.includes("gallery")) return "🖼";
    if (lower.includes("stat") || lower.includes("counter")) return "📊";
    if (lower.includes("step") || lower.includes("process")) return "🔢";
    if (lower.includes("faq") || lower.includes("question")) return "❓";
    if (lower.includes("blog") || lower.includes("news")) return "📝";
    if (lower.includes("logo") || lower.includes("partner")) return "🏆";
    if (lower.includes("cta") || lower.includes("call")) return "📣";
    if (lower.includes("contact") || lower.includes("form")) return "✉";
    if (lower.includes("timeline")) return "📅";
    if (lower.includes("content") || lower.includes("about")) return "📄";
    if (lower.includes("footer")) return "▬";
    if (lower.includes("login") || lower.includes("auth")) return "🔒";
    if (lower.includes("404") || lower.includes("error")) return "⚠";
    if (lower.includes("coming")) return "⏳";
    return "▪";
  };

  const complexityBars = (complexity: string) => {
    const count = complexity === "complex" ? 3 : complexity === "medium" ? 2 : 1;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 h-2.5 rounded-full ${
              i <= count ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <h3 className="text-xs font-semibold text-foreground ml-2">
            Visual Preview
          </h3>
        </div>
        <span className="text-[10px] text-muted">
          {sections.length} sections · {elements.length} elements
        </span>
      </div>

      {/* Mini browser frame */}
      <div className="p-4">
        <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
          {/* Browser address bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-card">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-muted/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted/30" />
            </div>
            <div className="flex-1 h-4 rounded bg-border/50 mx-2" />
          </div>

          {/* Section wireframes */}
          <div className="space-y-[2px]">
            {sections.map((section, i) => {
              const bgColor = section.bg || undefined;
              const isNav = section.label?.toLowerCase().includes("nav") || section.label?.toLowerCase().includes("header");
              const isHero = section.label?.toLowerCase().includes("hero") || section.label?.toLowerCase().includes("banner");
              const isFooter = section.label?.toLowerCase().includes("footer");

              return (
                <div
                  key={section.id}
                  className="group relative transition-all hover:ring-1 hover:ring-primary/30 hover:z-10"
                  style={{
                    backgroundColor: bgColor
                      ? `${bgColor}33`
                      : i % 2 === 0
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Wireframe representation */}
                  <div
                    className={`px-3 flex items-center gap-2 ${
                      isNav ? "py-2" : isHero ? "py-6" : isFooter ? "py-3" : "py-4"
                    }`}
                  >
                    <span className="text-xs opacity-70 w-5 text-center flex-shrink-0">
                      {sectionIcon(section.label)}
                    </span>

                    {/* Wireframe blocks */}
                    <div className="flex-1 min-w-0">
                      {isNav ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 rounded bg-primary/30" />
                          <div className="flex-1" />
                          <div className="flex gap-1.5">
                            {[1, 2, 3].map((n) => (
                              <div key={n} className="w-6 h-1.5 rounded bg-muted/20" />
                            ))}
                          </div>
                          <div className="w-10 h-3 rounded bg-primary/40" />
                        </div>
                      ) : isHero ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-3/4 h-2.5 rounded bg-foreground/15" />
                          <div className="w-1/2 h-1.5 rounded bg-muted/15" />
                          <div className="flex gap-1.5 mt-1">
                            <div className="w-12 h-3 rounded bg-primary/40" />
                            <div className="w-10 h-3 rounded-sm border border-muted/20" />
                          </div>
                        </div>
                      ) : isFooter ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-1.5 rounded bg-muted/20" />
                          <div className="flex-1" />
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex flex-col gap-0.5">
                              <div className="w-5 h-1 rounded bg-muted/15" />
                              <div className="w-4 h-0.5 rounded bg-muted/10" />
                            </div>
                          ))}
                        </div>
                      ) : section.complexity === "complex" ? (
                        <div className="grid grid-cols-3 gap-1">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="flex flex-col gap-0.5 p-1 rounded bg-muted/5 border border-muted/5">
                              <div className="w-full h-1.5 rounded bg-muted/15" />
                              <div className="w-2/3 h-1 rounded bg-muted/10" />
                            </div>
                          ))}
                        </div>
                      ) : section.complexity === "medium" ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-1/3 h-2 rounded bg-foreground/12" />
                          <div className="flex gap-1.5 w-full justify-center">
                            {[1, 2].map((n) => (
                              <div key={n} className="w-1/4 h-2 rounded bg-muted/10 border border-muted/5 p-0.5">
                                <div className="w-full h-full rounded bg-muted/10" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2/5 h-2 rounded bg-foreground/12" />
                          <div className="w-1/3 h-1 rounded bg-muted/10" />
                        </div>
                      )}
                    </div>

                    {/* Section meta on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 flex-shrink-0">
                      {complexityBars(section.complexity)}
                    </div>
                  </div>

                  {/* Hover label */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                      {section.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section legend */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 text-[10px] text-muted"
            >
              <span>{sectionIcon(s.label)}</span>
              <span className="capitalize">{s.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
