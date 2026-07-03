// Shared, dependency-free SVG chart renderers used by the Dashboard page.
// Plain global script (like dom-helpers.js / i18n.js) so any page module
// can call window.Charts without a build step.
window.Charts = (function () {
  "use strict";

  // Every mounted chart registers its own redraw function here so a single
  // debounced resize listener can keep all of them responsive, instead of
  // each chart wiring its own resize handler.
  const registry = new Map();

  function register(svg, drawFn) {
    registry.set(svg, drawFn);
    drawFn();
  }

  function renderBarChart(svg, options) {
    if (!svg) return;
    register(svg, () => drawBarChart(svg, options));
  }

  function renderProgressRing(svg, options) {
    if (!svg) return;
    register(svg, () => drawProgressRing(svg, options));
  }

  function renderLineChart(svg, options) {
    if (!svg) return;
    register(svg, () => drawLineChart(svg, options));
  }

  function drawBarChart(svg, options) {
    const {
      labels = [],
      values = [],
      color = "#0e5e0a",
      formatValue,
      emptyMessage = "",
    } = options;

    const width = Math.max(
      220,
      Math.round((svg.parentElement && svg.parentElement.clientWidth) || 400),
    );
    const height = Math.max(110, Math.round(svg.clientHeight || 200));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const hasData = labels.length > 0 && values.some((v) => v > 0);
    if (!hasData) {
      svg.innerHTML = emptyMessage
        ? `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" class="chart-empty-label">${emptyMessage}</text>`
        : "";
      return;
    }

    const marginTop = 22;
    const marginBottom = 24;
    const marginSide = 6;
    const plotWidth = width - marginSide * 2;
    const plotHeight = height - marginTop - marginBottom;

    const maxValue = Math.max(...values, 1);
    const n = labels.length;
    const gap = Math.min(10, plotWidth / n / 4);
    const barWidth = Math.max(3, (plotWidth - gap * (n - 1)) / n);
    const labelStep = Math.max(1, Math.ceil((n * 24) / plotWidth));

    let html = "";
    values.forEach((value, i) => {
      const x = marginSide + i * (barWidth + gap);
      const barHeight = (value / maxValue) * plotHeight;
      const y = marginTop + (plotHeight - Math.max(0, barHeight));

      html += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(0, barHeight).toFixed(1)}" rx="3" class="chart-bar" style="fill:${color}" />`;

      if (value > 0) {
        const displayValue = formatValue ? formatValue(value) : value;
        html += `<text x="${(x + barWidth / 2).toFixed(1)}" y="${Math.max(10, y - 6).toFixed(1)}" text-anchor="middle" class="chart-value-label">${displayValue}</text>`;
      }

      if (i % labelStep === 0) {
        html += `<text x="${(x + barWidth / 2).toFixed(1)}" y="${(height - 8).toFixed(1)}" text-anchor="middle" class="chart-axis-label">${labels[i]}</text>`;
      }
    });

    svg.innerHTML = html;
  }

  function drawLineChart(svg, options) {
    const {
      labels = [],
      values = [],
      color = "#0e5e0a",
      emptyMessage = "",
      // Sleep-style data (hours slept) should skip days with no entry at
      // all; habit-style data treats 0 ("not done") as a real point so the
      // line actually rises and falls with the habit's rhythm.
      skipEmptyValues = true,
    } = options;

    const width = Math.max(
      280,
      Math.round((svg.parentElement && svg.parentElement.clientWidth) || 600),
    );
    const height = Math.max(100, Math.round(svg.clientHeight || 200));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const points = [];
    values.forEach((value, i) => {
      const has = skipEmptyValues
        ? value !== null && value !== undefined && value > 0
        : value !== null && value !== undefined;
      if (has) points.push({ index: i, value });
    });

    if (points.length === 0) {
      svg.innerHTML = emptyMessage
        ? `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" class="chart-empty-label">${emptyMessage}</text>`
        : "";
      return;
    }

    const marginLeft = 28;
    const marginRight = 12;
    const marginTop = 16;
    const marginBottom = 22;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    let minVal = Math.min(0, Math.min(...points.map((p) => p.value)));
    let maxVal = Math.max(...points.map((p) => p.value));
    maxVal += Math.max(1, maxVal * 0.15);
    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }

    const n = labels.length;
    const xFor = (i) => marginLeft + (n <= 1 ? 0 : (i / (n - 1)) * plotWidth);
    const yFor = (v) => marginTop + plotHeight * (1 - (v - minVal) / (maxVal - minVal));

    let html = "";

    [0, 0.5, 1].forEach((t) => {
      const y = marginTop + plotHeight * t;
      html += `<line x1="${marginLeft}" y1="${y.toFixed(1)}" x2="${width - marginRight}" y2="${y.toFixed(1)}" class="chart-grid-line" />`;
    });

    const labelStep = Math.max(1, Math.ceil((n * 24) / plotWidth));
    for (let i = 0; i < n; i += labelStep) {
      html += `<text x="${xFor(i).toFixed(1)}" y="${(height - 6).toFixed(1)}" text-anchor="middle" class="chart-axis-label">${labels[i]}</text>`;
    }

    const linePoints = points
      .map((p) => `${xFor(p.index).toFixed(1)},${yFor(p.value).toFixed(1)}`)
      .join(" ");
    html += `<polyline points="${linePoints}" class="chart-line" style="stroke:${color}" />`;

    points.forEach((p) => {
      html += `<circle cx="${xFor(p.index).toFixed(1)}" cy="${yFor(p.value).toFixed(1)}" r="3" class="chart-line-point" style="fill:${color}" />`;
    });

    svg.innerHTML = html;
  }

  function drawProgressRing(svg, options) {
    const { percent = 0, color = "#0e5e0a", centerLabel = "" } = options;

    const size = Math.max(70, Math.round(svg.clientWidth || 120));
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

    const strokeWidth = Math.max(6, size * 0.09);
    const radius = size / 2 - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, percent));
    const offset = circumference * (1 - clamped / 100);
    const center = size / 2;
    const fontSize = Math.max(11, size * 0.15);

    svg.innerHTML = `
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" class="chart-ring-track" stroke-width="${strokeWidth}" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke-width="${strokeWidth}"
        stroke-linecap="round" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
        transform="rotate(-90 ${center} ${center})" style="stroke:${color}" />
      <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" class="chart-ring-label" style="font-size:${fontSize}px">${centerLabel}</text>
    `;
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      registry.forEach((drawFn, svg) => {
        if (document.body.contains(svg)) {
          drawFn();
        } else {
          registry.delete(svg);
        }
      });
    }, 150);
  });

  return {
    renderBarChart,
    renderLineChart,
    renderProgressRing,
  };
})();
