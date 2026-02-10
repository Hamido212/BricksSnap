# BricksSnap

[![npm](https://img.shields.io/npm/v/brickssnap)](https://www.npmjs.com/package/brickssnap)
[![GitHub](https://img.shields.io/github/license/Hamido212/BricksSnap)](https://github.com/Hamido212/BricksSnap)

A Next.js tool that generates ready-to-import **Bricks Builder JSON templates**. Use pre-built sections or generate full page layouts via prompt and export them as Bricks-compatible JSON.

## Features

- Pre-built template library (Hero, Navbar, Features, Pricing, Testimonials, Footer and more)
- Full page presets
- Design tokens (colors, border-radius, shadows, spacing, typography, dark mode)
- API route for AI-powered generation (`/api/generate`)
- Export as Bricks Import JSON + copy-to-clipboard

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

```bash
npm install
npm run dev
```

Then open in your browser:

- `http://localhost:3000`

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## AI Mode (optional)

The API route supports OpenAI and Anthropic. Send your API key in the request to `/api/generate`.

Request fields:

- `prompt` (string)
- `apiKey` (string)
- `useAi` (boolean)
- `provider` (`"openai" | "anthropic"`)

## Project Structure

- `src/app/page.tsx` – Main UI
- `src/app/api/generate/route.ts` – Generation API
- `src/lib/bricks-engine.ts` – Bricks JSON engine + section generators
- `src/lib/templates.ts` – Template catalog
- `src/components/*` – UI components (form, preview, cards)

## Notes

- Built with the Next.js App Router.
- For production deployments, consider adding API rate limits before going public.
