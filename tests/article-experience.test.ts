import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticleTemplate } from "@/components/content/article-template";
import { articleHeadings, catalog, embeddedCases } from "@/content/.generated";
import { isPublicArticle } from "@/content/catalog";
import { lifecycle } from "@/config/learning";
import { articleBreadcrumbs } from "@/seo/structured-data";

describe("article reading controls", () => {
  it("gives each published article its lifecycle stage and a native outline before the body", () => {
    for (const article of catalog.articles.filter(isPublicArticle)) {
      const stage = lifecycle.find(topic => topic.articles.some(id => id === article.id));
      const html = renderToStaticMarkup(createElement(ArticleTemplate, {
        article, catalog, headings: articleHeadings[article.id], embeddedCases: embeddedCases[article.id],
        breadcrumbs: articleBreadcrumbs(article),
      }, createElement("p", null, "Article body marker")));
      expect(stage).toBeDefined();
      expect(html).toContain(`href="/loan-lifecycle#${stage?.id}"`);
      expect(html).toContain('href="/library"');
      expect(html).toContain('href="#article-title"');
      expect(html.indexOf("<summary>On this page</summary>")).toBeGreaterThan(-1);
      expect(html.indexOf("<summary>On this page</summary>")).toBeLessThan(html.indexOf("Article body marker"));
      expect(html.match(/id="article-relationships"/g)?.length ?? 0).toBeLessThanOrEqual(1);
      expect(html).not.toContain("Not available");
    }
  });
});
