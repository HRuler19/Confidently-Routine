// Curved mobile bottom navigation — the signature SVG "valley" bar.
// The paths and offsets are ported verbatim from the vanilla app; the
// bespoke styling lives in styles/app.css (.mobile-nav-* rules) because
// non-uniformly-stretched SVG strokes have no Tailwind-utility equivalent.
import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import { A, useLocation } from "@solidjs/router";
import { t } from "../lib/i18n";
import { NAV_ITEMS } from "./Sidebar";

// Tab labels match the desktop sidebar (incl. "Daily tasks" for tab 3).
const MOBILE_LABEL_KEYS = [
  "nav.dashboard",
  "nav.my_routine",
  "nav.daily_tasks",
  "nav.notes",
  "nav.settings",
] as const;

export default function MobileNav() {
  const location = useLocation();
  const activeIndex = () => NAV_ITEMS.findIndex((item) => item.path === location.pathname);

  return (
    <nav class="mobile-bottom-nav" data-active-index={activeIndex()}>
      {/* Fixed-height inner bar so the safe-area spacer on the nav container
          never stretches the SVG curves (iOS home-indicator inset). */}
      <div class="mobile-nav-bar">
      <svg class="mobile-nav-bg" viewBox="0 0 100 92" preserveAspectRatio="none" aria-hidden="true">
        <path class="mobile-nav-bg-fill" d="M0,7 Q50,31 100,7 L100,92 L0,92 Z" />
        <path class="mobile-nav-bg-line" d="M0,7 Q50,31 100,7" />
        <path class="mobile-nav-bg-line" d="M0,52 Q50,76 100,52" />
        {/* Active-tab indicator: five exact segments of the hairline parabola
            above (one per tab); CSS lights only the active one so the green
            bar always rides the curved line. */}
        <path class="mobile-nav-bg-active seg-0" d="M5.5,54.49 Q10,56.42 14.5,57.95" />
        <path class="mobile-nav-bg-active seg-1" d="M25.5,61.12 Q30,62.18 34.5,62.85" />
        <path class="mobile-nav-bg-active seg-2" d="M45.5,63.9 Q50,64.1 54.5,63.9" />
        <path class="mobile-nav-bg-active seg-3" d="M65.5,62.85 Q70,62.18 74.5,61.12" />
        <path class="mobile-nav-bg-active seg-4" d="M85.5,57.95 Q90,56.42 94.5,54.49" />
      </svg>
      <div class="mobile-nav-items">
        <For each={NAV_ITEMS}>
          {(item, i) => (
            <A
              href={item.path}
              class="mobile-nav-item"
              classList={{ active: activeIndex() === i() }}
              aria-label={t(MOBILE_LABEL_KEYS[i()])}
            >
              <Dynamic component={item.icon} size={22} class="mobile-nav-icon" />
              <span class="mobile-nav-item-label">{t(MOBILE_LABEL_KEYS[i()])}</span>
            </A>
          )}
        </For>
      </div>
      <div class="mobile-nav-active-label">
        {activeIndex() >= 0 ? t(MOBILE_LABEL_KEYS[activeIndex()]) : ""}
      </div>
      </div>
    </nav>
  );
}
