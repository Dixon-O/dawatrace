const http = require("http");
const fs = require("fs");
const path = require("path");

const frontendRoot = path.join(__dirname, "frontend");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(body);
}

function redirect(res, location) {
  send(res, 302, `Redirecting to ${location}`, {
    Location: location,
    "Content-Type": "text/plain; charset=utf-8"
  });
}

function isInsideFrontend(candidate) {
  const relative = path.relative(frontendRoot, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function resolveRequestPath(requestPath) {
  const safePath = decodeURIComponent(requestPath).split("?")[0].split("#")[0];

  if (safePath === "/" || safePath === "") {
    return { filePath: path.join(frontendRoot, "index.html") };
  }

  let relativePath = safePath.replace(/^\/+/, "");
  let absolutePath = path.resolve(frontendRoot, relativePath);

  if (!isInsideFrontend(absolutePath)) {
    return { error: 403, message: "Forbidden" };
  }

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    if (!safePath.endsWith("/")) {
      return { redirect: `${safePath}/` };
    }
    absolutePath = path.join(absolutePath, "index.html");
  }

  return { filePath: absolutePath };
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    send(res, 400, "Bad request", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const resolved = resolveRequestPath(req.url);

  if (resolved.redirect) {
    redirect(res, resolved.redirect);
    return;
  }

  if (resolved.error) {
    send(res, resolved.error, resolved.message || "Error", {
      "Content-Type": "text/plain; charset=utf-8"
    });
    return;
  }

  const filePath = resolved.filePath;

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback for client-side routes
      if (path.extname(filePath) === "") {
        fs.readFile(path.join(frontendRoot, "index.html"), (err2, indexData) => {
          if (err2) {
            send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
            return;
          }
          send(res, 200, indexData, { "Content-Type": "text/html; charset=utf-8" });
        });
        return;
      }
      send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    send(res, 200, data, {
      "Content-Type": contentTypeFor(filePath)
    });
  });
});

server.listen(port, host, () => {
  console.log(`DawaTrace running at http://${host}:${port}/`);
  console.log(`Serving: ${frontendRoot}`);
});
