import { createSignal, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { saveUser } from "../lib/stores";
import { t } from "../lib/i18n";
import { Plus, User } from "lucide-solid";

const AVATARS = [
  "/images/Boy image 1.svg",
  "/images/Girl image 1.svg",
  "/images/Boy image 2.svg",
  "/images/Girl image 2.svg",
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = createSignal("");
  const [remember, setRemember] = createSignal(false);
  const [avatar, setAvatar] = createSignal(AVATARS[0]);
  const [isCustomAvatar, setIsCustomAvatar] = createSignal(false);
  const [usernameError, setUsernameError] = createSignal("");
  let fileInput: HTMLInputElement | undefined;

  function submit(e: Event) {
    e.preventDefault();
    setUsernameError("");

    const name = username().trim();
    if (!name) return setUsernameError(t("login.error_username_required"));

    saveUser(
      { username: name, avatar: avatar(), lastLogin: new Date().toISOString() },
      remember(),
    );
    navigate("/");
  }

  function onUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result as string);
      setIsCustomAvatar(true);
    };
    reader.readAsDataURL(file);
  }

  return (
    <section class="fixed inset-0 z-2000 flex items-center justify-center bg-page-alt">
      <div class="m-5 flex min-h-[588px] w-full max-w-125 flex-col items-center justify-center rounded-[20px] border border-accent bg-surface p-5 shadow-md shadow-(color:--shadow-color-strong) max-[500px]:m-2.5 max-[500px]:min-h-0">
        <div class="flex w-full flex-col items-center">
          {/* Header */}
          <header class="mt-13 flex w-full flex-col items-center max-[500px]:mt-7.5">
            <div class="h-13.5 w-11.5">
              <img
                src="/images/Logo Confidently Routine.svg"
                alt="Confidently Routine"
                class="size-full object-contain"
              />
            </div>
            <h1 class="mt-1.5 text-base font-bold text-accent">Confidently Routine</h1>
            <p class="mt-1.25 mb-2.5 text-center text-xs text-secondary">{t("login.subtitle")}</p>
            <div class="flex size-19 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-accent-alt transition-transform hover:scale-105">
              <img src={avatar()} alt="Main avatar" class="size-full rounded-full object-cover" />
            </div>
          </header>

          {/* Avatar selection */}
          <div class="mx-2.5 mb-5 mt-5 flex gap-5 max-[500px]:flex-wrap max-[500px]:justify-center max-[500px]:gap-4">
            <For each={AVATARS}>
              {(src, i) => (
                <button
                  type="button"
                  aria-label={t("login.select_avatar", { n: i() + 1 })}
                  class="flex size-12.5 cursor-pointer items-center justify-center overflow-hidden rounded-full border transition-all hover:scale-105 hover:border-accent"
                  classList={{
                    "border-accent scale-105": !isCustomAvatar() && avatar() === src,
                    "border-accent-alt": isCustomAvatar() || avatar() !== src,
                  }}
                  onClick={() => {
                    setAvatar(src);
                    setIsCustomAvatar(false);
                  }}
                >
                  <img src={src} alt="" class="size-full rounded-full object-cover" />
                </button>
              )}
            </For>
            <button
              type="button"
              aria-label={t("login.add_new_avatar")}
              class="flex size-12.5 cursor-pointer items-center justify-center rounded-full border transition-all hover:scale-105 hover:border-accent"
              classList={{
                "border-accent": isCustomAvatar(),
                "border-accent-alt": !isCustomAvatar(),
              }}
              onClick={() => fileInput?.click()}
            >
              <Plus size={20} class="text-accent-alt" />
            </button>
            <input ref={fileInput} type="file" accept="image/*" class="hidden" onChange={onUpload} />
          </div>

          {/* Form */}
          <form class="flex w-full flex-col items-center" novalidate onSubmit={submit}>
            <div class="mb-2.5 w-full max-w-87.5">
              <label for="username" class="mb-1.25 block text-xs text-primary">
                {t("login.username_label")}
              </label>
              <div class="relative w-full">
                <User size={16} class="absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-accent-alt" />
                <input
                  type="text"
                  id="username"
                  class="h-10 w-full rounded-[5px] border border-line-input bg-surface pl-8.75 pr-2.5 text-sm text-secondary placeholder:text-placeholder focus:border-accent focus:outline-none"
                  placeholder={t("login.username_placeholder")}
                  value={username()}
                  onInput={(e) => setUsername(e.currentTarget.value)}
                />
              </div>
              <Show when={usernameError()}>
                <div class="mt-1 text-[10px] text-danger">{usernameError()}</div>
              </Show>
            </div>

            <div class="mb-5 flex w-full max-w-87.5 items-center gap-1.25">
              <input
                type="checkbox"
                id="remember-me"
                class="cursor-pointer accent-(--accent-green)"
                checked={remember()}
                onChange={(e) => setRemember(e.currentTarget.checked)}
              />
              <label for="remember-me" class="cursor-pointer text-[10px] text-secondary-alt">
                {t("login.remember_me")}
              </label>
            </div>

            <button
              type="submit"
              class="mb-13 h-10 w-full max-w-87.5 cursor-pointer rounded-[5px] border border-accent-alt bg-accent text-sm text-white transition-colors hover:bg-accent-hover dark:text-accent-fill-text"
            >
              {t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
