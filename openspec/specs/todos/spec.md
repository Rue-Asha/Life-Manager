# todos Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Create todos
Rue SHALL create a todo with a required title and aspect and optional notes, priority (none/P1/P2/P3),
due date and checklist, through a plain quick-add form (title field plus chips/pickers, no
natural-language parsing). The todo lands in the backlog by default, in the active sprint when created
from a sprint view, and on a specific day when created in a week-by-day column. (S6)

#### Scenario: Quick add creates a todo in the backlog
- **WHEN** Rue enters a title, picks an aspect in the quick-add form on the backlog and submits
- **THEN** the todo appears in the backlog under that aspect
- **proof:** e2e

#### Scenario: Todo stores all optional fields
- **WHEN** a todo is created with notes, priority P1, a due date and two checklist items
- **THEN** reading it back returns those notes, priority, due date and both items unchecked in order
- **proof:** unit

#### Scenario: Todo created from a sprint view joins the active sprint
- **WHEN** Rue uses quick add in the by-aspect sprint view
- **THEN** the todo is in the active sprint with status To do and no day
- **proof:** e2e

#### Scenario: Todo created in a day column is assigned to that day
- **WHEN** Rue uses quick add in the Wednesday column of the week view
- **THEN** the todo is in the active sprint, assigned to that Wednesday
- **proof:** e2e

#### Scenario: Empty todo title is rejected
- **WHEN** a todo is created with an empty or whitespace-only title
- **THEN** creation fails with error `required` on field `title` and nothing is stored
- **proof:** unit

#### Scenario: Past due date is allowed and shown overdue
- **WHEN** Rue creates a todo with a due date before today
- **THEN** it is saved and its row is visibly marked overdue
- **proof:** e2e

### Requirement: Edit todos
Rue SHALL be able to change every field of a todo; checklist items can be added, renamed, checked,
unchecked and deleted. (S7)

#### Scenario: Edit every field of a todo
- **WHEN** Rue opens a todo and changes title, aspect, notes, priority and due date, then saves
- **THEN** the row and the reopened editor show the new values
- **proof:** e2e

#### Scenario: Checklist items are added, renamed, toggled and deleted
- **WHEN** Rue adds two checklist items, renames the first, checks then unchecks the second, and deletes the first
- **THEN** after reload the todo has one unchecked item with the second item's text
- **proof:** e2e

#### Scenario: Changing the aspect keeps sprint, status and day
- **WHEN** a sprint todo with status Doing on Tuesday gets a different aspect
- **THEN** its sprint, status and day are unchanged
- **proof:** unit

### Requirement: Delete todos
Deleting a todo SHALL require confirmation. (S8)

#### Scenario: Deleting a todo asks for confirmation
- **WHEN** Rue chooses delete on a todo
- **THEN** a confirmation is shown; cancelling keeps the todo, confirming removes it
- **proof:** e2e

#### Scenario: Deleting a recurring instance keeps its rule
- **WHEN** one instance of a recurring rule is deleted
- **THEN** only that instance is gone; the rule and its other instances remain
- **proof:** unit

