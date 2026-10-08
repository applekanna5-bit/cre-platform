import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ArticleMetadata, EditorialStatus } from "@/content/contracts";
import { discoverContent } from "@/content/discovery";
import { isEditorialPreview, isRenderable } from "@/content/catalog";
import { publicArticles } from "@/content/publication";

const { catalog } = await discoverContent(path.resolve("content"));
const base = catalog.articles.find(article => article.id === "CRE-008")!;
const record = (overrides: Partial<ArticleMetadata> = {}): ArticleMetadata => ({ ...base, ...overrides });

describe("publication-safe discovery", () => {
  it("includes published and previously published needs-review articles only", () => {
    const states: EditorialStatus[] = ["research", "brief", "draft", "editorial-review", "technical-review", "source-verification", "ready", "approved", "published", "needs-review", "archived"];
    for (const status of states) {
      const article = record({ status });
      expect(publicArticles({ articles: [article] }).length).toBe(status === "published" || status === "needs-review" ? 1 : 0);
    }
    expect(publicArticles({ articles: [record({ status: "needs-review", publishedDate: undefined })] })).toEqual([]);
    expect(publicArticles({ articles: [record({ status: "needs-review" })] })[0].needsReview).toBe(true);
  });

  it("isolates fixtures and editorial previews regardless of render eligibility", () => {
    const approved = record({ status: "approved", publishedDate: undefined });
    const fixture = record({ status: "draft", developmentFixture: true });
    expect(isEditorialPreview(approved, true)).toBe(true);
    expect(isRenderable(fixture, true)).toBe(true);
    for (const status of ["draft", "published", "needs-review"] as const) {
      expect(publicArticles({ articles: [record({ status, developmentFixture: true })] })).toEqual([]);
    }
    expect(publicArticles({ articles: [approved, fixture] })).toEqual([]);
  });

  it("orders by canonical route independent of input order without mutating input", () => {
    const articles = [record({ id: "B", slug: "z" }), record({ id: "A", slug: "a" })];
    const before = structuredClone(articles);
    const projected = publicArticles({ articles });
    expect(projected.map(article => article.id)).toEqual(["A", "B"]);
    expect(publicArticles({ articles: [...articles].reverse() })).toEqual(projected);
    expect(articles).toEqual(before);
    expect(projected[0].topics).not.toBe(articles[1].topics);
  });

  it("rejects duplicate routes and case-insensitive identities", () => {
    expect(() => publicArticles({ articles: [base, record({ id: "OTHER" })] })).toThrow(/Duplicate public article route/);
    expect(() => publicArticles({ articles: [base, record({ id: base.id.toLowerCase(), slug: "other" })] })).toThrow(/Duplicate public article ID/);
  });

  it("serializes an explicit allowlist without nonpublic or internal marker leakage", () => {
    const marker = "NONPUBLIC-MARKER";
    const internal = record({ sources: [{ ...base.sources[0], notes: marker }], relationships: [{ purpose: "deep-dive", target: { kind: "article", id: marker } }], author: { name: marker }, reviewer: { name: marker } });
    const output = publicArticles({ articles: [internal, record({ id: marker, title: marker, description: marker, topics: [marker], status: "approved", publishedDate: undefined })] });
    expect(JSON.stringify(output)).not.toContain(marker);
    expect(Object.keys(output[0]).sort()).toEqual(["kind", "id", "href", "title", "description", "domain", "contentType", "difficulty", "topics", "publishedDate", "needsReview"].sort());
    expect(JSON.parse(JSON.stringify(output))).toEqual(output);
    expect(publicArticles({ articles: [] })).toEqual([]);
  });

  it("projects the real public inventory without manufacturing knowledge routes", () => {
    const output = publicArticles(catalog);
    expect(output.map(article => article.id).sort()).toEqual(["CRE-006", "CRE-007", "CRE-008", "CRE-011", "CRE-015"]);
    expect(new Set(output.map(article => article.href)).size).toBe(output.length);
    expect(output.every(article => article.kind === "article" && article.href === `/content/${article.domain}/${catalog.articles.find(item => item.id === article.id)!.slug}`)).toBe(true);
    expect(JSON.stringify(output)).not.toContain("fixture-noi-bridge");
  });
});
