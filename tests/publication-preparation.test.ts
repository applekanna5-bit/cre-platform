import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/site-footer";
import { catalog } from "@/content/.generated";
import * as publication from "@/content/publication";
import type { PublicArticle } from "@/content/publication";
import { discoverContent } from "@/content/discovery";
import { parseArticleMetadata } from "@/content/validation";
import path from "node:path";
const { documents } = await discoverContent(path.resolve("content"));
const ids=["phase2a-gpr-egi","CRE-018","CRE-025"];
afterEach(()=>vi.restoreAllMocks());
describe("eight-article publication preparation",()=>{
  it("counts the eight intended public articles while excluding fixture content",()=>{
    const publicIds=publication.publicArticles(catalog).map(a=>a.id).sort();
    expect(publicIds).toEqual(["CRE-006","CRE-007","CRE-008","CRE-011","CRE-015","CRE-018","CRE-025","phase2a-gpr-egi"]);
    const html=renderToStaticMarkup(createElement(SiteFooter));
    expect(html).toContain("8 published articles available in the library.");
    expect(html).not.toContain("9 published articles");
    for(const a of catalog.articles.filter(a=>!publicIds.includes(a.id))) {expect(html).not.toContain(a.title);expect(html).not.toContain(a.slug);}
  });
  it.each([0,1,8])("renders %i public-projection items without inventing review metadata",count=>{
    // Count-only presentation fixtures, not ArticleMetadata, not actual publication of the approved drafts.
    const display: PublicArticle[]=Array.from({length:count},(_,i)=>({kind:"article",id:`count-only-${i}`,href:`/content/underwriting/count-only-${i}`,title:"Count-only fixture",description:"Display-count test only",domain:"underwriting",contentType:"guide",difficulty:"foundational",topics:[],needsReview:false}));
    vi.spyOn(publication,"publicArticles").mockReturnValue(display);
    const html=renderToStaticMarkup(createElement(SiteFooter));
    expect(html).toContain(`${count} published ${count===1?"article":"articles"} available in the library.`);
    expect(html).not.toContain("count-only-");expect(html).toContain('href="/library"');
  });
  it("retains confirmed reviewer metadata and requires an actual publication date",()=>{
    for(const id of ids){const input=documents.find(d=>d.metadata.id===id)!.metadata;
      expect(input.author.name).toBe("The CRE Ledger Editorial Team");expect(input.status).toBe("published");
      expect(input.reviewer).toEqual({name:"The CRE Ledger Editorial Team"});expect(input.lastReviewedDate).toBe("2026-10-24");expect(input.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(()=>parseArticleMetadata({...input,publishedDate:undefined})).toThrow(/published content requires publishedDate/);
    }
  });
  it("retains all three exact owner-approved body hashes",async()=>{
    const hashes: Record<string,string>={"phase2a-gpr-egi":"dc1a51fdea80ebf471662fb73faccb9208e893bf67c0137d6cc7440e5bdad752","CRE-018":"b63d8d9c1b04a8887bf5d669e3e2758bc63f527a0e569fbf36ab2824f22869f1","CRE-025":"232b1f0f5a187340aa6342d6f46ea4bc3f59165ed5ded5f9cf74efb68e851577"};
    for(const [id,hash]of Object.entries(hashes)){const file=documents.find(d=>d.metadata.id===id)!.file;expect(createHash("sha256").update(await readFile(file)).digest("hex")).toBe(hash);}
  });
});
