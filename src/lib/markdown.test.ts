import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("escapes raw HTML so it can never inject markup", () => {
    const out = renderMarkdown('<script>alert(1)</script>');
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("renders bold, italic, and inline code", () => {
    expect(renderMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
    expect(renderMarkdown("*italic*")).toBe("<p><em>italic</em></p>");
    expect(renderMarkdown("`code`")).toBe("<p><code>code</code></p>");
  });

  it("renders headings at h3-h5 so notes never outsize page headings", () => {
    expect(renderMarkdown("# Title")).toBe("<h3>Title</h3>");
    expect(renderMarkdown("## Sub")).toBe("<h4>Sub</h4>");
    expect(renderMarkdown("### Small")).toBe("<h5>Small</h5>");
  });

  it("renders bullet lists, grouping consecutive items into one <ul>", () => {
    const out = renderMarkdown("- one\n- two\n- three");
    expect(out).toBe("<ul><li>one</li><li>two</li><li>three</li></ul>");
  });

  it("closes a list before a following paragraph", () => {
    const out = renderMarkdown("- one\nafter");
    expect(out).toBe("<ul><li>one</li></ul><p>after</p>");
  });

  it("links http/https/mailto URLs but leaves other schemes as plain text", () => {
    expect(renderMarkdown("[site](https://example.com)")).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">site</a></p>',
    );
    expect(renderMarkdown("[bad](javascript:alert(1))")).toBe("<p>[bad](javascript:alert(1))</p>");
  });

  it("skips blank lines between paragraphs", () => {
    expect(renderMarkdown("first\n\nsecond")).toBe("<p>first</p><p>second</p>");
  });
});
