import type { ContentCatalog } from "./contracts.ts";
import { isPubliclyReadable, relationshipsFor } from "./catalog.ts";

/** Project delivery data only; protected on-disk editorial/source records stay intact. */
export function projectDeliveryCatalog(catalog: ContentCatalog, mode: { fixturesEnabled: boolean; editorialPreviewEnabled: boolean }): ContentCatalog {
  if (mode.fixturesEnabled || mode.editorialPreviewEnabled) return catalog;
  const articles = catalog.articles.filter(isPubliclyReadable);
  const ids = new Set(articles.map(a => a.id));
  const knowledge = catalog.knowledge.filter(k => !k.synthetic);
  const cases = catalog.cases.filter(c => !c.synthetic);
  const targets = new Set([...knowledge, ...cases].map(k => k.kind + ":" + k.id));
  for (const article of articles) {
    for (const relation of relationshipsFor(article)) {
      if (relation.target.kind === "article" ? !ids.has(relation.target.id) :
          !targets.has(relation.target.kind + ":" + relation.target.id))
        throw new Error("Public delivery references a nonpublic record");
    }
  }
  const sourceIds = new Set(articles.flatMap(a => a.sources.map(s => s.id)));
  const sources = catalog.sources.filter(s => !s.synthetic && sourceIds.has(s.id));
  return { articles, sources, knowledge, cases };
}
