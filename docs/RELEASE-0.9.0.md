# BricksSnap 0.9.0: Library of ready-made designs

**The library now shows designs you can use as they are.** Until 0.8.1 the Library tab and Bricks' remote library offered the 60 classic templates. They were valid Bricks JSON, but they looked dated:

- inline styles and generic copy such as "BrandName";
- when rendered: empty grey image placeholders, blank icon boxes and avatar circles, an orphaned fourth service card in a three-column grid, and low-contrast stars and links.

0.9.0 replaces them with designs built on the Studio's kit.

## Library

- **12 designs.** Each is a brand kit, an industry and a page, chosen to work as they are:

  | Industry | Designs |
  |---|---|
  | Vehicle registration | Nord (Warm, teal), Tempo (Bold, red) |
  | Trades | Werkbank (Bold, orange), Volt (Clean, blue, compact) |
  | Medical practice | Lindenhof (Soft, cyan), Balance (Editorial, green) |
  | Restaurant | Trattoria (Editorial, wine), Markthalle (Warm, olive) |
  | Agency | Kontur (Clean, indigo), Nachtschicht (Bold, lime, dark) |
  | Business | Fundament (Clean, blue), Mandat (Editorial, navy, Playfair) |

- **Browse.** Filter by industry and style, and switch the sample text between German and English. Each card shows the design's header and hero, live.
- **Design view.** The whole page at desktop and phone width, and every section of the design.
- **Actions.** Download or copy the page (Ctrl+V in Bricks), copy single sections, open the page in Staging, or **Customize in Studio**, which loads the design's kit, industry and page.

## Bricks remote library

Bricks → Remote libraries now receives the designs instead of the classic catalog:

- the 12 designs as pages;
- all 40 layouts as single sections, in the "Fundament" design;
- both in German and English.

That makes 104 templates in "Pages" and "Sections" bundles per language. Thumbnails are drawn in each design's colors. Styling travels as `bs-` global classes, so pages and sections inserted into the same site share one look.

## Also

- **MCP.** `bricks_kit_options` lists the designs with their kit and page, so Claude or ChatGPT can rebuild or adapt them with `bricks_kit_page`.
- **Classic catalog.** It stays available to MCP clients (`bricks_list_templates`, `bricks_get_template`) and remains the base of the Generator's built-in engine.
- **Preview.** Rich text keeps paragraphs and lists, still without attributes.

## Verified

- **Designs.** All 12 designs pass the contrast, heading and alt-text checks and produce valid Bricks templates in both languages.
- **Browser.** The Library was checked at 1440 px and 390 px: filters, design view, sections, and "Customize in Studio" loading the right style, color and industry. There were no errors and no horizontal overflow.
- **Remote library.** Response shape as captured from Bricks 2.4.2, unique stable IDs, header/footer/content types, and every template carries its `bs-` global classes (about 1.8 MB, cached).
- **Automated.** 229 tests, TypeScript, ESLint and production build pass.
