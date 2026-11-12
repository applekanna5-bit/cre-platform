import { cpSync, existsSync, lstatSync, readdirSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import ts from "typescript";
import { createHash } from "node:crypto";
import type { ReleaseManifest } from "./release-start.mts";
import { discoverContent } from "../src/content/discovery.ts";
import { projectDeliveryCatalog } from "../src/content/delivery.ts";
import { isPublicArticle } from "../src/content/catalog.ts";

const root = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const runtimeSources = ["scripts/release-start.mts", "src/seo/build-context.ts", "src/seo/context.ts",
  "src/seo/policy.ts", "src/config/site.ts", "src/security/preview-auth.ts"];
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8",
  env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } }).trimEnd();
const digestBytes = (value: Buffer) => createHash("sha256").update(value).digest("hex");
function sourceFiles() {
  const paths = [...new Set(git("ls-files", "-z", "--cached", "--others", "--exclude-standard").split("\0").filter(p => !!p && existsSync(path.join(root, p))))].sort();
  return Object.fromEntries(paths.map(p => [p, digestBytes(readFileSync(path.join(root, p)))]));
}
function outputFiles(directory: string, prefix = ""): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const name of readdirSync(path.join(directory, prefix))) {
    const p = prefix ? prefix + "/" + name : name, stat = lstatSync(path.join(directory, p));
    if (stat.isSymbolicLink()) throw new Error("Build output links are unsupported");
    if (stat.isDirectory()) Object.assign(entries, outputFiles(directory, p));
    else entries[p] = digestBytes(readFileSync(path.join(directory, p)));
  }
  return entries;
}
function buildEvidence() {
  return { source: sourceFiles(), standalone: outputFiles(path.join(root, ".next/standalone")),
    static: outputFiles(path.join(root, ".next/static")), snapshot: read(".next/cache/cre-seo-context.json"),
    generated: digestBytes(readFileSync(path.join(root, "src/content/.generated/index.ts"))) };
}
function compileRuntime(destination: string) {
  mkdirSync(destination, { recursive: true });
  writeFileSync(path.join(destination, "package.json"), '{"type":"commonjs"}\n');
  for (const source of runtimeSources) {
    const target = path.join(destination, source.replace(/\.(?:mts|ts)$/, ".js"));
    mkdirSync(path.dirname(target), { recursive: true });
    const output = ts.transpileModule(read(source), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } });
    writeFileSync(target, output.outputText);
  }
}
function assertAssemblyMode() {
  const indexed = process.env.SITE_INDEXING_ENABLED === "true";
  if (process.env.CRE_TEST_ONLY_PUBLICATION_DATE !== undefined ||
      (indexed ? (process.env.PREVIEW_ACCESS_MODE !== "public" || process.env.SITE_ENV !== "production" ||
        !process.env.SITE_PRODUCTION_ORIGIN || (process.env.CRE_RELEASE_PROFILE === "production-candidate" ?
          process.env.CRE_RELEASE_SIMULATION !== undefined || process.env.PREVIEW_AUTH_USERNAME !== undefined || process.env.PREVIEW_AUTH_PASSWORD !== undefined :
          process.env.CRE_RELEASE_SIMULATION !== "1" || process.env.CRE_RELEASE_PROFILE !== undefined)) :
        (process.env.SITE_INDEXING_ENABLED !== "false" || process.env.PREVIEW_ACCESS_MODE !== "private")))
    throw new Error("Explicit private noindex or owner-authorized local indexed simulation required");
}
async function assemble(destination: string) {
  assertAssemblyMode();
  const parent = realpathSync(path.dirname(destination));
  if (parent !== realpathSync(path.dirname(root)) || !/^package-[a-z0-9-]+$/.test(path.basename(destination)) ||
      existsSync(destination)) throw new Error("Use a new package-* sibling of the isolated repository");
  const retained = read(".next/cache/cre-release-build.json");
  if (retained !== JSON.stringify(buildEvidence())) throw new Error("Source or output changed since release build");
  const generated = read("src/content/.generated/index.ts");
  for (const flag of ["fixturesEnabled", "editorialPreviewEnabled", "testOnlyDatePreviewEnabled"])
    if (!generated.includes("export const " + flag + " = false;")) throw new Error("Unclean generated publication mode");
  const snapshot = read(".next/cache/cre-seo-context.json");
  const buildId = read(".next/BUILD_ID").trim();
  if (read(".next/standalone/.next/BUILD_ID").trim() !== buildId) throw new Error("Standalone build identity mismatch");
  // No existing output is mutated. Failed assemblies remain visibly incomplete.
  mkdirSync(destination);
  compileRuntime(path.join(destination, ".release"));
  const api = createRequire(import.meta.url)(path.join(destination, ".release/scripts/release-start.js")) as typeof import("./release-start.mts");
  api.requireLocalSnapshot(snapshot);
  const context = JSON.parse(snapshot);
  const buildEnv: Record<string, string | undefined> = { ...process.env, NODE_ENV: "production" };
  // Assembly checks target snapshot agreement but never needs real runtime secrets.
  const { catalog, documents } = await discoverContent(path.join(root, "content"));
  const projected = projectDeliveryCatalog(catalog, { fixturesEnabled: false, editorialPreviewEnabled: false });
  const prefix = "export const catalog: ContentCatalog = ";
  const begin = generated.indexOf(prefix);
  const end = generated.indexOf(";\nexport const fixturesEnabled", begin);
  if (begin < 0 || end < 0 || JSON.stringify(JSON.parse(generated.slice(begin + prefix.length, end))) !== JSON.stringify(projected))
    throw new Error("Generated delivery catalog differs from clean public projection");
  const routes = catalog.articles.filter(isPublicArticle).map(a => "/content/" + a.domain + "/" + a.slug).sort();
  if (JSON.stringify(routes) !== JSON.stringify(api.productionArticlePaths) ||
      context.context.site.environment !== (buildEnv.SITE_ENV ?? "development") ||
      context.context.site.productionOrigin !== (buildEnv.SITE_PRODUCTION_ORIGIN ?? null))
    throw new Error("Build/source/assembly context mismatch");
  api.artifactFiles(path.join(root, ".next/standalone"));
  api.artifactFiles(path.join(root, ".next/static"));
  if (existsSync(path.join(root, "public"))) api.artifactFiles(path.join(root, "public"));
  cpSync(path.join(root, ".next/standalone"), destination, { recursive: true, force: false, errorOnExist: true });
  cpSync(path.join(root, ".next/static"), path.join(destination, ".next/static"), { recursive: true, force: false, errorOnExist: true });
  if (existsSync(path.join(root, "public"))) cpSync(path.join(root, "public"), path.join(destination, "public"), { recursive: true, force: false, errorOnExist: true });
  mkdirSync(path.join(destination, ".next/cache"), { recursive: true });
  writeFileSync(path.join(destination, ".next/cache/cre-seo-context.json"), snapshot);
  writeFileSync(path.join(destination, "release-start.cjs"),
    'require("./.release/scripts/release-start.js").startRelease(__dirname);\n');
  const sourcePaths = [...new Set(git("ls-files", "-z", "--cached", "--others", "--exclude-standard").split("\0").filter(p => !!p && existsSync(path.join(root, p))))].sort();
  if (process.env.CRE_RELEASE_PROFILE === "production-candidate") {
    const sourcePackage = JSON.parse(read("package.json"));
    writeFileSync(path.join(destination, "package.json"), JSON.stringify({
      name: sourcePackage.name, version: sourcePackage.version, private: true, type: "commonjs",
      scripts: { start: "node release-start.cjs" }, engines: sourcePackage.engines,
    }, null, 2) + "\n");
  }
  const allSource = Object.fromEntries(sourcePaths.map(p => [p, api.sha256(readFileSync(path.join(root, p)))]));
  const production = process.env.CRE_RELEASE_PROFILE === "production-candidate";
  const privateInputs = new Set(documents.filter(d => !catalog.articles.some(a => a.id === d.metadata.id && isPublicArticle(a)))
    .flatMap(d => [path.relative(root, d.file).replaceAll("\\", "/"), path.relative(root, d.file).replaceAll("\\", "/").replace(/\.mdx$/, ".json")]));
  const publicSource = Object.fromEntries(Object.entries(allSource).filter(([p]) => !privateInputs.has(p) &&
    !p.startsWith("tests/") && p !== "docs/editorial/CRE-013-editorial-record.md" && p !== "scripts/test-only-date-preview.mts"));
  if (production) {
    const denied = ["how-to-analyze-cre-operating-expenses", "capital-expenditures-vs-operating-expenses",
      "fixture-noi-bridge", "fixture-methodology", "fixture-noi", "fixture-loan-sizing", "noi-development-fixture",
      "TEST-" + "ONLY:"];
    for (const p of api.artifactFiles(destination)) {
      if (/^(tests\/|content\/)|\.mdx$|\.dpapi$|test-only-date-preview/.test(p)) throw new Error("Private source path in production artifact");
      const bytes = readFileSync(path.join(destination, p));
      if (denied.some(marker => bytes.includes(Buffer.from(marker)))) throw new Error("Private/test record marker in production artifact");
    }
  }
  const manifest: ReleaseManifest = {
    version: production ? 2 : 1, localOnly: !production,
    ...(production ? { profile: "production-candidate" as const, inputTreeSha256: api.sha256(JSON.stringify(allSource)),
      contentBodies: projected.articles.map(a => { const doc = documents.find(d => d.metadata.id === a.id)!;
        return { id: a.id, route: "/content/" + a.domain + "/" + a.slug, sha256: api.sha256(readFileSync(doc.file)) }; }) } : {}), buildId, platform: process.platform, architecture: process.arch, node: process.version,
    source: { head: git("rev-parse", "HEAD"), branch: git("branch", "--show-current"),
      inventory: production ? "Reviewed eight-article public-source export" : git("status", "--porcelain=v1", "--untracked-files=all"),
      files: production ? publicSource : allSource },
    snapshot, articlePaths: routes,
    files: Object.fromEntries(api.artifactFiles(destination).map(p => [p, api.sha256(readFileSync(path.join(destination, p)))])),
  };
  writeFileSync(path.join(destination, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  const digest = api.sha256(readFileSync(path.join(destination, "release-manifest.json")));
  api.verifyRelease(destination, digest);
  console.log(JSON.stringify({ destination, buildId, articleCount: routes.length, manifestSha256: digest,
    profile: manifest.profile ?? "local-simulation",
    platform: process.platform, architecture: process.arch, node: process.version, localOnly: manifest.localOnly }));
}
const [command, argument, digest] = process.argv.slice(2);
if (command === "build") {
  assertAssemblyMode();
  if (!process.env.npm_execpath) throw new Error("Run npm run release:build");
  const before = JSON.stringify(sourceFiles());
  execFileSync(process.execPath, [process.env.npm_execpath, "run", "build"], { cwd: root, stdio: "inherit" });
  if (before !== JSON.stringify(sourceFiles())) throw new Error("Source changed during release build");
  writeFileSync(path.join(root, ".next/cache/cre-release-build.json"), JSON.stringify(buildEvidence()));
  console.log("Recorded local build/source fingerprint binding.");
} else if (command === "test") {
  if (!argument) throw new Error("An explicit package is required");
  const packageRoot = path.resolve(argument);
  const manifest = JSON.parse(readFileSync(path.join(packageRoot, "release-manifest.json"), "utf8")) as ReleaseManifest;
  const indexed = JSON.parse(manifest.snapshot).context.site.indexingEnabled === true;
  execFileSync(process.execPath, [path.join(root, "node_modules/vitest/vitest.mjs"), "run",
    indexed ? "tests/indexed-release.test.ts" : "tests/standalone.test.ts"],
    { cwd: root, stdio: "inherit", env: { ...process.env, CRE_STANDALONE_TEST: indexed ? undefined : "1",
      CRE_INDEXED_TEST: indexed ? "1" : undefined, CRE_RELEASE_PACKAGE: packageRoot } });
} else {
if (!argument || !["assemble", "verify"].includes(command)) throw new Error("Usage: release-package.mts assemble <new package-* sibling> | verify <package> <retained manifest SHA256>");
const destination = path.resolve(argument);
if (command === "assemble") await assemble(destination);
else {
  if (!digest) throw new Error("An independently retained manifest digest is required");
  // Verify the externally retained digest and executable bytes BEFORE loading package code.
  const bytes = readFileSync(path.join(destination, "release-manifest.json"));
  if (!/^[a-f0-9]{64}$/.test(digest) || digestBytes(bytes) !== digest) throw new Error("Retained manifest digest mismatch");
  const retained = JSON.parse(bytes.toString()) as ReleaseManifest;
  for (const [p, hash] of Object.entries(retained.files)) {
    if (p.startsWith("/") || p.includes("\\") || p.includes(":") || p.split("/").some(v => v === ".." || v === "."))
      throw new Error("Unsafe manifest path");
    let cursor = destination;
    for (const part of p.split("/")) {
      cursor = path.join(cursor, part);
      if (lstatSync(cursor).isSymbolicLink()) throw new Error("Package links are unsupported");
    }
    if (digestBytes(readFileSync(path.join(destination, p))) !== hash) throw new Error("Package digest mismatch");
  }
  const api = createRequire(import.meta.url)(path.join(destination, ".release/scripts/release-start.js")) as typeof import("./release-start.mts");
  const manifest = api.verifyRelease(destination, digest);
  console.log(JSON.stringify({ verified: true, buildId: manifest.buildId, articleCount: manifest.articlePaths.length }));
}

}
