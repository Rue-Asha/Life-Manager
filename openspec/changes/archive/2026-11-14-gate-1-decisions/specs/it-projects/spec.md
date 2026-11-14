## MODIFIED Requirements

### Requirement: Project data model
Migration 2, appended to `src/lib/server/schema.ts`, SHALL add an `it_projects` table (id, name,
description, repo_url, tags, notes, status ∈ backlog | active | paused | implemented, created_at,
updated_at), a setting holding the IT aspect id, and `todos.project_id INTEGER NULL REFERENCES
it_projects(id) ON DELETE SET NULL`. Migration 3 rebuilds `it_projects` so the status CHECK also allows
`in_progress` (five states: backlog | active | in_progress | paused | implemented), keeping every row and todo
link. Migration 2 only adds; no existing row is rewritten. When the IT
aspect no longer exists the setting reads as unset, exactly as on first run. Both todo read models
(`todoColumns` in `todos.ts` and `selectTodos()` in `sprints.ts`) carry the project link. (S1)

#### Scenario: Migration 2 adds projects without touching existing data
- **WHEN** a database at `user_version` 1 holding aspects, a sprint, a rule, todos and checklist items is opened
- **THEN** it is at `user_version` 2, `it_projects` and the setting exist, every todo has `project_id` NULL, and every pre-existing row reads back unchanged
- **proof:** unit

#### Scenario: Project fields round-trip
- **WHEN** a project is created with name, description, repo URL, two tags and notes
- **THEN** reading it back returns those values, status `backlog`, and `createdAt` equal to `updatedAt`
- **proof:** unit

#### Scenario: Deleting the IT aspect unsets the setting
- **WHEN** the aspect chosen as IT aspect is deleted with its todos moved to another aspect
- **THEN** the IT aspect setting reads as unset and none of the moved todos keeps a project link
- **proof:** unit

#### Scenario: Both todo read models carry the project link
- **WHEN** a linked todo is read through `getTodo`/`listBacklog` and through `listSprintTodos`/`listToday`
- **THEN** each path returns its `projectId`
- **proof:** unit

### Requirement: Projects overview
`/projects` SHALL show one card per project, grouped in sections In progress, Active, Backlog and Paused, in
that order, followed by a collapsed group "Implemented (n)". A card shows the name, the description on one
line, the tags, a repo glyph if a repo is set, and the count of open linked todos (linked, not done).
Within a group the most recently updated project comes first. An empty group is not rendered. With no
projects at all an empty state offers "New project". At 375 px there is one card per row; at ≥1280 px
the screen has no context rail and its grid fills the centred content column. (S2)

#### Scenario: Cards are grouped by status
- **WHEN** Rue opens `/projects` with one project in each of the five states
- **THEN** sections appear in the order In progress, Active, Backlog, Paused, and below them a collapsed "Implemented (1)" group whose card is shown only after expanding it
- **proof:** e2e

#### Scenario: Card shows the project summary
- **WHEN** a project has a description, two tags, a repo URL and three linked todos of which one is done
- **THEN** its card shows the name, the description on a single line, both tags, a repo glyph and the open count 2
- **proof:** e2e

#### Scenario: Most recently updated project comes first
- **WHEN** two backlog projects exist and the older one is edited
- **THEN** listing projects returns the edited one first within the backlog group
- **proof:** unit

#### Scenario: No projects shows an empty state
- **WHEN** Rue opens `/projects` with the IT aspect set and no projects
- **THEN** an empty state with a "New project" action is shown and no group heading is rendered
- **proof:** e2e

#### Scenario: Empty groups are not rendered
- **WHEN** only active projects exist
- **THEN** the Active section is shown and no Backlog, Paused or Implemented heading is rendered
- **proof:** e2e

#### Scenario: Phone shows one card per row
- **WHEN** `/projects` with three projects in one group is opened at 375 px
- **THEN** every card's left edge lines up and no two cards share a row
- **proof:** e2e

#### Scenario: Wide desktop grid fills the content column
- **WHEN** `/projects` with four projects in one group is opened at 1600 px
- **THEN** the card grid's width equals the content column's width (within 2 px) and its first row holds more than one card
- **proof:** e2e

### Requirement: Project status
The status SHALL change through a pill dropdown with the five states; any state is reachable from any
other. Moving to implemented while linked todos are open shows a confirm dialog naming the count;
confirming changes the status and leaves the todos untouched, cancelling changes nothing. Without open
todos, and when leaving implemented, no dialog is shown. (S7)

#### Scenario: Status pill offers the five states
- **WHEN** Rue opens the status pill on a backlog project and picks Active
- **THEN** the menu listed Backlog, Active, In progress, Paused and Implemented, and the pill now shows Active
- **proof:** e2e

#### Scenario: Every status transition is allowed
- **WHEN** a project is moved through each of the twenty ordered pairs of distinct states
- **THEN** every change succeeds and updates `updated_at`
- **proof:** unit

#### Scenario: Implemented with open todos asks for confirmation
- **WHEN** Rue picks Implemented on a project with two open linked todos and confirms the dialog
- **THEN** the dialog named 2 open todos, the status is Implemented, and both todos are still open and linked
- **proof:** e2e

#### Scenario: Cancelling the implemented warning changes nothing
- **WHEN** Rue picks Implemented on a project with open linked todos and cancels the dialog
- **THEN** the status is unchanged
- **proof:** e2e

#### Scenario: Implemented without open todos needs no confirmation
- **WHEN** Rue picks Implemented on a project whose linked todos are all done
- **THEN** no dialog is shown and the status is Implemented
- **proof:** e2e

#### Scenario: Reopening an implemented project needs no confirmation
- **WHEN** Rue picks Active on an implemented project with open linked todos
- **THEN** no dialog is shown and the status is Active
- **proof:** e2e
