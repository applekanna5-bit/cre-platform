import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BuildingDiagram } from "@/components/design-preview/living-ledger/building-diagram";
import { buildingView, BUILDING_MODES } from "@/components/design-preview/living-ledger/building-model";
import { calculateIllustration, INITIAL_ASSUMPTIONS } from "@/components/design-preview/living-ledger/model";
import { VisualComposition } from "@/components/design-preview/living-ledger/visual-composition";

describe("Living Ledger building display projection", () => {
  const result = calculateIllustration(INITIAL_ASSUMPTIONS);
  it.each([
    ["Rent", 1800000, 1], ["Vacancy", 1710000, .05], ["Expenses", 1026000, .4],
  ] as const)("connects %s to the existing calculation result", (mode, amount, share) => {
    const view = buildingView(mode, INITIAL_ASSUMPTIONS, result);
    expect(view.amount).toBe(amount);
    expect(view.share).toBe(share);
    expect(view.label).toContain("USD per year");
  });
  it.each([0, .49, .5, 5.49, 5.5, 99.5, 100])("rounds %s%% only for conceptual markers, never dollar vacancy", vacancyPercent => {
    const assumptions = { ...INITIAL_ASSUMPTIONS, vacancyPercent };
    const calculated = calculateIllustration(assumptions);
    const view = buildingView("Vacancy", assumptions, calculated);
    expect(view.highlightedUnits).toBe(Math.round(vacancyPercent));
    expect(view.amount).toBe(1800000 * (1 - vacancyPercent / 100));
    expect(view.share).toBe(vacancyPercent / 100);
    expect(view.explanation).toContain("not an exact measure of physical occupancy");
  });
  it("synchronizes every mode after changing all assumptions without mutating them", () => {
    const assumptions = Object.freeze({ monthlyRent: 2000, vacancyPercent: 10, expensePercent: 35, capRatePercent: 5 });
    const calculated = calculateIllustration(assumptions);
    expect(BUILDING_MODES.map(mode => buildingView(mode, assumptions, calculated).amount)).toEqual([2400000, 2160000, 1404000]);
    expect(calculated.operatingExpenses).toBe(756000);
    expect(buildingView("Expenses", assumptions, calculated).highlightedUnits).toBe(0);
  });
  it.each([{ monthlyRent: 0 }, { vacancyPercent: 100 }, { expensePercent: 100 }])("handles zero-income and full-loss boundaries %#", override => {
    const assumptions = { ...INITIAL_ASSUMPTIONS, ...override };
    const calculated = calculateIllustration(assumptions);
    for (const mode of BUILDING_MODES) {
      const view = buildingView(mode, assumptions, calculated);
      expect(Number.isFinite(view.amount)).toBe(true);
      expect(view.share).toBeGreaterThanOrEqual(0);
      expect(view.share).toBeLessThanOrEqual(1);
    }
  });
});

describe("building semantics and isolation", () => {
  it("uses a labelled native radio group and a financial text alternative", () => {
    const html = renderToStaticMarkup(createElement(BuildingDiagram, { assumptions: INITIAL_ASSUMPTIONS, result: calculateIllustration(INITIAL_ASSUMPTIONS) }));
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toContain("Explore the income story");
    for (const mode of BUILDING_MODES) expect(html).toContain(`value="${mode}"`);
    expect(html).toContain('role="img"');
    expect(html).toContain('>Fictional multifamily building — Rent study</title>');
    expect(html).toContain("100 units × $1,500 per month × 12 = $1,800,000");
    expect(html).toContain('role="status"');
    expect(html).toContain("100 fictional units");
  });
  it("withholds financial overlays for invalid drafts", () => {
    const html = renderToStaticMarkup(createElement(BuildingDiagram, { assumptions: null, result: null }));
    expect(html).not.toContain("data-building-outcome");
    expect(html).not.toContain("data-conceptual-vacancy");
    expect(html).toContain("No financial result is shown until every input is valid");
  });
  it("keeps architectural context explicitly separate from the fictional model", () => {
    const html = renderToStaticMarkup(createElement(VisualComposition, { photography: createElement("div", null, "Reserved licensed image"), diagram: createElement("div", null, "Conceptual model") }));
    expect(html).toContain("never this fictional example");
    expect(html).toContain("Reserved licensed image");
    expect(html).toContain("Conceptual model");
    expect(html).not.toContain("<img");
  });
});
