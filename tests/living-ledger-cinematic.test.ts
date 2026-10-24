import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import CinematicLedgerPage, { metadata } from "@/app/design-preview/living-ledger-cinematic/page";
import { createElement } from "react";
import { CurrencyText } from "@/components/design-preview/living-ledger/underwriting-lab";
import { BuildingDiagram } from "@/components/design-preview/living-ledger/building-diagram";
import { calculateIllustration, INITIAL_ASSUMPTIONS } from "@/components/design-preview/living-ledger/model";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("PROTOTYPE_NOT_FOUND"); } }));
vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));
afterEach(() => vi.unstubAllEnvs());

describe("enlarged financial-value presentation", () => {
  it("reuses currency presentation without changing diagram data or its default rendering", () => {
    const props = { assumptions: INITIAL_ASSUMPTIONS, result: calculateIllustration(INITIAL_ASSUMPTIONS) };
    const plain = renderToStaticMarkup(createElement(BuildingDiagram, props));
    const grouped = renderToStaticMarkup(createElement(BuildingDiagram, { ...props, renderCurrency: formatted => createElement(CurrencyText, { formatted }) }));
    expect(plain).toContain("<strong>$1,800,000</strong>");
    const outcome = grouped.match(/data-building-outcome="true">([\s\S]*?)<\/p>/)?.[1];
    expect(outcome).toContain("$1,800,000");
    expect(outcome).toContain('aria-hidden="true"');
    expect(outcome!.match(/<wbr\/?\s*>/g)).toHaveLength(2);
    for (const html of [plain, grouped]) {
      expect(html.match(/width="13" height="18"/g)).toHaveLength(100);
      expect(html.match(/type="radio"/g)).toHaveLength(3);
      expect(html).toContain('aria-live="polite" aria-atomic="true"');
      expect(html).toContain("$1,800,000 annual gross potential rent.");
    }
  });
  it.each(["$18,654,545", "$1,200,000,000", "+$1,243,636", "-$981,818", "$0", "—"])("preserves the original accessible value and atomic visual groups: %s", formatted => {
    const html = renderToStaticMarkup(createElement(CurrencyText, { formatted }));
    if (!formatted.includes(",")) {
      expect(html).toBe(formatted);
      return;
    }
    const accessible = html.match(/^<span[^>]*><span[^>]*>([^<]*)<\/span>/)?.[1];
    expect(accessible).toBe(formatted);
    const visual = html.match(/<span aria-hidden="true">([\s\S]*)<\/span><\/span>$/)?.[1];
    expect(visual).toBeDefined();
    const groups = [...visual!.matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map(match => match[1]);
    expect(groups.join("")).toBe(formatted);
    expect(groups).toEqual(formatted.match(/[^,]+,?/g));
    expect(visual!.match(/<wbr\/?\s*>/g) ?? []).toHaveLength(groups.length - 1);
    expect(html).not.toMatch(/tabindex|role=|aria-live=/);
  });
});

describe("cinematic local preview", () => {
  it.each(["production", "test", "", undefined])("denies non-development access %#", async mode => {
    vi.stubEnv("NODE_ENV", mode);
    await expect(CinematicLedgerPage()).rejects.toThrow("PROTOTYPE_NOT_FOUND");
  });
  it("retains independent noindex protections", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false, googleBot: { index: false, follow: false } });
  });
  it("combines one cinematic headline with the shared accessible lab and published pathways", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const html = renderToStaticMarkup(await CinematicLedgerPage());
    expect(html).toContain("Local design study / 4C");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Understand Property Financials.");
    expect(html).toContain("Analyze Income and Value.");
    expect(html).toContain('href="#property-lab"');
    expect(html).toContain('href="#assumption-monthlyRent"');
    expect(html).toContain('id="assumption-monthlyRent"');
    expect(html.indexOf('href="#assumption-monthlyRent"')).toBeLessThan(html.indexOf('id="assumption-monthlyRent"'));
    expect(html).toContain("Adjust assumptions");
    expect(html).toContain('href="#pathway-title"');
    expect(html).toContain('id="pathway-title"');
    expect(html).toContain("Continue with published research");
    expect(html).toContain("CRE knowledge explorer");
    expect(html.indexOf('aria-label="Model limitations"')).toBeLessThan(html.indexOf('id="pathway-title"'));
    expect(html).not.toContain("Planned lesson");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('href="/library"');
    expect(html).toContain('sizes="100vw"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain("Representative AI-generated architecture");
    expect(html).toContain("Not the fictional 100-unit example");
    expect(html).toContain("glass balconies");
    expect(html.match(/type="range"/g)).toHaveLength(4);
    expect(html.match(/type="number"/g)).toHaveLength(4);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toContain("Reset to baseline");
    expect(html).toContain("$18,654,545");
    expect(html).toContain("Annual NOI");
    expect(html).toContain("Baseline value");
    expect(html).toContain("Current vs. baseline");
    expect(html).toContain("100 fictional units");
    expect(html).toContain('role="status"');
    for (const slug of ["rent-roll-analysis", "t12-operating-statement", "net-operating-income-underwritten-noi"]) {
      expect(html).toContain(`href="/content/underwriting/${slug}"`);
    }
    expect(html).not.toContain("noi-development-fixture");
    expect(html).toContain('href="/search?q=NOI"');
    expect(html).toContain("It is not Fannie Mae, Freddie Mac, or lender underwriting");
  });
});
