import StorageService from "./StorageService.js";

const STORAGE_KEY = "confidently_habit_entries";

function entryKey(habitId, dateStr) {
  return `${habitId}_${dateStr}`;
}

class HabitEntryStore extends StorageService {
  constructor() {
    super(STORAGE_KEY);
  }

  getEntries() {
    return this.getItem() || {};
  }

  getEntry(habitId, dateStr) {
    const entries = this.getEntries();
    return entries[entryKey(habitId, dateStr)] || null;
  }

  setEntry(habitId, dateStr, entry) {
    const entries = this.getEntries();
    entries[entryKey(habitId, dateStr)] = entry;
    return this.setItem(entries);
  }

  clearEntry(habitId, dateStr) {
    const entries = this.getEntries();
    delete entries[entryKey(habitId, dateStr)];
    return this.setItem(entries);
  }

  deleteHabitEntries(habitId) {
    const entries = this.getEntries();
    const prefix = `${habitId}_`;
    Object.keys(entries).forEach((key) => {
      if (key.startsWith(prefix)) delete entries[key];
    });
    return this.setItem(entries);
  }
}

export default new HabitEntryStore();
