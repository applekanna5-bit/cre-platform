import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LibraryPage from "@/app/library/page";
import SpecializationsPage from "@/app/specializations/page";
import { catalog } from "@/content/.generated";
import { readableArticles } from "@/content/publication";
import { ArticleList } from "@/components/content/article-list";

vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));

describe("Phase 2 public research discovery", () => {
  it("links every public article from the library and specializations, excluding nonpublic articles", () => {
    const articles = readableArticles(catalog);
    expect(articles).toHaveLength(13);
    for (const Page of [LibraryPage, SpecializationsPage]) {
      const html = renderToStaticMarkup(createElement(Page));
      for (const article of articles) expect(html).toContain(`href="${article.href}"`);
      for (const article of catalog.articles.filter(item => !articles.some(publicItem => publicItem.id === item.id))) {
        expect(html).not.toContain(article.slug);
        expect(html).not.toContain(article.title);
      }
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).not.toContain("sourceIds");
    }
  });

  it("supports an empty library and visibly identifies articles awaiting review", () => {
    expect(renderToStaticMarkup(createElement(ArticleList, { articles: [] }))).toContain("Published research will appear here");
    const html = renderToStaticMarkup(createElement(ArticleList, { articles: [{ ...readableArticles(catalog).find(article => article.publishedDate)!, needsReview: true }] }));
    expect(html).toContain("Awaiting review");
    expect(html).toContain('dateTime="');
  });
});
