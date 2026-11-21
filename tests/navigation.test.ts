import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { footerNavigation, primaryNavigation } from "@/config/navigation";
import { lifecycle, specializations } from "@/config/learning";
import RootLayout from "@/app/layout";
import Home from "@/app/page";

// Next compiles localFont during builds; component tests only need its CSS variable class.
vi.mock("next/font/local", () => ({ default: () => ({ variable: "local-font-test" }) }));


vi.mock("@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp", () => ({ default: {
  src: "/_next/static/media/living-ledger-multifamily.webp", width: 1536, height: 1024,
  blurDataURL: "data:image/webp;base64,UklGRg==",
} }));

const markup = renderToStaticMarkup(RootLayout({ children: createElement(Home), params: Promise.resolve({}) }));

describe("M3.35 navigation contract", () => {
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

  it("exposes the six approved primary categories in order", () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Loan Lifecycle", "Underwriting", "Property Types", "Financing & Markets", "Servicing", "Library",
    ]);
    expect(new Set(primaryNavigation.map((item) => item.id)).size).toBe(primaryNavigation.length);
  });

  it("uses real homepage targets for every rendered link, including skip and footer links", () => {
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    const links = [...markup.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((match) => match[1]);
    const imagePreloads = [...markup.matchAll(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*href="([^"]+)"/g)].map((match) => match[1]);
    expect(imagePreloads).toContain("/_next/static/media/living-ledger-multifamily.webp");
    expect(links.length).toBeGreaterThan(primaryNavigation.length);
    for (const href of links) {
      const [route, hash] = href.split("#");
      if (!hash) continue;
      if (!route) expect(ids).toContain(hash);
      else if (route === "/loan-lifecycle") expect(lifecycle.map(topic => topic.id)).toContain(hash);
      else if (route === "/specializations") expect(specializations.map(topic => topic.id)).toContain(hash);
      else throw new Error(`Unexpected anchor destination ${href}`);
    }
  });

  it("shares the same primary links in desktop and mobile menus and links feedback from the footer", () => {
    const header = markup.match(/<header\b[^>]*>[\s\S]*?<\/header>/)?.[0] ?? "";
    for (const item of primaryNavigation) expect(header.split(`href="${item.href}"`)).toHaveLength(3);
    expect(footerNavigation.flatMap(group => group.items.map(item => item.href))).toContain("/feedback");
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
