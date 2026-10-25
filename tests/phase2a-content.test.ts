import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { articleRoute, isRenderable, resolveRelationships } from "@/content/catalog";
import { publicArticles } from "@/content/publication";
import { compileArticle } from "@/content/compile";
import { loaders } from "@/content/.generated";
import { searchDocuments } from "@/content/.generated/search";
const { catalog, documents } = await discoverContent(path.resolve("content"));
const ids = ["phase2a-gpr-egi", "CRE-018"];
const newlyPublished = catalog.articles.filter(a => ids.includes(a.id));
const body = (id: string) => documents.find(d => d.metadata.id === id)!.body;
const protectedHashes: Record<string, string> = {
  "content/data/cases.json": "d3eacd484e8b712bd56c9cf51b8bf1ff2ccdbd13e196618cd08694c1e02f4183",
  "content/data/sources.json": "c45ef162c78536ab73f0f00f01d0ba9049be87f65c9bc45ca798f6962d365b43",
  "content/underwriting/contract-rent-vs-market-rent.json": "a4c4edac1d2b1156afc89ed3f28278db73d300cddbb18a3da1209fe14b652c84",
  "content/underwriting/contract-rent-vs-market-rent.mdx": "83a8a46eccc06190ae430202d145e004a76fbed0f0994364063fd985b3a9d00c",
  "content/underwriting/cre-revenue-underwriting.json": "10d933468f62e0329510670b9150793e7fa069bede0498bd085d9e5055c287b3",
  "content/underwriting/cre-revenue-underwriting.mdx": "9e220e1e51b02b1ae5d3aa6053514ccc8a7a7c5d6a2ae43dc6076e9d7421ddcc",
  "content/underwriting/net-operating-income-underwritten-noi.json": "1bf84004abe6f1bc726bc7d5873b5a7bca9c844dc3a95999f58115211d894a61",
  "content/underwriting/net-operating-income-underwritten-noi.mdx": "19033267a382edec4e69f329ba1e5956584f00a14e458966189d58918decf56e",
  "content/underwriting/rent-roll-analysis.json": "a809c7c2f8235e35c9924180258ef9bc7d069b17e61f5ab7ab7153c865d9393c",
  "content/underwriting/rent-roll-analysis.mdx": "995f7ccaf61499a215a81f95870a5dee0ed54137191111b44a8e86540d72577b",
  "content/underwriting/t12-operating-statement.json": "eb262ddf5c4fa83c2470a9246f48f08e9d185d3bafcf39ad1b2d686570fd4b9c",
  "content/underwriting/t12-operating-statement.mdx": "99e4e9b045058217d0a85108b7255cdcb4c4b555c7ed5512f87b1c2afc1b2dd0",
  "next.config.ts": "e434f57f0140d3b769c97bc17bae21fa8bc2c39e7896116d22c1a691e8f70630",
  "package-lock.json": "58cfbf6a8e3eb4f9dbd1a7349eccf4fb6471df2f67f6cc5de5673c44b406a2eb",
  "package.json": "e41e3b1898ff0e7784dd08d5d622a83a869f63a417e701b744b46ec530f58ab9",
  "scripts/content.mts": "36016d290e2071f7b3760fa2217a15226c0a3969716c0b78729c92297dc1951b",
  "src/app/content/[domain]/[slug]/page.tsx": "d9d9585e3b3cb3ef65595a41bc90dec6ed71bd7f1c2b0a9c1f2573ec510a07f7",
  "src/config/navigation.ts": "5e6b2571631e2e442178a4c808465d22d16bbc0f30cd56e4b6915853e7b2c80b",
  "src/config/site.ts": "b9cad29629a3f936c137ef0a71992496b61042d04eb7bc2b253e48c6bbe5ceac",
  "src/content/catalog.ts": "e2b09e71599c76a3587d3e8d9cbb73265f0d3be5b2a1bccb7dcb92decfa1639a",
  "src/content/contracts.ts": "8ceff33012dc3a586ccf30e4c2c6656f992e1df5bd6b4d6477f019627bdc7a21",
  "src/content/publication.ts": "5d240e5a3f36359b2eb7daa711d608c6e3996fc12ae419a3cd4a4953cb6ce10f",
  "src/proxy.ts": "0af785226a83bff843b6d805ca7351fe3c6eca4cddea33a4cb316958b224a373",
  "src/security/preview-auth.ts": "6e048262590feb305db0688134065c1b14c82357e6a9696b5029703d90c6cb11",
  "src/seo/build-context.ts": "229bb3160ece37b40deaad02df034c00ef926de23f34b650fe76938185d6d5ab",
  "src/seo/context.ts": "4c410673de2b37347d2afdb8aa5167a5751de2c603b2b7083bd215063603ae31",
  "src/seo/metadata.ts": "9f033c9f64682568ab72852905035b0e3d7626f82929e48a8c7cd6e89e4149e6",
  "src/seo/policy.ts": "a10c73bfbf8c0be2cf0c3412c1ddda6e391bc0effb7502506bdd0d9bfc0de14a"
};
const dollars = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
describe("Phase 2A unpublished editorial batch", () => {
  it("keeps the approved additions published with valid review and publication metadata", () => {
    expect(newlyPublished).toHaveLength(2);
    for (const a of newlyPublished) {
      expect(a).toMatchObject({status: "published", developmentFixture: false, reviewer:{name:"The CRE Ledger Editorial Team"}, lastReviewedDate:"2026-10-24"});
      expect(a.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const fixtures of [false, true]) for (const preview of [false, true]) expect(isRenderable(a, fixtures, preview)).toBe(true);
      expect(loaders[a.id]).toBeDefined();
    }
  });
  it("compiles the actual MDX with validated sources and resolved relationships", async () => {
    for (const a of newlyPublished) {
      const compiled = await compileArticle(body(a.id), a, catalog);
      expect(compiled.headings.length).toBeGreaterThanOrEqual(5);
      expect(a.sources.every(s => s.url && !s.synthetic)).toBe(true);
      expect(resolveRelationships(a, catalog).length).toBe(a.relationships.length);
    }
    const prerequisite = resolveRelationships(newlyPublished.find(a => a.id === "CRE-018")!, catalog).find(x => x.target.id === "phase2a-gpr-egi");
    expect(prerequisite?.href).toBe("/content/underwriting/gross-potential-income-effective-gross-income");
  });
  it("projects all eight authorized public routes and excludes remaining drafts from discovery", () => {
    const publicIds = ["CRE-006", "CRE-007", "CRE-008", "CRE-011", "CRE-015", "CRE-018", "CRE-025", "phase2a-gpr-egi"];
    expect(publicArticles(catalog).map(a=>a.id).sort()).toEqual(publicIds);
    expect(searchDocuments.map(a=>a.id).sort()).toEqual(publicIds);
    expect(new Set(catalog.articles.map(a=>a.id.toLowerCase())).size).toBe(catalog.articles.length);
    expect(new Set(catalog.articles.map(articleRoute)).size).toBe(catalog.articles.length);
    for (const a of catalog.articles.filter(item => !publicIds.includes(item.id))) {
      expect(JSON.stringify(searchDocuments)).not.toContain(a.title);
      expect(JSON.stringify(publicArticles(catalog))).not.toContain(a.slug);
    }
  });
  it("preserves published source and publication/security configuration byte for byte", async () => {
    for (const [file, hash] of Object.entries(protectedHashes)) expect(createHash("sha256").update(await readFile(file)).digest("hex"), file).toBe(hash);
  });
  it("exposes relationships only to publicly available article routes", () => {
    const publicIds = publicArticles(catalog).map(a=>a.id);
    for (const a of catalog.articles.filter(a=>publicArticles(catalog).some(p=>p.id===a.id))) {
      for (const relation of resolveRelationships(a,catalog).filter(x=>x.target.kind==="article")) { expect(publicIds.includes(relation.target.id)).toBe(true); expect(relation.href).toBeDefined(); }
    }
  });
  it("reconciles the authored annual GPR and EGI without double counting losses", () => {
    const gpr = 100 * 1500 * 12, vacancy = gpr * .05;
    const nri = gpr - vacancy - 18000 - 9000, egi = nri + 60000;
    expect(gpr).toBe(1800000); expect(egi).toBe(1743000);
    for (const value of [gpr, vacancy, nri, egi]) expect(body("phase2a-gpr-egi")).toContain(dollars(value)+"/year");
    expect(body("phase2a-gpr-egi")).toContain('formula="EGI = $1,800,000 − $90,000 − $18,000 − $9,000 + $60,000"');
    expect(body("phase2a-gpr-egi")).toContain('result="$1,743,000/year"');
    expect((vacancy+18000+9000)/gpr*100).toBeCloseTo(6.5);
  });
  it("checks fundamentals and independently reconciles reserved valuation scenario arithmetic", () => {
    const egi=1743000, expense=egi*.4, noi=egi-expense, value=noi/.055;
    const text=body("CRE-018");
    for (const n of [expense,noi]) expect(text).toContain(dollars(n)+"/year");
    expect(text).toContain(dollars(value));
    // Advanced scenarios were preserved in Phase 2D review evidence, outside this fundamentals article.
    expect(noi/.05).toBe(20916000); expect(noi/.06).toBe(17430000);
    expect(Math.round(50000/.055)).toBe(909091); expect(Math.round((noi-30000)/.055)).toBe(18469091); expect(Math.round(30000/.055)).toBe(545455);
    expect((noi/.06/value-1)*100).toBeCloseTo(-8.333333); expect((noi/.05/value-1)*100).toBeCloseTo(10);
    expect(text).toContain('formula="Illustrative value = $1,045,800 ÷ 0.055"');
    expect(text).toContain('result="$19,014,545, rounded to the nearest USD"');
    for(const reserved of ["50-basis-point",dollars(noi/.05),dollars(noi/.06),dollars(50000/.055),dollars((noi-30000)/.055)])expect(text).not.toContain(reserved);
  });
});
