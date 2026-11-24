import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

/** Reject additions as well as byte drift before MDX compilation can emit content. */
export async function assertPublicSource(root: string): Promise<void> {
  const expected = JSON.parse(await readFile(path.join(root, "scripts/public-content.json"), "utf8")) as Record<string, string>;
  const actual: Record<string, string> = {};
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error("Public content links are unsupported");
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else actual[path.relative(root, file).replaceAll("\\", "/")] = createHash("sha256").update(await readFile(file)).digest("hex");
    }
  }
  await walk(path.join(root, "content"));
  const ordered = (value: Record<string, string>) => JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  if (ordered(actual) !== ordered(expected)) throw new Error("Public source inventory differs from the reviewed public-source contract");
}
