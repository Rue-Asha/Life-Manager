Waves (max 3 builders each): W1 = 1 · W2 = 2 ∥ 3 ∥ 4 · W3 = 5 ∥ 7 ∥ 8 · W4 = 6 · W5 = 9.
Every scenario test is named `Scenario: <title>` exactly as in the specs and is written from the THEN clauses before the code.
E2E tests start with `reset()` and set up data with `seed()` / `setClock()` from `e2e/helpers.ts`, never through another unit's UI.
Read design.md (Decisions, Contracts) and the archived build-life-manager design.md "Build notes" before building UI.
No task in this change is irreversible (no schema change, no migration, nothing published).

## 1. Contract

> unit: depends=none · scope=none · files=src/lib/types.ts, src/lib/server/sprints.ts, src/lib/server/sprints.test.ts, src/lib/server/todos.ts, src/routes/todos/+page.server.ts, src/lib/dnd.ts, src/lib/motion.ts, src/lib/styles/tokens.css, src/lib/components/ui/ProgressBar.svelte, src/lib/components/ui/Toast.svelte, src/lib/components/rail/BacklogRail.svelte, src/lib/components/shell/RailLayout.svelte, src/lib/components/sprint/UnscheduledList.svelte

- [x] 1.1 Add `AspectProgress`, `Placement` and error code `review-required` to `src/lib/types.ts`; give `addToActiveSprint` the signature `(db, todoId, today, placement?)` with today's behaviour, update its calls in `src/lib/server/sprints.test.ts`; add stubs `aspectProgress` (returns `{}`) and `backlogCounts` (returns `{}`) per design.md Contracts
- [x] 1.2 Write `Scenario: Removing a recurring instance deletes only that instance` in `src/lib/server/sprints.test.ts`, then implement `removeFromSprint` (recurring → `deleteTodo`, else `moveToBacklog`)
- [x] 1.3 `/todos` actions per Contracts: `?/addToSprint` reads optional `day` / `status` and passes `today()`; new `?/removeFromSprint`
- [ ] 1.4 Implement `src/lib/dnd.ts` and `src/lib/motion.ts` per Contracts (reduced motion → 0 ms); add `--rail-width` and `--day-col-min` to `tokens.css`; implement `ui/ProgressBar.svelte`
- [ ] 1.5 Stubs with the exact props from Contracts: `ui/Toast.svelte`, `rail/BacklogRail.svelte` (plain title list), `shell/RailLayout.svelte` (children then rail), `sprint/UnscheduledList.svelte` (renders nothing, no test id); `npm run proof` green

## 2. Lifecycle rules and progress queries

> unit: depends=1 · scope=S2,S4,S7,S8 · files=src/lib/server/sprints.ts, src/lib/server/sprints.test.ts, src/lib/server/recurring.ts, src/lib/server/recurring.test.ts, src/lib/server/todos.ts, src/lib/server/todos.test.ts, e2e/review.test.ts

- [ ] 2.1 Write `Scenario: Add to the sprint with a day or a status`, `Scenario: Adding a todo that is no longer in the backlog is refused`, `Scenario: Adding to the sprint is refused while the review is required`, then implement placement and the phase check in `addToActiveSprint` (phase first, no write on refusal; Done sets `completed_at`; day validated like `setDay`)
- [ ] 2.2 Write `Scenario: Progress and backlog counts per aspect`, then implement `aspectProgress` and `backlogCounts`
- [ ] 2.3 Write `Scenario: Carried recurring instance is not duplicated`, `Scenario: Carried instance of a deleted rule keeps no day`, `Scenario: More carried instances than weekdays` in `src/lib/server/recurring.test.ts`, then the carried-first slot assignment in `generateInstances` (design.md Decisions); the existing recurring scenarios stay green
- [ ] 2.4 Write `Scenario: Start sprint shows a carried recurring todo once` in `e2e/review.test.ts` (review carries a Tuesday instance → Plan → Start → week view); run `PORT=<port> npm run proof:full` green

## 3. Wide shell and navigation motion

> unit: depends=1 · scope=S9,S13 · files=src/routes/+layout.svelte, src/lib/components/shell/RailLayout.svelte, e2e/layout.test.ts, e2e/motion.test.ts

- [ ] 3.1 Write `Scenario: Screens without a rail centre their column` in `e2e/layout.test.ts`, then the ≥1280 shell: `.page` uncapped, a centred 720 px column for pages without a rail, `.page:has(.rail-layout)` opts out
- [ ] 3.2 Implement `RailLayout` per design.md (bands ≥1280 docked `context-rail` on `--paper-sunk` at `--rail-width`, content max 720 left-aligned unless `wide`; 768–1279 `rail-toggle` + overlay panel sliding over `--dur-slow`, no scrim; <768 no rail). Its scenarios (`Sprint at 1280 shows a context rail`, `Rail becomes an overlay toggle between 1024 and 1279`) are written by unit 5, which first renders it on a page
- [ ] 3.3 Write `Scenario: Route changes and view switches use a view transition`, `Scenario: Navigation without View Transitions is instant`, `Scenario: Reduced motion navigates without a transition` in `e2e/motion.test.ts` (spy via `page.addInitScript`), then `onNavigate` + `document.startViewTransition` in `+layout.svelte` with the root cross-fade on `--dur-base`, skipped under reduced motion or when unsupported

## 4. Backlog rail component and row actions

> unit: depends=1 · scope=S1,S2,S3,S4,S12 · files=src/lib/components/rail/BacklogRail.svelte, src/lib/components/ui/Toast.svelte, src/lib/components/todo/TodoRow.svelte, src/routes/sprint/plan/+page.svelte, e2e/planning.test.ts, e2e/row-actions.test.ts

- [ ] 4.1 Implement `BacklogRail` per Contracts: groups in `aspects` order with icon, name, `rail-count` and `ProgressBar` when the aspect has sprint todos; groups without backlog todos omitted; `rail-filter` (case-insensitive title match, "No backlog todo matches"); empty state linking to `/backlog`; collapsible groups remembered in `localStorage` (guarded, works without it); "Add to sprint" per row posting `addAction`; rows `draggableTodo`; drop zone for non-recurring `from: 'sprint'` payloads when `onreturn` is set; `in:receive` / `out:send` + `animate:flip` from `motion.ts`
- [ ] 4.2 Use `BacklogRail` for Plan's backlog pane (`testid="plan-backlog"`, `addAction="?/pull"`, `onreturn` → `?/unpull`) and replace Plan's own drag code with `dnd.ts`; `e2e/planning.test.ts` stays green unchanged
- [ ] 4.3 Write `Scenario: Move a sprint todo back to the backlog from its row` and `Scenario: Done todo goes back without a question` in `e2e/row-actions.test.ts` (on `/sprint`, By aspect view), then the `row-actions` menu / hover action on `TodoRow` in context `sprint` ("Move to backlog", no confirm)
- [ ] 4.4 Write `Scenario: Removing a recurring instance deletes it with undo` and `Scenario: Undo keeps a removed recurring instance`, then `Toast` and the recurring "Remove from sprint" in `TodoRow` (row hides, toast holds `?/removeFromSprint` for 5 s, Undo cancels, `beforeNavigate` flushes)
- [ ] 4.5 `TodoRow`'s and the rail's "Add to sprint" handle failures per Contracts: `not-found` → `invalidateAll()` without a message; `review-required` → inline message linking to `/sprint/review` (scenarios proven in units 5 and 7)

## 5. Sprint tab: rail, manage sheet, progress

> unit: depends=1,2,3,4 · scope=S1,S2,S3,S4,S6,S9,S12 · files=src/routes/sprint/+page.svelte, src/routes/sprint/+page.server.ts, src/lib/components/sprint/AspectView.svelte, src/lib/components/sprint/ManageSheet.svelte, e2e/sprint-rail.test.ts

- [ ] 5.1 Write `Scenario: Sprint tab shows the backlog rail grouped by aspect`, `Scenario: Rail is shown on the sprint's Sunday`, `Scenario: No rail without a running sprint`, `Scenario: No rail while the review is required`, `Scenario: Sprint at 1280 shows a context rail`, `Scenario: Rail becomes an overlay toggle between 1024 and 1279` in `e2e/sprint-rail.test.ts`, then the load (`aspects`, `backlog`, `progress`, `backlogCounts`) and the page in `RailLayout` (`wide` for board/week) with `BacklogRail` (`/todos?/addToSprint`) and, in week view, `UnscheduledList` above it
- [ ] 5.2 Write `Scenario: Rail title filter narrows the list`, `Scenario: Rail filter without a match`, `Scenario: Empty backlog shows the rail's empty state`, `Scenario: Collapsed rail groups are remembered` and fix what they expose
- [ ] 5.3 Write `Scenario: Add to sprint from the rail`, `Scenario: Drag a rail todo onto the sprint list`, `Scenario: Todo already moved elsewhere is refused quietly`, `Scenario: Drag a sprint todo onto the rail`, then `AspectView` as a `dropZone` for `from: 'backlog'`, the rail's `onreturn` → `?/moveToBacklog` (the rail refuses recurring payloads), optimistic moves with `send` / `receive` across rail and sprint
- [ ] 5.4 Write `Scenario: Group header shows done of total`, `Scenario: Rail header shows backlog count and progress`, `Scenario: Aspect without sprint todos shows only in the rail`, `Scenario: Aspect without backlog todos is omitted from the rail`, then `ProgressBar` in `AspectView` group headers, recomputed from the optimistic list
- [ ] 5.5 Write `Scenario: Phone Sprint tab shows Manage instead of a rail`, `Scenario: Manage sheet adds a todo to the sprint`, `Scenario: Touch offers no drag in the rail`, then `ManageSheet` (`manage-button`, `Sheet` with `BacklogRail`, `testid="manage-sheet"`)
- [ ] 5.6 Write `Scenario: Moving a todo from the rail starts a move animation` and `Scenario: Reduced motion moves instantly` (rail add + board move to Doing) and fix what they expose; run `PORT=<port> npm run proof:full` green

## 6. Board and week: full width, drops, card actions, motion

> unit: depends=1,2,4,5 · scope=S2,S3,S10,S12 · files=src/lib/components/sprint/BoardView.svelte, src/lib/components/sprint/WeekView.svelte, src/lib/components/sprint/SprintCard.svelte, src/lib/components/sprint/UnscheduledList.svelte, e2e/sprint-views.test.ts

- [ ] 6.1 Move board and week drag to `dnd.ts` (remove `SprintCard`'s `dropTarget`); write `Scenario: Board and week cards offer the send-back action`, then the `row-actions` trigger on `SprintCard` (same labels and toast behaviour as `TodoRow`); existing sprint-views scenarios stay green
- [ ] 6.2 Write `Scenario: Drop a rail todo on a board column sets its status`, `Scenario: Drop a rail todo on the Done column`, `Scenario: Drop a rail todo on a day column sets its day`, then board and day columns accept `from: 'backlog'` → `?/addToSprint` with `status` / `day`
- [ ] 6.3 Write `Scenario: Board columns share the width at 1280`, `Scenario: Week shows the whole week in one row at 1280`, `Scenario: Busy day scrolls inside its column`, `Scenario: Week wraps between 1024 and 1279`, then the ≥1280 layouts and `UnscheduledList` (`day-column-unscheduled`, drop zone, quick add as before) shown in the rail at ≥1280 while `WeekView` hides its own column there; adjust existing week tests only where Unscheduled moved (R1)
- [ ] 6.4 Write `Scenario: Refused move returns the item to where it was` (intercept the `setStatus` POST with `page.route` to fail), then `send` / `receive` + `animate:flip` between board columns and days, `--shadow-float` while dragging (no tilt) and a hairline drop slot on `[data-over]`; `Scenario: Reduced motion moves instantly` stays green; run `PORT=<port> npm run proof:full` green

## 7. Aspect page, aspect cards, review guard in the UI

> unit: depends=1,2,3,4 · scope=S4,S5,S7,S9,S11 · files=src/routes/aspects/[id]/+page.svelte, src/routes/aspects/[id]/+page.server.ts, src/routes/aspects/[id]/+error.svelte, src/routes/aspects/+page.svelte, src/routes/aspects/+page.server.ts, src/lib/components/shell/Sidebar.svelte, src/routes/backlog/+page.svelte, src/routes/backlog/+page.server.ts, e2e/aspect-page.test.ts, e2e/aspects.test.ts, e2e/backlog.test.ts

- [ ] 7.1 Write `Scenario: Aspect page shows this sprint and its backlog`, `Scenario: Unknown aspect shows a 404 page`, `Scenario: Aspect page without a running sprint`, `Scenario: Aspect without todos shows an empty state with quick add`, `Scenario: Aspect page rail shows the aspect's details` in `e2e/aspect-page.test.ts`, then the `/aspects/[id]` load (Contracts), page in `RailLayout` (`aspect-sprint` with `ProgressBar`, `aspect-backlog`) and `+error.svelte`
- [ ] 7.2 Write `Scenario: Move todos between sprint and backlog on the aspect page`, `Scenario: Drag between sections on the aspect page`, `Scenario: Quick add on the aspect page defaults to the aspect`, then the sections as `dropZone`s and `QuickAdd` with `defaultAspectId`
- [ ] 7.3 Write `Scenario: Aspect page during a required review points to Review`, `Scenario: Backlog page points to Review instead of adding` and `Scenario: Review becoming required after page load refuses the add` (in `e2e/backlog.test.ts`), then phase-aware loads (no `sprintDays` while `review-required`) and the review note on both pages
- [ ] 7.4 Write `Scenario: Sidebar and Aspects rows open the aspect page` and update the sidebar-link helper in `e2e/aspects.test.ts`, then `Sidebar` aspect links → `/aspects/<id>` and Aspects rows linking to the page
- [ ] 7.5 Write `Scenario: Aspects page shows cards at 1024 and wider`, `Scenario: Aspects page stays a list on phone`, `Scenario: Single aspect is one left-aligned card`, `Scenario: Card menu holds edit and delete`, then the ≥1024 card grid (`aspect-card`, `progress`, backlog count, menu with Edit/Delete); update existing aspects tests that assume the list at 1280 (R1); run `PORT=<port> npm run proof:full` green

## 8. Today rail and design brief

> unit: depends=1,2,3 · scope=S9,S14 · files=src/routes/+page.svelte, src/routes/+page.server.ts, e2e/today.test.ts, design/brief.md

- [ ] 8.1 Write `Scenario: Today at 1280 shows sprint progress per aspect` in `e2e/today.test.ts`, then `progress` in the Today load and a `RailLayout` rail listing the sprint's aspects with `ProgressBar`; existing Today scenarios stay green
- [ ] 8.2 Update `design/brief.md` per `Requirement: Brief records motion and wide-layout decisions`: rewrite §8 Motion (moves and navigation animate, tokens unchanged, reduced motion instant, no tilt, drop slot, no scrim) and add a layout section (≥1280 three columns, 768–1279 overlay rail, centred rail-less screens), citing the scope's Mobbin URLs (flow URL + screen ID)

## 9. Wide-screen pass and journey

> unit: depends=5,6,7,8 · scope=S9 · files=e2e/responsive.test.ts, e2e/journey.test.ts, plus style fixes in any `.svelte` file the tests expose

- [ ] 9.1 Write `Scenario: No screen scrolls horizontally at any width` in `e2e/responsive.test.ts` (768 / 1024 / 1280 / 1600; a 1280 screenshot of every screen incl. an aspect page and the overlay rail at 1100), add the aspect page and the Manage sheet to the 375 px screenshot run, and fix any overflow they expose
- [ ] 9.2 Write a journey test "Sprint management journey" in `e2e/journey.test.ts`: at 1280 pull a backlog todo from the rail, drag it onto a day, send another back, open its aspect page; at 375 (touch) do the same through the Manage sheet; run `PORT=<port> npm run proof:full` green
