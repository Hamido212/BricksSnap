# Changelog

## 0.8.0 — 2026-09-29

The Studio: modern layouts customized with a brand kit and industry copy, exported with a central design system, plus a light redesign of the app. See the [release notes](docs/RELEASE-0.8.0.md) and the [Studio guide](docs/STUDIO.md).

- **Studio tab (default).**
  - 40 layouts in 22 section types, grouped in a live gallery; copy a section or add it to the page.
  - Five style directions (Clean, Soft, Bold, Editorial, Warm) and a brand kit: brand and second color, eight font pairs or system fonts, corners, spacing, light or dark. Derived colors meet WCAG contrast; remaining problems are named.
  - Industry profiles (Kfz-Zulassungsdienst, trades, medical practice, restaurant, agency, business) with complete German and English copy, filled with name, city, phone, email, address and own services.
  - Page builder with starter pages per industry, layout switching, reordering and a 1280/820/390 px preview in shadow DOM with Bricks' breakpoints.
  - Quality checks for contrast, headings, alt texts and placeholder links.
  - Export as a Bricks import file, a Ctrl+V copy, to Staging, or the design system as JSON or CSS.
- **Template kit engine.**
  - Tokens → Bricks palette and global variables → BEM global classes (`bs-` prefix, stable IDs) → elements.
  - Every value is `var(--bs-token, fallback)`, and each CSS property is set by one class per element.
  - Font families come from class custom CSS because Bricks quotes its font control. Grid gaps use `_gridGap`, and shadows use Bricks' object format.
- **Install the design system.** Staging compares the kit's palette and variables with a connected site and installs them after confirmation:
  - a "BricksSnap" palette defining `--bs-*` and 26 variables in a "BricksSnap" category, with values derived on the server;
  - every step guarded by ownership digests, re-read between steps because Bricks shares one design version, and read back afterwards;
  - nothing deleted, and variables defined elsewhere reported.
- **MCP.** New tools `bricks_kit_options` and `bricks_kit_page` (ten tools in total).
- **Claude.** The settings explain connecting Claude through MCP (Claude Code, Claude Desktop, claude.ai connector), because third-party Claude sign-in is not allowed. The Anthropic models are now Claude Sonnet 5.5 (default), Opus 5.5 and Haiku 4.5, and the OpenRouter suggestions are updated.
- **Redesign.** A light workbench replaces the dark gradient interface in every tab and panel: near-white canvas, hairline borders, Geist and Geist Mono, one brick-red accent ([DESIGN.md](docs/DESIGN.md)). App and template fonts are self-hosted with `next/font`.

## 0.7.0 — 2026-09-29

Work in the connected site's design, media, global classes and templates; fix font stacks in the engine. See the [release notes](docs/RELEASE-0.7.0.md).

- **Import images into the media library.** Before applying, external images in a reviewed change can be copied into the site's media library (`upload-media`). BricksSnap downloads each image itself (HTTPS, public addresses, image types, 8 MB, 30 images) and uploads it as data, so the save request carries no external URL. Re-imports reuse earlier uploads.
- **Generate in the site's design.** Built-in sections in the connected site's colors and fonts.
  - Colors come from the site's palettes and from the colors the loaded page uses, suggested per role and adjustable.
  - Palette colors can be linked to their CSS variables with the hex as fallback.
  - The page's font stack, the site's typography or BricksSnap's default font can be chosen.
  - The MCP tools `bricks_generate_section` and `bricks_assemble_page` accept role `colors`.
- **Create missing global classes.** Before applying, global classes a change uses but the site lacks can be created from the change's definitions in one atomic `batch-create-global-classes` write, guarded by the class store's ownership digest. Existing classes are never changed: an identical class under the same name is reused, a different one is reported. Apply now names missing classes instead of IDs.
- **Site templates.** A template list (type, status, conditions) under the connection. Templates load into the baseline like pages and save back through the same guarded apply, read-back and restore; headers and footers use their own area.
- **Template conditions.** View and edit where a template applies: entire website, front page, post types, archives, search, 404, terms and specific posts, with exclusions and hooks for section templates. Saving re-reads the stored conditions first and refuses if they changed; conditions with unknown settings stay read-only.
- **Save as a new Bricks template.** A reviewed change becomes a new header, footer, section or other template, as a draft unless publishing is chosen, and then serves as the baseline. Missing global classes are refused as for apply; nested header/footer landmarks are flagged.
- **Before saving.** Image import and class creation form their own step, used by both apply and template creation.
- **Host firewall hints.** When the web host answers with its own error page, apply, template creation and "Render with Bricks" now name external URLs and email addresses in the change. The test host's firewall blocked requests containing either.
- **Form placeholders (engine).** Email fields use "Your email address" instead of sample addresses, so the coming-soon and contact forms no longer trip such firewalls.
- **Font stacks (engine).** Font stacks are written as Bricks' font family plus its native `fallback` (`font-family: "Segoe UI", Arial, sans-serif`), including breakpoint and state typography. Previously the stack went into scoped custom CSS, which Bricks' abilities convert into a single quoted font name that browsers cannot match.

## 0.6.0 — 2026-09-29

Distribute the catalog to Bricks sites and document AI client setups.

- **Remote library.** Every BricksSnap deployment is a Bricks remote template source.
  - `GET /wp-json/bricks/v1/get-templates-data?site=…` and `get-templates` return the 60 catalog templates in the legacy Bricks response shape, captured from a Bricks 2.4.2 source.
  - Templates carry stable numeric IDs, categories as bundles, tags, section/content/header/footer types and SVG thumbnails.
  - `remote-library/*` answers `rest_no_route`, so Bricks 2.4 falls back to the legacy protocol.
- **Access rules.** The requesting site is required (`no_site_url`). An origin whitelist and a password are optional (`BRICKSSNAP_REMOTE_LIBRARY_WHITELIST`, `BRICKSSNAP_REMOTE_LIBRARY_PASSWORD`), and `BRICKSSNAP_REMOTE_LIBRARY=false` disables the library.
- **Docs.** [Remote library](docs/REMOTE-LIBRARY.md) (setup, protocol, hosting notes) and [AI clients](docs/CLIENTS.md): BricksSnap's MCP server alongside a site's Bricks abilities in Claude Code, Codex and other clients, with safe defaults and guarded digest-based workflows.

Verified end to end on a live Bricks 2.4.2 site using the public deployment as source: all 60 templates listed, one template inserted into a draft page (83 elements, revision created), page restored.

## 0.5.0 — 2026-09-28

Review a change as Bricks renders it, save it to the connected page with Bricks' atomic conflict check, and restore the previous version.

- **Rendered preview.** "Render with Bricks" has the site render the saved page and the reviewed version (`render-elements`, read-only).
  - The two versions show side by side at 1280 px and 390 px in script-less sandboxed frames.
  - Added and changed elements are outlined.
- **Guarded apply.** "Apply to WordPress" needs explicit confirmation.
  - **Checks before saving:** `set-page-elements` is enabled, the page is not open in the builder (override possible), the digest is still fresh, and the global classes the change uses exist.
  - **Saving:** `set-page-elements` with `expectedDocumentDigest`. Bricks rejects stale writes atomically (`bricks_conflict_document_digest_mismatch`) and keeps a revision first.
- **Verification.** The page is read back and compared with the reviewed version, naming the setting keys Bricks normalized (for example custom CSS converted into native controls). The read-back becomes the new baseline.
- **Restore.** "Restore previous version" uses `restore-revision`, only while the page still has the applied digest. Bricks keeps a revision of the replaced state.
- **Robustness.**
  - Bricks' empty settings (`[]` from PHP) are read correctly.
  - A host page served instead of an MCP response (firewall, throttling, maintenance) is reported as a blocked request, and external URLs in the change are named.
- **Docs.** The [connection guide](docs/WORDPRESS.md) and [research](docs/RESEARCH-2026-09-28-BRICKS-MCP.md) record the live-verified write, revision and firewall behavior.

Verified on a draft page of a live Bricks 2.4.2 site:
- apply, stale-digest rejection by BricksSnap and by Bricks itself, and restore to the exact previous digest;
- the host firewall blocking external image URLs;
- the UI flow at 1440 px and 390 px.

## 0.4.0 — 2026-09-28

Read a connected Bricks site and use a live page as the staging baseline. The connection is local-only and read-only.

- **Connection.** Connect a Bricks 2.4+ site through the official WordPress MCP Adapter with an application password; the route is available only in `npm run dev:local`.
  - Reports the Bricks, WordPress and abilities versions and any missing abilities.
  - Every request ends its adapter session.
- **Page search and import.** Lists recent Bricks pages and templates and filters them by title; shows when a page is open in the builder.
  - Imports a page's element tree with Bricks' document digest, title, page settings and the site's definitions of referenced global classes.
- **Design import.** Loads global classes and palette colors from the paginated list abilities, ignoring Bricks' default palette.
  - Review then warns about class name/ID collisions, changed class definitions and undefined class references.
- **Ability calls follow the live schemas.**
  - Arguments are sent under the names each ability declares (all Bricks schemas reject unknown keys).
  - Dispatcher `{ success, data }` envelopes and direct-tool payloads are both read.
  - Disabled abilities are reported instead of assumed available.
- **Transport.** HTTPS with pinned DNS, public addresses and port 443 by default. `BRICKSSNAP_ALLOW_PRIVATE_WORDPRESS=true` allows local/staging hosts and custom ports. The `?rest_route=` endpoint form is accepted. Redirects are not followed with credentials; responses are capped at 3 MB.
- **Staging fixes.** A stale "insert after" choice no longer survives a baseline replacement; the page picker fits narrow screens.
- **Fixture capture.** `scripts/capture-wordpress-fixtures.mjs` records read-only ability responses (only abilities annotated read-only are executed) for refreshing test fixtures.
- **Docs.** Added the [WordPress connection guide](docs/WORDPRESS.md) and the [research on Bricks AI abilities, the MCP Adapter and the Abilities API](docs/RESEARCH-2026-09-28-BRICKS-MCP.md), including abilities verified on a live site that the documentation omits.

Verified against a live Bricks 2.4.2 / WordPress 7.1.2 / MCP Adapter 0.6.1 site, including a Chromium run of the Staging flow at 1440 px and 390 px. This release does not write to WordPress.

## 0.3.0 — 2026-09-28

Add a Staging workspace for combining an existing Bricks export with new sections and reviewing structural differences before downloading a complete template.

- Insert at the beginning, end or after a top-level section; preserve existing elements and remap incoming ID collisions.
- Reject conflicting dependency definitions, duplicate CSS IDs, invalid trees and detected ambiguous references.
- Compare complete versions with added, removed, changed and moved elements, plus metadata changes.
- Add built-in section generation, ordered page assembly, template merge and comparison to MCP (eight tools total).
- Add a local stdio MCP entry point, build script and real-process integration test.
- Preserve drafts while switching tabs, invalidate exports after edits, and show parent-defined child order in the structure tree.
- Document staged WordPress integration releases and local MCP setup.

The comparison is structural, not a Bricks rendering. This release does not read or write WordPress sites. Existing API generation and local ChatGPT sign-in remain available.

## Pre-release updates — 2026-09-26

- Added local Sign in with ChatGPT through the official Codex app-server, with separate credentials, model discovery and loopback-only access; verified a real generation.
- Corrected the Codex thread sandbox value and text input contract.
- Fixed exported layout gaps, font stacks and custom CSS selectors after a real Bricks import exposed rendering differences.
- Added the HB Coming-soon template generator and verified its saved desktop/mobile layout in WordPress.
- Added regression coverage and documented local versus hosted connections and audit limits.

## 0.2.0 — 2026-09-25

- Added OpenAI Responses generation, configurable models, connection checks, explicit AI errors and cancellation.
- Added opt-in ChatGPT MCP tools and JSON paste/file import.
- Synced Bricks 2.4.1 native element/control names; repaired references, responsive defaults, legacy controls, gradients and alpha colors.
- Preserved global classes and component metadata; added export types and warnings.
- Replaced the coming-soon mock email field with a native form requiring destination-side action configuration.
- Escaped JSON preview HTML; restricted Azure endpoints and cross-origin requests; added payload limits and disabled server-funded keys by default.
- Updated dependencies, documentation, tests and CI.
