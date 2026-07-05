// Notes — port of the vanilla notes module: textarea + date/category
// sidebar, sort & category filters, count badge, inline editing, and a
// delete confirmation modal. Same Note shape + storage key.
import { createSignal, createMemo, For, Show } from "solid-js";
import { notes, addNote, updateNote, deleteNote, type Note } from "../lib/stores";
import { t } from "../lib/i18n";
import Select from "../components/Select";
import ConfirmModal from "../components/ConfirmModal";

const NOTE_CATEGORIES = ["study", "work", "personal", "learning"] as const;

function noteCategoryOptions() {
  return NOTE_CATEGORIES.map((c) => ({ value: c, label: () => t(`notes.category_${c}`) }));
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/** Inline edit form for a note card. */
function NoteEditForm(props: {
  note: Note;
  onSave: (updates: Partial<Note>) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = createSignal(props.note.content);
  const [category, setCategory] = createSignal(props.note.category);
  const [date, setDate] = createSignal(props.note.date || todayStr());

  return (
    <div class="flex w-full flex-col gap-3">
      <textarea
        class="min-h-24 w-full resize-y rounded-lg border border-line-input bg-surface p-3 text-sm text-primary focus:border-accent focus:outline-none"
        value={content()}
        onInput={(e) => setContent(e.currentTarget.value)}
      />
      <div class="flex flex-wrap gap-3">
        <input
          type="date"
          class="h-10 rounded-lg border border-line-input bg-surface px-3 text-sm text-secondary focus:border-accent focus:outline-none"
          value={date()}
          onInput={(e) => setDate(e.currentTarget.value)}
        />
        <Select class="w-40" value={category()} options={noteCategoryOptions()} onChange={setCategory} />
      </div>
      <div class="flex gap-2.5 max-[768px]:flex-col">
        <button
          type="button"
          class="cursor-pointer rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fill-text transition-colors hover:bg-accent-hover"
          onClick={() => {
            const text = content().trim();
            if (!text) return;
            props.onSave({ content: text, category: category(), date: date() });
          }}
        >
          <i class="fa-solid fa-check mr-1.5" />
          {t("common.save")}
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-hover"
          onClick={props.onCancel}
        >
          <i class="fa-solid fa-xmark mr-1.5" />
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

export default function Notes() {
  const [newContent, setNewContent] = createSignal("");
  const [newDate, setNewDate] = createSignal(todayStr());
  const [newCategory, setNewCategory] = createSignal("study");
  const [sortFilter, setSortFilter] = createSignal("all");
  const [categoryFilter, setCategoryFilter] = createSignal("all");
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [pendingDelete, setPendingDelete] = createSignal<Note | null>(null);

  const visibleNotes = createMemo(() => {
    let filtered = [...notes()];
    if (categoryFilter() !== "all") {
      filtered = filtered.filter((n) => n.category === categoryFilter());
    }
    if (sortFilter() === "recent") {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortFilter() === "oldest") {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    }
    return filtered;
  });

  function submitNewNote() {
    const content = newContent().trim();
    if (!content) return;
    addNote({
      id: Date.now(),
      content,
      category: newCategory(),
      date: newDate() || todayStr(),
      createdAt: Date.now(),
    });
    setNewContent("");
    setNewDate(todayStr());
  }

  return (
    <>
      {/* Add-note card */}
      <section class="rounded-xl bg-surface p-6 shadow-sm shadow-(color:--shadow-color)">
        <div class="flex gap-5 max-[768px]:flex-col">
          <textarea
            class="min-h-36 flex-1 resize-y rounded-lg border border-line-input bg-surface p-4 text-sm text-primary placeholder:text-placeholder focus:border-accent focus:outline-none"
            placeholder={t("notes.add_placeholder")}
            value={newContent()}
            onInput={(e) => setNewContent(e.currentTarget.value)}
          />
          <div class="flex w-56 flex-col gap-4 max-[768px]:w-full">
            <button
              type="button"
              disabled={newContent().trim() === ""}
              class="h-11 cursor-pointer rounded-lg bg-accent px-6 text-sm font-medium text-accent-fill-text transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              onClick={submitNewNote}
            >
              <i class="fa-solid fa-plus mr-2" />
              {t("notes.add_button")}
            </button>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-tertiary">{t("notes.date_label")}</label>
              <input
                type="date"
                class="h-10 rounded-lg border border-line-input bg-surface px-3 text-sm text-secondary focus:border-accent focus:outline-none"
                value={newDate()}
                onInput={(e) => setNewDate(e.currentTarget.value)}
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-tertiary">{t("notes.category_label")}</label>
              <Select value={newCategory()} options={noteCategoryOptions()} onChange={setNewCategory} />
            </div>
          </div>
        </div>
      </section>

      {/* Filters + count */}
      <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium text-secondary">{t("notes.filters_label")}</span>
          <Select
            class="w-36"
            value={sortFilter()}
            onChange={setSortFilter}
            options={[
              { value: "all", label: () => t("notes.sort_all") },
              { value: "recent", label: () => t("notes.sort_recent") },
              { value: "oldest", label: () => t("notes.sort_oldest") },
            ]}
          />
          <Select
            class="w-40"
            value={categoryFilter()}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: () => t("notes.filter_all_categories") },
              ...noteCategoryOptions(),
            ]}
          />
        </div>
        <div class="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">
          <span class="size-2.5 rounded-full" style={{ "background-color": "var(--stat-total)" }} />
          <span class="font-semibold text-primary">{visibleNotes().length}</span>
          <span class="text-tertiary">{t("notes.stat_total")}</span>
        </div>
      </div>

      {/* Notes list */}
      <div class="mt-5 flex flex-col gap-3">
        <Show
          when={visibleNotes().length > 0}
          fallback={
            <div class="rounded-xl bg-surface p-10 text-center text-sm text-muted shadow-sm shadow-(color:--shadow-color)">
              {t("notes.empty_state")}
            </div>
          }
        >
          <For each={visibleNotes()}>
            {(note) => (
              <div class="flex items-start gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm shadow-(color:--shadow-color) transition-shadow hover:shadow-md max-[768px]:flex-col">
                <Show
                  when={editingId() === note.id}
                  fallback={
                    <>
                      <div class="flex min-w-0 flex-1 items-center justify-between gap-4 max-[768px]:w-full max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-2.5">
                        <div class="whitespace-pre-line text-sm leading-relaxed text-primary">
                          {note.content}
                        </div>
                        <div class="flex shrink-0 items-center gap-4 max-[768px]:w-full max-[768px]:flex-wrap">
                          <span class="rounded-full border border-accent px-3.5 py-1 text-xs font-medium text-accent">
                            {t(`notes.category_${note.category}`)}
                          </span>
                          <span class="flex items-center gap-1.5 text-sm text-tertiary">
                            <i class="fa-regular fa-calendar" />
                            {note.date}
                          </span>
                        </div>
                      </div>
                      <div class="flex gap-2 max-[768px]:w-full">
                        <button
                          type="button"
                          title={t("notes.edit_tooltip")}
                          class="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-secondary transition-colors hover:border-accent hover:text-accent max-[768px]:h-11 max-[768px]:flex-1"
                          onClick={() => setEditingId(note.id)}
                        >
                          <i class="fa-solid fa-pen" />
                          <span class="hidden max-[768px]:inline">{t("common.edit")}</span>
                        </button>
                        <button
                          type="button"
                          title={t("notes.delete_tooltip")}
                          class="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-surface px-3 text-sm text-danger transition-colors hover:border-danger hover:bg-danger/10 max-[768px]:h-11 max-[768px]:flex-1"
                          onClick={() => setPendingDelete(note)}
                        >
                          <i class="fa-solid fa-trash" />
                          <span class="hidden max-[768px]:inline">{t("common.delete")}</span>
                        </button>
                      </div>
                    </>
                  }
                >
                  <NoteEditForm
                    note={note}
                    onSave={(updates) => {
                      updateNote(note.id, updates);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </Show>
              </div>
            )}
          </For>
        </Show>
      </div>

      <ConfirmModal
        open={pendingDelete() !== null}
        icon="fa-solid fa-trash-can"
        title={t("notes.delete_modal_title")}
        body={
          <>
            <p>{t("notes.delete_modal_body")}</p>
            <p class="mt-2 truncate rounded-lg border-l-3 border-danger bg-surface-alt px-3 py-2 font-semibold text-primary">
              "{pendingDelete()?.content.slice(0, 60)}"
            </p>
          </>
        }
        cancelText={t("common.cancel")}
        confirmText={t("common.confirm_delete")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const note = pendingDelete();
          if (note) deleteNote(note.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
