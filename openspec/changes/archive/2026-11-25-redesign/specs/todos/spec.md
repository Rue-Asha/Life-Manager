## ADDED Requirements

### Requirement: Todo editor on the fingerprint
The todo editor SHALL render on the fingerprint `sheet` primitive (bottom sheet below 768 px, centred card from 768 px) with every field: title, aspect, priority, due date, status, planned day and slot, Markdown notes, checklist, the project link only for the IT aspect and the class link with type only for the Uni aspect, and "Delete todo" behind its confirmation ("Delete this todo?"). Long titles and notes SHALL wrap inside the editor; an empty checklist shows its add control; a todo of an archived semester's class opens read-only. (S6)

#### Scenario: Editor shows every field and saves
- **WHEN** Rue opens a sprint todo of the IT aspect, changes priority, due date, status, day and slot, adds a checklist item, writes notes and picks a project, and saves
- **THEN** after reload every changed value is shown in the editor
- **proof:** e2e

#### Scenario: Link fields follow the aspect
- **WHEN** the editor is opened for a Health todo, then the aspect is switched to the IT aspect, then to the Uni aspect
- **THEN** Health shows no Project or Class field, IT shows Project only, and Uni shows Class and Type only
- **proof:** e2e

#### Scenario: Long title and notes wrap in the editor
- **WHEN** a todo with a 200-character title and 4,000 characters of notes is opened at 375 px
- **THEN** both are fully reachable inside the editor, its save control stays reachable, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Delete asks first
- **WHEN** Rue presses "Delete todo" in the editor
- **THEN** "Delete this todo?" asks with "Delete todo" and "Cancel"; Cancel keeps the todo, confirming removes it
- **proof:** e2e

#### Scenario: Archived class todo opens read-only
- **WHEN** a todo of an archived semester's class is opened from a list
- **THEN** no editable field and no delete control are shown in the editor
- **proof:** e2e

#### Scenario: Archived class todo deletes from the row
- **WHEN** Rue looks at a todo row on the page of a class of an archived semester
- **THEN** the row has no editable field and the editor stays closed; its only action is a trash button ("Delete todo: <title>") that asks "Delete this todo?" with "Delete todo" and "Cancel", and confirming removes the todo
- **proof:** e2e

## MODIFIED Requirements

### Requirement: Planned date and time slot
The todo editor SHALL have a "Planned" field: a date (input labelled "Planned") plus an optional start and end
time (inputs labelled "From" and "To", `HH:MM`, Europe/Berlin), settable on backlog and sprint todos and saved with the
editor. Clearing the date clears both times.
The time row ("From" → "To") SHALL be shown only while a date is set, as two visible, typeable time inputs that need no
browser picker. "Add time" fills the next full hour (kept within 06:00–21:00) and one hour after it; length shortcuts
30m, 1h, 1h30 and 2h set "To" from "From", the current one marked pressed, next to the length as text ("1 h 30 min");
changing "From" moves "To" along, keeping the length, up to 23:59. A date before today that is not a day of the active sprint week MUST be
refused with error `day-in-past` on field `day`, the editor showing a message and nothing being changed; every day of
the active sprint week, including days before today, is allowed. For a recurring instance the `recurring-outside-week`
rule of sprint-lifecycle "Mid-sprint changes" is checked first, so a past date outside its week is refused with that
error, not `day-in-past`. Todos of archived semesters stay read-only (`archived`).
A done todo's planned date is edited like any other field and keeps its status where it stays in its sprint. Where the
todo lands (sprint or backlog) follows sprint-lifecycle "Mid-sprint changes". Creating a todo with a day target (quick
add in a Week view column) places it by the same rule, `review-required` while the active sprint's review is required
included; creating with the sprint or backlog target (quick add in By aspect, Unscheduled or Backlog) without a planned
day keeps its existing behaviour and is not refused by a required review. (S1)
Every quick-add form SHALL offer the same "Planned" field with "From" and "To", stored on create under the same rules
as an edit: any target with a planned date lands by the placement rule and the same refusals as setting that date in the
editor (`day-in-past`, and `review-required` for a date in the active sprint week while its review is required, as
sprint-lifecycle "Mid-sprint changes" demands), the quick add showing the message and keeping its input; a day-column
quick add starts with its day filled in, and a day column whose date was removed adds to the active sprint without a day.

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
- **THEN** "From" and "To" disappear at once, after reload the editor shows an empty "Planned" and the row shows no planned label, and setting a date again shows empty "From" and "To"
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

#### Scenario: Quick add on the backlog stores the planned day and slot
- **WHEN** Rue opens quick add on Backlog, enters a title, sets "Planned" to Tuesday 2026-11-03 with "From" 18:00 and "To" 19:30, and adds it
- **THEN** the row shows "Tue 3 Nov · 18:00–19:30", also after reload, and its editor shows that date, 18:00 and 19:30
- **proof:** e2e — `Regression: quick add on the backlog stores the planned day and slot`

#### Scenario: Quick add in a week day column stores the slot on that day
- **WHEN** Rue opens quick add in the Thursday column of the Week view, sees "Planned" filled with that Thursday, sets 09:00–10:00 and adds it, then adds a second todo after removing the plan
- **THEN** the first card is in the Thursday column as a compact chip labelled "09:00" (start only), its board card shows the stored slot "09:00–10:00", and the second is in the active sprint with no day
- **proof:** e2e — `Regression: quick add in a week day column stores the slot on that day`

#### Scenario: Quick add with a planned day in a review-required week is refused, without a day it is not
- **WHEN** today is the Monday 2026-10-19 after an active sprint of 2026-10-12 to 2026-10-18, and todos with slot 18:00–19:30 are created with the sprint target on 2026-10-15, the backlog target on 2026-10-15, and the sprint target on 2026-10-11, then with the sprint target on 2026-10-26, the sprint target without a day, and the backlog target without a day
- **THEN** the first two fail with `review-required` and the third with `day-in-past`, nothing being stored; the fourth is in the backlog on 2026-10-26, the fifth is in the active sprint with no day, and the sixth is in the backlog with no day
- **proof:** unit — `Regression: createTodo with a planned day in a review-required week is refused, without a day it is not`

#### Scenario: The New todo dialog says where a planned day sends the todo
- **WHEN** with an active sprint of 2026-10-12 to 2026-10-18 Rue opens "New todo" from the top bar on `/backlog`, then sets "Planned" to 2026-10-16, then to 2026-11-03
- **THEN** the footer hint reads "Goes to the backlog" before a day is set, "Goes to this sprint" for 2026-10-16, and "Goes to the backlog" again for 2026-11-03; while the sprint's review is required (today 2026-10-19), a day in its week such as 2026-10-15 shows "Goes to the backlog" and never "Goes to this sprint", since the sprint target is disabled and that add is refused
- **proof:** e2e — `Regression: the New todo dialog says where a planned day sends the todo`

#### Scenario: Retyping From after clearing it restores the slot length
- **WHEN** Rue opens a todo planned with 18:00–19:30, clears "From" (so "To" is empty) and types 09:00
- **THEN** "To" is 10:30 and the length reads "1 h 30 min"
- **proof:** e2e

#### Scenario: A cleared slot does not leak into the next quick add
- **WHEN** in a quick add on Backlog Rue plans 2026-11-03 with 18:00–19:30, clears "From", adds the todo, and in the same open form sets "Planned" again and types "From" 09:00; and after typing "To" 10:00, clearing "From" and "Remove plan", plans 2026-11-04 and types "From" 11:00
- **THEN** "To" stays empty both times
- **proof:** e2e — `Regression: a cleared slot does not leak into the next quick add`

#### Scenario: Creating with a planned day stores it for every target
- **WHEN** with an active sprint of 2026-10-12 to 2026-10-18 and today 2026-10-14, todos with slot 18:00–19:30 are created with the backlog target on 2026-11-03 and on 2026-10-16, the sprint target on 2026-10-15, and the day target 2026-10-17
- **THEN** the first is in the backlog on 2026-11-03, the others are in the active sprint on their day, and all carry 18:00–19:30
- **proof:** unit — `Regression: createTodo stores the planned day and slot for every target`
