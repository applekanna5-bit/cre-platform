import { NextResponse, type NextRequest } from "next/server";
import {
  authorizePreview,
  authorizePublicProduction,
} from "./security/preview-auth";
import {
  fixturesEnabled,
  editorialPreviewEnabled,
} from "./content/.generated/index";

// No matcher: admission checks apply to pages, assets and APIs.
export function proxy(request: NextRequest) {
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
