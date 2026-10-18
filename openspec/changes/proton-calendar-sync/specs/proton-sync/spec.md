## ADDED Requirements

### Requirement: Sync state storage
The app SHALL keep its Proton sync state in migration 6, which only adds tables: per synced item (key `todo:<id>`,
`rule:<id>` or `exam:<classId>`) its event ref `<calendarId>/<eventId>` (stored whole, as `proton` returned it), the
calendar ID it lives in, the hash of the last pushed event content, a label and the last item error; per aspect its
Proton calendar ID. The hash SHALL cover exactly the event content sent to Proton (title, description, location, date,
start, end, duration, recurrence, excluded days), not the aspect or calendar. `resetDb()` SHALL clear both tables. (S1)

#### Scenario: Migration 6 adds the sync tables without touching existing data
- **WHEN** a database at `user_version` 5 with rows in every existing table is opened
- **THEN** `proton_items` and `proton_calendars` exist and are empty, `user_version` equals `migrations.length`, and every pre-existing row reads back unchanged
- **proof:** unit

#### Scenario: Reset clears the sync tables
- **WHEN** `proton_items` and `proton_calendars` hold rows and `resetDb()` runs
- **THEN** both tables are empty
- **proof:** unit

#### Scenario: Hash covers exactly the pushed event content
- **WHEN** two event specs are hashed that are equal, and then specs that differ in exactly one of title, description, location, date, start, end, duration, recurrence or excluded days
- **THEN** equal specs give the same hash, every single-field difference gives a different hash, and the hash does not depend on key order
- **proof:** unit

### Requirement: Planned todos become events
Every todo with an explicit planned `day` SHALL be one Proton event in its aspect's calendar, whatever its sprint or
backlog state: with start and end time a timed event start–end, with a start only a 30-minute event (explicit duration,
not the calendar default), without a slot an all-day event on `day`. Times SHALL be Europe/Berlin wall times passed
with `--zone Europe/Berlin`. Title = todo title, description = notes, location = the class room for a class-linked
todo. A due date alone, and the due-date-derived display day of the sprint views, SHALL never produce an event. An item
whose `proton` call fails with any exit code other than 0, 2, 3 or 5 SHALL be marked failed with stderr's `Error:` line
while the pass goes on with the other items. (S2)

#### Scenario: Todo with a full slot becomes a timed event
- **WHEN** a todo is planned on 2026-10-20 from 18:00 to 19:30
- **THEN** the desired state holds `todo:<id>` in its aspect with date 2026-10-20, start 18:00, end 19:30, no duration and no recurrence
- **proof:** unit

#### Scenario: Start-only slot becomes a 30-minute event
- **WHEN** a todo is planned on 2026-10-20 from 18:00 without an end
- **THEN** its desired event has start 18:00, no end and a duration of 30 minutes
- **proof:** unit

#### Scenario: Todo without a slot becomes an all-day event
- **WHEN** a todo is planned on 2026-10-20 without a slot
- **THEN** its desired event is all-day on 2026-10-20 (no start, end or duration)
- **proof:** unit

#### Scenario: Event carries notes and the class room
- **WHEN** a Uni todo linked to a class with room "HS 1" and notes "Bring calculator" is planned
- **THEN** its desired event has the todo title, description "Bring calculator" and location "HS 1"; a todo without class has an empty location
- **proof:** unit

#### Scenario: Due date alone creates no event
- **WHEN** a sprint todo has a due date inside the active week but no `day`
- **THEN** the desired state holds no item for it, although the sprint views show it on its due day
- **proof:** unit

#### Scenario: Backlog and draft-sprint todos with a day get events
- **WHEN** a backlog todo is planned three weeks out and a todo in the planning draft carries a day
- **THEN** the desired state holds an event for each
- **proof:** unit

#### Scenario: Timed events are sent in Europe/Berlin
- **WHEN** the runner sends a timed create, a start-only create and an all-day create
- **THEN** the fake records `--zone Europe/Berlin` on each, start and end for the timed one, `--duration 30m` and no end for the start-only one, and `--all-day` for the all-day one
- **proof:** unit

#### Scenario: Failing item does not stop the pass
- **WHEN** a pass pushes two new items and the fake exits 1 with `Error: ambiguous local time` for the first (a start at 02:30 on 2026-10-25)
- **THEN** the second item's event is created and stored, and the first item's row holds no event ref and the error `Error: ambiguous local time`
- **proof:** unit

#### Scenario: Planning a todo creates its event
- **WHEN** with an empty sync state a todo is planned through `setDay` on a future day from 18:00 to 19:30 and a pass runs
- **THEN** the fake has recorded one calendar create named after the todo's aspect and one event create in that calendar with the todo's title, date and slot, and `proton_items` stores the returned ref
- **proof:** unit

### Requirement: Edits follow the todo
A synced todo whose pushed content changes (title, notes, day, slot, done) SHALL have its event updated in place under
its stored ref; a todo whose aspect changes SHALL have its event deleted and created again in the new aspect's calendar.
An update that exits 3 (event deleted by hand in Proton) SHALL create the event again and store the new ref. (S3)

#### Scenario: Changed item updates its event in place
- **WHEN** a stored item's desired content changes and a pass runs
- **THEN** the fake records exactly one event update with the stored ref and the new content, and the row's hash becomes the new content's hash
- **proof:** unit

#### Scenario: Aspect change moves the event to the other calendar
- **WHEN** a stored item's desired aspect changes to an aspect with a different calendar
- **THEN** the fake records a delete of the old ref followed by a create in the new calendar, and the row stores the new ref and calendar ID
- **proof:** unit

#### Scenario: Failed create after a calendar move keeps no deleted ref
- **WHEN** an item's aspect changes, the delete of the old ref succeeds, and the create in the new calendar fails with exit 1
- **THEN** the row stores no event ref and carries the error, and the next pass with retry makes one create and stores its ref
- **proof:** unit

#### Scenario: Event deleted in Proton is created again
- **WHEN** a stored item's event was removed from the fake by hand and the item's content changes
- **THEN** the update exits 3, a create follows in the same calendar, and the row stores the new ref
- **proof:** unit

#### Scenario: Editing a planned todo updates its event
- **WHEN** a synced todo's title, notes and slot are edited through `updateTodo` and `setDay` and a pass runs
- **THEN** the fake records one event update of the stored ref with the new title, description and times, and no create or delete
- **proof:** unit

### Requirement: Done todos keep their event with a check mark
A done todo SHALL keep its event with "✓ " in front of the title; reopening it SHALL remove the "✓ ". This holds for
bulk completion (`archiveSemester`) and for todos on past days that were synced before. (S4)

#### Scenario: Done todo is titled with a check mark
- **WHEN** a planned todo "Run 5k" is done and another planned todo is open
- **THEN** the desired title of the done one is "✓ Run 5k" and the open one's title has no prefix
- **proof:** unit

#### Scenario: Ticking a todo done and reopening it
- **WHEN** a synced todo is ticked done through `toggleDone`, a pass runs, it is reopened, and a pass runs again
- **THEN** the fake records two updates of the same ref, the first titled "✓ <title>", the second "<title>", and no delete
- **proof:** unit

#### Scenario: Archiving a semester updates each done todo
- **WHEN** a semester whose classes have synced open todos is archived (completing them) and a pass runs
- **THEN** the fake records one update per completed synced todo, as many as `archiveSemester` reported completed among the synced ones, each titled with "✓ "
- **proof:** unit

#### Scenario: Ticking a past synced todo done updates its event
- **WHEN** a todo planned yesterday was synced, the clock moves on, and the todo is ticked done
- **THEN** the next pass updates its event with "✓ "
- **proof:** unit

### Requirement: Unplanned and deleted todos lose their event
A synced todo that loses its `day` or is deleted SHALL have its Proton event deleted and its sync row removed — whether
it was moved to the backlog, carried over without a day by a review or a sprint start, had its day cleared by `setDay`,
or was deleted (also by cascade from a class). A delete that exits 3 (already gone) SHALL count as success. (S5)

#### Scenario: Item no longer desired has its event deleted
- **WHEN** a stored item is missing from the desired state and a pass runs
- **THEN** the fake records one delete of its ref with `--yes`, and its row is removed
- **proof:** unit

#### Scenario: Event already gone counts as deleted
- **WHEN** a stored item is no longer desired and its event was removed from the fake by hand
- **THEN** the delete exits 3, the row is removed, and the pass reports no failure
- **proof:** unit

#### Scenario: Moving a todo to the backlog deletes its event
- **WHEN** a synced sprint todo is moved to the backlog through `moveToBacklog` and a pass runs
- **THEN** the fake records one delete of its ref and the row is gone
- **proof:** unit

#### Scenario: Carry-over by review or sprint start deletes the event
- **WHEN** a synced open sprint todo is carried over by `closeReview`, a synced backlog todo planned before the new week is pulled in Unscheduled by `startSprint`, and a pass runs
- **THEN** the fake records one delete per todo and both rows are gone
- **proof:** unit

#### Scenario: Clearing the day deletes the event
- **WHEN** a synced todo's day is cleared through `setDay(…, null)` and a pass runs
- **THEN** the fake records one delete of its ref
- **proof:** unit

#### Scenario: Deleting a todo or its class deletes the events
- **WHEN** one synced todo is deleted through `deleteTodo` and a class with two synced todos is deleted through `deleteClass`, then a pass runs
- **THEN** the fake records three deletes, one per ref, and the three rows are gone
- **proof:** unit

### Requirement: Recurring rules become weekly series
Each recurring rule not belonging to an archived-semester class SHALL be one Proton series in its aspect's calendar with
recurrence `FREQ=WEEKLY;BYDAY=<weekdays>`, starting on the first of its weekdays on or after the in-app projection start
(active sprint week start + 7 days, or today without an active sprint), timed or all-day by the rule's slot exactly as
todos are, with title, notes and class room as for todos. The series start date SHALL always be one of the rule's
weekdays. Real instances are ordinary todos and get their own events, and the series SHALL exclude (EXDATE) every day on
or after its start that is one of the rule's weekdays and already has a real instance of that rule, so no occurrence
shows twice (Gate 1 addition a); since proton-cli adds an EXDATE by deleting that occurrence and drops all EXDATEs on a
series update, the exclusions SHALL be applied again after every series create or update. A series update SHALL use the bare series ref; a
rule's aspect change SHALL delete and create the series; a deleted rule's series SHALL be deleted while its instances
keep their events. (S6)

#### Scenario: Rule series starts the week after the active sprint
- **WHEN** the active sprint's week starts on Monday 2026-10-19 and a rule runs on Tuesday and Thursday from 07:00 to 08:00
- **THEN** its desired item `rule:<id>` starts on 2026-10-27 at 07:00, ends 08:00, recurs `FREQ=WEEKLY;BYDAY=TU,TH`, and lives in the rule's aspect
- **proof:** unit

#### Scenario: Series start lands on a rule weekday
- **WHEN** no sprint is active, today is Wednesday 2026-10-21, one rule runs on Mondays and one on Wednesdays
- **THEN** the Monday series starts on 2026-10-26 and the Wednesday series on 2026-10-21
- **proof:** unit

#### Scenario: Rule without a slot is an all-day series
- **WHEN** a rule has no slot, and another rule has a start only
- **THEN** the first series is all-day, the second has a 30-minute duration
- **proof:** unit

#### Scenario: Rules of archived classes have no series
- **WHEN** a rule belongs to a class of an archived semester and another rule to a class of an active semester
- **THEN** the desired state holds a series only for the second
- **proof:** unit

#### Scenario: Series excludes days with a real instance
- **WHEN** no sprint is active, today is Sunday 2026-10-25, a rule runs on Sundays and Wednesdays, and the closed sprint left a done instance of it on 2026-10-25 and another instance was planned onto Wednesday 2026-11-04
- **THEN** its series starts 2026-10-25 with `exdates` [2026-10-25, 2026-11-04], and a rule without instances on or after its start has none
- **proof:** unit

#### Scenario: Series exclusions are deleted as occurrences after each push
- **WHEN** a pass creates a timed series (start 07:00) with two excluded days, and later its title changes
- **THEN** after the create and again after the update the fake records one occurrence delete `<ref>@<day>T07:00 --yes` per excluded day, the fake's series holds both EXDATEs at the end, and the row's hash is stored only after the last delete
- **proof:** unit

#### Scenario: Occurrence deletes name the occurrence in Europe/Berlin
- **WHEN** the runner sends an occurrence delete for a timed series and one for an all-day series
- **THEN** the fake records `calendar events delete <ref>@2026-10-28T07:00 --yes` and `<ref>@2026-10-28 --yes`, each with `TZ=Europe/Berlin` in the child's environment
- **proof:** unit

#### Scenario: Closing the review keeps instance days out of the series
- **WHEN** a rule's series is synced during a running sprint, the sprint's review is closed on its Sunday while a done instance of the rule sits on that Sunday, and a pass runs
- **THEN** the fake records one update of the series (now starting from today) followed by one occurrence delete for that Sunday, and the fake's series shows no occurrence on a day that has an instance
- **proof:** unit

#### Scenario: Editing a rule updates its series
- **WHEN** a synced rule's weekdays, slot and title are changed through `updateRule` and a pass runs
- **THEN** the fake records one update of the bare series ref with the new recurrence, times and title
- **proof:** unit

#### Scenario: Rule aspect change moves its series
- **WHEN** a synced rule's aspect is changed and a pass runs
- **THEN** the fake records a delete of the old series ref and a create in the new aspect's calendar
- **proof:** unit

#### Scenario: Deleting a rule deletes its series and keeps instance events
- **WHEN** a rule with a synced series and two synced instances in the active week is deleted through `deleteRule` and a pass runs
- **THEN** the fake records one delete (the series ref) and the instances' rows and events stay
- **proof:** unit

#### Scenario: Starting a sprint moves the series and adds the week's instances
- **WHEN** no sprint is active, a rule's series was synced, Rue starts the sprint for the coming week through `startSprint` (which generates the rule's instances on its weekdays), and a pass runs
- **THEN** the fake records one update of the series ref starting on the rule's first weekday one week after the new sprint's week start, and one create per generated instance, as many as `generateInstances` created with a day
- **proof:** unit

#### Scenario: Series start follows today between sprints
- **WHEN** no sprint is active, a pass runs on Wednesday 2026-10-21, another pass the same day, and another on Thursday 2026-10-22, for a rule running on Wednesdays and Fridays
- **THEN** the second pass makes no call and the third makes exactly one update of the series (start 2026-10-23)
- **proof:** unit

### Requirement: Exams become events in the Uni calendar
Each class with `exam_at` SHALL be one event in the calendar of the aspect set as `uni_aspect_id`, titled
"Exam · <class name>", located at the exam room; a date-only exam SHALL be all-day, an exam with a time SHALL last two
hours. Without a Uni aspect no exam SHALL be synced. Exams of archived semesters are synced like the in-app calendar
shows them. Clearing the exam or deleting the class SHALL delete the event; changing the Uni aspect SHALL move it. (S7)

#### Scenario: Exam with a time becomes a two-hour event
- **WHEN** class "Analysis I" has `exam_at` 2026-11-03T09:00 and exam room "Audimax"
- **THEN** its desired item `exam:<classId>` is titled "Exam · Analysis I", located "Audimax", starts 2026-11-03 09:00 with a duration of 120 minutes, in the Uni aspect
- **proof:** unit

#### Scenario: Date-only exam becomes an all-day event
- **WHEN** a class has `exam_at` 2026-11-03 without a time
- **THEN** its desired event is all-day on 2026-11-03
- **proof:** unit

#### Scenario: Exams need a Uni aspect
- **WHEN** a class has an exam but no Uni aspect is set
- **THEN** the desired state holds no exam item
- **proof:** unit

#### Scenario: Archived-semester exams are synced
- **WHEN** a class of an archived semester has an exam after today
- **THEN** the desired state holds its exam item
- **proof:** unit

#### Scenario: Setting an exam creates its event
- **WHEN** an exam date and time are set on a class through `updateClass` and a pass runs
- **THEN** the fake records one event create in the Uni aspect's calendar titled "Exam · <class name>" with a 2-hour duration
- **proof:** unit

#### Scenario: Clearing an exam or deleting its class deletes its event
- **WHEN** one synced exam is cleared through `updateClass` and another synced exam's class is deleted, then a pass runs
- **THEN** the fake records two deletes, one per exam ref
- **proof:** unit

#### Scenario: Changing the Uni aspect moves exam events
- **WHEN** a synced exam exists and the Uni aspect is changed through `setUniAspectId` to an aspect with another calendar
- **THEN** the next pass deletes the exam's event and creates it in the new aspect's calendar
- **proof:** unit

### Requirement: One Proton calendar per aspect
Each aspect SHALL have at most one Proton calendar, created by the app on the first item that needs it, named after the
aspect, with the colour from a fixed table mapping each palette colour to a Proton accent; its ID SHALL be stored and
reused. Renaming or recolouring an aspect SHALL NOT change its Proton calendar. When an event create exits 3 because the
stored calendar no longer exists, the calendar SHALL be created again and the create retried once. A deleted aspect's
Proton calendar is left alone; its reassigned items move to the target aspect's calendar. An aspect deleted while its
calendar is being created SHALL leave its items for the next pass. (S8)

#### Scenario: First item of an aspect creates its calendar
- **WHEN** a pass pushes two new items of aspect "Health" (palette colour sage) and none of the aspect has a calendar yet
- **THEN** the fake records exactly one calendar create named "Health" with sage's Proton colour from the table, followed by two event creates in that calendar, and `proton_calendars` stores its ID
- **proof:** unit

#### Scenario: Aspect colours map to fixed Proton colours
- **WHEN** the colour table is read for each of the eight palette colours
- **THEN** each maps to the Proton colour listed in design.md, and no two palette colours share one
- **proof:** unit

#### Scenario: Missing calendar is created again
- **WHEN** an aspect's stored calendar was removed from the fake by hand and a new item of that aspect is pushed
- **THEN** the event create exits 3, a calendar create follows, the event is created in the new calendar, and `proton_calendars` stores the new ID
- **proof:** unit

#### Scenario: Renaming or recolouring an aspect makes no calls
- **WHEN** all items are synced and an aspect is renamed and recoloured through `updateAspect`, then a pass runs
- **THEN** the fake records no call
- **proof:** unit

#### Scenario: Deleting an aspect moves its events to the target's calendar
- **WHEN** an aspect with two synced todos is deleted through `deleteAspect` with another aspect as target, then a pass runs
- **THEN** the fake records two deletes of the old refs and two creates in the target aspect's calendar, and no calendar delete
- **proof:** unit

#### Scenario: Aspect deleted during its calendar create skips the item
- **WHEN** an aspect is deleted while the pass awaits the create of its calendar, and another aspect's item is in the same pass
- **THEN** the pass ends "done" without throwing, `proton_calendars` holds no row for the deleted aspect, the other aspect's item is created, and no failure is recorded
- **proof:** unit

#### Scenario: Aspect deleted mid-pass leaves the item for the next pass
- **WHEN** an aspect is deleted through `deleteAspect` with a target while a pass runs, before the pass reaches one of its synced items, and the next pass runs with that item in the target aspect
- **THEN** the first pass records no failure for the item, and the next pass updates or creates it in the target aspect's calendar and stores the new ref and calendar ID
- **proof:** unit

### Requirement: Diff reconciliation
A pass SHALL build the desired state from the database (planned todos, rule series, exams), compare it with the stored
hashes and calendar IDs, and call `proton` only for differences: create for a new item, update for changed content,
delete + create for a calendar change, delete for an item no longer desired. Each successful call SHALL be stored before
the next one, so a pass interrupted by a restart or an abort resumes from the stored state. (S9)

#### Scenario: Unchanged database makes no calls
- **WHEN** a pass has synced the seeded todos, rules and exams, and a second pass runs without any database change
- **THEN** the first pass's creates equal the number of desired items read from the database and the second pass adds no call to the fake's log
- **proof:** unit

#### Scenario: Restart resumes from stored state
- **WHEN** a pass over five new items is aborted after two creates (the fake exits 5 on the third) and a fresh pass runs
- **THEN** the fresh pass makes exactly three creates, and every item has exactly one event in the fake
- **proof:** unit

#### Scenario: Plan, done and back to backlog between two passes
- **WHEN** a synced todo is ticked done and then moved to the backlog before the next pass, and a never-synced todo is planned and moved back to the backlog before the next pass
- **THEN** that pass records exactly one call: the delete of the synced todo's ref
- **proof:** unit

#### Scenario: Aspect change and edit in the same pass
- **WHEN** a synced todo's title and aspect are both changed before the next pass
- **THEN** that pass records a delete of the old ref and one create in the new aspect's calendar with the new title, and no update
- **proof:** unit

#### Scenario: Auth failure mid-pass then Sync now finishes without duplicates
- **WHEN** a pass over four new items hits exit 2 on the third create, the fake is then cleared of failures, and a pass runs as "Sync now"
- **THEN** the second pass creates only the two remaining items, and the fake holds exactly four events
- **proof:** unit

### Requirement: Pass scheduling
Sync SHALL run in the app process: a pass about 30 s after the last non-GET request (debounced, started from
`hooks.server.ts`), every 5 minutes, at once on "Sync now", and once as a catch-up pass one debounce period after the
worker is configured (changes made while the app was down, and the first-run backfill without waiting for a tick). A pass SHALL never overlap another; a request for a pass
while one runs SHALL run one more pass after it. With sync off no timer runs. The end of every pass that ends "done"
SHALL be stored as the last successful sync time in `settings` key `proton_last_sync_at`. (S9, Gate 1 addition b)

#### Scenario: Last sync time survives a restart
- **WHEN** a pass ends "done" at 2026-10-21T10:00:05Z, then the worker is configured anew on the same database (as after a restart) before any pass, and then a pass ends "retry"
- **THEN** `settings` holds `proton_last_sync_at` = 2026-10-21T10:00:05Z, the new worker's status reports that time as last sync, and the failed pass leaves it unchanged
- **proof:** unit

#### Scenario: Writes nudge a pass after the debounce
- **WHEN** sync is on and three nudges arrive 10 s apart
- **THEN** exactly one pass starts, 30 s after the last nudge
- **proof:** unit

#### Scenario: Startup runs one catch-up pass
- **WHEN** sync is on, the worker has just been configured, and no nudge arrives
- **THEN** no pass starts before the debounce period has passed, exactly one starts then, and no further pass starts until the next tick
- **proof:** unit

#### Scenario: Local tick runs every five minutes
- **WHEN** sync is on and no nudge arrives for 15 minutes
- **THEN** a pass starts at 5, 10 and 15 minutes
- **proof:** unit

#### Scenario: Passes never overlap
- **WHEN** "Sync now" is requested twice while a pass is running
- **THEN** no second pass starts before the first ends, and exactly one more pass runs after it
- **proof:** unit

#### Scenario: Sync now runs a pass at once
- **WHEN** "Sync now" is requested while no pass runs
- **THEN** a pass starts without waiting for the debounce, and the returned promise resolves with its outcome
- **proof:** unit

#### Scenario: A form post nudges a pass
- **WHEN** in the built app with sync on (fake CLI, short debounce) Rue's browser posts a form action, and before that only GET requests were made
- **THEN** the worker's pass count stays at its value after the startup catch-up pass while only pages are loaded, and rises by one after the post
- **proof:** e2e

### Requirement: First-run backfill
The desired state SHALL contain todos with `day` on or after today, all rules not of archived-semester classes, and
exams on or after today, plus every item before today that is already synced. Items before today are never created;
already synced ones are still updated or deleted. A first run therefore backfills from today on, paced like every pass,
and the sync page shows how many calls are still pending. (S10)

#### Scenario: Desired state starts today
- **WHEN** todos are planned yesterday, today and tomorrow, and exams lie yesterday and tomorrow, with nothing synced
- **THEN** the desired state holds today's and tomorrow's todos and tomorrow's exam, not yesterday's items
- **proof:** unit

#### Scenario: Past synced items stay in the desired state
- **WHEN** a todo planned yesterday and an exam yesterday have rows in `proton_items`
- **THEN** both are in the desired state
- **proof:** unit

#### Scenario: First pass backfills from today
- **WHEN** the database holds past and future planned todos, two rules and past and future exams, and the first pass runs with an empty sync state
- **THEN** the fake records one create per todo and exam dated today or later and one per rule, and none for past items
- **proof:** unit

#### Scenario: Pending count matches the calls a pass would make
- **WHEN** some items are new, one changed, one no longer desired, and one failed with an unchanged spec
- **THEN** the pending count equals the number of event calls the next regular pass makes (the failed item not counted)
- **proof:** unit

### Requirement: CLI call discipline
Calls to `proton` SHALL run one at a time with at least 1 s between mutations, with `PROTON_NO_INPUT=1`,
`PROTON_NO_UPDATE_CHECK=1`, `PROTON_NO_LOG=1`, `--output json` and `--profile <profile>`; deletes SHALL pass `--yes`.
Exit 5 SHALL stop the pass and retry after a backoff of 1, 2, 4 … minutes capped at 30 minutes; exit 2 SHALL pause sync in
state "re-login needed" until "Sync now" or the next 30-minute retry; any other non-zero exit SHALL mark that item failed
with stderr's `Error:` line while the rest continue. A failed item SHALL be tried again only when its content changes,
on "Sync now" or on "Resync all", and its failure SHALL be cleared once its content matches Proton again without a call.
The one-second gap SHALL hold across passes, including a queued pass that follows a running one. Any other failure
inside a pass SHALL end it in state "error" with the message, and requests queued behind it SHALL still run. A missing or non-executable binary SHALL put sync in state "error" with the message,
without crashing the app. A call that has not finished after 120 s SHALL be killed and count as exit 5 with the line
`Error: proton timed out after 120 s`. (S11)

#### Scenario: Calls run non-interactively
- **WHEN** the runner sends a create through the fake executable
- **THEN** the fake records `PROTON_NO_INPUT=1`, `PROTON_NO_UPDATE_CHECK=1`, `PROTON_NO_LOG=1`, `--output json` and `--profile default`, and the runner returns the envelope's `ids`
- **proof:** unit

#### Scenario: Deletes are confirmed with --yes
- **WHEN** the runner sends a delete
- **THEN** the fake records `--yes` and exits 0
- **proof:** unit

#### Scenario: Mutations are at least one second apart
- **WHEN** three calls are handed to the runner at once with the default gap
- **THEN** the fake records them one after another, each started at least 1000 ms after the previous one ended
- **proof:** unit

#### Scenario: Mutations stay one gap apart across passes
- **WHEN** "Sync now" is requested twice while a pass runs, a todo is planned meanwhile, and the queued pass follows the first
- **THEN** the fake records the queued pass's first call at least one gap after the end of the first pass's last call
- **proof:** unit

#### Scenario: Failure carries the exit code and the Error line
- **WHEN** the fake is told to exit 1, 2, 3 and 5 with a message
- **THEN** the runner returns each exit code with the `Error: …` line from stderr, and does not throw
- **proof:** unit

#### Scenario: Missing binary is reported, not thrown
- **WHEN** `PROTON_CLI` points at a path that does not exist, and at a file without the execute bit
- **THEN** the runner returns a spawn failure with the system message both times
- **proof:** unit

#### Scenario: Exit 5 or exit 2 aborts the pass
- **WHEN** the fake exits 5 on the second of four creates, and in a second run exits 2 on the second create
- **THEN** each pass stops after that call (no third call), returns outcome "retry" resp. "relogin", and marks no item failed
- **proof:** unit

#### Scenario: Failed item waits for a change or Sync now
- **WHEN** an item failed with exit 1 and its content is unchanged, then a regular pass runs, then a "Sync now" pass, then the content changes
- **THEN** the regular pass makes no call for it, the "Sync now" pass tries it once, and after the change the next regular pass tries it again
- **proof:** unit

#### Scenario: Failed update clears when the item matches Proton again
- **WHEN** a synced item's update exits 1, and the item is then changed back to the content Proton still holds
- **THEN** the next pass makes no call, and the item is no longer listed as failed
- **proof:** unit

#### Scenario: Failed delete clears when the item is desired again
- **WHEN** an item's delete exits 1 after it left the desired state, and the item is then desired again with unchanged content
- **THEN** the next pass makes no call, and the item is no longer listed as failed
- **proof:** unit

#### Scenario: A pass that throws ends in state error and the next pass runs
- **WHEN** a pass throws an error other than a CLI failure while a second "Sync now" waits behind it, and later another pass throws
- **THEN** the first request resolves with outcome "error" and the message, the waiting pass runs and ends "done", the state is "error" with the message after the later throw, and no rejection reaches the caller
- **proof:** unit

#### Scenario: Network failure backs off up to 30 minutes
- **WHEN** every pass returns "retry" and no "Sync now" arrives
- **THEN** passes follow after 1, 2, 4, 8, 16, 30 and 30 minutes, nudges and ticks in between start no pass, the state is "error" with the last error, and a successful pass resets the backoff and returns to "idle"
- **proof:** unit

#### Scenario: Auth failure pauses sync until Sync now
- **WHEN** a pass returns "relogin"
- **THEN** the state is "re-login needed", nudges and ticks start no pass, a pass is retried after 30 minutes, and "Sync now" starts one at once that returns to "idle" on success
- **proof:** unit

#### Scenario: Missing binary sets state error
- **WHEN** a pass returns a spawn failure
- **THEN** the state is "error" with the system message, the app keeps serving, and the next tick tries again
- **proof:** unit

### Requirement: Proton sync page
The app SHALL have a page "Proton sync" at `/sync` showing the state (Off, Up to date, Syncing…, Re-login needed,
Error), the last successful sync time (stored in `settings`, so it survives a restart — Gate 1 addition b), the pending call count, the failed items with their error and the last error,
with the buttons "Sync now" and "Resync all" ("Resync all" forgets every stored hash and re-pushes every item, creating
events that no longer exist). It SHALL state that renaming or recolouring an aspect doesn't change its Proton calendar.
With sync off it SHALL explain `PROTON_CLI` and show no buttons; in state "Re-login needed" it SHALL show
`proton account login --profile <profile>` to run on the server. The page SHALL work at 375 px. (S12)

#### Scenario: Sync page shows state, last sync and pending count
- **WHEN** sync is on with the fake, two todos are planned and no pass has run, Rue opens `/sync`, then a pass runs and she reloads
- **THEN** first the page shows "Never" as last sync and 2 pending changes (calendar creates are not counted), then "Up to date", a last sync time and 0 pending, and the rename/recolour note
- **proof:** e2e

#### Scenario: Sync page lists failed items with their error
- **WHEN** the fake exits 1 with `Error: ambiguous local time` for one todo's create and a pass runs
- **THEN** `/sync` lists that todo's title with `Error: ambiguous local time` in the failed items, and the state stays "Up to date"
- **proof:** e2e

#### Scenario: Re-login needed shows the login command and recovers after Sync now
- **WHEN** sync is on with profile "default", the fake exits 2 on every call (as for a session never logged in), a todo is planned and a pass runs, then the failure is removed and Rue presses "Sync now"
- **THEN** `/sync` first shows "Re-login needed" and `proton account login --profile default`, and after "Sync now" it shows "Up to date" and the todo's event exists in the fake
- **proof:** e2e

#### Scenario: Resync all re-pushes every item and recreates missing events
- **WHEN** three items are synced, one event is removed from the fake by hand, and Rue presses "Resync all"
- **THEN** the fake records an update for each of the three stored refs, the update of the removed one exits 3 and a create follows, and afterwards three events exist
- **proof:** e2e

#### Scenario: Sync off page names PROTON_CLI and shows no buttons
- **WHEN** the app runs without `PROTON_CLI`, Rue plans a todo through a form post and opens `/sync`
- **THEN** the page says sync is off and names `PROTON_CLI`, shows neither "Sync now" nor "Resync all", and the fake's call log is empty
- **proof:** e2e

#### Scenario: Sync page fits a phone
- **WHEN** `/sync` is opened at 375 px in the states off, re-login needed (with the command) and with a failed item
- **THEN** it does not scroll horizontally and a screenshot is written to `test-results/shots/`
- **proof:** e2e

### Requirement: Sync configuration
Sync SHALL be configured only through the environment: `PROTON_CLI` (path to the `proton` binary; unset or empty = sync
off, no worker, no call) and `PROTON_PROFILE` (default `default`). The child process SHALL inherit the app's environment,
so the session lives under the service's `XDG_CONFIG_HOME` (`$XDG_CONFIG_HOME/proton-cli/sessions/<profile>.json`). A
configured binary that was never logged in exits 2 on its first call and leads to "re-login needed". (S13)

#### Scenario: PROTON_CLI unset turns sync off
- **WHEN** the config is read from an environment without `PROTON_CLI`, and from one with `PROTON_CLI=''`
- **THEN** both give sync off
- **proof:** unit

#### Scenario: Profile defaults to default
- **WHEN** the config is read with `PROTON_CLI=/usr/local/bin/proton` and no `PROTON_PROFILE`, and again with `PROTON_PROFILE=rue`
- **THEN** it gives that path with profile "default", then profile "rue"
- **proof:** unit

#### Scenario: Non-JSON output ends the pass in state error
- **WHEN** the binary exits 0 and prints nothing, or a notice line that is no JSON, for a call
- **THEN** the call resolves as a failure that ends the pass in state "error" with a message naming the missing JSON, the app does not crash, and a later call to a working binary succeeds
- **proof:** unit

#### Scenario: A hung proton call times out and backs off
- **WHEN** the binary never returns and the runner's timeout elapses
- **THEN** the child is killed, the call resolves as exit 5 with `Error: proton timed out after <n> s`, the next call in the queue still runs, and a pass therefore ends "retry" and enters the network backoff
- **proof:** unit

#### Scenario: Child process inherits XDG_CONFIG_HOME
- **WHEN** the app's environment has `XDG_CONFIG_HOME=/var/lib/life-manager/config` and the runner calls the fake
- **THEN** the fake records that `XDG_CONFIG_HOME`
- **proof:** unit

#### Scenario: Sync off runs no worker
- **WHEN** the worker is configured with sync off and nudges, ticks and "Sync now" arrive
- **THEN** no pass runs and the state is "off"
- **proof:** unit

#### Scenario: Never logged in shows re-login needed
- **WHEN** the configured binary exits 2 on its first call
- **THEN** the sync page shows "Re-login needed" and the login command
- **proof:** e2e ("Scenario: Re-login needed shows the login command and recovers after Sync now")

### Requirement: Fake proton CLI for tests
Tests SHALL never talk to Proton. A fake `proton` executable (`scripts/fake-proton.mjs`) SHALL implement the pinned
proton-cli v5.1.0 contract: the argv of design.md, the `--output json` mutation envelope
`{action,count,dry_run,kind,ids,name}` with an event create's `ids[0]` = `<calendarId>/<eventId>` and a calendar
create's `ids[0]` = the bare calendar ID, errors as `Error: …` on stderr with empty stdout, exit codes 0/1/2/3/5 (4, 6 and
7 injectable). It
SHALL keep calendars and events in a state directory, record every call (argv, decoded operation, exit code, relevant
env, time), and fail on demand. The same core SHALL be usable in-process by unit tests. (S14)

#### Scenario: Fake CLI follows the proton-cli contract
- **WHEN** the fake executable creates a calendar, creates an event in it, creates a weekly series and deletes one of its occurrences, updates the series, updates and deletes the event, then updates the deleted ref, creates in an unknown calendar, deletes a day that is no occurrence, deletes without `--yes` and runs without `PROTON_NO_INPUT`
- **THEN** the successes print the envelope (`created` / `updated` / `deleted`) with the documented `ids` formats and exit 0, the occurrence delete adds an EXDATE that the series update drops again; the unknown ref, calendar and occurrence exit 3, the last two exit 1, each with an `Error: …` line on stderr and empty stdout
- **proof:** unit

#### Scenario: Fake CLI records calls and injected failures
- **WHEN** a failure rule "event.create exits 5 once" is set and two creates run
- **THEN** the first exits 5 with an `Error:` line, the second succeeds, and the call log holds both with their decoded operations and exit codes
- **proof:** unit

#### Scenario: CI without a proton binary is unaffected
- **WHEN** the e2e suite runs without `PROTON_CLI` in the server's environment
- **THEN** sync is off unless a test turns the fake on, and no test needs a real `proton` binary
- **proof:** e2e ("Scenario: Sync off page names PROTON_CLI and shows no buttons")

### Requirement: Sync through the app
The running app SHALL turn Rue's actions in its pages into the matching `proton` calls: planning, editing, ticking done,
unplanning and deleting a todo, editing a rule, starting a sprint and setting an exam. (Done criteria)

#### Scenario: Planning a todo in the app creates its event
- **WHEN** with the fake on, Rue plans a backlog todo in the todo editor for a future day from 18:00 to 19:30 and a pass runs
- **THEN** the fake's log holds one calendar create named after the aspect and one event create with the title, that date, 18:00, 19:30 and `--zone Europe/Berlin`
- **proof:** e2e

#### Scenario: Editing, ticking done and unplanning a todo follow in Proton
- **WHEN** a synced todo is renamed in the editor (pass), ticked done (pass), then its planned date is cleared (pass)
- **THEN** the log adds an update with the new title, an update titled "✓ <new title>", and a delete of the same ref, in that order
- **proof:** e2e

#### Scenario: Deleting a todo in the app deletes its event
- **WHEN** a synced todo is deleted from its editor and a pass runs
- **THEN** the log adds one delete of its ref with `--yes`
- **proof:** e2e

#### Scenario: Editing a rule in the app updates its series
- **WHEN** a synced rule's slot is changed on `/recurring` and a pass runs
- **THEN** the log adds one update of the series ref with the new times and its weekly recurrence
- **proof:** e2e

#### Scenario: Starting a sprint in the app moves the series
- **WHEN** a rule's series is synced, Rue starts the sprint on the plan page and a pass runs
- **THEN** the log adds one update of the series ref with the later start and one create per instance the sprint shows on a day
- **proof:** e2e

#### Scenario: Setting an exam in the app creates its event
- **WHEN** Rue sets an exam date and time on a class's page and a pass runs
- **THEN** the log adds one event create titled "Exam · <class name>" in the Uni aspect's calendar with a 2-hour duration
- **proof:** e2e

### Requirement: Works against a real Proton account
The sync SHALL work against Rue's real Proton account through proton-cli v5.1.0. (Done criteria)

#### Scenario: Planned todo appears in a real Proton calendar
- **WHEN** with proton-cli logged in on Rue's machine and `PROTON_CLI` set, she runs `npm run dev`, plans a todo with a slot and later ticks it done
- **THEN** the event appears in a new "<Aspect>" calendar in Proton at the slot, and after done its title starts with "✓ "
- **proof:** manual (needs Rue's real Proton account and a logged-in proton-cli session)
