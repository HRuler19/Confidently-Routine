`# Confidently-Routine

A client-side routine management system implemented in vanilla JavaScript (ES6). The architecture prioritizes modular separation, deterministic state transitions, and framework-agnostic scalability.

## Architectural Overview

<pre>
┌─────────────────────────────────────┐
│              UI Layer                │
│     DOM rendering & events           │
├─────────────────────────────────────┤
│          Application Layer           │
│  Auth · Routines · Dashboard · Notes │
├─────────────────────────────────────┤
│              Event Bus                │
│    Module communication bridge       │
├─────────────────────────────────────┤
│             Data Layer                │
│    LocalStorage · JSON · IndexedDB   │
├─────────────────────────────────────┤
│         Visualization Layer          │
│        Chart.js · Canvas API         │
└─────────────────────────────────────┘
</pre>

### Layer Responsibilities

**UI Layer**  
Handles all DOM manipulations through pure functions. No business logic exists at this level—only rendering and event capture.

**Application Layer**  
Contains feature modules (auth, routine, dashboard, notes, settings). Each module maintains its own state and exposes controlled mutation methods.

**Data Layer**  
Abstracts persistence mechanics. Currently implements LocalStorage with a versioned schema design. The storage interface allows future migration to IndexedDB or remote APIs without affecting upper layers.

**Visualization Layer**  
Wraps Chart.js and Canvas API operations. Provides a clean interface for dashboard components to request chart updates without handling canvas operations directly.

## State Management

State is distributed across feature modules rather than centralized in a single store. Each module:

- Maintains private state variables
- Exposes getters for read operations
- Provides controlled setters for mutations
- Emits events after state changes

### Data Flow Sequence

1. User interaction triggers DOM event
2. Event handler calls module method
3. Module validates input, updates state
4. Storage layer persists changes
5. UI re-renders affected components
6. Dashboard recalculates dependent metrics

## Module Specifications

### Authentication Module

Manages user session and profile data without server dependencies. Implements avatar handling through data URLs and maintains profile state across sessions.

### Routine Engine

Core scheduling logic with:

- Category-based organization
- Eisenhower matrix classification
- Completion tracking algorithms
- Filter operations (by category, priority, status)

### Analytics Engine

Computes performance metrics from raw routine data:

- Completion rate calculations
- Trend analysis over configurable periods
- Category performance breakdowns
- Priority distribution statistics

### Notes System

Structured storage for user-generated content. Implements basic CRUD operations with timestamp tracking and category tagging.

### Settings Manager

Handles application preferences:

- Theme selection (light/dark)
- Language preferences (i18n infrastructure)
- Data export/import operations

## Data Schema

All persisted data follows a versioned schema:

```json
{
  "schemaVersion": "1.0",
  "user": {
    "profile": {},
    "preferences": {}
  },
  "routines": [],
  "notes": [],
  "settings": {}
}
```

The schema includes versioning to support future migrations. All storage operations validate against expected structure before committing writes.

## Performance Strategy

- **Targeted rendering** – Only modified components re-render\*\*
- **Event delegation** – Minimal event listener registration\*\*
- **Chart reuse** – Single Chart.js instance with data updates\*\*
- **Lazy loading** – Non-visible sections defer rendering\*\*
- **Debounced operations** – Storage writes and calculations\*\*

## Project Structure

```
Confidently-Routine
│
├── index.html
├── README.md
│
├── assets/
│   ├── css/
│   │   ├── base/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── themes/
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── store.js         # central state management
│   │   ├── components/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── routines/
│   │   │   ├── notes/
│   │   │   └── settings/
│   │   └── utils/
│   │
│   ├── images/
│   └── libs/
│       └── chart.js
│
├── views/
│   ├── dashboard.html
│   ├── routines.html
│   ├── notes.html
│   ├── login.html
│   └── settings.html
│
└── data/
    └── routines_2026-02-27.json
```

## Technical Specifications

Core:

- **HTML5**
- **CSS3 (Flexbox/Grid layouts)**
- **JavaScript ES6+ (modules, arrow functions, destructuring)**

Visualization

- **Chart.js**
- **Canvas API**

Storage

- **LocalStorage** with JSON serialization (max 5-10MB)\*\*
- **Compression** for large datasets\*\*
- **Automatic backup** before schema migrations\*\*
- **Export/import** functionality (JSON/CSV)\*\*

## Error Handling Strategy

- **Try-catch blocks** in all storage operations\*\*
- **Fallback UI states** for rendering failures\*\*
- **Validation layer** before state mutations\*\*
- **User notifications** for critical errors\*\*
- **Automatic recovery** mechanisms\*\*

## Development Practices

- **Module pattern**
- **Factory functions**
- **Composition over inheritance**
- **Pure rendering functions**
- **Explicit dependency injection**

## Engineering Decisions

No Framework
Vanilla JavaScript ensures complete control over performance characteristics and eliminates dependency overhead. The modular architecture remains adaptable to future framework integration if required.

LocalStorage First
Simplifies deployment and eliminates backend requirements. Storage abstraction allows seamless migration to alternative persistence methods.

State Distribution
Centralized stores often create unnecessary coupling. Module-local state with clear interfaces maintains boundaries while enabling necessary communication.

Manual DOM Management
Framework-less rendering demonstrates understanding of browser APIs and performance optimization at the native level.

## Future Considerations:

- **IndexedDB implementation for larger datasets**
- **Service Worker integration for offline functionality**
- **Remote sync capabilities through adapter pattern**
- **CSV export for external analysis**
- **Calendar integration interfaces**

## Packaging for Desktop & Mobile

The app ships as a browser page unmodified, and is also wrapped for native
distribution. All platforms load the exact same `index.html`/`assets/` —
nothing platform-specific lives in the app code itself.

| Platform | Tooling | Command | Requires |
|---|---|---|---|
| Windows | Electron + electron-builder | `npm run dist:win` | Windows |
| macOS | Electron + electron-builder | `npm run dist:mac` | a Mac |
| Android | Capacitor + Gradle | `npm run dist:android` | Android SDK + JDK 21 |
| iOS | Capacitor + Xcode | `npm run sync:ios`, then build in Xcode | a Mac with Xcode |
| Browser | — | just open `index.html` via any static server | — |

Output lands in `release/` (desktop) or `android/app/build/outputs/apk/`
(Android); both are gitignored build artifacts, not source.

**Windows note:** `electron-builder` normally needs a code-signing vendor
package (`winCodeSign`) that includes two macOS-only symlinked files 7-Zip
can't extract without `SeCreateSymbolicLinkPrivilege` (Developer Mode or an
elevated shell). `node_modules/7zip-bin/win/x64/7za.exe` is swapped for a
thin wrapper (source in `scripts/7za-wrapper/main.go`) that excludes the
irrelevant `darwin/` folder during extraction, so this works from a
normal, non-elevated terminal. A fresh `npm install` restores the stock
`7za.exe`, so re-run `node scripts/install-7za-wrapper.js` (requires
[Go](https://go.dev)) after installing dependencies before `npm run
dist:win`.

**Android note:** requires a JDK (17 fails on this Capacitor version's
`compileDebugJavaWithJavac` step with "invalid source release: 21" — use
JDK 21) and the Android SDK's `platform-tools`, `platforms;android-34`,
and `build-tools;34.0.0` packages. `android/local.properties` must point
`sdk.dir` at the SDK using forward slashes — backslash-escaped Windows
paths there fail SDK path validation with a cryptic
"filename, directory name, or volume label syntax is incorrect" error.

**iOS/macOS note:** Apple's toolchain (Xcode, code signing, the simulator)
only runs on macOS — there is no way around this from Windows or Linux.
The `ios/` Capacitor project and its icons/splash screens are already
generated and committed, so on a Mac the remaining steps are just
`npm install`, `npx cap sync ios`, then open `ios/App/App.xcworkspace` in
Xcode to build, sign, and run.

To regenerate app icons/splash screens for Android or iOS from the brand
logo, edit `appicon-src/logo.png` and re-run:
```
npx capacitor-assets generate --assetPath appicon-src --iconBackgroundColor '#ffffff' --iconBackgroundColorDark '#ffffff' --splashBackgroundColor '#ffffff' --splashBackgroundColorDark '#121212'
```

---

<div align="center">

Confidently-Routine

GitHub • Report • Contact

⭐ Star this project if you like it!

© 2026 Confidently-Routine. All rights reserved.

# </div>
