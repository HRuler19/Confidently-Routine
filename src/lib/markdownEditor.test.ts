import { describe, it, expect } from "vitest";
import { applyMarkdown } from "./markdownEditor";

describe("applyMarkdown", () => {
  it("wraps a selection in bold and keeps it selected", () => {
    // "hello world", select "world" (6..11)
    const r = applyMarkdown({ value: "hello world", selStart: 6, selEnd: 11 }, "bold");
    expect(r.value).toBe("hello **world**");
    expect(r.value.slice(r.selStart, r.selEnd)).toBe("world");
  });

  it("inserts empty italic markers with the caret between them", () => {
    const r = applyMarkdown({ value: "ab", selStart: 1, selEnd: 1 }, "italic");
    expect(r.value).toBe("a**b"); // "a" + two italic markers + "b"
    expect(r.selStart).toBe(2);
    expect(r.selEnd).toBe(2); // caret sits between the two markers
  });

  it("wraps a selection in code", () => {
    const r = applyMarkdown({ value: "run x now", selStart: 4, selEnd: 5 }, "code");
    expect(r.value).toBe("run `x` now");
  });

  it("prefixes the caret's line for a heading", () => {
    const r = applyMarkdown({ value: "line one\nline two", selStart: 11, selEnd: 11 }, "heading");
    expect(r.value).toBe("line one\n# line two");
    // caret shifts past the inserted "# "
    expect(r.selStart).toBe(13);
  });

  it("prefixes the first line for a list even at index 0", () => {
    const r = applyMarkdown({ value: "todo", selStart: 0, selEnd: 0 }, "list");
    expect(r.value).toBe("- todo");
    expect(r.selStart).toBe(2);
  });

  it("wraps a selection as a link and pre-selects url", () => {
    const r = applyMarkdown({ value: "see docs", selStart: 4, selEnd: 8 }, "link");
    expect(r.value).toBe("see [docs](url)");
    expect(r.value.slice(r.selStart, r.selEnd)).toBe("url");
  });

  it("inserts a link skeleton and pre-selects the text label", () => {
    const r = applyMarkdown({ value: "", selStart: 0, selEnd: 0 }, "link");
    expect(r.value).toBe("[text](url)");
    expect(r.value.slice(r.selStart, r.selEnd)).toBe("text");
  });
});
