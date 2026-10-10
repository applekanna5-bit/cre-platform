import { isIP } from "node:net";

export type SiteEnvironment = "development" | "staging" | "preview" | "production";
export interface SiteConfig {
  readonly environment: SiteEnvironment;
  readonly productionOrigin: string | null;
  readonly indexingEnabled: boolean;
}
export interface SiteVariables {
  SITE_ENV?: string;
  SITE_PRODUCTION_ORIGIN?: string;
  SITE_INDEXING_ENABLED?: string;
}

// Approval and ownership of this origin remain an operator responsibility.
export function productionOrigin(value: string): string {
  if (!/^https:\/\/[a-zA-Z0-9.-]+(?::443)?\/?$/.test(value)) {
    throw new Error("SITE_PRODUCTION_ORIGIN must be an HTTPS DNS origin without credentials, paths, queries, or fragments");
  }
  const url = new URL(value);
  const host = url.hostname;
  const labels = host.split(".");
  const reserved = /(?:^|\.)(?:localhost|local|localdomain|internal|intranet|home|lan|test|invalid|example|onion|arpa|alt)$/;
  if (host.length > 253 || labels.length < 2 || isIP(host) || reserved.test(host) ||
      /(?:^|\.)example\.(?:com|net|org)$/.test(host) ||
      !/^[a-z]{2,63}$/.test(labels.at(-1) ?? "") ||
      labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new Error("SITE_PRODUCTION_ORIGIN requires a public DNS hostname");
  }
  return url.origin;
}

export function resolveSiteConfig(variables: SiteVariables): Readonly<SiteConfig> {
  const environment = variables.SITE_ENV ?? "development";
  if (!["development", "staging", "preview", "production"].includes(environment)) {
    throw new Error("Invalid SITE_ENV");
  }
  const enabled = variables.SITE_INDEXING_ENABLED ?? "false";
  if (enabled !== "true" && enabled !== "false") throw new Error("SITE_INDEXING_ENABLED must be true or false");
  return Object.freeze({
    environment: environment as SiteEnvironment,
    productionOrigin: variables.SITE_PRODUCTION_ORIGIN === undefined ? null : productionOrigin(variables.SITE_PRODUCTION_ORIGIN),
    indexingEnabled: enabled === "true",
  });
}
