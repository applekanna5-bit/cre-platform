import "server-only";
import { headers } from "next/headers";
import { createOwnerAuth, sessionSeconds } from "./owner-auth-config";
import { feedbackRuntime } from "./runtime";

let client: ReturnType<typeof createOwnerAuth> | undefined;

export async function ownerAuthentication() {
  const env = feedbackRuntime();
  if (!env) return null;
  const { config, db, pool } = env;
  const [owner] = await db.rows<{ userId: string }>("SELECT userId FROM feedback_auth_owner WHERE slot = 1");
  if (!owner) return null;

  const sdk = client ??= createOwnerAuth({
    database: pool.pool, origin: config.origin, secret: config.secret,
  });

  return {
    sdk, config, db, issuer: config.origin, ownerId: owner.userId,
    async readSession() {
      const incoming = await headers();
      const cookie = incoming.get("cookie");
      if (!cookie) return null;
      const session = await sdk.api.getSession({ headers: new Headers({ cookie }) });
      if (!session || session.user.id !== owner.userId || !session.user.emailVerified || !session.user.twoFactorEnabled) return null;
      const [proof] = await db.rows<{ mfaVerified: number }>(
        "SELECT mfaVerified FROM feedback_auth_session WHERE id = ? AND userId = ?", [session.session.id, owner.userId]);
      return {
        issuer: config.origin, subject: session.user.id, mfa: Number(proof?.mfaVerified) === 1,
        expiresAt: Math.min(session.session.expiresAt.getTime(), session.session.createdAt.getTime() + sessionSeconds * 1000), revoked: !proof,
      };
    },
  };
}
