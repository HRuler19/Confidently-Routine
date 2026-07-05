// Custom dropdown select — Solid replacement for the vanilla app's
// DomHelpers.initCustomSelects() widget, with the same look: bordered
// trigger box + floating options panel, brand-green highlight.
import { createSignal, For, Show, onCleanup, type JSX } from "solid-js";
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
  let root: HTMLDivElement | undefined;

  const selected = () => props.options.find((o) => o.value === props.value);

  const onDocClick = (e: MouseEvent) => {
    if (root && !root.contains(e.target as Node)) setOpen(false);
  };
  document.addEventListener("click", onDocClick);
  onCleanup(() => document.removeEventListener("click", onDocClick));

  return (
    <div ref={root} class={`relative ${props.class ?? ""}`} aria-label={props.ariaLabel}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open()}
        aria-haspopup="listbox"
        class="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-line-input bg-surface px-3 text-sm text-secondary transition-colors hover:border-accent focus:border-accent focus:outline-none"
        onClick={() => setOpen(!open())}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open()) {
            e.preventDefault();
            setOpen(true);
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
          class="absolute left-0 top-full z-1200 mt-1 w-full min-w-max overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg shadow-(color:--shadow-color-strong)"
        >
          <For each={props.options}>
            {(opt) => (
              <div
                role="option"
                aria-selected={opt.value === props.value}
                class="cursor-pointer px-3 py-2 text-sm text-secondary transition-colors hover:bg-hover"
                classList={{ "text-accent font-medium": opt.value === props.value }}
                onClick={() => {
                  props.onChange(opt.value);
                  setOpen(false);
                }}
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
