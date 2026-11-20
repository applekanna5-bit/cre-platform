import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { Sources } from "@/components/content/primitives";
import { assertPublicSource } from "../scripts/public-source.mts";

// Approved production bytes; these are content-integrity pins, not UI snapshots.
const unchanged: Record<string, string> = {
  "content/data/cases.json": "d3eacd484e8b712bd56c9cf51b8bf1ff2ccdbd13e196618cd08694c1e02f4183",
  "content/data/knowledge.json": "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570",
  "content/underwriting/capitalization-rate-property-valuation.json": "b63ec624fea79c1633bc782419d5fee69e36191aa01782d2b634071918e2b6ee",
  "content/underwriting/capitalization-rate-property-valuation.mdx": "b63d8d9c1b04a8887bf5d669e3e2758bc63f527a0e569fbf36ab2824f22869f1",
  "content/underwriting/contract-rent-vs-market-rent.json": "a4c4edac1d2b1156afc89ed3f28278db73d300cddbb18a3da1209fe14b652c84",
  "content/underwriting/contract-rent-vs-market-rent.mdx": "83a8a46eccc06190ae430202d145e004a76fbed0f0994364063fd985b3a9d00c",
  "content/underwriting/debt-service-coverage-ratio-cre-underwriting.json": "67de1bb6eb2cb3787a6b6461021783e9077706f41263bf378222552adbc5f754",
  "content/underwriting/debt-service-coverage-ratio-cre-underwriting.mdx": "232b1f0f5a187340aa6342d6f46ea4bc3f59165ed5ded5f9cf74efb68e851577",
  "content/underwriting/gross-potential-rent-effective-gross-income.json": "19fa8e10c438cbb9006806fb96a8cd8802c0d70db8fbb5349d83e4ac56c40e9b",
  "content/underwriting/gross-potential-rent-effective-gross-income.mdx": "dc1a51fdea80ebf471662fb73faccb9208e893bf67c0137d6cc7440e5bdad752",
  "content/underwriting/net-operating-income-underwritten-noi.json": "1bf84004abe6f1bc726bc7d5873b5a7bca9c844dc3a95999f58115211d894a61",
  "content/underwriting/net-operating-income-underwritten-noi.mdx": "19033267a382edec4e69f329ba1e5956584f00a14e458966189d58918decf56e",
  "content/underwriting/rent-roll-analysis.json": "a809c7c2f8235e35c9924180258ef9bc7d069b17e61f5ab7ab7153c865d9393c",
  "content/underwriting/rent-roll-analysis.mdx": "995f7ccaf61499a215a81f95870a5dee0ed54137191111b44a8e86540d72577b",
  "content/underwriting/t12-operating-statement.json": "eb262ddf5c4fa83c2470a9246f48f08e9d185d3bafcf39ad1b2d686570fd4b9c",
  "content/underwriting/t12-operating-statement.mdx": "99e4e9b045058217d0a85108b7255cdcb4c4b555c7ed5512f87b1c2afc1b2dd0"
};
const original = {
  sources: "4a2b0db7fb693858c69fe67f96dea49642fd89aaad4243ab102c4000db4728e1",
  revenue: "9e220e1e51b02b1ae5d3aa6053514ccc8a7a7c5d6a2ae43dc6076e9d7421ddcc",
  metadata: "10d933468f62e0329510670b9150793e7fa069bede0498bd085d9e5055c287b3",
};
const instruction = "Verify the live repository does not already contain an equivalent canonical source before adding.";
const retainedNotes = [
  "Current public Fannie Mae lease-audit guidance used narrowly for rent-roll-to-lease reconciliation, lease review sample requirements, and inclusion of new/recently renewed leases to verify rent trends.",
  "February 2026 public checklist used narrowly for the example that market rents by unit type should be supported by recent subject leasing, including leases commencing within 90 days of the effective date of value.",
];
const before = "> **The adjustment is derived from the evidence; the recent run rate is then used to test whether the conclusion makes sense\u2014not to manufacture the conclusion.**";
const after = "> **These amounts are fictional analyst judgments. The recent run rate is a reasonableness check, not an independent derivation of their size.**";
const clarification = "*Clarification (2026-11-18): The rental improvement and concession/collection offset are fictional analyst judgments. Figures and calculations are unchanged.*";
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const { catalog, documents } = await discoverContent(path.resolve("content"));

describe("M3.34 approved launch corrections", () => {
  it("preserves all 16 unapproved-for-change protected files byte for byte", async () => {
    expect(Object.keys(unchanged)).toHaveLength(16);
    for (const [file, sha] of Object.entries(unchanged)) expect(hash(await readFile(file)), file).toBe(sha);
  });
  it("changes only the two approved source-note sentences, retaining every provenance field and source ID", async () => {
    let restored = await readFile("content/data/sources.json", "utf8");
    expect(restored).not.toContain(instruction);
    for (const note of retainedNotes) {
      expect(restored.split(note)).toHaveLength(2);
      restored = restored.replace(note, `${note} ${instruction}`);
    }
    expect(hash(restored)).toBe(original.sources);
    expect(catalog.sources).toHaveLength(6);
    expect(catalog.sources.map(s => s.id)).toEqual(["occ-cre-lending-2022", "fannie-income-analysis-203", "fannie-underwritten-ncf-203-01", "fannie-lease-audit-401", "freddie-appraisal-checklist-2026", "boe-income-stream-lesson7"]);
  });
  it.each(["rent-roll-analysis", "contract-rent-vs-market-rent"])("renders clean reader notes and original citation identities for %s", slug => {
    const article = catalog.articles.find(a => a.slug === slug)!;
    const html = renderToStaticMarkup(createElement(Sources, { sources: article.sources }));
    expect(html).not.toContain(instruction);
    for (const source of article.sources) {
      expect(html).toContain(`id="source-${source.id}"`);
      expect(html).toContain(source.publisher.replaceAll("&", "&amp;"));
      expect(html).toContain(source.url);
    }
    for (const source of article.sources.filter(s => ["fannie-lease-audit-401", "freddie-appraisal-checklist-2026"].includes(s.id))) expect(html).toContain(source.notes);
  });
  it("preserves the entire Revenue article except the exact approved blockquote and dated clarification note", async () => {
    const body = await readFile("content/underwriting/cre-revenue-underwriting.mdx", "utf8");
    expect(body.split(after)).toHaveLength(2); expect(body).not.toContain(before);
    expect(body.split(clarification)).toHaveLength(2);
    const newline = body.includes("\r\n") ? "\r\n" : "\n";
    expect(body.endsWith(newline + clarification + newline)).toBe(true);
    const restored = body.slice(0, -(newline + clarification + newline).length).replace(after, before);
    expect(hash(restored)).toBe(original.revenue);
  });
  it("compiles the clarification without changing the financial explanation or source references", async () => {
    const doc = documents.find(d => d.metadata.slug === "cre-revenue-underwriting")!;
    const article = catalog.articles.find(a => a.id === doc.metadata.id)!;
    const compiled = await compileArticle(doc.body, article, catalog, doc.file);
    expect(compiled.code).toContain("These amounts are fictional analyst judgments.");
    expect(compiled.code).toContain("Clarification (2026-11-18)");
    expect(doc.body).toContain("$60,000"); expect(doc.body).toContain("$35,000");
    // The inverse byte-hash test above covers every original formula, table reference and figure.
  });
  it("records the actual implementation date while preserving publication, review and all other metadata", async () => {
    const raw = await readFile("content/underwriting/cre-revenue-underwriting.json", "utf8");
    const article = JSON.parse(raw);
    expect(article.updatedDate).toBe("2026-11-18");
    expect(article.publishedDate).toBe("2026-10-04");
    expect(article.lastReviewedDate).toBe("2026-10-04");
    expect(hash(raw.replace(/^  "updatedDate": "2026-11-18",\r?\n/m, ""))).toBe(original.metadata);
  });
  it("retains every historical author/reviewer record and the authorised named reviewer", () => {
    const legacy = "CRE Knowledge Platform Editorial Team", review = "CRE Knowledge Platform Editorial Review", current = "The CRE Ledger Editorial Team";
    const expected: Record<string, [string, string]> = {
      "t12-operating-statement": [legacy, review], "rent-roll-analysis": [legacy, review], "cre-revenue-underwriting": [legacy, review],
      "net-operating-income-underwritten-noi": [legacy, "CRE Knowledge Platform Technical Review"],
      "contract-rent-vs-market-rent": [legacy, "Lanka Sudhakar"],
      "capitalization-rate-property-valuation": [current, current], "debt-service-coverage-ratio-cre-underwriting": [current, current], "gross-potential-income-effective-gross-income": [current, current],
    };
    expect(catalog.articles).toHaveLength(8);
    for (const article of catalog.articles) expect([article.author.name, article.reviewer?.name], article.slug).toEqual(expected[article.slug]);
  });
  it("retains the exact 19-file inventory and validates the approved candidate bytes", async () => {
    const manifest = JSON.parse(await readFile("scripts/public-content.json", "utf8"));
    expect(Object.keys(manifest).sort()).toEqual([...Object.keys(unchanged), "content/data/sources.json", "content/underwriting/cre-revenue-underwriting.mdx", "content/underwriting/cre-revenue-underwriting.json"].sort());
    for (const [file, sha] of Object.entries(unchanged)) expect(manifest[file]).toBe(sha);
    await expect(assertPublicSource(process.cwd())).resolves.toBeUndefined();
    expect(catalog.articles.every(a => a.status === "published")).toBe(true);
    expect(catalog.cases).toHaveLength(1); expect(catalog.knowledge).toHaveLength(0);
  });
  it.each(["added", "missing", "changed"])("still rejects %s unapproved protected source changes", async mutation => {
    const root = await mkdtemp(path.join(tmpdir(), "cre-m334-guard-"));
    try {
      await mkdir(path.join(root, "content")); await mkdir(path.join(root, "scripts"));
      const bytes = await readFile("content/data/sources.json");
      const file = path.join(root, "content/sources.json");
      await writeFile(file, bytes);
      await writeFile(path.join(root, "scripts/public-content.json"), JSON.stringify({ "content/sources.json": hash(bytes) }));
      await assertPublicSource(root);
      if (mutation === "added") await writeFile(path.join(root, "content/unapproved.mdx"), "Unapproved");
      if (mutation === "missing") await rm(file);
      if (mutation === "changed") await writeFile(file, bytes.toString().replace("Fannie Mae", "Unapproved publisher"));
      await expect(assertPublicSource(root)).rejects.toThrow("inventory");
    } finally {
      if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith("cre-m334-guard-")) throw new Error("Unsafe test cleanup");
      await rm(root, { recursive: true, force: true });
    }
  });
});
