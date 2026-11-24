import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { assertPublicSource } from "../scripts/public-source.mts";
import { generateContent } from "../scripts/content.mts";
import { discoverContent } from "@/content/discovery";
import { compileArticle } from "@/content/compile";
import { isPubliclyReadable } from "@/content/catalog";
import { parseArticleMetadata } from "@/content/validation";
import { projectDeliveryCatalog } from "@/content/delivery";

const discovered = await discoverContent(path.resolve("content"));
describe("reviewed public-source build boundary", () => {
  it("accepts only the thirteen release article pairs and public supporting records", async () => {
    await expect(assertPublicSource(process.cwd())).resolves.toBeUndefined();
    expect(discovered.documents).toHaveLength(13);
    expect(discovered.catalog.articles.every(isPubliclyReadable)).toBe(true);
    expect(discovered.catalog.sources).toHaveLength(20);
    expect(discovered.catalog.knowledge).toHaveLength(0);
    expect(discovered.catalog.cases).toHaveLength(1);
    expect(projectDeliveryCatalog(discovered.catalog, { fixturesEnabled: false, editorialPreviewEnabled: false })).toEqual(discovered.catalog);
  });
  it.each(["added", "changed", "missing"])("rejects %s content before compilation", async mutation => {
    const root = await mkdtemp(path.join(tmpdir(), "cre-public-source-"));
    try {
      await mkdir(path.join(root, "content")); await mkdir(path.join(root, "scripts"));
      const body = "reviewed public bytes";
      await writeFile(path.join(root, "content/public.mdx"), body);
      await writeFile(path.join(root, "scripts/public-content.json"), JSON.stringify({ "content/public.mdx": createHash("sha256").update(body).digest("hex") }));
      await assertPublicSource(root);
      if (mutation === "added") await writeFile(path.join(root, "content/extra.mdx"), "unexpected");
      if (mutation === "changed") await writeFile(path.join(root, "content/public.mdx"), "different");
      if (mutation === "missing") await rm(path.join(root, "content/public.mdx"));
      await expect(assertPublicSource(root)).rejects.toThrow("inventory");
    } finally {
      if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith("cre-public-source-")) throw new Error("Unsafe cleanup");
      await rm(root, { recursive: true, force: true });
    }
  });
  it.each([[true, false, false], [false, true, false], [false, false, true]])("rejects every private generation mode %#", async (fixtures, editorial, date) => {
    await expect(generateContent(fixtures, editorial, date)).rejects.toThrow("unavailable");
  });
  it("rejects missing public relationship targets", () => {
    const broken = structuredClone(discovered.catalog); broken.cases = [];
    expect(() => projectDeliveryCatalog(broken, { fixturesEnabled: false, editorialPreviewEnabled: false })).toThrow("nonpublic");
  });
  it.each(discovered.documents.map(d => [d.metadata.id, d] as const))("compiles the approved %s body with a heading outline", async (_id, doc) => {
    const article = discovered.catalog.articles.find(a => a.id === doc.metadata.id)!;
    const result = await compileArticle(doc.body, article, discovered.catalog, doc.file);
    expect(result.code).toBeTruthy(); expect(result.headings.length).toBeGreaterThan(0);
  });
  it.each(["import X from 'remote'", "## Heading\n\n{process.env.SECRET}", "## Heading\n\n<Unknown />", "## Heading\n\n[link](javascript:alert)"])("rejects executable or unsafe MDX %#", async body => {
    await expect(compileArticle(body, discovered.catalog.articles[0], discovered.catalog)).rejects.toThrow();
  });
  it("rejects invalid metadata and synthetic support for public articles", () => {
    expect(() => parseArticleMetadata({ ...discovered.documents[0].metadata, domain: "invalid" }, "unit")).toThrow();
  });
});
