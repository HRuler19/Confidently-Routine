// Pure text transforms behind the notes markdown toolbar, kept apart from the
// DOM so the selection maths is unit-testable. Each takes the textarea's
// current value + selection and returns the new value and where the selection
// should land afterwards; the toolbar component only reads/writes the textarea.

export type MarkdownAction = "bold" | "italic" | "code" | "heading" | "list" | "link";

export interface EditState {
  value: string;
  selStart: number;
  selEnd: number;
}

const WRAP: Record<"bold" | "italic" | "code", string> = { bold: "**", italic: "*", code: "`" };
const LINE_PREFIX: Record<"heading" | "list", string> = { heading: "# ", list: "- " };

export function applyMarkdown(state: EditState, action: MarkdownAction): EditState {
  const { value, selStart, selEnd } = state;
  const selected = value.slice(selStart, selEnd);

  // Inline wrap: **bold**, *italic*, `code`. With a selection, wrap it and keep
  // the text selected; with none, drop the markers and park the caret between.
  if (action === "bold" || action === "italic" || action === "code") {
    const m = WRAP[action];
    if (selected) {
      return {
        value: value.slice(0, selStart) + m + selected + m + value.slice(selEnd),
        selStart: selStart + m.length,
        selEnd: selEnd + m.length,
      };
    }
    const caret = selStart + m.length;
    return { value: value.slice(0, selStart) + m + m + value.slice(selEnd), selStart: caret, selEnd: caret };
  }

  // Line prefix: "# " heading, "- " list - inserted at the start of the caret's line.
  if (action === "heading" || action === "list") {
    const prefix = LINE_PREFIX[action];
    const lineStart = value.lastIndexOf("\n", selStart - 1) + 1;
    return {
      value: value.slice(0, lineStart) + prefix + value.slice(lineStart),
      selStart: selStart + prefix.length,
      selEnd: selEnd + prefix.length,
    };
  }

  // Link: [selected](url) with "url" pre-selected, or [text](url) with "text"
  // pre-selected when there's nothing to wrap, so the next keystroke fills it in.
  if (selected) {
    const inserted = `[${selected}](url)`;
    const urlStart = selStart + 1 + selected.length + 2; // past "[selected]("
    return { value: value.slice(0, selStart) + inserted + value.slice(selEnd), selStart: urlStart, selEnd: urlStart + 3 };
  }
  const inserted = `[text](url)`;
  const textStart = selStart + 1; // past "["
  return { value: value.slice(0, selStart) + inserted + value.slice(selEnd), selStart: textStart, selEnd: textStart + 4 };
}
