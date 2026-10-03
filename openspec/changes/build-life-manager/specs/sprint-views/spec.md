## ADDED Requirements

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
Sprint screens SHALL show a prompt instead of the sprint when no sprint is active or a review is pending. (S17 edge)

#### Scenario: Sprint screens prompt to review when pending
- **WHEN** the active sprint's review is required and Rue opens the sprint screen
- **THEN** a prompt links to the review and the screen offers no way to start a new sprint
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
The board view SHALL show columns To do / Doing / Done; todos move between columns by drag on desktop
and by a status menu on touch; each card shows its aspect as a colour/icon tag. (S15)

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

### Requirement: Week-by-day view
The week view SHALL show columns Monday–Sunday plus "Unscheduled"; todos are assigned or moved to a day
by drag on desktop and by a day picker on touch; today is highlighted; on a phone one day is shown at a
time. Only days of the active sprint are selectable; done todos stay on their day, marked done. (S16)

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
