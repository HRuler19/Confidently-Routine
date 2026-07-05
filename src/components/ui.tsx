// Shared UI primitives. Every page composes these instead of repeating
// long utility strings, so the design system lives in exactly one place.
import { splitProps, type ComponentProps, type ParentProps, type JSX } from "solid-js";

// ── Button ──────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "outline" | "danger-outline";

const BUTTON_BASE =
  "cursor-pointer rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fill-text hover:bg-accent-hover",
  outline: "border border-line bg-surface text-secondary hover:border-accent hover:text-accent",
  "danger-outline":
    "border border-danger/40 bg-surface text-danger hover:border-danger hover:bg-danger/10",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);
  return (
    <button
      type="button"
      class={`${BUTTON_BASE} ${BUTTON_VARIANTS[local.variant ?? "primary"]} ${local.class ?? ""}`}
      {...rest}
    >
      {local.children}
    </button>
  );
}

// ── Inputs ──────────────────────────────────────────────────────────────
const FIELD_BASE =
  "rounded-lg border border-line-input bg-surface text-sm text-primary placeholder:text-placeholder focus:border-accent focus:outline-none";

export function Input(props: ComponentProps<"input">) {
  const [local, rest] = splitProps(props, ["class"]);
  return <input class={`h-10 px-3 ${FIELD_BASE} ${local.class ?? ""}`} {...rest} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  const [local, rest] = splitProps(props, ["class"]);
  return <textarea class={`resize-y p-3 ${FIELD_BASE} ${local.class ?? ""}`} {...rest} />;
}

// ── Card (page section) ─────────────────────────────────────────────────
export function Card(props: ParentProps<{ class?: string }>) {
  return (
    <section class={`rounded-xl bg-surface p-6 shadow-sm shadow-(color:--shadow-color) ${props.class ?? ""}`}>
      {props.children}
    </section>
  );
}

// ── Labeled field wrapper ───────────────────────────────────────────────
export function Field(props: ParentProps<{ label: JSX.Element; class?: string }>) {
  return (
    <div class={`flex flex-col gap-1.5 ${props.class ?? ""}`}>
      <span class="text-xs font-medium text-tertiary">{props.label}</span>
      {props.children}
    </div>
  );
}

// ── Stat badge (dot + count + label) ────────────────────────────────────
export function StatBadge(props: { dot: string; count: number; label: string; class?: string }) {
  return (
    <div
      class={`flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm ${props.class ?? ""}`}
    >
      <span class="size-2.5 rounded-full" style={{ "background-color": props.dot }} />
      <span class="font-semibold text-primary">{props.count}</span>
      <span class="text-tertiary">{props.label}</span>
    </div>
  );
}
