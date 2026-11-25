## ADDED Requirements

### Requirement: Sprint plan screen on the fingerprint
`/sprint/plan` SHALL render on the fingerprint with the draft ("This sprint", with "Due this week" and "Joins automatically") and the backlog list side by side from 1280 px, the backlog as a rail there, and stacked below 1280 px; the start card (the start figure and the start action) sits on top at every width (gate 4 pick). Every pull and unpull SHALL be possible by button ("Add to sprint: <title>", "Remove from sprint: <title>"); drag is an extra on fine-pointer devices. The empty-draft hint SHALL read "Drag todos here from the backlog." on fine-pointer devices and "Add todos from the backlog below." on touch. Start errors SHALL show with `role="alert"` next to the start action; an error without its own copy reads "Couldn’t start the sprint — try again." (S11)

#### Scenario: Draft and backlog sit side by side on desktop
- **WHEN** `/sprint/plan` is opened at 1280 px with backlog todos
- **THEN** the draft and the backlog list share one top edge (±4 px) and neither scrolls the page horizontally
- **proof:** e2e

#### Scenario: Phone plans with Add to sprint buttons
- **WHEN** on a touch phone viewport Rue taps "Add to sprint: Gym bag" and then "Start sprint with 1 todo"
- **THEN** the todo moves into the draft without a drag and the sprint starts on `/sprint`
- **proof:** e2e

#### Scenario: Empty draft hint differs for pointer and touch
- **WHEN** `/sprint/plan` with an empty draft is opened on a desktop viewport and on a touch phone viewport
- **THEN** the desktop shows "Drag todos here from the backlog." and the phone shows "Add todos from the backlog below."
- **proof:** e2e

#### Scenario: Due this week suggestions can be unmarked
- **WHEN** two backlog todos are due in the target week and Rue unmarks "Include: Tax return" before starting
- **THEN** the counter reads "1 of 2" and after the start only the marked todo is in the sprint
- **proof:** e2e

#### Scenario: Start errors show next to the start action
- **WHEN** the start is refused with `review-pending`, and separately with `sprint-active`
- **THEN** an alert next to the start action reads "The last sprint needs a review first." and "A sprint is already running." respectively
- **proof:** e2e

#### Scenario: Empty backlog and many items in the plan
- **WHEN** the backlog is empty, and separately holds 80 todos in 8 aspects with long titles, at 375 px and 1280 px
- **THEN** the empty case shows the heading "The backlog is empty" with "Open backlog", and the full case lists every group without horizontal scroll
- **proof:** e2e

### Requirement: Sprint review screen on the fingerprint
`/sprint/review` SHALL render on the fingerprint with one decision per open todo (Carry over / Back to backlog; recurring instances Carry over / Drop), the generated close label ("Carry 2, return 1 and close"), a one-tap "Close sprint" when nothing is open, "Couldn’t close the sprint — try again." when the close is refused, and the redirect to `/sprint/plan` after closing. The Done todos sit in a disclosure that is collapsed at every width (gate 4 pick). The close action ends the list; on phones (below 768 px, gate 5 Q10) it is a compact bar that sticks above the pill bar and holds only a short count ("<n> open · <m> done") and the button "Close sprint", while the generated close label and the full summary text sit at the end of the list (Rue, wave 11). (S12)

#### Scenario: Close label follows the decisions
- **WHEN** a review holds three open todos, Rue sets one to "Back to backlog" and leaves two on "Carry over"
- **THEN** the close button reads "Carry 2, return 1 and close", and after pressing it the browser is on `/sprint/plan` with the two carried todos in the draft
- **proof:** e2e

#### Scenario: Recurring instances offer only carry and drop
- **WHEN** a recurring instance is open in the review
- **THEN** its radio group offers "Carry over" and "Drop" and no "Back to backlog"
- **proof:** e2e

#### Scenario: All done closes in one tap
- **WHEN** every sprint todo is done and the review opens
- **THEN** it reads "All 4 done. Nothing to carry over.", shows no choices, and "Close sprint" closes it in one tap
- **proof:** e2e

#### Scenario: Nothing was planned
- **WHEN** the sprint had no todos and the review opens
- **THEN** it reads "Nothing was planned this week." and offers "Close sprint"
- **proof:** e2e

#### Scenario: Many open todos stay usable in the review
- **WHEN** 40 open todos in 8 aspects with long titles are reviewed at 375 px
- **THEN** each has its radio group reachable, every option is at least 44 px tall, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Phone close bar sticks above the pill bar
- **WHEN** a review with 3 open and 1 done todos is opened at 375 px and scrolled to the top
- **THEN** a bar with "3 open · 1 done" and the button "Close sprint" is visible above the pill bar (its bottom edge above the pill bar's top edge), and the generated label "Carry 3 and close" with the full summary text is at the end of the list, not in the bar
- **proof:** e2e

#### Scenario: A refused close shows its alert next to the close action
- **WHEN** Rue presses "Carry 1 and close" before the sprint's Sunday, where closing is refused
- **THEN** an alert reading "Couldn’t close the sprint — try again." is shown, and the close button's accessible description carries that text
- **proof:** e2e

