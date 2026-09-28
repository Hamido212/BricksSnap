# Bricks AI abilities, WordPress MCP and BricksSnap — research, September 28, 2026

Purpose: establish what the connected-site releases (v0.4–v0.6) can rely on today, using current primary sources instead of assumptions in our code. Each capability below is marked by evidence level:

- **Doc** — stated in official Bricks Academy or WordPress/MCP documentation.
- **Skill** — named in the official Bricks skills package ([codeerhq/bricks-skills](https://github.com/codeerhq/bricks-skills), release 0.1.0, September 16, 2026). The skills cite Bricks source paths and are maintained against Bricks 2.4 stable, but they are guidance, not an API contract. Parameter names and response shapes must be confirmed per site with `mcp-adapter-get-ability-info`.
- **Live** — observed on a real Bricks 2.4.2 site through the MCP Adapter; see [Verified on a live site](#verified-on-a-live-site).
- **Unverified** — used or assumed somewhere, but not found in any official source.

Later the same day, a live site was queried read-only (Bricks 2.4.2, WordPress 7.1.2, MCP Adapter 0.6.1). Its findings are in [Verified on a live site](#verified-on-a-live-site) and override the documentation-based statements where they differ. The matrix below is corrected accordingly.

## Verified on a live site

Captured with `scripts/capture-wordpress-fixtures.mjs`, which executes only abilities the site annotates as read-only. Sanitized responses are in `tests/fixtures/wordpress-bricks-2.4.2.json`. Afterwards, BricksSnap's own client ran all four read actions end to end through its hardened transport.

- **Connection.** The adapter reports protocol `2025-11-25` as "MCP Adapter Default Server".
  - `tools/list` holds 14 tools: the 3 `mcp-adapter-*` meta-tools and 11 direct Bricks tools (`get-design-context`, `checkout-site-repository`, `resolve-agent-file`, `commit-exact-site-edits`, `checkout-site-edit-map`, `commit-site-edit-plan`, `commit-agent-file`, `create-post`, `commit-site-foundation`, `commit-html-css-page-import`, `apply-html-css-page-import`).
  - Everything else, including `get-page-elements`, runs through the dispatcher.
  - Bricks registers **170** abilities.
- **Response envelopes.** Dispatcher results are wrapped as `{ success, data }`; direct tools return the bare payload.
- **Strict schemas.** Every inspected input schema sets `additionalProperties: false`. Sending parameter aliases fails.
- **Not in Abilities REST.** An authenticated administrator request to `/wp-json/wp-abilities/v1/abilities` lists only the 3 core abilities, so Bricks abilities are MCP/WP-CLI only.
- **Diagnostics.** `get-mcp-version` returns `bricksVersion`, `bricksAbilitiesVersion` (2.0.0), `adapterVersion`, `wordpressVersion`, `abilitiesApiActive` and disabled counts (admin- and default-disabled). `list-ability-status` returns `{ abilities: [{ name, category, enabled, defaultEnabled }], total, enabled, disabled }`.
- **Finding posts.** `find-post` takes `query`, `postId`, `slug`, `path`, `postType`, `status`, `bricksOnly`, `limit` and `orderBy`. It returns `{ results: [{ id, title, slug, path, postType, status, bricksEnabled, hasBricksData, locked, lockedBy, editUrl, builderUrl, modifiedGmt }], total }`. An empty query lists recent content. `locked` reports a page that is open in the builder.
- **Reading pages.**
  - `get-page-elements` takes `postId` (or `slug`/`path`/`title`), `elementId`, `maxDepth`, `includeSettings`, `responseFormat` and `returnFields`. It returns `{ elements, postId, documentDigest }` (SHA-256, 64 hex characters) and no title. `elementId` makes it the single-element read.
  - **`get-page-settings` exists.** It returns `{ settings, postId }`, with `settings: []` when empty. `set-page-settings` exists too.
- **Design system.**
  - `get-design-context` (also with `responseFormat: "detailed"`) returns counts, palette summaries (`colorCount`) and class summaries (`hasSettings`, `hasSelectors`) plus breakpoints and a snapshot. It carries **no color values or class settings**.
  - Values come from `list-color-palettes` (colors `{ id, raw, light, colorDigest, itemOwnership }`) and `list-global-classes` (settings, `ownership`, `lockOwnership`, `categoryOwnership`). Both are paginated with `page`, `perPage` (maximum 200) and `hasMore`.
- **Revisions.**
  - `list-revisions (postId, limit)` returns `{ revisions: [{ id, author, authorId, date, dateGmt, hasBricksData, areas }], total }`.
  - **`get-revision (revisionId, area)` and `restore-revision (revisionId, postId)` exist.** `restore-revision` is annotated destructive.
- **Page writes (schemas only, not executed).**
  - **`set-page-elements` accepts `expectedDocumentDigest`.** This is the page-level compare-and-set that the documentation did not mention.
  - `add-element` takes `postId`, `parentId`, `position` (integer) and `element`. `update-element` has `dryRun` and `returnFields`.
  - Page workspaces exist: `checkout-page-workspace` (read-only), `preview-page-workspace`, and `apply-page-workspace (previewToken, idempotencyKey)`.
  - `insert-remote-template` supports `position` values `replace`/`start`/`end`/`before`/`after`/`append`/`prepend` with `anchorElementId`.
  - `get-reading-settings` exposes the front page.
- **Annotations.** Read abilities declare `readonly: true`. Write abilities leave `readonly` unset, and destructive ones set `destructive: true`.
- **Errors.** A wrong application password surfaces as HTTP 401, which BricksSnap reports as "WordPress rejected access". An unknown MCP server path returns `rest_no_route` (404), reported as "MCP endpoint not found".
- **Installation.** Bricks' one-click adapter installer can fail when the host cannot reach GitHub ("could not fetch the latest version"). Uploading the release ZIP works.

## Versions and status

| Component | Current state | Source |
| --- | --- | --- |
| Bricks | 2.4 stable released September 16, 2026; 2.4.1 is live. AI abilities are **experimental**: "Keep this feature off on production sites while it is experimental." | [Bricks 2.4 changelog](https://bricksbuilder.io/release/bricks-2-4/), [AI Abilities and Skills](https://academy.bricksbuilder.io/builder/features/ai-abilities-and-skills/) |
| Ability count | ~145 in the July beta; 164 registered in the skills' example status response; "170 abilities across 27 categories" reported for 2.4.1 by a third party. Treat counts as site-specific. | Skill (`bricks-ai-tab`), [BricksFusion](https://bricksfusion.com/learn/bricks-2-4-ai-features-explained) |
| WordPress Abilities API | In core since WordPress 6.9. WordPress 7.0 adds the client-side packages `@wordpress/abilities` and `@wordpress/core-abilities`. REST namespace `/wp-json/wp-abilities/v1` (list, get, `/run`); read-only abilities run via GET, destructive+idempotent via DELETE, others via POST. | [Developer blog](https://developer.wordpress.org/news/2026/02/from-abilities-to-ai-agents-introducing-the-wordpress-mcp-adapter/), [Client-side Abilities API in 7.0](https://make.wordpress.org/core/2026/03/24/client-side-abilities-api-in-wordpress-7-0/) |
| WordPress MCP Adapter | Latest **release** is 0.6.1 (August 13, 2026). It requires WordPress 6.9+ and serves MCP `2025-11-25`, `2025-06-18` and `2024-11-05`. The main branch changelog already describes 0.7.0 (dated September 23, 2026: adds `2026-07-28`, rejects JSON-RPC batches, deprecates bundling), but no 0.7.0 tag or release existed on September 28. The plugin is **not** in the WordPress.org directory, although its readme says so. Install it through Bricks' one-click installer, which downloads from GitHub, or upload the release ZIP `releases/download/v0.6.1/mcp-adapter.zip`. | [WordPress/mcp-adapter](https://github.com/WordPress/mcp-adapter) tags, `CHANGELOG.md`, `readme.txt`; WordPress.org plugin API |
| MCP specification | `2026-07-28` removes sessions and the initialize handshake (per-request `_meta`, `server/discover`), adds multi round-trip requests (`input_required`), `resultType`, cacheable list results, and deprecates Roots/Sampling/Logging. | [Spec changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) |
| `@automattic/mcp-wordpress-remote` | Local stdio→HTTP proxy that Bricks' generated client config runs with `npx`. Auth: application password (`WP_API_USERNAME`/`WP_API_PASSWORD`), OAuth 2.1 with PKCE, or `JWT_TOKEN`. Node 22+. | [Automattic/mcp-wordpress-remote](https://github.com/Automattic/mcp-wordpress-remote) |
| BricksSnap MCP SDK | `@modelcontextprotocol/sdk` 1.30.1 negotiates `2025-11-25`, which both MCP Adapter 0.6.1 and 0.7.0 serve. | `node_modules/@modelcontextprotocol/sdk` |

## How the connection works

- **Three parts (Doc).** The MCP Adapter plugin exposes the endpoint. Bricks registers its abilities with the Abilities API. Optional skills in the AI client add workflow guidance but no permissions.
- **Endpoint (Doc).** Usually `https://example.com/wp-json/mcp/mcp-adapter-default-server`. Without pretty permalinks it is `https://example.com/?rest_route=/mcp/mcp-adapter-default-server`.
- **Authentication (Doc).** A WordPress application password for a chosen user. Every call runs as that user and checks WordPress capabilities, Bricks builder access and builder permissions. Application passwords work only over HTTPS unless `WP_ENVIRONMENT_TYPE` is `local`.
- **Tool discovery (Doc).** Only frequently used abilities are direct MCP tools, for example `bricks-get-design-context`, `bricks-get-page-elements` and `bricks-set-page-elements` (hyphens). Everything else is called through `mcp-adapter-execute-ability` with `{ "ability_name": "bricks/…", "parameters": {…} }` (slashes). `mcp-adapter-discover-abilities` and `mcp-adapter-get-ability-info` list abilities and their schemas. A site can promote more abilities to direct tools with the `bricks/abilities/named_tools` filter.
- **Site-level switches (Doc).**
  - The master toggle lives under Bricks → AI → Configuration.
  - Per-ability toggles live under Bricks → AI → Abilities. Some abilities are default-off (e.g. builder permission management). Some are badged Destructive.
  - `BRICKS_DISABLE_MCP` removes all Bricks abilities.
  - PHP execution needs `BRICKS_ENABLE_PHP_ABILITIES`, `manage_options`, the Bricks Execute code permission, code execution enabled, and unlocked code signatures.
- **Diagnostics (Doc + Skill).**
  - `bricks/start-here`, `bricks/get-mcp-version` and `bricks/list-ability-status` are always available.
  - `get-mcp-version` returns `bricksVersion`, `bricksAbilitiesVersion`, `adapterVersion`, `wordpressVersion`, `abilitiesApiActive` and `disabledAbilityCount`.
  - `list-ability-status` returns `{ abilities: [{ name, enabled, defaultEnabled, category }], total, enabled, disabled }`. Its summary hides disabled rows unless `abilityNames`, `includeDisabled: true` or `responseFormat: "detailed"` is passed.
  - A disabled ability fails with `bricks_ability_disabled`.
- **WP-CLI (Doc).** `wp ability list --namespace=bricks --user=…` and `wp ability run bricks/<name> --user=…` run the same abilities without MCP.
- **Size limits (Doc).**
  - `bricks/upload-media`: the site's upload limit, with a 30-second remote download timeout.
  - Font files: 8 MiB. SVG icons: 1 MiB.
  - `bricks/convert-html-css-to-bricks-data`: 2 MiB of combined HTML and CSS.

## Capability matrix

R = read, W = write. Names are ability names (`bricks/` prefix omitted after the first column where obvious).

| Area | Abilities | Notes and preconditions | Evidence |
| --- | --- | --- | --- |
| Find pages | R: `bricks/find-post`, `checkout-site-repository` (query, postTypes, designKinds, cursors), `list-templates` (type filter) | `find-post` returns builder metadata including `builderUrl`, not a public permalink. `create-post` returns a permalink. No match does not prove nonexistence. | Skill |
| Read page content / element tree | R: `get-page-elements (postId)`, `get-page-structure`, `resolve-agent-file` (canonical document + `editingContract`) | Flat tree with 6-character IDs and parent/children. Header/footer template trees are routed automatically from `_bricks_page_header_2` / `_bricks_page_footer_2`. | Doc (direct tool) + Skill |
| Read single elements | `get-page-elements` with `elementId` (and `maxDepth`, `returnFields`); per-element: `get-element-conditions`, `get-element-interactions`; targeted discovery: `checkout-site-edit-map` with `elementIds` | | Live schema + Skill |
| Element catalog / schemas | R: `list-element-types`, `get-element-schema (elementName)` (dispatcher-only by default) | Runtime schema overrides bundled schemas; bundled resolved schemas (elements, controls, globals, page/template settings) ship in `bricks-element-schemas`. | Doc + Skill |
| Design context | R: `get-design-context` (`responseFormat`, `includeUsage`, `limit`) | Returns counts and summaries only, even when `detailed`. Read values through `list-color-palettes` and `list-global-classes`. Its `version` must not be used as write ownership. | Live + Skill |
| Theme styles | R: `list-theme-styles`, `get-theme-styles`; W: `create-theme-style`, `update-theme-style`, `delete-theme-style` | Update/delete need the target `itemOwnership` from a complete read. Deleting a non-empty style also needs `acknowledgeStyleRemoval: true`. Empty `conditions` leave a style inert. | Skill |
| Colors | R: `list-color-palettes`; W: `create/update/delete-color-palette`, `create/update/delete-color`, `generate-color-shades` | Bricks 2.4 color shape is `{ id, raw, light, dark, … }` (no `name`/`hex`). Resource `ownership` for creates, `itemOwnership` for updates/deletes. Deleting a color silently breaks `var()` references. | Skill + bundled schema |
| Typography | W: `generate-scale-variables` (`save: false` preview only) → `set-global-variables`; R/W: `get-style-manager`, `set-style-manager`; fonts: `list/get/create/update/delete-custom-font`, `upload-custom-font-file` | Scale categories need `scaleScope`, `scaleNames`, `baseline`, `prefix`. Root font size resolves style manager → theme styles → 10px. | Skill |
| Global classes | R: `list-global-classes`; W: `create-global-class`, `batch-create-global-classes`, `update-global-class`, `delete-global-class`; pseudo-classes `list/set-pseudo-classes` | Names must be unique (`bricks_conflict_duplicate_global_class_name`). Update/delete need `itemOwnership` + `lockOwnership`. Deleting orphans `_cssGlobalClasses` references. | Skill |
| Variables | R: `list-global-variables`; W: `set-global-variables` (upsert), `set-global-variable-categories` (full replace), `delete-global-variable` (`allowOrphans: true`) | Writes need `variableOwnership` + `categoryOwnership` from one fresh read. Renames do not update existing `var(--old)` references. | Skill |
| Templates | R: `list-templates`, `get-template`, `get-template-settings`; W: `create-template`, `delete-template`, `set-template-settings`, `set-template-conditions` | Condition `main` enum: `any`, `frontpage`, `postType`, `archiveType`, `search`, `error`, `terms`, `ids`, `hook`. The highest-scoring template wins. | Skill |
| Header / footer | Same template abilities + area-aware element writes | Element writes infer the area from `_bricks_template_type`. Bricks adds the `<header>`/`<footer>` landmark itself, so root elements must not use `tag: header/footer`. | Skill |
| Remote templates / components | R: `list-remote-templates`; W: `insert-remote-template`; settings keys `remoteTemplates`, `myTemplatesAccess`, `myComponentsAccess`, `myTemplatesWhitelist` via settings abilities | The remote access password is never readable or writable through abilities. Bricks 2.4 also adds Remote Components. | Doc (settings keys) + Skill |
| Components | R: `list-components`, `get-component`; W: `create-component`, `update-component`, `delete-component`, `extract-component-from-elements` | Update/delete need `expectedDesignSystemVersion` + full `expectedComponentDigest`. Deletion needs `expectedUsageCount` and `allowOrphans: true`. Slot removal needs `allowSlotOrphans: true`. Missing `_version` marks the component as legacy. | Skill |
| Query loops | Element settings `hasLoop` + `query` (needs `objectType`; `query: null` rejected); R: `list-query-loop-types`; global queries: `list/get/create/update/delete-global-query`, `create/delete-global-query-category`; filters: `list-query-filters`, `get/update-filter-element`, `set-filter-target-query`, `reindex-filters` | Put grid CSS on a non-looping parent. | Skill |
| Conditions | Element: `get-element-conditions`, `update-element-conditions` (`_conditions`); template: `set-template-conditions` | Invalid groups, missing `key` or invalid `compare` are rejected at write time. | Skill |
| Interactions | `get-element-interactions`, `update-element-interactions` | Check `effectiveInteractions` for rows inherited from classes. Inline JavaScript payloads are rejected. | Skill |
| Dynamic data | R: `list-dynamic-data-tags`, `preview-dynamic-tag` (`rendered`, `isEmpty`, `unknownTags`), `list-cms-sources` | Never invent provider tags. Preview cannot represent arbitrary loop rows. | Skill |
| Custom CSS / code | Element custom CSS through element writes (complete rule with the persisted selector); class, theme style and page CSS | CSS follows style-editing permissions. JavaScript needs `unfiltered_html`. PHP needs the PHP opt-in. HTML/CSS imports omit disallowed content and return partial results. | Doc |
| Page settings | R: `get-page-settings (postId)` → `{ settings, postId }`; W: `set-page-settings (postId, settings)` | Keys follow the bundled page-settings schema (`bodyClasses`, `customCss`, `documentTitle`, `headerDisabled`, `footerDisabled`, scripts, …). | Live |
| Global (theme) settings | R: `list-settings-schema`, `get-global-settings`, `list-credential-status`; W: `set-global-settings` (only sent keys) | Allow-list. License/API keys, code-execution settings and template passwords are excluded. | Doc |
| Breakpoints / responsive | R: `list-breakpoints` (`customEnabled`, `isMobileFirst`, `baseKey`, `baseWidth`, `breakpoints`, ownership); W: `set-breakpoints` (full list) | Exactly one `base: true`. Removing or renaming keys needs `allowRemovedBreakpoints: true`. Regenerate CSS afterwards. Responsive/pseudo keys are `_prop:breakpoint[:pseudo]`. | Skill |
| Change elements | `update-element`, `batch-update-elements`, `remove-element`, `commit-exact-site-edits` (`expectedValue`, or explicit `allowBlindWrite: true`) | The exact-edit route is the only documented value-level compare-and-set for page content. | Skill |
| Create elements / sections | `add-element (postId, parentId, position, element)` (nested input may omit IDs); `commit-html-css-page-import` (empty page body, `idempotencyKey`, `previewToken` → `apply-html-css-page-import`); `convert-html-css-to-bricks-data`; `commit-site-foundation` (greenfield only); `insert-remote-template` | The converter maps to a limited element set: section, container, block, div, heading, text-basic, text-link, icon, button, image, svg, video, audio, code, divider and form. | Doc + Skill |
| Replace a page | `set-page-elements ({ postId, elements, expectedDocumentDigest })` | Must receive the **complete** intended tree, never only a new section. The optional `expectedDocumentDigest` (from `get-page-elements`) is the page-level compare-and-set. It is not in the Academy docs and was confirmed in the live schema; its enforcement is not yet tested. Annotated destructive. | Live schema + Skill |
| Multi-resource edits | `checkout-site-edit-map` → `commit-site-edit-plan` / `preview-site-edit-plan`; changesets of 2–25 resources | Stable idempotency keys make retries safe. Terminal states: `committed`, `failed_before_commit`, `partial_commit`, `manual_recovery`. There is no atomic whole-site transaction. | Skill |
| Render / preview | `render-elements` (render a proposed tree without saving), `preview-site-edit-plan`, HTML/CSS import preview | Rendered HTML is verification evidence only, not editable source. | Doc (import preview) + Skill |
| Save / housekeeping | Element writes persist through Bricks' save pipeline; `create-post`, `delete-post`; `regenerate-css-files`; `list-orphaned-elements`, `cleanup-orphaned-elements` | Never write post meta directly: that bypasses revisions, reindexing and validation. | Skill |
| Revisions / history | R: `list-revisions`, `get-revision (revisionId, area)`; W: `restore-revision (revisionId, postId)` (destructive) | Post and template element writes create Bricks revisions where supported. The restore ability is not in the Academy docs; it was confirmed in the live schema and has not been executed. Global data (classes, variables, theme styles, components) has **no** revisions. Back it up with `list-transfer-items` → `export-transfer-package`, then restore with `inspect-transfer-package` (`zipHash`) → `import-transfer-package` (`expectedZipHash`, explicit item IDs, `allowOverwrite`). | Doc + Skill |

### Known issues reported for 2.4 (Bricks forum)

- **Fixed in 2.4-beta3.** `link: "lightbox"` on image elements blocked every write to the page, because validation checks the whole tree ([thread](https://forum.bricksbuilder.io/t/wip-abilities-api-rejects-link-lightbox-on-image-elements-blocking-all-writes-to-the-page/39825)). Takeaway: one unsupported value anywhere on a page can block unrelated writes.
- **Status "WAIT".** Global-class `selectors` created through MCP render on the frontend but are invisible in the builder UI ([thread](https://forum.bricksbuilder.io/t/wait-global-class-selectors-created-through-mcp-can-render-on-the-frontend-but-remain-invisible-in-the-bricks-builder-ui/40134)).
- **Status "WIP".** MCP-created components are missing from Gutenberg despite "Use in block editor" ([thread](https://forum.bricksbuilder.io/t/wip-mcp-created-component-is-available-in-bricks-but-missing-from-gutenberg-despite-use-in-block-editor-being-enabled/39718)).
- **Solved.** `[object Object]` was saved in element styles written by an MCP client ([thread](https://forum.bricksbuilder.io/t/solved-object-object-saved-in-some-element-styles-using-claude-code-mcp-and-bricks-2-4/39934)).
- **UI issue.** Bricks → AI still asks for the standalone MCP Adapter even when another plugin bundles it; abilities work regardless ([thread](https://forum.bricksbuilder.io/t/bricks-mcp-abilities-with-agent-connector-for-wp/40311)).

## Implications for BricksSnap

### v0.4 — read a connected site

The approach in the work-in-progress commit (`src/lib/wordpress-client.ts`) is the right one. BricksSnap acts as an MCP client of the adapter's default server, calls direct tools when present and uses the dispatcher otherwise.

Corrected in this change, based on the documented shapes above:

- The version is read from `bricksVersion`; `wordpressVersion` is reported too. Before, it always showed "unknown".
- The `{ abilities: [...] }` status envelope is parsed. Before, it produced a bogus `abilities: true` entry. The call requests exact `abilityNames` so disabled rows are visible.
- An ability reported disabled, or missing from the status list, counts as missing. The mere presence of the dispatcher no longer implies availability.
- Arguments are sent under the single name that the ability's input schema declares. Direct tools publish the schema in `tools/list`; dispatcher abilities publish it through `mcp-adapter-get-ability-info`. Before, aliases such as `post_id` + `postId` and `search` + `query` + `s` were sent together, which a strict schema (`additionalProperties: false`) rejects.
- Bricks 2.4 palette colors (`{ id, raw, light }`) are recognized for design-token import.
- `tools/list` pagination is followed.

Adjusted after the live capture:

- The page read keeps Bricks' `documentDigest` in the baseline source. Settings are unwrapped from `{ settings }`. The title is resolved with `find-post (postId)`.
- The search sends `query` with `bricksOnly` and `limit`. An empty search lists recent content; the UI previously searched for the literal word "page". The lock state is shown.
- The design import reads colors and class settings from the paginated list abilities, not the summary. It ignores Bricks' built-in palette (`--bricks-color-*`), and name matching uses whole words; before, `light-blue` became the background color.
- The automatic page list after connecting never ran, because of a stale React state closure.
- Tests replay the sanitized live fixtures.

Still open before release:

1. **Browser review of the UI flow** on the live or a staging site, including narrow screens. The design import result is not yet applied anywhere: `StagingWorkspace` does not pass `onImportDesign`.
2. **Decide how local and staging sites connect.** Bricks recommends testing on local or staging sites, but the current transport rejects:
   - private and loopback addresses (LocalWP, DDEV, LAN staging);
   - custom ports;
   - the `?rest_route=` endpoint form.

   A local-only process connecting to a site the user typed carries little SSRF risk. An explicit opt-in (for example an environment flag) for private targets and custom ports would keep the default strict. Self-signed certificates can be trusted through Node's `NODE_EXTRA_CA_CERTS`; do not disable TLS verification.
3. **Clean up sessions.** HTTP sessions are never terminated: the transport rejects non-POST requests, and closing the client does not send `DELETE`. Allowing `DELETE` to the same endpoint would clean up adapter sessions.
4. **Record where the baseline came from.** Source, timestamp and `documentDigest` are kept. Add the ability version (`bricksAbilitiesVersion`) as well, because response shapes are tied to it.

Alternative transports exist, but none is simpler for this use case:

- **Abilities REST** (`/wp-abilities/v1/.../run`) works only for abilities that opt into REST. On the live site Bricks abilities do not, so this path is not available.
- **WP-CLI** requires shell access to the site.

### v0.5 — review and apply changes

The roadmap warns not to invent an `expected_hash`. The research refines this.

What Bricks does provide:

- Compare-and-set guards on global data: ownership values and digests.
- Value-level guards on `commit-exact-site-edits` (`expectedValue`).
- Idempotency keys and explicit terminal states for imports and changesets.

The live schema adds a page-level guard: `set-page-elements` accepts `expectedDocumentDigest`, and `get-page-elements` returns that digest. `add-element` has no digest parameter.

Recommended order of investigation on a **staging** site (or with explicit approval on the test site):

1. **Whole-page write.** Test `set-page-elements` with the baseline's `documentDigest`, sending the complete merged tree that staging already produces. Confirm that a stale digest is rejected. If it is, this is the atomic conflict check, and v0.5 can apply every staged merge this way.
2. **Additive write.** Compare with `add-element (parentId, position)`. It changes only the new subtree but has no digest guard. Use it only when a fresh-read digest still matches, and accept the small race that remains.
3. **Page workspaces.** Evaluate `checkout-page-workspace` → `preview-page-workspace` → `apply-page-workspace`. The preview token plus idempotency key may provide a reviewed, resumable apply.
4. **Read back and recover.** After each write, read the page back and diff it against the proposal with BricksSnap's existing `diffTemplates`. Record the new revision from `list-revisions`. Test `restore-revision` as the recovery path.
5. **Locks.** Respect `locked` from `find-post`: a page open in the builder can be overwritten by the editor's next save. Global classes and variables that BricksSnap exports need ownership-guarded writes and a transfer-package backup, because they have no revisions.
5. Expect partial rejection. One unsupported value anywhere on a page can block every write. The HTML/CSS importer omits content the user may not create. Show these responses verbatim instead of retrying.

### v0.6 — distribution

- Remote templates and Remote Components are native in Bricks 2.4. Settings abilities expose the library URLs and access flags, but never the password. `list-remote-templates` and `insert-remote-template` give a scripted way to test a BricksSnap-hosted library inside a real Bricks install, which the roadmap already requires.
- Client guidance should reference the official `bricks-skills` package rather than duplicate its rules. BricksSnap's own MCP server remains an offline template workspace: generation, validation, merge and compare. The official Bricks abilities do the site editing.

## Sources

- Bricks: [AI Abilities and Skills](https://academy.bricksbuilder.io/builder/features/ai-abilities-and-skills/), [2.4 changelog](https://bricksbuilder.io/release/bricks-2-4/), [2.4 beta changelog](https://bricksbuilder.io/release/bricks-2-4-beta/), [Bricks data model](https://academy.bricksbuilder.io/developer/schema/), [codeerhq/bricks-skills](https://github.com/codeerhq/bricks-skills) (release 0.1.0; skills `bricks-start-here`, `bricks-ai-tab`, `bricks-agent-repository`, `bricks-quality-gate`, `bricks-headers-footers`, `bricks-breakpoints`, `bricks-design-systems`, `bricks-element-schemas` and others)
- WordPress: [MCP Adapter repository](https://github.com/WordPress/mcp-adapter) (release tags up to v0.6.1; main branch at 0.7.0: `CHANGELOG.md`, `docs/guides/default-server.md`, `docs/guides/transport-permissions.md`, `docs/guides/mrtr.md`), [Introducing the MCP Adapter](https://developer.wordpress.org/news/2026/02/from-abilities-to-ai-agents-introducing-the-wordpress-mcp-adapter/), [Client-side Abilities API in WordPress 7.0](https://make.wordpress.org/core/2026/03/24/client-side-abilities-api-in-wordpress-7-0/)
- MCP: [2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog); [Automattic/mcp-wordpress-remote](https://github.com/Automattic/mcp-wordpress-remote)
- Community: Bricks forum threads linked under Known issues; [BricksFusion overview](https://bricksfusion.com/learn/bricks-2-4-ai-features-explained) (ability counts only)
