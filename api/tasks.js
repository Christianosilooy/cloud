const { listTasks, createTask, updateTask, deleteTask } = require("../lib/taskStore");

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  try {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET") {
      const tasks = await listTasks();
      return sendJson(res, 200, { data: tasks });
    }

    if (req.method === "POST") {
      const task = await createTask(await readBody(req));
      return sendJson(res, 201, { data: task });
    }

    if (req.method === "PATCH") {
      const task = await updateTask(url.searchParams.get("id"), await readBody(req));
      return sendJson(res, 200, { data: task });
    }

    if (req.method === "DELETE") {
      const task = await deleteTask(url.searchParams.get("id"));
      return sendJson(res, 200, { data: task });
    }

    return sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, { error: error.message || "Server error." });
  }
};
