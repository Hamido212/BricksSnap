# Connect a WordPress site (read-only, v0.4)

BricksSnap can read a live Bricks page and the site's global classes through the official WordPress MCP Adapter, and use them as the staging baseline. This release reads only; it does not change the site. Background and ability details are in the [research](RESEARCH-2026-09-28-BRICKS-MCP.md).

## Requirements

- Bricks 2.4 or newer with **Bricks → AI → Enable Bricks abilities** turned on. The abilities are experimental; Bricks recommends a local or staging site.
- WordPress 6.9 or newer (Abilities API) and the **WordPress MCP Adapter** plugin, 0.6.1 or newer. It is not in the WordPress.org directory. If the one-click installer in Bricks → AI cannot reach GitHub, download `mcp-adapter.zip` from the [adapter releases](https://github.com/WordPress/mcp-adapter/releases) and upload it under **Plugins → Add New Plugin → Upload Plugin**.
- An application password for a dedicated WordPress user. Give that user only the Bricks builder access it needs rather than using an administrator. Revoke the password when you are done.
- These abilities enabled under **Bricks → AI → Abilities**:
  - required: `get-page-elements` and `get-design-context`;
  - also used: `find-post`, `get-page-settings`, `list-global-classes`, `list-color-palettes`, `get-mcp-version` and `list-ability-status`.

  Write abilities are not used by this release.

## Connect

1. Start BricksSnap locally with `npm run dev:local`. The WordPress route is only available in this mode and only answers requests from this computer.
2. Open **Staging → Set up WordPress connection**.
3. Enter the endpoint shown in Bricks → AI (usually `https://example.com/wp-json/mcp/mcp-adapter-default-server`), the username and the application password. Select **Check WordPress connection**.
4. The status shows the Bricks and WordPress versions and any missing abilities. Recently modified Bricks pages and templates are listed automatically. **Filter pages** searches titles. "open in builder" marks a page someone is currently editing.
5. Select **Load page into baseline**. BricksSnap reads the element tree and Bricks' document digest. It also includes the site's definitions of any global classes the page uses.
6. Optional: **Import site design context** loads all global classes and palette colors. Review then warns when a staged class reuses a site class name under another ID, or differs from the site's definition.
7. Add a section or version on the right and **Review changes** as usual. Download the reviewed template and import it in Bricks.

The password is kept only in the open browser tab and sent to the local BricksSnap server for each request. It is not stored.

## Local and staging sites

By default the connection accepts public HTTPS hosts on port 443. For a site on your machine or network (LocalWP, DDEV, a LAN staging server), start with:

```sh
BRICKSSNAP_ALLOW_PRIVATE_WORDPRESS=true npm run dev:local
```

This allows private and loopback addresses and custom ports; HTTPS stays mandatory.

- **Self-signed certificates.** Trust the local certificate, or point Node at it with `NODE_EXTRA_CA_CERTS=/path/to/ca.pem`. TLS verification is never disabled.
- **No pretty permalinks.** Use the endpoint form `https://example.com/?rest_route=/mcp/mcp-adapter-default-server`.

## Troubleshooting

| Message | Cause and fix |
| --- | --- |
| MCP endpoint not found | The MCP Adapter is missing or inactive, or the URL is wrong. Copy the endpoint from Bricks → AI → Configuration. |
| WordPress rejected access | Wrong or revoked application password, or the user lacks permission. Application passwords need HTTPS (or `WP_ENVIRONMENT_TYPE` `local`). |
| Ability … is disabled | An administrator turned it off under Bricks → AI → Abilities. |
| WordPress must resolve to public internet addresses | The site is local or private; use the opt-in above. |
| WordPress redirected the request | Use the final HTTPS URL. BricksSnap does not follow redirects with credentials. |

## Limits

- **Pages.** One page or template at a time, up to 1,500 elements and a 3 MB response.
- **What is read.** Header and footer templates are read from their own area automatically. Page settings are read but not staged.
- **Colors.** Brand colors are mapped by palette color name (primary, secondary, background, text, …). Bricks' built-in default palette is ignored.
- **Review scope.** The comparison is structural. Check rendering, dynamic data and forms in Bricks.

Writing changes back is planned for 0.5 (see the [roadmap](ROADMAP.md)).
