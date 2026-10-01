# BricksSnap 0.13.0: Mobile menus, carousels, motion and class updates

0.13.0 closes a real gap in every header and adds two patterns many sites need. It also lets sites that installed an earlier BricksSnap release receive improvements. Everything is built on Bricks' own elements and features and checked live on a Bricks 2.4.2 test site.

## 1. A real mobile menu in every header

Until 0.12, headers hid their links below the tablet breakpoint and offered no menu. Now every header with links uses **Bricks' nestable nav**:

- **Structure.** Bricks creates the same structure in the builder: a "Nav items" list with the links, a close toggle inside it, and an open toggle after it. We read it from a test page.
- **Behavior.** Below the tablet breakpoint (991 px), a hamburger opens the menu as a full-screen overlay. It turns into an X, and the header button moves into the menu on phones.
- **Kit colors.** The overlay uses the kit's background and heading colors instead of Bricks' fixed white, so it also works in dark mode.

## 2. Carousels

**Reviews** and **Portfolio** each get a carousel layout on **Bricks' nested slider** (Splide):

- **Layout.** Two or three cards side by side, two on tablets, one on phones.
- **Navigation.** Visitors swipe or use the dots below. The dots are buttons and also work by keyboard.
- **Options.** They go in as Splide JSON, because Bricks does not accept breakpoint values on its slider controls.

## 3. Motion

A new brand kit option, **Motion: Fade in**, makes the content of a section fade up once as it scrolls into view:

- **What moves:** intros, cards, list items and images, slightly staggered.
- **How:** with Bricks interactions (`enterView` → `startAnimation`), so you can edit or remove it in the builder.
- **What stays still:**
  - headers, heroes, footers and single-purpose pages, which are on screen at once;
  - content inside Bricks' tabs, accordion, slider, nav and forms.
- **Accessibility:** visitors who ask their system for reduced motion see everything at once.

The option is also available to MCP clients (`kit.motion`).

## 4. Update outdated BricksSnap classes

A site keeps its `bs-` class definitions. Before 0.13, BricksSnap reported newer definitions as different and never wrote them, so improvements never reached existing sites.

**Update N BricksSnap classes** (in Staging, after **Create missing global classes**) now brings them up to date:

- **Scope.** Only `bs-` classes are changed, everywhere on the site.
- **Guarded.** Each write carries the class's ownership and the class lock ownership. A class changed in between is refused, and earlier updates stay undoable.
- **Exact.** Bricks merges class settings, so keys the new definition drops are removed explicitly, nested ones too.
- **Verified and undoable.** The result is read back and compared, and **Undo the update** restores the previous definitions.

The update needs the `update-global-class` ability.

**Fix.** Bricks reformats custom CSS when it stores a class: line breaks, indentation, and no spaces around `>`. BricksSnap took that for a different definition. Comparisons now ignore CSS layout.

## Verified

- **Automated:** 262 tests.
  - The mobile menu structure in every header.
  - Motion only where intended, with the reduced-motion rule.
  - Slider options and breakpoints.
  - The update patch, nested keys included.
  - Guarded update, verify and undo, plus a concurrent edit, against a stand-in for Bricks 2.4.2.
- **Live on the Bricks 2.4.2 test site:**

  | Check | Result |
  |---|---|
  | Mobile menu at 390 px | hamburger opens the overlay with links and button; X closes it |
  | Header at 1280 px | links in the bar, no toggle |
  | Carousels | 1 slide at 390 px; 2 or 3 at 1280 px |
  | Motion | content below the fold fades in on scroll |
  | Reduced motion | everything visible at once |
  | Class update | outdated → update → undo → update, each verified by read-back |
  | 0.12's FAQ accordion and pricing switch | open and switch as expected |
  | JavaScript errors | none |

## Thanks

Two MIT-licensed references helped us check Bricks' element structures:

- [bricks-skills](https://github.com/wpgaurav/bricks-skills) by Gaurav Tiwari;
- [bricks-builder-skill](https://github.com/kenming/bricks-builder-skill) by Kenming Wang.

Every structure in this release was then confirmed on Bricks 2.4.2 itself.
