import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Opt in after a publication-only production build. Never build inside the test.
describe.skipIf(process.env.CRE_STANDALONE_TEST !== "1")("standalone production regression", () => {
  const root = path.resolve(".next/standalone");
  let server: ChildProcess | undefined;
  let origin: string;
  let logs = "";

  async function stopServer() {
    const child = server;
    if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
    await new Promise<void>(resolve => {
      const forceKill = setTimeout(() => child.kill("SIGKILL"), 1000);
      child.once("exit", () => { clearTimeout(forceKill); resolve(); });
      child.kill();
    });
  }

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
    const startupStarted = performance.now();
    server = spawn(process.execPath, ["server.js"], {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port),
        PREVIEW_ACCESS_MODE: "public", SITE_ENV: "production",
        SITE_PRODUCTION_ORIGIN: "https://thecreledger.com", SITE_INDEXING_ENABLED: "false" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const child = server;
    const receive = (chunk: Buffer) => { logs += chunk.toString(); };
    let startupError: Error | undefined;
    const onError = (error: Error) => { startupError = error; };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      startupError = new Error(`Standalone exited during startup (code ${code}, signal ${signal})`);
    };
    child.stdout!.on("data", receive);
    child.stderr!.on("data", receive);
    child.once("error", onError);
    child.once("exit", onExit);
    const deadline = startupStarted + 15000;
    let attempts = 0;
    let lastProbe = "No probe completed";
    try {
      const expectedIcon = readFileSync(path.join(root, ".next/server/app/icon.svg.body"));
      while (performance.now() < deadline) {
        if (startupError) throw startupError;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), Math.min(1000, deadline - performance.now()));
        attempts++;
        try {
          // This exercises initialized handlers and Proxy without warming the homepage.
          const response = await fetch(origin + "/icon.svg", {
            signal: controller.signal, redirect: "manual", headers: { connection: "close" },
          });
          const body = Buffer.from(await response.arrayBuffer());
          if (response.status !== 200 || response.headers.get("content-type")?.split(";")[0] !== "image/svg+xml" ||
              response.headers.get("x-robots-tag") !== "noindex, nofollow" || !body.equals(expectedIcon)) {
            throw new Error(`Unexpected readiness response: HTTP ${response.status}, type ${response.headers.get("content-type")}, robots ${response.headers.get("x-robots-tag")}, ${body.length} bytes`);
          }
          if (startupError) throw startupError;
          if (performance.now() >= deadline) break;
          console.info(`Standalone HTTP ready in ${Math.round(performance.now() - startupStarted)}ms (${attempts} probes; /icon.svg)`);
          return;
        } catch (error) {
          if (startupError) throw startupError;
          const code = (error as { cause?: NodeJS.ErrnoException }).cause?.code;
          // Only transport failures or bounded probe timeouts are retryable, not HTTP/application errors.
          if (!controller.signal.aborted && !["ECONNREFUSED", "ECONNRESET", "EPIPE", "ETIMEDOUT", "UND_ERR_SOCKET"].includes(code ?? "")) throw error;
          lastProbe = controller.signal.aborted ? "Probe exceeded its bounded timeout" : `Transport error: ${code}`;
        } finally {
          clearTimeout(timeout);
          controller.abort();
        }
        const remaining = deadline - performance.now();
        if (remaining > 0) await delay(Math.min(100, remaining));
      }
      throw new Error(`Standalone HTTP readiness timed out after 15000ms (${attempts} probes; ${lastProbe})`);
    } catch (error) {
      await stopServer();
      throw new Error(`Standalone HTTP readiness failed: ${String(error)}\n${logs}`, { cause: error });
    } finally {
      child.off("error", onError);
      child.off("exit", onExit);
    }
  }, 20000);

  afterAll(stopServer);

  it.each(["/", "/library", "/content/underwriting/contract-rent-vs-market-rent", "/search", "/search?q=NOI"])("serves %s without generated source files and retains noindex", async route => {
    const response = await fetch(origin + route);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const html = await response.text();
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(html).toContain('<meta name="googlebot" content="noindex, nofollow"');
    expect(html).not.toContain("Development fixture — not publication content");
    expect(html).toContain("Available research destinations");
    expect(html).toContain('href="/#knowledge-underwriting"');
    expect(html).toContain("The CRE Ledger");
    expect(html).not.toContain("Local design study / 4C");
    if (route === "/") {
      expect(html).toContain('id="cinematic-title"');
      expect(html).toContain("Understand Property Financials.");
      expect(html).toContain("$18,654,545");
      for (const id of ["learn", "underwriting", "property-types", "financing", "modeling", "tools", "resources"]) expect(html).toContain(`id="${id}"`);
      const allowed = new Set(["t12-operating-statement", "rent-roll-analysis", "contract-rent-vs-market-rent", "cre-revenue-underwriting", "net-operating-income-underwritten-noi"].map(slug => "/content/underwriting/" + slug));
      for (const match of html.matchAll(/href="(\/content\/[^"]+)"/g)) expect(allowed.has(match[1])).toBe(true);
    }
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

  describe.each(["/design-preview/living-ledger", "/design-preview/living-ledger-cinematic"])("production isolation: %s", route => {
    it.each<Record<string, string>>([
      {},
      { rsc: "1" },
      { "next-router-prefetch": "1" },
      { rsc: "1", "next-router-prefetch": "1" },
    ])("blocks the local prototype in production, including navigation requests %#", async headers => {
      for (const suffix of ["", "?preview=true"]) {
        const response = await fetch(origin + route + suffix, { headers });
        expect(response.status).toBe(404);
        expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
        const body = await response.text();
        expect(body).not.toContain("One property. Four assumptions.");
        expect(body).not.toContain("assumption-monthlyRent");
        expect(body).not.toContain("income-chart-title");
        expect(body).not.toContain("cinematic-title");
        expect(body).not.toContain("CRE knowledge explorer");
        expect(body).not.toContain("learning-progression-title");
      }
    });
  });
});
