(function () {
  "use strict";

  // State - Load from NoteStore instead of hardcoded notes
  let notes = [];

  let noteToDelete = null;
  let datePicker = null;

  document.addEventListener("DOMContentLoaded", function () {
    initNotes();
  });

  window.addEventListener("pageLoaded", function (e) {
    if (e.detail.page === "notes") {
      initNotes();
    }
  });

  function initNotes() {
    if (!document.querySelector(".notes-add-section")) return;

    // Load notes from localStorage
    notes = NoteStore.getNotes() || [];

    console.log("Notes initialized with", notes.length, "notes");

    initDatePicker();
    renderNotesToDOM();
    attachEvents();
    updateStats();
    initAddNoteButton();
    initModalEvents();
    // Apply filters on initialization
    filterNotes();
  }

  /**
   * Render all notes to DOM
   */
  function renderNotesToDOM() {
    const container = document.querySelector(".notes-list");
    if (!container) return;

    container.innerHTML = "";
    notes.forEach((note) => {
      addNoteToDOM(note);
    });
  }

  function initDatePicker() {
    // No calendar - just plain text input
    return;
  }

  function initAddNoteButton() {
    const textarea = document.getElementById("noteContent");
    const addBtn = document.getElementById("addNoteBtn");
    const categorySelect = document.getElementById("noteCategory");

    // Initialize category select value
    if (categorySelect && !categorySelect.dataset.value) {
      categorySelect.dataset.value = "study";
    }

    if (textarea && addBtn) {
      textarea.removeEventListener("input", handleInput);
      addBtn.removeEventListener("click", handleAddNote);

      textarea.addEventListener("input", handleInput);
      addBtn.addEventListener("click", handleAddNote);

      addBtn.disabled = textarea.value.trim() === "";
    }
  }

  function handleInput() {
    const textarea = document.getElementById("noteContent");
    const addBtn = document.getElementById("addNoteBtn");
    if (textarea && addBtn) {
      addBtn.disabled = this.value.trim() === "";
    }
  }

  function initModalEvents() {
    const modal = document.getElementById("deleteNoteModal");
    const cancelBtn = document.getElementById("cancelDeleteNote");
    const deleteBtn = document.getElementById("confirmDeleteNote");

    if (cancelBtn) {
      cancelBtn.removeEventListener("click", closeModal);
      cancelBtn.addEventListener("click", closeModal);
    }

    if (deleteBtn) {
      deleteBtn.removeEventListener("click", confirmDelete);
      deleteBtn.addEventListener("click", confirmDelete);
    }

    if (modal) {
      modal.removeEventListener("click", handleModalClick);
      modal.addEventListener("click", handleModalClick);
    }

    document.removeEventListener("keydown", handleEscapeKey);
    document.addEventListener("keydown", handleEscapeKey);
  }

  function handleModalClick(e) {
    if (e.target === document.getElementById("deleteNoteModal")) {
      closeModal();
    }
  }

  function handleEscapeKey(e) {
    const modal = document.getElementById("deleteNoteModal");
    if (e.key === "Escape" && modal && modal.classList.contains("show")) {
      closeModal();
    }
  }

  function openModal(noteId, noteTitle) {
    noteToDelete = noteId;
    const modal = document.getElementById("deleteNoteModal");
    const noteTitleElement = modal.querySelector(".modal-note-title");
    if (noteTitleElement) noteTitleElement.textContent = `"${noteTitle}"`;
    modal.classList.add("show");
  }

  function closeModal() {
    const modal = document.getElementById("deleteNoteModal");
    if (modal) {
      modal.classList.remove("show");
    }
    noteToDelete = null;
  }

  function confirmDelete() {
    if (noteToDelete !== null) {
      // Remove from array
      notes = notes.filter((n) => n.id !== noteToDelete);
      // Update localStorage
      NoteStore.updateNotes(notes);
      // Remove from DOM
      const noteElement = document.querySelector(
        `.note-card[data-id="${noteToDelete}"]`,
      );
      if (noteElement) {
        noteElement.remove();
      }
      // Update stats
      updateStats();
      // Close modal
      closeModal();
      // Check if empty
      checkEmptyState();
    }
  }

  function handleAddNote() {
    const textarea = document.getElementById("noteContent");
    const dateInput = document.getElementById("noteDate");
    const categorySelect = document.getElementById("noteCategory");

    const content = textarea.value.trim();
    if (!content) return;

    const category = categorySelect ? categorySelect.dataset.value : "study";
    const date = dateInput ? dateInput.value : formatDate(new Date());

    const newNote = {
      id: Date.now(),
      content: content,
      category: category,
      date: date,
      createdAt: Date.now(),
    };

    // Add to array
    notes.unshift(newNote);
    // Save to localStorage
    NoteStore.addNote(newNote);
    // Add to DOM
    addNoteToDOM(newNote, true);
    // Clear input
    textarea.value = "";
    // Disable button
    const addBtn = document.getElementById("addNoteBtn");
    if (addBtn) addBtn.disabled = true;
    // Update stats
    updateStats();
    // Remove empty state if present
    const emptyState = document.querySelector(".notes-empty");
    if (emptyState) emptyState.remove();
  }

  function addNoteToDOM(note, prepend = false) {
    const container = document.querySelector(".notes-list");
    if (!container) return;

    const categoryLabels = {
      study: "Study",
      work: "Work",
      personal: "Personal",
      learning: "Learning",
    };

    const noteElement = document.createElement("div");
    noteElement.className = "note-card";
    noteElement.dataset.id = note.id;
    noteElement.innerHTML = `
      <div class="note-content">
        <div class="note-title">${note.content.replace(/\n/g, "<br>")}</div>
        <div class="note-meta">
          <div class="note-category">
            <span>${categoryLabels[note.category] || note.category}</span>
          </div>
          <div class="note-date">
            <i class="fa-regular fa-calendar"></i>
            <span>${getRelativeTime(note.createdAt)}</span>
          </div>
        </div>
      </div>
      <div class="note-actions">
        <button class="edit-btn" title="Edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="delete-btn" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    if (prepend && container.firstChild) {
      container.insertBefore(noteElement, container.firstChild);
    } else {
      container.appendChild(noteElement);
    }
  }

  function attachEvents() {
    // Event delegation for note actions
    const container = document.querySelector(".notes-list");
    if (container) {
      container.addEventListener("click", function (e) {
        const editBtn = e.target.closest(".edit-btn");
        const deleteBtn = e.target.closest(".delete-btn");
        const saveBtn = e.target.closest(".btn-save");
        const cancelBtn = e.target.closest(".btn-cancel");

        if (editBtn) {
          const noteId = parseInt(editBtn.closest(".note-card").dataset.id);
          startEdit(noteId);
        } else if (deleteBtn) {
          const noteCard = deleteBtn.closest(".note-card");
          const noteId = parseInt(noteCard.dataset.id);
          const noteTitle = noteCard
            .querySelector(".note-title")
            .textContent.substring(0, 30);
          openModal(noteId, noteTitle);
        } else if (saveBtn) {
          const noteId = parseInt(saveBtn.closest(".note-card").dataset.id);
          saveEdit(noteId);
        } else if (cancelBtn) {
          const noteId = parseInt(cancelBtn.closest(".note-card").dataset.id);
          cancelEdit(noteId);
        }
      });
    }

    // Event delegation for custom selects
    document.addEventListener("click", function (e) {
      // Custom select triggers
      if (e.target.closest(".select-trigger")) {
        const select = e.target.closest(".custom-select");
        if (select) {
          e.stopPropagation();

          document.querySelectorAll(".custom-select").forEach((s) => {
            if (s !== select) s.classList.remove("open");
          });

          select.classList.toggle("open");
        }
        return;
      }

      // Custom select options
      if (e.target.closest(".option")) {
        const option = e.target.closest(".option");
        const select = option.closest(".custom-select");
        if (!select) return;

        const value = option.dataset.value;
        const text = option.textContent;
        const triggerSpan = select.querySelector(".select-trigger span");

        if (triggerSpan) {
          triggerSpan.textContent = text;
        }

        select.dataset.value = value;
        select.classList.remove("open");

        // Dispatch filter change event for filter selects
        if (select.id === "noteFilter" || select.id === "categoryFilter") {
          filterNotes();
        }

        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Click outside - close all custom selects
      if (!e.target.closest(".custom-select")) {
        document.querySelectorAll(".custom-select.open").forEach((s) => {
          s.classList.remove("open");
        });
      }
    });
  }

  function startEdit(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    // Close any other editing cards
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
      const selected =
        opt.value === note.category ? 'data-selected="true"' : "";
      categoryOptionsHtml += `<div class="option" data-value="${opt.value}" ${selected}>${opt.label}</div>`;
    });

    const editHTML = `
      <div class="note-edit-form">
        <div class="edit-wrapper">
          <div class="edit-textarea-container">
            <textarea class="edit-content" placeholder="Note content">${note.content}</textarea>
          </div>
          <div class="edit-sidebar">
            <button class="edit-save-btn"><i class="fa-solid fa-check"></i> Save</button>
            <button class="edit-cancel-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>
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

    // Focus on textarea
    const textarea = noteContent.querySelector(".edit-content");
    if (textarea) {
      textarea.focus();
    }

    // Attach edit mode events
    attachEditModeEvents(noteCard, noteId);
  }

  function exitAllEditModes() {
    const editingCards = document.querySelectorAll(".note-card.editing");
    editingCards.forEach((card) => {
      const originalHTML = card.dataset.originalHTML;
      if (originalHTML) {
        const noteContent = card.querySelector(".note-content");
        if (noteContent) {
          noteContent.outerHTML = originalHTML;
        }
      }
      card.classList.remove("editing");
      delete card.dataset.originalHTML;
    });
  }

  function attachEditModeEvents(noteCard, noteId) {
    const saveBtn = noteCard.querySelector(".edit-save-btn");
    const cancelBtn = noteCard.querySelector(".edit-cancel-btn");

    if (saveBtn) {
      saveBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        saveEdit(noteId);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        cancelEdit(noteId);
      });
    }

    // Handle custom select in edit mode
    const editSelects = noteCard.querySelectorAll(".edit-category-select");
    editSelects.forEach((select) => {
      const trigger = select.querySelector(".select-trigger");
      const options = select.querySelectorAll(".option");

      if (trigger) {
        trigger.addEventListener("click", function (e) {
          e.stopPropagation();
          // Close other selects
          document.querySelectorAll(".custom-select.open").forEach((s) => {
            if (s !== select) s.classList.remove("open");
          });
          select.classList.toggle("open");
        });
      }

      options.forEach((option) => {
        option.addEventListener("click", function (e) {
          e.stopPropagation();
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

  function saveEdit(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    const textarea = noteCard.querySelector(".edit-content");
    const dateInput = noteCard.querySelector(".edit-date");
    const categorySelect = noteCard.querySelector(".edit-category-select");

    const newContent = textarea ? textarea.value.trim() : "";
    const newDate = dateInput ? dateInput.value : "";
    const newCategory = categorySelect ? categorySelect.dataset.value : "study";

    if (!newContent) return;

    // Update in array
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      note.content = newContent;
      note.date = newDate;
      note.category = newCategory;
      // Update localStorage
      NoteStore.updateNote(noteId, {
        content: newContent,
        date: newDate,
        category: newCategory,
      });
    }

    // Re-render the note card
    noteCard.classList.remove("editing");
    delete noteCard.dataset.originalHTML;

    // Re-render the note card with updated content
    const categoryLabels = {
      study: "Study",
      work: "Work",
      personal: "Personal",
      learning: "Learning",
    };

    const noteContent = noteCard.querySelector(".note-content");
    if (noteContent && note) {
      noteContent.innerHTML = `
        <div class="note-title">${note.content.replace(/\n/g, "<br>")}</div>
        <div class="note-meta">
          <div class="note-category">
            <span>${categoryLabels[note.category] || note.category}</span>
          </div>
          <div class="note-date">
            <i class="fa-regular fa-calendar"></i>
            <span>${getRelativeTime(note.createdAt)}</span>
          </div>
        </div>
      `;
    }
  }

  function cancelEdit(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    const originalHTML = noteCard.dataset.originalHTML;
    if (originalHTML) {
      const noteContent = noteCard.querySelector(".note-content");
      if (noteContent) {
        noteContent.outerHTML = originalHTML;
      }
    }

    noteCard.classList.remove("editing");
    delete noteCard.dataset.originalHTML;
  }

  function filterNotes() {
    const noteFilter = document.getElementById("noteFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    const filterValue = noteFilter ? noteFilter.dataset.value : "all";
    const categoryValue = categoryFilter ? categoryFilter.dataset.value : "all";

    let filtered = [...notes];

    // Filter by category
    if (categoryValue && categoryValue !== "all") {
      filtered = filtered.filter((n) => n.category === categoryValue);
    }

    // Sort by filter
    if (filterValue === "recent") {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (filterValue === "oldest") {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    }

    // Render filtered notes
    const container = document.querySelector(".notes-list");
    if (!container) return;

    container.innerHTML = "";
    filtered.forEach((note) => {
      addNoteToDOM(note);
    });

    // Update count
    updateStats(filtered.length);
    // Check empty state
    checkEmptyState();
  }

  function updateStats(count) {
    const countElement = document.getElementById("notesCount");
    if (countElement) {
      const displayCount = count !== undefined ? count : notes.length;
      countElement.textContent = displayCount;
    }
  }

  function checkEmptyState() {
    const container = document.querySelector(".notes-list");
    if (!container) return;

    const existingEmpty = container.querySelector(".notes-empty");
    const noteCards = container.querySelectorAll(".note-card");

    if (noteCards.length === 0 && !existingEmpty) {
      container.innerHTML = `
        <div class="notes-empty">
          <i class="fa-regular fa-note-sticky"></i>
          <p>No notes found. Add your first note above!</p>
        </div>
      `;
    } else if (noteCards.length > 0 && existingEmpty) {
      existingEmpty.remove();
    }
  }

  function formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  // Public API
  window.NotesModule = {
    initNotes,
    startEdit,
    saveEdit,
    cancelEdit,
    openDeleteModal: openModal,
  };
})();
