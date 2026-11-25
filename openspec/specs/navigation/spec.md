# navigation Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Touch alternatives
Every drag interaction SHALL have a touch and keyboard alternative: planning pull, rail to sprint, board status, week day, send back to the backlog, and aspect reorder (Move up / Move down). (S19, S10, S11, S16, S24)

#### Scenario: Touch-only device completes the sprint ritual
- **WHEN** with a touch phone viewport Rue plans a sprint, moves a todo on the board, assigns a day and reviews, without any drag
- **THEN** each step succeeds through menus and pickers
- **proof:** e2e

### Requirement: Projects count in navigation
The Projects entry in the top bar menu and in the More hub SHALL show the number of active projects as its count; a count of 0 SHALL be hidden like every other zero count. (it-projects S14, S2, S4)

#### Scenario: Projects entry counts active projects
- **WHEN** two active, one backlog and one implemented project exist and Rue opens the top bar menu on `/` at 1280 px and `/menu` at 375 px
- **THEN** the Projects entry shows the count 2 in both places
- **proof:** e2e

#### Scenario: Zero active projects shows no count
- **WHEN** no project is active
- **THEN** the Projects entry in the top bar menu and in the More hub shows no count
- **proof:** e2e

### Requirement: Uni count in navigation
The Uni entry in the top bar menu and in the More hub SHALL show the number of open class todos (not done) in active semesters as its count; a count of 0 SHALL be hidden like every other zero count. (uni-hub S17, S2, S4)

#### Scenario: Uni entry counts open class todos in active semesters
- **WHEN** an active semester's classes have two open and one done todo, an archived semester's class has one todo, a Uni todo without class exists, and Rue opens the top bar menu on `/` at 1280 px and `/menu` at 375 px
- **THEN** the Uni entry shows the count 2 in both places
- **proof:** e2e

#### Scenario: Zero open class todos shows no count
- **WHEN** no open class todo exists
- **THEN** the Uni entry in the top bar menu and in the More hub shows no count
- **proof:** e2e

### Requirement: Proton sync link
The top bar menu and the More hub SHALL link the "Proton sync" page (`/sync`) after Recurring, apart from the aspect links. The link SHALL show a warning marker (an image with the accessible name "Needs attention") while the sync state is "re-login needed" or "error", and none otherwise. (proton-calendar-sync S12, S2, S4, S7)

#### Scenario: Sync link in the top bar menu and the More hub
- **WHEN** the top bar menu is opened on `/` at 1280 px and `/menu` at 375 px, and then the menu link is followed
- **THEN** both list "Proton sync" after Recurring, and on `/sync` the sync entry is the only current entry in the menu
- **proof:** e2e

#### Scenario: Sync link warns on re-login needed or error
- **WHEN** the sync state is "up to date", then "re-login needed" (fake exits 2), then "error" (missing binary)
- **THEN** neither the top bar menu nor the More hub link shows the "Needs attention" marker in the first state, and both show it in the other two
- **proof:** e2e

### Requirement: Desktop top bar
From 768 px the app SHALL show one fingerprint top bar (landmark `navigation` named "Main") with Today, Sprint, Backlog and Calendar as links, a menu button "More" whose menu holds Aspects with one link per aspect (colour and icon), Projects, Uni, Recurring and Proton sync, and a "New todo" button. Each list link with a count SHALL show it (Today the overdue-aware count, Sprint open sprint todos, Backlog backlog size, and in the menu Projects active projects, Uni open class todos, Recurring rules, each aspect its backlog count); a count of 0 SHALL be hidden and a count of 100 or more SHALL read "99+". The current route SHALL be marked with `aria-current="page"` (Today only on `/`, Sprint also on plan and review, Calendar also with `?month=`, Projects also on a project page, Uni also on a class page, an aspect page marks its own aspect link, `/sync` marks only the sync entry); when the current route sits in the menu, the "More" button SHALL be marked as well. The bar SHALL fit on one line at exactly 768 px. (S2)

#### Scenario: Top bar shows the lists, the menu and New todo
- **WHEN** `/backlog` is opened at 1280 px with two aspects
- **THEN** navigation "Main" holds links Today, Sprint, Backlog and Calendar in that order, a "More" button and a "New todo" button, and opening "More" shows Aspects, a link per aspect, Projects, Uni, Recurring and Proton sync
- **proof:** e2e

#### Scenario: Current route is marked in the top bar
- **WHEN** `/sprint/plan`, `/calendar?month=2026-12`, a project page, a class page, an aspect page and `/sync` are opened in turn at 1280 px
- **THEN** Sprint, Calendar, Projects (and "More"), Uni (and "More"), that aspect's link (and "More") and Proton sync (and "More") carry `aria-current="page"` respectively, and no other entry does
- **proof:** e2e

#### Scenario: Zero counts are hidden in the top bar
- **WHEN** the backlog is empty, no project is active and no rule exists, at 1280 px
- **THEN** the Backlog link, the Projects entry and the Recurring entry show no count
- **proof:** e2e

#### Scenario: Counts of 100 or more read 99+
- **WHEN** the backlog holds 120 todos and `/` is opened at 1280 px
- **THEN** the Backlog link shows "99+" and its accessible name still contains "Backlog"
- **proof:** e2e

#### Scenario: Long aspect names truncate with the full name available
- **WHEN** an aspect named with 80 characters exists and the "More" menu is opened at 1280 px
- **THEN** its link stays inside the menu width (scrollWidth <= clientWidth of the menu) and its accessible name and its `title` carry the full name
- **proof:** e2e

#### Scenario: Top bar fits at 768 px
- **WHEN** `/` is opened at exactly 768 px with every count at "99+"
- **THEN** all top-bar items share one top edge (±1 px) and the bar does not scroll horizontally (scrollWidth <= clientWidth)
- **proof:** e2e

### Requirement: Phone pill bar
Below 768 px the app SHALL show a pill bar (landmark `navigation` named "Main") with Today, Sprint, Backlog, Calendar and More, plus a separate round button "+" (accessible name "New todo"). The current tab SHALL carry `aria-current="page"` (More on `/menu` and on every route reached only through it). The bar SHALL fit at 320 px, respect the safe-area insets, never cover page content (the last element of every page can be scrolled fully above it), and SHALL be hidden and `inert` while a text field has focus. More SHALL carry the "Needs attention" marker while sync attention holds. (S3)

#### Scenario: Pill bar shows five tabs and the round add button
- **WHEN** `/` is opened at 375 px
- **THEN** navigation "Main" holds Today, Sprint, Backlog, Calendar and More in that order, a separate "New todo" button sits outside the pill group, and no top bar is shown
- **proof:** e2e

#### Scenario: Active tab is marked on the phone
- **WHEN** `/sprint/review`, `/calendar`, `/menu` and `/uni` are opened in turn at 375 px
- **THEN** Sprint, Calendar, More and More carry `aria-current="page"` respectively
- **proof:** e2e

#### Scenario: Pill bar fits at 320 px
- **WHEN** `/` is opened at 320 px
- **THEN** the five tabs and the "+" are fully inside the viewport, each is at least 44 × 44 px, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Pill bar hides while a text field has focus
- **WHEN** at 375 px the backlog filter or a todo title field receives focus, and then loses it
- **THEN** while focused the bar and the "+" are not visible and are `inert`; after blur both are visible again
- **proof:** e2e

#### Scenario: Content never sits under the pill bar
- **WHEN** `/backlog` with 60 todos is scrolled to the end at 375 px
- **THEN** the last todo row's bottom edge is above the pill bar's top edge
- **proof:** e2e

#### Scenario: Pill bar respects the safe area
- **WHEN** the app is opened on Rue's phone with a home indicator
- **THEN** the pill bar and the "+" sit above the home indicator and the notch never covers content
- **proof:** manual (safe-area insets only exist on real hardware)

### Requirement: More hub on the phone
`/menu` SHALL be the More hub, reachable at every width: Aspects (each aspect as a row with its colour and icon, linking its page), Projects, Uni, Recurring and Proton sync, each with its count where defined (0 hidden) and Proton sync with the "Needs attention" marker while sync attention holds. It SHALL NOT redirect at any width: from 1280 px its two groups sit side by side, and the top bar's More menu stays as the quick way. (S4; Rue 2026-11-23 supersedes the gate-1 redirect)

#### Scenario: More hub lists the secondary destinations
- **WHEN** `/menu` is opened at 375 px with three aspects, two active projects and one rule
- **THEN** it lists the three aspects with colour and icon, Projects with "2", Uni, Recurring with "1" and Proton sync, and each entry opens its screen
- **proof:** e2e

#### Scenario: Many aspects scroll in the More hub
- **WHEN** 25 aspects exist and `/menu` is opened at 375 px
- **THEN** the hub scrolls vertically, every aspect row can be reached above the pill bar, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Sync Off shows no marker in the hub
- **WHEN** sync is Off and `/menu` is opened at 375 px
- **THEN** Proton sync shows no "Needs attention" marker
- **proof:** e2e

#### Scenario: Wide screen keeps /menu
- **WHEN** `/menu` is opened at 1280 px width
- **THEN** the More hub is shown in two columns and the URL stays `/menu`
- **proof:** e2e

#### Scenario: Phone keeps /menu
- **WHEN** `/menu` is opened at 375 px width
- **THEN** the More hub is shown and the URL stays `/menu`
- **proof:** e2e

### Requirement: Global quick add
The phone "+" and the desktop "New todo" SHALL open one quick-add dialog titled "New todo" from every screen once an aspect exists. It posts to the same `/todos?/create` action as today. The aspect SHALL be pre-filled with the aspect of `/aspects/[id]` on that page, else the first aspect. On `/sprint` the destination SHALL be pre-set to the sprint; elsewhere it defaults to the backlog, and a planned day inside the running sprint's week sends it into the sprint as today. The dialog SHALL always state the destination ("Goes to this sprint" / "Goes to the backlog"). Without a running sprint only the backlog destination exists; while the review is required the sprint destination SHALL be disabled with a link to the review. Validation errors show inline with `role="alert"`; Enter in the title submits; Escape, the close control and a backdrop click close it without a todo. The functional contract's "no global New todo on phones" line is amended. (S5)

#### Scenario: Plus on the phone adds a backlog todo
- **WHEN** at 375 px on `/recurring` Rue taps "+", types "Buy stamps", picks Home and presses Enter
- **THEN** the dialog closes and `/backlog` lists "Buy stamps" under Home, not in any sprint
- **proof:** e2e

#### Scenario: New todo on desktop states the destination live
- **WHEN** at 1280 px during a running sprint Rue opens "New todo" on `/backlog`, then sets Planned to a day of the running week
- **THEN** the dialog first reads "Goes to the backlog" and then "Goes to this sprint", and after adding the todo is in the sprint on that day
- **proof:** e2e

#### Scenario: Quick add on an aspect page pre-fills the aspect
- **WHEN** Rue opens "New todo" on the aspect page of "Health"
- **THEN** the aspect field shows Health
- **proof:** e2e

#### Scenario: Quick add on the sprint pre-sets the sprint destination
- **WHEN** during a running sprint Rue opens "New todo" on `/sprint`, types a title and adds it
- **THEN** the dialog read "Goes to this sprint" before adding and the todo is in the running sprint without a day
- **proof:** e2e

#### Scenario: No running sprint offers only the backlog
- **WHEN** no sprint is running and Rue opens "New todo" on `/sprint`
- **THEN** the destination reads "Goes to the backlog" and no sprint destination can be chosen
- **proof:** e2e

#### Scenario: Review required disables the sprint destination
- **WHEN** the phase is review-required and Rue opens "New todo"
- **THEN** the sprint destination is disabled, a "Review the sprint" link is shown in the dialog, and adding goes to the backlog
- **proof:** e2e

#### Scenario: Missing title shows an inline alert
- **WHEN** Rue submits the quick add with an empty title
- **THEN** an element with `role="alert"` reads "Give the todo a title.", the dialog stays open and no todo was created
- **proof:** e2e

#### Scenario: Contract allows the global quick add on phones
- **WHEN** `docs/functional-contract.md` §6 "Navigation between routes" is read
- **THEN** it describes the phone pill bar with the round "+" opening "New todo" from every screen and no longer says "No global `New todo` action on phones"
- **proof:** unit

#### Scenario: Escape and backdrop close the quick add without a todo
- **WHEN** Rue opens "New todo", types a title and presses Escape; then opens it again and clicks the backdrop
- **THEN** each time the dialog closes, focus returns to the control that opened it, and no todo was created
- **proof:** e2e

### Requirement: Sync attention marker
While the sync state is "Re-login needed" or "Error", the Proton sync entry in the top bar menu, the top bar's "More" button, the More hub entry and the phone "More" tab SHALL show the marker (an image named "Needs attention"); in Off, Up to date and Syncing none is shown. (S7)

#### Scenario: Marker shows in both bars on attention states
- **WHEN** the sync state is "Up to date", then "Re-login needed" (fake exits 2), then "Error" (missing binary), and `/` is opened at 1280 px and 375 px in each state
- **THEN** no "Needs attention" marker exists in the first state, and in the other two it shows on the top bar's "More" and its Proton sync entry and on the phone "More" tab
- **proof:** e2e

### Requirement: Every screen fits narrow phones
Every screen and overlay SHALL fit 320 px and 390 px wide viewports without horizontal page scroll. (S24)

#### Scenario: Every screen fits 320 and 390 px without horizontal scroll
- **WHEN** Today, Sprint (all three views), plan, review, backlog, calendar, recurring, aspects, an aspect page, welcome, projects, a project page, uni, a class page, sync and `/menu` are opened at 320 px and at 390 px with the worst-case seed
- **THEN** none scrolls horizontally (document scrollWidth <= clientWidth), and a screenshot of each is written to `test-results/shots/`
- **proof:** e2e

### Requirement: First-run Welcome hides the bars
While no aspect exists, `/welcome` SHALL show neither the top bar nor the pill bar nor the round "+" (gate 4 pick "Bars ausblenden"); the page is the only way forward. Once an aspect exists, revisiting `/welcome` shows the bars as on every other screen. (S2, S3, S9)

#### Scenario: First-run Welcome shows no bars
- **WHEN** no aspect exists and `/welcome` is opened at 375 px and at 1280 px, and later, with one aspect, `/welcome` is opened again at 1280 px
- **THEN** on first run no navigation "Main" and no "New todo" button exist at either width; on the revisit the top bar with "New todo" is shown
- **proof:** e2e

