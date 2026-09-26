# Setup and connections

Use Node.js **22.12+**. Run `npm ci` and `npm run dev`, then open http://localhost:3000. Built-in templates need no account or API key.

## API generation

Open Settings, select OpenAI, Anthropic, Azure OpenAI or OpenRouter, enter your key and choose a model/deployment. Test the connection, save, then enable AI mode. OpenAI uses the Responses API with JSON output and `store: false`. A ChatGPT subscription does not supply API credit.

OpenAI/Anthropic checks verify key and model access without generation. OpenRouter checks the key; model access is checked on generation. Azure sends a tiny request to verify the deployment, which can incur a charge. Models must support the selected API, output limit and images when used.

Keys are kept in session storage by default; persistence is opt-in. Obfuscation is **not encryption**. Keys and prompts pass through the BricksSnap server to the chosen provider. Use a deployment you trust. The app does not deliberately store/log submitted keys or prompts on the server; infrastructure/providers have their own policies.

## ChatGPT subscription via MCP

1. Set `BRICKSSNAP_MCP_ENABLED=true` in `.env.local` and restart.
2. Make `/api/mcp` reachable through a secure MCP tunnel or an HTTPS deployment.
3. Follow the [official ChatGPT connection instructions](https://developers.openai.com/plugins/deploy/connect-chatgpt) to add the endpoint in developer mode. Availability depends on your account/workspace.
4. Ask: “Use BricksSnap to design a responsive restaurant landing page. Read the schema, create native elements, validate the template and return a JSON file.”
5. Paste/upload that JSON under **Getting started · ChatGPT & import**, or import the resulting template file into Bricks.

ChatGPT supplies the reasoning; MCP tools do not call a paid AI API or require an API key. This is a ChatGPT-side connection, not a subscription-to-API-credit workaround. Manual JSON paste/import also works without MCP.

The opt-in stateless endpoint provides `bricks_get_schema` (optional element control lookup), `bricks_list_templates`, `bricks_get_template`, and `bricks_validate_template`. It cannot access API keys, WordPress or private files, or publish pages. It currently has no authentication because it only provides public computations; apply hosting rate limits. Leave disabled when unused.

## Export and compatibility

Select section, content, header or footer, download JSON, then use **Bricks → Templates → Import templates**. Review the layout in Bricks before publishing. The app preview is a structure sketch, not the Bricks renderer.

The registry covers 182 native element names and control names from the Bricks 2.4.1 schema (September 25, 2026). Validation checks tree integrity and control names, not every nested value or WordPress runtime behavior. Unknown controls are retained with warnings; third-party add-on elements are not supported.

Global classes and supplied component metadata are preserved. Definitions must be included or already present on the destination site; preservation does not guarantee every Bricks import mechanism resolves them. Custom breakpoints, fonts, media, menus, query data, form actions, recipients, login/social sign-in integrations and placeholder links need destination-side review. Countdowns default to 30 days ahead. Review executable code independently.

For direct site editing, use the [official Bricks AI integration](https://academy.bricksbuilder.io/builder/features/ai-abilities-and-skills/). BricksSnap remains a standalone template workspace.

## HTTP API

`POST /api/generate`, JSON body:

```json
{"prompt":"Hero and footer for a restaurant","useAI":false,"sections":["hero","footer"]}
```

AI fields: `useAI: true`, `provider`, `apiKey`, optional `model`. Azure requires `azureEndpoint` (HTTPS resource origin) and `azureDeployment`; OpenRouter accepts `openrouterModel`. Optional: `stylePreset: {id}`, `colorPalette: {id}`, `referenceImage` (base64 PNG/JPEG/WebP/GIF data URL, AI only). IDs are in `src/lib/presets.ts`. Limits: 12,000 prompt characters, 6 MB request, 1,500 elements.

Success returns `template`, `mode`, `model`, `elementCount`, `sections` and `validation.warnings`. Errors return HTTP error status and `error`; AI failures never silently fall back to built-ins. `POST /api/connection` accepts connection fields.

Server-funded OpenAI/Anthropic keys require `BRICKSSNAP_ALLOW_SERVER_KEYS=true`. Protect such deployments with authentication, shared rate limits and spending limits. The in-process concurrency guard is not a distributed quota. Do not enable funded keys on an unprotected public deployment.

## Validation

```sh
npm run lint
npm test
npm run build
npm run typecheck
npm audit
npm start
```

Refresh the registry deliberately with `node scripts/sync-bricks-schema.mjs`, review its changes and run tests. Tests cover all catalog templates, reference repair, dependency round trips, XSS escaping, request validation, mocked providers and MCP protocol calls. Real provider availability, ChatGPT setup and WordPress import require separate integration checks.
