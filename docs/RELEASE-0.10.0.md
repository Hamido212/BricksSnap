# BricksSnap 0.10.0: Installs you can undo

Global variables, palettes and class names are shared infrastructure on a Bricks site. A reviewer on Reddit pointed out three gaps in how BricksSnap treated them, and all three were right. 0.10.0 closes them.

## 1. A class ID alone proves nothing

BricksSnap's class IDs are a hash of the class name. When creating missing global classes, an ID that already existed on the site was trusted without comparing name and definition. Two cases went wrong silently:

- **A foreign class with the same ID** (rare): the element would have used an unrelated class.
- **The same `bs-` class from another BricksSnap design** (realistic, for example "Nord" first, "Lachfalte" later): the second page took the first design's classes without a warning.

Now BricksSnap compares ID, name and definition:

- **Foreign ID:** the staged class gets a new ID and the elements follow it. Saving a page or a template is refused until **Create missing global classes** has done that, so nothing is written with a wrong reference.
- **Same ID and name, other definition:** the site's class is kept, never overwritten, and reported, both in the review and after creating classes.

## 2. Manifest and uninstall

Each design-system install writes a manifest, the variable `--bs-manifest` in the BricksSnap category. It is written in the same step as the other variables and names:
- the design and its kit;
- the BricksSnap version and the time;
- the palette, category, colors and variables the install owns.

You can read it in Bricks' variable manager.

**Uninstall** removes the BricksSnap palette, its variables, the manifest and the category, after a preview:
- **Edited values:** values that differ from what the manifest's kit installs count as edited in Bricks. They are listed and kept unless you choose to remove them too.
- **Classes stay:** `bs-` global classes are not removed, because pages use them. Every value in them has a fallback, so pages keep their look.

## 3. Snapshot and undo

Bricks keeps revisions for pages, not for palettes and variables. So BricksSnap records a snapshot before the first write: the value each color and variable had, and the value it writes.

- **Undo this install:**
  - sets replaced values back and removes what the install added: colors, variables, palette and category;
  - works for the last install from this browser, also after a reload;
  - lists and keeps any value that was changed in Bricks after the install.
- **When a write fails halfway**, the snapshot comes back with the error. You can then finish the install by checking again, or undo what was written.

Undo and uninstall use the same guards as the install: Bricks' ownership digests on every write, a fresh read between steps, and a read-back at the end.

## Verified

- **Automated:** 242 tests, including a stateful stand-in for Bricks 2.4.2 with palette, color and variable deletes and ownership checks. They cover:
  - class ID collisions and differing definitions;
  - the manifest;
  - undo after a second install, with one value edited later;
  - undo of a first install that failed halfway;
  - uninstall with and without edited values.
- **Live on a Bricks 2.4.2 test site:**

  | Step | Result |
  |---|---|
  | Install "Nord" | verified, manifest written |
  | Same install again | no writes |
  | Install "Lachfalte" on top | 16 colors and 9 variables updated |
  | Undo | 26 values restored; the site is exactly "Nord" again, manifest included |
  | Uninstall | palette, 27 variables and category removed, verified |
  | Class collision | a template save with a foreign class ID was refused; "Create missing global classes" created the class under a new ID |

  Everything created for the tests was removed afterwards.

## Needed abilities

Undo and uninstall additionally need `delete-global-variable`, `delete-color` and `delete-color-palette` (Bricks → AI → Abilities).
