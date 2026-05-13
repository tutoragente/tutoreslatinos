const STORAGE_KEY = "important-notes-app";
const API_URL = "api.php";

const seedNotes = [
  {
    id: crypto.randomUUID(),
    topic: "Trabajo",
    title: "Seguimiento de reunión semanal",
    description:
      "<p><strong>Prioridades:</strong> cerrar pendientes del tablero, validar presupuesto y confirmar responsables.</p><ul><li>Enviar resumen al equipo.</li><li>Preparar puntos para la siguiente sesión.</li></ul>",
    tags: ["reuniones", "pendientes", "equipo"],
    priority: "3",
    reminder: "",
    favorite: true,
    archived: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    topic: "Ideas",
    title: "Banco de ideas para contenidos",
    description:
      "<p>Guardar referencias, frases útiles y ejemplos visuales para convertirlos luego en publicaciones.</p>",
    tags: ["creatividad", "contenido"],
    priority: "2",
    reminder: "",
    favorite: false,
    archived: false,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const state = {
  notes: loadNotes(),
  selectedId: null,
  quickFilter: "all",
  apiOnline: false,
};

const els = {
  archiveBtn: document.querySelector("#archive-btn"),
  clearBtn: document.querySelector("#clear-btn"),
  currentFilterLabel: document.querySelector("#current-filter-label"),
  deleteBtn: document.querySelector("#delete-btn"),
  descriptionEditor: document.querySelector("#description-editor"),
  emptyState: document.querySelector("#empty-state"),
  favoriteBtn: document.querySelector("#favorite-btn"),
  form: document.querySelector("#note-form"),
  formMode: document.querySelector("#form-mode"),
  imageBtn: document.querySelector("#image-btn"),
  imageInput: document.querySelector("#image-input"),
  newNoteBtn: document.querySelector("#new-note-btn"),
  noteCount: document.querySelector("#note-count"),
  notesList: document.querySelector("#notes-list"),
  priorityInput: document.querySelector("#priority-input"),
  reminderInput: document.querySelector("#reminder-input"),
  saveStatus: document.querySelector("#save-status"),
  searchInput: document.querySelector("#search-input"),
  sortSelect: document.querySelector("#sort-select"),
  statActive: document.querySelector("#stat-active"),
  statFavorite: document.querySelector("#stat-favorite"),
  statTags: document.querySelector("#stat-tags"),
  tagFilter: document.querySelector("#tag-filter"),
  tagsInput: document.querySelector("#tags-input"),
  titleInput: document.querySelector("#title-input"),
  topicFilter: document.querySelector("#topic-filter"),
  topicInput: document.querySelector("#topic-input"),
};

function loadNotes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return seedNotes;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : seedNotes;
  } catch {
    return seedNotes;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
}

async function requestApi(path = "", options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || "No se pudo completar la operacion.");
  }

  state.apiOnline = true;
  return data;
}

async function loadNotesFromDatabase() {
  try {
    const data = await requestApi();
    state.notes = data.notes;
    persist();
    render();
    els.saveStatus.textContent = "Conectado a MySQL";
  } catch (error) {
    state.apiOnline = false;
    render();
    els.saveStatus.textContent = "Usando almacenamiento local";
    console.warn(error);
  }
}

async function saveNoteToDatabase(note, isExisting) {
  const data = await requestApi(isExisting ? `?id=${encodeURIComponent(note.id)}` : "", {
    method: isExisting ? "PUT" : "POST",
    body: JSON.stringify(note),
  });
  return data.note;
}

async function deleteNoteFromDatabase(id) {
  await requestApi(`?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

function normalizeTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index);
}

function stripHtml(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent || container.innerText || "";
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function priorityName(priority) {
  return { 1: "Baja", 2: "Media", 3: "Alta" }[priority] || "Baja";
}

function priorityClass(priority) {
  return { 2: "medium", 3: "high" }[priority] || "";
}

function getAllTags() {
  return [...new Set(state.notes.flatMap((note) => note.tags))].sort();
}

function updateFilters() {
  const topics = [...new Set(state.notes.map((note) => note.topic))].sort();
  const tags = getAllTags();
  const currentTopic = els.topicFilter.value;
  const currentTag = els.tagFilter.value;

  els.topicFilter.innerHTML = '<option value="all">Todos los temas</option>';
  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    els.topicFilter.append(option);
  });
  els.topicFilter.value = topics.includes(currentTopic) ? currentTopic : "all";

  els.tagFilter.innerHTML = '<option value="all">Todas las etiquetas</option>';
  tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    els.tagFilter.append(option);
  });
  els.tagFilter.value = tags.includes(currentTag) ? currentTag : "all";
}

function filteredNotes() {
  const search = els.searchInput.value.trim().toLowerCase();
  const topic = els.topicFilter.value;
  const tag = els.tagFilter.value;

  const notes = state.notes.filter((note) => {
    const haystack = [note.title, stripHtml(note.description), note.topic, note.tags.join(" ")].join(" ").toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesTopic = topic === "all" || note.topic === topic;
    const matchesTag = tag === "all" || note.tags.includes(tag);
    const matchesQuick =
      state.quickFilter === "all" ||
      (state.quickFilter === "favorite" && note.favorite) ||
      (state.quickFilter === "archived" && note.archived);

    return matchesSearch && matchesTopic && matchesTag && matchesQuick;
  });

  return notes.sort((a, b) => {
    switch (els.sortSelect.value) {
      case "created-desc":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "priority-desc":
        return Number(b.priority) - Number(a.priority);
      default:
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });
}

function renderStats() {
  const total = state.notes.length;
  const active = state.notes.filter((note) => !note.archived).length;
  const favorites = state.notes.filter((note) => note.favorite).length;
  const tags = getAllTags().length;

  els.noteCount.textContent = `${total} ${total === 1 ? "nota guardada" : "notas guardadas"}`;
  els.statActive.textContent = active;
  els.statFavorite.textContent = favorites;
  els.statTags.textContent = tags;
}

function renderNotes() {
  const notes = filteredNotes();
  els.notesList.innerHTML = "";
  els.emptyState.hidden = notes.length > 0;

  notes.forEach((note) => {
    const template = document.querySelector("#note-template").content.cloneNode(true);
    const card = template.querySelector(".note-card");
    const topic = template.querySelector(".topic-pill");
    const priority = template.querySelector(".priority-dot");
    const title = template.querySelector("h2");
    const preview = template.querySelector("p");
    const tags = template.querySelector(".tag-row");
    const date = template.querySelector(".date-label");
    const status = template.querySelector(".status-label");

    card.dataset.id = note.id;
    card.tabIndex = 0;
    card.classList.toggle("active", note.id === state.selectedId);
    topic.textContent = note.topic;
    priority.className = `priority-dot ${priorityClass(note.priority)}`;
    priority.title = `Prioridad ${priorityName(note.priority)}`;
    title.textContent = note.title;
    preview.textContent = stripHtml(note.description) || "Sin descripción";
    date.textContent = `Editada: ${formatDate(note.updatedAt)}`;
    status.textContent = note.archived ? "Archivada" : note.favorite ? "Favorita" : priorityName(note.priority);

    note.tags.slice(0, 5).forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.textContent = tag;
      tags.append(tagEl);
    });

    card.addEventListener("click", () => selectNote(note.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectNote(note.id);
      }
    });

    els.notesList.append(card);
  });

  const label = {
    all: "Todas las notas",
    favorite: "Notas favoritas",
    archived: "Notas archivadas",
  }[state.quickFilter];
  els.currentFilterLabel.textContent = label;
}

function renderForm() {
  const note = state.notes.find((item) => item.id === state.selectedId);
  const hasNote = Boolean(note);

  els.formMode.textContent = hasNote ? "Editando nota" : "Nueva nota";
  els.titleInput.value = note?.title || "";
  els.topicInput.value = note?.topic || "Trabajo";
  els.priorityInput.value = note?.priority || "2";
  els.reminderInput.value = note?.reminder || "";
  els.tagsInput.value = note?.tags.join(", ") || "";
  els.descriptionEditor.innerHTML = note?.description || "";
  els.favoriteBtn.classList.toggle("active", note?.favorite);
  els.favoriteBtn.textContent = note?.favorite ? "★" : "☆";
  els.archiveBtn.classList.toggle("active", note?.archived);
  els.archiveBtn.textContent = note?.archived ? "▣" : "□";
  els.deleteBtn.disabled = !hasNote;
  els.saveStatus.textContent = hasNote ? `Última edición: ${formatDate(note.updatedAt)}` : "Lista para guardar";
}

function render() {
  updateFilters();
  renderStats();
  renderNotes();
  renderForm();
}

function selectNote(id) {
  state.selectedId = id;
  render();
  els.titleInput.focus();
}

function resetForm() {
  state.selectedId = null;
  render();
  els.titleInput.focus();
}

function buildNoteFromForm(existingNote) {
  const now = new Date().toISOString();
  return {
    id: existingNote?.id || crypto.randomUUID(),
    topic: els.topicInput.value,
    title: els.titleInput.value.trim(),
    description: els.descriptionEditor.innerHTML.trim(),
    tags: normalizeTags(els.tagsInput.value),
    priority: els.priorityInput.value,
    reminder: els.reminderInput.value,
    favorite: existingNote?.favorite || false,
    archived: existingNote?.archived || false,
    createdAt: existingNote?.createdAt || now,
    updatedAt: now,
  };
}

async function saveNote(event) {
  event.preventDefault();
  const existingIndex = state.notes.findIndex((note) => note.id === state.selectedId);
  const existingNote = state.notes[existingIndex];
  const nextNote = buildNoteFromForm(existingNote);

  if (!nextNote.title) {
    els.titleInput.focus();
    return;
  }

  try {
    const savedNote = await saveNoteToDatabase(nextNote, existingIndex >= 0);

    if (existingIndex >= 0) {
      state.notes.splice(existingIndex, 1, savedNote);
    } else {
      state.notes.unshift(savedNote);
    }

    state.selectedId = savedNote.id;
    els.saveStatus.textContent = "Nota guardada en MySQL";
  } catch (error) {
    if (existingIndex >= 0) {
      state.notes.splice(existingIndex, 1, nextNote);
    } else {
      state.notes.unshift(nextNote);
    }

    state.selectedId = nextNote.id;
    els.saveStatus.textContent = "Nota guardada solo en este navegador";
    console.warn(error);
  }

  persist();
  render();
}

async function deleteSelectedNote() {
  if (!state.selectedId) {
    return;
  }

  const note = state.notes.find((item) => item.id === state.selectedId);
  const confirmed = confirm(`¿Eliminar la nota "${note.title}"?`);
  if (!confirmed) {
    return;
  }

  const deletedId = state.selectedId;

  try {
    await deleteNoteFromDatabase(deletedId);
  } catch (error) {
    els.saveStatus.textContent = "No se pudo eliminar en MySQL";
    console.warn(error);
  }

  state.notes = state.notes.filter((item) => item.id !== deletedId);
  state.selectedId = null;
  persist();
  render();
}

async function toggleField(field) {
  const note = state.notes.find((item) => item.id === state.selectedId);
  if (!note) {
    return;
  }

  note[field] = !note[field];
  note.updatedAt = new Date().toISOString();

  try {
    const savedNote = await saveNoteToDatabase(note, true);
    Object.assign(note, savedNote);
    els.saveStatus.textContent = "Cambio guardado en MySQL";
  } catch (error) {
    els.saveStatus.textContent = "Cambio guardado solo en este navegador";
    console.warn(error);
  }

  persist();
  render();
}

function insertImage(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    document.execCommand("insertImage", false, reader.result);
    els.descriptionEditor.focus();
  };
  reader.readAsDataURL(file);
}

function handleToolbar(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const command = button.dataset.command;
  if (!command) {
    return;
  }

  event.preventDefault();
  els.descriptionEditor.focus();

  if (command === "createLink") {
    const url = prompt("Ingresa la URL del enlace");
    if (url) {
      document.execCommand(command, false, url);
    }
    return;
  }

  document.execCommand(command, false, button.dataset.value || null);
}

function bindEvents() {
  els.form.addEventListener("submit", saveNote);
  els.newNoteBtn.addEventListener("click", resetForm);
  els.clearBtn.addEventListener("click", resetForm);
  els.deleteBtn.addEventListener("click", deleteSelectedNote);
  els.favoriteBtn.addEventListener("click", () => toggleField("favorite"));
  els.archiveBtn.addEventListener("click", () => toggleField("archived"));
  els.searchInput.addEventListener("input", renderNotes);
  els.topicFilter.addEventListener("change", renderNotes);
  els.tagFilter.addEventListener("change", renderNotes);
  els.sortSelect.addEventListener("change", renderNotes);
  els.imageBtn.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", (event) => insertImage(event.target.files[0]));
  document.querySelector(".toolbar").addEventListener("click", handleToolbar);

  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.quickFilter = button.dataset.filter;
      document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("active"));
      button.classList.add("active");
      renderNotes();
    });
  });
}

bindEvents();
render();
loadNotesFromDatabase();
