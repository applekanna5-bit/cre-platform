import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LoanLifecyclePage from "@/app/loan-lifecycle/page";
import SpecializationsPage from "@/app/specializations/page";
import FeedbackPage from "@/app/feedback/page";
import { SiteFooter } from "@/components/site-footer";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";

describe("published underwriting availability", () => {
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
    expect(lifecycle.match(/<strong>Planned\.<\/strong>/g)).toHaveLength(7);
    expect(lifecycle).not.toMatch(/secondary markets|securitization/i);
    expect(specializations).toContain("secondary markets, and securitization");
  });

  it("links to feedback and states that submissions are unavailable", () => {
    const footer = renderToStaticMarkup(createElement(SiteFooter));
    expect(footer).toContain("8 published articles available in the library.");
    expect(footer).toContain('href="/feedback"');
    const feedback = renderToStaticMarkup(createElement(FeedbackPage));
    expect(feedback).toContain("Feedback submissions are currently unavailable.");
    expect(feedback).toContain("Never share confidential borrower, client, employer, or transaction information.");
    expect(feedback).not.toMatch(/<(form|input|textarea|select)\b/);
  });
});
