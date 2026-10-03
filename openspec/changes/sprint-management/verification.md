verified-at: 7d39939

## Layer 1 — proof-full (`PORT=4700 npm run proof:full`): green

```
  ✓  137 e2e/today.test.ts:77:1 › An overdue todo planned for today is listed once, under Overdue (121ms)
  ✓  138 e2e/today.test.ts:89:1 › Scenario: Status toggle on Today (298ms)
  ✓  139 e2e/today.test.ts:116:1 › Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox (220ms)
  ✓  140 e2e/today.test.ts:136:1 › Scenario: Quick add on Today adds to the sprint on today (532ms)
  ✓  141 e2e/today.test.ts:156:1 › No quick add on the Sunday before next week's sprint starts (140ms)
  ✓  142 e2e/today.test.ts:165:1 › Scenario: Today without an active sprint prompts to plan (116ms)
  ✓  143 e2e/today.test.ts:177:1 › Scenario: Today with a pending review prompts to review (154ms)
  ✓  144 e2e/today.test.ts:201:1 › Scenario: Nothing today shows a calm empty state (121ms)
  ✓  145 e2e/today.test.ts:219:1 › Scenario: Sunday after the review prompts to plan next week (298ms)
  ✓  146 e2e/todos.test.ts:28:1 › GET /todos redirects to the backlog (129ms)
  ✓  147 e2e/todos.test.ts:34:1 › Scenario: Quick add creates a todo in the backlog (481ms)
  ✓  148 e2e/todos.test.ts:53:1 › Quick add rejects an empty title inline (451ms)
  ✓  149 e2e/todos.test.ts:63:1 › Scenario: Past due date is allowed and shown overdue (460ms)
  ✓  150 e2e/todos.test.ts:74:1 › Quick add on phone opens a sheet (589ms)
  ✓  151 e2e/todos.test.ts:92:1 › Scenario: Edit every field of a todo (697ms)
  ✓  152 e2e/todos.test.ts:127:1 › Scenario: Checklist items are added, renamed, toggled and deleted (837ms)
  ✓  153 e2e/todos.test.ts:163:1 › Scenario: Deleting a todo asks for confirmation (1.5s)
  ✓  154 e2e/todos.test.ts:184:1 › Editing on phone uses a sheet (590ms)

  154 passed (1.4m)
```

Unit (vitest) and e2e (Playwright, 154 passed) all green; check and build clean.

## Layer 2 — spec coverage

83 scenarios: 80 with a passing test named `Scenario: <title>` (unit 11, e2e 69), 3 manual, 0 gaps.

| Scenario | proof | Evidence |
|---|---|---|
| Aspect page shows this sprint and its backlog (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect page shows this sprint and its backlog" ✓ |
| Move todos between sprint and backlog on the aspect page (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Move todos between sprint and backlog on the aspect page" ✓ |
| Drag between sections on the aspect page (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Drag between sections on the aspect page" ✓ |
| Quick add on the aspect page defaults to the aspect (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Quick add on the aspect page defaults to the aspect" ✓ |
| Sidebar and Aspects rows open the aspect page (aspects) | e2e | `e2e/aspects.test.ts` › "Scenario: Sidebar and Aspects rows open the aspect page" ✓ |
| Unknown aspect shows a 404 page (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Unknown aspect shows a 404 page" ✓ |
| Aspect page without a running sprint (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect page without a running sprint" ✓ |
| Aspect page during a required review points to Review (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect page during a required review points to Review" ✓ |
| Aspect without todos shows an empty state with quick add (aspects) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect without todos shows an empty state with quick add" ✓ |
| Aspects page shows cards at 1024 and wider (aspects) | e2e | `e2e/aspects.test.ts` › "Scenario: Aspects page shows cards at 1024 and wider" ✓ |
| Aspects page stays a list on phone (aspects) | e2e | `e2e/aspects.test.ts` › "Scenario: Aspects page stays a list on phone" ✓ |
| Single aspect is one left-aligned card (aspects) | e2e | `e2e/aspects.test.ts` › "Scenario: Single aspect is one left-aligned card" ✓ |
| Card menu holds edit and delete (aspects) | e2e | `e2e/aspects.test.ts` › "Scenario: Card menu holds edit and delete" ✓ |
| Brief documents motion and the three-column layout with references (design-direction) | manual (taste document, judged by Rue) | Gate 2 checklist · `design/brief.md` §8 Motion, §9 Layout |
| Moving a todo from the rail starts a move animation (motion) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Moving a todo from the rail starts a move animation" ✓ |
| Reduced motion moves instantly (motion) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Reduced motion moves instantly" ✓ |
| Refused move returns the item to where it was (motion) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Refused move returns the item to where it was" ✓ |
| Moves look like they travel (motion) | manual (motion quality is a visual judgement, made by Rue at Gate 2) | Gate 2 checklist (motion) |
| Route changes and view switches use a view transition (motion) | e2e | `e2e/motion.test.ts` › "Scenario: Route changes and view switches use a view transition" ✓ |
| Navigation without View Transitions is instant (motion) | e2e | `e2e/motion.test.ts` › "Scenario: Navigation without View Transitions is instant" ✓ |
| Reduced motion navigates without a transition (motion) | e2e | `e2e/motion.test.ts` › "Scenario: Reduced motion navigates without a transition" ✓ |
| Rail slides in with the content reflowing (motion) | manual (motion quality is a visual judgement, made by Rue at Gate 2) | Gate 2 checklist (overlay slide) · `shots/sprint-overlay-rail-1100.png` |
| Sprint at 1280 shows a context rail (navigation) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Sprint at 1280 shows a context rail" ✓ |
| Today at 1280 shows sprint progress per aspect (navigation) | e2e | `e2e/today.test.ts` › "Scenario: Today at 1280 shows sprint progress per aspect" ✓ |
| Aspect page rail shows the aspect's details (navigation) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect page rail shows the aspect's details" ✓ |
| Screens without a rail centre their column (navigation) | e2e | `e2e/layout.test.ts` › "Scenario: Screens without a rail centre their column" ✓ |
| Rail becomes an overlay toggle below 1280 (navigation) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail becomes an overlay toggle below 1280" ✓ |
| No screen scrolls horizontally at any width (navigation) | e2e | `e2e/responsive.test.ts` › "Scenario: No screen scrolls horizontally at any width" ✓ |
| Starting a sprint adds one instance per weekday (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Starting a sprint adds one instance per weekday" ✓ |
| Rule created mid-sprint fills the remaining days (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule created mid-sprint fills the remaining days" ✓ |
| Recurring instances appear in the week view (recurring) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Recurring instances appear in the week view" ✓ |
| Carried recurring instance is not duplicated (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Carried recurring instance is not duplicated" ✓ |
| Carried instance of a deleted rule keeps no day (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Carried instance of a deleted rule keeps no day" ✓ |
| More carried instances than weekdays (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: More carried instances than weekdays" ✓ |
| Start sprint shows a carried recurring todo once (recurring) | e2e | `e2e/review.test.ts` › "Scenario: Start sprint shows a carried recurring todo once" ✓ |
| Add a backlog todo to the active sprint (sprint-lifecycle) | e2e | `e2e/backlog.test.ts` › "Scenario: Add a backlog todo to the active sprint" ✓ |
| Moving back to the backlog clears day and status (sprint-lifecycle) | unit | `src/lib/server/sprints.test.ts` › "Scenario: Moving back to the backlog clears day and status" ✓ |
| Add to the sprint with a day or a status (sprint-lifecycle) | unit | `src/lib/server/sprints.test.ts` › "Scenario: Add to the sprint with a day or a status" ✓ |
| Adding a todo that is no longer in the backlog is refused (sprint-lifecycle) | unit | `src/lib/server/sprints.test.ts` › "Scenario: Adding a todo that is no longer in the backlog is refused" ✓ |
| Removing a recurring instance deletes only that instance (sprint-lifecycle) | unit | `src/lib/server/sprints.test.ts` › "Scenario: Removing a recurring instance deletes only that instance" ✓ |
| Adding to the sprint is refused while the review is required (sprint-lifecycle) | unit | `src/lib/server/sprints.test.ts` › "Scenario: Adding to the sprint is refused while the review is required" ✓ |
| Backlog page points to Review instead of adding (sprint-lifecycle) | e2e | `e2e/backlog.test.ts` › "Scenario: Backlog page points to Review instead of adding" ✓ |
| Review becoming required after page load refuses the add (sprint-lifecycle) | e2e | `e2e/backlog.test.ts` › "Scenario: Review becoming required after page load refuses the add" ✓ |
| Sprint tab shows the backlog rail grouped by aspect (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Sprint tab shows the backlog rail grouped by aspect" ✓ |
| Rail is shown on the sprint's Sunday (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail is shown on the sprint's Sunday" ✓ |
| Rail title filter narrows the list (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail title filter narrows the list" ✓ |
| Rail filter without a match (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail filter without a match" ✓ |
| Empty backlog shows the rail's empty state (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Empty backlog shows the rail's empty state" ✓ |
| Collapsed rail groups are remembered (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Collapsed rail groups are remembered" ✓ |
| No rail without a running sprint (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: No rail without a running sprint" ✓ |
| No rail while the review is required (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: No rail while the review is required" ✓ |
| Add to sprint from the rail (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Add to sprint from the rail" ✓ |
| Drag a rail todo onto the sprint list (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Drag a rail todo onto the sprint list" ✓ |
| Drop a rail todo on a board column sets its status (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Drop a rail todo on a board column sets its status" ✓ |
| Drop a rail todo on the Done column (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Drop a rail todo on the Done column" ✓ |
| Drop a rail todo on a day column sets its day (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Drop a rail todo on a day column sets its day" ✓ |
| Touch offers no drag in the rail (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Touch offers no drag in the rail" ✓ |
| Todo already moved elsewhere is refused quietly (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Todo already moved elsewhere is refused quietly" ✓ |
| Move a sprint todo back to the backlog from its row (sprint-views) | e2e | `e2e/row-actions.test.ts` › "Scenario: Move a sprint todo back to the backlog from its row" ✓ |
| Board and week cards offer the send-back action (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Board and week cards offer the send-back action" ✓ |
| Drag a sprint todo onto the rail (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Drag a sprint todo onto the rail" ✓ |
| Done todo goes back without a question (sprint-views) | e2e | `e2e/row-actions.test.ts` › "Scenario: Done todo goes back without a question" ✓ |
| Removing a recurring instance deletes it with undo (sprint-views) | e2e | `e2e/row-actions.test.ts` › "Scenario: Removing a recurring instance deletes it with undo" ✓ |
| Undo keeps a removed recurring instance (sprint-views) | e2e | `e2e/row-actions.test.ts` › "Scenario: Undo keeps a removed recurring instance" ✓ |
| Progress and backlog counts per aspect (sprint-views) | unit | `src/lib/server/sprints.test.ts` › "Scenario: Progress and backlog counts per aspect" ✓ |
| Group header shows done of total (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Group header shows done of total" ✓ |
| Rail header shows backlog count and progress (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail header shows backlog count and progress" ✓ |
| Aspect without sprint todos shows only in the rail (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Aspect without sprint todos shows only in the rail" ✓ |
| Aspect without backlog todos is omitted from the rail (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Aspect without backlog todos is omitted from the rail" ✓ |
| Phone Sprint tab shows Manage instead of a rail (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Phone Sprint tab shows Manage instead of a rail" ✓ |
| Manage sheet adds a todo to the sprint (sprint-views) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Manage sheet adds a todo to the sprint" ✓ |
| Board columns share the width at 1280 (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Board columns share the width at 1280" ✓ |
| Week shows the whole week in one row at 1280 (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Week shows the whole week in one row at 1280" ✓ |
| Switching Week and Board swaps overlay and docked rail (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Switching Week and Board swaps overlay and docked rail" ✓ |
| Open week overlay closes when leaving Week (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Open week overlay closes when leaving Week" ✓ |
| Busy day scrolls inside its column (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Busy day scrolls inside its column" ✓ |
| Week wraps between 1024 and 1279 (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Week wraps between 1024 and 1279" ✓ |
| Assign a todo to a day by drag (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Assign a todo to a day by drag" ✓ |
| Assign a todo to a day with the day picker on touch (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Assign a todo to a day with the day picker on touch" ✓ |
| Day picker offers only days of the active sprint (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Day picker offers only days of the active sprint" ✓ |
| Today is highlighted in the week view (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Today is highlighted in the week view" ✓ |
| Phone shows one day at a time (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Phone shows one day at a time" ✓ |
| Done todos stay on their day (sprint-views) | e2e | `e2e/sprint-views.test.ts` › "Scenario: Done todos stay on their day" ✓ |

Notes on gate2_notes vs scenarios: none contradicts a scenario. The overlay-band note (1024–1279) is
already resolved — the delta spec now says 768–1279. The U6 note "Mon–Fri visible at 1280, in-week
horizontal scroll" is superseded by the Week-overlay decision; "Week shows the whole week in one row at
1280" asserts seven columns ≥120 px with scrollWidth = clientWidth and passes.

## Manual checklist (Gate 2)

Start with `npm run dev` → http://localhost:5173, a sprint running with backlog todos.

- [ ] Moves look like they travel: at ≥1280 on `/sprint`, use "Add to sprint" on a rail todo and send a sprint todo back — the item glides between rail and list, nothing jumps.
- [ ] Rail slides in with the content reflowing: at ~1100 px on `/sprint`, press the rail toggle — the overlay slides in (~320 ms, no scrim) and closes the same way; toggle sits over the overlay's top area.
- [ ] Brief documents motion and the three-column layout with references: read `design/brief.md` §8 Motion and §9 Layout (incl. the Week overlay paragraph) — Mobbin references cited, matches the app.
- [ ] Cross-fade look on route changes and Board/Week/By aspect switches (gate2 note U3).
- [ ] Board/week cards: ~40 px blank band under the meta line — `shots/sprint-board-1280.png` (gate2 note U9).

## Diffstat

`git diff --stat flow/build-life-manager...flow/sprint-management`: 63 files changed, 5192 insertions(+),
352 deletions(-) — src/lib/components 13, e2e 13, src/routes 14 (aspects 5, sprint 3, backlog 2, …),
src/lib/server 5, src/lib (motion.ts, dnd.ts, types.ts, styles), openspec change dir 6, design/brief.md.

## Screenshots

- `shots/aspect-page-375.png`
- `shots/aspect-page-1280.png`
- `shots/aspects-375.png`
- `shots/aspects-1280.png`
- `shots/backlog-375.png`
- `shots/backlog-1280.png`
- `shots/journey-backlog-1280.png`
- `shots/journey-manage-aspect-375.png`
- `shots/journey-manage-aspect-1280.png`
- `shots/journey-manage-week-1280.png`
- `shots/journey-next-week-1280.png`
- `shots/journey-plan-1280.png`
- `shots/journey-recurring-1280.png`
- `shots/journey-review-1280.png`
- `shots/journey-sprint-aspect-1280.png`
- `shots/journey-sprint-board-1280.png`
- `shots/journey-sprint-week-1280.png`
- `shots/journey-today-1280.png`
- `shots/journey-welcome-1280.png`
- `shots/plan-375.png`
- `shots/plan-1280.png`
- `shots/recurring-375.png`
- `shots/recurring-1280.png`
- `shots/review-375.png`
- `shots/review-1280.png`
- `shots/sprint-aspect-375.png`
- `shots/sprint-aspect-1280.png`
- `shots/sprint-board-375.png`
- `shots/sprint-board-1280.png`
- `shots/sprint-manage-375.png`
- `shots/sprint-overlay-rail-1100.png`
- `shots/sprint-week-375.png`
- `shots/sprint-week-1280.png`
- `shots/today-375.png`
- `shots/today-1280.png`
- `shots/welcome-375.png`
- `shots/welcome-1280.png`
