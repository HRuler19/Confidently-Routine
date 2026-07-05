import { For } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { t } from "../lib/i18n";

export const NAV_ITEMS = [
  { path: "/", icon: "fa-solid fa-house", labelKey: "nav.dashboard" },
  { path: "/my-routine", icon: "fa-solid fa-list-check", labelKey: "nav.my_routine" },
  { path: "/routines", icon: "fa-regular fa-calendar", labelKey: "nav.daily_tasks" },
  { path: "/notes", icon: "fa-regular fa-pen-to-square", labelKey: "nav.notes" },
  { path: "/settings", icon: "fa-solid fa-gear", labelKey: "nav.settings" },
] as const;

export default function Sidebar(props: { onLogout: () => void }) {
  const location = useLocation();

  return (
    <aside class="fixed bottom-0 left-0 top-[calc(60px+env(safe-area-inset-top,0px))] z-999 flex w-62.5 flex-col overflow-y-auto border-r border-line bg-surface py-5 max-[768px]:hidden">
      <For each={NAV_ITEMS}>
        {(item) => (
          <A href={item.path} class="block no-underline">
            <div
              class="mx-2.5 mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-5 py-3 transition-all hover:bg-hover"
              classList={{ "bg-hover": location.pathname === item.path }}
            >
              <div class="min-w-6 text-center">
                <i class={`${item.icon} text-xl text-accent`} />
              </div>
              <div class="text-base font-medium text-primary">{t(item.labelKey)}</div>
            </div>
          </A>
        )}
      </For>

      <a
        href="#"
        class="mt-auto block border-t border-line pt-2.5 no-underline"
        onClick={(e) => {
          e.preventDefault();
          props.onLogout();
        }}
      >
        <div class="mx-2.5 flex cursor-pointer items-center gap-3 rounded-lg px-5 py-3 transition-all hover:bg-danger/12">
          <div class="min-w-6 text-center">
            <i class="fa-solid fa-sign-out-alt text-xl text-danger" />
          </div>
          <div class="text-base font-medium text-danger">{t("nav.logout")}</div>
        </div>
      </a>
    </aside>
  );
}
