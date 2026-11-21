import { articleRoute, isPublicArticle } from "./content/catalog";
import { assertSeoDeliveryContext, publicPagePaths, seoDelivery } from "./seo/public-pages";
import { resolveSeoContext } from "./seo/context";
import { assertTestOnlyMode } from "./content/test-only-date";
import { NextResponse, type NextRequest } from "next/server";
import {
  authorizePreview,
  authorizePublicProduction,
} from "./security/preview-auth";
import {
  catalog,
  testOnlyDatePreviewEnabled,
  fixturesEnabled,
  editorialPreviewEnabled,
} from "./content/.generated/index";

// No matcher: admission checks apply to pages, assets and APIs.
export function proxy(request: NextRequest) {
  let simulation: string | null;
  try {
    const context = resolveSeoContext({ SITE_ENV: process.env.SITE_ENV, SITE_PRODUCTION_ORIGIN: process.env.SITE_PRODUCTION_ORIGIN, SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED }, { fixturesEnabled, editorialPreviewEnabled });
    assertSeoDeliveryContext(context, seoDelivery(process.env, testOnlyDatePreviewEnabled));
    simulation = assertTestOnlyMode(process.env, process.cwd(), testOnlyDatePreviewEnabled, process.env.NODE_ENV === "development" ? "phase-development-server" : "production-runtime");
    if (simulation && (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(request.headers.get("host") ?? "") || !["127.0.0.1", "localhost"].includes(request.nextUrl.hostname))) throw new Error("Local test only");
  } catch {
    return new NextResponse("Access denied.", { status: 503, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
  }
  const accessMode = process.env.PREVIEW_ACCESS_MODE;

  if (accessMode === "public") {
    const allowed = authorizePublicProduction(
      {
        PREVIEW_ACCESS_MODE: accessMode,
        SITE_ENV: process.env.SITE_ENV,
        SITE_PRODUCTION_ORIGIN: process.env.SITE_PRODUCTION_ORIGIN,
        SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED,
      },
      {
        fixturesEnabled,
        editorialPreviewEnabled,
      }
    );

    if (!allowed) {
      return new NextResponse("Access denied.", {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Retain noindex even when a hosting adapter bypasses next.config headers.
    const response = NextResponse.next();
    if (process.env.SITE_INDEXING_ENABLED === "false") {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    if (process.env.SITE_INDEXING_ENABLED === "true") {
      const pathname = request.nextUrl.pathname;
      const publicPage = publicPagePaths.includes(pathname) ||
        catalog.articles.some(article => isPublicArticle(article) && articleRoute(article) === pathname);
      const infrastructure = pathname.startsWith("/_next/static/") ||
        ["/icon.svg", "/robots.txt", "/sitemap.xml"].includes(pathname);
      if (pathname === "/search") response.headers.set("X-Robots-Tag", "noindex, follow");
      else if (pathname === "/feedback") response.headers.set("X-Robots-Tag", "noindex, nofollow");
      else if (!publicPage && !infrastructure) return new NextResponse("Not found.", {
        status: 404, headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" },
      });
      else if (infrastructure) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return response;
  }

  // Preserve the existing private-preview admission rules.
  const decision = authorizePreview(
    request.headers.get("authorization"),
    {
      PREVIEW_ACCESS_MODE: accessMode,
      PREVIEW_AUTH_USERNAME: process.env.PREVIEW_AUTH_USERNAME,
      PREVIEW_AUTH_PASSWORD: process.env.PREVIEW_AUTH_PASSWORD,
    }
  );

  const response =
    decision === "admit"
      ? NextResponse.next()
      : new NextResponse("Access denied.", {
          status: decision === "unauthorized" ? 401 : 503,
        });

  response.headers.set("Cache-Control", "private, no-store");
  if (simulation) response.headers.set("X-CRE-Test-Only-Publication-Date", simulation);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  if (decision === "unauthorized") {
    response.headers.set(
      "WWW-Authenticate",
      'Basic realm="Private preview", charset="UTF-8"'
    );
  }

  if (decision !== "admit") {
    response.headers.set(
      "Content-Type",
      "text/plain; charset=utf-8"
    );
  }

  return response;
}
