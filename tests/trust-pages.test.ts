import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";
import EditorialStandardsPage from "@/app/editorial-standards/page";
import { SiteFooter } from "@/components/site-footer";
import { pageMetadata } from "@/seo/metadata";
import { resolveSeoContext } from "@/seo/context";

const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
const origin = "https://thecreledger.com";

describe("editorial trust pages", () => {
  it.each([
    [AboutPage, "About The CRE Ledger", 4, "/editorial-standards"],
    [EditorialStandardsPage, "Editorial Standards", 9, "/about"],
  ] as const)("renders semantic sections and contextual navigation for %s", (Page, title, sectionCount, link) => {
    const html = renderToStaticMarkup(Page());
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain(`>${title}</h1>`);
    expect(html.match(/<h2\b/g)).toHaveLength(sectionCount);
    expect(html).not.toMatch(/<main\b|<h[3-6]\b|mailto:|href="\/contact|<form\b|<img\b/);
    expect(html).toContain(`href="${link}"`);
    for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) expect(html).toContain(`id="${match[1]}"`);
    expect(html).not.toMatch(/Lanka Sudhakar|Sudhakar Lanka|years of experience|certified analyst/i);
  });

  it("states owner responsibility and commitments without inventing completed independent reviews or a contact channel", () => {
    const html = renderToStaticMarkup(EditorialStandardsPage());
    expect(html).toContain("The website owner oversees editorial review, technical verification and corrections.");
    expect(html).toContain("AI-generated analysis is not automatically verified or publication-ready.");
    expect(html).toContain("not a certification that every proposed verification procedure has already been implemented");
    expect(html).toContain("do not promise a fixed review schedule");
    expect(html).toContain("Actual lending decisions require current applicable guidance");
    expect(html).not.toMatch(/contact us|submit a correction|independently verified|reviewed quarterly/i);
  });

  it("renders only the approved new footer destinations and preserves Coming soon items", () => {
    const html = renderToStaticMarkup(SiteFooter());
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/editorial-standards"');
    expect(html).not.toMatch(/About &amp; editorial|href="\/contact|mailto:/);
    expect(html.match(/Coming soon/g)).toHaveLength(2);
  });

  it.each(["about", "editorial-standards"] as const)("uses approved production canonical and preserves disabled safeguards for %s", page => {
    const context = resolveSeoContext({ SITE_ENV: "production", SITE_PRODUCTION_ORIGIN: origin, SITE_INDEXING_ENABLED: "true" }, mode);
    const metadata = pageMetadata(page, context);
    expect(metadata.alternates).toEqual({ canonical: `${origin}/${page}` });
    expect(metadata.openGraph).toHaveProperty("url", `${origin}/${page}`);
    expect(metadata.robots).toEqual({ index: true, follow: true, googleBot: { index: true, follow: true } });
    for (const environment of ["preview", "development", "staging", "production"]) {
      const disabled = pageMetadata(page, resolveSeoContext({ SITE_ENV: environment, SITE_PRODUCTION_ORIGIN: origin, SITE_INDEXING_ENABLED: "false" }, mode));
      expect(disabled.robots).toEqual({ index: false, follow: false, googleBot: { index: false, follow: false } });
      expect(disabled.alternates).toBeUndefined();
      expect(disabled.openGraph).not.toHaveProperty("url");
    }
  });
});
