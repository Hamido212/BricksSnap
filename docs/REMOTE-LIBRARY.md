# BricksSnap as a Bricks remote template library (v0.6)

A BricksSnap deployment can act as a **Remote Library** source in Bricks. Bricks users browse the design library in the builder and insert pages and sections like templates from any other Bricks site. No JSON download is needed.

Since 0.9.0 the library serves the Studio's designs instead of the older classic catalog, in German and English (206 templates since 0.12.0):

- **Pages.** Each of the 13 designs (for example "Nord", "Trattoria", "Lachfalte") as a complete page.
- **Sections.** All 90 layouts as single sections, in the "Fundament" design.

Styling travels as `bs-` global classes. Class IDs are the same in every design, so sections inserted later take on the look of the first design the site received. To change the look everywhere, install the design system from the Studio (see [Studio](STUDIO.md)).

## How it works

Bricks 2.4 first asks a source for its versioned remote-library package. BricksSnap answers that request with `rest_no_route`, so Bricks falls back to the legacy Remote Templates protocol, which BricksSnap implements:

| Request (from the Bricks site) | Response |
| --- | --- |
| `GET /wp-json/bricks/v1/get-templates-data?site=<requesting site>` | `{ timestamp, date, templates, authors, bundles, tags, globalVariables, globalVariablesCategories, colorPalette, styleManager }` |
| `GET /wp-json/bricks/v1/get-templates?site=…` | The `templates` array |
| `GET /wp-json/bricks/v1/remote-library…` | 404 `rest_no_route` (triggers the fallback) |

Each template has `{ id, name, title, date, date_formatted, author, permalink, thumbnail, bundles, tags, type, content }`. This is the shape captured from a Bricks 2.4.2 source site.

- **IDs** are stable numbers derived from the slug (`design-nord-de`, `section-hero-split-en`).
- **Bundles** are "Pages" and "Sections" per language; tags name the style, industry or section type.
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

The designs are public in the app anyway, so the library is enabled by default. Responses are cacheable (`s-maxage=3600`); a full response is about 1.8 MB.

## Hosting notes

- **Blocked `/wp-json/` paths.** Hosting firewalls can block these paths on non-WordPress sites as scanner protection. Before the library existed, Vercel's automatic DDoS mitigation denied requests from one test network to non-existent `/wp-json/*` paths (`x-vercel-mitigated: deny`). After deployment, the endpoints answered normally, including requests from the Bricks site's server. If requests are denied, check the hosting firewall. On Vercel, system bypass rules for specific IPs need a Pro plan.
- **Reachability.** The Bricks site's server must be able to reach the deployment. Protected previews (for example Vercel preview SSO) and `localhost` do not work.
- **Sample images.** Built-in templates use sample images from Unsplash. Some host firewalls block requests containing external URLs (see [WordPress connection](WORDPRESS.md#apply-a-reviewed-change-v05)); replace the images after inserting.

## Verification status

- **Automated.** Tests check the response against the key sets captured from a Bricks 2.4.2 source, the element-tree validity of all 60 templates, the access rules and the fallback route.
- **End to end (Bricks 2.4.2 site, `https://bricks-snap.vercel.app` as source).** Bricks' own consumer ran through its abilities.
  - `bricks/list-remote-templates` returned all 60 templates with bundles and no error.
  - `bricks/insert-remote-template` inserted "Pricing - Three Tiers" into a draft page (83 elements, component and design-asset import with nothing to import) and created a revision. The page was then restored.
  - This confirms that Bricks 2.4 falls back from the package protocol to BricksSnap's legacy responses.
- **Not verified.**
  - The password parameter name.
  - Thumbnails inside the builder UI (the builder was not opened; the thumbnail URLs are served as SVG).
