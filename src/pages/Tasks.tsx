// Daily Tasks — port of the vanilla routines module: add row with
// category/priority/due-date, three filters, live stat badges, inline
// edit form, and a delete confirmation modal. Same Task shape + storage.
import { createSignal, createMemo, For, Show } from "solid-js";
import {
  tasks,
  addTask,
  updateTask,
  deleteTask,
  type Task,
} from "../lib/stores";
import { t } from "../lib/i18n";
import Select from "../components/Select";
import ConfirmModal from "../components/ConfirmModal";

const CATEGORY_VALUES = ["personal", "work", "shopping", "other"] as const;
const PRIORITY_VALUES = ["low", "medium", "high", "hard"] as const;

function categoryOptions() {
  return CATEGORY_VALUES.map((c) => ({ value: c, label: () => t(`routines.category_${c}`) }));
}

function priorityOptions() {
  return PRIORITY_VALUES.map((p) => ({ value: p, label: () => t(`routines.priority_${p}`) }));
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return t("routines.date_today");
  if (diffDays === 1) return t("routines.date_tomorrow");
  if (diffDays === -1) return t("routines.date_yesterday");
  if (diffDays < -1) return t("routines.date_days_ago", { n: Math.abs(diffDays) });
  if (diffDays > 1) return t("routines.date_in_days", { n: diffDays });
  return dateStr.split("-").reverse().join("/");
}

/** Inline edit form shown in place of a task row. */
function TaskEditForm(props: {
  task: Task;
  onSave: (updates: Partial<Task>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = createSignal(props.task.title);
  const [category, setCategory] = createSignal(props.task.category.toLowerCase());
  const [priority, setPriority] = createSignal(props.task.priority);
  const [dueDate, setDueDate] = createSignal(props.task.dueDate);

  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-tertiary">{t("routines.task_title_label")}</label>
        <input
          type="text"
          class="h-10 rounded-lg border border-line-input bg-surface px-3 text-sm text-primary focus:border-accent focus:outline-none"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
        />
      </div>
      <div class="flex gap-3 max-[576px]:flex-col">
        <div class="flex flex-1 flex-col gap-1">
          <label class="text-xs font-medium text-tertiary">{t("routines.category_label")}</label>
          <Select value={category()} options={categoryOptions()} onChange={setCategory} />
        </div>
        <div class="flex flex-1 flex-col gap-1">
          <label class="text-xs font-medium text-tertiary">{t("routines.priority_label")}</label>
          <Select value={priority()} options={priorityOptions()} onChange={setPriority} />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-tertiary">{t("routines.due_date_label")}</label>
        <input
          type="date"
          class="h-10 w-fit rounded-lg border border-line-input bg-surface px-3 text-sm text-primary focus:border-accent focus:outline-none max-[576px]:w-full"
          value={dueDate()}
          onInput={(e) => setDueDate(e.currentTarget.value)}
        />
      </div>
      <div class="flex gap-2.5 max-[768px]:flex-col">
        <button
          type="button"
          class="cursor-pointer rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fill-text transition-colors hover:bg-accent-hover"
          onClick={() => {
            const newTitle = title().trim();
            if (!newTitle) return;
            const cat = category();
            props.onSave({
              title: newTitle,
              category: cat.charAt(0).toUpperCase() + cat.slice(1),
              priority: priority(),
              dueDate: dueDate(),
              displayDate: formatDisplayDate(dueDate()),
            });
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

export default function Tasks() {
  const [newTitle, setNewTitle] = createSignal("");
  const [newCategory, setNewCategory] = createSignal("personal");
  const [newPriority, setNewPriority] = createSignal("medium");
  const [newDate, setNewDate] = createSignal(todayStr());
  const [statusFilter, setStatusFilter] = createSignal("all");
  const [categoryFilter, setCategoryFilter] = createSignal("all");
  const [priorityFilter, setPriorityFilter] = createSignal("all");
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [pendingDelete, setPendingDelete] = createSignal<Task | null>(null);

  const visibleTasks = createMemo(() =>
    tasks().filter((task) => {
      if (statusFilter() !== "all") {
        const status = task.completed ? "completed" : "active";
        if (status !== statusFilter()) return false;
      }
      if (categoryFilter() !== "all" && task.category.toLowerCase() !== categoryFilter()) {
        return false;
      }
      if (priorityFilter() !== "all" && task.priority !== priorityFilter()) return false;
      return true;
    }),
  );

  const completedVisible = createMemo(() => visibleTasks().filter((t) => t.completed).length);

  function submitNewTask() {
    const title = newTitle().trim();
    if (!title) return;
    const cat = newCategory();
    addTask({
      id: Date.now(),
      title,
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      priority: newPriority(),
      dueDate: newDate() || todayStr(),
      displayDate: formatDisplayDate(newDate() || todayStr()),
      completed: false,
    });
    setNewTitle("");
    setNewDate(todayStr());
  }

  return (
    <>
      {/* Add-task card */}
      <section class="rounded-xl bg-surface p-6 shadow-sm shadow-(color:--shadow-color)">
        <div class="flex gap-3 max-[768px]:flex-col">
          <input
            type="text"
            class="h-11 flex-1 rounded-lg border border-line-input bg-surface px-4 text-sm text-primary placeholder:text-placeholder focus:border-accent focus:outline-none"
            placeholder={t("routines.add_placeholder")}
            value={newTitle()}
            onInput={(e) => setNewTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNewTask()}
          />
          <button
            type="button"
            disabled={newTitle().trim() === ""}
            class="h-11 cursor-pointer rounded-lg bg-accent px-6 text-sm font-medium text-accent-fill-text transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            onClick={submitNewTask}
          >
            <i class="fa-solid fa-plus mr-2" />
            {t("routines.add_button")}
          </button>
        </div>

        <hr class="my-5 border-line" />

        <div class="flex flex-wrap gap-6 max-[768px]:flex-col max-[768px]:gap-4">
          <div class="flex min-w-40 flex-1 flex-col gap-1.5">
            <span class="text-xs font-medium text-tertiary">{t("routines.category_label")}</span>
            <Select value={newCategory()} options={categoryOptions()} onChange={setNewCategory} />
          </div>
          <div class="flex min-w-40 flex-1 flex-col gap-1.5">
            <span class="text-xs font-medium text-tertiary">{t("routines.priority_label")}</span>
            <Select value={newPriority()} options={priorityOptions()} onChange={setNewPriority} />
          </div>
          <div class="flex min-w-40 flex-1 flex-col gap-1.5">
            <span class="text-xs font-medium text-tertiary">{t("routines.due_date_label")}</span>
            <input
              type="date"
              class="h-10 rounded-lg border border-line-input bg-surface px-3 text-sm text-secondary focus:border-accent focus:outline-none"
              value={newDate()}
              onInput={(e) => setNewDate(e.currentTarget.value)}
            />
          </div>
        </div>
      </section>

      {/* Filters + stats */}
      <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium text-secondary">{t("routines.filters_label")}</span>
          <Select
            class="w-36"
            value={statusFilter()}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: () => t("routines.status_all") },
              { value: "active", label: () => t("routines.status_active") },
              { value: "completed", label: () => t("routines.status_completed") },
            ]}
          />
          <Select
            class="w-40"
            value={categoryFilter()}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: () => t("routines.filter_all_categories") },
              ...categoryOptions(),
            ]}
          />
          <Select
            class="w-38"
            value={priorityFilter()}
            onChange={setPriorityFilter}
            options={[
              { value: "all", label: () => t("routines.filter_all_priorities") },
              ...priorityOptions(),
            ]}
          />
        </div>

        <div class="flex gap-2.5 max-[480px]:w-full">
          <For
            each={[
              { dot: "var(--stat-total)", count: () => visibleTasks().length, key: "routines.stat_total" },
              { dot: "var(--stat-completed)", count: completedVisible, key: "routines.stat_completed" },
              { dot: "var(--stat-active)", count: () => visibleTasks().length - completedVisible(), key: "routines.stat_active" },
            ]}
          >
            {(stat) => (
              <div class="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm max-[480px]:flex-1 max-[480px]:justify-center max-[480px]:px-1.5 max-[480px]:text-xs">
                <span class="size-2.5 rounded-full" style={{ "background-color": stat.dot }} />
                <span class="font-semibold text-primary">{stat.count()}</span>
                <span class="text-tertiary">{t(stat.key)}</span>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Task list */}
      <div class="mt-5 flex flex-col gap-3">
        <Show
          when={visibleTasks().length > 0}
          fallback={
            <div class="rounded-xl bg-surface p-10 text-center text-sm text-muted shadow-sm shadow-(color:--shadow-color)">
              {t("routines.empty_state")}
            </div>
          }
        >
          <For each={visibleTasks()}>
            {(task) => (
              <div
                class="rounded-xl border border-line bg-surface p-4 shadow-sm shadow-(color:--shadow-color) transition-shadow hover:shadow-md"
                classList={{ "opacity-70": task.completed }}
              >
                <Show
                  when={editingId() === task.id}
                  fallback={
                    <div class="flex items-center gap-4 max-[768px]:flex-col max-[768px]:items-stretch max-[768px]:gap-2.5">
                      <div class="flex min-w-0 flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          class="task-check"
                          checked={task.completed}
                          onChange={(e) =>
                            updateTask(task.id, { completed: e.currentTarget.checked })
                          }
                        />
                        <h3
                          class="truncate text-base font-medium text-primary"
                          classList={{ "line-through text-muted": task.completed }}
                        >
                          {task.title}
                        </h3>
                      </div>

                      <div class="flex flex-wrap items-center gap-3">
                        <span
                          class="rounded-full border px-3.5 py-1 text-xs font-medium"
                          style={{
                            color: `var(--cat-${task.category.toLowerCase()}, var(--cat-other))`,
                            "border-color": `var(--cat-${task.category.toLowerCase()}, var(--cat-other))`,
                          }}
                        >
                          {t(`routines.category_${task.category.toLowerCase()}`)}
                        </span>
                        <span
                          class="text-sm font-medium"
                          style={{ color: `var(--prio-${task.priority}, var(--prio-medium))` }}
                        >
                          {t(`routines.priority_${task.priority}`)}
                        </span>
                        <span class="flex items-center gap-1.5 text-sm text-tertiary">
                          <i class="fa-regular fa-calendar" />
                          {formatDisplayDate(task.dueDate)}
                        </span>
                      </div>

                      <div class="flex gap-2">
                        <button
                          type="button"
                          class="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-secondary transition-colors hover:border-accent hover:text-accent max-[768px]:h-11 max-[768px]:flex-1"
                          onClick={() => setEditingId(task.id)}
                        >
                          <i class="fa-solid fa-pen" />
                          <span class="hidden max-[768px]:inline">{t("common.edit")}</span>
                        </button>
                        <button
                          type="button"
                          class="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-surface px-3 text-sm text-danger transition-colors hover:border-danger hover:bg-danger/10 max-[768px]:h-11 max-[768px]:flex-1"
                          onClick={() => setPendingDelete(task)}
                        >
                          <i class="fa-solid fa-trash-can" />
                          <span class="hidden max-[768px]:inline">{t("common.delete")}</span>
                        </button>
                      </div>
                    </div>
                  }
                >
                  <TaskEditForm
                    task={task}
                    onSave={(updates) => {
                      updateTask(task.id, updates);
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
        title={t("routines.delete_modal_title")}
        body={
          <>
            <p>{t("routines.delete_modal_body")}</p>
            <p class="mt-2 rounded-lg border-l-3 border-danger bg-surface-alt px-3 py-2 font-semibold text-primary">
              "{pendingDelete()?.title}"
            </p>
          </>
        }
        cancelText={t("common.cancel")}
        confirmText={t("common.confirm_delete")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const task = pendingDelete();
          if (task) deleteTask(task.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
