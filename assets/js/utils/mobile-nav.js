// Keeps the mobile bottom nav's centred label - and which curved-line
// segment lights up - in sync with the active tab. Plain global script
// (like theme.js / i18n.js). app.js sets the `.active` class on the
// matching .mobile-nav-item during loadPage() and dispatches a `pageLoaded`
// event afterwards; I18n.setLanguage re-translates the item labels before
// firing `languageChange`. Listening to both keeps the shown label and lit
// segment correct across navigation and language switches without touching
// the bundled app.js.
(function () {
  "use strict";

  function updateActiveNav() {
    const nav = document.getElementById("mobileBottomNav");
    const label = document.getElementById("mobileNavActiveLabel");
    if (!nav) return;

    const items = Array.from(nav.querySelectorAll(".mobile-nav-item"));
    const activeIndex = items.findIndex((item) =>
      item.classList.contains("active"),
    );

    // Drives which .mobile-nav-bg-active segment (seg-0..seg-4) is lit, via
    // the [data-active-index="N"] .seg-N rules in mobile-nav.css.
    if (activeIndex === -1) {
      delete nav.dataset.activeIndex;
    } else {
      nav.dataset.activeIndex = String(activeIndex);
    }

    if (label) {
      const activeSpan =
        activeIndex !== -1
          ? items[activeIndex].querySelector(".mobile-nav-item-label")
          : null;
      label.textContent = activeSpan ? activeSpan.textContent.trim() : "";
    }
  }

  window.addEventListener("pageLoaded", updateActiveNav);
  window.addEventListener("languageChange", updateActiveNav);
})();
