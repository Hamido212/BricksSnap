# Setup and connections

Use Node.js **22.12+**. Run `npm ci` and `npm run dev`, then open http://localhost:3000. Built-in templates need no account or API key.

## API generation

Open Settings, select OpenAI, Anthropic, Azure OpenAI or OpenRouter, enter your key and choose a model/deployment. Test the connection, save, then enable AI mode. OpenAI uses the Responses API with JSON output and `store: false`. A ChatGPT subscription does not supply API credit.

OpenAI/Anthropic checks verify key and model access without generation. OpenRouter checks the key; model access is checked on generation. Azure sends a tiny request to verify the deployment, which can incur a charge. Models must support the selected API, output limit and images when used.

Keys are kept in session storage by default; persistence is opt-in. Obfuscation is **not encryption**. Keys and prompts pass through the BricksSnap server to the chosen provider. Use a deployment you trust. The app does not deliberately store/log submitted keys or prompts on the server; infrastructure/providers have their own policies.

## Sign in with ChatGPT (local Codex connection)

1. Install/update the [official Codex CLI](https://developers.openai.com/codex/cli/) and ensure `codex` is available on PATH. `BRICKSSNAP_CODEX_BIN` can select an executable path.
2. Run `npm run dev:local` (or `npm run dev:local -- --port 3001`). Open the displayed `http://127.0.0.1` URL.
3. Open Settings → **Sign in with ChatGPT**. Complete the OpenAI sign-in in the opened page, then return and click **Check ChatGPT connection**.
4. Select **Use ChatGPT account for AI generation**, choose an available model, close Settings and enable **AI mode**. Describe the template and Generate.

This is a real account sign-in using the official [Codex app-server](https://developers.openai.com/codex/app-server/), not API credit. Availability/models/limits depend on the signed-in account. BricksSnap selects models from the account's model list. Text prompts are supported; image references currently need an API provider. Your prompt is sent to OpenAI.

Codex manages credentials in a separate `CODEX_HOME`: `%LOCALAPPDATA%/BricksSnap/codex` on Windows, or `~/.local/share/BricksSnap/codex` otherwise. BricksSnap does not copy the desktop app's credentials or send tokens to WordPress. **Disconnect ChatGPT** signs out this separate connection. The choice to use ChatGPT applies to the current page; after reloading, check the connection and select it again.

Local mode starts a loopback-bound server, requires a local-client header and rejects foreign origins/forwarded remote clients. It uses an empty workspace, ephemeral threads, a read-only sandbox and disabled agent tool features. Do not expose this mode through a tunnel/reverse proxy or use it as a multi-user service. A hosted Vercel instance cannot access your local sign-in; use an API provider there or the ChatGPT-side MCP workflow below.

## ChatGPT subscription via MCP

1. Set `BRICKSSNAP_MCP_ENABLED=true` in `.env.local` and restart.
2. Make `/api/mcp` reachable through a secure MCP tunnel or an HTTPS deployment.
3. Follow the [official ChatGPT connection instructions](https://developers.openai.com/plugins/deploy/connect-chatgpt) to add the endpoint in developer mode. Availability depends on your account/workspace.
4. Ask: “Use BricksSnap to design a responsive restaurant landing page. Read the schema, create native elements, validate the template and return a JSON file.”
5. Paste/upload that JSON under **Getting started · ChatGPT & import**, or import the resulting template file into Bricks.

ChatGPT supplies the reasoning; MCP tools do not call a paid AI API or require an API key. This is a ChatGPT-side connection, not a subscription-to-API-credit workaround. Manual JSON paste/import also works without MCP.

The opt-in stateless endpoint provides eight tools: `bricks_get_schema`, `bricks_list_templates`, `bricks_get_template`, `bricks_validate_template`, `bricks_generate_section`, `bricks_assemble_page`, `bricks_merge_templates` and `bricks_compare_templates`. It cannot access API keys, WordPress or private files, or publish pages. It currently has no authentication because it only provides public computations; apply hosting rate limits. Leave disabled when unused. For local stdio clients and the staging workflow, see [Staging and MCP](STAGING-MCP.md).

## Export and compatibility

Select section, content, header or footer, download JSON, then use **Bricks → Templates → Import templates**. Review the layout in Bricks before publishing. The app preview is a structure sketch, not the Bricks renderer.

The registry covers 182 native element names and control names from the Bricks 2.4.1 schema (September 25, 2026). Validation checks tree integrity and control names, not every nested value or WordPress runtime behavior. Unknown controls are retained with warnings; third-party add-on elements are not supported.

Global classes and supplied component metadata are preserved. Definitions must be included or already present on the destination site; preservation does not guarantee every Bricks import mechanism resolves them. Custom breakpoints, fonts, media, menus, query data, form actions, recipients, login/social sign-in integrations and placeholder links need destination-side review. Countdowns default to 30 days ahead. Review executable code independently.

For direct site editing, use the [official Bricks AI integration](https://academy.bricksbuilder.io/builder/features/ai-abilities-and-skills/). BricksSnap remains a template workspace.

## WordPress connection (local)

With `npm run dev:local`, the Staging tab can read a page and its global classes from a Bricks 2.4+ site through the WordPress MCP Adapter and use it as the baseline. After review, it can save the change back with Bricks' document-digest guard and restore the previous revision. Both need an application password, and saving needs the `set-page-elements` ability enabled. See [Connect a WordPress site](WORDPRESS.md).

## Remote library and AI clients

- **Remote library.** Any deployment serves the catalog as a Bricks remote template library at `/wp-json/bricks/v1/get-templates-data` ([remote library](REMOTE-LIBRARY.md)).
- **AI clients.** To combine BricksSnap's MCP tools with your site's Bricks abilities in Claude Code, Codex or Cursor, see [AI clients](CLIENTS.md).

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

Refresh the registry deliberately with `node scripts/sync-bricks-schema.mjs`, review its changes and run tests. Tests cover all catalog templates, reference repair, dependency round trips, XSS escaping, request validation, mocked providers and MCP protocol calls. Real provider availability, ChatGPT setup and WordPress import require separate integration checks. `scripts/capture-wordpress-fixtures.mjs` records read-only responses from a real MCP Adapter endpoint for refreshing the WordPress test fixtures.
