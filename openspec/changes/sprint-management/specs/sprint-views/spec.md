## ADDED Requirements

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
- **WHEN** on desktop at 1280 px Rue opens the week view's rail overlay with the rail toggle and drags a rail todo onto the Thursday column
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
Each aspect group header in the sprint views and in the rail SHALL show this sprint's progress for that
aspect as "done / total" plus a hairline bar in the aspect colour; rail headers SHALL also show the
aspect's backlog count. An aspect with no sprint todos stays hidden in the sprint view and is shown in
the rail with its backlog count; an aspect with no backlog todos is omitted from the rail. (S4)

#### Scenario: Progress and backlog counts per aspect
- **WHEN** aspect A has three todos in the active sprint (one Done) and two in the backlog, and aspect B has one backlog todo only
- **THEN** `aspectProgress` returns `{ done: 1, total: 3 }` for A and nothing for B, and `backlogCounts` returns 2 for A and 1 for B
- **proof:** unit

#### Scenario: Group header shows done of total
- **WHEN** an aspect has three sprint todos, one of them Done, and Rue opens the "By aspect" view
- **THEN** its group header reads "1 / 3" and shows a bar filled to one third in the aspect colour
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

### Requirement: Manage sheet on phone
Below 768 px the Sprint tab SHALL show a "Manage" button instead of an inline rail; it opens a sheet with
the rail's content and its "Add to sprint" buttons, without drag. Sprint rows keep their send-back
action. (S6)

#### Scenario: Phone Sprint tab shows Manage instead of a rail
- **WHEN** Rue opens `/sprint` at 375 px during a running sprint
- **THEN** no inline rail is visible and a "Manage" button is shown
- **proof:** e2e

#### Scenario: Manage sheet adds a todo to the sprint
- **WHEN** on a touch phone viewport Rue opens "Manage" and taps "Add to sprint" on a backlog todo
- **THEN** the sheet lists backlog todos grouped by aspect, and after the tap the todo is in the sprint and no longer in the sheet's list
- **proof:** e2e

### Requirement: Wide board and week
At ≥1280 px the board and week views SHALL fill the available width: board columns stretch evenly with
equal minimum height reaching the bottom of the page content area (the viewport bottom less the page's
bottom padding); the week shows Monday–Sunday in one row (each column
at least ~120 px) across the full content width and the Unscheduled list moves into the rail. In the Week
view the rail (backlog + Unscheduled) is the toggle overlay even at ≥1280 px, so the seven columns fit
without sideways scrolling; By aspect and Board keep the docked rail. Switching between Week and Board or
By aspect at ≥1280 px swaps overlay and docked rail, and an open overlay closes when leaving Week. Drops
from the overlay rail onto a day work as from the docked rail. A day with many todos scrolls within its
column. Between 1024 and 1279 px the week keeps its wrapped layout with Unscheduled in the content. (S10)

#### Scenario: Board columns share the width at 1280
- **WHEN** Rue opens the board view at 1280 px
- **THEN** the three columns have equal widths (±1 px), together span the content area, and each reaches the bottom of the page content area (the viewport bottom less the page's bottom padding, ±1 px)
- **proof:** e2e

#### Scenario: Week shows the whole week in one row at 1280
- **WHEN** Rue opens the week view at 1280 px
- **THEN** no rail is docked and the rail toggle is shown, the seven day columns share one top edge, each is at least 120 px wide, the week does not scroll sideways (its scroll width equals its client width), and no Unscheduled column is in the content
- **AND** pressing the rail toggle opens the overlay, which holds the Unscheduled list above the backlog rail
- **proof:** e2e

#### Scenario: Switching Week and Board swaps overlay and docked rail
- **WHEN** at 1280 px Rue switches the sprint view from Board to Week and back to Board
- **THEN** in Board the rail is docked with no rail toggle, in Week the rail is undocked with a rail toggle, and back in Board it is docked again
- **proof:** e2e

#### Scenario: Open week overlay closes when leaving Week
- **WHEN** at 1280 px Rue opens the rail overlay in Week, switches to Board, and then back to Week
- **THEN** after the switch back the overlay is closed (toggle `aria-expanded="false"`, rail not visible)
- **proof:** e2e

#### Scenario: Busy day scrolls inside its column
- **WHEN** a day has 15 todos and the week view is opened at 1280 px
- **THEN** that day's column scrolls on its own and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Week wraps between 1024 and 1279
- **WHEN** Rue opens the week view at 1100 px
- **THEN** the day columns wrap as before and the Unscheduled column is in the content
- **proof:** e2e

## MODIFIED Requirements

### Requirement: Week-by-day view
The week view SHALL show columns Monday–Sunday plus "Unscheduled" (at ≥1280 px the Unscheduled list sits
in the Week view's rail overlay); todos are assigned or moved to a day by drag on desktop and by a day picker on
touch; today is highlighted; on a phone one day is shown at a time. Only days of the active sprint are
selectable; done todos stay on their day, marked done. (S16, S10)

#### Scenario: Assign a todo to a day by drag
- **WHEN** on desktop Rue drags an unscheduled todo onto Tuesday
- **THEN** it is in the Tuesday column after reload
- **proof:** e2e

#### Scenario: Assign a todo to a day with the day picker on touch
- **WHEN** on a touch phone viewport Rue picks Friday in a todo's day picker
- **THEN** the todo is assigned to Friday
- **proof:** e2e

#### Scenario: Day picker offers only days of the active sprint
- **WHEN** Rue opens a todo's day picker, or a day outside the sprint is submitted
- **THEN** the picker lists exactly the seven sprint days plus "Unscheduled", and the out-of-sprint day is refused with `day-outside-sprint`
- **proof:** e2e

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
