// Settings — port of the vanilla settings module: profile editing
// (avatar picker + optional custom upload, username/password) and the
// theme + language selectors, all persisting through the same stores.
import { createSignal, For, Show } from "solid-js";
import { user, updateUser } from "../lib/stores";
import { exportBackupFile, importBackupFromFile } from "../lib/backup";
import { t, language, setLanguage, type Language } from "../lib/i18n";
import { theme, setTheme, type Theme } from "../lib/theme";
import Select from "../components/Select";
import ConfirmModal from "../components/ConfirmModal";
import { Button, Input, Card } from "../components/ui";
import { showToast } from "../lib/toast";
import { Plus, Check, Download, Upload, DatabaseBackup } from "lucide-solid";

const AVATARS = [
  "/images/Boy image 1.svg",
  "/images/Boy image 2.svg",
  "/images/Girl image 1.svg",
  "/images/Girl image 2.svg",
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "tk", label: "Türkmençe" },
  { value: "ru", label: "Русский" },
  { value: "tr", label: "Türkçe" },
];

export default function Settings() {
  const [selectedAvatar, setSelectedAvatar] = createSignal(user()?.avatar ?? AVATARS[0]);
  const [newUsername, setNewUsername] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [justSaved, setJustSaved] = createSignal(false);
  const [pendingImportFile, setPendingImportFile] = createSignal<File | null>(null);
  let fileInput: HTMLInputElement | undefined;
  let importInput: HTMLInputElement | undefined;

  function onImportFileChosen(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = ""; // allow re-choosing the same file later
    if (file) setPendingImportFile(file);
  }

  async function confirmImport() {
    const file = pendingImportFile();
    setPendingImportFile(null);
    if (!file) return;
    const result = await importBackupFromFile(file);
    showToast({
      message: result.ok ? t("settings.import_success") : t("settings.import_error"),
    });
  }

  function onUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function save() {
    const current = user();
    if (!current) return;

    const updates: Record<string, string> = {};
    if (selectedAvatar() && selectedAvatar() !== current.avatar) {
      updates.avatar = selectedAvatar();
    }
    if (newUsername().trim()) updates.username = newUsername().trim();
    if (newPassword().trim()) updates.password = newPassword().trim();

    if (Object.keys(updates).length > 0) {
      updateUser(updates);
      setNewUsername("");
      setNewPassword("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  }

  return (
    <section class="flex flex-col gap-5 max-[768px]:pb-5">
      {/* Edit profile */}
      <Card>
        <h2 class="mb-6 text-lg font-semibold text-primary">{t("settings.edit_profile_title")}</h2>

        <div class="flex flex-wrap gap-10 max-[768px]:flex-col max-[768px]:gap-6">
          {/* Current avatar */}
          <div class="flex flex-col items-center gap-3 max-[768px]:self-center">
            <div class="text-sm font-medium text-tertiary">{t("settings.current_avatar_label")}</div>
            <div class="flex size-26 items-center justify-center overflow-hidden rounded-full border-3 border-accent shadow-md shadow-accent/20">
              <img
                src={selectedAvatar()}
                alt="Current Avatar"
                class="size-full rounded-full object-cover"
              />
            </div>
          </div>

          {/* Choose new avatar */}
          <div class="flex flex-col gap-3">
            <div class="text-sm font-medium text-tertiary">
              {t("settings.choose_new_avatar_label")}
            </div>
            <div class="flex flex-wrap gap-3 max-[768px]:justify-center">
              <For each={AVATARS}>
                {(src) => (
                  <div
                    role="button"
                    tabindex="0"
                    class="flex size-13 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition-all hover:scale-105"
                    classList={{
                      "border-accent ring-3 ring-accent/25": selectedAvatar() === src,
                      "border-line": selectedAvatar() !== src,
                    }}
                    onClick={() => setSelectedAvatar(src)}
                  >
                    <img src={src} alt="" class="size-full rounded-full object-cover" />
                  </div>
                )}
              </For>
              <div
                role="button"
                tabindex="0"
                class="flex size-13 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-line text-accent transition-all hover:scale-105 hover:border-accent"
                onClick={() => fileInput?.click()}
              >
                <Plus size={18} />
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                class="hidden"
                onChange={onUpload}
              />
            </div>
          </div>

          {/* Username / password form */}
          <div class="flex min-w-64 flex-1 flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-tertiary">
                {t("settings.current_username_label")}
              </label>
              <input
                type="text"
                readonly
                value={user()?.username ?? ""}
                class="h-11 rounded-xl border border-line-input bg-surface-alt px-3.5 text-sm text-secondary focus:outline-none"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-tertiary">
                {t("settings.current_password_label")}
              </label>
              <input
                type="password"
                readonly
                value="********"
                class="h-11 rounded-xl border border-line-input bg-surface-alt px-3.5 text-sm text-secondary focus:outline-none"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-tertiary">
                {t("settings.new_username_label")}
              </label>
              <Input
                type="text"
                placeholder={t("settings.new_username_placeholder")}
                value={newUsername()}
                onInput={(e) => setNewUsername(e.currentTarget.value)}
                class="h-11 rounded-xl px-3.5"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-tertiary">
                {t("settings.new_password_label")}
              </label>
              <Input
                type="password"
                placeholder={t("settings.new_password_placeholder")}
                value={newPassword()}
                onInput={(e) => setNewPassword(e.currentTarget.value)}
                class="h-11 rounded-xl px-3.5"
              />
            </div>
            <button
              type="button"
              class="mt-1 h-12 cursor-pointer rounded-xl px-6 text-sm font-medium text-accent-fill-text shadow-md shadow-accent/20 transition-colors"
              classList={{
                "bg-accent-hover": justSaved(),
                "bg-accent hover:bg-accent-hover": !justSaved(),
              }}
              onClick={save}
            >
              <Check size={16} class="mr-2 inline-block align-[-3px]" />
              <Show when={justSaved()} fallback={t("common.save")}>
                {t("settings.save_success")}
              </Show>
            </button>
          </div>
        </div>
      </Card>

      {/* Theme & language */}
      <Card>
        <h2 class="mb-6 text-lg font-semibold text-primary">
          {t("settings.theme_language_title")}
        </h2>

        <div class="flex flex-wrap gap-10 max-[768px]:flex-col max-[768px]:gap-5">
          <div class="flex min-w-56 flex-col gap-1.5">
            <label class="text-sm text-secondary">{t("settings.choose_theme_label")}</label>
            <Select
              value={theme()}
              onChange={(v) => setTheme(v as Theme)}
              options={[
                { value: "light", label: () => t("settings.theme_light") },
                { value: "dark", label: () => t("settings.theme_dark") },
              ]}
            />
          </div>
          <div class="flex min-w-56 flex-col gap-1.5">
            <label class="text-sm text-secondary">{t("settings.choose_language_label")}</label>
            <Select
              value={language()}
              onChange={(v) => setLanguage(v as Language)}
              options={LANGUAGE_OPTIONS}
            />
          </div>
        </div>
      </Card>

      {/* Data export / import */}
      <Card>
        <h2 class="mb-2 text-lg font-semibold text-primary">{t("settings.data_title")}</h2>
        <p class="mb-6 text-sm text-tertiary">{t("settings.data_hint")}</p>

        <div class="flex flex-wrap gap-3">
          <Button variant="outline" class="flex h-11 items-center gap-2 px-5" onClick={exportBackupFile}>
            <Download size={16} />
            {t("settings.export_button")}
          </Button>
          <Button
            variant="outline"
            class="flex h-11 items-center gap-2 px-5"
            onClick={() => importInput?.click()}
          >
            <Upload size={16} />
            {t("settings.import_button")}
          </Button>
          <input
            ref={importInput}
            type="file"
            accept="application/json"
            class="hidden"
            onChange={onImportFileChosen}
          />
        </div>
      </Card>

      <ConfirmModal
        open={pendingImportFile() !== null}
        icon={DatabaseBackup}
        title={t("settings.import_confirm_title")}
        body={<p>{t("settings.import_confirm_body")}</p>}
        cancelText={t("common.cancel")}
        confirmText={t("settings.import_button")}
        onCancel={() => setPendingImportFile(null)}
        onConfirm={confirmImport}
      />
    </section>
  );
}
