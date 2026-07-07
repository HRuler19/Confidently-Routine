// Dependency-free SVG chart components — Solid port of the vanilla
// window.Charts renderers (bar / line / progress ring). Geometry and
// visual rules match the originals; responsiveness comes from a
// ResizeObserver on each chart's wrapper instead of a global listener.
import { createSignal, createMemo, createUniqueId, For, Show, onCleanup, type JSX } from "solid-js";

function useMeasuredWidth(fallback: number, min: number) {
  const [width, setWidth] = createSignal(fallback);
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setWidth(Math.max(min, w));
    }
  });
  onCleanup(() => observer.disconnect());
  return { width, observe: (el: Element) => observer.observe(el) };
}

const AXIS_LABEL = "fill-muted text-[10px]";
const VALUE_LABEL = "fill-secondary text-[10px] font-medium";
const EMPTY_LABEL = "fill-muted text-[11px]";

// ── Bar chart ───────────────────────────────────────────────────────────
interface BarChartProps {
  labels: string[];
  values: number[];
  color: string;
  emptyMessage: string;
  height?: number;
}

export function BarChart(props: BarChartProps): JSX.Element {
  const { width, observe } = useMeasuredWidth(400, 220);
  const height = () => props.height ?? 200;
  const gradId = createUniqueId();

  const geometry = createMemo(() => {
    const w = width();
    const h = height();
    const marginTop = 22;
    const marginBottom = 24;
    const marginSide = 6;
    const plotWidth = w - marginSide * 2;
    const plotHeight = h - marginTop - marginBottom;

    const maxValue = Math.max(...props.values, 1);
    const n = props.labels.length;
    const gap = Math.min(10, plotWidth / Math.max(n, 1) / 4);
    const barWidth = Math.max(3, (plotWidth - gap * (n - 1)) / Math.max(n, 1));
    const labelStep = Math.max(1, Math.ceil((n * 24) / plotWidth));

    return props.values.map((value, i) => {
      const x = marginSide + i * (barWidth + gap);
      const barHeight = (value / maxValue) * plotHeight;
      const y = marginTop + (plotHeight - Math.max(0, barHeight));
      return {
        x,
        y,
        barWidth,
        barHeight: Math.max(0, barHeight),
        value,
        label: props.labels[i],
        showLabel: i % labelStep === 0,
      };
    });
  });

  const hasData = () => props.labels.length > 0 && props.values.some((v) => v > 0);

  return (
    <div ref={observe} class="w-full">
      <svg class="w-full" style={{ height: `${height()}px` }} viewBox={`0 0 ${width()} ${height()}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={props.color} stop-opacity="0.95" />
            <stop offset="100%" stop-color={props.color} stop-opacity="0.5" />
          </linearGradient>
        </defs>
        <Show
          when={hasData()}
          fallback={
            <text x={width() / 2} y={height() / 2} text-anchor="middle" class={EMPTY_LABEL}>
              {props.emptyMessage}
            </text>
          }
        >
          <For each={geometry()}>
            {(bar) => (
              <>
                <rect
                  class="bar-rise"
                  x={bar.x.toFixed(1)}
                  y={bar.y.toFixed(1)}
                  width={bar.barWidth.toFixed(1)}
                  height={bar.barHeight.toFixed(1)}
                  rx="4"
                  fill={`url(#${gradId})`}
                />
                <Show when={bar.value > 0}>
                  <text
                    x={(bar.x + bar.barWidth / 2).toFixed(1)}
                    y={Math.max(10, bar.y - 6).toFixed(1)}
                    text-anchor="middle"
                    class={VALUE_LABEL}
                  >
                    {bar.value}
                  </text>
                </Show>
                <Show when={bar.showLabel}>
                  <text
                    x={(bar.x + bar.barWidth / 2).toFixed(1)}
                    y={(height() - 8).toFixed(1)}
                    text-anchor="middle"
                    class={AXIS_LABEL}
                  >
                    {bar.label}
                  </text>
                </Show>
              </>
            )}
          </For>
        </Show>
      </svg>
    </div>
  );
}

// ── Line chart ──────────────────────────────────────────────────────────
interface LineChartProps {
  labels: string[];
  values: number[];
  color: string;
  emptyMessage: string;
  /** Sleep-style data skips missing days; habit-style keeps 0 as a point. */
  skipEmptyValues?: boolean;
  height?: number;
}

export function LineChart(props: LineChartProps): JSX.Element {
  const { width, observe } = useMeasuredWidth(600, 280);
  const height = () => props.height ?? 200;
  const gradId = createUniqueId();

  const points = createMemo(() => {
    const skip = props.skipEmptyValues ?? true;
    const result: { index: number; value: number }[] = [];
    props.values.forEach((value, i) => {
      const has = skip
        ? value !== null && value !== undefined && value > 0
        : value !== null && value !== undefined;
      if (has) result.push({ index: i, value });
    });
    return result;
  });

  const geometry = createMemo(() => {
    const w = width();
    const h = height();
    const marginLeft = 28;
    const marginRight = 12;
    const marginTop = 16;
    const marginBottom = 22;
    const plotWidth = w - marginLeft - marginRight;
    const plotHeight = h - marginTop - marginBottom;
    const pts = points();

    let minVal = 0;
    let maxVal = 1;
    if (pts.length > 0) {
      minVal = Math.min(0, Math.min(...pts.map((p) => p.value)));
      maxVal = Math.max(...pts.map((p) => p.value));
      maxVal += Math.max(1, maxVal * 0.15);
      if (minVal === maxVal) {
        minVal -= 1;
        maxVal += 1;
      }
    }

    const n = props.labels.length;
    const xFor = (i: number) => marginLeft + (n <= 1 ? 0 : (i / (n - 1)) * plotWidth);
    const yFor = (v: number) => marginTop + plotHeight * (1 - (v - minVal) / (maxVal - minVal));

    const labelStep = Math.max(1, Math.ceil((n * 24) / plotWidth));
    const axisLabels: { x: number; text: string }[] = [];
    for (let i = 0; i < n; i += labelStep) {
      axisLabels.push({ x: xFor(i), text: props.labels[i] });
    }

    const baseline = marginTop + plotHeight;
    const linePoints = pts.map((p) => `${xFor(p.index).toFixed(1)},${yFor(p.value).toFixed(1)}`);
    const areaPath =
      pts.length > 0
        ? `M ${xFor(pts[0].index).toFixed(1)},${baseline.toFixed(1)} L ${linePoints.join(
            " L ",
          )} L ${xFor(pts[pts.length - 1].index).toFixed(1)},${baseline.toFixed(1)} Z`
        : "";

    return {
      gridYs: [0, 0.5, 1].map((t) => marginTop + plotHeight * t),
      axisLabels,
      polyline: linePoints.join(" "),
      areaPath,
      dots: pts.map((p) => ({ cx: xFor(p.index), cy: yFor(p.value) })),
      marginLeft,
      marginRight,
    };
  });

  return (
    <div ref={observe} class="w-full">
      <svg class="w-full" style={{ height: `${height()}px` }} viewBox={`0 0 ${width()} ${height()}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={props.color} stop-opacity="0.28" />
            <stop offset="100%" stop-color={props.color} stop-opacity="0" />
          </linearGradient>
        </defs>
        <Show
          when={points().length > 0}
          fallback={
            <text x={width() / 2} y={height() / 2} text-anchor="middle" class={EMPTY_LABEL}>
              {props.emptyMessage}
            </text>
          }
        >
          <path d={geometry().areaPath} fill={`url(#${gradId})`} stroke="none" />
          <For each={geometry().gridYs}>
            {(y) => (
              <line
                x1={geometry().marginLeft}
                y1={y.toFixed(1)}
                x2={width() - geometry().marginRight}
                y2={y.toFixed(1)}
                class="stroke-line"
                stroke-width="1"
              />
            )}
          </For>
          <For each={geometry().axisLabels}>
            {(label) => (
              <text x={label.x.toFixed(1)} y={height() - 6} text-anchor="middle" class={AXIS_LABEL}>
                {label.text}
              </text>
            )}
          </For>
          <polyline
            points={geometry().polyline}
            fill="none"
            stroke={props.color}
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <For each={geometry().dots}>
            {(dot) => (
              <circle
                cx={dot.cx.toFixed(1)}
                cy={dot.cy.toFixed(1)}
                r="3.5"
                fill={props.color}
                class="stroke-surface"
                stroke-width="2"
              />
            )}
          </For>
        </Show>
      </svg>
    </div>
  );
}

// ── Progress ring ───────────────────────────────────────────────────────
interface ProgressRingProps {
  percent: number;
  color: string;
  centerLabel: string;
  size?: number;
}

export function ProgressRing(props: ProgressRingProps): JSX.Element {
  const size = () => props.size ?? 120;
  const gradId = createUniqueId();

  const geometry = createMemo(() => {
    const s = size();
    const strokeWidth = Math.max(6, s * 0.09);
    const radius = s / 2 - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, props.percent));
    return {
      strokeWidth,
      radius,
      circumference,
      offset: circumference * (1 - clamped / 100),
      center: s / 2,
      fontSize: Math.max(11, s * 0.15),
    };
  });

  return (
    <svg width={size()} height={size()} viewBox={`0 0 ${size()} ${size()}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color={props.color} stop-opacity="1" />
          <stop offset="100%" stop-color={props.color} stop-opacity="0.65" />
        </linearGradient>
      </defs>
      <circle
        cx={geometry().center}
        cy={geometry().center}
        r={geometry().radius}
        fill="none"
        class="stroke-hover"
        stroke-width={geometry().strokeWidth}
      />
      <circle
        class="ring-fill"
        cx={geometry().center}
        cy={geometry().center}
        r={geometry().radius}
        fill="none"
        stroke={`url(#${gradId})`}
        stroke-width={geometry().strokeWidth}
        stroke-linecap="round"
        stroke-dasharray={geometry().circumference.toFixed(2)}
        stroke-dashoffset={geometry().offset.toFixed(2)}
        style={{ "--ring-circ": geometry().circumference.toFixed(2) }}
        transform={`rotate(-90 ${geometry().center} ${geometry().center})`}
      />
      <text
        x={geometry().center}
        y={geometry().center}
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-primary font-semibold"
        style={{ "font-size": `${geometry().fontSize}px` }}
      >
        {props.centerLabel}
      </text>
    </svg>
  );
}
