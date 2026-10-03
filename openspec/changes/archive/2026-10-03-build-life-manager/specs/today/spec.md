## ADDED Requirements

### Requirement: Today view
Today SHALL be the default landing screen, showing active-sprint todos assigned to today plus overdue
todos (due before today, not done), with status toggles and a quick add that adds to the sprint on
today. Today's todos are grouped by aspect; overdue todos are listed once, in a single "Overdue" group
that names each todo's aspect. (S21)

#### Scenario: Today shows today's sprint todos and overdue todos
- **WHEN** Rue opens `/` with one sprint todo on today, one on tomorrow, and one backlog todo due yesterday
- **THEN** Today lists the first under its aspect and the overdue one in the "Overdue" group with its aspect named, and not the one on tomorrow
- **proof:** e2e

#### Scenario: Overdue means due before today and not done
- **WHEN** overdue todos are listed for a given day
- **THEN** todos due before that day and not done are returned, regardless of sprint; done todos and todos due that day are not
- **proof:** unit

#### Scenario: Status toggle on Today
- **WHEN** Rue ticks a todo's checkbox on Today
- **THEN** its status is Done and it stays visible struck through
- **proof:** e2e

#### Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox
- **WHEN** Today lists an overdue backlog todo during an active sprint
- **THEN** its row has no done checkbox and offers "Add to sprint", which adds it to the sprint as To do
- **proof:** e2e

#### Scenario: Quick add on Today adds to the sprint on today
- **WHEN** Rue quick-adds a todo on Today during an active sprint
- **THEN** the todo is in the active sprint, assigned to today, and listed on Today
- **proof:** e2e

#### Scenario: Today without an active sprint prompts to plan
- **WHEN** no sprint is active and no review is pending
- **THEN** Today shows a prompt linking to planning
- **proof:** e2e

#### Scenario: Today with a pending review prompts to review
- **WHEN** the active sprint's review is available or required
- **THEN** Today shows a prompt linking to the review
- **proof:** e2e

#### Scenario: Nothing today shows a calm empty state
- **WHEN** a sprint is active but no todo is on today and none is overdue
- **THEN** Today shows a calm empty state linking to the week view
- **proof:** e2e

#### Scenario: Sunday after the review prompts to plan next week
- **WHEN** it is Sunday and that week's review has been closed
- **THEN** Today shows a prompt to plan next week
- **proof:** e2e
