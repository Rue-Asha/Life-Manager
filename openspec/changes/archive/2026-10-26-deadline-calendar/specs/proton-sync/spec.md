## MODIFIED Requirements

### Requirement: Planned todos become events
Every todo with an explicit planned `day` SHALL be one Proton event in its aspect's calendar, whatever its sprint or
backlog state: with start and end time a timed event start–end, with a start only a 30-minute event (explicit duration,
not the calendar default), without a slot an all-day event on `day`. Times SHALL be Europe/Berlin wall times passed
with `--zone Europe/Berlin`. Title = todo title, description = notes, location = the class room for a class-linked
todo. A due date alone, and the due-date-derived display day of the sprint views, SHALL never produce a planned-todo event (`todo:<id>`); due dates are synced only as the per-aspect due bundles of "Due dates become one bundled all-day event per aspect and day". An item
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

#### Scenario: Due date alone creates no planned-todo event
- **WHEN** a sprint todo has a due date inside the active week but no `day`
- **THEN** the desired state holds no `todo:<id>` item for it, only its due bundle, although the sprint views show it on its due day
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

## ADDED Requirements

### Requirement: Due dates become one bundled all-day event per aspect and day
For every aspect and every date from today on that has at least one open (status not done) todo whose `due_date` is that date, the sync SHALL keep exactly one all-day event in that aspect's Proton calendar, item key `due:<aspectId>:<date>`, whatever the todo's sprint or backlog state and also when it has a planned `day` (its `todo:<id>` event stays unchanged). The event title SHALL be `Due: <title> · <title>` with the todos sorted by title, case-insensitive, and with more than 3 todos `Due (<n>): <t1> · <t2> · <t3> …`; the description SHALL list every todo title, one per line; it has no location, start, end or duration, and titles are not truncated beyond the 3-item rule. A first run backfills from today on, an aspect without a calendar gets it through the first-item path. (deadline-calendar S1, S2)

#### Scenario: Open due todos become one all-day bundle per aspect and day
- **WHEN** two open todos of one aspect are due 2026-10-22, one in the backlog and one in the active sprint, and one todo of another aspect is due the same day
- **THEN** the desired state holds `due:<aspectA>:2026-10-22` and `due:<aspectB>:2026-10-22`, each all-day on 2026-10-22 with no start, end, duration, recurrence or location, and no second item for the first aspect
- **proof:** unit ("Scenario: Open due todos become one all-day bundle per aspect and day")

#### Scenario: Bundle title and description
- **WHEN** one todo "Pay invoice" is due, and then todos "b", "A", "C" are due one day (title order A, b, C)
- **THEN** the first bundle's title is `Due: Pay invoice`, the second's `Due: A · b · C` with description "A\nb\nC", and a very long title is passed whole
- **proof:** unit ("Scenario: Bundle title and description")

#### Scenario: More than three todos show a count
- **WHEN** four todos "d", "a", "c", "b" are due one day
- **THEN** the bundle title is `Due (4): a · b · c …` and its description lists all four titles, one per line
- **proof:** unit ("Scenario: Bundle title and description")

#### Scenario: Planned todo with a due date keeps its own event
- **WHEN** an open todo is planned on 2026-10-20 18:00 and due 2026-10-22
- **THEN** the desired state holds `todo:<id>` on 2026-10-20 unchanged and the bundle `due:<aspect>:2026-10-22` containing it
- **proof:** unit ("Scenario: Open due todos become one all-day bundle per aspect and day")

#### Scenario: Due bundle needs no migration
- **WHEN** a bundle is pushed by a pass
- **THEN** `proton_items` holds a row with key `due:<aspectId>:<date>` and its event ref, and `user_version` equals `migrations.length` as before
- **proof:** unit ("Scenario: Bundle is created in the aspect's calendar and stored under its key")

#### Scenario: Bundle is created in the aspect's calendar and stored under its key
- **WHEN** a pass runs with one due todo of an aspect that has no Proton calendar yet and a todo due yesterday
- **THEN** the fake receives a calendar create for the aspect, then one all-day event create for the bundle in it, the row `due:<aspectId>:<date>` stores the ref, and nothing is created for yesterday's date
- **proof:** unit

### Requirement: Due bundles follow their todos
A todo marked done, deleted, with its due date cleared or moved, or moved to another aspect SHALL update the affected bundle(s) on the next pass: an updated bundle is changed in place, a bundle left with no open todo is deleted, a todo un-done again reappears. An unchanged bundle SHALL cause no CLI call. A bundle whose date is before today is frozen: it SHALL be left as last synced, with no update and no delete, and a todo whose due date moves out of a past bundle changes nothing there. A deleted aspect's bundles follow the existing aspect-delete path. (deadline-calendar S3)

#### Scenario: Second deadline joins the existing event
- **WHEN** a bundle with one todo is synced and a second open todo of the same aspect gets the same due date
- **THEN** the next pass makes one `event.update` on the same ref and no create
- **proof:** unit ("Scenario: Second deadline joins the existing event")

#### Scenario: Done todo leaves the bundle, the last one deletes it
- **WHEN** a synced bundle holds two todos, one is marked done and a pass runs, then the other is marked done and a pass runs
- **THEN** the first pass updates the event to the remaining todo's title and the second pass deletes the event and removes its row
- **proof:** unit ("Scenario: Done todo leaves the bundle, the last one deletes it")

#### Scenario: Todo marked done between two passes
- **WHEN** a pass syncs a bundle of two todos, one todo is marked done, a second pass runs, and the third pass runs with no further change
- **THEN** the second pass makes exactly one `event.update` and the third pass makes no call
- **proof:** unit ("Scenario: Unchanged bundle makes no call in a second pass")

#### Scenario: Unchanged bundle makes no call in a second pass
- **WHEN** a pass has synced a bundle and a second pass runs with the same data
- **THEN** the second pass makes no CLI call and the row keeps its event ref and hash
- **proof:** unit ("Scenario: Unchanged bundle makes no call in a second pass")

#### Scenario: Cleared or deleted due date deletes the event
- **WHEN** the only todo of a synced bundle has its due date cleared, and in another case is deleted
- **THEN** each pass deletes the bundle's event and row
- **proof:** unit ("Scenario: Done todo leaves the bundle, the last one deletes it")

#### Scenario: Moved due date changes both bundles
- **WHEN** a synced todo's due date moves from 2026-10-22 to 2026-10-24 where another todo of the aspect is already due
- **THEN** the old bundle is deleted (it was empty), the 2026-10-24 bundle is updated to hold both, and no other call is made
- **proof:** unit ("Scenario: Moved due date and aspect change update both bundles")

#### Scenario: Aspect change moves the deadline to the other aspect's bundle
- **WHEN** a synced due todo moves to another aspect that has a bundle on the same date
- **THEN** the old aspect's bundle is deleted or reduced and the new aspect's bundle updated, in the new aspect's calendar
- **proof:** unit ("Scenario: Moved due date and aspect change update both bundles")

#### Scenario: Un-done todo reappears
- **WHEN** a done todo's bundle was deleted and the todo is reopened
- **THEN** the next pass creates the bundle again
- **proof:** unit ("Scenario: Done todo leaves the bundle, the last one deletes it")

#### Scenario: Passed bundle is frozen
- **WHEN** a bundle for 2026-10-14 was synced and a pass runs on 2026-10-15 after its todo was marked done, and another after the todo was deleted
- **THEN** neither pass makes a call and the row and event stay as last synced
- **proof:** unit ("Scenario: Passed bundle is frozen")

#### Scenario: Deleting an aspect deletes or moves its bundles with the existing path
- **WHEN** an aspect with a synced due bundle is deleted and its todos move to a target aspect
- **THEN** the old bundle's event is deleted and the target aspect's calendar holds the bundle of the moved todos, with no duplicate event
- **proof:** unit ("Scenario: Moved due date and aspect change update both bundles")

#### Scenario: Setting a due date puts an event into the sync
- **WHEN** in e2e a todo is given a due date in the editor and Sync now runs against the fake CLI
- **THEN** the fake holds a `Due: <title>` all-day event on that date in the aspect's calendar, and marking the todo done and syncing again removes it
- **proof:** e2e ("Scenario: Due date syncs as a bundled event and done removes it")
