## ADDED Requirements

### Requirement: Slot data model
Migration 5, appended to `src/lib/server/schema.ts`, SHALL add the nullable columns `start_time` and `end_time`
(`HH:MM` text) to `todos` and to `recurring_rules`, without a CHECK and without touching existing rows. Both todo read
models (`getTodo`/`listBacklog` and `selectTodos`) and the rule read model return them as `startTime` / `endTime`.
(calendar-planning S1, S3, S10)

#### Scenario: Migration 5 adds time slots without touching existing data
- **WHEN** a database at `user_version` 4 with an aspect, an active sprint, a rule, a sprint todo with a day and a backlog todo is opened
- **THEN** `user_version` is the number of migrations, `todos` and `recurring_rules` have `start_time` and `end_time`, all null, and every other column of every row is unchanged
- **proof:** unit

#### Scenario: Both todo read models carry the slot
- **WHEN** a sprint todo and a backlog todo with `start_time` 18:00 and `end_time` 19:30, and a rule with 07:00, are read through `getTodo`, `listBacklog`, `listSprintTodos`, `listToday` and `listRules`
- **THEN** each returns `startTime` and `endTime` as stored, and a todo without a slot returns both as null
- **proof:** unit

### Requirement: Planned date and time slot
The todo editor SHALL have a "Planned" field: a date (input labelled "Planned") plus an optional start and end
time (inputs labelled "From" and "To", `HH:MM`, Europe/Berlin), settable on backlog and sprint todos and saved with the
editor. Clearing the date clears both times. A date before today that is not a day of the active sprint week MUST be
refused with error `day-in-past` on field `day`, the editor showing a message and nothing being changed; every day of
the active sprint week, including days before today, is allowed. Todos of archived semesters stay read-only (`archived`).
A done todo's planned date is edited like any other field and keeps its status where it stays in its sprint. Where the
todo lands (sprint or backlog) follows sprint-lifecycle "Mid-sprint changes". Creating a todo with a day target (quick
add in a Week view column) places it by the same rule, `review-required` while the active sprint's review is required
included; creating with the sprint target (quick add in By aspect or Unscheduled) keeps its existing behaviour and is not
refused by a required review. (S1)

#### Scenario: Plan a backlog todo three weeks out with a slot
- **WHEN** Rue opens a backlog todo, sets "Planned" to the Tuesday three weeks after today with "From" 18:00 and "To" 19:30, and saves
- **THEN** the reopened editor shows that date, 18:00 and 19:30, and the todo is still in the backlog
- **proof:** e2e

#### Scenario: Planned date and slot are stored
- **WHEN** `setDay` is called for a backlog todo with a date two weeks ahead and slot 18:00–19:30
- **THEN** reading the todo back returns that `day`, `startTime` 18:00 and `endTime` 19:30
- **proof:** unit

#### Scenario: Clearing the date clears the times
- **WHEN** `setDay` clears the date of a todo planned for a day with 18:00–19:30
- **THEN** its `day`, `startTime` and `endTime` are all null
- **proof:** unit

#### Scenario: Editor clears the times with the date
- **WHEN** Rue opens a todo planned with 18:00–19:30, clears "Planned" and saves
- **THEN** after reload the editor shows empty "Planned", "From" and "To" and the row has no `planned-label`
- **proof:** e2e

#### Scenario: Past date outside the active sprint week is refused
- **WHEN** today is Wednesday 2026-10-14 in a sprint of 2026-10-12 to 2026-10-18, and a todo is planned for Sunday 2026-10-11, then for Monday 2026-10-12, and, with no active sprint, another todo for 2026-10-13
- **THEN** 2026-10-11 and the no-sprint 2026-10-13 fail with `day-in-past` on `day` and change nothing, and 2026-10-12 is accepted
- **proof:** unit

#### Scenario: Editor shows the past-date message
- **WHEN** with no active sprint Rue sets "Planned" of a backlog todo to yesterday and saves
- **THEN** the editor stays open with an alert message, and after reload the todo has no planned date
- **proof:** e2e

#### Scenario: Archived class todo cannot be planned
- **WHEN** a request to the `/todos` `setDay` action and one to the `update` action with a `day` are posted for a class todo of an archived semester
- **THEN** both fail with error `archived` and the todo's day and slot are unchanged
- **proof:** e2e

#### Scenario: Creating on a day follows the placement rule
- **WHEN** today is the Monday after an active sprint of 2026-10-12 to 2026-10-18, and todos are created with a day target of 2026-10-15, a day target of 2026-10-19, and the sprint target
- **THEN** the first fails with `review-required` and nothing is stored, the second is in the backlog on 2026-10-19, and the third is in the active sprint with no day, unchanged from before this change
- **proof:** unit

#### Scenario: Done todo is planned like any todo
- **WHEN** a Done sprint todo on Monday of the active sprint is planned for Friday of the same week with 09:00
- **THEN** it is on Friday with start 09:00 and its status is still Done
- **proof:** unit

### Requirement: Time slot rules
A planned todo SHALL have either no slot (all-day, labelled "all day"), a start time alone (shown "18:00"), or a
start and an end time on the same day with the end after the start (shown "18:00–19:30"). An end without a start MUST
be refused with `end-without-start` on `endTime`, an end at or before the start with `end-before-start` on `endTime`,
and a value that is not `HH:MM` (00:00–23:59) with `invalid` on the field; a refused slot changes nothing. A slot
without a date is not stored. In the editor, clearing "From" clears "To". (S3)

#### Scenario: Slot validation
- **WHEN** `validateSlot` checks (18:00, none), (18:00, 19:30), (none, none), (none, 19:30), (18:00, 18:00), (18:00, 17:00) and (25:00, none)
- **THEN** the first three pass, (none, 19:30) fails `end-without-start`, the two ends at or before the start fail `end-before-start`, all on `endTime`, and 25:00 fails `invalid` on `startTime`
- **proof:** unit

#### Scenario: Slot labels
- **WHEN** `slotLabel` formats (18:00, none), (18:00, 19:30) and (none, none)
- **THEN** it returns "18:00", "18:00–19:30" and "all day"
- **proof:** unit

#### Scenario: Invalid slot is refused on save
- **WHEN** a todo planned for a day with 10:00 is saved through `setDay` with end 19:30 and no start, then with 18:00–17:00
- **THEN** both fail with `end-without-start` / `end-before-start` on `endTime`, and the todo still has its day and 10:00
- **proof:** unit

#### Scenario: Clearing the start clears the end in the editor
- **WHEN** Rue opens a todo planned with 18:00–19:30, clears "From" and saves
- **THEN** "To" is empty, and after reload the todo keeps its date with no start or end time
- **proof:** e2e

### Requirement: Planned label on todo rows
A todo row SHALL show the todo's planned date with its slot in a label with test id `planned-label` wherever the row
appears (Today, Sprint By aspect and Board, Backlog, Plan, Review, an aspect page, project and class todo lists, the
backlog rail), e.g. "Tue 27 Oct · 18:00–19:30"; without a slot only the date ("Tue 27 Oct"); without a date no label,
and the due label is unchanged. Where the row already shows the day (a sprint row's day control) and in the Week view,
the label shows only the slot, and nothing when there is no slot. (S4)

#### Scenario: Planned label formats date and slot
- **WHEN** `plannedLabel` formats 2026-10-27 with 18:00–19:30, with 18:00 alone, and with no slot, 2026-11-03 with no slot, and then 18:00–19:30 without the date
- **THEN** it returns "Tue 27 Oct · 18:00–19:30", "Tue 27 Oct · 18:00", "Tue 27 Oct", "Tue 3 Nov" and "18:00–19:30"
- **proof:** unit

#### Scenario: Backlog and aspect rows show the planned date and slot
- **WHEN** a backlog todo planned for Tuesday 2026-10-27 18:00–19:30 and due 2026-10-30 is shown on Backlog and on its aspect page
- **THEN** both rows show "Tue 27 Oct · 18:00–19:30" and still show the due label
- **proof:** e2e

#### Scenario: Unplanned row shows only its due label
- **WHEN** a backlog todo with a due date and no planned date is shown on Backlog
- **THEN** its row has no `planned-label` and shows the due label as before
- **proof:** e2e
