/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "./styles/app.css";

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
