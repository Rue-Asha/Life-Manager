# calendar Specification

## Purpose
TBD - created by archiving change calendar-planning. Update Purpose after archive.
## Requirements
### Requirement: Month calendar page
The app SHALL have a read-only calendar at `/calendar` with the heading "Calendar": a month grid of whole weeks Monday to
Sunday on the Europe/Berlin calendar, showing the current month by default. Controls "‹" (previous month), "›" (next
month) and "Today" (current month with today selected) change the month, and the shown month is in the URL as
`?month=YYYY-MM`, so a link opens that month directly; a missing or invalid `month` parameter shows the current month.
Days outside the shown month are muted (`data-outside="true"`) and carry no entries. (calendar-planning S11)

#### Scenario: Month grid runs Monday to Sunday
- **WHEN** `monthGrid` is built for 2026-02 and for 2026-03
- **THEN** February has 5 rows from Monday 2026-01-26 to Sunday 2026-03-01, March has 6 rows from 2026-02-23 to 2026-04-05, and every row has 7 days starting on a Monday
- **proof:** unit

#### Scenario: Month parameter is parsed or falls back
- **WHEN** `parseMonth` reads "2027-02", "2026-13", "2026-1", "foo" and no value with today 2026-10-14
- **THEN** it returns "2027-02" for the first and "2026-10" for all others
- **proof:** unit

#### Scenario: Calendar opens on the current month
- **WHEN** the clock is Wednesday 2026-10-14 and Rue opens `/calendar` at 1280 px
- **THEN** the heading reads "Calendar", the grid shows October 2026 from Monday 2026-09-28 to Sunday 2026-11-01, and the cells of 2026-09-28 to 2026-09-30 and 2026-11-01 are muted
- **proof:** e2e

#### Scenario: Month navigation and deep link
- **WHEN** on 2026-10-14 Rue presses "›", then "‹" twice, then "Today", and then opens `/calendar?month=2027-02` directly
- **THEN** the URL reads `?month=2026-11`, then `?month=2026-09`, then shows October 2026 with 2026-10-14 selected, and the direct link shows February 2027
- **proof:** e2e

#### Scenario: Invalid month parameter shows the current month
- **WHEN** on 2026-10-14 Rue opens `/calendar?month=2026-13` and `/calendar?month=foo`
- **THEN** both show October 2026 without an error
- **proof:** e2e

### Requirement: Calendar entries
Each day of the shown month SHALL list its entries: todos with an explicit planned `day` (in the backlog, the active
sprint or a closed sprint), with their aspect colour, their slot or "all day", done ones struck through; for every day
after the active sprint's week, or from today on when no sprint is active, one projected occurrence per recurring rule
weekday (rules whose class belongs to an archived semester are not projected, since they never become instances),
with the rule's title, aspect colour and slot, marked as a projection (`data-kind="projection"`, the repeat
glyph and the accessible text "Projected"); and uni exams of active and archived semesters at their `exam_at` time
(an `exam_at` without a time is all-day), shown as "Exam" with the class name and room. Due dates are never shown, and
sprint todos without an explicit day are not shown. Days before the active sprint's week (or before today without a
sprint) show only real todos; the active sprint's week shows its real instances only, and a day that already lists a real instance of a rule (e.g. the Sunday a sprint's review closed it, with no sprint active) gets no projection of that rule, so nothing appears twice.
Within a day all-day entries come first, then timed ones by start time, ties by title. (calendar-planning S12)

#### Scenario: Planned todos are entries, due dates are not
- **WHEN** the month 2026-10 is built with a backlog todo planned 2026-10-21 18:00–19:30, an active-sprint todo on 2026-10-15 without slot, a done todo of a closed sprint on 2026-10-02, a sprint todo without a day due 2026-10-16, and a backlog todo due 2026-10-22 without a planned date
- **THEN** 2026-10-21 lists the first with 18:00–19:30, 2026-10-15 the second as all-day, 2026-10-02 the done todo marked done, and 2026-10-16 and 2026-10-22 have no entry
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
- **THEN** the 2026-10-21 cell shows the todo's title with the Health aspect colour, the 2026-10-13 title is struck through, the 2026-10-15 cell shows "Gym" marked as a projection, and the due-only todo's title appears nowhere in the grid
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
entries lists "Nothing planned". No horizontal scroll at 375 px. Exam entries use their class colour. (calendar-planning S13)

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

### Requirement: Opening calendar entries
Selecting a todo entry in the day list SHALL open the TodoEditor for that todo; a projected occurrence SHALL link to its
rule at `/recurring#rule-<id>`; an exam entry SHALL link to its class page `/uni/classes/<id>`. After a todo is saved
from the calendar, the calendar shows it on its new day, or no longer, when its planned date changed. (calendar-planning S14)

#### Scenario: Todo entry opens the editor
- **WHEN** Rue selects the day of a planned todo "Dentist" on `/calendar` and activates its entry in the day list
- **THEN** the todo editor opens with the title "Dentist"
- **proof:** e2e

#### Scenario: Projected occurrence links to its rule
- **WHEN** Rue activates a projected "Gym" entry in the day list
- **THEN** the URL is `/recurring#rule-<id>` of that rule and its rule row is visible
- **proof:** e2e

#### Scenario: Exam links to its class
- **WHEN** Rue activates the exam entry of the class "Analysis" in the day list
- **THEN** `/uni/classes/<id>` of "Analysis" opens
- **proof:** e2e

#### Scenario: Todo edited from the calendar leaves its day
- **WHEN** on `/calendar` Rue opens the planned todo "Dentist" on 2026-10-21, changes "Planned" to 2026-10-23 and saves
- **THEN** the 2026-10-21 day stays selected, its cell and day list no longer show "Dentist" and the 2026-10-23 cell shows it
- **proof:** e2e

