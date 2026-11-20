import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copyPackageContents } from "../scripts/release-copy.mts";
import { artifactFiles, productionArticlePaths, sha256, verifyRelease, validateRuntime, type ReleaseManifest } from "../scripts/release-start.mts";
import { serializeBuildContext } from "@/seo/build-context";
import { resolveSeoContext } from "@/seo/context";

vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, cpSync: vi.fn(actual.cpSync) };
});
const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
const roots: string[] = [];
afterEach(() => {
  vi.mocked(cpSync).mockReset().mockImplementation(actual.cpSync);
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith("cre-copy-unit-")) throw new Error("Unsafe cleanup");
    rmSync(root, { recursive: true, force: true });
  }
});
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "cre-copy-unit-")); roots.push(root);
  const source = path.join(root, "source"), destination = path.join(root, "package-target");
  mkdirSync(source); mkdirSync(path.join(destination, ".release"), { recursive: true });
  writeFileSync(path.join(destination, ".release/guard.js"), "guard-original");
  mkdirSync(path.join(source, ".next/static"), { recursive: true });
  writeFileSync(path.join(source, ".next/static/app.css"), "body{}");
  writeFileSync(path.join(source, "server.js"), "// fictional test server");
  return { root, source, destination };
}
describe("prepared-root package copy", () => {
  it("copies into the existing prepared root while retaining its guard and strict copy options", () => {
    const f = fixture(); copyPackageContents(f.source, f.destination);
    expect(readFileSync(path.join(f.destination, ".release/guard.js"), "utf8")).toBe("guard-original");
    expect(readFileSync(path.join(f.destination, ".next/static/app.css"), "utf8")).toBe("body{}");
    for (const call of vi.mocked(cpSync).mock.calls) {
      expect(call[1]).not.toBe(f.destination);
      expect(call[2]).toEqual({ recursive: true, force: false, errorOnExist: true });
    }
  });
  it.each(["server.js", ".next", "SERVER.JS"])("rejects existing target %s before copying anything", name => {
    const f = fixture(); writeFileSync(path.join(f.destination, name), "retained");
    expect(() => copyPackageContents(f.source, f.destination)).toThrow("collision");
    expect(cpSync).not.toHaveBeenCalled();
    expect(readFileSync(path.join(f.destination, name), "utf8")).toBe("retained");
  });
  it.each([".release", "release-start.cjs", "release-manifest.json"])("rejects shipped guard/manifest collision %s", name => {
    const f = fixture(); writeFileSync(path.join(f.source, name), "unexpected");
    expect(() => copyPackageContents(f.source, f.destination)).toThrow("collision");
    expect(cpSync).not.toHaveBeenCalled();
  });
  it("propagates a partial copy failure without retrying, overwriting guards or completing a manifest", () => {
    const f = fixture(); vi.mocked(cpSync).mockImplementationOnce(actual.cpSync).mockImplementationOnce(() => { throw new Error("simulated I/O failure"); });
    expect(() => copyPackageContents(f.source, f.destination)).toThrow("simulated I/O failure");
    expect(cpSync).toHaveBeenCalledTimes(2);
    expect(existsSync(path.join(f.destination, ".next/static/app.css"))).toBe(true);
    expect(existsSync(path.join(f.destination, "release-manifest.json"))).toBe(false);
    expect(readFileSync(path.join(f.destination, ".release/guard.js"), "utf8")).toBe("guard-original");
    expect(() => copyPackageContents(f.source, f.destination)).toThrow("collision");
  });
  it("rejects a missing source and missing prepared destination", () => {
    const f = fixture(); expect(() => copyPackageContents(path.join(f.root, "missing"), f.destination)).toThrow();
    expect(() => copyPackageContents(f.source, path.join(f.root, "missing"))).toThrow();
    expect(cpSync).not.toHaveBeenCalled();
  });
  it("rejects relative paths and overlapping trees", () => {
    const f = fixture(); expect(() => copyPackageContents("source", f.destination)).toThrow("absolute");
    expect(() => copyPackageContents(f.source, f.source)).toThrow("overlap");
    expect(() => copyPackageContents(f.root, f.destination)).toThrow("overlap");
    expect(cpSync).not.toHaveBeenCalled();
  });
  it("rejects symlinked roots and nested entries before copying", () => {
    const f = fixture(); const link = path.join(f.root, "linked-source"); symlinkSync(f.source, link, "junction");
    expect(() => copyPackageContents(link, f.destination)).toThrow();
    symlinkSync(f.destination, path.join(f.source, "linked-target"), "junction");
    expect(() => copyPackageContents(f.source, f.destination)).toThrow("links");
    expect(cpSync).not.toHaveBeenCalled();
  });
  it("preserves the immutable manifest and guarded startup verification contract", () => {
    const f = fixture(); copyPackageContents(f.source, f.destination);
    const write = (file: string, value: string) => { mkdirSync(path.dirname(path.join(f.destination, file)), { recursive: true }); writeFileSync(path.join(f.destination, file), value); };
    const snapshot = serializeBuildContext(resolveSeoContext({ SITE_INDEXING_ENABLED: "false" }, { fixturesEnabled: false, editorialPreviewEnabled: false }), {
      accessMode: "private", nodeEnvironment: "production", testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false,
    });
    write("release-start.cjs", "// fictional guarded entry"); write(".next/BUILD_ID", "copy-test"); write(".next/cache/cre-seo-context.json", snapshot);
    write(".next/prerender-manifest.json", JSON.stringify({ routes: Object.fromEntries(productionArticlePaths.map(p => [p, {}])) }));
    const manifest: ReleaseManifest = { version: 1, localOnly: true, buildId: "copy-test", platform: process.platform, architecture: process.arch, node: process.version,
      source: { head: "fixture", branch: "fixture", inventory: "", files: { "input": "fixture" } }, snapshot, articlePaths: productionArticlePaths,
      files: Object.fromEntries(artifactFiles(f.destination).map(p => [p, sha256(readFileSync(path.join(f.destination, p)))])) };
    const bytes = JSON.stringify(manifest); write("release-manifest.json", bytes); const digest = sha256(bytes);
    expect(verifyRelease(f.destination, digest).articlePaths).toHaveLength(8);
    write(".release/guard.js", "tampered"); expect(() => verifyRelease(f.destination, digest)).toThrow("digest");
    write(".release/guard.js", "guard-original"); rmSync(path.join(f.destination, ".next/static/app.css"));
    expect(() => verifyRelease(f.destination, digest)).toThrow("inventory");
  });
});

describe("copy change retains publication context isolation", () => {
  it.each([true, false])("keeps indexed=%s startup bound to its built context", indexed => {
    const site = { SITE_ENV: "production", SITE_INDEXING_ENABLED: String(indexed), ...(indexed ? { SITE_PRODUCTION_ORIGIN: "https://thecreledger.com" } : {}) };
    const snapshot = serializeBuildContext(resolveSeoContext(site, { fixturesEnabled: false, editorialPreviewEnabled: false }), {
      accessMode: indexed ? "public" : "private", nodeEnvironment: "production", testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false,
    });
    const env = { ...site, NODE_ENV: "production", PREVIEW_ACCESS_MODE: indexed ? "public" : "private",
      ...(indexed ? { CRE_RELEASE_PROFILE: "production-candidate" } : { PREVIEW_AUTH_USERNAME: "unit-user", PREVIEW_AUTH_PASSWORD: "p".repeat(48) }) };
    const profile = indexed ? "production-candidate" as const : undefined;
    expect(() => validateRuntime(snapshot, env, profile)).not.toThrow();
    expect(() => validateRuntime(snapshot, { ...env, PREVIEW_ACCESS_MODE: indexed ? "private" : "public" }, profile)).toThrow();
    expect(() => validateRuntime(snapshot, { ...env, SITE_INDEXING_ENABLED: String(!indexed) }, profile)).toThrow();
  });
});
