import { describe, expect, it } from "vitest";
import { calculateIllustration, compareToBaseline, INITIAL_ASSUMPTIONS, parseDraft, type Assumptions, type DraftAssumptions } from "@/components/design-preview/living-ledger/model";

describe("fictional 100-unit illustration", () => {
  it("matches an independently worked base case", () => {
    const result = calculateIllustration(INITIAL_ASSUMPTIONS);
    expect(result.grossPotentialRent).toBe(1800000);
    expect(result.effectiveRentalIncome).toBe(1710000);
    expect(result.noi).toBe(1026000);
    expect(result.propertyValue).toBeCloseTo(18654545.45454545, 6);
    expect(result.vacancyAllowance).toBe(90000);
    expect(result.operatingExpenses).toBe(684000);
  });
  it("applies expenses to effective income, and divides by the decimal cap rate", () => {
    const result = calculateIllustration({ monthlyRent: 2000, vacancyPercent: 10, expensePercent: 35, capRatePercent: 5 });
    expect(result).toEqual({ grossPotentialRent: 2400000, effectiveRentalIncome: 2160000, noi: 1404000, propertyValue: 28080000, vacancyAllowance: 240000, operatingExpenses: 756000 });
  });
  it.each([{ monthlyRent: 0 }, { vacancyPercent: 100 }, { expensePercent: 100 }])("handles a zero-NOI boundary without infinity or NaN %#", override => {
    const result = calculateIllustration({ ...INITIAL_ASSUMPTIONS, ...override });
    expect(result.noi).toBe(0);
    expect(result.propertyValue).toBe(0);
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
  });
  it("reconciles the allocation, preserves inputs, and reacts in the expected direction", () => {
    const initial = Object.freeze({ ...INITIAL_ASSUMPTIONS });
    const base = calculateIllustration(initial);
    expect(base.noi + base.operatingExpenses + base.vacancyAllowance).toBeCloseTo(base.grossPotentialRent, 6);
    expect(calculateIllustration({ ...initial, monthlyRent: 1600 }).propertyValue).toBeGreaterThan(base.propertyValue);
    expect(calculateIllustration({ ...initial, vacancyPercent: 6 }).noi).toBeLessThan(base.noi);
    expect(calculateIllustration({ ...initial, expensePercent: 41 }).noi).toBeLessThan(base.noi);
    expect(calculateIllustration({ ...initial, capRatePercent: 6 }).propertyValue).toBeLessThan(base.propertyValue);
    expect(initial).toEqual(INITIAL_ASSUMPTIONS);
  });
  it.each([
    { monthlyRent: -1 }, { monthlyRent: NaN }, { monthlyRent: Infinity }, { monthlyRent: Number.MAX_VALUE },
    { vacancyPercent: -1 }, { vacancyPercent: 101 }, { expensePercent: -1 }, { expensePercent: 101 },
    { capRatePercent: 0 }, { capRatePercent: -5 }, { capRatePercent: NaN }, { capRatePercent: Infinity }, { capRatePercent: 101 },
  ] satisfies Partial<Assumptions>[])("rejects invalid or overflowing assumptions %#", override => {
    expect(() => calculateIllustration({ ...INITIAL_ASSUMPTIONS, ...override })).toThrow(RangeError);
  });
  it("retains fractional precision until display", () => {
    const result = calculateIllustration({ monthlyRent: 1500.25, vacancyPercent: 5.25, expensePercent: 40.125, capRatePercent: 5.625 });
    expect(result.grossPotentialRent).toBe(1800300);
    expect(result.effectiveRentalIncome).toBeCloseTo(1705784.25, 6);
    expect(result.noi).not.toBe(Math.round(result.noi));
    expect(result.propertyValue * .05625).toBeCloseTo(result.noi, 6);
  });
});

describe("baseline comparison and isolated assumption effects", () => {
  it("keeps the original baseline fixed with zero initial changes", () => {
    const comparison = compareToBaseline(INITIAL_ASSUMPTIONS);
    expect(comparison.baselineValue).toBeCloseTo(18654545.45454545, 6);
    expect(comparison.dollarChange).toBe(0);
    expect(comparison.percentChange).toBe(0);
    expect(comparison.drivers.every(driver => driver.difference === 0 && driver.isolatedValueChange === 0)).toBe(true);
  });
  it.each([
    ["monthlyRent", 1600, 1243636.36363636, 6.666666666667, 100],
    ["vacancyPercent", 10, -981818.18181818, -5.263157894737, 5],
    ["expensePercent", 50, -3109090.90909091, -16.666666666667, 10],
    ["capRatePercent", 6, -1554545.45454545, -8.333333333333, .5],
  ] as const)("explains %s against the fixed baseline", (key, value, dollars, percent, difference) => {
    const comparison = compareToBaseline({ ...INITIAL_ASSUMPTIONS, [key]: value });
    expect(comparison.dollarChange).toBeCloseTo(dollars, 5);
    expect(comparison.percentChange).toBeCloseTo(percent, 8);
    expect(comparison.drivers.find(driver => driver.key === key)?.difference).toBe(difference);
    expect(comparison.drivers.find(driver => driver.key === key)?.isolatedValueChange).toBeCloseTo(dollars, 5);
  });
  it("does not misrepresent interacting effects as additive", () => {
    const comparison = compareToBaseline({ ...INITIAL_ASSUMPTIONS, monthlyRent: 2000, capRatePercent: 5 });
    expect(comparison.dollarChange).toBeCloseTo(8705454.54545455, 5);
    expect(comparison.drivers.reduce((total, driver) => total + driver.isolatedValueChange, 0)).not.toBeCloseTo(comparison.dollarChange, 1);
  });
  it("handles zero income as a finite 100% decline", () => {
    const comparison = compareToBaseline({ ...INITIAL_ASSUMPTIONS, monthlyRent: 0 });
    expect(comparison.percentChange).toBe(-100);
    expect(comparison.dollarChange).toBe(-comparison.baselineValue);
  });
});

describe("draft input validation", () => {
  const valid: DraftAssumptions = { monthlyRent: "1500", vacancyPercent: "5", expensePercent: "40", capRatePercent: "5.5" };
  it("accepts valid decimals without silently rounding or clamping", () => {
    expect(parseDraft(valid).values).toEqual(INITIAL_ASSUMPTIONS);
    expect(parseDraft({ ...valid, monthlyRent: "1500.25" }).values?.monthlyRent).toBe(1500.25);
  });
  it.each(["", " ", "-1", "5001", "Infinity", "NaN", "not-a-number"])("rejects invalid rent %s and withholds the result", value => {
    const result = parseDraft({ ...valid, monthlyRent: value });
    expect(result.values).toBeNull();
    expect(result.errors.monthlyRent).toBeTruthy();
  });
  it.each([{ capRatePercent: "0" }, { capRatePercent: "0.4" }, { capRatePercent: "15.1" }, { vacancyPercent: "101" }, { expensePercent: "101" }])("rejects invalid percentage input %#", override => {
    expect(parseDraft({ ...valid, ...override }).values).toBeNull();
  });
});
