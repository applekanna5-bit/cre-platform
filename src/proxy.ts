import { NextResponse, type NextRequest } from "next/server";
import { authorizePreview } from "./security/preview-auth";

// Deliberately no matcher: assets, images, navigation, missing routes and future APIs
// receive the same admission check. There is no client-controlled bypass header.
export function proxy(request: NextRequest) {
  const decision = authorizePreview(request.headers.get("authorization"), {
    PREVIEW_ACCESS_MODE: process.env.PREVIEW_ACCESS_MODE,
    PREVIEW_AUTH_USERNAME: process.env.PREVIEW_AUTH_USERNAME,
    PREVIEW_AUTH_PASSWORD: process.env.PREVIEW_AUTH_PASSWORD,
  });
  const response = decision === "admit"
    ? NextResponse.next()
    : new NextResponse("Access denied.", { status: decision === "unauthorized" ? 401 : 503 });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (decision === "unauthorized") response.headers.set("WWW-Authenticate", 'Basic realm="Private preview", charset="UTF-8"');
  if (decision !== "admit") response.headers.set("Content-Type", "text/plain; charset=utf-8");
  return response;
}
