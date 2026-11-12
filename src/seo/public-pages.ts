import type { MetadataRoute } from "next";
import type { ContentCatalog } from "../content/contracts";
import { isPublicArticle } from "../content/catalog";
import { publicArticles } from "../content/publication";
import type { resolveSeoContext } from "./context";

export type SeoContext = ReturnType<typeof resolveSeoContext>;
export interface SeoDelivery {
  readonly accessMode?: string;
  readonly nodeEnvironment?: string;
  readonly testOnlyDatePreviewEnabled: boolean;
  readonly testOnlyPublicationDatePresent: boolean;
}
/** Pick only nonsecret configuration, never credentials or the simulated date. */
export function seoDelivery(env: Readonly<Record<string, string | undefined>>, testOnlyDatePreviewEnabled: boolean): SeoDelivery {
  return Object.freeze({ accessMode: env.PREVIEW_ACCESS_MODE, nodeEnvironment: env.NODE_ENV,
    testOnlyDatePreviewEnabled, testOnlyPublicationDatePresent: env.CRE_TEST_ONLY_PUBLICATION_DATE !== undefined });
}
export function assertSeoDeliveryContext(context: SeoContext, delivery: SeoDelivery): void {
  if (!context.policy.indexingAllowed) return;
  if (context.site.environment !== "production" || !context.policy.publicOrigin ||
      context.mode.fixturesEnabled || context.mode.editorialPreviewEnabled ||
      delivery.nodeEnvironment !== "production" || delivery.accessMode !== "public" ||
      delivery.testOnlyDatePreviewEnabled || delivery.testOnlyPublicationDatePresent) {
    throw new Error("Indexed SEO requires clean public production delivery; private and test-only output is excluded");
  }
}
/** Paths come from the canonical route adapter, never a request URL or Host. */
export function canonicalUrl(context: SeoContext, canonicalPath: string): string | undefined {
  if (!context.policy.indexingAllowed || !context.policy.publicOrigin) return undefined;
  if (!canonicalPath.startsWith("/") || canonicalPath.startsWith("//") ||
      /[?#\\%\s]/.test(canonicalPath) || (canonicalPath !== "/" && canonicalPath.endsWith("/")) ||
      canonicalPath.split("/").some(part => part === "." || part === "..")) throw new Error("Expected a canonical path");
  return new URL(canonicalPath, context.policy.publicOrigin).href;
}
export function publicSeoPages(catalog: Pick<ContentCatalog, "articles">, context: SeoContext, delivery: SeoDelivery): MetadataRoute.Sitemap {
  assertSeoDeliveryContext(context, delivery);
  if (!context.policy.indexingAllowed) return [];
  // The canonical predicate excludes local discovery's approved-preview exception.
  const articles = publicArticles({ articles: catalog.articles.filter(isPublicArticle) });
  return ["/", "/library", ...articles.map(article => article.href)].map(route => ({ url: canonicalUrl(context, route)! }));
}
export function seoRobots(context: SeoContext, delivery: SeoDelivery): MetadataRoute.Robots {
  assertSeoDeliveryContext(context, delivery);
  return { rules: { userAgent: "*", allow: "/" },
    ...(context.policy.indexingAllowed ? { sitemap: new URL("/sitemap.xml", context.policy.publicOrigin!).href } : {}) };
}
