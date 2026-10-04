## ADDED Requirements

### Requirement: Link Uni todos to a class
QuickAdd and the todo editor SHALL show an optional "Class" select only while the selected aspect is the Uni
aspect, and a Type chip (LEC / EXC / OTH, default OTH) only once a class is picked; with a preset class (class
detail) the Type chip is shown immediately. The select lists the classes of active semesters.
With no Uni aspect set or no classes in active semesters the fields are hidden. Switching the aspect away
from the Uni aspect in the form hides them and submits no class or type. A type is only stored on a
class-linked todo. (uni-hub S11)

#### Scenario: Quick add links a todo to a class
- **WHEN** Rue picks the Uni aspect in quick add on the backlog, chooses a class, picks type EXC and submits
- **THEN** the todo is created linked to that class with type EXC
- **proof:** e2e

#### Scenario: Class field appears only for the Uni aspect
- **WHEN** Rue opens quick add and the todo editor with a non-Uni aspect selected, then selects the Uni aspect
- **THEN** the Class select is hidden first and shown after selecting the Uni aspect, and the Type chip is shown only after a class is picked
- **proof:** e2e

#### Scenario: Class field lists classes of active semesters
- **WHEN** an active semester with classes "Analysis" and "Algorithms" and an archived semester with class "Physics" exist and Rue opens the Class select in quick add
- **THEN** it lists Analysis and Algorithms and not Physics
- **proof:** e2e

#### Scenario: Class field is hidden without Uni aspect or classes
- **WHEN** Rue selects any aspect in quick add while no Uni aspect is set, and again while the Uni aspect is set but no active semester has classes
- **THEN** the Class select and Type chip are not shown in either case
- **proof:** e2e

#### Scenario: Switching the aspect away drops class and type
- **WHEN** in quick add Rue selects the Uni aspect, chooses a class and type LEC, switches to another aspect and submits
- **THEN** the fields are hidden after the switch and the created todo has no class and no type
- **proof:** e2e

### Requirement: Class link follows the aspect
The server SHALL store a class link, type and revised date only on a todo whose aspect is the Uni aspect,
regardless of the UI. A todo that gets a different aspect, by edit or by aspect deletion, loses class, type
and revised date. A posted type without a class is not stored; a class without a type gets OTH. A posted
class id that does not exist fails with `not-found` on `classId`; a class of an archived semester fails
with `archived` on `classId`. (uni-hub S11)

#### Scenario: Aspect change removes class, type and revised date
- **WHEN** a class todo with type LEC and a revised date gets a different aspect
- **THEN** its `classId`, `type` and `revisedAt` are null and its sprint, status and day are unchanged
- **proof:** unit

#### Scenario: Class link on a non-Uni todo is not stored
- **WHEN** a todo is created or updated with a valid `classId` and type and an aspect that is not the Uni aspect
- **THEN** the todo is saved without class and type
- **proof:** unit

#### Scenario: Type needs a class
- **WHEN** a Uni todo is created with type LEC and no class, and another with a class and no type
- **THEN** the first is stored with type null, the second with type OTH
- **proof:** unit

#### Scenario: Unknown or archived class id is rejected
- **WHEN** a Uni todo is created or updated with a `classId` that does not exist, or with a class of an archived semester
- **THEN** the request fails with `not-found` or `archived` on field `classId` and nothing is stored or changed
- **proof:** unit

### Requirement: Class badge on todo rows
A class-linked todo SHALL show a muted class badge (class icon in its colour, class name and type) in
`TodoRow` wherever the row renders; clicking it opens the class's detail page. Todos without a class show no
badge. At 375 px the badge wraps under the title. (uni-hub S13)

#### Scenario: Linked todo shows the class badge
- **WHEN** during a running sprint a class todo of type LEC is shown on Backlog, and another class todo on Sprint and Today, and Rue clicks a badge
- **THEN** each row shows the badge with the class icon, the class name and the type, and the click opens `/uni/classes/<id>`
- **proof:** e2e

#### Scenario: Todo without class shows no class badge
- **WHEN** a Uni-aspect todo without class is shown on Backlog
- **THEN** its row has no class badge
- **proof:** e2e

#### Scenario: Class badge wraps under the title on a phone
- **WHEN** a class todo with a long title is shown on Backlog at 375 px
- **THEN** the badge sits below the title and the page does not scroll horizontally
- **proof:** e2e
