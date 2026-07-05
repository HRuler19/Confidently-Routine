// Reactive theme runtime. Same storage key + data-theme attribute contract
// as the vanilla app (the inline script in index.html applies it pre-paint).
import { createSignal } from "solid-js";

const STORAGE_KEY = "confidently_theme";
export const SUPPORTED_THEMES = ["light", "dark"] as const;
export type Theme = (typeof SUPPORTED_THEMES)[number];
const DEFAULT_THEME: Theme = "light";

function readStored(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_THEMES as readonly string[]).includes(stored)) {
      return stored as Theme;
    }
  } catch (e) {
    console.error("Theme storage error:", e);
  }
  return DEFAULT_THEME;
}

const [theme, setThemeSignal] = createSignal<Theme>(readStored());

export { theme };

export function setTheme(next: Theme) {
  if (!SUPPORTED_THEMES.includes(next)) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch (e) {
    console.error("Theme storage error:", e);
  }
  document.documentElement.setAttribute("data-theme", next);
  setThemeSignal(next);
}
