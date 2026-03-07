(function() {
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

    document.addEventListener("DOMContentLoaded", function() {
        loginSection.style.display = "flex";
        mainHeader.style.display = "none";
        sidebar.style.display = "none";
        
        checkSavedUser();
        loadPage("dashboard");
        setupMobileNavigation();
    });

    // Mobile navigation setup 
    function setupMobileNavigation() {
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener("click", function(e) {
                e.stopPropagation(); 
                sidebar.classList.toggle("mobile-open");
                console.log("Hamburger clicked", sidebar.classList); 
            });
        }

        // Click outside close
        document.addEventListener("click", function(event) {
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains("mobile-open")) {
                    if (!sidebar.contains(event.target) && !hamburgerBtn.contains(event.target)) {
                        sidebar.classList.remove("mobile-open");
                    }
                }
            }
        });

        // Touch event 
        document.addEventListener("touchstart", function(event) {
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains("mobile-open")) {
                    if (!sidebar.contains(event.target) && !hamburgerBtn.contains(event.target)) {
                        sidebar.classList.remove("mobile-open");
                    }
                }
            }
        });

        mobileNavItems.forEach(item => {
            item.addEventListener("click", function(e) {
                e.preventDefault();
                const pageName = this.dataset.page;
                if (pageName) {
                    loadPage(pageName);
                    
                    mobileNavItems.forEach(nav => nav.classList.remove("active"));
                    this.classList.add("active");
                    
                    updateSidebarActive(pageName);
                }
            });
        });
    }

    function updateSidebarActive(pageName) {
        const sidebarLinks = document.querySelectorAll("#sidebar a:not(#logoutBtn)");
        sidebarLinks.forEach(link => {
            const menuItem = link.querySelector('.menu-item');
            if (menuItem) {
                menuItem.classList.remove('active');
                if (link.dataset.page === pageName) {
                    menuItem.classList.add('active');
                }
            }
        });
    }

    function checkSavedUser() {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const rememberMeValue = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";

        if (savedUser && rememberMeValue) {
            try {
                const userData = JSON.parse(savedUser);
                loginUser(userData);
            } catch (e) {
                console.error("Error parsing saved user", e);
            }
        }
    }

    function loginUser(userData) {
        loginSection.style.display = "none";
        mainHeader.style.display = "flex";
        
        // Sidebar view
        if (window.innerWidth > 768) {
            sidebar.style.display = "flex";
            sidebar.classList.remove("mobile-open");
        } else {
            sidebar.style.display = "flex"; 
            sidebar.classList.remove("mobile-open");
        }

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

    function showLogoutModal() {
        logoutModal.classList.add("show");
    }

    function hideLogoutModal() {
        logoutModal.classList.remove("show");
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

        if (loginForm) {
            loginForm.reset();
        }

        avatars.forEach(av => {
            av.classList.remove("avatar--selected");
        });

        if (mainAvatarImg) {
            mainAvatarImg.src = "assets/images/Boy image 1.svg";
        }
        selectedAvatar = "assets/images/Boy image 1.svg";
        
        hideLogoutModal();
    }

    // Password toggle
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", function() {
            const type = passwordInput.type === "password" ? "text" : "password";
            passwordInput.type = type;
            this.classList.toggle("fa-eye");
            this.classList.toggle("fa-eye-slash");
        });
    }

    // Form submit
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const rememberMeChecked = rememberMe.checked;

            if (!username) {
                showError(usernameInput, "Please enter username");
                return;
            }

            if (!password) {
                showError(passwordInput, "Please enter password");
                return;
            }

            if (password.length < 6) {
                showError(passwordInput, "Password must be at least 6 characters");
                return;
            }

            clearErrors();

            const userData = {
                username: username,
                avatar: selectedAvatar,
                lastLogin: new Date().toISOString()
            };

            if (rememberMeChecked) {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
                localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
            } else {
                localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "false");
            }

            loginUser(userData);
        });
    }

    // Error functions
    function showError(inputElement, message) {
        clearErrors();

        const formGroup = inputElement.closest(".form-group, .form-group--password");
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = message;
        errorDiv.style.color = "#dc3545";
        errorDiv.style.fontSize = "10px";
        errorDiv.style.marginTop = "4px";
        errorDiv.style.fontFamily = "DM Sans, sans-serif";

        formGroup.appendChild(errorDiv);
        inputElement.style.borderColor = "#dc3545";
    }

    function clearErrors() {
        document.querySelectorAll(".error-message").forEach((el) => el.remove());
        document.querySelectorAll(".input-field").forEach((el) => {
            el.style.borderColor = "#d1d5db";
        });
    }

    // Avatar selection 
    if (avatars.length && mainAvatarImg) {
        avatars.forEach(function(avatar) {
            avatar.addEventListener("click", function() {
                avatars.forEach(function(av) {
                    av.classList.remove("avatar--selected");
                });

                this.classList.add("avatar--selected");

                const selectedImg = this.querySelector("img");
                if (selectedImg) {
                    selectedAvatar = selectedImg.src;
                    mainAvatarImg.src = selectedImg.src;
                }
            });
        });
    }

    // Custom avatar upload 
    if (addAvatarBtn && avatarUpload) {
        addAvatarBtn.addEventListener("click", function() {
            avatarUpload.click();
        });

        avatarUpload.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = e.target.result;
                    
                    selectedAvatar = imageData;
                    mainAvatarImg.src = imageData;
                    
                    avatars.forEach(av => {
                        av.classList.remove("avatar--selected");
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Real-time validation
    if (usernameInput) {
        usernameInput.addEventListener("blur", function() {
            if (!this.value.trim()) {
                showError(this, "Username is required");
            } else {
                clearErrors();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("blur", function() {
            if (!this.value.trim()) {
                showError(this, "Password is required");
            } else if (this.value.length < 6) {
                showError(this, "Password must be at least 6 characters");
            } else {
                clearErrors();
            }
        });
    }

    // Keyboard support
    document.querySelectorAll('[role="button"]').forEach(function(element) {
        element.addEventListener("keypress", function(event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.click();
            }
        });
    });

    // Logout button click
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(event) {
            event.preventDefault();
            showLogoutModal();
        });
    }

    // Modal buttons
    if (cancelLogout) {
        cancelLogout.addEventListener("click", hideLogoutModal);
    }

    if (confirmLogout) {
        confirmLogout.addEventListener("click", performLogout);
    }

    // Close modal on outside click
    window.addEventListener("click", function(event) {
        if (event.target === logoutModal) {
            hideLogoutModal();
        }
    });

    // Page loading function
    async function loadPage(pageName) {
        try {
            const response = await fetch(`views/${pageName}.html`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            content.innerHTML = html;
            
            updateSidebarActive(pageName);
            
            mobileNavItems.forEach(item => {
                item.classList.remove("active");
                if (item.dataset.page === pageName) {
                    item.classList.add("active");
                }
            });
        } catch (error) {
            console.error("Page error:", error);
            content.innerHTML = `<p>Page error</p>`;
        }
    }

    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll("#sidebar a:not(#logoutBtn)");
    sidebarLinks.forEach(function(link) {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            
            const pageName = this.dataset.page;
            
            if (pageName) {
                loadPage(pageName);
                
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove("mobile-open");
                }
            }
        });
    });

    // Window resize handler
    window.addEventListener("resize", function() {
        if (window.innerWidth > 768) {
            // Desktop
            if (loginSection.style.display === "none") {
                sidebar.style.display = "flex";
            }
            sidebar.classList.remove("mobile-open");
        } else {
            // Mobile
            if (loginSection.style.display === "none") {
                sidebar.style.display = "flex"; 
                sidebar.classList.remove("mobile-open");
            }
        }
    });
})();