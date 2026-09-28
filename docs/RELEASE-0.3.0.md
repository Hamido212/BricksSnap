# BricksSnap 0.3.0 — Template staging and local MCP

You can now combine an existing Bricks export with new sections, review structural differences, and download the result. The new Staging workspace supports beginning/end insertion, insertion after a root section, and comparison of complete versions.

Existing elements stay unchanged during additive assembly. Incoming ID collisions are remapped; conflicting classes/components, invalid trees and detected ambiguous references stop the merge. Changing an input invalidates the previous review and export.

MCP now exposes eight tools over the existing optional HTTP endpoint or a new local stdio entry point. Four new tools provide built-in section generation, ordered page assembly, merging and comparison. Local clients can use the same engine without WordPress credentials or an API key. The CLI is built from the repository; no separate npm package is published in this release.

The preceding ChatGPT sign-in work is included: local generation through the official Codex app-server remains available, alongside API providers and HTTP MCP.

## Start

- Web app: open **Staging → Load demo → Review changes**.
- Local MCP: `npm ci`, `npm run build:mcp`, then configure your client to launch `node` with an absolute path to `dist/mcp-server.mjs`.
- [Full staging/MCP instructions](STAGING-MCP.md) and [AI connection setup](SETUP.md).

## Validation

- 121 automated tests pass, including all 60 catalog templates merged with themselves, ID/CSS/link remapping, dependency conflicts, complete-version diffs, HTTP MCP and a real stdio client/server process.
- Production build, TypeScript and ESLint pass. Dependency audit reports no known vulnerabilities.
- Browser: demo inserts 30 new elements between hero and footer while preserving 40 existing elements. The downloaded JSON contains 70 elements in the expected root order and `content` export type.
- Browser: editing candidate JSON removes the previous export; invalid JSON displays an error. The reviewed flow has no horizontal page overflow at 390 px, and no captured browser errors.

## Boundaries and next releases

The preview is a structure comparison, not Bricks rendering. Imported code, forms, dynamic data, styles and dependencies still require review on the destination site. This release does not connect to or write WordPress sites.

Next: **0.4** read-only WordPress connection/design context, **0.5** reviewed writes with conflict and recovery checks, **0.6** remote template distribution and client guidance. See the [release roadmap](ROADMAP.md).
