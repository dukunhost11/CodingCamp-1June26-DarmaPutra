# Design Document: To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a single-page, client-side productivity application built with plain HTML, CSS, and vanilla JavaScript. It requires no build toolchain, no runtime dependencies, and no backend server — the user opens `index.html` directly in any modern browser.

The dashboard composes four independent widgets on a responsive grid:

| Widget | Responsibility |
|---|---|
| Greeting | Displays live clock, date, and a contextual, personalised greeting |
| Timer | Configurable Pomodoro-style countdown timer |
| Todo | Full CRUD task list with completion tracking |
| Links | Bookmark panel for quick-access hyperlinks |

All user data (name, tasks, links, timer duration, theme) is persisted to `localStorage` under namespaced keys. An optional light/dark theme toggle reads OS preferences on first load and saves the user's choice for subsequent visits.

### Key Design Principles

- **Zero dependencies**: no external libraries or frameworks.
- **Flat file structure**: one HTML file, one CSS file, one JS file.
- **Immediate persistence**: every mutation is written to `localStorage` synchronously before the function returns.
- **Graceful degradation**: all `localStorage` access is wrapped in `try/catch`; failures surface as in-page error notifications without crashing other widgets.

---

## Architecture

The application is a classic Model-View-Controller (MVC) pattern implemented entirely within a single `js/app.js` file, using plain ES6 modules (IIFE-like namespace) within that file. There is no module bundler, so all code lives in one script tag.

```
index.html
├── <link> css/style.css
└── <script> js/app.js
    ├── StorageService          — thin wrapper around localStorage
    ├── ThemeManager            — reads/writes/applies theme
    ├── GreetingWidget          — clock tick loop + name management
    ├── TimerWidget             — countdown state machine
    ├── TodoWidget              — task list CRUD
    └── LinksWidget             — bookmark CRUD
```

### Initialisation Sequence

```
DOMContentLoaded
  │
  ├── StorageService.init()         — validate localStorage availability
  ├── ThemeManager.init()           — apply theme synchronously (before first paint)
  ├── GreetingWidget.init()         — restore name, start clock tick
  ├── TimerWidget.init()            — restore duration, render display
  ├── TodoWidget.init()             — restore task list, render items
  └── LinksWidget.init()            — restore link list, render items
```

Theme is the first module initialised so the correct colour scheme is applied before any other content is painted, satisfying Requirement 7.4.

### Data Flow

```
User action (DOM event)
  │
  ├── Widget handler validates input
  ├── Widget updates in-memory state
  ├── Widget calls StorageService.save(key, value)
  │       └── localStorage.setItem(key, JSON.stringify(value))
  │           └── on error → NotificationService.show(message)
  └── Widget re-renders affected DOM nodes
```

---

## Components and Interfaces

### StorageService

Centralises all `localStorage` interaction. Every read/write is wrapped in `try/catch`.

```js
StorageService = {
  // Returns parsed value or null; on error shows notification and returns null
  load(key: string): any | null,

  // Serialises value and writes to localStorage; on error shows notification
  save(key: string, value: any): void,

  // Removes the key; on error shows notification
  remove(key: string): void,

  // Returns true if localStorage is usable, false otherwise
  isAvailable(): boolean,
}
```

**Storage Keys (namespaced)**

| Key | Type | Notes |
|---|---|---|
| `tld:userName` | `string` | Trimmed display name |
| `tld:tasks` | `Task[]` | Array, max 200 items |
| `tld:links` | `Link[]` | Array, max 50 items |
| `tld:pomodoroDuration` | `number` | Integer minutes, 1–120 |
| `tld:theme` | `"light" \| "dark"` | Theme string |

### NotificationService

Renders transient in-page error/info banners. Each notification auto-dismisses after 4 seconds.

```js
NotificationService = {
  show(message: string, type: 'error' | 'info'): void,
}
```

### ThemeManager

```js
ThemeManager = {
  // Reads localStorage → OS preference → 'light' fallback; applies before first paint
  init(): void,

  // Toggles between 'light' and 'dark', persists, applies within 300 ms
  toggle(): void,

  // Returns the currently active theme
  current(): 'light' | 'dark',
}
```

Theme is applied by setting a `data-theme` attribute on `<html>`, which CSS custom-property rules target.

### GreetingWidget

```js
GreetingWidget = {
  init(): void,               // restore name, start setInterval(tick, 1000)
  tick(): void,               // update clock display
  getGreetingPrefix(hour: number): string,  // pure function → greeting string
  saveName(raw: string): void,// validate, trim, persist, render
  renderGreeting(): void,     // compose prefix + optional name
}
```

`getGreetingPrefix` maps hour ranges to greeting strings:

| Hour range (inclusive) | Prefix |
|---|---|
| 5–11 | "Good morning" |
| 12–17 | "Good afternoon" |
| 18–21 | "Good evening" |
| 22–23, 0–4 | "Good night" |

### TimerWidget

The timer is modelled as a state machine with three states:

```
IDLE ──[Start]──► RUNNING ──[Stop]──► PAUSED
  ▲                  │                   │
  └──────[Reset]─────┘                   │
  └──────────────────────────────────────┘
  ▲                  │
  └──────────────[Reach 00:00]
```

```js
TimerWidget = {
  init(): void,
  start(): void,
  stop(): void,
  reset(): void,
  saveDuration(raw: string): void,  // validate, persist, maybe update display
  tick(): void,                     // called by setInterval every 1000 ms
  formatTime(totalSeconds: number): string,  // pure → "MM:SS"
  renderDisplay(): void,
}
```

State is held in module-level variables: `remainingSeconds`, `configuredDuration`, `intervalId`, `timerState`.

### TodoWidget

```js
TodoWidget = {
  init(): void,
  addTask(title: string): void,
  toggleTask(id: string): void,
  editTask(id: string, newTitle: string): void,
  deleteTask(id: string): void,
  renderList(): void,
  persist(): void,       // writes current tasks array to StorageService
}
```

### LinksWidget

```js
LinksWidget = {
  init(): void,
  addLink(label: string, url: string): void,
  deleteLink(id: string): void,
  normaliseUrl(url: string): string,  // prepends https:// if no scheme present
  renderList(): void,
  persist(): void,
}
```

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string} id          — crypto.randomUUID() or Date.now().toString()
 * @property {string} title       — trimmed, non-empty, max 100 chars
 * @property {boolean} completed  — false on creation
 * @property {number} createdAt   — Date.now() timestamp
 */
```

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} id          — crypto.randomUUID() or Date.now().toString()
 * @property {string} label       — trimmed, non-empty, max 100 chars
 * @property {string} url         — normalised (always http(s)://…), max 2048 chars
 * @property {number} createdAt   — Date.now() timestamp
 */
```

### Validation Rules Summary

| Field | Rule |
|---|---|
| `Task.title` | Non-empty after trim; ≤ 100 chars; case-insensitive unique within list |
| `Link.label` | Non-empty after trim; ≤ 100 chars |
| `Link.url` | Non-empty after trim; ≤ 2048 chars after normalisation; case-insensitive unique within list (after normalisation) |
| `User_Name` | Non-empty after trim; ≤ 50 chars |
| `Pomodoro_Duration` | Integer; 1 ≤ n ≤ 120 |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting prefix covers all 24 hours

*For any* integer hour in the range [0, 23], `getGreetingPrefix(hour)` SHALL return exactly one of the four valid greeting strings ("Good morning", "Good afternoon", "Good evening", "Good night"), and every hour SHALL map to exactly one prefix (no hour is unclassified, no hour maps to two prefixes).

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: User name round-trip

*For any* string that passes validation (trimmed length ≥ 1 and ≤ 50 characters), saving it as the User_Name and then loading it from `localStorage` SHALL produce a value identical to the trimmed input.

**Validates: Requirements 2.4, 2.5**

---

### Property 3: Invalid user names are rejected

*For any* string whose trimmed length is 0 (whitespace-only) OR whose length exceeds 50 characters, the `saveName` function SHALL reject it — the stored User_Name SHALL remain unchanged and the displayed validation error SHALL be non-empty.

**Validates: Requirements 2.6**

---

### Property 4: Timer format is always MM:SS

*For any* integer `totalSeconds` in the range [0, 7200] (0 to 120 minutes), `formatTime(totalSeconds)` SHALL return a string matching the pattern `^\d{2}:\d{2}$` where the minute part equals `Math.floor(totalSeconds / 60)` zero-padded to 2 digits and the second part equals `totalSeconds % 60` zero-padded to 2 digits.

**Validates: Requirements 3.1, 4.1**

---

### Property 5: Valid Pomodoro duration round-trip

*For any* integer `n` where 1 ≤ n ≤ 120, saving `n` as the Pomodoro_Duration and then loading it from `localStorage` SHALL produce the same integer `n`.

**Validates: Requirements 4.4, 4.5**

---

### Property 6: Invalid Pomodoro durations are rejected

*For any* value that is non-numeric, non-integer, less than 1, or greater than 120, the `saveDuration` function SHALL reject it — the active Pomodoro_Duration SHALL remain unchanged and a validation error SHALL be shown.

**Validates: Requirements 4.2, 4.3**

---

### Property 7: Adding a task grows the list by exactly one

*For any* task list state and any valid (non-empty, non-duplicate) task title, calling `addTask(title)` SHALL result in the task list length increasing by exactly one, and the new task SHALL appear in the list with `completed = false`.

**Validates: Requirements 5.2**

---

### Property 8: Whitespace and duplicate tasks are rejected

*For any* string whose trimmed value is empty, OR that is a case-insensitive match for an existing task title, calling `addTask` SHALL leave the task list length unchanged.

**Validates: Requirements 5.1, 5.3**

---

### Property 9: Task persistence round-trip

*For any* sequence of add/toggle/edit/delete operations on the task list, the list stored in `localStorage` after each operation SHALL be identical to the in-memory list at that point in time. Loading the stored list SHALL reproduce the in-memory list exactly.

**Validates: Requirements 5.9, 5.10**

---

### Property 10: URL normalisation idempotence

*For any* URL string `u`, `normaliseUrl(normaliseUrl(u))` SHALL equal `normaliseUrl(u)` — applying normalisation twice produces the same result as applying it once.

**Validates: Requirements 6.4**

---

### Property 11: Links with no scheme get https:// prepended

*For any* URL string that does not begin with `http://` or `https://`, `normaliseUrl(url)` SHALL return a string that begins with `https://` followed by the original input.

**Validates: Requirements 6.4**

---

### Property 12: Duplicate URL detection is case-insensitive and normalisation-aware

*For any* two URL strings `u1` and `u2` where `normaliseUrl(u1).toLowerCase() === normaliseUrl(u2).toLowerCase()`, attempting to add `u2` when `u1` is already in the list SHALL be rejected with a duplicate-URL error.

**Validates: Requirements 6.6**

---

### Property 13: Link persistence round-trip

*For any* sequence of add/delete operations on the link list, the list stored in `localStorage` SHALL be identical to the in-memory list. Loading the stored list SHALL reproduce the in-memory list exactly.

**Validates: Requirements 6.8, 6.9**

---

### Property 14: Theme toggle is its own inverse

*For any* active theme `t` ∈ {"light", "dark"}, calling `toggle()` once SHALL switch to the opposite theme, and calling `toggle()` a second time SHALL return to `t`. After each toggle the `data-theme` attribute on `<html>` SHALL reflect the current theme.

**Validates: Requirements 7.1, 7.2**

---

### Property 15: Theme preference round-trip

*For any* theme value `t` ∈ {"light", "dark"}, saving `t` to `localStorage` and then calling `ThemeManager.init()` SHALL apply `t` without flash and without an additional read of `prefers-color-scheme`.

**Validates: Requirements 7.3, 7.4**

---

## Error Handling

### localStorage Unavailability

`StorageService.isAvailable()` is called once at startup. If unavailable, a single global banner informs the user that persistence is disabled for this session; widgets continue to function in memory. Each subsequent write attempt that fails also surfaces a specific notification (e.g., "Could not save your task list").

### Validation Errors

All validation errors are surfaced inline, adjacent to the relevant input, using `role="alert"` ARIA regions so screen readers announce them. The error is cleared when the user begins typing again.

### Timer Safety

The timer uses a single `setInterval` handle stored in `intervalId`. `start()` checks `intervalId === null` before creating a new interval, preventing double-start. `stop()` and `reset()` both call `clearInterval(intervalId); intervalId = null` before acting, preventing dangling intervals.

### Corrupt localStorage Data

On load, all `JSON.parse` calls are wrapped in `try/catch`. If stored data is malformed, the widget initialises to its default empty state and shows a notification (e.g., "Could not restore your tasks — starting fresh").

---

## Testing Strategy

### Applicable Testing Approaches

This project is vanilla JavaScript with no build toolchain. Testing uses the same constraint: a lightweight, zero-dependency property-based testing library loaded via CDN or vendored as a single file.

**Recommended library**: [fast-check](https://github.com/dubzzz/fast-check) (MIT licence) — runs in-browser or in Node without a bundler.

### Unit Tests

Unit tests cover specific examples, edge cases, and integration points:

- `getGreetingPrefix` — verify each boundary hour (0, 4, 5, 11, 12, 17, 18, 21, 22, 23).
- `formatTime` — verify `0 → "00:00"`, `3661 → "61:01"`, `7200 → "120:00"`.
- `normaliseUrl` — verify strings already starting with `http://` or `https://` are unchanged; bare domains get `https://` prepended.
- `saveDuration` edge cases — `0`, `121`, `"abc"`, `1.5`, `""`.
- `saveName` edge cases — empty string, single space, exactly 50 chars, 51 chars.
- `TodoWidget.addTask` duplicate detection — same title different casing.
- `LinksWidget.addLink` duplicate URL detection — case and normalisation variants.

### Property-Based Tests

Each property test runs a minimum of **100 iterations** and is tagged with the design property it validates.

| # | Tag | Generator | Assertion |
|---|---|---|---|
| P1 | `Feature: todo-life-dashboard, Property 1: Greeting prefix covers all 24 hours` | integer in [0, 23] | result ∈ {"Good morning", "Good afternoon", "Good evening", "Good night"} |
| P2 | `Feature: todo-life-dashboard, Property 2: User name round-trip` | string length [1, 50] | load(save(name)) === name.trim() |
| P3 | `Feature: todo-life-dashboard, Property 3: Invalid user names are rejected` | whitespace-only strings + strings length > 50 | stored name unchanged |
| P4 | `Feature: todo-life-dashboard, Property 4: Timer format is always MM:SS` | integer in [0, 7200] | /^\d{2}:\d{2}$/ matches; minutes and seconds correct |
| P5 | `Feature: todo-life-dashboard, Property 5: Valid Pomodoro duration round-trip` | integer in [1, 120] | load(save(n)) === n |
| P6 | `Feature: todo-life-dashboard, Property 6: Invalid Pomodoro durations are rejected` | values outside [1, 120] or non-integer | active duration unchanged |
| P7 | `Feature: todo-life-dashboard, Property 7: Adding a task grows the list by exactly one` | valid title + existing task list | length increases by 1; completed = false |
| P8 | `Feature: todo-life-dashboard, Property 8: Whitespace and duplicate tasks are rejected` | whitespace strings + duplicate titles | list length unchanged |
| P9 | `Feature: todo-life-dashboard, Property 9: Task persistence round-trip` | sequence of task operations | in-memory list === loaded list |
| P10 | `Feature: todo-life-dashboard, Property 10: URL normalisation idempotence` | arbitrary URL strings | normalise(normalise(u)) === normalise(u) |
| P11 | `Feature: todo-life-dashboard, Property 11: Links with no scheme get https:// prepended` | URLs without http(s):// prefix | result starts with "https://" |
| P12 | `Feature: todo-life-dashboard, Property 12: Duplicate URL detection is case-insensitive and normalisation-aware` | pairs of equivalent URLs | second add is rejected |
| P13 | `Feature: todo-life-dashboard, Property 13: Link persistence round-trip` | sequence of link operations | in-memory list === loaded list |
| P14 | `Feature: todo-life-dashboard, Property 14: Theme toggle is its own inverse` | starting theme ∈ {"light", "dark"} | double-toggle returns to original theme |
| P15 | `Feature: todo-life-dashboard, Property 15: Theme preference round-trip` | theme value ∈ {"light", "dark"} | init() after save applies correct theme |

### Integration / Smoke Tests

- **Smoke**: Open `index.html` in a browser; verify all four widgets render without console errors.
- **localStorage unavailable**: Override `window.localStorage` to throw; verify error notifications appear and widgets still function.
- **Responsive layout**: Manually resize viewport through 320 px / 768 px / 1200 px breakpoints; verify column layout changes as specified.

### Testing Approach for Non-PBT Requirements

- **Requirement 9 (Responsive Layout)**: CSS `@media` queries are declarative; validate with snapshot-style assertions on computed `grid-template-columns` at each breakpoint.
- **Requirement 10 (Project Structure)**: Verified by file-system inspection — one `.html`, one `.css`, one `.js`, no additional files of those types.
