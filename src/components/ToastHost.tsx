// Renders the active toast queue, bottom-center on desktop / above the
// mobile nav on phones. Mounted once at the app root.
import { For } from "solid-js";
import { X } from "lucide-solid";
import { toasts, dismissToast } from "../lib/toast";

export default function ToastHost() {
  return (
    <div class="pointer-events-none fixed inset-x-0 bottom-5 z-2000 flex flex-col items-center gap-2 max-[768px]:bottom-[calc(94px+env(safe-area-inset-bottom,0px))]">
      <For each={toasts()}>
        {(toast) => (
          <div class="pointer-events-auto flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm text-page shadow-lg shadow-(color:--shadow-color-strong) animate-[toastIn_0.2s_ease]">
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                class="cursor-pointer font-semibold text-accent-alt hover:underline"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              class="cursor-pointer text-page/60 hover:text-page"
              onClick={() => dismissToast(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
