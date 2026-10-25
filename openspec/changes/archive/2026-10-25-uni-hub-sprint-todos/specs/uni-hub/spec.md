## REMOVED Requirements

### Requirement: Deadline overview
**Reason**: Rue replaced the "Due next" list with the sprint-todo list ("This week") so the class cards come first and only this week's work is shown; exam rows are dropped with it.
**Migration**: None needed; nothing stored. The sprint-todo list (requirement "Uni sprint todo list") shows the class todos of the active sprint; exam dates stay on the class card countdown and the class page.

## MODIFIED Requirements

### Requirement: Uni overview
`/uni` SHALL show, in this order, the page header, the grade line, the active semesters as sections (newest first, each a grid of class cards in creation order), the "This week" sprint-todo list, a collapsed group "Archived (n)" in which each archived semester is itself collapsed, and the notes. With
no semesters an empty state offers "New semester" and no "This week" list is shown; an active semester without classes shows an inline
empty state with "New class". At ≥ 1280 px the context rail holds only the Uni aspect line; there is no deadline list in the rail or on the page. At 375 px there is one card per row; at 1600 px the grid fills the content
column, aligned per the navigation spec. (S3, uni-hub-sprint-todos S1)

#### Scenario: Semesters are listed newest first with archived ones collapsed
- **WHEN** Rue opens `/uni` with two active semesters created on different days and one archived semester
- **THEN** the newer active semester's section comes first, and below them a collapsed "Archived (1)" group shows the archived semester only after expanding it, and that semester's classes only after expanding the semester too
- **proof:** e2e

#### Scenario: Class cards come before This week, notes come last
- **WHEN** Rue opens `/uni` at 1600 px with one active semester with a class, one archived semester, and one open class todo in the active sprint
- **THEN** from top to bottom the page shows the heading "Uni", the overall grade line, the semester section with its class card, the "This week" list, the "Archived (1)" group and the notes, each starting below the end of the previous one
- **proof:** e2e

#### Scenario: Due next and exams are gone from the hub
- **WHEN** Rue opens `/uni` at 1600 px and at 375 px with a dated open class todo, an exam in 4 days and a class in an active sprint
- **THEN** there is no "Due next" heading, no `deadline-list` and no `deadline-row` on the page at either width, and the exam appears only as the countdown on its class card
- **proof:** e2e

#### Scenario: Rail holds only the aspect line at 1600
- **WHEN** Rue opens `/uni` at 1600 px with a class todo in the active sprint
- **THEN** the docked context rail (awaited before measuring) contains the Uni aspect line with the aspect name and the "Change" button, and neither the "This week" list nor any todo row is inside the rail
- **proof:** e2e

#### Scenario: No semesters shows an empty state
- **WHEN** Rue opens `/uni` with the Uni aspect set and no semesters
- **THEN** an empty state with a "New semester" action is shown, no semester section is rendered and no "This week" list is shown
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

#### Scenario: Without a Uni aspect the prompt replaces the hub
- **WHEN** Rue opens `/uni` with aspects but no Uni aspect set
- **THEN** only the Uni aspect prompt is shown, with no "This week" list and no semester section
- **proof:** e2e ("Scenario: First run prompts for the Uni aspect")

## ADDED Requirements

### Requirement: Uni sprint todo list
`/uni` SHALL show below the active semesters a section "This week" with the total count, listing every open (status not done) todo that has a class in a non-archived semester and sits in the active sprint (`sprints.state = 'active'`). Each row shows the title, the class badge, the due date if any and the type chip. Rows are ordered by due date ascending, undated last, then by id. Done todos, todos of archived semesters, todos without a class and todos outside the active sprint (backlog, another sprint) SHALL NOT appear. With no active sprint or no matching todo the section shows one line "Nothing in this week's sprint" and no pager. (uni-hub-sprint-todos S2)

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
- **THEN** the `sprint-todos` section's heading reads "This week" with count 3, it holds exactly three `sprint-todo-row`s in the order OTH (Tomorrow), LEC (Thu 8 Oct), EXC (no date), and each row shows its title, a class badge naming "Analysis II" with its type chip, and its due date where it has one
- **proof:** e2e

#### Scenario: Hub shows an empty line without sprint todos
- **WHEN** Rue opens `/uni` with a class but no active sprint, and again with an active sprint that holds only a done class todo and an unlinked todo
- **THEN** the `sprint-todos` section shows "Nothing in this week's sprint", has no rows and no pager
- **proof:** e2e

### Requirement: Sprint list paging
The sprint-todo list SHALL show at most 6 rows per page, paged on the client, with "Previous" and "Next" buttons and the text "Page n of m". The pager SHALL be hidden when the list has 6 or fewer todos. "Previous" is disabled on the first page and "Next" on the last; the current page SHALL clamp into range whenever the list shrinks. The page is not stored. (uni-hub-sprint-todos S3)

#### Scenario: Seven todos make two pages
- **WHEN** Rue opens `/uni` with 7 open class todos in the active sprint and uses the pager (Next, then Previous)
- **THEN** page 1 shows 6 rows and "Page 1 of 2" with Previous disabled and Next enabled, after Next the section shows the 7th row and "Page 2 of 2" with Next disabled and Previous enabled, after Previous the 6 rows of page 1 are back; the heading count reads 7 throughout
- **proof:** e2e

#### Scenario: Exactly six todos show no pager
- **WHEN** Rue opens `/uni` with exactly 6 open class todos in the active sprint
- **THEN** all 6 rows are shown and the pager is not in the page
- **proof:** e2e

#### Scenario: Page clamps into range
- **WHEN** `clampPage` is called with page 2 and 6 todos, page 2 and 0 todos, page 5 and 13 todos, page 0 and 13 todos, and page 2 and 7 todos, and `pageCount` with 0, 6 and 7 todos
- **THEN** the clamped pages are 1, 1, 3, 1 and 2 (pages count from 1), and the page counts are 1, 1 and 2
- **proof:** unit

### Requirement: Todo type colours on the hub list
Each card of the sprint-todo list on `/uni` SHALL be tinted by its todo's type through its background and border: LEC orange, EXC turquoise, OTH grey, no type grey like OTH. The colours SHALL come from new design tokens `--lec`, `--exc`, `--oth` with tint variants, defined as hex literals, and the card's ink SHALL keep a contrast ratio of at least 4.5:1 on its tint. An overdue row keeps its overdue marking (the "Overdue" note in the overdue colour) on top of the tint. The tint applies only to the hub list: class page todo rows and the class badge SHALL look as before. (uni-hub-sprint-todos S4)

#### Scenario: Cards are tinted by type
- **WHEN** Rue opens `/uni` with open class todos in the active sprint of type LEC, EXC and OTH and one class todo without a type
- **THEN** the computed background and border colours of the LEC, EXC and OTH cards are pairwise different, the LEC background is warm (red channel above blue), the EXC background is cool-green (red channel below green and blue), the OTH background has its channels within 10 of each other, and the untyped card's background and border equal the OTH card's
- **proof:** e2e

#### Scenario: Ink keeps AA contrast on every tint
- **WHEN** Rue opens `/uni` with a LEC, an EXC and an OTH card in the sprint list
- **THEN** for each card the computed colour of its title against the card's computed background has a contrast ratio of at least 4.5:1
- **proof:** e2e

#### Scenario: Overdue rows keep their marking on the tint
- **WHEN** with the clock at 2026-10-05 Rue opens `/uni` with a LEC class todo in the active sprint due 2026-10-03
- **THEN** its card shows the due text "Overdue" with computed colour `--overdue` (rgb(196, 47, 37)) and its background is still the LEC tint
- **proof:** e2e

#### Scenario: Class page rows are not tinted
- **WHEN** Rue opens the class page of a class that has an open LEC todo and an open EXC todo
- **THEN** the two todo rows have the same computed background and border colours, and neither equals the hub's LEC or EXC card colours
- **proof:** e2e
