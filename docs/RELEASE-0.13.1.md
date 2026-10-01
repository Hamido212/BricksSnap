# BricksSnap 0.13.1: Fixes from a real rebuild

We rebuilt a real club website, a German heritage society's homepage, with BricksSnap layouts on a Bricks 2.4.2 site. The page used:

- the club's own copy and photos;
- a cover hero, about, timeline, gallery and board sections;
- an FAQ accordion and a contact form.

Saving it showed four problems that the tests and the earlier live checks had missed. All four are fixed and covered by new tests.

## 1. Forms save again

Bricks refused every layout with a form:

> Invalid value for "settings.submitButtonPadding". Expected a registered setting for the 'form' element.

Bricks 2.4 has no padding control for the submit button. The padding now comes from the `bs-form` class, so the button looks the same.

Affected layouts: Hero with enquiry form, Contact with form, Centred form, Sign in, Sign in split, and Coming soon split.

## 2. Light text on dark sections, on every page

Bricks prints a class's controls as `.bs-title.brxe-heading`. That rule is as strong as the rule that turns titles light on dark sections, so whichever came later on the page won. When a dark section came before the first title, titles stayed dark on the dark background, for example with a cover hero or a dark header.

Dark and brand-colored sections now use rules that outrank Bricks' class rules wherever Bricks prints them. Some rules also overrode a class from a parent at only equal strength:

- the bento feature card;
- logo tiles;
- the rating card;
- button rows in heroes.

They now outrank it too.

## 3. Classes are written the way Bricks stores them

A probe class on the test site showed what Bricks 2.4.2 does when it saves a class's custom CSS:

- **Controls.** It moves declarations of the class's own rule into controls:
  - `display`, `gap`, `row-gap`, `column-gap`, `padding`, `width`;
  - `grid-column`, `grid-row`, `opacity`, `visibility`;
  - some typography.
- **Selector lists.** It splits them into one rule per selector.
- **Order.** It puts at-rules (`@media`, `@keyframes`) first.

BricksSnap compared the stored version with its own, so these classes showed "another version on the site" forever, and **Update BricksSnap classes** ended "not verified". Two conversions also lost CSS:

- `gap` became `_gridGap`, which Bricks does not print on text, so the eyebrow lost its spacing;
- the tabs' row gap was a control Bricks does not print on nested tabs.

BricksSnap now writes these classes in Bricks' own form. On sites with an earlier version, **Update N BricksSnap classes** in Staging brings them up to date.

## 4. No false warnings when saving

Saving a page compared classes strictly and warned "keeps the site's definition" for classes that differed only in how Bricks laid out their CSS. That check now ignores layout like the other comparisons.

## Verified

- **Automated:** 267 tests. New checks across all 92 layouts in every style:
  - no control Bricks rejects;
  - no class control Bricks does not print for the element it is on;
  - no class CSS that Bricks rewrites when it saves a class;
  - no rule that overrides another class at only equal strength.
- **Live on the Bricks 2.4.2 test site:** the rebuilt page with 227 elements and 97 classes.

  | Check | Result |
  |---|---|
  | Saving | page verified, no warnings |
  | Class update | verified; 0 of 97 classes differ afterwards |
  | Cover hero | light title on the dark photo |
  | Eyebrow spacing | rendered (`gap: 10px`) |
  | Mobile menu and FAQ accordion | open as expected |
  | Images and JavaScript | no broken images, no JavaScript errors |

## Known limit

Bricks loads web fonts only from its own typography settings. Add the kit's fonts under **Bricks → Settings → Custom fonts** or in a theme style; otherwise visitors see the fallback fonts. See [Studio](STUDIO.md).
