## ADDED Requirements

### Requirement: Wide desktop layout with context rail
At ≥1280 px screens SHALL use the width: sidebar | content (lists max 720 px, centred in the space between
sidebar and rail) | context rail (~320–360 px, `--paper-sunk`). Rails per screen: Sprint → backlog rail, docked in By aspect and Board
and a toggle overlay in Week even at ≥1280 px (with Unscheduled; see sprint-views "Wide board and week");
Today → this sprint's progress per aspect; aspect page → the aspect's details (colour, counts). Screens
without a rail (Backlog, Plan, Review, Recurring, Aspects, Welcome) centre their column in the free space. Between 768
and 1279 px the rail collapses into a toggle button that opens it as an overlay panel and every screen's
column is centred in the space right of the sidebar; below 768 px the phone layout is unchanged. At ≥1280 px
Board and Week fill the content width instead of centring a capped column (see sprint-views "Wide board and
week"). No screen scrolls horizontally at any width. (S9)

#### Scenario: Sprint at 1280 shows a context rail
- **WHEN** Rue opens `/sprint` at 1280 px and at 1600 px during a running sprint, in the By aspect view and in the Board view
- **THEN** the context rail is docked at the right edge with the `--paper-sunk` background, in By aspect the sprint list is at most 720 px wide and centred within 2 px in the space between sidebar and rail, and in Board the columns fill that space
- **proof:** e2e

#### Scenario: Today at 1280 shows sprint progress per aspect
- **WHEN** Rue opens `/` at 1280 px during a running sprint with todos in two aspects
- **THEN** the context rail lists both aspects with this sprint's progress "done / total"
- **proof:** e2e

#### Scenario: Aspect page rail shows the aspect's details
- **WHEN** Rue opens an aspect page at 1280 px
- **THEN** the context rail shows the aspect's colour, its sprint progress and its backlog count
- **proof:** e2e

#### Scenario: Screens without a rail centre their column
- **WHEN** Backlog, Plan, Review, Recurring, Aspects and Welcome are opened at 1100 px and at 1600 px
- **THEN** on each the content column's centre lies within 8 px of the centre of the area right of the sidebar
- **proof:** e2e

#### Scenario: Screens with a rail centre their column
- **WHEN** Today, Sprint (By aspect) and an aspect page are opened during a running sprint at 1600 px and at 1100 px
- **THEN** at 1600 px each content column's centre lies within 2 px of the centre of the space between the sidebar and the docked rail, and at 1100 px (overlay rail) within 2 px of the centre of the area right of the sidebar
- **proof:** e2e

#### Scenario: Rail becomes an overlay toggle below 1280
- **WHEN** Rue opens `/sprint` at 1100 px during a running sprint
- **THEN** no rail is docked, a rail toggle button is shown, and pressing it opens the rail as an overlay panel without a scrim; pressing it again closes it
- **proof:** e2e

#### Scenario: No screen scrolls horizontally at any width
- **WHEN** every screen (Today, Sprint in all three views, Plan, Review, Backlog, Aspects, an aspect page, Recurring, Welcome) is opened at 768, 1024, 1280 and 1600 px
- **THEN** none scrolls horizontally, and a 1280 px screenshot of each is written to `test-results/shots/`
- **proof:** e2e
