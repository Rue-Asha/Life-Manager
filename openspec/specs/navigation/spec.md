# navigation Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Responsive layout and navigation
Every screen SHALL work at 375 px phone width and on desktop. On desktop a sidebar links Today, Sprint,
Backlog, Aspects and Recurring; on a phone a Things-style home list with those entries is drilled into,
and every screen links back to it. (S19)

#### Scenario: Desktop shows a sidebar
- **WHEN** any screen is opened at 1280 px width
- **THEN** a sidebar with Today, Sprint, Backlog, Aspects and Recurring is visible and marks the current screen
- **proof:** e2e

#### Scenario: Phone home list shows the five lists
- **WHEN** `/menu` is opened at 375 px width
- **THEN** it lists Today, Sprint, Backlog, Aspects and Recurring, and no sidebar is shown
- **proof:** e2e

#### Scenario: Phone home list drills into each list
- **WHEN** at 375 px Rue taps each entry of the home list and then the back link
- **THEN** each opens its screen and the back link returns to the home list
- **proof:** e2e

#### Scenario: Every screen fits 375 px without horizontal scroll
- **WHEN** Today, sprint (all three views), planning, review, backlog, aspects, recurring and onboarding are opened at 375 px
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

