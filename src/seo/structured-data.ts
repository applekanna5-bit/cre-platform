import type { ArticleMetadata } from "../content/contracts";
import { articleRoute, isPublicArticle } from "../content/catalog";
import { assertSeoDeliveryContext, canonicalUrl, type SeoContext, type SeoDelivery } from "./public-pages";

export interface ArticleStructuredData {
  "@context": "https://schema.org"; "@type": "Article"; "@id": string;
  url: string; mainEntityOfPage: string; headline: string; description: string;
  datePublished: string; dateModified?: string;
}
export interface BreadcrumbStructuredData {
  "@context": "https://schema.org"; "@type": "BreadcrumbList";
  itemListElement: { "@type": "ListItem"; position: number; name: string; item: string }[];
}
function genuineDate(value: string | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value) throw new Error("Structured data requires a genuine editorial date");
  return value;
}
/** Indexed article rendering uses only genuine public metadata. */
export function articleStructuredData(article: ArticleMetadata, context: SeoContext, delivery: SeoDelivery): ArticleStructuredData | null {
  assertSeoDeliveryContext(context, delivery);
  if (!context.policy.indexingAllowed || !isPublicArticle(article)) return null;
  const url = canonicalUrl(context, articleRoute(article))!;
  return { "@context": "https://schema.org", "@type": "Article", "@id": url + "#article", url,
    mainEntityOfPage: url, headline: article.title, description: article.description,
    datePublished: genuineDate(article.publishedDate),
    ...(article.updatedDate ? { dateModified: genuineDate(article.updatedDate) } : {}) };
}
export function breadcrumbStructuredData(article: ArticleMetadata, context: SeoContext, delivery: SeoDelivery): BreadcrumbStructuredData | null {
  assertSeoDeliveryContext(context, delivery);
  if (!context.policy.indexingAllowed || !isPublicArticle(article)) return null;
  const entries = articleBreadcrumbs(article);
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: entries.map((entry, i) =>
    ({ "@type": "ListItem", position: i + 1, name: entry.name, item: canonicalUrl(context, entry.path)! })) };
}
/** Shared visible/schema navigation; no fabricated domain landing route. */
export function articleBreadcrumbs(article: ArticleMetadata) {
  return [{ name: "Home", path: "/" }, { name: "Research library", path: "/library" },
    { name: article.title, path: articleRoute(article) }];
}
/** Escape HTML-significant characters without changing the parsed JSON values. */
export function serializeStructuredData(value: ArticleStructuredData | BreadcrumbStructuredData): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
