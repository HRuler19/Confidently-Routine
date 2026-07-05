// Reactive i18n runtime. Same storage key and dictionary as the vanilla
// app, but exposed as a Solid signal so any component using t() re-renders
// automatically when the language changes.
import { createSignal } from "solid-js";
import { dictionary } from "./translations";

const STORAGE_KEY = "confidently_language";
export const SUPPORTED_LANGUAGES = ["en", "tk", "ru", "tr"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
const DEFAULT_LANGUAGE: Language = "en";

function readStored(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
  } catch (e) {
    console.error("Language storage error:", e);
  }
  return DEFAULT_LANGUAGE;
}

const [language, setLanguageSignal] = createSignal<Language>(readStored());

export { language };

export function setLanguage(lang: Language) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.error("Language storage error:", e);
  }
  setLanguageSignal(lang);
}

function resolve(dict: any, path: string): any {
  return path.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const lang = language();
  let value = resolve(dictionary[lang], key);
  if (value === undefined) value = resolve(dictionary[DEFAULT_LANGUAGE], key);
  if (value === undefined) return key;

  if (vars) {
    return String(value).replace(/\{(\w+)\}/g, (match, name) =>
      vars[name] !== undefined ? String(vars[name]) : match,
    );
  }
  return String(value);
}

/** Localized month/weekday names for the calendar UI. */
export function calendarNames() {
  const lang = language();
  const cal = (dictionary[lang] && dictionary[lang].calendar) || dictionary[DEFAULT_LANGUAGE].calendar;
  return cal as {
    weekdays_short: string[];
    weekdays_long: string[];
    months_short: string[];
    months_long: string[];
  };
}
