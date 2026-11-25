# sprint-views Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Sprint todo status
Sprint todos SHALL have status To do, Doing or Done, changeable from every sprint view; a checkbox
toggles Done. Completed todos stay visible, struck through, until the sprint closes. (S13)

#### Scenario: Change status from every sprint view
- **WHEN** Rue sets a todo to Doing in the by-aspect view, to Done in the board view, and back to To do in the week view
- **THEN** each change is shown in all three views after reload
- **proof:** e2e

#### Scenario: Checkbox toggles done
- **WHEN** Rue ticks the checkbox of a To do or Doing sprint todo
- **THEN** its status is Done and the row stays visible, struck through
- **proof:** e2e

#### Scenario: Unchecking done returns to To do
- **WHEN** a Done todo is toggled via its checkbox
- **THEN** its status is To do and its completion time is cleared
- **proof:** unit

### Requirement: Sprint screens follow the sprint phase
Sprint screens SHALL show a prompt instead of the sprint when no sprint is active, the next sprint is
being planned, or the active sprint's review is required. On the sprint's Sunday, when the review is
available but not yet required, the sprint stays workable with a prompt to review above it — Sunday is
still a sprint day. (S17 edge)

#### Scenario: Sprint screens prompt to review when pending
- **WHEN** the active sprint's review is required and Rue opens the sprint screen
- **THEN** a prompt links to the review and the screen offers no way to start a new sprint
- **proof:** e2e

#### Scenario: Sunday shows the review prompt above the sprint
- **WHEN** it is the active sprint's Sunday and Rue opens the sprint screen
- **THEN** a prompt links to the review, and the sprint's todos are listed below it and can still be ticked done
- **proof:** e2e

### Requirement: By-aspect view
The by-aspect view SHALL list sprint todos Things-style, grouped by aspect, with status visible. (S14)

#### Scenario: Sprint by aspect groups todos with status
- **WHEN** Rue opens the sprint with todos in two aspects and mixed statuses
- **THEN** todos are grouped under their aspect's icon and name and each row shows its status
- **proof:** e2e

#### Scenario: Aspects without sprint todos are hidden
- **WHEN** an aspect has no todos in the active sprint
- **THEN** it has no group in the by-aspect view
- **proof:** e2e

#### Scenario: Empty sprint points to the backlog
- **WHEN** the active sprint has no todos
- **THEN** the view shows an empty state with a link to the backlog
- **proof:** e2e

### Requirement: Board view
The board view SHALL show columns To do / Doing / Done (the Doing column on a light accent ground, gate 5 Q6); todos move between columns by drag on desktop
and by the card's "More actions" menu (its Status group) on touch and with the keyboard. From 768 px the three columns sit side by side; below 768 px one column is shown at a time, picked in a "Column" switch that shows each column's count. A card is compact: a top line with its aspect as a colour dot and name, its priority and the "More actions" button, then the title, then its facts one per line, each with its icon as signed: the due date ("Due Fri 16", flagged when overdue), its planned day with the slot when it has a day (calendar icon, "Thu 15 · 18:00–19:30", the slot as the planned label), and "Recurring" (recurring icon); the priority (P1–P3) stays on done cards too; badges, checklist and notes show when the card is opened. It shows no status chip and no status control (gate 5, Q6: the column is the status; the card's "More actions" menu holds Status, Day and "Move to backlog" / "Remove from sprint") and no tag below the card. (S15, cohesive-look, calendar-planning S4, S10)

#### Scenario: Move a todo between board columns by drag
- **WHEN** on desktop Rue drags a card from To do to Doing
- **THEN** the card is in the Doing column and its status is Doing after reload
- **proof:** e2e

#### Scenario: Move a todo between board columns with the status menu on touch
- **WHEN** on a touch phone viewport Rue opens a card's "More actions" menu and picks Done under Status
- **THEN** the card is in the Done column (shown after picking Done in the "Column" switch)
- **proof:** e2e

#### Scenario: Empty board column shows a placeholder
- **WHEN** no sprint todo has status Doing
- **THEN** the Doing column shows a placeholder
- **proof:** e2e

#### Scenario: Board card shows the aspect in its meta line
- **WHEN** Rue opens the board view with a Doing todo of the aspect Uni
- **THEN** its card in the Doing column shows a dot in the Uni colour and "Uni" in its top line, no visible "Doing" text inside the card and no "Status:" control
- **proof:** e2e

#### Scenario: Board card shows the planned date and slot
- **WHEN** Rue opens the board view with a To do todo on Thursday 2026-10-15 with 18:00–19:30 and due 2026-10-16
- **THEN** its card's facts show "Due Fri 16" and "Thu 15 · 18:00–19:30" with the planned label reading "18:00–19:30"
- **proof:** e2e

#### Scenario: Board card shows the whole planned label at 1440 with the rail
- **WHEN** at 1440 px with the docked backlog rail the board holds a card with a due date, a priority and a planned day "Thu 15 · 18:00–19:00"
- **THEN** the full planned label is visible: the facts line wraps instead of clipping, and no meta item is wider than its box or reaches outside the card
- **proof:** e2e

#### Scenario: Phone Board shows one column at a time
- **WHEN** at 375 px Rue opens the board view with todos in To do and Doing and picks Doing in the "Column" switch
- **THEN** first only the To do column is shown, the switch shows each column's count, and after the pick only the Doing column is shown
- **proof:** e2e

### Requirement: Week-by-day view
The week view SHALL show columns Monday–Sunday plus "Unscheduled" (from 768 px the Unscheduled list sits in the content
below the day columns, never in the rail); todos are assigned or moved to a day by drag on desktop and by the day picker on
touch and with the keyboard, which is the Day group of a todo's menu (a chip's "Status and day" menu from 768 px, a row's "More actions" menu on the phone); today is highlighted; on a phone one day is shown at a time. The day picker and the day columns offer only days
of the active sprint and keep a todo's slot when it changes day; a date outside the week reaching the `setDay` action
follows the planned-date rules (sprint-lifecycle "Mid-sprint changes"): a future date moves the todo to the backlog with
that date, a past one is refused with `day-in-past`. Done todos stay on their day, marked done. (S16, S10, calendar-planning S2)

#### Scenario: Assign a todo to a day by drag
- **WHEN** on desktop Rue drags an unscheduled todo onto Tuesday
- **THEN** it is in the Tuesday column after reload
- **proof:** e2e

#### Scenario: Dated sprint todo without a day sits on its due day
- **WHEN** a sprint todo has no day and a due date within the sprint's week
- **THEN** it is listed on its due day; a todo with a day stays on that day, and one due outside the week stays Unscheduled
- **proof:** unit — `Regression: dated sprint todos are missing from their day in the week view`

#### Scenario: Assign a todo to a day with the day picker on touch
- **WHEN** on a touch phone viewport Rue picks Friday in the Day group of a todo's "More actions" menu
- **THEN** the todo is assigned to Friday
- **proof:** e2e

#### Scenario: Day picker offers only days of the active sprint
- **WHEN** Rue opens a todo's day picker, then a day after the sprint and a day before today outside the sprint are submitted to `setDay` for two of its todos
- **THEN** the picker lists exactly the seven sprint days plus "Unscheduled"; the todo given the later day is no longer in the week view and is listed on the Backlog, and the past day is refused with `day-in-past` and leaves its todo unscheduled
- **proof:** e2e

#### Scenario: Moving a todo to another day keeps its slot
- **WHEN** a sprint todo on Tuesday with 18:00–19:30 is moved to Friday through `setDay` without times, and then set to Unscheduled
- **THEN** on Friday it still has 18:00–19:30, and once unscheduled it has no slot
- **proof:** unit

#### Scenario: Today is highlighted in the week view
- **WHEN** the clock is set to Wednesday of the active sprint
- **THEN** the Wednesday column is highlighted as today
- **proof:** e2e

#### Scenario: Phone shows one day at a time
- **WHEN** the week view is opened at 375 px width
- **THEN** one day is shown (today by default) with controls to switch to the other days and Unscheduled
- **proof:** e2e

#### Scenario: Done todos stay on their day
- **WHEN** a todo assigned to Monday is marked done
- **THEN** it stays in the Monday column, marked done
- **proof:** e2e

### Requirement: Backlog rail on the Sprint tab
While a sprint is running, including its Sunday, the Sprint tab SHALL show a backlog rail next to the
sprint: backlog todos grouped by aspect, in the same aspect order and colours as the "By aspect" view,
with a title filter. Collapsed aspect groups SHALL be remembered per viewer in `localStorage` when it is
available. With phase `none` or `planning` the Sprint tab keeps its prompt to Plan and shows no rail;
with phase `review-required` the rail is hidden and only the review prompt is shown. (S1)

#### Scenario: Sprint tab shows the backlog rail grouped by aspect
- **WHEN** a sprint is running, the backlog holds todos in two aspects and Rue opens `/sprint` at 1280 px
- **THEN** a backlog rail is shown next to the sprint, with one group per aspect in the same order and aspect colours as the "By aspect" view, each listing that aspect's backlog todos
- **proof:** e2e

#### Scenario: Rail is shown on the sprint's Sunday
- **WHEN** it is the running sprint's Sunday and Rue opens `/sprint`
- **THEN** the review prompt is above the sprint and the backlog rail is shown
- **proof:** e2e

#### Scenario: Rail title filter narrows the list
- **WHEN** Rue types part of one backlog todo's title into the rail filter
- **THEN** only backlog todos whose title contains the text (case-insensitive) are listed, and clearing the filter lists all again
- **proof:** e2e

#### Scenario: Rail filter without a match
- **WHEN** the rail filter text matches no backlog todo
- **THEN** the rail shows "No backlog todo matches"
- **proof:** e2e

#### Scenario: Empty backlog shows the rail's empty state
- **WHEN** a sprint is running and the backlog is empty
- **THEN** the rail shows an empty state with a link to the Backlog page
- **proof:** e2e

#### Scenario: Collapsed rail groups are remembered
- **WHEN** Rue collapses an aspect group in the rail and reloads `/sprint`
- **THEN** that group is still collapsed and the others are expanded
- **proof:** e2e

#### Scenario: No rail without a running sprint
- **WHEN** the phase is `none` or `planning` and Rue opens `/sprint`
- **THEN** the prompt to Plan is shown and no backlog rail exists
- **proof:** e2e

#### Scenario: No rail while the review is required
- **WHEN** the phase is `review-required` and Rue opens `/sprint`
- **THEN** only the review prompt is shown and no backlog rail exists
- **proof:** e2e

### Requirement: Add to the sprint from the rail
A rail todo SHALL join the running sprint with one action, "Add to sprint". On desktop (fine pointer
with hover) it SHALL also join by dragging it onto the sprint list, a board column or a day column:
a board column sets that status, a day column sets that day. On touch no drag is offered, only the
button. When the todo is no longer in the backlog (moved by another tab), the add is refused quietly:
no error is shown and the lists reload. (S2)

#### Scenario: Add to sprint from the rail
- **WHEN** Rue clicks "Add to sprint" on a rail todo
- **THEN** the todo leaves the rail and appears in the sprint with status To do and no day, without a page navigation
- **proof:** e2e

#### Scenario: Drag a rail todo onto the sprint list
- **WHEN** on desktop Rue drags a rail todo onto the "By aspect" sprint list
- **THEN** the todo is in the sprint with status To do and no longer in the rail after reload
- **proof:** e2e

#### Scenario: Drop a rail todo on a board column sets its status
- **WHEN** on desktop Rue drags a rail todo onto the board's Doing column
- **THEN** the todo is in the sprint in the Doing column after reload
- **proof:** e2e

#### Scenario: Drop a rail todo on the Done column
- **WHEN** on desktop Rue drags a rail todo onto the board's Done column
- **THEN** the todo joins the sprint with status Done
- **proof:** e2e

#### Scenario: Drop a rail todo on a day column sets its day
- **WHEN** on desktop at 1280 px Rue unfolds the backlog in the week view with its "Backlog" tab and drags a rail todo onto the Thursday column
- **THEN** the todo is in the sprint, assigned to that Thursday
- **proof:** e2e

#### Scenario: Touch offers no drag in the rail
- **WHEN** Rue opens the rail on a touch phone viewport
- **THEN** rail rows are not draggable and each offers "Add to sprint"
- **proof:** e2e

#### Scenario: Todo already moved elsewhere is refused quietly
- **WHEN** a rail todo is added to the sprint by another client after the page loaded, and Rue then clicks its "Add to sprint"
- **THEN** no error message is shown, the rail no longer lists it, and the sprint lists it exactly once
- **proof:** e2e

### Requirement: Send back from the Sprint tab
Any sprint todo SHALL be sendable back to the backlog directly from its row on the Sprint tab (row menu
or hover action, without opening the editor), and on desktop by dragging it onto the rail. A done todo
goes back without a question and becomes To do. A recurring instance has no backlog: its row action is
"Remove from sprint", which deletes the instance and shows a toast with Undo; Undo keeps the instance. (S3)

#### Scenario: Move a sprint todo back to the backlog from its row
- **WHEN** Rue picks "Move to backlog" in a sprint todo's row action without opening the editor
- **THEN** the todo leaves the sprint and is in the backlog with no day and status To do
- **proof:** e2e

#### Scenario: Board and week cards offer the send-back action
- **WHEN** Rue opens the row action of a card in the board view and of a card in the week view
- **THEN** each offers "Move to backlog" (or "Remove from sprint" for a recurring instance), and choosing it on the board card puts that todo in the backlog
- **proof:** e2e

#### Scenario: Drag a sprint todo onto the rail
- **WHEN** on desktop Rue drags a sprint todo onto the backlog rail
- **THEN** the todo is listed in the rail and no longer in the sprint after reload
- **proof:** e2e

#### Scenario: Done todo goes back without a question
- **WHEN** Rue sends a Done sprint todo back to the backlog from its row
- **THEN** no confirmation is shown and the todo is in the backlog with status To do
- **proof:** e2e

#### Scenario: Removing a recurring instance deletes it with undo
- **WHEN** Rue opens the row action of a recurring instance in the sprint
- **THEN** it offers "Remove from sprint" and no "Move to backlog"
- **AND** choosing it hides the row and shows a toast with Undo, and once the toast has gone the instance exists neither in the sprint nor in the backlog
- **proof:** e2e

#### Scenario: Undo keeps a removed recurring instance
- **WHEN** Rue removes a recurring instance from the sprint and clicks Undo in the toast
- **THEN** after reload the instance is still in the sprint on its day
- **proof:** e2e

### Requirement: Aspect progress in group headers
Each aspect group header in the By aspect view and in the rail SHALL show this sprint's progress for that
aspect as "done / total", with the aspect's colour on its icon tile as signed at gate 5 (no bar); rail
headers SHALL also show the aspect's backlog count. An aspect with no sprint todos stays hidden in the
sprint view and is shown in the rail with its backlog count; an aspect with no backlog todos is omitted
from the rail. (S4)

#### Scenario: Progress and backlog counts per aspect
- **WHEN** aspect A has three todos in the active sprint (one Done) and two in the backlog, and aspect B has one backlog todo only
- **THEN** `aspectProgress` returns `{ done: 1, total: 3 }` for A and nothing for B, and `backlogCounts` returns 2 for A and 1 for B
- **proof:** unit

#### Scenario: Group header shows done of total
- **WHEN** an aspect has three sprint todos, one of them Done, and Rue opens the "By aspect" view
- **THEN** its group header reads "1 / 3" beside the aspect's colour tile and shows no bar
- **proof:** e2e

#### Scenario: Rail header shows backlog count and progress
- **WHEN** an aspect has two backlog todos and one Done of two sprint todos
- **THEN** its rail group header shows the backlog count 2 and the progress "1 / 2"
- **proof:** e2e

#### Scenario: Aspect without sprint todos shows only in the rail
- **WHEN** an aspect has backlog todos but no sprint todos
- **THEN** it has no group in the "By aspect" view and has a rail group with its backlog count
- **proof:** e2e

#### Scenario: Aspect without backlog todos is omitted from the rail
- **WHEN** an aspect has sprint todos but no backlog todos
- **THEN** it has a group in the "By aspect" view and none in the rail
- **proof:** e2e

### Requirement: Wide board and week
At ≥1280 px the board's three columns SHALL share the board's width evenly. The Week view SHALL keep the backlog rail as signed at gate 5 (Q5): on every page load the rail starts folded into a slim "Backlog" tab (a button with the backlog count, `aria-expanded="false"`, controlling the rail) and the seven day columns, Monday–Sunday, fill the width in one row (each at least 120 px) without sideways scrolling; pressing the tab docks the rail beside the week (its head holds "Hide backlog", `aria-expanded="true"`, which folds it again and returns focus to the tab) and the day columns wrap into rows of at least 11rem each (from 1536 px they stay in one row). The fold state is kept while switching views on the page. By aspect and Board always show the docked rail and no fold control. From 768 px the Unscheduled list sits in the content below the day columns, never in the rail. Drops from the docked rail onto a day work in both widths of the week. A day with many todos grows its column and the page scrolls vertically, never sideways. Between 768 and 1279 px no rail is docked ("Manage" opens the backlog sheet) and the week's day columns wrap with Unscheduled below them. (S10)

#### Scenario: Board columns share the width at 1280
- **WHEN** Rue opens the board view at 1280 px
- **THEN** the three columns have equal widths (±1 px), share one top edge and together span the board's content width
- **proof:** e2e

#### Scenario: Week shows the whole week in one row at 1280
- **WHEN** Rue opens the week view at 1280 px
- **THEN** no rail is docked and the "Backlog" tab with the backlog count is shown with `aria-expanded="false"`, the seven day columns share one top edge, each is at least 120 px wide, the week does not scroll sideways (its scroll width equals its client width), and the Unscheduled list sits below the day columns in the content
- **AND** pressing the "Backlog" tab docks the rail with the backlog list and a "Hide backlog" button with `aria-expanded="true"`
- **proof:** e2e

#### Scenario: Switching Week and Board folds and docks the rail
- **WHEN** after a page load at 1280 px Rue switches the sprint view from Board to Week and back to Board
- **THEN** in Board the rail is docked with no fold control, in Week it is folded to the "Backlog" tab, and back in Board it is docked again
- **proof:** e2e

#### Scenario: Unfolded backlog wraps the week days
- **WHEN** at 1280 px in Week Rue presses the "Backlog" tab, then "Hide backlog"
- **THEN** with the rail docked the day columns no longer share one row and the page does not scroll sideways; after "Hide backlog" the rail is folded, the seven columns share one row again and focus is on the "Backlog" tab
- **proof:** e2e

#### Scenario: Busy day grows inside the week without sideways scroll
- **WHEN** a day has 15 todos and the week view is opened at 1280 px
- **THEN** that day's column lists all 15, the page scrolls vertically and does not scroll horizontally
- **proof:** e2e

#### Scenario: Week wraps between 1024 and 1279
- **WHEN** Rue opens the week view at 1100 px
- **THEN** no rail is docked and "Manage" is shown, the day columns wrap, and the Unscheduled list is in the content below them
- **proof:** e2e

### Requirement: Sprint summary header
The Sprint screen SHALL show a summary header under the page title while a sprint is running: one large
tabular figure "<done> / <total>" labelled "done", the sprint's date range and "<n> days left", and the same
per-aspect segmented bar as Today's header. The date range moves out of the title line into this header. The
header is the screen's key-facts card as signed at gate 5 and sits above the view switch in all three views. (cohesive-look, S10)

#### Scenario: Sprint header shows progress and days left
- **WHEN** Rue opens `/sprint` on Thursday of a running sprint with 12 todos, 4 done
- **THEN** the header shows "4 / 12" with "done", "Mon 12 – Sun 18 Oct" and "3 days left", in By aspect, Board and Week alike
- **proof:** e2e

### Requirement: Compact week cards
From 768 px each todo in the week's day columns SHALL be a compact chip as signed at gate 5: its status glyph (accessible name "Status: <label>", opening the "Status and day" menu), its slot's start time as a small line over the title when it has a slot (e.g. "18:00", tabular, never the date; the full slot shows in the editor, on the board card and in the phone row), the title wrapping to at most three lines (full title as the accessible name and tooltip), and from 1440 px the aspect colour dot; its other metadata (status text, badges, dates) is reachable by opening the todo, and moving it to another day is by drag or by its "Status and day" menu. A chip is at least one touch target tall. On a phone, where one day is shown at a time, the day's todos keep the normal row with its status glyph and "More actions" (Day), plus the full slot in its meta line. The day column's add control is a small "+" button labelled "Add a todo to <day>". Today's day column carries `aria-current="date"` and is marked as the current day without relying on colour alone (inverse ground plus the word "Today" under its date). (cohesive-look, calendar-planning S4, S10)

#### Scenario: Week chips stay compact at 1440
- **WHEN** Rue opens the week view at 1440 px with a todo whose class name is "Operating Systems" on Thursday and a todo with a 200-character title on Friday
- **THEN** no chip's title takes more than three lines (title height at most three times its line height), the long title's chip has the full title as its accessible name, and no chip contains the class name text
- **proof:** e2e

#### Scenario: Week cards show only the slot
- **WHEN** Rue opens the week view at 1440 px and at 375 px (on Thursday) with a todo on Thursday 18:00–19:30 and one on Thursday without a slot
- **THEN** at 1440 px the first chip shows "18:00" with no end time and no date text, at 375 px the first row shows "18:00–19:30" and no date text in its planned label, and the second todo has no planned label at either width
- **proof:** e2e

#### Scenario: Today's column is marked
- **WHEN** Rue opens the week view at 1280 px on Wednesday of the sprint
- **THEN** Wednesday's day column carries `aria-current="date"` and shows "Today", and no other column does
- **proof:** e2e

### Requirement: Quiet status and day controls in rows
In By aspect, Today, an aspect page and project or class todo lists, a sprint todo row SHALL show its status
as a compact glyph control (empty circle To do, half circle Doing, filled circle with a check for Done, so a done todo can go back from the menu) whose
accessible name starts with "Status: <status>", and, except in Today, a meta line as signed at gate 5: "Recurring" when it repeats, its stored day as plain text ("Wed 14", or "Unscheduled" without a day, never the due day the week places it on), "Due <day>" when it has a due date, and the slot as the row's planned label ("18:00–19:30"), joined by middle dots; priority, checklist and notes stay in the editor. The day changes through the row's "More actions" menu (its Day group), not a separate day button.
Rows without a status glyph (Today, Plan, Review, Backlog and the aspect, project and class lists) write a Doing or Done status as a word in the meta line, and Today, Backlog and those lists write the priority as "P1"–"P3" text (Rue, wave 11).
Today rows show the planned label alone, with no day control.
The visible word "To do" is not shown in rows; the status and day menus and their options are
unchanged. (cohesive-look, calendar-planning S4, S10)

#### Scenario: Row shows status as a glyph with its name
- **WHEN** Rue opens the By aspect view with one To do and one Doing todo, neither with a day
- **THEN** each row has a control named "Status: To do" or "Status: Doing" and a "More actions" button whose menu holds the Day group, no row has a "Pick a day" button, and no row shows the visible text "To do"
- **AND** choosing Doing in the first row's status menu sets it to Doing after reload
- **proof:** e2e

#### Scenario: Sprint row shows the slot next to its day
- **WHEN** Rue opens the By aspect view and Today with a sprint todo on today with 18:00–19:30
- **THEN** in By aspect its row's meta line shows the day "Wed 14" followed by a planned label reading "18:00–19:30" without the date, and in Today its row shows only the planned label reading "18:00–19:30", with no day control
- **proof:** e2e

#### Scenario: Today rows write status and priority as text
- **WHEN** Today lists a Doing todo with priority 1, a Done todo with priority 2 and a To do todo
- **THEN** the first row's meta line shows "Doing" and "P1" (named "Priority 1"), the second shows "Done" and "P2" (a done row keeps its priority), and no row shows the visible text "To do"
- **proof:** e2e

### Requirement: Backlog sheet below 1280 px
Below 1280 px the Sprint tab SHALL show a "Manage" button instead of a docked rail; it opens a sheet (fingerprint `sheet` primitive) with
the rail's content and its "Add to sprint" buttons, without drag. Sprint rows keep their send-back
action. (S6, S10)

#### Scenario: Phone Sprint tab shows Manage instead of a rail
- **WHEN** Rue opens `/sprint` at 375 px and at 1100 px during a running sprint
- **THEN** no docked rail is visible and a "Manage" button is shown at both widths
- **proof:** e2e

#### Scenario: Manage sheet adds a todo to the sprint
- **WHEN** on a touch phone viewport Rue opens "Manage" and taps "Add to sprint" on a backlog todo
- **THEN** the sheet lists backlog todos grouped by aspect, and after the tap the todo is in the sprint and no longer in the sheet's list
- **proof:** e2e

### Requirement: Sprint on the fingerprint
`/sprint` SHALL render By aspect (the default at every width), Board and Week through `?view=` on the fingerprint, with the view switch marking the current view (`aria-current` or `aria-pressed`). In the phases none and planning it SHALL show the plan prompt, in review-required only the review prompt. Empty groups and empty days SHALL show their empty copy, a day with many todos SHALL stay inside its column, and long titles SHALL wrap or clamp with the full title as the accessible name. (S10)

#### Scenario: By aspect is the default view at every width
- **WHEN** `/sprint` without `?view=` is opened at 375 px and at 1280 px during a running sprint
- **THEN** the By aspect view is shown and marked current in the view switch at both widths
- **proof:** e2e

#### Scenario: All three views are available on the phone
- **WHEN** at 375 px Rue switches to Board and then to Week
- **THEN** the URL carries `?view=board` and then `?view=week`, and each view lists the sprint's todos
- **proof:** e2e

#### Scenario: Phase prompts replace the sprint
- **WHEN** `/sprint` is opened in the phases none, planning and review-required
- **THEN** none shows "Plan your week", planning shows "Continue planning", review-required shows only "Review the sprint", and no view switch is shown in any of them
- **proof:** e2e

#### Scenario: Empty days and many todos per day stay in the layout
- **WHEN** the Week view at 1280 px has 15 todos with long titles on Thursday and nothing on Monday
- **THEN** Monday shows its empty-day affordance, Thursday's column holds all 15 without the page scrolling horizontally, and each card's accessible name holds its full title
- **proof:** e2e

### Requirement: Moves by menu on touch and keyboard
Every move a drag can make on `/sprint` (status between board columns, day between week days, back to the backlog, rail to sprint) SHALL also be possible through a menu or a row action on touch and with the keyboard alone, as signed at gate 5: a By-aspect row and a phone Week row open the status menu from their status glyph and Day plus "Move to backlog" / "Remove from sprint" from "More actions"; a Board card has no status control (gate 5, Q6) and its "More actions" menu holds Status, Day and "Move to backlog" / "Remove from sprint"; a Week chip from 768 px opens one "Status and day" menu from its status glyph. A move applies optimistically; when the server refuses it, the item SHALL return to where it was and the error SHALL show next to it with `role="alert"`. (S10, R2)

#### Scenario: Status and day change by menu with the keyboard
- **WHEN** at 1280 px Rue tabs to a To do card in Board, opens its "More actions" menu with Enter, picks Doing under Status, then in Week opens the same todo's "Status and day" menu from its status glyph and picks Thursday, using only the keyboard
- **THEN** the todo is in the Doing column and on Thursday after reload
- **proof:** e2e

#### Scenario: Board status changes by menu on touch
- **WHEN** on a touch phone viewport Rue opens a card's "More actions" menu in Board and picks Done under Status
- **THEN** the card is in the Done column without any drag
- **proof:** e2e

#### Scenario: Refused menu move reverts and shows the error
- **WHEN** Rue moves a By-aspect row to Doing by its status menu and the server refuses the change
- **THEN** the todo is back in To do and an alert next to it reads "Couldn’t move that todo — try again."
- **proof:** e2e

