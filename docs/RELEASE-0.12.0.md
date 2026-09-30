# BricksSnap 0.12.0: Import & Modernize, and 90 layouts

Many Bricks users already have sections: from old projects, from clients, from free libraries. They often use fixed colors, px sizes, repeated inline styles and no mobile rules. 0.12.0 brings them onto the same design system as the Studio, and more than doubles the Studio's own layouts.

## 1. Import & Modernize

A new **Modernize** tab takes any Bricks JSON and rebuilds it on BricksSnap's tokens:

- **Colors:** fixed colors become design tokens by role (backgrounds, headings, text, borders, buttons, icons, shadows). The source's brand colors are detected and replaced by your kit's.
- **Sizes:** font sizes, spacing and corners land on the kit's scale, fluid with `clamp()` instead of fixed px.
- **Classes:** repeated inline styles become one clean `bs-<block>-<role>` global class per role.
- **Mobile:** missing rules are added, and the report lists each one:
  - grids collapse on tablets and phones;
  - button rows stack at full width;
  - sections get rhythm and gutters;
  - fixed widths become maxima.
- **Brand kit:** the result follows color, fonts, corners, spacing and dark mode like any Studio section.

You compare before and after at three widths, read a report of every change, and take the result to Bricks by download, clipboard or Staging.

It runs locally in the browser, and nothing is fetched: you bring the JSON. Use it on sections you made, received from a client or licensed. It is not a way to repackage other people's templates. See [Modernize](MODERNIZE.md).

**MCP.** The new `bricks_modernize_template` tool does the same for Claude, ChatGPT and other clients. The server now has eleven tools.

## 2. 90 layouts instead of 40

50 new layouts cover every section type. They reuse the kit's classes, so every layout works with every brand kit, industry and language:

| Section | New layouts |
|---|---|
| Header | centred logo, floating bar, dark |
| Hero | bento tiles, centred with numbers, statement with wide image, image left with social proof, with enquiry form |
| Services | numbered, photo cards, tabs |
| Benefits | cards with icons, image in the middle, dark with rules |
| Steps | vertical with line, centred numbers |
| Numbers | cards, image with numbers |
| Pricing | with switch, plans as rows, price tiles |
| Reviews | quote wall, one featured quote, large photo |
| Team | photo cards, list |
| Portfolio | bento, project index |
| Timeline | horizontal |
| About | with numbers, photo collage, statement with wide image |
| FAQ | accordion, cards |
| Blog | one featured post, list |
| Logos | tiles, marquee |
| Gallery | masonry, bento |
| Call to action | background image, minimal with rules, card with photo |
| Contact | contact cards, centred form |
| Footer | big name, with call to action |
| Login, 404, coming soon | split screens with image |

**Native Bricks tabs and accordion.** The pricing switch and the service tabs use Bricks' nested tabs; the FAQ accordion uses Bricks' nested accordion with FAQ schema. Bricks' own script switches them, and you edit each tab and answer in the builder.

**Pricing switch.** The industries' sample prices are one-off, hourly or per-visit prices, so the switch shows **Packages / Single prices**. A computed "yearly" price would be wrong. For monthly and yearly billing, rename the two tabs in Bricks and enter your yearly prices in the second pane.

The remote library in Bricks now serves 206 templates: 13 designs as pages and all 90 layouts as sections, in German and English.

## Later

Cooperation instead of copying:
- an "Open in BricksSnap" link for template libraries that want it;
- a community gallery with an explicit open license.

These are on the [roadmap](ROADMAP.md) and not part of this release.

## Verified

- **Automated:** 255 tests.
  - Every layout validates in every style.
  - The one-class-per-CSS-property rule holds for all 90 layouts.
  - No class name is defined twice.
  - Tabs and accordion have Bricks' structure.
  - The modernize engine is tested on its own pricing and hero fixtures.
- **Visual:** all 50 new layouts at desktop and phone width in the Clean kit, and in a dark Warm kit.
- **Against Bricks 2.4.2 on the test site (read-only):**
  - Bricks' frontend script and styles use the same tab, pane, accordion and `brx-open` classes as the layouts.
  - `render-elements` outputs the `_hidden` classes the nested elements rely on.
- **App:** the Studio renders all 90 thumbnails in about 0.1 s, and a kit change redraws them in about 0.15 s.
