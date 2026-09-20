import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseArticleMetadata, parseCases, parseSources, parseTable } from "@/content/validation";
import { articleRoute, buildCatalog, isEditoriallyProtected, isRenderable, resolveRelationships, sourceDependents } from "@/content/catalog";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { articleHeadings, catalog, embeddedCases, loaders } from "@/content/.generated";
import { ArticleTemplate } from "@/components/content/article-template";
import { articleComponents } from "@/components/content/mdx-components";
import { FinancialTable, Sources } from "@/components/content/primitives";

const discovered = await discoverContent(path.resolve("content"));
const fixture = discovered.documents[0];
const article = discovered.catalog.articles[0];
const input = () => structuredClone(fixture.metadata);

describe("metadata validation and M1B compatibility", () => {
  it("resolves source IDs into the existing M1B source shape", () => {
    expect(parseArticleMetadata(input())).toEqual(fixture.metadata);
    expect(article.sources[0]).toMatchObject({ id: "fixture-methodology", publisher: "Fictional Demonstration Institution", authority: "contextual" });
    expect(article).not.toHaveProperty("sourceIds");
  });
  it.each([
    ["status", "fact-check"], ["difficulty", "expert"], ["contentType", "blog"],
    ["title", ""], ["slug", "../escape"], ["domain", "unapproved-taxonomy"],
    ["updateSensitivity", "U5"], ["sourceClasses", []], ["lastReviewedDate", "2026-02-30"],
    ["author", { name: "" }], ["sourceIds", "fixture-methodology"], ["developmentFixture", "true"],
    ["relationships", [{ purpose: "random", target: { kind: "article", id: "abc" } }]],
  ])("rejects malformed %s", (field, value) => {
    expect(() => parseArticleMetadata({ ...input(), [field]: value })).toThrow();
  });
  it("fails unknown fields instead of silently ignoring misspelled metadata", () => {
    expect(() => parseArticleMetadata({ ...input(), publshedDate: "2026-09-20" })).toThrow(/unknown field/);
  });
  it("protects approved, published, and legacy ready content", () => {
    for (const status of ["ready", "approved", "published", "needs-review", "archived"] as const) expect(isEditoriallyProtected(status)).toBe(true);
    expect(isEditoriallyProtected("draft")).toBe(false);
  });
  it("requires review evidence and a date for publication, and never promotes a fixture", () => {
    expect(() => parseArticleMetadata({ ...input(), status: "published" })).toThrow(/fixtures/);
    expect(() => parseArticleMetadata({ ...input(), developmentFixture: false, status: "published" })).toThrow(/reviewer/);
    expect(() => parseArticleMetadata({ ...input(), developmentFixture: false, status: "published", reviewer: { name: "Reviewer" }, lastReviewedDate: "2026-09-20" })).toThrow(/publishedDate/);
    expect(isRenderable(article)).toBe(false);
    expect(isRenderable(article, true)).toBe(true);
    expect(isRenderable({ ...article, developmentFixture: false, status: "approved" }, true)).toBe(false);
    expect(isRenderable({ ...article, developmentFixture: false, status: "needs-review" })).toBe(false);
    expect(isRenderable({ ...article, developmentFixture: false, status: "needs-review", publishedDate: "2026-09-20" })).toBe(true);
  });
});

describe("discovery, source registry, and knowledge graph", () => {
  const assemble = (inputs = [input()], sources = [...discovered.catalog.sources]) => buildCatalog(inputs, sources, discovered.catalog.knowledge, discovered.catalog.cases);
  it("discovers only real MDX/metadata pairs and derives the route from metadata", () => {
    expect(discovered.documents).toHaveLength(1);
    expect(fixture.file).toMatch(/underwriting[\\/]noi-development-fixture.mdx$/);
    expect(articleRoute(article)).toBe("/content/underwriting/noi-development-fixture");
    expect(discovered.catalog.articles.some(article => article.id === "CRE-015")).toBe(false);
  });
  it("rejects duplicate content IDs, canonical routes, sources, and knowledge identities", () => {
    expect(() => assemble([input(), input()])).toThrow(/Duplicate content ID/);
    expect(() => assemble([input(), { ...input(), id: "fixture-NOI-BRIDGE", slug: "different" }])).toThrow(/Duplicate content ID/);
    expect(() => assemble([input(), { ...input(), id: "fixture-other" }])).toThrow(/Duplicate canonical route/);
    expect(() => assemble([input()], [...discovered.catalog.sources, discovered.catalog.sources[0]])).toThrow(/Duplicate source ID/);
    expect(() => buildCatalog([input()], discovered.catalog.sources, [...discovered.catalog.knowledge, discovered.catalog.knowledge[0]], discovered.catalog.cases)).toThrow(/Duplicate knowledge identity/);
  });
  it("rejects unknown source and relationship IDs, including legacy M1B arrays", () => {
    expect(() => assemble([{ ...input(), sourceIds: ["missing"] }])).toThrow(/unknown source/);
    expect(() => assemble([{ ...input(), relatedContent: ["missing"] }])).toThrow(/unresolved article/);
    expect(() => assemble([{ ...input(), relatedGlossaryTerms: ["missing"] }])).toThrow(/unresolved glossary/);
    expect(() => assemble([{ ...input(), relatedCalculators: ["missing"] }])).toThrow(/unresolved calculator/);
  });
  it("resolves four relationship purposes without inventing routes for unavailable assets", () => {
    const other = { ...input(), id: "fixture-other", slug: "other-fixture", relatedContent: [article.id], relationships: [] };
    const graph = assemble([input(), other]);
    expect(resolveRelationships(graph.articles[1], graph, true)).toContainEqual(expect.objectContaining({ purpose: "deep-dive", href: articleRoute(article) }));
    expect(resolveRelationships(graph.articles[1], graph, false)[0]).not.toHaveProperty("href");
    expect(resolveRelationships(graph.articles[0], graph, true).map(item => item.purpose)).toEqual(["application", "prerequisite", "tool"]);
    expect(resolveRelationships(graph.articles[0], graph, true).every(item => !item.href)).toBe(true);
    expect(sourceDependents(graph, "fixture-methodology").map(item => item.id)).toEqual([article.id, "fixture-other"]);
  });
  it("prevents synthetic sources and relationships from entering non-fixture content", () => {
    expect(() => assemble([{ ...input(), developmentFixture: false }])).toThrow(/synthetic sources/);
    expect(() => assemble([{ ...input(), developmentFixture: false, sourceIds: [] }])).toThrow(/fixture relationships/);
  });
  it("requires current-source provenance for high-sensitivity content", () => {
    expect(() => assemble([{ ...input(), developmentFixture: false, updateSensitivity: "U3", relationships: [], relatedGlossaryTerms: [], relatedCalculators: [] }], [{ ...discovered.catalog.sources[0], synthetic: false }])).toThrow(/URL, accessedDate and reviewedDate/);
  });
  it("validates source protocols and real dates", () => {
    expect(() => parseSources([{ ...discovered.catalog.sources[0], url: "javascript:alert(1)" }])).toThrow(/HTTP/);
    expect(() => parseSources([{ ...discovered.catalog.sources[0], reviewedDate: "2026-13-01" }])).toThrow(/real YYYY/);
  });
  it("fails orphan metadata and mismatched domain directories clearly", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "cre-content-test-"));
    try {
      await mkdir(path.join(root, "learn"));
      await writeFile(path.join(root, "learn", "orphan.json"), JSON.stringify(input()));
      await expect(discoverContent(root)).rejects.toThrow(/orphan metadata/);
      await writeFile(path.join(root, "learn", "orphan.mdx"), "## Test\nBody.");
      await expect(discoverContent(root)).rejects.toThrow(/directory must match/);
    } finally {
      // mkdtemp creates an isolated directory; verify the exact cleanup boundary.
      if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith("cre-content-test-")) throw new Error("Unexpected test directory");
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("local MDX compilation and representative rendering", () => {
  it.each([
    "# Unowned heading", "### Skipped heading", "import Thing from 'remote'\n\n## Test",
    "## Test\n\n{process.env.SECRET}", "## Test\n\n<Unknown />",
    "## Test\n\n<Formula formula={1 + 1} />", "## Test\n\n<FinancialTable tableId=\"missing\" />",
    "## Test\n\n<SourceNote sourceId=\"missing\" />", "## Test\n\n[bad](javascript:alert)",
    "## Test\n\n[bad][ref]\n\n[ref]: javascript:alert",
    "## Test\n\n[missing](#missing)", "## Test\n\n<CaseStudy caseId=\"harbor-view\" /><CaseStudy caseId=\"harbor-view\" />",
  ])("rejects malformed or executable MDX: %s", async body => {
    await expect(compileArticle(body, article, discovered.catalog)).rejects.toThrow();
  });
  it("compiles local MDX to a static module with no runtime evaluator", async () => {
    const result = await compileArticle(fixture.body, article, discovered.catalog);
    expect(result.code).toContain('from "react/jsx-runtime"');
    expect(result.code).not.toMatch(/eval\(|new Function|use client/);
    expect(result.caseIds).toEqual(["harbor-view"]);
  });
  it("derives an ordered outline with unique anchors from formatted and repeated headings", async () => {
    const result = await compileArticle("## A **method**\n\n### Detail\n\n## A **method**", article, discovered.catalog);
    expect(result.headings).toEqual([
      { id: "section-a-method", label: "A method", depth: 2 },
      { id: "section-detail", label: "Detail", depth: 3 },
      { id: "section-a-method-2", label: "A method", depth: 2 },
    ]);
    for (const heading of result.headings) expect(result.code).toContain(`id: "${heading.id}"`);
  });
  it("renders all rich primitives, provenance, and contextual relationship links", async () => {
    const { default: Body } = await loaders[article.id]();
    const html = renderToStaticMarkup(createElement(ArticleTemplate, { article, catalog, fixtures: true, headings: articleHeadings[article.id], embeddedCases: embeddedCases[article.id] }, createElement(Body, { components: articleComponents(article, catalog) })));
    expect(html).toContain("Development fixture — not publication content");
    for (const label of ["Formula definition", "Worked calculation", "Practitioner interpretation", "Convention / methodology", "Institution-specific example", "Analytical caution", "Fictional educational case", "Sources and provenance", "Connect the concepts"]) expect(html).toContain(label);
    expect(html).toContain('href="#source-fixture-methodology"');
    expect(html).toContain('href="#case-harbor-view"');
    expect(html).not.toMatch(/href="\/glossary|href="\/calculators/);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    const headings = [...html.matchAll(/<h([1-6])\b/g)].map(match => Number(match[1]));
    headings.slice(1).forEach((level, index) => expect(level).toBeLessThanOrEqual(headings[index] + 1));
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(html).toContain("On this page");
    expect(html).toContain("Related content");
    for (const match of html.matchAll(/href="#([^"]+)"/g)) expect(ids).toContain(match[1]);
    for (const heading of articleHeadings[article.id]) expect(html).toContain(`href="#${heading.id}"`);
    for (const match of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)) for (const id of match[1].split(" ")) expect(ids).toContain(id);
    expect(html).toContain("$2,140,000");
    expect(html).toContain("64.4%");
  });
  it("gives financial tables semantic headers, a caption, and a keyboard-focusable scroll region", () => {
    const table = discovered.catalog.cases[0].tables[0];
    const html = renderToStaticMarkup(createElement(FinancialTable, { data: table }));
    expect(html).toContain('role="region"'); expect(html).toContain('tabindex="0"');
    expect(html).toContain("<caption");
    expect(html.match(/scope="col"/g)).toHaveLength(2);
    expect(html.match(/scope="row"/g)).toHaveLength(9);
    expect(() => parseTable({ ...table, rows: [{ label: "Mismatch", values: [] }] })).toThrow(/match value columns/);
  });
  it("keeps fixture arithmetic as data and verifies the illustrative bridge consistency", async () => {
    const cases = parseCases(JSON.parse(await readFile("content/data/cases.json", "utf8")));
    const rows = cases[0].tables[0].rows;
    const amounts = rows.map(row => Number(row.values[0].replaceAll("−", "-").replace(/[$,+]/g, "")));
    expect(amounts.slice(0, -1).reduce((a, b) => a + b, 0)).toBe(amounts.at(-1));
    expect(amounts.at(-1)).toBe(2140000);
  });
  it("renders optional external provenance as a descriptive source link", () => {
    const html = renderToStaticMarkup(createElement(Sources, { sources: [{ ...article.sources[0], url: "https://example.org/synthetic-source" }] }));
    expect(html).toContain('href="https://example.org/synthetic-source"');
    expect(html).toContain("View source at Fictional Demonstration Institution");
  });
});
