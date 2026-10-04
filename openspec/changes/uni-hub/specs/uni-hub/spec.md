## ADDED Requirements

### Requirement: Uni data model
Migration 4, appended to `src/lib/server/schema.ts`, SHALL add `semesters` (id, name, archived_at NULL,
created_at), `classes` (id, semester_id FK `ON DELETE CASCADE`, name, color, icon, notes, lecturer, room,
ects, links JSON, exam_at, exam_room, grade, created_at, updated_at), on `todos` the columns `class_id NULL
REFERENCES classes(id) ON DELETE CASCADE`, `type TEXT NULL CHECK (type IN ('LEC','EXC','OTH'))` and
`revised_at TEXT NULL`, and on `recurring_rules` `class_id` (same FK) and `type` (same CHECK). The Uni aspect
is held in the setting `uni_aspect_id`. The migration only adds; no existing row is rewritten and existing
Uni-aspect todos stay unlinked. `resetDb()` deletes the new tables in FK-safe order. Both todo read models
(`todoColumns` in `todos.ts`, `selectTodos()` in `sprints.ts`) carry `classId`, `type` and `revisedAt`. (S1)

#### Scenario: Migration 4 adds the Uni tables without touching existing data
- **WHEN** a database at `user_version` 3 holding aspects (one named "Uni"), a sprint, a rule, a project, todos (some of the Uni aspect) and checklist items is opened
- **THEN** it is at `user_version` 4, `semesters` and `classes` exist, every todo and rule has `class_id`, `type` and (todos) `revised_at` NULL, and every pre-existing row reads back unchanged
- **proof:** unit

#### Scenario: Reset clears the Uni tables
- **WHEN** a database with semesters, classes, class todos and class rules is reset with `resetDb()`
- **THEN** no error is raised and `semesters`, `classes`, `todos`, `recurring_rules` and `settings` are empty
- **proof:** unit

#### Scenario: Both todo read models carry the class fields
- **WHEN** a class-linked todo with type LEC and a revised date is read through `getTodo`/`listBacklog` and through `listSprintTodos`/`listToday`
- **THEN** each path returns its `classId`, `type` and `revisedAt`
- **proof:** unit

### Requirement: Uni aspect setting
The aspect used for uni todos SHALL be chosen on `/uni`: a prompt on first run (no Uni aspect set) that
preselects an aspect named "Uni" if one exists, changeable later. Changing it removes every class link
(class, type and revised date) from todos and rules, after a confirm dialog naming the number of links;
with no links no dialog is shown. With no aspects at all, `/uni` leads to creating one. When the Uni aspect
is deleted, links on its moved todos and rules are cleared and the setting reads as unset, as on first run. (S2)

#### Scenario: First run prompts for the Uni aspect
- **WHEN** Rue opens `/uni` with aspects "Health" and "Uni" and no Uni aspect set, keeps the preselection and saves
- **THEN** the prompt was shown instead of the overview with "Uni" preselected, and afterwards the overview is shown with "Uni" named as the Uni aspect
- **proof:** e2e

#### Scenario: Changing the Uni aspect removes links after confirmation
- **WHEN** Rue changes the Uni aspect while two todos and one rule are linked to classes and confirms the dialog
- **THEN** the dialog named 3 links, the new aspect is the Uni aspect, and no todo or rule has a class link
- **proof:** e2e

#### Scenario: Changing the Uni aspect clears class, type and revised date
- **WHEN** the Uni aspect setting is changed to another aspect while linked todos with type and revised date and a linked rule exist
- **THEN** every todo's `classId`, `type` and `revisedAt` and every rule's `classId` and `type` are null, and the number of removed links is returned
- **proof:** unit

#### Scenario: Changing the Uni aspect without links needs no confirmation
- **WHEN** Rue changes the Uni aspect while no todo or rule is linked to a class
- **THEN** no dialog is shown and the new aspect is the Uni aspect
- **proof:** e2e

#### Scenario: Without aspects Uni leads to creating one
- **WHEN** no aspect exists and Rue opens `/uni`
- **THEN** Rue lands on the onboarding screen where aspects are created
- **proof:** e2e

#### Scenario: Deleting the Uni aspect unsets the setting
- **WHEN** the aspect chosen as Uni aspect is deleted with its todos and rules moved to another aspect
- **THEN** the Uni aspect setting reads as unset and none of the moved todos or rules keeps a class, type or revised date
- **proof:** unit

### Requirement: Uni overview
`/uni` SHALL show active semesters as sections, newest first, each a grid of class cards in creation order,
and below them a collapsed group "Archived (n)" in which each archived semester is itself collapsed. With
no semesters an empty state offers "New semester"; an active semester without classes shows an inline
empty state with "New class". At 375 px there is one card per row; at 1600 px the grid fills the content
column, aligned per the navigation spec. (S3)

#### Scenario: Semesters are listed newest first with archived ones collapsed
- **WHEN** Rue opens `/uni` with two active semesters created on different days and one archived semester
- **THEN** the newer active semester's section comes first, and below them a collapsed "Archived (1)" group shows the archived semester only after expanding it, and that semester's classes only after expanding the semester too
- **proof:** e2e

#### Scenario: No semesters shows an empty state
- **WHEN** Rue opens `/uni` with the Uni aspect set and no semesters
- **THEN** an empty state with a "New semester" action is shown and no semester section is rendered
- **proof:** e2e

#### Scenario: Semester without classes offers New class
- **WHEN** Rue opens `/uni` with one active semester that has no classes
- **THEN** the semester section shows an inline empty state with a "New class" action
- **proof:** e2e

#### Scenario: Phone shows one class card per row
- **WHEN** `/uni` with a semester of three classes is opened at 375 px
- **THEN** every card's left edge lines up and no two cards share a row
- **proof:** e2e

#### Scenario: Wide desktop class grid fills the content column
- **WHEN** `/uni` with a semester of four classes is opened at 1600 px
- **THEN** the card grid's width equals the content column's width (within 2 px) and its first row holds more than one card
- **proof:** e2e

### Requirement: Semester management
Rue SHALL create a semester with a required name, rename it, archive it, unarchive it and delete it. An empty
or whitespace-only name is rejected with error `required` on `name`; duplicate names are allowed. A new
semester appears as an empty section among the active ones. (S4)

#### Scenario: New semester appears among the active ones
- **WHEN** Rue chooses "New semester" on `/uni`, enters "WS 26/27" and saves
- **THEN** an empty section "WS 26/27" appears first among the active semesters
- **proof:** e2e

#### Scenario: Rename a semester
- **WHEN** Rue renames the semester "WS 26/27" to "Winter 26/27"
- **THEN** the section heading shows "Winter 26/27", also after reload
- **proof:** e2e

#### Scenario: Empty semester name is rejected
- **WHEN** a semester is created or renamed with an empty or whitespace-only name
- **THEN** the request fails with error `required` on field `name` and nothing is stored or changed
- **proof:** unit

#### Scenario: Duplicate semester names are allowed
- **WHEN** two semesters named "SS 27" are created
- **THEN** both are stored
- **proof:** unit

### Requirement: Archive a semester
Archiving a semester whose classes have open todos (not done) SHALL show a dialog naming their count;
confirming sets them done with `completed_at` now and archives the semester, cancelling changes nothing.
Without open todos no dialog is shown. An archived semester and its classes are read-only: classes cannot be
added or edited, notes, metadata, todos and revised dates cannot be changed, and the semester cannot be
renamed; delete and unarchive stay possible. Every such write is refused on the server with error
`archived`. Unarchiving lifts read-only; the todos stay done. (S5)

#### Scenario: Archiving with open todos asks for confirmation
- **WHEN** Rue archives a semester whose classes have two open todos and one done todo, and confirms the dialog
- **THEN** the dialog named 2 open todos, the semester appears collapsed under "Archived (1)", and all three todos are done
- **proof:** e2e

#### Scenario: Cancelling the archive warning changes nothing
- **WHEN** Rue archives a semester with open class todos and cancels the dialog
- **THEN** the semester is still active and its todos are still open
- **proof:** e2e

#### Scenario: Archiving without open todos needs no confirmation
- **WHEN** Rue archives a semester whose class todos are all done
- **THEN** no dialog is shown and the semester is archived
- **proof:** e2e

#### Scenario: Archiving completes open todos
- **WHEN** a semester whose classes have open todos (one in the active sprint, one in the backlog) is archived
- **THEN** both are status done with `completedAt` set to now, the semester has `archivedAt` set, and the number of completed todos is returned
- **proof:** unit

#### Scenario: Archived semester refuses writes
- **WHEN** for an archived semester a rename, a new class, a class edit, a notes edit and a revised date are attempted, and `todoWritable` is asked for one of its class todos
- **THEN** each fails with error `archived` and nothing is stored or changed
- **proof:** unit

#### Scenario: Archived class todo edited via todos is rejected
- **WHEN** a request to the `/todos` `update` action is posted for a class todo of an archived semester
- **THEN** the action fails with error `archived` and the todo is unchanged
- **proof:** e2e

#### Scenario: Unarchive lifts read-only
- **WHEN** an archived semester whose todos were completed by archiving is unarchived and one of its classes is renamed
- **THEN** the semester is active, the rename succeeds and the todos are still done
- **proof:** unit

### Requirement: Delete a semester
Rue SHALL delete a semester after a confirm dialog naming the number of its classes and todos; deleting
removes the semester, its classes, all their todos (done ones included) and their recurring rules. An empty
semester gets a plain confirm. (S6)

#### Scenario: Deleting a semester asks for confirmation naming counts
- **WHEN** Rue deletes a semester with two classes and five todos
- **THEN** the dialog names 2 classes and 5 todos; cancelling keeps everything, confirming removes the section
- **proof:** e2e

#### Scenario: Deleting a semester removes everything belonging to it
- **WHEN** a semester with two classes, open and done class todos with checklist items, and a class rule is deleted
- **THEN** the semester, both classes, all their todos and checklist items and the rule are gone, and other semesters' classes and todos are untouched
- **proof:** unit

#### Scenario: Deleting an empty semester uses a plain confirm
- **WHEN** Rue deletes a semester without classes
- **THEN** the confirm dialog names no counts and confirming removes the semester
- **proof:** e2e

### Requirement: Create and edit a class
Rue SHALL create a class in an active semester (from its section's "New class") and edit it on its detail
page. The name is required; colour is one of the 8 aspect colours and icon one of the aspect icons, chosen
with the picker shared with the aspect form; optional lecturer, room, ECTS, links (label + URL), exam
date/time, exam room and grade. Errors: whitespace name → `required`@`name`; colour or icon outside the set
→ `invalid`@`color` / `invalid`@`icon`; ECTS not a number ≥ 0 in steps of 0.5 → `invalid`@`ects`; a link URL
that is not http(s) → `invalid`@`links`, rows with label and URL empty are dropped; a grade not one of
1.0/1.3/1.7/2.0/2.3/2.7/3.0/3.3/3.7/4.0/5.0/passed → `invalid`@`grade`. (S7)

#### Scenario: Add a class from the semester section
- **WHEN** Rue chooses "New class" in a semester section, enters a name, picks a colour and an icon, and saves
- **THEN** a card with that name and an icon tile in that colour appears in the semester
- **proof:** e2e

#### Scenario: Class fields round-trip
- **WHEN** a class is created with name, colour, icon, lecturer, room, ECTS 7.5, two links, exam date/time, exam room and grade 1.7
- **THEN** reading it back returns those values and `createdAt` equal to `updatedAt`
- **proof:** unit

#### Scenario: Invalid class input is rejected
- **WHEN** a class is created or updated with a blank name, a colour or icon outside the sets, ECTS `-1`, `abc` or `2.3`, a link URL `ftp://x`, or grade `2.5`
- **THEN** each fails with the matching error on its field and the stored class is unchanged
- **proof:** unit

#### Scenario: Empty link rows are dropped
- **WHEN** a class is saved with links `("Moodle", "https://moodle.example")` and a row with empty label and URL
- **THEN** it is stored with exactly the Moodle link
- **proof:** unit

#### Scenario: Edit a class on its detail page
- **WHEN** Rue changes name, colour, lecturer, ECTS, exam date and grade on a class's detail page and saves
- **THEN** the header, metadata and grade show the new values, also after reload
- **proof:** e2e

#### Scenario: Field errors show on the class form
- **WHEN** Rue saves the class form with an empty name and ECTS `-1`
- **THEN** the form stays open and shows an error at the name and at ECTS
- **proof:** e2e

### Requirement: Class card
A class card SHALL show an icon tile in the class colour, the name, the lecturer if set, the number of open
todos, the next due date of its open todos, an exam countdown ("Exam in 12 d", "Exam today"; past exams not
shown) and the grade if set. Missing bits are left out and all cards in a row keep the same height; clicking
a card opens the class detail. (S8)

#### Scenario: Card shows the class summary
- **WHEN** a class has a lecturer, three todos of which one is done and the open ones are due in 3 and 5 days, an exam in 12 days and grade 1.3
- **THEN** its card shows the icon tile, name, lecturer, open count 2, the date due in 3 days, "Exam in 12 d" and "1.3"
- **proof:** e2e

#### Scenario: Exam today and past exams
- **WHEN** one class's exam is today and another's was yesterday
- **THEN** the first card shows "Exam today" and the second shows no exam countdown
- **proof:** e2e

#### Scenario: Sparse card keeps the row height
- **WHEN** a class without lecturer, todos, exam and grade sits in a row next to a fully filled class card at 1600 px
- **THEN** the sparse card shows only icon tile, name and open count 0, and both cards have the same height
- **proof:** e2e

#### Scenario: Card summary counts open todos and the next due date
- **WHEN** the overview data is computed for a class with a done todo due yesterday, an open undated todo and open todos due in 3 and 5 days
- **THEN** the class summary has `openTodos` 3 and `nextDue` the date in 3 days
- **proof:** unit

### Requirement: Class detail page
`/uni/classes/[id]` SHALL show a header with the class icon and name, the metadata (lecturer, room, ECTS,
links opening in a new tab, exam date/time and room, grade) in the context rail at ≥ 1280 px and as a
wrapping row under the title below (no rail toggle), the Markdown notes rendered and sanitized as on
projects (placeholder when empty), the class todos in Open (no sprint, not done), Planned (in a sprint, not
done) and Done (collapsed, newest completion first) with an empty state when there are none, and the class's
recurring rules listed by title with a link to `/recurring`. An unknown id shows the 404 page. An archived
class shows no edit controls. (S9)

#### Scenario: Class metadata sits in the rail at 1280
- **WHEN** a class with lecturer, room, ECTS, a link, exam and grade is opened at 1280 px and at 1600 px
- **THEN** those values are shown inside the docked context rail and the link has `target="_blank"`
- **proof:** e2e

#### Scenario: Class metadata wraps under the title below 1280
- **WHEN** the same class is opened at 1100 px and at 375 px
- **THEN** no rail and no rail toggle are shown, and the metadata is shown in a row below the heading without horizontal scroll
- **proof:** e2e

#### Scenario: Class notes are edited as Markdown and shown rendered
- **WHEN** Rue opens the class notes editor, enters `## Exam topics` and `- **Fourier**`, and saves
- **THEN** the notes show an `h2` "Exam topics" and a list item with bold "Fourier", and after reload the editor holds the raw Markdown
- **proof:** e2e

#### Scenario: Class without notes or todos shows placeholders
- **WHEN** Rue opens a class with no notes and no todos
- **THEN** a notes placeholder and a todos empty state are shown
- **proof:** e2e

#### Scenario: Class todos are grouped Open, Planned, Done
- **WHEN** a class has a backlog todo, a todo in the active sprint, a todo in a planning sprint and two done todos completed on different days
- **THEN** its todos come back as Open with the backlog todo, Planned with both sprint todos, and Done with the later completion first
- **proof:** unit

#### Scenario: Class Done group starts collapsed
- **WHEN** Rue opens a class with open, planned and done todos
- **THEN** Open and Planned rows are visible, Done shows its count and its rows appear only after expanding it
- **proof:** e2e

#### Scenario: Class rules are listed with a link to Recurring
- **WHEN** Rue opens a class with a linked rule "Lecture review"
- **THEN** the page lists "Lecture review" and a link to `/recurring`
- **proof:** e2e

#### Scenario: Unknown class id shows 404
- **WHEN** Rue opens `/uni/classes/999999`
- **THEN** the error page with status 404 is shown
- **proof:** e2e

#### Scenario: Archived class has no edit controls
- **WHEN** Rue opens a class of an archived semester
- **THEN** no edit, notes-edit, quick-add or "Revised today" control is shown, and delete is still offered
- **proof:** e2e

### Requirement: Delete a class
Rue SHALL delete a class from its detail page after a confirm dialog naming its todo count; deleting removes
the class, its todos and its rules and returns to `/uni`. (S10)

#### Scenario: Deleting a class asks for confirmation naming the todo count
- **WHEN** Rue deletes a class with three todos
- **THEN** the dialog names 3 todos; cancelling keeps the class, confirming removes it and navigates to `/uni`
- **proof:** e2e

#### Scenario: Deleting a class removes its todos and rules
- **WHEN** a class with todos and a rule is deleted
- **THEN** the class, its todos and its rule are gone, and other classes' todos are untouched
- **proof:** unit

### Requirement: Add todos on the class
The class detail page SHALL offer a QuickAdd that creates a todo with the Uni aspect and the class preset,
a Type chip (LEC / EXC / OTH, default OTH), due date and priority. The todo is a normal backlog todo. (S11)

#### Scenario: Quick add on class detail creates a linked todo
- **WHEN** Rue enters a title on a class's detail page, picks type LEC and a due date, and submits
- **THEN** the todo appears under Open on the class, and on Backlog under the Uni aspect with the class badge
- **proof:** e2e

#### Scenario: Type defaults to OTH
- **WHEN** a todo is created on class detail without touching the Type chip
- **THEN** it is stored with type OTH
- **proof:** e2e

### Requirement: Last revised date
Each todo on the class detail page SHALL have a "Revised today" action setting its `revised_at` to today, and
shows "Revised <relative date>" or "Not revised"; the date can be cleared. Only class-linked todos carry a
revised date. On an archived class it is read-only. (S12)

#### Scenario: Revised today sets the date
- **WHEN** Rue presses "Revised today" on a never-revised class todo
- **THEN** the row showed "Not revised" before and shows "Revised today" afterwards, also after reload
- **proof:** e2e

#### Scenario: Revised date can be cleared
- **WHEN** Rue clears the revised date of a todo revised three days ago
- **THEN** the row showed "Revised 3 days ago" and now shows "Not revised"
- **proof:** e2e

#### Scenario: Revised date is stored only on class todos
- **WHEN** a revised date is set on a class todo and on a todo without class
- **THEN** the first stores today's date, the second fails with error `invalid` and stays unchanged
- **proof:** unit

### Requirement: Grade averages
`/uni` SHALL show, per semester in its section header and overall in one line, the ECTS-weighted average of
graded classes and the earned ECTS. "Passed" counts toward earned ECTS but not the average; 5.0 counts
toward neither; classes without ECTS are excluded from the average and earn nothing. Without any counting
grade the average is "—". Archived semesters count toward the overall figures. The average is shown with
two decimals. (S14)

#### Scenario: Weighted average matches a hand calculation
- **WHEN** a semester has classes 1.3 / 5 ECTS, 2.7 / 10 ECTS, passed / 5 ECTS, 5.0 / 5 ECTS and 1.0 without ECTS
- **THEN** its average is (1.3·5 + 2.7·10) / 15 = 2.2333… and its earned ECTS are 20
- **proof:** unit

#### Scenario: Overall figures include archived semesters
- **WHEN** an active semester has 1.0 / 5 ECTS and an archived one 3.0 / 5 ECTS
- **THEN** the overall average is 2.0 and the overall earned ECTS are 10
- **proof:** unit

#### Scenario: Grades are shown on the overview
- **WHEN** Rue opens `/uni` with the classes of "Weighted average matches a hand calculation" in one semester and no other semester
- **THEN** the semester header and the overall line show "2.23" and "20 ECTS"
- **proof:** e2e

#### Scenario: No grades shows a dash
- **WHEN** Rue opens `/uni` with classes but no grades
- **THEN** the semester header and the overall line show "—" as average
- **proof:** e2e

### Requirement: Deadline overview
`/uni` SHALL list open class todos with a due date and exam dates from today on, across active semesters,
ascending by date; overdue todos are flagged. Each row shows the class badge, the todo title or "Exam", and
the date. At ≥ 1280 px the list sits in the context rail; below 1280 px it is a section above the semesters.
With nothing due a short empty line is shown. Undated todos are excluded. (S16)

#### Scenario: Deadlines list todos and exams in date order
- **WHEN** an active semester has an open todo due yesterday, an exam in 4 days, an open todo due in 2 days, an undated open todo and a done dated todo, and an archived semester has an exam in 1 day
- **THEN** the overview lists, in order, the overdue todo (flagged), the todo due in 2 days and the exam, and nothing else
- **proof:** unit

#### Scenario: Deadline overview sits in the rail at 1280
- **WHEN** Rue opens `/uni` at 1600 px and at 375 px with one dated class todo and one future exam
- **THEN** at 1600 px both rows with class badge, title or "Exam" and date are in the docked context rail, and at 375 px they are in a section above the first semester
- **proof:** e2e

#### Scenario: Nothing due shows an empty line
- **WHEN** Rue opens `/uni` with classes but no dated open todos and no future exams
- **THEN** the deadline overview shows a short empty line
- **proof:** e2e

### Requirement: Uni screens keep the existing motion
Uni screens SHALL use only the route cross-fade from the motion spec; opening a card and expanding a
collapsed group do not animate. (S18)

#### Scenario: Opening a class uses only the route cross-fade
- **WHEN** with motion allowed Rue clicks a class card and then, back on `/uni`, expands the Archived group
- **THEN** `document.startViewTransition` was called once per navigation and no other animation is running after either action
- **proof:** e2e

### Requirement: Uni journey
The pieces SHALL work together end to end: a class todo flows through Backlog, Sprint and Today and is
reflected on its class. (Done criteria)

#### Scenario: Class card opens the class detail
- **WHEN** Rue clicks a class card on `/uni`
- **THEN** `/uni/classes/<id>` shows the class name as heading, its metadata, notes and todos
- **proof:** e2e

#### Scenario: Class todo moves through the class's groups
- **WHEN** during a running sprint Rue creates a todo via QuickAdd on a class's detail page, adds it to the sprint from Backlog, then ticks it done on Today
- **THEN** the todo shows the class badge in Backlog, Sprint and Today, and the class detail lists it under Open, then Planned, then Done
- **proof:** e2e
