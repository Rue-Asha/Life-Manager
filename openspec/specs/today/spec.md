# today Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Today view
Today SHALL be the default landing screen, showing active-sprint todos assigned to today plus overdue
todos (due before today, not done), with status toggles and a quick add in every phase (running, review
available, review required, planning, none, Sunday after the review). While an active sprint has today
among its days, quick add SHALL add to the sprint on today unless its "Planned" field, prefilled with today, is changed or removed (the todo then lands on the chosen day, or in the sprint with no day); otherwise it SHALL create a backlog todo due
today, and Today SHALL list open backlog todos due today or planned for today under their aspect, each once even
when both apply. Today's todos are grouped by aspect; overdue todos are listed once, in a single "Overdue" group that
names each todo's aspect. (S21, calendar-planning S8)

#### Scenario: Today shows today's sprint todos and overdue todos
- **WHEN** Rue opens `/` with one sprint todo on today, one on tomorrow, and one backlog todo due yesterday
- **THEN** Today lists the first under its aspect and the overdue one in the "Overdue" group with its aspect named, and not the one on tomorrow
- **proof:** e2e

#### Scenario: Overdue means due before today and not done
- **WHEN** overdue todos are listed for a given day
- **THEN** todos due before that day and not done are returned, regardless of sprint; done todos and todos due that day are not
- **proof:** unit

#### Scenario: Sprint todo due today without a day is on Today
- **WHEN** an active-sprint todo has no day and is due today
- **THEN** Today lists it under its aspect as on today; a todo with a day keeps that day, and the sprint query does not return a backlog todo due today
- **proof:** unit — `Regression: sprint todos dated today without a day are missing from Today`

#### Scenario: Status toggle on Today
- **WHEN** Rue ticks a todo's checkbox on Today
- **THEN** its status is Done and it stays visible struck through
- **proof:** e2e

#### Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox
- **WHEN** Today lists an overdue backlog todo during an active sprint
- **THEN** its row has no done checkbox and offers "Add to sprint", which adds it to the sprint as To do
- **proof:** e2e

#### Scenario: Quick add is shown in every Today state
- **WHEN** Rue opens `/` with a running sprint, with a review available, with a review required, in planning, with no sprint, and on the Sunday after the review
- **THEN** each state shows the "Add a todo" quick add
- **proof:** e2e

#### Scenario: Quick add on Today adds to the sprint on today
- **WHEN** Rue quick-adds a todo on Today during an active sprint whose days include today
- **THEN** the todo is in the active sprint with status To do, assigned to today, and listed on Today
- **proof:** e2e

#### Scenario: Changing or removing Planned in Today's quick add
- **WHEN** during an active sprint whose days include today, Rue quick-adds on Today with "Planned" (prefilled with today) changed to a later day of the sprint, and another with "Planned" removed
- **THEN** the first is in the active sprint on that later day and the second is in the active sprint with no day, so it is not listed on Today
- **proof:** e2e — `Scenario: Changing or removing Planned in Today's quick add`

#### Scenario: Quick add on Today outside the sprint's days saves a backlog todo due today
- **WHEN** Rue quick-adds a todo on a day that is not among the active sprint's days (the Sunday before next week's sprint, or review required)
- **THEN** the todo is in no sprint (it shows in the backlog) with due date today, and is listed on Today under its aspect
- **proof:** e2e

#### Scenario: Quick add on Today without any sprint saves a backlog todo due today
- **WHEN** no sprint exists and Rue quick-adds a todo on Today
- **THEN** the todo is in the backlog with due date today and is listed on Today under its aspect, also after a reload
- **proof:** e2e

#### Scenario: Quick add on a phone opens the sheet in every state
- **WHEN** Rue taps "Add a todo" on Today at phone width with no sprint
- **THEN** the same sheet as elsewhere opens, and submitting adds the todo as above
- **proof:** e2e

#### Scenario: Backlog todos due today are listed apart from sprint todos
- **WHEN** backlog todos are queried for a given day, with a backlog todo due that day, one due another day, a done one due that day, and a sprint todo due that day
- **THEN** only the open todo in no sprint and due that day is returned
- **proof:** unit

#### Scenario: Backlog todos planned for today are listed once
- **WHEN** backlog todos are queried for a given day, with a backlog todo planned for that day, one planned for that day and also due that day, one planned for the next day, and a done one planned for that day
- **THEN** the first two are returned, each once, and the others are not
- **proof:** unit

#### Scenario: Planned-today backlog todo shows on Today between sprints
- **WHEN** it is the Sunday after the review was closed and a backlog todo is planned for today with 18:00
- **THEN** Today lists it once under its aspect, and the summary header counts it
- **proof:** e2e

#### Scenario: Backlog todos due today are listed only when today is not a sprint day
- **WHEN** a backlog todo is due today, once while an active sprint has today among its days and once while it has not (or no sprint exists)
- **THEN** Today does not list it on the sprint day and lists it under its aspect otherwise
- **proof:** e2e

#### Scenario: Due-today backlog todos offer the sprint instead of a checkbox
- **WHEN** Today lists a backlog todo due today while a sprint is active, and again while no sprint is active
- **THEN** its row has no done checkbox; with an active sprint it offers "Add to sprint", which adds it to the sprint as To do, and without one it is a plain row
- **proof:** e2e

#### Scenario: A fallback todo is overdue the next day
- **WHEN** a backlog todo due today is still open and the next day is queried
- **THEN** the overdue query returns it and the due-today query does not
- **proof:** unit

#### Scenario: Today without an active sprint prompts to plan
- **WHEN** no sprint is active and no review is pending
- **THEN** Today shows a prompt linking to planning
- **proof:** e2e

#### Scenario: Today with a pending review prompts to review
- **WHEN** the active sprint's review is available or required
- **THEN** Today shows a prompt linking to the review
- **proof:** e2e

#### Scenario: Nothing today shows a calm empty state
- **WHEN** a sprint is active but no todo is on today and none is overdue or due today
- **THEN** Today shows a calm empty state linking to the week view
- **proof:** e2e

#### Scenario: Sunday after the review prompts to plan next week
- **WHEN** it is Sunday and that week's review has been closed
- **THEN** Today shows a prompt to plan next week
- **proof:** e2e

### Requirement: Today summary header
Today SHALL open with a summary header under the page title: one large tabular number, the count of open
todos listed on Today (today's sprint todos not done, overdue todos and listed due-today backlog todos), labelled
"open today"; while a sprint is active a second line "Sprint <done> / <total> done · <n> days left" and a
segmented bar with one segment per aspect, sized by its sprint todos and filled by its done share in the aspect
colour. Without an active sprint the header shows only the number. The header is the `--chrome` surface with
light text. (cohesive-look)

#### Scenario: Header counts open todos on Today
- **WHEN** Rue opens `/` during a running sprint with two open and one done todo on today and one overdue backlog todo
- **THEN** the summary header shows "3" with "open today"
- **proof:** e2e

#### Scenario: Header shows sprint progress during a sprint
- **WHEN** the active sprint has 9 todos, 3 done, and today is Thursday of the sprint
- **THEN** the header reads "Sprint 3 / 9 done · 3 days left" and its bar has one segment per aspect with sprint todos
- **proof:** e2e

#### Scenario: Header without a sprint shows only the count
- **WHEN** no sprint is active and one backlog todo is due today
- **THEN** the header shows "1" with "open today" and no sprint line or bar
- **proof:** e2e

