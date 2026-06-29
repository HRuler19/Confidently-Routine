import StorageService from "./StorageService.js";

const STORAGE_KEY = "confidently_tasks";

class TaskStore extends StorageService {
  constructor() {
    super(STORAGE_KEY);
  }

  getTasks() {
    return this.getItem() || [];
  }

  addTask(task) {
    const tasks = this.getTasks();
    tasks.push(task);
    return this.setItem(tasks);
  }

  updateTask(taskId, updates) {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id == taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      return this.setItem(tasks);
    }
    return false;
  }

  deleteTask(taskId) {
    const tasks = this.getTasks().filter((t) => t.id != taskId);
    return this.setItem(tasks);
  }

  updateTasks(tasksArray) {
    return this.setItem(tasksArray);
  }
}

export default new TaskStore();
