// Shared modal accessibility behavior: traps Tab focus inside the dialog,
// closes on Escape, focuses the first focusable element on open, and
// restores focus to whatever triggered the dialog when it closes.
//
// Call this from a component that only exists while the dialog is open
// (e.g. the child of a <Show>), so onMount/onCleanup line up with the
// dialog's actual open/close lifecycle.
import { onMount, onCleanup } from "solid-js";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled"),
  );
}

export function useDialogA11y(container: () => HTMLElement | undefined, onEscape: () => void) {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
      return;
    }
    if (e.key !== "Tab") return;
    const root = container();
    if (!root) return;
    const els = focusableElements(root);
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    const root = container();
    if (root) focusableElements(root)[0]?.focus();
  });

  onCleanup(() => {
    document.removeEventListener("keydown", onKeyDown);
    previouslyFocused?.focus();
  });
}
