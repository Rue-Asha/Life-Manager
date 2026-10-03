# sprint-lifecycle Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Sprint week
A sprint SHALL be one ISO week, Monday to Sunday, on the Europe/Berlin calendar, computed server-side.
At most one sprint is active. (S10)

#### Scenario: Sprint covers one ISO week in Europe/Berlin
- **WHEN** the clock is 2026-10-07T23:30:00Z (Thursday 01:30 in Berlin)
- **THEN** today is 2026-10-08 and the week runs 2026-10-05 to 2026-10-11
- **proof:** unit

#### Scenario: Week boundary across a DST change
- **WHEN** the clock is 2026-10-25T22:30:00Z (Sunday 23:30 CET, the night clocks go back) and then 2026-10-25T23:30:00Z
- **THEN** the first is in the week starting 2026-10-19 and the second is Monday 2026-10-26, starting the next week; likewise around 2026-03-29
- **proof:** unit

#### Scenario: Target week is the current week before Sunday
- **WHEN** today is any day Monday to Saturday
- **THEN** the planning target week is the week containing today
- **proof:** unit

#### Scenario: Target week on Sunday is next week
- **WHEN** today is a Sunday
- **THEN** the planning target week starts the following Monday
- **proof:** unit

#### Scenario: Only one sprint can be active
- **WHEN** a sprint is active and another sprint start is attempted
- **THEN** it fails with `sprint-active` and the active sprint is unchanged
- **proof:** unit

### Requirement: Planning
When there is no active sprint and no pending review, planning SHALL be available: Rue pulls backlog
todos into the planned sprint (drag between backlog panel and sprint on desktop, picker on touch) and
starts it. (S10)

#### Scenario: First run can plan immediately
- **WHEN** aspects and backlog todos exist and no sprint has ever existed
- **THEN** the planning screen is available for the target week
- **proof:** e2e

#### Scenario: Pull todos by drag and start the sprint
- **WHEN** on desktop Rue drags two backlog todos onto the sprint panel and starts the sprint
- **THEN** the sprint is active for the target week, contains the two todos, and they are no longer in the backlog
- **proof:** e2e

#### Scenario: Pull todos with the picker on touch
- **WHEN** on a touch phone viewport Rue adds a backlog todo to the sprint through its picker and starts the sprint
- **THEN** the todo is in the active sprint
- **proof:** e2e

#### Scenario: Start a sprint with zero todos
- **WHEN** a sprint is started with nothing pulled and no recurring rules
- **THEN** an empty active sprint exists for the target week
- **proof:** unit

#### Scenario: Planning is blocked while a review is pending
- **WHEN** the active sprint's review is required
- **THEN** opening planning or starting a sprint fails with `review-pending`
- **proof:** unit

### Requirement: Due-this-week suggestions
Planning SHALL suggest backlog todos whose due date falls in the target week, pre-marked and
unmarkable. (S11)

#### Scenario: Due-this-week todos are suggested pre-marked
- **WHEN** Rue opens planning and a backlog todo is due on Thursday of the target week
- **THEN** it is listed under suggestions, already marked, and starting the sprint includes it
- **proof:** e2e

#### Scenario: Unmarked suggestion stays in the backlog
- **WHEN** Rue unmarks a suggested todo and starts the sprint
- **THEN** that todo is still in the backlog
- **proof:** e2e

#### Scenario: No suggestion section when nothing is due
- **WHEN** no backlog todo is due in the target week
- **THEN** planning shows no suggestion section
- **proof:** e2e

### Requirement: Mid-sprint changes
During an active sprint a backlog todo SHALL be addable to the sprint, optionally with a day of the
sprint or a status, and a sprint todo SHALL be movable back to the backlog; removing a recurring instance
from the sprint deletes it, since recurring instances have no backlog. While the active sprint's review is
required (from the Monday after the sprint until the review closes) adding to the sprint MUST be refused
with `review-required` and nothing is written — on the Backlog page, the rail and the aspect page alike,
where the UI points to Review instead. (S12, S2, S3, S7)

#### Scenario: Add a backlog todo to the active sprint
- **WHEN** Rue chooses "Add to sprint" on a backlog row during an active sprint
- **THEN** the todo leaves the backlog and appears in the sprint with status To do
- **proof:** e2e

#### Scenario: Moving back to the backlog clears day and status
- **WHEN** a sprint todo with status Doing on Wednesday is moved back to the backlog
- **THEN** it is in the backlog with no day and status To do
- **proof:** unit

#### Scenario: Add to the sprint with a day or a status
- **WHEN** a backlog todo is added to the active sprint with day = the sprint's Thursday, another with status Done, and a third with a day outside the sprint
- **THEN** the first is in the sprint on Thursday with status To do, the second has status Done with a completion time, and the third is refused with `day-outside-sprint` and stays in the backlog
- **proof:** unit

#### Scenario: Adding a todo that is no longer in the backlog is refused
- **WHEN** a todo already in the active sprint is added to the sprint again
- **THEN** it fails with `not-found` and the todo is unchanged
- **proof:** unit

#### Scenario: Removing a recurring instance deletes only that instance
- **WHEN** `removeFromSprint` is called for a recurring instance and for a normal Doing todo of the active sprint
- **THEN** the recurring instance is deleted while its rule and other instances remain, and the normal todo is in the backlog with no day and status To do
- **proof:** unit

#### Scenario: Adding to the sprint is refused while the review is required
- **WHEN** today is the Monday after the active sprint and a backlog todo is added to the sprint
- **THEN** it fails with `review-required` and the todo is still in the backlog, unchanged
- **AND** on the sprint's Sunday the same add succeeds
- **proof:** unit

#### Scenario: Backlog page points to Review instead of adding
- **WHEN** the active sprint's review is required and Rue opens the Backlog page
- **THEN** no row offers "Add to sprint" and a note links to the review
- **proof:** e2e

#### Scenario: Review becoming required after page load refuses the add
- **WHEN** Rue opens the Backlog page on the sprint's Sunday, the clock moves to the Monday after, and Rue clicks "Add to sprint" on a row
- **THEN** a message pointing to the review is shown and the todo is still in the backlog
- **proof:** e2e

### Requirement: Sprint review
From the sprint's Sunday a review SHALL be available; from the Monday after the sprint it is required.
The review lists done and open todos; for each open todo Rue picks carry over (default) or back to
backlog — recurring instances: carry over or drop. Closing the review ends the sprint and opens
planning. Carried todos keep their status and lose their day. (S17)

#### Scenario: Review is available from the sprint's Sunday
- **WHEN** today is the Sunday of the active sprint
- **THEN** the sprint phase is `review-available`, and before Sunday it is `running`
- **proof:** unit

#### Scenario: Review is required from the Monday after
- **WHEN** today is the Monday after the active sprint or later
- **THEN** the sprint phase is `review-required`
- **proof:** unit

#### Scenario: Review carries over and returns open todos
- **WHEN** Rue reviews a sprint with one done and two open todos, leaves one on the default "carry over", sets the other to "back to backlog", and closes
- **THEN** planning opens with the carried todo already in the sprint (same status, no day), the other is in the backlog with status To do, and the closed sprint's done todo is in neither
- **proof:** e2e

#### Scenario: Open recurring instance is carried or dropped
- **WHEN** a review closes with one open recurring instance set to drop and another set to carry
- **THEN** the dropped instance is deleted and the carried one is in the new planning sprint with no day
- **AND** a `backlog` decision for a recurring instance, or a `drop` decision for a normal todo, is refused
- **proof:** unit

#### Scenario: Done todos stay with the closed sprint
- **WHEN** a review closes
- **THEN** the done todos keep the closed sprint's id and do not appear in the backlog or the new planning sprint
- **proof:** unit

#### Scenario: All-done review closes in one tap
- **WHEN** every todo of the sprint is done and Rue opens the review
- **THEN** a single close action ends the sprint and opens planning
- **proof:** e2e

#### Scenario: Weeks away review only the last sprint
- **WHEN** the last sprint was three weeks ago and its review is closed today
- **THEN** only that sprint is closed, no sprints exist for the skipped weeks, and the target week is today's week
- **proof:** unit

