## ADDED Requirements

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
