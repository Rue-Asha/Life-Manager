# Tasks: calendar-planning

Waves: 1 → U1 · 2 → U2 ∥ U3 ∥ U4 · 3 → U5 ∥ U6 ∥ U7 · 4 → U8.

Every task that adds behaviour starts with its scenario tests, named `Scenario: <title>` and written from the THEN
clauses, run red for the stated reason before the code. Existing tests that encode the old behaviour are **rewritten**
to the new behaviour (Rue, Gate 0): never deleted, skipped or loosened; a rewritten test is red against the old code
before the change makes it green. `npm run proof` after every task; `npm run proof:full` at the end of every unit that
touched an e2e file (in the background, a red run is rerun in full). Seed e2e data through `__test/seed` and call
`setClock` again after every `reset()`.

## 1. Contract: slot data model, read models, slot helpers

> unit: depends=none · scope=S3,S4 · files=src/lib/server/schema.ts, src/lib/server/db.test.ts, src/lib/types.ts, src/lib/slot.ts, src/lib/slot.test.ts, src/lib/server/todos.ts, src/lib/server/todos.test.ts, src/lib/server/sprints.ts, src/lib/server/recurring.ts, src/routes/__test/seed/+server.ts

- [ ] 1.1 ⚠ irreversible (schema migration; production DB moves to `user_version` 5 on next start, no down-migration) — Write "Scenario: Migration 5 adds time slots without touching existing data" in `db.test.ts`; rewrite "Scenario: Migration 2 adds projects without touching existing data" (its `strip` also drops `start_time`, `end_time`) and "Scenario: Migration 4 adds the Uni tables without touching existing data" (expects `user_version` = `migrations.length` instead of 4 and strips the new columns from the todo/rule comparison). Red: no `start_time` column / version 4. Then append migration 5 exactly as in design.md ## Contracts
- [ ] 1.2 Write "Scenario: Both todo read models carry the slot" in `todos.test.ts` and add `startTime: null, endTime: null` to "Scenario: Todo stores all optional fields". Red: fields undefined. Then add `HhMm`, `Slot`, `startTime`/`endTime` on `Todo`, `RecurringRule`, `RuleInput` (types.ts) and map them in `todoColumns` (todos.ts), `selectTodos` (sprints.ts) and `toRule` (recurring.ts) — read models only, no write paths
- [ ] 1.3 Write "Scenario: Slot validation", "Scenario: Slot labels" and "Scenario: Planned label formats date and slot" in `src/lib/slot.test.ts`. Red: module missing. Then implement `src/lib/slot.ts` per Contracts (`validateSlot`, `slotLabel`, `plannedLabel`; date as `dateLabel` in `format.ts` ("Tue 27 Oct"), en dash, " · " separator)
- [ ] 1.4 Seed endpoint: `todos[].startTime`, `todos[].endTime`, `rules[].startTime`, `rules[].endTime` (null when omitted); `npm run proof` green

## 2. Planning rules on the server

> unit: depends=1 · scope=S1,S2,S6,S7,S8,S9,S10,C · files=src/lib/server/planning.ts, src/lib/server/sprints.ts, src/lib/server/sprints.test.ts, src/lib/server/todos.ts, src/lib/server/todos.test.ts, src/routes/todos/+page.server.ts, e2e/sprint-views.test.ts, e2e/today.test.ts, e2e/planning.test.ts, e2e/plan-actions.test.ts

- [ ] 2.1 Placement rule + `setDay(db, id, day, today, slot?)` (design.md Decisions). Write in `sprints.test.ts`: "Scenario: Planned date and slot are stored", "Scenario: Clearing the date clears the times", "Scenario: Past date outside the active sprint week is refused", "Scenario: Done todo is planned like any todo", "Scenario: Invalid slot is refused on save", "Scenario: Sprint todo planned outside the week moves to the backlog", "Scenario: Backlog todo planned inside the week joins the sprint", "Scenario: Without an active sprint a planned todo stays in the backlog", "Scenario: Day in the planning draft's target week stays in the backlog", "Scenario: Planning into the week is refused while the review is required", "Scenario: Closed-sprint todo keeps its sprint", "Scenario: Moving a todo to another day keeps its slot", "Scenario: Instance slot is edited like any todo". **Rewrite** the test "setDay accepts only days of the todo's sprint": its out-of-week cases (2026-10-12 → backlog with that day; 2026-10-04 → `day-in-past` with today 2026-10-07; the backlog todo given 2026-10-06 → joins the sprint) move to the new behaviour, its in-week / null / `not-found` cases stay. Red: `day-outside-sprint` returned, slot ignored. Then create `planning.ts` and rewrite `setDay`
- [ ] 2.2 `createTodo(db, input, today?)` with a `day` target follows the placement rule; `/todos` actions: `setDay` parses `day`, `startTime`, `endTime` (no `startTime` key = keep slot) and passes `today()`; `update` handles `day`/`startTime`/`endTime` when `day` is posted, validating the plan before the patch; `create` passes `today()`. **Rewrite** in `todos.test.ts` "lands on a day of the active sprint for target day" (2026-10-05 after the sprint week now lands in the backlog with that day, 2026-09-27 before today fails `day-in-past`; set today explicitly) and any `no-active-sprint` expectation for a `day` target (now: backlog with the day). Red: old refusals
- [ ] 2.3 Slot follows day on every clearing path: `toBacklog`, `closeReview` carry, `pullTodo`, `addToActiveSprint` (no day → no slot; a day keeps the slot). Write "Scenario: Add to sprint without a day drops a planned date", "Scenario: Carried and returned todos lose their slot", "Scenario: Pulling a planned todo by hand clears its date"; **rewrite** "Scenario: Moving back to the backlog clears day and status" as "Scenario: Moving back to the backlog clears day, slot and status" (seed 18:00–19:30) and "Scenario: Removing a recurring instance deletes only that instance" (normal todo seeded with 18:00, asserts no slot). Red: slot survives
- [ ] 2.4 Sprint start: suggested pull keeps an in-week day, auto-pull of planned todos in the week, missed pull before the week, in that order and before `generateInstances`; `suggestedTodos` excludes todos planned in the target week or any later week (Gate 1 addition C); add `listPlannedForWeek`. Write "Scenario: Starting a sprint pulls the week's planned todos", "Scenario: Due and planned todo keeps its day", "Scenario: Todo planned for a later week is not suggested", "Scenario: Missed planned todo joins the next sprint unscheduled", "Scenario: Archived class todos are not pulled" (seed the archived-class todo open via SQL) in `sprints.test.ts`, and "Scenario: Plan page does not suggest a todo planned for a later week" in `e2e/planning.test.ts`. Red: todos stay in the backlog / day nulled / the later-planned todo is suggested
- [ ] 2.5 `listBacklogDueToday` returns open backlog todos due today or planned for today, once each. Write "Scenario: Backlog todos planned for today are listed once" in `todos.test.ts` and "Scenario: Planned-today backlog todo shows on Today between sprints" in `e2e/today.test.ts` (Sunday 2026-10-18 after the review closed; assert the row under its aspect and the header count, not the label). Red: not listed
- [ ] 2.6 e2e: **rewrite** "Scenario: Day picker offers only days of the active sprint" in `e2e/sprint-views.test.ts` (picker options unchanged; POST `setDay` with 2026-10-12 now moves the todo out of the week view and onto `/backlog`; a second todo POSTed a past day outside the week fails `day-in-past` and stays `data-day=""`); write "Scenario: Archived class todo cannot be planned" in new `e2e/plan-actions.test.ts` (POST `setDay` and `update` with `day`). `npm run proof:full` green

## 3. Recurring rule slots

> unit: depends=1 · scope=S10 · files=src/lib/server/recurring.ts, src/lib/server/recurring.test.ts, src/routes/recurring/+page.server.ts, src/routes/recurring/+page.svelte, src/lib/components/recurring/RuleForm.svelte, e2e/recurring.test.ts

- [ ] 3.1 Rule slot validated with `validateSlot` (errors on `startTime`/`endTime`) and stored by `createRule`/`updateRule`. Write "Scenario: Rule slot follows the slot rules" in `recurring.test.ts`. Red: stored without error
- [ ] 3.2 `generateInstances` copies the rule's slot onto fresh instances and onto carried instances it places (instances left without a day get no slot). Write "Scenario: Instances carry the rule's slot"; **rewrite** "Scenario: Editing a rule affects only future sprints" (also sets the slot 07:00–08:00: existing instances keep theirs, next sprint's carry the new one), "Scenario: Rule created mid-sprint fills the remaining days" (rule with 07:00, instances carry it) and "Scenario: Carried recurring instance is not duplicated" (rule with 18:00, both instances carry it). Red: slot null
- [ ] 3.3 `RuleForm` gets "From"/"To" time inputs (clearing "From" clears "To"), the `/recurring` actions parse `startTime`/`endTime`, the rule list shows `slotLabel` when a slot is set, and each rule row gets `id="rule-<id>"`. Write "Scenario: Rule with a time slot" in `e2e/recurring.test.ts`. Red: no inputs
- [ ] 3.4 `npm run proof:full` green

## 4. Month calendar

> unit: depends=1 · scope=S11,S12,S13,S14,B · files=src/lib/week.ts, src/lib/week.test.ts, src/lib/server/calendar.ts, src/lib/server/calendar.test.ts, src/routes/calendar/+page.server.ts, src/routes/calendar/+page.svelte, src/lib/components/calendar/MonthGrid.svelte, src/lib/components/calendar/DayList.svelte, e2e/calendar.test.ts

- [ ] 4.1 Write "Scenario: Month grid runs Monday to Sunday" and "Scenario: Month parameter is parsed or falls back" in `week.test.ts`. Red: functions missing. Then add `monthGrid`, `parseMonth` to `week.ts`
- [ ] 4.2 Write in new `src/lib/server/calendar.test.ts`: "Scenario: Planned todos are entries, due dates are not", "Scenario: Rules are projected after the active sprint week", "Scenario: Without an active sprint projection starts today", "Scenario: Past months show only real todos", "Scenario: Rules of archived classes are not projected", "Scenario: Exams appear at their time with room", "Scenario: Entries within a day are ordered". Red: module missing. Then implement `calendarMonth` per Contracts (todos by explicit `day` only; projection from `listRules`, skipping rules of archived-semester classes (Gate 1 addition B); exams of all semesters; days outside the month empty)
- [ ] 4.3 Route `/calendar` (load: `parseMonth`, `calendarMonth`, aspects) with heading "Calendar", "‹" / "›" / "Today" links carrying `?month=`, `RailLayout wide` with the day list as rail. Write in new `e2e/calendar.test.ts`: "Scenario: Calendar opens on the current month", "Scenario: Month navigation and deep link", "Scenario: Invalid month parameter shows the current month", "Scenario: Calendar shows aspect colours and marks projections", "Scenario: Recurring rule with a slot shows in later months", "Scenario: Wide cells show up to three titles", "Scenario: Day list in the rail overlay below 1280", "Scenario: Empty month shows Nothing planned". Wait for `context-rail` before measuring at ≥1280 (repo learning)
- [ ] 4.4 Phone layout (<768): dots (max 3, then "+"), selected-day list under the grid, selected day default today-in-month else the 1st. Write "Scenario: Phone shows dots and the selected day's list", "Scenario: Selected day defaults to the 1st in another month". Red: titles instead of dots / no list under the grid
- [ ] 4.5 Day list entries: a todo opens `TodoEditor` (with `aspects` from the load), a projection links `/recurring#rule-<id>`, an exam links `/uni/classes/<id>`. Write "Scenario: Todo entry opens the editor", "Scenario: Projected occurrence links to its rule" (assert the URL and the `rule-row` with that `data-rule-id` visible; the `id` anchor comes from U3), "Scenario: Exam links to its class"
- [ ] 4.6 `npm run proof:full` green

## 5. Planned field in the editor and planned label on rows

> unit: depends=1,2 · scope=S1,S3,S4 · files=src/lib/components/todo/TodoFields.svelte, src/lib/components/todo/TodoEditor.svelte, src/lib/components/todo/TodoRow.svelte, src/lib/components/todo/form.ts, e2e/todo-planning.test.ts

- [ ] 5.1 `TodoFields` gets an opt-in Planned group (date "Planned", times "From"/"To"; clearing the date clears both times, clearing "From" clears "To"), turned on only by `TodoEditor`, which posts `day`, `startTime`, `endTime` with Save and shows `day-in-past`, `review-required` and slot errors as an alert. Write in new `e2e/todo-planning.test.ts`: "Scenario: Plan a backlog todo three weeks out with a slot", "Scenario: Editor clears the times with the date", "Scenario: Editor shows the past-date message", "Scenario: Clearing the start clears the end in the editor". Red: no "Planned" field. QuickAdd stays unchanged
- [ ] 5.2 `TodoRow` shows `plannedLabel` as `data-testid="planned-label"`: with the date in plain rows and Board cards, slot only in rows with a day control and in Week chips (before the title, one line). Write "Scenario: Backlog and aspect rows show the planned date and slot", "Scenario: Unplanned row shows only its due label", "Scenario: Board card shows the planned date and slot", "Scenario: Week cards show only the slot", "Scenario: Sprint row shows the slot next to its day" in `e2e/todo-planning.test.ts`. Red: no label. Check "Scenario: Week cards stay one line at 1440" stays green
- [ ] 5.3 `npm run proof:full` green (the label must not make any 375 px screen scroll sideways)

## 6. Backlog "Planned" section and plan page auto-list

> unit: depends=1,2 · scope=S5,S6 · files=src/routes/backlog/+page.server.ts, src/routes/backlog/+page.svelte, src/routes/sprint/plan/+page.server.ts, src/routes/sprint/plan/+page.svelte, e2e/backlog.test.ts, e2e/planning.test.ts

- [ ] 6.1 Backlog: split the (aspect-filtered) backlog into the "Planned" section (`planned-section`, sorted by day, all-day first, then start time) above the aspect groups, hidden when empty. Write "Scenario: Planned todos are listed in the Planned section" and "Scenario: No Planned section without planned todos" in `e2e/backlog.test.ts`; scope count assertions to the section / group test ids (repo learning). Red: no section
- [ ] 6.2 Plan page: load `listPlannedForWeek(targetWeek)`, render "Joins automatically" (`plan-auto`) with read-only rows (no pull/unpull, not draggable) and keep them out of the backlog panel. Write "Scenario: Plan page lists planned todos as coming automatically" in `e2e/planning.test.ts`. Red: no section
- [ ] 6.3 `npm run proof:full` green

## 7. Calendar in the navigation

> unit: depends=1,4 · scope=S11,S13 · files=src/lib/components/shell/Sidebar.svelte, src/lib/components/shell/HomeList.svelte, e2e/navigation.test.ts, e2e/responsive.test.ts

- [ ] 7.1 **Rewrite** in `e2e/navigation.test.ts` "Scenario: Desktop shows a sidebar" (`LISTS` with Calendar after Sprint, `slice(0, 8)`, `/calendar` → Calendar current) and "Scenario: Phone home list shows the seven lists" as "Scenario: Phone home list shows the eight lists" (Calendar without a count). Red: seven entries. Then add `{ label: 'Calendar', href: '/calendar', icon: 'calendar' }` to `NAV_ITEMS` with `count` optional, and make `HomeList` and the sidebar skip the count when absent
- [ ] 7.2 **Rewrite** in `e2e/responsive.test.ts` "Scenario: Phone home list drills into each list" (adds `['Calendar', '/calendar']`), "Scenario: Every screen fits 375 px without horizontal scroll" and "Scenario: No screen scrolls horizontally at any width" (add `/calendar` as `calendar`). `npm run proof:full` green

## 8. Plan-ahead journeys and release

> unit: depends=2,3,4,5,6,7 · scope=S1,S2,S6,S14 · files=e2e/plan-ahead.test.ts, package.json, package-lock.json

- [ ] 8.1 Write "Scenario: Planned todo travels to its day in the Week view" and "Scenario: Todo edited from the calendar leaves its day" in new `e2e/plan-ahead.test.ts` (wait for the URL or heading after each client-side navigation). If one is red, the owning unit's code is fixed in its file, reported under deviations
- [ ] 8.2 Bump the version to 0.5.0 in `package.json` and `package-lock.json` (`npm version 0.5.0 --no-git-tag-version`); `npm run proof:full` green (background, full rerun on red). The tag `v0.5.0` is pushed by the shipper after the merge, not here
