# Import & Modernize: bring any section onto your design system

The **Modernize** tab takes Bricks JSON you already have and rebuilds it on BricksSnap's design system. Sources include a section copied from a client site, an old project or a template you own. Afterwards the brand kit restyles it like any Studio layout: color, fonts, corners, spacing and dark mode.

It runs in your browser. Nothing is uploaded and nothing is fetched from other sites: you bring the JSON.

## What it changes

| Before | After |
|---|---|
| Fixed colors (`#7c3aed`, `rgba(…)`) | Design tokens by role: section and card backgrounds, headings, text, muted text, borders, buttons, icons, shadows. Alpha stays as `color-mix(in srgb, var(--bs-…) N%, transparent)`. |
| Font sizes in px or rem | The kit's type scale (`--bs-text-s` … `--bs-text-display`), fluid with `clamp()` |
| Spacing and corners | The kit's spacing and radius tokens (`--bs-space-*`, `--bs-radius-*`, `--bs-radius-btn`), sections on `--bs-space-section` and `--bs-gutter` |
| The same inline styles on many elements | One global class per role, `bs-<block>-<role>`, shared by every element that looked the same |
| Source classes (for example `feature-card`) | Merged into the new classes; the element keeps its own overrides |
| Font families | The kit's heading and body fonts |
| Framework variables (Automatic CSS, Core Framework) | Mapped by name to BricksSnap tokens where the meaning is clear; unknown ones are kept and listed |
| Custom CSS with `%root%`, `#brxe-…` or old class names | Rewritten to the new class; colors and sizes inside mapped like the controls |

**Brand colors.** Modernize detects the source's brand colors: saturated mid-tone colors, weighted by how often they are used. They become `primary` and `accent`, so your kit's brand color replaces them everywhere. Tints and near-whites are not mistaken for the brand.

**Buttons.** Bricks button presets (style, size, outline) become explicit, token-based buttons: the primary fill with readable text, outlines with the kit's border color, and the kit's button radius.

## Mobile rules it adds

Many library sections were built for desktop only. Modernize adds what is missing and lists each rule in the report:

- **Sections:** vertical rhythm from `--bs-space-section` and side gutters when they have none.
- **Containers:** full width up to the kit's container width.
- **Grids:** with three or more columns, two columns on tablets; one column on phones.
- **Button rows:** wrap, and stack at full width on phones.
- **Rows of cards or blocks:** stack on phones.
- **Stacks without gaps:** spacing from the kit.
- **Fixed widths over 480 px:** become a maximum width, so they shrink on small screens.

## How to use it

1. **Paste Bricks JSON** or **Import JSON file** (up to 2 MB). Bricks' clipboard format, template exports and plain element arrays work. **Load example** shows a feature section written the way many libraries ship them.
2. Optionally set the **class prefix**, for example `features` for `bs-features-card`. By default it comes from the section's label or first heading.
3. Set the brand kit on the left. It starts with your Studio kit.
4. Compare **After**, **Before** or **Side by side** at desktop, tablet and phone width.
5. Read **What changed**:
   - colors and the token each became;
   - font sizes;
   - spacing and radii;
   - created classes;
   - mobile rules;
   - warnings;
   - quality checks.
6. **Take it to Bricks:** download the import file, copy it for Ctrl+V, or **Open in Staging** to compare it against a page on your site, save it there and install the design system.

## Limits

- **Images** keep their source URLs. Replace them or import them into the media library (Staging → Before saving).
- **Framework utility classes without styles in the file** (for example Automatic CSS utilities) are listed. Their look is not in the JSON, so it cannot be carried over.
- **Unknown variables** stay as they are. Define them on the site or replace them.
- **Interactions, queries and dynamic data** are kept, not modernized.
- Always review the result in Bricks before publishing.

## Only import what you may use

Modernize changes the design, not the rights. Use it on JSON you created, received from a client, or licensed. Do not use it to repackage other people's templates. Free libraries such as BricksBoard or DigiSavvy's templates have their own terms.

## From MCP clients

**`bricks_modernize_template`** takes:

- `json`: the Bricks JSON as a string, up to 2 MB;
- optionally `kit`, `block` (the class prefix) and `title`.

It returns:

- the modernized template;
- the design system;
- the report;
- the quality checks.

For example: "Modernize this Bricks section with BricksSnap in the Soft style with my brand color #0f766e and give me the JSON."
