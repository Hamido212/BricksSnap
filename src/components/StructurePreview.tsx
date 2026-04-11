"use client";

import { BricksElement } from "@/lib/bricks-engine";

interface StructurePreviewProps {
  elements: BricksElement[];
}

function buildTree(elements: BricksElement[]): Map<string | 0, BricksElement[]> {
  const tree = new Map<string | 0, BricksElement[]>();
  for (const el of elements) {
    const parentKey = el.parent;
    if (!tree.has(parentKey)) tree.set(parentKey, []);
    tree.get(parentKey)!.push(el);
  }
  return tree;
}

const ELEMENT_COLORS: Record<string, string> = {
  section: "#3b82f6",
  container: "#8b5cf6",
  block: "#6366f1",
  div: "#6366f1",
  heading: "#f59e0b",
  "text-basic": "#10b981",
  text: "#10b981",
  image: "#ec4899",
  button: "#f97316",
  form: "#06b6d4",
  icon: "#a855f7",
  video: "#ef4444",
};

const ELEMENT_ICONS: Record<string, string> = {
  section: "S",
  container: "C",
  block: "B",
  div: "D",
  heading: "H",
  "text-basic": "T",
  text: "T",
  image: "I",
  button: "Bt",
  form: "F",
  icon: "Ic",
  video: "V",
};

/**
 * Strip HTML tags to produce a plain-text label.
 * Uses DOMParser (proper HTML parser) instead of a regex, which avoids
 * incomplete multi-character sanitization issues flagged by CodeQL.
 * The result is only used as displayed text (never as innerHTML),
 * so it's safe to use for labels.
 */
function stripHtmlToText(input: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // SSR fallback – still used only for display, never innerHTML.
    // Repeatedly strip until no change, to handle nested/partial tags.
    let prev = "";
    let current = input;
    while (prev !== current) {
      prev = current;
      current = current.replace(/<[^<>]*>/g, "");
    }
    return current;
  }
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.body.textContent ?? "";
}

function TreeNode({
  element,
  tree,
  depth = 0,
}: {
  element: BricksElement;
  tree: Map<string | 0, BricksElement[]>;
  depth?: number;
}) {
  const children = tree.get(element.id) || [];
  const color = ELEMENT_COLORS[element.name] || "#71717a";
  const icon = ELEMENT_ICONS[element.name] || element.name.charAt(0).toUpperCase();
  const label =
    element.label ||
    (element.settings?.text
      ? stripHtmlToText(String(element.settings.text)).substring(0, 30)
      : element.name);

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-card-hover transition-colors group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {children.length > 0 && (
          <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {children.length === 0 && <div className="w-3" />}
        <span
          className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </span>
        <span className="text-xs text-foreground/80 truncate max-w-[200px]">
          {label}
        </span>
        <span className="text-[10px] text-muted font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {element.id}
        </span>
      </div>
      {children.map((child) => (
        <TreeNode key={child.id} element={child} tree={tree} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function StructurePreview({ elements }: StructurePreviewProps) {
  const tree = buildTree(elements);
  const rootElements = tree.get(0) || [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-[#111113] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span className="text-xs font-medium text-muted">Element Structure</span>
        </div>
        <span className="text-[10px] text-muted">
          {elements.length} elements
        </span>
      </div>
      <div className="max-h-[400px] overflow-auto p-2">
        {rootElements.map((el) => (
          <TreeNode key={el.id} element={el} tree={tree} />
        ))}
      </div>
      {/* Legend */}
      <div className="px-4 py-2 border-t border-border bg-[#111113] flex flex-wrap gap-3">
        {Object.entries(ELEMENT_COLORS)
          .slice(0, 6)
          .map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted capitalize">{name}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
