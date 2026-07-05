import { createSignal, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { saveUser } from "../lib/stores";
import { t } from "../lib/i18n";

const AVATARS = [
  "/images/Boy image 1.svg",
  "/images/Girl image 1.svg",
  "/images/Boy image 2.svg",
  "/images/Girl image 2.svg",
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);
  const [remember, setRemember] = createSignal(false);
  const [avatar, setAvatar] = createSignal(AVATARS[0]);
  const [isCustomAvatar, setIsCustomAvatar] = createSignal(false);
  const [usernameError, setUsernameError] = createSignal("");
  const [passwordError, setPasswordError] = createSignal("");
  let fileInput: HTMLInputElement | undefined;

  function submit(e: Event) {
    e.preventDefault();
    setUsernameError("");
    setPasswordError("");

    const name = username().trim();
    const pass = password().trim();

    if (!name) return setUsernameError(t("login.error_username_required"));
    if (!pass) return setPasswordError(t("login.error_password_required"));
    if (pass.length < 6) return setPasswordError(t("login.error_password_length"));

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
              {(src) => (
                <div
                  role="button"
                  tabindex="0"
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
                </div>
              )}
            </For>
            <div
              role="button"
              tabindex="0"
              aria-label={t("login.add_new_avatar")}
              class="flex size-12.5 cursor-pointer items-center justify-center rounded-full border transition-all hover:scale-105 hover:border-accent"
              classList={{
                "border-accent": isCustomAvatar(),
                "border-accent-alt": !isCustomAvatar(),
              }}
              onClick={() => fileInput?.click()}
            >
              <i class="fa-solid fa-plus text-xl text-accent-alt" />
            </div>
            <input ref={fileInput} type="file" accept="image/*" class="hidden" onChange={onUpload} />
          </div>

          {/* Form */}
          <form class="flex w-full flex-col items-center" novalidate onSubmit={submit}>
            <div class="mb-2.5 w-full max-w-87.5">
              <label for="username" class="mb-1.25 block text-xs text-primary">
                {t("login.username_label")}
              </label>
              <div class="relative w-full">
                <i class="fa-solid fa-user absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-base text-accent-alt" />
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

            <div class="mb-1.25 w-full max-w-87.5">
              <label for="password" class="mb-1.25 block text-xs text-primary">
                {t("login.password_label")}
              </label>
              <div class="flex h-10 w-full items-center rounded-[5px] border border-line-input bg-surface px-2.5 focus-within:border-accent">
                <span class="mr-2.5 flex items-center justify-center text-base text-accent-alt">
                  <i class="fa-solid fa-lock" />
                </span>
                <input
                  type={showPassword() ? "text" : "password"}
                  id="password"
                  class="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-secondary outline-none placeholder:text-placeholder"
                  placeholder={t("login.password_placeholder")}
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                />
                <button
                  type="button"
                  class="ml-2.5 flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-xs text-accent-alt"
                  aria-label={t("login.toggle_password")}
                  onClick={() => setShowPassword(!showPassword())}
                >
                  <i class={showPassword() ? "fa-regular fa-eye" : "fa-regular fa-eye-slash"} />
                </button>
              </div>
              <Show when={passwordError()}>
                <div class="mt-1 text-[10px] text-danger">{passwordError()}</div>
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
