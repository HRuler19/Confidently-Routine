// Theme runtime: persist + apply the chosen light/dark theme. Plain global
// script (like i18n.js / dom-helpers.js) so it can run early and be used
// by the non-module page scripts.
window.Theme = (function () {
  "use strict";

  const STORAGE_KEY = "confidently_theme";
  const SUPPORTED_THEMES = ["light", "dark"];
  const DEFAULT_THEME = "light";

  function getTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_THEMES.includes(stored)) return stored;
    } catch (e) {
      console.error("Theme storage error:", e);
    }
    return DEFAULT_THEME;
  }

  function setTheme(theme) {
    if (!SUPPORTED_THEMES.includes(theme)) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.error("Theme storage error:", e);
    }
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent("themeChange", { detail: { theme } }));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  return {
    SUPPORTED_THEMES,
    getTheme,
    setTheme,
    applyTheme,
  };
})();
