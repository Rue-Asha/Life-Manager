# backlog Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Backlog view
The backlog SHALL show all todos not in a sprint, with a filter to one aspect that applies to every section. Todos with
a planned date are listed first, in their own section "Planned" (a region named by its heading), sorted by day, then
all-day before timed, then by start time; the section is hidden when no backlog todo is planned. The remaining todos
are grouped by aspect and sorted by priority (P1, P2, P3, none) then due date (earliest first, none last). The aspect filter is the `aspect` query parameter: absent or empty means all; a whole number selects that aspect; any other value, or a number that names no aspect, shows an empty list (never all, never an error), and the page data then carries no selected aspect. (S9, S5)

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

#### Scenario: Non-numeric aspect parameter shows an empty list
- **WHEN** the backlog is loaded with `?aspect=abc` while backlog todos exist
- **THEN** the todo list is empty and the selected aspect is null
- **proof:** unit

#### Scenario: Unknown aspect id shows an empty list
- **WHEN** the backlog is loaded with `?aspect=999` and no aspect 999 exists
- **THEN** the todo list is empty and the selected aspect is null
- **proof:** unit

#### Scenario: Missing or empty aspect parameter shows everything
- **WHEN** the backlog is loaded without the parameter and with `?aspect=`
- **THEN** all backlog todos are listed and the selected aspect is null
- **proof:** unit

#### Scenario: Valid aspect parameter filters
- **WHEN** the backlog is loaded with `?aspect=<id>` of an existing aspect
- **THEN** only that aspect's backlog todos are listed and the selected aspect is that id
- **proof:** unit

### Requirement: Backlog on the fingerprint
`/backlog` SHALL render on the fingerprint with the aspect filter (`?aspect=`, navigation "Filter by aspect", the selected one `aria-current`), the Planned section before collapsible aspect groups (heading buttons with `aria-expanded`), and per todo, as signed at gate 5 (Q14): the title opens the editor, "Add to sprint" (`Add to sprint: <title>`) stays visible on the row in the running and review-available phases, and the row's "···" menu ("More actions: <title>") holds "Plan a day" (opening the row's plan panel under it; a day inside the running sprint's week pulls the todo into the sprint) and "Edit todo". The page keeps its own inline quick add (gate 4 pick) and shows a small key-facts card with the real counts (gate 5, Q4). Empty and filtered-empty copy SHALL follow the contract; many aspects and long titles SHALL stay readable without horizontal scroll. (S13)

#### Scenario: Aspect filter narrows the backlog
- **WHEN** the backlog holds todos in Health and Home and Rue picks Home in "Filter by aspect"
- **THEN** the URL carries `?aspect=<home id>`, Home is `aria-current`, and only Home's todos are listed
- **proof:** e2e

#### Scenario: Aspect groups collapse
- **WHEN** Rue presses the Health group heading
- **THEN** its `aria-expanded` turns "false" and its todos are hidden; pressing again shows them
- **proof:** e2e

#### Scenario: Planning a day inside the week pulls into the sprint
- **WHEN** during a running sprint Rue picks "Plan a day" in a backlog row's "More actions" menu and plans the todo on a day of the running week
- **THEN** the todo leaves the backlog and is in the sprint on that day
- **proof:** e2e

#### Scenario: Backlog empty and filtered-empty copy
- **WHEN** the backlog is empty, and separately the filter is Health with no Health todos
- **THEN** the first reads the heading "Your backlog is empty" with "Add a todo", the second the heading "Nothing for Health in the backlog"
- **proof:** e2e

#### Scenario: Many aspects and long titles stay in the backlog layout
- **WHEN** the backlog holds todos in 12 aspects, one titled with 200 characters, at 375 px and 1280 px
- **THEN** the filter wraps or scrolls inside its own row, every group is listed, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Add to sprint stays on the row, Plan a day is in its menu
- **WHEN** during a running sprint Rue opens `/backlog` at 375 px and at 1280 px
- **THEN** every row shows an "Add to sprint: <title>" button and a "More actions: <title>" button, no row shows a visible "Plan a day" button, and the menu offers "Plan a day" and "Edit todo"
- **proof:** e2e

