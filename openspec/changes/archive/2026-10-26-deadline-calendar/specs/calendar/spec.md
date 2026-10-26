## MODIFIED Requirements

### Requirement: Calendar entries
Each day of the shown month SHALL list its entries: todos with an explicit planned `day` (in the backlog, the active
sprint or a closed sprint), with their aspect colour, their slot or "all day", done ones struck through; for every day
after the active sprint's week, or from today on when no sprint is active, one projected occurrence per recurring rule
weekday (rules whose class belongs to an archived semester are not projected, since they never become instances),
with the rule's title, aspect colour and slot, marked as a projection (`data-kind="projection"`, the repeat
glyph and the accessible text "Projected"); and uni exams of active and archived semesters at their `exam_at` time
(an `exam_at` without a time is all-day), shown as "Exam" with the class name and room. Due dates are not entries: open todos with a `due_date` appear in a separate "Due" list per day (see "Calendar layouts"), never among these entries, and
sprint todos without an explicit day are not shown as entries. Days before the active sprint's week (or before today without a
sprint) show only real todos; the active sprint's week shows its real instances only, and a day that already lists a real instance of a rule (e.g. the Sunday a sprint's review closed it, with no sprint active) gets no projection of that rule, so nothing appears twice.
Within a day all-day entries come first, then timed ones by start time, ties by title. (calendar-planning S12)

#### Scenario: Planned todos are entries, due dates are a separate list
- **WHEN** the month 2026-10 is built with a backlog todo planned 2026-10-21 18:00–19:30, an active-sprint todo on 2026-10-15 without slot, a done todo of a closed sprint on 2026-10-02, a sprint todo without a day due 2026-10-16, and a backlog todo due 2026-10-22 without a planned date
- **THEN** 2026-10-21 lists the first with 18:00–19:30, 2026-10-15 the second as all-day, 2026-10-02 the done todo marked done, and 2026-10-16 and 2026-10-22 have no entry but each lists its due todo in `due`
- **proof:** unit

#### Scenario: Rules are projected after the active sprint week
- **WHEN** today is 2026-10-14 in a sprint of 2026-10-12 to 2026-10-18 holding the instances on 2026-10-12 and 2026-10-15 of a rule for Monday and Thursday with 18:00, and the month 2026-10 is built
- **THEN** 2026-10-12 and 2026-10-15 each list the real instance once and no projection, and 2026-10-19, 2026-10-22, 2026-10-26 and 2026-10-29 each list one projection with 18:00
- **proof:** unit

#### Scenario: Sunday after the review closes does not show an instance twice
- **WHEN** today is 2026-10-18, no sprint is active, a rule for Sunday has its 2026-10-18 instance done in the closed sprint of 2026-10-12, and the month 2026-10 is built
- **THEN** 2026-10-18 lists the done instance once and no projection, and the rule is projected on 2026-10-25
- **proof:** unit

#### Scenario: Without an active sprint projection starts today
- **WHEN** today is 2026-10-14, no sprint is active, a rule exists for Monday and Thursday, and the month 2026-10 is built
- **THEN** projections appear on 2026-10-15 and every later Monday and Thursday of the month, and none on 2026-10-12
- **proof:** unit

#### Scenario: Past months show only real todos
- **WHEN** today is 2026-10-14 with a rule for Monday and Thursday and a done todo of a closed sprint on 2026-09-30, and the month 2026-09 is built
- **THEN** 2026-09-30 lists the done todo and no day of September lists a projection
- **proof:** unit

#### Scenario: Rules of archived classes are not projected
- **WHEN** today is 2026-10-14 with no active sprint, a Uni rule for Thursday is linked to a class of an archived semester and another Thursday rule has no class, and the month 2026-10 is built
- **THEN** 2026-10-15, 2026-10-22 and 2026-10-29 each list a projection of the second rule only
- **proof:** unit

#### Scenario: Exams appear at their time with room
- **WHEN** the month 2026-10 is built with the class "Analysis" (exam 2026-10-20T10:00, room "H1"), the class "Algorithms" (exam 2026-10-23, no time) and the class "Physics" of an archived semester (exam 2026-10-27T09:00)
- **THEN** 2026-10-20 lists an exam entry "Analysis" at 10:00 with room "H1", 2026-10-23 an all-day exam "Algorithms", and 2026-10-27 the exam "Physics" at 09:00
- **proof:** unit

#### Scenario: Entries within a day are ordered
- **WHEN** 2026-10-20 has a todo at 18:00, an exam at 10:00, an all-day todo "Submit essay", an all-day todo "Buy stamps" and a projection at 07:00
- **THEN** the day's entries are, in order, "Buy stamps", "Submit essay", the 07:00 projection, the 10:00 exam and the 18:00 todo
- **proof:** unit

#### Scenario: Calendar shows aspect colours and marks projections
- **WHEN** on 2026-10-14 with no active sprint Rue opens `/calendar` at 1280 px with a Health todo planned 2026-10-21 18:00, a done todo planned 2026-10-13, a rule "Gym" for Thursday, and a backlog todo only due 2026-10-22
- **THEN** the 2026-10-21 cell shows the todo's title with the Health aspect colour, the 2026-10-13 title is struck through, the 2026-10-15 cell shows "Gym" marked as a projection, and the due-only todo's title appears nowhere in the grid (its 2026-10-22 cell shows only a due marker)
- **proof:** e2e

#### Scenario: Recurring rule with a slot shows in later months
- **WHEN** a rule "Gym" for Tuesday with 18:00–19:30 exists and Rue opens `/calendar?month=2027-01` and selects Tuesday 2027-01-12
- **THEN** every Tuesday cell of January 2027 shows "Gym", and the day list shows "Gym" with "18:00–19:30" marked as a projection
- **proof:** e2e

### Requirement: Calendar layouts
Below 768 px the calendar SHALL show a compact grid with aspect-coloured dots per day (`calendar-dot`; at most 3, then a
"+") and the selected day's entry list (`calendar-day-list`) below the grid. From 768 px each cell shows up to 3 entry
titles (ellipsized) plus "+n more" for the rest, and the selected day's list sits in the context rail: docked at
≥1280 px, where the grid fills the content width, and as the rail overlay with its toggle between 768 and 1279 px.
Selecting a day (its cell is a button, `aria-pressed="true"` when selected) shows that day's list, each entry with its
slot or "all day"; the selected day defaults to today when it is in the shown month, else the 1st. A save from the day list keeps the selection; only changing the month resets it. A day without
entries and without due todos lists "Nothing planned". No horizontal scroll at 375 px. Exam entries use their class colour. (calendar-planning S13)
Each day with open due todos (`due_date` on that day, status not done, backlog or sprint, any day incl. past) SHALL show a due marker (`calendar-due`: flag glyph + count) in its cell, on the phone grid and the wide grid, that does not count against the 3 visible titles or the 3 dots. The day list SHALL start with a "Due" section (`calendar-due-list`, one `calendar-due-row` per todo with its title and aspect) above the planned entries; a day without due todos has no marker and no section, and a day with only due todos shows marker and section and no empty-state text. Done todos are not shown. (deadline-calendar S4)

#### Scenario: Phone shows dots and the selected day's list
- **WHEN** on 2026-10-14 at 375 px Rue opens `/calendar` with five entries on 2026-10-14 and one on 2026-10-16, then taps the 2026-10-16 cell
- **THEN** the 2026-10-14 cell is selected and shows 3 dots and a "+", the list below the grid shows the five entries with their slots or "all day", after the tap it shows the 2026-10-16 entry, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Selected day defaults to the 1st in another month
- **WHEN** on 2026-10-14 Rue opens `/calendar?month=2026-12`
- **THEN** the 2026-12-01 cell is selected and the day list shows that day
- **proof:** e2e

#### Scenario: Wide cells show up to three titles
- **WHEN** at 1280 px Rue opens `/calendar` with five entries on 2026-10-21 and selects that day
- **THEN** its cell shows three titles and "+2 more", the docked context rail lists all five entries, and the grid spans the content width between sidebar and rail
- **proof:** e2e

#### Scenario: Day list in the rail overlay below 1280
- **WHEN** at 1100 px Rue opens `/calendar`, selects a day with an entry and presses the rail toggle
- **THEN** no rail is docked, and the overlay opens with that day's entry list
- **proof:** e2e

#### Scenario: Empty month shows Nothing planned
- **WHEN** Rue opens `/calendar` at 375 px and at 1280 px with no todos, rules or exams
- **THEN** the month grid is shown and the day list reads "Nothing planned"
- **proof:** e2e

#### Scenario: Calendar looks right on phone and desktop
- **WHEN** Rue opens the calendar on their phone and on desktop at Gate 2 with real data
- **THEN** Rue approves the month grid, dots, titles and day list
- **proof:** manual (visual judgement on real hardware)

#### Scenario: Cell shows a due marker beside the titles
- **WHEN** at 1280 px Rue opens `/calendar` with five planned entries on 2026-10-21 and two open todos plus one done todo due 2026-10-21
- **THEN** the 2026-10-21 cell shows three titles and "+2 more" and a `calendar-due` marker reading 2, and no marker appears on days without due todos
- **proof:** e2e ("Scenario: Due todos show as marker and Due section")

#### Scenario: Phone cell shows the marker and the Due section
- **WHEN** at 375 px Rue opens `/calendar` with a Health todo due 2026-10-14 and a planned entry on that day, and selects 2026-10-14
- **THEN** the cell shows the marker and the day list starts with "Due" listing the todo with "Health" above the planned entry
- **proof:** e2e ("Scenario: Due todos show as marker and Due section")

#### Scenario: Day with only a deadline has no empty-state text
- **WHEN** a day has one open due todo and no planned entries, and is selected
- **THEN** the "Due" section lists it and neither "Nothing planned" nor an empty-state text for the section appears
- **proof:** e2e ("Scenario: Deadline-only day shows Due without empty text")

#### Scenario: Overdue and done deadlines
- **WHEN** today is 2026-10-14 and the month 2026-10 is built with an open todo due 2026-10-08 and a done todo due 2026-10-09
- **THEN** `due` lists the open todo on 2026-10-08 and nothing on 2026-10-09
- **proof:** unit ("Scenario: Due lists open todos per day including past days")

#### Scenario: Backlog, sprint and planned todos count
- **WHEN** a backlog todo, a sprint todo and a todo with a planned `day` on another date are all due 2026-10-22
- **THEN** `due` for 2026-10-22 lists all three, ordered by title, and `entries` for 2026-10-22 lists none of them
- **proof:** unit ("Scenario: Due lists open todos per day including past days")

#### Scenario: No deadlines means no marker and no section
- **WHEN** a month has no open todo with a due date and Rue selects a day with a planned entry
- **THEN** no `calendar-due` marker and no `calendar-due-list` exists
- **proof:** e2e ("Scenario: Due todos show as marker and Due section")
