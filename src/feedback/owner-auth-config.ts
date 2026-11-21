import { betterAuth, type BetterAuthOptions } from "better-auth";
import { twoFactor } from "better-auth/plugins/two-factor";

export const ownerAuthPath = "/api/owner-auth";
export const sessionSeconds = 15 * 60;

export function ownerAuthOptions(options: {
  database: NonNullable<BetterAuthOptions["database"]>;
  origin: string;
  secret: string;
  bootstrap?: boolean;
}) {
  return {
    database: options.database,
    baseURL: options.origin,
    basePath: ownerAuthPath,
    trustedOrigins: [options.origin],
    secret: options.secret,
    appName: "The CRE Ledger",
    telemetry: { enabled: false },
    user: { modelName: "feedback_auth_user" },
    account: { modelName: "feedback_auth_account" },
    verification: { modelName: "feedback_auth_verification", storeIdentifier: "hashed" },
    session: {
      modelName: "feedback_auth_session",
      expiresIn: sessionSeconds,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
      additionalFields: { mfaVerified: { type: "boolean", required: false, defaultValue: false, input: false, returned: false } },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.bootstrap,
      requireEmailVerification: !options.bootstrap,
      minPasswordLength: 16,
      maxPasswordLength: 128,
    },
    advanced: {
      useSecureCookies: true,
      cookiePrefix: "cre_owner",
      ipAddress: { disableIpTracking: true },
    },
    // Admission uses the existing transaction-backed, HMAC-keyed staging limiter.
    rateLimit: { enabled: false },
    plugins: [twoFactor({
      twoFactorTable: "feedback_auth_factor",
      skipVerificationOnEnable: false,
      backupCodeOptions: { storeBackupCodes: "encrypted" },
    })],
  } satisfies BetterAuthOptions;
}

export function createOwnerAuth(options: Parameters<typeof ownerAuthOptions>[0]) {
  return betterAuth(ownerAuthOptions(options));
}
