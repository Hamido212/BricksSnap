# BricksSnap as a Bricks remote template library (v0.6)

A BricksSnap deployment can act as a **Remote Library** source in Bricks. Bricks users browse the 60 catalog templates in the builder's template library and insert them like templates from any other Bricks site. No JSON download is needed.

## How it works

Bricks 2.4 first asks a source for its versioned remote-library package. BricksSnap answers that request with `rest_no_route`, so Bricks falls back to the legacy Remote Templates protocol, which BricksSnap implements:

| Request (from the Bricks site) | Response |
| --- | --- |
| `GET /wp-json/bricks/v1/get-templates-data?site=<requesting site>` | `{ timestamp, date, templates, authors, bundles, tags, globalVariables, globalVariablesCategories, colorPalette, styleManager }` |
| `GET /wp-json/bricks/v1/get-templates?site=…` | The `templates` array |
| `GET /wp-json/bricks/v1/remote-library…` | 404 `rest_no_route` (triggers the fallback) |

Each template has `{ id, name, title, date, date_formatted, author, permalink, thumbnail, bundles, tags, type, content }`. This is the shape captured from a Bricks 2.4.2 source site.

- **IDs** are stable numbers derived from the catalog slug.
- **Bundles** are the catalog categories.
- **Types** are `content` for full pages, `header` for navbars, `footer` for footers and `section` otherwise.
- **Thumbnails** are SVG cards served from `/api/library/thumbnail/<slug>`.
- **Errors** come back like Bricks sends them: HTTP 200 with `{ error: { code, message } }`, for example `no_site_url`.

## Add it in Bricks

On the Bricks site, go to **Bricks → Settings → Templates & components → Remote libraries**. Add the BricksSnap URL (for example `https://your-brickssnap.example`) with a name, save, and open the template library in the builder.

## Access rules (deployment environment)

| Variable | Effect |
| --- | --- |
| `BRICKSSNAP_REMOTE_LIBRARY=false` | Disable the library (`my_templates_access_disabled`). |
| `BRICKSSNAP_REMOTE_LIBRARY_WHITELIST` | Comma- or space-separated site origins allowed to request templates (`site_not_whitelisted` otherwise). |
| `BRICKSSNAP_REMOTE_LIBRARY_PASSWORD` | Require the remote library password configured in Bricks (`remote_templates_password_required` otherwise). The query parameter name `password` is inferred and not yet verified against a Bricks consumer. |

The catalog is public in the app anyway, so the library is enabled by default. Responses are cacheable (`s-maxage=3600`); a full response is about 1 MB.

## Hosting notes

- **Blocked `/wp-json/` paths.** Some hosting firewalls block these paths on non-WordPress sites as scanner protection. On the project's Vercel deployment, `/wp-json/bricks/v1/*` currently returns 403 with `x-vercel-mitigated: deny`. Allow `/wp-json/bricks/v1/get-templates-data` and `/wp-json/bricks/v1/get-templates` in the firewall settings, or Bricks cannot reach the library.
- **Reachability.** The Bricks site's server must be able to reach the deployment. Protected previews (for example Vercel preview SSO) and `localhost` do not work.
- **Sample images.** Built-in templates use sample images from Unsplash. Some host firewalls block requests containing external URLs (see [WordPress connection](WORDPRESS.md#apply-a-reviewed-change-v05)); replace the images after inserting.

## Verification status

- **Automated.** Tests check the response against the key sets captured from a Bricks 2.4.2 source, the element-tree validity of all 60 templates, the access rules and the fallback route.
- **Not yet done.** An end-to-end browse/insert from a Bricks site needs a publicly reachable deployment and is still pending (see the [roadmap](ROADMAP.md)).
