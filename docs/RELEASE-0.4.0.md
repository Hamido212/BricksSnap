# BricksSnap 0.4.0 — Read a connected WordPress site

BricksSnap can now use a live Bricks page as the staging baseline. Run it locally, enter the MCP endpoint and an application password, then pick a page. The page's element tree, Bricks' document digest, page settings and the site's definitions of referenced global classes are loaded. **Import site design context** adds the site's classes and palette colors. Review then warns when a staged section would reuse a site class name under another ID, change a class definition or reference undefined classes.

The connection uses the official WordPress MCP Adapter and Bricks' own abilities. It is read-only and available only in `npm run dev:local`, answering this computer alone. Passwords stay in the open browser tab.

## Start

1. On the site:
   - Enable Bricks → AI abilities.
   - Install WordPress MCP Adapter 0.6.1+ (upload the release ZIP if the one-click installer cannot reach GitHub).
   - Create an application password for a dedicated user.
2. Locally: `npm ci`, then `npm run dev:local` → **Staging → Set up WordPress connection**.
3. For local or staging sites, add `BRICKSSNAP_ALLOW_PRIVATE_WORDPRESS=true`.

Full guide: [Connect a WordPress site](WORDPRESS.md).

## What the live site taught us

Official documentation and a live Bricks 2.4.2 site disagree in places that matter. The [research](RESEARCH-2026-09-28-BRICKS-MCP.md) records both:

- Every ability schema rejects unknown parameters.
- `get-design-context` returns summaries only.
- `get-page-settings`, `restore-revision` and a page-level `expectedDocumentDigest` exist, although the documentation omits them.

The client follows the live schemas. Tests replay sanitized captured responses.

## Validation

- **Automated.** 152 tests pass, including replays of captured Bricks 2.4.2 responses, schema-driven argument selection, disabled-ability reporting, class conflict checks, endpoint rules and the private-site opt-in.
- **Checks.** Production build, TypeScript and ESLint pass. Dependency audit reports no known vulnerabilities.
- **Live site (read-only; Bricks 2.4.2, WordPress 7.1.2, MCP Adapter 0.6.1).**
  - Connect, search, page import and design import succeed through BricksSnap's own transport.
  - Adapter sessions end with `DELETE` (HTTP 200).
  - A wrong password and a wrong endpoint produce clear errors.
- **Browser (Chromium, 1440 px and 390 px).**
  - Connect, list pages and import "Home" (22 elements).
  - Review an appended section: 30 added, 22 unchanged.
  - Import the design context, and see a candidate class named like a site class flagged as a collision.
  - No console errors and no horizontal overflow.

## Boundaries and next releases

- **Read-only.** This release reads only and never changes the site.
- **Review scope.** The review is structural; check rendering, dynamic data and forms in Bricks.
- **Experimental abilities.** Bricks' abilities are experimental; use a staging site where possible.

Next: **0.5** applies a reviewed change with the document-digest guard, reads the page back to verify it, and restores a revision if needed. **0.6** covers remote template distribution and client guidance. See the [release roadmap](ROADMAP.md).
