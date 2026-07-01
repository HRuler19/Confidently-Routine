(function () {
  "use strict";

  let habits = [];
  let selectedYear = new Date().getFullYear();
  let selectedMonth = new Date().getMonth() + 1;
  let activeEntryContext = null;
  let habitToDelete = null;

  window.addEventListener("pageLoaded", function (e) {
    if (e.detail.page === "my-routine") {
      initMyRoutine();
    }
  });

  function initMyRoutine() {
    if (!document.querySelector(".my-routine-page")) return;

    habits = HabitStore.getHabits();

    initYearMonthSelects();
    initAddHabitButton();
    attachHabitTableEvents();
    attachSleepTableEvents();
    initModals();

    renderAll();
  }

  function renderAll() {
    renderHabitTable();
    renderSleepSection();
  }

  // ---------- Year / month controls ----------

  function initYearMonthSelects() {
    const today = new Date();
    selectedYear = today.getFullYear();
    selectedMonth = today.getMonth() + 1;

    const yearSelect = document.getElementById("routineYearSelect");
    const monthSelect = document.getElementById("routineMonthSelect");

    setSelectDisplay(yearSelect, String(selectedYear));
    setSelectDisplay(monthSelect, String(selectedMonth));

    yearSelect?.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => {
        selectedYear = Number(yearSelect.dataset.value);
        renderAll();
      });
    });

    monthSelect?.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => {
        selectedMonth = Number(monthSelect.dataset.value);
        renderAll();
      });
    });
  }

  function setSelectDisplay(select, value) {
    if (!select) return;
    const option = select.querySelector(`.option[data-value="${value}"]`);
    if (!option) return;
    const triggerSpan = select.querySelector(".select-trigger span");
    if (triggerSpan) triggerSpan.textContent = option.textContent;
    select.dataset.value = value;
  }

  // ---------- Date helpers ----------

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function formatDateKey(year, month, day) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  // ---------- Add habit ----------

  function initAddHabitButton() {
    const input = document.getElementById("habitInput");
    const addBtn = document.getElementById("addHabitBtn");
    if (!input || !addBtn) return;

    input.removeEventListener("input", handleHabitInput);
    input.addEventListener("input", handleHabitInput);

    addBtn.removeEventListener("click", handleAddHabitClick);
    addBtn.addEventListener("click", handleAddHabitClick);

    addBtn.disabled = input.value.trim() === "";
  }

  function handleHabitInput() {
    const input = document.getElementById("habitInput");
    const addBtn = document.getElementById("addHabitBtn");
    if (input && addBtn) addBtn.disabled = input.value.trim() === "";
  }

  function handleAddHabitClick() {
    const input = document.getElementById("habitInput");
    const addBtn = document.getElementById("addHabitBtn");
    const name = input.value.trim();
    if (!name) return;

    HabitStore.addHabit(name);
    habits = HabitStore.getHabits();

    input.value = "";
    addBtn.disabled = true;

    renderHabitTable();
  }

  // ---------- Habit table ----------

  function attachHabitTableEvents() {
    const table = document.getElementById("habitTable");
    if (!table) return;
    table.removeEventListener("click", handleHabitTableClick);
    table.addEventListener("click", handleHabitTableClick);
  }

  function handleHabitTableClick(e) {
    const editBtn = e.target.closest(".habit-col-edit");
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      startEditHabitName(editBtn.dataset.habitId);
      return;
    }

    const deleteBtn = e.target.closest(".habit-col-delete");
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      showDeleteHabitModal(deleteBtn.dataset.habitId, deleteBtn.dataset.habitName);
      return;
    }

    const cell = e.target.closest(".habit-cell");
    if (cell) {
      const habit = habits.find((h) => h.id == cell.dataset.habitId);
      if (habit) {
        openHabitEntryModal(habit.id, habit.name, Number(cell.dataset.day));
      }
    }
  }

  function renderHabitTable() {
    const headRow = document.getElementById("habitTableHeadRow");
    const body = document.getElementById("habitTableBody");
    const hint = document.getElementById("habitTableHint");
    if (!headRow || !body) return;

    if (hint) hint.classList.toggle("is-hidden", habits.length > 0);

    let headHtml = `<th class="habit-day-col">Day</th>`;
    habits.forEach((habit) => {
      const safeName = DomHelpers.escapeHtml(habit.name);
      headHtml += `
        <th data-habit-id="${habit.id}">
          <div class="habit-col-header">
            <span>${safeName}</span>
            <button type="button" class="habit-col-edit" data-habit-id="${habit.id}" title="Rename habit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="habit-col-delete" data-habit-id="${habit.id}" data-habit-name="${safeName}" title="Delete habit">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </th>
      `;
    });
    headRow.innerHTML = headHtml;

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    let bodyHtml = "";
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateKey(selectedYear, selectedMonth, day);
      bodyHtml += `<tr><td class="habit-day-cell">${day}</td>`;
      habits.forEach((habit) => {
        const entry = HabitEntryStore.getEntry(habit.id, dateStr);
        bodyHtml += renderHabitCell(habit.id, day, entry);
      });
      bodyHtml += `</tr>`;
    }
    body.innerHTML = bodyHtml;
  }

  function renderHabitCell(habitId, day, entry) {
    let content = "";
    let cellClass = "habit-cell";

    if (entry) {
      if (entry.type === "plus") {
        content = '<i class="fa-solid fa-plus"></i>';
        cellClass += " habit-cell-plus";
      } else if (entry.type === "x") {
        content = '<i class="fa-solid fa-xmark"></i>';
        cellClass += " habit-cell-x";
      } else if (entry.type === "count") {
        content = entry.value;
        cellClass += " habit-cell-count";
      }
    }

    return `<td class="${cellClass}" data-habit-id="${habitId}" data-day="${day}">${content}</td>`;
  }

  // ---------- Rename habit (inline) ----------

  function startEditHabitName(habitId) {
    const habit = habits.find((h) => h.id == habitId);
    if (!habit) return;

    const th = document.querySelector(`.habit-table th[data-habit-id="${habitId}"]`);
    const header = th?.querySelector(".habit-col-header");
    if (!header) return;

    header.innerHTML = `<input type="text" class="habit-col-rename-input" value="${DomHelpers.escapeHtml(habit.name)}" maxlength="40" />`;

    const input = header.querySelector(".habit-col-rename-input");
    input.focus();
    input.select();

    let cancelled = false;

    input.addEventListener("blur", () => {
      if (cancelled) return;
      commitEditHabitName(habitId, input.value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelled = true;
        renderHabitTable();
      }
    });
  }

  function commitEditHabitName(habitId, rawName) {
    const name = rawName.trim();
    if (name) {
      HabitStore.updateHabit(habitId, name);
      habits = HabitStore.getHabits();
    }
    renderHabitTable();
  }

  // ---------- Delete habit modal ----------

  function showDeleteHabitModal(habitId, habitName) {
    habitToDelete = habitId;
    const nameEl = document.getElementById("deleteHabitName");
    if (nameEl) nameEl.textContent = `"${habitName}"`;
    document.getElementById("deleteHabitModal").classList.add("show");
  }

  function closeDeleteHabitModal() {
    document.getElementById("deleteHabitModal").classList.remove("show");
    habitToDelete = null;
  }

  function confirmDeleteHabitAction() {
    if (habitToDelete == null) return;

    HabitStore.deleteHabit(habitToDelete);
    HabitEntryStore.deleteHabitEntries(habitToDelete);
    habits = HabitStore.getHabits();

    closeDeleteHabitModal();
    renderHabitTable();
  }

  // ---------- Habit entry modal ----------

  function openHabitEntryModal(habitId, habitName, day) {
    const dateStr = formatDateKey(selectedYear, selectedMonth, day);
    activeEntryContext = { habitId, dateStr };

    const dateLabel = new Date(selectedYear, selectedMonth - 1, day).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    );
    const titleEl = document.getElementById("habitEntryModalTitle");
    if (titleEl) titleEl.textContent = `${habitName} — ${dateLabel}`;

    const plusBtn = document.getElementById("habitTogglePlus");
    const xBtn = document.getElementById("habitToggleX");
    const countInput = document.getElementById("habitEntryCountInput");

    plusBtn.classList.remove("active");
    xBtn.classList.remove("active");
    countInput.disabled = false;
    countInput.value = "";

    const existing = HabitEntryStore.getEntry(habitId, dateStr);
    if (existing) {
      if (existing.type === "plus") {
        plusBtn.classList.add("active");
        countInput.disabled = true;
      } else if (existing.type === "x") {
        xBtn.classList.add("active");
        countInput.disabled = true;
      } else if (existing.type === "count") {
        countInput.value = existing.value;
      }
    }

    document.getElementById("habitEntryModal").classList.add("show");
  }

  function closeHabitEntryModal() {
    document.getElementById("habitEntryModal").classList.remove("show");
    activeEntryContext = null;
  }

  function handleToggleClick(type) {
    const plusBtn = document.getElementById("habitTogglePlus");
    const xBtn = document.getElementById("habitToggleX");
    const countInput = document.getElementById("habitEntryCountInput");

    const wasActive =
      (type === "plus" && plusBtn.classList.contains("active")) ||
      (type === "x" && xBtn.classList.contains("active"));

    plusBtn.classList.remove("active");
    xBtn.classList.remove("active");

    if (wasActive) {
      countInput.disabled = false;
      return;
    }

    if (type === "plus") plusBtn.classList.add("active");
    if (type === "x") xBtn.classList.add("active");

    countInput.value = "";
    countInput.disabled = true;
  }

  function handleCountInputChange() {
    const countInput = document.getElementById("habitEntryCountInput");
    if (countInput.value.trim() !== "") {
      document.getElementById("habitTogglePlus").classList.remove("active");
      document.getElementById("habitToggleX").classList.remove("active");
    }
  }

  function saveHabitEntry() {
    if (!activeEntryContext) return;
    const { habitId, dateStr } = activeEntryContext;

    const plusBtn = document.getElementById("habitTogglePlus");
    const xBtn = document.getElementById("habitToggleX");
    const countInput = document.getElementById("habitEntryCountInput");

    let entry = null;
    if (plusBtn.classList.contains("active")) {
      entry = { type: "plus" };
    } else if (xBtn.classList.contains("active")) {
      entry = { type: "x" };
    } else if (countInput.value.trim() !== "") {
      entry = { type: "count", value: Number(countInput.value) };
    }

    if (entry) {
      HabitEntryStore.setEntry(habitId, dateStr, entry);
    } else {
      HabitEntryStore.clearEntry(habitId, dateStr);
    }

    closeHabitEntryModal();
    renderHabitTable();
  }

  function clearHabitEntryAction() {
    if (!activeEntryContext) return;
    HabitEntryStore.clearEntry(activeEntryContext.habitId, activeEntryContext.dateStr);
    closeHabitEntryModal();
    renderHabitTable();
  }

  function initModals() {
    DomHelpers.setupConfirmModal({
      modalId: "habitEntryModal",
      cancelId: "habitEntryCancelBtn",
      confirmId: "habitEntrySaveBtn",
      onConfirm: saveHabitEntry,
      onClose: closeHabitEntryModal,
    });

    DomHelpers.setupConfirmModal({
      modalId: "deleteHabitModal",
      cancelId: "cancelDeleteHabit",
      confirmId: "confirmDeleteHabit",
      onConfirm: confirmDeleteHabitAction,
      onClose: closeDeleteHabitModal,
    });

    const plusBtn = document.getElementById("habitTogglePlus");
    const xBtn = document.getElementById("habitToggleX");
    const countInput = document.getElementById("habitEntryCountInput");
    const clearBtn = document.getElementById("habitEntryClearBtn");

    if (plusBtn) {
      plusBtn.removeEventListener("click", handlePlusToggle);
      plusBtn.addEventListener("click", handlePlusToggle);
    }
    if (xBtn) {
      xBtn.removeEventListener("click", handleXToggle);
      xBtn.addEventListener("click", handleXToggle);
    }
    if (countInput) {
      countInput.removeEventListener("input", handleCountInputChange);
      countInput.addEventListener("input", handleCountInputChange);
    }
    if (clearBtn) {
      clearBtn.removeEventListener("click", clearHabitEntryAction);
      clearBtn.addEventListener("click", clearHabitEntryAction);
    }
  }

  function handlePlusToggle() {
    handleToggleClick("plus");
  }

  function handleXToggle() {
    handleToggleClick("x");
  }

  // ---------- Sleep tracker ----------

  function attachSleepTableEvents() {
    const body = document.getElementById("sleepTableBody");
    if (!body) return;
    body.removeEventListener("change", handleSleepTimeChange);
    body.addEventListener("change", handleSleepTimeChange);
  }

  function handleSleepTimeChange(e) {
    if (e.target.type !== "number") return;
    const day = Number(e.target.dataset.day);
    const dateStr = formatDateKey(selectedYear, selectedMonth, day);

    const value = e.target.value.trim();
    if (value !== "") {
      SleepStore.setEntry(dateStr, Number(value));
    } else {
      SleepStore.clearEntry(dateStr);
    }

    renderSleepChart();
  }

  function renderSleepSection() {
    renderSleepTable();
    renderSleepChart();
  }

  function renderSleepTable() {
    const body = document.getElementById("sleepTableBody");
    if (!body) return;

    const sleepEntries = SleepStore.getEntries();
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

    let html = "";
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateKey(selectedYear, selectedMonth, day);
      const value = sleepEntries[dateStr];
      const displayValue = value === undefined || value === null ? "" : value;
      html += `
        <tr>
          <td class="habit-day-cell">${day}</td>
          <td>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              inputmode="decimal"
              placeholder="e.g. 7"
              data-day="${day}"
              value="${displayValue}"
            />
          </td>
        </tr>
      `;
    }
    body.innerHTML = html;
  }

  function renderSleepChart() {
    const svg = document.getElementById("sleepChart");
    if (!svg) return;

    const sleepEntries = SleepStore.getEntries();
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

    const points = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateKey(selectedYear, selectedMonth, day);
      const value = sleepEntries[dateStr];
      if (value !== undefined && value !== null && value !== "") {
        points.push({ day, hours: Number(value) });
      }
    }

    const width = Math.max(280, Math.round(svg.parentElement.clientWidth || 600));
    const height = Math.max(140, Math.round(svg.clientHeight || 220));
    const marginLeft = 32;
    const marginRight = 14;
    const marginTop = 14;
    const marginBottom = 26;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    if (points.length === 0) {
      svg.innerHTML = `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" class="sleep-chart-label">No sleep data yet for this month.</text>`;
      return;
    }

    let minVal = Math.min(0, Math.min(...points.map((p) => p.hours)) - 1);
    let maxVal = Math.max(...points.map((p) => p.hours)) + 1;
    if (minVal === maxVal) {
      minVal -= 2;
      maxVal += 2;
    }

    const xFor = (day) =>
      marginLeft + (daysInMonth === 1 ? 0 : ((day - 1) / (daysInMonth - 1)) * plotWidth);
    const yFor = (hours) =>
      marginTop + plotHeight * (1 - (hours - minVal) / (maxVal - minVal));

    let svgHtml = "";

    [0, 0.5, 1].forEach((t) => {
      const y = marginTop + plotHeight * t;
      const valueAtT = maxVal - t * (maxVal - minVal);
      svgHtml += `<line x1="${marginLeft}" y1="${y}" x2="${width - marginRight}" y2="${y}" class="sleep-chart-grid" />`;
      svgHtml += `<text x="${marginLeft - 6}" y="${y + 3}" text-anchor="end" class="sleep-chart-label">${valueAtT.toFixed(1)}h</text>`;
    });

    const dayStep = daysInMonth > 20 ? 5 : daysInMonth > 10 ? 2 : 1;
    for (let day = 1; day <= daysInMonth; day += dayStep) {
      const x = xFor(day);
      svgHtml += `<text x="${x}" y="${height - 6}" text-anchor="middle" class="sleep-chart-label">${day}</text>`;
    }

    const linePoints = points
      .map((p) => `${xFor(p.day).toFixed(1)},${yFor(p.hours).toFixed(1)}`)
      .join(" ");
    svgHtml += `<polyline points="${linePoints}" class="sleep-chart-line" />`;

    points.forEach((p) => {
      svgHtml += `<circle cx="${xFor(p.day).toFixed(1)}" cy="${yFor(p.hours).toFixed(1)}" r="3.5" class="sleep-chart-point" />`;
    });

    svg.innerHTML = svgHtml;
  }

  // Re-draw the chart so it always matches its current on-screen width
  // (handles phone/desktop resize and orientation changes).
  let sleepChartResizeTimer = null;
  window.addEventListener("resize", function () {
    if (!document.querySelector(".my-routine-page")) return;
    clearTimeout(sleepChartResizeTimer);
    sleepChartResizeTimer = setTimeout(renderSleepChart, 150);
  });
})();
