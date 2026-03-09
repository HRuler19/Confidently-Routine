(function () {
  "use strict";

  // State
  let tasks = [
    {
      id: 1,
      title: "Learn React Advanced Patterns",
      category: "Personal",
      priority: "medium",
      dueDate: "2026-03-03",
      displayDate: "03/03/2026",
      completed: false,
    },
    {
      id: 2,
      title: "Build todo app with advanced features",
      category: "Work",
      priority: "medium",
      dueDate: "2026-03-01",
      displayDate: "7 days ago",
      completed: false,
    },
    {
      id: 3,
      title: "Buy groceries for the week",
      category: "Shopping",
      priority: "low",
      dueDate: "2026-02-24",
      displayDate: "12 days ago",
      completed: false,
    },
    {
      id: 4,
      title: "English learning",
      category: "Other",
      priority: "hard",
      dueDate: "2026-02-18",
      displayDate: "18 days ago",
      completed: true,
    },
  ];

  // Initialize
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

    console.log("Routines initialized");

    attachEvents();
    updateStats();
  }

  function attachEvents() {
    // Edit buttons
    const editButtons = document.querySelectorAll(".edit-btn");
    editButtons.forEach((btn) => {
      btn.removeEventListener("click", handleEditClick);
      btn.addEventListener("click", handleEditClick);
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach((btn) => {
      btn.removeEventListener("click", handleDelete);
      btn.addEventListener("click", handleDelete);
    });

    // Checkboxes
    const checkboxes = document.querySelectorAll(".task-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.removeEventListener("change", handleCheckboxChange);
      checkbox.addEventListener("change", handleCheckboxChange);
    });

    // Add task button
    const addTaskBtn = document.querySelector(".routines button");
    if (addTaskBtn) {
      addTaskBtn.removeEventListener("click", handleAddTask);
      addTaskBtn.addEventListener("click", handleAddTask);
    }

    // Save with enter
    document.addEventListener("keydown", handleEnterKey);

    // Click outside cancel
    document.addEventListener("click", handleOutsideClick);

    // Filter selects
    const filterSelects = [
      "taskStatusSelect",
      "categoryFilterSelect",
      "priorityFilterSelect",
    ];

    filterSelects.forEach((id) => {
      const select = document.getElementById(id);
      if (select) {
        select.removeEventListener("filterChange", filterTasks);
        select.addEventListener("filterChange", filterTasks);
      }
    });
  }

  // CHECKBOX CHANGE HANDLER
  function handleCheckboxChange(e) {
    const checkbox = e.currentTarget;
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

      updateStats();
    }
  }

  function handleEditClick(e) {
    e.stopPropagation();
    e.preventDefault();

    const taskItem = e.currentTarget.closest(".task-item");
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

    // Category options
    const categoryOptions = [
      { value: "Personal", label: "Personal" },
      { value: "Work", label: "Work" },
      { value: "Shopping", label: "Shopping" },
      { value: "Other", label: "Other" },
    ];

    // Priority options
    const priorityOptions = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "hard", label: "Hard" },
    ];

    // Category options HTML
    let categoryOptionsHtml = "";
    categoryOptions.forEach((opt) => {
      const selected = opt.value === task.category ? "selected" : "";
      categoryOptionsHtml += `<div class="option" data-value="${opt.value}" ${selected ? 'data-selected="true"' : ""}>${opt.label}</div>`;
    });

    // Priority options HTML
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
          <input type="date" class="edit-date" value="${task.dueDate}">
        </div>
        
        <div class="edit-actions">
          <button class="edit-save-btn"><i class="fa-solid fa-check"></i> Save</button>
          <button class="edit-cancel-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>
        </div>
      </div>
    `;

    taskItem.innerHTML = editHTML;

    initEditModeSelectors(taskItem);

    const saveBtn = taskItem.querySelector(".edit-save-btn");
    const cancelBtn = taskItem.querySelector(".edit-cancel-btn");

    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      saveEdit(taskItem, task);
    });

    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      cancelEdit(taskItem);
    });

    const titleInput = taskItem.querySelector(".edit-title");
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit(taskItem, task);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit(taskItem);
      }
    });

    titleInput.focus();
  }

  function initEditModeSelectors(taskItem) {
    const selects = taskItem.querySelectorAll(".custom-select");

    selects.forEach((select) => {
      if (select.dataset.initialized) return;

      const trigger = select.querySelector(".select-trigger");
      const options = select.querySelectorAll(".option");

      if (trigger) {
        const newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);

        newTrigger.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          taskItem.querySelectorAll(".custom-select").forEach((s) => {
            if (s !== select) s.classList.remove("open");
          });

          select.classList.toggle("open");
        });
      }

      options.forEach((option) => {
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);

        newOption.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          const triggerSpan = select.querySelector(".select-trigger span");
          if (triggerSpan) {
            triggerSpan.innerText = newOption.innerText;
          }

          select.classList.remove("open");
          select.dataset.value = newOption.dataset.value;
        });
      });

      select.dataset.initialized = "true";
    });

    setTimeout(() => {
      const handleClickOutside = (e) => {
        if (!taskItem.contains(e.target)) {
          taskItem
            .querySelectorAll(".custom-select")
            .forEach((s) => s.classList.remove("open"));
        }
      };
      document.addEventListener("click", handleClickOutside);

      setTimeout(() => {
        document.removeEventListener("click", handleClickOutside);
      }, 100);
    }, 0);
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

    exitEditMode(taskItem, task);
  }

  function cancelEdit(taskItem) {
    if (taskItem.dataset.originalHTML) {
      taskItem.innerHTML = taskItem.dataset.originalHTML;
    }

    taskItem.classList.remove("editing");

    attachEvents();
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

    attachEvents();
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

    attachEvents();
  }

  function handleDelete(e) {
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this task?")) {
      const taskItem = e.currentTarget.closest(".task-item");
      if (taskItem) {
        const taskId = taskItem.dataset.id;
        tasks = tasks.filter((t) => t.id != taskId);
        taskItem.remove();
        updateStats();
      }
    }
  }

  function handleAddTask() {
    const input = document.querySelector('.routines input[type="text"]');
    const title = input.value.trim();

    if (!title) {
      alert("Please enter a task title");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const newTask = {
      id: Date.now(),
      title: title,
      category: "Personal",
      priority: "medium",
      dueDate: todayStr,
      displayDate: "Today",
      completed: false,
    };

    tasks.push(newTask);
    addTaskToDOM(newTask);

    input.value = "";
    updateStats();
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
    attachEvents();
  }

  function filterTasks(e) {
    const statusSelect = document.getElementById("taskStatusSelect");
    const categorySelect = document.getElementById("categoryFilterSelect");
    const prioritySelect = document.getElementById("priorityFilterSelect");

    const statusFilter = statusSelect
      ? statusSelect.dataset.value || "all"
      : "all";
    const categoryFilter = categorySelect
      ? categorySelect.dataset.value || "all"
      : "all";
    const priorityFilter = prioritySelect
      ? prioritySelect.dataset.value || "all"
      : "all";

    const taskItems = document.querySelectorAll(".task-item");

    taskItems.forEach((item) => {
      const taskId = item.dataset.id;
      const task = tasks.find((t) => t.id == taskId);
      if (!task) return;

      let show = true;

      if (statusFilter !== "all") {
        if (statusFilter === "completed" && !task.completed) show = false;
        if (statusFilter === "active" && task.completed) show = false;
      }

      if (show && categoryFilter !== "all") {
        if (task.category.toLowerCase() !== categoryFilter) show = false;
      }

      if (show && priorityFilter !== "all") {
        if (task.priority !== priorityFilter) show = false;
      }

      item.style.display = show ? "block" : "none";
    });
  }

  function updateStats() {
    const taskItems = document.querySelectorAll(".task-item");
    const totalTasks = taskItems.length;

    let completedTasks = 0;
    taskItems.forEach((item) => {
      const taskId = item.dataset.id;
      const task = tasks.find((t) => t.id == taskId);
      if (task && task.completed) completedTasks++;
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

  function handleEnterKey(e) {
    if (e.key === "Enter") {
      const editingItem = document.querySelector(".task-item.editing");
      if (editingItem) {
        const saveBtn = editingItem.querySelector(".edit-save-btn");
        if (saveBtn) {
          e.preventDefault();
          saveBtn.click();
        }
      }
    }
  }

  function handleOutsideClick(e) {
    const editingItem = document.querySelector(".task-item.editing");
    if (editingItem && !editingItem.contains(e.target)) {
      cancelEdit(editingItem);
    }
  }
})();
