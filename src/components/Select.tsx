// Custom dropdown select — Solid replacement for the vanilla app's
// DomHelpers.initCustomSelects() widget, with the same look: bordered
// trigger box + floating options panel, brand-green highlight.
//
// Keyboard follows the ARIA combobox pattern: DOM focus never leaves the
// trigger button, a `highlighted` index tracks the "virtual" active option,
// and aria-activedescendant points assistive tech at it - arrow keys move
// it, Enter/Space commits it, Home/End jump to the ends.
import { createSignal, createUniqueId, For, Show, onCleanup, type JSX } from "solid-js";
import { ChevronDown } from "lucide-solid";

export interface SelectOption {
  value: string;
  label: string | (() => string);
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  class?: string;
  /** Render the trigger text; defaults to the selected option's label. */
  triggerLabel?: (selected: SelectOption | undefined) => JSX.Element;
  ariaLabel?: string;
}

function labelText(opt: SelectOption | undefined): string {
  if (!opt) return "";
  return typeof opt.label === "function" ? opt.label() : opt.label;
}

export default function Select(props: SelectProps) {
  const [open, setOpen] = createSignal(false);
  const [highlighted, setHighlighted] = createSignal(0);
  const listboxId = createUniqueId();
  let root: HTMLDivElement | undefined;

  const selected = () => props.options.find((o) => o.value === props.value);
  const selectedIndex = () => props.options.findIndex((o) => o.value === props.value);

  const onDocClick = (e: MouseEvent) => {
    if (root && !root.contains(e.target as Node)) setOpen(false);
  };
  document.addEventListener("click", onDocClick);
  onCleanup(() => document.removeEventListener("click", onDocClick));

  function openPanel() {
    setHighlighted(Math.max(0, selectedIndex()));
    setOpen(true);
  }

  function moveHighlight(delta: number) {
    const count = props.options.length;
    if (count === 0) return;
    setHighlighted((i) => (i + delta + count) % count);
  }

  function commit(index: number) {
    const opt = props.options[index];
    if (!opt) return;
    props.onChange(opt.value);
    setOpen(false);
  }

  return (
    <div ref={root} class={`relative ${props.class ?? ""}`} aria-label={props.ariaLabel}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open()}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={open() ? `${listboxId}-option-${highlighted()}` : undefined}
        class="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-line-input bg-surface px-3 text-sm text-secondary transition-colors hover:border-accent focus:border-accent focus:outline-none"
        onClick={() => (open() ? setOpen(false) : openPanel())}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open()) openPanel();
            else moveHighlight(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open()) openPanel();
            else moveHighlight(-1);
          } else if (e.key === "Home" && open()) {
            e.preventDefault();
            setHighlighted(0);
          } else if (e.key === "End" && open()) {
            e.preventDefault();
            setHighlighted(props.options.length - 1);
          } else if ((e.key === "Enter" || e.key === " ") && open()) {
            e.preventDefault();
            commit(highlighted());
          }
        }}
      >
        <span class="truncate">
          {props.triggerLabel ? props.triggerLabel(selected()) : labelText(selected())}
        </span>
        <ChevronDown
          size={14}
          class="shrink-0 text-tertiary transition-transform"
          classList={{ "rotate-180": open() }}
        />
      </button>
      <Show when={open()}>
        {/* z-1200: above the mobile bottom nav (998) and header (1000) so an
            open list near the bottom of the screen is never covered. */}
        <div
          role="listbox"
          id={listboxId}
          class="absolute left-0 top-full z-1200 mt-1 w-full min-w-max overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg shadow-(color:--shadow-color-strong)"
        >
          <For each={props.options}>
            {(opt, i) => (
              <div
                role="option"
                id={`${listboxId}-option-${i()}`}
                aria-selected={opt.value === props.value}
                class="cursor-pointer px-3 py-2 text-sm text-secondary transition-colors hover:bg-hover"
                classList={{
                  "text-accent font-medium": opt.value === props.value,
                  "bg-hover": highlighted() === i(),
                }}
                onMouseEnter={() => setHighlighted(i())}
                onClick={() => commit(i())}
              >
                {labelText(opt)}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
