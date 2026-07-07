const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const DATA_FILE = path.join(__dirname, "..", "data", "tasks.json");
const STATUSES = new Set(["todo", "in-progress", "done"]);
const PRIORITIES = new Set(["low", "medium", "high"]);

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function normalizeTask(input, partial = false) {
  const payload = {
    title: typeof input.title === "string" ? input.title.trim() : input.title,
    description: typeof input.description === "string" ? input.description.trim() : input.description,
    status: input.status,
    priority: input.priority,
    assignee: typeof input.assignee === "string" ? input.assignee.trim() : input.assignee,
    due_date: input.due_date
  };

  if (!partial || payload.title !== undefined) {
    if (!payload.title || payload.title.length < 3) {
      throw validationError("Judul tugas minimal 3 karakter.");
    }
  }

  if (!partial || payload.status !== undefined) {
    if (!STATUSES.has(payload.status)) {
      throw validationError("Status harus salah satu dari: todo, in-progress, done.");
    }
  }

  if (!partial || payload.priority !== undefined) {
    if (!PRIORITIES.has(payload.priority)) {
      throw validationError("Prioritas harus salah satu dari: low, medium, high.");
    }
  }

  if (payload.due_date && Number.isNaN(Date.parse(payload.due_date))) {
    throw validationError("Tanggal tenggat tidak valid.");
  }

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function supabaseRequest(method, endpoint, body) {
  const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/rest/v1/tasks${endpoint}`, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || "Supabase request failed.");
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

async function readLocalTasks() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalTasks(tasks) {
  await fs.writeFile(DATA_FILE, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
}

async function listTasks() {
  if (hasSupabaseConfig()) {
    return supabaseRequest("GET", "?select=*&order=created_at.desc");
  }

  const tasks = await readLocalTasks();
  return tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function createTask(input) {
  const now = new Date().toISOString();
  const payload = {
    ...normalizeTask(input),
    id: randomUUID(),
    created_at: now,
    updated_at: now
  };

  if (hasSupabaseConfig()) {
    const [created] = await supabaseRequest("POST", "", payload);
    return created;
  }

  const tasks = await readLocalTasks();
  tasks.push(payload);
  await writeLocalTasks(tasks);
  return payload;
}

async function updateTask(id, input) {
  if (!id) throw validationError("ID tugas wajib diisi.");
  const payload = { ...normalizeTask(input, true), updated_at: new Date().toISOString() };

  if (hasSupabaseConfig()) {
    const updated = await supabaseRequest("PATCH", `?id=eq.${encodeURIComponent(id)}`, payload);
    if (!updated.length) {
      const error = new Error("Tugas tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    return updated[0];
  }

  const tasks = await readLocalTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    const error = new Error("Tugas tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  tasks[index] = { ...tasks[index], ...payload };
  await writeLocalTasks(tasks);
  return tasks[index];
}

async function deleteTask(id) {
  if (!id) throw validationError("ID tugas wajib diisi.");

  if (hasSupabaseConfig()) {
    const deleted = await supabaseRequest("DELETE", `?id=eq.${encodeURIComponent(id)}`);
    if (!deleted.length) {
      const error = new Error("Tugas tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    return deleted[0];
  }

  const tasks = await readLocalTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    const error = new Error("Tugas tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  const [deleted] = tasks.splice(index, 1);
  await writeLocalTasks(tasks);
  return deleted;
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  normalizeTask
};
