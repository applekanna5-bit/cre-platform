import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { serializeBuildContext, assertBuildContextSnapshot } from "../src/seo/build-context";
import { resolveSeoContext } from "../src/seo/context";
import { authorizePreview } from "../src/security/preview-auth";

export const productionArticlePaths = [
  "capitalization-rate-property-valuation", "contract-rent-vs-market-rent",
  "cre-revenue-underwriting", "debt-service-coverage-ratio-cre-underwriting",
  "gross-potential-income-effective-gross-income", "net-operating-income-underwritten-noi",
  "rent-roll-analysis", "t12-operating-statement",
].map(slug => "/content/underwriting/" + slug).sort();
export const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
export interface ReleaseManifest {
  version: 1 | 2;
  localOnly: boolean;
  profile?: "production-candidate";
  inputTreeSha256?: string;
  contentBodies?: { id: string; route: string; sha256: string }[];
  buildId: string;
  platform: string;
  architecture: string;
  node: string;
  source: { head: string; branch: string; inventory: string; files: Record<string, string> };
  snapshot: string;
  articlePaths: string[];
  files: Record<string, string>;
}
/** Reject links, credentials and nonportable path names before reading/copying. */
export function artifactFiles(root: string, prefix = ""): string[] {
  return readdirSync(path.join(root, prefix)).sort().flatMap(name => {
    const relative = prefix ? prefix + "/" + name : name;
    if (name.includes("\\") || name.includes(":") || /^(?:\.env(?:\..*)?|\.git|id_rsa|id_ed25519|credentials(?:\..*)?)$/i.test(name) ||
        /\.(?:pem|key|pfx)$/i.test(name)) throw new Error("Disallowed artifact path");
    const stat = lstatSync(path.join(root, relative));
    if (stat.isSymbolicLink()) throw new Error("Artifact links are not supported");
    if (stat.isDirectory()) return artifactFiles(root, relative);
    if (!stat.isFile()) throw new Error("Unsupported artifact entry");
    return [relative];
  });
}
export function requireLocalSnapshot(snapshot: string) {
  const value = JSON.parse(snapshot);
  const indexed = value.context?.site?.indexingEnabled;
  if (typeof indexed !== "boolean" || value.context?.mode?.fixturesEnabled !== false || value.context?.mode?.editorialPreviewEnabled !== false ||
      value.delivery?.testOnlyDatePreviewEnabled !== false || value.delivery?.testOnlyPublicationDatePresent !== false ||
      value.delivery?.accessMode !== (indexed ? "public" : "private") || value.delivery?.nodeEnvironment !== "production" ||
      value.context?.policy?.indexingAllowed !== indexed ||
      value.context?.policy?.robotsHeader !== (indexed ? null : "noindex, nofollow")) throw new Error("Only clean eight-article release contexts are authorized");
  const context = resolveSeoContext({
    SITE_ENV: value.context.site.environment,
    SITE_INDEXING_ENABLED: String(indexed),
    SITE_PRODUCTION_ORIGIN: value.context.site.productionOrigin ?? undefined,
  }, { fixturesEnabled: false, editorialPreviewEnabled: false });
  assertBuildContextSnapshot(snapshot, serializeBuildContext(context, {
    accessMode: indexed ? "public" : "private", nodeEnvironment: "production",
    testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false,
  }));
  return context;
}
export function verifyRelease(root: string, expectedDigest?: string): ReleaseManifest {
  const manifestBytes = readFileSync(path.join(root, "release-manifest.json"));
  if (expectedDigest !== undefined && (!/^[a-f0-9]{64}$/.test(expectedDigest) || sha256(manifestBytes) !== expectedDigest))
    throw new Error("Release manifest digest mismatch");
  const manifest = JSON.parse(manifestBytes.toString()) as ReleaseManifest;
  const production = manifest.version === 2 && manifest.localOnly === false && manifest.profile === "production-candidate";
  const local = manifest.version === 1 && manifest.localOnly === true && manifest.profile === undefined;
  if ((!production && !local) || manifest.platform !== process.platform ||
      manifest.architecture !== process.arch || manifest.node !== process.version ||
      JSON.stringify(manifest.articlePaths) !== JSON.stringify(productionArticlePaths) ||
      !manifest.source?.head || !Object.keys(manifest.source.files).length) throw new Error("Unsupported release identity or runtime");
  const context = requireLocalSnapshot(manifest.snapshot);
  if (production && (!context.policy.indexingAllowed || !/^[a-f0-9]{64}$/.test(manifest.inputTreeSha256 ?? "") ||
      !manifest.contentBodies || manifest.contentBodies.length !== 8 ||
      new Set(manifest.contentBodies.map(b => b.id)).size !== 8 ||
      JSON.stringify(manifest.contentBodies.map(b => b.route).sort()) !== JSON.stringify(productionArticlePaths) ||
      manifest.contentBodies.some(b => !/^[a-f0-9]{64}$/.test(b.sha256))))
    throw new Error("Production content attestation mismatch");
  // Next 16 writes APP_PAGE/APP_ROUTE response caches at runtime. Only additional
  // cache entries are mutable; every shipped file, including the SEO snapshot,
  // remains in the immutable hash set.
  const actualFiles = artifactFiles(root).filter(file => file !== "release-manifest.json" &&
    (file in manifest.files || !(file.startsWith(".next/cache/") ||
      (/^\.next\/server\/route-cache\/(APP_PAGE|APP_ROUTE)\/[a-f0-9]{64}\/\$\//.test(file) &&
       /\.(html|meta|rsc|body)$/.test(file)))));

  const wanted = Object.keys(manifest.files).sort();
  if (JSON.stringify(actualFiles.sort()) !== JSON.stringify(wanted)) throw new Error("Release file inventory mismatch");
  for (const file of wanted) {
    if (file.startsWith("/") || file.includes("\\") || file.split("/").some(part => part === "." || part === "..") ||
        sha256(readFileSync(path.join(root, file))) !== manifest.files[file]) throw new Error("Release file digest mismatch");
  }
  if (readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim() !== manifest.buildId ||
      readFileSync(path.join(root, ".next/cache/cre-seo-context.json"), "utf8") !== manifest.snapshot)
    throw new Error("Release build/context mismatch");
  const prerender = JSON.parse(readFileSync(path.join(root, ".next/prerender-manifest.json"), "utf8"));
  const routes = Object.keys(prerender.routes).filter(p => p.startsWith("/content/")).sort();
  if (JSON.stringify(routes) !== JSON.stringify(productionArticlePaths)) throw new Error("Release publication routes mismatch");
  if (!existsSync(path.join(root, "server.js")) || !wanted.some(p => p.startsWith(".next/static/")) ||
      !wanted.includes("release-start.cjs")) throw new Error("Incomplete standalone package");
  return manifest;
}
export function validateRuntime(snapshot: string, env: Readonly<Record<string, string | undefined>>, profile?: "production-candidate") {
  const context = requireLocalSnapshot(snapshot);
  const indexed = context.site.indexingEnabled;
  const production = profile === "production-candidate";
  if (production && (!indexed || env.CRE_RELEASE_PROFILE !== "production-candidate" ||
      env.CRE_RELEASE_SIMULATION !== undefined || env.PREVIEW_AUTH_USERNAME !== undefined || env.PREVIEW_AUTH_PASSWORD !== undefined))
    throw new Error("Unauthorized production-candidate runtime");
  if (env.CRE_TEST_ONLY_PUBLICATION_DATE !== undefined || env.SITE_INDEXING_ENABLED !== String(indexed) ||
      env.NODE_ENV !== "production" || env.PREVIEW_ACCESS_MODE !== (indexed ? "public" : "private") ||
      (indexed ? (!production && (env.CRE_RELEASE_SIMULATION !== "1" || env.HOSTNAME !== "127.0.0.1")) :
        authorizePreview(null, { PREVIEW_ACCESS_MODE: env.PREVIEW_ACCESS_MODE, PREVIEW_AUTH_USERNAME: env.PREVIEW_AUTH_USERNAME, PREVIEW_AUTH_PASSWORD: env.PREVIEW_AUTH_PASSWORD }) === "unavailable"))
    throw new Error("Unauthorized release runtime");

  const runtime = resolveSeoContext({ SITE_ENV: env.SITE_ENV, SITE_INDEXING_ENABLED: env.SITE_INDEXING_ENABLED,
    SITE_PRODUCTION_ORIGIN: env.SITE_PRODUCTION_ORIGIN }, context.mode);
  assertBuildContextSnapshot(snapshot, serializeBuildContext(runtime, {
    accessMode: env.PREVIEW_ACCESS_MODE, nodeEnvironment: env.NODE_ENV,
    testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false,
  }));
}
export function startRelease(root: string) {
  try {
    if (!process.env.CRE_RELEASE_MANIFEST_SHA256) throw new Error("Retained manifest digest is required");
    const manifest = verifyRelease(root, process.env.CRE_RELEASE_MANIFEST_SHA256);
    validateRuntime(manifest.snapshot, process.env, manifest.profile);
  } catch {
    // Neither raw environment, credentials nor artifact contents reach diagnostics.
    console.error("Release startup rejected: artifact or runtime context failed validation.");
    process.exitCode = 1;
    return;
  }
  process.chdir(root);
  createRequire(path.join(root, "server.js"))(path.join(root, "server.js"));
}
