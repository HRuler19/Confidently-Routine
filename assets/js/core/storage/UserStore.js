import StorageService from "./StorageService.js";

const STORAGE_KEYS = {
  USER: "confidently_user",
  REMEMBER_ME: "confidently_remember",
  SESSION_USER: "confidently_session_user",
};

class UserStore extends StorageService {
  constructor() {
    super(STORAGE_KEYS.USER);
  }

  saveUser(userData, rememberMe = false) {
    if (rememberMe) {
      this.setItem(userData);
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, true);
    } else {
      sessionStorage.setItem(
        STORAGE_KEYS.SESSION_USER,
        JSON.stringify(userData),
      );
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, false);
    }
  }

  getUser() {
    let user = this.getItem();
    if (user) return user;

    user = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SESSION_USER));
    return user;
  }

  isRememberMe() {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
  }

  removeUser() {
    this.removeItem();
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  }

  clearAll() {
    localStorage.clear();
    sessionStorage.clear();
  }
}

export default new UserStore();
