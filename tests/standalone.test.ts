import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { productionArticlePaths, sha256, verifyRelease } from "../scripts/release-start.mts";

describe.skipIf(process.env.CRE_STANDALONE_TEST !== "1")("assembled standalone private-eight acceptance", () => {
  let root: string, temp: string, origin: string, child: ChildProcess | undefined;
  let env: NodeJS.ProcessEnv, authorization: string, logs = "", digest: string;
  const fetchLocal = (route: string, headers: Record<string, string> = {}, method = "GET") =>
    fetch(origin + route, { method, redirect: "manual", headers: { authorization, ...headers }, signal: AbortSignal.timeout(5000) });
  async function navigation(route: string, headers: Record<string, string>) {
    let response = await fetchLocal(route, headers);
    if (response.status === 307) {
      const location = response.headers.get("location");
      expect(location).toBeTruthy();
      const target = new URL(location!, origin);
      expect(target.origin).toBe(origin);
      expect(target.pathname).toBe(route);
      expect(target.searchParams.has("_rsc")).toBe(true);
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      response = await fetchLocal(target.pathname + target.search, headers);
    }
    return response;
  }
  async function stop() {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const active = child;
    await new Promise<void>(resolve => {
      const timer = setTimeout(() => active.kill("SIGKILL"), 2000);
      active.once("exit", () => { clearTimeout(timer); resolve(); }); active.kill();
    });
  }
  beforeAll(async () => {
    if (!process.env.CRE_RELEASE_PACKAGE) throw new Error("Explicit assembled package is required; build outside tests");
    const source = path.resolve(process.env.CRE_RELEASE_PACKAGE);
    digest = sha256(readFileSync(path.join(source, "release-manifest.json")));
    verifyRelease(source, digest);
    temp = mkdtempSync(path.join(tmpdir(), "cre-standalone-acceptance-"));
    root = path.join(temp, "relocated-package");
    cpSync(source, root, { recursive: true });
    expect(existsSync(path.join(root, "src/content/.generated/index.ts"))).toBe(false);
    const listener = createServer();
    await new Promise<void>(resolve => listener.listen(0, "127.0.0.1", resolve));
    const address = listener.address(); if (!address || typeof address === "string") throw new Error("No port");
    const port = address.port;
    await new Promise<void>(resolve => listener.close(() => resolve()));
    origin = "http://127.0.0.1:" + port;
    const username = "local-" + randomBytes(8).toString("hex"), password = randomBytes(32).toString("hex");
    authorization = "Basic " + Buffer.from(username + ":" + password).toString("base64");
    const manifest = verifyRelease(root, digest), site = JSON.parse(manifest.snapshot).context.site;
    env = { ...process.env, NODE_ENV: "production", SITE_ENV: site.environment,
      SITE_INDEXING_ENABLED: "false", PREVIEW_ACCESS_MODE: "private", SITE_PRODUCTION_ORIGIN: site.productionOrigin ?? undefined,
      CRE_TEST_ONLY_PUBLICATION_DATE: undefined, CRE_RELEASE_MANIFEST_SHA256: digest,
      PREVIEW_AUTH_USERNAME: username, PREVIEW_AUTH_PASSWORD: password, HOSTNAME: "127.0.0.1", PORT: String(port) };
    child = spawn(process.execPath, ["release-start.cjs"], { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout!.on("data", b => { logs += String(b); }); child.stderr!.on("data", b => { logs += String(b); });
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (child.exitCode !== null) throw new Error("Guarded standalone exited before readiness");
      try { const r = await fetchLocal("/icon.svg"); if (r.status === 200) { ready = true; break; } } catch { /* bounded startup polling */ }
      await delay(100);
    }
    if (!ready) throw new Error("Guarded standalone failed readiness");
  }, 45000);
  afterAll(async () => {
    await stop();
    if (temp) {
      if (path.dirname(temp) !== path.resolve(tmpdir()) || !path.basename(temp).startsWith("cre-standalone-acceptance-")) throw new Error("Unsafe cleanup");
      rmSync(temp, { recursive: true, force: true });
    }
  }, 45000);
  it("serves exactly eight article routes with noindex and no canonical/schema leakage", async () => {
    const manifest = verifyRelease(root, digest);
    expect(manifest.articlePaths).toEqual(productionArticlePaths);
    for (const route of ["/", "/library", "/search", "/search?q=operating", ...productionArticlePaths]) {
      const response = await fetchLocal(route); expect(response.status, route).toBe(200);
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(response.headers.get("cache-control")).toContain("no-store");
      const html = await response.text();
      expect(html).toContain('name="robots" content="noindex, nofollow"');
      expect(html).not.toMatch(/rel="canonical"|application\/ld\+json|TEST-ONLY:/);
      expect(html).not.toContain("/content/underwriting/how-to-analyze-cre-operating-expenses");
      expect(html).not.toContain("/content/underwriting/capital-expenditures-vs-operating-expenses");
      expect(html).not.toContain("noi-development-fixture");
      if (route === "/library") {
        const paths = [...html.matchAll(/href="(\/content\/[^"]+)"/g)].map(m => m[1]);
        expect([...new Set(paths)].sort()).toEqual(productionArticlePaths);
      }
    }
  });
  it.each(["how-to-analyze-cre-operating-expenses", "capital-expenditures-vs-operating-expenses", "noi-development-fixture"])("keeps %s nonpublic across navigation variants", async slug => {
    for (const headers of [{}, { rsc: "1" }, { "next-router-prefetch": "1" }]) {
      const r = await navigation("/content/underwriting/" + slug, headers as Record<string, string>);
      expect(r.status).toBe(404); expect(r.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
  });
  it("keeps editorial/design/private unknown routes unavailable", async () => {
    for (const route of ["/design-preview/living-ledger", "/design-preview/living-ledger-cinematic", "/editorial", "/unknown-release-route"]) {
      for (const headers of [{}, { rsc: "1", "next-router-prefetch": "1" }]) {
        const r = await navigation(route, headers as Record<string, string>); expect(r.status, route).toBe(404);
        expect(r.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      }
    }
  });
  it("serves authenticated robots and empty XML sitemap", async () => {
    const robots = await fetchLocal("/robots.txt"); expect(robots.status).toBe(200);
    const text = await robots.text(); expect(text).toContain("Allow: /"); expect(text).not.toContain("Sitemap:");
    const sitemap = await fetchLocal("/sitemap.xml"); expect(sitemap.status).toBe(200);
    expect(sitemap.headers.get("content-type")).toContain("xml"); expect(await sitemap.text()).not.toContain("<loc>");
  });
  it("serves all shipped static assets with exact bytes, MIME and private authentication", async () => {
    const manifest = verifyRelease(root, digest);
    const assets = Object.keys(manifest.files).filter(p => p.startsWith(".next/static/") || p.startsWith("public/"));
    expect(assets.some(p => p.endsWith(".css"))).toBe(true);
    expect(assets.some(p => /\.woff2?$/.test(p))).toBe(true);
    for (const asset of assets) {
      const url = asset.startsWith("public/") ? "/" + asset.slice(7) : "/_next/static/" + asset.slice(13);
      const response = await fetchLocal(url); expect(response.status, url).toBe(200);
      const bytes = Buffer.from(await response.arrayBuffer()); expect(bytes.length).toBeGreaterThan(0);
      expect(sha256(bytes), url).toBe(manifest.files[asset]);
      expect(response.headers.get("content-type"), url).not.toContain("text/html");
      const anon = await fetchLocal(url, { authorization: "" }); expect(anon.status, url).toBe(401);
      expect(anon.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
  });
  it("denies bad credentials across pages/metadata/RSC and supports authenticated HEAD", async () => {
    for (const route of ["/", "/library", "/search?q=NOI", productionArticlePaths[0], "/robots.txt", "/sitemap.xml", "/icon.svg"]) {
      for (const auth of ["", "Basic invalid", "Basic " + Buffer.from("bad:" + "x".repeat(40)).toString("base64"), authorization + ", " + authorization]) {
        const r = await fetchLocal(route, { authorization: auth, rsc: "1" });
        expect(r.status, route).toBe(401); expect(r.headers.get("cache-control")).toContain("no-store");
        expect(await r.text()).not.toContain(env.PREVIEW_AUTH_PASSWORD);
      }
      expect((await fetchLocal(route, {}, "HEAD")).status).toBe(200);
    }
    expect(logs).not.toContain(env.PREVIEW_AUTH_PASSWORD);
    expect(logs).not.toContain(authorization);
  });
  it("normalizes slash with manual redirects and does not derive canonicals from Host/query", async () => {
    const r = await fetchLocal("/library/?tracking=1"); expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("/library?tracking=1");
    const poisoned = await fetchLocal("/library?tracking=1", { host: "untrusted.invalid" });
    expect(poisoned.status).toBe(200); expect(await poisoned.text()).not.toContain('rel="canonical"');
  });
  it.each([
    { CRE_TEST_ONLY_PUBLICATION_DATE: "" }, { SITE_ENV: "preview" }, { PREVIEW_ACCESS_MODE: "public" },
    { SITE_PRODUCTION_ORIGIN: "https://thecreledger.com" }, { SITE_INDEXING_ENABLED: undefined },
    { NODE_ENV: "development" as const }, { CRE_RELEASE_MANIFEST_SHA256: "0".repeat(64) }, { PREVIEW_AUTH_PASSWORD: undefined },
  ])("rejects unsafe startup before listening %#", change => {
    const result = spawnSync(process.execPath, ["release-start.cjs"], { cwd: root, env: { ...env, ...change },
      windowsHide: true, encoding: "utf8", timeout: 10000 });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Release startup rejected");
    expect(result.stdout).not.toContain("Ready");
    expect(result.stderr).not.toContain(env.PREVIEW_AUTH_PASSWORD);
  });
  it("restores a local corrupted package and rechecks actual HTTP (not host rollback)", async () => {
    await stop();
    const restored = path.join(temp, "recovery-package");
    cpSync(root, restored, { recursive: true });
    const manifest = verifyRelease(restored, digest);
    const asset = Object.keys(manifest.files).find(p => p.startsWith(".next/static/") && p.endsWith(".css"))!;
    const saved = readFileSync(path.join(restored, asset));
    writeFileSync(path.join(restored, asset), "corrupt-B");
    expect(() => verifyRelease(restored, digest)).toThrow("digest");
    const rejected = spawnSync(process.execPath, ["release-start.cjs"], { cwd: restored, env,
      windowsHide: true, encoding: "utf8", timeout: 10000 });
    expect(rejected.status).toBe(1); expect(rejected.stderr).toContain("Release startup rejected");
    writeFileSync(path.join(restored, asset), saved);
    expect(verifyRelease(restored, digest).buildId).toBe(manifest.buildId);
    // Context tampering is likewise rejected before startup, then restored exactly.
    const contextPath = path.join(restored, ".next/cache/cre-seo-context.json");
    const context = readFileSync(contextPath);
    writeFileSync(contextPath, "{}");
    const badContext = spawnSync(process.execPath, ["release-start.cjs"], { cwd: restored, env,
      windowsHide: true, encoding: "utf8", timeout: 10000 });
    expect(badContext.status).toBe(1);
    writeFileSync(contextPath, context);
    verifyRelease(restored, digest);
    child = spawn(process.execPath, ["release-start.cjs"], { cwd: restored, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout!.on("data", b => { logs += String(b); }); child.stderr!.on("data", b => { logs += String(b); });
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (child.exitCode !== null) throw new Error("Restored package startup failed");
      try { if ((await fetchLocal("/icon.svg")).status === 200) { ready = true; break; } } catch { /* bounded retry */ }
      await delay(100);
    }
    expect(ready).toBe(true);
    for (const route of productionArticlePaths) {
      const response = await fetchLocal(route); expect(response.status).toBe(200);
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
    const response = await fetchLocal("/_next/static/" + asset.slice(13));
    expect(response.status).toBe(200); expect(sha256(Buffer.from(await response.arrayBuffer()))).toBe(manifest.files[asset]);
    expect((await fetchLocal("/library", { authorization: "" })).status).toBe(401);
    expect((await fetchLocal("/content/underwriting/how-to-analyze-cre-operating-expenses")).status).toBe(404);
    expect((await fetchLocal("/content/underwriting/capital-expenditures-vs-operating-expenses")).status).toBe(404);
    expect(await (await fetchLocal("/sitemap.xml")).text()).not.toContain("<loc>");
  }, 30000);
});
