// Formatting buttons for the notes markdown editor. Reads the current
// selection straight off the textarea, applies the transform (pure logic in
// lib/markdownEditor), writes the result back through onChange, then restores
// focus + selection so typing continues naturally.
import { For, type Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Bold, Italic, Code, Heading, List, Link, type LucideProps } from "lucide-solid";
import { applyMarkdown, type MarkdownAction } from "../lib/markdownEditor";
import { t } from "../lib/i18n";

const BUTTONS: { action: MarkdownAction; icon: Component<LucideProps>; labelKey: string }[] = [
  { action: "bold", icon: Bold, labelKey: "notes.md_bold" },
  { action: "italic", icon: Italic, labelKey: "notes.md_italic" },
  { action: "code", icon: Code, labelKey: "notes.md_code" },
  { action: "heading", icon: Heading, labelKey: "notes.md_heading" },
  { action: "list", icon: List, labelKey: "notes.md_list" },
  { action: "link", icon: Link, labelKey: "notes.md_link" },
];

export default function MarkdownToolbar(props: {
  getTextarea: () => HTMLTextAreaElement | undefined;
  onChange: (value: string) => void;
}) {
  function run(action: MarkdownAction) {
    const ta = props.getTextarea();
    if (!ta) return;
    const result = applyMarkdown(
      { value: ta.value, selStart: ta.selectionStart, selEnd: ta.selectionEnd },
      action,
    );
    props.onChange(result.value);
    // Restore focus + selection after Solid flushes the new value to the DOM.
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(result.selStart, result.selEnd);
    });
  }

  return (
    <div class="flex flex-wrap items-center gap-1">
      <For each={BUTTONS}>
        {(b) => (
          <button
            type="button"
            title={t(b.labelKey)}
            aria-label={t(b.labelKey)}
            // Prevent the mousedown from stealing focus / collapsing the
            // textarea's selection before the click handler runs.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(b.action)}
            class="flex size-8 cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-secondary transition-all duration-200 hover:border-accent hover:text-accent active:scale-[0.94]"
          >
            <Dynamic component={b.icon} size={15} />
          </button>
        )}
      </For>
    </div>
  );
}
