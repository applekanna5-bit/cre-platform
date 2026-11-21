import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";

vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));

describe("M3.35 homepage", () => {
  const html = renderToStaticMarkup(createElement(Home));

  it("renders the approved sections in order", () => {
    const titles = [
      "Commercial Real Estate, Explained from Origination to Resolution.",
      "Multifamily Underwriting Preview", "CRE Loan Lifecycle", "Professional Specializations",
      "Featured Articles and Practical Examples", "Complete Multifamily Underwriting Model", "Professional Feedback",
    ];
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Practical CRE knowledge, underwriting insights, and property financial analysis.");
    const positions = titles.map(title => html.indexOf(`>${title}</`));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toMatch(/laboratory|Local design study|Platform preview/i);
  });

  it("renders the same verified baseline in both views and preserves the full controls", () => {
    expect(html).toMatch(/id="preview-value"[^>]*>\$18,654,545/);
    expect(html).toMatch(/id="illustrative-value"[^>]*><span[^>]*><span[^>]*>\$18,654,545/);
    expect(html.match(/type="range"/g)).toHaveLength(4);
    expect(html.match(/type="number"/g)).toHaveLength(5);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html.match(/Reset to baseline/g)).toHaveLength(2);
    expect(html).not.toContain("64.8%");
    expect(html).not.toContain("1.43×");
  });

  it("links featured articles only through their published canonical paths", () => {
    const allowed = new Set(publicArticles(catalog).map(article => article.href));
    const links = [...html.matchAll(/href="(\/content\/[^"]+)"/g)].map(match => match[1]);
    expect(links).toHaveLength(4);
    expect(links.every(link => allowed.has(link))).toBe(true);
    expect(html).toContain('href="/library"');
    expect(html).toContain('href="/feedback"');
  });
});
