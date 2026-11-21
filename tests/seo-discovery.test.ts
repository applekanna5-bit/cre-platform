import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { discoverContent } from "@/content/discovery";
import { articleRoute, isPublicArticle } from "@/content/catalog";
import { resolveSeoContext } from "@/seo/context";
import { checkBuildContext } from "@/seo/build-context";
import { assertSeoDeliveryContext, canonicalUrl, publicSeoPages, seoDelivery, seoRobots, type SeoDelivery } from "@/seo/public-pages";
const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
const origin = "https://seo-test.cre-publication.com";
const indexed = resolveSeoContext({ SITE_ENV: "production", SITE_INDEXING_ENABLED: "true", SITE_PRODUCTION_ORIGIN: origin }, mode);
const delivery: SeoDelivery = { accessMode: "public", nodeEnvironment: "production", testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false };
const { catalog } = await discoverContent(path.resolve("content"));
describe("local SEO discovery foundation (explicit nondeployable object contexts)", () => {
  it.each(["development", "staging", "preview", "production"])("keeps disabled %s URL-free, even with configured origin", environment => {
    const context = resolveSeoContext({ SITE_ENV: environment, SITE_PRODUCTION_ORIGIN: origin }, mode);
    expect(publicSeoPages(catalog, context, { ...delivery, accessMode: "private" })).toEqual([]);
    expect(seoRobots(context, delivery)).toEqual({ rules: { userAgent: "*", allow: "/" } });
    expect(canonicalUrl(context, "/library")).toBeUndefined();
  });
  it("projects exactly the eight public articles, the six public site pages", () => {
    const expected = ["/", "/library", "/about", "/editorial-standards", "/loan-lifecycle", "/specializations", ...catalog.articles.filter(isPublicArticle).map(articleRoute)].map(p => origin + p).sort();
    const pages = publicSeoPages(catalog, indexed, delivery);
    expect(pages.map(p => p.url).sort()).toEqual(expected);
    expect(pages).toHaveLength(14);
    expect(pages.every(p => Object.keys(p).join() === "url")).toBe(true);
    expect(new Set(pages.map(p => p.url)).size).toBe(pages.length);
    for (const a of catalog.articles.filter(a => !isPublicArticle(a))) expect(pages.map(p => p.url)).not.toContain(origin + articleRoute(a));
    expect(pages.some(p => p.url.includes("/search") || p.url.includes("design-preview"))).toBe(false);
    expect(seoRobots(indexed, delivery)).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: origin + "/sitemap.xml" });
  });
  it.each([
    { accessMode: "private" }, { accessMode: undefined }, { nodeEnvironment: "development" },
    { nodeEnvironment: undefined }, { testOnlyDatePreviewEnabled: true }, { testOnlyPublicationDatePresent: true },
  ])("rejects unsafe indexed delivery %j before discovery", override => {
    const unsafe = { ...delivery, ...override };
    expect(() => assertSeoDeliveryContext(indexed, unsafe)).toThrow("clean public production");
    expect(() => publicSeoPages(catalog, indexed, unsafe)).toThrow();
    expect(() => seoRobots(indexed, unsafe)).toThrow();
  });
  it.each(["/library?tracking=1", "/library#fragment", "//other.invalid/library", "/a/../library", "/library/", "/%6cibrary", "/space here", "https://other.invalid/"])("rejects noncanonical path %s", p => {
    expect(() => canonicalUrl(indexed, p)).toThrow("canonical path");
  });
  it("picks no secrets or date value into delivery context", () => {
    const selected = seoDelivery({ PREVIEW_ACCESS_MODE: "private", NODE_ENV: "production", PREVIEW_AUTH_PASSWORD: "SECRET-MARKER", CRE_TEST_ONLY_PUBLICATION_DATE: "TEST-ONLY:invalid" }, false);
    expect(selected.testOnlyPublicationDatePresent).toBe(true);
    expect(JSON.stringify(selected)).not.toMatch(/SECRET-MARKER|TEST-ONLY:invalid|PASSWORD/);
    expect(Object.isFrozen(selected)).toBe(true);
  });
  it("includes nonsecret access/test context in immutable build/start snapshots", () => {
    const root = mkdtempSync(path.join(tmpdir(), "cre-seo-delivery-"));
    try {
      const context = resolveSeoContext({}, mode);
      checkBuildContext(root, "build", context, delivery);
      expect(() => checkBuildContext(root, "start", context, delivery)).not.toThrow();
      for (const change of [{ accessMode: "private" }, { testOnlyDatePreviewEnabled: true }, { testOnlyPublicationDatePresent: true }, { nodeEnvironment: "development" }]) {
        expect(() => checkBuildContext(root, "start", context, { ...delivery, ...change })).toThrow("rebuild");
      }
      expect(JSON.parse(readFileSync(path.join(root, ".next/cache/cre-seo-context.json"), "utf8")).delivery).toEqual(delivery);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
