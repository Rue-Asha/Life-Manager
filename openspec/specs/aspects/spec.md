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

