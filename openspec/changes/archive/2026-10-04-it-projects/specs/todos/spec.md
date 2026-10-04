## ADDED Requirements

### Requirement: Link IT todos to a project
QuickAdd and the todo editor SHALL show an optional "Project" select only while the selected aspect is
the IT aspect. It lists the projects that are not implemented; on a todo already linked to an implemented
project, that project stays selectable. With no IT aspect set or no projects the field is hidden.
Switching the aspect away from the IT aspect in the form hides the field and submits no project. (S10)

#### Scenario: Quick add links a todo to a project
- **WHEN** Rue picks the IT aspect in quick add on the backlog, chooses a project in the Project field and submits
- **THEN** the todo is created linked to that project
- **proof:** e2e

#### Scenario: Project field appears only for the IT aspect
- **WHEN** Rue opens quick add and the todo editor with a non-IT aspect selected, then selects the IT aspect
- **THEN** the Project field is hidden first and shown after selecting the IT aspect
- **proof:** e2e

#### Scenario: Project field lists projects that are not implemented
- **WHEN** projects in all four states exist and Rue opens the Project field in quick add, then in the editor of a todo linked to the implemented project
- **THEN** quick add lists the backlog, active and paused projects only, and the editor additionally lists the implemented project the todo is linked to
- **proof:** e2e

#### Scenario: Project field is hidden without IT aspect or projects
- **WHEN** Rue selects any aspect in quick add while no IT aspect is set, and again while the IT aspect is set but no project exists
- **THEN** the Project field is not shown in either case
- **proof:** e2e

#### Scenario: Switching the aspect away drops the project
- **WHEN** in quick add Rue selects the IT aspect, chooses a project, switches to another aspect and submits
- **THEN** the Project field is hidden after the switch and the created todo has no project link
- **proof:** e2e

### Requirement: Project link follows the aspect
The server SHALL store a project link only on a todo whose aspect is the IT aspect, regardless of the
UI. A todo that gets a different aspect, by edit or by aspect deletion, loses its link. A posted project
id that does not exist fails with error `not-found` on field `projectId`. (S11)

#### Scenario: Aspect change removes the project link
- **WHEN** a todo linked to a project gets a different aspect
- **THEN** its `projectId` is null and its sprint, status and day are unchanged
- **proof:** unit

#### Scenario: Project link on a non-IT todo is not stored
- **WHEN** a todo is created or updated with a valid `projectId` and an aspect that is not the IT aspect
- **THEN** the todo is saved without a project link
- **proof:** unit

#### Scenario: Unknown project id is rejected
- **WHEN** an IT todo is created or updated with a `projectId` that does not exist
- **THEN** the request fails with error `not-found` on field `projectId` and nothing is stored or changed
- **proof:** unit

### Requirement: Project badge on todo rows
A linked todo SHALL show a muted project badge (glyph + project name) in `TodoRow` wherever the row
renders; clicking it opens the project's detail page. Todos without a link show no badge. At 375 px the
badge wraps under the title. (S12)

#### Scenario: Linked todo shows the project badge
- **WHEN** during a running sprint a linked todo is shown on Backlog, and another linked todo on Sprint and Today, and Rue clicks a badge
- **THEN** each row shows the badge with the project's name, and the click opens `/projects/<id>`
- **proof:** e2e

#### Scenario: Unlinked todo shows no badge
- **WHEN** a todo without a project link is shown on Backlog
- **THEN** its row has no project badge
- **proof:** e2e

#### Scenario: Badge wraps under the title on a phone
- **WHEN** a linked todo with a long title is shown on Backlog at 375 px
- **THEN** the badge sits below the title and the page does not scroll horizontally
- **proof:** e2e
