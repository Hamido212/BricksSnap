# BricksSnap

[![npm](https://img.shields.io/npm/v/brickssnap)](https://www.npmjs.com/package/brickssnap)
[![GitHub](https://img.shields.io/github/license/Hamido212/BricksSnap)](https://github.com/Hamido212/BricksSnap)

A Next.js tool that creates editable **Bricks Builder JSON templates**. Use built-in sections, an AI provider, local ChatGPT sign-in through Codex, or a ChatGPT MCP connection. Review exports in Bricks before publishing.

**Start here: [setup, both AI connections and import guide](docs/SETUP.md).**

**v0.5: [review, render and apply changes to a live Bricks page](docs/WORDPRESS.md)** ([release notes](docs/RELEASE-0.5.0.md)).

- Load a page from a connected site, add sections and compare the before/after as Bricks itself renders it.
- Save with Bricks' atomic document-digest guard, verify the read-back and restore the previous revision.
- Runs locally through the official WordPress MCP Adapter.

**v0.7: [site design, classes and templates](docs/WORDPRESS.md)** ([release notes](docs/RELEASE-0.7.0.md)). Generate sections in a connected site's colors and fonts, import images and create missing global classes before saving, and edit headers, footers and their display conditions.

**v0.6: [Bricks remote library](docs/REMOTE-LIBRARY.md) and [AI client guidance](docs/CLIENTS.md)** ([release notes](docs/RELEASE-0.6.0.md)). Add a BricksSnap deployment under Bricks → Remote libraries to browse and insert the catalog inside the builder.

v0.5 builds on v0.4's [read-only connection](docs/RELEASE-0.4.0.md) and v0.3's [template staging and local MCP](docs/STAGING-MCP.md). See the [release plan](docs/ROADMAP.md) and the [Bricks AI/MCP research](docs/RESEARCH-2026-09-28-BRICKS-MCP.md).

## Features

- Pre-built template library (Hero, Navbar, Features, Pricing, Testimonials, Footer and more)
- Full page presets
- Design tokens (colors, border-radius, shadows, spacing, typography, dark mode)
- API route for AI-powered generation (`/api/generate`)
- Export as Bricks Import JSON + copy-to-clipboard
- Local Sign in with ChatGPT, optional MCP tools and JSON paste/file import
- Bricks 2.4.1 native element/control registry, reference repair and responsive defaults
- Export types and preservation of global classes/component metadata
- Staging workspace: prepend/append sections or insert after a root, with ID collision handling and structural comparison
- Eight MCP tools over optional HTTP or local stdio; section generation, page assembly, merge and comparison
- Local WordPress connection: page search, live page import with Bricks' document digest, site class and palette import, class conflict warnings
- Bricks-rendered before/after preview (1280/390 px), guarded apply with read-back verification and revision restore
- Import of external images into the site's media library and guarded creation of missing global classes before applying
- Built-in sections in a connected site's colors (palettes and the loaded page) and fonts
- Site templates: load headers, footers and sections, save them back guarded, edit their display conditions, and save reviewed changes as new templates
- Bricks remote template library (`/wp-json/bricks/v1/get-templates-data`) with optional whitelist/password

## Prerequisites

- Node.js 22.12+
- npm 10+

## Getting Started

```bash
npm ci
npm run dev
```

Then open in your browser:

- `http://localhost:3000`

## Production Build

```bash
npm run lint
npm test
npm run build
npm run typecheck
npm run start
```

## AI Mode (optional)

The API supports OpenAI Responses, Anthropic, Azure OpenAI and OpenRouter. Use Settings to choose a provider/model and test the connection. API usage is billed by your provider; a ChatGPT subscription does not include API credit.

For **Sign in with ChatGPT**, install the official Codex CLI and use `npm run dev:local`. In Settings, sign in, check the connection and enable the ChatGPT account option. This loopback-only mode uses your Codex account limits and supports text prompts. It is unavailable on the public Vercel deployment. See [setup](docs/SETUP.md) for the separate MCP option.

Request fields:

- `prompt` (string)
- `apiKey` (string)
- `useAI` (boolean, defaults to false)
- `provider` (`"openai" | "anthropic" | "azure" | "openrouter"`)
- `model` (optional string); Azure requires endpoint/deployment

## Project Structure

- `src/app/page.tsx` – Main UI
- `src/app/api/generate/route.ts` – Generation API
- `src/lib/bricks-engine.ts` – Bricks JSON engine + section generators
- `src/lib/wordpress-client.ts` – MCP Adapter client for Bricks abilities (`/api/wordpress`, local only)
- `src/lib/templates.ts` – Template catalog
- `src/components/*` – UI components (form, preview, cards)

## Notes

- Built with the Next.js App Router.
- Apply deployment rate limits. Keep server-funded keys disabled on public deployments without authentication.
- Validation covers structure/control names, not all nested values or WordPress runtime behavior. See the [audit](docs/AUDIT-2026-09-25.md) for outstanding integration checks.
