import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { catalog } from "@/content/.generated";
import type { ArticleMetadata } from "@/content/contracts";
import { publicArticles } from "@/content/publication";
import { LearningDiscovery } from "@/components/design-preview/living-ledger-cinematic/learning-discovery";

const render = (articles: readonly ArticleMetadata[]) => renderToStaticMarkup(createElement(LearningDiscovery, { catalog: { articles } }));

describe("Milestone 4D publication-safe learning discovery", () => {
  it("derives the one available category and all five real research destinations", () => {
    const html = render(catalog.articles);
    const published = publicArticles(catalog);
    expect(published).toHaveLength(5);
    expect(html).toContain("5 published articles");
    expect(html).toContain('href="#knowledge-underwriting"');
    expect(html).toContain('id="knowledge-underwriting"');
    expect(html.match(/class="[^"]*category[^"]*"/g)).toHaveLength(1);
    for (const article of published) {
      expect(html).toContain(`href="${article.href}"`);
      expect(html).toContain(article.title);
      expect(html).toContain(article.description);
    }
    expect(html).not.toContain("CRE Fundamentals");
    expect(html).not.toContain("Financial Modeling");
    expect(html).not.toContain("Property Types");
    expect(html).not.toContain("Agency Lending");
    expect(html).not.toContain("noi-development-fixture");
    expect(html).not.toContain("fixture-noi-bridge");
    expect(html).not.toContain("Planned lesson");
    expect(html).not.toMatch(/certificate|completion percentage|beginner|advanced/i);
  });

  it("connects discovery, understanding, application, and all five financial concepts", () => {
    const html = render(catalog.articles);
    expect(html).toContain("Discover. Understand. Apply.");
    expect(html).toContain('href="#assumption-monthlyRent"');
    for (const concept of ["Rent", "Vacancy", "Expenses", "NOI", "Valuation"]) expect(html).toContain(`<dt>${concept}</dt>`);
    const expected = { Rent: "contract-rent-vs-market-rent", Vacancy: "cre-revenue-underwriting", Expenses: "t12-operating-statement", NOI: "net-operating-income-underwritten-noi", Valuation: "net-operating-income-underwritten-noi" };
    for (const [concept, slug] of Object.entries(expected)) {
      expect(html).toMatch(new RegExp(`<dt>${concept}</dt><dd>[\\s\\S]*?href="/content/underwriting/${slug}"[\\s\\S]*?</dd>`));
    }
    expect(html).toContain("worked examples are separate from this fictional property");
  });

  it.each(["approved", "draft", "archived", "research", "ready", "technical-review"] as const)("does not leak %s records through counts, cards, or preferred-ID links", status => {
    const preferred = catalog.articles.find(article => article.id === "CRE-015")!;
    const hidden: ArticleMetadata = { ...preferred, status, publishedDate: undefined, title: "PRIVATE_EDITORIAL_MARKER", description: "PRIVATE_DESCRIPTION", topics: ["PRIVATE_TOPIC"] };
    const html = render(catalog.articles.filter(article => article.id !== preferred.id).concat(hidden));
    expect(html).toContain("4 published articles");
    expect(html).not.toContain("PRIVATE_");
    expect(html).not.toContain('href="/content/underwriting/net-operating-income-underwritten-noi"');
    expect(html).not.toContain("<dt>Valuation</dt>");
    expect(html).not.toContain("<dt>NOI</dt>");
  });

  it("updates counts and destinations from a partial catalog without stale learning links", () => {
    const article = catalog.articles.find(article => article.id === "CRE-007")!;
    const html = render([article]);
    expect(html).toContain("1 published article<");
    expect(html).not.toContain("Discover. Understand. Apply.");
    expect(html).not.toContain("connected-research-title");
    expect(html).not.toContain("5 published articles");
    expect(html).toContain(`href="/content/underwriting/${article.slug}"`);
  });

  it("marks previously published material awaiting review and counts it only once", () => {
    const article = catalog.articles.find(article => article.id === "CRE-015")!;
    const html = render([{ ...article, status: "needs-review" }]);
    expect(html).toContain("1 published article<");
    expect(html).toContain("Awaiting review");
    expect(html).toContain('href="/content/underwriting/net-operating-income-underwritten-noi"');
  });

  it("handles an empty catalog honestly while preserving library/search access", () => {
    const html = render([]);
    expect(html).toContain("Published research will appear here when available");
    expect(html).not.toContain("0 published articles");
    expect(html).not.toContain('href="#knowledge-');
    expect(html).not.toContain('href="/content/');
    expect(html).toContain('href="/library"');
    expect(html).toContain('href="/search?q=NOI"');
  });

  it("uses ordinary accessible links and valid headings without a duplicate search form", () => {
    const html = render(catalog.articles);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<button");
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain('tabindex="0"');
    const allowed = new Set(publicArticles(catalog).map(article => article.href));
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      expect(href.startsWith("#") || allowed.has(href) || ["/library", "/search?q=NOI"].includes(href)).toBe(true);
      if (href.startsWith("#") && href !== "#assumption-monthlyRent") expect(html).toContain(`id="${href.slice(1)}"`);
    }
    const levels = [...html.matchAll(/<h([2-6])\b/g)].map(match => Number(match[1]));
    levels.slice(1).forEach((level, index) => expect(level).toBeLessThanOrEqual(levels[index] + 1));
  });

  it("gives each learning stage a clear purpose and uses publication-filtered deep-dive relationships for next reads", () => {
    const html = render(catalog.articles);
    expect(html).toContain("Source documents &amp; financial evidence");
    expect(html).toContain("Revenue, expenses, NOI &amp; value");
    expect(html).toContain("The fictional property laboratory");
    expect(html).toContain("In practice");
    expect(html).toContain("Read next");
    const rent = catalog.articles.find(article => article.id === "CRE-008")!;
    const revenue = catalog.articles.find(article => article.id === "CRE-011")!;
    const card = html.match(new RegExp(`<article\\b[^>]*>[\\s\\S]*?${rent.title}[\\s\\S]*?</article>`))?.[0];
    expect(card).toContain(`href="/content/underwriting/${revenue.slug}"`);
    expect(card).toContain("Assess supportable revenue");
    expect(html).toContain("Apply this reading in the fictional laboratory");
  });

  it("does not expose private deep-dive targets from an otherwise published article", () => {
    const source = catalog.articles.find(article => article.id === "CRE-008")!;
    const target = catalog.articles.find(article => article.id === "CRE-011")!;
    const html = render([source, { ...target, status: "approved", title: "HIDDEN_NEXT_READ", publishedDate: undefined }]);
    expect(html).not.toContain("HIDDEN_NEXT_READ");
    expect(html).not.toContain(`href="/content/underwriting/${target.slug}"`);
    expect(html).not.toContain("Read next");
  });
});
