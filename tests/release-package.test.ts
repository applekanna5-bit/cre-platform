import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { artifactFiles, productionArticlePaths, requireLocalSnapshot, sha256, validateRuntime, verifyRelease, type ReleaseManifest } from "../scripts/release-start.mts";
import { serializeBuildContext } from "@/seo/build-context";
import { resolveSeoContext } from "@/seo/context";
import { discoverContent } from "@/content/discovery";
import { publicArticles } from "@/content/publication";
import { isPublicArticle } from "@/content/catalog";
import { assertTestOnlyMode } from "@/content/test-only-date";


const snapshot = serializeBuildContext(resolveSeoContext({ SITE_INDEXING_ENABLED: "false" },
  { fixturesEnabled: false, editorialPreviewEnabled: false }), {
  accessMode: "private", nodeEnvironment: "production", testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false,
});
const env = { NODE_ENV: "production", SITE_INDEXING_ENABLED: "false", PREVIEW_ACCESS_MODE: "private",
  PREVIEW_AUTH_USERNAME: "local-test", PREVIEW_AUTH_PASSWORD: "p".repeat(48) };
const dirs: string[] = [];
afterEach(() => {
  vi.unstubAllEnvs(); vi.restoreAllMocks();
  for (const dir of dirs.splice(0)) {
    if (path.dirname(dir) !== path.resolve(tmpdir()) || !path.basename(dir).startsWith("cre-release-unit-")) throw new Error("Unsafe cleanup");
    rmSync(dir, { recursive: true, force: true });
  }
});
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "cre-release-unit-")); dirs.push(root);
  const write = (p: string, s: string) => { mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); writeFileSync(path.join(root, p), s); };
  write("server.js", "// unit fixture, not a runtime acceptance artifact");
  write("release-start.cjs", "// entry fixture");
  write(".next/static/test.css", "body{}");
  write(".next/BUILD_ID", "unit-build");
  write(".next/cache/cre-seo-context.json", snapshot);
  write(".next/prerender-manifest.json", JSON.stringify({ routes: Object.fromEntries(productionArticlePaths.map(p => [p, {}])) }));
  const manifest: ReleaseManifest = { version: 1, localOnly: true, buildId: "unit-build",
    platform: process.platform, architecture: process.arch, node: process.version,
    source: { head: "fixture", branch: "fixture", inventory: "", files: { "package-lock.json": "unit" } },
    snapshot, articlePaths: productionArticlePaths,
    files: Object.fromEntries(artifactFiles(root).map(p => [p, sha256(readFileSync(path.join(root, p)))])) };
  const save = () => { write("release-manifest.json", JSON.stringify(manifest)); return sha256(readFileSync(path.join(root, "release-manifest.json"))); };
  return { root, write, manifest, save };
}
describe("local package identity and startup contract", () => {
  it("accepts a consistent package and rejects mutated/missing assets", () => {
    const f = fixture(), digest = f.save();
    expect(verifyRelease(f.root, digest).articlePaths).toHaveLength(8);
    f.write(".next/static/test.css", "corrupt");
    expect(() => verifyRelease(f.root, digest)).toThrow("digest");
    f.write(".next/static/test.css", "body{}");
    rmSync(path.join(f.root, ".next/static/test.css"));
    expect(() => verifyRelease(f.root, digest)).toThrow("inventory");
  });
  it("requires external manifest identity and matching target runtime", () => {
    const f = fixture(); f.save();
    expect(() => verifyRelease(f.root, "0".repeat(64))).toThrow("manifest digest");
    f.manifest.platform = "not-this-platform";
    expect(() => verifyRelease(f.root, f.save())).toThrow("runtime");
  });
  it("rejects extra files, missing snapshot and fixture/ninth-route packages", () => {
    const f = fixture(); const digest = f.save();
    f.write("unexpected.js", "bad");
    expect(() => verifyRelease(f.root, digest)).toThrow("inventory");
    rmSync(path.join(f.root, "unexpected.js"));
    rmSync(path.join(f.root, ".next/cache/cre-seo-context.json"));
    expect(() => verifyRelease(f.root, digest)).toThrow("inventory");
    f.write(".next/cache/cre-seo-context.json", snapshot);
    f.manifest.articlePaths = [...productionArticlePaths, "/content/underwriting/how-to-analyze-cre-operating-expenses"];
    expect(() => verifyRelease(f.root, f.save())).toThrow("identity");
  });
  it("permits only extra runtime response caches while protecting shipped context and code", () => {
    const f = fixture(), digest = f.save();
    const cache = ".next/server/route-cache/APP_PAGE/" + "a".repeat(64) + "/$/index";
    f.write(cache + ".html", "runtime-cache");
    expect(verifyRelease(f.root, digest).articlePaths).toHaveLength(8);
    f.write(cache + ".js", "unapproved-code");
    expect(() => verifyRelease(f.root, digest)).toThrow("inventory");
    rmSync(path.join(f.root, cache + ".js"));
    f.write(".next/cache/cre-seo-context.json", "{}");
    expect(() => verifyRelease(f.root, digest)).toThrow("digest");
  });
  it("rejects credential files and symbolic links", () => {
    const f = fixture(); f.write(".env.production", "not-a-real-secret");
    expect(() => artifactFiles(f.root)).toThrow("Disallowed");
    rmSync(path.join(f.root, ".env.production"));
    symlinkSync(path.join(f.root, ".next"), path.join(f.root, "linked"), "junction");
    expect(() => artifactFiles(f.root)).toThrow("links");
  });
  it.each([
    { CRE_TEST_ONLY_PUBLICATION_DATE: "" }, { PREVIEW_ACCESS_MODE: "public" },
    { SITE_INDEXING_ENABLED: undefined }, { SITE_INDEXING_ENABLED: "true" }, { SITE_ENV: "preview" },
    { SITE_PRODUCTION_ORIGIN: "https://thecreledger.com" }, { NODE_ENV: "development" },
    { PREVIEW_AUTH_PASSWORD: undefined },
  ])("rejects runtime context change %#", change => {
    expect(() => validateRuntime(snapshot, { ...env, ...change })).toThrow();
  });
  it("rejects indexed and editorial/test-contaminated snapshots", () => {
    for (const mutate of [
      (v: ReturnType<typeof JSON.parse>) => { v.context.mode.editorialPreviewEnabled = true; },
      (v: ReturnType<typeof JSON.parse>) => { v.context.mode.fixturesEnabled = true; },
      (v: ReturnType<typeof JSON.parse>) => { v.delivery.testOnlyDatePreviewEnabled = true; },
      (v: ReturnType<typeof JSON.parse>) => { v.context.site.indexingEnabled = true; },
    ]) {
      const v = JSON.parse(snapshot); mutate(v);
      expect(() => requireLocalSnapshot(JSON.stringify(v))).toThrow();
    }
    expect(() => validateRuntime(snapshot, env)).not.toThrow();
  });
});
describe("public-source export boundary", () => {
  it("contains exactly eight articles and rejects date-preview mode in every phase", async () => {
    const { catalog } = await discoverContent("content");
    expect(catalog.articles).toHaveLength(8);
    expect(catalog.articles.every(isPublicArticle)).toBe(true);
    expect(publicArticles(catalog)).toHaveLength(8);
    for (const phase of ["phase-development-server", "phase-production-build", "phase-production-server"]) {
      expect(() => assertTestOnlyMode({ CRE_TEST_ONLY_PUBLICATION_DATE: "" }, process.cwd(), false, phase)).toThrow();
      expect(() => assertTestOnlyMode({}, process.cwd(), true, phase)).toThrow();
    }
  });
});
