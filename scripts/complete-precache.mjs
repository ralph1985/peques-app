import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// Next exports HTML and RSC payloads AFTER webpack/Serwist have finished.
// Include that final output in the same build, not a previous build's shell.
const root = path.resolve("out");
const files = await readdir(root, { recursive: true });
const entries = [];
for (const file of files.sort()) {
  if (!/\.(html|txt)$/.test(file)) continue;
  const bytes = await readFile(path.join(root, file));
  let url = `/${file.split(path.sep).join("/")}`;
  if (url.endsWith("/index.html")) url = url.slice(0, -10);
  entries.push({ url, revision: createHash("sha256").update(bytes).digest("hex") });
}
for (const route of [
  "/",
  "/peso/",
  "/vacunas/",
  "/sueno/",
  "/viaje/",
  "/calendario/",
  "/ajustes/",
]) {
  if (!entries.some((entry) => entry.url === route))
    throw new Error(`Missing static route: ${route}`);
}
const workerPath = path.join(root, "sw.js");
const worker = await readFile(workerPath, "utf8");
const placeholder = "self.__PEQUES_EXPORT_MANIFEST";
if (worker.split(placeholder).length !== 2)
  throw new Error("Expected exactly one export manifest placeholder");
await writeFile(workerPath, worker.replace(placeholder, JSON.stringify(entries)));
console.log(`Offline export: ${entries.length} HTML and RSC files included.`);
