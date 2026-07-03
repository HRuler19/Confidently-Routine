// Keeps the mobile bottom nav's centred label in sync with the active tab.
// Plain global script (like theme.js / i18n.js). app.js sets the `.active`
// class on the matching .mobile-nav-item during loadPage() and dispatches a
// `pageLoaded` event afterwards; I18n.setLanguage re-translates the item
// labels before firing `languageChange`. Listening to both keeps the shown
// label correct across navigation and language switches without touching the
// bundled app.js.
(function () {
  "use strict";

  function updateActiveLabel() {
    const label = document.getElementById("mobileNavActiveLabel");
    if (!label) return;
    const activeSpan = document.querySelector(
      ".mobile-nav-item.active .mobile-nav-item-label",
    );
    label.textContent = activeSpan ? activeSpan.textContent.trim() : "";
  }

  window.addEventListener("pageLoaded", updateActiveLabel);
  window.addEventListener("languageChange", updateActiveLabel);
})();
