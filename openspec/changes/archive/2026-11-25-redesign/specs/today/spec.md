## ADDED Requirements

### Requirement: Today on the fingerprint
Today SHALL render on the fingerprint with its summary, the phase prompt, the Overdue group, the aspect groups, sprint progress and due backlog items with "Add to sprint", in every phase (none, planning, running, review-available, review-required, Sunday after the review), each with its contract empty copy. Long titles SHALL wrap or clamp inside their row with the full title as the row's accessible name; many aspects and many overdue todos SHALL stay readable without horizontal scroll. (S8)

#### Scenario: Today renders every phase on the fingerprint
- **WHEN** `/` is opened in the phases none, planning, running, review-available and review-required at 375 px and at 1280 px
- **THEN** each shows its phase prompt link ("Plan your week", "Continue planning", none, "Review it", "Review the sprint") and the page sits in the fingerprint frame with no horizontal scroll
- **proof:** e2e

#### Scenario: Today empty copy per phase
- **WHEN** Today has no groups and no overdue todos in the running phase, and separately with no sprint at all
- **THEN** the running phase shows the heading "Nothing planned for today" and "The week view has the rest of your sprint." linking `/sprint?view=week`, and without a sprint only the summary "0" "open today" and the "Plan your week" prompt are shown
- **proof:** e2e

#### Scenario: Many aspects and many overdue todos stay readable
- **WHEN** Today holds todos in 12 aspects and 30 overdue todos at 375 px and at 1280 px
- **THEN** every aspect group and the Overdue group with "30" are listed, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Long titles stay inside their rows on Today
- **WHEN** a todo titled with 200 characters and one with an unbroken 60-character word are on today at 375 px
- **THEN** both rows stay inside the card (scrollWidth <= clientWidth) and each row's accessible name holds the full title
- **proof:** e2e

#### Scenario: Review required blocks with the review prompt
- **WHEN** the phase is review-required and `/` is opened
- **THEN** the "Review the sprint" prompt is shown above the lists and links `/sprint/review`
- **proof:** e2e

### Requirement: Tick done with undo
Ticking a todo done on Today SHALL post the done state at once and show the undo toast "Done: <title>" with "Undo"; Undo SHALL set the todo back to To do. The done todo stays listed in its done state. (S8)

#### Scenario: Ticking done offers undo
- **WHEN** during a running sprint Rue ticks "Done: Water plants" on Today
- **THEN** the row shows the done state, a `role="status"` toast reads "Done: Water plants" with an "Undo" button, and after reload the todo is done
- **proof:** e2e

#### Scenario: Undo returns the todo to To do
- **WHEN** Rue ticks a todo done on Today and presses "Undo" in the toast
- **THEN** the todo is To do again after reload and the toast is gone
- **proof:** e2e

### Requirement: Sync attention banner on Today
While the sync state is "Re-login needed" or "Error", Today SHALL show a banner naming the state with its next step ("Proton sync needs you to log in again. Open sync to do it." / "Proton sync stopped with an error. Open sync to see what failed.") and linking `/sync`; it SHALL offer no dismiss control while the state holds. In Off, Up to date and Syncing no banner is shown. (S7)

#### Scenario: Banner shows on attention states
- **WHEN** the sync state is "Re-login needed" (fake exits 2) and `/` is opened, then the state is "Error" (missing binary)
- **THEN** each time a banner names the state, links "Proton sync" at `/sync`, and has no dismiss button
- **proof:** e2e

#### Scenario: No banner when sync is fine or off
- **WHEN** the sync state is Off, then Up to date, then Syncing and `/` is opened in each
- **THEN** no sync banner is shown
- **proof:** e2e

## MODIFIED Requirements

### Requirement: Today summary header
Today SHALL open with a summary header under the page title: one large tabular number, the count of open
todos listed on Today (today's sprint todos not done, overdue todos and listed due-today backlog todos), labelled
"open today"; while a sprint is active a second line "Sprint <done> / <total> done · <n> days left" and a
segmented bar with one segment per aspect, sized by its sprint todos and filled by its done share in the aspect
colour. Without an active sprint the header shows only the number. The header is the screen's key-facts card as signed at gate 5. (cohesive-look, S8)

#### Scenario: Header counts open todos on Today
- **WHEN** Rue opens `/` during a running sprint with two open and one done todo on today and one overdue backlog todo
- **THEN** the summary header shows "3" with "open today"
- **proof:** e2e

#### Scenario: Header shows sprint progress during a sprint
- **WHEN** the active sprint has 9 todos, 3 done, and today is Thursday of the sprint
- **THEN** the header reads "Sprint 3 / 9 done · 3 days left" and its bar has one segment per aspect with sprint todos
- **proof:** e2e

#### Scenario: Header without a sprint shows only the count
- **WHEN** no sprint is active and one backlog todo is due today
- **THEN** the header shows "1" with "open today" and no sprint line or bar
- **proof:** e2e

### Requirement: Today view
Today SHALL be the default landing screen, showing active-sprint todos assigned to today plus overdue
todos (due before today, not done), with status toggles and its own inline quick add "Add a todo" in every phase (running, review
available, review required, planning, none, Sunday after the review). As picked at gate 4 (P8) the inline quick add stays next to the global "+" / "New todo": as signed at gate 5 it is one title field and "Add" inside the page at every width (no sheet), with a line under it naming the destination. While an active sprint has today
among its days, the inline quick add SHALL add to the sprint on today ("Goes to this sprint, planned today"); otherwise it SHALL create a backlog todo due
today ("Goes to the backlog, due today"). It uses the first aspect; another aspect, another planned day, no day or any other field goes through the global "New todo" quick add. Today SHALL list open backlog todos due today or planned for today under their aspect, each once even
when both apply. Today's todos are grouped by aspect; overdue todos are listed once, in a single "Overdue" group that
names each todo's aspect. The key-facts card comes first, below the review-required prompt when there is one; the sprint's per-aspect progress ("This sprint") is a right column from 1280 px and a card stacked below the lists under 1280 px (gate 4 pick a). (S21, calendar-planning S8, S8)

#### Scenario: Today shows today's sprint todos and overdue todos
- **WHEN** Rue opens `/` with one sprint todo on today, one on tomorrow, and one backlog todo due yesterday
- **THEN** Today lists the first under its aspect and the overdue one in the "Overdue" group with its aspect named, and not the one on tomorrow
- **proof:** e2e

#### Scenario: Overdue means due before today and not done
- **WHEN** overdue todos are listed for a given day
- **THEN** todos due before that day and not done are returned, regardless of sprint; done todos and todos due that day are not
- **proof:** unit

#### Scenario: Sprint todo due today without a day is on Today
- **WHEN** an active-sprint todo has no day and is due today
- **THEN** Today lists it under its aspect as on today; a todo with a day keeps that day, and the sprint query does not return a backlog todo due today
- **proof:** unit — `Regression: sprint todos dated today without a day are missing from Today`

#### Scenario: Status toggle on Today
- **WHEN** Rue ticks a todo's checkbox on Today
- **THEN** its status is Done and it stays visible, muted and not struck through
- **proof:** e2e

#### Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox
- **WHEN** Today lists an overdue backlog todo during an active sprint
- **THEN** its row has no done checkbox and offers "Add to sprint", which adds it to the sprint as To do
- **proof:** e2e

#### Scenario: Quick add is shown in every Today state
- **WHEN** Rue opens `/` with a running sprint, with a review available, with a review required, in planning, with no sprint, and on the Sunday after the review
- **THEN** each state shows the inline "Add a todo" form with its title field and "Add" button
- **proof:** e2e

#### Scenario: Quick add on Today adds to the sprint on today
- **WHEN** Rue quick-adds a todo on Today during an active sprint whose days include today
- **THEN** the todo is in the active sprint with status To do, assigned to today, and listed on Today
- **proof:** e2e

#### Scenario: Quick add on Today outside the sprint's days saves a backlog todo due today
- **WHEN** Rue quick-adds a todo on a day that is not among the active sprint's days (the Sunday before next week's sprint, or review required)
- **THEN** the todo is in no sprint (it shows in the backlog) with due date today, and is listed on Today under its aspect
- **proof:** e2e

#### Scenario: Quick add on Today without any sprint saves a backlog todo due today
- **WHEN** no sprint exists and Rue quick-adds a todo on Today
- **THEN** the todo is in the backlog with due date today and is listed on Today under its aspect, also after a reload
- **proof:** e2e

#### Scenario: Quick add on a phone stays inline in every state
- **WHEN** Rue types a title into Today's "Add a todo" field at phone width with no sprint and presses "Add"
- **THEN** no dialog opens, the field is cleared, and the todo is added as above
- **proof:** e2e

#### Scenario: Backlog todos due today are listed apart from sprint todos
- **WHEN** backlog todos are queried for a given day, with a backlog todo due that day, one due another day, a done one due that day, and a sprint todo due that day
- **THEN** only the open todo in no sprint and due that day is returned
- **proof:** unit

#### Scenario: Backlog todos planned for today are listed once
- **WHEN** backlog todos are queried for a given day, with a backlog todo planned for that day, one planned for that day and also due that day, one planned for the next day, and a done one planned for that day
- **THEN** the first two are returned, each once, and the others are not
- **proof:** unit

#### Scenario: Planned-today backlog todo shows on Today between sprints
- **WHEN** it is the Sunday after the review was closed and a backlog todo is planned for today with 18:00
- **THEN** Today lists it once under its aspect, and the summary header counts it
- **proof:** e2e

#### Scenario: Backlog todos due today are listed only when today is not a sprint day
- **WHEN** a backlog todo is due today, once while an active sprint has today among its days and once while it has not (or no sprint exists)
- **THEN** Today does not list it on the sprint day and lists it under its aspect otherwise
- **proof:** e2e

#### Scenario: Due-today backlog todos offer the sprint instead of a checkbox
- **WHEN** Today lists a backlog todo due today while a sprint is active, and again while no sprint is active
- **THEN** its row has no done checkbox; with an active sprint it offers "Add to sprint", which adds it to the sprint as To do, and without one it is a plain row
- **proof:** e2e

#### Scenario: A fallback todo is overdue the next day
- **WHEN** a backlog todo due today is still open and the next day is queried
- **THEN** the overdue query returns it and the due-today query does not
- **proof:** unit

#### Scenario: Today without an active sprint prompts to plan
- **WHEN** no sprint is active and no review is pending
- **THEN** Today shows a prompt linking to planning
- **proof:** e2e

#### Scenario: Today with a pending review prompts to review
- **WHEN** the active sprint's review is available or required
- **THEN** Today shows a prompt linking to the review
- **proof:** e2e

#### Scenario: Nothing today shows a calm empty state
- **WHEN** a sprint is active but no todo is on today and none is overdue or due today
- **THEN** Today shows a calm empty state linking to the week view
- **proof:** e2e

#### Scenario: Sunday after the review prompts to plan next week
- **WHEN** it is Sunday and that week's review has been closed
- **THEN** Today shows a prompt to plan next week
- **proof:** e2e

#### Scenario: Today's quick add states its destination
- **WHEN** Rue opens `/` on a day of the running sprint, and separately with no sprint
- **THEN** the line under the inline quick add reads "Goes to this sprint, planned today" and "Goes to the backlog, due today" respectively
- **proof:** e2e
