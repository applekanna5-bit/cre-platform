import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";

describe("WP02 homepage", () => {
  const html = renderToStaticMarkup(createElement(Home));

  it("renders the approved sections in order", () => {
    const titles = [
      "Commercial Real Estate, Explained from Origination to Resolution.",
      "Start Here", "CRE Loan Lifecycle", "Professional Specializations", "Multifamily Underwriting Preview",
      "Featured Reading", "Complete Multifamily Underwriting Model",
    ];
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Learn how to read a property’s financials");
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
    expect(html).toContain('href="#start-reading"');
    expect(html).toContain('href="/content/underwriting/gross-potential-income-effective-gross-income"');
    expect(html).toContain('href="#property-lab"');
  });
});
