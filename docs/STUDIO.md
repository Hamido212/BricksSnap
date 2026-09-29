# Studio: layouts, brand kit and design system

The Studio is BricksSnap's first tab. It builds modern sections and pages without AI. You pick layouts, set your brand, describe the business, and export native Bricks JSON. The styling lives in global classes that follow one central design system.

## Library

The **Library** tab shows 13 ready-made designs: a brand kit, an industry and a page, chosen to work as they are. Filter them by industry and style and switch the sample text between German and English. Open a design to see the whole page at desktop, tablet and phone width and all of its sections. Download or copy the page or single sections, or **Customize in Studio** to continue from it. The same designs are available in Bricks through the [remote library](REMOTE-LIBRARY.md).

## 1. Brand kit

The panel on the left sets how every layout looks. All previews update live.

- **Style direction.** Choose one of five directions. The choice sets fonts, corners, spacing, eyebrow style, cards and neutrals; everything stays adjustable afterwards.

  | Direction | Feel | Default fonts |
  |---|---|---|
  | Clean | Precise and quiet, hairline borders | Inter |
  | Soft | Rounded, airy, approachable | Plus Jakarta Sans |
  | Bold | High contrast, large type | Space Grotesk + Inter |
  | Editorial | Serif headings, generous whitespace | Fraunces + Inter |
  | Warm | Grounded; for trades and local businesses | Bitter + Source Sans 3 |

- **Brand color.** Pick any color. Button text, hover and edge colors are derived so that they meet WCAG contrast; remaining problems are named under the color field.
- **Second color.** An optional highlight color.
- **Fonts.** Eight Google font pairs, or system fonts without web fonts.
- **Corners, spacing, mode.** Corners from none to round; spacing compact, normal or airy; light or dark.

## 2. Business

- **Industry.** Kfz-Zulassungsdienst, trades, medical practice, dental practice, restaurant, agency or general business. Each industry comes with complete sample copy for every section type.
- **Sample text language.** German or English.
- **Your details.** Name, city, phone, email, address and up to six services are written into the copy. Phone numbers become `tel:` links, and your services replace the sample services in order.

The texts are templates: read and adjust them before publishing. Nothing leaves the browser; the Studio runs locally in the page. The browser remembers the last kit, profile and page.

## 3. Sections

The **Sections** view shows all 40 layouts in 22 section types, grouped by type and rendered live at 1280 px. The section types are header, hero, services, benefits, steps, numbers, pricing, reviews, team, portfolio, timeline, about, FAQ, blog, logos, gallery, call to action, contact, footer, login, 404 and coming soon.

- **Copy.** Copies a single section. Paste it in the Bricks editor with Ctrl+V.
- **Add to page.** Adds the section to your page. A header goes first, a footer last, and anything else goes before the footer.

## 4. Your page

- **Build the page.** Each industry starts with a sensible page. You can change each section's layout, move sections up or down, remove them, or reset to the starter page. A page holds up to 16 sections.
- **Preview.** See the whole page at desktop (1280 px), tablet (820 px) and phone (390 px) widths. The preview uses the same breakpoints as Bricks.
- **Quality checks.** The Studio checks contrast, the number of main headings, skipped heading levels, alt texts and links that still point to `#`, and it notes sample photos.
- **Export.**
  - **Download for Bricks import.** The file imports under Templates → Import. A header or footer alone is exported as that template type, several sections as a page.
  - **Copy for Bricks (Ctrl+V).** Pastes the page into the editor.
  - **Open in Staging.** Loads the page as a new section or version, to review it against a page of a connected site, save it there, or install the design system.

## How the output is built

**tokens → Bricks palette and variables → BEM global classes → elements**

- **Global classes.** Styling lives in global classes with the `bs-` prefix (`bs-section`, `bs-btn--primary`, `bs-card`, …). Elements carry content and class references only. Each class has a stable ID, so the same class from two exports stays one class.
- **Fallbacks.** Every value is written as `var(--bs-token, value)`. A section therefore looks the same on any site, even without the design system.
- **Central editing.** Once the design system is installed, changing `--bs-primary` or `--bs-space-section` in Bricks changes every section.
- **Sample photos.** Photos come from Unsplash. Import them into the media library before saving (Staging → Before saving), or replace them with your own.

For the token list and design rules, see [DESIGN.md](DESIGN.md).

## Install the design system on a site

In **Staging**, after **Open in Staging** and connecting a site (see [WordPress](WORDPRESS.md)), the **Design system** panel shows the kit's colors.

1. **Check what changes** compares the kit with the site without writing anything. It shows colors and variables to add or update and the ones already matching.
2. After confirming, **Install design system** adds:
   - a color palette named **BricksSnap**, whose 18 colors define `--bs-primary`, `--bs-bg`, `--bs-text`, …;
   - 26 global variables for fonts, type scale, spacing, container width, corner radii and shadow color, in a **BricksSnap** category.
3. Installing again with a changed kit updates only what changed.

**Safeguards.** Every write is guarded by Bricks' ownership digests and re-checked after each step, and nothing is deleted. A variable that another palette or variable already defines is reported and left alone. The result is read back and marked verified.

**Needed abilities.** Enable `list-global-variables`, `create-color-palette`, `create-color`, `update-color`, `set-global-variable-categories` and `set-global-variables` under Bricks → AI → Abilities. Undo and uninstall also need `delete-global-variable`, `delete-color` and `delete-color-palette`.

### Manifest, undo and uninstall

Since 0.10 an install is not a one-way street.

- **Manifest.** Each install writes the variable `--bs-manifest` into the BricksSnap category, in the same step as the other variables. It names the design, the kit, the BricksSnap version, the time, and the palette, category, colors and variables the install owns. You can read it in Bricks' variable manager. It is only rewritten when the install actually changes.
- **Snapshot.** Before the first write, BricksSnap records the value every color and variable had and the value it writes. Bricks keeps no revisions of palettes and variables, so this snapshot is the way back. It is also returned when a write fails halfway: the panel then offers to finish the install (check again) or to undo what was written.
- **Undo this install.** In **Undo or uninstall the design system**, the last install from this browser can be undone, also after a reload. Replaced values are set back, added colors, variables, the palette and the category are removed. Values edited in Bricks after the install are listed and kept.
- **Uninstall.** Removes the BricksSnap palette, its variables, the manifest and the category after a preview. Values that differ from what the manifest's kit installs count as edited: they are listed and kept unless you tick **Remove these too**. Without a manifest (installs before 0.10) everything in the BricksSnap palette and category counts as BricksSnap's.
- **Classes stay.** `bs-` global classes are not removed: pages use them. Every value in them is `var(--bs-…, fallback)`, so pages keep their look without the variables.
- **Guarded.** Undo and uninstall use the same ownership checks as the install, re-read after each step and verify the result.

**Fonts.** Bricks loads web fonts it finds in its own typography settings, not fonts named only inside variables. After installing, add the kit's fonts under **Bricks → Settings → Custom fonts** or in a theme style. Otherwise visitors see the fallback system fonts.

**Without a connection.** **Copy CSS variables** in the Studio's export gives the same values as a `:root { … }` block for Bricks → Settings → Custom code. **Download design system** saves the kit, palette and variables as JSON.

## From Claude, ChatGPT and other MCP clients

The MCP server offers two Studio tools:

- **`bricks_kit_options`** lists style directions, font pairs, industries and every section type with its layouts.
- **`bricks_kit_page`** builds sections or a page. It takes `sections` (type and optional `variant`), an optional `kit` (style, primary, accent, fonts, radius, spacing, mode) and an optional `profile` (industry, language, name, city, phone, email, address, tagline, services). It returns the Bricks import object, the design system and the quality checks.

For example: "Use BricksSnap to build a homepage for a vehicle registration service in Bremen in the Warm style with a green brand color, in German, and give me the Bricks JSON."
