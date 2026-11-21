import { isIP } from "node:net";
import type { Sql } from "./database";
import { ownerAuthPath } from "./owner-auth-config";
import { privateFeedbackHeaders } from "./staging";
import { readBoundedJson, sameSitePost } from "./submission";

const signIn = "/sign-in/email";
const totp = "/two-factor/verify-totp";
const recovery = "/two-factor/verify-backup-code";
const signOut = "/sign-out";
const allowed = new Set([signIn, totp, recovery, signOut]);

export function ownerAuthError(status: number) {
  return Response.json({ kind: "rejected" }, { status, headers: privateFeedbackHeaders });
}

export async function handleOwnerAuth(request: Request, config: {
  origin: string;
  addressHeader: string;
  ownerId: string;
  db: Sql;
  handler: (request: Request) => Promise<Response>;
  rateLimit: (ip: string, now: number) => Promise<boolean>;
}) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith(ownerAuthPath) || !allowed.has(path.slice(ownerAuthPath.length))) return ownerAuthError(404);
  if (!sameSitePost(request, config.origin)) return ownerAuthError(403);
  const ip = request.headers.get(config.addressHeader);
  if (!ip || !isIP(ip)) return ownerAuthError(503);

  const endpoint = path.slice(ownerAuthPath.length);
  if (endpoint !== signOut && !await config.rateLimit(ip, Date.now())) return ownerAuthError(429);
  let body: Record<string, unknown> = {};
  if (endpoint !== signOut) {
    const input = await readBoundedJson(request).catch(() => null);
    if (!input || typeof input !== "object" || Array.isArray(input)) return ownerAuthError(400);
    const fields = input as Record<string, unknown>;
    if (endpoint === signIn) {
      if (typeof fields.email !== "string" || fields.email.length > 254 ||
          typeof fields.password !== "string" || fields.password.length > 128) return ownerAuthError(400);
      body = { email: fields.email, password: fields.password, rememberMe: true };
    } else {
      if (typeof fields.code !== "string" || !(endpoint === totp ? /^\d{6}$/ : /^[a-z0-9-]{1,64}$/i).test(fields.code)) return ownerAuthError(400);
      body = { code: fields.code, trustDevice: false, ...(endpoint === recovery ? { disableSession: false } : {}) };
    }
  }

  const headers = new Headers({ origin: config.origin, "content-type": "application/json" });
  headers.set(config.addressHeader, ip);
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const result = await config.handler(new Request(config.origin + path, { method: "POST", headers, body: JSON.stringify(body) }));
  if (!result.ok) return ownerAuthError(result.status === 429 ? 429 : 401);
  const data = await result.json() as { token?: string; twoFactorRedirect?: boolean; user?: { id?: string; emailVerified?: boolean } };
  if (endpoint === signIn && data.twoFactorRedirect !== true) return ownerAuthError(401);
  if (endpoint === totp || endpoint === recovery) {
    if (!data.token || data.user?.id !== config.ownerId || data.user.emailVerified !== true) return ownerAuthError(401);
    const changed = await config.db.write(
      "UPDATE feedback_auth_session SET mfaVerified = TRUE WHERE token = ? AND userId = ? AND mfaVerified = FALSE",
      [data.token, config.ownerId]);
    if (changed !== 1) return ownerAuthError(401);
  }

  const responseHeaders = new Headers(privateFeedbackHeaders);
  for (const value of result.headers.getSetCookie()) responseHeaders.append("set-cookie", value);
  return Response.json({ kind: endpoint === signIn ? "challenge" : "complete" }, { headers: responseHeaders });
}
