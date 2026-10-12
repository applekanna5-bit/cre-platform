// Node-only module. Import only from Proxy/server code; never from client components.
import { createHash, timingSafeEqual } from "node:crypto";

export interface PreviewEnvironment {
  PREVIEW_ACCESS_MODE?: string;
  PREVIEW_AUTH_USERNAME?: string;
  PREVIEW_AUTH_PASSWORD?: string;
}

export type PreviewDecision = "admit" | "unauthorized" | "unavailable";
const usernamePattern = /^[!-9;-~]{1,128}(?![\s\S])/; // Exact end; excludes ':' and whitespace.
const passwordPattern = /^[!-~]{32,256}(?![\s\S])/;
const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

/** No public mode exists. Invalid runtime configuration always denies access. */
export function authorizePreview(authorization: string | null, env: PreviewEnvironment): PreviewDecision {
  const username = env.PREVIEW_AUTH_USERNAME;
  const password = env.PREVIEW_AUTH_PASSWORD;
  if (env.PREVIEW_ACCESS_MODE !== "private" || !username || !password ||
      !usernamePattern.test(username) || !passwordPattern.test(password)) return "unavailable";

  // Headers may combine duplicates with commas. Neither commas nor whitespace are valid
  // in the canonical token accepted here. Raw duplicates hidden by an upstream server
  // cannot be detected at this layer and must be rejected by that serving layer.
  if (!authorization || authorization.length > 1024) return "unauthorized";
  const match = /^Basic ([A-Za-z0-9+/]+={0,2})(?![\s\S])/i.exec(authorization);
  if (!match || match[1].length % 4 !== 0) return "unauthorized";
  const decoded = Buffer.from(match[1], "base64");
  if (decoded.toString("base64") !== match[1] || decoded.some(byte => byte < 33 || byte > 126)) return "unauthorized";
  const credentials = decoded.toString("ascii");
  const separator = credentials.indexOf(":");
  if (separator < 1) return "unauthorized";
  const suppliedUsername = credentials.slice(0, separator);
  const suppliedPassword = credentials.slice(separator + 1);
  if (!usernamePattern.test(suppliedUsername) || !passwordPattern.test(suppliedPassword)) return "unauthorized";
  const usernameMatches = timingSafeEqual(digest(suppliedUsername), digest(username));
  const passwordMatches = timingSafeEqual(digest(suppliedPassword), digest(password));
  return usernameMatches && passwordMatches ? "admit" : "unauthorized";
}
