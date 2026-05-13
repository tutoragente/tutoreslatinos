import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const port = 4173;
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

createServer((req, res) => {
  const requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  let filePath = resolve(root, requested === "/" ? "index.html" : `.${requested}`);
  const relativePath = relative(root, filePath);

  if (relativePath.startsWith("..") || relativePath.startsWith("/") || relativePath.includes(":\\")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, "index.html");
  }

  res.setHeader("Content-Type", types[extname(filePath)] || "application/octet-stream");
  createReadStream(filePath).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`Notas importantes en http://127.0.0.1:${port}`);
});
