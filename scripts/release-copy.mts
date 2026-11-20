import { cpSync, existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";

/** Copy into a prepared package root without merging or replacing its entries. */
export function copyPackageContents(source: string, destination: string): void {
  for (const directory of [source, destination]) {
    if (!path.isAbsolute(directory) || !lstatSync(directory).isDirectory() ||
        lstatSync(directory).isSymbolicLink() || realpathSync(directory) !== path.resolve(directory))
      throw new Error("Package copy requires real absolute directories");
  }
  const overlaps = (a: string, b: string) => {
    const relative = path.relative(a, b);
    return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative));
  };
  if (overlaps(source, destination) || overlaps(destination, source))
    throw new Error("Package copy directories must not overlap");
  const names = readdirSync(source).sort();
  const reserved = new Set([".release", "release-start.cjs", "release-manifest.json"]);
  function validate(directory: string): void {
    for (const name of readdirSync(directory)) {
      if (name === "." || name === ".." || /[\\:]/.test(name)) throw new Error("Unsafe package copy path");
      const entry = path.join(directory, name), stat = lstatSync(entry);
      if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory()))
        throw new Error("Package copy links and special files are unsupported");
      if (stat.isDirectory()) validate(entry);
    }
  }
  validate(source);
  // Preflight every top-level entry before copying anything. Never merge trees.
  for (const name of names) {
    if (reserved.has(name.toLowerCase()) || existsSync(path.join(destination, name)) ||
        readdirSync(destination).some(entry => entry.toLowerCase() === name.toLowerCase()))
      throw new Error("Package copy collision: " + name);
  }
  for (const name of names) {
    // Each target is absent, unlike the deliberately prepared package root.
    // A failure propagates; the caller cannot write a completed manifest.
    cpSync(path.join(source, name), path.join(destination, name),
      { recursive: true, force: false, errorOnExist: true });
  }
}
