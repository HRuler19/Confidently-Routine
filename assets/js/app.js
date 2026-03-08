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

    // Modal elements
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");

  // LocalStorage keys
const STORAGE_KEYS = {
USER: "confidently_user",
REMEMBER_ME: "confidently_remember"
};

let selectedAvatar = "assets/images/Boy image 1.svg";

document.addEventListener("DOMContentLoaded", function () {
loginSection.style.display = "flex";
mainHeader.style.display = "none";
sidebar.style.display = "none";

checkSavedUser();
loadPage("dashboard");
setupMobileNavigation();
setupGlobalEvents();
});

function initCustomSelects() {
const selects = document.querySelectorAll(".custom-select");

selects.forEach((select) => {
if (select.dataset.initialized) return;

const trigger = select.querySelector(".select-trigger");
const options = select.querySelectorAll(".option");

if (trigger) {
trigger.addEventListener("click", (e) => {
e.stopPropagation();

document.querySelectorAll(".custom-select").forEach((s) => {
if (s !== select) s.classList.remove("open");
});

select.classList.toggle("open");
});
}

options.forEach((option) => {
option.addEventListener("click", (e) => {
e.stopPropagation();

const span = trigger.querySelector("span");
if (span) span.innerText = option.innerText;

select.classList.remove("open");
select.dataset.value = option.dataset.value;
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
if (window.innerWidth <= 768 && sidebar.classList.contains("mobile-open")) {
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

const sidebarLinks = document.querySelectorAll("#sidebar a:not(#logoutBtn)");

sidebarLinks.forEach(function (link) {
link.addEventListener("click", function (event) {
event.preventDefault();

const pageName = this.dataset.page;

if (pageName) loadPage(pageName);
});
});
}

function updateSidebarActive(pageName) {
const sidebarLinks = document.querySelectorAll("#sidebar a:not(#logoutBtn)");

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
const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
const rememberMeValue =
localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";

if (savedUser && rememberMeValue) {
try {
const userData = JSON.parse(savedUser);
loginUser(userData);
} catch {}
}
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
if (!rememberMe.checked) {
localStorage.removeItem(STORAGE_KEYS.USER);
localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
}

loginSection.style.display = "flex";
mainHeader.style.display = "none";
sidebar.style.display = "none";
sidebar.classList.remove("mobile-open");

if (loginForm) loginForm.reset();

avatars.forEach((av) => av.classList.remove("avatar--selected"));

if (mainAvatarImg) {
mainAvatarImg.src = "assets/images/Boy image 1.svg";
}

selectedAvatar = "assets/images/Boy image 1.svg";

hideLogoutModal();
}

if (passwordToggle && passwordInput) {
passwordToggle.addEventListener("click", function () {
const type = passwordInput.type === "password" ? "text" : "password";

passwordInput.type = type;

this.classList.toggle("fa-eye");
this.classList.toggle("fa-eye-slash");
});
}

if (loginForm) {
loginForm.addEventListener("submit", function (event) {
event.preventDefault();

const username = usernameInput.value.trim();
const password = passwordInput.value.trim();

if (!username) return showError(usernameInput, "Please enter username");

if (!password) return showError(passwordInput, "Please enter password");

if (password.length < 6)
return showError(passwordInput, "Password must be at least 6 characters");

clearErrors();

const userData = {
username,
avatar: selectedAvatar,
lastLogin: new Date().toISOString()
};

if (rememberMe.checked) {
localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
} else {
localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "false");
}

loginUser(userData);
});
}

if (logoutBtn)
logoutBtn.addEventListener("click", (e) => {
e.preventDefault();
showLogoutModal();
});

if (cancelLogout) cancelLogout.addEventListener("click", hideLogoutModal);

if (confirmLogout) confirmLogout.addEventListener("click", performLogout);

function showLogoutModal() {
logoutModal.classList.add("show");
}

function hideLogoutModal() {
logoutModal.classList.remove("show");
}

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

if (addAvatarBtn && avatarUpload) {
addAvatarBtn.addEventListener("click", () => avatarUpload.click());

avatarUpload.addEventListener("change", function (event) {
const file = event.target.files[0];

if (file) {
const reader = new FileReader();

reader.onload = (e) => {
selectedAvatar = e.target.result;
mainAvatarImg.src = e.target.result;

avatars.forEach((av) =>
av.classList.remove("avatar--selected")
);
};

reader.readAsDataURL(file);
}
});
}

function showError(inputElement, message) {
clearErrors();

const formGroup = inputElement.closest(
".form-group, .form-group--password"
);

const errorDiv = document.createElement("div");

errorDiv.className = "error-message";
errorDiv.textContent = message;

errorDiv.style.cssText =
"color:#dc3545;font-size:10px;margin-top:4px;font-family:'DM Sans',sans-serif;";

formGroup.appendChild(errorDiv);

inputElement.style.borderColor = "#dc3545";
}

function clearErrors() {
document.querySelectorAll(".error-message").forEach((el) => el.remove());

document
.querySelectorAll(".input-field")
.forEach((el) => (el.style.borderColor = "#d1d5db"));
}

})();
