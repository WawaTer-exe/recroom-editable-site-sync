import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist-archive");
const port = Number(process.env.ARCHIVE_PORT || 4177);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", `http://${request.headers.host}`).pathname);
  const safe = normalize(pathname).replace(/^\.\.(?:[\\/]|$)/g, "");
  const candidates = [join(root, safe), join(root, safe, "index.html"), join(root, "404.html")];
  let file;
  for (const candidate of candidates) {
    try { if ((await stat(candidate)).isFile()) { file = candidate; break; } } catch {}
  }
  if (!file) { response.writeHead(404); response.end("Not found"); return; }
  response.writeHead(file.endsWith("404.html") ? 404 : 200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => console.log(`Archive server listening on http://127.0.0.1:${port}`));
