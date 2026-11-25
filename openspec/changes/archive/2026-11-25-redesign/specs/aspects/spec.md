## ADDED Requirements

### Requirement: Welcome on the fingerprint
`/welcome` SHALL render on the fingerprint with the six presets (colour and icon) and "Add your own"; the submit action SHALL stay disabled until at least one aspect is chosen and read "Continue with N aspect(s)". It SHALL stay reachable later to add more, with existing presets disabled and marked as existing. The zero-aspect redirect from every route stays. (S9)

#### Scenario: Submit waits for a choice
- **WHEN** `/welcome` is opened on first run and Rue ticks Health and Uni
- **THEN** the submit is disabled before the first tick and reads "Continue with 2 aspects" after the second, and submitting lands on `/backlog`
- **proof:** e2e

#### Scenario: Duplicate custom name shows its error
- **WHEN** Health exists and Rue adds her own aspect named "health" on `/welcome`
- **THEN** an alert at the name field reads "You already have an aspect with this name." and the ticked presets stay ticked
- **proof:** e2e

#### Scenario: Revisiting welcome marks existing presets
- **WHEN** Health exists and Rue opens `/welcome` later
- **THEN** the Health preset is disabled and marked as existing, and another preset can be added
- **proof:** e2e

#### Scenario: Zero aspects redirect to welcome from every route
- **WHEN** no aspect exists and `/`, `/sprint`, `/backlog`, `/calendar`, `/menu` and `/sync` are opened
- **THEN** each ends on `/welcome`
- **proof:** e2e

### Requirement: Aspects screen on the fingerprint
`/aspects` SHALL render on the fingerprint with the aspect list (colour, icon, name; laid out as in "Aspect list at every width"), add and edit (8 colours, 24 icons), and reorder (gate 5, Q1): by the drag handle on fine-pointer devices and by "Move up" / "Move down" in each row's actions menu ("Actions for <name>") on every device and with the keyboard (no visible Move buttons on the row; the moved row glides to its place and focus returns to its menu button), each posting the full order to `?/reorder`. The first aspect SHALL have no enabled "Move up" and the last no enabled "Move down". Delete SHALL keep its confirmation: an aspect with todos or rules asks for a move-to target (a labelled select "Move them to", placeholder "Choose an aspect", nothing preselected) and confirms with "Move <n> and delete"; an aspect with none confirms with "Delete aspect" and no target; deleting the last empty aspect redirects to `/welcome`. (S16)

#### Scenario: Move up and Move down reorder the aspects
- **WHEN** aspects Health, Uni, Job exist and Rue picks "Move up" in Job's actions menu, using only the keyboard
- **THEN** the list reads Health, Job, Uni, focus returns to Job's actions menu button, and after reload the order is Health, Job, Uni
- **proof:** e2e

#### Scenario: Ends of the list disable the moves
- **WHEN** `/aspects` is opened with three aspects
- **THEN** in the actions menus the first aspect's "Move up" and the last aspect's "Move down" are disabled
- **proof:** e2e

#### Scenario: Reorder by drag on desktop
- **WHEN** at 1280 px with a fine pointer Rue drags Job above Health
- **THEN** after reload the order starts with Job
- **proof:** e2e

#### Scenario: Delete with a move target
- **WHEN** Uni has 3 todos and Rue deletes it, picking Job as the target
- **THEN** the dialog confirms with "Move 3 and delete", and afterwards the three todos belong to Job
- **proof:** e2e

#### Scenario: Delete an empty aspect needs no target
- **WHEN** an aspect without todos or rules is deleted
- **THEN** the dialog shows no target choice and confirms with "Delete aspect"
- **proof:** e2e

#### Scenario: Deleting the last empty aspect goes to welcome
- **WHEN** the only aspect has no todos or rules and Rue deletes it
- **THEN** the browser ends on `/welcome`
- **proof:** e2e

### Requirement: Aspect page on the fingerprint
`/aspects/[id]` SHALL render on the fingerprint with the aspect's sprint todos and backlog todos, the global quick add pre-filled with this aspect, and its secondary details (colour, counts) in a "Details" card: hidden on phones, stacked above the lists from 768 px, a right column from 1280 px (gate 4 pick c). An aspect with no todos SHALL read the heading "Nothing in <name> yet" and "Add a todo to start."; an unknown id SHALL show the fingerprint 404 page "Aspect not found" with a link to Aspects. (S17)

#### Scenario: Aspect page lists its todos and pre-fills the quick add
- **WHEN** Health has one sprint todo and one backlog todo and Rue opens its page and then "New todo"
- **THEN** both todos are listed in their sections and the quick add's aspect is Health
- **proof:** e2e

#### Scenario: Empty aspect page
- **WHEN** an aspect named Garden has no todos and its page is opened
- **THEN** it reads "Nothing in Garden yet" and "Add a todo to start."
- **proof:** e2e

#### Scenario: Unknown aspect shows Aspect not found
- **WHEN** `/aspects/99999` is opened
- **THEN** the status is 404 and the page reads "Aspect not found" with a link "Aspects"
- **proof:** e2e

#### Scenario: Aspect page rail shows the aspect's details
- **WHEN** Rue opens an aspect page at 1280 px for an aspect named by the colour Sage with two sprint todos, one of them done, and one backlog todo
- **THEN** the side panel (complementary region) shows the colour name "Sage", the progress "1 / 2" and "1 in backlog"
- **proof:** e2e

## RENAMED Requirements

- FROM: `### Requirement: Aspect cards on wide screens`
- TO: `### Requirement: Aspect list at every width`

## MODIFIED Requirements

### Requirement: Aspect page
Each aspect SHALL have a page at `/aspects/<id>` with a "This sprint" section (the aspect's todos in the
running sprint, sorted as on the Sprint page (priority P1–P3 first, no priority last, then due date, none last), its progress "done / total" with a hairline bar, and the add/send-back actions of the
Sprint tab, including drag on desktop) followed by a "Backlog" section with the aspect's backlog todos
and its own inline quick add ("Add a todo to <name>", gate 4 pick) defaulting to that aspect. The aspect links in the top bar's "More" menu, the aspect rows of the phone's More hub and the rows on the Aspects page open it. Its details (colour, this sprint's progress, backlog count) sit in a "Details" card that is hidden on phones as display-only data, stacked above the lists from 768 px (sized to its facts, as on Today) and a right column from 1280 px (gate 4 pick c).
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
- **WHEN** Rue types a title into the aspect page's Backlog inline add ("Add a todo to <name>", title only) and submits it
- **THEN** the new todo is in the backlog under this aspect
- **proof:** e2e

#### Scenario: Menu and Aspects rows open the aspect page
- **WHEN** Rue clicks an aspect in the top bar's "More" menu at 1280 px, an aspect row in the More hub at 375 px, and separately an aspect on the Aspects page
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

### Requirement: Aspect list at every width
The Aspects page SHALL show the aspects as one list at every width, as signed at gate 5: each row holds the drag handle (fine pointer from 1280 px), the aspect's icon tile in its colour, its name and its todo count ("No todos", "1 todo", "<n> todos"), a second line "<n> in backlog · <done> / <total> this sprint" (or "Not in this sprint") at every width, as the signed hi-fi draws it, and a "···" button "Actions for <name>" whose menu holds "Move up", "Move down", "Edit" and "Delete". A small key-facts card above the list holds the real counts (aspects, todos, in this sprint). A single aspect is one row. (S11, S16)

#### Scenario: Aspects page is one list with counts from 768
- **WHEN** three aspects exist during a running sprint and Rue opens `/aspects` at 1280 px
- **THEN** the aspects are rows in one column (every row's left edge lines up, no two rows share a top edge), each showing its icon tile, name, todo count and "<n> in backlog · <done> / <total> this sprint"
- **proof:** e2e

#### Scenario: Aspects page stays a list on phone
- **WHEN** Rue opens `/aspects` at 375 px
- **THEN** aspects are shown as a single-column list, one row per aspect, each with its name, its todo count and its backlog and sprint line
- **proof:** e2e

#### Scenario: Single aspect is one row
- **WHEN** exactly one aspect exists and Rue opens `/aspects` at 1280 px
- **THEN** one row is shown, aligned to the left edge of the list
- **proof:** e2e

#### Scenario: Row menu holds the moves, edit and delete
- **WHEN** Rue opens an aspect's "Actions for <name>" menu at 1280 px
- **THEN** it offers Move up, Move down, Edit and Delete, and Edit opens the aspect form for that aspect
- **proof:** e2e
