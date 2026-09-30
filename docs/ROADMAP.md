# Staged releases toward BricksSnap 2.0

Reviewed September 28, 2026. Versions below are delivery boundaries, not scheduled dates.

## Assessment of the proposed roadmap

The opportunity is credible: combine native template generation with a reviewable change workflow. However, implementation should build on verified interfaces rather than treating the proposal as an API contract.

- BricksSnap already had four HTTP MCP tools before v0.3. This release extends that server and adds local stdio transport.
- Our preview is a structure sketch. It is not equivalent to a live WordPress/Bricks render. Passing validation does not prove the intended layout works.
- Bricks' native AI integration is experimental and includes its own checks and some preview workflows. “Always blind” and “no safeguards” are inaccurate generalizations. See [Bricks AI Abilities and Skills](https://academy.bricksbuilder.io/builder/features/ai-abilities-and-skills/).
- The [WordPress MCP Adapter](https://github.com/WordPress/mcp-adapter) is the WordPress-side bridge. `@automattic/mcp-wordpress-remote` is a client-side proxy; it is not the WordPress plugin.
- [Remote templates](https://academy.bricksbuilder.io/builder/features/remote-templates/) are supported by Bricks, but the proposed custom endpoint and response shape require an actual import test. A JSON catalog alone does not establish compatibility.
- The [September 28 research](RESEARCH-2026-09-28-BRICKS-MCP.md) maps each Bricks 2.4 ability area (pages, elements, design system, templates, components, queries, conditions, breakpoints, revisions) with its evidence level and the consequences for v0.4–v0.6.
- Source-file size is not a reliability measure. Existing obfuscated browser key storage is not an encrypted credential vault for a multi-user WordPress integration.

## v0.3 — Assemble and review templates

Delivered: additive staging, ID/dependency conflict handling, structural diff, import/export workflow, built-in MCP generation and assembly, local stdio server. The eight tools share the same engine as HTTP. No WordPress write path or new credentials are introduced.

Acceptance: catalog-wide merge tests, real stdio protocol integration, HTTP checks, production build, browser review including narrow screens. See [the usage guide](STAGING-MCP.md).

## v0.4 — Read a connected WordPress site

Delivered in 0.4.0 (see [the connection guide](WORDPRESS.md)). The original scope follows.

Deliver one complete read-only path: connection setup, capability/version discovery, page selection, read page structure and import available design context. Show which source and timestamp each baseline came from. Preserve unknown data without claiming full support for third-party CSS frameworks.

Status: the read-only client (`src/lib/wordpress-client.ts`) ran connect, page search, page import and design import end to end against a live Bricks 2.4.2 / WordPress 7.1.2 / MCP Adapter 0.6.1 site. Tests replay sanitized captured responses. A Chromium review of the Staging flow at desktop and 390 px widths passed. The design import, session termination and the local/staging opt-in were completed for 0.4.0.

Before release: inspect the installed abilities' actual schemas and permissions; test missing capabilities, revoked credentials, timeouts and inconsistent responses. Choose an explicit local-only or authenticated server-side credential model. For hosted connections, implement tenant isolation and outbound request protections before accepting arbitrary site URLs. Do not store WordPress secrets in the current obfuscation helper.

## v0.5 — Review and apply changes to WordPress

Delivered in 0.5.0 (see [release notes](RELEASE-0.5.0.md)). Writes use Bricks' atomic `expectedDocumentDigest` guard, verified live, and recovery through `restore-revision` was verified live. The before/after render comes from Bricks' own `render-elements` at 1280 and 390 px. The original scope follows.

Deliver a visible target page and reviewed proposal, conflict detection against a fresh baseline, controlled apply, read-back verification and a tested recovery path. Reuse v0.3's additive assembly and diff.

Before release: verify actual write/revision behavior on staging. Do not invent an `expected_hash` parameter or call client-side hashes atomic locking. The live schema shows `set-page-elements` accepting `expectedDocumentDigest`, which `get-page-elements` returns. Test on staging that a stale digest is rejected before relying on it; `add-element` has no such guard. `restore-revision` exists for page recovery; global classes/variables need a transfer-package backup instead. If the native interface cannot provide atomic conflict detection, document that limit and disable unsafe unattended writes. A saved JSON backup is not evidence that revision rollback works. Render before/after on the actual Bricks installation at desktop/mobile widths; a local iframe sketch is insufficient.

## v0.6 — Distribute templates and client guidance

Delivered in 0.6.0 (see [release notes](RELEASE-0.6.0.md)):
- **Remote library.** Built against the legacy Bricks response shape captured from a Bricks 2.4.2 source ([remote library](REMOTE-LIBRARY.md)). Verified end to end: a Bricks site listed all 60 templates from the public deployment and inserted one into a draft page.
- **Client guidance.** [AI clients](CLIENTS.md).
- **Not included.** No standalone npm package is published; the MCP server is built from the repository.

The original scope follows.

Deliver a Bricks-compatible remote library after testing its real consumer contract, with pagination, asset handling and access rules where needed. Add reusable guidance for supported AI clients, using tool discovery and the existing Bricks schemas rather than duplicating stale element rules.

Before release: successful browse/import inside a supported Bricks editor, missing-asset/dependency tests, documented compatibility, and explicit package publishing configuration if a standalone npm package is desired.

## v0.7 — Site design, classes and templates

Delivered in 0.7.0 (see [release notes](RELEASE-0.7.0.md)):
- **Site design.** Built-in sections in the site's palette and page colors and fonts.
- **Before saving.** External images imported into the media library; missing global classes created in one ownership-guarded write.
- **Templates.** Headers, footers and sections loaded, saved back guarded, created as drafts, and their display conditions edited.
- **Engine.** Native font fallbacks.
- **Not included.** Theme styles and global variables as design sources, template settings beyond conditions, and deleting templates.

## v0.8 — Studio: layouts, brand kit and design system

Delivered in 0.8.0 (see [release notes](RELEASE-0.8.0.md)):
- **Studio.** 40 layouts in 22 section types and five style directions, customized with a brand kit and an industry profile with German or English copy, previewed live and exported without AI.
- **Design system.** Global `bs-` classes with `var(--bs-*, fallback)` values; the palette and variables installed on a connected site with ownership guards and read-back.
- **App.** Light workbench redesign; Claude through MCP with current models.
- **Not included.** Loading the kit's web fonts in Bricks, theme styles, and Studio layouts in the remote library.

## v0.12 — Import & Modernize and more layouts

Delivered in 0.12.0 (see [release notes](RELEASE-0.12.0.md)):
- **Modernize.** Any Bricks JSON rebuilt on the design system, in the app and as the MCP tool `bricks_modernize_template` ([Modernize](MODERNIZE.md)).
- **Layouts.** 90 instead of 40, with Bricks' nested tabs and accordion where a section switches or folds.
- **Not included.** Importing from template libraries directly. BricksSnap does not fetch or redistribute other people's templates.

## Later: cooperation instead of copying

- **"Open in BricksSnap".** Template libraries that want it could link their sections to the Modernize tab, so users bring a section onto their own design system with one click. This needs the library's consent and a small, documented hand-over (for example a URL with the JSON or a postMessage from a library page).
- **Community gallery.** Sections shared by their authors under an explicit open license (for example CC0 or MIT), with author credit, moderation and a license on every entry. Only then may BricksSnap offer others' sections.

## 2.0 milestone

Use the 2.0 name when a connected site can be read, a change reviewed, applied, verified and recovered through a tested workflow. Intermediate releases should deliver useful complete workflows without implying that later phases are already available.
