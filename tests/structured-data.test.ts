import { describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { isPublicArticle } from "@/content/catalog";
import { resolveSeoContext } from "@/seo/context";
import { articleStructuredData, breadcrumbStructuredData, serializeStructuredData } from "@/seo/structured-data";
const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
const indexed = resolveSeoContext({ SITE_ENV: "production", SITE_INDEXING_ENABLED: "true", SITE_PRODUCTION_ORIGIN: "https://schema-test.cre-publication.com" }, mode);
const delivery = { accessMode: "public", nodeEnvironment: "production", testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false };
const { catalog } = await discoverContent("content");
const article = catalog.articles.find(isPublicArticle)!;
describe("pure structured-data safety preparation (not rendered)", () => {
  it("is URL/claim-free when disabled for every article, including private records", () => {
    for (const a of catalog.articles) {
      expect(articleStructuredData(a, resolveSeoContext({}, mode), delivery)).toBeNull();
      expect(breadcrumbStructuredData(a, resolveSeoContext({}, mode), delivery)).toBeNull();
    }
  });
  it("excludes CRE-012, CRE-013 and fixtures in hypothetical indexed context", () => {
    for (const a of catalog.articles.filter(a => !isPublicArticle(a))) {
      expect(articleStructuredData(a, indexed, delivery)).toBeNull();
      expect(breadcrumbStructuredData(a, indexed, delivery)).toBeNull();
    }
  });
  it("preserves public headline/description/genuine dates and omits unverified facts", () => {
    for (const a of catalog.articles.filter(isPublicArticle)) {
      const data = articleStructuredData(a, indexed, delivery)!;
      expect(data.headline).toBe(a.title); expect(data.description).toBe(a.description);
      expect(data.datePublished).toBe(a.publishedDate); expect(data.dateModified).toBe(a.updatedDate);
      expect(data).not.toHaveProperty("author"); expect(data).not.toHaveProperty("publisher"); expect(data).not.toHaveProperty("image");
      const trail = breadcrumbStructuredData(a, indexed, delivery)!;
      expect(trail.itemListElement.map(x => x.position)).toEqual([1, 2, 3]);
      expect(trail.itemListElement.map(x => x.name)).toEqual(["Home", "Research library", a.title]);
      expect(trail.itemListElement[2].item).toBe(data.url);
      expect(trail.itemListElement.every(x => !x.item.endsWith("/underwriting"))).toBe(true);
    }
  });
  it.each([undefined, "TEST-ONLY:invalid", "2026-02-30"])("rejects missing/simulated/impossible publication date %s", date => {
    expect(() => articleStructuredData({ ...article, publishedDate: date as typeof article.publishedDate }, indexed, delivery)).toThrow("genuine editorial date");
  });
  it("rejects unsafe delivery before creating schema", () => {
    expect(() => articleStructuredData(article, indexed, { ...delivery, accessMode: "private" })).toThrow();
    expect(() => breadcrumbStructuredData(article, indexed, { ...delivery, testOnlyDatePreviewEnabled: true })).toThrow();
  });
  it("escapes script termination and preserves parsed editorial text", () => {
    const data = articleStructuredData({ ...article, title: "</script><svg>&" + String.fromCharCode(0x2028, 0x2029) }, indexed, delivery)!;
    const serialized = serializeStructuredData(data);
    expect(serialized).not.toMatch(/[<>&]/); expect(serialized).not.toContain(String.fromCharCode(0x2028));
    expect(JSON.parse(serialized)).toEqual(data);
  });
});
