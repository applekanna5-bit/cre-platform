import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { UnderwritingSnapshot } from "@/components/home/underwriting-snapshot";
import { primaryNavigation } from "@/config/navigation";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";


vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));

describe("cinematic public homepage", () => {
  const html = renderToStaticMarkup(createElement(Home));
  it("reuses the cinematic hero and one complete laboratory without development labels", () => {
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Understand Property Financials.");
    expect(html).toContain("Analyze Income and Value.");
    expect(html).toContain("CRE Financial Analysis, Explained");
    expect(html).toContain("Explore the Underwriting Model");
    expect(html).toContain("interactive property income model");
    expect(html).toContain("01 / Illustrative Underwriting Model");
    expect(html).toContain("Rent Determines Gross Potential Rental Income.");
    expect(html).toContain("How Assumptions Affect Illustrative Value");
    expect(html).toContain("Build Your CRE Underwriting Knowledge");
    expect(html).toContain("Continue Your CRE Research");
    expect(html).not.toMatch(/Local design study|4C ?|Platform preview/);
    expect(html).toContain('sizes="100vw"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain("Representative AI-generated architecture");
    expect(html).toContain("Not the fictional 100-unit example");
    expect(html.match(/type="range"/g)).toHaveLength(4);
    expect(html.match(/type="number"/g)).toHaveLength(4);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toContain("Reset to baseline");
    expect(html).toContain("$18,654,545");
    expect(html).toContain("It is not Fannie Mae, Freddie Mac, or lender underwriting");
    expect(html).not.toContain('<form');
  });
  it("keeps every legacy area visible and provides real research and laboratory destinations", () => {
    for (const item of primaryNavigation.filter(item => item.id !== "library")) {
      expect(html).toContain(`id="${item.id}" tabindex="-1"`);
      expect(html).toContain(`aria-labelledby="${item.id}"`);
    }
    expect(html).toContain('href="/library"');
    expect(html).toContain('href="/search?q=NOI"');
    for (const target of ["property-lab", "assumption-monthlyRent", "knowledge-underwriting", "learning-progression-title"]) expect(html).toContain(`id="${target}"`);
  });
  it("links the actual published catalog and excludes unpublished research", () => {
    for (const article of publicArticles(catalog)) {
      expect(html).toContain(`href="${article.href}"`);
      expect(html).toContain(article.title.replaceAll("&", "&amp;"));
    }
    const allowed = new Set(publicArticles(catalog).map(article => article.href));
    for (const match of html.matchAll(/href="(\/content\/[^"]+)"/g)) expect(allowed.has(match[1])).toBe(true);
    expect(html).not.toContain("noi-development-fixture");
    expect(html).not.toContain("Development fixture");
    expect(html).toContain("Discover. Understand. Apply.");
  });
  it("labels the fictional demonstration and provides semantic metric relationships", () => {
    const snapshot = renderToStaticMarkup(createElement(UnderwritingSnapshot));
    expect(snapshot).toContain("Harbor View Apartments");
    expect(snapshot).toContain("180 units");
    expect(snapshot).toMatch(/<caption[^>]*>Illustrative underwriting snapshot<\/caption>/);
    for (const [metric, value] of [["Underwritten NOI", "$2.14M"], ["Indicated Value", "$32.9M"], ["LTV", "64.8%"], ["DSCR", "1.43×"], ["Debt Yield", "10.1%"]]) {
      expect(snapshot).toContain(`>${metric}</th>`);
      expect(snapshot).toContain(`>${value}</td>`);
    }
    expect(snapshot.match(/scope="row"/g)).toHaveLength(5);
    expect(snapshot).toContain("Fictional property and figures");
    expect(snapshot).toContain("Not an actual transaction or investment recommendation.");
    expect(snapshot).not.toMatch(/<(input|button|form)\b/);
  });
});
