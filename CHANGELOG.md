# Changelog

## Unreleased

- Started the read-only WordPress connection (v0.4): local-only route, MCP Adapter client, page search, page import as staging baseline, and design context import.
- Aligned the client with Bricks 2.4's documented ability responses. The version comes from `bricksVersion`, the `{ abilities: [...] }` status envelope is parsed, and exact ability names are requested so disabled abilities are visible.
- Disabled or unregistered abilities are now reported as missing. Before, the dispatcher's presence counted as availability.
- Arguments are sent under the parameter name each ability's input schema declares, instead of several guessed aliases.
- Design-token import reads Bricks 2.4 palette colors (`{ id, raw, light }`).
- Added [research on Bricks AI abilities, the MCP Adapter and the Abilities API](docs/RESEARCH-2026-09-28-BRICKS-MCP.md) with a capability matrix and consequences for v0.4–v0.6.

- Added `scripts/capture-wordpress-fixtures.mjs`. It records real responses from a WordPress MCP Adapter endpoint, executing only abilities that the site annotates as read-only. For write abilities it records only their schemas. Output goes to `artifacts/` with secrets redacted.

- Verified the read path against a live Bricks 2.4.2 site (read-only).
  - The page import keeps Bricks' `documentDigest`, unwraps page settings and resolves the page title.
  - The search lists recent Bricks content for an empty query and shows the builder lock state.
  - The design import reads the paginated palette and class lists and ignores Bricks' default palette.
  - The page list now loads after connecting.
  - Tests replay sanitized captured responses.
- Browser-tested the Staging connection flow in Chromium against the live site at 1440 px and 390 px: connect, page list, page import, review and design import, with no console errors and no horizontal overflow.
  - Fixed a stale "insert after" section that survived a baseline replacement, which made review fail.
  - Fixed the page picker overflowing narrow screens.

See the research document for open items.

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
