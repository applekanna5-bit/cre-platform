import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { SiteFooter } from "@/components/site-footer";
import { primaryNavigation } from "@/config/navigation";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";


vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));

describe("published underwriting availability", () => {
  it("reports actual published research and meaningful legacy destinations without inventing availability", () => {
    const html = renderToStaticMarkup(createElement(Home));
    const articles = publicArticles(catalog);
    expect(articles).toHaveLength(5);
    expect(articles.map(article => article.id).sort()).toEqual(["CRE-006", "CRE-007", "CRE-008", "CRE-011", "CRE-015"]);
    expect(new Set(articles.map(article => article.domain))).toEqual(new Set(["underwriting"]));
    expect(html).toContain("5 published articles");
    expect(html).toContain('href="/library"');
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
    for (const item of primaryNavigation.filter(item => item.id !== "library")) {
      expect(ids.filter(id => id === item.id)).toHaveLength(1);
      const section = html.match(new RegExp(`<section[^>]*aria-labelledby="${item.id}"[^>]*>[\\s\\S]*?</section>`))?.[0];
      expect(section).toBeDefined();
      expect(section).not.toMatch(/hidden|sr-only/);
      if (item.id === "underwriting") {
        expect(section).toContain("5 published articles in the research library");
        expect(section).toContain('href="#knowledge-underwriting"');
      } else if (item.id === "learn") {
        expect(section).toContain("published underwriting reading journey");
      } else if (item.id === "tools") {
        expect(section).toContain('href="#assumption-monthlyRent"');
        expect(section).toContain("Additional tools and calculators are not yet available.");
      } else {
        expect(section).toContain("Research in this area is not yet published.");
        expect(section).not.toMatch(/\d+ published articles/);
      }
    }
    const destinations = new Set(articles.map(article => article.href));
    for (const link of html.matchAll(/href="(\/content\/[^"]+)"/g)) expect(destinations.has(link[1])).toBe(true);
    expect(html).not.toContain("noi-development-fixture");
    expect(html).not.toContain("Development fixture");
    expect(html).not.toContain("Guides and tools are coming soon.");
  });

  it("describes available research in the footer and retains planned destinations", () => {
    const html = renderToStaticMarkup(createElement(SiteFooter));
    expect(html).toContain("Five underwriting articles available in the library. Explore the fictional property laboratory; additional tools and calculators are not yet available.");
    expect(html).not.toContain("Guides and tools coming soon.");
    expect(html).toContain('href="/library"');
    expect(html.match(/Coming soon/g)).toHaveLength(3);
  });
});
