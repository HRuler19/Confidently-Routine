class StorageService {
  constructor(storageKey) {
    this.STORAGE_KEY = storageKey;
  }

  setItem(value, useSession = false) {
    try {
      const serialized = JSON.stringify(value);
      const storage = useSession ? sessionStorage : localStorage;
      storage.setItem(this.STORAGE_KEY, serialized);
      return true;
    } catch (e) {
      console.error(`Storage error (${this.STORAGE_KEY}):`, e);
      return false;
    }
  }

  getItem(useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const serialized = storage.getItem(this.STORAGE_KEY);
      return serialized ? JSON.parse(serialized) : null;
    } catch (e) {
      console.error(`Storage error (${this.STORAGE_KEY}):`, e);
      return null;
    }
  }

  removeItem(useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      storage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (e) {
      console.error(`Storage error (${this.STORAGE_KEY}):`, e);
      return false;
    }
  }
}

export default StorageService;
