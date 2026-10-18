## MODIFIED Requirements

### Requirement: Backlog view
The backlog SHALL show all todos not in a sprint, with a filter to one aspect that applies to every section. Todos with
a planned date are listed first, in their own section "Planned" (test id `planned-section`), sorted by day, then
all-day before timed, then by start time; the section is hidden when no backlog todo is planned. The remaining todos
are grouped by aspect and sorted by priority (P1, P2, P3, none) then due date (earliest first, none last). (S9, S5)

#### Scenario: Backlog lists only todos not in a sprint, in order
- **WHEN** the backlog is listed with todos in and out of sprints and mixed priorities and due dates
- **THEN** only todos without a sprint are returned, ordered by priority then due date with undated last
- **proof:** unit

#### Scenario: Backlog is grouped by aspect
- **WHEN** Rue opens the backlog with todos in two aspects
- **THEN** each aspect is a group with its icon and name, containing its todos in priority/due order
- **proof:** e2e

#### Scenario: Filter the backlog to one aspect
- **WHEN** Rue picks one aspect in the backlog filter
- **THEN** only that aspect's group is shown, and clearing the filter shows all again
- **proof:** e2e

#### Scenario: Empty backlog shows an empty state
- **WHEN** Rue opens the backlog and it has no todos
- **THEN** a calm empty state is shown with an "add todo" action
- **proof:** e2e

#### Scenario: Overdue todos are marked in the backlog
- **WHEN** a backlog todo's due date is before today and it is not done
- **THEN** its row shows the overdue marker
- **proof:** e2e

#### Scenario: Planned todos are listed in the Planned section
- **WHEN** the backlog holds "Dentist" planned 2026-10-28 18:00, "Tax return" planned 2026-10-28 all-day, "Call grandma" planned 2026-10-21 09:00 and an unplanned "Clean the fridge", and Rue opens `/backlog`
- **THEN** a section "Planned" above the aspect groups lists "Call grandma", "Tax return", "Dentist" in that order, and "Clean the fridge" is in its aspect group and not in the section
- **proof:** e2e

#### Scenario: No Planned section without planned todos
- **WHEN** Rue opens `/backlog` and no backlog todo has a planned date
- **THEN** no "Planned" section is shown
- **proof:** e2e
