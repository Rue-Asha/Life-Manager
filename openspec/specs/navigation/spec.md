# navigation Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Responsive layout and navigation
Every screen SHALL work at 375 px phone width and on desktop. On desktop a sidebar links Today, Sprint,
Backlog, Recurring, Projects, Uni and Aspects; on a phone a Things-style home list with those entries is
drilled into, and every screen links back to it. Projects comes after Recurring, Uni after Projects, and
both before Aspects. (S19, it-projects S14, uni-hub S17)

#### Scenario: Desktop shows a sidebar
- **WHEN** any screen is opened at 1280 px width
- **THEN** a sidebar with Today, Sprint, Backlog, Recurring, Projects, Uni and Aspects, in that order, is visible and marks the current screen (Projects also on a project's detail page, Uni also on a class's detail page)
- **proof:** e2e

#### Scenario: Phone home list shows the seven lists
- **WHEN** `/menu` is opened at 375 px width
- **THEN** it lists Today, Sprint, Backlog, Recurring, Projects, Uni and Aspects, in that order, and no sidebar is shown
- **proof:** e2e

#### Scenario: Phone home list drills into each list
- **WHEN** at 375 px Rue taps each entry of the home list and then the back link
- **THEN** each opens its screen and the back link returns to the home list
- **proof:** e2e

#### Scenario: Every screen fits 375 px without horizontal scroll
- **WHEN** Today, sprint (all three views), planning, review, backlog, aspects, recurring, onboarding, projects, a project's detail page, uni and a class's detail page are opened at 375 px
- **THEN** none scrolls horizontally, and a screenshot of each is written to `test-results/shots/`
- **proof:** e2e

### Requirement: Touch alternatives
Every drag interaction SHALL have a touch alternative (planning pull, board status, week day). (S19)

#### Scenario: Touch-only device completes the sprint ritual
- **WHEN** with a touch phone viewport Rue plans a sprint, moves a todo on the board, assigns a day and reviews, without any drag
- **THEN** each step succeeds through menus and pickers
- **proof:** e2e

### Requirement: Approved visual result
The built app SHALL match the approved design direction on a real phone and on desktop. (S19, Done criteria)

#### Scenario: Visual result matches the approved direction
- **WHEN** Rue walks through the app on their phone and on desktop at Gate 2
- **THEN** Rue approves the visual result
- **proof:** manual (visual judgement on real hardware)

### Requirement: Wide desktop layout with context rail
At ≥1280 px screens SHALL use the width: sidebar | content (lists max 720 px, centred in the space between
sidebar and rail) | context rail (~320–360 px, `--paper-sunk`). Rails per screen: Sprint → backlog rail, docked in By aspect and Board
and a toggle overlay in Week even at ≥1280 px (with Unscheduled; see sprint-views "Wide board and week");
Today → this sprint's progress per aspect; aspect page → the aspect's details (colour, counts); project
detail → the project's metadata (repo, tags, created, updated); Uni → the deadline overview; class detail →
the class's metadata (lecturer, room, ECTS, links, exam, grade). Screens without a rail (Backlog, Plan,
Review, Recurring, Aspects, Projects, Welcome) centre their column in the free space. Between 768
and 1279 px the rail collapses into a toggle button that opens it as an overlay panel and every screen's
column is centred in the space right of the sidebar; the project detail, Uni and the class detail are the
exceptions, showing their rail content in the column instead of a rail toggle (metadata as a row under the
title; the deadline overview as a section above the semesters). Below 768 px the phone layout is unchanged.
At ≥1280 px Board and Week fill the content width instead of centring a capped column (see sprint-views
"Wide board and week"). No screen scrolls horizontally at any width. (S9, it-projects S4, S14, uni-hub S3, S9, S16, S17)

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
- **WHEN** Backlog, Plan, Review, Recurring, Aspects, Projects and Welcome are opened at 1100 px and at 1600 px
- **THEN** on each the content column's centre lies within 8 px of the centre of the area right of the sidebar
- **proof:** e2e

#### Scenario: Screens with a rail centre their column
- **WHEN** Today, Sprint (By aspect), an aspect page, a project's detail page, Uni and a class's detail page are opened during a running sprint at 1600 px and at 1100 px
- **THEN** at 1600 px each content column's centre lies within 2 px of the centre of the space between the sidebar and the docked rail, and at 1100 px (overlay rail, or no rail on the project detail, Uni and the class detail) within 2 px of the centre of the area right of the sidebar
- **proof:** e2e

#### Scenario: Rail becomes an overlay toggle below 1280
- **WHEN** Rue opens `/sprint` at 1100 px during a running sprint
- **THEN** no rail is docked, a rail toggle button is shown, and pressing it opens the rail as an overlay panel without a scrim; pressing it again closes it
- **proof:** e2e

#### Scenario: No screen scrolls horizontally at any width
- **WHEN** every screen (Today, Sprint in all three views, Plan, Review, Backlog, Aspects, an aspect page, Recurring, Projects, a project's detail page, Uni, a class's detail page, Welcome) is opened at 768, 1024, 1280 and 1600 px
- **THEN** none scrolls horizontally, and a 1280 px screenshot of each is written to `test-results/shots/`
- **proof:** e2e

### Requirement: Projects count in navigation
The Projects entry in the sidebar and the phone home list SHALL show the number of active projects as
its count, and a count of 0 is shown the same way as every other zero count. (it-projects S14)

#### Scenario: Projects entry counts active projects
- **WHEN** two active, one backlog and one implemented project exist and Rue opens `/` at 1280 px and `/menu` at 375 px
- **THEN** the Projects entry shows the count 2 in both places
- **proof:** e2e

#### Scenario: Zero active projects is shown like other zero counts
- **WHEN** no project is active and no rule exists
- **THEN** the Projects entry shows its count the same way the Recurring entry shows its zero count
- **proof:** e2e

### Requirement: Uni count in navigation
The Uni entry in the sidebar and the phone home list SHALL show the number of open class todos (not done)
in active semesters as its count, and a count of 0 is shown the same way as every other zero count. (uni-hub S17)

#### Scenario: Uni entry counts open class todos in active semesters
- **WHEN** an active semester's classes have two open and one done todo, an archived semester's class has one todo, a Uni todo without class exists, and Rue opens `/` at 1280 px and `/menu` at 375 px
- **THEN** the Uni entry shows the count 2 in both places
- **proof:** e2e

#### Scenario: Zero open class todos is shown like other zero counts
- **WHEN** no open class todo exists and no rule exists
- **THEN** the Uni entry shows its count the same way the Recurring entry shows its zero count
- **proof:** e2e

