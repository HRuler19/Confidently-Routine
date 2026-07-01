// Shared DOM helpers used by the page modules (routines.js, notes.js) and
// app.js. Plain global script (not an ES module) so it can be loaded before
// those page modules without changing the existing script-loading setup.
window.DomHelpers = (function () {
  "use strict";

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function initCustomSelects(scope) {
    const root = scope || document;
    const selects = root.querySelectorAll(".custom-select");

    selects.forEach((select) => {
      if (select.dataset.initialized) return;

      const trigger = select.querySelector(".select-trigger");
      const options = select.querySelectorAll(".option");

      if (trigger) {
        trigger.replaceWith(trigger.cloneNode(true));
        const newTrigger = select.querySelector(".select-trigger");

        newTrigger.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          root.querySelectorAll(".custom-select").forEach((s) => {
            if (s !== select) s.classList.remove("open");
          });

          select.classList.toggle("open");
        });
      }

      options.forEach((option) => {
        option.replaceWith(option.cloneNode(true));
        const newOption = select.querySelector(
          `.option[data-value="${option.dataset.value}"]`,
        );

        newOption.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          const triggerSpan = select.querySelector(".select-trigger span");
          if (triggerSpan) {
            triggerSpan.textContent = newOption.textContent;
          }

          select.classList.remove("open");
          select.dataset.value = newOption.dataset.value;

          if (select.id.includes("Filter") || select.id.includes("Status")) {
            const filterEvent = new CustomEvent("filterChange", {
              detail: { filter: select.id, value: newOption.dataset.value },
            });
            select.dispatchEvent(filterEvent);
          }
        });
      });

      select.dataset.initialized = "true";
    });
  }

  // Closes any open custom-select when clicking anywhere on the page.
  window.addEventListener("click", () => {
    document
      .querySelectorAll(".custom-select")
      .forEach((s) => s.classList.remove("open"));
  });

  const FLATPICKR_LOCALE = {
    firstDayOfWeek: 1,
    weekdays: {
      shorthand: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      longhand: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    months: {
      shorthand: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      longhand: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
    },
  };

  function getFlatpickrBaseConfig() {
    return {
      dateFormat: "Y-m-d",
      minDate: "today",
      disableMobile: true,
      animate: true,
      static: true,
      monthSelectorType: "static",
      locale: FLATPICKR_LOCALE,
      onOpen: function (selectedDates, dateStr, instance) {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add("open-animation");
        }
      },
      onReady: function (selectedDates, dateStr, instance) {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add("ios-wheel-picker");
        }
      },
    };
  }

  const confirmModalHandlers = Object.create(null);

  function setupConfirmModal({ modalId, cancelId, confirmId, onConfirm, onClose }) {
    const modal = document.getElementById(modalId);
    const cancelBtn = document.getElementById(cancelId);
    const confirmBtn = document.getElementById(confirmId);

    if (!confirmModalHandlers[modalId]) {
      confirmModalHandlers[modalId] = {
        handleBackdropClick: function (e) {
          if (e.target.id === modalId) {
            confirmModalHandlers[modalId].onClose();
          }
        },
        handleEscapeKey: function (e) {
          if (e.key !== "Escape") return;
          const currentModal = document.getElementById(modalId);
          if (currentModal && currentModal.classList.contains("show")) {
            confirmModalHandlers[modalId].onClose();
          }
        },
      };
    }
    confirmModalHandlers[modalId].onClose = onClose;
    const handlers = confirmModalHandlers[modalId];

    if (cancelBtn) {
      cancelBtn.removeEventListener("click", onClose);
      cancelBtn.addEventListener("click", onClose);
    }

    if (confirmBtn) {
      confirmBtn.removeEventListener("click", onConfirm);
      confirmBtn.addEventListener("click", onConfirm);
    }

    if (modal) {
      modal.removeEventListener("click", handlers.handleBackdropClick);
      modal.addEventListener("click", handlers.handleBackdropClick);
    }

    document.removeEventListener("keydown", handlers.handleEscapeKey);
    document.addEventListener("keydown", handlers.handleEscapeKey);
  }

  return {
    escapeHtml,
    initCustomSelects,
    getFlatpickrBaseConfig,
    setupConfirmModal,
  };
})();
