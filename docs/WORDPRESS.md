# Connect a WordPress site

BricksSnap can read a live Bricks page and the site's global classes through the official WordPress MCP Adapter, and use them as the staging baseline (v0.4). Since v0.5 it can also save a reviewed change back to that page and restore the previous version. Background and ability details are in the [research](RESEARCH-2026-09-28-BRICKS-MCP.md).

## Requirements

- Bricks 2.4 or newer with **Bricks → AI → Enable Bricks abilities** turned on. The abilities are experimental; Bricks recommends a local or staging site.
- WordPress 6.9 or newer (Abilities API) and the **WordPress MCP Adapter** plugin, 0.6.1 or newer. It is not in the WordPress.org directory. If the one-click installer in Bricks → AI cannot reach GitHub, download `mcp-adapter.zip` from the [adapter releases](https://github.com/WordPress/mcp-adapter/releases) and upload it under **Plugins → Add New Plugin → Upload Plugin**.
- An application password for a dedicated WordPress user. Give that user only the Bricks builder access it needs rather than using an administrator. Revoke the password when you are done.
- These abilities enabled under **Bricks → AI → Abilities**:
  - required: `get-page-elements` and `get-design-context`;
  - also used: `find-post`, `get-page-settings`, `list-global-classes`, `list-color-palettes`, `get-mcp-version`, `list-ability-status`, `render-elements` (for the rendered preview), `list-templates` and `get-template-settings` (for site templates), and `list-global-variables` (for the Studio design system).

  Saving additionally needs `set-page-elements`, restoring needs `restore-revision`, importing images needs `upload-media` and `find-media`, creating missing classes needs `batch-create-global-classes`, creating templates needs `create-template`, changing template conditions needs `set-template-conditions`, and installing the Studio design system needs `create-color-palette`, `create-color`, `update-color`, `set-global-variable-categories` and `set-global-variables`. Keep them disabled if you only want to read.

## Connect

1. Start BricksSnap locally with `npm run dev:local`. The WordPress route is only available in this mode and only answers requests from this computer.
2. Open **Staging → Set up WordPress connection**.
3. Enter the endpoint shown in Bricks → AI (usually `https://example.com/wp-json/mcp/mcp-adapter-default-server`), the username and the application password. Select **Check WordPress connection**.
4. The status shows the Bricks and WordPress versions and any missing abilities. Recently modified Bricks pages and templates are listed automatically. **Filter pages** searches titles. "open in builder" marks a page someone is currently editing.
5. Select **Load page into baseline**. BricksSnap reads the element tree and Bricks' document digest. It also includes the site's definitions of any global classes the page uses.
6. Optional: **Import site design context** loads all global classes and palette colors. Review then warns when a staged class reuses a site class name under another ID, or differs from the site's definition.
7. Add a section or version on the right, or generate one in the site's design (below), and **Review changes** as usual. Download the reviewed template and import it in Bricks, or apply it.

The password is kept only in the open browser tab and sent to the local BricksSnap server for each request. It is not stored.

## Site templates: headers, footers and conditions

**Site templates** (below the connection) lists the site's Bricks templates with type, status and number of conditions, filtered by type if you like.

- **Edit a template.** **Load into baseline** loads a template's elements, for a header or footer its header or footer area, like a page. Add or compare a change, review it and use **Apply to WordPress**. The same checks, digest guard, read-back and restore apply as for pages.
- **Conditions.** **Conditions** shows where Bricks uses the template: entire website, front page, post types, archives, search results, the 404 page, terms or specific posts, each optionally as an exclusion. Section templates can also take a WordPress hook.
  - Change the rows and confirm, then **Save conditions** replaces the template's conditions with `set-template-conditions`. Other template settings (sticky header, popup options) are not touched.
  - Bricks has no concurrency guard for conditions. BricksSnap reads the stored conditions again right before saving and refuses if they changed since you opened them. Afterwards it reads them back.
  - Conditions that use settings BricksSnap does not know (for example from add-ons) are shown read-only; edit those in Bricks.
  - Conditions of a published template take effect immediately; those of a draft only once it is published.
- **Save as a new Bricks template.** After **Review changes**, this creates a template (header, footer, section, content, popup, archive, search or error) from the reviewed elements with `create-template`. It is a draft unless you choose to publish it, and then becomes the baseline so you can set its conditions or keep editing it. As with applying, the global classes it uses must exist on the site. For header and footer templates BricksSnap warns when a root element also uses the `header` or `footer` tag, because Bricks already wraps these templates in that landmark.

Deleting templates and changing their status are left to WordPress and Bricks.

## Install the Studio design system

After **Open in Staging** from the [Studio](STUDIO.md), the **Design system** panel compares the kit's palette and variables with the connected site (**Check what changes**, read-only) and installs them after confirmation: a "BricksSnap" color palette whose colors define the `--bs-*` variables, and global variables in a "BricksSnap" category. Each step is guarded by Bricks' ownership digests, nothing is deleted, variables defined elsewhere are reported, and the result is read back. Fonts named in the variables still need to be added under Bricks → Settings → Custom fonts or in a theme style.

## Generate in the site's design

Once a page is loaded (or the design context imported), **Generate in the site's design** builds BricksSnap's built-in sections in the site's colors and fonts and puts them into the right-hand field as the new section.

- **Color sources.** The site's palettes (`list-color-palettes`) and the solid colors the loaded page uses, most used first. Many sites style pages directly rather than through palettes; the page's colors cover that case.
- **Roles.** Each role (primary, secondary, accent, background, surface, text, heading, muted, border) gets a suggested color. Palette names decide first, for example "brand-primary" or "text-body". Otherwise lightness, chroma and frequency on the page decide: the lightest neutral becomes the background, the darkest the heading color. Bricks' default palette ranks last. Change any role before generating; "BricksSnap default" keeps the built-in color.
- **Palette links.** With **Link palette colors to their CSS variables**, colors taken from a palette are written as `var(--name, #hex)`. Later palette changes on the site then apply to the section; the hex keeps it readable where the variable is missing. Page colors have no variable and stay literal.
- **Fonts.** The page's font stacks are offered first. Stacks are written as Bricks' font family plus its native `fallback`, which Bricks renders as `font-family: "Segoe UI", Arial, sans-serif`. **Site typography** leaves fonts to theme styles; **BricksSnap default** keeps Inter.
- **Content.** Sections contain sample copy and sample images. Review the text, and import the images before applying (below).

MCP clients can do the same with `bricks_generate_section` or `bricks_assemble_page` and the `colors` argument (hex per role), for example from `bricks/list-color-palettes`.

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
- **"The web host answered with a page … instead of WordPress"** means a host firewall, rate limit or maintenance mode blocked the request, and nothing was confirmed as saved. On the test site, the host's firewall blocked any request (save, render or new template) that contained external image URLs or email addresses, such as the sample images and the sample contact address in BricksSnap's built-in sections. BricksSnap names these in the message. Import the images first (below); for email addresses, ask your host to allow requests to `/wp-json/mcp/`.

### Import external images into the media library

When a reviewed change uses images from other servers, **Before saving** (above Apply) lists them and offers **Import images into the media library** (`upload-media` must be enabled). This also applies before saving the change as a new template.

- **How files are copied.** BricksSnap downloads each image itself and uploads it to WordPress as base64 data, so the request carries no external URL. Downloads must be HTTPS from public addresses (checked for every redirect), with image content types only, 8 MB per file and at most 30 images.
- **Rewriting.** The image settings are rewritten to the media item's ID and URL. Links and other URLs are left alone.
- **Re-imports.** Uploads are named `brickssnap-<hash>.<ext>`, so importing the same image again reuses the earlier upload (`find-media`).
- **Failures.** Images that fail are listed and stay external.
- **Scope of a save.** Only elements are saved. Page settings are not changed. Global classes the change uses must exist on the site; create missing ones first (below).
- **Empty pages.** A page that was empty has no previous version to restore.

### Create missing global classes

Sections from the catalog or another site can use global classes the connected site lacks. Apply refuses such changes. **Create missing global classes** (under **Before saving**, shown when the change uses classes the loaded page and design context do not contain, or after that refusal) adds them from the change's definitions (`batch-create-global-classes` must be enabled).

- **Additive only.** Existing classes are never changed or overwritten.
  - A staged class whose name already exists on the site with the same definition reuses the site's class: the elements switch to its ID.
  - A name that exists with a different definition is reported and nothing is created for it. Rename the class in the staged JSON, or use the site's class.
- **One atomic write.** All missing classes are created together, guarded by the class store's ownership digest from the same read. If classes change on the site in between, Bricks refuses and nothing is saved.
- **Kept as staged.** Class IDs stay as staged, so element references remain valid. Categories from another site are dropped.
- **Undefined references.** Referenced IDs without a definition in the change are listed; remove them or add their definitions.
- **Removing a class later.** Created classes stay when a page is restored. Remove unused ones in Bricks → Global classes.

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
| Saving is disabled on this site | Enable the named ability (`set-page-elements`, `restore-revision`, `upload-media`, `batch-create-global-classes`, or a palette or variable ability for the design system) under Bricks → AI → Abilities. |
| The site's palettes or variables changed during the install | Someone edited palettes or variables in the meantime. Click **Check what changes** again and install; completed steps are kept and not repeated. |
| … is open in the Bricks builder | Close the builder or confirm applying anyway; the builder's next save would overwrite the change. |

## Limits

- **Pages.** One page or template at a time, up to 1,500 elements and a 3 MB response.
- **Templates.** Conditions cover Bricks' own condition types. Template settings such as sticky headers, popup behavior or password protection are not edited.
- **What is read.** Header and footer templates are read from their own area automatically. Page settings are read but not staged.
- **Colors.** The design context's brand colors are mapped by palette color name (primary, secondary, background, text, …); Bricks' built-in default palette is ignored there. Generating in the site's design suggests roles from all palettes and the loaded page. Theme styles and global variables are not read yet.
- **Review scope.** The comparison is structural. Check rendering, dynamic data and forms in Bricks.

See the [roadmap](ROADMAP.md) for what comes next.
