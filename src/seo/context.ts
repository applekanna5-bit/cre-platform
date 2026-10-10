import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveSiteConfig, type SiteVariables } from "../config/site";
import { indexingPolicy, type PublicationMode } from "./policy";

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

export function resolveSeoContext(variables: SiteVariables, mode: PublicationMode) {
  const site = resolveSiteConfig(variables);
  return Object.freeze({ site, mode, policy: indexingPolicy(site, mode) });
}

// Next headers are build-time output. Refuse runtime env/mode changes rather
// than serve stale safeguards. This snapshot must travel with next start builds.
export function checkBuildContext(root: string, phase: "build" | "start", context: ReturnType<typeof resolveSeoContext>) {
  const file = path.join(root, ".next/cache/cre-seo-context.json");
  const snapshot = JSON.stringify(context);
  if (phase === "build") {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, snapshot);
  } else if (readFileSync(file, "utf8") !== snapshot) {
    throw new Error("SEO configuration or publication mode changed; rebuild before starting the server");
  }
}
