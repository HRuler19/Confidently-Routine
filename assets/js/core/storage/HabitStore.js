import StorageService from "./StorageService.js";

const STORAGE_KEY = "confidently_habits";

class HabitStore extends StorageService {
  constructor() {
    super(STORAGE_KEY);
  }

  getHabits() {
    return this.getItem() || [];
  }

  addHabit(name) {
    const habits = this.getHabits();
    const habit = { id: Date.now(), name };
    habits.push(habit);
    this.setItem(habits);
    return habit;
  }

  updateHabit(habitId, name) {
    const habits = this.getHabits();
    const index = habits.findIndex((h) => h.id == habitId);
    if (index !== -1) {
      habits[index] = { ...habits[index], name };
      return this.setItem(habits);
    }
    return false;
  }

  deleteHabit(habitId) {
    const habits = this.getHabits().filter((h) => h.id != habitId);
    return this.setItem(habits);
  }
}

export default new HabitStore();
