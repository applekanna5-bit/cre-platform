import type { Metadata } from "next";
import type { ArticleMetadata } from "../content/contracts";
import { articleRoute, isPublicArticle } from "../content/catalog";
import { resolveSeoContext } from "./context";
import { fixturesEnabled, editorialPreviewEnabled } from "../content/.generated";

export const siteName = "CRE Knowledge Platform";
export const siteDescription = "Commercial real estate underwriting, financial modeling, lending, valuation and investment analysis.";
type SeoContext = ReturnType<typeof resolveSeoContext>;
type Page = "layout" | "home" | "library" | "search";

function currentContext(): SeoContext {
  return resolveSeoContext({
    SITE_ENV: process.env.SITE_ENV,
    SITE_PRODUCTION_ORIGIN: process.env.SITE_PRODUCTION_ORIGIN,
    SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED,
  }, { fixturesEnabled, editorialPreviewEnabled });
}

function formattedTitle(title: string): string {
  const suffix = ` | ${siteName}`;
  while (title.endsWith(suffix)) title = title.slice(0, -suffix.length);
  return title === siteName ? title : `${title}${suffix}`;
}

function constructMetadata(context: SeoContext, title: string, description: string, options: {
  path?: string;
  search?: boolean;
  privatePage?: boolean;
  article?: boolean;
} = {}): Metadata {
  const allowed = context.policy.indexingAllowed && !options.privatePage;
  const follow = allowed;
  const index = allowed && !options.search;
  const canonical = index && options.path && context.policy.publicOrigin
    ? new URL(options.path, context.policy.publicOrigin).href : undefined;
  const fullTitle = formattedTitle(title);
  return {
    title: { absolute: fullTitle },
    description,
    // Every page replaces the entire nested robots object, including Googlebot.
    robots: { index, follow, googleBot: { index, follow } },
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: fullTitle, description, siteName,
      type: options.article ? "article" : "website",
      ...(canonical ? { url: canonical } : {}),
    },
    twitter: { card: "summary", title: fullTitle, description },
  };
}

export function pageMetadata(page: Page, context: SeoContext = currentContext()): Metadata {
  switch (page) {
    case "layout": return constructMetadata(context, siteName, siteDescription);
    case "home": return constructMetadata(context, siteName, siteDescription, { path: "/" });
    case "library": return constructMetadata(context, "Research Library",
      "Published CRE research and practical guides to property financials, revenue analysis, and underwriting.", { path: "/library" });
    case "search": return constructMetadata(context, "Search the research",
      "Find the concepts, frameworks, and practical analysis behind CRE underwriting decisions.", { search: true });
  }
}

export function articleMetadata(article: ArticleMetadata, context: SeoContext = currentContext()): Metadata {
  if (!isPublicArticle(article)) {
    return constructMetadata(context, "Content preview", "This content is not published.", { privatePage: true });
  }
  return constructMetadata(context, article.title, article.description, { path: articleRoute(article), article: true });
}
