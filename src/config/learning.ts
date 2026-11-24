import { catalog } from "@/content/.generated";
import { readableArticles } from "@/content/publication";


export const beginnerArticleId = "phase2a-gpr-egi";

export const lifecycle = [
  { id: "fundamentals", title: "CRE Fundamentals and Property Types", description: "Identify the property, who owns and finances it, and how it earns income.", articles: ["WP04A-01", "WP04A-02", "WP04A-03"], planned: "Property-specific leases and operating risks." },
  { id: "origination", title: "Loan Request and Preliminary Screening", description: "Clarify what the borrower needs, which lenders might fit, and what evidence is missing.", articles: ["WP04A-04", "WP04A-05"], planned: "Additional lender and product comparisons." },
  { id: "financial-analysis", title: "Rent Roll, T-12 and Financial Analysis", description: "Compare the lease schedule with the trailing 12 months of operations to see what supports the property’s income.", articles: ["CRE-006", "CRE-007", "CRE-008", beginnerArticleId, "CRE-011"], planned: "Operating expenses, capital spending, and reserves." },
  { id: "loan-sizing", title: "Underwriting, NOI and Loan Sizing", description: "Estimate net operating income (NOI), assess value, and test how much debt the property can support.", articles: ["CRE-015", "CRE-018", "CRE-025"], planned: "Comparing coverage, leverage, and debt-yield constraints." },
  { id: "credit-review", title: "Credit Review, Third-Party Reports and Approval", description: "Assess what the reports and borrower evidence say about risk, and decide which conditions are needed.", articles: [], planned: "Credit decisions, appraisals, environmental review, and property condition." },
  { id: "closing", title: "Closing and Funding", description: "Confirm which conditions are met, how funds are released, and what servicing needs at handoff.", articles: [], planned: "Closing diligence, loan documents, and funding conditions." },
  { id: "servicing", title: "Loan Servicing, Asset Management and Special Servicing", description: "Follow payments and property performance, and see who acts when a loan needs attention.", articles: [], planned: "Servicing roles, transfers, monitoring, workouts, and resolution." },
] as const;

export const specializations = [
  { id: "underwriting", title: "Underwriting", description: "Turn property records into an income, value, and credit assessment.", articles: [...lifecycle[2].articles, ...lifecycle[3].articles, "WP04A-01", "WP04A-05"], planned: "Sizing a loan across multiple constraints." },
  { id: "property-types", title: "Property Types", description: "Understand how the asset’s leases and operations shape the analysis.", articles: ["CRE-007", "CRE-008"], planned: "Conventional multifamily, manufactured housing communities, affordable housing, senior and student housing, and commercial assets including retail, office, industrial, and hospitality." },
  { id: "financing-markets", title: "Financing & Markets", description: "Compare loan purposes and follow what can happen to a loan after it is funded.", articles: ["WP04A-02", "WP04A-03", "WP04A-04", "CRE-025"], planned: "Acquisition, refinance, supplemental and bridge loans, Fannie Mae and Freddie Mac, whole-loan sales, and commercial mortgage-backed securities (CMBS), including pooling, tranches, and ratings." },
  { id: "servicing", title: "Servicing", description: "Follow the loan after closing, from payment administration and borrower requests to resolution.", articles: [], planned: "Primary, sub-, master, and special servicing, assumptions and transfers, asset and default management, workouts, and resolution." },
] as const;

const readableById = new Map(readableArticles({
  articles: catalog.articles,
}).map(article => [article.id, article]));

export function recommendedReading(ids: readonly string[]) {
  return ids.flatMap(id => {
    const article = readableById.get(id);
    return article ? [article] : [];
  });
}
