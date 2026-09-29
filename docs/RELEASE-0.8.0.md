# BricksSnap 0.8.0: Studio

**Good templates without AI, in your brand, with a design system.** Until now, BricksSnap's built-in templates had fixed looks and inline styles. 0.8.0 adds the Studio: modern layouts customized with a brand kit and your business details, and exported as Bricks JSON whose styling follows one central design system. The app itself moves to a calm, light interface where the templates carry the color.

## Studio

- **40 layouts.** They cover 22 section types: header, hero, services, benefits, steps, numbers, pricing, reviews, team, portfolio, timeline, about, FAQ, blog, logos, gallery, call to action, contact, footer, login, 404 and coming soon. There are three or four variants each for header, hero, services, pricing, reviews, call to action and footer.
- **Five style directions.** Clean, Soft, Bold, Editorial and Warm. Each sets fonts, corners, spacing, eyebrows, cards and neutrals.
- **Brand kit.** Brand color, optional second color, eight font pairs or system fonts, corners from none to round, compact to airy spacing, and light or dark. Colors derived from the brand color meet WCAG contrast. Remaining problems are named.
- **Industry copy.** Complete German and English sample texts for a Kfz-Zulassungsdienst, trades, a medical practice, a restaurant, an agency and a general business. Name, city, phone, email, address and your own services are written in.
- **Live preview.** Every layout renders in the gallery as you change the kit. The page builder previews the whole page at 1280, 820 and 390 px with Bricks' breakpoints.
- **Page builder.** Starter pages per industry. Swap each section's layout, reorder, add or remove sections, up to 16.
- **Quality checks.** Contrast, main heading count, heading order, alt texts, placeholder links and a note on sample photos.
- **Export.**
  - A Bricks import file (a lone header or footer as that template type).
  - A copy for pasting with Ctrl+V.
  - The page in Staging.
  - The design system as JSON or a CSS snippet.

## Design system

- **Structure.** Tokens become a Bricks color palette and global variables. Elements reference BEM global classes with the `bs-` prefix (`bs-section`, `bs-btn--primary`, `bs-card`, …) and stable IDs.
- **Fallbacks.** Every value is `var(--bs-token, value)`. Sections look the same on any site. With the design system installed, one variable changes every section.
- **Install on a connected site.** In Staging, the design system panel compares the kit with the site and, after confirmation, installs it:
  - a **BricksSnap** palette whose colors define `--bs-primary`, `--bs-bg`, … (18 colors);
  - 26 variables for fonts, type scale, spacing, container, radii and shadow color, in a **BricksSnap** category.
- **Safeguards.**
  - The server derives every value from the kit's choices. Each step is guarded by Bricks' ownership digests. Bricks keeps one design version for palettes and variables, so BricksSnap re-reads between steps and refuses if contents changed.
  - Nothing is deleted. Variables defined elsewhere are reported and left alone.
  - The result is read back. Installing again updates only what changed.

## Claude and MCP

- **Two new MCP tools.** `bricks_kit_options` and `bricks_kit_page` build Studio pages from Claude, ChatGPT or any MCP client.
- **Connect Claude with your plan.** The settings now show how to use Claude through MCP: Claude Code, Claude Desktop or a claude.ai custom connector. Anthropic does not allow third-party apps to offer a Claude sign-in.
- **Current models.** The Anthropic model list offers Claude Sonnet 5.5 (default), Opus 5.5 and Haiku 4.5; OpenRouter suggestions are updated.

## App

- **Light workbench.** The dark, gradient interface is replaced with a near-white canvas, hairline borders, Geist type and one brick-red accent, following [DESIGN.md](DESIGN.md). The Studio is the first tab.
- **Fonts.** The app's and the templates' fonts are self-hosted with `next/font`, so visitors' browsers never contact Google. Template fonts load only when a preview uses them.

See [Studio](STUDIO.md) for the guide and the [changelog](../CHANGELOG.md) for details.

## Verified

- **Layouts in Bricks.** The layouts were rendered by Bricks' `render-elements` on a Bricks 2.4.2 site. Every CSS value BricksSnap sets was then looked up in Bricks' output: 16,824 values, no problems.
- **Design system, live.** Tested on the same site through the browser.
  - The plan showed 18 colors and 26 variables to add.
  - The install was verified by read-back, and the frontend output `--bs-primary` and the font variables.
  - Changing the brand color updated exactly the six affected colors.
  - The first attempt uncovered Bricks' shared design version. Bricks refused safely, BricksSnap now re-reads between steps, and the retry resumed.
  - The palette, variables and category were removed afterwards; the site is as before.
- **App.** Every tab, the settings and the Studio were checked at 1440 px and 390 px without errors or horizontal overflow.
- **Automated.** 227 tests pass, among them:
  - contrast for all directions, both modes and difficult brand colors;
  - valid Bricks output and one class per CSS property for every layout;
  - copy for all industries in both languages, without placeholders or sample emails;
  - preview rendering and the new MCP tools;
  - a fake Bricks site that simulates palettes, variables, categories, ownership conflicts, the shared version and disabled abilities.

  The production build, TypeScript and ESLint pass.

## Boundaries

- **Fonts in Bricks.** Bricks loads web fonts from its own typography settings, not from fonts named only in variables. Add the kit's fonts under Bricks → Settings → Custom fonts or in a theme style, or the fallback system fonts are shown.
- **Sample content.** Texts and Unsplash photos are samples. Review the copy, and import or replace the photos before publishing. Some host firewalls block saving external image URLs.
- **Not yet.** Theme styles, deleting an installed design system from BricksSnap, and Studio layouts in the remote library.
