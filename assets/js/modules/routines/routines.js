(function () {
  "use strict";

  let tasks = [];
  let datePicker = null;
  let editDatePickers = [];

  window.addEventListener("pageLoaded", function (e) {
    if (e.detail.page === "routines") {
      setTimeout(initRoutines, 100);
    }
  });

  window.addEventListener("languageChange", function () {
    if (!document.querySelector(".tasks-container")) return;
    renderTasks();
    updateStats();
    initDatePicker();
  });

  function initRoutines() {
    if (!document.querySelector(".tasks-container")) {
      return;
    }

    tasks = TaskStore.getTasks();
    renderTasks();

    initDatePicker();
    initAddTaskButton();
    initFilterSelects();
    initModalEvents();
    updateStats();

    attachEventDelegation();
  }

  function renderTasks() {
    const container = document.querySelector(".tasks-container");
    if (!container) return;

    container.innerHTML = "";

    if (tasks.length === 0) {
      container.innerHTML = `<div class="empty-state">${I18n.t("routines.empty_state")}</div>`;
      return;
    }

    tasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      container.appendChild(taskElement);
    });

    applyFilters();
  }

  function createTaskElement(task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task-item ${task.completed ? "completed" : ""}`;
    taskDiv.dataset.id = task.id;
    taskDiv.dataset.completed = task.completed;

    const checked = task.completed ? "checked" : "";
    const categoryClass =
      task.category.toLowerCase().replace(/\s+/g, "-") + "-category";

    taskDiv.innerHTML = `
      <div class="task-row">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" id="task-${task.id}" ${checked}>
          <label for="task-${task.id}" class="task-checkbox-label"></label>
          <h3 class="task-title">${DomHelpers.escapeHtml(task.title)}</h3>
        </div>

        <div class="task-meta">
          <span class="task-category ${categoryClass}">${DomHelpers.escapeHtml(I18n.t("routines.category_" + task.category.toLowerCase()))}</span>
          <span class="task-priority priority-${task.priority}">
            ${DomHelpers.escapeHtml(I18n.t("routines.priority_" + task.priority))}
          </span>
          <span class="task-date">
            <i class="fa-regular fa-calendar"></i>
            ${formatDisplayDate(task.dueDate)}
          </span>
        </div>

        <div class="task-actions">
          <button class="icon-btn edit-btn" data-id="${task.id}"><i class="fa-solid fa-pen"></i><span class="icon-btn-label">${DomHelpers.escapeHtml(I18n.t("common.edit"))}</span></button>
          <button class="icon-btn delete-btn" data-id="${task.id}"><i class="fa-solid fa-trash-can"></i><span class="icon-btn-label">${DomHelpers.escapeHtml(I18n.t("common.delete"))}</span></button>
        </div>
      </div>
    `;

    return taskDiv;
  }

  function attachEventDelegation() {
    const container = document.querySelector(".tasks-container");
    if (!container) return;

    container.removeEventListener("click", handleContainerClick);
    container.removeEventListener("change", handleContainerChange);

    container.addEventListener("click", handleContainerClick);
    container.addEventListener("change", handleContainerChange);
  }

  function handleContainerClick(e) {
    const target = e.target;

    if (target.closest(".edit-btn")) {
      e.preventDefault();
      const btn = target.closest(".edit-btn");
      const taskId = btn.dataset.id;
      const taskItem = btn.closest(".task-item");
      if (taskItem && !taskItem.classList.contains("editing")) {
        startEditTask(taskId);
      }
    } else if (target.closest(".delete-btn")) {
      e.preventDefault();
      const btn = target.closest(".delete-btn");
      const taskId = btn.dataset.id;
      const task = tasks.find((t) => t.id == taskId);
      if (task) {
        showDeleteModal(taskId, task.title);
      }
    }
  }

  function handleContainerChange(e) {
    if (e.target.classList.contains("task-checkbox")) {
      const checkbox = e.target;
      const taskId = checkbox.id.replace("task-", "");
      const taskItem = checkbox.closest(".task-item");

      const task = tasks.find((t) => t.id == taskId);
      if (task) {
        task.completed = checkbox.checked;
        taskItem.classList.toggle("completed", checkbox.checked);
        taskItem.dataset.completed = checkbox.checked;

        TaskStore.updateTask(taskId, { completed: checkbox.checked });
        updateStats();
        applyFilters();
      }
    }
  }

  function startEditTask(taskId) {
    const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (!taskItem) return;

    exitAllEditModes();

    const task = tasks.find((t) => t.id == taskId);
    if (!task) return;

    taskItem.classList.add("editing");

    const taskRow = taskItem.querySelector(".task-row");
    const originalHTML = taskRow.outerHTML;
    taskItem.dataset.originalHTML = originalHTML;

    const categoryOptions = [
      { value: "Personal", label: I18n.t("routines.category_personal") },
      { value: "Work", label: I18n.t("routines.category_work") },
      { value: "Shopping", label: I18n.t("routines.category_shopping") },
      { value: "Other", label: I18n.t("routines.category_other") },
    ];

    const priorityOptions = [
      { value: "low", label: I18n.t("routines.priority_low") },
      { value: "medium", label: I18n.t("routines.priority_medium") },
      { value: "high", label: I18n.t("routines.priority_high") },
      { value: "hard", label: I18n.t("routines.priority_hard") },
    ];

    let categoryOptionsHtml = "";
    categoryOptions.forEach((opt) => {
      const selected = opt.value === task.category ? "selected" : "";
      categoryOptionsHtml += `<div class="option" data-value="${opt.value}" ${selected ? 'data-selected="true"' : ""}>${opt.label}</div>`;
    });

    let priorityOptionsHtml = "";
    priorityOptions.forEach((opt) => {
      const selected = opt.value === task.priority ? "selected" : "";
      priorityOptionsHtml += `<div class="option" data-value="${opt.value}" ${selected ? 'data-selected="true"' : ""}>${opt.label}</div>`;
    });

    const categoryLabel =
      categoryOptions.find((o) => o.value === task.category)?.label || task.category;
    const priorityLabel =
      priorityOptions.find((o) => o.value === task.priority)?.label || task.priority;

    const editHTML = `
      <div class="task-edit-form">
        <div class="edit-field">
          <label>${I18n.t("routines.task_title_label")}</label>
          <input type="text" class="edit-title" value="${DomHelpers.escapeHtml(task.title)}" placeholder="${I18n.t("routines.task_title_label")}">
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label>${I18n.t("routines.category_label")}</label>
            <div class="custom-select edit-category-select" data-value="${task.category}">
              <div class="select-trigger"><span>${DomHelpers.escapeHtml(categoryLabel)}</span></div>
              <div class="select-options">
                ${categoryOptionsHtml}
              </div>
            </div>
          </div>

          <div class="edit-field">
            <label>${I18n.t("routines.priority_label")}</label>
            <div class="custom-select edit-priority-select" data-value="${task.priority}">
              <div class="select-trigger"><span>${DomHelpers.escapeHtml(priorityLabel)}</span></div>
              <div class="select-options">
                ${priorityOptionsHtml}
              </div>
            </div>
          </div>
        </div>

        <div class="edit-field due-date-field">
          <label>${I18n.t("routines.due_date_label")}</label>
          <input type="text" class="edit-date" value="${task.dueDate}" placeholder="${I18n.t("routines.select_date_placeholder")}">
        </div>

        <div class="edit-actions">
          <button class="edit-save-btn" data-id="${taskId}"><i class="fa-solid fa-check"></i> ${I18n.t("common.save")}</button>
          <button class="edit-cancel-btn" data-id="${taskId}"><i class="fa-solid fa-xmark"></i> ${I18n.t("common.cancel")}</button>
        </div>
      </div>
    `;

    taskRow.innerHTML = editHTML;

    const editDateInput = taskItem.querySelector(".edit-date");
    if (editDateInput) {
      destroyEditDatePickers();

      try {
        const picker = flatpickr(editDateInput, {
          ...DomHelpers.getFlatpickrBaseConfig(),
          defaultDate: task.dueDate,
        });
        editDatePickers.push(picker);

        editDateInput.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          picker.open();
        });
      } catch (e) {
        console.log("Date picker error:", e);
      }
    }

    const saveBtn = taskItem.querySelector(".edit-save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        saveEditTask(taskId);
      });
    }

    const cancelBtn = taskItem.querySelector(".edit-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        cancelEditTask(taskId);
      });
    }

    DomHelpers.initCustomSelects(taskItem);
  }

  function saveEditTask(taskId) {
    const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (!taskItem) return;

    const titleInput = taskItem.querySelector(".edit-title");
    const categorySelect = taskItem.querySelector(".edit-category-select");
    const prioritySelect = taskItem.querySelector(".edit-priority-select");
    const dateInput = taskItem.querySelector(".edit-date");

    const newTitle = titleInput ? titleInput.value.trim() : "";
    if (!newTitle) return;

    const task = tasks.find((t) => t.id == taskId);
    if (!task) return;

    task.title = newTitle;
    if (categorySelect)
      task.category = categorySelect.dataset.value || task.category;
    if (prioritySelect)
      task.priority = prioritySelect.dataset.value || task.priority;
    if (dateInput) {
      task.dueDate = dateInput.value;
      task.displayDate = formatDisplayDate(dateInput.value);
    }

    TaskStore.updateTask(taskId, task);

    exitAllEditModes();

    renderTasks();
  }

  function cancelEditTask(taskId) {
    const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (!taskItem) return;

    if (taskItem.dataset.originalHTML) {
      const taskRow = taskItem.querySelector(".task-row");
      taskRow.outerHTML = taskItem.dataset.originalHTML;
    }

    taskItem.classList.remove("editing");
    destroyEditDatePickers();
  }

  function exitAllEditModes() {
    const editingItems = document.querySelectorAll(".task-item.editing");
    editingItems.forEach((item) => {
      if (item.dataset.originalHTML) {
        const taskRow = item.querySelector(".task-row");
        taskRow.outerHTML = item.dataset.originalHTML;
      }
      item.classList.remove("editing");
    });
    destroyEditDatePickers();
  }

  function destroyEditDatePickers() {
    if (editDatePickers.length > 0) {
      editDatePickers.forEach((picker) => {
        if (picker && picker.destroy) {
          try {
            picker.destroy();
          } catch (e) {}
        }
      });
      editDatePickers = [];
    }
  }

  function initAddTaskButton() {
    const input = document.getElementById("taskInput");
    const addBtn = document.getElementById("addTaskBtn");
    const dateInput = document.getElementById("taskDate");

    if (!input || !addBtn) return;

    input.removeEventListener("input", handleAddTaskInput);
    input.addEventListener("input", handleAddTaskInput);

    addBtn.removeEventListener("click", handleAddTaskClick);
    addBtn.addEventListener("click", handleAddTaskClick);

    addBtn.disabled = input.value.trim() === "";
  }

  function handleAddTaskInput() {
    const input = document.getElementById("taskInput");
    const addBtn = document.getElementById("addTaskBtn");
    if (input && addBtn) {
      addBtn.disabled = input.value.trim() === "";
    }
  }

  function handleAddTaskClick() {
    const input = document.getElementById("taskInput");
    const addBtn = document.getElementById("addTaskBtn");
    const title = input.value.trim();

    if (!title) return;

    const categorySelect = document.getElementById("categorySelect");
    const prioritySelect = document.getElementById("prioritySelect");
    const dateInput = document.getElementById("taskDate");

    const selectedCategory = categorySelect?.dataset.value || "personal";
    const selectedPriority = prioritySelect?.dataset.value || "medium";

    const categoryDisplay =
      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

    const today = new Date().toISOString().split("T")[0];
    const selectedDate = dateInput?.value || today;

    const newTask = {
      id: Date.now(),
      title: title,
      category: categoryDisplay,
      priority: selectedPriority,
      dueDate: selectedDate,
      displayDate: formatDisplayDate(selectedDate),
      completed: false,
    };

    TaskStore.addTask(newTask);

    tasks.push(newTask);

    const container = document.querySelector(".tasks-container");
    const emptyState = container.querySelector(".empty-state");
    if (emptyState) {
      container.innerHTML = "";
    }

    const taskElement = createTaskElement(newTask);
    container.appendChild(taskElement);

    input.value = "";
    addBtn.disabled = true;

    if (dateInput && datePicker) {
      dateInput.value = today;
      datePicker.setDate(today);
    }

    updateStats();
    applyFilters();
  }

  function initFilterSelects() {
    const filterIds = [
      "taskStatusSelect",
      "categoryFilterSelect",
      "priorityFilterSelect",
    ];

    filterIds.forEach((id) => {
      const select = document.getElementById(id);
      if (select) {
        select.removeEventListener("filterChange", handleFilterChange);
        select.addEventListener("filterChange", handleFilterChange);
      }
    });
  }

  function handleFilterChange() {
    applyFilters();
  }

  function applyFilters() {
    const statusSelect = document.getElementById("taskStatusSelect");
    const categorySelect = document.getElementById("categoryFilterSelect");
    const prioritySelect = document.getElementById("priorityFilterSelect");

    const statusFilter = statusSelect?.dataset.value || "all";
    const categoryFilter = categorySelect?.dataset.value || "all";
    const priorityFilter = prioritySelect?.dataset.value || "all";

    const taskItems = document.querySelectorAll(".task-item");

    taskItems.forEach((item) => {
      const taskId = item.dataset.id;
      const task = tasks.find((t) => t.id == taskId);

      if (!task) {
        item.style.display = "none";
        return;
      }

      let show = true;

      if (statusFilter !== "all") {
        const taskStatus = task.completed ? "completed" : "active";
        if (statusFilter !== taskStatus) show = false;
      }

      if (show && categoryFilter !== "all") {
        if (task.category.toLowerCase() !== categoryFilter.toLowerCase())
          show = false;
      }

      if (show && priorityFilter !== "all") {
        if (task.priority !== priorityFilter) show = false;
      }

      item.style.display = show ? "block" : "none";
    });

    updateVisibleStats();
  }

  function initModalEvents() {
    DomHelpers.setupConfirmModal({
      modalId: "deleteTaskModal",
      cancelId: "cancelDelete",
      confirmId: "confirmDelete",
      onConfirm: confirmDeleteTask,
      onClose: closeDeleteModal,
    });
  }

  let taskToDelete = null;

  function showDeleteModal(taskId, taskTitle) {
    taskToDelete = taskId;
    const modal = document.getElementById("deleteTaskModal");
    const titleElement = modal.querySelector(".modal-task-title");
    if (titleElement) titleElement.textContent = `"${taskTitle}"`;
    modal.classList.add("show");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("deleteTaskModal");
    modal.classList.remove("show");
    taskToDelete = null;
  }

  function confirmDeleteTask() {
    if (taskToDelete) {
      TaskStore.deleteTask(taskToDelete);

      tasks = tasks.filter((t) => t.id != taskToDelete);

      const taskItem = document.querySelector(
        `.task-item[data-id="${taskToDelete}"]`,
      );
      if (taskItem) taskItem.remove();

      if (tasks.length === 0) {
        const container = document.querySelector(".tasks-container");
        container.innerHTML = `<div class="empty-state">${I18n.t("routines.empty_state")}</div>`;
      }

      updateStats();
      closeDeleteModal();
    }
  }

  function initDatePicker() {
    const dateInput = document.getElementById("taskDate");
    if (!dateInput) return;

    if (datePicker) {
      datePicker.destroy();
    }

    datePicker = flatpickr(dateInput, {
      ...DomHelpers.getFlatpickrBaseConfig(),
      defaultDate: dateInput.value || new Date().toISOString().split("T")[0],
      onChange: function (selectedDates, dateStr) {
        dateInput.value = dateStr;
      },
    });

    dateInput.addEventListener("click", function () {
      if (datePicker) {
        datePicker.open();
      }
    });
  }

  function formatDisplayDate(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return I18n.t("routines.date_today");
    if (diffDays === 1) return I18n.t("routines.date_tomorrow");
    if (diffDays === -1) return I18n.t("routines.date_yesterday");
    if (diffDays < -1)
      return I18n.t("routines.date_days_ago", { n: Math.abs(diffDays) });
    if (diffDays > 1) return I18n.t("routines.date_in_days", { n: diffDays });
    return dateStr.split("-").reverse().join("/");
  }

  function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const activeTasks = totalTasks - completedTasks;

    const statBadges = document.querySelectorAll(".stat-badge");
    if (statBadges.length >= 3) {
      const totalSpan = statBadges[0].querySelector("span:nth-child(2)");
      const completedSpan = statBadges[1].querySelector("span:nth-child(2)");
      const activeSpan = statBadges[2].querySelector("span:nth-child(2)");

      if (totalSpan) totalSpan.textContent = totalTasks;
      if (completedSpan) completedSpan.textContent = completedTasks;
      if (activeSpan) activeSpan.textContent = activeTasks;
    }
  }

  function updateVisibleStats() {
    const taskItems = document.querySelectorAll(".task-item");
    let totalVisible = 0;
    let completedVisible = 0;

    taskItems.forEach((item) => {
      if (item.style.display !== "none") {
        totalVisible++;
        if (item.dataset.completed === "true") completedVisible++;
      }
    });

    const statBadges = document.querySelectorAll(".stat-badge");
    if (statBadges.length >= 3) {
      const totalSpan = statBadges[0].querySelector("span:nth-child(2)");
      const completedSpan = statBadges[1].querySelector("span:nth-child(2)");
      const activeSpan = statBadges[2].querySelector("span:nth-child(2)");

      if (totalSpan) totalSpan.textContent = totalVisible;
      if (completedSpan) completedSpan.textContent = completedVisible;
      if (activeSpan) activeSpan.textContent = totalVisible - completedVisible;
    }
  }
})();
