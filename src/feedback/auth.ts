import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { SessionData, SessionDataStore } from "@auth0/nextjs-auth0/types";
import { NextResponse } from "next/server";
import type { Database } from "./database";
import { OwnerRequestError } from "./owner";
import { feedbackRuntime } from "./runtime";

const duration = 900;
const mfaClaim = "https://thecreledger.com/owner-mfa";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

function sessionStore(db: Database, secret: string, issuer: string): SessionDataStore {
  const key = createHmac("sha256", Buffer.from(secret, "hex")).update("cre-feedback-owner-session-v1").digest();

  return {
    async get(id) {
      const [row] = await db.rows<{ ciphertext: string }>(
        "SELECT ciphertext FROM feedback_owner_sessions WHERE session_id = ? AND expires_at > UNIX_TIMESTAMP()", [digest(id)]);
      if (!row) return null;
      const blob = Buffer.from(row.ciphertext, "base64");
      try {
        const decipher = createDecipheriv("aes-256-gcm", key, blob.subarray(0, 12));
        decipher.setAAD(Buffer.from(id));
        decipher.setAuthTag(blob.subarray(12, 28));
        return JSON.parse(Buffer.concat([decipher.update(blob.subarray(28)), decipher.final()]).toString("utf8")) as SessionData;
      } catch {
        return null;
      }
    },
    async set(id, session) {
      const nonce = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, nonce);
      cipher.setAAD(Buffer.from(id));
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
      const payload = Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString("base64");
      await db.write(`INSERT INTO feedback_owner_sessions (session_id, subject_id, provider_session_id, ciphertext, expires_at)
        VALUES (?, ?, ?, ?, ?)`, [
        digest(id), digest(session.user.sub), session.internal.sid ? digest(session.internal.sid) : null,
        payload, session.internal.createdAt + duration,
      ]);
    },
    async update() {
      // The owner uses a non-rolling session. No token refresh or session updates are necessary.
      return false;
    },
    async delete(id) {
      await db.write("DELETE FROM feedback_owner_sessions WHERE session_id = ?", [digest(id)]);
    },
    async deleteByLogoutToken({ iss, sub, sid }) {
      if (iss !== issuer || (!sub && !sid)) return;
      await db.write(`DELETE FROM feedback_owner_sessions WHERE (? IS NULL OR subject_id = ?)
        AND (? IS NULL OR provider_session_id = ?)`,
        [sub ? digest(sub) : null, sub ? digest(sub) : null, sid ? digest(sid) : null, sid ? digest(sid) : null]);
    },
  };
}

let client: Auth0Client | undefined;

export function ownerAuthentication() {
  const env = feedbackRuntime();
  if (!env) return null;
  const { config, db } = env;
  const issuer = `https://${config.domain}/`;
  client ??= new Auth0Client({
    domain: config.domain, clientId: config.clientId, clientSecret: config.clientSecret,
    appBaseUrl: config.origin, secret: config.secret,
    authorizationParameters: { scope: "openid", prompt: "login" },
    signInReturnToPath: "/owner/feedback",
    enableAccessTokenEndpoint: false,
    session: { rolling: false, absoluteDuration: duration, cookie: { name: "__Host-cre_owner", secure: true, sameSite: "lax", path: "/" } },
    sessionStore: sessionStore(db, config.secret, issuer),
    async beforeSessionSaved(session) {
      // The SDK also invokes this hook after a rejected onCallback response.
      if (session.user.sub !== config.ownerSubject || session.user[mfaClaim] !== true) throw new OwnerRequestError(403);
      return { ...session, user: { sub: session.user.sub, [mfaClaim]: true } };
    },
    async onCallback(error, _context, session) {
      if (error || !session || session.user.sub !== config.ownerSubject || session.user[mfaClaim] !== true) {
        return new NextResponse("Owner access denied.", { status: 403 });
      }
      return NextResponse.redirect(new URL("/owner/feedback", config.origin));
    },
  });
  const sdk = client;
  return {
    client: sdk,
    issuer,
    async readSession() {
      const session = await sdk.getSession();
      return session ? {
        issuer, subject: session.user.sub, mfa: session.user[mfaClaim] === true,
        expiresAt: (session.internal.createdAt + duration) * 1000, revoked: false,
      } : null;
    },
  };
}
