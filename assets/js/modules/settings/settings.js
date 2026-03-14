(function () {
  "use strict";

  let selectedAvatar = null;

  // Initialize on page load
  window.addEventListener("pageLoaded", function (e) {
    if (e.detail.page === "settings") {
      initSettings();
    }
  });

  function initSettings() {
    if (!document.querySelector(".settings-page")) return;

    console.log("Settings initialized");

    loadCurrentUserData();
    attachAvatarEvents();
    attachSaveButton();
  }

  function loadCurrentUserData() {
    const user = window.AppStore ? window.AppStore.getUser() : null;
    
    if (user) {
      // Set current avatar
      const currentAvatar = document.getElementById("settingsCurrentAvatar");
      if (currentAvatar && user.avatar) {
        currentAvatar.src = user.avatar;
        selectedAvatar = user.avatar;
      }

      // Set current username
      const currentUsername = document.getElementById("settingsCurrentUsername");
      if (currentUsername && user.username) {
        currentUsername.value = user.username;
      }

      // Mark current avatar as selected
      const avatarOptions = document.querySelectorAll(".settings-avatar-option[data-avatar]");
      avatarOptions.forEach(option => {
        if (option.dataset.avatar === user.avatar) {
          option.classList.add("selected");
        }
      });
    }
  }

  function attachAvatarEvents() {
    const avatarOptions = document.querySelectorAll(".settings-avatar-option[data-avatar]");
    const uploadBtn = document.getElementById("settingsUploadAvatar");
    const uploadInput = document.getElementById("settingsAvatarUpload");

    // Avatar selection
    avatarOptions.forEach(option => {
      option.addEventListener("click", function () {
        // Remove selected from all
        avatarOptions.forEach(opt => opt.classList.remove("selected"));
        
        // Add selected to clicked
        this.classList.add("selected");
        
        // Update selected avatar
        selectedAvatar = this.dataset.avatar;
        
        // Update current avatar preview
        const currentAvatar = document.getElementById("settingsCurrentAvatar");
        if (currentAvatar) {
          currentAvatar.src = selectedAvatar;
        }
      });
    });

    // Upload avatar
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener("click", function () {
        uploadInput.click();
      });

      uploadInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (event) {
            selectedAvatar = event.target.result;
            
            // Update current avatar preview
            const currentAvatar = document.getElementById("settingsCurrentAvatar");
            if (currentAvatar) {
              currentAvatar.src = selectedAvatar;
            }

            // Remove selected from all options
            avatarOptions.forEach(opt => opt.classList.remove("selected"));
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  function attachSaveButton() {
    const saveBtn = document.getElementById("settingsSaveBtn");
    
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        saveSettings();
      });
    }
  }

  function saveSettings() {
    const newUsername = document.getElementById("settingsNewUsername");
    const newPassword = document.getElementById("settingsNewPassword");
    
    const user = window.AppStore ? window.AppStore.getUser() : null;
    if (!user) return;

    let hasChanges = false;

    // Update avatar if changed
    if (selectedAvatar && selectedAvatar !== user.avatar) {
      user.avatar = selectedAvatar;
      hasChanges = true;

      // Update header avatar
      const headerAvatar = document.querySelector("#headerAvatar img");
      if (headerAvatar) {
        headerAvatar.src = selectedAvatar;
      }
    }

    // Update username if provided
    if (newUsername && newUsername.value.trim()) {
      user.username = newUsername.value.trim();
      hasChanges = true;

      // Update header username
      const welcomeMessage = document.getElementById("welcomeMessage");
      if (welcomeMessage) {
        welcomeMessage.textContent = user.username;
      }

      // Update current username display
      const currentUsername = document.getElementById("settingsCurrentUsername");
      if (currentUsername) {
        currentUsername.value = user.username;
      }

      // Clear input
      newUsername.value = "";
    }

    // Update password if provided
    if (newPassword && newPassword.value.trim()) {
      // In a real app, you'd hash this and send to server
      // For now, we'll just acknowledge the change
      hasChanges = true;
      newPassword.value = "";
    }

    // Save to storage
    if (hasChanges && window.AppStore) {
      const rememberMe = window.AppStore.isRememberMe ? window.AppStore.isRememberMe() : false;
      window.AppStore.saveUser(user, rememberMe);
      
      // Show success feedback
      showSaveSuccess();
    }
  }

  function showSaveSuccess() {
    const saveBtn = document.getElementById("settingsSaveBtn");
    if (saveBtn) {
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>Saved!</span>';
      saveBtn.style.background = "#0a4a08";
      
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.style.background = "";
      }, 2000);
    }
  }

  // Public API
  window.SettingsModule = {
    initSettings,
    saveSettings,
  };
})();
