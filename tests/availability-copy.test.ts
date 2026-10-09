import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { SiteFooter } from "@/components/site-footer";
import { primaryNavigation } from "@/config/navigation";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";

describe("published underwriting availability", () => {
  it("describes the five published articles and provides a homepage library link", () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(publicArticles(catalog)).toHaveLength(5);
    expect(html).toContain("Five underwriting articles are available in the library. Tools and calculators are coming soon.");
    expect(html).toMatch(/href="\/library"[^>]*>Explore the library/);
    expect(html).not.toContain("Guides and tools are coming soon.");
    for (const item of primaryNavigation.filter(item => item.id !== "library")) {
      const section = html.match(new RegExp(`<section[^>]*aria-labelledby="${item.id}"[^>]*>[\\s\\S]*?</section>`))?.[0];
      expect(section).toBeDefined();
      expect(section).toContain(item.id === "underwriting" ? "Available in library" : "Coming soon");
      if (item.id === "underwriting") expect(section).not.toContain("Coming soon");
    }
  });

  it("describes available research in the footer and retains planned destinations", () => {
    const html = renderToStaticMarkup(createElement(SiteFooter));
    expect(html).toContain("Five underwriting articles available in the library. Tools and calculators coming soon.");
    expect(html).not.toContain("Guides and tools coming soon.");
    expect(html).toContain('href="/library"');
    expect(html.match(/Coming soon/g)).toHaveLength(3);
  });
});
