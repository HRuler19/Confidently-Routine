// Notes — port of the vanilla notes module: textarea + date/category
// sidebar, sort & category filters, count badge, and inline editing.
// Deleting shows a toast with Undo instead of a blocking confirmation.
import { createSignal, createMemo, For, Show } from "solid-js";
import { notes, addNote, updateNote, deleteNote, type Note } from "../lib/stores";
import { t } from "../lib/i18n";
import Select from "../components/Select";
import DatePicker from "../components/DatePicker";
import { Button, Textarea, Card, StatBadge } from "../components/ui";
import { showToast } from "../lib/toast";
import { todayStr } from "../lib/dates";
import { Plus, Check, X, Calendar, Pencil, Trash2 } from "lucide-solid";

const NOTE_CATEGORIES = ["study", "work", "personal", "learning"] as const;

function noteCategoryOptions() {
  return NOTE_CATEGORIES.map((c) => ({ value: c, label: () => t(`notes.category_${c}`) }));
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
      <Textarea
        class="min-h-24 w-full"
        value={content()}
        onInput={(e) => setContent(e.currentTarget.value)}
      />
      <div class="flex flex-wrap gap-3">
        <DatePicker class="w-fit" value={date()} onChange={setDate} ariaLabel={t("notes.date_label")} />
        <Select class="w-40" value={category()} options={noteCategoryOptions()} onChange={setCategory} />
      </div>
      <div class="flex gap-2.5 max-[768px]:flex-col">
        <Button
          variant="primary"
          class="px-5 py-2.5"
          onClick={() => {
            const text = content().trim();
            if (!text) return;
            props.onSave({ content: text, category: category(), date: date() });
          }}
        >
          <Check size={15} class="mr-1.5 inline-block align-[-2px]" />
          {t("common.save")}
        </Button>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-hover"
          onClick={props.onCancel}
        >
          <X size={15} class="mr-1.5 inline-block align-[-2px]" />
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

  function handleDelete(note: Note) {
    deleteNote(note.id);
    showToast({
      message: t("notes.deleted_toast"),
      actionLabel: t("common.undo"),
      onAction: () => addNote(note),
    });
  }

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
      <Card>
        <div class="flex gap-5 max-[768px]:flex-col">
          <Textarea
            class="min-h-36 flex-1 p-4"
            placeholder={t("notes.add_placeholder")}
            value={newContent()}
            onInput={(e) => setNewContent(e.currentTarget.value)}
          />
          <div class="flex w-56 flex-col gap-4 max-[768px]:w-full">
            <Button
              variant="primary"
              class="h-11 px-6"
              disabled={newContent().trim() === ""}
              onClick={submitNewNote}
            >
              <Plus size={16} class="mr-2 inline-block align-[-3px]" />
              {t("notes.add_button")}
            </Button>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-tertiary">{t("notes.date_label")}</label>
              <DatePicker value={newDate()} onChange={setNewDate} ariaLabel={t("notes.date_label")} />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-tertiary">{t("notes.category_label")}</label>
              <Select value={newCategory()} options={noteCategoryOptions()} onChange={setNewCategory} />
            </div>
          </div>
        </div>
      </Card>

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
        <StatBadge dot="var(--stat-total)" count={visibleNotes().length} label={t("notes.stat_total")} />
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
                            <Calendar size={14} />
                            {note.date}
                          </span>
                        </div>
                      </div>
                      <div class="flex gap-2 max-[768px]:w-full">
                        <Button
                          variant="outline"
                          title={t("notes.edit_tooltip")}
                          class="flex h-9 items-center justify-center gap-2 px-3 max-[768px]:h-11 max-[768px]:flex-1"
                          onClick={() => setEditingId(note.id)}
                        >
                          <Pencil size={15} />
                          <span class="hidden max-[768px]:inline">{t("common.edit")}</span>
                        </Button>
                        <Button
                          variant="danger-outline"
                          title={t("notes.delete_tooltip")}
                          class="flex h-9 items-center justify-center gap-2 px-3 max-[768px]:h-11 max-[768px]:flex-1"
                          onClick={() => handleDelete(note)}
                        >
                          <Trash2 size={15} />
                          <span class="hidden max-[768px]:inline">{t("common.delete")}</span>
                        </Button>
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
    </>
  );
}
