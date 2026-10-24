import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { articleRoute, isPublicArticle } from "@/content/catalog";
import type { EditorialStatus } from "@/content/contracts";
import { resolveSeoContext } from "@/seo/context";
import { articleMetadata, pageMetadata, siteName, siteDescription } from "@/seo/metadata";

const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
const origin = "https://metadata-test.cre-publication.com";
const production = resolveSeoContext({ SITE_ENV: "production", SITE_INDEXING_ENABLED: "true", SITE_PRODUCTION_ORIGIN: origin }, mode);
const { catalog } = await discoverContent(path.resolve("content"));
const article = catalog.articles.find(isPublicArticle)!;
const robots = (index: boolean, follow: boolean) => ({ index, follow, googleBot: { index, follow } });

describe("publication-safe page metadata", () => {
  it("uses The CRE Ledger consistently without changing article copy", () => {
    expect(siteName).toBe("The CRE Ledger");
    for (const page of ["layout", "home", "library", "search"] as const) {
      const metadata = pageMetadata(page, production);
      expect(metadata.title).toHaveProperty("absolute", expect.stringContaining("The CRE Ledger"));
      expect(metadata.openGraph).toHaveProperty("siteName", "The CRE Ledger");
    }
  });
  it.each(["development", "staging", "preview", "production"])("keeps complete disabled safeguards in %s even with an origin", environment => {
    for (const configuredOrigin of [undefined, origin]) {
      const context = resolveSeoContext({ SITE_ENV: environment, SITE_PRODUCTION_ORIGIN: configuredOrigin }, mode);
      for (const metadata of [pageMetadata("layout", context), pageMetadata("home", context), pageMetadata("library", context), pageMetadata("search", context), articleMetadata(article, context)]) {
        expect(metadata.robots).toEqual(robots(false, false));
        expect(metadata.alternates).toBeUndefined();
        expect(metadata.openGraph).not.toHaveProperty("url");
        expect(JSON.stringify(metadata)).not.toContain(origin);
      }
    }
  });
  it("keeps layout URL-free and gives each indexable page its own absolute canonical", () => {
    expect(pageMetadata("layout", production).alternates).toBeUndefined();
    expect(pageMetadata("layout", production).openGraph).not.toHaveProperty("url");
    for (const [page, route] of [["home", "/"], ["library", "/library"]] as const) {
      const metadata = pageMetadata(page, production);
      expect(metadata.alternates).toEqual({ canonical: origin + route });
      expect(metadata.openGraph).toHaveProperty("url", origin + route);
      expect(metadata.robots).toEqual(robots(true, true));
    }
  });
  it("always excludes search from indexing and canonicalization", () => {
    const metadata = pageMetadata("search", production);
    expect(metadata.robots).toEqual(robots(false, true));
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).not.toHaveProperty("url");
    expect(metadata.title).toEqual({ absolute: `Search the research | ${siteName}` });
  });
  it("preserves public titles and descriptions and projects only safe social fields", () => {
    const published = catalog.articles.filter(isPublicArticle);
    expect(published).toHaveLength(5);
    for (const item of published) {
      const metadata = articleMetadata(item, production);
      expect(metadata.title).toEqual({ absolute: `${item.title} | ${siteName}` });
      expect(metadata.description).toBe(item.description);
      expect(metadata.alternates).toEqual({ canonical: origin + articleRoute(item) });
      expect(metadata.openGraph).toEqual({ title: `${item.title} | ${siteName}`, description: item.description, siteName, type: "article", url: origin + articleRoute(item) });
      expect(metadata.twitter).toEqual({ card: "summary", title: `${item.title} | ${siteName}`, description: item.description });
      expect(metadata.robots).toEqual(robots(true, true));
    }
    expect(pageMetadata("home", production).description).toBe(siteDescription);
    expect(pageMetadata("library", production).description).toBe("Published CRE research and practical guides to property financials, revenue analysis, and underwriting.");
  });
  it("formats absolute titles once, including already-suffixed input", () => {
    expect(pageMetadata("home", production).title).toEqual({ absolute: siteName });
    expect(pageMetadata("library", production).title).toEqual({ absolute: `Research Library | ${siteName}` });
    for (const title of [article.title, `${article.title} | ${siteName}`, `${article.title} | ${siteName} | ${siteName}`]) {
      expect(articleMetadata({ ...article, title }, production).title).toEqual({ absolute: `${article.title} | ${siteName}` });
    }
  });
  it("uses existing publication eligibility without leaking unpublished fields", () => {
    const states: EditorialStatus[] = ["research", "brief", "draft", "editorial-review", "technical-review", "source-verification", "ready", "approved", "published", "needs-review", "archived"];
    for (const status of states) {
      for (const developmentFixture of [false, true]) {
        for (const publishedDate of [undefined, article.publishedDate]) {
          const item = { ...article, status, developmentFixture, publishedDate, title: "PRIVATE-MARKER", description: "PRIVATE-MARKER" };
          const metadata = articleMetadata(item, production);
          if (isPublicArticle(item)) expect(metadata.alternates).toBeDefined();
          else {
            expect(JSON.stringify(metadata)).not.toContain("PRIVATE-MARKER");
            expect(metadata.alternates).toBeUndefined();
            expect(metadata.robots).toEqual(robots(false, false));
          }
        }
      }
    }
  });
  it("does not serialize private catalog fields or manufacture social claims", () => {
    const metadata = articleMetadata({ ...article, author: { name: "PRIVATE-MARKER" }, reviewer: { name: "PRIVATE-MARKER" }, topics: ["PRIVATE-MARKER"], sources: [{ ...article.sources[0], notes: "PRIVATE-MARKER" }] }, production);
    expect(JSON.stringify(metadata)).not.toContain("PRIVATE-MARKER");
    expect(Object.keys(metadata).sort()).toEqual(["title", "description", "robots", "alternates", "openGraph", "twitter"].sort());
  });
  it("retains full noindex policies for fixture and editorial preview contexts", () => {
    for (const preview of [{ ...mode, fixturesEnabled: true }, { ...mode, editorialPreviewEnabled: true }]) {
      const context = resolveSeoContext({}, preview);
      expect(articleMetadata(article, context).robots).toEqual(robots(false, false));
      expect(pageMetadata("search", context).robots).toEqual(robots(false, false));
    }
  });
});
