# BricksSnap

BricksSnap ist ein Next.js Tool, das sofort importierbare **Bricks Builder JSON-Templates** generiert.
Du kannst vorgefertigte Sections nutzen oder per Prompt ganze Layouts erzeugen und direkt als Bricks-kompatible JSON exportieren.

## Features

- Vorgefertigte Template-Bibliothek (Hero, Navbar, Features, Pricing, Testimonials, Footer u.v.m.)
- Vollständige Seiten-Presets
- Design Tokens (Farben, Radius, Schatten, Spacing, Typografie, Dark Mode)
- API-Route für KI-gestützte Generierung (`/api/generate`)
- Export als Bricks Import JSON + Copy-to-Clipboard für Bricks

## Voraussetzungen

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
npm run dev
```

Danach im Browser öffnen:

- `http://localhost:3000`

## Produktions-Build

```bash
npm run lint
npm run build
npm run start
```

## KI-Modus (optional)

Die API-Route unterstützt OpenAI und Anthropic. Sende den Key im Request an `/api/generate`.

Beispiel-Felder:

- `prompt` (string)
- `apiKey` (string)
- `useAi` (boolean)
- `provider` (`"openai" | "anthropic"`)

## Projektstruktur

- `src/app/page.tsx` – Haupt-UI
- `src/app/api/generate/route.ts` – Generierungs-API
- `src/lib/bricks-engine.ts` – Bricks JSON Engine + Section Generatoren
- `src/lib/templates.ts` – Template-Katalog
- `src/components/*` – UI-Komponenten (Form, Vorschau, Cards)

## Hinweise

- Das Projekt nutzt den App Router von Next.js.
- Für stabile Produktion empfiehlt sich das Hinterlegen von API-Limits/Rate-Limits vor öffentlichem Rollout.
