import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { footerNavigation, homepagePaths, primaryNavigation, type NavigationItem } from "@/config/navigation";
import { NavigationList } from "@/components/navigation/navigation-list";
import RootLayout from "@/app/layout";
import Home from "@/app/page";

// Next compiles localFont during builds; component tests only need its CSS variable class.
vi.mock("next/font/local", () => ({ default: () => ({ variable: "local-font-test" }) }));


vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));

const markup = renderToStaticMarkup(RootLayout({ children: createElement(Home), params: Promise.resolve({}) }));

describe("M2 navigation contract", () => {
  it("uses the approved shared brand with an accessible home link", () => {
    const homeLink = markup.match(/<a\b[^>]*id="site-brand"[^>]*>/)?.[0];
    expect(homeLink).toContain('href="/"');
    expect(homeLink).toContain('aria-label="The CRE Ledger home"');
    for (const element of ["header", "footer"]) {
      const shell = markup.match(new RegExp(`<${element}\\b[^>]*>[\\s\\S]*?</${element}>`))?.[0];
      expect(shell).toContain("The CRE Ledger");
      expect(shell).not.toContain("Knowledge Platform");
    }
  });

  it("exposes the library followed by the seven primary areas in order", () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Library", "Learn", "Underwriting", "Property Types", "Financing", "Modeling", "Tools", "Resources",
    ]);
    expect(new Set(primaryNavigation.map((item) => item.id)).size).toBe(primaryNavigation.length);
  });

  it("uses real homepage targets for every rendered link, including skip and footer links", () => {
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    const links = [...markup.matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
    expect(links.length).toBeGreaterThan(primaryNavigation.length);
    for (const href of links) {
      expect(href === "/" || href === "/library" || href.startsWith("/search?") || href.startsWith("/content/") || href.startsWith("/#") || href.startsWith("#")).toBe(true);
      if (href.includes("#")) expect(ids).toContain(href.split("#")[1]);
    }
    for (const item of primaryNavigation) {
      if (item.id === "library") { expect(item.href).toBe("/library"); continue; }
      expect(item.href).toBe(`/#${item.id}`);
      expect(markup).toContain(`id="${item.id}" tabindex="-1"`);
    }
  });

  it("reuses primary destinations in the footer and resolves each homepage path", () => {
    const footerItems: readonly NavigationItem[] = footerNavigation.flatMap((group) => [...group.items]);
    expect(footerItems.filter((item) => item.kind === "link")).toEqual([...primaryNavigation]);
    for (const path of homepagePaths) {
      expect(primaryNavigation.some((item) => item.id === path.sectionId)).toBe(true);
    }
    expect(homepagePaths.map((path) => path.sectionId)).toEqual(["learn", "underwriting", "tools"]);
  });

  it("renders unavailable destinations as labeled text, never links or disabled controls", () => {
    const planned: NavigationItem[] = footerNavigation.flatMap((group) => [...group.items]).filter((item) => item.kind === "planned");
    expect(planned.map((item) => item.id)).toEqual(["glossary", "contributors", "about"]);
    const html = renderToStaticMarkup(createElement(NavigationList, { items: planned }));
    expect(html).not.toMatch(/<(a|button)\b/);
    expect(html.match(/Coming soon/g)).toHaveLength(3);
    for (const item of planned) expect(item).not.toHaveProperty("href");
  });

  it("provides one main landmark, one h1, ordered heading levels, and valid ARIA references", () => {
    expect(markup.match(/<main\b/g)).toHaveLength(1);
    expect(markup.match(/<header\b/g)).toHaveLength(1);
    expect(markup.match(/<footer\b/g)).toHaveLength(1);
    expect(markup.match(/<h1\b/g)).toHaveLength(1);
    const levels = [...markup.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
    levels.slice(1).forEach((level, index) => expect(level).toBeLessThanOrEqual(levels[index] + 1));
    for (const match of markup.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) {
      for (const id of match[1].split(" ")) expect(markup).toContain(`id="${id}"`);
    }
    expect(markup).toContain('id="main-content" tabindex="-1"');
    expect(markup).toContain("Skip to main content");
  });

  it("server-renders a closed native mobile disclosure without application menu roles", () => {
    expect(markup).toMatch(/<details\s[^>]*>/);
    const menu = markup.match(/<details\b[^>]*>(?=<summary[^>]*aria-controls="mobile-primary-navigation")/g);
    expect(menu).toHaveLength(1);
    expect(menu![0]).not.toMatch(/\sopen(?:=|\s|>)/);
    expect(markup).toContain("<summary");
    expect(markup).not.toMatch(/role="(?:menu|menuitem|dialog)"/);
    expect(markup).toContain('role="search"');
    expect(markup).toContain('action="/search" method="get"');
    expect(markup).toContain('for="header-query"');
  });
});
