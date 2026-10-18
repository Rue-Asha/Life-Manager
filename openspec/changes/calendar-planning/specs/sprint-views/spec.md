## MODIFIED Requirements

### Requirement: Board view
The board view SHALL show columns To do / Doing / Done; todos move between columns by drag on desktop
and by a status menu on touch. A card is compact: title (up to two lines), then one meta line with its aspect as a colour dot and name, its due date, its planned date with slot when it has a day (`planned-label`, e.g. "Thu 15 Oct · 18:00"), and its priority; badges, checklist and notes show when the card is opened. It shows no status chip (the column is the status, a status glyph at the card's top right is the touch status menu) and no tag below the card. (S15, cohesive-look, calendar-planning S4)

#### Scenario: Move a todo between board columns by drag
- **WHEN** on desktop Rue drags a card from To do to Doing
- **THEN** the card is in the Doing column and its status is Doing after reload
- **proof:** e2e

#### Scenario: Move a todo between board columns with the status menu on touch
- **WHEN** on a touch phone viewport Rue picks Done in a card's status menu
- **THEN** the card is in the Done column
- **proof:** e2e

#### Scenario: Empty board column shows a placeholder
- **WHEN** no sprint todo has status Doing
- **THEN** the Doing column shows a placeholder
- **proof:** e2e

#### Scenario: Board card shows the aspect in its meta line
- **WHEN** Rue opens the board view with a Doing todo of the aspect Uni
- **THEN** its card in the Doing column shows a dot in the Uni colour and "Uni" in its meta line, and no visible "Doing" text inside the card
- **proof:** e2e

#### Scenario: Board card shows the planned date and slot
- **WHEN** Rue opens the board view with a To do todo on Thursday 2026-10-15 with 18:00–19:30 and due 2026-10-16
- **THEN** its card's meta line shows "Thu 15 Oct · 18:00–19:30" and the due label
- **proof:** e2e

#### Scenario: Board card shows the whole planned label at 1440 with sidebar and rail
- **WHEN** at 1440 px with the sidebar and the rail open the board holds a card with a due date, a priority and a planned label "Thu 15 Oct · 18:00–19:00"
- **THEN** the full planned label is visible: the meta line wraps instead of clipping, and no meta item is wider than its box or reaches outside the card
- **proof:** e2e

### Requirement: Week-by-day view
The week view SHALL show columns Monday–Sunday plus "Unscheduled" (at ≥1280 px the Unscheduled list sits
in the Week view's rail overlay); todos are assigned or moved to a day by drag on desktop and by a day picker on
touch; today is highlighted; on a phone one day is shown at a time. The day picker and the day columns offer only days
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
- **WHEN** on a touch phone viewport Rue picks Friday in a todo's day picker
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

### Requirement: Compact week cards
From 768 px up, each todo in the week's day columns SHALL be one line: checkbox, its slot when it has one (e.g. "18:00"
or "18:00–19:30", tabular, before the title, never the date), title (ellipsis), aspect colour dot; its other metadata
(status, badges, dates) is reachable by opening the todo, and moving it to another day is by drag. On a phone, where one
day is shown at a time, the day's todos keep the normal row with its status control and day picker, plus the slot. The
day column's add control is a small "+" button labelled "Add a todo to <day>". Today's column has the `--accent-soft`
tint behind its header. (cohesive-look, calendar-planning S4)

#### Scenario: Week cards stay one line at 1440
- **WHEN** Rue opens the week view at 1440 px with a todo whose class name is "Operating Systems" on Thursday
- **THEN** every card in the seven day columns is at most 40 px tall and none contains the class name text
- **proof:** e2e

#### Scenario: Week cards show only the slot
- **WHEN** Rue opens the week view at 1440 px and at 375 px (on Thursday) with a todo on Thursday 18:00–19:30 and one on Thursday without a slot
- **THEN** the first shows "18:00–19:30" and no date text in its `planned-label`, the second has no `planned-label`, and at 1440 px both cards are at most 40 px tall
- **proof:** e2e

### Requirement: Quiet status and day controls in rows
In By aspect, Today, an aspect page and project or class todo lists, a sprint todo row SHALL show its status
as a compact glyph control (empty circle To do, half circle Doing in the accent, filled grey circle Done, so a done todo can go back from the menu) whose
accessible name is "Status: <status>", and its day as plain text ("Thu 15") or, without a day, as a calendar
icon button named "Pick a day"; a slot follows the day as the row's `planned-label` with the slot only ("18:00–19:30").
The visible words "To do" and "Unscheduled" are not shown in rows; the status and day menus and their options are
unchanged. (cohesive-look, calendar-planning S4)

#### Scenario: Row shows status as a glyph with its name
- **WHEN** Rue opens the By aspect view with one To do and one Doing todo, neither with a day
- **THEN** each row has a control named "Status: To do" or "Status: Doing" and one named "Pick a day", and no row shows the visible text "To do" or "Unscheduled"
- **AND** choosing Doing in the first row's status menu sets it to Doing after reload
- **proof:** e2e

#### Scenario: Sprint row shows the slot next to its day
- **WHEN** Rue opens the By aspect view and Today with a sprint todo on today with 18:00–19:30
- **THEN** in both its row shows the day control and a `planned-label` reading "18:00–19:30" without the date
- **proof:** e2e
