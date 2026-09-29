# Template staging and MCP (v0.3)

## Review a template change

1. Open **Staging**. **Load demo** supplies a hero/footer page and a features section.
2. Paste or upload the existing Bricks export on the left. An empty baseline starts a new page.
3. Paste/upload the addition on the right, or choose **Use generator result** after generating/importing a template in Generator.
4. Choose beginning, end, or after a top-level section. **Compare complete versions** instead compares the two supplied versions without merging.
5. Select **Review changes**. Inspect added, removed, changed and moved elements, metadata changes and both trees.
6. Download the reviewed template. Import and check it in Bricks before publishing.

Editing either JSON input or changing the operation clears the review and export. Switching tabs preserves drafts in memory; reloading closes the workspace and loses them. Staging itself makes no network requests and stores no drafts. An MCP client sends its tool arguments to whichever MCP server you configure.

The comparison is structural, not a screenshot or the Bricks renderer. IDs identify corresponding elements. Regenerating a section with fresh IDs produces additions/removals rather than a visual similarity match. Changed elements can also move; their detail includes `position`, while the summary counts them once as changed.

### Merge rules

- Existing elements and settings remain unchanged in the staged result. Incoming nodes are inserted as a group in root order.
- Incoming ID collisions are remapped together with parent/child references, supported `#brxe-ID` CSS selectors and direct anchor links. Other detected references to colliding IDs stop the merge for explicit resolution.
- Conflicting dependency IDs, global class names, rendered CSS IDs and page metadata stop merging. Identical dependency definitions are deduplicated.
- Invalid trees are rejected rather than silently repaired. Use the separate validation/import workflow first, inspect its repairs, then stage that result.
- A maximum of 1,500 elements and 2,000,000 JSON characters per template is supported; uploaded files also have a 2 MB byte limit. Custom/add-on elements and unrecognized dependency formats can require manual adaptation.
- Full semantic validation of nested controls, query loops, interactions and executable content is not provided. Shared classes, fonts, custom breakpoints and component definitions still need destination-side checks.
- Download creates a Bricks import envelope (title, type, date, author) and resolves `%root%` CSS shorthand. It exports the full result, not a patch to a live page. Compare mode may include removals.

## Connect a local MCP client

From the repository, with Node.js 22.12+ installed:

```sh
npm ci
npm run build:mcp
```

Configure a client that supports MCP stdio to launch Node with an **absolute** path to the built file. Example configuration shape (adapt to your client's configuration format):

```json
{
  "mcpServers": {
    "brickssnap": {
      "command": "node",
      "args": ["C:/path/to/BricksSnap/dist/mcp-server.mjs"]
    }
  }
}
```

On macOS/Linux, use your repository's absolute path. Node must be on the client's PATH, or `command` must be its absolute executable path. Keep this repository's `node_modules` directory installed: the build bundles project code but leaves package dependencies external. Rebuild after updates.

Launch the file directly in client configuration. `npm run mcp` is useful for manual startup but npm's banner can interfere with stdio protocol output. The CLI does not load `.env.local`, start Next.js, read credentials or connect to WordPress. It prints protocol messages only on stdout. No `@brickssnap/mcp-server` npm package is published as part of this release.

HTTP uses the same tools at `/api/mcp`, opt-in as described in [Setup](SETUP.md). ChatGPT's hosted MCP connection uses HTTP; the stdio configuration is for local clients. MCP tools themselves do not sign you into ChatGPT. The separate local **Sign in with ChatGPT** generation workflow remains available.

## Tools

| Tool | Inputs and result |
| --- | --- |
| `bricks_get_schema` | Optional `element`; generation instructions and native control names. |
| `bricks_list_templates` | Optional `search`; catalog plus section, preset and palette IDs. |
| `bricks_get_template` | Catalog `id`; fresh importable template. |
| `bricks_validate_template` | JSON string `json`, optional `title` and export `type`; repaired import object and warnings. |
| `bricks_generate_section` | `prompt`, section-type `section`, optional `stylePreset` and `colorPalette` IDs; generated section and warnings. |
| `bricks_assemble_page` | `prompt`, ordered `sections` array (1–12), optional preset/palette IDs; page and warnings. |
| `bricks_kit_options` | None; style directions, font pairs, industries and every section type with its layouts. |
| `bricks_kit_page` | `sections` (type, optional `variant`, 1–16), optional `kit` and `profile`, `title`; Studio sections or page with global classes, design system and quality checks. See [Studio](STUDIO.md). |
| `bricks_merge_templates` | JSON strings `baseline` and `addition`, `position` (`append`, `prepend`, `after`), `afterId` for `after`; staged template, diff, ID remapping and warnings. |
| `bricks_compare_templates` | JSON strings `baseline` and `proposal`; element deltas, counts and metadata keys that differ. |

Generation uses the built-in engine with sample content and keyword detection; it does not call another AI service. The connected AI can instead author native JSON and call validation. Built-in generator prompts are limited to 4,000 characters; comparison/merge JSON arguments to 1,000,000 characters each. The HTTP endpoint also enforces an approximately 2.1 MB request-body limit, including JSON escaping.

Try: “List BricksSnap section and palette IDs. Assemble a hero and footer, generate a features section, insert it after the hero, compare the result with the original, and return the full reviewed template as JSON. Show all warnings.”

## Verification

`npm test` first builds the CLI, then tests the real stdio process alongside HTTP MCP and engine tests. Staging coverage includes all catalog templates merged with themselves, preservation of existing elements, conflicting dependencies, ID/CSS/anchor remapping, invalid trees and reorder diffs. `npm run lint`, `npm run build` and `npm run typecheck` complete the local checks.
