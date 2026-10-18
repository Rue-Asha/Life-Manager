## MODIFIED Requirements

### Requirement: Due-this-week suggestions
Planning SHALL suggest backlog todos whose due date falls in the target week, pre-marked and unmarkable. A todo that
is also planned in the target week is not a suggestion; it is listed as coming automatically and keeps its day (see
"Planned todos join their week's sprint"). A todo planned for a later week is not a suggestion either; it stays in the
backlog with its date and slot. Pulling a suggestion at sprint start clears a planned date that lies before the new week
(with its slot). (S11, S6, Gate 1 addition C)

#### Scenario: Due-this-week todos are suggested pre-marked
- **WHEN** Rue opens planning and a backlog todo is due on Thursday of the target week
- **THEN** it is listed under suggestions, already marked, and starting the sprint includes it
- **proof:** e2e

#### Scenario: Unmarked suggestion stays in the backlog
- **WHEN** Rue unmarks a suggested todo and starts the sprint
- **THEN** that todo is still in the backlog
- **proof:** e2e

#### Scenario: No suggestion section when nothing is due
- **WHEN** no backlog todo is due in the target week
- **THEN** planning shows no suggestion section
- **proof:** e2e

#### Scenario: Due and planned todo keeps its day
- **WHEN** a backlog todo is due on Thursday and planned for Tuesday 18:00 of the target week, and the sprint starts with its id among the suggested ids
- **THEN** `suggestedTodos` did not return it, and after the start it is in the sprint on Tuesday with 18:00
- **proof:** unit

#### Scenario: Todo planned for a later week is not suggested
- **WHEN** a backlog todo due on Thursday of the target week is planned for a day two weeks later with 10:00, and the sprint starts with the ids `suggestedTodos` returned
- **THEN** `suggestedTodos` did not return it, and after the start it is still in the backlog with its day and 10:00
- **proof:** unit

#### Scenario: Plan page does not suggest a todo planned for a later week
- **WHEN** on Sunday a backlog todo due on Thursday of next week is planned for a day three weeks later, and Rue opens `/sprint/plan`
- **THEN** the suggestion section does not list it, and it is in the plan page's backlog list
- **proof:** e2e

### Requirement: Mid-sprint changes
During an active sprint a backlog todo SHALL be addable to the sprint, optionally with a day of the sprint or a status,
and a sprint todo SHALL be movable back to the backlog, which clears its day, its slot and its status (To do); removing
a recurring instance from the sprint deletes it, since recurring instances have no backlog. Adding to the sprint
without a day leaves the todo without day and slot; with a day it keeps its slot. The planned date moves todos too:
setting a date outside the active sprint week on a sprint todo SHALL move it to the backlog with status To do, keeping
date and slot; setting a date inside the active sprint week on a backlog todo SHALL move it into the active sprint on
that day with status To do; with no active sprint a backlog todo keeps its date in the backlog; a backlog todo planned
in the planning draft's target week stays in the backlog until the sprint starts; a todo in the planning draft that
gets a date returns to the backlog with it; a todo of a closed sprint keeps its sprint and only takes days of that
sprint's week (`day-outside-sprint` otherwise). Since recurring instances have no backlog, a recurring instance never
leaves its sprint by its planned date: a date outside its sprint's week (for an instance in the planning draft, any date)
MUST be refused with `recurring-outside-week` on `day` and nothing is written, the editor showing an alert like for the
other planning errors; moving it to another day of its week, clearing its day and editing its slot keep working. While the active sprint's review is required (from the Monday after
the sprint until the review closes) adding to the sprint, by "Add to sprint" or by a planned date in the sprint week,
MUST be refused with `review-required` and nothing is written — on the Backlog page, the rail, the aspect page and the
editor alike, where the UI points to Review instead. (S12, S2, S3, S7, calendar-planning S2, S9)

#### Scenario: Add a backlog todo to the active sprint
- **WHEN** Rue chooses "Add to sprint" on a backlog row during an active sprint
- **THEN** the todo leaves the backlog and appears in the sprint with status To do
- **proof:** e2e

#### Scenario: Moving back to the backlog clears day, slot and status
- **WHEN** a sprint todo with status Doing on Wednesday 18:00–19:30 is moved back to the backlog
- **THEN** it is in the backlog with no day, no slot and status To do
- **proof:** unit

#### Scenario: Add to the sprint with a day or a status
- **WHEN** a backlog todo is added to the active sprint with day = the sprint's Thursday, another with status Done, and a third with a day outside the sprint
- **THEN** the first is in the sprint on Thursday with status To do, the second has status Done with a completion time, and the third is refused with `day-outside-sprint` and stays in the backlog
- **proof:** unit

#### Scenario: Add to sprint without a day drops a planned date
- **WHEN** a backlog todo planned for a day three weeks ahead with 18:00 is added to the active sprint without a day, and another planned todo with 09:00 is added with day = the sprint's Thursday
- **THEN** the first is in the sprint with no day and no slot, and the second is on Thursday with 09:00
- **proof:** unit

#### Scenario: Adding a todo that is no longer in the backlog is refused
- **WHEN** a todo already in the active sprint is added to the sprint again
- **THEN** it fails with `not-found` and the todo is unchanged
- **proof:** unit

#### Scenario: Removing a recurring instance deletes only that instance
- **WHEN** `removeFromSprint` is called for a recurring instance and for a normal Doing todo with 18:00 of the active sprint
- **THEN** the recurring instance is deleted while its rule and other instances remain, and the normal todo is in the backlog with no day, no slot and status To do
- **proof:** unit

#### Scenario: Adding to the sprint is refused while the review is required
- **WHEN** today is the Monday after the active sprint and a backlog todo is added to the sprint
- **THEN** it fails with `review-required` and the todo is still in the backlog, unchanged
- **AND** on the sprint's Sunday the same add succeeds
- **proof:** unit

#### Scenario: Backlog page points to Review instead of adding
- **WHEN** the active sprint's review is required and Rue opens the Backlog page
- **THEN** no row offers "Add to sprint" and a note links to the review
- **proof:** e2e

#### Scenario: Review becoming required after page load refuses the add
- **WHEN** Rue opens the Backlog page on the sprint's Sunday, the clock moves to the Monday after, and Rue clicks "Add to sprint" on a row
- **THEN** a message pointing to the review is shown and the todo is still in the backlog
- **proof:** e2e

#### Scenario: Sprint todo planned outside the week moves to the backlog
- **WHEN** today is Wednesday 2026-10-14 in a sprint of 2026-10-12 to 2026-10-18 and a Doing sprint todo on Thursday is planned for 2026-10-27 with 18:00–19:30
- **THEN** it is in the backlog with status To do, day 2026-10-27 and slot 18:00–19:30
- **proof:** unit

#### Scenario: Backlog todo planned inside the week joins the sprint
- **WHEN** today is Wednesday 2026-10-14 in a sprint of 2026-10-12 to 2026-10-18 and a backlog todo is planned for Friday 2026-10-16 with 07:30
- **THEN** it is in the active sprint on 2026-10-16 with 07:30 and status To do
- **proof:** unit

#### Scenario: Without an active sprint a planned todo stays in the backlog
- **WHEN** no sprint is active and a backlog todo is planned for a day next week
- **THEN** it is in the backlog with that day
- **proof:** unit

#### Scenario: Day in the planning draft's target week stays in the backlog
- **WHEN** it is Sunday 2026-10-18, the review is closed and a planning draft exists, and a backlog todo is planned for Wednesday 2026-10-21, and a todo in the draft is planned for Thursday 2026-10-22
- **THEN** both are in the backlog with their days and the draft no longer holds the second
- **proof:** unit

#### Scenario: Planning into the week is refused while the review is required
- **WHEN** today is the Monday after the active sprint and a backlog todo is planned for a day of the active sprint's week
- **THEN** it fails with `review-required` and the todo is unchanged; planning it for today instead is accepted and keeps it in the backlog
- **proof:** unit

#### Scenario: Recurring instance cannot be planned outside its week
- **WHEN** today is Wednesday 2026-10-14 in a sprint of 2026-10-12 to 2026-10-18 holding the Thursday instance of a rule for Monday and Thursday with 18:00, and the instance is planned for Wednesday 2026-10-21 with 07:00, then for Thursday 2026-10-22, then for Saturday 2026-10-17 with 07:00; and an open instance carried into a planning draft is planned for a day of the draft's target week
- **THEN** 2026-10-21, 2026-10-22 and the draft's instance fail with `recurring-outside-week` on `day` and stay where they were with their day and slot, and the instance is then in the sprint on 2026-10-17 with 07:00
- **proof:** unit

#### Scenario: Editor shows the recurring-outside-week message
- **WHEN** Rue opens a recurring instance on Thursday of the active sprint in the editor, sets "Planned" to a day of next week and saves
- **THEN** the editor stays open with an alert message, and after reload the instance is still on Thursday in the sprint
- **proof:** e2e

#### Scenario: Closed-sprint todo keeps its sprint
- **WHEN** a done todo of a closed sprint is planned for another day of that sprint's week and then for a day next month
- **THEN** the first succeeds and it keeps its sprint, the second fails with `day-outside-sprint` and nothing changes
- **proof:** unit

### Requirement: Sprint review
From the sprint's Sunday a review SHALL be available; from the Monday after the sprint it is required.
The review lists done and open todos; for each open todo Rue picks carry over (default) or back to
backlog — recurring instances: carry over or drop. Closing the review ends the sprint and opens
planning. Carried todos keep their status and lose their day and slot; todos sent back lose them too. (S17, calendar-planning S9)

#### Scenario: Review is available from the sprint's Sunday
- **WHEN** today is the Sunday of the active sprint
- **THEN** the sprint phase is `review-available`, and before Sunday it is `running`
- **proof:** unit

#### Scenario: Review is required from the Monday after
- **WHEN** today is the Monday after the active sprint or later
- **THEN** the sprint phase is `review-required`
- **proof:** unit

#### Scenario: Review carries over and returns open todos
- **WHEN** Rue reviews a sprint with one done and two open todos, leaves one on the default "carry over", sets the other to "back to backlog", and closes
- **THEN** planning opens with the carried todo already in the sprint (same status, no day), the other is in the backlog with status To do, and the closed sprint's done todo is in neither
- **proof:** e2e

#### Scenario: Open recurring instance is carried or dropped
- **WHEN** a review closes with one open recurring instance set to drop and another set to carry
- **THEN** the dropped instance is deleted and the carried one is in the new planning sprint with no day
- **AND** a `backlog` decision for a recurring instance, or a `drop` decision for a normal todo, is refused
- **proof:** unit

#### Scenario: Carried and returned todos lose their slot
- **WHEN** a review closes with an open todo on Tuesday 18:00–19:30 carried over and another on Wednesday 09:00 sent back to the backlog
- **THEN** the carried one is in the planning draft and the other in the backlog, both with no day and no slot
- **proof:** unit

#### Scenario: Done todos stay with the closed sprint
- **WHEN** a review closes
- **THEN** the done todos keep the closed sprint's id and do not appear in the backlog or the new planning sprint
- **proof:** unit

#### Scenario: All-done review closes in one tap
- **WHEN** every todo of the sprint is done and Rue opens the review
- **THEN** a single close action ends the sprint and opens planning
- **proof:** e2e

#### Scenario: Weeks away review only the last sprint
- **WHEN** the last sprint was three weeks ago and its review is closed today
- **THEN** only that sprint is closed, no sprints exist for the skipped weeks, and the target week is today's week
- **proof:** unit

## ADDED Requirements

### Requirement: Planned todos join their week's sprint
Starting a sprint SHALL pull every not-done backlog todo whose planned date falls in the new sprint's week into the
sprint, keeping day and slot. The plan page SHALL list these todos in a section "Joins automatically" (test id
`plan-auto`) with their planned label and without a pull or unpull control, and they are in neither the plan page's
backlog list nor its suggestions; to exclude one, Rue changes its date. Done todos are not pulled. Pulling a backlog
todo by hand into the draft clears its day and slot as before. (calendar-planning S6)

#### Scenario: Starting a sprint pulls the week's planned todos
- **WHEN** on Sunday 2026-10-18 the backlog holds "Dentist" planned Tuesday 2026-10-20 18:00–19:30, "Tax return" planned 2026-11-03, and a done todo planned 2026-10-21, and the sprint for 2026-10-19 is started
- **THEN** "Dentist" is in the sprint on 2026-10-20 with 18:00–19:30, and "Tax return" and the done todo are still where they were with their days
- **proof:** unit

#### Scenario: Plan page lists planned todos as coming automatically
- **WHEN** on Sunday a backlog todo planned for Tuesday of next week with 18:00–19:30 exists and Rue opens `/sprint/plan`
- **THEN** it is listed under "Joins automatically", its row has no pull or unpull control and is not draggable, and it is not in the plan page's backlog list
- **proof:** e2e

#### Scenario: Pulling a planned todo by hand clears its date
- **WHEN** during planning a backlog todo planned for a day three weeks ahead with 10:00 is pulled into the draft
- **THEN** it is in the draft with no day and no slot
- **proof:** unit

#### Scenario: Planned todo travels to its day in the Week view
- **WHEN** on Wednesday 2026-10-14 Rue plans a backlog todo for Tuesday 2026-11-03 with 18:00–19:30 in the editor, checks the Backlog, and on Sunday 2026-11-01 plans and starts the sprint for 2026-11-02
- **THEN** the Backlog lists it under "Planned" with "Tue 3 Nov · 18:00–19:30", the plan page lists it under "Joins automatically" with the same label, and the Week view shows it in the 2026-11-03 column with "18:00–19:30"
- **proof:** e2e

### Requirement: Missed planned days join the next sprint
Starting a sprint SHALL also pull every not-done backlog todo whose planned date lies before the new sprint's week into
the sprint as Unscheduled, clearing day and slot, so nothing planned gets lost. Todos of archived semesters are skipped
(read-only). (calendar-planning S7)

#### Scenario: Missed planned todo joins the next sprint unscheduled
- **WHEN** no sprint ran in the week of 2026-10-12, a backlog todo was planned for 2026-10-14 with 18:00, and the sprint for 2026-10-19 is started
- **THEN** the todo is in the new sprint with no day and no slot
- **proof:** unit

#### Scenario: Archived class todos are not pulled
- **WHEN** an open backlog todo of an archived semester's class carries a planned date before the new week and the sprint starts
- **THEN** it is still in the backlog with its planned date
- **proof:** unit
