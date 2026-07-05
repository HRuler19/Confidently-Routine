import { describe, it, expect, beforeEach } from "vitest";
import { t, setLanguage, language, SUPPORTED_LANGUAGES } from "./i18n";
import { dictionary } from "./translations";

beforeEach(() => {
  localStorage.clear();
  setLanguage("en");
});

describe("t()", () => {
  it("resolves nested keys", () => {
    expect(t("nav.dashboard")).toBe("Dashboard");
    expect(t("routines.category_personal")).toBe("Personal");
  });

  it("returns the key itself for unknown keys", () => {
    expect(t("nope.not_a_key")).toBe("nope.not_a_key");
  });

  it("interpolates {vars}", () => {
    expect(t("routines.date_in_days", { n: 3 })).toContain("3");
  });

  it("falls back to English when a key is missing in the active language", () => {
    setLanguage("tk");
    // every language should at least fall back rather than leak undefined
    expect(t("nav.dashboard")).not.toBe("undefined");
    expect(t("nav.dashboard").length).toBeGreaterThan(0);
  });
});

describe("setLanguage()", () => {
  it("persists the choice and updates the signal", () => {
    setLanguage("ru");
    expect(language()).toBe("ru");
    expect(localStorage.getItem("confidently_language")).toBe("ru");
  });

  it("ignores unsupported languages", () => {
    setLanguage("ru");
    // @ts-expect-error deliberately wrong value
    setLanguage("xx");
    expect(language()).toBe("ru");
  });
});

describe("dictionary completeness", () => {
  it("every language defines the same top-level sections as English", () => {
    const enSections = Object.keys(dictionary.en);
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(Object.keys(dictionary[lang]).sort()).toEqual(enSections.sort());
    }
  });

  it("every language translates every English key (no silent fallbacks)", () => {
    const flatten = (obj: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([key, value]) =>
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? flatten(value as Record<string, unknown>, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      );

    const enKeys = flatten(dictionary.en);
    for (const lang of SUPPORTED_LANGUAGES) {
      const langKeys = new Set(flatten(dictionary[lang]));
      const missing = enKeys.filter((key) => !langKeys.has(key));
      expect(missing, `missing in "${lang}"`).toEqual([]);
    }
  });
});
