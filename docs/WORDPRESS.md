# Connect a WordPress site

BricksSnap can read a live Bricks page and the site's global classes through the official WordPress MCP Adapter, and use them as the staging baseline (v0.4). Since v0.5 it can also save a reviewed change back to that page and restore the previous version. Background and ability details are in the [research](RESEARCH-2026-09-28-BRICKS-MCP.md).

## Requirements

- Bricks 2.4 or newer with **Bricks → AI → Enable Bricks abilities** turned on. The abilities are experimental; Bricks recommends a local or staging site.
- WordPress 6.9 or newer (Abilities API) and the **WordPress MCP Adapter** plugin, 0.6.1 or newer. It is not in the WordPress.org directory. If the one-click installer in Bricks → AI cannot reach GitHub, download `mcp-adapter.zip` from the [adapter releases](https://github.com/WordPress/mcp-adapter/releases) and upload it under **Plugins → Add New Plugin → Upload Plugin**.
- An application password for a dedicated WordPress user. Give that user only the Bricks builder access it needs rather than using an administrator. Revoke the password when you are done.
- These abilities enabled under **Bricks → AI → Abilities**:
  - required: `get-page-elements` and `get-design-context`;
  - also used: `find-post`, `get-page-settings`, `list-global-classes`, `list-color-palettes`, `get-mcp-version`, `list-ability-status` and `render-elements` (for the rendered preview).

  Saving additionally needs `set-page-elements`, and restoring needs `restore-revision`. Keep both disabled if you only want to read.

## Connect

1. Start BricksSnap locally with `npm run dev:local`. The WordPress route is only available in this mode and only answers requests from this computer.
2. Open **Staging → Set up WordPress connection**.
3. Enter the endpoint shown in Bricks → AI (usually `https://example.com/wp-json/mcp/mcp-adapter-default-server`), the username and the application password. Select **Check WordPress connection**.
4. The status shows the Bricks and WordPress versions and any missing abilities. Recently modified Bricks pages and templates are listed automatically. **Filter pages** searches titles. "open in builder" marks a page someone is currently editing.
5. Select **Load page into baseline**. BricksSnap reads the element tree and Bricks' document digest. It also includes the site's definitions of any global classes the page uses.
6. Optional: **Import site design context** loads all global classes and palette colors. Review then warns when a staged class reuses a site class name under another ID, or differs from the site's definition.
7. Add a section or version on the right and **Review changes** as usual. Download the reviewed template and import it in Bricks.

The password is kept only in the open browser tab and sent to the local BricksSnap server for each request. It is not stored.

## Preview as Bricks renders it (v0.5)

After **Review changes**, select **Render with Bricks**. The connected site renders the saved page and the reviewed version with `render-elements`, and nothing is saved.

- **Layout.** Both versions appear side by side at 1280 px or 390 px, with added and changed elements outlined. Scroll inside each preview.
- **Scope.** The previews use Bricks' element markup and CSS plus Bricks' frontend stylesheet, not the site's theme styles or global class CSS.
- **Safety.** They run in sandboxed frames without scripts, so interactions and sliders appear static.

## Apply a reviewed change (v0.5)

After **Review changes**, section **5. Apply to WordPress** shows the target page, the site and the baseline digest.

1. Confirm that you reviewed the change, then select **Apply to WordPress**.
2. BricksSnap checks before saving:
   - `set-page-elements` is enabled;
   - the page is not open in the Bricks builder (you can override this explicitly);
   - the page still has the digest it had when you loaded it;
   - every global class the change uses exists on the site.
3. Bricks saves the complete reviewed element tree with `expectedDocumentDigest`. It refuses the save atomically if someone changed the page in the meantime (`bricks_conflict_document_digest_mismatch`). Before saving, Bricks keeps a revision of the previous state.
4. BricksSnap reads the page back and compares it with the reviewed version. The read-back becomes the new baseline.
5. **Restore previous version** restores that revision with `restore-revision`, but only while the page still has the digest BricksSnap saved. Bricks keeps another revision of the replaced state, so the restore can be undone in Bricks too.

What to expect:

- **Read-back differences** are usually normalization: Bricks 2.4 converts custom CSS rules into native style controls, for example `transition` → `_cssTransition` and a hover background → `_background:hover`. Check the page in Bricks when differences are reported.
- **"The web host answered with a page … instead of WordPress"** means a host firewall, rate limit or maintenance mode blocked the request, and nothing was confirmed as saved. On the test site, the host's firewall blocked writes containing external image URLs (the sample images in BricksSnap's built-in sections). Use media from your own site, or ask your host to allow requests to `/wp-json/mcp/`.
- **Scope of a save.** Only elements are saved. Page settings are not changed, and global class definitions are never created; classes must already exist.
- **Empty pages.** A page that was empty has no previous version to restore.

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
| The page changed since it was loaded | Someone saved the page after you loaded it. Load it into the baseline again and review. |
| Saving is disabled on this site | Enable `set-page-elements` (or `restore-revision`) under Bricks → AI → Abilities. |
| … is open in the Bricks builder | Close the builder or confirm applying anyway; the builder's next save would overwrite the change. |

## Limits

- **Pages.** One page or template at a time, up to 1,500 elements and a 3 MB response.
- **What is read.** Header and footer templates are read from their own area automatically. Page settings are read but not staged.
- **Colors.** Brand colors are mapped by palette color name (primary, secondary, background, text, …). Bricks' built-in default palette is ignored.
- **Review scope.** The comparison is structural. Check rendering, dynamic data and forms in Bricks.

See the [roadmap](ROADMAP.md) for what comes next.
