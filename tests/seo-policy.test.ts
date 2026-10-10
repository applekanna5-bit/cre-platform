import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { productionOrigin, resolveSiteConfig } from "@/config/site";
import { indexingHeaders } from "@/seo/policy";
import { checkBuildContext, readPublicationMode, resolveSeoContext } from "@/seo/context";

const mode = { fixturesEnabled: false, editorialPreviewEnabled: false };
const approved = { SITE_ENV: "production", SITE_PRODUCTION_ORIGIN: "https://research.cre-publication.com", SITE_INDEXING_ENABLED: "true" };

describe("SEO safeguards", () => {
  it("defaults to development, no origin and one restrictive header", () => {
    const context = resolveSeoContext({}, mode);
    expect(context.site).toEqual({ environment: "development", productionOrigin: null, indexingEnabled: false });
    expect(indexingHeaders(context.policy)).toEqual([{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]);
    expect(Object.isFrozen(context.site)).toBe(true);
  });
  it.each(["development", "staging", "preview", "production"])("defaults %s to disabled", environment => {
    expect(resolveSeoContext({ SITE_ENV: environment }, mode).policy.indexingAllowed).toBe(false);
  });
  it.each(["development", "staging", "preview"])("rejects enabled indexing in %s", environment => {
    expect(() => resolveSeoContext({ ...approved, SITE_ENV: environment }, mode)).toThrow();
  });
  it("requires origin and publication-only content and never overrides page noindex with index", () => {
    expect(() => resolveSeoContext({ SITE_ENV: "production", SITE_INDEXING_ENABLED: "true" }, mode)).toThrow();
    for (const preview of [{ ...mode, fixturesEnabled: true }, { ...mode, editorialPreviewEnabled: true }]) {
      expect(() => resolveSeoContext(approved, preview)).toThrow();
      expect(resolveSeoContext({}, preview).policy.robotsHeader).toBe("noindex, nofollow");
    }
    expect(indexingHeaders(resolveSeoContext(approved, mode).policy)).toEqual([]);
  });
  it.each([
    "http://research.cre-publication.com", "https://localhost", "https://localhost.com.localhost",
    "https://127.0.0.1", "https://10.0.0.1", "https://192.168.1.1", "https://172.16.1.1",
    "https://169.254.1.1", "https://0x7f000001", "https://2130706433", "https://[::1]",
    "https://[2001:db8::1]", "https://private.internal", "https://private.local", "https://private.home",
    "https://private.test", "https://private.invalid", "https://private.example", "https://example.com",
    "https://private.onion", "https://host", "https://host.arpa", "https://host.alt",
    "https://user:pass@research.cre-publication.com", "https://@research.cre-publication.com",
    "https://research.cre-publication.com/path", "https://research.cre-publication.com/a/..",
    "https://research.cre-publication.com?", "https://research.cre-publication.com#",
    "https://research.cre-publication.com:3000", " https://research.cre-publication.com",
    "https://research.cre-publication.com\\path", "https://research.cre-publication.com.",
    "https://bad_label.com", "https://%65xample.com", "", "not a URL",
  ])("rejects unsafe origin %s", origin => expect(() => productionOrigin(origin)).toThrow());
  it("normalizes HTTPS origins and rejects invalid switches", () => {
    expect(productionOrigin("https://RESEARCH.cre-publication.com:443/")).toBe(approved.SITE_PRODUCTION_ORIGIN);
    expect(() => resolveSiteConfig({ SITE_ENV: "prod" })).toThrow();
    for (const value of ["1", "yes", "TRUE", "", " true "]) expect(() => resolveSiteConfig({ SITE_INDEXING_ENABLED: value })).toThrow();
  });
  it("requires matching immutable build context", () => {
    const root = mkdtempSync(path.join(tmpdir(), "cre-seo-test-"));
    try {
      const context = resolveSeoContext({}, mode);
      expect(() => checkBuildContext(root, "start", context)).toThrow();
      checkBuildContext(root, "build", context);
      expect(() => checkBuildContext(root, "start", context)).not.toThrow();
      for (const changed of [resolveSeoContext(approved, mode), resolveSeoContext({ SITE_ENV: "preview" }, mode),
        resolveSeoContext({ SITE_PRODUCTION_ORIGIN: approved.SITE_PRODUCTION_ORIGIN }, mode),
        resolveSeoContext({}, { ...mode, fixturesEnabled: true })]) {
        expect(() => checkBuildContext(root, "start", changed)).toThrow("rebuild");
      }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("reads only generated mode flags without serializing catalog data", () => {
    const generatedMode = readPublicationMode(process.cwd());
    expect(Object.keys(generatedMode).sort()).toEqual(["editorialPreviewEnabled", "fixturesEnabled"]);
    expect(JSON.stringify(resolveSeoContext({}, generatedMode))).not.toMatch(/catalog|sources|cases|CRE-00/);
  });
});
