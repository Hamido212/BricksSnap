# BricksSnap 0.5.0 — Review, render and apply changes to WordPress

BricksSnap can now finish the loop it started in 0.3. Load a live Bricks page, add sections in Staging, see the result as Bricks itself renders it, save it to the page, and undo it if needed.

- **Render with Bricks.** The connected site renders both the saved page and the reviewed version, without saving. They appear side by side at 1280 px and 390 px, with added and changed elements outlined.
- **Apply to WordPress.** BricksSnap saves the reviewed element tree with Bricks' `expectedDocumentDigest`. If anyone saved the page after you loaded it, Bricks refuses the write atomically and nothing changes. Bricks keeps a revision of the previous state before saving.
- **Verification.** After saving, BricksSnap reads the page back and compares it with what you reviewed. Bricks normalizations are named, such as custom CSS converted into native style controls. The read-back becomes the new baseline.
- **Restore previous version.** This restores that revision, but only while the page still has the state BricksSnap saved, so later edits are never discarded silently.

Safety rails:
- Explicit confirmation for every save.
- A separate confirmation for pages open in the Bricks builder.
- Saving requires the `set-page-elements` ability, which the site administrator can disable.
- Global classes are never created: a change that needs missing classes is rejected.
- Everything runs locally (`npm run dev:local`), and passwords stay in the browser tab.

## Start

Set up the connection as in 0.4 ([guide](WORDPRESS.md)), enable `set-page-elements` and `restore-revision` under Bricks → AI → Abilities, and use a staging site or a draft page first. In Staging:
1. **Load page into baseline** → add a section → **Review changes**.
2. **Render with Bricks**.
3. **Apply to WordPress**.

## Verified behavior

All live tests ran on a draft page of a Bricks 2.4.2 / WordPress 7.1.2 / MCP Adapter 0.6.1 site, with the owner's approval:

- **Apply and restore.** Adding hero, features and footer sections saved 38 and then 70 elements. Restore brought the page back to exactly the earlier digest.
- **Stale digests.** A stale digest was rejected by BricksSnap's pre-check. A raw write with a stale digest was rejected by Bricks itself (`bricks_conflict_document_digest_mismatch`). The page was unchanged both times.
- **Host firewall.** The host answered writes containing external image URLs with an HTML "503 Service Unavailable" page (HTTP 200). BricksSnap reports this and names the URLs; writes without them succeeded.
- **Browser (Chromium, 1440 px and 390 px).**
  - Apply is disabled until confirmed.
  - After saving, the read-back matched the reviewed version.
  - After restoring, the page was back to 38 elements with the original digest.
  - The rendered preview of the home page shows the new section outlined in the "after" view and the mobile layout at 390 px.
  - No console errors and no horizontal overflow.
- **Automated.** 166 tests, including a stateful simulated Bricks site (digests, revisions, locks, disabled abilities, normalization, firewall pages). Production build, TypeScript, ESLint and `npm audit` pass.

## Boundaries

- **Scope of a save.** Only page elements are saved. Page settings and global class definitions are not written.
- **Preview.** It omits theme styles and global class CSS, and runs without scripts.
- **Host firewalls.** Some hosts' firewalls block requests containing external URLs. Use media from your own site or ask the host to allow `/wp-json/mcp/`.
- **Experimental.** Bricks' abilities are experimental; prefer a staging site.

Next: **0.6** remote template distribution and client guidance ([roadmap](ROADMAP.md)).
