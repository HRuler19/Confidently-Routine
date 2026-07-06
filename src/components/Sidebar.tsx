import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import { A, useLocation } from "@solidjs/router";
import { House, ListChecks, Calendar, SquarePen, Settings, LogOut } from "lucide-solid";
import { t } from "../lib/i18n";

export const NAV_ITEMS = [
  { path: "/", icon: House, labelKey: "nav.dashboard" },
  { path: "/my-routine", icon: ListChecks, labelKey: "nav.my_routine" },
  { path: "/routines", icon: Calendar, labelKey: "nav.daily_tasks" },
  { path: "/notes", icon: SquarePen, labelKey: "nav.notes" },
  { path: "/settings", icon: Settings, labelKey: "nav.settings" },
] as const;

export default function Sidebar(props: { onLogout: () => void }) {
  const location = useLocation();

  return (
    <aside class="fixed bottom-0 left-0 top-[calc(60px+env(safe-area-inset-top,0px))] z-999 flex w-62.5 flex-col overflow-y-auto border-r border-line bg-surface py-5 max-[768px]:hidden">
      <For each={NAV_ITEMS}>
        {(item) => (
          <A
            href={item.path}
            class="block no-underline"
            aria-current={location.pathname === item.path ? "page" : undefined}
          >
            <div
              class="mx-2.5 mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-5 py-3 transition-all hover:bg-hover"
              classList={{ "bg-hover": location.pathname === item.path }}
            >
              <div class="flex min-w-6 justify-center">
                <Dynamic component={item.icon} size={20} class="text-accent" />
              </div>
              <div class="text-base font-medium text-primary">{t(item.labelKey)}</div>
            </div>
          </A>
        )}
      </For>

      <button
        type="button"
        class="mt-auto block w-full cursor-pointer border-0 border-t border-line bg-transparent pt-2.5 text-left"
        onClick={props.onLogout}
      >
        <div class="mx-2.5 flex cursor-pointer items-center gap-3 rounded-lg px-5 py-3 transition-all hover:bg-danger/12">
          <div class="flex min-w-6 justify-center">
            <LogOut size={20} class="text-danger" />
          </div>
          <div class="text-base font-medium text-danger">{t("nav.logout")}</div>
        </div>
      </button>
    </aside>
  );
}
