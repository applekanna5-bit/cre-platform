import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { tmpdir } from "node:os";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { discoverContent } from "@/content/discovery";
import { articleRoute, isPublicArticle } from "@/content/catalog";
import { productionArticlePaths, sha256, verifyRelease } from "../scripts/release-start.mts";

const productionProfile = process.env.CRE_RELEASE_PROFILE === "production-candidate";
describe.skipIf(process.env.CRE_INDEXED_TEST !== "1")("local eight-article indexed standalone acceptance", () => {
  let root: string, temp: string, origin: string, canonicalOrigin: string, digest: string;
  let child: ChildProcess | undefined, env: NodeJS.ProcessEnv;
  const get = (route: string, headers: Record<string, string> = {}, method = "GET") =>
    fetch(origin + route, { method, headers, redirect: "manual", signal: AbortSignal.timeout(5000) });
  const schemas = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  beforeAll(async () => {
    if (!process.env.CRE_RELEASE_PACKAGE) throw new Error("Explicit indexed package required");
    const source = path.resolve(process.env.CRE_RELEASE_PACKAGE);
    digest = sha256(readFileSync(path.join(source, "release-manifest.json")));
    const manifest = verifyRelease(source, digest);
    const snapshot = JSON.parse(manifest.snapshot);
    expect(snapshot.context.site.indexingEnabled).toBe(true);
    canonicalOrigin = snapshot.context.site.productionOrigin;
    temp = mkdtempSync(path.join(tmpdir(), "cre-indexed-acceptance-"));
    root = path.join(temp, "package"); cpSync(source, root, { recursive: true });
    expect(existsSync(path.join(root, "src/content/.generated/index.ts"))).toBe(false);
    const listener = createServer(); await new Promise<void>(r => listener.listen(0, "127.0.0.1", r));
    const address = listener.address(); if (!address || typeof address === "string") throw new Error("No port");
    const port = address.port; await new Promise<void>(r => listener.close(() => r()));
    origin = "http://127.0.0.1:" + port;
    env = { ...process.env, NODE_ENV: "production", SITE_ENV: "production", PREVIEW_ACCESS_MODE: "public",
      SITE_INDEXING_ENABLED: "true", SITE_PRODUCTION_ORIGIN: canonicalOrigin, CRE_RELEASE_SIMULATION: productionProfile ? undefined : "1",
      CRE_RELEASE_PROFILE: productionProfile ? "production-candidate" : undefined,
      CRE_RELEASE_MANIFEST_SHA256: digest, CRE_TEST_ONLY_PUBLICATION_DATE: undefined,
      PREVIEW_AUTH_USERNAME: undefined, PREVIEW_AUTH_PASSWORD: undefined, HOSTNAME: "127.0.0.1", PORT: String(port) };
    child = spawn(process.execPath, ["release-start.cjs"], { cwd: root, env, windowsHide: true, stdio: ["ignore", "ignore", "ignore"] });
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (child.exitCode !== null) throw new Error("Indexed simulation startup failed");
      try { if ((await get("/icon.svg")).status === 200) { ready = true; break; } } catch { /* bounded readiness */ }
      await delay(100);
    }
    expect(ready).toBe(true);
  }, 45000);
  afterAll(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const active = child;
      await new Promise<void>(r => { const timer = setTimeout(() => active.kill("SIGKILL"), 2000);
        active.once("exit", () => { clearTimeout(timer); r(); }); active.kill(); });
    }
    if (temp) {
      if (path.dirname(temp) !== path.resolve(tmpdir()) || !path.basename(temp).startsWith("cre-indexed-acceptance-")) throw new Error("Unsafe cleanup");
      rmSync(temp, { recursive: true, force: true });
    }
  }, 45000);
  it("serves eight public articles with unique exact metadata, canonical and genuine Article/Breadcrumb JSON-LD", async () => {
    const { catalog } = await discoverContent("content");
    const approved = catalog.articles.filter(isPublicArticle);
    expect(approved.map(articleRoute).sort()).toEqual(productionArticlePaths);
    const titles = new Set(), descriptions = new Set();
    for (const article of approved) {
      const route = articleRoute(article), response = await get(route);
      expect(response.status, route).toBe(200);
      expect(response.headers.get("x-robots-tag")).toBeNull();
      expect(response.headers.has("www-authenticate")).toBe(false);
      const html = await response.text();
      expect(html).toContain('name="robots" content="index, follow"');
      expect(html).toContain('name="googlebot" content="index, follow"');
      expect(html).toContain('rel="canonical" href="' + canonicalOrigin + route + '"');
      const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1], desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
      expect(title).toBeTruthy(); expect(desc).toBeTruthy(); titles.add(title); descriptions.add(desc);
      const data = schemas(html); expect(data).toHaveLength(2);
      const schema = data.find(v => v["@type"] === "Article"), breadcrumbs = data.find(v => v["@type"] === "BreadcrumbList");
      expect(schema).toMatchObject({ headline: article.title, description: article.description,
        url: canonicalOrigin + route, mainEntityOfPage: canonicalOrigin + route, datePublished: article.publishedDate });
      expect(schema.dateModified).toBe(article.updatedDate);
      expect(schema).not.toHaveProperty("image"); expect(schema).not.toHaveProperty("author");
      expect(breadcrumbs.itemListElement.map((v: { item: string }) => v.item)).toEqual([canonicalOrigin + "/", canonicalOrigin + "/library", canonicalOrigin + route]);
      expect(html).toContain('aria-label="Breadcrumb"'); expect(html).toContain('aria-current="page"');
      expect(html).not.toMatch(/TEST-ONLY:|how-to-analyze-cre-operating-expenses|capital-expenditures-vs-operating-expenses|noi-development-fixture/);
    }
    expect(titles.size).toBe(8); expect(descriptions.size).toBe(8);
  });
  it("advertises exactly ten canonical sitemap URLs and public robots", async () => {
    const robots = await get("/robots.txt"); expect(robots.status).toBe(200);
    const text = await robots.text(); expect(text).toContain("Allow: /"); expect(text).toContain("Sitemap: " + canonicalOrigin + "/sitemap.xml");
    expect(text).not.toContain("Disallow: /");
    const sitemap = await get("/sitemap.xml"); expect(sitemap.status).toBe(200);
    expect(sitemap.headers.get("content-type")).toContain("xml");
    const xml = await sitemap.text(), urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort();
    expect(urls).toEqual(["/", "/library", ...productionArticlePaths].map(p => canonicalOrigin + p).sort());
    expect(xml).not.toMatch(/<lastmod>|<priority>|<changefreq>|CRE-012|CRE-013|search|TEST-ONLY:/);
  });
  it("keeps home and Library indexable, and search noindex without canonical/schema", async () => {
    for (const route of ["/", "/library"]) {
      const r = await get(route); expect(r.status).toBe(200); expect(r.headers.get("x-robots-tag")).toBeNull();
      const html = await r.text(); expect(html).toContain('rel="canonical" href="' + canonicalOrigin + route + '"');
      if (route === "/library") expect([...new Set([...html.matchAll(/href="(\/content\/[^"]+)"/g)].map(m => m[1]))].sort()).toEqual(productionArticlePaths);
    }
    const search = await get("/search?q=operating"); expect(search.status).toBe(200);
    expect(search.headers.get("x-robots-tag")).toBe("noindex, follow");
    const html = await search.text(); expect(html).toContain('name="robots" content="noindex, follow"');
    expect(html).not.toMatch(/rel="canonical"|application\/ld\+json|how-to-analyze-cre-operating-expenses|capital-expenditures-vs-operating-expenses|noi-development-fixture/);
  });
  it.each(["/content/underwriting/how-to-analyze-cre-operating-expenses",
    "/content/underwriting/capital-expenditures-vs-operating-expenses", "/content/underwriting/noi-development-fixture",
    "/editorial", "/editorial/review", "/api/private", "/design-preview/living-ledger", "/design-preview/living-ledger-cinematic", "/unknown"])("fails closed for %s without credentials or with navigation tricks", async route => {
    for (const headers of [{}, { rsc: "1" }, { "next-router-prefetch": "1" }, { authorization: "Basic invalid" }]) {
      const r = await get(route + "?preview=true", headers as Record<string, string>);
      expect(r.status).toBe(404); expect(r.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(await r.text()).toBe("Not found.");
    }
  });
  it("serves every static asset publicly with correct MIME/bytes and no HTML fallback", async () => {
    const manifest = verifyRelease(root, digest);
    const mime: Record<string, RegExp> = { ".js": /^(text|application)\/javascript$/, ".css": /^text\/css$/, ".woff2": /^font\/woff2$/, ".webp": /^image\/webp$/ };
    for (const asset of Object.keys(manifest.files).filter(p => p.startsWith(".next/static/"))) {
      const r = await get("/_next/static/" + asset.slice(13)); expect(r.status, asset).toBe(200);
      expect(r.headers.get("content-type")?.split(";")[0]).toMatch(mime[path.extname(asset)]);
      expect(sha256(Buffer.from(await r.arrayBuffer()))).toBe(manifest.files[asset]);
    }
  });
  it("production candidate ships only public delivery records, sanitized provenance and safe npm start", () => {
    const m = verifyRelease(root, digest);
    if (m.version !== 2) return;
    expect(m.localOnly).toBe(false);
    expect(m.profile).toBe("production-candidate");
    expect(m.contentBodies).toHaveLength(8);
    expect(m.inputTreeSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(m.source.files).join("\n")).not.toMatch(/tests\/|cre-operating-expenses|capital-expenditures-vs-operating-expenses|CRE-013-editorial-record|test-only-date-preview/);
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.scripts).toEqual({ start: "node release-start.cjs" });
    const forbidden = ["how-to-analyze-cre-operating-expenses", "capital-expenditures-vs-operating-expenses",
      "fixture-noi-bridge", "fixture-methodology", "fixture-loan-sizing", "TEST-ONLY:invalid"];
    for (const p of Object.keys(m.files)) {
      const bytes = readFileSync(path.join(root, p));
      expect(forbidden.some(v => bytes.includes(Buffer.from(v))), p).toBe(false);
    }
  });
  it("uses fixed canonicals despite Host/query inputs and retains slash redirects", async () => {
    const r = await get("/library/?utm_source=simulation"); expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("/library?utm_source=simulation");
    const response = await get(productionArticlePaths[0] + "?tracking=1", { host: "injected.invalid" });
    expect(response.status).toBe(200); const html = await response.text();
    expect(html).toContain('rel="canonical" href="' + canonicalOrigin + productionArticlePaths[0] + '"');
    expect(html).not.toContain("injected.invalid");
  });
  it.each([
    ...(productionProfile ? [{ CRE_RELEASE_PROFILE: undefined }, { CRE_RELEASE_SIMULATION: "1" }] :
      [{ CRE_RELEASE_SIMULATION: undefined }, { HOSTNAME: "0.0.0.0" }]), { PREVIEW_ACCESS_MODE: "private" },
    { SITE_INDEXING_ENABLED: "false" }, { SITE_ENV: "preview" }, { CRE_TEST_ONLY_PUBLICATION_DATE: "" },
    { SITE_PRODUCTION_ORIGIN: "https://other-origin.cre-publication.com" }, { CRE_RELEASE_MANIFEST_SHA256: "0".repeat(64) },
  ])("rejects unsafe indexed startup before listening %#", change => {
    const result = spawnSync(process.execPath, ["release-start.cjs"], { cwd: root, env: { ...env, ...change },
      windowsHide: true, encoding: "utf8", timeout: 10000 });
    expect(result.status).toBe(1); expect(result.stderr).toContain("Release startup rejected");
    expect(result.stdout).not.toContain("Ready");
  });
});
