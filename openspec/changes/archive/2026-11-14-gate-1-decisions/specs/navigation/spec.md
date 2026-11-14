## MODIFIED Requirements

### Requirement: Responsive layout and navigation
Every screen SHALL work at 375 px phone width and on desktop. On desktop a sidebar links Today, Sprint, Calendar,
Backlog, Recurring, Projects, Uni and Aspects; on a phone a Things-style home list with those entries is
drilled into, and every screen links back to it. On a screen where the persistent navigation is shown, `/menu` SHALL redirect to `/` in the browser (replacing the history entry); where it is not shown, `/menu` shows the home list. Calendar (route `/calendar`) comes right after Sprint and shows no
count; Projects comes after Recurring, Uni after Projects, and both before Aspects. (S19, it-projects S14, uni-hub S17, calendar-planning S11)

#### Scenario: Desktop shows a sidebar
- **WHEN** any screen, `/calendar` included, is opened at 1280 px width
- **THEN** a sidebar with Today, Sprint, Calendar, Backlog, Recurring, Projects, Uni and Aspects, in that order, is visible and marks the current screen (Calendar on `/calendar` and `/calendar?month=…`, Projects also on a project's detail page, Uni also on a class's detail page)
- **proof:** e2e

#### Scenario: Phone home list shows the eight lists
- **WHEN** `/menu` is opened at 375 px width
- **THEN** it lists Today, Sprint, Calendar, Backlog, Recurring, Projects, Uni and Aspects, in that order, the Calendar entry without a count, and no sidebar is shown
- **proof:** e2e

#### Scenario: Phone home list drills into each list
- **WHEN** at 375 px Rue taps each entry of the home list and then the back link
- **THEN** each opens its screen (Calendar opens `/calendar` with the heading "Calendar") and the back link returns to the home list
- **proof:** e2e

#### Scenario: Every screen fits 375 px without horizontal scroll
- **WHEN** Today, sprint (all three views), planning, review, backlog, the calendar, aspects, recurring, onboarding, projects, a project's detail page, uni and a class's detail page are opened at 375 px
- **THEN** none scrolls horizontally, and a screenshot of each is written to `test-results/shots/`
- **proof:** e2e

#### Scenario: Wide screen redirects /menu to Today
- **WHEN** `/menu` is opened at 1280 px width
- **THEN** the browser ends on `/` and Back does not return to `/menu`
- **proof:** e2e

#### Scenario: Phone keeps /menu
- **WHEN** `/menu` is opened at 375 px width
- **THEN** the home list is shown and the URL stays `/menu`
- **proof:** e2e
