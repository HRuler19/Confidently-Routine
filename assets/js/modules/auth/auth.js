const AuthModule = (function() {
    'use strict';

    let elements = {};

    function init() {
        cacheElements();
        bindEvents();
        checkAutoLogin();
    }

    function cacheElements() {
        elements = {
            loginSection: document.querySelector('.login-section'),
            header: document.querySelector('.header'),
            sidebar: document.getElementById('sidebar'),
            content: document.getElementById('content'),
            welcomeUsername: document.getElementById('welcomeUsername'),
            headerAvatar: document.getElementById('headerAvatar'),
            mainAvatarImg: document.getElementById('mainAvatarImg'),
            loginForm: document.getElementById('loginForm'),
            passwordToggle: document.querySelector('.password-toggle i'),
            passwordInput: document.getElementById('password'),
            avatars: document.querySelectorAll('.avatar:not(.avatar--add)'),
            addAvatarBtn: document.getElementById('addAvatarBtn'),
            avatarUpload: document.getElementById('avatarUpload'),
            usernameInput: document.getElementById('username'),
            rememberMeCheckbox: document.getElementById('remember-me'),
            logoutBtn: document.getElementById('logoutBtn'),
            mainAvatarSelector: document.getElementById('mainAvatarSelector')
        };
    }

    function bindEvents() {
        if (elements.passwordToggle && elements.passwordInput) {
            elements.passwordToggle.addEventListener('click', togglePassword);
        }

        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', handleLogin);
        }

        if (elements.avatars.length && elements.mainAvatarImg) {
            elements.avatars.forEach(avatar => {
                avatar.addEventListener('click', handleAvatarSelect);
            });
        }

        if (elements.addAvatarBtn && elements.avatarUpload) {
            elements.addAvatarBtn.addEventListener('click', () => {
                elements.avatarUpload.click();
            });
            elements.avatarUpload.addEventListener('change', handleAvatarUpload);
        }

        if (elements.usernameInput) {
            elements.usernameInput.addEventListener('blur', validateUsername);
        }

        if (elements.passwordInput) {
            elements.passwordInput.addEventListener('blur', validatePassword);
        }

        document.querySelectorAll('[role="button"]').forEach(element => {
            element.addEventListener('keypress', handleKeyPress);
        });

        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', handleLogout);
        }

        if (elements.mainAvatarSelector) {
            elements.mainAvatarSelector.addEventListener('click', () => {
                document.querySelector('.avatar-list')?.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    let selectedAvatar = '/assets/images/Boy image 1.svg';

    function togglePassword(e) {
        const type = elements.passwordInput.type === 'password' ? 'text' : 'password';
        elements.passwordInput.type = type;
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    }

    function handleAvatarSelect(e) {
        const avatar = this;
        
        elements.avatars.forEach(av => {
            av.classList.remove('avatar--selected');
        });

        avatar.classList.add('avatar--selected');

        const selectedImg = avatar.querySelector('img');
        if (selectedImg) {
            selectedAvatar = selectedImg.src;
            elements.mainAvatarImg.src = selectedImg.src;
        }
    }

    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            
            selectedAvatar = imageData;
            elements.mainAvatarImg.src = imageData;

            elements.avatars.forEach(av => {
                av.classList.remove('avatar--selected');
            });
        };
        reader.readAsDataURL(file);
    }

    function validateUsername() {
        if (!elements.usernameInput.value.trim()) {
            showError(elements.usernameInput, 'Username is required');
            return false;
        }
        clearErrors();
        return true;
    }

    function validatePassword() {
        const password = elements.passwordInput.value.trim();
        if (!password) {
            showError(elements.passwordInput, 'Password is required');
            return false;
        }
        if (password.length < 6) {
            showError(elements.passwordInput, 'Password must be at least 6 characters');
            return false;
        }
        clearErrors();
        return true;
    }

    function showError(inputElement, message) {
        clearErrors();

        const formGroup = inputElement.closest('.form-group, .form-group--password');
        if (!formGroup) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '10px';
        errorDiv.style.marginTop = '4px';
        errorDiv.style.fontFamily = 'DM Sans, sans-serif';

        formGroup.appendChild(errorDiv);
        inputElement.style.borderColor = '#dc3545';
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.input-field').forEach(el => {
            el.style.borderColor = '#d1d5db';
        });
    }

    function handleKeyPress(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    }

    function handleLogin(e) {
        e.preventDefault();

        if (!validateUsername() || !validatePassword()) {
            return;
        }

        const username = elements.usernameInput.value.trim();
        const password = elements.passwordInput.value.trim();
        const rememberMe = elements.rememberMeCheckbox.checked;

        const userData = {
            username: username,
            password: password,
            avatar: selectedAvatar,
            lastLogin: new Date().toISOString()
        };

        AppStore.saveUser(userData, rememberMe);
        loginUser(userData);
    }

    function loginUser(userData) {
        elements.loginSection.style.display = 'none';
        elements.header.style.display = 'flex';
        
        if (window.innerWidth > 768) {
            elements.sidebar.style.display = 'flex';
        }

        if (elements.welcomeUsername) {
            elements.welcomeUsername.textContent = userData.username;
        }

        if (elements.headerAvatar) {
            const avatarImg = elements.headerAvatar.querySelector('img');
            if (avatarImg) {
                avatarImg.src = userData.avatar;
            }
        }

        if (elements.mainAvatarImg) {
            elements.mainAvatarImg.src = userData.avatar;
        }

        if (typeof loadPage === 'function') {
            loadPage('dashboard');
        }
    }

    function handleLogout(e) {
        e.preventDefault();
        const logoutModal = document.getElementById('logoutModal');
        if (logoutModal) {
            logoutModal.classList.add('show');
        }
    }

    function logout() {
        if (!AppStore.isRememberMe()) {
            AppStore.removeUser();
        }

        elements.loginSection.style.display = 'flex';
        elements.header.style.display = 'none';
        elements.sidebar.style.display = 'none';

        if (elements.loginForm) {
            elements.loginForm.reset();
        }

        elements.avatars.forEach(av => {
            av.classList.remove('avatar--selected');
        });

        if (elements.mainAvatarImg) {
            elements.mainAvatarImg.src = '/assets/images/Boy image 1.svg';
        }

        selectedAvatar = '/assets/images/Boy image 1.svg';
    }

    function checkAutoLogin() {
        const savedUser = AppStore.getUser();
        const rememberMe = AppStore.isRememberMe();

        if (savedUser && rememberMe) {
            loginUser(savedUser);
        } else {
            elements.loginSection.style.display = 'flex';
            elements.header.style.display = 'none';
            elements.sidebar.style.display = 'none';
        }
    }

    return {
        init: init,
        login: loginUser,
        logout: logout
    };
})();