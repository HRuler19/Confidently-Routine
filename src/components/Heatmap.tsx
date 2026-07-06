// GitHub-style contribution heatmap for one habit's whole year. Pure
// geometry comes from lib/heatmap.ts; this just lays out CSS grid cells
// and colors them by level using the habit's assigned accent color.
import { For, createMemo } from "solid-js";
import { buildYearHeatmap } from "../lib/heatmap";
import { habitEntries } from "../lib/stores";
import { calendarNames, t } from "../lib/i18n";

const LEVEL_OPACITY = [0, 0.25, 0.5, 0.75, 1];

function cellTitle(date: string, level: number, missed: boolean): string {
  const status = level > 0 ? t("myroutine.heatmap_done") : missed ? t("myroutine.heatmap_missed") : t("myroutine.heatmap_no_data");
  return `${date} — ${status}`;
}

export default function Heatmap(props: { habitId: number; year: number; color: string }) {
  const data = createMemo(() =>
    buildYearHeatmap(habitEntries(), props.habitId, props.year, calendarNames().months_short),
  );

  return (
    <div class="overflow-x-auto pb-1">
      <div
        class="grid w-fit gap-[3px]"
        style={{
          "grid-template-columns": `repeat(${data().weekCount}, 11px)`,
          "grid-template-rows": "12px repeat(7, 11px)",
        }}
      >
        <For each={data().monthLabels}>
          {(m) => (
            <div
              class="text-[10px] leading-3 text-muted"
              style={{ "grid-column": m.col, "grid-row": 1 }}
            >
              {m.label}
            </div>
          )}
        </For>
        <For each={data().cells}>
          {(cell) => (
            <div
              title={cellTitle(cell.date, cell.level, cell.missed)}
              class="size-[11px] rounded-[2px]"
              classList={{ "outline outline-1 -outline-offset-1 outline-danger/50": cell.missed }}
              style={{
                "grid-column": cell.col,
                "grid-row": cell.row + 1,
                "background-color": cell.level === 0 ? "var(--bg-hover)" : props.color,
                opacity: cell.level === 0 ? 1 : LEVEL_OPACITY[cell.level],
              }}
            />
          )}
        </For>
      </div>
    </div>
  );
}
