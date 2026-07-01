import StorageService from "./StorageService.js";

const STORAGE_KEY = "confidently_sleep";

class SleepStore extends StorageService {
  constructor() {
    super(STORAGE_KEY);
  }

  getEntries() {
    return this.getItem() || {};
  }

  setEntry(dateStr, time) {
    const entries = this.getEntries();
    entries[dateStr] = time;
    return this.setItem(entries);
  }

  clearEntry(dateStr) {
    const entries = this.getEntries();
    delete entries[dateStr];
    return this.setItem(entries);
  }
}

export default new SleepStore();
