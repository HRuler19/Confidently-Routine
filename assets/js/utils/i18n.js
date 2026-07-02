// Language runtime: lookup/translate strings, persist the chosen language,
// and (re)apply translations to the DOM. Plain global script (like
// dom-helpers.js) so it can run before the bundle and be used by the
// non-module page scripts (routines.js, notes.js, settings.js, my-routine.js).
window.I18n = (function () {
  "use strict";

  const STORAGE_KEY = "confidently_language";
  const SUPPORTED_LANGUAGES = ["en", "tk", "ru", "tr"];
  const DEFAULT_LANGUAGE = "en";

  function getLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
    } catch (e) {
      console.error("Language storage error:", e);
    }
    return DEFAULT_LANGUAGE;
  }

  function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error("Language storage error:", e);
    }
    applyTranslations();
    window.dispatchEvent(new CustomEvent("languageChange", { detail: { language: lang } }));
  }

  function resolve(dict, path) {
    return path.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
  }

  function t(key, vars) {
    const lang = getLanguage();
    const dict = window.I18nDictionary || {};
    let value = resolve(dict[lang], key);
    if (value === undefined) value = resolve(dict[DEFAULT_LANGUAGE], key);
    if (value === undefined) return key;

    if (vars) {
      return value.replace(/\{(\w+)\}/g, (match, name) =>
        vars[name] !== undefined ? vars[name] : match,
      );
    }
    return value;
  }

  function readVars(el) {
    if (!el.dataset.i18nVars) return null;
    try {
      return JSON.parse(el.dataset.i18nVars);
    } catch (e) {
      return null;
    }
  }

  function applyTranslations(root) {
    const scope = root || document;

    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n, readVars(el));
    });

    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder, readVars(el));
    });

    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = t(el.dataset.i18nTitle, readVars(el));
    });

    scope.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel, readVars(el)));
    });

    // Custom-select triggers show a copy of the selected option's text
    // (set by DomHelpers.initCustomSelects, not via data-i18n), so after
    // translating the option list, re-sync each trigger to match whichever
    // option is currently selected. The header language switcher shows a
    // short code instead of the full option text, so it manages its own
    // trigger and is excluded here.
    scope.querySelectorAll(".custom-select[data-value]:not(.lang-select)").forEach((select) => {
      const selected = select.querySelector(
        `.option[data-value="${select.dataset.value}"]`,
      );
      const triggerSpan = select.querySelector(".select-trigger span");
      if (selected && triggerSpan) {
        triggerSpan.textContent = selected.textContent;
      }
    });
  }

  function flatpickrLocale() {
    const lang = getLanguage();
    const dict = window.I18nDictionary || {};
    const calendar = (dict[lang] && dict[lang].calendar) || dict[DEFAULT_LANGUAGE].calendar;

    return {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: calendar.weekdays_short,
        longhand: calendar.weekdays_long,
      },
      months: {
        shorthand: calendar.months_short,
        longhand: calendar.months_long,
      },
    };
  }

  return {
    SUPPORTED_LANGUAGES,
    getLanguage,
    setLanguage,
    t,
    applyTranslations,
    flatpickrLocale,
  };
})();
