## ADDED Requirements

### Requirement: Calendar on the fingerprint
`/calendar?month=` SHALL render on the fingerprint: below 768 px the month grid shows marks per day and the selected day's list follows the month; from 768 px the cells show entry titles; the day list follows the month below 1024 px and sits beside it from 1024 px (gate 4 pick, see "Calendar layouts"). The key-facts card captioned with the shown month's name (its planned, projected, exams and due counts) stays (gate 5, Q7). Planned todos, projected recurring entries, exams and the Due list keep their behaviour; "Previous month", "Today" and "Next month" navigate; a todo entry opens the todo editor, a projection links its rule and an exam its class. Today SHALL be marked with `aria-current="date"`. (S14)

#### Scenario: Phone shows marks and the day list below the month
- **WHEN** `/calendar` is opened at 375 px with a planned todo and an exam on the 12th, and Rue taps the 12th
- **THEN** the 12th's cell shows marks and no titles, and the day list below the month lists both entries
- **proof:** e2e

#### Scenario: Desktop shows titles in cells and a side day list
- **WHEN** `/calendar` is opened at 1280 px with a planned todo on the 12th
- **THEN** the 12th's cell shows the todo title and the day list sits beside the month (its left edge right of the grid's right edge)
- **proof:** e2e

#### Scenario: Calendar entries open the editor or their link
- **WHEN** Rue activates a todo entry, then a projected entry, then an exam entry in the day list
- **THEN** the todo editor opens for the todo, the projection goes to `/recurring#rule-<id>`, and the exam goes to its class page
- **proof:** e2e

#### Scenario: Busy day and empty day
- **WHEN** a day has 9 entries and another day has none and no due todos
- **THEN** the busy day's cell keeps the height of the other cells with two titles and "+7 more" from 768 px and its day list lists all nine; the empty day reads "Nothing planned"
- **proof:** e2e

#### Scenario: Month starting on Sunday and today marked
- **WHEN** `/calendar?month=2026-11` (1 November 2026 is a Sunday) is opened with the clock on 17 November 2026
- **THEN** the first week row starts on Monday 26 October as a disabled day, 1 November sits in the Sunday column, and the 17th carries `aria-current="date"`
- **proof:** e2e

## MODIFIED Requirements

### Requirement: Calendar entries
Each day of the shown month SHALL list its entries: todos with an explicit planned `day` (in the backlog, the active
sprint or a closed sprint), with their aspect named in the day list, their slot or "all day", done ones muted (never struck through); for every day
after the active sprint's week, or from today on when no sprint is active, one projected occurrence per recurring rule
weekday (rules whose class belongs to an archived semester are not projected, since they never become instances),
with the rule's title, aspect and slot, marked as a projection (a ring mark instead of a dot in the grid and the tag
"Projected" in the day list); and uni exams of active and archived semesters at their `exam_at` time
(an `exam_at` without a time is all-day), shown as "Exam" with the class name and room (a diamond mark in the grid and the tag "Exam · <room>" in the day list). As signed at gate 5 the kinds differ by the mark's shape and by words, never by colour alone, and entries carry no aspect colour; the grid has a key "Marks" naming the shapes. Due dates are not entries: open todos with a `due_date` appear in a separate "Due" list per day (see "Calendar layouts"), never among these entries, and
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

#### Scenario: Calendar names the aspect and marks projections
- **WHEN** on 2026-10-14 with no active sprint Rue opens `/calendar` at 1280 px with a Health todo planned 2026-10-21 18:00, a done todo planned 2026-10-13, a rule "Gym" for Thursday, and a backlog todo only due 2026-10-22
- **THEN** the 2026-10-21 cell shows the todo's title with a dot mark and the day list for 2026-10-21 names "Health" beside its slot, the 2026-10-13 title is muted and not struck through, the 2026-10-15 cell shows "Gym" with a ring mark and its day list marks it "Projected", and the due-only todo's title appears nowhere in the grid (its 2026-10-22 cell shows only a due marker)
- **proof:** e2e

#### Scenario: Recurring rule with a slot shows in later months
- **WHEN** a rule "Gym" for Tuesday with 18:00–19:30 exists and Rue opens `/calendar?month=2027-01` and selects Tuesday 2027-01-12
- **THEN** every Tuesday cell of January 2027 shows "Gym", and the day list shows "Gym" with "18:00–19:30" marked as a projection
- **proof:** e2e

### Requirement: Calendar layouts
Below 768 px the calendar SHALL show a compact grid with marks per day (dot for a planned todo, ring for a projection,
diamond for an exam; at most 3, then a "+") and the selected day's entry list (a region named by its date) below the grid.
From 768 px each cell shows up to 2 entry titles (ellipsized, each after its mark) plus "+n more" for the rest, all cells
keeping the same height. The selected day's list follows the month below 1024 px and sits beside the month from 1024 px
(gate 4 pick: not from 768 px), where it stays in view while the page scrolls and its entries scroll inside it; there is
no rail and no rail toggle.
Selecting a day (its cell is a button, `aria-pressed="true"` when selected) shows that day's list, each entry with its
slot or "all day"; the selected day defaults to today when it is in the shown month, else the 1st. A save from the day list keeps the selection; only changing the month resets it. A day without
entries and without due todos lists "Nothing planned". No horizontal scroll at 375 px. (calendar-planning S13, S14)
Each day with open due todos (`due_date` on that day, status not done, backlog or sprint, any day incl. past) SHALL show a due marker (flag glyph + count, an image named "<n> due") in its cell, on the phone grid and the wide grid, that does not count against the 2 visible titles or the 3 dots. The day list SHALL start with a "Due" section (a group named "Due", one list item per todo with its title and aspect) above the planned entries; a day without due todos has no marker and no section, and a day with only due todos shows marker and section and no empty-state text. Done todos are not shown. (deadline-calendar S4)

#### Scenario: Phone shows marks and the selected day's list
- **WHEN** on 2026-10-14 at 375 px Rue opens `/calendar` with five entries on 2026-10-14 and one on 2026-10-16, then taps the 2026-10-16 cell
- **THEN** the 2026-10-14 cell is selected and shows 3 marks and a "+", the list below the grid shows the five entries with their slots or "all day", after the tap it shows the 2026-10-16 entry, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Selected day defaults to the 1st in another month
- **WHEN** on 2026-10-14 Rue opens `/calendar?month=2026-12`
- **THEN** the 2026-12-01 cell is selected and the day list shows that day
- **proof:** e2e

#### Scenario: Wide cells show up to two titles
- **WHEN** at 1280 px Rue opens `/calendar` with five entries on 2026-10-21 and selects that day
- **THEN** its cell shows two titles and "+3 more", and the day list beside the month (its left edge right of the grid's right edge) lists all five entries
- **proof:** e2e

#### Scenario: Day list follows the month below 1024
- **WHEN** at 900 px and at 1100 px Rue opens `/calendar` and selects a day with an entry
- **THEN** no rail and no rail toggle exist; at 900 px the day list's top edge is below the month's bottom edge, at 1100 px its left edge is right of the month's right edge, and at both it lists that day's entry
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
- **THEN** the 2026-10-21 cell shows two titles and "+3 more" and a due marker reading 2, and no marker appears on days without due todos
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
- **THEN** no due marker and no "Due" group exists
- **proof:** e2e ("Scenario: Due todos show as marker and Due section")
