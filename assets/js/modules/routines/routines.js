(function () {
  "use strict";

  // Flatpickr instance
  let datePicker = null;

  // State - Load from TaskStore instead of hardcoded tasks
  let tasks = [];

  let taskToDelete = null;
  let editDatePickers = [];

  document.addEventListener("DOMContentLoaded", function () {
    initRoutines();
  });

  window.addEventListener("pageLoaded", function (e) {
    if (e.detail.page === "routines") {
      initRoutines();
    }
  });

  function initRoutines() {
    if (!document.querySelector(".tasks-container")) return;

    // Load tasks from localStorage
    tasks = TaskStore.getTasks() || [];

    console.log("Routines initialized with", tasks.length, "tasks");

    initDatePicker();
    renderTasksToDOM();
    attachEvents();
    attachFilterChangeListener();
    updateStats();
    initAddTaskButton();
    initModalEvents();
    initFilterSelects();
    // Apply filters on initialization
    filterTasks();
  }

  /**
   * Render all tasks to DOM
   */
  function renderTasksToDOM() {
    const container = document.querySelector(".tasks-container");
    if (!container) return;

    container.innerHTML = "";
    tasks.forEach((task) => {
      addTaskToDOM(task);
    });
  }

  function initDatePicker() {
    const dateInput = document.getElementById("taskDate");
    if (!dateInput) return;

    if (datePicker) {
      datePicker.destroy();
    }

    dateInput.type = "text";

    datePicker = flatpickr(dateInput, {
      dateFormat: "Y-m-d",
      defaultDate: dateInput.value || new Date().toISOString().split("T")[0],
      minDate: "today",
      disableMobile: true,
      animate: true,
      static: true,
      monthSelectorType: "static",
      locale: {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          longhand: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
        },
        months: {
          shorthand: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          longhand: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ],
        },
      },
      onOpen: function (selectedDates, dateStr, instance) {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add("open-animation");
        }
      },
      onChange: function (selectedDates, dateStr) {
        dateInput.value = dateStr;
      },
      onReady: function (selectedDates, dateStr, instance) {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add("ios-wheel-picker");
        }
      },
    });

    dateInput.addEventListener("click", function () {
      if (datePicker) {
        datePicker.open();
      }
    });
  }

  function initEditDatePicker(inputElement, defaultDate) {
    if (!inputElement) return null;

    inputElement.type = "text";

    const picker = flatpickr(inputElement, {
      dateFormat: "Y-m-d",
      defaultDate: defaultDate || new Date().toISOString().split("T")[0],
      minDate: "today",
      disableMobile: true,
      animate: true,
      static: true,
      monthSelectorType: "static",
      locale: {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          longhand: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
        },
        months: {
          shorthand: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          longhand: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ],
        },
      },
      onOpen: function (selectedDates, dateStr, instance) {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add("open-animation");
        }
      },
      onReady: function (selectedDates, dateStr, instance) {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add("ios-wheel-picker");
        }
      },
    });

    inputElement.addEventListener("click", function (e) {
      e.stopPropagation();
      if (picker && typeof picker.open === "function") {
        picker.open();
      }
    });

    return picker;
  }

  function initAddTaskButton() {
    const input = document.getElementById("taskInput");
    const addBtn = document.getElementById("addTaskBtn");
    const categorySelect = document.getElementById("categorySelect");
    const prioritySelect = document.getElementById("prioritySelect");

    // Initialize category and priority select values
    if (categorySelect && !categorySelect.dataset.value) {
      categorySelect.dataset.value = "personal";
    }
    if (prioritySelect && !prioritySelect.dataset.value) {
      prioritySelect.dataset.value = "medium";
    }

    if (input && addBtn) {
      input.removeEventListener("input", handleInput);
      addBtn.removeEventListener("click", handleAddTask);

      input.addEventListener("input", handleInput);
      addBtn.addEventListener("click", handleAddTask);

      addBtn.disabled = input.value.trim() === "";
    }
  }

  function handleInput() {
    const input = document.getElementById("taskInput");
    const addBtn = document.getElementById("addTaskBtn");
    if (input && addBtn) {
      addBtn.disabled = this.value.trim() === "";
    }
  }

  function initModalEvents() {
    const modal = document.getElementById("deleteTaskModal");
    const cancelBtn = document.getElementById("cancelDelete");
    const deleteBtn = document.getElementById("confirmDelete");

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
    if (e.target === document.getElementById("deleteTaskModal")) {
      closeModal();
    }
  }

  function handleEscapeKey(e) {
    const modal = document.getElementById("deleteTaskModal");
    if (e.key === "Escape" && modal && modal.classList.contains("show")) {
      closeModal();
    }
  }

  function openModal(taskId, taskTitle) {
    taskToDelete = taskId;
    const modal = document.getElementById("deleteTaskModal");
    const taskTitleElement = modal.querySelector(".modal-task-title");
    if (taskTitleElement) taskTitleElement.textContent = `"${taskTitle}"`;
    modal.classList.add("show");
  }

  function closeModal() {
    const modal = document.getElementById("deleteTaskModal");
    modal.classList.remove("show");
    taskToDelete = null;
  }

  function confirmDelete() {
    if (taskToDelete) {
      // Delete from array
      tasks = tasks.filter((t) => t.id != taskToDelete);

      // Delete from localStorage
      TaskStore.deleteTask(taskToDelete);

      const taskItem = document.querySelector(
        `.task-item[data-id="${taskToDelete}"]`,
      );
      if (taskItem) {
        taskItem.remove();
      }

      updateStats();
      filterTasks();
      closeModal();
    }
  }

  function attachEvents() {
    document.removeEventListener("click", handleDocumentClick);
    document.removeEventListener("change", handleDocumentChange);
    document.removeEventListener("keydown", handleDocumentKeyDown);

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("change", handleDocumentChange);
    document.addEventListener("keydown", handleDocumentKeyDown);
  }

  /**
   * Listen for filter change events dispatched by app.js
   */
  function attachFilterChangeListener() {
    // Listen for custom filterChange events on filter selects
    const filterSelectIds = [
      "taskStatusSelect",
      "categoryFilterSelect",
      "priorityFilterSelect",
    ];

    filterSelectIds.forEach((id) => {
      const select = document.getElementById(id);
      if (select) {
        select.removeEventListener("filterChange", handleFilterChange);
        select.addEventListener("filterChange", handleFilterChange);
      }
    });
  }

  /**
   * Handle filter change events
   */
  function handleFilterChange(e) {
    console.log("Filter changed:", e.detail);
    filterTasks();
  }

  function handleDocumentClick(e) {
    // Edit buttons
    if (e.target.closest(".edit-btn")) {
      e.preventDefault();
      e.stopPropagation();
      const taskItem = e.target.closest(".task-item");
      if (taskItem && !taskItem.classList.contains("editing")) {
        handleEditClick(e);
      }
      return;
    }

    // Delete buttons
    if (e.target.closest(".delete-btn")) {
      e.preventDefault();
      e.stopPropagation();
      handleDelete(e);
      return;
    }

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
      const value = option.dataset.value;
      const text = option.textContent;
      const triggerSpan = select.querySelector(".select-trigger span");

      if (triggerSpan) {
        triggerSpan.textContent = text;
      }

      select.dataset.value = value;
      select.classList.remove("open");

      // Only filter if this is a filter select, not an add-task select
      if (select.classList.contains("filter-custom-select")) {
        filterTasks();
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

    // Handle edit mode cancel on outside click
    const editingItem = document.querySelector(".task-item.editing");
    if (editingItem && !editingItem.contains(e.target)) {
      cancelEdit(editingItem);
    }
  }

  function handleDocumentChange(e) {
    // Checkboxes
    if (e.target.classList.contains("task-checkbox")) {
      handleCheckboxChange(e);
    }
  }

  function handleDocumentKeyDown(e) {
    // Enter key in edit mode
    if (e.key === "Enter") {
      const editingItem = document.querySelector(".task-item.editing");
      if (editingItem) {
        const saveBtn = editingItem.querySelector(".edit-save-btn");
        if (saveBtn && e.target.closest(".edit-title")) {
          e.preventDefault();
          saveBtn.click();
        }
      }
    }

    // Escape key in edit mode
    if (e.key === "Escape") {
      const editingItem = document.querySelector(".task-item.editing");
      if (editingItem) {
        e.preventDefault();
        cancelEdit(editingItem);
      }
    }
  }

  // YENİ: Filter selectlarına özel event listener
  function initFilterSelects() {
    const filterSelects = [
      { id: "taskStatusSelect", defaultValue: "all" },
      { id: "categoryFilterSelect", defaultValue: "all" },
      { id: "priorityFilterSelect", defaultValue: "all" },
    ];

    filterSelects.forEach(({ id, defaultValue }) => {
      const select = document.getElementById(id);
      if (select) {
        // Set initial dataset.value
        select.dataset.value = defaultValue;
      }
    });
  }

  function handleCheckboxChange(e) {
    const checkbox = e.target;
    const taskItem = checkbox.closest(".task-item");
    const taskId = taskItem.dataset.id;
    const task = tasks.find((t) => t.id == taskId);

    if (task) {
      task.completed = checkbox.checked;

      if (checkbox.checked) {
        taskItem.classList.add("completed");
        taskItem.dataset.completed = "true";
      } else {
        taskItem.classList.remove("completed");
        taskItem.dataset.completed = "false";
      }

      // Save to localStorage
      TaskStore.updateTask(task.id, { completed: task.completed });

      updateStats();
      // Filter'ları tekrar uygula (checkbox değişince)
      filterTasks();
    }
  }

  function handleEditClick(e) {
    const taskItem = e.target.closest(".task-item");
    if (!taskItem) return;

    if (taskItem.classList.contains("editing")) return;

    const taskId = taskItem.dataset.id;
    const task = tasks.find((t) => t.id == taskId);

    if (task) {
      enterEditMode(taskItem, task);
    }
  }

  function enterEditMode(taskItem, task) {
    exitAllEditModes();

    taskItem.classList.add("editing");

    const taskRow = taskItem.querySelector(".task-row");
    const originalHTML = taskRow.outerHTML;
    taskItem.dataset.originalHTML = originalHTML;

    const categoryOptions = [
      { value: "Personal", label: "Personal" },
      { value: "Work", label: "Work" },
      { value: "Shopping", label: "Shopping" },
      { value: "Other", label: "Other" },
    ];

    const priorityOptions = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "hard", label: "Hard" },
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

    const editHTML = `
      <div class="task-edit-form">
        <div class="edit-field">
          <label>Task Title</label>
          <input type="text" class="edit-title" value="${task.title.replace(/"/g, "&quot;")}" placeholder="Task title">
        </div>
        
        <div class="edit-row">
          <div class="edit-field">
            <label>Category</label>
            <div class="custom-select edit-category-select" data-selected="${task.category}">
              <div class="select-trigger"><span>${task.category}</span></div>
              <div class="select-options">
                ${categoryOptionsHtml}
              </div>
            </div>
          </div>
          
          <div class="edit-field">
            <label>Priority</label>
            <div class="custom-select edit-priority-select" data-selected="${task.priority}">
              <div class="select-trigger"><span>${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span></div>
              <div class="select-options">
                ${priorityOptionsHtml}
              </div>
            </div>
          </div>
        </div>
        
        <div class="edit-field due-date-field">
          <label>Due Date</label>
          <input type="text" class="edit-date" value="${task.dueDate}" placeholder="Select date">
        </div>
        
        <div class="edit-actions">
          <button class="edit-save-btn"><i class="fa-solid fa-check"></i> Save</button>
          <button class="edit-cancel-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>
        </div>
      </div>
    `;

    taskItem.innerHTML = editHTML;

    const editDateInput = taskItem.querySelector(".edit-date");
    if (editDateInput) {
      if (editDatePickers.length > 0) {
        editDatePickers.forEach((picker) => {
          if (picker && typeof picker.destroy === "function") {
            try {
              picker.destroy();
            } catch (e) {
              console.log("Picker destroy error:", e);
            }
          }
        });
        editDatePickers = [];
      }

      try {
        const editPicker = initEditDatePicker(editDateInput, task.dueDate);
        if (editPicker) {
          editDatePickers.push(editPicker);
        }
      } catch (e) {
        console.log("Edit picker creation error:", e);
      }
    }

    const saveBtn = taskItem.querySelector(".edit-save-btn");
    const cancelBtn = taskItem.querySelector(".edit-cancel-btn");

    if (saveBtn) {
      saveBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        saveEdit(taskItem, task);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        cancelEdit(taskItem);
      });
    }

    const titleInput = taskItem.querySelector(".edit-title");
    if (titleInput) {
      titleInput.focus();
    }
  }

  function saveEdit(taskItem, task) {
    const newTitle = taskItem.querySelector(".edit-title").value.trim();
    if (!newTitle) {
      alert("Task title cannot be empty");
      return;
    }

    const categorySelect = taskItem.querySelector(".edit-category-select");
    const prioritySelect = taskItem.querySelector(".edit-priority-select");

    const newCategory = categorySelect
      ? categorySelect.dataset.value || task.category
      : task.category;
    const newPriority = prioritySelect
      ? prioritySelect.dataset.value || task.priority
      : task.priority;
    const newDate = taskItem.querySelector(".edit-date").value;

    task.title = newTitle;
    task.category = newCategory;
    task.priority = newPriority;
    task.dueDate = newDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(newDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      task.displayDate = "Today";
    } else if (diffDays === 1) {
      task.displayDate = "Tomorrow";
    } else if (diffDays === -1) {
      task.displayDate = "Yesterday";
    } else if (diffDays < -1) {
      task.displayDate = `${Math.abs(diffDays)} days ago`;
    } else if (diffDays > 1) {
      task.displayDate = `in ${diffDays} days`;
    } else {
      task.displayDate = newDate.split("-").reverse().join("/");
    }

    // Save to localStorage
    TaskStore.updateTask(task.id, task);

    exitEditMode(taskItem, task);

    filterTasks();
  }

  function cancelEdit(taskItem) {
    if (taskItem.dataset.originalHTML) {
      taskItem.innerHTML = taskItem.dataset.originalHTML;
    }

    taskItem.classList.remove("editing");

    if (editDatePickers.length > 0) {
      editDatePickers.forEach((picker) => {
        if (picker && typeof picker.destroy === "function") {
          try {
            picker.destroy();
          } catch (e) {
            console.log("Picker destroy error:", e);
          }
        }
      });
      editDatePickers = [];
    }

    filterTasks();
  }

  function exitEditMode(taskItem, task) {
    const checked = task.completed ? "checked" : "";
    const completedClass = task.completed ? "completed" : "";

    const categoryClass = task.category.toLowerCase() + "-category";

    const viewHTML = `
      <div class="task-row">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" id="task-${task.id}" ${checked}>
          <label for="task-${task.id}" class="task-checkbox-label"></label>
          <h3 class="task-title">${task.title}</h3>
        </div>

        <div class="task-meta">
          <span class="task-category ${categoryClass}" data-category="${task.category}">${task.category}</span>
          <span class="task-priority priority-${task.priority}">
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          <span class="task-date">
            <i class="fa-regular fa-calendar"></i>
            ${task.displayDate}
          </span>
        </div>

        <div class="task-actions">
          <button class="icon-btn edit-btn"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn delete-btn"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;

    taskItem.innerHTML = viewHTML;
    taskItem.classList.remove("editing");
    taskItem.dataset.completed = task.completed;

    if (task.completed) {
      taskItem.classList.add("completed");
    }

    if (editDatePickers.length > 0) {
      editDatePickers.forEach((picker) => {
        if (picker && typeof picker.destroy === "function") {
          try {
            picker.destroy();
          } catch (e) {
            console.log("Picker destroy error:", e);
          }
        }
      });
      editDatePickers = [];
    }

    updateStats();
  }

  function exitAllEditModes() {
    const editingItems = document.querySelectorAll(".task-item.editing");
    editingItems.forEach((item) => {
      if (item.dataset.originalHTML) {
        item.innerHTML = item.dataset.originalHTML;
        item.classList.remove("editing");
      }
    });

    if (editDatePickers.length > 0) {
      editDatePickers.forEach((picker) => {
        if (picker && typeof picker.destroy === "function") {
          try {
            picker.destroy();
          } catch (e) {
            console.log("Picker destroy error:", e);
          }
        }
      });
      editDatePickers = [];
    }
  }

  function handleDelete(e) {
    const taskItem = e.target.closest(".task-item");
    if (taskItem) {
      const taskId = taskItem.dataset.id;
      const task = tasks.find((t) => t.id == taskId);
      if (task) {
        openModal(taskId, task.title);
      }
    }
  }

  function handleAddTask() {
    const input = document.getElementById("taskInput");
    const title = input.value.trim();

    if (!title) {
      alert("Please enter a task title");
      return;
    }

    // Get selected category and priority from custom selects
    const categorySelect = document.getElementById("categorySelect");
    const prioritySelect = document.getElementById("prioritySelect");

    const selectedCategory = categorySelect?.dataset.value || "personal";
    const selectedPriority = prioritySelect?.dataset.value || "medium";

    // Capitalize category for display (personal → Personal)
    const categoryDisplay =
      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

    const dateInput = document.getElementById("taskDate");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const selectedDate =
      dateInput && dateInput.value ? dateInput.value : todayStr;

    const newTask = {
      id: Date.now(),
      title: title,
      category: categoryDisplay,
      priority: selectedPriority,
      dueDate: selectedDate,
      displayDate: formatDisplayDate(selectedDate),
      completed: false,
    };

    // Add to tasks array and localStorage
    tasks.push(newTask);
    TaskStore.addTask(newTask);

    addTaskToDOM(newTask);

    input.value = "";
    document.getElementById("addTaskBtn").disabled = true;

    if (dateInput && datePicker) {
      dateInput.value = todayStr;
      datePicker.setDate(todayStr);
    }

    updateStats();
    filterTasks();
  }

  function formatDisplayDate(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays === -1) {
      return "Yesterday";
    } else if (diffDays < -1) {
      return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays > 1) {
      return `in ${diffDays} days`;
    } else {
      return dateStr.split("-").reverse().join("/");
    }
  }

  function addTaskToDOM(task) {
    const container = document.querySelector(".tasks-container");
    if (!container) return;

    const checked = task.completed ? "checked" : "";
    const completedClass = task.completed ? "completed" : "";
    const categoryClass = task.category.toLowerCase() + "-category";

    const taskHtml = `
      <div class="task-item ${completedClass}" data-id="${task.id}" data-completed="${task.completed}">
        <div class="task-row">
          <div class="task-left">
            <input type="checkbox" class="task-checkbox" id="task-${task.id}" ${checked}>
            <label for="task-${task.id}" class="task-checkbox-label"></label>
            <h3 class="task-title">${task.title}</h3>
          </div>

          <div class="task-meta">
            <span class="task-category ${categoryClass}" data-category="${task.category}">${task.category}</span>
            <span class="task-priority priority-${task.priority}">
              ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            <span class="task-date">
              <i class="fa-regular fa-calendar"></i>
              ${task.displayDate}
            </span>
          </div>

          <div class="task-actions">
            <button class="icon-btn edit-btn"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn delete-btn"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", taskHtml);
  }

  function filterTasks() {
    const statusSelect = document.getElementById("taskStatusSelect");
    const categorySelect = document.getElementById("categoryFilterSelect");
    const prioritySelect = document.getElementById("priorityFilterSelect");

    // Get filter values from dataset.value
    const statusFilter = statusSelect?.dataset.value || "all";
    const categoryFilter = categorySelect?.dataset.value || "all";
    const priorityFilter = prioritySelect?.dataset.value || "all";

    console.log("Filtering with:", {
      statusFilter,
      categoryFilter,
      priorityFilter,
      totalTasks: tasks.length,
    });

    const taskItems = document.querySelectorAll(".task-item");

    taskItems.forEach((item) => {
      const taskId = item.dataset.id;
      const task = tasks.find((t) => t.id == taskId);
      if (!task) {
        item.style.display = "none";
        return;
      }

      let show = true;

      // Status filter - compare lowercase for consistency
      if (statusFilter !== "all") {
        const taskStatus = task.completed ? "completed" : "active";
        if (statusFilter !== taskStatus) {
          show = false;
        }
      }

      // Category filter - case-insensitive comparison
      if (show && categoryFilter !== "all") {
        if (task.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          show = false;
        }
      }

      // Priority filter - exact match
      if (show && priorityFilter !== "all") {
        if (task.priority !== priorityFilter) {
          show = false;
        }
      }

      item.style.display = show ? "block" : "none";
    });

    updateVisibleStats();
  }

  /**
   * Update stats based on visible items
   */
  function updateVisibleStats() {
    const taskItems = document.querySelectorAll(".task-item");
    let totalVisible = 0;
    let completedVisible = 0;
    let activeVisible = 0;

    taskItems.forEach((item) => {
      if (item.style.display !== "none") {
        totalVisible++;
        const taskId = item.dataset.id;
        const task = tasks.find((t) => t.id == taskId);
        if (task && task.completed) {
          completedVisible++;
        } else {
          activeVisible++;
        }
      }
    });

    // Update displayed stats
    const statBadges = document.querySelectorAll(".stat-badge");
    if (statBadges.length >= 3) {
      const totalSpan = statBadges[0].querySelector("span:nth-child(2)");
      const completedSpan = statBadges[1].querySelector("span:nth-child(2)");
      const activeSpan = statBadges[2].querySelector("span:nth-child(2)");

      if (totalSpan) totalSpan.textContent = totalVisible;
      if (completedSpan) completedSpan.textContent = completedVisible;
      if (activeSpan) activeSpan.textContent = activeVisible;
    }
  }

  /**
   * Update all stats (total, completed, active) based on all tasks
   */
  function updateStats() {
    const totalTasks = tasks.length;
    let completedTasks = 0;

    tasks.forEach((task) => {
      if (task.completed) completedTasks++;
    });

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
})();
