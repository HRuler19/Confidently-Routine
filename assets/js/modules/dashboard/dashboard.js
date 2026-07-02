(function () {
  "use strict";

  const HABIT_COLORS = ["#0e5e0a", "#0066ff", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

  let tasksRange = "all";
  let notesRange = "all";
  let habitsGranularity = "month";
  let habitsYear = new Date().getFullYear();
  let habitsMonth = new Date().getMonth() + 1;

  window.addEventListener("pageLoaded", function (e) {
    if (e.detail.page === "dashboard") {
      initDashboard();
    }
  });

  window.addEventListener("languageChange", function () {
    if (!document.querySelector(".dashboard-page")) return;
    renderAll();
  });

  function initDashboard() {
    if (!document.querySelector(".dashboard-page")) return;

    initRangeSelect("tasksRangeSelect", (value) => {
      tasksRange = value;
      renderTasksSection();
    });

    initRangeSelect("notesRangeSelect", (value) => {
      notesRange = value;
      renderNotesSection();
    });

    initHabitsFilters();

    renderAll();
  }

  function renderAll() {
    renderTasksSection();
    renderNotesSection();
    renderHabitsSection();
    renderSleepSection();
  }

  // ---------- Shared date helpers ----------

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function formatDateKey(year, month, day) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function filterByDateRange(items, dateField, range) {
    if (range === "all") return items;
    const now = new Date();
    return items.filter((item) => {
      const d = new Date(item[dateField]);
      if (isNaN(d.getTime())) return false;
      if (range === "year") return d.getFullYear() === now.getFullYear();
      if (range === "month") {
        return (
          d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        );
      }
      return true;
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

  function initRangeSelect(selectId, onChange) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => onChange(select.dataset.value));
    });
  }

  // ---------- Daily Tasks ----------

  function computeTaskStats(range) {
    const filtered = filterByDateRange(TaskStore.getTasks(), "dueDate", range);

    const total = filtered.length;
    const completed = filtered.filter((t) => t.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const categoryKeys = ["personal", "work", "shopping", "other"];
    const byCategory = categoryKeys.map((key) => ({
      label: I18n.t("routines.category_" + key),
      value: filtered.filter((t) => t.category.toLowerCase() === key).length,
    }));

    const priorityKeys = ["low", "medium", "high", "hard"];
    const byPriority = priorityKeys.map((key) => ({
      label: I18n.t("routines.priority_" + key),
      value: filtered.filter((t) => t.priority === key).length,
    }));

    return { total, completed, active, completionRate, byCategory, byPriority };
  }

  function renderTasksSection() {
    const emptyState = document.getElementById("tasksEmptyState");
    const body = document.getElementById("tasksStatsBody");
    if (!body) return;

    if (TaskStore.getTasks().length === 0) {
      if (emptyState) emptyState.classList.remove("is-hidden");
      body.classList.add("is-hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("is-hidden");
    body.classList.remove("is-hidden");

    const stats = computeTaskStats(tasksRange);
    const noDataMsg = I18n.t("dashboard.chart_no_data");

    document.getElementById("tasksTotalCount").textContent = stats.total;
    document.getElementById("tasksCompletedCount").textContent = stats.completed;
    document.getElementById("tasksActiveCount").textContent = stats.active;

    Charts.renderProgressRing(document.getElementById("tasksCompletionRing"), {
      percent: stats.completionRate,
      color: "#0e5e0a",
      centerLabel: `${stats.completionRate}%`,
    });

    Charts.renderBarChart(document.getElementById("tasksCategoryChart"), {
      labels: stats.byCategory.map((c) => c.label),
      values: stats.byCategory.map((c) => c.value),
      color: "#0066ff",
      emptyMessage: noDataMsg,
    });

    Charts.renderBarChart(document.getElementById("tasksPriorityChart"), {
      labels: stats.byPriority.map((p) => p.label),
      values: stats.byPriority.map((p) => p.value),
      color: "#f59e0b",
      emptyMessage: noDataMsg,
    });
  }

  // ---------- Notes ----------

  function computeLast12MonthsTrend(items, dateField) {
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: I18n.t(`calendar.months_short.${d.getMonth()}`),
        value: 0,
      });
    }
    items.forEach((item) => {
      const d = new Date(item[dateField]);
      if (isNaN(d.getTime())) return;
      const bucket = buckets.find(
        (b) => b.year === d.getFullYear() && b.month === d.getMonth(),
      );
      if (bucket) bucket.value++;
    });
    return buckets;
  }

  function computeNoteStats(range) {
    const allNotes = NoteStore.getNotes();
    const filtered = filterByDateRange(allNotes, "createdAt", range);

    const categoryKeys = ["study", "work", "personal", "learning"];
    const byCategory = categoryKeys.map((key) => ({
      label: I18n.t("notes.category_" + key),
      value: filtered.filter((n) => n.category === key).length,
    }));

    return {
      total: filtered.length,
      byCategory,
      trend: computeLast12MonthsTrend(allNotes, "createdAt"),
    };
  }

  function renderNotesSection() {
    const emptyState = document.getElementById("notesEmptyState");
    const body = document.getElementById("notesStatsBody");
    if (!body) return;

    if (NoteStore.getNotes().length === 0) {
      if (emptyState) emptyState.classList.remove("is-hidden");
      body.classList.add("is-hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("is-hidden");
    body.classList.remove("is-hidden");

    const stats = computeNoteStats(notesRange);
    const noDataMsg = I18n.t("dashboard.chart_no_data");

    document.getElementById("notesTotalCount").textContent = stats.total;

    Charts.renderBarChart(document.getElementById("notesCategoryChart"), {
      labels: stats.byCategory.map((c) => c.label),
      values: stats.byCategory.map((c) => c.value),
      color: "#7c3aed",
      emptyMessage: noDataMsg,
    });

    Charts.renderBarChart(document.getElementById("notesTrendChart"), {
      labels: stats.trend.map((t) => t.label),
      values: stats.trend.map((t) => t.value),
      color: "#0e5e0a",
      emptyMessage: noDataMsg,
    });
  }

  // ---------- My Routine (habits) ----------

  function entryToValue(entry) {
    if (!entry) return 0;
    if (entry.type === "plus") return 1;
    if (entry.type === "count") return Number(entry.value) || 0;
    return 0;
  }

  function isEntryDone(entry) {
    if (!entry) return false;
    if (entry.type === "plus") return true;
    if (entry.type === "count") return Number(entry.value) > 0;
    return false;
  }

  function groupDaysIntoWeeks(year, month, daysInMonth) {
    const weeks = [];
    let currentWeek = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dow = new Date(year, month - 1, day).getDay();
      const mondayFirstIndex = (dow + 6) % 7;
      currentWeek.push(day);
      if (mondayFirstIndex === 6 || day === daysInMonth) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return weeks;
  }

  function getYearsWithData(habitId) {
    const entries = HabitEntryStore.getEntries();
    const prefix = `${habitId}_`;
    const years = new Set();
    Object.keys(entries).forEach((key) => {
      if (key.startsWith(prefix)) years.add(Number(key.slice(prefix.length, prefix.length + 4)));
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }

  function computeHabitStats(habit, granularity, year, month) {
    const labels = [];
    const values = [];
    // Completion rate is "of the days you actually logged this habit, how
    // many were a success" - counting every calendar day in the span
    // (including days before the habit existed) would unfairly tank the
    // rate for new habits.
    let trackedDaysCount = 0;
    let doneCount = 0;

    function tallyDay(y, m, day) {
      const dateStr = formatDateKey(y, m, day);
      const entry = HabitEntryStore.getEntry(habit.id, dateStr);
      if (entry) {
        trackedDaysCount++;
        if (isEntryDone(entry)) doneCount++;
      }
      return entryToValue(entry);
    }

    if (granularity === "day") {
      const daysInMonth = getDaysInMonth(year, month);
      for (let day = 1; day <= daysInMonth; day++) {
        labels.push(String(day));
        values.push(tallyDay(year, month, day));
      }
    } else if (granularity === "week") {
      const daysInMonth = getDaysInMonth(year, month);
      const weeks = groupDaysIntoWeeks(year, month, daysInMonth);
      weeks.forEach((weekDays, idx) => {
        let weekValue = 0;
        weekDays.forEach((day) => {
          weekValue += tallyDay(year, month, day);
        });
        labels.push(`${I18n.t("dashboard.week_short")}${idx + 1}`);
        values.push(weekValue);
      });
    } else if (granularity === "month") {
      for (let m = 1; m <= 12; m++) {
        const daysInM = getDaysInMonth(year, m);
        let monthValue = 0;
        for (let day = 1; day <= daysInM; day++) {
          monthValue += tallyDay(year, m, day);
        }
        labels.push(I18n.t(`calendar.months_short.${m - 1}`));
        values.push(monthValue);
      }
    } else if (granularity === "year") {
      getYearsWithData(habit.id).forEach((y) => {
        let yearValue = 0;
        for (let m = 1; m <= 12; m++) {
          const daysInM = getDaysInMonth(y, m);
          for (let day = 1; day <= daysInM; day++) {
            yearValue += tallyDay(y, m, day);
          }
        }
        labels.push(String(y));
        values.push(yearValue);
      });
    }

    const completionRate =
      trackedDaysCount > 0 ? Math.round((doneCount / trackedDaysCount) * 100) : 0;

    return { labels, values, completionRate };
  }

  function initHabitsFilters() {
    const granularitySelect = document.getElementById("habitsGranularitySelect");
    const yearSelect = document.getElementById("habitsYearSelect");
    const monthSelect = document.getElementById("habitsMonthSelect");

    const today = new Date();
    habitsYear = today.getFullYear();
    habitsMonth = today.getMonth() + 1;
    habitsGranularity = granularitySelect?.dataset.value || "month";

    setSelectDisplay(yearSelect, String(habitsYear));
    setSelectDisplay(monthSelect, String(habitsMonth));
    updateHabitsFilterVisibility();

    granularitySelect?.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => {
        habitsGranularity = granularitySelect.dataset.value;
        updateHabitsFilterVisibility();
        renderHabitsSection();
      });
    });

    yearSelect?.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => {
        habitsYear = Number(yearSelect.dataset.value);
        renderHabitsSection();
      });
    });

    monthSelect?.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => {
        habitsMonth = Number(monthSelect.dataset.value);
        renderHabitsSection();
      });
    });
  }

  function updateHabitsFilterVisibility() {
    const yearGroup = document.getElementById("habitsYearFilterGroup");
    const monthGroup = document.getElementById("habitsMonthFilterGroup");
    if (yearGroup) {
      yearGroup.style.display = habitsGranularity === "year" ? "none" : "";
    }
    if (monthGroup) {
      monthGroup.style.display =
        habitsGranularity === "day" || habitsGranularity === "week" ? "" : "none";
    }
  }

  function renderHabitsSection() {
    const habits = HabitStore.getHabits();
    const emptyState = document.getElementById("habitsEmptyState");
    const grid = document.getElementById("habitsGrid");
    if (!grid) return;

    if (habits.length === 0) {
      if (emptyState) emptyState.classList.remove("is-hidden");
      grid.innerHTML = "";
      return;
    }
    if (emptyState) emptyState.classList.add("is-hidden");

    grid.innerHTML = habits
      .map(
        (habit) => `
      <div class="habit-stat-card">
        <div class="habit-stat-header">
          <span class="habit-stat-name">${DomHelpers.escapeHtml(habit.name)}</span>
        </div>
        <div class="habit-stat-body">
          <svg class="progress-ring-svg habit-stat-ring" id="habitRing-${habit.id}"></svg>
          <svg class="dashboard-bar-svg habit-stat-chart" id="habitChart-${habit.id}"></svg>
        </div>
      </div>
    `,
      )
      .join("");

    const noDataMsg = I18n.t("dashboard.chart_no_data");

    habits.forEach((habit, i) => {
      const stats = computeHabitStats(habit, habitsGranularity, habitsYear, habitsMonth);
      const color = HABIT_COLORS[i % HABIT_COLORS.length];

      Charts.renderProgressRing(document.getElementById(`habitRing-${habit.id}`), {
        percent: stats.completionRate,
        color,
        centerLabel: `${stats.completionRate}%`,
      });

      Charts.renderBarChart(document.getElementById(`habitChart-${habit.id}`), {
        labels: stats.labels,
        values: stats.values,
        color,
        emptyMessage: noDataMsg,
      });
    });
  }

  // ---------- Sleep ----------

  function renderSleepSection() {
    const emptyState = document.getElementById("sleepEmptyState");
    const body = document.getElementById("sleepStatsBody");
    if (!body) return;

    const sleepEntries = SleepStore.getEntries();
    if (Object.keys(sleepEntries).length === 0) {
      if (emptyState) emptyState.classList.remove("is-hidden");
      body.classList.add("is-hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("is-hidden");
    body.classList.remove("is-hidden");

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const daysInMonth = getDaysInMonth(year, month);

    const labels = [];
    const values = [];
    let sum = 0;
    let count = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateKey(year, month, day);
      const value = sleepEntries[dateStr];
      labels.push(String(day));
      if (value !== undefined && value !== null && value !== "") {
        const num = Number(value);
        values.push(num);
        sum += num;
        count++;
      } else {
        values.push(0);
      }
    }

    const avg = count > 0 ? (sum / count).toFixed(1) : "0";
    document.getElementById("sleepAvgValue").textContent = `${avg}${I18n.t("dashboard.hours_unit")}`;

    Charts.renderBarChart(document.getElementById("sleepTrendChart"), {
      labels,
      values,
      color: "#dc2626",
      emptyMessage: I18n.t("dashboard.chart_no_data"),
    });
  }
})();
