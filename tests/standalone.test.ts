import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Opt in after a publication-only production build. Never build inside the test.
describe.skipIf(process.env.CRE_STANDALONE_TEST !== "1")("standalone production regression", () => {
  const root = path.resolve(".next/standalone");
  let server: ChildProcess | undefined;
  let origin: string;
  let logs = "";

  beforeAll(async () => {
    expect(existsSync(path.join(root, "src/content/.generated/index.ts"))).toBe(false);
    expect(existsSync(path.join(root, "server.js"))).toBe(true);
    const manifest = JSON.parse(readFileSync(path.join(root, ".next/routes-manifest.json"), "utf8"));
    expect(manifest.headers).toContainEqual(expect.objectContaining({
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
    const listener = createServer();
    await new Promise<void>(resolve => listener.listen(0, "127.0.0.1", resolve));
    const address = listener.address();
    if (!address || typeof address === "string") throw new Error("No loopback port");
    const port = address.port;
    await new Promise<void>((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
    origin = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, ["server.js"], {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port),
        PREVIEW_ACCESS_MODE: "public", SITE_ENV: "production",
        SITE_PRODUCTION_ORIGIN: "https://thecreledger.com", SITE_INDEXING_ENABLED: "false" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Standalone startup timed out: ${logs}`)), 15000);
      const receive = (chunk: Buffer) => {
        logs += chunk.toString();
        if (logs.includes("Ready in")) { clearTimeout(timeout); resolve(); }
      };
      server!.stdout!.on("data", receive);
      server!.stderr!.on("data", receive);
      server!.once("error", error => { clearTimeout(timeout); reject(error); });
      server!.once("exit", code => { clearTimeout(timeout); reject(new Error(`Standalone exit ${code}: ${logs}`)); });
    });
  }, 20000);

  afterAll(async () => {
    if (server && server.exitCode === null) {
      const stopped = new Promise<void>(resolve => server!.once("exit", () => resolve()));
      server.kill();
      await stopped;
    }
  });

  it.each(["/", "/library", "/content/underwriting/contract-rent-vs-market-rent", "/search", "/search?q=NOI"])("serves %s without generated source files and retains noindex", async route => {
    const response = await fetch(origin + route);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const html = await response.text();
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(html).toContain('<meta name="googlebot" content="noindex, nofollow"');
    expect(html).not.toContain("Development fixture — not publication content");
  });

  it("returns deterministic published search results and excludes fixtures", async () => {
    const links = async () => {
      const response = await fetch(origin + "/search?q=rent%20roll");
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).not.toContain("noi-development-fixture");
      return [...html.matchAll(/href="(\/content\/[^\"]+)"/g)].map(match => match[1]);
    };
    const first = await links();
    expect(first[0]).toBe("/content/underwriting/rent-roll-analysis");
    expect(await links()).toEqual(first);
  });

  it("denies the fixture and keeps error responses noindex", async () => {
    const response = await fetch(origin + "/content/underwriting/noi-development-fixture");
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(await response.text()).not.toContain("Development fixture — not publication content");
  });
});
