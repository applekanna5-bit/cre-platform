import { describe, expect, it } from "vitest";
import { resolveSeoContext } from "@/seo/context";
import { serializeBuildContext } from "@/seo/build-context";
import { requireLocalSnapshot, validateRuntime } from "../scripts/release-start.mts";
import { discoverContent } from "@/content/discovery";
import { isPublicArticle, articleRoute } from "@/content/catalog";
import { articleBreadcrumbs, articleStructuredData, breadcrumbStructuredData } from "@/seo/structured-data";
import { publicSeoPages } from "@/seo/public-pages";
const delivery = { accessMode: "public", nodeEnvironment: "production", testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false };
const context = resolveSeoContext({ SITE_ENV: "production", SITE_INDEXING_ENABLED: "true", SITE_PRODUCTION_ORIGIN: "https://thecreledger.com" }, { fixturesEnabled: false, editorialPreviewEnabled: false });
const snapshot = serializeBuildContext(context, delivery);
const env = { NODE_ENV: "production", SITE_ENV: "production", SITE_INDEXING_ENABLED: "true", SITE_PRODUCTION_ORIGIN: "https://thecreledger.com", PREVIEW_ACCESS_MODE: "public", CRE_RELEASE_SIMULATION: "1", HOSTNAME: "127.0.0.1" };
describe("owner-authorized eight-only indexed simulation foundation", () => {
  it("accepts clean indexed context only with loopback simulation runtime", () => {
    expect(requireLocalSnapshot(snapshot).policy.indexingAllowed).toBe(true);
    expect(() => validateRuntime(snapshot, env)).not.toThrow();
  });
  it.each([{ CRE_RELEASE_SIMULATION: undefined }, { HOSTNAME: "0.0.0.0" }, { SITE_ENV: "development" },
    { SITE_INDEXING_ENABLED: "false" }, { PREVIEW_ACCESS_MODE: "private" }, { CRE_TEST_ONLY_PUBLICATION_DATE: "" }])("rejects unsafe indexed runtime %#", change => {
      expect(() => validateRuntime(snapshot, { ...env, ...change })).toThrow();
  });
  it("projects exactly eight genuine article schemas and fifteen sitemap URLs; visible breadcrumb agrees", async () => {
    const { catalog } = await discoverContent("content");
    const eligible = catalog.articles.filter(isPublicArticle);
    expect(eligible).toHaveLength(8);
    expect(catalog.articles).toHaveLength(8);
    expect(publicSeoPages(catalog, context, delivery)).toHaveLength(15);
    for (const a of catalog.articles) {
      const schema = articleStructuredData(a, context, delivery), crumbs = breadcrumbStructuredData(a, context, delivery);
      if (!isPublicArticle(a)) { expect(schema).toBeNull(); expect(crumbs).toBeNull(); continue; }
      expect(schema?.url).toBe(context.site.productionOrigin + articleRoute(a));
      expect(schema?.datePublished).toBe(a.publishedDate);
      expect(crumbs?.itemListElement.map(v => v.name)).toEqual(articleBreadcrumbs(a).map(v => v.name));
    }
  });
});
