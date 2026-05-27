import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const staticRoot = join(__dirname, "dist", "client");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const asPathInStaticRoot = (urlPath) => {
  const cleanPath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  return join(staticRoot, cleanPath);
};

const writeFetchResponse = async (nodeRes, fetchRes) => {
  nodeRes.statusCode = fetchRes.status;
  fetchRes.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value);
  });

  if (!fetchRes.body) {
    nodeRes.end();
    return;
  }

  for await (const chunk of fetchRes.body) {
    nodeRes.write(chunk);
  }
  nodeRes.end();
};

const tryServeStatic = (req, res) => {
  if (!req.url) return false;
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/" || pathname.endsWith("/")) return false;

  const filePath = asPathInStaticRoot(pathname);
  if (!filePath.startsWith(staticRoot)) return false;
  if (!existsSync(filePath)) return false;

  const stats = statSync(filePath);
  if (!stats.isFile()) return false;

  const ext = extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("content-type", MIME_TYPES[ext] || "application/octet-stream");
  res.setHeader("cache-control", "public, max-age=31536000, immutable");
  createReadStream(filePath).pipe(res);
  return true;
};

const handlerModule = await import("./dist/server/server.js");
const handler = handlerModule.default;

const server = createServer(async (req, res) => {
  try {
    if (tryServeStatic(req, res)) return;

    const origin = `http://${req.headers.host || "localhost"}`;
    const requestUrl = new URL(req.url || "/", origin);
    const request = new Request(requestUrl, {
      method: req.method,
      headers: req.headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : Readable.toWeb(req),
      duplex: "half",
    });

    const response = await handler.fetch(request, {}, {});
    await writeFetchResponse(res, response);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Node server listening on port ${port}`);
});
