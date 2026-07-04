<div align="center">

<img src="docs/logo.png" alt="Confidently Routine" width="120" height="120" />

# Confidently Routine

### Build habits. Track tasks. Capture ideas. Everywhere.

A privacy-first productivity suite for habits, daily tasks, and notes — engineered in **vanilla JavaScript** and packaged as a native app for **Windows, macOS, Android, and iOS**, while still running as a plain web page in any browser.

<br />

[![Version](https://img.shields.io/badge/version-1.0.0-0e5e0a?style=for-the-badge)](https://github.com/HRuler19/Confidently-Routine/releases/latest)
[![Platforms](https://img.shields.io/badge/platforms-Windows_·_macOS_·_Android_·_iOS_·_Web-3c8116?style=for-the-badge)](#-download--install)
[![Made with Vanilla JS](https://img.shields.io/badge/made_with-Vanilla_JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](#-tech-stack)
[![License](https://img.shields.io/badge/license-MIT-6b7280?style=for-the-badge)](#-license)

<br />

**[⬇ Download](#-download--install)** &nbsp;·&nbsp; **[✨ Features](#-features)** &nbsp;·&nbsp; **[📸 Screenshots](#-screenshots)** &nbsp;·&nbsp; **[🏗 Architecture](#-architecture)** &nbsp;·&nbsp; **[🛠 Build from source](#-building-from-source)**

</div>

<br />

<div align="center">
  <img src="docs/screenshots/dashboard-dark.png" alt="Confidently Routine dashboard in dark mode" width="90%" />
</div>

<br />

---

## 📖 Overview

**Confidently Routine** is a self-contained personal-productivity application that unifies three everyday tools — a **habit tracker**, a **daily task manager**, and a **notes board** — behind a single analytics **dashboard**. It is built with zero front-end frameworks, stores all data locally on the device, and ships to every major platform from a single shared codebase.

| | |
|---|---|
| 🔒 **Private by design** | Every task, habit, and note lives in your device's local storage. No account, no server, no telemetry, no cloud. |
| 🖥 **Truly cross-platform** | One codebase → native Windows `.exe`, macOS `.dmg`, Android `.apk`, iOS app, **and** a browser app. |
| 🌗 **Light & dark themes** | A hand-tuned dark palette (near-black surfaces, brand-matched green accent) alongside the classic light theme. |
| 🌍 **Multilingual** | Full UI translation for **English, Türkçe, Türkmençe, and Русский**, switchable on the fly. |
| 📊 **Real analytics** | Dependency-free SVG charts turn your tasks, notes, and habits into completion rates, category breakdowns, and trends. |
| 📱 **Responsive** | A dedicated mobile layout with a custom curved bottom navigation bar, tuned from 320 px up to desktop. |

<br />

## ⬇ Download & Install

> Grab the latest build for your device from the **[v1.0.0 release](https://github.com/HRuler19/Confidently-Routine/releases/tag/v1.0.0)**, or use a direct link below.

<div align="center">

### 🪟 Windows

[![Download Windows Installer](https://img.shields.io/badge/⬇_Download-Windows_Installer_(.exe)-0078D6?style=for-the-badge&logo=windows11&logoColor=white)](https://github.com/HRuler19/Confidently-Routine/releases/download/v1.0.0/Confidently-Routine-Setup-1.0.0.exe)
&nbsp;
[![Download Windows Portable](https://img.shields.io/badge/⬇_Download-Windows_Portable-5E5E5E?style=for-the-badge&logo=windows11&logoColor=white)](https://github.com/HRuler19/Confidently-Routine/releases/download/v1.0.0/Confidently-Routine-Portable-1.0.0.exe)

### 🤖 Android

[![Download Android APK](https://img.shields.io/badge/⬇_Download-Android_APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/HRuler19/Confidently-Routine/releases/download/v1.0.0/Confidently-Routine-1.0.0.apk)

### 🍎 macOS &nbsp;·&nbsp; 📱 iOS

![macOS coming soon](https://img.shields.io/badge/macOS-coming_soon-999999?style=for-the-badge&logo=apple&logoColor=white)
&nbsp;
![iOS coming soon](https://img.shields.io/badge/iOS-coming_soon-999999?style=for-the-badge&logo=apple&logoColor=white)

</div>

### Installation notes per platform

| Platform | File | How to install |
|---|---|---|
| **Windows (Installer)** | `Confidently-Routine-Setup-1.0.0.exe` | Run the installer, choose an install location, and it adds Start-menu + desktop shortcuts. Recommended for most users. |
| **Windows (Portable)** | `Confidently-Routine-Portable-1.0.0.exe` | No installation — double-click to launch. Ideal for a USB stick or a locked-down machine. |
| **Android** | `Confidently-Routine-1.0.0.apk` | Enable **Settings → Apps → Install unknown apps** for your browser/file manager, then open the `.apk` to sideload. |
| **macOS / iOS** | — | Builds are pending Apple hardware (see [Building from source](#-building-from-source)); the projects are fully configured and ready to compile on a Mac. |
| **Browser** | — | Serve the repo folder with any static server (e.g. `python -m http.server`) and open `index.html`. |

> ℹ️ **Windows SmartScreen / Android Play Protect** may warn that the app is unsigned — the binaries are not yet code-signed with a paid certificate. Choose **More info → Run anyway** (Windows) or **Install anyway** (Android) to proceed.

<br />

## ✨ Features

### 🎯 Daily Tasks
- Create tasks with a **category** (Personal, Work, Shopping, Other), a **priority** (Low, Medium, High, Hard), and a **due date** via an inline calendar.
- **Filter** by status, category, or priority; inline **edit** and **delete** with a confirmation modal.
- Live **counters** for total / completed / active tasks.

### 📅 My Routine (Habit Tracker)
- Track any number of habits on a **month-by-month grid**, one column per habit and one row per day.
- Mark each day complete (✓), missed (✗), or with a numeric count.
- Includes a **sleep chart** to visualize rest over the month.

### 🗒 Notes
- Rich, categorized notes (Study, Work, Personal, Learning) with dates.
- **Filter** by category or date, edit and delete in place.

### 📊 Dashboard
- **Task analytics** — completion-rate ring, plus category and priority breakdowns.
- **Notes analytics** — totals, category split, and notes-per-month trend.
- **Habit insights** — per-habit statistics with month/year views.
- All charts are **hand-written SVG** — no charting library, fully theme-aware.

### ⚙️ Settings & Personalization
- Edit profile (username, password, avatar) with a set of built-in avatars.
- Switch **theme** (Light / Dark) and **language** (EN / TR / TK / RU) instantly.

<br />

## 📸 Screenshots

<div align="center">

### Desktop — Light

<img src="docs/screenshots/tasks-light.png" alt="Daily Tasks page, light theme" width="80%" />

<em>Daily Tasks — categorized, prioritized, and filterable</em>

<br /><br />

<img src="docs/screenshots/dashboard-light.png" alt="Dashboard, light theme" width="80%" />

<em>Dashboard — real analytics for tasks, notes, and habits</em>

<br /><br />

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/notes-light.png" alt="Notes page" /></td>
    <td width="50%"><img src="docs/screenshots/my-routine-light.png" alt="Habit tracker page" /></td>
  </tr>
  <tr>
    <td align="center"><em>Notes board</em></td>
    <td align="center"><em>Habit tracker grid</em></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/settings-light.png" alt="Settings page" /></td>
    <td width="50%"><img src="docs/screenshots/tasks-dark.png" alt="Daily Tasks, dark theme" /></td>
  </tr>
  <tr>
    <td align="center"><em>Settings & personalization</em></td>
    <td align="center"><em>Tasks in dark mode</em></td>
  </tr>
</table>

### Mobile — Dark

<table>
  <tr>
    <td width="50%" align="center"><img src="docs/screenshots/mobile-tasks-dark.png" alt="Mobile tasks, dark theme" width="280" /></td>
    <td width="50%" align="center"><img src="docs/screenshots/mobile-dashboard-dark.png" alt="Mobile dashboard, dark theme" width="280" /></td>
  </tr>
  <tr>
    <td align="center"><em>Tasks with the custom curved bottom nav</em></td>
    <td align="center"><em>Dashboard on a phone</em></td>
  </tr>
</table>

</div>

<br />

## 🧰 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Language** | JavaScript (ES6+), HTML5, CSS3 | No front-end framework — deliberate architectural choice. |
| **Charts** | Custom SVG renderer (`assets/js/utils/charts.js`) | Dependency-free, responsive, theme-aware. |
| **Date picker** | [flatpickr](https://flatpickr.js.org/) | Localized to the active UI language. |
| **Icons / Fonts** | Font Awesome 7, DM Sans | Loaded via CDN in the browser build. |
| **Persistence** | `localStorage` | Versioned schema; storage layer abstracted for future migration. |
| **Bundling** | [Rollup](https://rollupjs.org/) + Babel + Terser | Bundles the core module graph into `dist/js/bundle.js`. |
| **Desktop shell** | [Electron](https://www.electronjs.org/) + [electron-builder](https://www.electron.build/) | Wraps the web app; a tiny embedded HTTP server serves it locally. |
| **Mobile shell** | [Capacitor](https://capacitorjs.com/) | Native Android & iOS wrappers around the same web assets. |

<br />

## 🏗 Architecture

The application is organized into clean, single-responsibility layers with an event-bus bridge between feature modules.

```
┌─────────────────────────────────────┐
│              UI Layer                │  DOM rendering & event capture
├─────────────────────────────────────┤
│          Application Layer           │  Auth · Routines · Dashboard · Notes · Settings
├─────────────────────────────────────┤
│              Event Bus               │  Cross-module communication bridge
├─────────────────────────────────────┤
│             Data Layer               │  LocalStorage · versioned JSON schema
├─────────────────────────────────────┤
│         Visualization Layer          │  Dependency-free SVG charts
└─────────────────────────────────────┘
```

**How native packaging works:** the exact same `index.html` + `assets/` power every target. The app uses root-relative asset paths, so both shells serve those assets over a local origin:

```
                         ┌────────────────────────────┐
   Shared web app  ──▶   │  index.html + assets/ +    │
   (no per-platform code)│  views/ + dist/            │
                         └──────────────┬─────────────┘
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌──────────────┐   ┌────────────────┐   ┌──────────────┐
            │   Electron   │   │   Capacitor    │   │   Browser    │
            │ (Win / macOS)│   │ (Android / iOS)│   │  (any host)  │
            └──────────────┘   └────────────────┘   └──────────────┘
```

<br />

## 📂 Project Structure

```
Confidently-Routine/
├─ index.html                 # App shell (loads all pages as SPA views)
├─ main.js                    # Electron main process + embedded static server
├─ capacitor.config.ts        # Capacitor (Android/iOS) configuration
├─ rollup.config.js           # Bundler configuration
│
├─ assets/
│  ├─ css/                    # base · layouts · pages · components · themes
│  ├─ js/
│  │  ├─ modules/             # dashboard · my-routine · routines · notes · settings
│  │  └─ utils/               # i18n · theme · charts · dom-helpers · translations · mobile-nav
│  └─ images/                 # Logo & avatars
│
├─ views/                     # Per-page HTML fragments loaded into the shell
├─ dist/                      # Rollup bundle output
│
├─ android/                   # Capacitor Android project (Gradle)
├─ ios/                       # Capacitor iOS project (Xcode) — build on a Mac
├─ build/                     # Desktop app icon
├─ appicon-src/               # Source logo for mobile icon generation
├─ scripts/                   # copy-www · 7za-wrapper · install-7za-wrapper
└─ docs/                      # README assets (logo + screenshots)
```

<br />

## 🛠 Building from Source

### Prerequisites
- **Node.js** 18+ and npm
- Platform-specific toolchains (see each section below)

### Setup
```bash
git clone https://github.com/HRuler19/Confidently-Routine.git
cd Confidently-Routine
npm install --legacy-peer-deps
npm run build:js          # bundle the core JS into dist/
```

### Run in a browser (no build)
```bash
python -m http.server 8000
# then open http://localhost:8000/index.html
```

### Run the desktop app (dev)
```bash
npm start                 # launches the Electron shell
```

### Build targets

| Target | Command | Requirements | Output |
|---|---|---|---|
| 🪟 **Windows** | `npm run dist:win` | Windows | `release/*.exe` (installer + portable) |
| 🍎 **macOS** | `npm run dist:mac` | a Mac | `release/*.dmg`, `release/*.zip` |
| 🤖 **Android** | `npm run dist:android` | Android SDK + JDK 21 | `android/app/build/outputs/apk/…` |
| 📱 **iOS** | `npm run sync:ios` → build in Xcode | a Mac with Xcode | `.ipa` via Xcode |

<details>
<summary><strong>🪟 Windows build notes</strong></summary>

<br />

`electron-builder` downloads a code-signing vendor package (`winCodeSign`) that bundles two macOS-only **symlinked** files. Extracting symlinks on Windows requires `SeCreateSymbolicLinkPrivilege`, which a normal (non-elevated) session lacks unless **Developer Mode** is on.

To avoid needing elevation or Developer Mode, `node_modules/7zip-bin/win/x64/7za.exe` is replaced with a thin wrapper (source in [`scripts/7za-wrapper/main.go`](scripts/7za-wrapper/main.go)) that excludes the irrelevant `darwin/` folder during extraction. A fresh `npm install` restores the stock binary, so re-run:

```bash
node scripts/install-7za-wrapper.js   # requires Go (https://go.dev)
```

before `npm run dist:win`.
</details>

<details>
<summary><strong>🤖 Android build notes</strong></summary>

<br />

- Requires **JDK 21** (JDK 17 fails the `compileDebugJavaWithJavac` step with `invalid source release: 21`).
- Requires the Android SDK packages: `platform-tools`, `platforms;android-34`, `build-tools;34.0.0`.
- `android/local.properties` must set `sdk.dir` using **forward slashes** — backslash-escaped Windows paths fail SDK path validation with a cryptic *"filename, directory name, or volume label syntax is incorrect"* error.

```properties
sdk.dir=C:/Users/you/AppData/Local/Android/Sdk
```
</details>

<details>
<summary><strong>🍎 macOS / iOS build notes</strong></summary>

<br />

Apple's toolchain (Xcode, code signing, the simulator) **only runs on macOS** — this is an Apple platform restriction, not a limitation of this project. The `ios/` Capacitor project and its icons/splash screens are already generated and committed. On a Mac:

```bash
npm install --legacy-peer-deps
npx cap sync ios
open ios/App/App.xcworkspace   # build, sign & run in Xcode
```

For macOS desktop, `npm run dist:mac` produces `.dmg` and `.zip` artifacts.
</details>

<details>
<summary><strong>🎨 Regenerating app icons & splash screens</strong></summary>

<br />

Edit `appicon-src/logo.png`, then run:

```bash
npx capacitor-assets generate \
  --assetPath appicon-src \
  --iconBackgroundColor '#ffffff' --iconBackgroundColorDark '#ffffff' \
  --splashBackgroundColor '#ffffff' --splashBackgroundColorDark '#121212'
```
</details>

<br />

## 🌍 Internationalization

The entire UI is translated through a single dictionary (`assets/js/utils/translations.js`) and applied by a lightweight i18n helper. Switching languages re-renders every page instantly and re-localizes the date picker.

| Language | Code | Status |
|---|---|---|
| 🇬🇧 English | `en` | ✅ Complete |
| 🇹🇷 Türkçe | `tr` | ✅ Complete |
| 🇹🇲 Türkmençe | `tk` | ✅ Complete |
| 🇷🇺 Русский | `ru` | ✅ Complete |

<br />

## 🗺 Roadmap

- [x] Windows desktop app (Electron)
- [x] Android app (Capacitor)
- [x] Dark mode & full responsive mobile layout
- [x] Multi-language support (EN / TR / TK / RU)
- [x] Real dashboard analytics
- [ ] macOS `.dmg` build
- [ ] iOS build & App Store submission
- [ ] Signed Windows & Play Store releases
- [ ] Offline-first Service Worker (installable PWA)
- [ ] Optional cloud sync via an adapter layer
- [ ] CSV / calendar export

<br />

## 🤝 Contributing

Contributions are welcome. Fork the repo, create a feature branch, and open a pull request. Please keep the framework-free, dependency-light spirit of the codebase and match the existing code style.

<br />

## 📄 License

Released under the **MIT License** — free to use, modify, and distribute.

<br />

---

<div align="center">

**Confidently Routine** — one app, every device.

Built with vanilla JavaScript, Electron, and Capacitor.

⭐ Star this project if it helps you stay on track!

<br />

© 2026 Confidently Routine. All rights reserved.

</div>
