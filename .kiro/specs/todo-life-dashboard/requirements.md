# Requirements Document

## Introduction

The To-Do Life Dashboard is a client-side web application that serves as a personal productivity homepage. It combines four core widgets — a time/date greeting, a focus (Pomodoro) timer, a to-do list, and a quick-links panel — into a single, clean page. All data is persisted using the browser's Local Storage API. No backend server is required. The dashboard is built with plain HTML, CSS, and vanilla JavaScript.

The three chosen optional challenges add:
- **Light / Dark mode** — a theme toggle saved across sessions.
- **Custom name in greeting** — the user's name appears in the greeting message.
- **Change Pomodoro time** — the user can set a custom focus duration before starting the timer.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The section of the Dashboard that displays the current time, date, and a personalised greeting message.
- **Timer_Widget**: The section of the Dashboard that implements a configurable countdown (Pomodoro-style) focus timer.
- **Todo_Widget**: The section of the Dashboard that manages the user's task list.
- **Links_Widget**: The section of the Dashboard that manages and displays quick-access hyperlinks.
- **Local_Storage**: The browser's `localStorage` Web Storage API used to persist all user data client-side.
- **Task**: A single to-do item with a title and a completion status.
- **Link**: A user-defined entry consisting of a label and a URL.
- **Theme**: The visual colour scheme of the Dashboard — either "light" or "dark".
- **Pomodoro_Duration**: The number of minutes configured for a single focus session.
- **User_Name**: The display name the user sets for use in the greeting.

---

## Requirements

### Requirement 1: Time and Date Greeting

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I always have a quick at-a-glance awareness of the moment.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS format using the user's device local time, rendered immediately on page load and updated every 1000 ms ± 50 ms.
2. THE Greeting_Widget SHALL display the current date using the user's device local time in the format "Weekday, D Month YYYY" (e.g., "Monday, 2 June 2025"), where the day is not zero-padded.
3. WHEN the local hour (inclusive) is between 5 and 11, THE Greeting_Widget SHALL display the greeting prefix "Good morning".
4. WHEN the local hour (inclusive) is between 12 and 17, THE Greeting_Widget SHALL display the greeting prefix "Good afternoon".
5. WHEN the local hour (inclusive) is between 18 and 21, THE Greeting_Widget SHALL display the greeting prefix "Good evening".
6. WHEN the local hour (inclusive) is between 22 and 23, or between 0 and 4, THE Greeting_Widget SHALL display the greeting prefix "Good night".

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a user, I want to set my name so that the greeting message feels personalised.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL provide an input control that allows the user to enter a User_Name of up to 50 characters.
2. WHEN the user submits a User_Name that is non-empty and not whitespace-only (trimmed length ≥ 1) and is at most 50 characters, THE Greeting_Widget SHALL display the greeting as "[greeting prefix], [User_Name]!" (e.g., "Good morning, Alex!").
3. WHEN no User_Name has been saved, THE Greeting_Widget SHALL display the greeting prefix only, without a name suffix.
4. WHEN the user submits a User_Name, THE Dashboard SHALL persist the trimmed User_Name in Local_Storage.
5. WHEN the Dashboard loads and Local_Storage contains a previously saved User_Name, THE Greeting_Widget SHALL restore and display that User_Name without requiring re-entry.
6. IF the user submits a User_Name that is whitespace-only or exceeds 50 characters, THEN THE Greeting_Widget SHALL display a validation error message, reject the input, and retain the previously saved User_Name in the input field.
7. WHEN Local_Storage is unavailable during a User_Name save attempt, THE Greeting_Widget SHALL display the User_Name for the current session only and show an error notification explaining that the name could not be persisted.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a configurable countdown timer so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Timer_Widget SHALL display a countdown in MM:SS format.
2. WHEN the Dashboard loads and no custom Pomodoro_Duration has been saved, THE Timer_Widget SHALL initialise the countdown to 25:00.
3. WHEN the user presses the Start button and the timer is not running, THE Timer_Widget SHALL begin counting down one second per real second.
4. WHEN the user presses the Stop button and the timer is running, THE Timer_Widget SHALL pause the countdown at the current value.
5. WHEN the user presses the Reset button, THE Timer_Widget SHALL stop the countdown (regardless of running state) and restore the displayed time to the currently configured Pomodoro_Duration.
6. WHEN the countdown reaches 00:00, THE Timer_Widget SHALL stop automatically and display a visible session-complete notification within the widget area; the Start button SHALL be re-enabled.

---

### Requirement 4: Change Pomodoro Time

**User Story:** As a user, I want to customise the focus timer duration so that I can adapt sessions to my workflow.

#### Acceptance Criteria

1. THE Timer_Widget SHALL provide an input control that allows the user to enter a Pomodoro_Duration in whole minutes.
2. WHEN the user saves a Pomodoro_Duration, THE Timer_Widget SHALL accept only integer values between 1 and 120 inclusive.
3. IF the user enters a value that is non-numeric, non-integer, or outside the range 1–120, THEN THE Timer_Widget SHALL display a validation error message, reject the value, and retain the previously active Pomodoro_Duration.
4. WHEN a valid Pomodoro_Duration is saved, THE Dashboard SHALL persist the Pomodoro_Duration in Local_Storage.
5. WHEN the Dashboard loads, THE Timer_Widget SHALL initialise the countdown to the Pomodoro_Duration saved in Local_Storage if present, or to 25 minutes if no saved duration exists.
6. WHEN a new Pomodoro_Duration is saved while the timer is not running, THE Timer_Widget SHALL immediately update the displayed countdown to the new duration.
7. WHEN a new Pomodoro_Duration is saved while the timer is running, THE Timer_Widget SHALL apply the new duration only after the current countdown session ends or is reset, without interrupting the active countdown.
8. WHEN Local_Storage is unavailable during a Pomodoro_Duration save attempt, THE Timer_Widget SHALL display an error notification and retain the previously active Pomodoro_Duration for the current session.

---

### Requirement 5: To-Do List

**User Story:** As a user, I want to manage a list of tasks so that I can track what needs to be done throughout my day.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide an input field for entering a new task title of up to 100 characters.
2. WHEN the user submits a non-empty task title (via the Enter key or a dedicated Add button), THE Todo_Widget SHALL add a new Task with completion status "incomplete" to the list.
3. IF the user submits a task title that is identical (case-insensitive) to an existing Task title in the list, THEN THE Todo_Widget SHALL display a duplicate-warning message and not add the Task.
4. WHEN a Task is displayed, THE Todo_Widget SHALL show a checkbox that reflects the Task's completion status.
5. WHEN the user toggles the checkbox of a Task, THE Todo_Widget SHALL update that Task's completion status; completed Tasks SHALL be visually distinguished with a strikethrough style and opacity of 50% or less.
6. WHEN the user activates the edit control of a Task, THE Todo_Widget SHALL allow the user to modify the Task title inline.
7. WHEN the user saves an edited Task title, THE Todo_Widget SHALL validate that the new title is non-empty and not a case-insensitive duplicate of another existing Task; IF the title is empty, THE Todo_Widget SHALL display an "empty title" error and retain the previous title; IF the title is a duplicate, THE Todo_Widget SHALL display a "duplicate task" error and retain the previous title.
8. WHEN the user activates the delete control of a Task, THE Todo_Widget SHALL remove that Task from the list.
9. WHEN any Task is added, updated, or deleted, THE Dashboard SHALL persist the full Task list in Local_Storage.
10. WHEN the Dashboard loads and Local_Storage contains a previously saved Task list, THE Todo_Widget SHALL restore and display all saved Tasks.
11. WHEN the Dashboard loads and Local_Storage contains no saved Task list, THE Todo_Widget SHALL display an empty list with no error.

---

### Requirement 6: Quick Links

**User Story:** As a user, I want to save and access my favourite websites quickly so that I can navigate to them in one click.

#### Acceptance Criteria

1. THE Links_Widget SHALL provide an input field for a Link label (up to 100 characters) and a separate input field for a Link URL (up to 2048 characters).
2. WHEN the user submits a label that is non-empty and not whitespace-only, and a URL that is non-empty and not whitespace-only, THE Links_Widget SHALL add the Link to the panel.
3. IF the user submits a label or URL that is empty or whitespace-only, THEN THE Links_Widget SHALL display a validation error indicating which field is invalid, reject the submission, and preserve the content of the other field.
4. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Links_Widget SHALL prepend "https://" to the URL before saving.
5. WHEN a Link is displayed, THE Links_Widget SHALL render it as a clickable element that opens the URL in a new browser tab.
6. IF the user submits a URL that is identical (case-insensitive, after prefix normalisation) to an existing Link URL, THEN THE Links_Widget SHALL display a duplicate-URL error message and not add the Link.
7. WHEN the user activates the delete control of a Link, THE Links_Widget SHALL remove that Link from the panel.
8. WHEN any Link is added or deleted, THE Dashboard SHALL persist the full Link list in Local_Storage.
9. WHEN the Dashboard loads and Local_Storage contains a previously saved Link list, THE Links_Widget SHALL restore and display all saved Links.

---

### Requirement 7: Light / Dark Mode

**User Story:** As a user, I want to switch between a light and a dark colour theme so that the Dashboard is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control that switches the Theme between "light" and "dark"; the toggle SHALL visually reflect the currently active Theme at all times.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected Theme to the entire page within 300 ms, with no full-page reload.
3. WHEN a Theme is selected, THE Dashboard SHALL persist the Theme value in Local_Storage.
4. WHEN the Dashboard loads and Local_Storage contains a previously saved Theme value, THE Dashboard SHALL apply that Theme synchronously before the first paint so that no content is rendered under a different Theme.
5. WHEN the Dashboard loads and no Theme has been saved in Local_Storage, THE Dashboard SHALL check the OS-level `prefers-color-scheme` media feature; IF the OS preference is "dark", THE Dashboard SHALL apply the "dark" Theme by default.
6. WHEN the Dashboard loads and no Theme has been saved in Local_Storage and the OS preference is not "dark", THE Dashboard SHALL apply the "light" Theme by default.

---

### Requirement 8: Data Persistence and Storage

**User Story:** As a user, I want my settings and data to be saved automatically so that I do not lose anything when I close or refresh the browser.

#### Acceptance Criteria

1. THE Dashboard SHALL use Local_Storage as the sole persistence mechanism for all user data.
2. THE Dashboard SHALL NOT require any network request to load or save user data.
3. WHEN Local_Storage is unavailable or throws an error during a read, parse, or write operation, THE Dashboard SHALL display an error notification describing which data category failed to load or save.
4. THE Dashboard SHALL use distinct, namespaced Local_Storage keys for each data category (User_Name, Task list, Link list, Pomodoro_Duration, and Theme) to avoid key collisions; the Task list SHALL support up to 200 items and the Link list SHALL support up to 50 items.
5. WHEN any user data changes (task added/edited/deleted, link added/deleted, name saved, duration saved, theme toggled), THE Dashboard SHALL immediately persist the updated data to Local_Storage without requiring an explicit save action.
6. WHEN the Dashboard loads, THE Dashboard SHALL restore all persisted data categories from Local_Storage before rendering any widget content.

---

### Requirement 9: Responsive Layout

**User Story:** As a user, I want the Dashboard to be usable on different screen sizes so that I can open it on any device.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets with no text overflow or horizontal scroll on viewport widths from 320 px to 2560 px.
2. WHEN the viewport width is below 768 px, THE Dashboard SHALL stack the widgets in a single column (1 column layout).
3. WHEN the viewport width is between 768 px and 1199 px inclusive, THE Dashboard SHALL arrange the widgets in a 2-column grid layout.
4. WHEN the viewport width is 1200 px or above, THE Dashboard SHALL arrange the widgets in a multi-column grid layout of at least 2 columns.

---

### Requirement 10: Project Structure

**User Story:** As a developer, I want the codebase to follow a clear folder structure so that it is easy to maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be structured with exactly one HTML file at the project root (index.html).
2. THE Dashboard SHALL contain exactly one CSS file located at css/style.css.
3. THE Dashboard SHALL contain exactly one JavaScript file located at js/app.js.
4. THE Dashboard SHALL NOT depend on any external JavaScript frameworks or CSS frameworks loaded at runtime.
5. THE Dashboard SHALL NOT require a backend server; opening index.html directly in a browser SHALL provide full functionality.
6. THE Dashboard's HTML, CSS, and JavaScript SHALL each be contained in their respective single files with no additional files of the same type introduced during development.
