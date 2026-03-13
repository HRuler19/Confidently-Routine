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

  function getTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error getting tasks:", e);
      return [];
    }
  }

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

  function updateTask(taskId, updates) {
    try {
      const tasks = getTasks();
      const index = tasks.findIndex((t) => t.id == taskId);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error updating task:", e);
      return false;
    }
  }

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

  function updateTasks(tasksArray) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
      return true;
    } catch (e) {
      console.error("Error updating tasks:", e);
      return false;
    }
  }

  return {
    getTasks,
    addTask,
    updateTask,
    deleteTask,
    updateTasks,
  };
})();

// Note Management Store
const NoteStore = (function () {
  "use strict";

  const STORAGE_KEY = "confidently_notes";

  function getNotes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error getting notes:", e);
      return [];
    }
  }

  function addNote(note) {
    try {
      const notes = getNotes();
      notes.unshift(note);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      return true;
    } catch (e) {
      console.error("Error adding note:", e);
      return false;
    }
  }

  function updateNote(noteId, updates) {
    try {
      const notes = getNotes();
      const index = notes.findIndex((n) => n.id == noteId);
      if (index !== -1) {
        notes[index] = { ...notes[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error updating note:", e);
      return false;
    }
  }

  function deleteNote(noteId) {
    try {
      const notes = getNotes();
      const filtered = notes.filter((n) => n.id != noteId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error("Error deleting note:", e);
      return false;
    }
  }

  function updateNotes(notesArray) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray));
      return true;
    } catch (e) {
      console.error("Error updating notes:", e);
      return false;
    }
  }

  return {
    getNotes,
    addNote,
    updateNote,
    deleteNote,
    updateNotes,
  };
})();
