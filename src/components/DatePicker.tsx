// Custom localized date picker — replaces native <input type="date">, which
// renders the OS/browser's own calendar chrome and ignores our i18n entirely
// (weekday/month names always show in the OS locale, not the app language).
// Popover mechanics mirror Select.tsx: bordered trigger + floating panel,
// closes on outside click or Escape.
//
// The day grid follows the ARIA APG "date picker dialog" keyboard pattern:
// real DOM focus moves between day buttons via a roving tabindex (only the
// "focused" day is in the tab order), arrow keys move it by day/week,
// PageUp/PageDown by month, and Home/End jump to the current week's ends.
import { createSignal, createMemo, createEffect, For, Show, onCleanup } from "solid-js";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-solid";
import { calendarNames, t } from "../lib/i18n";
import { todayStr, toDateStr, dateKey, daysInMonth } from "../lib/dates";
import { buildMonthGrid, toMondayFirst, shiftMonth } from "../lib/dateGrid";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  class?: string;
  ariaLabel?: string;
}

function parseValue(value: string): { year: number; month: number } {
  const [y, m] = value.split("-").map(Number);
  if (y && m) return { year: y, month: m };
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

export default function DatePicker(props: DatePickerProps) {
  const [open, setOpen] = createSignal(false);
  const [view, setView] = createSignal(parseValue(props.value || todayStr()));
  const [focusedDate, setFocusedDate] = createSignal(props.value || todayStr());
  let root: HTMLDivElement | undefined;
  let triggerBtn: HTMLButtonElement | undefined;
  let gridEl: HTMLDivElement | undefined;

  const onDocClick = (e: MouseEvent) => {
    if (root && !root.contains(e.target as Node)) setOpen(false);
  };
  document.addEventListener("click", onDocClick);
  onCleanup(() => document.removeEventListener("click", onDocClick));

  const weekdays = createMemo(() => toMondayFirst(calendarNames().weekdays_short));
  const grid = createMemo(() => buildMonthGrid(view().year, view().month));

  const monthLabel = createMemo(() => {
    const names = calendarNames();
    return `${names.months_long[view().month - 1]} ${view().year}`;
  });

  const displayValue = createMemo(() => {
    if (!props.value) return "";
    const { year, month } = parseValue(props.value);
    const day = Number(props.value.split("-")[2]);
    const names = calendarNames();
    return `${day} ${names.months_short[month - 1]} ${year}`;
  });

  // Keep DOM focus on the "virtually focused" day whenever it (or the open
  // panel) changes - this is what makes arrow-key navigation actually move
  // the browser's focus, not just an internal signal.
  createEffect(() => {
    if (!open()) return;
    const target = focusedDate();
    gridEl?.querySelector<HTMLButtonElement>(`[data-day="${target}"]`)?.focus();
  });

  function openPanel() {
    const initial = props.value || todayStr();
    setView(parseValue(initial));
    setFocusedDate(initial);
    setOpen(true);
  }

  function pick(date: string) {
    props.onChange(date);
    setOpen(false);
  }

  /** Only updates `view` (and so re-renders the whole grid) when the target
      date actually falls in a different month - staying within the visible
      month just moves focus, no need to rebuild the grid for that. */
  function syncViewToDate(dateStr: string) {
    const { year, month } = parseValue(dateStr);
    const current = view();
    if (current.year !== year || current.month !== month) setView({ year, month });
  }

  function moveFocusedDate(deltaDays: number) {
    const [y, m, d] = focusedDate().split("-").map(Number);
    const next = toDateStr(new Date(y, m - 1, d + deltaDays));
    setFocusedDate(next);
    syncViewToDate(next);
  }

  function moveFocusedMonth(deltaMonths: number) {
    const [y, m, d] = focusedDate().split("-").map(Number);
    const shifted = shiftMonth(y, m, deltaMonths);
    const clampedDay = Math.min(d, daysInMonth(shifted.year, shifted.month));
    const next = dateKey(shifted.year, shifted.month, clampedDay);
    setFocusedDate(next);
    setView(shifted);
  }

  function handleGridKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveFocusedDate(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocusedDate(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocusedDate(7);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocusedDate(-7);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      moveFocusedMonth(-1);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      moveFocusedMonth(1);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const [y, m, d] = focusedDate().split("-").map(Number);
      const mondayFirstDow = (new Date(y, m - 1, d).getDay() + 6) % 7;
      moveFocusedDate(e.key === "Home" ? -mondayFirstDow : 6 - mondayFirstDow);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focusedDate());
      triggerBtn?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerBtn?.focus();
    }
  }

  return (
    <div ref={root} class={`relative ${props.class ?? ""}`}>
      <button
        ref={triggerBtn}
        type="button"
        role="combobox"
        aria-expanded={open()}
        aria-haspopup="dialog"
        aria-label={props.ariaLabel}
        class="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-line-input bg-surface px-3 text-sm text-primary transition-colors hover:border-accent focus:border-accent focus:outline-none"
        onClick={() => (open() ? setOpen(false) : openPanel())}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "ArrowDown" && !open()) {
            e.preventDefault();
            openPanel();
          }
        }}
      >
        <Calendar size={15} class="shrink-0 text-tertiary" />
        <span class="truncate" classList={{ "text-tertiary": !displayValue() }}>
          {displayValue() || t("routines.select_date_placeholder")}
        </span>
      </button>
      <Show when={open()}>
        <div
          role="dialog"
          class="absolute left-0 top-full z-1200 mt-1 w-64 rounded-lg border border-line bg-surface p-3 shadow-lg shadow-(color:--shadow-color-strong)"
        >
          <div class="mb-2 flex items-center justify-between">
            <button
              type="button"
              class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors hover:bg-hover"
              onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}
              aria-label={t("common.previous_month")}
            >
              <ChevronLeft size={16} />
            </button>
            <span class="text-sm font-medium text-primary">{monthLabel()}</span>
            <button
              type="button"
              class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors hover:bg-hover"
              onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}
              aria-label={t("common.next_month")}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div ref={gridEl} class="grid grid-cols-7 gap-y-1 text-center" onKeyDown={handleGridKeyDown}>
            <For each={weekdays()}>
              {(wd) => <span class="text-xs font-medium text-tertiary">{wd}</span>}
            </For>
            <For each={grid()}>
              {(cell) => {
                const isSelected = () => cell.date === props.value;
                const isToday = () => cell.date === todayStr();
                return (
                  <button
                    type="button"
                    data-day={cell.date}
                    tabIndex={cell.date === focusedDate() ? 0 : -1}
                    class="mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    classList={{
                      "text-primary": cell.inMonth && !isSelected(),
                      "text-tertiary": !cell.inMonth && !isSelected(),
                      "bg-accent! text-white! hover:bg-accent!": isSelected(),
                      "ring-1 ring-accent ring-inset": isToday() && !isSelected(),
                    }}
                    onClick={() => {
                      setFocusedDate(cell.date);
                      pick(cell.date);
                    }}
                  >
                    {cell.day}
                  </button>
                );
              }}
            </For>
          </div>
          <button
            type="button"
            class="mt-2 w-full cursor-pointer rounded-md py-1.5 text-center text-sm font-medium text-accent transition-colors hover:bg-hover"
            onClick={() => pick(todayStr())}
          >
            {t("routines.date_today")}
          </button>
        </div>
      </Show>
    </div>
  );
}
