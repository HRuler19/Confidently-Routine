// My Routine — port of the vanilla habit tracker: month grid (one column
// per habit, one row per day), inline rename, delete-habit modal, and
// the sleep tracker (line chart + per-day table).
//
// Grid cells respond to two gestures: a quick tap cycles through the
// common states (empty -> done -> missed -> empty) without any dialog,
// since that covers the vast majority of check-ins; a long-press (or
// right-click) opens the full entry modal for logging an exact count.
import { createSignal, createMemo, createUniqueId, For, Show, onCleanup } from "solid-js";
import {
  habits,
  habitEntries,
  entryKey,
  addHabit,
  renameHabit,
  deleteHabit,
  setHabitEntry,
  clearHabitEntry,
  setHabitReminder,
  sleepEntries,
  setSleepEntry,
  clearSleepEntry,
  type Habit,
  type HabitEntry,
} from "../lib/stores";
import { t, calendarNames } from "../lib/i18n";
import { theme } from "../lib/theme";
import Select, { type SelectOption } from "../components/Select";
import ConfirmModal from "../components/ConfirmModal";
import Heatmap from "../components/Heatmap";
import { Button, Input, Card } from "../components/ui";
import { useDialogA11y } from "../lib/dialogA11y";
import { requestNotificationPermission } from "../lib/notifications";
import { showToast } from "../lib/toast";
import { computeStreak } from "../lib/streaks";
import { habitColor } from "../lib/colors";
import { Plus, Check, X, Pencil, Eraser, Trash2 } from "lucide-solid";

const LONG_PRESS_MS = 450;

const YEARS = ["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "off" plus every half hour of the day, as plain 24-hour HH:MM - avoids
    AM/PM locale formatting entirely so this needs no per-language logic. */
function reminderTimeOptions(): SelectOption[] {
  const options: SelectOption[] = [{ value: "off", label: () => t("myroutine.reminder_off") }];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const value = `${pad(h)}:${pad(m)}`;
      options.push({ value, label: value });
    }
  }
  return options;
}

/** Entry-editing modal state. */
interface EntryContext {
  habit: Habit;
  day: number;
  dateStr: string;
}

export default function MyRoutine() {
  const now = new Date();
  const [year, setYear] = createSignal(now.getFullYear());
  const [month, setMonth] = createSignal(now.getMonth() + 1);
  const [newHabit, setNewHabit] = createSignal("");
  const [renamingId, setRenamingId] = createSignal<number | null>(null);
  const [pendingDelete, setPendingDelete] = createSignal<Habit | null>(null);

  // Habit-entry modal state
  const [entryCtx, setEntryCtx] = createSignal<EntryContext | null>(null);
  const [toggle, setToggle] = createSignal<"plus" | "x" | null>(null);
  const [count, setCount] = createSignal("");

  const days = createMemo(() => {
    const total = daysInMonth(year(), month());
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  function entryFor(habitId: number, day: number): HabitEntry | undefined {
    return habitEntries()[entryKey(habitId, dateKey(year(), month(), day))];
  }

  /** Quick tap: empty -> done -> missed -> empty, no dialog. */
  function cycleEntry(habit: Habit, day: number) {
    const dateStr = dateKey(year(), month(), day);
    const current = entryFor(habit.id, day);
    if (!current) setHabitEntry(habit.id, dateStr, { type: "plus" });
    else if (current.type === "plus") setHabitEntry(habit.id, dateStr, { type: "x" });
    else clearHabitEntry(habit.id, dateStr);
  }

  // A long-press (or right-click, for desktop mice) opens the full modal
  // instead of cycling, so entering an exact count never needs more than
  // one gesture. The `suppressClick` flag stops the click that always
  // follows a pointerup from also cycling the entry it just opened.
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressClick = false;

  function startPress(habit: Habit, day: number) {
    suppressClick = false;
    pressTimer = setTimeout(() => {
      suppressClick = true;
      openEntryModal(habit, day);
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    clearTimeout(pressTimer);
  }

  function handleCellClick(habit: Habit, day: number) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    cycleEntry(habit, day);
  }

  function openEntryModal(habit: Habit, day: number) {
    const dateStr = dateKey(year(), month(), day);
    const existing = habitEntries()[entryKey(habit.id, dateStr)];
    setToggle(null);
    setCount("");
    if (existing) {
      if (existing.type === "plus") setToggle("plus");
      else if (existing.type === "x") setToggle("x");
      else if (existing.type === "count") setCount(String(existing.value));
    }
    setEntryCtx({ habit, day, dateStr });
  }

  function saveEntry() {
    const ctx = entryCtx();
    if (!ctx) return;
    if (toggle() === "plus") {
      setHabitEntry(ctx.habit.id, ctx.dateStr, { type: "plus" });
    } else if (toggle() === "x") {
      setHabitEntry(ctx.habit.id, ctx.dateStr, { type: "x" });
    } else if (count().trim() !== "") {
      setHabitEntry(ctx.habit.id, ctx.dateStr, { type: "count", value: Number(count()) });
    } else {
      clearHabitEntry(ctx.habit.id, ctx.dateStr);
    }
    setEntryCtx(null);
  }

  function submitNewHabit() {
    const name = newHabit().trim();
    if (!name) return;
    addHabit(name);
    setNewHabit("");
  }

  async function handleSetReminder(habit: Habit, value: string) {
    if (value === "off") {
      setHabitReminder(habit.id, undefined);
      showToast({ message: t("myroutine.reminder_cleared_toast", { name: habit.name }) });
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      showToast({ message: t("myroutine.reminder_permission_denied") });
      return;
    }
    setHabitReminder(habit.id, value);
    showToast({ message: t("myroutine.reminder_set_toast", { name: habit.name, time: value }) });
  }

  // ── Sleep chart geometry (reactive SVG, same layout as the vanilla one) ──
  const [chartWidth, setChartWidth] = createSignal(600);
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      setChartWidth(Math.max(280, Math.round(entry.contentRect.width)));
    }
  });
  onCleanup(() => observer.disconnect());

  const sleepPoints = createMemo(() => {
    const entries = sleepEntries();
    const points: { day: number; hours: number }[] = [];
    for (const day of days()) {
      const value = entries[dateKey(year(), month(), day)];
      if (value !== undefined && value !== null && String(value) !== "") {
        points.push({ day, hours: Number(value) });
      }
    }
    return points;
  });

  const chart = createMemo(() => {
    const width = chartWidth();
    const height = 220;
    const marginLeft = 32;
    const marginRight = 14;
    const marginTop = 14;
    const marginBottom = 26;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const points = sleepPoints();
    const totalDays = days().length;

    let minVal = 0;
    let maxVal = 10;
    if (points.length > 0) {
      minVal = Math.min(0, Math.min(...points.map((p) => p.hours)) - 1);
      maxVal = Math.max(...points.map((p) => p.hours)) + 1;
      if (minVal === maxVal) {
        minVal -= 2;
        maxVal += 2;
      }
    }

    const xFor = (day: number) =>
      marginLeft + (totalDays === 1 ? 0 : ((day - 1) / (totalDays - 1)) * plotWidth);
    const yFor = (hours: number) =>
      marginTop + plotHeight * (1 - (hours - minVal) / (maxVal - minVal));

    const gridLines = [0, 0.5, 1].map((tFrac) => ({
      y: marginTop + plotHeight * tFrac,
      label: (maxVal - tFrac * (maxVal - minVal)).toFixed(1) + "h",
    }));

    const dayStep = totalDays > 20 ? 5 : totalDays > 10 ? 2 : 1;
    const dayLabels: { x: number; day: number }[] = [];
    for (let day = 1; day <= totalDays; day += dayStep) {
      dayLabels.push({ x: xFor(day), day });
    }

    return {
      width,
      height,
      gridLines,
      dayLabels,
      polyline: points.map((p) => `${xFor(p.day).toFixed(1)},${yFor(p.hours).toFixed(1)}`).join(" "),
      dots: points.map((p) => ({ cx: xFor(p.day), cy: yFor(p.hours) })),
      marginLeft,
      marginRight,
    };
  });

  return (
    <section class="flex flex-col gap-5">
      {/* Year/month + add habit */}
      <Card>
        <div class="flex flex-wrap gap-6 max-[768px]:flex-col max-[768px]:gap-4">
          <div class="flex min-w-40 flex-1 flex-col gap-1.5">
            <span class="text-xs font-medium text-tertiary">{t("myroutine.year_label")}</span>
            <Select
              value={String(year())}
              options={YEARS.map((y) => ({ value: y, label: y }))}
              onChange={(v) => setYear(Number(v))}
            />
          </div>
          <div class="flex min-w-40 flex-1 flex-col gap-1.5">
            <span class="text-xs font-medium text-tertiary">{t("myroutine.month_label")}</span>
            <Select
              value={String(month())}
              options={calendarNames().months_long.map((name, i) => ({
                value: String(i + 1),
                label: name,
              }))}
              onChange={(v) => setMonth(Number(v))}
            />
          </div>
        </div>

        <hr class="my-5 border-line" />

        <div class="flex gap-3 max-[768px]:flex-col">
          <Input
            type="text"
            class="h-11 flex-1 px-4"
            placeholder={t("myroutine.add_habit_placeholder")}
            value={newHabit()}
            onInput={(e) => setNewHabit(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNewHabit()}
          />
          <Button
            variant="primary"
            class="h-11 px-6"
            disabled={newHabit().trim() === ""}
            onClick={submitNewHabit}
          >
            <Plus size={16} class="mr-2 inline-block align-[-3px]" />
            {t("myroutine.add_habit_button")}
          </Button>
        </div>
      </Card>

      {/* Habit grid */}
      <Card>
        <Show when={habits().length === 0}>
          <p class="mb-4 text-sm text-muted">{t("myroutine.empty_hint")}</p>
        </Show>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th class="sticky left-0 z-10 border border-line bg-surface-alt px-3 py-2 text-left font-semibold text-secondary">
                  {t("myroutine.day_col")}
                </th>
                <For each={habits()}>
                  {(habit) => {
                    const streak = createMemo(() => computeStreak(habitEntries(), habit.id));
                    return (
                    <th class="min-w-28 border border-line bg-surface-alt px-3 py-2 font-semibold text-secondary">
                      <Show
                        when={renamingId() === habit.id}
                        fallback={
                          <div class="flex flex-col items-center gap-0.5">
                            <div class="flex items-center justify-center gap-1.5">
                              <span class="truncate">{habit.name}</span>
                              <button
                                type="button"
                                title={t("myroutine.rename_tooltip")}
                                aria-label={t("myroutine.rename_tooltip")}
                                class="cursor-pointer border-none bg-transparent p-1 text-xs text-tertiary hover:text-accent"
                                onClick={() => setRenamingId(habit.id)}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                title={t("myroutine.delete_tooltip")}
                                aria-label={t("myroutine.delete_tooltip")}
                                class="cursor-pointer border-none bg-transparent p-1 text-xs text-tertiary hover:text-danger"
                                onClick={() => setPendingDelete(habit)}
                              >
                                <X size={18} />
                              </button>
                            </div>
                            <Show when={streak().best > 0}>
                              <span
                                class="text-[10px] font-normal text-muted"
                                title={`${t("myroutine.streak_best")}: ${streak().best} ${t("myroutine.streak_days")}`}
                              >
                                <Show when={streak().current > 0} fallback={`🏆 ${streak().best}`}>
                                  🔥 {streak().current}
                                </Show>
                              </span>
                            </Show>
                          </div>
                        }
                      >
                        <input
                          type="text"
                          maxlength="40"
                          class="w-full rounded border border-accent bg-surface px-2 py-1 text-sm text-primary focus:outline-none"
                          value={habit.name}
                          ref={(el) => setTimeout(() => (el.focus(), el.select()))}
                          onBlur={(e) => {
                            const name = e.currentTarget.value.trim();
                            if (name) renameHabit(habit.id, name);
                            setRenamingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            else if (e.key === "Escape") setRenamingId(null);
                          }}
                        />
                      </Show>
                    </th>
                    );
                  }}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={days()}>
                {(day) => (
                  <tr>
                    <td class="sticky left-0 z-10 border border-line bg-surface-alt px-3 py-1.5 font-medium text-tertiary">
                      {day}
                    </td>
                    <For each={habits()}>
                      {(habit) => (
                        <td
                          class="h-9 cursor-pointer border border-line text-center align-middle font-semibold transition-colors select-none hover:bg-hover"
                          onClick={() => handleCellClick(habit, day)}
                          onPointerDown={() => startPress(habit, day)}
                          onPointerUp={cancelPress}
                          onPointerLeave={cancelPress}
                          onPointerCancel={cancelPress}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            openEntryModal(habit, day);
                          }}
                        >
                          <Show when={entryFor(habit.id, day)}>
                            {(e) => (
                              <Show
                                when={e().type === "count"}
                                fallback={
                                  e().type === "plus" ? (
                                    <Check size={16} class="inline-block text-accent" />
                                  ) : (
                                    <X size={16} class="inline-block text-danger" />
                                  )
                                }
                              >
                                <span class="text-info">
                                  {(e() as { type: "count"; value: number }).value}
                                </span>
                              </Show>
                            )}
                          </Show>
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reminders — native notification per habit, checked while the app is open */}
      <Show when={habits().length > 0}>
        <Card title={t("myroutine.reminders_title")}>
          <p class="mb-4 text-sm text-tertiary">{t("myroutine.reminders_hint")}</p>
          <div class="flex flex-col gap-3">
            <For each={habits()}>
              {(habit) => (
                <div class="flex items-center justify-between gap-3">
                  <span class="min-w-0 truncate text-sm font-medium text-primary">{habit.name}</span>
                  <Select
                    class="w-36 shrink-0"
                    value={habit.reminderTime ?? "off"}
                    options={reminderTimeOptions()}
                    onChange={(v) => handleSetReminder(habit, v)}
                  />
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Activity heatmap — a GitHub-style year view per habit */}
      <Show when={habits().length > 0}>
        <Card title={<>{t("myroutine.heatmap_title")} · {year()}</>}>
          <div class="flex flex-col gap-5">
            <For each={habits()}>
              {(habit, i) => (
                <div>
                  <span class="mb-1.5 block text-sm font-medium text-secondary">{habit.name}</span>
                  <Heatmap habitId={habit.id} year={year()} color={habitColor(i(), theme() === "dark")} />
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Sleep tracker */}
      <Card title={t("myroutine.sleep_title")}>
        <div ref={(el) => observer.observe(el)} class="w-full">
          <svg
            class="h-55 w-full"
            viewBox={`0 0 ${chart().width} ${chart().height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <Show
              when={sleepPoints().length > 0}
              fallback={
                <text
                  x={chart().width / 2}
                  y={chart().height / 2}
                  text-anchor="middle"
                  class="fill-muted text-[10px]"
                >
                  {t("myroutine.no_sleep_data")}
                </text>
              }
            >
              <For each={chart().gridLines}>
                {(line) => (
                  <>
                    <line
                      x1={chart().marginLeft}
                      y1={line.y}
                      x2={chart().width - chart().marginRight}
                      y2={line.y}
                      class="stroke-line"
                      stroke-width="1"
                    />
                    <text
                      x={chart().marginLeft - 6}
                      y={line.y + 3}
                      text-anchor="end"
                      class="fill-muted text-[10px]"
                    >
                      {line.label}
                    </text>
                  </>
                )}
              </For>
              <For each={chart().dayLabels}>
                {(label) => (
                  <text
                    x={label.x}
                    y={chart().height - 6}
                    text-anchor="middle"
                    class="fill-muted text-[10px]"
                  >
                    {label.day}
                  </text>
                )}
              </For>
              <polyline
                points={chart().polyline}
                fill="none"
                class="stroke-danger"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              <For each={chart().dots}>
                {(dot) => <circle cx={dot.cx} cy={dot.cy} r="3.5" class="fill-danger" />}
              </For>
            </Show>
          </svg>
        </div>

        <div class="mt-4 max-h-80 overflow-y-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th class="border border-line bg-surface-alt px-3 py-2 text-left font-semibold text-secondary">
                  {t("myroutine.day_col")}
                </th>
                <th class="border border-line bg-surface-alt px-3 py-2 text-left font-semibold text-secondary">
                  {t("myroutine.hours_slept_col")}
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={days()}>
                {(day) => (
                  <tr>
                    <td class="border border-line px-3 py-1.5 font-medium text-tertiary">{day}</td>
                    <td class="border border-line px-3 py-1.5">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        inputmode="decimal"
                        placeholder={t("myroutine.sleep_placeholder")}
                        class="h-8 w-24 rounded border border-line-input bg-surface px-2 text-sm text-primary focus:border-accent focus:outline-none"
                        value={sleepEntries()[dateKey(year(), month(), day)] ?? ""}
                        onChange={(e) => {
                          const value = e.currentTarget.value.trim();
                          const key = dateKey(year(), month(), day);
                          if (value !== "") setSleepEntry(key, Number(value));
                          else clearSleepEntry(key);
                        }}
                      />
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Habit entry modal */}
      <Show when={entryCtx()}>
        {(ctx) => {
          let container: HTMLDivElement | undefined;
          const titleId = createUniqueId();
          useDialogA11y(() => container, () => setEntryCtx(null));
          return (
          <div
            class="fixed inset-0 z-3000 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEntryCtx(null);
            }}
          >
            <div
              ref={container}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              class="w-[90%] max-w-90 animate-[modalFadeIn_0.3s_ease] rounded-3xl bg-surface p-6 pt-8 text-center shadow-2xl shadow-(color:--shadow-color-strong)"
            >
              <h2 id={titleId} class="mb-5 text-lg font-semibold text-primary">
                {ctx().habit.name} — {calendarNames().months_short[month() - 1]} {ctx().day}
              </h2>

              <div class="mb-4 flex justify-center gap-4">
                <button
                  type="button"
                  aria-label={t("myroutine.heatmap_done")}
                  aria-pressed={toggle() === "plus"}
                  class="flex size-12 cursor-pointer items-center justify-center rounded-xl border-2 text-lg transition-colors"
                  classList={{
                    "border-accent bg-accent text-accent-fill-text": toggle() === "plus",
                    "border-line text-secondary hover:border-accent": toggle() !== "plus",
                  }}
                  onClick={() => {
                    const active = toggle() === "plus";
                    setToggle(active ? null : "plus");
                    if (!active) setCount("");
                  }}
                >
                  <Check size={18} />
                </button>
                <button
                  type="button"
                  aria-label={t("myroutine.heatmap_missed")}
                  aria-pressed={toggle() === "x"}
                  class="flex size-12 cursor-pointer items-center justify-center rounded-xl border-2 text-lg transition-colors"
                  classList={{
                    "border-danger bg-danger text-white": toggle() === "x",
                    "border-line text-secondary hover:border-danger": toggle() !== "x",
                  }}
                  onClick={() => {
                    const active = toggle() === "x";
                    setToggle(active ? null : "x");
                    if (!active) setCount("");
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div class="mb-4 text-left">
                <label class="mb-1 block text-xs font-medium text-tertiary">
                  {t("myroutine.count_label")}
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder={t("myroutine.count_placeholder")}
                  disabled={toggle() !== null}
                  class="w-full disabled:opacity-50"
                  value={count()}
                  onInput={(e) => {
                    setCount(e.currentTarget.value);
                    if (e.currentTarget.value.trim() !== "") setToggle(null);
                  }}
                />
              </div>

              <button
                type="button"
                class="mb-4 cursor-pointer text-sm text-tertiary underline-offset-2 hover:text-danger hover:underline"
                onClick={() => {
                  clearHabitEntry(ctx().habit.id, ctx().dateStr);
                  setEntryCtx(null);
                }}
              >
                <Eraser size={14} class="mr-1.5 inline-block align-[-2px]" />
                {t("myroutine.clear_entry")}
              </button>

              <div class="flex gap-3">
                <button
                  type="button"
                  class="flex-1 cursor-pointer rounded-xl bg-hover px-4 py-3 text-sm font-medium text-secondary transition-colors hover:bg-line"
                  onClick={() => setEntryCtx(null)}
                >
                  <X size={15} class="mr-1.5 inline-block align-[-2px]" />
                  {t("common.cancel")}
                </button>
                <Button variant="primary" class="flex-1 rounded-xl px-4 py-3" onClick={saveEntry}>
                  <Check size={15} class="mr-1.5 inline-block align-[-2px]" />
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </div>
          );
        }}
      </Show>

      {/* Delete habit modal */}
      <ConfirmModal
        open={pendingDelete() !== null}
        icon={Trash2}
        title={t("myroutine.delete_habit_title")}
        body={
          <>
            <p>{t("myroutine.delete_habit_body1")}</p>
            <p>{t("myroutine.delete_habit_body2")}</p>
            <p class="mt-2 rounded-lg border-l-3 border-danger bg-surface-alt px-3 py-2 font-semibold text-primary">
              "{pendingDelete()?.name}"
            </p>
          </>
        }
        cancelText={t("common.cancel")}
        confirmText={t("common.confirm_delete")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const habit = pendingDelete();
          if (habit) deleteHabit(habit.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
