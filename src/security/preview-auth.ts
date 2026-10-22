// Node-only module. Import only from Proxy/server code; never from client components.
import { createHash, timingSafeEqual } from "node:crypto";
import { productionOrigin } from "../config/site";

export interface PreviewEnvironment {
  PREVIEW_ACCESS_MODE?: string;
  PREVIEW_AUTH_USERNAME?: string;
  PREVIEW_AUTH_PASSWORD?: string;
}

export type PreviewDecision = "admit" | "unauthorized" | "unavailable";

const usernamePattern = /^[!-9;-~]{1,128}(?![\s\S])/;
const passwordPattern = /^[!-~]{32,256}(?![\s\S])/;

const digest = (value: string) =>
  createHash("sha256").update(value, "utf8").digest();

/**
 * Private-preview authentication.
 * Invalid configuration always denies access.
 */
export function authorizePreview(
  authorization: string | null,
  env: PreviewEnvironment
): PreviewDecision {
  const username = env.PREVIEW_AUTH_USERNAME;
  const password = env.PREVIEW_AUTH_PASSWORD;

  if (
    env.PREVIEW_ACCESS_MODE !== "private" ||
    !username ||
    !password ||
    !usernamePattern.test(username) ||
    !passwordPattern.test(password)
  ) {
    return "unavailable";
  }

  // Reject missing, oversized, or malformed authorization headers.
  if (!authorization || authorization.length > 1024) {
    return "unauthorized";
  }

  const match = /^Basic ([A-Za-z0-9+/]+={0,2})(?![\s\S])/i.exec(
    authorization
  );

  if (!match || match[1].length % 4 !== 0) {
    return "unauthorized";
  }

  const decoded = Buffer.from(match[1], "base64");

  if (
    decoded.toString("base64") !== match[1] ||
    decoded.some((byte) => byte < 33 || byte > 126)
  ) {
    return "unauthorized";
  }

  const credentials = decoded.toString("ascii");
  const separator = credentials.indexOf(":");

  if (separator < 1) {
    return "unauthorized";
  }

  const suppliedUsername = credentials.slice(0, separator);
  const suppliedPassword = credentials.slice(separator + 1);

  if (
    !usernamePattern.test(suppliedUsername) ||
    !passwordPattern.test(suppliedPassword)
  ) {
    return "unauthorized";
  }

  const usernameMatches = timingSafeEqual(
    digest(suppliedUsername),
    digest(username)
  );

  const passwordMatches = timingSafeEqual(
    digest(suppliedPassword),
    digest(password)
  );

  return usernameMatches && passwordMatches
    ? "admit"
    : "unauthorized";
}

/**
 * Configuration required for public-production access.
 */
export interface PublicEnvironment {
  PREVIEW_ACCESS_MODE?: string;
  SITE_ENV?: string;
  SITE_PRODUCTION_ORIGIN?: string;
  SITE_INDEXING_ENABLED?: string;
}

/**
 * Validate public-production settings and require publication-only generated content.
 */
export function authorizePublicProduction(
  env: PublicEnvironment,
  mode: {
    fixturesEnabled: boolean;
    editorialPreviewEnabled: boolean;
  }
): boolean {
  if (
    env.PREVIEW_ACCESS_MODE !== "public" ||
    env.SITE_ENV !== "production" ||
    !env.SITE_PRODUCTION_ORIGIN ||
    !["true", "false"].includes(env.SITE_INDEXING_ENABLED ?? "") ||
    mode.fixturesEnabled !== false ||
    mode.editorialPreviewEnabled !== false
  ) {
    return false;
  }

  try {
    productionOrigin(env.SITE_PRODUCTION_ORIGIN);
    return true;
  } catch {
    return false;
  }
}
