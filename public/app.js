const state = {
  tasks: [],
  filter: "all"
};

const form = document.querySelector("#taskForm");
const formTitle = document.querySelector("#formTitle");
const message = document.querySelector("#formMessage");
const taskList = document.querySelector("#taskList");
const template = document.querySelector("#taskTemplate");

const fields = {
  id: document.querySelector("#taskId"),
  title: document.querySelector("#title"),
  description: document.querySelector("#description"),
  status: document.querySelector("#status"),
  priority: document.querySelector("#priority"),
  assignee: document.querySelector("#assignee"),
  due_date: document.querySelector("#due_date")
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request gagal.");
  return payload.data;
}

function getFormPayload() {
  return {
    title: fields.title.value.trim(),
    description: fields.description.value.trim(),
    status: fields.status.value,
    priority: fields.priority.value,
    assignee: fields.assignee.value.trim(),
    due_date: fields.due_date.value
  };
}

function setMessage(text, isSuccess = false) {
  message.textContent = text;
  message.classList.toggle("success", isSuccess);
}

function resetForm() {
  form.reset();
  fields.id.value = "";
  fields.priority.value = "medium";
  formTitle.textContent = "Tambah Tugas";
  setMessage("");
}

function renderSummary(tasks) {
  document.querySelector("#totalTasks").textContent = tasks.length;
  document.querySelector("#doneTasks").textContent = tasks.filter((task) => task.status === "done").length;
}

function renderTasks() {
  const visibleTasks = state.filter === "all"
    ? state.tasks
    : state.tasks.filter((task) => task.status === state.filter);

  renderSummary(state.tasks);
  taskList.replaceChildren();

  if (!visibleTasks.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Belum ada tugas pada filter ini.";
    taskList.append(empty);
    return;
  }

  visibleTasks.forEach((task) => {
    const node = template.content.cloneNode(true);
    node.querySelector("article").dataset.id = task.id;
    node.querySelector("h3").textContent = task.title;
    node.querySelector(".description").textContent = task.description || "Tidak ada deskripsi.";
    node.querySelector(".badge").textContent = task.status;
    node.querySelector(".assignee").textContent = task.assignee || "-";
    node.querySelector(".due").textContent = task.due_date || "-";
    node.querySelector(".priority").textContent = task.priority;
    node.querySelector(".edit").addEventListener("click", () => editTask(task));
    node.querySelector(".delete").addEventListener("click", () => removeTask(task));
    taskList.append(node);
  });
}

async function loadTasks() {
  try {
    state.tasks = await request("/api/tasks");
    renderTasks();
  } catch (error) {
    taskList.innerHTML = `<p class="empty">${error.message}</p>`;
  }
}

function editTask(task) {
  fields.id.value = task.id;
  fields.title.value = task.title;
  fields.description.value = task.description || "";
  fields.status.value = task.status;
  fields.priority.value = task.priority;
  fields.assignee.value = task.assignee || "";
  fields.due_date.value = task.due_date || "";
  formTitle.textContent = "Edit Tugas";
  setMessage("Mode edit aktif.", true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function removeTask(task) {
  const confirmed = confirm(`Hapus tugas "${task.title}"?`);
  if (!confirmed) return;

  await request(`/api/tasks?id=${encodeURIComponent(task.id)}`, { method: "DELETE" });
  await loadTasks();
  setMessage("Tugas berhasil dihapus.", true);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");

  const payload = getFormPayload();
  if (!payload.title || payload.title.length < 3) {
    setMessage("Judul tugas minimal 3 karakter.");
    return;
  }

  try {
    if (fields.id.value) {
      await request(`/api/tasks?id=${encodeURIComponent(fields.id.value)}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      setMessage("Tugas berhasil diperbarui.", true);
    } else {
      await request("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMessage("Tugas berhasil ditambahkan.", true);
    }

    resetForm();
    await loadTasks();
  } catch (error) {
    setMessage(error.message);
  }
});

document.querySelector("#resetButton").addEventListener("click", resetForm);
document.querySelector("#refreshButton").addEventListener("click", loadTasks);
document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderTasks();
  });
});

loadTasks();
