import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleRoute, buildCatalog, isRenderable, resolveRelationships } from "@/content/catalog";
import { compileArticle } from "@/content/compile";
import { projectDeliveryCatalog } from "@/content/delivery";
import { discoverContent } from "@/content/discovery";
import { parseArticleMetadata, parseSources } from "@/content/validation";

const packet = "docs/editorial-ux/wp04b";
const domain = "property-types";
const slugs = ["affordable-housing", "conventional-multifamily", "manufactured-housing-communities"];

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

describe("WP04B property types drafts", () => {
  it("validates each MDX pair and its sources and keeps public delivery unchanged", async () => {
    const folder = join(packet, domain);
    const files = await readdir(folder);
    expect(files.sort()).toEqual(slugs.flatMap(slug => [slug + ".json", slug + ".mdx"]).sort());
    const base = await discoverContent("content");
    const sources = parseSources(await readJson(join(packet, "source-records.json")));
    const drafts = await Promise.all(slugs.map(async slug => {
      const file = join(folder, slug + ".json");
      const metadata = parseArticleMetadata(await readJson(file), file);
      expect(metadata).toMatchObject({ slug, domain, status: "draft", developmentFixture: false });
      expect(metadata.reviewer).toBeUndefined();
      expect(metadata.lastReviewedDate).toBeUndefined();
      expect(metadata.publishedDate).toBeUndefined();
      return { metadata, body: await readFile(join(folder, slug + ".mdx"), "utf8") };
    }));
    const catalog = buildCatalog(
      [...base.documents.map(item => item.metadata), ...drafts.map(item => item.metadata)],
      [...base.catalog.sources, ...sources], base.catalog.knowledge, base.catalog.cases,
    );
    const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
    const publicCatalog = projectDeliveryCatalog(base.catalog, mode);
    const publicPaths = publicCatalog.articles.map(articleRoute);
    expect(publicPaths).toHaveLength(8);

    for (const { metadata, body } of drafts) {
      const article = catalog.articles.find(item => item.id === metadata.id)!;
      expect(isRenderable(article, true, true)).toBe(false);
      expect((await compileArticle(body, article, catalog)).headings.length).toBeGreaterThanOrEqual(4);
      const cited = [...body.matchAll(/<SourceNote sourceId="([^"]+)"/g)].map(match => match[1]);
      expect(new Set(cited)).toEqual(new Set(metadata.sourceIds));
      const links = resolveRelationships(article, catalog);
      expect(links.length).toBeGreaterThanOrEqual(4);
      expect(links.every(link => link.href && publicPaths.includes(link.href))).toBe(true);
    }

    expect(projectDeliveryCatalog(catalog, mode)).toEqual(publicCatalog);
  });
});
