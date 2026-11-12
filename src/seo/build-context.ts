// Build/next-start integration only; never import from route or metadata code.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SeoDelivery } from "./public-pages";
import type { PublicationMode } from "./policy";
import type { resolveSeoContext } from "./context";

// Server/build integration only. Read mode flags without importing the catalog.
export function readPublicationMode(root: string): PublicationMode {
  const generated = readFileSync(path.join(root, "src/content/.generated/index.ts"), "utf8");
  const flag = (name: string) => {
    const match = generated.match(new RegExp(`^export const ${name} = (true|false);$`, "m"));
    if (!match) throw new Error(`Missing generated publication flag: ${name}`);
    return match[1] === "true";
  };
  return Object.freeze({ fixturesEnabled: flag("fixturesEnabled"), editorialPreviewEnabled: flag("editorialPreviewEnabled") });
}

export function readTestOnlyDateMode(root: string): boolean {
  const generated = readFileSync(path.join(root, "src/content/.generated/index.ts"), "utf8");
  return /^export const testOnlyDatePreviewEnabled = true;$/m.test(generated);
}

// Next headers are build-time output. Refuse runtime env/mode changes rather
// than serve stale safeguards. This snapshot must travel with next start builds.
export function checkBuildContext(root: string, phase: "build" | "start", context: ReturnType<typeof resolveSeoContext>, delivery?: SeoDelivery) {
  const file = path.join(root, ".next/cache/cre-seo-context.json");
  const snapshot = serializeBuildContext(context, delivery);
  if (phase === "build") {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, snapshot);
  } else {
    assertBuildContextSnapshot(readFileSync(file, "utf8"), snapshot);
  }
}

/** Shared serialization for next-start and the separately packaged entrypoint. */
export function serializeBuildContext(context: ReturnType<typeof resolveSeoContext>, delivery?: SeoDelivery) {
  return JSON.stringify({ context, delivery: delivery ? { accessMode: delivery.accessMode ?? null,
    nodeEnvironment: delivery.nodeEnvironment ?? null, testOnlyDatePreviewEnabled: delivery.testOnlyDatePreviewEnabled,
    testOnlyPublicationDatePresent: delivery.testOnlyPublicationDatePresent } : null });
}

export function assertBuildContextSnapshot(retained: string, expected: string) {
  if (retained !== expected) throw new Error("SEO configuration or publication mode changed; rebuild before starting the server");
}
