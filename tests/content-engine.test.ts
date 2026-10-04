import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ArticleMetadata, ContentCatalog } from "@/content/contracts";
import { parseArticleMetadata, parseCases, parseSources, parseTable } from "@/content/validation";
import { articleRoute, buildCatalog, isEditoriallyProtected, isEditorialPreview, isRenderable, resolveRelationships, sourceDependents } from "@/content/catalog";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { articleHeadings, catalog, embeddedCases, loaders } from "@/content/.generated";
import { ArticleTemplate } from "@/components/content/article-template";
import { articleComponents } from "@/components/content/mdx-components";
import { FinancialTable, Sources } from "@/components/content/primitives";

const discovered = await discoverContent(path.resolve("content"));
const fixture = discovered.documents.find(document => document.metadata.id === "fixture-noi-bridge")!;
const article = discovered.catalog.articles.find(article => article.id === "fixture-noi-bridge")!;
const input = () => structuredClone(fixture.metadata);

describe("CRE-015 production integration", () => {
  const production = discovered.catalog.articles.find(article => article.id === "CRE-015")!;
  it("validates published metadata and makes the article production-routable", () => {
    expect(production).toMatchObject({ status: "published", publishedDate: "2026-10-03", developmentFixture: false, lastReviewedDate: "2026-10-03" });
    expect(isEditoriallyProtected(production.status)).toBe(true);
    expect(isRenderable(production)).toBe(true);
    expect(isRenderable(production, true)).toBe(true);
    expect(loaders).toHaveProperty(production.id);
    expect(articleRoute(production)).toBe("/content/underwriting/net-operating-income-underwritten-noi");
  });
  it("resolves only public production sources and the canonical Harbor View case and tables", async () => {
    expect(production.sources.map(source => source.id)).toEqual(["occ-cre-lending-2022", "fannie-income-analysis-203", "fannie-underwritten-ncf-203-01"]);
    for (const source of production.sources) {
      expect(source.synthetic).toBe(false);
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.accessedDate).toBe("2026-10-03");
      expect(source.reviewedDate).toBe("2026-10-03");
    }
    expect(sourceDependents(discovered.catalog, "fixture-methodology").map(article => article.id)).toEqual(["fixture-noi-bridge"]);
    expect(production.relationships).toEqual([{ purpose: "application", target: { kind: "case-study", id: "harbor-view" } }]);
    const cases = discovered.catalog.cases.filter(record => record.id === "harbor-view");
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({ fictional: true, synthetic: false });
    expect(cases[0].tables.slice(0, 6).map(table => table.id)).toEqual(["harbor-view-noi-bridge", "harbor-view-performance-comparison", "harbor-view-t12-summary", "harbor-view-nri-trends", "harbor-view-noi-trends", "harbor-view-expense-trends"]);
    const document = discovered.documents.find(document => document.metadata.id === production.id)!;
    const compiled = await compileArticle(document.body, production, discovered.catalog, document.file);
    expect(compiled.caseIds).toEqual(["harbor-view"]);
    expect(compiled.headings.some(heading => heading.label === "The Three-Question Adjustment Test")).toBe(true);
  });
});

describe("CRE-006 additive integration", () => {
  const approved = discovered.catalog.articles.find(item => item.id === "CRE-006")!;
  it("preserves frozen prose and published routing with canonical relationships", () => {
    const document = discovered.documents.find(item => item.metadata.id === approved.id)!;
    expect(createHash("sha256").update(document.body).digest("hex")).toBe("99e4e9b045058217d0a85108b7255cdcb4c4b555c7ed5512f87b1c2afc1b2dd0");
    expect(approved).toMatchObject({ status: "published", publishedDate: "2026-10-04", developmentFixture: false });
    expect(isRenderable(approved)).toBe(true);
    expect(isRenderable(approved, true)).toBe(true);
    expect(isRenderable(approved, false, true)).toBe(true);
    expect(approved.sources.map(source => source.id)).toEqual(["occ-cre-lending-2022", "fannie-income-analysis-203"]);
    expect(approved.relationships).toEqual([{ purpose: "application", target: { kind: "case-study", id: "harbor-view" } }, { purpose: "deep-dive", target: { kind: "article", id: "CRE-015" } }]);
    expect(resolveRelationships(approved, discovered.catalog)[1].href).toBe("/content/underwriting/net-operating-income-underwritten-noi");
  });
  it("uses the frozen annualized revenue, NOI, and five expense rows", () => {
    const tables = discovered.catalog.cases.find(item => item.id === "harbor-view")!.tables;
    expect(tables.find(item => item.id === "harbor-view-nri-trends")!.rows.map(row => row.values)).toEqual([["$2,988,000"], ["$3,008,000"], ["$3,012,000"]]);
    expect(tables.find(item => item.id === "harbor-view-noi-trends")!.rows.map(row => row.values)).toEqual([["$2,215,000"], ["$2,188,000"], ["$2,120,000"]]);
    expect(tables.find(item => item.id === "harbor-view-expense-trends")!.rows.map(row => [row.label, ...row.values])).toEqual([
      ["Real estate taxes", "$180K", "$180K", "$180K"], ["Insurance", "$120K", "$144K", "$184K"], ["Payroll", "$210K", "$222K", "$232K"], ["Repairs & maintenance", "$145K", "$170K", "$220K"], ["Utilities", "$180K", "$180K", "$180K"]
    ]);
  });
});

describe("CRE-007 published integration", () => {
  const approved = discovered.catalog.articles.find(item => item.id === "CRE-007")!;
  it("preserves frozen prose, published lifecycle, and published relationship targets", () => {
    const document = discovered.documents.find(item => item.metadata.id === approved.id)!;
    expect(createHash("sha256").update(document.body).digest("hex")).toBe("995f7ccaf61499a215a81f95870a5dee0ed54137191111b44a8e86540d72577b");
    expect(approved).toMatchObject({ status: "published", publishedDate: "2026-10-04", developmentFixture: false, updateSensitivity: "U3" });
    expect(isRenderable(approved)).toBe(true);
    expect(isRenderable(approved, true)).toBe(true);
    expect(isRenderable(approved, false, true)).toBe(true);
    expect(articleRoute(approved)).toBe("/content/underwriting/rent-roll-analysis");
    expect(approved.sources.map(source => source.id)).toEqual(["occ-cre-lending-2022", "fannie-lease-audit-401", "freddie-appraisal-checklist-2026"]);
    expect(resolveRelationships(approved, discovered.catalog).filter(relation => relation.target.kind === "article").map(relation => relation.href)).toEqual(["/content/underwriting/t12-operating-statement", "/content/underwriting/net-operating-income-underwritten-noi"]);
  });
  it("renders the six tables including all 18 leases with matching row and column counts", () => {
    const tables = discovered.catalog.cases.find(item => item.id === "harbor-view")!.tables.slice(6, 12);
    expect(tables.map(table => table.id)).toEqual(["harbor-view-rent-roll-inventory", "harbor-view-contract-market-rent", "harbor-view-rent-roll-lease-sample", "harbor-view-rent-roll-concessions", "harbor-view-rent-roll-expirations", "harbor-view-rent-roll-t12-reconciliation"]);
    for (const table of tables) {
      expect(table.columns[0]).toEqual({ key: "item", label: "Item" });
      expect(table.rows.every(row => row.values.length === table.columns.length - 1)).toBe(true);
      const rendered = renderToStaticMarkup(createElement(FinancialTable, { data: table }));
      expect((rendered.match(/scope="col"/g) ?? []).length).toBe(table.columns.length);
      expect((rendered.match(/scope="row"/g) ?? []).length).toBe(table.rows.length);
    }
    expect(tables.find(table => table.id === "harbor-view-rent-roll-lease-sample")!.rows).toHaveLength(18);
  });
});

describe("CRE-011 published integration", () => {
  const approved = discovered.catalog.articles.find(item => item.id === "CRE-011")!;
  it("preserves frozen prose, canonical sources, published lifecycle, and routable relationships", async () => {
    const document = discovered.documents.find(item => item.metadata.id === approved.id)!;
    expect(createHash("sha256").update(document.body).digest("hex")).toBe("9e220e1e51b02b1ae5d3aa6053514ccc8a7a7c5d6a2ae43dc6076e9d7421ddcc");
    expect(approved).toMatchObject({ status: "published", publishedDate: "2026-10-04", developmentFixture: false, updateSensitivity: "U2" });
    expect(isRenderable(approved)).toBe(true);
    expect(isRenderable(approved, true)).toBe(true);
    expect(isRenderable(approved, false, true)).toBe(true);
    expect(approved.sources.map(source => source.id)).toEqual(["occ-cre-lending-2022", "fannie-income-analysis-203"]);
    expect(discovered.catalog.sources.some(source => source.id === "fannie-other-income")).toBe(false);
    expect(resolveRelationships(approved, discovered.catalog).filter(r => r.target.kind === "article").map(r => r.href)).toEqual(["/content/underwriting/t12-operating-statement", "/content/underwriting/rent-roll-analysis", "/content/underwriting/net-operating-income-underwritten-noi"]);
    await expect(compileArticle(document.body, approved, discovered.catalog, document.file)).resolves.toBeDefined();
  });
  it("preserves the seven revenue tables and fictional underwriting bridge", () => {
    const tables = discovered.catalog.cases.find(item => item.id === "harbor-view")!.tables.slice(12);
    expect(tables.map(table => table.id)).toEqual(["harbor-view-revenue-t12", "harbor-view-revenue-trend", "harbor-view-revenue-evidence-comparison", "harbor-view-revenue-evidence-boundaries", "harbor-view-revenue-rental-underwriting", "harbor-view-revenue-other-income-underwriting", "harbor-view-revenue-complete-bridge"]);
    for (const table of tables) {
      const markup = renderToStaticMarkup(createElement(FinancialTable, { data: table }));
      expect((markup.match(/scope="col"/g) ?? []).length).toBe(table.columns.length);
      expect((markup.match(/scope="row"/g) ?? []).length).toBe(table.rows.length);
    }
    expect(tables[6].rows.map(row => row.values)).toEqual([["$3,180,000"], ["+$60,000"], ["($35,000)"], ["($15,000)"], ["$3,190,000"]]);
    expect(tables[3].rows).toHaveLength(9);
  });
});

describe("separate approved editorial preview", () => {
  const approved = { ...article, id: "test-approved-article", slug: "test-approved-article", description: "Controlled approved article for editorial preview testing.", status: "approved" as const, developmentFixture: false, publishedDate: undefined };
  const previewCatalog = { ...discovered.catalog, articles: [...discovered.catalog.articles, approved] };
  it.each(["research", "brief", "draft", "technical-review", "editorial-review", "source-verification", "ready", "approved", "published", "needs-review", "archived"] as const)("limits preview eligibility for %s", status => {
    const candidate = { ...approved, status, publishedDate: undefined };
    expect(isRenderable(candidate)).toBe(status === "published");
    expect(isRenderable(candidate, true)).toBe(status === "published");
    expect(isRenderable(candidate, false, true)).toBe(status === "approved" || status === "published");
    expect(isEditorialPreview(candidate, true)).toBe(status === "approved");
    expect(isRenderable({ ...candidate, developmentFixture: true }, false, true)).toBe(false);
    expect(isRenderable({ ...candidate, status: "needs-review", publishedDate: "2026-10-03" }, false, true)).toBe(true);
  });
  it("keeps fixture and approved preview semantics distinct", () => {
    expect(isRenderable(article, false, true)).toBe(false);
    expect(isRenderable(article, true)).toBe(true);
    expect(isEditorialPreview(article, true)).toBe(false);
    const preview = renderToStaticMarkup(createElement(ArticleTemplate, { article: approved, catalog: previewCatalog, editorialPreview: true }));
    expect(preview).toContain("Approved — editorial preview");
    expect(preview).not.toContain("Development fixture — not publication content");
    expect(renderToStaticMarkup(createElement(ArticleTemplate, { article: approved, catalog: previewCatalog }))).not.toContain("Approved — editorial preview");
    const published: ArticleMetadata = { ...approved, status: "published", publishedDate: "2026-10-03" };
    expect(renderToStaticMarkup(createElement(ArticleTemplate, { article: published, catalog: previewCatalog, editorialPreview: true }))).not.toContain("Approved — editorial preview");
    expect(renderToStaticMarkup(createElement(ArticleTemplate, { article, catalog, fixtures: true }))).not.toContain("Approved — editorial preview");
  });
  it("links approved article relationships only in the explicit editorial mode", () => {
    const related = { ...article, relationships: [{ purpose: "deep-dive" as const, target: { kind: "article" as const, id: approved.id } }], relatedGlossaryTerms: [], relatedCalculators: [] };
    expect(resolveRelationships(related, previewCatalog)[0]).not.toHaveProperty("href");
    expect(resolveRelationships(related, previewCatalog, true)[0]).not.toHaveProperty("href");
    expect(resolveRelationships(related, previewCatalog, false, true)[0].href).toBe(articleRoute(approved));
    const publishedCatalog: ContentCatalog = { ...previewCatalog, articles: previewCatalog.articles.map((target): ArticleMetadata => target.id === approved.id ? { ...target, status: "published", publishedDate: "2026-10-03" } : target) };
    expect(resolveRelationships(related, publishedCatalog)[0].href).toBe(articleRoute(approved));
  });
});

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
    expect(discovered.documents).toHaveLength(5);
    expect(fixture.file).toMatch(/underwriting[\\/]noi-development-fixture.mdx$/);
    expect(articleRoute(article)).toBe("/content/underwriting/noi-development-fixture");
    expect(discovered.catalog.articles.some(article => article.id === "CRE-015")).toBe(true);
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
