import { describe, expect, it } from "vitest";
import { resolveSeoContext } from "@/seo/context";
import { serializeBuildContext } from "@/seo/build-context";
import { validateRuntime } from "../scripts/release-start.mts";
const context = resolveSeoContext({ SITE_ENV: "production", SITE_INDEXING_ENABLED: "true",
  SITE_PRODUCTION_ORIGIN: "https://thecreledger.com" }, { fixturesEnabled: false, editorialPreviewEnabled: false });
const snapshot = serializeBuildContext(context, { accessMode: "public", nodeEnvironment: "production",
  testOnlyDatePreviewEnabled: false, testOnlyPublicationDatePresent: false });
const env = { NODE_ENV: "production", SITE_ENV: "production", SITE_INDEXING_ENABLED: "true", PREVIEW_ACCESS_MODE: "public",
  SITE_PRODUCTION_ORIGIN: "https://thecreledger.com", CRE_RELEASE_PROFILE: "production-candidate", HOSTNAME: "0.0.0.0" };
describe("production profile keeps safety without simulation bind workaround", () => {
  it("permits supported production network binding without a simulation variable", () => {
    expect(() => validateRuntime(snapshot, env, "production-candidate")).not.toThrow();
  });
  it.each([{ CRE_RELEASE_PROFILE: undefined }, { CRE_RELEASE_SIMULATION: "1" },
    { CRE_TEST_ONLY_PUBLICATION_DATE: "" }, { PREVIEW_AUTH_PASSWORD: "local-test-secret" },
    { PREVIEW_AUTH_USERNAME: "local-test-user" }, { SITE_INDEXING_ENABLED: "false" }, { PREVIEW_ACCESS_MODE: "private" }])("fails unsafe candidate configuration %#", change => {
    expect(() => validateRuntime(snapshot, { ...env, ...change }, "production-candidate")).toThrow();
  });
});
