import { describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { createHmac } from "node:crypto";
import { getMigrations } from "better-auth/db/migration";
import { createOwnerAuth, ownerAuthOptions, ownerAuthPath, sessionSeconds } from "@/feedback/owner-auth-config";
import { handleOwnerAuth } from "@/feedback/owner-auth-request";
import type { Sql } from "@/feedback/database";

vi.mock("server-only", () => ({}));

const origin = "https://fixture.example.invalid";
const email = "owner@fixture.example.invalid";
const password = "Synthetic-only-password-24";
const addressHeader = "x-fixture-ip";
const secret = "tLcE2pm3FNx1wrSW7vR8hPKeB9PaV0L8bVc7p94XasJ";

function cookies(jar: Map<string, string>, responseHeaders: Headers) {
  for (const item of responseHeaders.getSetCookie()) {
    const pair = item.split(";")[0];
    const split = pair.indexOf("=");
    const name = pair.slice(0, split);
    if (/;\s*max-age=0\b/i.test(item) || !pair.slice(split + 1)) jar.delete(name);
    else jar.set(name, pair.slice(split + 1));
  }
}
const cookieHeader = (jar: Map<string, string>) => [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");

function codeFor(uri: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const secret = new URL(uri).searchParams.get("secret")!;
  const bits = [...secret.replace(/=+$/, "")].map(c => alphabet.indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map(byte => parseInt(byte, 2)));
  const input = Buffer.alloc(8);
  input.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", key).update(input).digest();
  return String((digest.readUInt32BE(digest.at(-1)! & 15) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

describe("self-hosted owner authentication", () => {
  it("exercises verified enrollment, password challenge, TOTP, one-use recovery, expiry and revocation", async () => {
    const database = new DatabaseSync(":memory:");
    const options = { database, origin, secret };
    try {
      await (await getMigrations(ownerAuthOptions(options))).runMigrations();
      const bootstrap = createOwnerAuth({ ...options, bootstrap: true });
      const signup = await bootstrap.api.signUpEmail({ body: { name: "Fixture", email, password }, returnHeaders: true });
      const ownerId = signup.response.user.id;
      const setup = new Map<string, string>();
      cookies(setup, signup.headers);
      const headers = new Headers({ cookie: cookieHeader(setup), origin });
      const factor = await bootstrap.api.enableTwoFactor({ body: { password }, headers });
      if (factor.method !== "totp") throw new Error("Expected TOTP");
      expect(database.prepare("SELECT twoFactorEnabled FROM feedback_auth_user WHERE id = ?").get(ownerId)?.twoFactorEnabled).toBe(0);
      await bootstrap.api.verifyTOTP({ body: { code: codeFor(factor.totpURI) }, headers });
      database.prepare("UPDATE feedback_auth_user SET emailVerified = TRUE WHERE id = ?").run(ownerId);
      database.prepare("DELETE FROM feedback_auth_session WHERE userId = ?").run(ownerId);
      const row = database.prepare("SELECT secret, backupCodes FROM feedback_auth_factor WHERE userId = ?").get(ownerId)!;
      expect(String(row.secret)).not.toContain(new URL(factor.totpURI).searchParams.get("secret"));
      expect(String(row.backupCodes)).not.toContain(factor.backupCodes[0]);
      expect(String(database.prepare("SELECT password FROM feedback_auth_account WHERE userId = ?").get(ownerId)?.password)).not.toContain(password);

      const sdk = createOwnerAuth(options);
      const db = {
        write: async (statement: string, parameters: string[] = []) => Number(database.prepare(statement).run(...parameters).changes),
      } as Sql;
      const session = (jar: Map<string, string>) => sdk.api.getSession({ headers: new Headers({ cookie: cookieHeader(jar) }) });
      const limiter = vi.fn().mockResolvedValue(true);
      const api = (jar: Map<string, string>, path: string, body: object = {}, source = origin, allowedId = ownerId) =>
        handleOwnerAuth(new Request(origin + ownerAuthPath + path, {
          method: "POST",
          headers: { origin: source, cookie: cookieHeader(jar), [addressHeader]: "192.0.2.42", "x-cre-feedback": "1", "content-type": "application/json" },
          body: JSON.stringify(body),
        }), { origin, addressHeader, ownerId: allowedId, db, handler: sdk.handler, rateLimit: limiter });

      const jar = new Map<string, string>();
      expect((await api(jar, "/sign-up/email", { email, password })).status).toBe(404);
      await expect(sdk.api.signUpEmail({ body: { name: "Another", email: "other@fixture.example.invalid", password } })).rejects.toThrow();
      expect((await api(jar, "/sign-in/email", { email, password }, "https://foreign.example.invalid")).status).toBe(403);
      expect((await api(jar, "/sign-in/email", { email, password: "wrong-password" })).status).toBe(401);
      limiter.mockResolvedValueOnce(false);
      expect((await api(jar, "/sign-in/email", { email, password })).status).toBe(429);

      const signIn = async (target: Map<string, string>) => {
        const res = await api(target, "/sign-in/email", { email, password });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ kind: "challenge" });
        cookies(target, res.headers);
        expect(await session(target)).toBeNull();
      };
      await signIn(jar);
      const totp = await api(jar, "/two-factor/verify-totp", { code: codeFor(factor.totpURI), trustDevice: true });
      expect(totp.status).toBe(200);
      expect(await totp.json()).toEqual({ kind: "complete" });
      expect(totp.headers.getSetCookie().some(value => /\bHttpOnly\b/i.test(value) && /\bSecure\b/i.test(value))).toBe(true);
      expect(totp.headers.getSetCookie().join(" ")).not.toMatch(/trust_device/i);
      cookies(jar, totp.headers);
      const signedIn = await session(jar);
      expect(signedIn?.user).toMatchObject({ id: ownerId, emailVerified: true, twoFactorEnabled: true });
      expect(database.prepare("SELECT mfaVerified FROM feedback_auth_session WHERE id = ?").get(signedIn!.session.id)?.mfaVerified).toBe(1);
      expect(signedIn!.session.expiresAt.getTime() - signedIn!.session.createdAt.getTime()).toBeLessThanOrEqual(sessionSeconds * 1000);
      database.prepare("UPDATE feedback_auth_session SET expiresAt = ? WHERE id = ?").run("2000-01-01T00:00:00.000Z", signedIn!.session.id);
      expect(await session(jar)).toBeNull();

      const recovery = new Map<string, string>();
      await signIn(recovery);
      const recovered = await api(recovery, "/two-factor/verify-backup-code", { code: factor.backupCodes[0] });
      expect(recovered.status).toBe(200);
      cookies(recovery, recovered.headers);
      expect(await session(recovery)).not.toBeNull();
      const revoked = new Map(recovery);
      const signedOut = await api(recovery, "/sign-out");
      expect(signedOut.status).toBe(200);
      expect(await session(revoked)).toBeNull();

      const reused = new Map<string, string>();
      await signIn(reused);
      expect((await api(reused, "/two-factor/verify-backup-code", { code: factor.backupCodes[0] })).status).toBe(401);
      expect(await session(reused)).toBeNull();

      const differentBinding = new Map<string, string>();
      await signIn(differentBinding);
      const denied = await api(differentBinding, "/two-factor/verify-backup-code", { code: factor.backupCodes[1] }, origin, "wrong-owner");
      expect(denied.status).toBe(401);
      expect(denied.headers.getSetCookie()).toHaveLength(0);
      expect(await session(differentBinding)).toBeNull();
    } finally {
      database.close();
    }
  }, 20_000);
});
