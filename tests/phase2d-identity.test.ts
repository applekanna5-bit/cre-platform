import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { articleRoute, isRenderable, resolveRelationships } from "@/content/catalog";
import { publicArticles } from "@/content/publication";
import { loaders } from "@/content/.generated";
import { searchDocuments } from "@/content/.generated/search";
const {catalog,documents}=await discoverContent(path.resolve("content"));
const article=(id:string)=>catalog.articles.find(a=>a.id===id)!;
const body=(id:string)=>documents.find(d=>d.metadata.id===id)!.body;
const protectedHashes: Record<string,string>={
  "content/underwriting/debt-service-coverage-ratio-cre-underwriting.mdx": "232b1f0f5a187340aa6342d6f46ea4bc3f59165ed5ded5f9cf74efb68e851577",
  "content/underwriting/contract-rent-vs-market-rent.json": "a4c4edac1d2b1156afc89ed3f28278db73d300cddbb18a3da1209fe14b652c84",
  "content/underwriting/contract-rent-vs-market-rent.mdx": "83a8a46eccc06190ae430202d145e004a76fbed0f0994364063fd985b3a9d00c",
  "content/underwriting/cre-revenue-underwriting.json": "10d933468f62e0329510670b9150793e7fa069bede0498bd085d9e5055c287b3",
  "content/underwriting/cre-revenue-underwriting.mdx": "9e220e1e51b02b1ae5d3aa6053514ccc8a7a7c5d6a2ae43dc6076e9d7421ddcc",
  "content/underwriting/net-operating-income-underwritten-noi.json": "1bf84004abe6f1bc726bc7d5873b5a7bca9c844dc3a95999f58115211d894a61",
  "content/underwriting/net-operating-income-underwritten-noi.mdx": "19033267a382edec4e69f329ba1e5956584f00a14e458966189d58918decf56e",
  "content/underwriting/rent-roll-analysis.json": "a809c7c2f8235e35c9924180258ef9bc7d069b17e61f5ab7ab7153c865d9393c",
  "content/underwriting/rent-roll-analysis.mdx": "995f7ccaf61499a215a81f95870a5dee0ed54137191111b44a8e86540d72577b",
  "content/underwriting/t12-operating-statement.json": "eb262ddf5c4fa83c2470a9246f48f08e9d185d3bafcf39ad1b2d686570fd4b9c",
  "content/underwriting/t12-operating-statement.mdx": "99e4e9b045058217d0a85108b7255cdcb4c4b555c7ed5512f87b1c2afc1b2dd0"
};
const ids=["phase2a-gpr-egi","CRE-018","CRE-025"];
describe("Phase 2D approved identity and curriculum",()=>{
  it("adopts the approved GPI title and slug while preserving the stable ID",()=>{
    expect(article(ids[0])).toMatchObject({title:"Gross Potential Income vs. Effective Gross Income in CRE Underwriting",slug:"gross-potential-income-effective-gross-income",id:"phase2a-gpr-egi"});
    expect(articleRoute(article(ids[0]))).toBe("/content/underwriting/gross-potential-income-effective-gross-income");
    expect(catalog.articles.some(a=>a.slug==="gross-potential-rent-effective-gross-income")).toBe(false);
    expect(body(ids[0]).startsWith("Gross potential income and effective gross income")).toBe(true);
  });
  it("distinguishes a conceptual GPI identity from the partial worked revenue bridge",()=>{
    const text=body(ids[0]);
    expect(text).toContain("does not calculate a complete PGI/GPI subtotal");expect(text).toContain("does not separately calculate potential other income or a PGI/GPI subtotal");expect(text).not.toContain("$1,860,000");
    expect(text.indexOf("Potential gross income (PGI)")).toBeLessThan(text.indexOf("**Gross potential rent (GPR)**"));
    expect(text).toContain('result="$1,743,000/year"');
  });
  it("sets CRE-018 fundamentals and excludes the reserved quantitative sensitivity material",()=>{
    expect(article("CRE-018").title).toBe("Capitalization Rate and Property Valuation — Fundamentals");
    const text=body("CRE-018");for(const phrase of ["direct capitalization", "Cedar Court is stabilized", "one illustrative property value", "## Calculate the illustrative value", "income definition must match the rate basis"])expect(text).toContain(phrase);
    expect(text).toContain("valuation sensitivity and advanced valuation judgment are reserved for a separate advanced article");
    for(const advanced of ["Holding NOI unchanged:","50-basis-point","$20,916,000","$17,430,000","$18,469,091","$909,091"])expect(text).not.toContain(advanced);
    expect(text).toContain('result="$19,014,545, rounded to the nearest USD"');
  });
  it("updates only the approved curriculum entries without creating CRE-019 content",async()=>{
    const registry=await readFile("docs/launch-content-registry.md","utf8");
    expect(registry).toContain("| CRE-018 | Capitalization Rate and Property Valuation — Fundamentals |");
    expect(registry).toContain("| CRE-019 | Market-Derived Capitalization Rates and Valuation Sensitivity |");
    expect(catalog.articles.some(a=>a.id==="CRE-019")).toBe(false);
    expect(catalog.articles).toHaveLength(9);
  });
  it("pins unchanged published pairs and all three approved article bodies",async()=>{
    for(const [file,hash]of Object.entries(protectedHashes))expect(createHash("sha256").update(await readFile(file)).digest("hex"),file).toBe(hash);
  });
  it("resolves every stable-ID relationship and links published article relationships",()=>{
    for(const a of catalog.articles)expect(()=>resolveRelationships(a,catalog)).not.toThrow();
    const refs=catalog.articles.flatMap(a=>a.relationships).filter(r=>r.target.id===ids[0]);expect(refs).toHaveLength(2);
    for(const id of ids)for(const relation of resolveRelationships(article(id),catalog).filter(r=>ids.includes(r.target.id)))expect(relation.href).toBe(articleRoute(article(relation.target.id)));
    expect(new Set(catalog.articles.map(a=>a.id.toLowerCase())).size).toBe(catalog.articles.length);expect(new Set(catalog.articles.map(articleRoute)).size).toBe(catalog.articles.length);
  });
  it("retains valid publication metadata and the eight-article public projection",()=>{
    for(const id of ids){const a=article(id);expect(a.status).toBe("published");expect(a.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(a.reviewer).toEqual({name:"The CRE Ledger Editorial Team"});expect(a.lastReviewedDate).toBe("2026-10-24");for(const f of [false,true])for(const p of [false,true])expect(isRenderable(a,f,p)).toBe(true);expect(loaders[id]).toBeDefined();}
    const published=["CRE-006","CRE-007","CRE-008","CRE-011","CRE-015","CRE-018","CRE-025","phase2a-gpr-egi"];expect(publicArticles(catalog).map(a=>a.id).sort()).toEqual(published);expect(searchDocuments.map(a=>a.id).sort()).toEqual(published);
    for(const id of ids){expect(JSON.stringify(publicArticles(catalog))).toContain(article(id).slug);expect(JSON.stringify(searchDocuments)).toContain(article(id).title);}
  });
});
