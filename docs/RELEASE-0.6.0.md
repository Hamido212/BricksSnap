# BricksSnap 0.6.0 — Remote library and AI client guidance

**Use BricksSnap from inside Bricks.** Any BricksSnap deployment now works as a Bricks **Remote Library**. Add its URL under **Bricks → Settings → Templates & components → Remote libraries**, and the 60 catalog templates appear in the builder's template library. They come grouped by category, with tags and thumbnails, ready to insert without downloading JSON.

How it works:
- **Protocol fallback.** Bricks 2.4 first asks a source for its newer package protocol. BricksSnap answers like WordPress does for an unknown route, and Bricks falls back to the legacy Remote Templates protocol.
- **Response shape.** BricksSnap serves that protocol in exactly the shape captured from a Bricks 2.4.2 source site.
- **Access.** The requesting site is required. An optional origin whitelist or password restricts access, or the library can be switched off. See [Remote library](REMOTE-LIBRARY.md).

**Use BricksSnap with AI clients.** [AI clients](CLIENTS.md) shows how to run BricksSnap's offline MCP tools next to a site's own Bricks abilities in Claude Code, Codex or Cursor:
- **Configuration.** Ready-made configurations for both servers.
- **Safe defaults.** A staging site, a dedicated user and destructive abilities switched off.
- **Guarded workflow.** Read the page with its digest, generate and merge with BricksSnap, review, then save with `expectedDocumentDigest` and keep the revision for a restore.
- **Bricks skills.** Pointers to the official Bricks skills instead of duplicated rules.

## Verified

- **End to end.** A live Bricks 2.4.2 site used `https://bricks-snap.vercel.app` as its remote library through Bricks' own abilities.
  - `bricks/list-remote-templates` returned all 60 templates with their bundles and no error.
  - `bricks/insert-remote-template` inserted "Pricing - Three Tiers" into a draft page: 83 elements, a revision created, design-asset import with nothing missing.
  - The page was restored to its exact previous digest, and the library setting was removed again.
- **Automated.** 171 tests, including the response shape against the captured Bricks key sets, element-tree validity of all 60 templates, access rules and the fallback route. Production build, TypeScript, ESLint and `npm audit` pass.

## Boundaries

- **Not verified.** The password query parameter name, and thumbnail display in the builder UI.
- **Sample images.** Built-in templates use Unsplash sample images; some host firewalls block writes containing external URLs.
- **Hosting firewalls.** Some hosts block `/wp-json/` paths on non-WordPress sites. On the test deployment, Vercel's automatic mitigation denied scanner-like requests to non-existent `/wp-json` paths before the library was deployed, but not the library afterwards.
- **No npm package.** The MCP server is still built from the repository.

This completes the staged plan toward 2.0: a connected site can be read, a change reviewed, rendered, applied, verified and restored, and templates can be distributed. See the [roadmap](ROADMAP.md).
