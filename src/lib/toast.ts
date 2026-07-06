// Minimal toast queue. Used mainly for "Deleted — Undo" flows so
// destructive actions on frequent, low-stakes items (a task, a note)
// don't need a blocking confirmation modal.
import { createSignal } from "solid-js";

export interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);
export { toasts };

let nextId = 1;

export function showToast(opts: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}) {
  const id = nextId++;
  const duration = opts.duration ?? 5000;
  setToasts([...toasts(), { id, message: opts.message, actionLabel: opts.actionLabel, onAction: opts.onAction, duration }]);
  setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id: number) {
  setToasts(toasts().filter((t) => t.id !== id));
}
