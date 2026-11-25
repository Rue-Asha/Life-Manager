## ADDED Requirements

### Requirement: Uni screen on the fingerprint
`/uni` SHALL render on the fingerprint with the overall grade line, active semesters with their classes, "This week", the global notes, "New semester" and "New class", the collapsed archived semesters, and archiving a semester with its confirmation. With no semesters it SHALL read "Start with the semester you are in now"; a semester without classes "No classes yet" (empty-state headings, no trailing period); before the Uni aspect is chosen only the one-time Uni aspect prompt is shown; an archived semester is read-only. The notes and the Uni aspect line sit in the "Notes and Uni aspect" panel, a right column from 1280 px and a card stacked below the main column under 1280 px (gate 4 pick a); "New semester" in the page head is a secondary (glass) pill (gate 5, Q3); archiving a semester is not destructive and confirms on the filled primary (gate 4 pick). Layout as in "Uni overview", class rows as in "Class row", type tags as in "Todo type marks on the hub list". (S20)

#### Scenario: Uni overview shows semesters, This week and the grade line
- **WHEN** an active semester with two graded classes and an open class todo in the running sprint exists and `/uni` is opened
- **THEN** the grade line, the semester with both classes, "This week" with the todo and the global notes are shown
- **proof:** e2e

#### Scenario: No semesters and no classes copy
- **WHEN** the Uni aspect is set and no semester exists, then a semester without classes is created
- **THEN** first the page reads "Start with the semester you are in now" with "New semester", then the semester reads "No classes yet" with "New class"
- **proof:** e2e

#### Scenario: Uni aspect prompt before the first use
- **WHEN** no Uni aspect is set and `/uni` is opened
- **THEN** only the prompt "Which aspect holds your uni todos?" with "Use <aspect> for classes" is shown
- **proof:** e2e

#### Scenario: Archiving a semester asks and makes it read-only
- **WHEN** a semester with 2 open class todos is archived
- **THEN** the confirmation reads "Mark 2 done and archive", and afterwards the semester sits in the collapsed Archived group and shows "Read-only." with "Unarchive"
- **proof:** e2e

#### Scenario: Uni kicker names the section, not the chosen aspect
- **WHEN** Rue opens `/uni` with a Uni aspect that has any name
- **THEN** the kicker above the heading reads "Life" then "Study"
- **proof:** e2e

### Requirement: Class page on the fingerprint
`/uni/classes/[id]` SHALL render on the fingerprint with details (lecturer, room, ECTS, links), exam, grade, notes, the class todos grouped Open / Planned / Done with their type (LEC / EXC / OTH as letters, glyph and fill, gate 5 Q8: LEC sunken with lines, EXC raised with a pencil, OTH no fill with a dot) and "revised" date ("Mark revised today" / "Revised today", gate 5 Q12), and the class's recurring rules in the "Recurring" panel (a right column from 1280 px, stacked below under 1280 px, gate 4 pick a). Layout as in "Class detail page". A class of an archived semester SHALL be read-only (no editor, no done, status or day controls); missing exam or grade fields are omitted or read as their contract placeholder; an unknown id SHALL show the fingerprint 404 page "Class not found" with a link to Uni. (S21)

#### Scenario: Class page shows details, todos by type and revised dates
- **WHEN** a class with lecturer, room, 5 ECTS, a link, an exam, grade 1.3, a LEC todo revised today and an EXC todo is opened
- **THEN** every detail is shown, each todo shows its type, and the LEC todo shows its revised date with "Clear revised date"
- **proof:** e2e

#### Scenario: Archived class is read-only
- **WHEN** a class of an archived semester is opened
- **THEN** it reads "<semester> is archived. This class is read-only." and its todos have no done, status or day controls and no editor
- **proof:** e2e

#### Scenario: Class without exam and grade
- **WHEN** a class without exam and grade is opened
- **THEN** no exam countdown is shown and the page has no horizontal scroll at 375 px
- **proof:** e2e

#### Scenario: Unknown class shows Class not found
- **WHEN** `/uni/classes/99999` is opened
- **THEN** the status is 404 and the page reads "Class not found" with a link "Uni"
- **proof:** e2e

#### Scenario: Open class todos have a More actions menu
- **WHEN** Rue opens a class page whose Open group holds a todo "Read chapter 3" and opens its "More actions: Read chapter 3" button
- **THEN** the row has no checkbox, and the menu offers "Plan a day"
- **proof:** e2e

## RENAMED Requirements

- FROM: `### Requirement: Class card`
- TO: `### Requirement: Class row`
- FROM: `### Requirement: Uni screens keep the existing motion`
- TO: `### Requirement: Uni screens use the family motion`
- FROM: `### Requirement: Todo type colours on the hub list`
- TO: `### Requirement: Todo type marks on the hub list`

## MODIFIED Requirements

### Requirement: Add todos on the class
The class detail page SHALL offer a QuickAdd that creates a todo with the Uni aspect and the class preset,
a title and a Type chip (LEC / EXC / OTH, default OTH), as signed for inline adds at gate 5 (title only, plus the type on the class page); due date and priority are set through the global "New todo". The todo is a normal backlog todo. (S11)

#### Scenario: Quick add on class detail creates a linked todo
- **WHEN** Rue enters a title on a class's detail page, picks type LEC, and submits (the form has no due date or priority field)
- **THEN** the todo appears under Open on the class, and on Backlog under the Uni aspect with the class badge
- **proof:** e2e

#### Scenario: Type defaults to OTH
- **WHEN** a todo is created on class detail without touching the Type chip
- **THEN** it is stored with type OTH
- **proof:** e2e

### Requirement: Last revised date
Each todo on the class detail page SHALL have a "Mark revised today" action (accessible name "Mark revised today: <title>", verb first as decided at gate 5) setting its `revised_at` to today, and
shows "Revised <relative date>" or "Not revised"; the date can be cleared. Only class-linked todos carry a
revised date. On an archived class it is read-only. (S12)

#### Scenario: Revised today sets the date
- **WHEN** Rue presses "Mark revised today" on a never-revised class todo
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

### Requirement: Uni overview
`/uni` SHALL show, in this order, the page header with the grade line as its key-facts card (Average, ECTS earned), then in the main column the active semesters as cards (newest first, each listing its classes as rows in creation order), the "This week" sprint-todo list and a collapsed group "Archived (n)" in which each archived semester is itself collapsed. The notes and the Uni aspect line (with "Change") sit in a side panel "Notes and Uni aspect": a right column from 1280 px and a card stacked below the main column under 1280 px (gate 4 pick a). With
no semesters an empty state offers "New semester" and no "This week" list is shown; an active semester without classes shows an inline
empty state with "New class". There is no deadline list in the side panel or on the page. Class rows are one per line at every width, and a semester card fills the main column. (S3, uni-hub-sprint-todos S1, S20)

#### Scenario: Semesters are listed newest first with archived ones collapsed
- **WHEN** Rue opens `/uni` with two active semesters created on different days and one archived semester
- **THEN** the newer active semester's section comes first, and below them a collapsed "Archived (1)" group shows the archived semester only after expanding it, and that semester's classes only after expanding the semester too
- **proof:** e2e

#### Scenario: Classes come before This week, notes sit in the side panel
- **WHEN** Rue opens `/uni` at 1600 px and at 375 px with one active semester with a class, one archived semester, one open class todo in the active sprint and notes
- **THEN** the overall grade line is the key-facts card right of the heading at 1600 px and below the heading at 375 px; from top to bottom the main column shows the semester card with its class row, the "This week" list and the "Archived (1)" group, each starting below the end of the previous one; the notes sit in the "Notes and Uni aspect" panel, right of the main column at 1600 px and below the "Archived (1)" group at 375 px
- **proof:** e2e

#### Scenario: Due next and exams are gone from the hub
- **WHEN** Rue opens `/uni` at 1600 px and at 375 px with a dated open class todo, an exam in 4 days and a class in an active sprint
- **THEN** there is no "Due next" heading, and no text, heading, region or list mentioning a deadline on the page at either width, and the exam appears only as the countdown on its class row
- **proof:** e2e

#### Scenario: Side panel holds the notes and the aspect line
- **WHEN** Rue opens `/uni` at 1600 px with a class todo in the active sprint
- **THEN** the "Notes and Uni aspect" panel contains the notes and the Uni aspect line with the aspect name and the "Change" button, and neither the "This week" list nor any todo row is inside the panel
- **proof:** e2e

#### Scenario: No semesters shows an empty state
- **WHEN** Rue opens `/uni` with the Uni aspect set and no semesters
- **THEN** an empty state with a "New semester" action is shown, no semester section is rendered and no "This week" list is shown
- **proof:** e2e

#### Scenario: Semester without classes offers New class
- **WHEN** Rue opens `/uni` with one active semester that has no classes
- **THEN** the semester section shows an inline empty state with a "New class" action
- **proof:** e2e

#### Scenario: Classes are one row each
- **WHEN** `/uni` with a semester of three classes is opened at 375 px and at 1600 px
- **THEN** at both widths every class row's left edge lines up and no two rows share a top edge
- **proof:** e2e

#### Scenario: Semester card fills the main column at 1600
- **WHEN** `/uni` with a semester of four classes is opened at 1600 px
- **THEN** the semester card's width equals the main column's width (within 2 px) and the "Notes and Uni aspect" panel's left edge is right of the main column's right edge
- **proof:** e2e

#### Scenario: Without a Uni aspect the prompt replaces the hub
- **WHEN** Rue opens `/uni` with aspects but no Uni aspect set
- **THEN** only the Uni aspect prompt is shown, with no "This week" list and no semester section
- **proof:** e2e ("Scenario: First run prompts for the Uni aspect")

### Requirement: Class row
A class SHALL be a row in its semester's card (as signed at gate 5) showing an icon tile in the class colour, the name, the lecturer if set, the grade as a tag if set, the open
todos as "<n> open" ("No open todos" at zero), the next due date of its open todos and an exam countdown ("Exam in 12 d", "Exam today"; past exams not
shown). Missing bits are left out; the whole row is a link that opens the class detail. (S8, S20)

#### Scenario: Row shows the class summary
- **WHEN** a class has a lecturer, three todos of which one is done and the open ones are due in 3 and 5 days, an exam in 12 days and grade 1.3
- **THEN** its row shows the icon tile, name, lecturer, "2 open", the date due in 3 days, "Exam in 12 d" and "1.3"
- **proof:** e2e

#### Scenario: Exam today and past exams
- **WHEN** one class's exam is today and another's was yesterday
- **THEN** the first row shows "Exam today" and the second shows no exam countdown
- **proof:** e2e

#### Scenario: Sparse class row leaves the missing bits out
- **WHEN** a class without lecturer, todos, exam and grade is listed next to a fully filled class at 1600 px
- **THEN** the sparse row shows only icon tile, name and "No open todos", and no empty lecturer, grade, due or exam text
- **proof:** e2e

#### Scenario: Card summary counts open todos and the next due date
- **WHEN** the overview data is computed for a class with a done todo due yesterday, an open undated todo and open todos due in 3 and 5 days
- **THEN** the class summary has `openTodos` 3 and `nextDue` the date in 3 days
- **proof:** unit

### Requirement: Class detail page
`/uni/classes/[id]` SHALL show a header with the breadcrumb "Uni › Class", the class icon and name and the "Class actions" menu, the open / planned / done counts as its key-facts card from 768 px, then in the main column at every width a "Details" card with the metadata (lecturer, room, ECTS,
links opening in a new tab, exam date/time, room and countdown, grade; missing rows are left out, the Grade row stays), the Markdown notes rendered and sanitized as on
projects (placeholder when empty) and the class todos (with the add form: title and type LEC / EXC / OTH) in Open (no sprint, not done), Planned (in a sprint, not
done) and Done (collapsed, newest completion first) with an empty state when there are none. The class's
recurring rules are listed by title with a link to `/recurring` in a side panel "Recurring": a right column from 1280 px and a card stacked below the main column under 1280 px (gate 4 pick a). An unknown id shows the 404 page. An archived
class shows the notice "<semester> is archived. This class is read-only." and no edit controls; its todo rows are read-only (no editor, done or status control, day picker, "Mark revised today" or
sprint actions). (S9, S21)

#### Scenario: Class details sit in the Details card at every width
- **WHEN** a class with lecturer, room, ECTS, a link, exam and grade is opened at 1280 px and at 375 px
- **THEN** at both widths those values are shown inside the "Details" card of the main column, the link has `target="_blank"`, and at 375 px the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Class rules sit beside the main column from 1280
- **WHEN** a class with a linked rule is opened at 1280 px and at 1100 px
- **THEN** at 1280 px the "Recurring" panel's left edge is right of the main column's right edge, and at 1100 px it starts below the todos card; no rail toggle exists at either width
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
- **THEN** no edit, notes-edit, quick-add or "Mark revised today" control is shown, the open, planned and done todo rows have no checkbox, status, day or link control and their title opens no editor, and each row's only action is its trash button "Delete todo: <title>" (see the todos spec, "Archived class todo deletes from the row")
- **proof:** e2e

### Requirement: Uni sprint todo list
`/uni` SHALL show below the active semesters a section "This week" with the total count, listing every open (status not done) todo that has a class in a non-archived semester and sits in the active sprint (`sprints.state = 'active'`). Each row shows the title, the class name, the type tag (an untyped todo reads OTH) and the due text if it has a date: "Due Thu 8 Oct", or "Overdue · Mon 5 Oct" once it has passed. Rows are ordered by due date ascending, undated last, then by id. Done todos, todos of archived semesters, todos without a class and todos outside the active sprint (backlog, another sprint) SHALL NOT appear. With no active sprint or no matching todo the section shows one line "Nothing in this week's sprint" and no pager. (uni-hub-sprint-todos S2)

#### Scenario: Sprint list holds the open class todos of the active sprint
- **WHEN** the sprint-todo list is read with an open todo of a class in the active sprint, a doing todo of another class in the same sprint, a done todo in the sprint, an open class todo in the backlog, an open class todo in a planning sprint, an open todo of an archived semester's class in the active sprint, and an open todo without class in the active sprint
- **THEN** exactly the open and the doing class todo are returned, each with title, due date, class id and type
- **proof:** unit

#### Scenario: Sprint list is ordered by due date, undated last, then id
- **WHEN** the sprint-todo list is read with class todos in the active sprint due 2026-10-09, undated, due 2026-10-06, due 2026-10-06 (created later) and undated (created later)
- **THEN** the order is the earlier-created todo due 2026-10-06, the later-created one due 2026-10-06, the one due 2026-10-09, then the two undated ones by id
- **proof:** unit

#### Scenario: Sprint list is empty without an active sprint
- **WHEN** the sprint-todo list is read with class todos only in a planning sprint and in the backlog, and when no sprint exists
- **THEN** both reads return an empty list
- **proof:** unit

#### Scenario: Hub shows This week with count and row details
- **WHEN** with the clock at Monday 2026-10-05 Rue opens `/uni` with an active sprint holding three open class todos of "Analysis II" (a LEC due 2026-10-08, an EXC undated, an OTH due 2026-10-06), and a done todo, a backlog todo and a todo of an archived class that must not show
- **THEN** the "This week" header reads "This week" with the count 3 beside it, the region holds exactly three todo rows (list items) in the order OTH ("Due Tue 6 Oct"), LEC ("Due Thu 8 Oct"), EXC (no date), and each row shows its title, the class name "Analysis II" and its type tag (OTH, LEC, EXC)
- **proof:** e2e

#### Scenario: Hub shows an empty line without sprint todos
- **WHEN** Rue opens `/uni` with a class but no active sprint, and again with an active sprint that holds only a done class todo and an unlinked todo
- **THEN** the "This week" region shows "Nothing in this week's sprint", has no rows and no pager
- **proof:** e2e

### Requirement: Uni screens use the family motion
Uni screens SHALL use the route cross-fade from the motion spec for opening a class, and, as signed at gate 5, expanding a collapsed group (Archived, an archived semester, a class's Done group) SHALL grow open in about 220 ms with its content fading in, on the fingerprint motion tokens; under `prefers-reduced-motion: reduce` only the opacity changes. Collapsed content is inert. (S18, S24)

#### Scenario: Opening a class cross-fades and groups expand softly
- **WHEN** with motion allowed Rue clicks a class row and then, back on `/uni`, expands the Archived group; then with `prefers-reduced-motion: reduce` collapses and expands it again
- **THEN** `document.startViewTransition` was called once per navigation, the expand runs an animation or transition that has finished within 300 ms, and under reduced motion the expand changes only opacity (no running animation changes size, `transform`, `translate` or `scale`)
- **proof:** e2e

### Requirement: Todo type marks on the hub list
Each row of the sprint-todo list on `/uni` SHALL show its todo's type as signed at gate 5 (Q8): a type tag with the letters (LEC, EXC, OTH; the full word "Lecture", "Exercise", "Other" as its title), a glyph and a fill role, never a hue: LEC on the sunken surface with a lines glyph, EXC on the raised surface with a control ring and a pencil glyph, OTH with no fill, secondary ink and a dot glyph; a class todo without a type shows the OTH tag. Rows are not tinted, and no type colour tokens exist. Each tag's text SHALL keep a contrast ratio of at least 4.5:1 on its own ground. An overdue row keeps its overdue marking ("Overdue · <date>" in the danger colour). The class page's todo rows and the add form's type pick use the same tag. (uni-hub-sprint-todos S4, S20)

#### Scenario: Rows show the type by letters, glyph and fill
- **WHEN** Rue opens `/uni` with open class todos in the active sprint of type LEC, EXC and OTH and one class todo without a type
- **THEN** the rows show the tags "LEC", "EXC" and "OTH" with three different glyphs, the LEC tag's background equals the computed `--surface-sunken`, the EXC tag's background equals the computed `--surface-raised`, the OTH tag has a transparent background, the untyped todo shows the "OTH" tag, and every row has the same background
- **proof:** e2e

#### Scenario: Type tags keep AA contrast
- **WHEN** Rue opens `/uni` with a LEC, an EXC and an OTH todo in the sprint list
- **THEN** for each tag the computed colour of its letters against the tag's computed background (the row's for OTH) has a contrast ratio of at least 4.5:1
- **proof:** e2e

#### Scenario: Overdue rows keep their marking
- **WHEN** with the clock at 2026-10-05 Rue opens `/uni` with a LEC class todo in the active sprint due 2026-10-03
- **THEN** its row shows "Overdue" with its due date in the computed colour of the fingerprint `--danger` role, and its LEC tag is unchanged
- **proof:** e2e

#### Scenario: Class page rows use the same type tags
- **WHEN** Rue opens the class page of a class that has an open LEC todo and an open EXC todo
- **THEN** the two rows show the "LEC" and "EXC" tags with the same backgrounds as on the hub, and the two rows have the same background
- **proof:** e2e
