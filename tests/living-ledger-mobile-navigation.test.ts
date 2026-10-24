import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { catalog } from "@/content/.generated";
import { primaryNavigation } from "@/config/navigation";
import { MobileLearningNavigation } from "@/components/design-preview/living-ledger-cinematic/mobile-learning-navigation";
import { PreviewMobileNavigation } from "@/components/navigation/preview-mobile-navigation";
import { SiteHeader } from "@/components/site-header";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }));
beforeEach(() => vi.mocked(usePathname).mockReturnValue("/"));
afterEach(() => vi.unstubAllEnvs());

describe("4D.1 cinematic mobile research navigation", () => {
  it("prioritizes published research and preserves all eight original destinations exactly once", () => {
    const html = renderToStaticMarkup(createElement(MobileLearningNavigation, { catalog }));
    expect(html).toContain('aria-label="Available research destinations"');
    expect(html).toContain("5 published articles");
    expect(html).toContain('href="/#knowledge-underwriting"');
    expect(html.indexOf('href="/library"')).toBeLessThan(html.indexOf('href="/#knowledge-underwriting"'));
    expect(html.indexOf('href="/#knowledge-underwriting"')).toBeLessThan(html.indexOf("Explore more CRE areas"));
    expect(html).toContain("6 category overviews");
    for (const item of primaryNavigation) expect(html.split(`href="${item.href}"`)).toHaveLength(2);
    expect(html).not.toContain("Coming soon");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("noi-development-fixture");
    expect(html).toMatch(/<details\b[^>]*><summary>/);
    expect(html).not.toMatch(/<details[^>]*\sopen(?:=|\s|>)/);
    expect(html).not.toMatch(/href="\/(?:financing|learn|property-types|modeling)"/);
  });

  it("does not claim underwriting is available when the public catalog has no such material", () => {
    const hidden = catalog.articles.map(article => ({ ...article, status: "draft" as const, publishedDate: undefined }));
    const html = renderToStaticMarkup(createElement(MobileLearningNavigation, { catalog: { articles: hidden } }));
    expect(html).not.toContain("published articles");
    expect(html).not.toContain('href="/#knowledge-underwriting"');
    expect(html).toContain("7 category overviews");
    for (const item of primaryNavigation) expect(html).toContain(`href="${item.href}"`);
  });

  it.each(["/design-preview/living-ledger"])("keeps the standard 4B menu at %s", path => {
    vi.mocked(usePathname).mockReturnValue(path);
    const html = renderToStaticMarkup(createElement(PreviewMobileNavigation, { standard: "STANDARD_MENU", cinematic: "CINEMATIC_MENU", publicNavigation: "PUBLIC_MENU" }));
    expect(html).toContain("STANDARD_MENU");
    expect(html).not.toContain("CINEMATIC_MENU");
  });

  it("renders just one mobile navigation with the cinematic content at the exact preview pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/design-preview/living-ledger-cinematic");
    const html = renderToStaticMarkup(createElement(PreviewMobileNavigation, { standard: "STANDARD_MENU", cinematic: createElement(MobileLearningNavigation, { catalog, preview: true }), publicNavigation: "PUBLIC_MENU" }));
    expect(html).not.toContain("STANDARD_MENU");
    expect(html.match(/<nav\b/g)).toHaveLength(1);
    expect(html.match(/<form\b/g)).toBeNull();
    expect(html).toContain('aria-controls="mobile-primary-navigation"');
    expect(html).toContain('id="mobile-primary-navigation"');
    expect(html).not.toMatch(/role="(?:menu|menuitem|dialog)"/);
  });

  it.each(["test", "production"])("serves public curated navigation without preview-only destinations in %s", mode => {
    vi.stubEnv("NODE_ENV", mode);
    vi.mocked(usePathname).mockReturnValue("/design-preview/living-ledger-cinematic");
    const html = renderToStaticMarkup(createElement(SiteHeader));
    expect(html).toContain("Available research destinations");
    expect(html).toContain('href="/#knowledge-underwriting"');
    expect(html).not.toContain('href="#knowledge-underwriting"');
    expect(html).not.toContain('href="/design-preview/');
    expect(html).toContain("Explore more CRE areas");
    expect(html.match(/<form\b/g)).toHaveLength(1);
  });

  it.each(["/", "/library", "/search", "/content/underwriting/rent-roll-analysis"])("uses the public homepage anchors from %s in development", path => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(usePathname).mockReturnValue(path);
    const html = renderToStaticMarkup(createElement(SiteHeader));
    expect(html).toContain('href="/#knowledge-underwriting"');
    expect(html).not.toContain('href="#knowledge-underwriting"');
    expect(html.match(/id="mobile-primary-navigation"/g)).toHaveLength(1);
    expect(html.match(/<form\b/g)).toHaveLength(1);
    for (const item of primaryNavigation) expect(html).toContain(`href="${item.href}"`);
  });

  it("keeps one existing search form in the cinematic development header", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(usePathname).mockReturnValue("/design-preview/living-ledger-cinematic");
    const html = renderToStaticMarkup(createElement(SiteHeader));
    expect(html).toContain("Available research destinations");
    expect(html.match(/<form\b/g)).toHaveLength(1);
    expect(html).toContain('action="/search" method="get"');
  });
});
