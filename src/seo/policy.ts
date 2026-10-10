import type { SiteConfig } from "../config/site";

export interface PublicationMode {
  readonly fixturesEnabled: boolean;
  readonly editorialPreviewEnabled: boolean;
}

export function indexingPolicy(site: SiteConfig, mode: PublicationMode) {
  if (site.indexingEnabled && (site.environment !== "production" || !site.productionOrigin ||
      mode.fixturesEnabled || mode.editorialPreviewEnabled)) {
    throw new Error("Indexing requires production, an approved origin, and publication-only content");
  }
  return Object.freeze({
    indexingAllowed: site.indexingEnabled,
    // Future URL-bearing SEO must use this origin, never the request host.
    publicOrigin: site.productionOrigin,
    robotsHeader: site.indexingEnabled ? null : "noindex, nofollow",
  });
}

export function indexingHeaders(policy: ReturnType<typeof indexingPolicy>) {
  return policy.robotsHeader ? [{
    source: "/:path*",
    headers: [{ key: "X-Robots-Tag", value: policy.robotsHeader }],
  }] : [];
}
