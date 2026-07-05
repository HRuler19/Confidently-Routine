// Shared confirmation modal — same design as the vanilla app's modal.css:
// blurred backdrop, rounded card, tinted round icon, cancel/confirm row.
import { Show, type JSX } from "solid-js";

interface ConfirmModalProps {
  open: boolean;
  icon: string; // Font Awesome classes, e.g. "fa-solid fa-trash"
  title: string;
  body: JSX.Element;
  cancelText: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal(props: ConfirmModalProps) {
  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-3000 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onCancel();
        }}
      >
        <div class="w-[90%] max-w-90 animate-[modalFadeIn_0.3s_ease] rounded-3xl bg-surface p-6 pt-8 text-center shadow-2xl shadow-(color:--shadow-color-strong)">
          <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-linear-135 from-danger/14 to-danger/24">
            <i class={`${props.icon} text-[28px] text-danger`} />
          </div>
          <h2 class="mb-2 text-xl font-semibold text-primary">{props.title}</h2>
          <div class="text-sm leading-relaxed text-tertiary">{props.body}</div>
          <div class="mt-8 flex gap-3 max-[480px]:flex-col">
            <button
              type="button"
              class="flex-1 cursor-pointer rounded-xl bg-hover px-4 py-3 text-sm font-medium text-secondary transition-colors hover:bg-line"
              onClick={props.onCancel}
            >
              {props.cancelText}
            </button>
            <button
              type="button"
              class="flex-1 cursor-pointer rounded-xl bg-danger px-4 py-3 text-sm font-medium text-white shadow-md shadow-danger/20 transition-all hover:-translate-y-px hover:bg-danger-hover"
              onClick={props.onConfirm}
            >
              {props.confirmText}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
