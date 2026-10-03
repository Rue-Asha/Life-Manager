## MODIFIED Requirements

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
