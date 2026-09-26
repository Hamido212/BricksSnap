# Changelog

## Unreleased — 2026-09-26

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
