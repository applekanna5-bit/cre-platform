import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleRoute, buildCatalog, isRenderable, resolveRelationships } from "@/content/catalog";
import { compileArticle } from "@/content/compile";
import { projectDeliveryCatalog } from "@/content/delivery";
import { discoverContent } from "@/content/discovery";
import { parseArticleMetadata, parseSources } from "@/content/validation";

const packet = "docs/editorial-ux/wp04a";

describe("WP04A editorial packet", () => {
  it("compiles the five drafts and resolves their reading relationships without changing public delivery", async () => {
    const base = await discoverContent("content");
    const documents = [];
    for (const domain of ["learn", "financing"]) {
      const folder = join(packet, domain);
      const files = await readdir(folder);
      expect(files.filter(file => file.endsWith(".mdx")).map(file => file.replace(/\.mdx$/, ".json")).sort()).toEqual(
        files.filter(file => file.endsWith(".json")).sort(),
      );
      for (const file of files.filter(file => file.endsWith(".json"))) {
        const sidecar = join(folder, file);
        const metadata = parseArticleMetadata(JSON.parse(await readFile(sidecar, "utf8")), sidecar);
        expect(metadata.domain).toBe(domain);
        expect(metadata.slug + ".json").toBe(file);
        expect(metadata.status).toBe("draft");
        expect(metadata.developmentFixture).toBe(false);
        expect(metadata.reviewer).toBeUndefined();
        expect(metadata.lastReviewedDate).toBeUndefined();
        expect(metadata.publishedDate).toBeUndefined();
        const body = await readFile(sidecar.replace(/\.json$/, ".mdx"), "utf8");
        documents.push({ metadata, body });
      }
    }

    expect(documents.map(doc => doc.metadata.id).sort()).toEqual(["WP04A-01", "WP04A-02", "WP04A-03", "WP04A-04", "WP04A-05"]);
    const sources = parseSources(JSON.parse(await readFile(join(packet, "source-records.json"), "utf8")));
    expect(sources.every(source => source.url && source.accessedDate && !source.reviewedDate)).toBe(true);
    const combined = buildCatalog(
      [...base.documents.map(doc => doc.metadata), ...documents.map(doc => doc.metadata)],
      [...base.catalog.sources, ...sources], base.catalog.knowledge, base.catalog.cases,
    );

    const publicLinks = new Set<string>();
    for (const { metadata, body } of documents) {
      const article = combined.articles.find(item => item.id === metadata.id)!;
      expect(isRenderable(article, true, true)).toBe(false);
      const compiled = await compileArticle(body, article, combined);
      expect(compiled.headings.length).toBeGreaterThan(0);
      for (const relation of resolveRelationships(article, combined)) {
        if (relation.target.id.startsWith("WP04A-")) expect(relation.href).toBeUndefined();
        else if (relation.href) publicLinks.add(relation.href);
      }
    }

    const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
    const original = projectDeliveryCatalog(base.catalog, mode);
    expect(original.articles).toHaveLength(8);
    expect(projectDeliveryCatalog(combined, mode)).toEqual(original);
    expect([...publicLinks].sort()).toEqual(original.articles.map(articleRoute).sort());
  });
});
