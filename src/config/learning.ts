import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";
import { isPublicArticle } from "@/content/catalog";

export const lifecycle = [
  { id: "fundamentals", title: "CRE Fundamentals", articles: [], planned: "Property cash flow and the roles of borrowers and lenders." },
  { id: "origination", title: "Origination & Screening", articles: [], planned: "Borrower screening and initial loan terms." },
  { id: "financial-analysis", title: "Financial Analysis", articles: ["CRE-006", "CRE-007", "CRE-008", "CRE-011", "phase2a-gpr-egi"], planned: "Capital spending and replacement reserves." },
  { id: "loan-sizing", title: "Underwriting & Loan Sizing", articles: ["CRE-015", "CRE-018", "CRE-025"], planned: "Loan sizing across coverage and leverage constraints." },
  { id: "credit-review", title: "Credit Review & Approval", articles: [], planned: "Credit memos, policy exceptions, and approval conditions." },
  { id: "closing", title: "Closing & Funding", articles: [], planned: "Closing diligence, loan documents, and funding conditions." },
  { id: "servicing", title: "Servicing & Special Servicing", articles: [], planned: "Loan monitoring, workouts, and resolution." },
] as const;

export const specializations = [
  { id: "underwriting", title: "Underwriting", articles: ["CRE-006", "CRE-007", "CRE-008", "CRE-011", "phase2a-gpr-egi", "CRE-015", "CRE-018", "CRE-025"], planned: "Comparing loan sizing constraints." },
  { id: "property-types", title: "Property Types", articles: ["CRE-007", "CRE-008"], planned: "Property-specific analysis for office, retail, and industrial assets." },
  { id: "financing-markets", title: "Financing & Capital Markets", articles: ["CRE-025"], planned: "Loan structures, secondary markets, and securitization." },
  { id: "servicing", title: "Servicing", articles: [], planned: "Portfolio monitoring, special servicing, and workouts." },
] as const;

const publishedById = new Map(publicArticles({
  articles: catalog.articles.filter(isPublicArticle),
}).map(article => [article.id, article]));

export function recommendedReading(ids: readonly string[]) {
  return ids.flatMap(id => {
    const article = publishedById.get(id);
    return article ? [article] : [];
  });
}
