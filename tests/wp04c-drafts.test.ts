import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleRoute, buildCatalog, isRenderable, resolveRelationships } from "@/content/catalog";
import { compileArticle } from "@/content/compile";
import { projectDeliveryCatalog } from "@/content/delivery";
import { discoverContent } from "@/content/discovery";
import { parseArticleMetadata, parseSources } from "@/content/validation";

const editorial = "docs/editorial-ux";
const packet = join(editorial, "wp04c");
const domain = "financing";

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

async function readDrafts(folder: string) {
  const files = await readdir(folder);
  const drafts = await Promise.all(files.filter(file => file.endsWith(".json")).map(async file => {
    const path = join(folder, file);
    const metadata = parseArticleMetadata(await readJson(path), path);
    expect(file).toBe(metadata.slug + ".json");
    const body = await readFile(join(folder, metadata.slug + ".mdx"), "utf8");
    return { metadata, body };
  }));
  expect(files.sort()).toEqual(drafts.flatMap(({ metadata }) =>
    [metadata.slug + ".json", metadata.slug + ".mdx"]).sort());
  return drafts;
}

describe("WP04C lifecycle drafts", () => {
  it("compiles each guide, resolves packet reading and preserves public delivery", async () => {
    const [base, learn, origination, property, drafts, sourceA, sourceB, sourceC] = await Promise.all([
      discoverContent("content"),
      readDrafts(join(editorial, "wp04a", "learn")),
      readDrafts(join(editorial, "wp04a", "financing")),
      readDrafts(join(editorial, "wp04b", "property-types")),
      readDrafts(join(packet, domain)),
      readJson(join(editorial, "wp04a", "source-records.json")),
      readJson(join(editorial, "wp04b", "source-records.json")),
      readJson(join(packet, "source-records.json")),
    ]);
    const prior = [...learn, ...origination, ...property];
    expect(prior).toHaveLength(8);
    expect(drafts.map(({ metadata }) => metadata.id).sort()).toEqual([
      "WP04C-01", "WP04C-02", "WP04C-03", "WP04C-04", "WP04C-05",
    ]);
    const sources = new Map(base.catalog.sources.map(source => [source.id, source]));
    for (const source of [...parseSources(sourceA), ...parseSources(sourceB), ...parseSources(sourceC)]) {
      expect(sources.has(source.id), source.id).toBe(false);
      sources.set(source.id, source);
    }
    const catalog = buildCatalog(
      [...base.documents, ...prior, ...drafts].map(({ metadata }) => metadata),
      [...sources.values()], base.catalog.knowledge, base.catalog.cases,
    );
    for (const { metadata } of [...prior, ...drafts]) {
      expect(metadata.status).toBe("draft");
      const article = catalog.articles.find(item => item.id === metadata.id)!;
      expect(isRenderable(article, true, true)).toBe(false);
    }
    const publicPaths = new Set(base.catalog.articles.filter(article => isRenderable(article)).map(articleRoute));
    for (const { metadata, body } of drafts) {
      expect(metadata).toMatchObject({ domain, developmentFixture: false });
      expect(metadata.reviewer).toBeUndefined();
      expect(metadata.lastReviewedDate).toBeUndefined();
      expect(metadata.publishedDate).toBeUndefined();
      const article = catalog.articles.find(item => item.id === metadata.id)!;
      expect((await compileArticle(body, article, catalog)).headings.length).toBeGreaterThanOrEqual(4);
      const citations = [...body.matchAll(/<SourceNote sourceId="([^"]+)"/g)].map(match => match[1]);
      expect(new Set(citations)).toEqual(new Set(metadata.sourceIds));
      const reading = resolveRelationships(article, catalog);
      expect(reading.some(link => link.target.id.startsWith("WP04C-") && !link.href)).toBe(true);
      expect(reading.some(link => link.href && publicPaths.has(link.href))).toBe(true);
    }
    const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
    const publicCatalog = projectDeliveryCatalog(base.catalog, mode);
    expect(publicCatalog.articles).toHaveLength(8);
    expect(projectDeliveryCatalog(catalog, mode)).toEqual(publicCatalog);
  });

  it("reconciles the fictional loan through credit, settlement and the first bill", () => {
    const principal = 5_000_000;
    const annualDebtService = 350_000;
    const cashFlow = 490_000;
    const stressedCashFlow = cashFlow - 105_000;
    expect(cashFlow / annualDebtService).toBe(1.4);
    expect(stressedCashFlow / annualDebtService).toBe(1.1);
    expect(cashFlow - annualDebtService).toBe(140_000);
    expect(stressedCashFlow - annualDebtService).toBe(35_000);
    expect((100 * principal / 7_800_000).toFixed(1)).toBe("64.1");

    const availableSupport = 2_400_000 - 500_000 - 700_000;
    expect(availableSupport).toBe(1_200_000);
    expect(availableSupport - 900_000).toBe(300_000);

    const roofEscrow = 120_000;
    const settlementUses = 8_000_000 + 80_000 + roofEscrow;
    expect(settlementUses).toBe(8_200_000);
    expect(settlementUses - principal).toBe(3_200_000);
    expect((annualDebtService / 12).toFixed(2)).toBe("29166.67");
    expect((annualDebtService / 12 + 2_000).toFixed(2)).toBe("31166.67");
  });
});
