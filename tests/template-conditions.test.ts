import { describe, expect, it } from "vitest";
import { conditionFields, describeCondition, fieldsToCondition, readTemplateConditions, templateConditionsSchema, type TemplateCondition } from "../src/lib/template-conditions";

describe("template conditions", () => {
  it("reads stored conditions without row IDs and normalizes legacy values", () => {
    const { conditions, unsupported } = readTemplateConditions({ templateConditions: [
      { id: "abc123", main: "any" },
      { id: "def456", main: "ids", ids: ["7", 114], idsIncludeChildren: true, exclude: true },
      { id: "ghi789", main: "hook", hookName: "bricks_before_footer", hookPriority: 5 },
      { id: "jkl012", main: "postType", postType: ["page"], archiveType: "" },
    ] });
    expect(unsupported).toEqual([]);
    expect(conditions).toEqual([
      { main: "any" },
      { main: "ids", ids: [7, 114], idsIncludeChildren: true, exclude: true },
      { main: "any", hookName: "bricks_before_footer", hookPriority: 5 },
      { main: "postType", postType: ["page"] },
    ]);
    expect(readTemplateConditions([])).toEqual({ conditions: [], unsupported: [] });
  });

  it("marks conditions with unknown settings as not editable", () => {
    const result = readTemplateConditions({ templateConditions: [{ main: "any", userRole: ["editor"] }, { main: "wooShop" }] });
    expect(result.unsupported).toEqual(["userRole", "wooShop condition"]);
  });

  it("describes conditions in plain language", () => {
    expect(describeCondition({ main: "any" })).toBe("Entire website");
    expect(describeCondition({ main: "postType", postType: ["page", "post"] })).toBe("Post types: page, post");
    expect(describeCondition({ main: "ids", ids: [7], idsIncludeChildren: true, exclude: true })).toBe("Exclude: Posts: #7 and their children");
    expect(describeCondition({ main: "archiveType", archiveType: ["postType", "term"], archivePostTypes: ["post"], archiveTerms: ["category::all"] }))
      .toBe("Archives: post type archives (post), term archives (category::all)");
  });

  it("round-trips editor fields and validates them", () => {
    const conditions = [
      { main: "postType", postType: ["page", "post"] },
      { main: "ids", ids: [7, 114], idsIncludeChildren: true },
      { main: "archiveType", archiveType: ["term"], archiveTerms: ["category::5"], archiveTermsIncludeChildren: true },
      { main: "terms", terms: ["post_tag::12"], exclude: true },
      { main: "any", hookName: "bricks_before_footer", hookPriority: 20 },
    ] satisfies TemplateCondition[];
    for (const condition of conditions) expect(fieldsToCondition(conditionFields(condition))).toEqual(condition);
    // An empty post type list means all post types.
    expect(fieldsToCondition({ ...conditionFields({ main: "postType" }), values: " " })).toEqual({ main: "postType" });
    expect(() => fieldsToCondition({ ...conditionFields({ main: "ids" }), values: "7, abc" })).toThrow(/whole numbers/);
    expect(() => fieldsToCondition({ ...conditionFields({ main: "terms" }), values: "" })).toThrow(/Terms need at least one value/);
    expect(() => fieldsToCondition({ ...conditionFields({ main: "terms" }), values: "category:5" })).toThrow(/category::5/);
    expect(() => fieldsToCondition({ ...conditionFields({ main: "postType" }), values: "Page Type" })).toThrow(/slugs/);
    expect(() => templateConditionsSchema.parse([{ main: "any", id: "abc123" }])).toThrow();
  });
});
