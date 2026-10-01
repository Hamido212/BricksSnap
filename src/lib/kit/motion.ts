import type { ClassLibrary, KitNode } from "./build";
import type { SectionType } from "./sections";

/** Section types whose content fades in. Headers, heroes, footers and single-purpose pages stay still: they are on screen at once. */
const ANIMATED: ReadonlySet<SectionType> = new Set(["services", "features", "steps", "stats", "pricing", "testimonials", "team", "portfolio", "timeline", "content", "faq", "blog", "logos", "gallery", "cta", "contact"]);

/** Blocks that enter as one: intros, cards, list items, images. */
const TARGETS = new Set([
  "bs-intro", "bs-intro--center", "bs-card", "bs-plan", "bs-plan-row", "bs-photo-card", "bs-post", "bs-post-row", "bs-post-line", "bs-work", "bs-work-row", "bs-work-tile",
  "bs-member", "bs-member-row", "bs-team-card", "bs-quote-feature", "bs-icon-item", "bs-num-item", "bs-vstep", "bs-hstep", "bs-stat", "bs-htimeline__item", "bs-timeline__item",
  "bs-faq__item", "bs-svc-row", "bs-row", "bs-menu__row", "bs-media", "bs-gallery__item", "bs-gbento__cell", "bs-masonry__img", "bs-offer", "bs-cta-box", "bs-cta-card", "bs-cta-lines", "bs-form-card",
]);

/** Bricks' own widgets show and hide their children; their content is not animated. */
const SKIP = new Set(["tabs-nested", "accordion-nested", "slider-nested", "nav-nested", "form"]);

let counter = 0;
const interactionId = () => (++counter).toString(36).padStart(6, "0").slice(-6);

/**
 * "Subtle" motion: matching blocks fade up once as they scroll into view, siblings slightly
 * staggered. Uses Bricks interactions (enterView → startAnimation), which hide the element until
 * it animates; bs-motion keeps it visible and still for visitors who prefer reduced motion.
 */
export function addMotion(root: KitNode, type: SectionType): KitNode {
  if (!ANIMATED.has(type)) return root;
  const visit = (node: KitNode, index: number): KitNode => {
    if (SKIP.has(node.name)) return node;
    const target = (node.classes ?? []).some(c => TARGETS.has(c));
    const children = target ? node.children : node.children?.map((child, i) => visit(child, i));
    if (!target) return { ...node, children };
    return {
      ...node,
      classes: [...(node.classes ?? []), "bs-motion"],
      settings: {
        ...(node.settings ?? {}),
        _interactions: [{ id: interactionId(), trigger: "enterView", action: "startAnimation", target: "self", animationType: "fadeInUp", animationDuration: "0.7s", animationDelay: `${Math.min(index, 3) * 0.08}s`, runOnce: true }],
      },
    };
  };
  return visit(root, 0);
}

export function motionClasses(): ClassLibrary {
  return {
    "bs-motion": { _cssCustom: "@media (prefers-reduced-motion: reduce) {\n  .bs-motion { opacity: 1 !important; visibility: visible !important; animation: none !important; }\n}" },
  };
}
