## MODIFIED Requirements

### Requirement: Wide desktop layout with context rail
At ≥1280 px screens SHALL use the width: sidebar | content (lists max 720 px, centred in the space between
sidebar and rail) | context rail (~320–360 px, `--surface` with a `--line` hairline on its left edge). Rails per screen: Sprint → backlog rail, docked in By aspect and Board
and a toggle overlay in Week even at ≥1280 px (with Unscheduled; see sprint-views "Wide board and week");
Today → this sprint's progress per aspect; aspect page → the aspect's details (colour, counts); project
detail → the project's metadata (repo, tags, created, updated); Uni → the Uni aspect line; class detail →
the class's metadata (lecturer, room, ECTS, links, exam, grade); Calendar → the selected day's entries, its month grid
filling the content width like Board. Screens without a rail (Backlog, Plan,
Review, Recurring, Aspects, Projects, Welcome) centre their column in the free space. Between 768
and 1279 px the rail collapses into a toggle button that opens it as an overlay panel and every screen's
column is centred in the space right of the sidebar; the project detail, Uni and the class detail are the
exceptions, showing their rail content in the column instead of a rail toggle (metadata as a row under the
title; the Uni aspect line below the notes). Below 768 px the phone layout is unchanged.
At ≥1280 px Board, Week and the calendar grid fill the content width instead of centring a capped column (see sprint-views
"Wide board and week"). No screen scrolls horizontally at any width. (S9, it-projects S4, S14, uni-hub S3, S9, S16, S17, cohesive-look, calendar-planning S13, uni-hub-sprint-todos S1)
- **proof:** manual (human taste gate, recorded by the orchestrator)

#### Scenario: Uni aspect line sits in the rail at 1600 and below the notes at 1100
- **WHEN** Rue opens `/uni` at 1600 px and at 1100 px
- **THEN** at 1600 px the Uni aspect line is inside the docked context rail, and at 1100 px there is no rail and no rail toggle and the aspect line sits below the notes block
- **proof:** e2e
