import StorageService from "./StorageService.js";

const STORAGE_KEY = "confidently_notes";

class NoteStore extends StorageService {
  constructor() {
    super(STORAGE_KEY);
  }

  getNotes() {
    return this.getItem() || [];
  }

  addNote(note) {
    const notes = this.getNotes();
    notes.unshift(note);
    return this.setItem(notes);
  }

  updateNote(noteId, updates) {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id == noteId);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updates };
      return this.setItem(notes);
    }
    return false;
  }

  deleteNote(noteId) {
    const notes = this.getNotes().filter((n) => n.id != noteId);
    return this.setItem(notes);
  }

  updateNotes(notesArray) {
    return this.setItem(notesArray);
  }
}

export default new NoteStore();
