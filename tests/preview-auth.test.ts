import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { authorizePreview, type PreviewEnvironment } from "@/security/preview-auth";
import { proxy } from "@/proxy";

const env = { PREVIEW_ACCESS_MODE: "private", PREVIEW_AUTH_USERNAME: "local-reviewer", PREVIEW_AUTH_PASSWORD: "synthetic-offline-password-0123456789" };
const basic = (username = env.PREVIEW_AUTH_USERNAME, password = env.PREVIEW_AUTH_PASSWORD) => `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
afterEach(() => vi.unstubAllEnvs());
function configure() { for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value); }

describe("private preview configuration", () => {
  it.each([
    {}, { ...env, PREVIEW_ACCESS_MODE: undefined }, { ...env, PREVIEW_ACCESS_MODE: "public" },
    { ...env, PREVIEW_ACCESS_MODE: "PRIVATE" }, { ...env, PREVIEW_AUTH_USERNAME: undefined },
    { ...env, PREVIEW_AUTH_USERNAME: "" }, { ...env, PREVIEW_AUTH_USERNAME: "name:extra" },
    { ...env, PREVIEW_AUTH_USERNAME: "space name" }, { ...env, PREVIEW_AUTH_USERNAME: "x".repeat(129) },
    { ...env, PREVIEW_AUTH_PASSWORD: undefined }, { ...env, PREVIEW_AUTH_PASSWORD: "" },
    { ...env, PREVIEW_AUTH_PASSWORD: "short" }, { ...env, PREVIEW_AUTH_PASSWORD: "x".repeat(257) },
    { ...env, PREVIEW_AUTH_PASSWORD: "x".repeat(32) + "\n" },
  ] satisfies PreviewEnvironment[])("denies invalid configuration %#", variables => {
    expect(authorizePreview(basic(), variables)).toBe("unavailable");
  });
  it("admits only correct credentials and compares both fields", () => {
    expect(authorizePreview(basic(), env)).toBe("admit");
    expect(authorizePreview(basic("wrong-reviewer"), env)).toBe("unauthorized");
    expect(authorizePreview(basic(env.PREVIEW_AUTH_USERNAME, "incorrect-password-0123456789012345"), env)).toBe("unauthorized");
  });
  it.each([
    null, "", "Bearer abc", "Basic", "Basic ", "Basic !!!!", "Basic Zg==", "Basic Zm9vOmJhcg==",
    " Basic abc", "Basic  abc", "Basic\tabc", `${basic()}, ${basic()}`, `${basic()}\n`,
    "Basic " + "A".repeat(1024), "Basic " + Buffer.from("name:\npassword").toString("base64"),
    "Basic " + Buffer.from("no-separator").toString("base64"),
  ])("rejects malformed/missing authorization %#", value => expect(authorizePreview(value, env)).toBe("unauthorized"));
  it("rejects noncanonical base64 and accepts case-insensitive scheme", () => {
    expect(authorizePreview(basic().replace("Basic", "bAsIc"), env)).toBe("admit");
    expect(authorizePreview(basic() + "=", env)).toBe("unauthorized");
  });
});

describe("production Proxy admission boundary", () => {
  const paths = ["/", "/library", "/search?q=NOI", "/content/underwriting/rent-roll-analysis", "/content/underwriting/noi-development-fixture", "/missing", "/_next/static/chunks/main.js", "/_next/image?url=%2Ficon.svg&w=64&q=75", "/icon.svg", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/api/missing", "/%63ontent/underwriting/rent-roll-analysis", "/content/%2e%2e/library"];
  it.each(paths)("gates anonymous and credentialed requests to %s", path => {
    configure();
    const denied = proxy(new NextRequest(`https://preview.invalid${path}`));
    expect(denied.status).toBe(401);
    expect(denied.headers.get("www-authenticate")).toMatch(/^Basic /);
    const admitted = proxy(new NextRequest(`https://preview.invalid${path}`, { headers: { authorization: basic() } }));
    expect(admitted.headers.get("x-middleware-next")).toBe("1");
    for (const response of [denied, admitted]) {
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(response.headers.get("pragma")).toBe("no-cache");
      expect(response.headers.get("expires")).toBe("0");
    }
  });
  const internalHeaders: Record<string, string>[] = [
    { rsc: "1", "next-router-prefetch": "1" },
    { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" },
    { "x-middleware-next": "1", "x-invoke-path": "/library" },
    { "x-forwarded-host": "thecreledger.com", purpose: "prefetch" },
  ];
  it.each(internalHeaders)("internal/navigation headers never authorize %#", headers => {
    configure();
    expect(proxy(new NextRequest("https://preview.invalid/library", { headers })).status).toBe(401);
  });
  it("rejects combined duplicate authorization headers", () => {
    configure(); const headers = new Headers(); headers.append("authorization", basic()); headers.append("authorization", basic());
    expect(proxy(new NextRequest("https://preview.invalid/", { headers })).status).toBe(401);
  });
  it("reads configuration per request and never logs or echoes credentials", async () => {
    configure(); const log = vi.spyOn(console, "log"); const error = vi.spyOn(console, "error");
    try {
      expect(proxy(new NextRequest("https://preview.invalid/", { headers: { authorization: basic() } })).headers.get("x-middleware-next")).toBe("1");
      vi.stubEnv("PREVIEW_AUTH_PASSWORD", "");
      const response = proxy(new NextRequest("https://preview.invalid/", { headers: { authorization: basic() } }));
      expect(response.status).toBe(503); expect(response.headers.has("www-authenticate")).toBe(false);
      const output = await response.text() + JSON.stringify([...response.headers]);
      expect(output).not.toContain(env.PREVIEW_AUTH_USERNAME); expect(output).not.toContain(env.PREVIEW_AUTH_PASSWORD);
      expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    } finally { log.mockRestore(); error.mockRestore(); }
  });
});
