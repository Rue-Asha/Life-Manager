# Life-Manager: Functional Contract

This document is the only input a designer gets for the Life-Manager UI/UX redesign. It states what the app does: data, actions, rules, states, copy and the few state hooks tests depend on. It deliberately says nothing about layout, components, colour, spacing, hierarchy or iconography; none of that is a requirement. All UI copy is English.

Sources: README, `openspec/specs/*`, the e2e suite, server code (`+page.server.ts`, `src/lib/server/*`) and `.svelte` files read for behavior only. Rue's answers to the earlier open questions are recorded in section 11 (Gate-1 decisions); where one needs a code change before the redesign, the text says "Pending server change".

## 1. Purpose and usage context

Life-Manager is a self-hosted weekly-sprint todo app for the aspects of one person's life (health, uni, job, home, ...): one backlog, one Monday-Sunday sprint with a planning and a review ritual, and a Today view. It is single-user with no login, meant to run on a LAN or VPN, and optionally pushes planned items one-way to Proton Calendar.

Usage context:
- One user (the owner), no accounts, no sharing. Data lives in one SQLite file on the server.
- Used from a phone (quick capture, checking Today, ticking things off) and from a wide desktop screen (planning, reviewing, organizing). Touch and keyboard are both first-class.
- Frequency: many short visits per day (Today, quick add, tick off), a weekly ritual (plan the week at the start, review it at the end), and occasional upkeep (aspects, recurring rules, semesters, projects).
- Weekly rhythm: a sprint is one Monday-Sunday week. Planning happens on or before Monday; review becomes available when the week ends and is required before the next sprint can start.
- All "today" logic uses the Europe/Berlin calendar date.

**Design principle: the phone gets its own UI.** The phone experience is designed for the phone, not a squeezed copy of the desktop one. Display-only data that today shows only on wide screens (for example per-aspect progress and backlog count on `/aspects`, the `Todos` summary on project and class detail, the empty-grade wording) is not required on phones; the phone UI may omit such secondary data. Actions and decisions stay reachable on every screen size (section 6, secondary context). Wide screens are not a stretched phone either.

## 2. Jobs to be done

- J1. Capture a todo in seconds, assigned to an aspect, without deciding when to do it.
- J2. See what matters today: planned items, due items, overdue items, and sprint progress.
- J3. Plan the coming week: choose backlog items for the sprint, give them days and optional time slots, and start the sprint.
- J4. Work the running week: view the sprint by week, board, or aspect; change status; reschedule; move items back to the backlog.
- J5. Review the finished week: decide per open item whether to carry it over, return it to the backlog, or drop it, then close the sprint.
- J6. Keep a backlog of everything not yet scheduled and find items by aspect.
- J7. Organize life into aspects (name, colour, icon), including deleting an aspect safely by moving its todos.
- J8. Define recurring weekly rules (for example gym, lectures) that generate todos each sprint.
- J9. Manage university: semesters, classes, lecturer/room/ECTS, links, exam date, grade, class todos by type, revision tracking, grade summary, archiving.
- J10. Track IT projects: status, description, repo, tags, Markdown notes, and the todos linked to them.
- J11. See time on a month calendar: planned todos, projected recurring items, exams, and what is due on each day.
- J12. Mirror planned items to Proton Calendar and see sync health, retry or resync.
- J13. Get started: first run asks for aspects before anything else works.
- J14. Run and operate the app (health check, env configuration, persistence across restarts).

Per-route job mapping is in section 5 ("Serves jobs").

## 3. Entities

Merged from the route notes below. Dates are `YYYY-MM-DD`, times `HH:MM`, all Europe/Berlin.

### 3.1 Todo, Sprint, Aspect, Backlog, Review decisions
**Todo** (`todos`): `id`, `title` (trimmed, required), `aspectId` (required), `notes` (text, default empty), `priority` 0-3 (0 = none; order 1,2,3,none), `dueDate` (IsoDate|null), `sprintId` (null = backlog; else sprint of any state), `status` `todo|doing|done` (default `todo`), `day` (IsoDate|null planned day), `startTime`/`endTime` (`HH:MM`|null; only with a day; end > start, end needs start), `recurring` (bool), `ruleId` (recurring rule), `projectId` (IT aspect only), `classId` + `type` `LEC|EXC|OTH` (Uni aspect only; type defaults `OTH` once a class is set), `revisedAt` (IsoDate|null, Uni), `checklist[]` (`id`, `todoId`, `text` required, `done`, `position`), `createdAt`, `completedAt` (set on done, cleared on leaving done). Derived `dueDay` = due date inside sprint week when `day` is null (used by Today/Week placement; not stored).
- Lists: backlog = `sprintId` null and not done (a done todo with no sprint is not listed anywhere); overdue = due < today and not done, any sprint; due-today-backlog = no sprint, not done, due or planned today.
- Transitions: backlog -> draft (pull; clears day/slot); draft -> backlog (unpull; status `To do`); backlog -> active (add to sprint / planned day inside week / start auto-join); active -> backlog (move back: clears day/slot, status `To do`, completion cleared; recurring: deleted); active -> carried (review: draft, day/slot cleared, status kept); active done -> stays on closed sprint; recurring open -> dropped = deleted.
- Archived-semester class todos are read-only (all by-id edits 409 `archived`, never auto-pulled).

**Sprint** (`sprints`): `id`, `weekStart` (Monday, null while planning), `state` `planning|active|closed`, `startedAt`, `closedAt`. At most one `active` and one `planning` draft. Phase derived from state + today (table in 4.1). Aspect progress = done/total todos per aspect of a sprint.

**Aspect** (as used here): `id`, `name` (trimmed, unique case-insensitive), `color`, `icon`, `position` (append order). Presets: Health, Uni, Job, Home, Finance, Social. Zero aspects forces onboarding.

**Backlog:** not a table; the set of open todos without a sprint, with a "Planned" subset (`day` set).

**Review decisions:** `carry|backlog|drop` per open todo; recurring allows carry/drop only.

### 3.2 Aspects, recurring rules, IT projects, Uni
**Aspects**
- Fields: id, name (unique, case-insensitive, non-ASCII too), colour (8 fixed), icon (25 fixed), position (the user-defined order), created_at. New aspects take the next position. Aspects are manually reorderable; every list of aspects follows this order (Pending server change: a reorder action; the position column already exists).
- First-run presets (onboarding on `/welcome`): Health (sage, heart), Uni, Job, Home, Finance, Social, plus custom; todos need >=1 aspect (`no-aspect`). A preset whose name already exists as an aspect is marked as existing and cannot be selected (Pending server change: `/welcome` reports which presets exist).
- Relations: todos, recurring rules, settings `it_aspect_id` / `uni_aspect_id`.
- Delete: needs target aspect when in use; moves todos + rules; clears project link, class link, type, revised date; unsets IT/Uni settings if they pointed to it; blocked for only aspect in use; deleting the last (empty) aspect -> onboarding.

**Recurring rules**
- Fields: title, aspect, weekdays (1-7, Mon-Sun, dedup/sorted), notes, priority (0-3), checklist template (text list), class + type (Uni-aspect rules only; type defaults OTH when class set), start/end time (HH:MM, end > start, end needs start).
- Lifecycle: instances created at sprint start per weekday (with copy of checklist, slot, class/type, `recurring` flag), also on rule creation mid-sprint (days >= today); carried instances occupy weekday slots first; edit affects only future generation; delete keeps instances; instance cannot be moved to backlog. Archived-semester class rules generate nothing.
- Class-linked rules: class and type cleared when aspect leaves Uni aspect or Uni aspect changes; class deleted -> rule deleted (cascade).

**IT projects**
- Fields: name (required), description, repo URL (http/https), tags (list), notes (Markdown, HTML escaped), status, created_at, updated_at.
- Status: `backlog` (default), `active`, `in_progress`, `paused`, `implemented`; any-to-any; `updated_at` bumps on edit, notes save, status change. Navigation count for Projects = active + in_progress.
- Linked todos: only todos of the IT aspect can link (Project field on todo); groups Open / Planned / Done. Linking exists only for the chosen IT aspect; changing the IT aspect removes all links (confirm with count). Delete project unlinks todos (they stay). Marking implemented never touches todos.

**Uni**
- Semester: name (dup allowed), created_at, archived_at; active ordered newest first; archive (completes open class todos, read-only), unarchive, delete (cascade classes, todos, checklist items, rules).
- Class: semester, name, colour, icon, notes (Markdown), lecturer, room, ECTS (>=0, step 0.5), links (label+URL, http/https), exam date/time (optional time), exam room, grade (1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0, passed). Delete cascades todos + rules. Open-todo count/next due/exam countdown computed.
- Class todo: Uni-aspect todo with class_id, type (LEC/EXC/OTH), revised_at (class todos only). Archived class todos: all writes refused (`archived`) except delete; delete stays allowed (decision 3).
- Revised control: set to today / clear; label via days ago.
- Grade rules: weighted avg of graded + ECTS classes (excluding `passed`, `5.0`, no-ECTS); earned ECTS includes `passed`, excludes `5.0`; overall includes archived; `—` when none.
- Aspect prompts: `/projects` prompt (IT aspect) and `/uni` prompt (Uni aspect) appear when the setting is unset or points to a deleted aspect; preselect an aspect named IT / Uni (case-insensitive); changing later drops links after a confirm that names the count.
- Global Uni notes: single Markdown document held in settings.

### 3.3 Calendar items and Proton sync items
**Calendar item** (derived, not stored; built per month by `calendarMonth`)
- `todo` (source: todos with explicit `day` in the shown month, any status/sprint/backlog; fields title, aspect, slot start/end, done). Opens editor. Done entries stay listed and must be distinguishable as done.
- `projection` (source: recurring rules; one per matching weekday). Projected only for days after the active sprint's week (or from today with no active sprint); never before; not for rules of archived-semester classes; suppressed on a day that already has a real instance of that rule. Instances inside the active sprint week are real todos, not projections. Links to `/recurring#rule-<id>`. Carries title, aspect, slot.
- `exam` (source: classes with `exam_at`, active and archived semesters; date-only = all-day; with time = start time only, no end). Shows class name, room, class colour; links to `/uni/classes/<id>`.
- Due todo (separate list, not an entry): open (`status != done`) todo with `due_date` on that day, in backlog or sprint, any past/future day, sorted by title (case-insensitive).
- Not shown: sprint todos without explicit day; done todos in the Due list.

**Proton sync item** (`proton_items`, key -> state)
- Key: `todo:<id>` | `rule:<id>` | `exam:<classId>` | `due:<aspectId>:<date>`.
- Stored: event ref `<calendarId>/<eventId>` (empty if create failed), calendar ID, content hash of last pushed event, label, last item error.
- Event content (hash fields in order): title, description, location, date, start, end, duration (min), recurrence rule, excluded days. Hash excludes aspect and calendar.
- `proton_calendars`: aspect -> Proton calendar ID.
- Mapping: todo -> event (`✓ ` prefix when done; description = notes; location = class room); rule -> weekly series; exam -> `Exam · <name>` (2 h or all-day); due bundle -> all-day `Due: ...` event.
- Lifecycle: absent -> create (stored with ref) -> update on content change -> delete+create on aspect change -> delete and row removal when no longer desired. Failed (row without ref or with error) -> retried on content/aspect change, "Sync now", "Resync all". "Resync all" clears all hashes. Past-dated items (before today) are never created, but still updated/deleted if previously synced; past due bundles are frozen.
- Sync worker states: `off` -> `idle` <-> `syncing`; `relogin` (exit 2, retry 30 min) and `error` (exit 5 backoff 1..30 min, or spawn/other error). Last success time persists in `settings.proton_last_sync_at`.

## 4. Rituals

All dates are calendar days in Europe/Berlin, computed server-side (`today()`); a test clock can override it. A sprint is one ISO week, Monday to Sunday. At most one sprint is `active`.

### 4.1 Weekly sprint lifecycle

**Sprint states (stored):** `planning` (draft, no week yet), `active` (has `weekStart`), `closed`.
**Phase (derived per request, drives every screen):**

| Phase | Condition |
|---|---|
| `none` | no active sprint and no planning draft |
| `planning` | no active sprint, a planning draft exists (carried/pulled todos live in it) |
| `running` | active sprint and today < its Sunday |
| `review-available` | active sprint and today = its Sunday |
| `review-required` | active sprint and today > its Sunday (Monday after or later) |

- **Planning target week:** Monday to Saturday = the week containing today; on Sunday = the following Monday's week. (So planning on Sunday targets next week; planning on e.g. Wednesday with no sprint targets the current week, Mon-Sun, including days already past.)
- **Start:** `Start sprint` on `/sprint/plan` (action `?/start`). Fails with `review-pending` if the active sprint's review is required/available, `sprint-active` if it is still running. In one transaction it: (1) pulls the marked "Due this week" suggestions; (2) pulls every open, writable backlog todo planned (`day`) inside the target week ("Joins automatically"), keeping its day and slot; (3) pulls every open, writable backlog todo planned for a day *before* the target week ("missed"), clearing its day and slot; (4) sets the sprint `active` with the target week; (5) generates recurring-rule instances for the week (weekdays; an instance carried over from the last review takes the rule's day and slot first, so the rule is not doubled). Done todos, todos planned for a later week, and todos of archived-semester classes are never pulled. Starting with zero todos is allowed.
- **Running:** todos have status `To do` / `Doing` / `Done`; a todo can have a day inside the week (or none = "Unscheduled"). Todos can be added from the backlog (with optional day/status) or sent back to the backlog; planning a backlog todo for a day of the week pulls it into the sprint; planning a sprint todo for a day outside the week sends it to the backlog (status reset to `To do`, its planned day kept).
- **Review availability:** from the sprint's Sunday the review is offered (prompt `This sprint ends today.`) but sprint views still work. From the Monday after, the review is required: no todo can join the sprint, no planned day inside that week can be set, planning/start fail with `review-pending`, and Today/Backlog/Sprint show prompts linking to `/sprint/review`.
- **End:** closing the review (`?/close` on `/sprint/review`) sets the sprint `closed`. Done todos keep the closed sprint's id (stay as history, never reappear in backlog or the new plan). Open todos are carried / returned / dropped (see review flow). A planning draft is always created, so the next phase is `planning` immediately (Sunday: Today shows the "next sprint is being planned" prompt, not the review prompt).
- **Weeks away:** only the last sprint is reviewed; no sprints are created for skipped weeks; target week is that of today.
- **Carry-over:** carried todos land in the planning draft with their status kept, day/slot cleared; they become part of the next sprint when it is started. Recurring instances can only be carried or dropped (never go to backlog).
- **Recurring instances** have no backlog: "removing" one from a sprint deletes it (rule and other instances remain); it cannot be dragged back to the backlog; its planned day must stay inside its own sprint's week (`recurring-outside-week`).

### 4.2 Planning flow (`/sprint/plan`)

1. Entry: only reachable when phase is `none` or `planning` (running -> redirect `/sprint`; review-available/required -> redirect `/sprint/review`). First run (no sprint ever) can plan immediately.
2. Page title `Plan your week` with the target-week label (e.g. `Mon 5 – Sun 11 Oct`). Opening the page does not create the draft; the first pull does.
3. The sprint draft, titled `This sprint` (count = draft todos + marked suggestions), lists in order: `Due this week` (backlog todos due in the target week, not done, not planned for a later week; each pre-marked with an include checkbox `Include: <title>`; counter `<marked> of <total>`; unmark = stays in backlog), `Joins automatically` (backlog todos planned for a day of the target week, sorted by day, all-day before timed, then title; no pull/unpull control, not draggable), then the draft's todos grouped by aspect (carried-over ones appear here). Empty hint: `Drag todos here from the backlog.` (hover + fine pointer device) or `Add todos from the backlog below.` (touch). Copy that names a position (`below`, `above`) may be reworded to fit the new layout.
4. The backlog list, titled `Backlog` (count), holds open backlog todos not already suggested/auto, grouped by aspect, with title filter. Per todo `Add to sprint: <title>` (`?/pull`) or, on pointer devices, drag onto the draft. A pulled todo loses its planned day and slot.
5. Draft todos have `Remove from sprint: <title>` (`?/unpull`: back to backlog, status `To do`, day/slot cleared) or, on pointer devices, can be dragged back to the backlog list (not recurring).
6. Start: hint `Recurring todos join on their days when the sprint starts.` and the page's primary action `Start sprint` (0 todos) or `Start sprint with N todo`/`N todos` (N = draft + marked suggestions; auto-join and recurring not counted).
7. Errors (`role="alert"`, tied to the start action): `review-pending` -> `The last sprint needs a review first.`; `sprint-active` -> `A sprint is already running.`; anything else -> `That didn’t work. Reload and try again.`
8. Success: 303 redirect to `/sprint`.

### 4.3 Review flow (`/sprint/review`)

1. Entry: running -> redirect `/sprint`; none/planning -> redirect `/sprint/plan`. Available on the sprint's Sunday, required from Monday after.
2. Title `Review your sprint` + the sprint's week label.
3. Summary line: no open todos -> `All N done. Nice week.` (N>0) or `Nothing was planned this week.` (0 todos); otherwise `Open todos carry over into next week unless you send them back.`
4. `Done` collapsible section with count (done todos, read-only: no decision, no done toggle) when any are done.
5. Open todos grouped by aspect; each gets a choice: `Carry over` (default), plus `Back to backlog` (normal todos) or `Drop` (recurring instances only). Nothing is changed until closing.
6. Close action label is generated from the choices: `Close sprint` (nothing open) else e.g. `Carry 2, return 1 and close`, `Carry 1, drop 1 and close` (verbs `Carry`/`return`/`drop`, zero-count parts omitted, first letter capitalised). All-done review = one tap.
7. `?/close` (atomic): `carry` -> into the planning draft, day/slot cleared, status kept; `backlog` -> backlog, status `To do`, day/slot cleared; `drop` -> instance deleted. Errors: invalid/missing decision -> per-todo `This todo can’t go there.` (backlog for a recurring instance, drop for a non-recurring todo, unknown value); `sprint-active` (closing before Sunday) or `no-active-sprint` -> `That didn’t work. Reload and try again.`
8. Success: 303 redirect to `/sprint/plan` (target week = next week on Sunday, else current week).

### 4.4 Onboarding (`/welcome`)

1. Trigger: any route (except `/welcome` itself) redirects 303 to `/welcome` while zero aspects exist. `/welcome` stays reachable afterwards (no redirect away) and can add more aspects.
2. Heading `Set up your aspects`; text `Aspects are the parts of your life you plan for. Pick a few to start; you can change them any time.`
3. Six presets, each toggleable, none preselected. A preset that already exists as an aspect (name match, case-insensitive) is shown as disabled and marked as existing, so it cannot be ticked or counted (decision 2): Health (sage, heart), Uni (lavender, cap), Job (sky, briefcase), Home (ochre, house), Finance (lagoon, wallet), Social (berry, people).
4. `Add your own` reveals one custom-aspect form (name `Aspect name`, autofocused, colour + icon picker, defaults tangerine/star); `Remove` hides it again.
5. Submit button `Continue with N aspect`/`aspects` (N = ticked presets + 1 if custom form open); disabled while N = 0.
6. `?/create` is all-or-nothing (transaction): nothing selected -> `Pick at least one aspect.`; empty custom name -> `Give the aspect a name.`; custom name already used (case-insensitive) -> `You already have an aspect with this name.` (shown only beside the custom name field). A preset that exists can no longer cause this error: it is disabled, and if one is submitted anyway the server skips it instead of failing. Invalid colour/icon -> `required` on that field (no copy shown).
7. Success: 303 redirect to `/backlog`. New aspects get the next position.

---

### 4.5 Sync ritual (`/sync`)

One-way push of planned work to Proton Calendar. The app never reads Proton back; edits made in Proton are not imported (use "Resync all" to restore the app's state). Runs inside the app process, with no user action needed once configured.

1. **Off state.** Sync is configured only by env: `PROTON_CLI` (path to the `proton` binary) and `PROTON_PROFILE` (default `default`). `PROTON_CLI` unset or empty = state `Off`: no worker, no timers, no CLI call, `/sync` explains how to enable it and shows no buttons, `pending` is 0. Changing the setting needs an app restart. The app never logs in itself; it uses the CLI's existing session (`$XDG_CONFIG_HOME/proton-cli/sessions/<profile>.json`).
2. **What is pushed (desired state)**, rebuilt from the database on every pass:
   - Every todo with an explicit planned `day` (backlog, active sprint, closed sprint, planning draft alike) becomes one event `todo:<id>` in its aspect's Proton calendar. Slot start+end = timed event; start only = 30-minute event; no slot = all-day. Times are Europe/Berlin wall times. Title = todo title (done todos: `✓ <title>`; reopening removes the `✓ `), description = notes, location = class room for class-linked todos.
   - Every recurring rule (not belonging to an archived-semester class) becomes one weekly series `rule:<id>` (`FREQ=WEEKLY;BYDAY=<weekdays>`) starting on the first of its weekdays on/after the in-app projection start (active sprint week start + 7 days, or today with no active sprint). Days that already have a real instance of the rule are excluded from the series so nothing appears twice. Real instances are ordinary todos and get their own events.
   - Every class with `exam_at` becomes `exam:<classId>`, titled `Exam · <class name>`, in the calendar of the Uni aspect (no Uni aspect = no exam is synced); date-only = all-day, with time = 2 hours; location = exam room. Archived-semester exams are included.
   - Open todos with a `due_date` (today or later) become one bundled all-day event per aspect and date, `due:<aspectId>:<date>`: title `Due: <t1> · <t2>` (sorted by title, case-insensitive), with more than 3 todos `Due (<n>): <t1> · <t2> · <t3> …`; description lists every title one per line. A todo that also has a planned day keeps its own `todo:` event too. A due date alone never creates a `todo:` event.
   - Items dated before today are never created; ones already synced are still updated or deleted, except due bundles dated before today, which are frozen as last synced (no update, no delete).
3. **One calendar per aspect**, created on the first item that needs it, named after the aspect, colour from a fixed palette-to-Proton-accent table. Its ID is stored and reused. Renaming or recolouring an aspect does NOT change its Proton calendar (stated on `/sync`). If a stored calendar was deleted in Proton, it is recreated and the create retried once. A deleted aspect's Proton calendar is left alone; its reassigned items move to the target aspect's calendar.
4. **Diff, not dump.** A pass compares the desired state with the stored per-item content hash and calendar ID and calls `proton` only for differences: create (new), update in place (content changed: title, notes, day, slot, done, location, recurrence, excluded days), delete+create (aspect changed), delete (no longer desired: todo unplanned/moved to backlog/carried over without a day/deleted, rule deleted, exam cleared, class deleted, bundle emptied). An update that reports "event not found" (deleted by hand in Proton) recreates the event; a delete that reports "already gone" counts as success. Each successful call is stored before the next, so an interrupted pass resumes. An unchanged item causes no call. After any series create/update the exclusions are re-applied (the CLI drops them on update). Deleting a rule deletes its series; its instances keep their events.
5. **When a pass runs.**
   - About 30 s after the last non-GET request (debounced: each further form post restarts the 30 s wait; this is the "nudge"). Test-hook requests (`/__test/*`) do not nudge. Nudges are ignored while sync is off or paused (step 7).
   - Every 5 minutes (a tick, skipped while paused).
   - Once about 30 s after app start (catch-up for changes made while the app was down, and first-run backfill).
   - Immediately on "Sync now" and on "Resync all" (both clear any pause).
   - Passes never overlap; a request during a running pass queues exactly one more pass behind it. Mutating calls are made one at a time with at least 1 s between them (also across back-to-back passes); a single call over 120 s is killed and counts as a network failure (`Error: proton timed out after 120 s`).
6. **Statuses** (shown on `/sync`, also drives the nav warning marker): `Off`, `Up to date` (idle), `Syncing…`, `Re-login needed`, `Error`. Last successful sync time = end of the last pass that finished normally; persisted (survives restart), shown `Never` before the first one. Pending count = number of calls the next pass would make (the first-run backfill shows its size here).
7. **Failure handling.**
   - Session expired / not logged in (CLI exit 2): the pass stops, state `Re-login needed`, sync paused. `/sync` shows the exact command to run on the server: `proton account login --profile <profile>`, then "Sync now". Without that, it retries by itself after 30 minutes.
   - Network/transient (exit 5, incl. timeout): the pass stops, state `Error` with the message, paused with backoff 1, 2, 4 … minutes capped at 30; then retries by itself. "Sync now" retries at once.
   - Binary missing or not executable: state `Error` with the message; app keeps running; the next tick or "Sync now" tries again.
   - Any other per-item failure (CLI exit 1 etc.): only that item is marked failed with the CLI's `Error: …` line and the pass continues with the rest; the pass still ends `Up to date`. Failed items are listed on `/sync` (label + error). A failed item is retried only when its content or target aspect changes, on "Sync now", or on "Resync all"; the failure clears once its content matches Proton again.
   - Other unexpected errors end the pass in `Error` with the message; queued requests still run.
   - Nav marker: while the state is `Re-login needed` or `Error`, every navigation entry to `/sync` (primary navigation and the `/menu` hub) carries an attention indicator with accessible name `Needs attention`.
8. **Resync all** forgets every stored hash and re-pushes every item, recreating events that were removed in Proton, then runs a pass.
9. **App-side effects of user actions** on sync: planning, editing, ticking done, unplanning, deleting a todo; editing/deleting a rule; starting a sprint (moves series, creates instance events); setting/clearing an exam; archiving a semester (completed todos get `✓ `); deleting a class or aspect; changing the Uni aspect (moves exam events). All reach Proton on the next pass, not synchronously; the UI gives no per-action sync feedback.

## 5. Routes

User-facing routes under `src/routes` (excluding `/__test*` and `/__mockups*`). Every route is a full page; navigation among them is described in section 6.

### `/` (Today)

**Data shown**
- Page title `Today`; long date (en-GB, e.g. `Thursday 12 November`).
- Summary figure = count of distinct open (not done) todos among: today's list, overdue list, due-today backlog; label `open today`. In `running`/`review-available` also context `<Weekday> · this sprint`, line `Sprint <done> / <total> done · <N> day(s) left` (days left = sprint days after today) and a per-aspect progress breakdown.
- Sprint progress (only in `running`/`review-available`), titled `This sprint`: `<done> / <total>`; per aspect with sprint todos: name (link to `/aspects/<id>`) + done/total; empty: `Nothing in this sprint yet.`
- Sprint prompt whenever phase is not `running` (each phase has its own distinct link name): `none` -> `No sprint is running.` `Plan your week` (-> `/sprint/plan`); `planning` -> `Your next sprint is being planned.` `Continue planning`; `review-available` -> `This sprint ends today.` `Review it`; `review-required` -> `Last week’s sprint needs a review before the next one can start.` `Review the sprint`.
- `Overdue` group (count): every open todo with `dueDate` < today in any state (sprint, backlog, draft), plus sprint todos that were overdue and ticked done today (stay listed in their done state until the day ends); sorted by due date then id; each row names its aspect.
- Aspect groups (name + count; empty aspects hidden), containing: (a) active-sprint todos with `day` = today, or with no day and `dueDate` = today; (b) backlog todos due today or planned for today, only when today is NOT one of the active sprint's days (e.g. Sunday between sprints, review required, no sprint). Sorted by priority (1,2,3, none last), then due date, then id. Todos already in Overdue are not repeated.
- Todo item data: title, aspect (in mixed lists), planned label (`Fri 9 Oct · 18:00–19:30`; on Today for today's day only the slot), linked class name (Uni), `Recurring` flag, checklist progress `x/y`, has-notes indicator (`Notes`), linked project name as a link (`/projects/<id>`), due label (`Today`, `Tomorrow`, `Nd left`, `Nd late`; open past-due todos are flagged overdue, with accessible text `Overdue,`), priority 1-3.
- Empty state: when in `running`/`review-available`, no aspect groups and no overdue: `Nothing planned for today. The week view has the rest of your sprint.` (link -> `/sprint?view=week`).

**Actions**
- Quick add `Add a todo` (form `/todos?/create`, always shown in every phase). Target: if today is a day of the sprint -> creates in the active sprint on today (status `To do`; Planned prefilled with today, can be changed to another sprint day or removed = in sprint, no day, not shown on Today); otherwise creates a backlog todo with due date = today. Fields: see "Todo create/edit fields" below. Success clears the form (current UI: keeps it open and refocuses the title on pointer devices, closes it on phones).
- Done checkbox (`Done: <title>`) on sprint todos: `/todos?/toggleDone` (Done <-> To do). Done todos stay listed in their done state.
- Overdue/due-today todos that are not in the active sprint show no checkbox; in `running`/`review-available` they offer `Add to sprint` (`/todos?/addToSprint`, lands as `To do`, no day); without an active sprint they are plain rows. Draft (planning) todos show neither.
- Open editor by clicking a title (see Todo editor). Prompt links navigate.
- Errors: `required` -> `Give the todo a title.`; `no-aspect` -> `Pick an aspect.`; `no-active-sprint` -> `There is no running sprint to add this to.`; `day-outside-sprint` -> `That day is not part of the sprint.`; plan errors (see Shared todo behavior); other -> `Couldn’t add the todo (<code>).` Add-to-sprint failure: `review-required` -> `The sprint needs its review first.` + `Review` link; other -> `That didn’t work. Reload and try again.`; `not-found` -> silent reload.

**States**
- Empty (no todos anywhere): Applies - summary `0` `open today`, prompt per phase, quick add; no groups; in running phase the empty-state message.
- Loading: N/A - server-rendered load; form actions update in place without navigation.
- Error: Applies to actions only (messages above); the page load itself has no error state.
- Single item: Applies - one group with count 1.
- Many items: Applies - groups per aspect, plus Overdue group; no pagination.
- Overlong text: Applies - titles/notes unconstrained by validation (no max length); display truncation is a design matter.
- Sunday before next sprint: Applies - not a sprint day, so quick add goes to backlog due today, prompt `Your next sprint is being planned.` after review.

**Keyboard & touch**
- `Escape` in the quick-add title field closes the quick add. In a checklist item `Enter` adds a new item after it (only if the current one has text). `Escape` closes the editor (not while its delete confirmation is open). Status/day are native selects (platform pickers on touch). Quick add and editor must be fully usable on touch and with the keyboard. No drag on this route.

**Serves jobs**
- See what to do today at a glance; tick things off; catch overdue work; capture a todo in seconds; pull a due/overdue backlog todo into the sprint; know sprint progress and days left; get nudged to plan/review.

**Redirects/guards**
- No aspects -> 303 `/welcome`. Phase-dependent prompt. Overdue/ticked-late and due-today lists depend on today's date; sprint-day check decides quick-add target; a todo ticked done while overdue vanishes from Overdue the next day.

---

### `/welcome`

**Data shown**
- Heading, intro text, six preset aspects (name, colour value, icon value, and whether an aspect of that name already exists), `Add your own` / custom form, submit action with live count. See 4.4.

**Actions**
- Toggle preset checkboxes (client-only until submit); presets that already exist are disabled and marked as existing.
- `Add your own` / `Remove` (client-only).
- Submit -> `POST ?/create` (all-or-nothing). Validation/errors and redirect as in 4.4. After a failure the ticked presets remain ticked.

**States**
- Empty: Applies - first-run state, no preset selected, submit disabled.
- Loading: N/A.
- Error: Applies - `Pick at least one aspect.`; custom name errors `Give the aspect a name.` / `You already have an aspect with this name.`
- Presets exist: Applies - after onboarding (when `/welcome` is revisited) each existing preset is disabled and marked as existing; if all six exist only the custom form can add an aspect.
- Single item: Applies - `Continue with 1 aspect`.
- Many items: Applies - all 6 presets + custom = `Continue with 7 aspects`.
- Overlong text: Applies - custom name has no max-length validation; stored trimmed.

**Keyboard & touch**
- Activating anywhere on a preset (its name, colour, icon) toggles its checkbox. Custom name field is autofocused when the form opens. Standard form submit with Enter.

**Serves jobs**
- Create the first set of life areas (aspects) so todos can be categorised; start the app from zero.

**Redirects/guards**
- This is the target of the "no aspects" guard from every other route (layout load, 303). `/welcome` itself is always reachable. Success -> `/backlog`.

---

### `/sprint`

**Data shown**
- Title `Sprint`. Data is loaded only in `running`/`review-available` (Sunday still shows the sprint). In `none`, `planning`, `review-required` the page shows only the title and the sprint prompt (see Today copy) - no views, no summary, no backlog access, no `Manage` action.
- Summary (not in `review-required`): `<done> / <total>` `done`, context `This sprint`, line `<Mon 5> – <Sun 11 Oct>` `· <N> day(s) left` plus ` · <M> doing` when M>0; per-aspect progress (done/total per aspect).
- View choice (URL `?view=`, exposed as navigation `Sprint view` with the current view marked `aria-current="page"`): `By aspect` (default; unknown value falls back), `Board`, `Week`.
- **By aspect:** aspect groups (name + done/total progress; aspects without sprint todos hidden), each todo with status, day, row actions. Empty: `Nothing in this sprint yet. Add a todo above, or pull some in from the backlog.` (link `/backlog`). The position word (`above`) may be reworded to fit the new layout.
- **Board:** todos grouped by status `To do` / `Doing` / `Done` with counts; each todo shows title, aspect, due label (not when done), planned label, priority; empty-group text `Nothing left to start`, `Nothing in progress`, `Nothing done yet`.
- **Week:** seven day groups Mon-Sun (weekday + date number, today identified, count of todos), plus an `Unscheduled` group. A todo belongs to the day of its planned `day`, or - if it has none - of its due date when that falls in the sprint week; otherwise Unscheduled. Within a day group a todo shows only its title and time slot. Done todos stay on their day. When only one day is presented at a time (current UI on phones), a day picker navigation named `Days` selects it (default today, else Monday), flags days that have open todos, and includes `Unscheduled` as an entry.
- Backlog access (in `running` and on Sunday; not in `review-required`): titled `Backlog`, grouped by aspect with backlog count per aspect + sprint progress, filter `Filter backlog` (title substring), collapsible aspect groups (collapsed state remembered per browser, key `lm:rail-collapsed`), empty `The backlog is empty.` + `Open Backlog`, no match `No backlog todo matches`. Current UI presents it next to the views on wider screens and behind a `Manage` action (opening `Backlog`, closed with `Close`) on phones; `Manage` and `Close` are asserted copy.
- Prompt: `This sprint ends today.` `Review it` on Sunday, in addition to the views.

**Actions**
- Quick add `Add a todo` (target: active sprint, no day) in By aspect and Board; in Week each day and Unscheduled have their own add (`Add a todo to <Mon 6>` / `Add a todo to Unscheduled`), creating on that day or with no day. A day add whose Planned was cleared still adds to the sprint without a day.
- Status change on every sprint todo (`Status: <To do|Doing|Done>`) -> `/todos?/setStatus`; Done sets `completedAt` (kept if already set), other statuses clear it. Board, pointer devices: drag a todo to another status group.
- Day picker on todos (`Pick a day` / `Day`; options `Unscheduled` + `Mon 6`...`Sun 12`) -> `/todos?/setDay`; Week, pointer devices: drag a todo to another day (keeps slot) or to Unscheduled (clears day and slot).
- Row actions menu (`More actions`): `Move to backlog` (`/todos?/moveToBacklog`; clears day/slot, status -> `To do`, `completedAt` cleared; allowed for done todos without confirmation) or, for recurring instances, `Remove from sprint` (deletes the instance after an undo toast `Removed “<title>” from the sprint` + `Undo`; the deletion is posted when the toast expires or when leaving the page; the rule stays).
- Add from the backlog: `Add to sprint: <title>` (optimistic move; `/todos?/addToSprint`), or, on pointer devices, drag a backlog todo onto the By-aspect list (no day, `To do`), a Board status group (sets that status; Done sets completion), a Week day (sets that day), Unscheduled. Dragging a non-recurring sprint todo onto the backlog returns it.
- Moves are optimistic and revert on refusal. Failure message (`role="alert"`): `review-required` -> `The sprint needs its review first.` + `Review` link; `not-found` -> silent reload; other -> `That didn’t work. Reload and try again.` Failures of `Add to sprint` from the backlog (non-optimistic) show the same copy tied to that todo. `day-outside-sprint` is refused for out-of-week days.
- Todo editor (activate title): see Shared todo behavior.

**States**
- Empty: Applies - By aspect shows the empty text; Board shows the three empty-group texts; Week shows empty days with their add controls. Summary `0 / 0`.
- Loading: N/A - optimistic client moves during save only.
- Error: Applies - `role="alert"` messages (above); page-level none.
- Single item: Applies - one group / one entry.
- Many items: Applies - a busy day must stay usable without hiding other days; progress per aspect.
- Overlong text: Applies - no length validation; long titles/notes must not break the view (design concern).
- No sprint / planning / review-required: Applies - only prompt (`No sprint is running.`, `Your next sprint is being planned.`, review prompt); views hidden.
- Sunday: Applies - full views plus review prompt.

**Keyboard & touch**
- Drag-and-drop only on hover + fine-pointer devices (backlog -> sprint/status/day, sprint todo -> status/day/backlog, draft return); touch has no drag - equivalent actions are the status select, day picker, row menu, `Add to sprint` buttons and the backlog access via `Manage`. Dragging is suppressed while typing in an editor field of the todo. Row menu: opens focusing the first item; `Escape` or outside press closes it. `Escape` closes the editor. Week with one day at a time: choosing a day in `Days` changes the shown day.

**Serves jobs**
- Run the week: track progress by aspect/status/day; assign work to days; pull more work from the backlog or send it back; add todos on the fly; see days left; reach the review on Sunday.

**Redirects/guards**
- No aspects -> `/welcome`. Phase gating as above (views hidden unless running/review-available). `?view` is validated. All mutations from this page refuse with `review-required` once the Monday after the sprint is reached. Week-day and "days left" depend on today.

---

### `/sprint/plan`

**Data shown**
- As in 4.2: target week label, `This sprint` count, `Due this week` suggestions, `Joins automatically`, draft todos by aspect, backlog list (count, filter, grouped by aspect), recurring hint, start action.

**Actions**
- `?/pull` (id): backlog -> draft; clears day/slot. Errors `not-found`, `sprint-active`, `archived` (class of an archived semester is read-only).
- `?/unpull` (id): draft -> backlog, status `To do`, day/slot cleared. Error `not-found`, `archived`.
- `?/start` (repeated `suggested` ids): see 4.1. Errors `review-pending`, `sprint-active`.
- Include/exclude checkbox per suggestion (client state until start; ids submitted with start).
- Drag (hover + fine-pointer devices): backlog todo -> draft = pull; draft todo -> backlog = unpull (not recurring). Buttons are the only path on touch.
- Todo rows here (`planning` context) have no status, day or done controls, but the title still opens the todo editor (edit/delete).

**States**
- Empty: Applies - the draft shows the empty hint; start action `Start sprint` (an empty sprint can be started).
- Loading: N/A.
- Error: Applies - start error copy in 4.2.
- Single item: Applies - `Start sprint with 1 todo`.
- Many items: Applies - grouped by aspect, counts per group.
- Overlong text: Applies - no limits.
- Backlog empty: Applies - backlog list shows `The backlog is empty.` + `Open Backlog`.

**Keyboard & touch**
- Drag-and-drop on hover + fine-pointer devices; touch uses `Add to sprint`/`Remove from sprint` buttons and the include checkboxes. Filter field `Filter backlog`.

**Serves jobs**
- Decide what goes into next week; honour due dates and planned dates automatically; start the sprint.

**Redirects/guards**
- running -> 303 `/sprint`; review-available/required -> 303 `/sprint/review`; no aspects -> `/welcome`. Target week depends on the weekday (Sunday = next week). Start success -> 303 `/sprint`.

---

### `/sprint/review`

**Data shown**
- As in 4.3: title, week label, summary line, `Done` collapsible (count), open todos by aspect each with decision choices, close action.

**Actions**
- Choose per open todo: `Carry over` / `Back to backlog` / `Drop` (recurring: only carry/drop). Defaults to carry; client state.
- `?/close` (fields `decision-<todoId>`): atomic close; errors as in 4.3. Success 303 `/sprint/plan`.

**States**
- Empty: Applies - `Nothing was planned this week.` (no done, no open); button `Close sprint`.
- Loading: N/A.
- Error: Applies - per-todo `This todo can’t go there.`; general `That didn’t work. Reload and try again.`
- Single item: Applies.
- Many items: Applies - grouped by aspect; button label summarises counts.
- Overlong text: Applies - no limits.
- All done: Applies - `All N done. Nice week.`; no choices.

**Keyboard & touch**
- Choices are a radio group per todo (name `decision-<id>`, labelled by the todo title). Standard form submit.

**Serves jobs**
- Close the week deliberately; decide the fate of unfinished work; celebrate completed work; unblock the next sprint.

**Redirects/guards**
- running -> `/sprint`; none/planning -> `/sprint/plan`; closing before the sprint's Sunday is refused (`sprint-active`, only reachable by a crafted request). Available from Sunday, required from Monday.

---

### `/backlog`

**Data shown**
- Title `Backlog`. All open (not done) todos that are in no sprint (`sprintId` null), including the quick-add-from-Today ones due today.
- `Planned` section (count), listed before the aspect groups: backlog todos with a planned `day`, sorted by day, then all-day before timed, then start time, then title; rows show planned label (`Tue 3 Nov · 18:00–19:30`). Omitted when none.
- Aspect groups (aspect icon value, name, count) for unplanned todos; empty aspects hidden; order inside: priority (1,2,3, none last), due date (undated last), id.
- Aspect filter (navigation `Filter by aspect`, only when more than one aspect): `All` + one link per aspect, URL `?aspect=<id>`; the selected one is `aria-current`. A `?aspect=` value that is not a whole number, or names no existing aspect, shows an empty filtered list (never `All`, never an error); `All` stays available to leave it (decision 4; Pending server change: strict parsing).
- Review note when `review-required`: `This week’s sprint is over, so nothing can join it.` `Review the sprint` (-> `/sprint/review`); no `Add to sprint` is offered.
- Empty: `Your backlog is empty.` `Add a todo` (opens quick add) `to start planning.`; with a filter: `Nothing for <aspect> in the backlog.` `Add a todo` `to it.`
- Todo item data as in Today (due label, overdue flag, priority, planned label, linked project, linked class, checklist progress, has-notes; recurring not applicable).

**Actions**
- Quick add (`/todos?/create`, target backlog): default aspect = the filtered aspect else the first aspect. A planned day inside the running sprint's week sends the todo straight into the sprint (only the global `New todo` quick add, section 6, states the destination live: `Goes to this sprint`, otherwise `Goes to the backlog`); a planned day in the past outside the sprint is refused (`day-in-past`); a planned day inside a review-required week is refused (`review-required`).
- `Add to sprint` per row (`/todos?/addToSprint`; offered only in `running`/`review-available`): lands as `To do`; a planned day within the sprint is kept with its slot, otherwise day/slot dropped; refused when review required (`The sprint needs its review first.` + `Review` link) or already moved (silent reload).
- Open editor by clicking title (edit all fields, plan, checklist, delete); planning a backlog todo to a day inside the running week moves it into the sprint.
- Aspect filter navigation.

**States**
- Empty: Applies - copy above.
- Loading: N/A.
- Error: Applies - `role="alert"` messages on add/quick add/editor.
- Single item: Applies.
- Many items: Applies - grouped by aspect; no pagination.
- Overlong text: Applies - no limits.
- Filter yields nothing: Applies - filtered empty copy; an unknown or non-numeric `aspect` value yields the same empty list (the aspect name in the copy is then unavailable, so the copy may be generic).

**Keyboard & touch**
- Quick add and editor fully usable on touch and keyboard. No drag on this page.

**Serves jobs**
- Park everything not yet scheduled; prioritise and file by aspect; plan future dates; pull work into the running sprint; capture quickly.

**Redirects/guards**
- No aspects -> `/welcome`. Add-to-sprint availability depends on phase (hidden in `none`, `planning`, `review-required`). Planned todos from archived-semester classes are read-only.

---

### `/todos`

**Data shown**
- Nothing: `GET /todos` is never rendered, it redirects 303 to `/backlog`. The route exists for the shared form actions every view posts to.

**Actions** (each `POST /todos?/<action>`; success = `{ok:true}`; failure = HTTP 400 `{error, field, values}`; archived-class todos = HTTP 409 `{error:'archived'}` on every by-id edit except `delete`)
- `create` (title, aspectId, notes, priority 0-3, dueDate, checklist[], target `backlog|sprint|day`, day, startTime, endTime, projectId, classId, type): title trimmed, empty -> `required`/title; unknown aspect -> `no-aspect`; priority must be 0-3; project must exist (else `not-found`/projectId); project link kept only for the IT aspect; class + type (`LEC`, `EXC`, `OTH`; default `OTH`) only for the Uni aspect with an existing writable (non-archived) class, else silently dropped; slot without day is dropped; slot validated; `target=sprint` without active sprint -> `no-active-sprint`; any day goes through placement rules; blank checklist entries dropped; past due dates allowed (shown overdue).
- `update` (id + any subset of fields title/aspectId/notes/priority/dueDate/projectId/classId/type, optionally day/startTime/endTime): replan only when day or slot changed (unchanged stale past days are not re-validated); plan and fields saved atomically (a failing plan saves nothing); changing aspect drops project link and, for non-Uni, class/type/revised date.
- `delete` (id): removes todo and its checklist; `not-found` if gone. (No archived check.)
- `checklistAdd` (todoId, text), `checklistRename` (itemId, text), `checklistToggle` (itemId, done=true|false), `checklistDelete` (itemId): empty text -> `required`/text.
- `setStatus` (id, status `todo|doing|done`): invalid -> `required`/status; Done stamps `completedAt` (kept if set), other clears it.
- `toggleDone` (id): Done <-> To do.
- `setDay` (id, day or empty, optional startTime/endTime): empty day clears day and slot; see Shared todo behavior (placement rules, errors `day-in-past`, `review-required`, `recurring-outside-week`, `day-outside-sprint`, slot errors).
- `addToSprint` (id, optional day, optional status): needs active sprint (`no-active-sprint`), not review-required (`review-required`), todo currently in no sprint (else `not-found`), day within the sprint week (else `day-outside-sprint`); no day -> day and slot cleared; status default `To do`; `Done` stamps completion.
- `removeFromSprint` (id): recurring instance -> deleted; other -> same as `moveToBacklog`.
- `moveToBacklog` (id): active-sprint todo -> backlog, day/slot cleared, status `To do`, `completedAt` cleared; else `not-found`.

**States**
- Empty/Loading/Single/Many/Overlong: N/A - no UI; Error: Applies - error codes above are surfaced by the calling view.

**Keyboard & touch**
- N/A.

**Serves jobs**
- Single mutation endpoint for all todo changes from Today, Sprint, Backlog, Plan, Uni and Aspect pages.

**Redirects/guards**
- `GET /todos` -> 303 `/backlog`. Posting views stay on their page (no navigation); successes refresh the page data, failures return to the caller.

---

### Shared todo behavior (appears on Today, Sprint, Backlog, Plan, Review)

**Todo create/edit fields** (quick add and editor share them): `Title` (placeholder `Add a todo`; required), `Description` (`Add a description`), `Aspect` (select, default first/defaulted aspect), `Priority` (`No priority`, `Priority 1`, `Priority 2`, `Priority 3`), `Due` (date, clearable via `Clear due date`), `Planned` (date, clearable via `Remove plan`; time fields are offered only after a day is set), `Time` `From`/`To` (typed `HH:MM`, 24h; `Add time` sets the next full hour clamped to 06:00-21:00 for one hour; length shortcuts `30m`, `1h`, `1h30`, `2h` (disabled when passing midnight); moving the start keeps the length (end capped at 23:59); clearing the start clears the end, retyping restores the remembered length; `Clear time`; a backwards slot shows `End must be after start`), `Project` (only when the aspect is the IT aspect and non-implemented projects exist; `No project` option; an implemented project stays selectable only on the todo linked to it), `Class` (`No class`, only when aspect is Uni and active classes exist; hidden otherwise, decision 7) with `Type` single choice `LEC` (Lecture) / `EXC` (Exercise) / `OTH` (Other), shown once a class is chosen, `Checklist` (quick add: toggle, items `Checklist item N`, Enter adds the next).
- Plan error copy: `day-in-past` -> `That day has already passed. Pick today or a later day.`; `review-required` -> `The sprint needs its review before a day can be changed.`; `recurring-outside-week` -> `A recurring todo stays in its sprint’s week. Pick a day of that week.`; `end-before-start` -> `The end time has to be after the start time.`; `end-without-start` -> `Set a start time before the end time.`; `invalid` -> `Use a time like 18:00.` Editor title error `Give the todo a title.`; other editor errors `Couldn’t save the todo (<code>).`

**Placement rule (planned day):** a day inside the active sprint's week puts the todo in the sprint (status reset to `To do` when it comes in from outside; refused with `review-required` once the Monday after is reached); a day before today and outside the active week is `day-in-past`; a day outside the active week (not past) leaves/keeps the todo in the backlog (a sprint todo moved out has status reset to `To do`); with no active sprint it stays in the backlog; a todo of a closed sprint keeps its sprint and may only move within that sprint's week (`day-outside-sprint`); a recurring instance must stay within its sprint's week (`recurring-outside-week` takes precedence over `day-in-past`; instances in a planning draft cannot be planned). Pulling by hand or carrying over clears the planned day.

**Status control:** native select `To do` / `Doing` / `Done`, accessible name `Status: <label>`; only on sprint todos. **Status exposure (decision 15):** every presentation of a todo (list row, board card, week or day entry, compact, read-only, backlog-access, status-grouped) exposes the todo's three-state status (`To do`, `Doing`, `Done`) through an accessible name, text or role, editable where the status control applies and read-only elsewhere. No `data-*` hook carries it. UI, built in the redesign.

**Day picker:** select on sprint todos: `Unscheduled` or one of the sprint's seven days (`Mon 6`); change submits immediately.

**Editor (activate the todo title):** all fields above, checklist items (toggle `Done: <text>`, rename on blur/Enter, `Delete item: <text>`, add `Add a checklist item`; each change saves at once), `Delete` -> confirm dialog `Delete this todo?` / `“<title>” and its checklist will be gone for good.` / `Delete todo`; `Cancel`; `Save`; extra action: `Add to sprint` (backlog todos in running phase) or `Move to backlog` / `Remove from sprint` (sprint todos). Archived-class todos (read-only) are not editable.

**Sprint prompt:** copy under Today; shown on Today and Sprint whenever phase is not `running`.

**Per-todo actions summary:** Done checkbox (Today, sprint context), status, day, `More actions` menu, `Add to sprint`, title -> editor, linked project -> project page.

**Recurring instances:** flagged `Recurring`; created at sprint start from rules; removal deletes; review: carry or drop.

---

### /aspects

**Data shown**
- Every aspect (ordered by `position`, then id): name, colour (fixed palette of 8: sage, sky, lavender, ochre, berry, lagoon, tangerine, slate), icon (fixed set of 25 icon values: heart, cap, briefcase, house, wallet, people, dumbbell, book, leaf, sprout, utensils, plane, music, palette, code, pen, sun, moon, coffee, car, baby, paw, flower, star, ...).
- Order: the user-defined order (position, then id).
- Per aspect: todo count (`No todos` / `1 todo` / `n todos`; counts all todos of the aspect, incl. done), backlog count `n in backlog`, and this-sprint progress (done / total) only while a sprint is `running` or `review-available`; an aspect with no todos in that sprint reads `Not in this sprint`. When no sprint is shown, no progress is given. Progress and backlog count are display-only secondary data and may be omitted on phones (decision 9).
- Usage (todos + recurring rules) per aspect is loaded for the delete flow.

**Actions**
- `New aspect` (page-level action) opens a form (title `New aspect`): name input (placeholder `Aspect name`, autofocused), colour choice (8 radios, default `tangerine`), icon choice (25 radios). Submit `Create aspect` -> server action `?/create`; new aspect is appended at the end (position = max+1). The form closes on success.
- The aspect name is a link to `/aspects/<id>`; activating anywhere on the aspect's entry (except its actions menu) opens it.
- Per-aspect actions menu (button labelled `Actions for <name>`): `Edit`, `Delete`. `Edit` opens the same form titled `Edit aspect` (`Save`), action `?/update` (hidden `id`). In edit mode the form also offers `Delete aspect` and `Cancel`.
- `Delete` (menu item or form button) opens a confirm dialog `Delete <name>?`:
  - Aspect has no todos and no rules: message `<name> has no todos or recurring rules.`, confirm label `Delete aspect`, no target.
  - Aspect in use: message `<name> has n todo(s) and m recurring rule(s). Which aspect should they move to?`, a required target choice among all other aspects (first preselected), confirm label `Move <n+m> and delete`. Action `?/delete` with `id` and `targetId`.
  - Moving: todos and rules go to the target keeping sprint, status, day; todo project/class links, type and revised date are cleared; rule class/type cleared. If the deleted aspect was the IT or Uni aspect, that setting becomes unset (prompts reappear on `/projects` / `/uni`).
  - Disabled: delete is disabled (menu item and form button) when this is the only aspect and it has todos or rules; form shows `This is your only aspect and it still has todos or rules. Add another aspect to move them to first.`
- Validation (server, shown at the name field, `role="alert"`): empty/whitespace name -> `Give the aspect a name.` (`required`); case-insensitive duplicate (also non-ASCII fold, e.g. Ärzte/ärzte) -> `You already have an aspect with this name.` (`duplicate`). Invalid colour/icon -> `required` on colour/icon (not reachable through the pickers). Failed save keeps the form open with entered values.
- Delete errors (inside the dialog): `It is your only aspect and still has todos or rules.` (`only-aspect-in-use`), `Pick the aspect that receives them.` (`target-required`), `That aspect no longer exists.` (`not-found`). Dialog stays open on error.
- Deleting the last remaining (empty) aspect redirects (303) to `/welcome` (first-run onboarding).

**States**
- Empty: N/A - with zero aspects the app redirects to `/welcome`, so the list is never empty.
- Loading: N/A - server-rendered load; form submits use progressive enhancement (page re-renders after action).
- Error: save/delete failures show the messages above; no page-level error state.
- Single item: Applies - one aspect; delete disabled if it has todos/rules.
- Many items: Applies - all aspects, no pagination.
- Overlong text: Applies - aspect names have no max length; the full name must be readable at least in the edit form and on the detail page.

**Keyboard & touch**
- Actions menu: opening it moves focus to the first menu item; `Escape` or a pointer press outside closes it. Menu items are `role=menuitem`; button has `aria-haspopup=menu`/`aria-expanded`.
- Colour/icon choices are radio groups (arrow keys). Name field autofocuses when the form opens. Form and confirm dialog close on `Escape` and on dismissing outside them.
- Touch: the whole aspect entry is a tap target to open the aspect; the actions menu is a separate target.
- Reordering (decision 8): the user can reorder aspects manually and the order persists. Reordering has a non-drag path (keyboard and touch equivalents, such as move up / move down); pointer drag may be an extra. Deleting an aspect keeps the order of the rest; a new aspect goes last. UI is built in the redesign; the order is stored by the server first (Pending server change).

**Serves jobs**
- Define life areas that categorise all todos
- Rename / recolour / re-icon an area
- Remove an area without losing its todos (move to another)
- See per-area workload (todos, backlog, sprint progress)
- Jump into one area

**Redirects/guards**
- No aspects at all -> any route (including this one) 303 redirects to `/welcome`.
- Deleting the last aspect -> `/welcome`.
- Delete refused server-side for the only aspect in use, and when target is missing/same/unknown.

### /aspects/[id]

**Data shown**
- Page title = aspect name; the aspect's icon and colour values are shown with it.
- Section `This sprint`: the aspect's todos of the running (or review-available) sprint, progress done/total; each with the sprint-context todo actions (day picker, status, row actions as on `/sprint`). `This sprint` shows `Nothing from <name> in this sprint yet.` when a sprint is shown but has none of this aspect.
- Section `Backlog` (with count): aspect's backlog todos (not in a sprint, not done) and a QuickAdd defaulting to this aspect (target = backlog).
- Details: `Colour` (colour name), `This sprint` (progress, or `Waiting for its review`, or `No sprint running`), `Backlog` (`n in backlog`).

**Actions**
- Move to sprint: `Add to sprint` on a backlog todo -> posts `/todos?/addToSprint` (id); the todo moves optimistically to `This sprint` and progress updates; on failure it moves back.
- Move to backlog: `Move to backlog` on a sprint todo -> `/todos?/moveToBacklog`; recurring instances cannot be moved to backlog (not draggable / not accepted by the backlog drop zone).
- Drag (pointer devices only): drag a backlog todo onto the `This sprint` section = add to sprint; drag a non-recurring sprint todo onto `Backlog` = move to backlog. `This sprint` accepts drops only when a sprint is shown.
- QuickAdd in Backlog creates a backlog todo under this aspect (aspect preselected, changeable); empty-state button `Add a todo` opens it.
- Todo actions (edit, status, done, delete, planning) are the shared todo behaviour documented under Today/Backlog; they work here.
- Errors: move failing with `review-required` shows `The sprint needs its review first.` + link `Review` (/sprint/review); any other failure shows `That didn’t work. Reload and try again.`; `not-found` (todo already moved elsewhere) silently reloads the page data.
- No aspect edit/delete here; those are on `/aspects`.

**States**
- Empty: Applies - aspect with no todos at all: `Nothing in <name> yet. Add a todo to start.` (button opens quick add). Backlog empty but sprint todos exist: `Nothing from <name> in the backlog.`
- Loading: N/A - server load; moves are optimistic and settle on response.
- Error: Applies - unknown or deleted id -> 404, `+error.svelte`: title `Aspect not found`, message `This aspect doesn’t exist, or it was deleted.` with link `Aspects` (/aspects); non-404 error: `Something went wrong loading this aspect.` with the same link. Move errors as above.
- Single item: Applies - one todo in a section.
- Many items: Applies - full lists, no pagination.
- Overlong text: Applies - todo titles as in shared todo behaviour; aspect name in headings and empty copy shown in full.
- No running sprint (phase `none` or `planning`): `This sprint` shows `No sprint running. Plan the next sprint` (link /sprint/plan); no drop into sprint; backlog todos offer no sprint day actions.
- Review required: `This week’s sprint is over, so nothing can join it. Review the sprint` (link /sprint/review); no `Add to sprint` on backlog todos; sprint list empty; details say `Waiting for its review`.

**Keyboard & touch**
- Drag only on `(hover:hover) and (pointer:fine)` devices; touch devices use the per-todo buttons/menus (`Add to sprint`, `Move to backlog`) instead.
- QuickAdd keyboard behaviour is the shared one (Enter submits).

**Serves jobs**
- Review everything in one life area
- Pull area todos into / out of the sprint
- Capture a todo directly into an area

**Redirects/guards**
- Unknown id -> 404 (no redirect). Id match is by string equality on the aspect id.
- No aspects -> `/welcome` (layout).

### /projects

**Data shown**
- Before the IT aspect is chosen: a prompt `Which aspect holds your IT todos?` / `Todos of this aspect can be linked to a project. You can change it later.` listing all aspects (radio), preselecting an aspect named `IT` (case-insensitive) if present. Submit `Use <aspect> for projects` (disabled until one is selected). No `New project` action while prompting.
- After: subline `<n> active, <total> in total` (active counts `active` + `in_progress`); projects grouped by status; line `IT aspect: <name>` with `Change IT aspect`.
- Groups (empty groups not rendered), in order: `In progress`, `Active`, `Backlog`, `Paused` (each with count), then collapsed `Implemented (n)`. Within a group, most recently updated first. Five statuses is the confirmed model (decision 1; `openspec/specs/it-projects` is updated to match).
- Per project: name, description, tags, repo indicator if repo URL set (accessible text `Repository linked`), open linked todo count `n open` or `No open todos` (open = linked, not done). The project entry links to `/projects/<id>`.

**Actions**
- `New project` (page-level action) shows a form: `Name` (required), `Description` (placeholder `One line about it`), `Repository URL` (placeholder `https://github.com/…`), `Tags` (placeholder `SvelteKit, SQLite`, hint `Separate with commas.`); `Add project` / `Cancel`. Server action `?/create`; new project starts in status `backlog`.
- Validation: empty name -> `Give the project a name.` (`required`@name); repo URL not http(s) -> `Enter a link starting with http:// or https://.` (`invalid`@repoUrl). Form stays open with errors; on success it closes. Tags: split on commas, trimmed, empties and duplicates dropped, order kept.
- Empty-state button `New project` (when no projects exist) opens the same form.
- Expand/collapse `Implemented (n)` group (collapsed by default, lists its projects only when expanded).
- `Change IT aspect` re-shows the prompt (titled `Change the IT aspect`, with `Cancel`). Submit -> `?/setItAspect` (aspectId). If the choice differs from current and any todo is linked to a project, a confirm dialog `Change the IT aspect?` / `<n> todo(s) lose(s) their project link. The todos themselves stay.` / confirm `Change aspect`; with zero links, or same aspect, no dialog. Result: all todo->project links removed; setting stored. Unknown aspect -> `not-found`@aspectId.

**States**
- Empty: Applies - no projects: `Capture your first idea. A project starts in the backlog.` + `New project`; no group headings.
- Loading: N/A - server load.
- Error: Applies - field errors on create; no page-level error.
- Single item: Applies - one project in its group.
- Many items: Applies - all projects per group, no pagination.
- Overlong text: Applies - no length limits on name, description or tags; the full description is always available on the detail page.
- No IT aspect set: Applies - only the prompt is shown (replaces the overview).

**Keyboard & touch**
- IT-aspect prompt is a radio list; Group toggle `Implemented` is a button with `aria-expanded`. No drag/reorder or shortcuts. Project entries are links (Enter opens).

**Serves jobs**
- Track personal IT/side projects by status
- Capture project ideas quickly
- Decide which aspect's todos can be linked to projects
- Open a project to work on it

**Redirects/guards**
- No aspects -> `/welcome` (layout). No IT aspect -> prompt instead of overview (no redirect). Deleting the IT aspect resets the setting to unset.

### /projects/[id]

**Data shown**
- Back link `Projects`; heading = project name; current status label (also the trigger of the status menu); description if set.
- `Details`: repo link (shown as host/path, opens in new tab with `rel=noopener noreferrer`), tags, `Todos` summary `n open, n planned, n done`, `Created`, `Updated` (dates en-GB, Europe/Berlin, e.g. `Created <d Mon>`), `Edit details`. The `Todos` summary is display-only secondary data and may be omitted on phones (decision 9).
- `Notes`: rendered Markdown (raw HTML is escaped; links allow only relative/http/https/mailto) or placeholder `No notes yet. Write down the plan, decisions or change requests.` Long notes are never truncated.
- `Linked todos`: groups `Open` (not in a sprint, not done, backlog-context rows), `Planned` (in a sprint, not done), `Done` (collapsed by default with count, newest completion first). Each uses the shared todo row.
- `Delete project` action.

**Actions**
- Status menu `Set status`: Backlog, Active, In progress, Paused, Implemented (any to any; current one marked). Picking the current status does nothing. Action `?/status`. Picking Implemented while open linked todos > 0 opens confirm `Mark as implemented?` / `<n> linked todo(s) is/are still open. They stay as they are.` / `Mark as implemented`; cancel changes nothing. Leaving Implemented, or no open todos: no dialog. Updates `updated_at`.
- `Edit details` opens a form titled `Edit details`: Name, Description, Repository URL, Tags -> `?/update`, same validation/messages as create (`Give the project a name.`, `Enter a link starting with http:// or https://.`); stays open on error, `Save`/`Cancel`; bumps `updated_at`.
- Notes: `Edit notes` toggles a multi-line Markdown text field (autofocus) with `Save`/`Cancel` -> `?/notes`; saving updates `updated_at`; editor shows raw Markdown, view shows rendered.
- `Done` group toggle expands/collapses.
- Linked todos: shared todo actions (edit, status, planning, move to sprint when a sprint can accept it - sprint days are provided only for a running or review-available sprint).
- `Delete project` -> confirm `Delete project?` / `No todos are linked to it.` or `<n> linked todo(s) will be unlinked and kept.` / `Delete project` -> `?/delete`; todos stay with project link cleared; redirect 303 to `/projects`.
- Errors: `not-found` -> `That project no longer exists.` (action failure 400).

**States**
- Empty: Applies - no notes: placeholder above; no linked todos: `No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field.`; no repo/tags: those fields omitted.
- Loading: N/A - server load.
- Error: Applies - unknown id -> 404 `+error.svelte`: title `Project not found`, `This project doesn’t exist, or it was deleted.` + link `Projects` (/projects); non-404: `Something went wrong loading this project.` + same link.
- Single item: Applies - one todo in a group.
- Many items: Applies - all linked todos listed, no pagination.
- Overlong text: Applies - notes are never truncated; name/description shown in full.

**Keyboard & touch**
- Status menu: opening focuses the first item; `Escape`/outside click closes. Must be operable by touch. Notes field autofocuses on edit.

**Serves jobs**
- Keep project notes/plan
- Track project status
- See and act on all todos tied to the project
- Maintain repo link/tags
- Remove a project

**Redirects/guards**
- Unknown id -> 404. After delete -> `/projects`. No aspects -> `/welcome`.

### /recurring

**Data shown**
- Title `Recurring`, subtitle `Each rule adds a todo on its days when a sprint starts.`
- Every rule (ordered by creation id), each addressable by fragment `#rule-<id>`: title, aspect (name, colour value, icon value), linked class (`<Class> · <TYPE>`) if linked, weekdays (`Mon`..`Sun`), time slot `HH:MM–HH:MM` or `HH:MM` if a start time is set (no slot shown when none), checklist item count, priority (P1-P3).

**Actions**
- `New rule` and activating a rule open the rule form (`New rule` / `Edit rule`). Fields: `Title` (placeholder `Gym, call home, laundry`), `Aspect` (radio; default first aspect), `Class` select (options `No class` + classes of active semesters, plus the rule's own class marked `(archived)` if its semester is archived) and `Type` (LEC/EXC/OTH, default OTH) - both shown only when the chosen aspect is the Uni aspect and classes exist; `Repeats on` (Mon-Sun checkboxes, labelled with full weekday names); `Time` with `From` and `To`; `Priority` (`None`, `P1`, `P2`, `P3`); `Notes` (textarea); `Checklist` (items `Checklist item n`, `Remove item n`, `Add item`; empty items dropped). Buttons `Add rule` / `Save rule`, `Cancel`, and (edit only) `Delete rule`.
- Server actions: `create`, `update` (hidden `id`), `delete`.
- Create: stored; if a sprint is active, instances are added immediately for the rule's remaining weekdays from today onward (with slot, checklist copy, class, type). Update: affects only future sprint generation (existing instances unchanged). Changing the aspect away from the Uni aspect clears class and type.
- Delete: confirm `Delete “<title>”?` / `It stops repeating. Todos it already added to a sprint stay.` / `Delete rule`; existing instances remain, still marked recurring.
- Validation (at the field, `role="alert"`, form stays open): `Give the rule a title.` (`required`@title); `Pick at least one day.` (`weekdays-required`); `Use a time like 18:00.` (`invalid` on startTime/endTime, strict `HH:MM` 00:00-23:59); `Set a start time first.` (`end-without-start`@endTime); `End must be after the start.` (`end-before-start`, end <= start); class errors `That class no longer exists.` / `That class’s semester is archived.` (`not-found` / `archived` @classId); `This rule no longer exists.` (`not-found`). Editing a rule whose class is in an archived semester keeps that class unless another is picked.
- Rule instances are generated by sprint start: one per weekday, pre-assigned to that day, including weekdays already past when the sprint starts mid-week (decision 5); carried-over open instances are re-used first (not duplicated); rules whose class sits in an archived semester generate nothing.

**States**
- Empty: Applies - `No recurring rules yet. Add one for anything you do every week.`
- Loading: N/A - server load.
- Error: Applies - field errors only; no page-level error.
- Single item: Applies - one rule.
- Many items: Applies - full list, no pagination.
- Overlong text: Applies - no length limits on title, checklist items or notes.

**Keyboard & touch**
- Each rule is a single button (Enter/Space opens the form). Weekday/priority/aspect are native checkbox/radio groups. No drag/reorder; rules ordered by id. The form closes on `Escape` and on dismissing outside it.

**Serves jobs**
- Automate repeating weekly todos
- Plan fixed weekly time slots
- Link recurring study to classes
- Review/maintain recurrence rules

**Redirects/guards**
- No aspects -> `/welcome`. `/recurring#rule-<id>` is a deep link to one rule (used from calendar projections).

### /uni

**Data shown**
- Before the Uni aspect is chosen: prompt `Which aspect holds your uni todos?` / `Todos of this aspect can be linked to a class. You can change it later.` (radio list of aspects, preselects one named `Uni`), submit `Use <aspect> for classes`. Replaces the entire hub.
- Hub content, in this reading order: title `Uni` with `New semester`; overall grade line `Overall average <x.xx> · <n> ECTS earned` (average `—` when none counts); active semesters newest first (by created time), each with name, `Average <x.xx> · <n> ECTS` and its classes (creation order); `This week` section; collapsed `Archived (n)` group (each archived semester itself collapsed); `Notes` (global Uni Markdown notes); the Uni-aspect line `Todos of the aspect <name> can be linked to a class.` + `Change` (accessible name `Change Uni aspect`).
- Per class: class icon and colour values, name, lecturer (if set), grade if set (`Passed` or e.g. `1.3`), `<n> open` todos, next due date of open todos (`Yesterday`/`Today`/`Tomorrow`/`Fri 9 Oct`, overdue flagged), exam countdown `Exam in <n> d` / `Exam today` (past exams show nothing). Missing bits are omitted. The class entry links to `/uni/classes/<id>`.
- `This week` (heading with count): every open (not done) class todo of a non-archived semester that sits in the active sprint; each shows title, class name with type (`LEC`/`EXC`/`OTH`; untyped treated as OTH), due text (flagged `Overdue` when past); sorted by due date ascending, undated last, then id. Empty: `Nothing in this week's sprint`. Paged client-side, 6 todos per page, `Previous` / `Next` / `Page n of m`; pager hidden when <= 6.
- Grade averages: ECTS-weighted mean of graded classes with ECTS; `passed` counts toward earned ECTS only; `5.0` counts toward neither; classes without ECTS excluded; two decimals; archived semesters count toward overall.

**Actions**
- `New semester` -> form (`Semester name`, placeholder `WS 26/27`, `Add semester`/`Cancel`), action `createSemester`; new semester appears first among active. Empty name -> `Give it a name.` (`required`@name). Duplicate names allowed.
- Semester actions menu (`Semester actions`): active semester -> `Rename`, `Archive`, `Delete`; archived semester -> `Unarchive`, `Delete`. Actions `renameSemester` (name input in place with `Save`/`Cancel`; empty -> `Give it a name.`; archived -> `This semester is archived and read-only.`), `archive`, `unarchive`, `deleteSemester` (all take `id`).
  - Archive: if open class todos exist, confirm `Archive <name>?` / `<n> class todo(s) is/are still open. Archiving marks them done, and the semester becomes read-only. You can unarchive it later.` / `Mark <n> done and archive`; otherwise immediate. Archive sets open todos done (completed now); semester read-only (no rename, no new/edited class, no notes/revised/todo edits; todos not pullable into sprints; deleting a single todo of an archived class still allowed; archived todos leave backlog and planning suggestions). Unarchive lifts read-only; todos stay done.
  - Delete: confirm `Delete <name>?` / no classes: `It has no classes. This can’t be undone.` else `This deletes <n> class(es) and <n> todo(s), done ones included, and their recurring rules. This can’t be undone.` / `Delete semester`. Removes semester, classes, todos (incl. checklist items) and rules.
- `New class` (in each active semester, also offered by its empty state) opens a form: `Name` (placeholder `Analysis II`), colour choice (default per choice set), icon choice, `Lecturer`, `Room`, `ECTS`, `Grade` (select: `No grade`, 1.0 1.3 1.7 2.0 2.3 2.7 3.0 3.3 3.7 4.0 5.0 `Passed`), links rows (`Link n label` placeholder `Moodle`, `Link n URL` placeholder `https://`, `Remove link n`, add link), `Exam date` + `Exam time` (time disabled until a date is set), `Exam room`. `Add class` / `Cancel`; action `createClass` (hidden `semesterId`). Errors shown per field: `Give it a name.`; `Pick one of the colours.`; `Pick one of the icons.`; `Enter ECTS as a number of 0 or more, in steps of 0.5.`; `Enter links starting with http:// or https://.`; `Enter the exam as a date, optionally with a time.`; `Pick a grade from the list.`; archived -> `This semester is archived and read-only.`; unknown semester -> `not-found`. Rows with empty label and URL are dropped. All field errors are collected at once. Server status: 404 not-found, 409 archived, 400 other.
- `Change` (Uni aspect) re-shows the prompt (`Change the Uni aspect`, with `Cancel`); action `setUniAspect`. If it changes aspect and class links exist (todos + rules), confirm `Use <name> for classes?` / `<n> todo(s) and rule(s) … linked to classes. Changing the aspect removes those links, their types and revised dates. The todos stay.` / `Remove <n> link(s) and change`; otherwise immediate.
- Global notes: `Edit notes` -> multi-line Markdown text field, `Save`/`Cancel`, action `notes`; placeholder `No notes yet. Keep your study plan, module list or anything else for Uni here.`
- Expand/collapse `Archived (n)` and each archived semester; archived semester shows `Read-only.` with `Unarchive`.

**States**
- Empty: Applies - no semesters: `Start with the semester you are in now.` + `New semester`; no `This week` section. Semester without classes: empty state `No classes yet.` with `New class`.
- Loading: N/A - server load.
- Error: Applies - form errors at their fields; no page-level error.
- Single item: Applies - single semester/class.
- Many items: Applies - all semesters and classes, no pagination; `This week` paged at 6.
- Overlong text: Applies - no length limits on semester/class names or lecturer; notes unconstrained.
- No Uni aspect: Applies - prompt only.

**Keyboard & touch**
- Semester menu: opening focuses first item; `Escape`/outside press closes. Collapsible groups are `aria-expanded` buttons. Rename input autofocuses; new class/semester inputs autofocus. No drag. Pager buttons are native buttons (disabled at ends).

**Serves jobs**
- Organise study by semester and class
- See this week's study todos
- Track grades and ECTS
- Archive finished semesters
- Keep general uni notes
- Choose which aspect is "uni"

**Redirects/guards**
- No aspects -> `/welcome`. No Uni aspect -> prompt (not redirect). Archived-semester writes refused server-side (`archived`).

### /uni/classes/[id]

**Data shown**
- Back link to `/uni`; class name as heading with the class icon and colour values; semester name; if the semester is archived: `<semester> is archived. This class is read-only.`
- `Details`: Lecturer, Room, ECTS (`<n> ECTS`), Links (labelled, open in new tab; label falls back to URL without scheme), Exam (date, optional time, exam room, countdown `in <n> d` / `today`), Grade (`Passed` or value; when none, current UI reads `—` or `No grade yet` depending on screen width; the phone may omit it and the wording is the designer's choice, decision 9), Todos `n open, n planned, n done` (display-only; may be omitted on phones, decision 9), `Edit details` (hidden when archived).
- `Notes`: rendered Markdown (HTML escaped), placeholder `No notes yet. Collect exam topics, formulas or links here.`; edit hidden when archived.
- `Todos` section: quick add preset to Uni aspect + this class with a Type choice (default OTH), shown only if not archived and a Uni aspect is set; groups `Open`, `Planned`, `Done` (collapsed, newest completion first); each todo shows its type (LEC/EXC/OTH) and revised status `Not revised` / `Revised today` / `Revised yesterday` / `Revised <n> days ago`. Empty: `No todos for this class yet. Add one above.`
- `Recurring`: rules linked to this class (title, type, `Daily` or `Weekly, Mon, Tue...`) with link `Edit in Recurring` (/recurring); empty `No recurring rules for this class.`
- `Delete class` control.

**Actions**
- `Edit details` form (same fields as class creation) -> `?/update`; per-field errors as on `/uni`; archived -> `This semester is archived and read-only.` (409); name/other 400. Success closes the form.
- Notes edit -> `?/notes` (blocked with `archived` in read-only semesters).
- Revised: per todo `Revised today` (posts date = today) and a clear control (`Clear revised date`) -> `?/revised` (todoId, date; empty date clears). Only class-linked todos; refused for archived (409). `Revised today` hidden when already today.
- QuickAdd creates a backlog todo with the Uni aspect, this class, a type (default OTH), due date and priority.
- Todos: shared todo actions (edit, status, plan to sprint) unless archived (read-only todos: no editor, no done/status control, no day picker, no sprint actions).
- `Delete class` -> confirm `Delete <name>?` / `This deletes its <n> todo(s) and <m> recurring rule(s). This can’t be undone.` or `It has no todos or recurring rules. This can’t be undone.` / `Delete class` -> `?/delete`, redirect 303 to `/uni`. Still available when archived.

**States**
- Empty: Applies - no notes / no todos / no rules / no metadata placeholders as above.
- Loading: N/A - server load.
- Error: Applies - unknown id -> 404 `+error.svelte`: title `Class not found`, `This class doesn’t exist, or it was deleted.` + link `Uni`; non-404: `Something went wrong loading this class.` + same link. Form errors at their fields.
- Single item: Applies - one todo.
- Many items: Applies - full lists, no paging.
- Overlong text: Applies - notes never truncated; names and links shown in full.
- Archived: Applies - all edit controls removed, delete stays.

**Keyboard & touch**
- Edit form closes on `Escape` and on dismissing outside it; notes field autofocuses; exam time disabled until a date. No drag.

**Serves jobs**
- Keep class info (lecturer, room, exam, links, grade)
- Capture and plan class todos
- Track revision recency
- Open class notes
- Remove a class

**Redirects/guards**
- Unknown id -> 404. After delete -> `/uni`. No aspects -> `/welcome`. Archived semester -> read-only.

### /calendar

Month view of dated work. Read-only except opening a todo for editing; nothing here creates items.

**Data shown**
- Heading `Calendar`; month heading (`October 2026`, English month name + year); controls `Previous month`, `Today`, `Next month` (as links).
- Month of whole weeks, Monday to Sunday, weekday labels `Mon`..`Sun` (current UI exposes it as group `Month grid`). Days outside the shown month are disabled and carry no entries. Today is identified.
- Per day: day number, a preview of up to 3 entries (current UI: titles on wider screens, one mark per entry on phones), then an overflow indicator (`+n more` with titles, `+` with marks), plus accessible text `<n> planned`. The selected day has `aria-pressed="true"`. A due indicator (accessible name `<n> due`) shows the count of open due todos for that day and does not count against the 3 previewed entries.
- Selected-day list: heading `Fri 9 Oct` style date; optional `Due` section (each with todo title + aspect name; open todos only, any day incl. past, backlog or sprint, sorted by title case-insensitively); then entries of kind `todo` | `projection` | `exam`, each with title, slot (`all day`, `18:00`, `18:00–19:30`) and tag: projection = `Projected` (accessible text), exam = `Exam` or `Exam · <room>`. Done todos stay listed in their done state.
- Entry sources (see Entity notes): todos with an explicit `day`, projected recurring occurrences, exams. Due dates are NOT entries; sprint todos without an explicit day are not entries.
- Ordering within a day: all-day first, then timed by start time, ties by title.
- Selected day defaults to today if it is in the shown month, else the 1st. The selected day's list must be reachable together with the month on every screen size (current UI: after the month on phones, titled `Day list` beside it on wider screens).

**Actions**
- Month navigation via `?month=YYYY-MM` URL (link navigation, deep-linkable). `Today` = current month with today selected. Missing/invalid `month` (`2026-13`, `foo`, `2026-1`) silently falls back to the current month; no error.
- Activate an enabled day: selects it (client-side, no reload). Changing month (or `Today`) resets the selection to the default; a save from the day list keeps the selection.
- Todo entry (button): opens the TodoEditor for that todo (same editor as elsewhere: edit, planned date, slot, delete with confirm). After save the calendar reflects the new day (or drops it). Editor rules/errors live with the todo spec, not here.
- Projection entry (link): navigates to `/recurring#rule-<id>`.
- Exam entry (link): navigates to `/uni/classes/<id>`.
- No server actions (load only: `calendarMonth(db, month, today)`).

**States**
- Empty (day): `Nothing planned` when the day has no entries and no due todos. Day with only due todos: Due section shown, no empty text. Applies.
- Empty (whole month): month still shown, day list reads `Nothing planned`. Applies.
- Loading: N/A (server-rendered; month change is a navigation).
- Error: N/A for bad input (falls back); no error UI.
- Single item: Applies (one previewed entry).
- Many items: Applies: >3 per day collapses into the overflow indicator (`+2 more` / `+`); full list in day list.
- Overlong text: previewed titles may be shortened; full titles in the day list. No horizontal page scroll at 375 px width.

**Keyboard & touch**
- Days are real buttons (Tab/Enter/Space); disabled outside-month days are skipped. Month controls are links. Todo entries are buttons, projection and exam entries are links. Touch: tapping a day updates the day list. No drag on this page. No page-specific shortcuts.

**Serves jobs**
- See what is planned on which day; spot due deadlines; spot exams and projected recurring work; jump to a todo/rule/class; deep-link to a month.

**Redirects/guards**
- Global: no aspects yet redirects to `/welcome` (303).

### /sync

Status and control page for the Proton sync (see "Sync ritual"). Page title `Proton sync`, subtitle `Planned todos, recurring rules and exams, pushed to Proton Calendar.`

**Data shown**
- State: `Off` | `Up to date` | `Syncing…` | `Re-login needed` | `Error` (the last two flagged as needing attention).
- `Last sync`: Europe/Berlin, `en-GB` medium date + short time (e.g. `18 Oct 2026, 14:05`), or `Never`.
- `Pending changes`: number of calls a pass would make now.
- Last error text if any.
- In `Re-login needed`: `Run this on the server, then press Sync now:` and the command `proton account login --profile <profile>` (copyable as text).
- `Failed items` list: item label + its error line.
- Note: `Sync only writes to Proton. Renaming or recolouring an aspect doesn't change its Proton calendar, and edits made in Proton aren't read back; Resync all restores this app's state.`
- When Off: only a notice: `Sync is off. Set PROTON_CLI to the path of the proton binary and restart the app to turn it on. PROTON_PROFILE picks the login profile and defaults to default.` No state rows, no buttons, no note.

**Actions**
- `Sync now` (form action `?/syncNow`): starts a pass immediately (retries failed items, clears any pause/backoff). Returns at once; the pass runs in the background.
- `Resync all` (form action `?/resyncAll`): forgets all stored hashes, re-pushes every item (recreating events missing in Proton), then syncs.
- Both buttons are disabled while state is `Syncing…`. Both use progressive enhancement. No validation or error returns; failures surface as state/last error/failed items.
- While `Syncing…` the page re-fetches its data every 2 s until the state changes.

**States**
- Empty: no failed items = no `Failed items` section; no error = no error block; `Never` for last sync. Applies.
- Loading: `Syncing…` with polling and disabled buttons. Applies.
- Error: `Error` / `Re-login needed` states with message. Applies.
- Off: described above. Applies.
- Single / many failed items: Applies (list grows; no paging).
- Overlong text: labels and errors wrap. Applies.

**Keyboard & touch**
- Plain form buttons; fully usable at 375 px width and by touch. No shortcuts.

**Serves jobs**
- Check that calendar sync is healthy; recover from expired session; force a sync or full re-push; see what failed.

**Redirects/guards**
- No aspects yet redirects to `/welcome`. In the nav, `/sync` is the only current entry when open. Reachable from the primary navigation and from `/menu` as its own entry, separate from the eight lists.

### /menu

Navigation hub (the phone's home list): the list of destinations. Static page, no server load of its own (nav data comes from the root layout load).

**Data shown**
- Title `Life Manager`; the eight lists in fixed order: `Today` (`/`), `Sprint`, `Calendar`, `Backlog`, `Recurring`, `Projects`, `Uni`, `Aspects`, each with a count where defined (Calendar has none): Today shows open todos for today, but while anything is overdue it shows the overdue count instead, flagged late; Sprint = open todos in the active sprint; Backlog = backlog size; Recurring = rules; Projects = active projects; Uni = open class todos; Aspects = aspect count. A count of 0 is not shown.
- A separate `Proton sync` entry (to `/sync`), apart from the lists, with the `Needs attention` marker when sync state is `Re-login needed` or `Error`.
- Page title tag: `Lists · Life Manager`. No `New todo` button here.

**Actions**
- Each entry navigates to its screen. No forms.

**States**
- Empty: counts hidden at 0. Applies. Loading / error: N/A. Single/many/overlong: N/A (fixed list).

**Keyboard & touch**
- Links; touch is the primary context.

**Serves jobs**
- Navigate between lists on a phone (the hub every screen's `Lists` back link returns to).

**Redirects/guards**
- No aspects yet redirects to `/welcome`. On wide screens (where the persistent primary navigation is shown) `/menu` redirects to `/` (decision 12). The redirect is decided in the browser from the screen width, since the server cannot know it; a replace, not a history entry, so Back does not loop. Without script the hub is shown at any width. Pending server/data change: none; small client-side change before the redesign.

### /healthz

Non-UI endpoint. `GET /healthz` runs a trivial query on the SQLite database and returns `200` with body `ok` when the app is up and the database open; if the database is unusable the request fails (5xx). No auth, no HTML. Not a navigation target.

## 6. Cross-cutting behavior

### Navigation between routes

- **Destinations.** Eight lists, in this fixed order everywhere: Today `/`, Sprint `/sprint`, Calendar `/calendar`, Backlog `/backlog`, Recurring `/recurring`, Projects `/projects`, Uni `/uni`, Aspects `/aspects`. Outside the lists: Proton sync `/sync`, Lists hub `/menu`, onboarding `/welcome`. Per-aspect pages `/aspects/<id>` are reached from the aspects list and, on wide screens, from per-aspect links in the primary navigation.
- **Wide screens: persistent primary navigation** (landmark `navigation` named `Main`). Contains: home link to `/`; `New todo` action (only once at least one aspect exists; opens a quick add in a dialog titled `New todo` whose default target is the backlog with no day; a planned day inside the active sprint's week sends it into the sprint instead, and the dialog states the destination live as `Goes to this sprint` / `Goes to the backlog`; it closes after adding; Cancel/Escape adds nothing); the eight lists with counts; then one link per aspect (list named `Aspects`) with its backlog count; then `Proton sync` (with the `Needs attention` indicator). All routes are directly reachable; `/menu` is not needed and, when opened on a wide screen, redirects to `/`.
- **Phones: hub navigation.** No persistent primary navigation. `/menu` is the hub (landmark `navigation` named `Lists`): pick a list, drill in; every list-type page offers a `Lists` back link (to `/menu`). Aspect pages are reached through `/aspects`, `/sync` through its own entry on `/menu`. No global `New todo` action on phones; adding happens within pages.
- **Active-state semantics.** A list is current when the path equals its href or starts with `<href>/` (Today only on exactly `/`; Calendar also with `?month=`; Projects also on project detail; Uni also on class detail; Sprint also on plan/review sub-pages). On an aspect page `/aspects/<id>` that aspect's own link is current and `Aspects` is not. On `/sync` only the sync link is current. Current is exposed as `aria-current="page"`.
- **Counts.** Today count = open todos today, replaced by overdue count (flagged late) when any overdue; others as listed under `/menu`; counts hidden at 0.
- **Secondary context per page.** Several pages have secondary content beside their main list: Sprint (backlog access), Today (sprint progress per aspect), aspect page (details), project detail (details), Uni (Uni-aspect line), class detail (details), Calendar (selected day's list). Every action and decision in it must be reachable on every screen size; where it lives is a design decision. Display-only secondary data may be omitted on phones (section 1, phone principle). In the current UI it is exposed as a complementary landmark named by its title (for example `This sprint`, `Day list`).
- **Backlog access behavior** (used on Sprint and Plan): optional filter `Filter backlog` (case-insensitive title substring) shown when the backlog is non-empty; empty backlog = `The backlog is empty.` + link `Open Backlog`; no match = `No backlog todo matches`. Todos grouped per aspect with a backlog count (and sprint progress where known); each group collapsible (heading button with `aria-expanded`), collapsed set remembered per browser (localStorage `lm:rail-collapsed`, best effort). When adding is allowed each todo has an add button `<addLabel>: <title>` (default `Add to sprint`) posting to the page's add action; error `The sprint needs its review first.` + link `Review` for `review-required`, otherwise `That didn’t work. Reload and try again.`; a `not-found` (moved in another tab) silently reloads. Todos are draggable on hover + fine-pointer devices and the backlog is a drop target for sprint todos returned to it (non-recurring only).
- **Page transitions**: navigation cross-fades unless reduced motion is on (progressive; no behavior change).

### Persistence

- One SQLite file (`node:sqlite`): `DATABASE_PATH`, default `./data/life-manager.db`; directory auto-created; WAL journal; foreign keys on.
- Migrations: append-only list, `PRAGMA user_version` = number applied, run in a transaction at start; a failing migration aborts the process with a non-zero exit. Tables: aspects, sprints, recurring_rules, todos, checklist_items, it_projects, settings, semesters, classes, proton_calendars, proton_items (plus columns for project/class/type/revised/slot added by later migrations).
- Settings key/value store holds e.g. `proton_last_sync_at` and the Uni/IT aspect ids.
- Data survives restarts. All writes are server-side form actions; the browser stores only conveniences (collapsed backlog groups).
- Test-only note: with `LM_TEST=1`, `/__test/reset|seed|clock|proton` wipe/seed the DB, fake the clock and drive the sync; without it they return 404. Not a user feature.

### Markdown rendering

- `renderMarkdown` (marked, synchronous) renders notes/descriptions: standard CommonMark/GFM block and inline syntax (headings, lists, emphasis, code, links, images, quotes, tables as marked supports).
- Sanitising: raw HTML in the source (block or inline) is HTML-escaped and shown as literal text, never injected. Link and image URLs allow only relative refs, `http`, `https`, `mailto`; any other scheme (`javascript:` etc., including entity/whitespace/control-character obfuscations) is blanked to an empty href.

### Date handling

- Week starts Monday; weeks are Mon-Sun. Sunday is the review day: `targetWeek(today)` on a Sunday is the following week.
- Timezone: all "today" and sprint/review/due logic is Europe/Berlin calendar date; dates are `YYYY-MM-DD` strings (IsoDate), times `HH:MM` 24 h, month `YYYY-MM`. Day arithmetic is timezone-free (DST cannot shift a boundary). Proton events are sent with the Europe/Berlin zone.
- Review state of the active sprint week: `running` (before Sunday), `review-available` (on Sunday), `review-required` (after Sunday).
- Display formats (English, `en-GB`): `Fri 9 Oct` (date), `Mon 6` (day), `Mon 5 – Sun 11 Oct` or `Mon 28 Sep – Sun 4 Oct` (week), month heading `October 2026`; relative due labels `Today`, `Tomorrow`, `4d left`, `2d late`; slots `all day`, `18:00`, `18:00–19:30`.
- Slot validation: `HH:MM` 00:00-23:59; errors `invalid`, `end-without-start`, `end-before-start` (end must be after start, same day).
- Clock source is the server's clock (test override only under `LM_TEST=1`).

### Shortcuts

- No global keyboard shortcuts. Local keys: `Escape` closes open menus (row action menus, project status menu, semester menu, aspect menu), the todo editor (not while its delete confirmation is open) and the quick add; `Enter` in quick-add/editor title and checklist fields submits/adds (checklist field key handling in quick-add). Clicking outside closes row menus.

### Toasts and feedback

- Single toast type (`role="status"`, auto-dismiss after 5 s, optional action button): used when removing a todo from a sprint: `Removed “<title>” from the sprint` with `Undo`; the removal is posted when the toast expires or the user leaves the page; Undo cancels it.
- Otherwise feedback is in place: field errors in forms, `role="alert"` messages next to the failed action, status text on `/sync`. No success toasts; successful actions just update the lists after reload/invalidation.

### Drag and drop

- Todo rows are draggable (payload id, source `backlog` | `sprint`, recurring flag) only on devices with hover + fine pointer; on touch drag is disabled entirely.
- Drop zones: sprint areas accept backlog todos (add to sprint / plan to a day), the backlog accepts non-recurring sprint todos (return to backlog); each zone declares what it accepts and signals when a valid drag is over it.
- Every drag has a non-drag alternative (required): the per-row `Add to sprint: <title>` button and row action menus (move to backlog), status selects, day pickers and planning pull buttons. A touch-only user can run the whole sprint ritual without drag.

### Confirmations

- Confirmation dialogs (title, message, `Cancel`, primary confirm) exist for: delete todo (`Delete this todo?`, `Delete todo`), delete rule (`Delete “<title>”?`, `Delete rule`; "It stops repeating. Todos it already added to a sprint stay."), delete project (`Delete project?`, `Delete project`), mark project implemented (`Mark as implemented?`, notes open linked todos stay), delete class (`Delete <name>?`, `Delete class`), archive semester (`Archive <name>?`, `Mark <n> done and archive`; semester becomes read-only), delete semester (`Delete <name>?`, `Delete semester`), delete aspect (`Delete <name>?`, `Delete aspect` or `Move <n> and delete`: its todos move to a target aspect), change IT aspect (`Change the IT aspect?`, `Change aspect`; links lose project link), change Uni aspect (`Use <name> for classes?`, `Remove <n> link(s) and change`).
- Removing a todo from a sprint is not confirmed; it uses the undo toast. "Sync now"/"Resync all" are not confirmed.

### Error pages

- No custom error page (decision 10): unknown routes and uncaught errors show the framework default. Form validation errors are returned to the form and rendered inline (HTTP 400 `fail`), not as error pages. A form post whose origin check fails is rejected with HTTP 403 (see runtime).
- Bad `?month=` never errors. `/__test/*` returns 404 outside test mode.

### Offline / runtime facts

- Server-rendered SvelteKit app (adapter-node, `node build`); needs the server and its SQLite file; no offline mode, no service worker; the client only enhances forms and polls `/sync` while syncing.
- Env: `PORT` (default 3000), `DATABASE_PATH`, `PROTOCOL_HEADER`/`HOST_HEADER` (behind a proxy; e.g. `x-forwarded-proto`), `PROTON_CLI`, `PROTON_PROFILE` (default `default`), `LM_TEST` (tests only). `ORIGIN` may be set when opened at a fixed URL.
- Form posts are protected by SvelteKit's origin check: if the app thinks it is on `https` but is opened over plain http (no protocol header), every non-GET form post gets 403 and the app is effectively read-only (pages still load). This is a deployment requirement, documented in the README (set `PROTOCOL_HEADER` or `ORIGIN`); the app shows no warning for it (decision 11).
- `GET /healthz` = 200 `ok` when up and DB open. Data persists across restarts. Migration failure stops the process (non-zero exit).
- Every non-GET request also nudges the Proton sync debounce (see Sync ritual).
- Single-user; no authentication.

## 7. Copy list

Every UI string the e2e suite (`e2e/*.test.ts`, `e2e/helpers.ts`) matches by `getByText`, `getByRole` name, `getByLabel`, `toHaveText`, `toContainText`, `toHaveTitle` or `aria-label`, verified against `src/`. Finding: all current copy is already English (`<html lang="en">`, `Intl` formatters use `en-GB`), so every target equals the current string and the redesign must not change it. Spec files are short names without `.test.ts`. Where the e2e only matches a fragment or a regex, the regex source is shown and the row names the full string. `{x}` marks a runtime value. The spec column lists only usages where the string is asserted as UI copy; a spec that merely seeds the same word as user data (for example an aspect named `Uni`) or reads it as fixture data is not listed (decision 14). Copy that names a position (`below`, `above`) may be reworded to fit the new layout (decision 16); every other string stays as listed. German seeded data is user content, not UI copy (decision 13).

Excluded: seeded fixture data that is user content, not copy (aspect, project, class, semester and todo names, and Markdown typed into notes, such as `Ideas`, `Reading`, `Sheet 4`, `Health`, `Gym`, `Analysis II`, `Book a physio appointment`, repo slugs, notes text). It includes German-language user data that must survive unchanged: `Prof. Kühn`, `Studienplan`, `Netzsicherheit`, `Hörsaal 1 im Hauptgebäude, Erdgeschoss` (uni, uni-journey, class-detail, responsive). Date, weekday and month tokens follow `en-GB` short/long formats and must keep that locale.

**Shell, navigation and landmarks**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Main | Main | aspects, journey, motion, navigation, proton-nav | EN |
| Lists | Lists | journey, navigation, proton-nav, responsive | EN |
| Today | Today | calendar, journey, motion, today, uni-journey | EN |
| Sprint | Sprint | journey, motion, uni-journey | EN |
| Calendar | Calendar | calendar, navigation, plan-ahead, todo-planning | EN |
| Backlog | Backlog | journey, motion, plan-ahead, project-detail, proton-sync, row-actions, todo-planning, uni-journey | EN |
| Recurring | Recurring | journey, navigation | EN |
| Projects | Projects | motion, navigation, project-detail | EN |
| Uni | Uni | class-detail, motion, navigation, responsive, uni-journey, uni-sprint-todos | EN |
| Aspects | Aspects | aspect-page, journey | EN |
| Proton sync | Proton sync | proton-nav, proton-page | EN |
| Needs attention | Needs attention | proton-nav | EN |
| Sprint view | Sprint view | journey, motion, plan-ahead, responsive, sprint-rail, sprint-views | EN |
| Board | Board | motion, responsive, sprint-rail, sprint-views | EN |
| Days | Days | journey, responsive, sprint-views | EN |
| Week | Week | journey, plan-ahead, responsive, sprint-views | EN |
| By aspect | By aspect | sprint-views | EN |

**Generic actions and form labels**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Save | Save | aspects, class-detail, plan-ahead, project-detail, proton-sync, todo-planning, todos, uni | EN |
| Cancel | Cancel | class-detail, project-detail, recurring, todo-classes, todo-projects, todos, uni | EN |
| Close | Close | journey, sprint-rail | EN |
| Delete | Delete | proton-sync, todos | EN |
| Undo | Undo | row-actions | EN |
| Add todo | Add todo | aspect-page, class-detail, journey, navigation, project-journey, proton-nudge, sprint-views, today, todo-classes, todo-planning, todo-projects, todos, uni-journey | EN |
| Add a todo | Add a todo | aspect-page, backlog, class-detail, journey, project-journey, proton-nudge, sprint-views, today, todo-classes, todo-planning, todo-projects, todos, uni-journey | EN |
| New todo | New todo | aspect-page, backlog, class-detail, journey, navigation, project-journey, proton-nudge, sprint-views, today, todo-classes, todo-planning, todo-projects, todos, uni-journey | EN |
| Edit todo | Edit todo | calendar, class-detail, plan-ahead, proton-sync, todo-classes, todo-planning, todo-projects, todos | EN |
| Edit details | Edit details | class-detail, project-detail, proton-sync | EN |
| Edit notes | Edit notes | class-detail, project-detail, uni | EN |
| Notes | Notes | class-detail, project-detail, uni | EN |
| Name | Name | aspects, class-detail, project-detail, projects, uni | EN |
| Title | Title | aspect-page, backlog, calendar, class-detail, journey, navigation, project-journey, proton-nudge, proton-sync, recurring, recurring-classes, sprint-views, today, todo-classes, todo-planning, todo-projects, todos, uni-journey | EN |
| Description | Description | project-detail, todos | EN |
| Due date | Due date | class-detail, journey, proton-sync, todos | EN |
| Aspect | Aspect | class-detail, journey, navigation, project-journey, sprint-views, todo-classes, todo-projects, todos | EN |
| Priority | Priority | todos | EN |
| Status | Status | backlog, responsive, sprint-views, today | EN |
| Project | Project | project-journey, todo-projects | EN |
| Class | Class | class-detail, recurring-classes, todo-classes, uni-journey | EN |
| Day | Day | journey, project-journey, responsive, sprint-views, todo-planning, uni-journey | EN |
| From | From | plan-ahead, proton-sync, recurring, todo-planning | EN |
| To | To | plan-ahead, proton-sync, recurring, todo-planning | EN |
| Planned | Planned | backlog, plan-ahead, proton-sync, today, todo-planning | EN |
| Tags | Tags | project-detail | EN |
| Checklist | Checklist | todos | EN |
| New checklist item | New checklist item | todos | EN |
| Pick a day | Pick a day | row-actions, todo-planning | EN |
| Filter by aspect | Filter by aspect | backlog | EN |
| All | All | backlog | EN |
| Priority {n} | Priority {n} | todos | EN |
| Checklist item {n} | Checklist item {n} | recurring, todos | EN |
| Delete item: {text} | Delete item: {text} | todos | EN |
| Done: {title} | Done: {title} | journey, project-journey, proton-sync, responsive, sprint-views, today, uni-journey | EN |
| Delete this todo? | Delete this todo? | proton-sync, todos | EN |
| Delete todo | Delete todo | proton-sync, todos | EN |

**Today**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Plan your week | Plan your week | planning, today | EN |
| Continue planning | Continue planning | today | EN |
| Review the sprint | Review the sprint | today | EN |
| Review it | Review it | journey, today | EN |
| Nothing planned for today. | Nothing planned for today. | today | EN |
| open today | open today | today | EN |
| Sprint 3 / 9 done · 3 days left | Sprint 3 / 9 done · 3 days left | today | EN |
| week view | week view | today | EN |
| Remove plan | Remove plan | today, todo-planning | EN |
| Overdue (regex /Overdue/) | Overdue (regex /Overdue/) | today | EN |
| {n} / {m} (regex /0 \/ 1/,  /1 \/ 2/) | {n} / {m} (regex /0 \/ 1/,  /1 \/ 2/) | today | EN |

**Backlog and todo rows**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Your backlog is empty. | Your backlog is empty. | backlog | EN |
| The sprint needs its review first. | The sprint needs its review first. | backlog | EN |
| Overdue,  3d late | Overdue,  3d late | backlog | EN |
| 2d late | 2d late | todos | EN |
| 2d left | 2d left | backlog, todo-planning, todos | EN |
| 16d left | 16d left | todo-planning | EN |
| Move to backlog | Move to backlog | aspect-page, journey, row-actions, sprint-views | EN |
| Remove from sprint | Remove from sprint | row-actions | EN |
| Back to backlog | Back to backlog | journey, responsive, review | EN |
| Goes to this sprint | Goes to this sprint | todo-planning | EN |
| Goes to the backlog | Goes to the backlog | todo-planning | EN |
| Status: Doing | Status: Doing | row-actions | EN |
| Status: To do | Status: To do | row-actions | EN |
| Doing | Doing | sprint-views | EN |
| Review | Review | backlog | EN |
| Add to sprint: {title} | Add to sprint: {title} | aspect-page, backlog, journey, planning, project-journey, responsive, sprint-rail, today, uni-journey | EN |
| Add to sprint (regex prefix matches: /Add to sprint/,  /^Add to sprint/,  /^Add to sprint: /) | Add to sprint (regex prefix matches: /Add to sprint/,  /^Add to sprint/,  /^Add to sprint: /) | aspect-page, backlog, sprint-rail | EN |
| Backlog (regex /Backlog/) | Backlog (regex /Backlog/) | row-actions | EN |
| /backlog/i (case-insensitive) | /backlog/i (case-insensitive) | sprint-views | EN |
| /review/i | /review/i | aspect-page, backlog | EN |
| /start/i | /start/i | sprint-views | EN |

**Sprint planning, board and backlog access**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Start sprint | Start sprint | planning, recurring-classes, sprint-views | EN |
| Joins automatically | Joins automatically | plan-ahead, planning | EN |
| Due this week | Due this week | planning | EN |
| Mon 12 – Sun 18 Oct | Mon 12 – Sun 18 Oct | journey, sprint-hero, today | EN |
| Mon 5 – Sun 11 Oct | Mon 5 – Sun 11 Oct | planning | EN |
| Mon 2 – Sun 8 Nov | Mon 2 – Sun 8 Nov | plan-ahead | EN |
| 3 days left | 3 days left | sprint-hero | EN |
| done | done | sprint-hero | EN |
| 4 / 12 | 4 / 12 | sprint-hero | EN |
| 1 / 2 | 1 / 2 | aspect-page, sprint-rail | EN |
| 1 / 3 | 1 / 3 | aspect-page, sprint-rail | EN |
| Manage | Manage | sprint-rail | EN |
| The backlog is empty. | The backlog is empty. | sprint-rail | EN |
| No backlog todo matches | No backlog todo matches | sprint-rail | EN |
| Unscheduled | Unscheduled | journey, responsive, sprint-views | EN |
| Done | Done | review | EN |
| Start sprint with {n} todo(s) | Start sprint with {n} todo(s) | journey, planning, responsive, review | EN |
| Start sprint (regex /^Start sprint/) | Start sprint (regex /^Start sprint/) | plan-ahead, proton-sync | EN |
| Include: {title} | Include: {title} | planning | EN |
| Include prefix regexes (/Include:/,  /Remove from sprint:\|Add to sprint:\|Include:/) | Include prefix regexes (/Include:/,  /Remove from sprint:\|Add to sprint:\|Include:/) | planning | EN |
| Thu 8 / Tue 6 / Wed 7 / Fri 9 day picker entry names ({weekday} {d}) | Thu 8 / Tue 6 / Wed 7 / Fri 9 day picker entry names ({weekday} {d}) | journey, responsive, sprint-views | EN |

**Sprint review and close**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Review your sprint | Review your sprint | review | EN |
| Carry over | Carry over | review | EN |
| Drop | Drop | journey, review | EN |
| Close sprint | Close sprint | review, today | EN |
| Done 1 | Done 1 | journey, review | EN |
| All 2 done. Nice week. | All 2 done. Nice week. | review | EN |
| Carry {n}[,  return {n}][,  drop {n}] and close | Carry {n}[,  return {n}][,  drop {n}] and close | journey, responsive, review | EN |
| /close/i | /close/i | responsive | EN |

**Calendar and planning (time)**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Previous month | Previous month | calendar | EN |
| Next month | Next month | calendar | EN |
| Nothing planned | Nothing planned | calendar | EN |
| all day | all day | calendar | EN |
| Projected | Projected | calendar | EN |
| + | + | calendar | EN |
| +2 more | +2 more | calendar | EN |
| September 2026 | September 2026 | calendar | EN |
| October 2026 | October 2026 | calendar | EN |
| November 2026 | November 2026 | calendar | EN |
| February 2027 | February 2027 | calendar | EN |
| Add time | Add time | todo-planning | EN |
| 1h | 1h | todo-planning | EN |
| 2h | 2h | todo-planning | EN |
| Add a todo to Thu 15 | Add a todo to Thu 15 | todo-planning | EN |
| 1 h 30 min | 1 h 30 min | todo-planning | EN |
| 2 h | 2 h | todo-planning | EN |
| A recurring todo stays in its sprint’s week. Pick a day of that week. | A recurring todo stays in its sprint’s week. Pick a day of that week. | todo-planning | EN |
| {Weekday} {d} {Mon} · {HH:MM}[–{HH:MM}] (planned-time label) | {Weekday} {d} {Mon} · {HH:MM}[–{HH:MM}] (planned-time label) | class-detail, plan-actions, plan-ahead, todo-planning, uni, uni-sprint-todos | EN |
| {HH:MM}–{HH:MM} (time range) | {HH:MM}–{HH:MM} (time range) | calendar, plan-ahead, proton-sync, recurring, todo-planning | EN |
| Plan (regex /Plan/) | Plan (regex /Plan/) | aspect-page | EN |
| /21 Oct/ | /21 Oct/ | plan-ahead | EN |

**Recurring rules**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| New rule | New rule | journey, recurring, recurring-classes | EN |
| Add rule | Add rule | journey, recurring, recurring-classes | EN |
| Edit rule | Edit rule | proton-sync, recurring, recurring-classes | EN |
| Save rule | Save rule | proton-sync, recurring, recurring-classes | EN |
| Delete rule | Delete rule | recurring | EN |
| No recurring rules yet. | No recurring rules yet. | recurring | EN |
| Pick at least one day. | Pick at least one day. | recurring | EN |
| Monday | Monday | recurring | EN |
| Tuesday | Tuesday | journey, recurring-classes | EN |
| Thursday | Thursday | journey, recurring | EN |
| Saturday | Saturday | recurring | EN |
| Edit in Recurring | Edit in Recurring | class-detail | EN |
| Delete “{title}”? | Delete “{title}”? | recurring | EN |

**Projects**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| New project | New project | projects | EN |
| Add project | Add project | projects | EN |
| Delete project | Delete project | project-detail | EN |
| Mark as implemented | Mark as implemented | project-detail | EN |
| Give the project a name. | Give the project a name. | project-detail, projects | EN |
| Enter a link starting with http:// or https://. | Enter a link starting with http:// or https://. | projects, project-detail (fragment `Enter a link starting with http`) | EN |
| Repository URL | Repository URL | project-detail, projects | EN |
| No open todos | No open todos | projects | EN |
| No notes yet | No notes yet | class-detail, project-detail, uni | EN |
| Active | Active | project-detail | EN |
| Implemented | Implemented | project-detail | EN |
| Created | Created | project-detail | EN |
| Updated | Updated | project-detail | EN |
| Project field | Project field | project-detail | EN |
| Implemented ({n}) / Archived ({n}) | Implemented ({n}) / Archived ({n}) | motion, projects, uni | EN |
| {n} open | {n} open | project-detail, projects, uni | EN |
| {n} todos | {n} todos | aspects, class-detail, projects | EN |
| {n} linked todos are still open | {n} linked todos are still open | project-detail | EN |
| {n} linked todos will be unlinked [and kept.] | {n} linked todos will be unlinked [and kept.] | project-detail | EN |
| Status label regexes (/Active/,  /Done/) | Status label regexes (/Active/,  /Done/) | class-detail, project-detail, project-journey, projects, uni-journey | EN |
| Change aspect | Change aspect | projects | EN |
| Change {aspect} aspect | Change {aspect} aspect | projects, uni, uni-sprint-todos | EN |
| Use {aspect} for projects / for classes | Use {aspect} for projects / for classes | projects, uni | EN |
| {n} todos or rules are linked ... / Remove {n} links and change (aspect-change confirm) | {n} todos or rules are linked ... / Remove {n} links and change (aspect-change confirm) | uni | EN |

**Uni (semesters and classes)**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| New semester | New semester | uni | EN |
| Add semester | Add semester | uni | EN |
| Delete semester | Delete semester | uni | EN |
| Semester name | Semester name | uni | EN |
| Semester actions | Semester actions | uni | EN |
| Unarchive | Unarchive | uni | EN |
| New class | New class | uni | EN |
| Add class | Add class | uni | EN |
| Delete class | Delete class | class-detail | EN |
| No classes yet. | No classes yet. | uni | EN |
| Class not found | Class not found | class-detail | EN |
| Grade | Grade | class-detail | EN |
| Lecturer | Lecturer | class-detail | EN |
| ECTS | ECTS | class-detail, uni | EN |
| Exam date | Exam date | class-detail, proton-sync | EN |
| Exam time | Exam time | proton-sync | EN |
| Exam today | Exam today | uni | EN |
| Exam topics | Exam topics | class-detail | EN |
| LEC | LEC | class-detail, todo-classes | EN |
| EXC | EXC | class-detail, recurring-classes, todo-classes, uni-journey | EN |
| OTH | OTH | class-detail, todo-classes | EN |
| Not revised | Not revised | class-detail | EN |
| Revised today | Revised today | class-detail | EN |
| No todos for this class yet | No todos for this class yet | class-detail | EN |
| WS 25/26 is archived. This class is read-only. | WS 25/26 is archived. This class is read-only. | class-detail | EN |
| Due next | Due next | uni-sprint-todos | EN |
| This week | This week | uni-sprint-todos | EN |
| Nothing in this week's sprint | Nothing in this week's sprint | uni-sprint-todos | EN |
| Overdue | Overdue | uni-sprint-todos | EN |
| Tomorrow | Tomorrow | uni-sprint-todos | EN |
| Page 1 of 2 | Page 1 of 2 | uni-sprint-todos | EN |
| Page 2 of 2 | Page 2 of 2 | uni-sprint-todos | EN |
| Revised {n} days ago / yesterday | Revised {n} days ago / yesterday | class-detail | EN |
| Exam in {n} d | Exam in {n} d | uni, uni-sprint-todos | EN |
| Revised today: {title} / Clear revised date: {title} (aria-label) | Revised today: {title} / Clear revised date: {title} (aria-label) | class-detail | EN |
| /Revised today/ | /Revised today/ | class-detail | EN |
| Mark {n} done and archive | Mark {n} done and archive | uni | EN |
| Delete {semester}? | Delete {semester}? | uni | EN |
| {n} classes and {n} todos / {n} class todos are still open / {n} todos and rules | {n} classes and {n} todos / {n} class todos are still open / {n} todos and rules | uni | EN |
| {n} ECTS / {n} open / Average — · / Overall average — · | {n} ECTS / {n} open / Average — · / Overall average — · | class-detail, project-detail, projects, uni | EN |
| {class} · {LEC\|EXC\|OTH} (class and type label) | {class} · {LEC\|EXC\|OTH} (class and type label) | recurring-classes, todo-classes, uni-sprint-todos | EN |
| Winter {yy}/{yy} (semester long name) | Winter {yy}/{yy} (semester long name) | uni | EN |
| {n} class(es)/todo(s) (regex /\d+ (class\|todo)/) | {n} class(es)/todo(s) (regex /\d+ (class\|todo)/) | uni | EN |
| {d} Oct\|Today\|Tomorrow\|Yesterday (regex) | {d} Oct\|Today\|Tomorrow\|Yesterday (regex) | uni-sprint-todos | EN |
| Give the todo a title. | Give the todo a title. | todos | EN |
| {done}/{total} (checklist progress) | {done}/{total} (checklist progress) | todos | EN |
| {grade} / {ects} decimal numbers with a point (1.3,  1.7,  2.23,  7.5) | {grade} / {ects} decimal numbers with a point (1.3,  1.7,  2.23,  7.5) | class-detail, uni, uni-journey | EN |
| {n} (bare count: 0,  1,  2,  3,  7,  10) | {n} (bare count: 0,  1,  2,  3,  7,  10) | calendar, class-detail, navigation, project-detail, project-journey, proton-page, sprint-rail, sprint-views, today, uni-journey, uni-sprint-todos | EN |

**Aspects**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| New aspect | New aspect | aspects | EN |
| Edit aspect | Edit aspect | aspects | EN |
| Create aspect | Create aspect | aspects | EN |
| Delete aspect | Delete aspect | aspects | EN |
| Add your own | Add your own | aspects | EN |
| No todos | No todos | aspects | EN |
| Give the aspect a name. | Give the aspect a name. | aspects | EN |
| You already have an aspect with this name. | You already have an aspect with this name. | aspects | EN |
| No sprint running | No sprint running | aspect-page | EN |
| Dumbbell | Dumbbell | aspects | EN |
| Code | Code | uni | EN |
| Sage | Sage | aspect-page | EN |
| Berry | Berry | class-detail, uni | EN |
| Lagoon | Lagoon | aspects | EN |
| Tangerine | Tangerine | aspects | EN |
| Leaf | Leaf | aspects | EN |
| Sky | Sky | aspects | EN |
| 1 in backlog | 1 in backlog | aspect-page | EN |
| Actions for {name} | Actions for {name} | aspects | EN |
| Delete {name}? | Delete {name}? | aspects | EN |
| Continue with {n} aspect(s) | Continue with {n} aspect(s) | aspects, journey | EN |
| Move {n} and delete | Move {n} and delete | aspects | EN |
| Continue (regex /^Continue/) | Continue (regex /^Continue/) | aspects | EN |
| {n} todos (aspect todo count) | {n} todos (aspect todo count) | aspects, projects | EN |
| Edit | Edit | aspects | EN |

**Proton sync page**

| current string | English target | used in spec file | lang |
|---|---|---|---|
| Sync now | Sync now | proton-page | EN |
| Resync all | Resync all | proton-page | EN |
| Up to date | Up to date | proton-page | EN |
| Re-login needed | Re-login needed | proton-page | EN |
| Never | Never | proton-page | EN |
| not logged in | not logged in | proton-page | EN |
| Error: ambiguous local time | Error: ambiguous local time | proton-page | EN |
| proton account login --profile default | proton account login --profile default | proton-page | EN |
| PROTON_CLI | PROTON_CLI | proton-page | EN |
| Proton page explainer (regex /renaming or recolouring/i) | Proton page explainer (regex /renaming or recolouring/i) | proton-page | EN |

**Counts**

- Total UI copy strings (rows): 257
- German strings: 0 (all rows lang EN; German appears only in seeded user data listed above)

## 8. Behavioral data-* allow-list

Rule of the contract: a `data-*` hook is allowed only when it carries state that no role, accessible name, label or ARIA/native state (`aria-current`, `aria-pressed`, `aria-expanded`, `aria-selected`, `aria-checked`, `disabled`, `checked`, `value`) can express on every surface where the state is asserted. Verified against how `src/` sets each attribute and how `e2e/` reads it.

| attribute (name=value pattern) | what it signals | why no role/label covers it | where used (src area / spec) |
|---|---|---|---|
| `html[data-hydrated]` (attribute presence, empty value) | SvelteKit client has hydrated, so form `enhance` and click handlers are attached | Pure lifecycle signal of the document; nothing in the accessibility tree changes when hydration completes | set in `src/routes/+layout.svelte` (`document.documentElement.dataset.hydrated`); waited on by `waitForHydration` in `e2e/helpers.ts`, hence every spec |
| `data-day=<YYYY-MM-DD>` or `""` on `[data-testid="todo-row"]` | the day the todo is placed on (planned day, else due day); empty string means unscheduled | The visible text is a locale-formatted label (`Tue 3 Nov`, or absent); the `Day` combobox renders only when the todo has `sprintDays`. A machine-readable ISO value, and the distinction "no day", has no accessible form in the Week, Board, backlog-access or Today presentations | `TodoRow.svelte` (todo root element, via `shownDay`); sprint-views, today, todo-planning, row-actions, plan-actions, recurring-classes, journey, review, sprint-rail, proton-sync (`:not([data-day=""])`) specs |

**Counts**

- Total `data-testid` in `src/`: 137 occurrences (136 lines, 112 distinct literal values; some are interpolated such as `rail-group-{id}`, `calendar-cell-{day}`). e2e resolves 139 distinct `getByTestId` arguments.
- Total distinct other `data-*` attributes in `src/` before this contract: 17 (`data-collapsed`, `data-color`, `data-day`, `data-dragging`, `data-hydrated` (set via `dataset`), `data-kind`, `data-left-testid`, `data-outside`, `data-over`, `data-overdue`, `data-p`, `data-phase`, `data-rule-id`, `data-status`, `data-sveltekit-preload-data` (framework), `data-todo-id`, `data-type`).
- Allow-listed: 2 (`data-hydrated`, `data-day`); `data-status` was dropped (decision 15). Zero `data-testid` values are allow-listed.

**Rule for everything else.** Plain `data-testid` values exist only to locate elements and are not part of the functional contract; the redesign may drop, rename or move them. Specs for the redesigned UI must locate by role, accessible name, label or visible text (`getByRole`, `getByLabel`, `getByText`, scoped to a landmark such as `navigation` `Lists` or a `dialog`), and assert state through ARIA and native state. The unused styling hooks (`data-over`, `data-dragging`, `data-p`, `data-type`, `data-left-testid`, `data-todo-id`, `data-sveltekit-preload-data`) are implementation detail: no e2e reads them and the contract does not require them. If a new surface needs to assert state that only a `data-*` can carry, add it to this list with its reason before using it in a spec.

**Not allow-listed because an accessible equivalent exists**

- `data-status=todo|doing|done` on `todo-row` (many specs): dropped by decision 15. Every todo presentation exposes the three-state status accessibly (see "Status exposure" under shared todo behavior); assert the status control (`Status: <label>`) or the accessible status text instead.

- `data-phase=none|planning|review-available|review-required` on `sprint-prompt` (today, sprint-views, sprint-rail): assert the prompt's link by name instead: `Plan your week` (`none`), `Continue planning` (`planning`), `Review it` (`review-available`), `Review the sprint` (`review-required`); `running` is the absence of the prompt. The four phases map to distinct link names.
- `data-collapsed=true|false` on `rail-group-{id}` (a backlog aspect group; sprint-rail): the group heading button carries `aria-expanded`; assert that, and the hidden todo list.
- `data-outside=true|false` on `calendar-cell-{day}` (one calendar day; calendar): the day is a `button` that is `disabled` exactly when outside the month, and `aria-pressed` marks the selected day.
- `data-overdue=true|false` on `todo-row` (backlog, todos, today): the todo contains visually hidden text `Overdue,`; assert `toContainText('Overdue')` or its absence.
- `data-kind=projection|exam|todo` on `calendar-entry` (calendar): projected entries contain visually hidden text `Projected`; exam and todo entries differ by link versus button and by their visible content.
- `data-color=<aspect colour token>` on `class-tile` (the class's colour/icon display; class-detail): the saved colour is the checked `radio` (`Berry`) in the class edit form; the display itself carries no accessible state, so a CSS check (`toHaveCSS`) is the fallback, as calendar.test.ts already does for entry colours.
- `data-rule-id` on `rule-row` (one rule on `/recurring`; calendar spec): each rule already has `id="rule-{id}"`, the target of the `/recurring#rule-{id}` link; assert the URL hash and the rule's accessible name.

## 9. Route coverage check

Routes found by listing `src/routes` (directories with a `+page.svelte` or `+server.ts`, excluding `__test*` and `__mockups*`): 18. Contract sections in section 5: 18. Coverage 100%.

| Route | Contract section | Jobs |
|---|---|---|
| `/` | 5 `/` (Today) | J2, J1, J4 |
| `/welcome` | 5 `/welcome`, 4.4 | J13, J7 |
| `/sprint` | 5 `/sprint`, 4.1 | J4 |
| `/sprint/plan` | 5 `/sprint/plan`, 4.2 | J3 |
| `/sprint/review` | 5 `/sprint/review`, 4.3 | J5 |
| `/backlog` | 5 `/backlog` | J6, J1 |
| `/todos` | 5 `/todos` (form actions endpoint shared by todo UI) | J1, J4 |
| `/aspects` | 5 `/aspects` | J7 |
| `/aspects/[id]` | 5 `/aspects/[id]` | J7, J6 |
| `/projects` | 5 `/projects` | J10 |
| `/projects/[id]` | 5 `/projects/[id]` | J10 |
| `/recurring` | 5 `/recurring` | J8 |
| `/uni` | 5 `/uni` | J9 |
| `/uni/classes/[id]` | 5 `/uni/classes/[id]` | J9 |
| `/calendar` | 5 `/calendar` | J11 |
| `/sync` | 5 `/sync`, 4.5 | J12 |
| `/menu` | 5 `/menu` | J14 (navigation to secondary destinations) |
| `/healthz` | 5 `/healthz` (non-UI endpoint) | J14 |

Also covered: the shared shell (`+layout.svelte`) in section 6; framework error pages in section 6 "Error pages".

## 10. Graph notes

- The graph (`graphify-out/graph.json`) did contain file nodes for every user-facing route, but topical queries mostly surfaced noise: the old-look HTML mockups under `design/` and the archived OpenSpec changes under `openspec/changes/archive/` (including requirements that were later superseded). Fix: added `design/` and `openspec/changes/archive/` to `.graphifyignore` and rebuilt, so queries return live source, current specs and tests. `design/` stays on disk and is untouched.
- Route nodes are named by short path (`recurring/+page.svelte`, `uni/+page.svelte`), not by the full `src/routes/...` path; `graphify explain` needs the short name.
- Graph commands resolve `graphify-out` from the current directory; run them from the repo root.
- This contract and `PRODUCT.md` were added to the graph with a final update.

## 11. Gate-1 decisions

Rue's answers to the contract's open questions. Types: contract-only (no code change), server/data (code change before the redesign), UI (built in the redesign). Server/data work is specified in the OpenSpec change `gate-1-decisions`.

| # | question (short) | decision | type |
|---|---|---|---|
| 1 | Project statuses | Keep the code's five (`backlog`, `active`, `in_progress`, `paused`, `implemented`); the it-projects spec is updated to five | contract-only (spec text only) |
| 2 | `/welcome`: presets that already exist | Disabled and marked as existing; no silent duplicate error | server/data (`/welcome` load reports existing presets; action skips them) and UI (disabled and marked state) |
| 3 | Archived-semester todos: delete | Delete stays allowed | contract-only |
| 4 | `/backlog?aspect=<non-numeric>` | Show an empty filtered list | server/data (strict parameter parsing) |
| 5 | Sprint started mid-week: recurring instances for past weekdays | Keep creating them | contract-only |
| 6 | Review `Carry over`: status | Keep the todo's status | contract-only |
| 7 | Recurring rule form: Class/Type without active classes | Stay hidden | contract-only |
| 8 | Aspect order | Manually reorderable, with a non-drag path | server/data (reorder action; position column exists) and UI (reorder interaction) |
| 9 | Wide-screen-only data on phones | Not required; phone is its own UI and may omit secondary data (principle in section 1 and `PRODUCT.md`) | contract-only (design principle) |
| 10 | Unknown routes and uncaught errors | Keep the framework default error page | contract-only |
| 11 | Plain-http 403 without `PROTOCOL_HEADER`/`ORIGIN` | Deployment requirement documented in the README only; no in-app warning | server/data (README text only, no app code) |
| 12 | `/menu` on wide screens | Redirects to `/` (decided in the browser from screen width) | server/data (small client-side redirect before the redesign) |
| 13 | Seeded German data | Confirmed as user content, not UI copy | contract-only |
| 14 | Copy list "used in spec file" | Only usages where the string is asserted as UI copy; rule stated at the top of section 7 | contract-only |
| 15 | `data-status` | Replaced by an accessible three-state status on every todo presentation; dropped from the allow-list | UI (accessible status built in the redesign) |
| 16 | Copy that names a position | May be reworded to fit the new layout | contract-only |
