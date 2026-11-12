import { createElement, Fragment, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { articleComponents } from "@/components/content/mdx-components";
import { SourceNote, Sources } from "@/components/content/primitives";
const { catalog } = await discoverContent(path.resolve("content"));
const draft = catalog.articles.find(a => a.id === "CRE-015")!;
const source = draft.sources[0];
const Binding = articleComponents(draft, catalog).SourceNote as ComponentType<{ sourceId: string; children?: ReactNode }>;
const paragraph = (text: string) => createElement("p", null, text);
const render = (children?: ReactNode) => renderToStaticMarkup(createElement(Binding, { sourceId: source.id }, children));
const legacy = '<p class="my-4 text-sm text-muted">Source note: <a class="inline-block min-h-11 py-2 font-medium text-accent underline underline-offset-4 hover:text-steel" href="#source-occ-cre-lending-2022">Commercial Real Estate Lending, Comptroller&#x27;s Handbook, Version 2.0</a></p>';
describe("SourceNote optional explanation rendering", () => {
  it("forwards explanatory children through the real adapter", () => {
    const html = render(paragraph("The convention needs an explanation."));
    expect(html).toContain("<p>The convention needs an explanation.</p>");
    expect(html).toContain('href="#source-occ-cre-lending-2022"');
    expect(html).not.toContain("hidden");
  });
  it("uses block-compatible markup for paragraphs, emphasis, lists and links", () => {
    const children = createElement(Fragment, null, paragraph("First paragraph."), createElement("p", null, createElement("em", null, "Important distinction")), createElement("ul", null, createElement("li", null, "One limitation")), createElement("a", { href: "https://www.occ.treas.gov/" }, "Official source"));
    const html = renderToStaticMarkup(createElement(SourceNote, { source }, children));
    expect(html).toContain("<p>First paragraph.</p>"); expect(html).toContain("<em>Important distinction</em>");
    expect(html).toContain("<ul><li>One limitation</li></ul>"); expect(html).toContain('href="https://www.occ.treas.gov/"');
    expect(html).not.toMatch(/<p[^>]*>\s*<(?:p|div|ul)\b/);
  });
  it("keeps the exact legacy self-closing citation markup", () => { expect(render()).toBe(legacy); });
  it.each([undefined, null])("keeps missing/null children reference-only: %s", children => {
    expect(renderToStaticMarkup(createElement(SourceNote, { source }, children))).toBe(legacy);
  });
  it("keeps multiple explanations and source identities independent", () => {
    const article = catalog.articles.find(a => a.id === "CRE-015")!;
    const Bound = articleComponents(article, catalog).SourceNote as ComponentType<{ sourceId: string; children?: ReactNode }>;
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(Bound, { sourceId: "occ-cre-lending-2022" }, paragraph("First source explanation.")), createElement(Bound, { sourceId: "fannie-income-analysis-203" }, paragraph("Second source explanation."))));
    expect(html).toContain("First source explanation."); expect(html).toContain("Second source explanation.");
    expect(html.match(/href="#source-occ-cre-lending-2022"/g)).toHaveLength(1);
    expect(html.match(/href="#source-fannie-income-analysis-203"/g)).toHaveLength(1);
  });
  it("preserves a single provenance target for repeated source references", () => {
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(Binding, { sourceId: source.id }, paragraph("First.")), createElement(Binding, { sourceId: source.id }, paragraph("Second.")), createElement(Sources, { sources: draft.sources })));
    expect(html.match(/id="source-occ-cre-lending-2022"/g)).toHaveLength(1);
    expect(html.match(/href="#source-occ-cre-lending-2022"/g)).toHaveLength(2);
    expect(html).toContain(source.publisher);
  });
  it("still rejects an undeclared source at the rendering boundary", () => {
    expect(() => renderToStaticMarkup(createElement(Binding, { sourceId: "undeclared-source" }, paragraph("Not accepted.")))).toThrow(/undeclared source/);
  });
  it("retains the synthetic marker for fixture-only primitive rendering", () => {
    const fixtureSource = { ...source, id: "unit-source", synthetic: true };
    const html = renderToStaticMarkup(createElement(SourceNote, { source: fixtureSource }));
    expect(html).toContain(" (synthetic)"); expect(html).toContain('href="#source-unit-source"');
  });
  it.each([
    '<SourceNote sourceId="missing">Text.</SourceNote>',
    '<SourceNote sourceId="occ-cre-lending-2022">\n\n{process.env.SECRET}\n\n</SourceNote>',
    '<SourceNote sourceId="occ-cre-lending-2022">\n\n<Unknown />\n\n</SourceNote>',
    '<SourceNote sourceId="occ-cre-lending-2022" extra="x">Text.</SourceNote>',
    '<SourceNote sourceId="occ-cre-lending-2022" children="bypass" />',
    '<SourceNote sourceId="occ-cre-lending-2022">\n\n[unsafe](javascript:alert)\n\n</SourceNote>',
    '<SourceNote sourceId="occ-cre-lending-2022">\n\n[relative](/library)\n\n</SourceNote>',
    'import Bad from "remote"\n\n<SourceNote sourceId="occ-cre-lending-2022" />',
  ])("rejects unsafe or unsupported authoring: %s", async text => {
    await expect(compileArticle("## Note\n\n" + text, draft, catalog)).rejects.toThrow();
  });
  it("keeps explanatory note text excluded from site-search extraction", async () => {
    const compiled = await compileArticle('## Notes\n\nOutside text.\n\n<SourceNote sourceId="occ-cre-lending-2022">\n\nOnly-inside-note-token.\n\n</SourceNote>', draft, catalog);
    expect(compiled.code).toContain("Only-inside-note-token.");
    expect(compiled.searchText.body).toContain("Outside text.");
    expect(compiled.searchText.body).not.toContain("Only-inside-note-token.");
  });
});
