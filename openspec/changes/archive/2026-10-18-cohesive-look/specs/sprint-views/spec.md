## MODIFIED Requirements

### Requirement: Board view
The board view SHALL show columns To do / Doing / Done; todos move between columns by drag on desktop
and by a status menu on touch. A card is compact: title (up to two lines), then one meta line with its aspect as a colour dot and name, its due date (or else its day) and its priority; badges, checklist and notes show when the card is opened. It shows no status chip (the column is the status, a status glyph at the card's top right is the touch status menu) and no tag below the card. (S15, cohesive-look)

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

## ADDED Requirements

### Requirement: Sprint summary header
The Sprint screen SHALL show a summary header under the page title while a sprint is running: one large
tabular figure "<done> / <total>" labelled "done", the sprint's date range and "<n> days left", and the same
per-aspect segmented bar as Today's header. The date range moves out of the title line into this header. The
header is the `--chrome` surface with light text and sits above the view switch in all three views. (cohesive-look)

#### Scenario: Sprint header shows progress and days left
- **WHEN** Rue opens `/sprint` on Thursday of a running sprint with 12 todos, 4 done
- **THEN** the header shows "4 / 12" with "done", "Mon 12 – Sun 18 Oct" and "3 days left", in By aspect, Board and Week alike
- **proof:** e2e

### Requirement: Compact week cards
From 768 px up, each todo in the week's day columns SHALL be one line: checkbox, title (ellipsis), aspect
colour dot; its other metadata (status, badges, dates) is reachable by opening the todo, and moving it to
another day is by drag. On a phone, where one day is shown at a time, the day's todos keep the normal row
with its status control and day picker. The day column's
add control is a small "+" button labelled "Add a todo to <day>". Today's column has the `--accent-soft`
tint behind its header. (cohesive-look)

#### Scenario: Week cards stay one line at 1440
- **WHEN** Rue opens the week view at 1440 px with a todo whose class name is "Operating Systems" on Thursday
- **THEN** every card in the seven day columns is at most 40 px tall and none contains the class name text
- **proof:** e2e

### Requirement: Quiet status and day controls in rows
In By aspect, Today, an aspect page and project or class todo lists, a sprint todo row SHALL show its status
as a compact glyph control (empty circle To do, half circle Doing in the accent, filled grey circle Done, so a done todo can go back from the menu) whose
accessible name is "Status: <status>", and its day as plain text ("Thu 15") or, without a day, as a calendar
icon button named "Pick a day". The visible words "To do" and "Unscheduled" are not shown in rows; the
status and day menus and their options are unchanged. (cohesive-look)

#### Scenario: Row shows status as a glyph with its name
- **WHEN** Rue opens the By aspect view with one To do and one Doing todo, neither with a day
- **THEN** each row has a control named "Status: To do" or "Status: Doing" and one named "Pick a day", and no row shows the visible text "To do" or "Unscheduled"
- **AND** choosing Doing in the first row's status menu sets it to Doing after reload
- **proof:** e2e
