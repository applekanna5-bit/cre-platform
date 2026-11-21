import { describe, expect, it, vi } from "vitest";
import { feedbackStaging } from "@/feedback/staging";
import { POST as submit } from "@/app/api/feedback/route";

const { runtime, submitFeedback } = vi.hoisted(() => ({ runtime: vi.fn(), submitFeedback: vi.fn() }));
vi.mock("@/feedback/runtime", () => ({ feedbackRuntime: runtime }));
vi.mock("@/feedback/submission", () => ({ submissionStore: vi.fn(), submitFeedback }));

const origin = "https://darkseagreen-termite-651622.hostingersite.com";
const localTestFlags = {
  CRE_FEEDBACK_STAGE: "enabled", SITE_ENV: "staging", SITE_INDEXING_ENABLED: "false", PREVIEW_ACCESS_MODE: "private",
  APP_BASE_URL: origin, FEEDBACK_DB_NAME: "u926782974_crefb_stage", FEEDBACK_DB_USER: "u926782974_crefb_app",
  FEEDBACK_DB_HOST: "127.0.0.1", FEEDBACK_TRUSTED_PROXY_VERIFIED: "true", FEEDBACK_CLIENT_IP_HEADER: "x-verified-client-ip",
  FEEDBACK_HMAC_KEY: "1".repeat(64), FEEDBACK_AUTH_SECRET: "2".repeat(64), FEEDBACK_DB_PASSWORD: "test-only",
};

describe("staging feedback integration", () => {
  it("fails closed for production, changed database, unverified ingress or missing secrets", () => {
    expect(feedbackStaging(localTestFlags)).not.toBeNull();
    for (const override of [
      { SITE_ENV: "production" }, { SITE_INDEXING_ENABLED: "true" }, { PREVIEW_ACCESS_MODE: "public" },
      { APP_BASE_URL: "https://thecreledger.com" }, { FEEDBACK_DB_NAME: "other" },
      { FEEDBACK_TRUSTED_PROXY_VERIFIED: undefined }, { FEEDBACK_DB_PASSWORD: undefined },
      { FEEDBACK_AUTH_SECRET: localTestFlags.FEEDBACK_HMAC_KEY },
    ]) expect(feedbackStaging({ ...localTestFlags, ...override })).toBeNull();
  });

  it("returns a private 404 while disabled and uses the verified staging address when enabled", async () => {
    const request = new Request(origin + "/api/feedback", { method: "POST", headers: { "x-verified-client-ip": "192.0.2.5" } });
    runtime.mockReturnValueOnce(null);
    const disabled = await submit(request);
    expect(disabled.status).toBe(404);
    expect(disabled.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    runtime.mockReturnValueOnce({ config: feedbackStaging(localTestFlags), db: {} });
    submitFeedback.mockImplementationOnce(async (incoming, options) => {
      expect(await options.trustedAddress(incoming)).toBe("192.0.2.5");
      return { kind: "saved" };
    });
    const saved = await submit(request);
    expect(saved.status).toBe(200);
    expect(saved.headers.get("cache-control")).toBe("private, no-store");
    expect(await saved.json()).toEqual({ kind: "saved" });
  });

});
