import { articleRoute, isPublicArticle } from "./catalog.ts";
import type { ArticleMetadata, ContentCatalog } from "./contracts.ts";

/** JSON-safe allowlist for public discovery, not an article-rendering catalog. */
export interface PublicArticle {
  readonly kind: "article";
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly domain: ArticleMetadata["domain"];
  readonly contentType: ArticleMetadata["contentType"];
  readonly difficulty: ArticleMetadata["difficulty"];
  readonly topics: readonly string[];
  readonly publishedDate?: ArticleMetadata["publishedDate"];
  readonly updatedDate?: ArticleMetadata["updatedDate"];
  readonly needsReview: boolean;
}

/** Consume validated server-side articles; never enable preview/fixture discovery. */
export function publicArticles(catalog: Pick<ContentCatalog, "articles">): readonly PublicArticle[] {
  const ids = new Set<string>();
  const routes = new Set<string>();
  return catalog.articles.filter(isPublicArticle).map((article): PublicArticle => {
    const href = articleRoute(article);
    const identity = article.id.toLowerCase();
    if (ids.has(identity)) throw new Error(`Duplicate public article ID: ${article.id}`);
    if (routes.has(href)) throw new Error(`Duplicate public article route: ${href}`);
    ids.add(identity);
    routes.add(href);
    return {
      kind: "article",
      id: article.id,
      href,
      title: article.title,
      description: article.description,
      domain: article.domain,
      contentType: article.contentType,
      difficulty: article.difficulty,
      topics: [...article.topics],
      ...(article.publishedDate ? { publishedDate: article.publishedDate } : {}),
      ...(article.updatedDate ? { updatedDate: article.updatedDate } : {}),
      needsReview: article.status === "needs-review",
    };
  }).sort((a, b) => a.href < b.href ? -1 : a.href > b.href ? 1 : 0);
}
