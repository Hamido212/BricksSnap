import { describe, expect, it } from "vitest";
import type { BricksElement } from "../src/lib/bricks-engine";
import { foreignClassIds, planGlobalClasses, referencedClassIds, remapGlobalClasses } from "../src/lib/template-classes";

const el = (id: string, classes?: unknown[]): BricksElement => ({ id, name: "div", parent: 0, children: [], settings: classes ? { _cssGlobalClasses: classes } : {} });
const site = [{ id: "site01", name: "btn", settings: { _padding: { top: "1rem" } } }];

describe("global class planning", () => {
  it("collects referenced class IDs once", () => {
    expect(referencedClassIds({ content: [el("a", ["x", "y"]), el("b", ["y", 3]), el("c")] })).toEqual(["x", "y"]);
  });

  it("creates new names, reuses identical ones and reports the rest", () => {
    const plan = planGlobalClasses({
      content: [el("a", ["site01", "new001", "new002", "new003", "new004", "new005"])],
      globalClasses: [
        { id: "new001", name: "card", settings: { _gap: "1rem" } },
        { id: "new002", name: "btn", settings: { _padding: { top: "1rem" } } },
        { id: "new003", name: "btn", settings: { _padding: { top: "2rem" } } },
        { id: "new004", name: "card", settings: {} },
      ],
    } as never, site);
    expect(plan).toEqual({
      create: [{ id: "new001", name: "card", settings: { _gap: "1rem" } }],
      reuse: [{ id: "new002", siteId: "site01", name: "btn" }],
      conflicts: [{ id: "new003", siteId: "site01", name: "btn" }, { id: "new004", siteId: "", name: "card" }],
      undefinedIds: ["new005"],
      remapped: [],
      mismatched: [],
    });
  });

  it("never trusts a class ID alone", () => {
    const siteClasses = [...site, { id: "abc123", name: "footer-grid", settings: {} }, { id: "tit001", name: "bs-title", settings: { _gap: "1px" } }];
    const plan = planGlobalClasses({
      content: [el("a", ["abc123", "tit001"])],
      globalClasses: [{ id: "abc123", name: "bs-card", settings: {} }, { id: "tit001", name: "bs-title", settings: { _gap: "2px" } }],
    } as never, siteClasses);
    expect(plan.remapped).toEqual([{ id: "abc123", newId: plan.create[0].id, name: "bs-card", siteName: "footer-grid" }]);
    expect(plan.create).toEqual([{ id: plan.remapped[0].newId, name: "bs-card", settings: {} }]);
    expect(siteClasses.map(c => c.id)).not.toContain(plan.remapped[0].newId);
    expect(plan.mismatched).toEqual([{ id: "tit001", name: "bs-title" }]);
    expect(foreignClassIds({ content: [el("a", ["abc123", "tit001"])], globalClasses: [{ id: "abc123", name: "bs-card", settings: {} }, { id: "tit001", name: "bs-title", settings: {} }] } as never, siteClasses))
      .toEqual([{ id: "abc123", name: "bs-card", siteName: "footer-grid" }]);
  });

  it("ignores how Bricks reformats custom CSS when comparing definitions", () => {
    // Bricks 2.4.2 stores ".x { a: b; }" as ".x {\n  a: b;\n}".
    const stored = { id: "lab001", name: "bs-tabs__label", settings: { _cssCustom: ".bs-tabs__label {\n  white-space: nowrap;\n}" } };
    const plan = (css: string) => planGlobalClasses({ content: [el("a", ["lab001"])], globalClasses: [{ id: "lab001", name: "bs-tabs__label", settings: { _cssCustom: css } }] } as never, [stored]);
    expect(plan(".bs-tabs__label { white-space: nowrap; }").mismatched).toEqual([]);
    expect(plan(".bs-tabs__label { white-space: normal; }").mismatched).toEqual([{ id: "lab001", name: "bs-tabs__label" }]);
  });

  it("switches references and replaces definitions without duplicates", () => {
    const template = { content: [el("a", ["new002", "site01"]), el("b", ["new001"])], globalClasses: [{ id: "new002", name: "btn", settings: {} }, { id: "new001", name: "card", settings: {} }] } as never;
    const result = remapGlobalClasses(template, new Map([["new002", "site01"]]), [site[0], { id: "new001", name: "card", settings: { _gap: "1rem" } }]);
    expect(result.content.map(e => e.settings._cssGlobalClasses)).toEqual([["site01"], ["new001"]]);
    expect(result.globalClasses).toEqual([site[0], { id: "new001", name: "card", settings: { _gap: "1rem" } }]);
  });
});
