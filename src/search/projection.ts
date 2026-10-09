import type { ContentCatalog } from "../content/contracts.ts";
import { publicArticles } from "../content/publication.ts";
import type { SearchDocument } from "./engine.ts";

export interface ArticleSearchText { readonly headings: readonly string[]; readonly body: string }

/** Explicit allowlist, including when fixture/editorial preview compilation is enabled. */
export function articleSearchProjection(catalog: Pick<ContentCatalog, "articles">, text: ReadonlyMap<string, ArticleSearchText>): readonly SearchDocument<"article">[] {
  return publicArticles(catalog).map(article => {
    const extracted = text.get(article.id);
    if (!extracted) throw new Error(`Missing compiled search text: ${article.id}`);
    return { kind: "article", id: article.id, href: article.href, title: article.title, description: article.description, topics: [...article.topics], headings: [...extracted.headings], body: extracted.body };
  });
}
