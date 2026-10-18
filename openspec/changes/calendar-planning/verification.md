verified-at: 0437362

## Layer 1 — `npm run proof:full` (round 5, final pass): green

```
Test Files  13 passed (13)
     Tests  200 passed (200)
  308 passed (2.4m)   (playwright, e2e)
exit 0
```

## Layer 2 — spec coverage

155 scenarios: 154 automated, all found by name in the green output; 1 manual. Gaps: none.

Counts: sprint-lifecycle 40, calendar 25, today 20, sprint-views 18, todos 18, recurring 16, navigation 11, backlog 7. No ✗ rows.

### backlog

| Scenario | proof | Evidence |
|---|---|---|
| Backlog lists only todos not in a sprint, in order | unit | `src/lib/server/todos.test.ts` › "Scenario: Backlog lists only todos not in a sprint, in order" ✓ |
| Backlog is grouped by aspect | e2e | `e2e/backlog.test.ts` › "Scenario: Backlog is grouped by aspect" ✓ |
| Filter the backlog to one aspect | e2e | `e2e/backlog.test.ts` › "Scenario: Filter the backlog to one aspect" ✓ |
| Empty backlog shows an empty state | e2e | `e2e/backlog.test.ts` › "Scenario: Empty backlog shows an empty state" ✓ |
| Overdue todos are marked in the backlog | e2e | `e2e/backlog.test.ts` › "Scenario: Overdue todos are marked in the backlog" ✓ |
| Planned todos are listed in the Planned section | e2e | `e2e/backlog.test.ts` › "Scenario: Planned todos are listed in the Planned section" ✓ |
| No Planned section without planned todos | e2e | `e2e/backlog.test.ts` › "Scenario: No Planned section without planned todos" ✓ |

### calendar

| Scenario | proof | Evidence |
|---|---|---|
| Month grid runs Monday to Sunday | unit | `src/lib/week.test.ts` › "Scenario: Month grid runs Monday to Sunday" ✓ |
| Month parameter is parsed or falls back | unit | `src/lib/week.test.ts` › "Scenario: Month parameter is parsed or falls back" ✓ |
| Calendar opens on the current month | e2e | `e2e/calendar.test.ts` › "Scenario: Calendar opens on the current month" ✓ |
| Month navigation and deep link | e2e | `e2e/calendar.test.ts` › "Scenario: Month navigation and deep link" ✓ |
| Invalid month parameter shows the current month | e2e | `e2e/calendar.test.ts` › "Scenario: Invalid month parameter shows the current month" ✓ |
| Planned todos are entries, due dates are not | unit | `src/lib/server/calendar.test.ts` › "Scenario: Planned todos are entries, due dates are not" ✓ |
| Rules are projected after the active sprint week | unit | `src/lib/server/calendar.test.ts` › "Scenario: Rules are projected after the active sprint week" ✓ |
| Sunday after the review closes does not show an instance twice | unit | `src/lib/server/calendar.test.ts` › "Scenario: Sunday after the review closes does not show an instance twice" ✓ |
| Without an active sprint projection starts today | unit | `src/lib/server/calendar.test.ts` › "Scenario: Without an active sprint projection starts today" ✓ |
| Past months show only real todos | unit | `src/lib/server/calendar.test.ts` › "Scenario: Past months show only real todos" ✓ |
| Rules of archived classes are not projected | unit | `src/lib/server/calendar.test.ts` › "Scenario: Rules of archived classes are not projected" ✓ |
| Exams appear at their time with room | unit | `src/lib/server/calendar.test.ts` › "Scenario: Exams appear at their time with room" ✓ |
| Entries within a day are ordered | unit | `src/lib/server/calendar.test.ts` › "Scenario: Entries within a day are ordered" ✓ |
| Calendar shows aspect colours and marks projections | e2e | `e2e/calendar.test.ts` › "Scenario: Calendar shows aspect colours and marks projections" ✓ |
| Recurring rule with a slot shows in later months | e2e | `e2e/calendar.test.ts` › "Scenario: Recurring rule with a slot shows in later months" ✓ |
| Phone shows dots and the selected day's list | e2e | `e2e/calendar.test.ts` › "Scenario: Phone shows dots and the selected day's list" ✓ |
| Selected day defaults to the 1st in another month | e2e | `e2e/calendar.test.ts` › "Scenario: Selected day defaults to the 1st in another month" ✓ |
| Wide cells show up to three titles | e2e | `e2e/calendar.test.ts` › "Scenario: Wide cells show up to three titles" ✓ |
| Day list in the rail overlay below 1280 | e2e | `e2e/calendar.test.ts` › "Scenario: Day list in the rail overlay below 1280" ✓ |
| Empty month shows Nothing planned | e2e | `e2e/calendar.test.ts` › "Scenario: Empty month shows Nothing planned" ✓ |
| Calendar looks right on phone and desktop | manual (visual judgement on real hardware) | `shots/calendar-oct-375.png`, `calendar-oct-1440.png`, `calendar-nov-*.png` (regenerated, not committed) |
| Todo entry opens the editor | e2e | `e2e/calendar.test.ts` › "Scenario: Todo entry opens the editor" ✓ |
| Projected occurrence links to its rule | e2e | `e2e/calendar.test.ts` › "Scenario: Projected occurrence links to its rule" ✓ |
| Exam links to its class | e2e | `e2e/calendar.test.ts` › "Scenario: Exam links to its class" ✓ |
| Todo edited from the calendar leaves its day | e2e | `e2e/plan-ahead.test.ts` › "Scenario: Todo edited from the calendar leaves its day" ✓ |

### navigation

| Scenario | proof | Evidence |
|---|---|---|
| Desktop shows a sidebar | e2e | `e2e/navigation.test.ts` › "Scenario: Desktop shows a sidebar" ✓ |
| Phone home list shows the eight lists | e2e | `e2e/navigation.test.ts` › "Scenario: Phone home list shows the eight lists" ✓ |
| Phone home list drills into each list | e2e | `e2e/responsive.test.ts` › "Scenario: Phone home list drills into each list" ✓ |
| Every screen fits 375 px without horizontal scroll | e2e | `e2e/responsive.test.ts` › "Scenario: Every screen fits 375 px without horizontal scroll" ✓ |
| Sprint at 1280 shows a context rail | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Sprint at 1280 shows a context rail" ✓ |
| Today at 1280 shows sprint progress per aspect | e2e | `e2e/today.test.ts` › "Scenario: Today at 1280 shows sprint progress per aspect" ✓ |
| Aspect page rail shows the aspect's details | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect page rail shows the aspect's details" ✓ |
| Screens without a rail centre their column | e2e | `e2e/layout.test.ts` › "Scenario: Screens without a rail centre their column" ✓ |
| Screens with a rail centre their column | e2e | `e2e/layout.test.ts` › "Scenario: Screens with a rail centre their column" ✓ |
| Rail becomes an overlay toggle below 1280 | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail becomes an overlay toggle below 1280" ✓ |
| No screen scrolls horizontally at any width | e2e | `e2e/responsive.test.ts` › "Scenario: No screen scrolls horizontally at any width" ✓ |

### recurring

| Scenario | proof | Evidence |
|---|---|---|
| Create and list a recurring rule | e2e | `e2e/recurring.test.ts` › "Scenario: Create and list a recurring rule" ✓ |
| Rule without weekdays is rejected | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule without weekdays is rejected" ✓ |
| Editing a rule affects only future sprints | unit | `src/lib/server/recurring.test.ts` › "Scenario: Editing a rule affects only future sprints" ✓ |
| Deleting a rule keeps existing instances | unit | `src/lib/server/recurring.test.ts` › "Scenario: Deleting a rule keeps existing instances" ✓ |
| Rule follows its deleted aspect | unit | `src/lib/server/aspects.test.ts` › "Scenario: Rule follows its deleted aspect" ✓ |
| Rule with a time slot | e2e | `e2e/recurring.test.ts` › "Scenario: Rule with a time slot" ✓ |
| Rule slot follows the slot rules | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule slot follows the slot rules" ✓ |
| Starting a sprint adds one instance per weekday | unit | `src/lib/server/recurring.test.ts` › "Scenario: Starting a sprint adds one instance per weekday" ✓ |
| Instances carry the rule's slot | unit | `src/lib/server/recurring.test.ts` › "Scenario: Instances carry the rule's slot" ✓ |
| Rule created mid-sprint fills the remaining days | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule created mid-sprint fills the remaining days" ✓ |
| Recurring instances appear in the week view | e2e | `e2e/sprint-views.test.ts` › "Scenario: Recurring instances appear in the week view" ✓ |
| Carried recurring instance is not duplicated | unit | `src/lib/server/recurring.test.ts` › "Scenario: Carried recurring instance is not duplicated" ✓ |
| Carried instance of a deleted rule keeps no day | unit | `src/lib/server/recurring.test.ts` › "Scenario: Carried instance of a deleted rule keeps no day" ✓ |
| More carried instances than weekdays | unit | `src/lib/server/recurring.test.ts` › "Scenario: More carried instances than weekdays" ✓ |
| Start sprint shows a carried recurring todo once | e2e | `e2e/review.test.ts` › "Scenario: Start sprint shows a carried recurring todo once" ✓ |
| Instance slot is edited like any todo | unit | `src/lib/server/sprints.test.ts` › "Scenario: Instance slot is edited like any todo" ✓ |

### sprint-lifecycle

| Scenario | proof | Evidence |
|---|---|---|
| Due-this-week todos are suggested pre-marked | e2e | `e2e/planning.test.ts` › "Scenario: Due-this-week todos are suggested pre-marked" ✓ |
| Unmarked suggestion stays in the backlog | e2e | `e2e/planning.test.ts` › "Scenario: Unmarked suggestion stays in the backlog" ✓ |
| No suggestion section when nothing is due | e2e | `e2e/planning.test.ts` › "Scenario: No suggestion section when nothing is due" ✓ |
| Due and planned todo keeps its day | unit | `src/lib/server/sprints.test.ts` › "Scenario: Due and planned todo keeps its day" ✓ |
| Todo planned for a later week is not suggested | unit | `src/lib/server/sprints.test.ts` › "Scenario: Todo planned for a later week is not suggested" ✓ |
| Plan page does not suggest a todo planned for a later week | e2e | `e2e/planning.test.ts` › "Scenario: Plan page does not suggest a todo planned for a later week" ✓ |
| Add a backlog todo to the active sprint | e2e | `e2e/backlog.test.ts` › "Scenario: Add a backlog todo to the active sprint" ✓ |
| Moving back to the backlog clears day, slot and status | unit | `src/lib/server/sprints.test.ts` › "Scenario: Moving back to the backlog clears day, slot and status" ✓ |
| Add to the sprint with a day or a status | unit | `src/lib/server/sprints.test.ts` › "Scenario: Add to the sprint with a day or a status" ✓ |
| Add to sprint without a day drops a planned date | unit | `src/lib/server/sprints.test.ts` › "Scenario: Add to sprint without a day drops a planned date" ✓ |
| Adding a todo that is no longer in the backlog is refused | unit | `src/lib/server/sprints.test.ts` › "Scenario: Adding a todo that is no longer in the backlog is refused" ✓ |
| Removing a recurring instance deletes only that instance | unit | `src/lib/server/sprints.test.ts` › "Scenario: Removing a recurring instance deletes only that instance" ✓ |
| Adding to the sprint is refused while the review is required | unit | `src/lib/server/sprints.test.ts` › "Scenario: Adding to the sprint is refused while the review is required" ✓ |
| Backlog page points to Review instead of adding | e2e | `e2e/backlog.test.ts` › "Scenario: Backlog page points to Review instead of adding" ✓ |
| Review becoming required after page load refuses the add | e2e | `e2e/backlog.test.ts` › "Scenario: Review becoming required after page load refuses the add" ✓ |
| Sprint todo planned outside the week moves to the backlog | unit | `src/lib/server/sprints.test.ts` › "Scenario: Sprint todo planned outside the week moves to the backlog" ✓ |
| Backlog todo planned inside the week joins the sprint | unit | `src/lib/server/sprints.test.ts` › "Scenario: Backlog todo planned inside the week joins the sprint" ✓ |
| Without an active sprint a planned todo stays in the backlog | unit | `src/lib/server/sprints.test.ts` › "Scenario: Without an active sprint a planned todo stays in the backlog" ✓ |
| Day in the planning draft's target week stays in the backlog | unit | `src/lib/server/sprints.test.ts` › "Scenario: Day in the planning draft's target week stays in the backlog" ✓ |
| Planning into the week is refused while the review is required | unit | `src/lib/server/sprints.test.ts` › "Scenario: Planning into the week is refused while the review is required" ✓ |
| Recurring instance cannot be planned outside its week | unit | `src/lib/server/sprints.test.ts` › "Scenario: Recurring instance cannot be planned outside its week" ✓ |
| Editor shows the recurring-outside-week message | e2e | `e2e/todo-planning.test.ts` › "Scenario: Editor shows the recurring-outside-week message" ✓ |
| Closed-sprint todo keeps its sprint | unit | `src/lib/server/sprints.test.ts` › "Scenario: Closed-sprint todo keeps its sprint" ✓ |
| Review is available from the sprint's Sunday | unit | `src/lib/server/sprints.test.ts` › "Scenario: Review is available from the sprint's Sunday" ✓ |
| Review is required from the Monday after | unit | `src/lib/server/sprints.test.ts` › "Scenario: Review is required from the Monday after" ✓ |
| Review carries over and returns open todos | e2e | `e2e/review.test.ts` › "Scenario: Review carries over and returns open todos" ✓ |
| Open recurring instance is carried or dropped | unit | `src/lib/server/sprints.test.ts` › "Scenario: Open recurring instance is carried or dropped" ✓ |
| Carried and returned todos lose their slot | unit | `src/lib/server/sprints.test.ts` › "Scenario: Carried and returned todos lose their slot" ✓ |
| Done todos stay with the closed sprint | unit | `src/lib/server/sprints.test.ts` › "Scenario: Done todos stay with the closed sprint" ✓ |
| All-done review closes in one tap | e2e | `e2e/review.test.ts` › "Scenario: All-done review closes in one tap" ✓ |
| Weeks away review only the last sprint | unit | `src/lib/server/sprints.test.ts` › "Scenario: Weeks away review only the last sprint" ✓ |
| Starting a sprint pulls the week's planned todos | unit | `src/lib/server/sprints.test.ts` › "Scenario: Starting a sprint pulls the week's planned todos" ✓ |
| Plan page lists planned todos as coming automatically | e2e | `e2e/planning.test.ts` › "Scenario: Plan page lists planned todos as coming automatically" ✓ |
| Archived class todo planned in the week is neither listed nor pulled | unit | `src/lib/server/sprints.test.ts` › "Scenario: Archived class todo planned in the week is neither listed nor pulled" ✓ |
| Pulling a planned todo by hand clears its date | unit | `src/lib/server/sprints.test.ts` › "Scenario: Pulling a planned todo by hand clears its date" ✓ |
| Planned todo travels to its day in the Week view | e2e | `e2e/plan-ahead.test.ts` › "Scenario: Planned todo travels to its day in the Week view" ✓ |
| Missed planned todo joins the next sprint unscheduled | unit | `src/lib/server/sprints.test.ts` › "Scenario: Missed planned todo joins the next sprint unscheduled" ✓ |
| Archived class todos are not pulled | unit | `src/lib/server/sprints.test.ts` › "Scenario: Archived class todos are not pulled" ✓ |
| Recurring instance planned for a past date is refused as outside its week | unit | `src/lib/server/sprints.test.ts` › "Scenario: Recurring instance planned for a past date is refused as outside its week" ✓ |
| Stale suggested id of a todo planned for a later week stays in the backlog | unit | `src/lib/server/sprints.test.ts` › "Scenario: Stale suggested id of a todo planned for a later week stays in the backlog" ✓ |

### sprint-views

| Scenario | proof | Evidence |
|---|---|---|
| Move a todo between board columns by drag | e2e | `e2e/sprint-views.test.ts` › "Scenario: Move a todo between board columns by drag" ✓ |
| Move a todo between board columns with the status menu on touch | e2e | `e2e/sprint-views.test.ts` › "Scenario: Move a todo between board columns with the status menu on touch" ✓ |
| Empty board column shows a placeholder | e2e | `e2e/sprint-views.test.ts` › "Scenario: Empty board column shows a placeholder" ✓ |
| Board card shows the aspect in its meta line | e2e | `e2e/sprint-views.test.ts` › "Scenario: Board card shows the aspect in its meta line" ✓ |
| Board card shows the planned date and slot | e2e | `e2e/todo-planning.test.ts` › "Scenario: Board card shows the planned date and slot" ✓ |
| Board card shows the whole planned label at 1440 with sidebar and rail | e2e | `e2e/todo-planning.test.ts` › "Scenario: Board card shows the whole planned label at 1440 with sidebar and rail" ✓ |
| Assign a todo to a day by drag | e2e | `e2e/sprint-views.test.ts` › "Scenario: Assign a todo to a day by drag" ✓ |
| Dated sprint todo without a day sits on its due day | unit | `src/lib/server/sprints.test.ts` › "Regression: dated sprint todos are missing from their day in the week view" ✓ |
| Assign a todo to a day with the day picker on touch | e2e | `e2e/sprint-views.test.ts` › "Scenario: Assign a todo to a day with the day picker on touch" ✓ |
| Day picker offers only days of the active sprint | e2e | `e2e/sprint-views.test.ts` › "Scenario: Day picker offers only days of the active sprint" ✓ |
| Moving a todo to another day keeps its slot | unit | `src/lib/server/sprints.test.ts` › "Scenario: Moving a todo to another day keeps its slot" ✓ |
| Today is highlighted in the week view | e2e | `e2e/sprint-views.test.ts` › "Scenario: Today is highlighted in the week view" ✓ |
| Phone shows one day at a time | e2e | `e2e/sprint-views.test.ts` › "Scenario: Phone shows one day at a time" ✓ |
| Done todos stay on their day | e2e | `e2e/sprint-views.test.ts` › "Scenario: Done todos stay on their day" ✓ |
| Week cards stay one line at 1440 | e2e | `e2e/sprint-views.test.ts` › "Scenario: Week cards stay one line at 1440" ✓ |
| Week cards show only the slot | e2e | `e2e/todo-planning.test.ts` › "Scenario: Week cards show only the slot" ✓ |
| Row shows status as a glyph with its name | e2e | `e2e/row-actions.test.ts` › "Scenario: Row shows status as a glyph with its name" ✓ |
| Sprint row shows the slot next to its day | e2e | `e2e/todo-planning.test.ts` › "Scenario: Sprint row shows the slot next to its day" ✓ |

### today

| Scenario | proof | Evidence |
|---|---|---|
| Today shows today's sprint todos and overdue todos | e2e | `e2e/today.test.ts` › "Scenario: Today shows today's sprint todos and overdue todos" ✓ |
| Overdue means due before today and not done | unit | `src/lib/server/todos.test.ts` › "Scenario: Overdue means due before today and not done" ✓ |
| Sprint todo due today without a day is on Today | unit | `src/lib/server/sprints.test.ts` › "Regression: sprint todos dated today without a day are missing from Today" ✓ |
| Status toggle on Today | e2e | `e2e/today.test.ts` › "Scenario: Status toggle on Today" ✓ |
| Overdue todos outside the sprint offer the sprint instead of a checkbox | e2e | `e2e/today.test.ts` › "Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox" ✓ |
| Quick add is shown in every Today state | e2e | `e2e/today.test.ts` › "Scenario: Quick add is shown in every Today state" ✓ |
| Quick add on Today adds to the sprint on today | e2e | `e2e/today.test.ts` › "Scenario: Quick add on Today adds to the sprint on today" ✓ |
| Quick add on Today outside the sprint's days saves a backlog todo due today | e2e | `e2e/today.test.ts` › "Scenario: Quick add on Today outside the sprint's days saves a backlog todo due today" ✓ |
| Quick add on Today without any sprint saves a backlog todo due today | e2e | `e2e/today.test.ts` › "Scenario: Quick add on Today without any sprint saves a backlog todo due today" ✓ |
| Quick add on a phone opens the sheet in every state | e2e | `e2e/today.test.ts` › "Scenario: Quick add on a phone opens the sheet in every state" ✓ |
| Backlog todos due today are listed apart from sprint todos | unit | `src/lib/server/todos.test.ts` › "Scenario: Backlog todos due today are listed apart from sprint todos" ✓ |
| Backlog todos planned for today are listed once | unit | `src/lib/server/todos.test.ts` › "Scenario: Backlog todos planned for today are listed once" ✓ |
| Planned-today backlog todo shows on Today between sprints | e2e | `e2e/today.test.ts` › "Scenario: Planned-today backlog todo shows on Today between sprints" ✓ |
| Backlog todos due today are listed only when today is not a sprint day | e2e | `e2e/today.test.ts` › "Scenario: Backlog todos due today are listed only when today is not a sprint day" ✓ |
| Due-today backlog todos offer the sprint instead of a checkbox | e2e | `e2e/today.test.ts` › "Scenario: Due-today backlog todos offer the sprint instead of a checkbox" ✓ |
| A fallback todo is overdue the next day | unit | `src/lib/server/todos.test.ts` › "Scenario: A fallback todo is overdue the next day" ✓ |
| Today without an active sprint prompts to plan | e2e | `e2e/today.test.ts` › "Scenario: Today without an active sprint prompts to plan" ✓ |
| Today with a pending review prompts to review | e2e | `e2e/today.test.ts` › "Scenario: Today with a pending review prompts to review" ✓ |
| Nothing today shows a calm empty state | e2e | `e2e/today.test.ts` › "Scenario: Nothing today shows a calm empty state" ✓ |
| Sunday after the review prompts to plan next week | e2e | `e2e/today.test.ts` › "Scenario: Sunday after the review prompts to plan next week" ✓ |

### todos

| Scenario | proof | Evidence |
|---|---|---|
| Migration 5 adds time slots without touching existing data | unit | `src/lib/server/db.test.ts` › "Scenario: Migration 5 adds time slots without touching existing data" ✓ |
| Both todo read models carry the slot | unit | `src/lib/server/todos.test.ts` › "Scenario: Both todo read models carry the slot" ✓ |
| Plan a backlog todo three weeks out with a slot | e2e | `e2e/todo-planning.test.ts` › "Scenario: Plan a backlog todo three weeks out with a slot" ✓ |
| Planned date and slot are stored | unit | `src/lib/server/sprints.test.ts` › "Scenario: Planned date and slot are stored" ✓ |
| Clearing the date clears the times | unit | `src/lib/server/sprints.test.ts` › "Scenario: Clearing the date clears the times" ✓ |
| Editor clears the times with the date | e2e | `e2e/todo-planning.test.ts` › "Scenario: Editor clears the times with the date" ✓ |
| Past date outside the active sprint week is refused | unit | `src/lib/server/sprints.test.ts` › "Scenario: Past date outside the active sprint week is refused" ✓ |
| Editor shows the past-date message | e2e | `e2e/todo-planning.test.ts` › "Scenario: Editor shows the past-date message" ✓ |
| Archived class todo cannot be planned | e2e | `e2e/plan-actions.test.ts` › "Scenario: Archived class todo cannot be planned" ✓ |
| Creating on a day follows the placement rule | unit | `src/lib/server/todos.test.ts` › "Scenario: Creating on a day follows the placement rule" ✓ |
| Done todo is planned like any todo | unit | `src/lib/server/sprints.test.ts` › "Scenario: Done todo is planned like any todo" ✓ |
| Slot validation | unit | `src/lib/slot.test.ts` › "Scenario: Slot validation" ✓ |
| Slot labels | unit | `src/lib/slot.test.ts` › "Scenario: Slot labels" ✓ |
| Invalid slot is refused on save | unit | `src/lib/server/sprints.test.ts` › "Scenario: Invalid slot is refused on save" ✓ |
| Clearing the start clears the end in the editor | e2e | `e2e/todo-planning.test.ts` › "Scenario: Clearing the start clears the end in the editor" ✓ |
| Planned label formats date and slot | unit | `src/lib/slot.test.ts` › "Scenario: Planned label formats date and slot" ✓ |
| Backlog and aspect rows show the planned date and slot | e2e | `e2e/todo-planning.test.ts` › "Scenario: Backlog and aspect rows show the planned date and slot" ✓ |
| Unplanned row shows only its due label | e2e | `e2e/todo-planning.test.ts` › "Scenario: Unplanned row shows only its due label" ✓ |

## Manual checklist

- Run `npm run dev`, open /calendar on a phone: dots under days, tapping a day shows its list below, nothing clipped (Calendar looks right on phone and desktop).
- Same at 1440: month grid with up to three titles per cell, "+N more", day list in the rail on the right.
- Plan a todo in the editor (Planned/From/To) and see it on /calendar and under Planned in the backlog.

## Diffstat

67 files changed, 4642 insertions(+), 149 deletions(-)

## Screenshots

Regenerated this round, not committed: `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/` (calendar-oct-375, calendar-oct-1440, calendar-nov-375, calendar-nov-1440, backlog-planned-375, editor-375, editor-1440, plan-375, plan-1440, board-1440).

## Review

Three rounds of fresh-context review (opus), each followed by a fixer except the last.

### Round 1 (at aa64055) → fixed in 842921d, 335e5a2, 4f08aab, a7df9f5
- [correctness] Editor save turned a due date into a planned day (derived `day` from onDueDay/listToday posted back) → read models keep the stored `day`, derived day moved to `dueDay` + `shownDay()`; regression unit + e2e, red first.
- [correctness] Recurring instance planned into a later week lost its date at sprint start (placeCarried), and doubled in the calendar → orchestrator decision D1: refused with `recurring-outside-week` (rule "recurring instances have no backlog" kept); spec + unit + e2e.
- [spec] Board card showed a dated planned-label for undayed todos → same source fix.
- [spec] createTodo day target vs sprint target under review-required → decision D2: scenario documents that a day target follows the placement rule; sprint target unchanged.
- [weak] 4 tests tightened (instance slot vs rule, read models incl. listToday/listRules, migration 5 compares aspects/sprints, archived plan refusal checks the slot); each checked against a mutation.

### Round 2 (at 519aeb6) → fixed in e8bcf04, 69e43de, a4c5b87
- [visual, verifier] Board card clipped the slot at 1440 → meta line wraps; e2e measures it.
- [weak + correctness] Calendar selection reset to today after every save → reset keyed on month; test asserts the day list heading.
- [spec] Archived-class todos listed under "Joins automatically" but never pulled → excluded from listPlannedForWeek; spec states the skip.

### Round 3 (at a4c5b87) — open, round limit reached, taken to Gate 2
- [weak] e2e/todo-planning.test.ts:281 "Sprint row shows the slot next to its day": the THEN puts a day control on Today rows, which never render one; the test checks the control only on By aspect (spec wording issue, see also learning candidate).
- [spec] Recurring instance set to a past date outside its week returns `day-in-past` instead of `recurring-outside-week` (nothing written; only the error code/message differs).
- [spec] startSprint clears a later-week planned date when a stale plan page sends that todo's id in suggestedIds (two-tab race; server trusts client ids).
- [correctness, interpretation] On the Sunday after the review closes, a Sunday rule's done instance and its projection both show on that day (projection starts at today when no sprint is active).
