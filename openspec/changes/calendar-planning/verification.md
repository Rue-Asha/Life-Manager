verified-at: 519aeb6
## Layer 1: proof-full (round 2)

`npm run proof:full` green (exit 0): svelte-check, build, vitest 13 files / 196 tests, Playwright 307 passed (2.4m).

```
  ✓  305 e2e/uni.test.ts:572:1 › Scenario: No grades shows a dash (133ms)
  ✓  306 e2e/uni.test.ts:585:1 › Scenario: Deadline overview sits in the rail at 1280 (183ms)
  ✓  307 e2e/uni.test.ts:623:1 › Scenario: Nothing due shows an empty line (137ms)

  307 passed (2.4m)
```
## Layer 2: spec coverage

150 scenarios across 8 delta specs: 149 covered by a passed test, 1 manual, 0 gaps.

| Capability | Scenarios | Gaps |
|---|---|---|
| backlog | 7 | 0 |
| calendar | 24 | 0 |
| navigation | 11 | 0 |
| recurring | 16 | 0 |
| sprint-lifecycle | 37 | 0 |
| sprint-views | 17 | 0 |
| today | 20 | 0 |
| todos | 18 | 0 |

| Capability | Scenario | proof | Evidence |
|---|---|---|---|
| backlog | Backlog lists only todos not in a sprint, in order | unit | ` ✓ src/lib/server/todos.test.ts > lists > Scenario: Backlog lists only todos not in a sprint, in order 2ms` ✓ |
| backlog | Backlog is grouped by aspect | e2e | `e2e/backlog.test.ts:21:1 › Scenario: Backlog is grouped by aspect` ✓ |
| backlog | Filter the backlog to one aspect | e2e | `e2e/backlog.test.ts:50:1 › Scenario: Filter the backlog to one aspect` ✓ |
| backlog | Empty backlog shows an empty state | e2e | `e2e/backlog.test.ts:72:1 › Scenario: Empty backlog shows an empty state` ✓ |
| backlog | Overdue todos are marked in the backlog | e2e | `e2e/backlog.test.ts:83:1 › Scenario: Overdue todos are marked in the backlog` ✓ |
| backlog | Planned todos are listed in the Planned section | e2e | `e2e/backlog.test.ts:166:1 › Scenario: Planned todos are listed in the Planned section` ✓ |
| backlog | No Planned section without planned todos | e2e | `e2e/backlog.test.ts:190:1 › Scenario: No Planned section without planned todos` ✓ |
| calendar | Month grid runs Monday to Sunday | unit | ` ✓ src/lib/week.test.ts > week > Scenario: Month grid runs Monday to Sunday 2ms` ✓ |
| calendar | Month parameter is parsed or falls back | unit | ` ✓ src/lib/week.test.ts > week > Scenario: Month parameter is parsed or falls back 0ms` ✓ |
| calendar | Calendar opens on the current month | e2e | `e2e/calendar.test.ts:28:1 › Scenario: Calendar opens on the current month` ✓ |
| calendar | Month navigation and deep link | e2e | `e2e/calendar.test.ts:44:1 › Scenario: Month navigation and deep link` ✓ |
| calendar | Invalid month parameter shows the current month | e2e | `e2e/calendar.test.ts:69:1 › Scenario: Invalid month parameter shows the current month` ✓ |
| calendar | Planned todos are entries, due dates are not | unit | ` ✓ src/lib/server/calendar.test.ts > calendarMonth > Scenario: Planned todos are entries, due dates are not 7ms` ✓ |
| calendar | Rules are projected after the active sprint week | unit | ` ✓ src/lib/server/calendar.test.ts > calendarMonth > Scenario: Rules are projected after the active sprint week 5ms` ✓ |
| calendar | Without an active sprint projection starts today | unit | ` ✓ src/lib/server/calendar.test.ts > calendarMonth > Scenario: Without an active sprint projection starts today 3ms` ✓ |
| calendar | Past months show only real todos | unit | ` ✓ src/lib/server/calendar.test.ts > calendarMonth > Scenario: Past months show only real todos 3ms` ✓ |
| calendar | Rules of archived classes are not projected | unit | ` ✓ src/lib/server/calendar.test.ts > calendarMonth > Scenario: Rules of archived classes are not projected 3ms` ✓ |
| calendar | Exams appear at their time with room | unit | ` ✓ src/lib/server/calendar.test.ts > calendarMonth > Scenario: Exams appear at their time with room 2ms` ✓ |
| calendar | Entries within a day are ordered | unit | ` ✓ src/lib/server/calendar.test.ts > calendarMonth > Scenario: Entries within a day are ordered 4ms` ✓ |
| calendar | Calendar shows aspect colours and marks projections | e2e | `e2e/calendar.test.ts:79:1 › Scenario: Calendar shows aspect colours and marks projections` ✓ |
| calendar | Recurring rule with a slot shows in later months | e2e | `e2e/calendar.test.ts:115:1 › Scenario: Recurring rule with a slot shows in later months` ✓ |
| calendar | Phone shows dots and the selected day's list | e2e | `e2e/calendar.test.ts:189:1 › Scenario: Phone shows dots and the selected day's list` ✓ |
| calendar | Selected day defaults to the 1st in another month | e2e | `e2e/calendar.test.ts:227:1 › Scenario: Selected day defaults to the 1st in another month` ✓ |
| calendar | Wide cells show up to three titles | e2e | `e2e/calendar.test.ts:140:1 › Scenario: Wide cells show up to three titles` ✓ |
| calendar | Day list in the rail overlay below 1280 | e2e | `e2e/calendar.test.ts:165:1 › Scenario: Day list in the rail overlay below 1280` ✓ |
| calendar | Empty month shows Nothing planned | e2e | `e2e/calendar.test.ts:179:1 › Scenario: Empty month shows Nothing planned` ✓ |
| calendar | Calendar looks right on phone and desktop | manual (visual judgement on real hardware) | screenshots below, human judgement |
| calendar | Todo entry opens the editor | e2e | `e2e/calendar.test.ts:236:1 › Scenario: Todo entry opens the editor` ✓ |
| calendar | Projected occurrence links to its rule | e2e | `e2e/calendar.test.ts:246:1 › Scenario: Projected occurrence links to its rule` ✓ |
| calendar | Exam links to its class | e2e | `e2e/calendar.test.ts:257:1 › Scenario: Exam links to its class` ✓ |
| calendar | Todo edited from the calendar leaves its day | e2e | `e2e/plan-ahead.test.ts:72:1 › Scenario: Todo edited from the calendar leaves its day` ✓ |
| navigation | Desktop shows a sidebar | e2e | `e2e/navigation.test.ts:10:1 › Scenario: Desktop shows a sidebar` ✓ |
| navigation | Phone home list shows the eight lists | e2e | `e2e/navigation.test.ts:66:1 › Scenario: Phone home list shows the eight lists` ✓ |
| navigation | Phone home list drills into each list | e2e | `e2e/responsive.test.ts:203:1 › Scenario: Phone home list drills into each list` ✓ |
| navigation | Every screen fits 375 px without horizontal scroll | e2e | `e2e/responsive.test.ts:136:1 › Scenario: Every screen fits 375 px without horizontal scroll` ✓ |
| navigation | Sprint at 1280 shows a context rail | e2e | `e2e/sprint-rail.test.ts:116:1 › Scenario: Sprint at 1280 shows a context rail` ✓ |
| navigation | Today at 1280 shows sprint progress per aspect | e2e | `e2e/today.test.ts:55:1 › Scenario: Today at 1280 shows sprint progress per aspect` ✓ |
| navigation | Aspect page rail shows the aspect's details | e2e | `e2e/aspect-page.test.ts:94:1 › Scenario: Aspect page rail shows the aspect's details` ✓ |
| navigation | Screens without a rail centre their column | e2e | `e2e/layout.test.ts:40:1 › Scenario: Screens without a rail centre their column` ✓ |
| navigation | Screens with a rail centre their column | e2e | `e2e/layout.test.ts:70:1 › Scenario: Screens with a rail centre their column` ✓ |
| navigation | Rail becomes an overlay toggle below 1280 | e2e | `e2e/sprint-rail.test.ts:164:1 › Scenario: Rail becomes an overlay toggle below 1280` ✓ |
| navigation | No screen scrolls horizontally at any width | e2e | `e2e/responsive.test.ts:167:2 › on desktop › Scenario: No screen scrolls horizontally at any width` ✓ |
| recurring | Create and list a recurring rule | e2e | `e2e/recurring.test.ts:7:1 › Scenario: Create and list a recurring rule` ✓ |
| recurring | Rule without weekdays is rejected | unit | ` ✓ src/lib/server/recurring.test.ts > recurring rules > Scenario: Rule without weekdays is rejected 6ms` ✓ |
| recurring | Editing a rule affects only future sprints | unit | ` ✓ src/lib/server/recurring.test.ts > recurring rules > Scenario: Editing a rule affects only future sprints 5ms` ✓ |
| recurring | Deleting a rule keeps existing instances | unit | ` ✓ src/lib/server/recurring.test.ts > recurring rules > Scenario: Deleting a rule keeps existing instances 4ms` ✓ |
| recurring | Rule follows its deleted aspect | unit | ` ✓ src/lib/server/aspects.test.ts > aspects > delete > Scenario: Rule follows its deleted aspect 3ms` ✓ |
| recurring | Rule with a time slot | e2e | `e2e/recurring.test.ts:89:1 › Scenario: Rule with a time slot` ✓ |
| recurring | Rule slot follows the slot rules | unit | ` ✓ src/lib/server/recurring.test.ts > recurring rules > Scenario: Rule slot follows the slot rules 4ms` ✓ |
| recurring | Starting a sprint adds one instance per weekday | unit | ` ✓ src/lib/server/recurring.test.ts > recurring rules > Scenario: Starting a sprint adds one instance per weekday 6ms` ✓ |
| recurring | Instances carry the rule's slot | unit | ` ✓ src/lib/server/recurring.test.ts > recurring rules > Scenario: Instances carry the rule's slot 4ms` ✓ |
| recurring | Rule created mid-sprint fills the remaining days | unit | ` ✓ src/lib/server/recurring.test.ts > recurring rules > Scenario: Rule created mid-sprint fills the remaining days 3ms` ✓ |
| recurring | Recurring instances appear in the week view | e2e | `e2e/sprint-views.test.ts:699:1 › Scenario: Recurring instances appear in the week view` ✓ |
| recurring | Carried recurring instance is not duplicated | unit | ` ✓ src/lib/server/recurring.test.ts > carried recurring instances > Scenario: Carried recurring instance is not duplicated 5ms` ✓ |
| recurring | Carried instance of a deleted rule keeps no day | unit | ` ✓ src/lib/server/recurring.test.ts > carried recurring instances > Scenario: Carried instance of a deleted rule keeps no day 4ms` ✓ |
| recurring | More carried instances than weekdays | unit | ` ✓ src/lib/server/recurring.test.ts > carried recurring instances > Scenario: More carried instances than weekdays 3ms` ✓ |
| recurring | Start sprint shows a carried recurring todo once | e2e | `e2e/review.test.ts:110:1 › Scenario: Start sprint shows a carried recurring todo once` ✓ |
| recurring | Instance slot is edited like any todo | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Instance slot is edited like any todo 2ms` ✓ |
| sprint-lifecycle | Due-this-week todos are suggested pre-marked | e2e | `e2e/planning.test.ts:101:2 › suggestions › Scenario: Due-this-week todos are suggested pre-marked` ✓ |
| sprint-lifecycle | Unmarked suggestion stays in the backlog | e2e | `e2e/planning.test.ts:120:2 › suggestions › Scenario: Unmarked suggestion stays in the backlog` ✓ |
| sprint-lifecycle | No suggestion section when nothing is due | e2e | `e2e/planning.test.ts:148:2 › suggestions › Scenario: No suggestion section when nothing is due` ✓ |
| sprint-lifecycle | Due and planned todo keeps its day | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Due and planned todo keeps its day 6ms` ✓ |
| sprint-lifecycle | Todo planned for a later week is not suggested | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Todo planned for a later week is not suggested 3ms` ✓ |
| sprint-lifecycle | Plan page does not suggest a todo planned for a later week | e2e | `e2e/planning.test.ts:135:2 › suggestions › Scenario: Plan page does not suggest a todo planned for a later week` ✓ |
| sprint-lifecycle | Add a backlog todo to the active sprint | e2e | `e2e/backlog.test.ts:102:1 › Scenario: Add a backlog todo to the active sprint` ✓ |
| sprint-lifecycle | Moving back to the backlog clears day, slot and status | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Scenario: Moving back to the backlog clears day, slot and status 2ms` ✓ |
| sprint-lifecycle | Add to the sprint with a day or a status | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Scenario: Add to the sprint with a day or a status 2ms` ✓ |
| sprint-lifecycle | Add to sprint without a day drops a planned date | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Scenario: Add to sprint without a day drops a planned date 2ms` ✓ |
| sprint-lifecycle | Adding a todo that is no longer in the backlog is refused | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Scenario: Adding a todo that is no longer in the backlog is refused 2ms` ✓ |
| sprint-lifecycle | Removing a recurring instance deletes only that instance | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Scenario: Removing a recurring instance deletes only that instance 2ms` ✓ |
| sprint-lifecycle | Adding to the sprint is refused while the review is required | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Scenario: Adding to the sprint is refused while the review is required 2ms` ✓ |
| sprint-lifecycle | Backlog page points to Review instead of adding | e2e | `e2e/backlog.test.ts:132:1 › Scenario: Backlog page points to Review instead of adding` ✓ |
| sprint-lifecycle | Review becoming required after page load refuses the add | e2e | `e2e/backlog.test.ts:147:1 › Scenario: Review becoming required after page load refuses the add` ✓ |
| sprint-lifecycle | Sprint todo planned outside the week moves to the backlog | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Sprint todo planned outside the week moves to the backlog 2ms` ✓ |
| sprint-lifecycle | Backlog todo planned inside the week joins the sprint | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Backlog todo planned inside the week joins the sprint 2ms` ✓ |
| sprint-lifecycle | Without an active sprint a planned todo stays in the backlog | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Without an active sprint a planned todo stays in the backlog 2ms` ✓ |
| sprint-lifecycle | Day in the planning draft's target week stays in the backlog | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Day in the planning draft's target week stays in the backlog 2ms` ✓ |
| sprint-lifecycle | Planning into the week is refused while the review is required | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Planning into the week is refused while the review is required 2ms` ✓ |
| sprint-lifecycle | Recurring instance cannot be planned outside its week | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Recurring instance cannot be planned outside its week 2ms` ✓ |
| sprint-lifecycle | Editor shows the recurring-outside-week message | e2e | `e2e/todo-planning.test.ts:83:1 › Scenario: Editor shows the recurring-outside-week message` ✓ |
| sprint-lifecycle | Closed-sprint todo keeps its sprint | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Closed-sprint todo keeps its sprint 2ms` ✓ |
| sprint-lifecycle | Review is available from the sprint's Sunday | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Review is available from the sprint's Sunday 4ms` ✓ |
| sprint-lifecycle | Review is required from the Monday after | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Review is required from the Monday after 3ms` ✓ |
| sprint-lifecycle | Review carries over and returns open todos | e2e | `e2e/review.test.ts:25:1 › Scenario: Review carries over and returns open todos` ✓ |
| sprint-lifecycle | Open recurring instance is carried or dropped | unit | ` ✓ src/lib/server/sprints.test.ts > sprint review > Scenario: Open recurring instance is carried or dropped 2ms` ✓ |
| sprint-lifecycle | Carried and returned todos lose their slot | unit | ` ✓ src/lib/server/sprints.test.ts > sprint review > Scenario: Carried and returned todos lose their slot 2ms` ✓ |
| sprint-lifecycle | Done todos stay with the closed sprint | unit | ` ✓ src/lib/server/sprints.test.ts > sprint review > Scenario: Done todos stay with the closed sprint 2ms` ✓ |
| sprint-lifecycle | All-done review closes in one tap | e2e | `e2e/review.test.ts:62:1 › Scenario: All-done review closes in one tap` ✓ |
| sprint-lifecycle | Weeks away review only the last sprint | unit | ` ✓ src/lib/server/sprints.test.ts > sprint review > Scenario: Weeks away review only the last sprint 2ms` ✓ |
| sprint-lifecycle | Starting a sprint pulls the week's planned todos | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Starting a sprint pulls the week's planned todos 4ms` ✓ |
| sprint-lifecycle | Plan page lists planned todos as coming automatically | e2e | `e2e/planning.test.ts:179:1 › Scenario: Plan page lists planned todos as coming automatically` ✓ |
| sprint-lifecycle | Pulling a planned todo by hand clears its date | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Pulling a planned todo by hand clears its date 2ms` ✓ |
| sprint-lifecycle | Planned todo travels to its day in the Week view | e2e | `e2e/plan-ahead.test.ts:30:1 › Scenario: Planned todo travels to its day in the Week view` ✓ |
| sprint-lifecycle | Missed planned todo joins the next sprint unscheduled | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Missed planned todo joins the next sprint unscheduled 2ms` ✓ |
| sprint-lifecycle | Archived class todos are not pulled | unit | ` ✓ src/lib/server/sprints.test.ts > sprint planning > Scenario: Archived class todos are not pulled 2ms` ✓ |
| sprint-views | Move a todo between board columns by drag | e2e | `e2e/sprint-views.test.ts:224:1 › Scenario: Move a todo between board columns by drag` ✓ |
| sprint-views | Move a todo between board columns with the status menu on touch | e2e | `e2e/sprint-views.test.ts:719:2 › on a touch phone › Scenario: Move a todo between board columns with the status menu on touch` ✓ |
| sprint-views | Empty board column shows a placeholder | e2e | `e2e/sprint-views.test.ts:378:1 › Scenario: Empty board column shows a placeholder` ✓ |
| sprint-views | Board card shows the aspect in its meta line | e2e | `e2e/sprint-views.test.ts:394:1 › Scenario: Board card shows the aspect in its meta line` ✓ |
| sprint-views | Board card shows the planned date and slot | e2e | `e2e/todo-planning.test.ts:158:1 › Scenario: Board card shows the planned date and slot` ✓ |
| sprint-views | Assign a todo to a day by drag | e2e | `e2e/sprint-views.test.ts:591:1 › Scenario: Assign a todo to a day by drag` ✓ |
| sprint-views | Dated sprint todo without a day sits on its due day | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Regression: dated sprint todos are missing from their day in the week view 2ms` ✓ |
| sprint-views | Assign a todo to a day with the day picker on touch | e2e | `e2e/sprint-views.test.ts:733:2 › on a touch phone › Scenario: Assign a todo to a day with the day picker on touch` ✓ |
| sprint-views | Day picker offers only days of the active sprint | e2e | `e2e/sprint-views.test.ts:611:1 › Scenario: Day picker offers only days of the active sprint` ✓ |
| sprint-views | Moving a todo to another day keeps its slot | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Moving a todo to another day keeps its slot 2ms` ✓ |
| sprint-views | Today is highlighted in the week view | e2e | `e2e/sprint-views.test.ts:655:1 › Scenario: Today is highlighted in the week view` ✓ |
| sprint-views | Phone shows one day at a time | e2e | `e2e/sprint-views.test.ts:752:2 › on a touch phone › Scenario: Phone shows one day at a time` ✓ |
| sprint-views | Done todos stay on their day | e2e | `e2e/sprint-views.test.ts:665:1 › Scenario: Done todos stay on their day` ✓ |
| sprint-views | Week cards stay one line at 1440 | e2e | `e2e/sprint-views.test.ts:777:1 › Scenario: Week cards stay one line at 1440` ✓ |
| sprint-views | Week cards show only the slot | e2e | `e2e/todo-planning.test.ts:219:1 › Scenario: Week cards show only the slot` ✓ |
| sprint-views | Row shows status as a glyph with its name | e2e | `e2e/row-actions.test.ts:134:1 › Scenario: Row shows status as a glyph with its name` ✓ |
| sprint-views | Sprint row shows the slot next to its day | e2e | `e2e/todo-planning.test.ts:247:1 › Scenario: Sprint row shows the slot next to its day` ✓ |
| today | Today shows today's sprint todos and overdue todos | e2e | `e2e/today.test.ts:27:1 › Scenario: Today shows today's sprint todos and overdue todos` ✓ |
| today | Overdue means due before today and not done | unit | ` ✓ src/lib/server/todos.test.ts > lists > Scenario: Overdue means due before today and not done 4ms` ✓ |
| today | Sprint todo due today without a day is on Today | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > Regression: sprint todos dated today without a day are missing from Today 2ms` ✓ |
| today | Status toggle on Today | e2e | `e2e/today.test.ts:89:1 › Scenario: Status toggle on Today` ✓ |
| today | Overdue todos outside the sprint offer the sprint instead of a checkbox | e2e | `e2e/today.test.ts:116:1 › Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox` ✓ |
| today | Quick add is shown in every Today state | e2e | `e2e/today.test.ts:136:1 › Scenario: Quick add is shown in every Today state` ✓ |
| today | Quick add on Today adds to the sprint on today | e2e | `e2e/today.test.ts:178:1 › Scenario: Quick add on Today adds to the sprint on today` ✓ |
| today | Quick add on Today outside the sprint's days saves a backlog todo due today | e2e | `e2e/today.test.ts:206:1 › Scenario: Quick add on Today outside the sprint's days saves a backlog todo due today` ✓ |
| today | Quick add on Today without any sprint saves a backlog todo due today | e2e | `e2e/today.test.ts:237:1 › Scenario: Quick add on Today without any sprint saves a backlog todo due today` ✓ |
| today | Quick add on a phone opens the sheet in every state | e2e | `e2e/today.test.ts:251:1 › Scenario: Quick add on a phone opens the sheet in every state` ✓ |
| today | Backlog todos due today are listed apart from sprint todos | unit | ` ✓ src/lib/server/todos.test.ts > lists > Scenario: Backlog todos due today are listed apart from sprint todos 2ms` ✓ |
| today | Backlog todos planned for today are listed once | unit | ` ✓ src/lib/server/todos.test.ts > lists > Scenario: Backlog todos planned for today are listed once 2ms` ✓ |
| today | Planned-today backlog todo shows on Today between sprints | e2e | `e2e/today.test.ts:403:1 › Scenario: Planned-today backlog todo shows on Today between sprints` ✓ |
| today | Backlog todos due today are listed only when today is not a sprint day | e2e | `e2e/today.test.ts:266:1 › Scenario: Backlog todos due today are listed only when today is not a sprint day` ✓ |
| today | Due-today backlog todos offer the sprint instead of a checkbox | e2e | `e2e/today.test.ts:294:1 › Scenario: Due-today backlog todos offer the sprint instead of a checkbox` ✓ |
| today | A fallback todo is overdue the next day | unit | ` ✓ src/lib/server/todos.test.ts > lists > Scenario: A fallback todo is overdue the next day 2ms` ✓ |
| today | Today without an active sprint prompts to plan | e2e | `e2e/today.test.ts:330:1 › Scenario: Today without an active sprint prompts to plan` ✓ |
| today | Today with a pending review prompts to review | e2e | `e2e/today.test.ts:342:1 › Scenario: Today with a pending review prompts to review` ✓ |
| today | Nothing today shows a calm empty state | e2e | `e2e/today.test.ts:366:1 › Scenario: Nothing today shows a calm empty state` ✓ |
| today | Sunday after the review prompts to plan next week | e2e | `e2e/today.test.ts:384:1 › Scenario: Sunday after the review prompts to plan next week` ✓ |
| todos | Migration 5 adds time slots without touching existing data | unit | ` ✓ src/lib/server/db.test.ts > db > Scenario: Migration 5 adds time slots without touching existing data 4ms` ✓ |
| todos | Both todo read models carry the slot | unit | ` ✓ src/lib/server/todos.test.ts > createTodo > Scenario: Both todo read models carry the slot 7ms` ✓ |
| todos | Plan a backlog todo three weeks out with a slot | e2e | `e2e/todo-planning.test.ts:27:1 › Scenario: Plan a backlog todo three weeks out with a slot` ✓ |
| todos | Planned date and slot are stored | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Planned date and slot are stored 2ms` ✓ |
| todos | Clearing the date clears the times | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Clearing the date clears the times 2ms` ✓ |
| todos | Editor clears the times with the date | e2e | `e2e/todo-planning.test.ts:46:1 › Scenario: Editor clears the times with the date` ✓ |
| todos | Past date outside the active sprint week is refused | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Past date outside the active sprint week is refused 2ms` ✓ |
| todos | Editor shows the past-date message | e2e | `e2e/todo-planning.test.ts:69:1 › Scenario: Editor shows the past-date message` ✓ |
| todos | Archived class todo cannot be planned | e2e | `e2e/plan-actions.test.ts:15:1 › Scenario: Archived class todo cannot be planned` ✓ |
| todos | Creating on a day follows the placement rule | unit | ` ✓ src/lib/server/todos.test.ts > createTodo > Scenario: Creating on a day follows the placement rule 4ms` ✓ |
| todos | Done todo is planned like any todo | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Done todo is planned like any todo 2ms` ✓ |
| todos | Slot validation | unit | ` ✓ src/lib/slot.test.ts > slot > Scenario: Slot validation 4ms` ✓ |
| todos | Slot labels | unit | ` ✓ src/lib/slot.test.ts > slot > Scenario: Slot labels 1ms` ✓ |
| todos | Invalid slot is refused on save | unit | ` ✓ src/lib/server/sprints.test.ts > mid-sprint changes > planned date > Scenario: Invalid slot is refused on save 2ms` ✓ |
| todos | Clearing the start clears the end in the editor | e2e | `e2e/todo-planning.test.ts:103:1 › Scenario: Clearing the start clears the end in the editor` ✓ |
| todos | Planned label formats date and slot | unit | ` ✓ src/lib/slot.test.ts > slot > Scenario: Planned label formats date and slot 1ms` ✓ |
| todos | Backlog and aspect rows show the planned date and slot | e2e | `e2e/todo-planning.test.ts:129:1 › Scenario: Backlog and aspect rows show the planned date and slot` ✓ |
| todos | Unplanned row shows only its due label | e2e | `e2e/todo-planning.test.ts:148:1 › Scenario: Unplanned row shows only its due label` ✓ |

## Findings from screenshots (not coverage gaps)

- Sprint Board at 1440 with sidebar and rail: the card meta line of a planned todo (`Sprint planned todo`, Health, Thu 15 Oct, slot 18:00–19:00) renders "Thu 15 Oct · 18", the slot is clipped without an ellipsis. Scenario "Board card shows the planned date and slot" passes in e2e (text is in the DOM), so the test does not pin the visible width. Seeded with no due date, so the due label next to it was not exercised in this shot.

## Manual checklist

- Run `npm run dev`, open /calendar at 375 px and 1440 px: dots on phone, up to three titles per cell on desktop, projections (hollow dot, repeat icon) in later months, done todo struck through, exam at its time.
- Open /sprint?view=board at 1440 and check the planned card shows its full slot (see finding above).
- Open a backlog todo, set Planned/From/To, save, reopen: values stay; clear Planned and both times clear.

## Diffstat

`git diff --stat main...flow/calendar-planning`: 67 files changed, 4322 insertions(+), 146 deletions(-)

## Screenshots (regenerated this round from the committed tip, seeded test DB, not committed)

- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/calendar-oct-mobile.png`: /calendar 375 px, Oct 2026, today selected: dots, "Nothing planned"
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/calendar-oct-selected-day-mobile.png`: /calendar 375 px, Thu 22 Oct selected: day list with an all-day and a slotted todo
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/calendar-oct-desktop.png`: /calendar 1440 px, Oct: planned todos with/without slots, done todo struck through, Gym projections, exam Analysis, day list in rail
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/calendar-nov-projection-desktop.png`: /calendar 1440 px, Nov: Gym rule slot projected into a later month, Tax advisor
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/calendar-nov-projection-mobile.png`: /calendar 375 px, Nov: projection dots
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/backlog-planned-mobile.png`: /backlog 375 px: Planned section with planned labels (date, date + slot), Job group below
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/todo-editor-planned-mobile.png`: todo editor sheet 375 px: Planned/From/To rows
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/todo-editor-planned-desktop.png`: todo editor 1440 px: Planned date chip with clear button, From/To chips
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/plan-joins-automatically-mobile.png`: /sprint/plan 375 px: "Joins automatically" section
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/plan-joins-automatically-desktop.png`: /sprint/plan 1440 px: "Joins automatically" section
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/sprint-board-desktop.png`: /sprint?view=board 1440 px: one planned and one due-only card
