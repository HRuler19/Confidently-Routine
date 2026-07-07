// Dashboard — port of the vanilla analytics page: task overview (ring +
// stat badges + category/priority bars), notes overview (count + bars +
// 12-month trend), per-habit insights (ring + line chart with year/month/
// week/day granularity), and the sleep overview. All charts re-render
// reactively on data, language, and theme changes.
import { createSignal, createMemo, For, Show } from "solid-js";
import { tasks, notes, habits, habitEntries, sleepEntries, entryKey } from "../lib/stores";
import { isInRange, selectableYears, type DateRange } from "../lib/dates";
import { t, calendarNames } from "../lib/i18n";
import { theme } from "../lib/theme";
import Select from "../components/Select";
import Heatmap from "../components/Heatmap";
import { Card, StatBadge } from "../components/ui";
import { BarChart, LineChart, ProgressRing } from "../components/charts";
import { isEntryDone, entryToValue, computeStreak } from "../lib/streaks";
import { habitColor } from "../lib/colors";

const YEARS = selectableYears();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Original light-mode chart colors, softened variants on dark surfaces. */
function themeColor(light: string, dark: string) {
  return theme() === "dark" ? dark : light;
}

function rangeOptions() {
  return [
    { value: "all", label: () => t("dashboard.range_all_time") },
    { value: "year", label: () => t("dashboard.range_this_year") },
    { value: "month", label: () => t("dashboard.range_this_month") },
  ];
}

export default function Dashboard() {
  const now = new Date();
  const [tasksRange, setTasksRange] = createSignal<DateRange>("all");
  const [notesRange, setNotesRange] = createSignal<DateRange>("all");
  const [granularity, setGranularity] = createSignal("month");
  const [habitsYear, setHabitsYear] = createSignal(now.getFullYear());
  const [habitsMonth, setHabitsMonth] = createSignal(now.getMonth() + 1);

  // ── Tasks ───────────────────────────────────────────────────────────
  const taskStats = createMemo(() => {
    const filtered = tasks().filter((task) => isInRange(task.dueDate, tasksRange()));
    const total = filtered.length;
    const completed = filtered.filter((task) => task.completed).length;
    const byCategory = ["personal", "work", "shopping", "other"].map((key) => ({
      label: t("routines.category_" + key),
      value: filtered.filter((task) => (task.category || "").toLowerCase() === key).length,
    }));
    const byPriority = ["low", "medium", "high", "hard"].map((key) => ({
      label: t("routines.priority_" + key),
      value: filtered.filter((task) => task.priority === key).length,
    }));
    return {
      total,
      completed,
      active: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
      byPriority,
    };
  });

  // ── Notes ───────────────────────────────────────────────────────────
  const noteStats = createMemo(() => {
    const all = notes();
    const filtered = all.filter((note) => isInRange(note.createdAt, notesRange()));
    const byCategory = ["study", "work", "personal", "learning"].map((key) => ({
      label: t("notes.category_" + key),
      value: filtered.filter((note) => note.category === key).length,
    }));

    const months = calendarNames().months_short;
    const buckets: { year: number; month: number; label: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: months[d.getMonth()],
        value: 0,
      });
    }
    for (const note of all) {
      const d = new Date(note.createdAt);
      if (isNaN(d.getTime())) continue;
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
      if (bucket) bucket.value++;
    }

    return { total: filtered.length, byCategory, trend: buckets };
  });

  // ── Habits ──────────────────────────────────────────────────────────
  function habitStats(habitId: number) {
    const entries = habitEntries();
    const labels: string[] = [];
    const values: number[] = [];
    // Completion rate counts only logged days, so new habits aren't
    // unfairly tanked by days before they existed (same as the original).
    let trackedDays = 0;
    let doneDays = 0;

    const tally = (y: number, m: number, day: number) => {
      const entry = entries[entryKey(habitId, dateKey(y, m, day))];
      if (entry) {
        trackedDays++;
        if (isEntryDone(entry)) doneDays++;
      }
      return entryToValue(entry);
    };

    const g = granularity();
    const year = habitsYear();
    const month = habitsMonth();

    if (g === "day") {
      for (let day = 1; day <= daysInMonth(year, month); day++) {
        labels.push(String(day));
        values.push(tally(year, month, day));
      }
    } else if (g === "week") {
      const total = daysInMonth(year, month);
      let week: number[] = [];
      let weekIdx = 0;
      for (let day = 1; day <= total; day++) {
        const mondayFirst = (new Date(year, month - 1, day).getDay() + 6) % 7;
        week.push(day);
        if (mondayFirst === 6 || day === total) {
          labels.push(`${t("dashboard.week_short")}${++weekIdx}`);
          values.push(week.reduce((sum, d) => sum + tally(year, month, d), 0));
          week = [];
        }
      }
    } else if (g === "month") {
      const months = calendarNames().months_short;
      for (let m = 1; m <= 12; m++) {
        let sum = 0;
        for (let day = 1; day <= daysInMonth(year, m); day++) sum += tally(year, m, day);
        labels.push(months[m - 1]);
        values.push(sum);
      }
    } else {
      // year granularity: every year that has data for this habit
      const prefix = `${habitId}_`;
      const years = new Set<number>();
      for (const key of Object.keys(entries)) {
        if (key.startsWith(prefix)) {
          years.add(Number(key.slice(prefix.length, prefix.length + 4)));
        }
      }
      if (years.size === 0) years.add(now.getFullYear());
      for (const y of [...years].sort((a, b) => a - b)) {
        let sum = 0;
        for (let m = 1; m <= 12; m++) {
          for (let day = 1; day <= daysInMonth(y, m); day++) sum += tally(y, m, day);
        }
        labels.push(String(y));
        values.push(sum);
      }
    }

    return {
      labels,
      values,
      completionRate: trackedDays > 0 ? Math.round((doneDays / trackedDays) * 100) : 0,
    };
  }

  // ── Sleep ───────────────────────────────────────────────────────────
  const sleepStats = createMemo(() => {
    const entries = sleepEntries();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const labels: string[] = [];
    const values: number[] = [];
    let sum = 0;
    let count = 0;
    for (let day = 1; day <= daysInMonth(year, month); day++) {
      const value = entries[dateKey(year, month, day)];
      labels.push(String(day));
      if (value !== undefined && value !== null && String(value) !== "") {
        const num = Number(value);
        values.push(num);
        sum += num;
        count++;
      } else {
        values.push(0);
      }
    }
    return {
      hasData: Object.keys(entries).length > 0,
      labels,
      values,
      avg: count > 0 ? (sum / count).toFixed(1) : "0",
    };
  });

  const noData = () => t("dashboard.chart_no_data");

  return (
    <section class="flex flex-col gap-5">
      {/* Daily Tasks */}
      <Card
        title={t("dashboard.tasks_section_title")}
        controls={
          <Select
            class="w-36"
            value={tasksRange()}
            options={rangeOptions()}
            onChange={(v) => setTasksRange(v as DateRange)}
          />
        }
      >
        <Show
          when={tasks().length > 0}
          fallback={<p class="text-sm text-muted">{t("dashboard.no_tasks_empty")}</p>}
        >
          <div class="flex flex-wrap items-center gap-8 max-[480px]:flex-col max-[480px]:items-stretch">
            <div class="flex flex-col items-center gap-2 max-[480px]:self-center">
              <ProgressRing
                percent={taskStats().completionRate}
                color={themeColor("#0e5e0a", "#2d9b27")}
                centerLabel={`${taskStats().completionRate}%`}
              />
              <span class="text-xs text-tertiary">{t("dashboard.completion_rate_label")}</span>
            </div>

            <div class="flex flex-col gap-2.5 max-[480px]:flex-row">
              <For
                each={[
                  { dot: "var(--stat-total)", value: () => taskStats().total, key: "routines.stat_total" },
                  { dot: "var(--stat-completed)", value: () => taskStats().completed, key: "routines.stat_completed" },
                  { dot: "var(--stat-active)", value: () => taskStats().active, key: "routines.stat_active" },
                ]}
              >
                {(stat) => (
                  <StatBadge
                    dot={stat.dot}
                    count={stat.value()}
                    label={t(stat.key)}
                    class="bg-surface-alt max-[480px]:flex-1 max-[480px]:justify-center max-[480px]:px-1.5 max-[480px]:text-xs"
                  />
                )}
              </For>
            </div>

            <div class="min-w-52 flex-1">
              <span class="mb-1 block text-xs text-tertiary">{t("dashboard.by_category_label")}</span>
              <BarChart
                labels={taskStats().byCategory.map((c) => c.label)}
                values={taskStats().byCategory.map((c) => c.value)}
                color={themeColor("#0066ff", "#58a6ff")}
                emptyMessage={noData()}
                height={160}
              />
            </div>
            <div class="min-w-52 flex-1">
              <span class="mb-1 block text-xs text-tertiary">{t("dashboard.by_priority_label")}</span>
              <BarChart
                labels={taskStats().byPriority.map((p) => p.label)}
                values={taskStats().byPriority.map((p) => p.value)}
                color={themeColor("#f59e0b", "#d29922")}
                emptyMessage={noData()}
                height={160}
              />
            </div>
          </div>
        </Show>
      </Card>

      {/* Notes */}
      <Card
        title={t("dashboard.notes_section_title")}
        controls={
          <Select
            class="w-36"
            value={notesRange()}
            options={rangeOptions()}
            onChange={(v) => setNotesRange(v as DateRange)}
          />
        }
      >
        <Show
          when={notes().length > 0}
          fallback={<p class="text-sm text-muted">{t("dashboard.no_notes_empty")}</p>}
        >
          <div class="flex flex-wrap items-center gap-8 max-[480px]:flex-col max-[480px]:items-stretch">
            <StatBadge
              dot="var(--stat-total)"
              count={noteStats().total}
              label={t("notes.stat_total")}
              class="self-center bg-surface-alt"
            />
            <div class="min-w-52 flex-1">
              <span class="mb-1 block text-xs text-tertiary">{t("dashboard.by_category_label")}</span>
              <BarChart
                labels={noteStats().byCategory.map((c) => c.label)}
                values={noteStats().byCategory.map((c) => c.value)}
                color={themeColor("#7c3aed", "#a371f7")}
                emptyMessage={noData()}
                height={160}
              />
            </div>
            <div class="min-w-72 flex-2">
              <span class="mb-1 block text-xs text-tertiary">{t("dashboard.notes_per_month_label")}</span>
              <BarChart
                labels={noteStats().trend.map((b) => b.label)}
                values={noteStats().trend.map((b) => b.value)}
                color={themeColor("#0e5e0a", "#2d9b27")}
                emptyMessage={noData()}
                height={160}
              />
            </div>
          </div>
        </Show>
      </Card>

      {/* Habit insights */}
      <Card title={t("dashboard.habits_section_title")}>
        <div class="mb-5 flex flex-wrap gap-4">
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-tertiary">{t("dashboard.granularity_label")}</span>
            <Select
              class="w-32"
              value={granularity()}
              onChange={setGranularity}
              options={[
                { value: "year", label: () => t("dashboard.granularity_year") },
                { value: "month", label: () => t("dashboard.granularity_month") },
                { value: "week", label: () => t("dashboard.granularity_week") },
                { value: "day", label: () => t("dashboard.granularity_day") },
              ]}
            />
          </div>
          <Show when={granularity() !== "year"}>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-medium text-tertiary">{t("myroutine.year_label")}</span>
              <Select
                class="w-28"
                value={String(habitsYear())}
                options={YEARS.map((y) => ({ value: y, label: y }))}
                onChange={(v) => setHabitsYear(Number(v))}
              />
            </div>
          </Show>
          <Show when={granularity() === "day" || granularity() === "week"}>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-medium text-tertiary">{t("myroutine.month_label")}</span>
              <Select
                class="w-36"
                value={String(habitsMonth())}
                options={calendarNames().months_long.map((name, i) => ({
                  value: String(i + 1),
                  label: name,
                }))}
                onChange={(v) => setHabitsMonth(Number(v))}
              />
            </div>
          </Show>
        </div>

        <Show
          when={habits().length > 0}
          fallback={<p class="text-sm text-muted">{t("dashboard.no_habits_empty")}</p>}
        >
          <div class="flex flex-col gap-6">
            <For each={habits()}>
              {(habit, i) => {
                const stats = createMemo(() => habitStats(habit.id));
                const streak = createMemo(() => computeStreak(habitEntries(), habit.id));
                const color = () => habitColor(i(), theme() === "dark");
                return (
                  <div class="rounded-lg border border-line p-4">
                    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span class="font-medium text-primary">{habit.name}</span>
                      <Show when={streak().best > 0}>
                        <span
                          class="text-xs font-medium text-tertiary"
                          title={`${t("myroutine.streak_best")}: ${streak().best} ${t("myroutine.streak_days")}`}
                        >
                          <Show when={streak().current > 0} fallback={`🏆 ${streak().best}`}>
                            🔥 {streak().current} {t("myroutine.streak_days")}
                          </Show>
                        </span>
                      </Show>
                    </div>
                    <div class="flex items-center gap-6 max-[576px]:flex-col">
                      <ProgressRing
                        percent={stats().completionRate}
                        color={color()}
                        centerLabel={`${stats().completionRate}%`}
                        size={90}
                      />
                      <div class="min-w-0 flex-1 max-[576px]:w-full">
                        <LineChart
                          labels={stats().labels}
                          values={stats().values}
                          color={color()}
                          emptyMessage={noData()}
                          skipEmptyValues={false}
                          height={150}
                        />
                      </div>
                    </div>
                    <div class="mt-4 border-t border-line pt-4">
                      <span class="mb-2 block text-xs font-medium text-tertiary">
                        {t("myroutine.heatmap_title")} · {habitsYear()}
                      </span>
                      <Heatmap habitId={habit.id} year={habitsYear()} color={color()} />
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Card>

      {/* Sleep */}
      <Card title={t("dashboard.sleep_section_title")}>
        <Show
          when={sleepStats().hasData}
          fallback={<p class="text-sm text-muted">{t("dashboard.no_sleep_empty")}</p>}
        >
          <div class="flex items-center gap-8 max-[576px]:flex-col">
            <div class="flex flex-col items-center gap-1">
              <span class="text-3xl font-bold text-primary">
                {sleepStats().avg}
                {t("dashboard.hours_unit")}
              </span>
              <span class="text-xs text-tertiary">{t("dashboard.avg_sleep_label")}</span>
            </div>
            <div class="min-w-0 flex-1 max-[576px]:w-full">
              <LineChart
                labels={sleepStats().labels}
                values={sleepStats().values}
                color={themeColor("#dc2626", "#f87171")}
                emptyMessage={noData()}
                height={170}
              />
            </div>
          </div>
        </Show>
      </Card>
    </section>
  );
}
