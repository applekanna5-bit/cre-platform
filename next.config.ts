import { assertTestOnlyMode } from "./src/content/test-only-date";
import { realpathSync } from "node:fs";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import { resolveSeoContext } from "./src/seo/context";
import { checkBuildContext, readPublicationMode, readTestOnlyDateMode } from "./src/seo/build-context";
import { assertSeoDeliveryContext, seoDelivery } from "./src/seo/public-pages";
import { indexingHeaders } from "./src/seo/policy";

export default function nextConfig(phase: string): NextConfig {
  const root = realpathSync(process.cwd());
  const simulation = assertTestOnlyMode(process.env, root, readTestOnlyDateMode(root), phase);
  const context = resolveSeoContext({
    SITE_ENV: process.env.SITE_ENV,
    SITE_PRODUCTION_ORIGIN: process.env.SITE_PRODUCTION_ORIGIN,
    SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED,
  }, readPublicationMode(root));
  const delivery = seoDelivery(process.env, readTestOnlyDateMode(root));
  assertSeoDeliveryContext(context, delivery);
  if (phase === PHASE_PRODUCTION_BUILD) checkBuildContext(root, "build", context, delivery);
  if (phase === PHASE_PRODUCTION_SERVER) checkBuildContext(root, "start", context, delivery);
  return { ...(simulation ? { distDir: ".next-test-only-date" } : { output: "standalone" as const }), headers: async () => indexingHeaders(context.policy) };
}
