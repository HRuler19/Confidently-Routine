import ErrorHandler from "./core/ErrorHandler.js";
import UserStore from "./core/storage/UserStore.js";
import TaskStore from "./core/storage/TaskStore.js";
import NoteStore from "./core/storage/NoteStore.js";
import HabitStore from "./core/storage/HabitStore.js";
import HabitEntryStore from "./core/storage/HabitEntryStore.js";
import SleepStore from "./core/storage/SleepStore.js";

(function () {
  "use strict";

  // DOM Elements
  const content = document.getElementById("content");
  const loginSection = document.getElementById("loginSection");
  const mainHeader = document.getElementById("mainHeader");
  const sidebar = document.getElementById("sidebar");
  const welcomeMessage = document.getElementById("welcomeMessage");
  const headerAvatar = document.getElementById("headerAvatar");
  const mainAvatarImg = document.getElementById("mainAvatarImg");
  const loginForm = document.getElementById("loginForm");
  const passwordToggle = document.querySelector(".password-toggle i");
  const passwordInput = document.getElementById("password");
  const avatars = document.querySelectorAll(".avatar:not(.avatar--add)");
  const addAvatarBtn = document.getElementById("addAvatarBtn");
  const avatarUpload = document.getElementById("avatarUpload");
  const usernameInput = document.getElementById("username");
  const rememberMe = document.getElementById("remember-me");
  const logoutBtn = document.getElementById("logoutBtn");
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  const appLogo = document.getElementById("appLogo");

  // Modal elements
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogout = document.getElementById("cancelLogout");
  const confirmLogout = document.getElementById("confirmLogout");

  let selectedAvatar = "assets/images/Boy image 1.svg";

  document.addEventListener("DOMContentLoaded", function () {
    if (window.I18n) window.I18n.applyTranslations();
    initLanguageSwitcher();

    loginSection.style.display = "flex";
    mainHeader.style.display = "none";
    sidebar.style.display = "none";

    const isLoggedIn = checkSavedUser();

    if (isLoggedIn) {
      loginSection.style.display = "none";
      mainHeader.style.display = "flex";
      sidebar.style.display = "flex";
    } else {
      console.log("No user found, showing login page");
    }

    setupMobileNavigation();

    if (isLoggedIn) {
      setTimeout(() => loadPage("dashboard"), 0);
    } else {
      content.innerHTML = "";
    }
  });

  async function loadPage(pageName) {
    try {
      const response = await fetch(`views/${pageName}.html`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      content.innerHTML = html;

      window.DomHelpers.initCustomSelects();
      if (window.I18n) window.I18n.applyTranslations();
      updateSidebarActive(pageName);

      mobileNavItems.forEach((item) => {
        item.classList.remove("active");
        if (item.dataset.page === pageName) {
          item.classList.add("active");
        }
      });

      if (window.innerWidth <= 768) {
        sidebar.classList.remove("mobile-open");
      }

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("pageLoaded", {
            detail: { page: pageName },
          }),
        );
      }, 100);
    } catch (error) {
      content.innerHTML = `<div style="padding:20px;color:red;">Page not found: ${pageName}</div>`;
    }
  }

  function setupMobileNavigation() {
    if (hamburgerBtn) {
      hamburgerBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        sidebar.classList.toggle("mobile-open");
      });
    }

    document.addEventListener("click", function (event) {
      if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains("mobile-open")
      ) {
        if (
          !sidebar.contains(event.target) &&
          !hamburgerBtn.contains(event.target)
        ) {
          sidebar.classList.remove("mobile-open");
        }
      }
    });

    mobileNavItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        const pageName = this.dataset.page;
        if (pageName) loadPage(pageName);
      });
    });

    const sidebarLinks = document.querySelectorAll(
      "#sidebar a:not(#logoutBtn)",
    );

    sidebarLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        const pageName = this.dataset.page;
        if (pageName) loadPage(pageName);
      });
    });
  }

  function updateSidebarActive(pageName) {
    const sidebarLinks = document.querySelectorAll(
      "#sidebar a:not(#logoutBtn)",
    );

    sidebarLinks.forEach((link) => {
      const menuItem = link.querySelector(".menu-item");
      if (menuItem) {
        menuItem.classList.remove("active");
        if (link.dataset.page === pageName) {
          menuItem.classList.add("active");
        }
      }
    });
  }

  function checkSavedUser() {
    const userData = window.AppStore ? window.AppStore.getUser() : null;

    if (userData) {
      loginUser(userData);
      return true;
    }

    return false;
  }

  function loginUser(userData) {
    loginSection.style.display = "none";
    mainHeader.style.display = "flex";
    sidebar.style.display = "flex";

    if (welcomeMessage) {
      welcomeMessage.textContent = userData.username;
    }

    if (headerAvatar) {
      const avatarImg = headerAvatar.querySelector("img");
      if (avatarImg) {
        avatarImg.src = userData.avatar;
      }
    }
  }

  function performLogout() {
    if (window.AppStore) {
      window.AppStore.removeUser();
    }

    loginSection.style.display = "flex";
    mainHeader.style.display = "none";
    sidebar.style.display = "none";
    sidebar.classList.remove("mobile-open");
    content.innerHTML = "";

    if (loginForm) loginForm.reset();

    avatars.forEach((av) => av.classList.remove("avatar--selected"));

    if (mainAvatarImg) {
      mainAvatarImg.src = "assets/images/Boy image 1.svg";
    }

    selectedAvatar = "assets/images/Boy image 1.svg";

    hideLogoutModal();
  }

  // Password toggle
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", function () {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });
  }

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username)
        return showError(usernameInput, window.I18n.t("login.error_username_required"));
      if (!password)
        return showError(passwordInput, window.I18n.t("login.error_password_required"));
      if (password.length < 6)
        return showError(passwordInput, window.I18n.t("login.error_password_length"));

      clearErrors();

      const userData = {
        username,
        avatar: selectedAvatar,
        lastLogin: new Date().toISOString(),
      };

      if (window.AppStore) {
        window.AppStore.saveUser(userData, rememberMe.checked);
      }

      loginUser(userData);
      loadPage("dashboard");
    });
  }

  // Logout events
  if (logoutBtn)
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showLogoutModal();
    });

  if (appLogo)
    appLogo.addEventListener("click", (e) => {
      e.preventDefault();
      loadPage("dashboard");
    });

  if (cancelLogout) cancelLogout.addEventListener("click", hideLogoutModal);
  if (confirmLogout) confirmLogout.addEventListener("click", performLogout);

  function showLogoutModal() {
    logoutModal.classList.add("show");
  }

  function hideLogoutModal() {
    logoutModal.classList.remove("show");
  }

  // Avatar selection
  avatars.forEach((avatar) => {
    avatar.addEventListener("click", function () {
      avatars.forEach((av) => av.classList.remove("avatar--selected"));
      this.classList.add("avatar--selected");

      const selectedImg = this.querySelector("img");
      if (selectedImg) {
        selectedAvatar = selectedImg.src;
        mainAvatarImg.src = selectedImg.src;
      }
    });
  });

  // Add avatar
  if (addAvatarBtn && avatarUpload) {
    addAvatarBtn.addEventListener("click", () => avatarUpload.click());

    avatarUpload.addEventListener("change", function (event) {
      const file = event.target.files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
          selectedAvatar = e.target.result;
          mainAvatarImg.src = e.target.result;
          avatars.forEach((av) => av.classList.remove("avatar--selected"));
        };

        reader.readAsDataURL(file);
      }
    });
  }

  // Language switcher (header)
  function initLanguageSwitcher() {
    const headerSelect = document.getElementById("headerLanguageSelect");
    if (!headerSelect || !window.I18n) return;

    // Ensure DomHelpers has already wired (and cloned) this select's
    // trigger/options before we attach our own option listeners below —
    // otherwise DomHelpers' later cloneNode-based init would silently
    // strip the listeners we add here.
    if (window.DomHelpers) window.DomHelpers.initCustomSelects();

    syncLanguageSelectDisplay(headerSelect);

    headerSelect.querySelectorAll(".option").forEach((option) => {
      option.addEventListener("click", () => {
        window.I18n.setLanguage(option.dataset.value);
      });
    });

    window.addEventListener("languageChange", () => {
      syncLanguageSelectDisplay(headerSelect);
    });
  }

  function syncLanguageSelectDisplay(select) {
    const lang = window.I18n.getLanguage();
    const option = select.querySelector(`.option[data-value="${lang}"]`);
    if (!option) return;

    select.dataset.value = lang;

    const triggerSpan = select.querySelector(".select-trigger span");
    if (triggerSpan) {
      triggerSpan.textContent = option.dataset.code || option.textContent;
    }
  }

  // Error handling functions
  function showError(inputElement, message) {
    ErrorHandler.show(inputElement, message);
  }

  function clearErrors() {
    ErrorHandler.clearAll();
  }
})();

window.AppStore = UserStore;
window.TaskStore = TaskStore;
window.NoteStore = NoteStore;
window.HabitStore = HabitStore;
window.HabitEntryStore = HabitEntryStore;
window.SleepStore = SleepStore;
