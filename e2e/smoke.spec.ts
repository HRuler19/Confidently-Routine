// End-to-end smoke: the core user journey through every page.
import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, username = "E2E User") {
  await page.goto("/login");
  await page.fill("#username", username);
  await page.fill("#password", "secret123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/$/);
}

test("login validates and reaches the dashboard", async ({ page }) => {
  await page.goto("/login");
  // short password should be rejected
  await page.fill("#username", "E2E User");
  await page.fill("#password", "123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/login/);

  await page.fill("#password", "secret123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("header")).toContainText("E2E User");
});

test("task lifecycle: add, complete, filter, delete", async ({ page }) => {
  await login(page);
  await page.goto("/routines");

  await page.fill('input[placeholder="Add new task"]', "Buy groceries");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Buy groceries", { exact: true })).toBeVisible();

  // complete it
  await page.locator(".task-check").first().check();

  // filter to Active -> task disappears
  await page.getByRole("combobox").filter({ hasText: "All Tasks" }).click();
  await page.getByRole("option", { name: "Active" }).click();
  await expect(page.getByText("Buy groceries", { exact: true })).toHaveCount(0);

  // back to All -> delete (shows a toast with Undo, no blocking dialog)
  await page.getByRole("combobox").filter({ hasText: "Active" }).first().click();
  await page.getByRole("option", { name: "All Tasks" }).click();
  await page.locator("button:has(svg.lucide-trash-2)").first().click();
  await expect(page.getByText("Buy groceries", { exact: true })).toHaveCount(0);

  const undo = page.getByRole("button", { name: /Undo/i });
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(page.getByText("Buy groceries", { exact: true })).toBeVisible();
});

test("task search filters the list by title", async ({ page }) => {
  await login(page);
  await page.goto("/routines");

  await page.fill('input[placeholder="Add new task"]', "Buy groceries");
  await page.keyboard.press("Enter");
  await page.fill('input[placeholder="Add new task"]', "Call dentist");
  await page.keyboard.press("Enter");

  await page.fill('input[placeholder="Search tasks..."]', "groc");
  await expect(page.getByText("Buy groceries", { exact: true })).toBeVisible();
  await expect(page.getByText("Call dentist", { exact: true })).toHaveCount(0);

  await page.fill('input[placeholder="Search tasks..."]', "");
  await expect(page.getByText("Call dentist", { exact: true })).toBeVisible();
});

test("recurring task spawns its next instance when completed", async ({ page }) => {
  await login(page);
  await page.goto("/routines");

  await page.fill('input[placeholder="Add new task"]', "Water plants");
  await page.getByRole("combobox").filter({ hasText: "Doesn't repeat" }).click();
  await page.getByRole("option", { name: "Daily" }).click();
  await page.getByRole("button", { name: /Add Task/i }).click();

  await expect(page.getByText("Water plants", { exact: true })).toHaveCount(1);
  await expect(page.locator("svg.lucide-repeat")).toBeVisible();

  // completing it spawns tomorrow's instance instead of just disappearing
  await page.locator(".task-check").first().check();
  await expect(page.getByText("Water plants", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Today", { exact: true })).toBeVisible();
  await expect(page.getByText("Tomorrow", { exact: true })).toBeVisible();
});

test("notes: add and edit", async ({ page }) => {
  await login(page);
  await page.goto("/notes");

  await page.fill("textarea", "First e2e note");
  await page.locator("section button", { hasText: "Add Note" }).click();
  await expect(page.getByText("First e2e note")).toBeVisible();

  await page.locator("button:has(svg.lucide-pencil)").first().click();
  await page.locator("textarea").last().fill("Edited e2e note");
  await page.getByRole("button", { name: /Save/i }).click();
  await expect(page.getByText("Edited e2e note")).toBeVisible();
});

test("notes: renders markdown, pinning floats a note to the top, and search filters", async ({ page }) => {
  await login(page);
  await page.goto("/notes");

  await page.fill("textarea", "Grocery list for the week");
  await page.locator("section button", { hasText: "Add Note" }).click();
  await page.fill("textarea", "**bold** and *italic* text");
  await page.locator("section button", { hasText: "Add Note" }).click();

  await expect(page.locator("strong", { hasText: "bold" })).toBeVisible();
  await expect(page.locator("em", { hasText: "italic" })).toBeVisible();

  // newest-first by default, so the bold note (added second) leads
  const noteContents = page.locator('div[class*="leading-relaxed"]');
  await expect(noteContents.first()).toContainText("bold");

  // pinning the older note should float it above the newer, unpinned one
  const groceryCard = page.locator("div.items-start.rounded-xl", { hasText: "Grocery list for the week" });
  await groceryCard.getByRole("button", { name: "Pin" }).click();
  await expect(noteContents.first()).toContainText("Grocery list for the week");
  await expect(page.locator("svg.lucide-pin").first()).toBeVisible();

  // search narrows the list by content
  await page.fill('input[placeholder="Search notes..."]', "grocery");
  await expect(page.getByText("Grocery list for the week")).toBeVisible();
  await expect(page.locator("strong", { hasText: "bold" })).toHaveCount(0);
});

test("habits: add habit, cycle a cell, and log a count via the modal", async ({ page }) => {
  await login(page);
  await page.goto("/my-routine");

  await page.fill('input[placeholder="Add new habit"]', "Stretch");
  await page.keyboard.press("Enter");
  await expect(page.locator("th", { hasText: "Stretch" })).toBeVisible();

  const cell = page.locator("tbody td").nth(1);

  // tap once -> done (plus), tap again -> missed (x), tap again -> empty
  await cell.click();
  await expect(cell.locator("svg.lucide-plus")).toBeVisible();
  await cell.click();
  await expect(cell.locator("svg.lucide-x")).toBeVisible();
  await cell.click();
  await expect(cell.locator("svg")).toHaveCount(0);

  // right-click (long-press equivalent on desktop) opens the count modal
  await cell.click({ button: "right" });
  const modal = page.locator("div.fixed");
  await modal.locator('input[type="number"]').fill("5");
  await modal.getByRole("button", { name: /Save/i }).click();
  await expect(cell).toHaveText("5");
});

test("habit reminders: the panel appears and degrades gracefully without Tauri", async ({ page }) => {
  await login(page);
  await page.goto("/my-routine");

  // no habits yet -> the Reminders card doesn't render at all
  await expect(page.getByText("Reminders", { exact: true })).toHaveCount(0);

  await page.fill('input[placeholder="Add new habit"]', "Meditate");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Reminders", { exact: true })).toBeVisible();

  // picking a time asks for notification permission, which the plain
  // browser build can never grant (no Tauri notification plugin here) -
  // confirm that failure surfaces as a toast instead of silently no-oping.
  await page.getByRole("combobox").filter({ hasText: "No reminder" }).click();
  await page.getByRole("option", { name: "09:00", exact: true }).click();
  await expect(page.getByText(/enable notifications/i)).toBeVisible();
});

test("modals: trap focus, wrap Tab, close on Escape, and restore focus to the trigger", async ({ page }) => {
  await login(page);
  await page.goto("/my-routine");

  await page.fill('input[placeholder="Add new habit"]', "Meditate");
  await page.keyboard.press("Enter");
  await expect(page.locator("th", { hasText: "Meditate" })).toBeVisible();

  // Delete-habit confirmation (ConfirmModal): opens with Cancel focused,
  // Shift+Tab from the first button wraps to the last instead of escaping
  // the dialog, and Escape closes it and returns focus to the trigger.
  const deleteTrigger = page.locator('button[title="Delete habit"]');
  await deleteTrigger.click();
  const confirmDialog = page.getByRole("dialog");
  await expect(confirmDialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: /Yes, delete/i })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(confirmDialog).toBeHidden();
  await expect(deleteTrigger).toBeFocused();

  // Habit-entry modal: opens with a focusable element inside it focused, Escape closes it.
  const cell = page.locator("tbody td").nth(1);
  await cell.click({ button: "right" });
  const entryDialog = page.getByRole("dialog");
  await expect(entryDialog).toBeVisible();
  await expect(entryDialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(entryDialog).toBeHidden();
});

test("dashboard renders analytics and settings switches theme + language", async ({ page }) => {
  await login(page);

  // seed one task so the dashboard has data
  await page.goto("/routines");
  await page.fill('input[placeholder="Add new task"]', "Dashboard seed");
  await page.keyboard.press("Enter");

  await page.goto("/");
  await expect(page.getByText("Daily Tasks Overview")).toBeVisible();
  await expect(page.locator("svg circle").first()).toBeVisible(); // completion ring

  // settings: dark theme
  await page.goto("/settings");
  // the updater section is Tauri-desktop-only and must stay hidden in the browser build
  await expect(page.getByText("Check for updates")).toHaveCount(0);
  await page.getByRole("combobox").filter({ hasText: "Light mode" }).click();
  await page.getByRole("option", { name: "Dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  // settings: switch language to Turkish and back
  await page.getByRole("combobox").filter({ hasText: "English" }).click();
  await page.getByRole("option", { name: "Türkçe" }).click();
  await expect(page.locator("aside")).not.toContainText("Settings");
});

test("settings: export data, wipe, and restore it via import", async ({ page }) => {
  await login(page);

  await page.goto("/routines");
  await page.fill('input[placeholder="Add new task"]', "Backup e2e task");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Backup e2e task", { exact: true })).toBeVisible();

  await page.goto("/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export data/i }).click(),
  ]);
  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  // wipe content data (session/login is untouched, since it lives in
  // sessionStorage and the backup never includes the account anyway)
  await page.evaluate(() => localStorage.clear());
  await page.goto("/routines");
  await expect(page.getByText("Backup e2e task", { exact: true })).toHaveCount(0);

  await page.goto("/settings");
  await page.setInputFiles('input[type="file"][accept="application/json"]', filePath!);
  await page.getByRole("button", { name: /Import data/i }).last().click();
  await expect(page.getByText(/imported successfully/i)).toBeVisible();

  await page.goto("/routines");
  await expect(page.getByText("Backup e2e task", { exact: true })).toBeVisible();
});

test("date picker: opens, navigates months, selects a day, and localizes", async ({ page }) => {
  await login(page);
  await page.goto("/routines");

  const trigger = page.getByRole("combobox", { name: "Due Date" });
  await trigger.click();

  const panel = page.getByRole("dialog");
  await expect(panel).toBeVisible();
  // Monday-first week header, not the OS/browser locale's own ordering.
  const weekdayHeaders = panel.locator("span.text-tertiary");
  await expect(weekdayHeaders.first()).toHaveText("Mon");

  const monthLabel = panel.locator("span.text-sm.font-medium");
  const initialMonth = await monthLabel.textContent();
  await panel.getByRole("button", { name: "Next month" }).click();
  await expect(monthLabel).not.toHaveText(initialMonth ?? "");

  // Jump back and pick the 15th of the currently displayed month.
  await panel.getByRole("button", { name: "Previous month" }).click();
  await panel.getByRole("button", { name: "15", exact: true }).click();
  await expect(panel).toBeHidden();
  await expect(trigger).toContainText("15");

  // Switch the app language and confirm the picker's own strings follow -
  // native <input type="date"> could never do this, it always used the
  // OS locale regardless of the app's language setting.
  await page.goto("/settings");
  await page.getByRole("combobox").filter({ hasText: "English" }).click();
  await page.getByRole("option", { name: "Türkçe" }).click();

  await page.goto("/routines");
  await page.getByRole("combobox", { name: "Son Tarih" }).click();
  const trPanel = page.getByRole("dialog");
  await expect(trPanel.locator("span.text-tertiary").first()).toHaveText("Pzt");
  await expect(trPanel.getByRole("button", { name: "Bugün" })).toBeVisible();
});

test("date picker: arrow keys move focus between days and Enter selects", async ({ page }) => {
  await login(page);
  await page.goto("/routines");

  const trigger = page.getByRole("combobox", { name: "Due Date" });
  await trigger.click();
  const panel = page.getByRole("dialog");
  await expect(panel).toBeVisible();

  // the panel opens with today's day focused; ArrowRight moves to tomorrow
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(panel).toBeHidden();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await expect(trigger).toContainText(`${tomorrow.getDate()} `);

  // Escape closes the panel and returns focus to the trigger
  await trigger.click();
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("select: arrow keys move the highlighted option and Enter commits it", async ({ page }) => {
  await login(page);
  await page.goto("/routines");

  const categoryTrigger = page.getByRole("combobox").filter({ hasText: "Personal" });
  await categoryTrigger.focus();
  await page.keyboard.press("ArrowDown"); // opens with the current selection highlighted
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("ArrowDown"); // Personal -> Work
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toHaveCount(0);

  // confirm the keyboard-driven change actually stuck, via the added task's category tag
  await page.fill('input[placeholder="Add new task"]', "Keyboard nav check");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Keyboard nav check", { exact: true })).toBeVisible();
  await expect(page.locator("span.rounded-full", { hasText: "Work" })).toBeVisible();
});

test("logout returns to login and guards routes", async ({ page }) => {
  await login(page);
  await page.locator("aside a", { hasText: /Logout/i }).click();
  await page.getByRole("button", { name: /Yes, log out/i }).click();
  await expect(page).toHaveURL(/\/login/);

  // guarded route bounces back to login
  await page.goto("/notes");
  await expect(page).toHaveURL(/\/login/);
});
