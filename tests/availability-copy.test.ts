import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LoanLifecyclePage from "@/app/loan-lifecycle/page";
import SpecializationsPage from "@/app/specializations/page";
import { SiteFooter } from "@/components/site-footer";
import { catalog } from "@/content/.generated";
import { lifecycle as stages } from "@/config/learning";
import { publicArticles } from "@/content/publication";

describe("published underwriting availability", () => {
  it("assigns each published article to its principal lifecycle stage", () => {
    expect(stages.map(stage => stage.articles)).toEqual([
      [], [], ["CRE-006", "CRE-007", "CRE-008", "phase2a-gpr-egi", "CRE-011"],
      ["CRE-015", "CRE-018", "CRE-025"], [], [], [],
    ]);
  });

  it("keeps all eight articles accessible from the lifecycle and specializations", () => {
    const articles = publicArticles(catalog);
    expect(articles.map(article => article.id).sort()).toEqual(["CRE-006", "CRE-007", "CRE-008", "CRE-011", "CRE-015", "CRE-018", "CRE-025", "phase2a-gpr-egi"]);
    const lifecycle = renderToStaticMarkup(createElement(LoanLifecyclePage));
    const specializations = renderToStaticMarkup(createElement(SpecializationsPage));
    for (const html of [lifecycle, specializations]) {
      for (const article of articles) expect(html).toContain(`href="${article.href}"`);
      const hrefs = [...html.matchAll(/href="(\/content\/[^"]+)"/g)].map(match => match[1]);
      expect(hrefs.every(href => articles.some(article => article.href === href))).toBe(true);
    }
    expect(lifecycle.match(/<h2\b/g)).toHaveLength(7);
    expect(lifecycle.match(/>Planned topics<\/span>/g)).toHaveLength(7);
    for (const stage of stages) {
      expect(lifecycle.includes(`aria-labelledby="${stage.id}-reading"`)).toBe(stage.articles.length > 0);
    }
    expect(stages.map(stage => stage.title)).toEqual([
      "CRE Fundamentals and Property Types", "Loan Request and Preliminary Screening",
      "Rent Roll, T-12 and Financial Analysis", "Underwriting, NOI and Loan Sizing",
      "Credit Review, Third-Party Reports and Approval", "Closing and Funding",
      "Loan Servicing, Asset Management and Special Servicing",
    ]);
    expect(lifecycle).toContain('href="/specializations#financing-markets"');
    expect(specializations).toContain("whole-loan sales");
  });

  it("reports eight published guides and keeps trust links in the footer", () => {
    const footer = renderToStaticMarkup(createElement(SiteFooter));
    expect(footer).toContain("8 published articles available in the library.");
    expect(footer).toContain('href="/about"');
    expect(footer).toContain('href="/editorial-standards"');
  });
});
