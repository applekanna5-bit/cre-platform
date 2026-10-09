import path from "node:path";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { searchDocuments as index } from "@/content/.generated/search";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { publicArticles } from "@/content/publication";
import { articleSearchProjection, type ArticleSearchText } from "@/search/projection";
import { normalizeSearch, searchDocuments, searchQuery, type SearchDocument } from "@/search/engine";
import SearchPage from "@/app/search/page";
import { SearchForm } from "@/components/search/search-form";

const { catalog, documents } = await discoverContent(path.resolve("content"));
const article = catalog.articles.find(item => item.id === "CRE-008")!;
const doc = (id: string, fields: Partial<SearchDocument> = {}): SearchDocument => ({ kind: "article", id, href: `/content/test/${id}`, title: "", description: "", topics: [], headings: [], body: "", ...fields });
const ids = (query: unknown) => searchDocuments(index, query).map(item => item.id);

describe("publication-only search projection", () => {
  it("contains exactly the five public articles even in fixture compilation mode", async () => {
    expect(index.map(item => item.id)).toEqual(publicArticles(catalog).map(item => item.id));
    expect(index).toHaveLength(5);
    const generated = await readFile("src/content/.generated/search.ts", "utf8");
    expect(generated).not.toMatch(/fixture-noi-bridge|sourceIds|sourceClasses|"reviewer"|"loaders"|"sources"|caseId|tableId/);
    for (const privateArticle of catalog.articles.filter(item => !publicArticles(catalog).some(publicItem => publicItem.id === item.id))) {
      expect(generated).not.toContain(privateArticle.title);
      expect(generated).not.toContain(privateArticle.slug);
    }
    for (const item of index) expect(Object.keys(item).sort()).toEqual(["kind", "id", "href", "title", "description", "topics", "headings", "body"].sort());
  });

  it("does not project unpublished text, registry markers, or extra metadata", () => {
    const marker = "PRIVATE-MARKER-7391";
    const marked = { ...catalog, articles: [{ ...article, author: { name: marker }, sources: [{ ...article.sources[0], notes: marker }] }, { ...article, id: marker, slug: marker, title: marker, status: "draft" as const }] };
    const projection = articleSearchProjection(marked, new Map([[article.id, { headings: ["Public heading"], body: "Public body" }], [marker, { headings: [marker], body: marker }]]));
    expect(JSON.stringify(projection)).not.toContain(marker);
    expect(searchDocuments(projection, marker)).toEqual([]);
    expect(() => articleSearchProjection(marked, new Map())).toThrow("Missing compiled search text");
  });

  it("extracts teaching from validated MDX without JSX, source props, or registry expansion", async () => {
    const body = `## Educational heading

Ordinary **rent roll** teaching with [support](https://example.com/private-url-marker).

<PractitionerNote>Distinct practitioner explanation.</PractitionerNote>

<Formula formula="NOI / Debt service" variables={[{symbol: "NOI", meaning: "Operating income"}]} interpretation="Coverage interpretation" />

<Calculation inputs={[{label: "Loan", value: "100"}]} formula="100 / 2" result="50" interpretation="Calculation explanation" />

<InstitutionalExample sourceId="${article.sources[0].id}">Public institutional explanation.</InstitutionalExample>

<SourceNote sourceId="${article.sources[0].id}" />

<CaseStudy caseId="harbor-view" />

<FinancialTable tableId="harbor-view-contract-market-rent" />

Repeated evidence.

Repeated evidence.`;
    const marker = "PRIVATE-REGISTRY-MARKER-7391";
    const markedCatalog = { ...catalog, cases: catalog.cases.map(record => ({ ...record, label: marker, description: marker, facts: [{ label: marker, value: marker }] })) };
    const result = await compileArticle(body, article, markedCatalog);
    expect(result.searchText.headings).toEqual(["Educational heading"]);
    expect(result.searchText.body).toContain("Ordinary rent roll teaching");
    for (const teaching of ["Distinct practitioner explanation", "Coverage interpretation", "Operating income", "Calculation explanation", "Public institutional explanation"]) expect(result.searchText.body).toContain(teaching);
    expect(result.searchText.body.match(/Repeated evidence/g)).toHaveLength(1);
    expect(JSON.stringify(result.searchText)).not.toMatch(/https:|sourceId|caseId|tableId|harbor-view|Formula|FinancialTable/);
    expect(JSON.stringify(result.searchText)).not.toContain(article.sources[0].id);
    expect(JSON.stringify(result.searchText)).not.toContain(marker);
  });

  it("indexes the actual compiler output deterministically", async () => {
    const text = new Map<string, ArticleSearchText>();
    for (const document of documents) {
      const metadata = catalog.articles.find(item => item.id === document.metadata.id)!;
      text.set(metadata.id, (await compileArticle(document.body, metadata, catalog)).searchText);
    }
    expect(articleSearchProjection(catalog, text)).toEqual(index);
  });
});

describe("search relevance and input handling", () => {
  it("normalizes Unicode, punctuation, whitespace, and case consistently", () => {
    expect(normalizeSearch("  ＮＯＩ — Café\tT‑12  ")).toBe("noi cafe t 12");
    expect(ids("NOI")).toEqual(ids("ＮＯＩ"));
    expect(ids("T-12")).toEqual(ids("t—12"));
    expect(ids(" rent   roll ")).toEqual(ids("RENT-ROLL"));
    expect(ids("contract rent")).toEqual(ids("contract—rent"));
  });

  it("returns useful real-article results for the acceptance queries", () => {
    expect(ids("NOI")[0]).toBe("CRE-015");
    expect(ids("T-12")[0]).toBe("CRE-006");
    expect(ids("rent roll")[0]).toBe("CRE-007");
    expect(ids("contract rent")[0]).toBe("CRE-008");
    expect(ids("DSCR").length).toBeGreaterThan(0);
  });

  it("prioritizes title, then headings/topics, description, and body regardless of repetition", () => {
    const records = [doc("body", { body: "NOI ".repeat(1000) }), doc("description", { description: "NOI" }), doc("heading", { headings: ["NOI"] }), doc("topic", { topics: ["NOI"] }), doc("title", { title: "NOI" })];
    expect(searchDocuments(records, "NOI").map(item => item.id)).toEqual(["title", "heading", "topic", "description", "body"]);
    expect(searchDocuments([...records].reverse(), "NOI")).toEqual(searchDocuments(records, "NOI"));
    expect(searchDocuments(records, "NOI absent")).toEqual([]);
    expect(searchDocuments([doc("a", { title: "noise" })], "NOI")).toEqual([]);
  });

  it("bounds input and handles empty/malformed queries without evaluating patterns", () => {
    for (const query of [undefined, null, {}, ["NOI", "DSCR"], 12, "", "   ", "---", "[]()*+?\\"]) expect(searchDocuments(index, query)).toEqual([]);
    expect(searchQuery("a".repeat(1000))).toHaveLength(200);
    expect(searchQuery("NOI\u0000DSCR")).toBe("NOI DSCR");
    expect(searchDocuments(index, "<script>alert(1)</script>")).toEqual([]);
    expect(searchDocuments(index, "NOI")[0]).not.toHaveProperty("body");
    expect(searchDocuments(index, "NOI")[0]).not.toHaveProperty("headings");
  });
});

describe("server GET search route", () => {
  const render = async (q?: string | string[]) => renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve({ q }) }));

  it("renders shareable GET forms and server results", async () => {
    const html = await render("rent roll");
    expect(html).toMatch(/\d+ results?/);
    expect(html).toContain('href="/content/underwriting/rent-roll-analysis"');
    expect(html).toContain('value="rent roll"');
    const form = renderToStaticMarkup(createElement(SearchForm, { id: "test-query" }));
    expect(form).toContain('action="/search" method="get"');
    expect(form).toContain('role="search"');
    expect(form).toContain('for="test-query"');
    expect(form).toContain('name="q"');
    expect(form).toContain('type="search"');
    expect(form).toContain('type="submit"');
  });

  it("renders empty and no-results states and escapes query markup", async () => {
    expect(await render()).toContain("Enter a concept or phrase");
    expect(await render(["NOI", "DSCR"])).toContain("Enter a concept or phrase");
    expect(await render("---")).toContain("Enter a concept or phrase");
    const html = await render('<script>alert("x")</script>');
    expect(html).toContain("0 results");
    expect(html).toContain("No published research matches");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("serializes results without index bodies, nonpublic markers, or fixtures", async () => {
    const html = await render("NOI");
    expect(html).not.toMatch(/fixture-noi-bridge|sourceIds|sourceClasses|caseId|tableId/);
    for (const document of index) expect(html).not.toContain(document.body);
    expect(await render("fixture-noi-bridge")).toContain("0 results");
  });
});
