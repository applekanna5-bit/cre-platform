import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import LivingLedgerPage, { metadata } from "@/app/design-preview/living-ledger/page";
import { UnderwritingLab } from "@/components/design-preview/living-ledger/underwriting-lab";
import { PropertyVisual } from "@/components/design-preview/living-ledger/property-visual";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("PROTOTYPE_NOT_FOUND"); } }));
// Mirror Next's static image metadata; Vite otherwise imports images as URL strings.
vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));
afterEach(() => vi.unstubAllEnvs());

describe("local-only Living Ledger route", () => {
  it.each(["production", "test", "", undefined])("denies every non-development mode %#", async value => {
    vi.stubEnv("NODE_ENV", value);
    await expect(LivingLedgerPage()).rejects.toThrow("PROTOTYPE_NOT_FOUND");
  });
  it("remains noindex/nofollow independently of the inherited policy", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false, googleBot: { index: false, follow: false } });
  });
  it("renders published pathway links and search access without duplicating the masthead form", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const html = renderToStaticMarkup(await LivingLedgerPage());
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('href="/search?q=NOI"');
    expect(html).not.toContain('<form');
    expect(html).toContain('See the property.');
    expect(html).not.toContain("Adjust assumptions");
    expect(html).not.toContain("CRE knowledge explorer");
    expect(html).not.toContain('href="#pathway-title"');
    expect(html).toContain('Understand the value.');
    expect(html).toContain('href="/library"');
    for (const slug of ["rent-roll-analysis", "t12-operating-statement", "net-operating-income-underwritten-noi"]) expect(html).toContain(`href="/content/underwriting/${slug}"`);
    expect(html.match(/Planned lesson/g)).toHaveLength(3);
    expect(html).not.toContain("noi-development-fixture");
    expect(html).not.toMatch(/href="[^\"]*(?:loan-sizing|investment-decision|valuation)[^\"]*"/);
  });
  it("provides labelled controls, a chart text equivalent, formulas, and the fictional-model disclaimer", () => {
    const html = renderToStaticMarkup(createElement(UnderwritingLab));
    expect(html.match(/type="range"/g)).toHaveLength(4);
    expect(html.match(/type="number"/g)).toHaveLength(4);
    for (const key of ["monthlyRent", "vacancyPercent", "expensePercent", "capRatePercent"]) {
      expect(html).toContain(`for="assumption-${key}"`);
      expect(html).toContain(`id="help-${key}"`);
      expect(html).toContain(`for="slider-${key}"`);
    }
    expect(html).toContain('aria-labelledby="income-chart-title income-chart-description"');
    expect(html).toContain("Annual rent allocation");
    expect(html).toContain("$18,654,545");
    expect(html).toContain('id="value-change">$0 (0%)');
    expect(html).toContain("Baseline value");
    expect(html).toContain("Reset to baseline");
    expect(html).toContain("$1.8M");
    expect(html).toContain("USD / YEAR");
    expect(html).not.toContain('>UNITS</text>');
    expect(html).toContain("do not add these dollar changes together");
    expect(html.match(/Unchanged from baseline\./g)).toHaveLength(4);
    expect(html).toContain("Units × monthly rent × 12");
    expect(html).toContain("It is not Fannie Mae, Freddie Mac, or lender underwriting");
    expect(html).toContain("Fictional / Educational only");
  });
  it("renders approved representative architecture with responsive sizing and explicit provenance", () => {
    const html = renderToStaticMarkup(createElement(PropertyVisual));
    expect(html).toContain("<figure");
    expect(html).toContain("<figcaption");
    expect(html).toContain("Not the fictional 100-unit example");
    expect(html).toContain("Representative AI-generated architecture");
    expect(html).toContain("<img");
    expect(html).toContain("glass balconies");
    expect(html).toContain('sizes="');
    expect(html).toContain('width="1536"');
    expect(html).toContain('height="1024"');
    expect(html).toContain('loading="eager"');
    const supplied = renderToStaticMarkup(createElement(PropertyVisual, { image: createElement("span", { role: "img", "aria-label": "Approved commercial architecture study" }) }));
    expect(supplied).toContain('aria-label="Approved commercial architecture study"');
  });
});
