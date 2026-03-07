const AppStore = (function() {
    'use strict';

    const STORAGE_KEYS = {
        USER: 'confidently_user',
        REMEMBER_ME: 'confidently_remember',
        SESSION_USER: 'confidently_session_user'
    };

    function setItem(key, value, useSession = false) {
        try {
            const serialized = JSON.stringify(value);
            if (useSession) {
                sessionStorage.setItem(key, serialized);
            } else {
                localStorage.setItem(key, serialized);
            }
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    function getItem(key, useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            const serialized = storage.getItem(key);
            if (serialized === null) return null;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    }

    function removeItem(key, useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            storage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    function clearAll() {
        localStorage.clear();
        sessionStorage.clear();
    }

    function saveUser(userData, rememberMe = false) {
        if (rememberMe) {
            setItem(STORAGE_KEYS.USER, userData);
            setItem(STORAGE_KEYS.REMEMBER_ME, true);
        } else {
            setItem(STORAGE_KEYS.SESSION_USER, userData, true);
            setItem(STORAGE_KEYS.REMEMBER_ME, false);
        }
    }

    function getUser() {
        let user = getItem(STORAGE_KEYS.USER);
        if (user) return user;
        user = getItem(STORAGE_KEYS.SESSION_USER, true);
        return user;
    }

    function isRememberMe() {
        return getItem(STORAGE_KEYS.REMEMBER_ME) === true;
    }

    function removeUser() {
        removeItem(STORAGE_KEYS.USER);
        removeItem(STORAGE_KEYS.SESSION_USER, true);
        removeItem(STORAGE_KEYS.REMEMBER_ME);
    }

    return {
        saveUser,
        getUser,
        isRememberMe,
        removeUser,
        clearAll,
        KEYS: STORAGE_KEYS
    };
})();