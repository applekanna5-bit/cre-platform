import { UNITS, type Assumptions, type calculateIllustration } from "./model";

export const BUILDING_MODES = ["Rent", "Vacancy", "Expenses"] as const;
export type BuildingMode = typeof BUILDING_MODES[number];
export type Illustration = ReturnType<typeof calculateIllustration>;

/** Display projection only. The laboratory owns and calculates all financial values. */
export function buildingView(mode: BuildingMode, assumptions: Assumptions, result: Illustration) {
  if (mode === "Rent") return {
    title: "Rent Determines Gross Potential Rental Income.",
    explanation: "One shared monthly rent, repeated across 100 fictional apartments and 12 months. This is potential income before vacancy or expenses.",
    amount: result.grossPotentialRent, label: "Gross potential rental income / USD per year",
    formula: `100 × monthly rent × 12`, share: 1, highlightedUnits: 0,
  };
  if (mode === "Vacancy") return {
    title: "Potential rent is not earned rent.",
    explanation: "Financial vacancy is a share of potential rental dollars, not an exact measure of physical occupancy. Subtract the vacancy allowance to reach effective rental income.",
    amount: result.effectiveRentalIncome, label: "Effective rental income / USD per year",
    formula: "Gross potential rent × (1 − vacancy rate)", share: assumptions.vacancyPercent / 100,
    highlightedUnits: Math.round(UNITS * assumptions.vacancyPercent / 100),
  };
  return {
    title: "The property earns income. Operations use part of it.",
    explanation: "Apply the expense ratio to effective rental income after vacancy. The remaining income is illustrative NOI. Expenses belong to the property model, not individual apartments.",
    amount: result.noi, label: "Remaining illustrative NOI / USD per year",
    formula: "Effective rental income × (1 − expense ratio)", share: assumptions.expensePercent / 100, highlightedUnits: 0,
  };
}
