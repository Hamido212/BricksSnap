# Use BricksSnap with AI clients (v0.6)

An MCP client such as Claude Code, Codex or Cursor can use two complementary servers:

| Server | What it does | Connection |
| --- | --- | --- |
| **BricksSnap** | Offline template workspace: catalog, section generation, page assembly, validation/repair, additive merge and structural comparison. It has no site access and no credentials. | Local stdio: `node /absolute/path/to/BricksSnap/dist/mcp-server.mjs` ([details](STAGING-MCP.md)) |
| **Your Bricks site** | Bricks' own abilities through the WordPress MCP Adapter: read pages and the design system, render, save and restore revisions. | `npx -y @automattic/mcp-wordpress-remote@latest` with the site's endpoint and an application password ([Bricks docs](https://academy.bricksbuilder.io/builder/features/ai-abilities-and-skills/)) |

For Bricks-specific working rules, install the official [Bricks skills](https://github.com/codeerhq/bricks-skills). They cover when to inspect the design system, how to avoid duplicate classes, and how to verify writes. BricksSnap does not duplicate them.

## Configuration

Run `npm ci && npm run build:mcp` in the BricksSnap checkout first. Keep the application password in the client's MCP configuration or environment. **Never paste it into a chat**: chat transcripts are stored.

Claude Code:

```sh
claude mcp add brickssnap -- node /absolute/path/to/BricksSnap/dist/mcp-server.mjs
claude mcp add my-site \
  --env WP_API_URL='https://example.com/wp-json/mcp/mcp-adapter-default-server' \
  --env WP_API_USERNAME='bricks-ai' \
  --env WP_API_PASSWORD='xxxx xxxx xxxx xxxx' \
  -- npx -y @automattic/mcp-wordpress-remote@latest
```

Codex (`~/.codex/config.toml`):

```toml
[mcp_servers.brickssnap]
command = "node"
args = ["/absolute/path/to/BricksSnap/dist/mcp-server.mjs"]

[mcp_servers.my-site]
command = "npx"
args = ["-y", "@automattic/mcp-wordpress-remote@latest"]

[mcp_servers.my-site.env]
WP_API_URL = "https://example.com/wp-json/mcp/mcp-adapter-default-server"
WP_API_USERNAME = "bricks-ai"
WP_API_PASSWORD = "xxxx xxxx xxxx xxxx"
```

Other clients use the same command and environment in their JSON format.

## Safe defaults for the site connection

- **Where.** Use a staging site or draft pages first; Bricks' abilities are experimental.
- **Which user.** Create a dedicated WordPress user with only the builder access it needs, not an administrator. Revoke its application password when you are done.
- **Which abilities.** Under Bricks → AI → Abilities, disable what the workflow does not need, especially abilities marked Destructive.

## Tool discovery

- **Bricks tools.** The site exposes a few Bricks abilities as direct tools, for example `bricks-get-design-context`. Others are called through `mcp-adapter-execute-ability` with `{ "ability_name": "bricks/…", "parameters": {…} }`. Use `mcp-adapter-get-ability-info` for exact parameters: Bricks rejects unknown keys.
- **BricksSnap tools.** BricksSnap's eight tools start with `bricks_` (underscores), for example `bricks_merge_templates`.

## Workflows that combine both

**Add a generated section to a page, guarded**

> Read page 42 with `bricks/get-page-elements` and keep its `documentDigest`. Generate a pricing section with BricksSnap's `bricks_generate_section`, choosing the `colorPalette` ID from `bricks_list_templates` closest to the site's palette in `bricks/list-color-palettes`. Merge it after the hero with `bricks_merge_templates`, then show me the structural diff from `bricks_compare_templates`. After my approval, save the merged tree with `bricks/set-page-elements` including `expectedDocumentDigest`. Read the page back and report the returned `revisionId`.

BricksSnap's generator uses its predefined palettes. It does not take arbitrary site colors, so adjust colors in the merged JSON or in Bricks when they must match exactly.

The digest makes Bricks refuse the save if the page changed after it was read. The `revisionId` restores the previous state with `bricks/restore-revision`.

**Preview before saving**

> Render the merged tree with `bricks/render-elements` for page 42 (nothing is saved) and summarize visible differences.

**Validate AI-authored JSON**

> Design a testimonial section as native Bricks JSON, run it through `bricks_validate_template`, and list every warning before using it.

**Without an AI client.** The BricksSnap app runs the same guarded flow in Staging: load a page, add sections, **Render with Bricks**, **Apply to WordPress**, and restore. See [WordPress connection](WORDPRESS.md).

## Remote library instead of MCP

To give a team the BricksSnap catalog inside the Bricks template library without an AI client, add a BricksSnap deployment as a remote library. See [Remote library](REMOTE-LIBRARY.md).
