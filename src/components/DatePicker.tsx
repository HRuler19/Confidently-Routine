// Custom localized date picker — replaces native <input type="date">, which
// renders the OS/browser's own calendar chrome and ignores our i18n entirely
// (weekday/month names always show in the OS locale, not the app language).
// Popover mechanics mirror Select.tsx: bordered trigger + floating panel,
// closes on outside click or Escape.
import { createSignal, createMemo, For, Show, onCleanup } from "solid-js";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-solid";
import { calendarNames, t } from "../lib/i18n";
import { pad, todayStr } from "../lib/dates";
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
  let root: HTMLDivElement | undefined;

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

  function openPanel() {
    setView(parseValue(props.value || todayStr()));
    setOpen(true);
  }

  function pick(date: string) {
    props.onChange(date);
    setOpen(false);
  }

  return (
    <div ref={root} class={`relative ${props.class ?? ""}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open()}
        aria-haspopup="dialog"
        aria-label={props.ariaLabel}
        class="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-line-input bg-surface px-3 text-sm text-primary transition-colors hover:border-accent focus:border-accent focus:outline-none"
        onClick={() => (open() ? setOpen(false) : openPanel())}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
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
          <div class="grid grid-cols-7 gap-y-1 text-center">
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
                    class="mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm transition-colors hover:bg-hover"
                    classList={{
                      "text-primary": cell.inMonth && !isSelected(),
                      "text-tertiary": !cell.inMonth && !isSelected(),
                      "bg-accent! text-white! hover:bg-accent!": isSelected(),
                      "ring-1 ring-accent ring-inset": isToday() && !isSelected(),
                    }}
                    onClick={() => pick(cell.date)}
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
