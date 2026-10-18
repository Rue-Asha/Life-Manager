# todos Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Create todos
Rue SHALL create a todo with a required title and aspect and optional notes, priority (none/P1/P2/P3),
due date and checklist, through a plain quick-add form (title field plus chips/pickers, no
natural-language parsing). The todo lands in the backlog by default, in the active sprint when created
from a sprint view, and on a specific day when created in a week-by-day column. (S6)

#### Scenario: Quick add creates a todo in the backlog
- **WHEN** Rue enters a title, picks an aspect in the quick-add form on the backlog and submits
- **THEN** the todo appears in the backlog under that aspect
- **proof:** e2e

#### Scenario: Todo stores all optional fields
- **WHEN** a todo is created with notes, priority P1, a due date and two checklist items
- **THEN** reading it back returns those notes, priority, due date and both items unchecked in order
- **proof:** unit

#### Scenario: Todo created from a sprint view joins the active sprint
- **WHEN** Rue uses quick add in the by-aspect sprint view
- **THEN** the todo is in the active sprint with status To do and no day
- **proof:** e2e

#### Scenario: Todo created in a day column is assigned to that day
- **WHEN** Rue uses quick add in the Wednesday column of the week view
- **THEN** the todo is in the active sprint, assigned to that Wednesday
- **proof:** e2e

#### Scenario: Empty todo title is rejected
- **WHEN** a todo is created with an empty or whitespace-only title
- **THEN** creation fails with error `required` on field `title` and nothing is stored
- **proof:** unit

#### Scenario: Past due date is allowed and shown overdue
- **WHEN** Rue creates a todo with a due date before today
- **THEN** it is saved and its row is visibly marked overdue
- **proof:** e2e

### Requirement: Edit todos
Rue SHALL be able to change every field of a todo; checklist items can be added, renamed, checked,
unchecked and deleted. (S7)
The create and edit forms SHALL share one field order: title, description (the `notes` field, labelled "Description"),
the field chips with "Planned" and its time row, then the checklist. The editor's title is set larger than a row title,
its description shows at least two lines, Delete is styled as a destructive action, and on a phone Save leads the
footer at full width.

#### Scenario: Edit every field of a todo
- **WHEN** Rue opens a todo and changes title, aspect, description (notes), priority and due date, then saves
- **THEN** the row and the reopened editor show the new values
- **proof:** e2e

#### Scenario: Checklist items are added, renamed, toggled and deleted
- **WHEN** Rue adds two checklist items, renames the first, checks then unchecks the second, and deletes the first
- **THEN** after reload the todo has one unchecked item with the second item's text
- **proof:** e2e

#### Scenario: Changing the aspect keeps sprint, status and day
- **WHEN** a sprint todo with status Doing on Tuesday gets a different aspect
- **THEN** its sprint, status and day are unchanged
- **proof:** unit

### Requirement: Delete todos
Deleting a todo SHALL require confirmation. (S8)

#### Scenario: Deleting a todo asks for confirmation
- **WHEN** Rue chooses delete on a todo
- **THEN** a confirmation is shown; cancelling keeps the todo, confirming removes it
- **proof:** e2e

#### Scenario: Deleting a recurring instance keeps its rule
- **WHEN** one instance of a recurring rule is deleted
- **THEN** only that instance is gone; the rule and its other instances remain
- **proof:** unit

### Requirement: Link IT todos to a project
QuickAdd and the todo editor SHALL show an optional "Project" select only while the selected aspect is
the IT aspect. It lists the projects that are not implemented; on a todo already linked to an implemented
project, that project stays selectable. With no IT aspect set or no projects the field is hidden.
Switching the aspect away from the IT aspect in the form hides the field and submits no project. (S10)

#### Scenario: Quick add links a todo to a project
- **WHEN** Rue picks the IT aspect in quick add on the backlog, chooses a project in the Project field and submits
- **THEN** the todo is created linked to that project
- **proof:** e2e

#### Scenario: Project field appears only for the IT aspect
- **WHEN** Rue opens quick add and the todo editor with a non-IT aspect selected, then selects the IT aspect
- **THEN** the Project field is hidden first and shown after selecting the IT aspect
- **proof:** e2e

#### Scenario: Project field lists projects that are not implemented
- **WHEN** projects in all four states exist and Rue opens the Project field in quick add, then in the editor of a todo linked to the implemented project
- **THEN** quick add lists the backlog, active and paused projects only, and the editor additionally lists the implemented project the todo is linked to
- **proof:** e2e

#### Scenario: Project field is hidden without IT aspect or projects
- **WHEN** Rue selects any aspect in quick add while no IT aspect is set, and again while the IT aspect is set but no project exists
- **THEN** the Project field is not shown in either case
- **proof:** e2e

#### Scenario: Switching the aspect away drops the project
- **WHEN** in quick add Rue selects the IT aspect, chooses a project, switches to another aspect and submits
- **THEN** the Project field is hidden after the switch and the created todo has no project link
- **proof:** e2e

### Requirement: Project link follows the aspect
The server SHALL store a project link only on a todo whose aspect is the IT aspect, regardless of the
UI. A todo that gets a different aspect, by edit or by aspect deletion, loses its link. A posted project
id that does not exist fails with error `not-found` on field `projectId`. (S11)

#### Scenario: Aspect change removes the project link
- **WHEN** a todo linked to a project gets a different aspect
- **THEN** its `projectId` is null and its sprint, status and day are unchanged
- **proof:** unit

#### Scenario: Project link on a non-IT todo is not stored
- **WHEN** a todo is created or updated with a valid `projectId` and an aspect that is not the IT aspect
- **THEN** the todo is saved without a project link
- **proof:** unit

#### Scenario: Unknown project id is rejected
- **WHEN** an IT todo is created or updated with a `projectId` that does not exist
- **THEN** the request fails with error `not-found` on field `projectId` and nothing is stored or changed
- **proof:** unit

### Requirement: Project badge on todo rows
A linked todo SHALL show a muted project badge (glyph + project name) in `TodoRow` wherever the row
renders; clicking it opens the project's detail page. Todos without a link show no badge. At 375 px the
badge wraps under the title. (S12)

#### Scenario: Linked todo shows the project badge
- **WHEN** during a running sprint a linked todo is shown on Backlog, and another linked todo on Sprint and Today, and Rue clicks a badge
- **THEN** each row shows the badge with the project's name, and the click opens `/projects/<id>`
- **proof:** e2e

#### Scenario: Unlinked todo shows no badge
- **WHEN** a todo without a project link is shown on Backlog
- **THEN** its row has no project badge
- **proof:** e2e

#### Scenario: Badge wraps under the title on a phone
- **WHEN** a linked todo with a long title is shown on Backlog at 375 px
- **THEN** the badge sits below the title and the page does not scroll horizontally
- **proof:** e2e

### Requirement: Link Uni todos to a class
QuickAdd and the todo editor SHALL show an optional "Class" select only while the selected aspect is the Uni
aspect, and a Type chip (LEC / EXC / OTH, default OTH) only once a class is picked; with a preset class (class
detail) the Type chip is shown immediately. The select lists the classes of active semesters.
With no Uni aspect set or no classes in active semesters the fields are hidden. Switching the aspect away
from the Uni aspect in the form hides them and submits no class or type. A type is only stored on a
class-linked todo. (uni-hub S11)

#### Scenario: Quick add links a todo to a class
- **WHEN** Rue picks the Uni aspect in quick add on the backlog, chooses a class, picks type EXC and submits
- **THEN** the todo is created linked to that class with type EXC
- **proof:** e2e

#### Scenario: Class field appears only for the Uni aspect
- **WHEN** Rue opens quick add and the todo editor with a non-Uni aspect selected, then selects the Uni aspect
- **THEN** the Class select is hidden first and shown after selecting the Uni aspect, and the Type chip is shown only after a class is picked
- **proof:** e2e

#### Scenario: Class field lists classes of active semesters
- **WHEN** an active semester with classes "Analysis" and "Algorithms" and an archived semester with class "Physics" exist and Rue opens the Class select in quick add
- **THEN** it lists Analysis and Algorithms and not Physics
- **proof:** e2e

#### Scenario: Class field is hidden without Uni aspect or classes
- **WHEN** Rue selects any aspect in quick add while no Uni aspect is set, and again while the Uni aspect is set but no active semester has classes
- **THEN** the Class select and Type chip are not shown in either case
- **proof:** e2e

#### Scenario: Switching the aspect away drops class and type
- **WHEN** in quick add Rue selects the Uni aspect, chooses a class and type LEC, switches to another aspect and submits
- **THEN** the fields are hidden after the switch and the created todo has no class and no type
- **proof:** e2e

### Requirement: Class link follows the aspect
The server SHALL store a class link, type and revised date only on a todo whose aspect is the Uni aspect,
regardless of the UI. A todo that gets a different aspect, by edit or by aspect deletion, loses class, type
and revised date. A posted type without a class is not stored; a class without a type gets OTH. A posted
class id that does not exist fails with `not-found` on `classId`; a class of an archived semester fails
with `archived` on `classId`. (uni-hub S11)

#### Scenario: Aspect change removes class, type and revised date
- **WHEN** a class todo with type LEC and a revised date gets a different aspect
- **THEN** its `classId`, `type` and `revisedAt` are null and its sprint, status and day are unchanged
- **proof:** unit

#### Scenario: Class link on a non-Uni todo is not stored
- **WHEN** a todo is created or updated with a valid `classId` and type and an aspect that is not the Uni aspect
- **THEN** the todo is saved without class and type
- **proof:** unit

#### Scenario: Type needs a class
- **WHEN** a Uni todo is created with type LEC and no class, and another with a class and no type
- **THEN** the first is stored with type null, the second with type OTH
- **proof:** unit

#### Scenario: Unknown or archived class id is rejected
- **WHEN** a Uni todo is created or updated with a `classId` that does not exist, or with a class of an archived semester
- **THEN** the request fails with `not-found` or `archived` on field `classId` and nothing is stored or changed
- **proof:** unit

### Requirement: Class badge on todo rows
A class-linked todo SHALL show a muted class badge (class icon in its colour, class name and type) in
`TodoRow` wherever the row renders, except on that class's own detail page, where rows show the type tag and
the revised control instead; clicking it opens the class's detail page. Todos without a class show no
badge. At 375 px the badge wraps under the title. (uni-hub S13)

#### Scenario: Linked todo shows the class badge
- **WHEN** during a running sprint a class todo of type LEC is shown on Backlog, and another class todo on Sprint and Today, and Rue clicks a badge
- **THEN** each row shows the badge with the class icon, the class name and the type, and the click opens `/uni/classes/<id>`
- **proof:** e2e

#### Scenario: Todo without class shows no class badge
- **WHEN** a Uni-aspect todo without class is shown on Backlog
- **THEN** its row has no class badge
- **proof:** e2e

#### Scenario: Class badge wraps under the title on a phone
- **WHEN** a class todo with a long title is shown on Backlog at 375 px
- **THEN** the badge sits below the title and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Class detail rows show the type instead of the badge
- **WHEN** a class todo of type EXC is shown on that class's detail page
- **THEN** its row shows the type tag `EXC` and the revised control, and no row in the class's todo list has a class badge
- **proof:** e2e

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
- **THEN** "From" and "To" disappear at once, after reload the editor shows an empty "Planned" and the row has no `planned-label`, and setting a date again shows empty "From" and "To"
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
- **THEN** the first card is in the Thursday column labelled "09:00–10:00", and the second is in the active sprint with no day
- **proof:** e2e — `Regression: quick add in a week day column stores the slot on that day`

#### Scenario: Quick add with a planned day in a review-required week is refused, without a day it is not
- **WHEN** today is the Monday 2026-10-19 after an active sprint of 2026-10-12 to 2026-10-18, and todos with slot 18:00–19:30 are created with the sprint target on 2026-10-15, the backlog target on 2026-10-15, and the sprint target on 2026-10-11, then with the sprint target on 2026-10-26, the sprint target without a day, and the backlog target without a day
- **THEN** the first two fail with `review-required` and the third with `day-in-past`, nothing being stored; the fourth is in the backlog on 2026-10-26, the fifth is in the active sprint with no day, and the sixth is in the backlog with no day
- **proof:** unit — `Regression: createTodo with a planned day in a review-required week is refused, without a day it is not`

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

### Requirement: Time slot rules
A planned todo SHALL have either no slot (all-day, labelled "all day"), a start time alone (shown "18:00"), or a
start and an end time on the same day with the end after the start (shown "18:00–19:30"). An end without a start MUST
be refused with `end-without-start` on `endTime`, an end at or before the start with `end-before-start` on `endTime`,
and a value that is not `HH:MM` (00:00–23:59) with `invalid` on the field; a refused slot changes nothing. A slot
without a date is not stored. In the editor, clearing "From" clears "To", and typing a new "From" afterwards brings "To"
back with the old length; that memory is dropped when the todo is added or the form cleared, when the plan is removed
and when "Planned" is cleared, so it never carries over to another todo. (S3)

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

#### Scenario: Time row appears only once a day is planned
- **WHEN** Rue opens an unplanned todo, then sets "Planned" to 2026-11-03, types "To" 19:30 and then "From" 18:00
- **THEN** there is no "From" or "To" before the date is set, both are editable after it, "To" keeps 19:30 and the length reads "1 h 30 min"
- **proof:** e2e — `Regression: the time row appears only once a day is planned`

#### Scenario: Add time and the length shortcuts set the end
- **WHEN** Rue opens a todo planned for 2026-11-03 without a slot, clicks "Add time", then "2h", and saves
- **THEN** "From" is a full hour, "To" is one hour after it with "1h" pressed, then two hours after it with the length "2 h", and the row shows that slot
- **proof:** e2e — `Regression: Add time and the length chips set To`

#### Scenario: Moving the start keeps the length
- **WHEN** Rue changes "From" of a todo planned with 18:00–19:30 to 09:00 and saves
- **THEN** "To" reads 10:30 and the row shows "Tue 3 Nov · 09:00–10:30"; `shiftEnd` stops the end at 23:59 and drops it when the start is 23:59
- **proof:** e2e — `Regression: moving From keeps the length of the slot`; unit — `Regression: a moved start keeps the slot length`

#### Scenario: Times are typed without a browser picker
- **WHEN** in a browser whose `showPicker()` throws for time inputs (as Firefox does), Rue clicks "From" and types 1800, clicks "To" and types 1930, and saves
- **THEN** no page error occurs, the fields read 18:00 and 19:30, and the row shows "Tue 3 Nov · 18:00–19:30"
- **proof:** e2e — `Regression: From and To are typed in a browser without a time picker`

#### Scenario: Creating with a bad slot or a past day stores nothing
- **WHEN** today is 2026-10-14 with no active sprint, and todos are created for 2026-11-03 with 18:00–17:00, with only an end 17:00, with start 25:00, and for 2026-10-13 with 18:00
- **THEN** they fail with `end-before-start`, `end-without-start` (both on `endTime`), `invalid` on `startTime` and `day-in-past` on `day`, and no todo is stored
- **proof:** unit — `Regression: createTodo refuses a bad slot or a past day and stores nothing`

#### Scenario: Creating with a slot but no day drops the slot
- **WHEN** a todo is created in the backlog with 18:00–19:30 and no planned date
- **THEN** it is stored with no day, start or end time
- **proof:** unit — `createTodo drops a slot without a day`

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

