import path from "node:path";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { articleRoute, isRenderable, resolveRelationships } from "@/content/catalog";
import { publicArticles } from "@/content/publication";
import { loaders } from "@/content/.generated";
import { searchDocuments } from "@/content/.generated/search";
const { catalog, documents } = await discoverContent(path.resolve("content"));
const ids = ["phase2a-gpr-egi", "CRE-018", "CRE-025"];
const article = (id: string) => catalog.articles.find(a=>a.id===id)!;
const body = (id: string) => documents.find(d=>d.metadata.id===id)!.body;
const originalFinancialPanels: Record<string, string[]> = {
  "content/underwriting/gross-potential-rent-effective-gross-income.mdx": [
    "<Formula formula=\"Annual GPR = apartment count × monthly rent per apartment × 12 months\" variables={[{symbol: \"Apartment count\", meaning: \"100 units\"}, {symbol: \"Monthly rent\", meaning: \"1,500 USD per unit per month\"}]} interpretation=\"Units and months cancel, leaving USD per year. This deliberately simplified schedule has no lease rollover or rent-regulation effects.\" />",
    "<Calculation inputs={[{label: \"Annual GPR\", value: \"$1,800,000/year\"}, {label: \"Vacancy / concessions / credit loss\", value: \"$90,000 / $18,000 / $9,000 per year\"}, {label: \"Other income, already net\", value: \"$60,000/year\"}]} formula=\"EGI = $1,800,000 − $90,000 − $18,000 − $9,000 + $60,000\" result=\"$1,743,000/year\" interpretation=\"Rental losses total $117,000, or 6.50% of rental GPR. Adding net other income narrows the difference between rental GPR and total EGI; it does not eliminate the rental losses.\" />"
  ],
  "content/underwriting/capitalization-rate-property-valuation.mdx": [
    "<Formula formula=\"Capitalization rate = annual NOI ÷ property value; illustrative value = annual NOI ÷ capitalization rate\" variables={[{symbol: \"Annual NOI\", meaning: \"USD per year, using a stated expense and reserve convention\"}, {symbol: \"Property value\", meaning: \"USD at the stated valuation date\"}, {symbol: \"Capitalization rate\", meaning: \"Annual income-to-value rate, entered as a decimal\"}]} interpretation=\"Annual income divided by an annual capitalization rate produces USD of value, not USD per year. The ratio alone does not establish an appropriate market rate.\" />",
    "<Calculation inputs={[{label: \"Annual EGI\", value: \"$1,743,000/year\"}, {label: \"Assumed annual operating expenses\", value: \"$697,200/year\"}]} formula=\"Annual NOI = $1,743,000 − $697,200\" result=\"$1,045,800/year\" interpretation=\"This NOI convention is before replacement reserves. Any market-derived rate must use a compatible income definition before it can support a valuation analysis.\" />",
    "<Calculation inputs={[{label: \"Annual stated NOI\", value: \"$1,045,800/year\"}, {label: \"Illustrative annual cap rate\", value: \"5.50% (0.055)\"}]} formula=\"Illustrative value = $1,045,800 ÷ 0.055\" result=\"$19,014,545, rounded to the nearest USD\" interpretation=\"This is a scenario indication under stated assumptions, not an appraisal, transaction-price forecast or lending decision.\" />"
  ],
  "content/underwriting/debt-service-coverage-ratio-cre-underwriting.mdx": [
    "<Formula formula=\"DSCR = defined annual property cash flow ÷ defined annual debt service\" variables={[{symbol: \"Annual property cash flow\", meaning: \"USD per year, using the applicable NOI or underwritten NCF convention\"}, {symbol: \"Annual debt service\", meaning: \"USD per year for the same debt obligations and measurement period\"}, {symbol: \"DSCR\", meaning: \"Dimensionless coverage multiple, conventionally shown with x\"}]} interpretation=\"USD/year divided by USD/year cancels to a multiple. A 1.00x result means the defined numerator exactly equals the defined debt-service requirement; it does not prove that every cash need is funded.\" />",
    "<Calculation inputs={[{label: \"Stated pre-reserve NOI\", value: \"$1,045,800/year\"}, {label: \"Assumed replacement reserve\", value: \"$30,000/year\"}]} formula=\"Illustrative underwritten NCF = $1,045,800 − $30,000\" result=\"$1,015,800/year\" interpretation=\"This explicit convention is not an assertion of the complete Fannie Mae, Freddie Mac or other lender definition of NCF. A real framework may require different adjustments and supporting evidence.\" />",
    "<Formula formula=\"Monthly payment = L × i ÷ [1 − (1 + i)^(−n)]; annual debt service = 12 × monthly payment\" variables={[{symbol: \"L\", meaning: \"10,000,000 USD original principal\"}, {symbol: \"i\", meaning: \"0.06 / 12 = 0.005 per month\"}, {symbol: \"n\", meaning: \"360 monthly amortization payments, not the 60-month loan term\"}]} interpretation=\"Assumes a positive fixed rate and level monthly principal-and-interest payments, without payment holidays, fees or alternative day-count adjustments. Use unrounded amounts for intermediate calculations.\" />",
    "<Calculation inputs={[{label: \"Defined annual NCF\", value: \"$1,015,800/year\"}, {label: \"Annual amortizing debt service\", value: \"$719,460.63/year, displayed rounded\"}]} formula=\"DSCR = $1,015,800 ÷ $719,460.63\" result=\"1.41x, rounded to two decimal places\" interpretation=\"Approximately $1.41 of this defined NCF for each $1.00 of scheduled annual debt service. This is an illustration, not a required or approved coverage level.\" />"
  ]
};
const existingSources = [
  {
    "id": "fixture-methodology",
    "title": "Synthetic methodology note for renderer verification",
    "publisher": "Fictional Demonstration Institution",
    "type": "editorial-research",
    "authority": "contextual",
    "reviewedDate": "2026-09-20",
    "effectiveDate": "2026-09-20",
    "updateSensitivity": "U1",
    "synthetic": true,
    "notes": "Synthetic development source only. No real lender, regulator, program requirement, or external authority is represented. The date exercises provenance display, not a substantive technical review."
  },
  {
    "id": "occ-cre-lending-2022",
    "title": "Commercial Real Estate Lending, Comptroller's Handbook, Version 2.0",
    "publisher": "Office of the Comptroller of the Currency",
    "url": "https://www.occ.treas.gov/publications-and-resources/publications/comptrollers-handbook/files/commercial-real-estate-lending/index-commercial-real-estate-lending.html",
    "type": "regulatory",
    "authority": "authoritative",
    "publicationDate": "2022-03-29",
    "accessedDate": "2026-10-03",
    "reviewedDate": "2026-10-03",
    "updateSensitivity": "U2",
    "synthetic": false,
    "notes": "Primary regulatory source for general CRE underwriting concepts, stabilized NOI, valuation/cash-flow analysis, debt yield, and the OCC convention for replacement reserves. Applies to OCC-supervised institutions; do not present it as a universal lender methodology."
  },
  {
    "id": "fannie-income-analysis-203",
    "title": "Section 203 — Income Analysis",
    "publisher": "Fannie Mae Multifamily Guide",
    "url": "https://mfguide.fanniemae.com/node/7526",
    "type": "official-primary",
    "authority": "authoritative",
    "accessedDate": "2026-10-03",
    "reviewedDate": "2026-10-03",
    "updateSensitivity": "U3",
    "synthetic": false,
    "notes": "Current public Fannie Mae multifamily income-analysis methodology reviewed for revenue, concessions, bad debt, other income, and line-by-line stabilized operating expenses. Program-specific requirements must be reverified before future substantive updates."
  },
  {
    "id": "fannie-underwritten-ncf-203-01",
    "title": "203.01 — Underwritten Net Cash Flow (Underwritten NCF)",
    "publisher": "Fannie Mae Multifamily Guide",
    "url": "https://mfguide.fanniemae.com/node/7531",
    "type": "official-primary",
    "authority": "authoritative",
    "accessedDate": "2026-10-03",
    "reviewedDate": "2026-10-03",
    "updateSensitivity": "U3",
    "synthetic": false,
    "notes": "Current public Fannie Mae guidance reviewed for objective measures, historical and anticipated operations, operating-statement/vacancy review, adjustment documentation, and the distinction between Underwritten NOI and Underwritten NCF. Program-specific requirements must be reverified before future substantive updates."
  },
  {
    "id": "fannie-lease-audit-401",
    "title": "Section 401 — Lease Audit",
    "publisher": "Fannie Mae",
    "url": "https://mfguide.fanniemae.com/fnmf-pdf/download/4036",
    "type": "official-primary",
    "authority": "authoritative",
    "effectiveDate": "2026-05-20",
    "accessedDate": "2026-10-04",
    "reviewedDate": "2026-10-04",
    "updateSensitivity": "U3",
    "synthetic": false,
    "notes": "Current public Fannie Mae lease-audit guidance used narrowly for rent-roll-to-lease reconciliation, lease review sample requirements, and inclusion of new/recently renewed leases to verify rent trends. Verify the live repository does not already contain an equivalent canonical source before adding."
  },
  {
    "id": "freddie-appraisal-checklist-2026",
    "title": "Multifamily Underwriting Appraisal Checklist",
    "publisher": "Freddie Mac Multifamily",
    "url": "https://mf.freddiemac.com/docs/mf_underwriting_appraisal_checklist.pdf",
    "type": "official-primary",
    "authority": "authoritative",
    "publicationDate": "2026-02-01",
    "accessedDate": "2026-10-04",
    "reviewedDate": "2026-10-04",
    "updateSensitivity": "U3",
    "synthetic": false,
    "notes": "February 2026 public checklist used narrowly for the example that market rents by unit type should be supported by recent subject leasing, including leases commencing within 90 days of the effective date of value. Verify the live repository does not already contain an equivalent canonical source before adding."
  }
];
describe("Phase 2C bounded editorial corrections", () => {
  it("preserves every existing source record and adds only the attributed BOE reference", () => {
    expect(catalog.sources.slice(0,existingSources.length)).toEqual(existingSources);
    expect(catalog.sources).toHaveLength(existingSources.length+1);
    const boe=catalog.sources.at(-1)!;
    expect(boe).toMatchObject({id:"boe-income-stream-lesson7",publisher:"California State Board of Equalization",url:"https://www.boe.ca.gov/info/iav/lesson7.htm",type:"government",authority:"supporting",accessedDate:"2026-10-24"});
    expect(boe.reviewedDate).toBeUndefined(); expect(boe.effectiveDate).toBeUndefined(); expect(boe.publicationDate).toBeUndefined();
    expect(article(ids[0]).sources.map(s=>s.id)).toEqual(["occ-cre-lending-2022","boe-income-stream-lesson7"]);
    for(const id of ids.slice(1))expect(article(id).sources.map(s=>s.id)).toEqual(["occ-cre-lending-2022"]);
  });
  it("clarifies rental and total income without manufacturing a potential-other-income subtotal", () => {
    const text=body(ids[0]);
    for(const term of ["rental-only", "Potential gross income (PGI)", "gross potential income (GPI)", "effective rental income", "EGI"])expect(text).toContain(term);
    expect(text).toContain("does not separately calculate potential other income or a PGI/GPI subtotal");
    expect(text).toContain("not net of the property's operating expenses"); expect(text).not.toContain("$1,860,000");
  });
  it("states foundational scope, stabilization and a positive-rate domain without market conclusions", () => {
    const text=body("CRE-018");
    for(const phrase of ["foundational explanation", "Cedar Court is stabilized", "no market suitability has been established", "Division by a zero rate is undefined", "income definition must match the rate basis"])expect(text).toContain(phrase);
    expect(text).toContain("Selecting a market-derived rate from comparable transactions requires separate evidence");
  });
  it("includes the existing reserve in sizing and attributes the NOI to the correct example", () => {
    const text=body("CRE-025");
    expect(text).toContain("numerator already deducts the assumed $30,000 annual replacement reserve");
    expect(text).toContain("additional reserve or escrow requirements");expect(text).toContain("cap-rate example's **pre-reserve NOI");
    expect(text).not.toContain("It ignores other binding limits, fees, reserves");
    expect(text).toContain("not an assertion of the complete Fannie Mae, Freddie Mac or other lender definition of NCF");
  });
  it("preserves the exact pre-correction Formula and Calculation panels", async () => {
    for(const [file,panels] of Object.entries(originalFinancialPanels)){
      const text=await readFile(file,"utf8");expect(text.match(/<(?:Formula|Calculation)\b[\s\S]*?\/>/g)).toEqual(panels);
    }
  });
  it("preserves approved copy and validates the three published articles", async () => {
    for(const id of ids){const a=article(id),text=body(id);
      expect(text).not.toMatch(/CRE-\d{3}|unapproved draft|Human CRE and source review|requires human editorial/);
      expect(text).toContain("fictional");expect(a.status).toBe("published");expect(a.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(a.reviewer).toEqual({name:"The CRE Ledger Editorial Team"});expect(a.lastReviewedDate).toBe("2026-10-24");
      for(const f of [false,true])for(const p of [false,true])expect(isRenderable(a,f,p)).toBe(true);
      expect(loaders[id]).toBeDefined();await expect(compileArticle(text,a,catalog)).resolves.toBeDefined();
    }
    expect(publicArticles(catalog).map(a=>a.id).sort()).toEqual(["CRE-006","CRE-007","CRE-008","CRE-011","CRE-015","CRE-018","CRE-025","phase2a-gpr-egi"]);
    expect(searchDocuments.map(a=>a.id).sort()).toEqual(["CRE-006","CRE-007","CRE-008","CRE-011","CRE-015","CRE-018","CRE-025","phase2a-gpr-egi"]);
  });
  it("retains approved reference identities, unique routes and published article cross-links", () => {
    const expected=[['phase2a-gpr-egi','gross-potential-income-effective-gross-income'],['CRE-018','capitalization-rate-property-valuation'],['CRE-025','debt-service-coverage-ratio-cre-underwriting']];
    for(const [id,slug]of expected){expect(article(id).slug).toBe(slug);expect(articleRoute(article(id))).toBe('/content/underwriting/'+slug);}
    expect(new Set(catalog.articles.map(a=>a.id.toLowerCase())).size).toBe(catalog.articles.length);
    expect(new Set(catalog.articles.map(articleRoute)).size).toBe(catalog.articles.length);
    for(const id of ids)expect(resolveRelationships(article(id),catalog).filter(r=>ids.includes(r.target.id)).every(r=>Boolean(r.href))).toBe(true);
  });
});
