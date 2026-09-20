import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { buildCatalog } from "./catalog.ts";
import { parseArticleMetadata, parseCases, parseKnowledge, parseSources } from "./validation.ts";
import type { ArticleInput } from "./contracts.ts";

export interface DiscoveredArticle { file: string; body: string; metadata: ArticleInput }
async function json(file: string): Promise<unknown> {
  try { return JSON.parse(await readFile(file, "utf8")); } catch (error) { throw new Error(`${file}: invalid or missing JSON`, { cause: error }); }
}
async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`${file}: content symlinks are not supported`);
    if (entry.isDirectory()) files.push(...await walk(file)); else files.push(file);
  }
  return files;
}
export async function discoverContent(root: string) {
  const files = await walk(root);
  const documents: DiscoveredArticle[] = [];
  for (const file of files.filter(file => file.endsWith(".mdx"))) {
    const metadata = parseArticleMetadata(await json(file.replace(/\.mdx$/, ".json")), file);
    if (path.relative(root, file).split(path.sep)[0] !== metadata.domain) throw new Error(`${file}: directory must match metadata domain`);
    const body = await readFile(file, "utf8");
    if (!body.trim()) throw new Error(`${file}: editorial body cannot be empty`);
    documents.push({ file, body, metadata });
  }
  for (const file of files.filter(file => file.endsWith(".json") && !path.relative(root, file).startsWith(`data${path.sep}`))) {
    if (!files.includes(file.replace(/\.json$/, ".mdx"))) throw new Error(`${file}: orphan metadata without MDX`);
  }
  const [sources, knowledge, cases] = await Promise.all([
    json(path.join(root, "data", "sources.json")).then(parseSources),
    json(path.join(root, "data", "knowledge.json")).then(parseKnowledge),
    json(path.join(root, "data", "cases.json")).then(parseCases),
  ]);
  return { documents, catalog: buildCatalog(documents.map(doc => doc.metadata), sources, knowledge, cases) };
}
