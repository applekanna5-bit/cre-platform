import path from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { isRenderable, resolveRelationships } from "@/content/catalog";
import { publicArticles } from "@/content/publication";
import { loaders } from "@/content/.generated";
import { searchDocuments } from "@/content/.generated/search";
const { catalog, documents } = await discoverContent(path.resolve("content"));
const article = catalog.articles.find(a => a.id === "CRE-025")!;
const body = documents.find(d => d.metadata.id === "CRE-025")!.body;
const publicationIds = ["CRE-018", "phase2a-gpr-egi", "CRE-025"];
const usd = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
const fixed = (v: number) => v.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const approvedBodyHashes: Record<string,string> = {
  "content/underwriting/capitalization-rate-property-valuation.mdx": "b63d8d9c1b04a8887bf5d669e3e2758bc63f527a0e569fbf36ab2824f22869f1",
  "content/underwriting/gross-potential-rent-effective-gross-income.mdx": "dc1a51fdea80ebf471662fb73faccb9208e893bf67c0137d6cc7440e5bdad752",
  "content/underwriting/debt-service-coverage-ratio-cre-underwriting.mdx": "232b1f0f5a187340aa6342d6f46ea4bc3f59165ed5ded5f9cf74efb68e851577"
};
// Independent reference cash-flow/payment scenario; no new app calculator.
const egi = 100 * 1500 * 12 - 90000 - 18000 - 9000 + 60000;
const noi = egi - 697200, ncf = noi - 30000;
const principal = 10000000, rate = .06 / 12, months = 360;
const payment = principal * rate / (1 - Math.pow(1 + rate, -months));
const debtService = payment * 12;
describe("DSCR publication candidate", () => {
  it("includes the three approved articles in the nine-article public projection", () => {
    expect(catalog.articles.filter(a=>publicationIds.includes(a.id))).toHaveLength(3);
    for (const a of catalog.articles.filter(a=>publicationIds.includes(a.id))) {
      expect(a.status).toBe("published"); expect(a.developmentFixture).toBe(false); expect(a.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const fixtures of [false,true]) for (const preview of [false,true]) expect(isRenderable(a,fixtures,preview)).toBe(true);
      expect(loaders[a.id]).toBeDefined();
    }
    expect(publicArticles(catalog).map(a=>a.id).sort()).toEqual(["CRE-006","CRE-007","CRE-008","CRE-011","CRE-015","CRE-018","CRE-025","phase2a-gpr-egi"]);
    expect(searchDocuments.map(a=>a.id).sort()).toEqual(["CRE-006","CRE-007","CRE-008","CRE-011","CRE-015","CRE-018","CRE-025","phase2a-gpr-egi"]);
  });
  it("compiles registered MDX and resolves only available relationship links", async () => {
    expect(article.sources.map(s=>s.id)).toEqual(["occ-cre-lending-2022"]);
    await expect(compileArticle(body,article,catalog)).resolves.toBeDefined();
    const relations = resolveRelationships(article,catalog);
    expect(relations.find(x=>x.target.id==="CRE-015")?.href).toBe("/content/underwriting/net-operating-income-underwritten-noi");
    expect(relations.filter(x=>publicationIds.includes(x.target.id)).every(x=>Boolean(x.href))).toBe(true);
    expect(catalog.articles.filter(a=>publicArticles(catalog).some(p=>p.id===a.id)).flatMap(a=>resolveRelationships(a,catalog)).some(x=>x.target.id==="CRE-025")).toBe(false);
  });
  it("pins the approved article bodies and reviewer metadata without synthetic-date coupling", async () => {
    for (const [file,hash] of Object.entries(approvedBodyHashes)) expect(createHash("sha256").update(await readFile(file)).digest("hex")).toBe(hash);
    for (const id of publicationIds) { const item=catalog.articles.find(a=>a.id===id)!; expect(item.reviewer).toEqual({name:"The CRE Ledger Editorial Team"}); expect(item.lastReviewedDate).toBe("2026-10-24"); expect(item.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
  });
  it("reconciles annual NOI to the explicitly stated post-reserve NCF", () => {
    expect(egi).toBe(1743000); expect(noi).toBe(1045800); expect(ncf).toBe(1015800);
    expect(body).toContain('formula="Illustrative underwritten NCF = $1,045,800 − $30,000"');
    expect(body).toContain('result="$1,015,800/year"'); expect(body).toContain("Dimensionless coverage multiple");
    expect(body).toContain('DSCR = defined annual property cash flow ÷ defined annual debt service');
  });
  it("checks monthly amortization and annual units against an independent loan ledger", () => {
    let balance=principal, firstYear=0;
    for(let month=0;month<360;month++) { const interest=balance*rate; const repaid=payment-interest; balance-=repaid; if(month<12) firstYear+=interest+repaid; if(month===59) expect(balance).toBeGreaterThan(0); }
    expect(balance).toBeCloseTo(0,4); expect(firstYear).toBeCloseTo(debtService,6);
    expect(body).toContain("$"+fixed(payment)); expect(body).toContain("$"+fixed(debtService)+"/year");
    expect(body).toContain("360 monthly amortization payments, not the 60-month loan term");
  });
  it("checks authored base, NOI-based, interest-only and stressed coverage", () => {
    expect(body).toContain('result="'+(ncf/debtService).toFixed(2)+'x, rounded to two decimal places"');
    for(const ratio of [noi/debtService,ncf/600000,ncf*.9/debtService,ncf/(debtService*1.1),ncf*.9/(debtService*1.1)]) expect(body).toContain(ratio.toFixed(2)+"x");
    expect(body).toContain(usd(ncf*.9)+"/year"); expect(body).toContain("$"+fixed(debtService*1.1)+"/year");
    expect(ncf/600000).toBeGreaterThan(ncf/debtService);
  });
  it("checks debt yield and the explicitly fictional coverage sizing constraint", () => {
    expect(body).toContain((noi/principal*100).toFixed(3)+"%");
    expect(body).toContain(usd(ncf/1.25)+"/year"); expect(body).toContain(usd((ncf/1.25)/(debtService/principal))+" loan ceiling");
    expect(body).toContain("arbitrary educational target"); expect(body).toContain("no current minimum DSCR for any named lender");
  });
});
