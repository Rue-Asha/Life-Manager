# aspects Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: First-run onboarding
When no aspects exist, the app SHALL show onboarding offering the presets Health, Uni, Job, Home,
Finance and Social (each with colour and icon) to toggle on, plus "add custom". Todos MUST NOT be
creatable until at least one aspect exists. (S3)

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

### Requirement: Create and edit aspects
The aspects screen SHALL list every aspect with its todo count, and Rue SHALL be able to create and edit an aspect's name, colour (from the fixed palette) and icon (from
the fixed icon set). Names MUST be non-empty and unique case-insensitively. (S4)

#### Scenario: Create an aspect with colour and icon
- **WHEN** Rue creates the aspect "Sport" with a palette colour and an icon
- **THEN** "Sport" appears in the aspect list with that colour and icon
- **proof:** e2e

#### Scenario: Edit an aspect
- **WHEN** Rue renames "Sport" to "Fitness" and picks another colour and icon
- **THEN** the aspect list shows "Fitness" with the new colour and icon, and no "Sport"
- **proof:** e2e

#### Scenario: Empty aspect name is rejected inline
- **WHEN** Rue saves an aspect with an empty or whitespace-only name
- **THEN** nothing is saved and an inline error is shown next to the name field
- **proof:** e2e

#### Scenario: Duplicate aspect name is rejected
- **WHEN** an aspect "Health" exists and an aspect "health" is created or another aspect is renamed to it
- **THEN** the operation fails with error `duplicate` on field `name`
- **proof:** unit

### Requirement: Delete aspects
Deleting an aspect SHALL ask which other aspect receives its todos and recurring rules; afterwards they
belong to the target aspect. (S5)

#### Scenario: Deleting an aspect moves its todos and rules
- **WHEN** aspect A with two todos and one recurring rule is deleted with target B
- **THEN** A no longer exists and the two todos and the rule belong to B, with sprint, status and day unchanged
- **proof:** unit

#### Scenario: Delete confirmation asks for a target aspect
- **WHEN** Rue deletes an aspect that has todos
- **THEN** the confirmation asks which aspect receives them, and after confirming the chosen aspect's todo count includes them
- **proof:** e2e

#### Scenario: Aspect without todos is deleted with a simple confirm
- **WHEN** Rue deletes an aspect with no todos and no rules
- **THEN** the confirmation asks no target and the aspect is removed after confirming
- **proof:** e2e

#### Scenario: Only aspect with todos cannot be deleted
- **WHEN** the only aspect has todos
- **THEN** its delete control is disabled with an explanation, and the service refuses with `only-aspect-in-use`
- **proof:** e2e

### Requirement: Aspect page
Each aspect SHALL have a page at `/aspects/<id>` with a "This sprint" section (the aspect's todos in the
running sprint, its progress "done / total" with a hairline bar, and the add/send-back actions of the
Sprint tab, including drag on desktop) followed by a "Backlog" section with the aspect's backlog todos
and a quick add defaulting to that aspect. Sidebar aspect links and rows on the Aspects page open it.
An unknown or deleted id shows a 404 page linking to Aspects. Without a running sprint, "This sprint"
is replaced by "No sprint running" and a link to Plan; while the review is required, backlog rows offer
no "Add to sprint" and the page points to Review. An aspect with no todos shows an empty state with the
quick add. (S5, S7)

#### Scenario: Aspect page shows this sprint and its backlog
- **WHEN** aspect A has two sprint todos (one Done) and one backlog todo, aspect B has todos too, and Rue opens `/aspects/<A>`
- **THEN** the page is titled with A's name and icon, "This sprint" lists A's two sprint todos with progress "1 / 2", "Backlog" lists A's backlog todo, and none of B's todos appear
- **proof:** e2e

#### Scenario: Move todos between sprint and backlog on the aspect page
- **WHEN** on the aspect page Rue clicks "Add to sprint" on a backlog todo and "Move to backlog" on a sprint todo
- **THEN** the first is listed under "This sprint" and the second under "Backlog", and the progress updates
- **proof:** e2e

#### Scenario: Drag between sections on the aspect page
- **WHEN** on desktop Rue drags a backlog todo onto "This sprint" on the aspect page
- **THEN** after reload it is listed under "This sprint"
- **proof:** e2e

#### Scenario: Quick add on the aspect page defaults to the aspect
- **WHEN** Rue opens quick add in the aspect page's Backlog section and submits a title without touching the aspect
- **THEN** the new todo is in the backlog under this aspect
- **proof:** e2e

#### Scenario: Sidebar and Aspects rows open the aspect page
- **WHEN** Rue clicks an aspect in the desktop sidebar, and separately an aspect on the Aspects page
- **THEN** each opens `/aspects/<id>` of that aspect
- **proof:** e2e

#### Scenario: Unknown aspect shows a 404 page
- **WHEN** Rue opens `/aspects/<id>` for an id that does not exist
- **THEN** the response status is 404 and the page links to Aspects
- **proof:** e2e

#### Scenario: Aspect page without a running sprint
- **WHEN** the phase is `none` or `planning` and Rue opens an aspect page
- **THEN** "This sprint" is replaced by "No sprint running" with a link to Plan, and the Backlog section is shown
- **proof:** e2e

#### Scenario: Aspect page during a required review points to Review
- **WHEN** the active sprint's review is required and Rue opens an aspect page with backlog todos
- **THEN** no backlog row offers "Add to sprint" and the page links to the review
- **proof:** e2e

#### Scenario: Aspect without todos shows an empty state with quick add
- **WHEN** Rue opens the page of an aspect that has no todos
- **THEN** an empty state with a quick-add action is shown
- **proof:** e2e

### Requirement: Aspect cards on wide screens
At ≥1024 px the Aspects page SHALL show a grid of aspect cards (icon, name, this sprint's progress
"done / total", backlog count) instead of a list; edit and delete live in each card's menu. Below 1024 px
it stays a list. A single aspect is one left-aligned card. (S11)

#### Scenario: Aspects page shows cards at 1024 and wider
- **WHEN** three aspects exist during a running sprint and Rue opens `/aspects` at 1280 px
- **THEN** each aspect is a card showing its icon, name, progress "done / total" and backlog count, and at least two cards share one row
- **proof:** e2e

#### Scenario: Aspects page stays a list on phone
- **WHEN** Rue opens `/aspects` at 375 px
- **THEN** aspects are shown as a single-column list, one row per aspect
- **proof:** e2e

#### Scenario: Single aspect is one left-aligned card
- **WHEN** exactly one aspect exists and Rue opens `/aspects` at 1280 px
- **THEN** one card is shown, aligned to the left edge of the content
- **proof:** e2e

#### Scenario: Card menu holds edit and delete
- **WHEN** Rue opens an aspect card's menu at 1280 px
- **THEN** it offers Edit and Delete, and Edit opens the aspect form for that aspect
- **proof:** e2e

