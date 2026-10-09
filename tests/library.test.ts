import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LibraryPage from "@/app/library/page";
import Home from "@/app/page";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";
import { ArticleList } from "@/components/content/article-list";

describe("Phase 2 public research discovery", () => {
  it("links every public article from the library and homepage, excluding nonpublic articles", () => {
    const articles = publicArticles(catalog);
    expect(articles).toHaveLength(5);
    for (const Page of [LibraryPage, Home]) {
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
    const html = renderToStaticMarkup(createElement(ArticleList, { articles: [{ ...publicArticles(catalog)[0], needsReview: true }] }));
    expect(html).toContain("Awaiting review");
    expect(html).toContain('dateTime="');
  });
});
