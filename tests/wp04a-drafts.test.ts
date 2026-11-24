import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleRoute, isCommunityReview, resolveRelationships } from "@/content/catalog";
import { compileArticle } from "@/content/compile";
import { projectDeliveryCatalog } from "@/content/delivery";
import { discoverContent } from "@/content/discovery";
import { publicArticles, readableArticles } from "@/content/publication";
import { searchDocuments } from "@/content/.generated/search";
import { lifecycle, recommendedReading, specializations } from "@/config/learning";
import { resolveSeoContext } from "@/seo/context";
import { articleMetadata } from "@/seo/metadata";
import { publicSeoPages } from "@/seo/public-pages";
import { articleStructuredData, breadcrumbStructuredData } from "@/seo/structured-data";

const ids = ["WP04A-01", "WP04A-02", "WP04A-03", "WP04A-04", "WP04A-05"];
const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
const context = resolveSeoContext({
  SITE_ENV: "production", SITE_PRODUCTION_ORIGIN: "https://thecreledger.com", SITE_INDEXING_ENABLED: "true",
}, mode);
const delivery = {
  nodeEnvironment: "production", accessMode: "public",
  testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false,
};

describe("Group 1 Community Review release", () => {
  it("delivers exactly five review guides and eight published articles with distinct SEO treatment", async () => {
    const { catalog, documents } = await discoverContent("content");
    const projected = projectDeliveryCatalog(catalog, mode);
    const community = projected.articles.filter(isCommunityReview);
    const published = publicArticles(projected);
    expect(published).toHaveLength(8);
    expect(community.map(article => article.id).sort()).toEqual(ids);
    expect(readableArticles(projected)).toHaveLength(13);
    expect(searchDocuments.map(article => article.id).sort()).toEqual(projected.articles.map(article => article.id).sort());

    const sitemap = publicSeoPages(projected, context, delivery);
    expect(sitemap).toHaveLength(14);
    expect(sitemap.filter(page => new URL(page.url).pathname.startsWith("/content/")).map(page => new URL(page.url).pathname))
      .toEqual(published.map(article => article.href));
    for (const article of community) {
      const document = documents.find(item => item.metadata.id === article.id)!;
      const draft = await readFile(join("docs/editorial-ux/wp04a", article.domain, article.slug + ".mdx"), "utf8");
      if (article.id !== "WP04A-04") expect(document.body.replaceAll("\r\n", "\n")).toBe(draft.replaceAll("\r\n", "\n"));
      expect((await compileArticle(document.body, article, projected)).headings.length).toBeGreaterThan(0);
      expect(article.reviewer).toBeUndefined();
      expect(article.publishedDate).toBeUndefined();
      expect(article.lastReviewedDate).toBeUndefined();
      expect(article.sources.length).toBeGreaterThan(0);
      const metadata = articleMetadata(article, context);
      expect(metadata.robots).toMatchObject({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toBe("https://thecreledger.com" + articleRoute(article));
      expect(articleStructuredData(article, context, delivery)).toBeNull();
      expect(breadcrumbStructuredData(article, context, delivery)).toBeNull();
      expect(resolveRelationships(article, projected).every(link => link.href)).toBe(true);
      expect(lifecycle.filter(topic => topic.articles.some(id => id === article.id))).toHaveLength(1);
      expect(specializations.filter(topic => topic.articles.some(id => id === article.id))).toHaveLength(1);
      expect(recommendedReading([article.id])[0]).toMatchObject({ communityReview: true, href: articleRoute(article) });
    }
  });
});
