import ErrorHandler from "./core/ErrorHandler.js";
import UserStore from "./core/storage/UserStore.js";
import TaskStore from "./core/storage/TaskStore.js";
import NoteStore from "./core/storage/NoteStore.js";

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
    setupGlobalEvents();

    if (isLoggedIn) {
      setTimeout(() => loadPage("dashboard"), 0);
    } else {
      content.innerHTML = "";
    }
  });

  function initCustomSelects() {
    const selects = document.querySelectorAll(".custom-select");

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

          document.querySelectorAll(".custom-select").forEach((s) => {
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
            triggerSpan.innerText = newOption.innerText;
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

  function setupGlobalEvents() {
    window.addEventListener("click", () => {
      document
        .querySelectorAll(".custom-select")
        .forEach((s) => s.classList.remove("open"));
    });
  }

  async function loadPage(pageName) {
    try {
      const response = await fetch(`views/${pageName}.html`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      content.innerHTML = html;

      initCustomSelects();
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

      if (!username) return showError(usernameInput, "Please enter username");
      if (!password) return showError(passwordInput, "Please enter password");
      if (password.length < 6)
        return showError(
          passwordInput,
          "Password must be at least 6 characters",
        );

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
