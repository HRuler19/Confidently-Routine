// Pure task-completion logic, kept separate from the store/UI so it's
// easy to unit test.
import type { Recurrence } from "./dates";

export interface RecurringCompletionInput {
  completed: boolean;
  recurrence?: Recurrence;
  recurrenceSpawned?: boolean;
}

/** Whether completing this task should spawn its next recurring instance -
    true only on the first transition to completed for a recurring task.
    Without the recurrenceSpawned guard, unchecking and re-checking the
    same task (a plausible fat-finger correction, not just a hypothetical)
    would spawn a duplicate next occurrence every time. */
export function shouldSpawnNextOccurrence(task: RecurringCompletionInput): boolean {
  return task.completed && !!task.recurrence && !task.recurrenceSpawned;
}
