const http = require("http");
const assert = require("assert");
const tasksHandler = require("../api/tasks");

function request(server, path, options = {}) {
  const address = server.address();
  const payload = options.body ? JSON.stringify(options.body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method: options.method || "GET",
        headers: payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {}
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const server = http.createServer(tasksHandler);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const list = await request(server, "/api/tasks");
    assert.strictEqual(list.status, 200);
    assert.ok(Array.isArray(list.body.data));

    const invalid = await request(server, "/api/tasks", {
      method: "POST",
      body: { title: "A", status: "todo", priority: "medium" }
    });
    assert.strictEqual(invalid.status, 400);

    const created = await request(server, "/api/tasks", {
      method: "POST",
      body: {
        title: "Uji API CRUD",
        description: "Task dibuat dari test otomatis.",
        status: "todo",
        priority: "high",
        assignee: "Tester",
        due_date: "2026-07-18"
      }
    });
    assert.strictEqual(created.status, 201);
    assert.ok(created.body.data.id);

    const updated = await request(server, `/api/tasks?id=${created.body.data.id}`, {
      method: "PATCH",
      body: { status: "done", priority: "medium" }
    });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual(updated.body.data.status, "done");

    const deleted = await request(server, `/api/tasks?id=${created.body.data.id}`, {
      method: "DELETE"
    });
    assert.strictEqual(deleted.status, 200);
    assert.strictEqual(deleted.body.data.id, created.body.data.id);

    console.log("Semua pengujian API berhasil.");
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
