/* To-Do Life Dashboard — application logic */

/* ─────────────────────────────────────────────────────────────
   NotificationService
   Renders transient in-page banners with role="alert".
   Each notification auto-dismisses after 4 seconds.
   Requirements: 8.3
   ───────────────────────────────────────────────────────────── */
const NotificationService = {
  /**
   * Display a transient notification banner.
   * @param {string} message - Text content to display.
   * @param {'error'|'info'} type - Controls the visual style of the banner.
   */
  show(message, type = 'info') {
    const banner = document.createElement('div');
    banner.setAttribute('role', 'alert');
    banner.className = `notification notification--${type}`;
    banner.textContent = message;

    // Append to a dedicated container if one exists, otherwise fall back to body.
    const container = document.getElementById('notification-container') || document.body;
    container.appendChild(banner);

    // Auto-remove after 4 seconds.
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 4000);
  },
};

/**
 * StorageService
 *
 * Thin wrapper around localStorage. All reads and writes are namespaced
 * under the `tld:` prefix and wrapped in try/catch so that a storage
 * failure never crashes other widgets.
 *
 * Supported keys:
 *   tld:userName          (string)
 *   tld:tasks             (Task[])
 *   tld:links             (Link[])
 *   tld:pomodoroDuration  (number)
 *   tld:theme             ("light" | "dark")
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
const StorageService = {
  /**
   * Returns true if localStorage is accessible and functional, false otherwise.
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const testKey = '__tld_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (_e) {
      return false;
    }
  },

  /**
   * Reads and JSON-parses a value from localStorage.
   * Returns the parsed value, or null if the key is absent or on any error.
   * On error, surfaces a notification via NotificationService.
   *
   * @param {string} key  — one of the namespaced `tld:*` keys
   * @returns {any|null}
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_e) {
      // NotificationService is defined later in this file; the reference is
      // resolved at call time, so this forward reference is safe.
      NotificationService.show(
        `Could not load data for "${key}". Your data may not be restored correctly.`,
        'error'
      );
      return null;
    }
  },

  /**
   * JSON-serialises value and writes it to localStorage under key.
   * On error, surfaces a notification via NotificationService.
   *
   * @param {string} key   — one of the namespaced `tld:*` keys
   * @param {any}    value — the value to persist
   * @returns {void}
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_e) {
      NotificationService.show(
        `Could not save data for "${key}". Changes may not persist after you leave the page.`,
        'error'
      );
    }
  },

  /**
   * Removes the entry for key from localStorage.
   * On error, surfaces a notification via NotificationService.
   *
   * @param {string} key — one of the namespaced `tld:*` keys
   * @returns {void}
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_e) {
      NotificationService.show(
        `Could not remove data for "${key}".`,
        'error'
      );
    }
  },
};

/* ─────────────────────────────────────────────────────────────
   ThemeManager
   Reads, writes, and applies the light/dark colour theme.

   Resolution order on init():
     1. localStorage (tld:theme)
     2. OS prefers-color-scheme: dark
     3. Default: "light"

   Theme is applied by setting document.documentElement.dataset.theme
   to "light" or "dark".

   Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
   ───────────────────────────────────────────────────────────── */
const ThemeManager = {
  /**
   * Reads the persisted theme from localStorage, falls back to the OS
   * prefers-color-scheme media feature, then defaults to "light".
   * Applies the resolved theme synchronously so no content is rendered
   * under the wrong colour scheme (satisfies Requirement 7.4).
   *
   * @returns {void}
   */
  init() {
    // 1. Try the persisted preference.
    const stored = StorageService.load('tld:theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored;
      return;
    }

    // 2. Fall back to the OS colour-scheme preference.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      document.documentElement.dataset.theme = 'dark';
      return;
    }

    // 3. Default to light.
    document.documentElement.dataset.theme = 'light';
  },

  /**
   * Toggles the active theme between "light" and "dark", persists the
   * new value, and applies it to the document within 300 ms
   * (satisfies Requirements 7.1, 7.2, 7.3).
   *
   * @returns {void}
   */
  toggle() {
    const next = this.current() === 'light' ? 'dark' : 'light';
    StorageService.save('tld:theme', next);
    document.documentElement.dataset.theme = next;
  },

  /**
   * Returns the currently active theme string by reading the
   * data-theme attribute from <html>.  Falls back to "light" if the
   * attribute is absent or holds an unexpected value.
   *
   * @returns {'light'|'dark'}
   */
  current() {
    const theme = document.documentElement.dataset.theme;
    return theme === 'dark' ? 'dark' : 'light';
  },
};

/* ─────────────────────────────────────────────────────────────
   getGreetingPrefix(hour)
   Pure function — no side effects.
   Maps the current hour (0–23) to a contextual greeting prefix.

   Hour ranges:
     5–11  → "Good morning"
     12–17 → "Good afternoon"
     18–21 → "Good evening"
     22–23, 0–4 → "Good night"

   Requirements: 1.3, 1.4, 1.5, 1.6
   ───────────────────────────────────────────────────────────── */
/**
 * Return a contextual greeting prefix for the given hour of day.
 * @param {number} hour - Integer in the range [0, 23].
 * @returns {"Good morning"|"Good afternoon"|"Good evening"|"Good night"}
 */
function getGreetingPrefix(hour) {
  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  if (hour >= 18 && hour <= 21) return 'Good evening';
  return 'Good night'; // covers 22–23 and 0–4
}

/* ─────────────────────────────────────────────────────────────
   formatTime(totalSeconds)
   Pure function — no side effects.
   Converts a non-negative integer number of seconds into a
   zero-padded "MM:SS" display string.

   Examples:
     formatTime(0)    → "00:00"
     formatTime(90)   → "01:30"
     formatTime(3661) → "61:01"
     formatTime(7200) → "120:00"

   Requirements: 3.1
   ───────────────────────────────────────────────────────────── */
/**
 * Format a duration in seconds as a zero-padded MM:SS string.
 * The minutes component is padded to at least 2 digits; the seconds
 * component is always exactly 2 digits.
 *
 * @param {number} totalSeconds - Non-negative integer number of seconds.
 * @returns {string} A string matching /^\d{2,}:\d{2}$/, e.g. "01:30" or "120:00".
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

/* ─────────────────────────────────────────────────────────────
   GreetingWidget
   Manages the live clock, date display, and personalised greeting.

   - tick()           : reads the current time, updates the clock
                        (HH:MM:SS) and date ("Weekday, D Month YYYY")
                        displays, then calls renderGreeting().
   - init()           : restores the saved User_Name from StorageService,
                        calls tick() immediately, then starts a 1-second
                        setInterval so tick() fires every 1000 ms.
   - renderGreeting() : composes "[prefix], [name]!" when a name is set,
                        or just the prefix when no name is stored.

   Requirements: 1.1, 1.2, 2.3, 2.5
   ───────────────────────────────────────────────────────────── */
const GreetingWidget = {
  /** @type {string} Currently loaded user name (empty string means none set). */
  _userName: '',

  /**
   * Restore the saved User_Name, render the first tick immediately, and
   * start the 1-second clock interval.
   * @returns {void}
   */
  init() {
    const saved = StorageService.load('tld:userName');
    // Accept any non-empty string that survived the earlier trim + validation.
    if (typeof saved === 'string' && saved.trim().length > 0) {
      this._userName = saved.trim();
    }

    // First render before the interval fires.
    this.tick();

    // Arrow function preserves `this` so tick() always runs in GreetingWidget's
    // context regardless of how setInterval invokes the callback.
    setInterval(() => this.tick(), 1000);
  },

  /**
   * Read the current local time, update the clock and date DOM elements,
   * then refresh the greeting message.
   * @returns {void}
   */
  tick() {
    const now = new Date();

    // ── Clock: HH:MM:SS (all parts zero-padded to 2 digits) ──────────────
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const clockEl = document.getElementById('greeting-time');
    if (clockEl) {
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    }

    // ── Date: "Weekday, D Month YYYY" (day is NOT zero-padded) ───────────
    const WEEKDAYS = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday',
    ];
    const MONTHS = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const weekday = WEEKDAYS[now.getDay()];
    const day     = now.getDate();          // getDate() is never zero-padded
    const month   = MONTHS[now.getMonth()];
    const year    = now.getFullYear();

    const dateEl = document.getElementById('greeting-date');
    if (dateEl) {
      dateEl.textContent = `${weekday}, ${day} ${month} ${year}`;
    }

    // ── Greeting ──────────────────────────────────────────────────────────
    this.renderGreeting();
  },

  /**
   * Compose and display the greeting message.
   * - With a name : "[prefix], [name]!"   e.g. "Good morning, Alex!"
   * - Without name: "[prefix]"            e.g. "Good afternoon"
   * @returns {void}
   */
  renderGreeting() {
    const hour   = new Date().getHours();
    const prefix = getGreetingPrefix(hour);

    const message = this._userName
      ? `${prefix}, ${this._userName}!`
      : prefix;

    const msgEl = document.getElementById('greeting-message');
    if (msgEl) {
      msgEl.textContent = message;
    }
  },

  /**
   * Validate and persist the user-supplied name.
   *
   * Validation rules (Requirements 2.1, 2.6):
   *   - Trimmed length must be ≥ 1 (non-empty / non-whitespace-only)
   *   - Trimmed length must be ≤ 50 characters
   *
   * On failure: display an inline validation error in #greeting-name-error
   *             and leave _userName unchanged.
   * On success: clear the error, update _userName, refresh the greeting,
   *             persist via StorageService, and normalise the input value.
   *             If localStorage is unavailable (Requirement 2.7): show a
   *             session-only notification via NotificationService but still
   *             use the name for the current session.
   *
   * @param {string} raw - The raw string value from the name input field.
   * @returns {void}
   */
  saveName(raw) {
    const trimmed = (raw || '').trim();
    const errorEl = document.getElementById('greeting-name-error');
    const inputEl = document.getElementById('greeting-name-input');

    // ── Validation ────────────────────────────────────────────────────────
    if (trimmed.length === 0) {
      if (errorEl) {
        errorEl.textContent = 'Name cannot be empty. Please enter a valid name.';
      }
      // Retain the previous value in the input field (Requirement 2.6).
      if (inputEl) {
        inputEl.value = this._userName;
      }
      return;
    }

    if (trimmed.length > 50) {
      if (errorEl) {
        errorEl.textContent = 'Name must be 50 characters or fewer.';
      }
      // Retain the previous value in the input field (Requirement 2.6).
      if (inputEl) {
        inputEl.value = this._userName;
      }
      return;
    }

    // ── Valid name ────────────────────────────────────────────────────────
    // Clear any previous validation error.
    if (errorEl) {
      errorEl.textContent = '';
    }

    // Update in-memory state and refresh the greeting display (Requirements 2.2, 2.3).
    this._userName = trimmed;
    this.renderGreeting();

    // Persist to localStorage (Requirement 2.4).
    if (StorageService.isAvailable()) {
      StorageService.save('tld:userName', trimmed);
    } else {
      // localStorage unavailable — session-only mode (Requirement 2.7).
      NotificationService.show(
        'Your name has been set for this session only. It could not be saved because storage is unavailable.',
        'error'
      );
    }

    // Normalise the input to the trimmed value so the field reflects what was saved.
    if (inputEl) {
      inputEl.value = trimmed;
    }
  },
};

/* ─────────────────────────────────────────────────────────────
   TimerWidget
   Configurable Pomodoro-style countdown timer.

   State machine:
     IDLE ──[Start]──► RUNNING ──[Stop]──► PAUSED
       ▲                  │                   │
       └──────[Reset]─────┘                   │
       └──────────────────────────────────────┘
       ▲                  │
       └──────────────[Reach 00:00]

   Requirements: 3.1–3.6, 4.1–4.8
   ───────────────────────────────────────────────────────────── */
const TimerWidget = {
  /** @type {number} Currently configured duration in minutes (default 25). */
  _configuredDuration: 25,

  /** @type {number} Remaining seconds in the current countdown. */
  _remainingSeconds: 25 * 60,

  /** @type {number|null} setInterval handle, or null when not running. */
  _intervalId: null,

  /** @type {'IDLE'|'RUNNING'|'PAUSED'} Current timer state. */
  _timerState: 'IDLE',

  /**
   * Validate and save a new Pomodoro duration.
   *
   * Validation rules (Requirement 4.2, 4.3):
   *   - Must parse as an integer (Number.isInteger)
   *   - Must be in the range [1, 120] inclusive
   *
   * On invalid input (Requirement 4.3):
   *   - Sets #timer-duration-error textContent to an error message
   *   - Returns immediately without changing _configuredDuration
   *
   * On valid input:
   *   - Clears the error element
   *   - Updates _configuredDuration (Requirement 4.4)
   *   - Persists via StorageService (Requirement 4.4)
   *   - If NOT RUNNING: updates _remainingSeconds and calls renderDisplay()
   *     (Requirement 4.6)
   *   - If RUNNING: defers the change to after reset/session end (Requirement 4.7)
   *   - If localStorage is unavailable: shows a session-only notification
   *     (Requirement 4.8)
   *   - Updates #timer-duration-input to reflect the saved value
   *
   * @param {string|number} raw - The raw value from the duration input field.
   * @returns {void}
   */
  saveDuration(raw) {
    const errorEl = document.getElementById('timer-duration-error');
    const inputEl = document.getElementById('timer-duration-input');

    // ── Validation ────────────────────────────────────────────────────────────
    const n = Number(raw);

    if (!Number.isInteger(n) || n < 1 || n > 120) {
      if (errorEl) {
        errorEl.textContent =
          'Please enter a whole number between 1 and 120.';
      }
      return; // retain previous _configuredDuration
    }

    // ── Valid input: clear error ───────────────────────────────────────────────
    if (errorEl) {
      errorEl.textContent = '';
    }

    // ── Persist ───────────────────────────────────────────────────────────────
    // Check availability before saving so we can show the session-only notice
    // (Requirement 4.8) while still keeping the new value in memory.
    if (!StorageService.isAvailable()) {
      NotificationService.show(
        'Storage is unavailable. The new duration will apply for this session only.',
        'error'
      );
    }

    // Update in-memory duration regardless of storage availability.
    this._configuredDuration = n;

    // Attempt to persist (StorageService.save already shows its own error
    // notification on write failure, so we do not double-notify here).
    StorageService.save('tld:pomodoroDuration', n);

    // ── Update display if not currently running ───────────────────────────────
    if (this._timerState !== 'RUNNING') {
      // Requirement 4.6: apply new duration to the display immediately.
      this._remainingSeconds = n * 60;
      if (typeof this.renderDisplay === 'function') {
        this.renderDisplay();
      }
    }
    // If RUNNING, the new duration takes effect after reset or session end
    // (Requirement 4.7) — no action needed here.

    // ── Reflect saved value in the input field ────────────────────────────────
    if (inputEl) {
      inputEl.value = String(n);
    }
  },

  /**
   * Restore the saved Pomodoro duration from StorageService, initialise
   * _remainingSeconds, render the display, and wire up the timer buttons.
   *
   * Requirements: 3.2, 4.5
   * @returns {void}
   */
  init() {
    // Restore persisted duration (default 25 if nothing is saved).
    const saved = StorageService.load('tld:pomodoroDuration');
    if (typeof saved === 'number' && Number.isInteger(saved) && saved >= 1 && saved <= 120) {
      this._configuredDuration = saved;
    } else {
      this._configuredDuration = 25;
    }

    // Set remaining time to the full configured duration.
    this._remainingSeconds = this._configuredDuration * 60;

    // Reflect the restored duration in the input field.
    const durationInput = document.getElementById('timer-duration-input');
    if (durationInput) {
      durationInput.value = String(this._configuredDuration);
    }

    // Draw the initial display.
    this.renderDisplay();
  },

  /**
   * Start the countdown.  Guards against double-start.
   * Transitions state IDLE/PAUSED → RUNNING.
   *
   * Requirements: 3.3
   * @returns {void}
   */
  start() {
    // Guard: do nothing if already running.
    if (this._intervalId !== null) return;

    this._timerState = 'RUNNING';

    // Disable Start, enable Stop.
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = true;
    if (stopBtn)  stopBtn.disabled  = false;

    // Tick every second using an arrow function so `this` stays bound.
    this._intervalId = setInterval(() => this.tick(), 1000);
  },

  /**
   * Pause the countdown.
   * Transitions state RUNNING → PAUSED.
   *
   * Requirements: 3.4
   * @returns {void}
   */
  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._timerState = 'PAUSED';

    // Enable Start, disable Stop.
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = false;
    if (stopBtn)  stopBtn.disabled  = true;
  },

  /**
   * Reset the countdown to the configured duration regardless of current state.
   * Transitions any state → IDLE.
   *
   * Requirements: 3.5
   * @returns {void}
   */
  reset() {
    clearInterval(this._intervalId);
    this._intervalId = null;

    this._remainingSeconds = this._configuredDuration * 60;
    this._timerState = 'IDLE';

    // Re-enable Start, disable Stop.
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = false;
    if (stopBtn)  stopBtn.disabled  = true;

    this.renderDisplay();
  },

  /**
   * Called by setInterval every 1000 ms while the timer is RUNNING.
   * Decrements _remainingSeconds, updates the display, and fires the
   * session-complete notification when the countdown reaches zero.
   *
   * Requirements: 3.3, 3.6
   * @returns {void}
   */
  tick() {
    this._remainingSeconds -= 1;
    this.renderDisplay();

    if (this._remainingSeconds <= 0) {
      // Stop the interval.
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._timerState = 'IDLE';

      // Clamp to zero in case of any drift.
      this._remainingSeconds = 0;
      this.renderDisplay();

      // Re-enable Start button (Requirement 3.6).
      const startBtn = document.getElementById('timer-start');
      const stopBtn  = document.getElementById('timer-stop');
      if (startBtn) startBtn.disabled = false;
      if (stopBtn)  stopBtn.disabled  = true;

      // Show session-complete notification (Requirement 3.6).
      NotificationService.show('Focus session complete! Great work.', 'info');
    }
  },

  /**
   * Update the timer display element to reflect the current _remainingSeconds.
   *
   * Requirements: 3.1
   * @returns {void}
   */
  renderDisplay() {
    const displayEl = document.getElementById('timer-display');
    if (displayEl) {
      displayEl.textContent = formatTime(this._remainingSeconds);
    }
  },
};

/* ─────────────────────────────────────────────────────────────
   TodoWidget
   Full CRUD task list with completion tracking and persistence.

   Task shape:
     { id: string, title: string, completed: boolean, createdAt: number }

   Requirements: 5.1–5.11
   ───────────────────────────────────────────────────────────── */
const TodoWidget = {
  /** @type {Array<{id:string, title:string, completed:boolean, createdAt:number}>} */
  _tasks: [],

  /**
   * Restore tasks from StorageService and render the list.
   * An empty or absent list is treated as a valid empty state.
   * Requirements: 5.10, 5.11
   * @returns {void}
   */
  init() {
    const saved = StorageService.load('tld:tasks');
    if (Array.isArray(saved)) {
      this._tasks = saved;
    } else {
      this._tasks = [];
    }
    this.renderList();
  },

  /**
   * Validate and add a new task.
   *
   * Validation rules (Requirements 5.1, 5.3):
   *   - Trimmed title must be non-empty
   *   - Trimmed title must be ≤ 100 characters
   *   - Trimmed title must not match an existing title (case-insensitive)
   *
   * On failure: show appropriate error in #todo-input-error.
   * On success: create Task, push to _tasks, persist, render.
   * Requirements: 5.1, 5.2, 5.3
   *
   * @param {string} title - Raw title from the input field.
   * @returns {void}
   */
  addTask(title) {
    const errorEl = document.getElementById('todo-input-error');
    const trimmed = (title || '').trim();

    if (trimmed.length === 0) {
      if (errorEl) errorEl.textContent = 'Task title cannot be empty.';
      return;
    }

    if (trimmed.length > 100) {
      if (errorEl) errorEl.textContent = 'Task title must be 100 characters or fewer.';
      return;
    }

    const duplicate = this._tasks.some(
      (t) => t.title.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      if (errorEl) errorEl.textContent = 'A task with that title already exists.';
      return;
    }

    // Clear any previous error.
    if (errorEl) errorEl.textContent = '';

    /** @type {{id:string, title:string, completed:boolean, createdAt:number}} */
    const task = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      title: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    this._tasks.push(task);
    this.persist();
    this.renderList();

    // Clear the input field after a successful add.
    const inputEl = document.getElementById('todo-input');
    if (inputEl) inputEl.value = '';
  },

  /**
   * Toggle the completed status of a task by id.
   * Requirements: 5.4, 5.5
   *
   * @param {string} id - Task id.
   * @returns {void}
   */
  toggleTask(id) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    this.persist();
    this.renderList();
  },

  /**
   * Edit the title of a task by id.
   *
   * Validation rules (Requirement 5.7):
   *   - New title must be non-empty after trim
   *   - New title must be ≤ 100 characters
   *   - New title must not duplicate another existing task's title (case-insensitive)
   *
   * On failure: show inline error on the task item; retain previous title.
   * On success: update title, persist, re-render.
   * Requirements: 5.6, 5.7
   *
   * @param {string} id - Task id.
   * @param {string} newTitle - Raw new title value.
   * @returns {void}
   */
  editTask(id, newTitle) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;

    const trimmed = (newTitle || '').trim();
    const errorEl = document.querySelector(`[data-task-error="${id}"]`);

    if (trimmed.length === 0) {
      if (errorEl) errorEl.textContent = 'Task title cannot be empty.';
      return;
    }

    if (trimmed.length > 100) {
      if (errorEl) errorEl.textContent = 'Task title must be 100 characters or fewer.';
      return;
    }

    const duplicate = this._tasks.some(
      (t) => t.id !== id && t.title.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      if (errorEl) errorEl.textContent = 'A task with that title already exists.';
      return;
    }

    task.title = trimmed;
    this.persist();
    this.renderList();
  },

  /**
   * Remove a task by id.
   * Requirements: 5.8
   *
   * @param {string} id - Task id.
   * @returns {void}
   */
  deleteTask(id) {
    this._tasks = this._tasks.filter((t) => t.id !== id);
    this.persist();
    this.renderList();
  },

  /**
   * Re-render the entire task list into #todo-list.
   *
   * Each task renders as a <li> containing:
   *   - A checkbox (checked when completed)
   *   - A <span> label (strikethrough + 50% opacity when completed)
   *   - An Edit button (shows inline input to rename the task)
   *   - A Delete button
   *   - A role="alert" element for inline edit errors
   *
   * Requirements: 5.4, 5.5, 5.9, 5.10, 5.11
   * @returns {void}
   */
  renderList() {
    const listEl = document.getElementById('todo-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    this._tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.dataset.taskId = task.id;

      // ── Checkbox ──────────────────────────────────────────────────────────
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`);
      checkbox.addEventListener('change', () => this.toggleTask(task.id));

      // ── Label ─────────────────────────────────────────────────────────────
      const label = document.createElement('span');
      label.className = 'todo-item__title';
      label.textContent = task.title;
      if (task.completed) {
        label.style.textDecoration = 'line-through';
        label.style.opacity = '0.5';
      }

      // ── Edit button ───────────────────────────────────────────────────────
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'todo-item__edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Edit task: ${task.title}`);

      // ── Delete button ─────────────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'todo-item__delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${task.title}`);
      deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

      // ── Inline error element ──────────────────────────────────────────────
      const inlineError = document.createElement('div');
      inlineError.setAttribute('role', 'alert');
      inlineError.setAttribute('aria-live', 'assertive');
      inlineError.dataset.taskError = task.id;
      inlineError.className = 'todo-item__error';

      // ── Edit mode wiring ──────────────────────────────────────────────────
      editBtn.addEventListener('click', () => {
        // If already in edit mode, do nothing.
        if (li.classList.contains('todo-item--editing')) return;

        li.classList.add('todo-item--editing');

        // Hide the label and show an inline input instead.
        label.style.display = 'none';
        editBtn.style.display = 'none';

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'todo-item__edit-input';
        editInput.value = task.title;
        editInput.maxLength = 100;
        editInput.setAttribute('aria-label', `Edit title for task: ${task.title}`);

        const saveEditBtn = document.createElement('button');
        saveEditBtn.type = 'button';
        saveEditBtn.className = 'todo-item__save-btn';
        saveEditBtn.textContent = 'Save';

        const cancelEditBtn = document.createElement('button');
        cancelEditBtn.type = 'button';
        cancelEditBtn.className = 'todo-item__cancel-btn';
        cancelEditBtn.textContent = 'Cancel';

        const commitEdit = () => {
          this.editTask(task.id, editInput.value);
          // renderList() is called inside editTask on success, which replaces
          // the DOM. If we're still in the DOM (validation failed), show nothing new.
        };

        const cancelEdit = () => {
          // Clear any inline error and exit edit mode without saving.
          inlineError.textContent = '';
          li.classList.remove('todo-item--editing');
          label.style.display = '';
          editBtn.style.display = '';
          editInput.remove();
          saveEditBtn.remove();
          cancelEditBtn.remove();
        };

        saveEditBtn.addEventListener('click', commitEdit);
        cancelEditBtn.addEventListener('click', cancelEdit);

        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') commitEdit();
          if (e.key === 'Escape') cancelEdit();
        });

        // Insert edit input before the error element.
        li.insertBefore(editInput, inlineError);
        li.insertBefore(saveEditBtn, inlineError);
        li.insertBefore(cancelEditBtn, inlineError);

        editInput.focus();
        editInput.select();
      });

      li.appendChild(checkbox);
      li.appendChild(label);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      li.appendChild(inlineError);

      listEl.appendChild(li);
    });
  },

  /**
   * Persist the current _tasks array to StorageService.
   * Requirements: 5.9
   * @returns {void}
   */
  persist() {
    StorageService.save('tld:tasks', this._tasks);
  },
};

/* ─────────────────────────────────────────────────────────────
   LinksWidget
   Bookmark panel for quick-access hyperlinks.

   Link shape:
     { id: string, label: string, url: string, createdAt: number }

   Requirements: 6.1–6.9
   ───────────────────────────────────────────────────────────── */
const LinksWidget = {
  /** @type {Array<{id:string, label:string, url:string, createdAt:number}>} */
  _links: [],

  /**
   * Normalise a URL by prepending "https://" when the URL does not already
   * begin with "http://" or "https://".  This is a pure function with no
   * side-effects.
   *
   * Requirements: 6.4
   *
   * @param {string} url - Raw URL string.
   * @returns {string} A URL that always begins with "http://" or "https://".
   */
  normaliseUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return 'https://' + url;
  },

  /**
   * Validate and add a new link.
   *
   * Validation rules (Requirements 6.1, 6.2, 6.3, 6.4, 6.6):
   *   - Label: non-empty after trim; ≤ 100 characters
   *   - URL:   non-empty after trim; ≤ 2048 characters after normalisation
   *   - Normalised URL must not be a case-insensitive duplicate of an
   *     existing link URL
   *
   * On failure: show a descriptive error in #links-error; preserve the
   *             other field's value (only the invalid field is considered
   *             invalid — the DOM is not mutated here; the caller retains
   *             field values).
   * On success: clear the error, create Link object, push to _links,
   *             persist, and re-render.
   *
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
   *
   * @param {string} label - Raw label from the label input field.
   * @param {string} url   - Raw URL from the URL input field.
   * @returns {void}
   */
  addLink(label, url) {
    const errorEl = document.getElementById('links-error');

    const trimmedLabel = (label || '').trim();
    const trimmedUrl   = (url   || '').trim();

    // ── Label validation ──────────────────────────────────────────────────
    if (trimmedLabel.length === 0) {
      if (errorEl) errorEl.textContent = 'Link label cannot be empty.';
      return;
    }

    if (trimmedLabel.length > 100) {
      if (errorEl) errorEl.textContent = 'Link label must be 100 characters or fewer.';
      return;
    }

    // ── URL presence check (before normalisation) ─────────────────────────
    if (trimmedUrl.length === 0) {
      if (errorEl) errorEl.textContent = 'Link URL cannot be empty.';
      return;
    }

    // ── Normalise and length-check ────────────────────────────────────────
    const normalisedUrl = this.normaliseUrl(trimmedUrl);

    if (normalisedUrl.length > 2048) {
      if (errorEl) errorEl.textContent = 'Link URL must be 2048 characters or fewer.';
      return;
    }

    // ── Duplicate URL check (case-insensitive, post-normalisation) ─────────
    const isDuplicate = this._links.some(
      (link) => link.url.toLowerCase() === normalisedUrl.toLowerCase()
    );
    if (isDuplicate) {
      if (errorEl) errorEl.textContent = 'A link with that URL already exists.';
      return;
    }

    // ── All validation passed: clear error ────────────────────────────────
    if (errorEl) errorEl.textContent = '';

    /** @type {{id:string, label:string, url:string, createdAt:number}} */
    const link = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      label: trimmedLabel,
      url:   normalisedUrl,
      createdAt: Date.now(),
    };

    this._links.push(link);
    this.persist();
    this.renderList();

    // Clear both input fields after a successful add.
    const labelInput = document.getElementById('links-label-input');
    const urlInput   = document.getElementById('links-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';
  },

  /**
   * Remove a link by id; persist the updated list and re-render.
   * Requirements: 6.7
   *
   * @param {string} id - Link id.
   * @returns {void}
   */
  deleteLink(id) {
    this._links = this._links.filter((link) => link.id !== id);
    this.persist();
    this.renderList();
  },

  /**
   * Re-render the entire link list into #links-list.
   *
   * Each link renders as a <li> containing:
   *   - An <a> element opening the URL in a new tab
   *   - A Delete button
   *
   * Requirements: 6.5, 6.9
   * @returns {void}
   */
  renderList() {
    const listEl = document.getElementById('links-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    this._links.forEach((link) => {
      const li = document.createElement('li');
      li.className = 'links-item';
      li.dataset.linkId = link.id;

      // ── Anchor ────────────────────────────────────────────────────────────
      const anchor = document.createElement('a');
      anchor.href   = link.url;
      anchor.target = '_blank';
      anchor.rel    = 'noopener noreferrer';
      anchor.className = 'links-item__anchor';
      anchor.textContent = link.label;

      // ── Delete button ─────────────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'links-item__delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
      deleteBtn.addEventListener('click', () => this.deleteLink(link.id));

      li.appendChild(anchor);
      li.appendChild(deleteBtn);

      listEl.appendChild(li);
    });
  },

  /**
   * Persist the current _links array to StorageService.
   * Requirements: 6.8
   * @returns {void}
   */
  persist() {
    StorageService.save('tld:links', this._links);
  },

  /**
   * Restore links from StorageService and render the list.
   * Requirements: 6.9
   * @returns {void}
   */
  init() {
    const saved = StorageService.load('tld:links');
    if (Array.isArray(saved)) {
      this._links = saved;
    } else {
      this._links = [];
    }
    this.renderList();
  },
};

/* ─────────────────────────────────────────────────────────────
   Bootstrap
   Initialise all widgets once the DOM is ready.
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Check localStorage availability at startup; warn the user if unavailable
  // so all widgets know persistence is disabled for this session (Requirement 8.6).
  if (!StorageService.isAvailable()) {
    NotificationService.show(
      'Storage is unavailable in this browser. Your data will not be saved between sessions.',
      'error'
    );
  }

  // Theme must be applied first to avoid a flash of the wrong colour scheme.
  ThemeManager.init();

  // Greeting widget: restore name, start clock.
  GreetingWidget.init();

  // Wire Save button → saveName (Requirement 2.1, 2.4, 2.6, 2.7).
  const saveBtn = document.getElementById('greeting-name-save');
  const nameInput = document.getElementById('greeting-name-input');

  if (saveBtn && nameInput) {
    // Populate the input with any already-restored name on load.
    if (GreetingWidget._userName) {
      nameInput.value = GreetingWidget._userName;
    }

    saveBtn.addEventListener('click', () => {
      GreetingWidget.saveName(nameInput.value);
    });

    // Also allow saving by pressing Enter while the input is focused.
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        GreetingWidget.saveName(nameInput.value);
      }
    });
  }

  // Theme toggle button.
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => ThemeManager.toggle());
  }

  // ── Timer Widget ────────────────────────────────────────────────────────────
  // Restore duration and render initial display.
  TimerWidget.init();

  // Wire Start / Stop / Reset buttons.
  const timerStart = document.getElementById('timer-start');
  const timerStop  = document.getElementById('timer-stop');
  const timerReset = document.getElementById('timer-reset');

  if (timerStart) timerStart.addEventListener('click', () => TimerWidget.start());
  if (timerStop)  timerStop.addEventListener('click',  () => TimerWidget.stop());
  if (timerReset) timerReset.addEventListener('click', () => TimerWidget.reset());

  // Set initial button states: Start enabled, Stop disabled.
  if (timerStart) timerStart.disabled = false;
  if (timerStop)  timerStop.disabled  = true;

  // Wire the duration Save (Set) button.
  const timerDurationSave  = document.getElementById('timer-duration-save');
  const timerDurationInput = document.getElementById('timer-duration-input');

  if (timerDurationSave && timerDurationInput) {
    timerDurationSave.addEventListener('click', () => {
      TimerWidget.saveDuration(timerDurationInput.value);
    });

    timerDurationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        TimerWidget.saveDuration(timerDurationInput.value);
      }
    });
  }

  // ── Todo Widget ─────────────────────────────────────────────────────────────
  // Restore saved tasks and render.
  TodoWidget.init();

  // Wire the Add button and Enter key on the task input.
  const todoAddBtn  = document.getElementById('todo-add');
  const todoInput   = document.getElementById('todo-input');

  if (todoAddBtn && todoInput) {
    todoAddBtn.addEventListener('click', () => {
      TodoWidget.addTask(todoInput.value);
    });

    todoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        TodoWidget.addTask(todoInput.value);
      }
    });

    // Clear the inline add-error as soon as the user starts typing again.
    todoInput.addEventListener('input', () => {
      const errorEl = document.getElementById('todo-input-error');
      if (errorEl) errorEl.textContent = '';
    });
  }

  // ── Links Widget ─────────────────────────────────────────────────────────
  // Restore saved links and render.
  LinksWidget.init();

  // Wire the Add Link button and Enter key on the URL input.
  const linksAddBtn   = document.getElementById('links-add');
  const linksLabelInput = document.getElementById('links-label-input');
  const linksUrlInput   = document.getElementById('links-url-input');

  if (linksAddBtn && linksLabelInput && linksUrlInput) {
    linksAddBtn.addEventListener('click', () => {
      LinksWidget.addLink(linksLabelInput.value, linksUrlInput.value);
    });

    // Allow submitting by pressing Enter while the URL input is focused.
    linksUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        LinksWidget.addLink(linksLabelInput.value, linksUrlInput.value);
      }
    });

    // Clear the inline error as soon as either input changes.
    const clearLinksError = () => {
      const errorEl = document.getElementById('links-error');
      if (errorEl) errorEl.textContent = '';
    };
    linksLabelInput.addEventListener('input', clearLinksError);
    linksUrlInput.addEventListener('input', clearLinksError);
  }
});
