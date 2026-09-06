import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";

const root = resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};
const policy =
  "default-src 'self'; base-uri 'self'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; frame-src 'none'; object-src 'none'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src 'self'";

createServer(async (request, response) => {
  response.setHeader("Content-Security-Policy", policy);
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-cache");
  if (!["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(405).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const body = await readFile(path);
    response.setHeader("Content-Type", types[extname(path)] ?? "application/octet-stream");
    response.writeHead(200).end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end("No encontrado");
  }
}).listen(Number(process.env.PORT ?? 3000), "127.0.0.1", () =>
  console.log("Peques: servidor de archivos estáticos listo."),
);
