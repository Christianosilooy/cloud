const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const tasksHandler = require("./api/tasks");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/tasks")) {
    return tasksHandler(req, res);
  }

  try {
    const requestPath = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.normalize(path.join(PUBLIC_DIR, requestPath));

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    const content = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    return res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Cloud Task Manager berjalan di http://localhost:${PORT}`);
});
