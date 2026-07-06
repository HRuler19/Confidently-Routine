// Shared per-habit color assignment. A fixed palette indexed by the
// habit's position keeps the same habit's color stable across the
// Dashboard's charts, My Routine's heatmap, and anywhere else that
// needs to tell habits apart at a glance.
const LIGHT_PALETTE = ["#0e5e0a", "#0066ff", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];
const DARK_PALETTE = ["#2d9b27", "#58a6ff", "#d29922", "#f87171", "#a371f7", "#56d4dd"];

export function habitPalette(isDark: boolean): string[] {
  return isDark ? DARK_PALETTE : LIGHT_PALETTE;
}

export function habitColor(index: number, isDark: boolean): string {
  const palette = habitPalette(isDark);
  return palette[index % palette.length];
}
