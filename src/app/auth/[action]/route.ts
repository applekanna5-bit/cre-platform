import { NextResponse, NextRequest } from "next/server";
import { ownerAuthentication } from "@/feedback/auth";
import { OwnerRequestError } from "@/feedback/owner";
import { privateFeedbackHeaders } from "@/feedback/staging";

async function handle(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const allowed = request.method === "GET"
    ? ["/auth/login", "/auth/callback", "/auth/logout"].includes(path)
    : request.method === "POST" && path === "/auth/backchannel-logout";
  const auth = allowed ? ownerAuthentication() : null;
  if (!auth) return new NextResponse(null, { status: 404, headers: privateFeedbackHeaders });
  // This explicit wrapper leaves preview admission in the existing Proxy.
  try {
    const sdkRequest = path === "/auth/login" || path === "/auth/logout"
      ? new NextRequest(new URL(path, request.url), { headers: request.headers })
      : request;
    const response = await auth.client.middleware(sdkRequest);
    for (const [key, value] of Object.entries(privateFeedbackHeaders)) response.headers.set(key, value);
    return response;
  } catch (error) {
    if (error instanceof OwnerRequestError) return new NextResponse("Owner access denied.", { status: 403, headers: privateFeedbackHeaders });
    return new NextResponse("Owner sign-in is unavailable.", { status: 503, headers: privateFeedbackHeaders });
  }
}

export const GET = handle;
export const POST = handle;
