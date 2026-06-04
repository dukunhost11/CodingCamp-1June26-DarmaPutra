# Implementation Plan: To-Do Life Dashboard

## Overview

Implement a single-page, client-side productivity dashboard using plain HTML, CSS, and vanilla JavaScript. The app is composed of four widgets (Greeting, Timer, Todo, Links) wired together through a shared StorageService and NotificationService. All code lives in three files: `index.html`, `css/style.css`, and `js/app.js`.

## Tasks

- [x] 1. Set up project structure and foundational scaffolding
  - Create `index.html` with semantic HTML skeleton: `<html data-theme>`, `<head>` with meta viewport and `<link>` to `css/style.css`, `<body>` containing placeholder sections for all four widgets, and `<script src="js/app.js">` at end of body
  - Create empty `css/style.css` and `js/app.js` files to match the required flat file structure
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

- [x] 2. Implement StorageService and NotificationService
  - [x] 2.1 Implement `StorageService` in `js/app.js`
    - Write `isAvailable()`, `load(key)`, `save(key, value)`, and `remove(key)` using the namespaced keys (`tld:userName`, `tld:tasks`, `tld:links`, `tld:pomodoroDuration`, `tld:theme`)
    - Wrap every `localStorage` call in `try/catch`; on error call `NotificationService.show()`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.2 Implement `NotificationService` in `js/app.js`
    - Write `show(message, type)` that renders a transient in-page banner with `role="alert"` that auto-dismisses after 4 seconds
    - _Requirements: 8.3_

  

- [x] 3. Implement ThemeManager
  - [x] 3.1 Implement `ThemeManager` in `js/app.js`
    - Write `init()`: read `tld:theme` from `localStorage` → fall back to `prefers-color-scheme` → default `"light"`; apply by setting `document.documentElement.dataset.theme` synchronously
    - Write `toggle()`: flip between `"light"` and `"dark"`, persist, apply within 300 ms
    - Write `current()`: return active theme string
    - Wire `init()` as the first call in `DOMContentLoaded` handler
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_


- [x] 4. Add CSS custom properties and responsive layout
  - [x] 4.1 Implement CSS custom properties and theme rules in `css/style.css`
    - Define `[data-theme="light"]` and `[data-theme="dark"]` custom-property blocks covering all colour tokens used by widgets
    - Apply base typography, box-sizing reset, and smooth theme transition (≤ 300 ms)
    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Implement responsive grid layout in `css/style.css`
    - Write `@media` rules: single column below 768 px; 2-column grid 768–1199 px; multi-column (≥ 2 cols) at 1200 px+
    - Ensure no text overflow or horizontal scroll from 320 px to 2560 px
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 5. Implement GreetingWidget
  - [x] 5.1 Implement `getGreetingPrefix(hour)` pure function in `js/app.js`
    - Map hour ranges: 5–11 → "Good morning", 12–17 → "Good afternoon", 18–21 → "Good evening", 22–23 and 0–4 → "Good night"
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [ ]* 5.2 Write property test for `getGreetingPrefix` — covers all 24 hours
    - **Property 1: Greeting prefix covers all 24 hours**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 5.3 Implement `GreetingWidget.init()`, `tick()`, and `renderGreeting()` in `js/app.js`
    - `tick()`: read `new Date()`, update clock display (HH:MM:SS), update date display ("Weekday, D Month YYYY", non-zero-padded day), call `renderGreeting()`
    - `init()`: restore saved User_Name from `StorageService`, call `tick()`, start `setInterval(tick, 1000)`
    - `renderGreeting()`: compose "[prefix], [name]!" or prefix-only when no name is set
    - _Requirements: 1.1, 1.2, 2.3, 2.5_

  - [x] 5.4 Implement `GreetingWidget.saveName(raw)` in `js/app.js`
    - Validate: trimmed length ≥ 1 and ≤ 50; on failure show inline validation error and retain previous value
    - On success: persist trimmed name via `StorageService`, update display
    - Handle `localStorage` unavailability: show session-only notification per Requirement 2.7
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 2.7_

 

- [x] 6. Checkpoint — Greeting widget complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement TimerWidget
  - [x] 7.1 Implement `formatTime(totalSeconds)` pure function in `js/app.js`
    - Return `"MM:SS"` string: minutes zero-padded to 2 digits, seconds zero-padded to 2 digits
    - _Requirements: 3.1_



  - [x] 7.3 Implement `TimerWidget.saveDuration(raw)` in `js/app.js`
    - Validate: integer, 1 ≤ n ≤ 120; on failure show validation error, retain previous duration
    - On success: persist via `StorageService`; if timer is IDLE/PAUSED update display immediately; if RUNNING defer until reset or session end per Requirement 4.7
    - Handle `localStorage` unavailability per Requirement 4.8
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8_

  

  - [x] 7.6 Implement `TimerWidget.init()`, `start()`, `stop()`, `reset()`, `tick()`, and `renderDisplay()` in `js/app.js`
    - `init()`: restore `configuredDuration` from `StorageService` (default 25), set `remainingSeconds`, render display
    - `start()`: guard against double-start (`intervalId !== null`); set state to RUNNING; start `setInterval(tick, 1000)`
    - `stop()`: `clearInterval`; set state to PAUSED
    - `reset()`: `clearInterval`; restore `remainingSeconds` to `configuredDuration`; set state to IDLE; render
    - `tick()`: decrement `remainingSeconds`; if 0 → `clearInterval`, show session-complete notification, re-enable Start button
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 4.5_

- [x] 8. Checkpoint — Timer widget complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement TodoWidget
  - [x] 9.1 Implement `TodoWidget.addTask(title)` in `js/app.js`
    - Validate: trimmed non-empty, ≤ 100 chars, case-insensitive unique; on failure show appropriate error
    - Create Task object with `id` (`crypto.randomUUID()` or `Date.now().toString()`), trimmed `title`, `completed: false`, `createdAt: Date.now()`
    - Push to in-memory array; call `persist()`; call `renderList()`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.4 Implement `TodoWidget.toggleTask(id)`, `editTask(id, newTitle)`, and `deleteTask(id)` in `js/app.js`
    - `toggleTask`: flip `completed` on matching task; call `persist()` and `renderList()`
    - `editTask`: validate new title (non-empty, ≤ 100 chars, not a case-insensitive duplicate of another task); on failure show inline error; on success update title, persist, re-render
    - `deleteTask`: remove task by id; call `persist()` and `renderList()`
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 9.5 Implement `TodoWidget.init()`, `renderList()`, and `persist()` in `js/app.js`
    - `init()`: load tasks from `StorageService`; render list (empty list is valid)
    - `renderList()`: for each task, render checkbox (checked = completed), title with strikethrough + 50% opacity when completed, edit control, delete control; use `role="alert"` for inline errors
    - `persist()`: call `StorageService.save("tld:tasks", tasks)`
    - _Requirements: 5.4, 5.5, 5.9, 5.10, 5.11_

  

- [x] 10. Checkpoint — Todo widget complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement LinksWidget
  - [x] 11.1 Implement `LinksWidget.normaliseUrl(url)` pure function in `js/app.js`
    - If `url` does not begin with `http://` or `https://`, prepend `https://`; otherwise return unchanged
    - _Requirements: 6.4_

  

  - [x] 11.4 Implement `LinksWidget.addLink(label, url)` in `js/app.js`
    - Validate label: non-empty after trim, ≤ 100 chars; validate url: non-empty after trim, ≤ 2048 chars after normalisation; show per-field errors on failure, preserve the other field's value
    - Normalise URL; check case-insensitive duplicate against existing link URLs; reject with duplicate-URL error if found
    - Create Link object with `id`, trimmed `label`, normalised `url`, `createdAt`; push to in-memory array; call `persist()` and `renderList()`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

 

  - [x] 11.6 Implement `LinksWidget.deleteLink(id)`, `renderList()`, `persist()`, and `init()` in `js/app.js`
    - `init()`: load links from `StorageService`; render list
    - `renderList()`: render each link as a clickable element opening in a new tab (`target="_blank" rel="noopener noreferrer"`)
    - `deleteLink(id)`: remove by id; persist; re-render
    - `persist()`: call `StorageService.save("tld:links", links)`
    - _Requirements: 6.5, 6.7, 6.8, 6.9_

 

- [x] 12. Checkpoint — Links widget complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Wire all modules together under `DOMContentLoaded`
  - [x] 13.1 Implement the `DOMContentLoaded` initialisation sequence in `js/app.js`
    - Call in order: `StorageService.init()` → `ThemeManager.init()` → `GreetingWidget.init()` → `TimerWidget.init()` → `TodoWidget.init()` → `LinksWidget.init()`
    - Bind all DOM event listeners: theme toggle button, name input submit, timer Start/Stop/Reset buttons, duration input submit, task add/edit/delete/toggle controls, link add/delete controls
    - _Requirements: 8.6, 7.4_

  - [x] 13.2 Add widget HTML markup and widget-specific CSS in `index.html` and `css/style.css`
    - Flesh out widget sections in `index.html` with all required inputs, buttons, and display regions (clock, date, greeting, timer display, task list container, links container, theme toggle)
    - Add widget-scoped styles in `css/style.css`: completed task strikethrough and opacity, timer display font, notification banner, inline error styles with `role="alert"` targeting
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 5.5, 6.1, 7.1, 9.1_


- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All code resides in exactly three files: `index.html`, `css/style.css`, `js/app.js` — no additional files of the same type
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) (MIT), vendored as a single file or loaded via CDN in the test harness; they run in-browser or in Node without a bundler
- Checkpoints ensure incremental validation at each widget boundary
- Property tests validate universal correctness properties; unit tests cover specific examples and edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "7.1"] },
    { "id": 6, "tasks": ["5.5", "5.6", "7.2", "7.3"] },
    { "id": 7, "tasks": ["7.4", "7.5", "7.6", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 9, "tasks": ["9.5", "11.1"] },
    { "id": 10, "tasks": ["9.6", "11.2", "11.3", "11.4"] },
    { "id": 11, "tasks": ["11.5", "11.6"] },
    { "id": 12, "tasks": ["11.7", "13.1"] },
    { "id": 13, "tasks": ["13.2"] },
    { "id": 14, "tasks": ["13.3"] }
  ]
}
```
