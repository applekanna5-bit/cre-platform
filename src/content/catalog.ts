import type { ArticleInput, ArticleMetadata, ContentCatalog, ContentRelationship, ContentSource, EducationalCase, KnowledgeRecord } from "./contracts.ts";

export function articleRoute(article: Pick<ArticleMetadata, "domain" | "slug">): string {
  return `/content/${article.domain}/${article.slug}`;
}
export function isPublicArticle(article: ArticleMetadata): boolean {
  return !article.developmentFixture && (article.status === "published" || (article.status === "needs-review" && !!article.publishedDate));
}
export function isRenderable(article: ArticleMetadata, fixtures = false): boolean {
  return isPublicArticle(article) || (fixtures && article.developmentFixture && article.status === "draft");
}
export function isEditoriallyProtected(status: ArticleMetadata["status"]): boolean {
  return ["ready", "approved", "published", "needs-review", "archived"].includes(status);
}
/** M1B untyped relationships retain a documented default purpose. */
export function relationshipsFor(article: ArticleMetadata): ContentRelationship[] {
  const all: ContentRelationship[] = [
    ...article.relationships,
    ...article.relatedContent.map(id => ({ purpose: "deep-dive" as const, target: { kind: "article" as const, id } })),
    ...article.relatedGlossaryTerms.map(id => ({ purpose: "prerequisite" as const, target: { kind: "glossary" as const, id } })),
    ...article.relatedCalculators.map(id => ({ purpose: "tool" as const, target: { kind: "calculator" as const, id } })),
  ];
  const seen = new Set<string>();
  return all.filter(relation => { const key = `${relation.purpose}:${relation.target.kind}:${relation.target.id}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
function unique<T>(items: readonly T[], key: (item: T) => string, label: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) { const id = key(item); if (map.has(id)) throw new Error(`Duplicate ${label}: ${id}`); map.set(id, item); }
  return map;
}
export function buildCatalog(inputs: readonly ArticleInput[], sources: readonly ContentSource[], knowledge: readonly KnowledgeRecord[], cases: readonly EducationalCase[]): ContentCatalog {
  const sourceMap = unique(sources, item => item.id, "source ID");
  // Generated module names must remain unique on case-insensitive filesystems too.
  unique(inputs, item => item.id.toLowerCase(), "content ID");
  unique(inputs, articleRoute, "canonical route");
  const records = [...knowledge, ...cases];
  const recordMap = unique(records, item => `${item.kind}:${item.id}`, "knowledge identity");
  unique(cases.flatMap(item => [...item.tables]), table => table.id, "financial table ID");
  const articles: ArticleMetadata[] = inputs.map(input => {
    const { sourceIds, ...metadata } = input;
    const resolved = sourceIds.map(id => {
      const source = sourceMap.get(id); if (!source) throw new Error(`${input.id}: unknown source ${id}`);
      if (!input.developmentFixture && source.synthetic) throw new Error(`${input.id}: synthetic sources are fixture-only`);
      if (!input.developmentFixture && ["U3", "U4"].includes(input.updateSensitivity) && (!source.url || !source.reviewedDate || !source.accessedDate)) throw new Error(`${input.id}: sensitive sources require URL, accessedDate and reviewedDate`);
      return source;
    });
    return { ...metadata, sources: resolved };
  });
  const articleMap = new Map(articles.map(article => [article.id, article]));
  for (const article of articles) for (const relation of relationshipsFor(article)) {
    const target = relation.target.kind === "article" ? articleMap.get(relation.target.id) : recordMap.get(`${relation.target.kind}:${relation.target.id}`);
    if (!target) throw new Error(`${article.id}: unresolved ${relation.target.kind} relationship ${relation.target.id}`);
    if (relation.target.kind === "article" && relation.target.id === article.id) throw new Error(`${article.id}: self relationship`);
    if (!article.developmentFixture && ("developmentFixture" in target ? target.developmentFixture : target.synthetic)) throw new Error(`${article.id}: fixture relationships cannot support publication content`);
  }
  return { articles, sources: [...sources], knowledge: [...knowledge], cases: [...cases] };
}

export interface ResolvedRelationship extends ContentRelationship { label: string; href?: string }
export function resolveRelationships(article: ArticleMetadata, catalog: ContentCatalog, fixtures = false): ResolvedRelationship[] {
  return relationshipsFor(article).map(relation => {
    if (relation.target.kind === "article") {
      const target = catalog.articles.find(item => item.id === relation.target.id);
      if (!target) throw new Error(`Unresolved article ${relation.target.id}`);
      return { ...relation, label: target.title, ...(isRenderable(target, fixtures) ? { href: articleRoute(target) } : {}) };
    }
    const target = [...catalog.knowledge, ...catalog.cases].find(item => item.kind === relation.target.kind && item.id === relation.target.id);
    if (!target) throw new Error(`Unresolved knowledge record ${relation.target.id}`);
    // Case-study links are added by the article template only when that case is embedded.
    return { ...relation, label: target.label };
  });
}
export function sourceDependents(catalog: ContentCatalog, sourceId: string): readonly ArticleMetadata[] {
  if (!catalog.sources.some(source => source.id === sourceId)) throw new Error(`Unknown source ${sourceId}`);
  return catalog.articles.filter(article => article.sources.some(source => source.id === sourceId));
}
