const AppStore = (function () {
  "use strict";

  const STORAGE_KEYS = {
    USER: "confidently_user",
    REMEMBER_ME: "confidently_remember",
    SESSION_USER: "confidently_session_user",
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
      console.error("Storage error:", e);
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
      console.error("Storage error:", e);
      return null;
    }
  }

  function removeItem(key, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      storage.removeItem(key);
      return true;
    } catch (e) {
      console.error("Storage error:", e);
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
    KEYS: STORAGE_KEYS,
  };
})();

// Task Management Store
const TaskStore = (function () {
  "use strict";

  const STORAGE_KEY = "confidently_tasks";

  // Default tasks - Empty array (user will add tasks dynamically)
  const DEFAULT_TASKS = [];

  /**
   * Initialize tasks from localStorage with default values if empty
   */
  function initializeTasks() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
      return DEFAULT_TASKS;
    }
    return JSON.parse(existing);
  }

  /**
   * Get all tasks from localStorage
   */
  function getTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_TASKS;
    } catch (e) {
      console.error("Error getting tasks:", e);
      return DEFAULT_TASKS;
    }
  }

  /**
   * Add new task to localStorage
   */
  function addTask(task) {
    try {
      const tasks = getTasks();
      tasks.push(task);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (e) {
      console.error("Error adding task:", e);
      return false;
    }
  }

  /**
   * Update task in localStorage
   */
  function updateTask(taskId, updates) {
    try {
      const tasks = getTasks();
      const task = tasks.find((t) => t.id == taskId);
      if (task) {
        Object.assign(task, updates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error updating task:", e);
      return false;
    }
  }

  /**
   * Delete task from localStorage
   */
  function deleteTask(taskId) {
    try {
      const tasks = getTasks();
      const filtered = tasks.filter((t) => t.id != taskId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error("Error deleting task:", e);
      return false;
    }
  }

  /**
   * Update multiple tasks (array)
   */
  function updateTasks(tasksArray) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
      return true;
    } catch (e) {
      console.error("Error updating tasks:", e);
      return false;
    }
  }

  /**
   * Clear all tasks
   */
  function clearTasks() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error("Error clearing tasks:", e);
      return false;
    }
  }

  /**
   * Reset to default tasks
   */
  function resetToDefaults() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
      return true;
    } catch (e) {
      console.error("Error resetting tasks:", e);
      return false;
    }
  }

  return {
    initializeTasks,
    getTasks,
    addTask,
    updateTask,
    deleteTask,
    updateTasks,
    clearTasks,
    resetToDefaults,
    STORAGE_KEY,
  };
})();
