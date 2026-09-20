import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { UnderwritingSnapshot } from "@/components/home/underwriting-snapshot";
import { primaryNavigation } from "@/config/navigation";

describe("M2.1 homepage preview", () => {
  const html = renderToStaticMarkup(createElement(Home));

  it("positions the platform and sends both hero actions to existing overviews", () => {
    expect(html).toContain("Commercial Real Estate,");
    expect(html).toContain("Underwritten.");
    for (const [id, label] of [["learn", "Start Learning"], ["underwriting", "Explore Underwriting"]]) {
      const destination = primaryNavigation.find((item) => item.id === id)!;
      expect(html).toMatch(new RegExp(`<a[^>]* href="${destination.href}"[^>]*>${label}`));
    }
    expect(html).not.toMatch(/Platform preview|planned section overviews/i);
    expect(html).toContain("Coming soon");
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

  it("keeps the learning progression ordered without depending on visual arrows", () => {
    const flow = html.match(/<ol aria-label="Learning progression"[^>]*>(.*?)<\/ol>/)![1];
    const steps = [...flow.matchAll(/<p[^>]*>(.*?)<\/p>/g)].map((match) => match[1]);
    expect(steps).toEqual(["Rent Roll / T-12", "Revenue &amp; Expenses", "NOI", "Property Value", "LTV / DSCR / Debt Yield", "Loan Sizing", "Credit Decision"]);
    expect(html.match(/<dt\b/g)).toHaveLength(5);
    expect(html.match(/<dd\b/g)).toHaveLength(5);
  });
});
