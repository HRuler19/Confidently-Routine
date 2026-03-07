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

---

<div align="center">

Confidently-Routine

GitHub • Report • Contact

⭐ Star this project if you like it!

© 2026 Confidently-Routine. All rights reserved.

# </div>
