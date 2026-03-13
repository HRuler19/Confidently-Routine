(function () {
  "use strict";

  let notes = [];
  let noteToDelete = null;

  window.addEventListener("pageLoaded", function (e) {
    if (e.detail.page === "notes") {
      setTimeout(initNotes, 100);
    }
  });

  function initNotes() {
    if (!document.querySelector(".notes-list")) {
      return;
    }

    notes = NoteStore.getNotes();
    renderNotes();

    initAddNoteButton();
    initFilterSelects();
    initModalEvents();
    attachEventDelegation();
    updateStats();
  }

  function renderNotes() {
    const container = document.querySelector(".notes-list");
    if (!container) return;

    container.innerHTML = "";

    if (notes.length === 0) {
      container.innerHTML = `
        <div class="notes-empty">
          <i class="fa-regular fa-note-sticky"></i>
          <p>No notes found. Add your first note above!</p>
        </div>
      `;
      return;
    }

    notes.forEach((note) => {
      const noteElement = createNoteElement(note);
      container.appendChild(noteElement);
    });

    applyFilters();
  }

  function createNoteElement(note) {
    const categoryLabels = {
      study: "Study",
      work: "Work",
      personal: "Personal",
      learning: "Learning",
    };

    const noteDiv = document.createElement("div");
    noteDiv.className = "note-card";
    noteDiv.dataset.id = note.id;

    noteDiv.innerHTML = `
      <div class="note-content">
        <div class="note-title">${escapeHtml(note.content).replace(/\n/g, "<br>")}</div>
        <div class="note-meta">
          <div class="note-category">
            <span>${categoryLabels[note.category] || note.category}</span>
          </div>
          <div class="note-date">
            <i class="fa-regular fa-calendar"></i>
            <span>${note.date || formatDate(note.createdAt)}</span>
          </div>
        </div>
      </div>
      <div class="note-actions">
        <button class="edit-btn" data-id="${note.id}" title="Edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="delete-btn" data-id="${note.id}" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    return noteDiv;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function attachEventDelegation() {
    const container = document.querySelector(".notes-list");
    if (!container) return;

    container.removeEventListener("click", handleNoteClick);
    container.addEventListener("click", handleNoteClick);
  }

  function handleNoteClick(e) {
    const target = e.target;

    if (target.closest(".edit-btn")) {
      e.preventDefault();
      const btn = target.closest(".edit-btn");
      const noteId = parseInt(btn.dataset.id);
      const noteCard = btn.closest(".note-card");
      if (noteCard && !noteCard.classList.contains("editing")) {
        startEditNote(noteId);
      }
    } else if (target.closest(".delete-btn")) {
      e.preventDefault();
      const btn = target.closest(".delete-btn");
      const noteId = parseInt(btn.dataset.id);
      const noteCard = btn.closest(".note-card");
      const noteTitle = noteCard
        .querySelector(".note-title")
        .textContent.substring(0, 30);
      showDeleteModal(noteId, noteTitle);
    }
  }

  function initAddNoteButton() {
    const textarea = document.getElementById("noteContent");
    const addBtn = document.getElementById("addNoteBtn");
    const dateInput = document.getElementById("noteDate");
    const categorySelect = document.getElementById("noteCategory");

    if (!textarea || !addBtn) return;

    // Input event
    textarea.removeEventListener("input", handleNoteInput);
    textarea.addEventListener("input", handleNoteInput);

    // Add button event
    addBtn.removeEventListener("click", handleAddNote);
    addBtn.addEventListener("click", handleAddNote);

    addBtn.disabled = textarea.value.trim() === "";

    if (dateInput && !dateInput.value) {
      dateInput.value = formatDate(new Date());
    }

    if (categorySelect && !categorySelect.dataset.value) {
      categorySelect.dataset.value = "study";
    }
  }

  function handleNoteInput() {
    const textarea = document.getElementById("noteContent");
    const addBtn = document.getElementById("addNoteBtn");
    if (textarea && addBtn) {
      addBtn.disabled = textarea.value.trim() === "";
    }
  }

  function handleAddNote() {
    const textarea = document.getElementById("noteContent");
    const dateInput = document.getElementById("noteDate");
    const categorySelect = document.getElementById("noteCategory");

    const content = textarea.value.trim();
    if (!content) return;

    const category = categorySelect?.dataset.value || "study";
    const date = dateInput?.value || formatDate(new Date());

    const newNote = {
      id: Date.now(),
      content: content,
      category: category,
      date: date,
      createdAt: Date.now(),
    };

    NoteStore.addNote(newNote);

    notes.unshift(newNote);
    const container = document.querySelector(".notes-list");
    const emptyState = container.querySelector(".notes-empty");
    if (emptyState) {
      container.innerHTML = "";
    }

    const noteElement = createNoteElement(newNote);
    if (container.firstChild) {
      container.insertBefore(noteElement, container.firstChild);
    } else {
      container.appendChild(noteElement);
    }

    textarea.value = "";
    addBtn.disabled = true;

    updateStats();
  }

  function startEditNote(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    exitAllEditModes();

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    noteCard.classList.add("editing");

    const noteContent = noteCard.querySelector(".note-content");
    const originalHTML = noteContent.outerHTML;
    noteCard.dataset.originalHTML = originalHTML;

    const categoryOptions = [
      { value: "study", label: "Study" },
      { value: "work", label: "Work" },
      { value: "personal", label: "Personal" },
      { value: "learning", label: "Learning" },
    ];

    let categoryOptionsHtml = "";
    categoryOptions.forEach((opt) => {
      const selected = opt.value === note.category ? "selected" : "";
      categoryOptionsHtml += `<div class="option" data-value="${opt.value}" ${selected ? 'data-selected="true"' : ""}>${opt.label}</div>`;
    });

    const editHTML = `
      <div class="note-edit-form">
        <div class="edit-wrapper">
          <div class="edit-textarea-container">
            <textarea class="edit-content" placeholder="Note content">${escapeHtml(note.content)}</textarea>
          </div>
          <div class="edit-sidebar">
            <button class="edit-save-btn" data-id="${noteId}"><i class="fa-solid fa-check"></i> Save</button>
            <button class="edit-cancel-btn" data-id="${noteId}"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <div class="edit-field">
              <label>Date</label>
              <div class="input-with-icon">
                <input type="text" class="edit-date" value="${note.date}" placeholder="mm/dd/yyyy">
                <i class="fa-regular fa-calendar"></i>
              </div>
            </div>
            <div class="edit-field">
              <label>Category</label>
              <div class="custom-select edit-category-select" data-value="${note.category}">
                <div class="select-trigger"><span>${categoryOptions.find((o) => o.value === note.category)?.label || note.category}</span></div>
                <div class="select-options">
                  ${categoryOptionsHtml}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    noteContent.innerHTML = editHTML;

    const saveBtn = noteCard.querySelector(".edit-save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        saveEditNote(noteId);
      });
    }

    const cancelBtn = noteCard.querySelector(".edit-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        cancelEditNote(noteId);
      });
    }

    initEditModeSelects(noteCard);

    const textarea = noteCard.querySelector(".edit-content");
    if (textarea) textarea.focus();
  }

  function initEditModeSelects(noteCard) {
    const selects = noteCard.querySelectorAll(".custom-select");

    selects.forEach((select) => {
      const trigger = select.querySelector(".select-trigger");
      const options = select.querySelectorAll(".option");

      if (trigger) {
        trigger.addEventListener("click", function (e) {
          e.stopPropagation();
          e.preventDefault();

          noteCard.querySelectorAll(".custom-select").forEach((s) => {
            if (s !== select) s.classList.remove("open");
          });

          select.classList.toggle("open");
        });
      }

      options.forEach((option) => {
        option.addEventListener("click", function (e) {
          e.stopPropagation();
          e.preventDefault();

          const triggerSpan = select.querySelector(".select-trigger span");
          if (triggerSpan) {
            triggerSpan.textContent = option.textContent;
          }
          select.dataset.value = option.dataset.value;
          select.classList.remove("open");
        });
      });
    });
  }

  function saveEditNote(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    const textarea = noteCard.querySelector(".edit-content");
    const dateInput = noteCard.querySelector(".edit-date");
    const categorySelect = noteCard.querySelector(".edit-category-select");

    const newContent = textarea ? textarea.value.trim() : "";
    if (!newContent) return;

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    note.content = newContent;
    if (dateInput) note.date = dateInput.value;
    if (categorySelect)
      note.category = categorySelect.dataset.value || note.category;

    NoteStore.updateNote(noteId, note);

    exitAllEditModes();

    renderNotes();
  }

  function cancelEditNote(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    if (noteCard.dataset.originalHTML) {
      const noteContent = noteCard.querySelector(".note-content");
      noteContent.outerHTML = noteCard.dataset.originalHTML;
    }

    noteCard.classList.remove("editing");
    delete noteCard.dataset.originalHTML;
  }

  function exitAllEditModes() {
    const editingCards = document.querySelectorAll(".note-card.editing");
    editingCards.forEach((card) => {
      if (card.dataset.originalHTML) {
        const noteContent = card.querySelector(".note-content");
        noteContent.outerHTML = card.dataset.originalHTML;
      }
      card.classList.remove("editing");
      delete card.dataset.originalHTML;
    });
  }

  function initFilterSelects() {
    const noteFilter = document.getElementById("noteFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    if (noteFilter) {
      noteFilter.removeEventListener("filterChange", handleFilterChange);
      noteFilter.addEventListener("filterChange", handleFilterChange);
    }

    if (categoryFilter) {
      categoryFilter.removeEventListener("filterChange", handleFilterChange);
      categoryFilter.addEventListener("filterChange", handleFilterChange);
    }
  }

  function handleFilterChange() {
    applyFilters();
  }

  function applyFilters() {
    const noteFilter = document.getElementById("noteFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    const filterValue = noteFilter?.dataset.value || "all";
    const categoryValue = categoryFilter?.dataset.value || "all";

    let filtered = [...notes];

    if (categoryValue && categoryValue !== "all") {
      filtered = filtered.filter((n) => n.category === categoryValue);
    }

    if (filterValue === "recent") {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (filterValue === "oldest") {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    }

    const container = document.querySelector(".notes-list");
    if (!container) return;

    container.innerHTML = "";

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="notes-empty">
          <i class="fa-regular fa-note-sticky"></i>
          <p>No notes match your filters.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((note) => {
      const noteElement = createNoteElement(note);
      container.appendChild(noteElement);
    });

    updateStats(filtered.length);
  }

  function initModalEvents() {
    const modal = document.getElementById("deleteNoteModal");
    const cancelBtn = document.getElementById("cancelDeleteNote");
    const deleteBtn = document.getElementById("confirmDeleteNote");

    if (cancelBtn) {
      cancelBtn.removeEventListener("click", closeDeleteModal);
      cancelBtn.addEventListener("click", closeDeleteModal);
    }

    if (deleteBtn) {
      deleteBtn.removeEventListener("click", confirmDeleteNote);
      deleteBtn.addEventListener("click", confirmDeleteNote);
    }

    if (modal) {
      modal.removeEventListener("click", handleModalClick);
      modal.addEventListener("click", handleModalClick);
    }

    document.removeEventListener("keydown", handleEscapeKey);
    document.addEventListener("keydown", handleEscapeKey);
  }

  function showDeleteModal(noteId, noteTitle) {
    noteToDelete = noteId;
    const modal = document.getElementById("deleteNoteModal");
    const titleElement = modal.querySelector(".modal-note-title");
    if (titleElement) titleElement.textContent = `"${noteTitle}"`;
    modal.classList.add("show");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("deleteNoteModal");
    modal.classList.remove("show");
    noteToDelete = null;
  }

  function confirmDeleteNote() {
    if (noteToDelete !== null) {
      NoteStore.deleteNote(noteToDelete);

      notes = notes.filter((n) => n.id !== noteToDelete);

      const noteElement = document.querySelector(
        `.note-card[data-id="${noteToDelete}"]`,
      );
      if (noteElement) noteElement.remove();

      if (notes.length === 0) {
        const container = document.querySelector(".notes-list");
        container.innerHTML = `
          <div class="notes-empty">
            <i class="fa-regular fa-note-sticky"></i>
            <p>No notes found. Add your first note above!</p>
          </div>
        `;
      }

      updateStats();
      closeDeleteModal();
    }
  }

  function handleModalClick(e) {
    if (e.target === document.getElementById("deleteNoteModal")) {
      closeDeleteModal();
    }
  }

  function handleEscapeKey(e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("deleteNoteModal");
      if (modal && modal.classList.contains("show")) {
        closeDeleteModal();
      }
    }
  }

  function updateStats(count) {
    const countElement = document.getElementById("notesCount");
    if (countElement) {
      countElement.textContent = count !== undefined ? count : notes.length;
    }
  }

  function formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }
})();
