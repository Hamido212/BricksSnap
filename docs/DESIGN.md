# BricksSnap design

Two things share this document:

1. **The BricksSnap app**, a calm, light workbench where the templates are the focus.
2. **The templates it generates**, built on a design system that stays centrally editable in Bricks.

Written in the spirit of the [Refero styles](https://styles.refero.design/) DESIGN.md format: tokens, type, spacing, components, do's and don'ts. References studied: the Refero entries for Vercel (disciplined monochrome, hairline borders) and Apple (spacious, image-led, shadowless cards), and bricksbuilder.io (light zinc neutrals, one warm brand color, one sans family). Ideas are taken, not layouts or brand colors.

## 1. App UI: "light workbench"

**Philosophy.** A near-white canvas, ink typography and hairline borders. One warm accent marks the action that matters. Color on screen belongs to the templates being previewed, not to the chrome around them. There are no gradients, glows, glass effects or dark panels.

### Color

| Token | Hex | Role |
|---|---|---|
| canvas | `#fafaf9` | Page background |
| surface | `#ffffff` | Cards, panels, inputs |
| subtle | `#f5f5f4` | Hover fills, secondary bands, code blocks |
| border | `#e7e5e4` | 1px hairlines on cards, inputs and dividers |
| border-strong | `#d6d3d1` | Hovered borders, focused dividers |
| ink | `#1c1917` | Headings, primary text, filled neutral buttons |
| text | `#44403c` | Body copy |
| muted | `#78716c` | Captions, helper text, metadata |
| accent | `#c2410c` | Brick red: primary actions, active states, focus ring |
| accent-hover | `#9a3412` | Hovered primary action |
| accent-soft | `#fff4ed` | Selected chips, active tab background |
| success | `#15803d` | Confirmations |
| warning | `#b45309` | Non-blocking warnings |
| danger | `#b91c1c` | Errors, destructive confirmations |

The brick red is BricksSnap's own and deliberately not the Bricks yellow.

### Type

- **Families.** Geist for the interface; Geist Mono for JSON, IDs, digests and small uppercase labels.
- **Scale.**

  | Role | Size | Weight | Line height | Tracking |
  |---|---|---|---|---|
  | display | 44–56px | 600 | 1.05 | -0.03em |
  | h2 | 28px | 600 | 1.15 | -0.02em |
  | h3 | 18px | 600 | 1.3 | -0.01em |
  | body | 15px | 400 | 1.55 | normal |
  | small | 13px | 400 | 1.5 | normal |

- **Labels.** Mono labels are 11px, uppercase, tracked at 0.08em.
- **Weight.** Never above 600 in the interface.

### Shape and depth

- **Radius.** Controls 8px, cards 12px, template preview frames 12px, pills 999px.
- **Depth.** Hairline borders do the work; the only shadow is `0 1px 2px rgba(28,25,23,.06)` on floating menus.
- **Layout.** The page content is at most 1280px wide with a 16px mobile gutter. Sections are spaced 64–96px apart, related elements 12–16px.

### Components

- **Primary button.** Accent fill, white text, 8px radius, 36px height, 14px/500.
- **Secondary button.** White fill, ink text, 1px border, 8px radius. Ghost buttons have text only, with a subtle hover fill.
- **Tabs.** Text tabs with an ink underline for the active tab, not pills on dark tracks.
- **Chips.** 999px radius with a 1px border; the selected chip uses the accent-soft fill with accent text.
- **Template card.** A white frame with a 1px border and 12px radius. The live preview fills the top, and the name and section type sit below in 13px. On hover, the border turns border-strong; nothing lifts or glows.
- **Inputs.** 36px height, 1px border, 8px radius, and an accent focus ring (2px, offset 2px).

### Do / don't

- Do let previews carry the color. Do keep one primary action per view.
- Don't use gradients, glass, glows, dark mode chrome or more than one accent.

## 2. Templates: design system

Every generated section is built from **tokens → Bricks variables and palette → BEM global classes → elements**. Elements carry content and class references. Styling lives in the classes.

### Tokens and Bricks storage

| Group | Bricks storage | Names |
|---|---|---|
| Colors | Color palette "BricksSnap" (each color defines its CSS variable) | `--bs-primary`, `--bs-primary-hover`, `--bs-on-primary`, `--bs-primary-soft`, `--bs-primary-edge`, `--bs-link`, `--bs-accent`, `--bs-bg`, `--bs-surface`, `--bs-surface-alt`, `--bs-text`, `--bs-heading`, `--bs-muted`, `--bs-border`, `--bs-inverse`, `--bs-on-inverse` |
| Type | Global variables | `--bs-font-heading`, `--bs-font-body`, `--bs-heading-weight`, `--bs-heading-tracking`, `--bs-text-xs` … `--bs-text-display` |
| Space | Global variables | `--bs-space-xs` … `--bs-space-xl`, `--bs-space-section`, `--bs-container` |
| Shape | Global variables | `--bs-radius-s`, `--bs-radius-m`, `--bs-radius-l`, `--bs-radius-btn`, `--bs-shadow` |

Rules:

- **Fallbacks.** Every value is written as `var(--bs-token, <value>)`. A section pasted into a site without the design system looks exactly as previewed; once the variables are installed, changing one variable changes every section.
- **Units.** Sizes use px and `clamp()`, never rem: Bricks sets `html { font-size: 62.5% }`, so rem-based scales would shrink.
- **Fonts.** Bricks quotes the font-family control, which breaks `var()`. Font families therefore come from class custom CSS: `.bs-… { font-family: var(--bs-font-heading, "Fraunces", Georgia, serif) }`. Bricks keeps this as CSS, verified with `render-elements`.
- **Grid gaps.** Grids use `_gridGap` and flex layouts `_rowGap` and `_columnGap`; Bricks drops `_gap` on grid containers.
- **Shadows.** They use Bricks' object format (`{ values: {…}, color }`); the array format renders as `0 0 0 0 transparent` in Bricks 2.4.2.

### Class naming

BEM with the `bs-` prefix to avoid collisions: shared blocks (`bs-section`, `bs-container`, `bs-eyebrow`, `bs-title`, `bs-lead`, `bs-btn`, `bs-btn--primary`, `bs-card`, `bs-grid`) plus section blocks (`bs-hero`, `bs-hero__media`, `bs-pricing__plan--featured`, …). Variants are modifiers (`bs-hero--split`). Classes carry layout and style; elements carry text, links, images and class references only.

### Style directions

| Direction | Feel | Fonts (default) | Radius (card / button) | Eyebrow | Cards | Neutrals |
|---|---|---|---|---|---|---|
| **Klar** (clean) | Precise, quiet, product-like | Inter | 12px / 8px | Small caps in primary | 1px border, no shadow | slate |
| **Freundlich** (soft) | Approachable, rounded, airy | Plus Jakarta Sans | 20px / pill | Pill on primary-soft | Tinted fill, soft shadow | zinc |
| **Kräftig** (bold) | Confident, high contrast | Space Grotesk + Inter | 6px / 6px | Uppercase with rule | Border, dark bands for emphasis | zinc |
| **Elegant** (editorial) | Calm, typographic, serif | Fraunces + Inter | 2px / 0 | Italic serif | Top rule only | stone |
| **Warm** (local) | Trustworthy, grounded; trades and local services | Bitter + Source Sans 3 | 10px / 10px | Dot and text | Warm surface, border | stone |

**Customizable (brand kit):** style direction, primary color, optional accent, font pair (8 pairs plus system fonts without web fonts), radius (none to round), spacing (compact, normal, airy), light or dark.

**Quality checks (automatic):**

- **Contrast.** WCAG ratios for text, muted text and primary buttons against their backgrounds: 4.5 for body text, 3 for large text.
- **Structure.** One h1 per page and no skipped heading levels.
- **Content.** Images carry alt text, and placeholder links are listed.
