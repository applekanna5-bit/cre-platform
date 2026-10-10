import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import { checkBuildContext, readPublicationMode, resolveSeoContext } from "./src/seo/context";
import { indexingHeaders } from "./src/seo/policy";

export default function nextConfig(phase: string): NextConfig {
  const root = process.cwd();
  const context = resolveSeoContext({
    SITE_ENV: process.env.SITE_ENV,
    SITE_PRODUCTION_ORIGIN: process.env.SITE_PRODUCTION_ORIGIN,
    SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED,
  }, readPublicationMode(root));
  if (phase === PHASE_PRODUCTION_BUILD) checkBuildContext(root, "build", context);
  if (phase === PHASE_PRODUCTION_SERVER) checkBuildContext(root, "start", context);
  return { headers: async () => indexingHeaders(context.policy) };
}
