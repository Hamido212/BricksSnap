# BricksSnap 0.7.0 — Site design, classes and templates

**Work in the connected site's own design and structure.** v0.5 saved reviewed changes to a page. 0.7.0 covers what such changes depend on: the site's colors and fonts, its media, its global classes and its templates. It also fixes font stacks in the engine.

- **Generate in the site's design.** After loading a page, BricksSnap's built-in sections can be generated in the site's colors and fonts.
  - **Colors.** They come from the site's palettes and from the colors the loaded page actually uses, ranked by use. Many sites style pages directly, as the test site does.
  - **Roles.** Colors are suggested per role (primary, background, text, heading, …) and can be changed. Palette colors can be linked to their CSS variables.
  - **Fonts.** The page's font stack, the site's typography or BricksSnap's default font.
  - **MCP.** `bricks_generate_section` and `bricks_assemble_page` accept role `colors`.
- **Before saving.**
  - **Images.** External images are copied into the media library. BricksSnap downloads them itself and uploads them as data, so the save carries no external URL.
  - **Classes.** Missing global classes are created from the change's definitions in one atomic write, guarded by Bricks' ownership digest. Existing classes are never changed. An identical class with the same name is reused; a different one is reported.
- **Site templates.**
  - **List and edit.** The site's templates are listed with type, status and number of conditions. Headers, footers and sections load into the baseline like pages and save back through the same guarded apply, read-back and restore.
  - **Conditions.** An editor sets where a template applies: entire website, front page, post types, archives, search, 404, terms and specific posts, with exclusions. Saving re-reads the stored conditions first and refuses if they changed.
  - **New templates.** A reviewed change can become a new template, created as a draft unless publishing is chosen.
- **Engine fixes.**
  - **Font stacks.** They now use Bricks' native `fallback` key. Previously the stack went into scoped custom CSS. Bricks' abilities turned that CSS into a single quoted font name (`"Segoe UI, Arial, sans-serif"`) that browsers cannot match, so generated sections fell back to the default font when saved or rendered through WordPress.
  - **Form placeholders.** Email placeholders no longer contain sample addresses.

See [WordPress](WORDPRESS.md) for the workflows and the [changelog](../CHANGELOG.md) for details.

## Verified

- **Live.** Tested on a Bricks 2.4.2 site (WordPress 7.1.2, MCP Adapter 0.6.1), in the browser at 1440 px and 390 px. Write tests used a draft page and draft templates only; every change was restored or deleted afterwards.
  - **Generate in the site's design.** Suggestions matched the page's real design (heading `#14291f`, text `#56645b`, border `#d6dfd5`, Segoe UI). Bricks rendered the font stack as `font-family: "Segoe UI", Arial, sans-serif`.
  - **Images.** Imported into the media library and reused on a second run; the change was applied and restored.
  - **Classes.** One global class was created and one identical site class reused. The change was applied with a matching read-back and restored, and the test class deleted.
  - **Templates.** Two draft header templates were created, conditions saved and read back (post type `page`, excluding post 114). A template was edited, applied with a matching read-back and restored, and both templates were deleted.
  - **Engine audit.** Every built-in section type was rendered by Bricks' `render-elements`. No quoted font stacks, empty or invalid values were found.
- **Automated.** 203 tests cover role suggestions, palette links, page colors and fonts, class planning, the conditions schema and editor round trip, and a stateful fake Bricks site. That site checks ownership and digest conflicts, paginated classes, templates, conditions and firewall responses. Production build, TypeScript and ESLint pass.

## Boundaries

- **Conditions.** `set-template-conditions` has no concurrency guard of its own. BricksSnap re-reads the conditions right before saving, which narrows the window but is not atomic. Conditions with settings BricksSnap does not know stay read-only.
- **Template settings.** Sticky header, popup behavior and password protection are not edited. Deleting templates and changing their status stay in WordPress and Bricks.
- **Design sources.** Theme styles and global variables are not read yet; the test site has none.
- **Host firewalls.** The test host's firewall blocked any request containing external image URLs or email addresses, including a real contact address in page content. BricksSnap names these in its error message; hosts can allow requests to `/wp-json/mcp/`.
- **Created classes stay.** Restoring a page does not remove classes created for it; remove unused ones in Bricks.
