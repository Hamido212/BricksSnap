# BricksSnap

[![npm](https://img.shields.io/npm/v/brickssnap)](https://www.npmjs.com/package/brickssnap)
[![GitHub](https://img.shields.io/github/license/Hamido212/BricksSnap)](https://github.com/Hamido212/BricksSnap)

A Next.js tool that creates editable **Bricks Builder JSON templates**. Use built-in sections, an AI provider, or your ChatGPT account through MCP. Review exports in Bricks before publishing.

**Start here: [setup, both AI connections and import guide](docs/SETUP.md).**

## Features

- Pre-built template library (Hero, Navbar, Features, Pricing, Testimonials, Footer and more)
- Full page presets
- Design tokens (colors, border-radius, shadows, spacing, typography, dark mode)
- API route for AI-powered generation (`/api/generate`)
- Export as Bricks Import JSON + copy-to-clipboard
- ChatGPT MCP tools and JSON paste/file import
- Bricks 2.4.1 native element/control registry, reference repair and responsive defaults
- Export types and preservation of global classes/component metadata

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

The API supports OpenAI Responses, Anthropic, Azure OpenAI and OpenRouter. Use Settings to choose a provider/model and test the connection. AI usage is billed by your provider; a ChatGPT subscription does not include API credit. The separate MCP route uses ChatGPT's reasoning without a paid API call.

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
- `src/lib/templates.ts` – Template catalog
- `src/components/*` – UI components (form, preview, cards)

## Notes

- Built with the Next.js App Router.
- Apply deployment rate limits. Keep server-funded keys disabled on public deployments without authentication.
- Validation covers structure/control names, not all nested values or WordPress runtime behavior. See the [audit](docs/AUDIT-2026-09-25.md) for outstanding integration checks.
