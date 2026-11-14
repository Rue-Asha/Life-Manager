## MODIFIED Requirements

### Requirement: First-run onboarding
When no aspects exist, the app SHALL show onboarding offering the presets Health, Uni, Job, Home,
Finance and Social (each with colour and icon) to toggle on, plus "add custom". A preset whose name already
exists as an aspect (case-insensitive) SHALL be reported as existing by the `/welcome` load and MUST NOT be
selectable; the create action SHALL skip a submitted preset that exists instead of failing with `duplicate`.
Todos MUST NOT be creatable until at least one aspect exists. (S3)

#### Scenario: First run shows onboarding
- **WHEN** Rue opens any page and no aspects exist
- **THEN** the onboarding screen is shown with the six presets, each with its colour and icon, and an "add custom" control
- **proof:** e2e

#### Scenario: Onboarding creates the chosen aspects
- **WHEN** Rue toggles on Health and Uni, adds a custom aspect "Music", and continues
- **THEN** exactly those three aspects exist and Rue is sent to the backlog
- **proof:** e2e

#### Scenario: Todo without an existing aspect is rejected
- **WHEN** a todo is created while no aspects exist
- **THEN** creation fails with error `no-aspect` and no todo is stored
- **proof:** unit

#### Scenario: Deleting the last aspect returns to first run
- **WHEN** Rue deletes the only aspect, which has no todos or rules
- **THEN** the next page shown is the onboarding screen
- **proof:** e2e

#### Scenario: Existing presets are reported as existing
- **WHEN** the aspects "Health" and "uni" exist and the `/welcome` load runs
- **THEN** it reports the presets Health and Uni as existing and the other four as not existing
- **proof:** unit

#### Scenario: Submitting an existing preset creates nothing and does not fail
- **WHEN** "Health" exists and the create action receives the preset Health together with the preset Job
- **THEN** only "Job" is created, no `duplicate` error is returned, and Rue is sent to the backlog
- **proof:** unit

#### Scenario: Only existing presets selected is not a duplicate error
- **WHEN** "Health" exists and the create action receives only the preset Health and no custom aspect
- **THEN** it fails with error `required` on field `preset` and nothing is created
- **proof:** unit

#### Scenario: A custom name equal to an existing aspect is still a duplicate
- **WHEN** "Health" exists and the create action receives a custom aspect named "health"
- **THEN** it fails with error `duplicate` on field `name` and nothing is created
- **proof:** unit

## ADDED Requirements

### Requirement: Reorder aspects
Rue SHALL be able to set the order of aspects by hand. The server SHALL expose `reorderAspects(db, ids)` and a
`?/reorder` form action on `/aspects` that take the full list of aspect ids in the wanted order and rewrite
`position` to 0..n-1 in one transaction. The list MUST contain every existing aspect id exactly once, otherwise the
operation fails with error `invalid` on field `order` and changes nothing (for example after another tab added or
deleted an aspect). `listAspects` orders by `position`, then `id`, so every list of aspects (navigation, pickers,
aspect page lists, Aspects page) follows the new order. New aspects take the position after the last one; deleting an
aspect keeps the order of the others. The reorder interaction itself (with a non-drag path) is part of the UI redesign.

#### Scenario: Reordering persists
- **WHEN** aspects A, B, C exist in that order and `reorderAspects` receives [C, A, B]
- **THEN** `listAspects` returns C, A, B and the positions are 0, 1, 2
- **proof:** unit

#### Scenario: A list that is not the full set is rejected
- **WHEN** `reorderAspects` receives a list that misses an aspect, repeats an id, or contains an unknown id
- **THEN** it fails with error `invalid` on field `order` and the order is unchanged
- **proof:** unit

#### Scenario: New aspects go last after a reorder
- **WHEN** aspects were reordered to C, A, B and a new aspect D is created
- **THEN** `listAspects` returns C, A, B, D
- **proof:** unit

#### Scenario: Deleting an aspect keeps the others' order
- **WHEN** aspects are ordered C, A, B and A is deleted
- **THEN** `listAspects` returns C, B
- **proof:** unit

#### Scenario: The reorder action rewrites the order
- **WHEN** a POST to `/aspects?/reorder` carries the full list of ids in a new order
- **THEN** the next load of `/aspects` and the layout navigation data list the aspects in that order
- **proof:** unit

#### Scenario: Pickers, backlog groups and the rule form follow the manual order
- **WHEN** aspects Health, Uni, Job exist with a backlog todo each, are reordered to Job, Health, Uni through `/aspects?/reorder`, and Rue opens the backlog, the todo editor's aspect picker and the recurring rule form
- **THEN** the backlog aspect groups, the todo editor's aspect options and the rule form's aspect options are each listed Job, Health, Uni
- **proof:** e2e
