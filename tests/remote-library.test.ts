import { describe, expect, it } from "vitest";
import { buildRemoteTemplates, checkLibraryAccess, remoteLibraryData, remoteTemplateId, templateThumbnail } from "../src/lib/remote-library";
import { readStagingTemplate } from "../src/lib/template-staging";
import { DESIGNS } from "../src/lib/kit/library";
import { VARIANTS } from "../src/lib/kit/sections";
import { GET as getTemplatesData } from "../src/app/wp-json/bricks/v1/get-templates-data/route";
import { GET as getTemplates } from "../src/app/wp-json/bricks/v1/get-templates/route";
import { GET as remoteLibrary } from "../src/app/wp-json/bricks/v1/remote-library/[[...path]]/route";

// Keys of GET /wp-json/bricks/v1/get-templates-data?site=… captured from a Bricks 2.4.2 source site.
const CAPTURED_TOP_KEYS = ["timestamp", "date", "templates", "authors", "bundles", "tags", "globalVariables", "globalVariablesCategories", "colorPalette", "styleManager"];
const CAPTURED_TEMPLATE_KEYS = ["id", "name", "title", "date", "date_formatted", "author", "permalink", "thumbnail", "bundles", "tags", "type", "content"];
const now = new Date("2026-09-28T23:39:00Z");

describe("BricksSnap remote template library", () => {
  it("matches the legacy Bricks response shape", () => {
    const data = remoteLibraryData("https://snap.example", now);
    expect(Object.keys(data)).toEqual(CAPTURED_TOP_KEYS);
    expect(data.date).toBe("September 28, 2026 (11:39 pm)");
    expect(data.templates).toHaveLength(2 * (DESIGNS.length + VARIANTS.length));
    for (const template of data.templates) expect(Object.keys(template).filter(k => k !== "globalClasses")).toEqual(CAPTURED_TEMPLATE_KEYS);
    expect(data.bundles).toEqual(["Pages · Deutsch", "Sections · Deutsch", "Pages · English", "Sections · English"]);
    expect(data.authors).toEqual(["BricksSnap"]);
  });

  it("serves valid Bricks element trees with stable unique numeric IDs and types", () => {
    const templates = buildRemoteTemplates("https://snap.example", now);
    expect(new Set(templates.map(t => t.id)).size).toBe(templates.length);
    for (const template of templates) {
      expect(Number.isInteger(template.id) && template.id > 0).toBe(true);
      expect(() => readStagingTemplate({ content: template.content })).not.toThrow();
      expect(template.content.some(el => typeof el.settings._cssCustom === "string" && el.settings._cssCustom.includes("%root%"))).toBe(false);
      expect(template.thumbnail).toBe(`https://snap.example/api/library/thumbnail/${template.name}`);
      // Styling travels as bs- global classes that every element references.
      expect(template.globalClasses?.length).toBeGreaterThan(0);
      expect(template.globalClasses?.every(c => c.name.startsWith("bs-"))).toBe(true);
    }
    expect(remoteTemplateId("design-nord-de")).toBe(remoteTemplateId("design-nord-de"));
    expect(templates.find(t => t.name === "design-nord-de")).toMatchObject({ type: "content", title: "Nord · Kfz-Zulassungsdienst (DE)" });
    expect(templates.find(t => t.name === "section-footer-columns-en")?.type).toBe("footer");
    expect(templates.find(t => t.name === "section-navbar-classic-de")?.type).toBe("header");
    expect(JSON.stringify(templates.find(t => t.name === "design-trattoria-en")?.content)).toContain("From our menu");
  });

  it("applies Bricks-style access rules", () => {
    const params = (query: string) => new URLSearchParams(query);
    expect(checkLibraryAccess(params(""), {})).toMatchObject({ error: { code: "no_site_url" } });
    expect(checkLibraryAccess(params("site=https://a.example"), {})).toBeNull();
    expect(checkLibraryAccess(params("site=https://a.example"), { BRICKSSNAP_REMOTE_LIBRARY: "false" })).toMatchObject({ error: { code: "my_templates_access_disabled" } });
    const whitelist = { BRICKSSNAP_REMOTE_LIBRARY_WHITELIST: "https://a.example, https://b.example/" };
    expect(checkLibraryAccess(params("site=https://b.example/shop"), whitelist)).toBeNull();
    expect(checkLibraryAccess(params("site=https://c.example"), whitelist)).toMatchObject({ error: { code: "site_not_whitelisted" } });
    const password = { BRICKSSNAP_REMOTE_LIBRARY_PASSWORD: "s3cret" };
    expect(checkLibraryAccess(params("site=https://a.example"), password)).toMatchObject({ error: { code: "remote_templates_password_required" } });
    expect(checkLibraryAccess(params("site=https://a.example&password=wrong!"), password)).toMatchObject({ error: { code: "remote_templates_password_required" } });
    expect(checkLibraryAccess(params("site=https://a.example&password=s3cret"), password)).toBeNull();
  });

  it("answers like a Bricks source over HTTP and makes Bricks fall back from the package protocol", async () => {
    const data = await (await getTemplatesData(new Request("https://snap.example/wp-json/bricks/v1/get-templates-data?site=https%3A%2F%2Fa.example"))).json();
    expect(data.templates[0].permalink).toMatch(/^https:\/\/snap\.example\//);
    const denied = await getTemplatesData(new Request("https://snap.example/wp-json/bricks/v1/get-templates-data"));
    expect(denied.status).toBe(200);
    expect(await denied.json()).toMatchObject({ error: { code: "no_site_url" } });
    expect(Array.isArray(await (await getTemplates(new Request("https://snap.example/wp-json/bricks/v1/get-templates?site=https://a.example"))).json())).toBe(true);
    const fallback = await remoteLibrary();
    expect(fallback.status).toBe(404);
    expect(await fallback.json()).toMatchObject({ code: "rest_no_route" });
  });

  it("escapes catalog text in thumbnails", () => {
    expect(templateThumbnail("design-nord-de")).toMatch(/^<svg[\s\S]*#0f766e[\s\S]*Nord · Kfz-Zulassungsdienst[\s\S]*<\/svg>$/);
    expect(templateThumbnail("section-faq-split-en")).toMatch(/FAQ: /);
    expect(templateThumbnail("missing")).toBeNull();
    expect(templateThumbnail("design-trattoria-de")).not.toContain("<script");
  });
});
