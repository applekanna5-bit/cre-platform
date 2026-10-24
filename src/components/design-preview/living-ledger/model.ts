/** Isolated fictional teaching model. Never used by published calculators or content. */
export const UNITS = 100;
export interface Assumptions {
  monthlyRent: number;
  vacancyPercent: number;
  expensePercent: number;
  capRatePercent: number;
}
export const INITIAL_ASSUMPTIONS: Readonly<Assumptions> = Object.freeze({
  monthlyRent: 1500, vacancyPercent: 5, expensePercent: 40, capRatePercent: 5.5,
});

export function calculateIllustration(assumptions: Assumptions) {
  const { monthlyRent, vacancyPercent, expensePercent, capRatePercent } = assumptions;
  if (!Object.values(assumptions).every(Number.isFinite) || monthlyRent < 0 ||
    vacancyPercent < 0 || vacancyPercent > 100 || expensePercent < 0 || expensePercent > 100 ||
    capRatePercent <= 0 || capRatePercent > 100) {
    throw new RangeError("Use finite, nonnegative rent, vacancy and expenses from 0–100%, and a positive cap rate up to 100%.");
  }
  const grossPotentialRent = UNITS * monthlyRent * 12;
  const effectiveRentalIncome = grossPotentialRent * (1 - vacancyPercent / 100);
  const noi = effectiveRentalIncome * (1 - expensePercent / 100);
  const propertyValue = noi / (capRatePercent / 100);
  const vacancyAllowance = grossPotentialRent - effectiveRentalIncome;
  const operatingExpenses = effectiveRentalIncome - noi;
  const result = { grossPotentialRent, effectiveRentalIncome, noi, propertyValue, vacancyAllowance, operatingExpenses };
  if (!Object.values(result).every(Number.isFinite)) throw new RangeError("Assumptions exceed the model's numeric limits.");
  return result;
}

export const INPUTS = [
  { key: "monthlyRent", label: "Monthly rent per unit", unit: "USD", min: 0, max: 5000, step: 25, help: "Same monthly rent for all 100 units. $0–$5,000." },
  { key: "vacancyPercent", label: "Vacancy", unit: "%", min: 0, max: 100, step: 1, help: "Share of gross potential rent not earned. 0–100%." },
  { key: "expensePercent", label: "Operating expense ratio", unit: "%", min: 0, max: 100, step: 1, help: "Applied to effective rental income, not gross rent. 0–100%." },
  { key: "capRatePercent", label: "Capitalization rate", unit: "%", min: 0.5, max: 15, step: 0.1, help: "Annual NOI divided by value. Educational range: 0.5–15%." },
] as const;
export type AssumptionKey = keyof Assumptions;
export type DraftAssumptions = Record<AssumptionKey, string>;

/** Fixed teaching baseline; isolated effects are not additive when inputs interact. */
export function compareToBaseline(assumptions: Assumptions) {
  const baseline = calculateIllustration(INITIAL_ASSUMPTIONS);
  const current = calculateIllustration(assumptions);
  const dollarChange = current.propertyValue - baseline.propertyValue;
  return {
    baselineValue: baseline.propertyValue,
    dollarChange,
    percentChange: dollarChange / baseline.propertyValue * 100,
    drivers: INPUTS.map(input => ({
      key: input.key,
      difference: assumptions[input.key] - INITIAL_ASSUMPTIONS[input.key],
      isolatedValueChange: calculateIllustration({ ...INITIAL_ASSUMPTIONS, [input.key]: assumptions[input.key] }).propertyValue - baseline.propertyValue,
    })),
  };
}

export function parseDraft(draft: DraftAssumptions) {
  const errors: Partial<Record<AssumptionKey, string>> = {};
  const values = {} as Assumptions;
  for (const input of INPUTS) {
    const raw = draft[input.key].trim();
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value < input.min || value > input.max) {
      errors[input.key] = `Enter a value from ${input.min} to ${input.max}${input.unit === "%" ? "%" : " USD"}.`;
    }
    values[input.key] = value;
  }
  return { errors, values: Object.keys(errors).length ? null : values };
}
