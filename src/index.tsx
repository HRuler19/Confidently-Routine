/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "./styles/app.css";
import { checkForUpdate, installPendingUpdate } from "./lib/updater";
import { showToast } from "./lib/toast";
import { t } from "./lib/i18n";

render(() => <App />, document.getElementById("root")!);

// Only the plain browser build should register a service worker - the
// desktop/mobile apps already serve their assets locally through Tauri,
// so a caching layer on top would be redundant at best.
if (!("__TAURI_INTERNALS__" in window)) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {
      // No-op: e.g. running `vite` dev server without the PWA dev mode,
      // or a browser without service worker support.
    });
}

// Silent startup check - no-ops everywhere except a Tauri desktop build,
// so this is safe to always call regardless of platform.
checkForUpdate().then((result) => {
  if (!result.available) return;
  showToast({
    message: t("settings.update_available_toast", { version: result.version ?? "" }),
    actionLabel: t("settings.install_update_button", { version: result.version ?? "" }),
    onAction: () => installPendingUpdate(),
    duration: 12000,
  });
});
