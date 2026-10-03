Waves (max 3 builders each): W1 = 1 ∥ 2 · W2 = 3 ∥ 4 · W3 = 5 ∥ 6 · W4 = 7 ∥ 8 ∥ 9 · W5 = 10 ∥ 11 ∥ 12 · W6 = 13.
Every scenario test is named `Scenario: <title>` exactly as in the specs and is written from the THEN clauses before the code.
E2E tests start with `reset()` and set up data with `seed()` / `setClock()` from `e2e/helpers.ts`, never through another unit's UI.

## 1. Establish the harness

> unit: depends=none · scope=S1,S23 · files=package.json, package-lock.json, svelte.config.js, vite.config.ts, tsconfig.json, playwright.config.ts, .gitignore, src/app.html, src/app.d.ts, src/routes/+page.svelte, src/lib/sqlite.test.ts, src/lib/engines.test.ts, e2e/smoke.test.ts

- [x] 1.1 Scaffold SvelteKit (TypeScript, Vite, `@sveltejs/adapter-node`) with npm; `engines.node >= 22.5`; placeholder `src/routes/+page.svelte`; `npm run dev` serves it on :5173 and `npm run check` passes
- [x] 1.2 Add Vitest (`test:unit`: `vitest run --reporter=verbose`) and write `Scenario: Unit suite opens node:sqlite` in `src/lib/sqlite.test.ts`; if Vite rewrites `node:sqlite`, apply the fix from design.md Risks
- [x] 1.3 Add Playwright (`npx playwright install chromium`, `test:e2e`: `playwright test --reporter=list`); `playwright.config.ts` per design.md E2E isolation: `npm run build`-output served by `mkdir -p .e2e && rm -f .e2e/${port}.db* && node build` on `$PORT` (default 4173) with env `PORT`, `DATABASE_PATH=.e2e/${port}.db`, `LM_TEST=1`, `workers: 1`; `.e2e/`, `test-results/`, `data/` in `.gitignore`
- [x] 1.4 Write `Scenario: Package declares the Node engine` in `src/lib/engines.test.ts` (reads `package.json`, expects `engines.node` = `>=22.5`, set in 1.1)
- [x] 1.5 Write `Scenario: Built app serves a page in e2e` in `e2e/smoke.test.ts`; add `proof` (`npm run check && npm run build && npm run test:unit`) and `proof:full` (`npm run proof && npm run test:e2e`); run `npm run proof:full` green and confirm every passed test name is printed

## 2. Design direction spike

> unit: depends=none · scope=S2 · files=design/brief.md, design/style-tile.html, src/lib/styles/tokens.css, src/lib/aspect-style.ts

- [x] 2.1 Write `design/brief.md` from `design-refs.md` plus any further Mobbin searches (run them in a subagent; check app names in results, cite flow URL + screen ID); every aesthetic decision cites a Mobbin URL; apply scope.md Decisions over design-refs.md: light theme only, no dark mode, no keyboard shortcuts, no natural-language quick add
- [x] 2.2 Write `src/lib/styles/tokens.css`: `:root` custom properties for neutrals, one accent, overdue red, aspect palette, type scale, spacing, radius, row height, shadow, motion durations — light only
- [x] 2.3 Write `src/lib/aspect-style.ts` per design.md Contracts: `ASPECT_COLORS` (fixed palette, ~8), `ASPECT_ICONS` (fixed line-icon set as inline SVG path data, ~24, licence noted), `AspectColor`, `AspectIcon`, and `PRESET_ASPECTS` (Health, Uni, Job, Home, Finance, Social with colour + icon)
- [x] 2.4 Build `design/style-tile.html` (static, links `../src/lib/styles/tokens.css`, no raw colours): palette, type scale, aspect colours + icons, sample todo row (normal / overdue / done struck through), aspect group header, chips, button, quick-add field, empty state; readable at 375 px and desktop
- [x] 2.5 ⚠ taste gate — stop here and return `blocked` with needs-human: "Rue approves `design/style-tile.html` and `design/brief.md`". The orchestrator asks Rue; revisions happen on this branch. No feature-UI unit (4, 7–13) starts before approval

## 3. Contract and runtime

> unit: depends=1,2 · scope=S20 · files=src/lib/types.ts, src/lib/week.ts, src/lib/todo-utils.ts, src/lib/server/schema.ts, src/lib/server/db.ts, src/lib/server/clock.ts, src/lib/server/aspects.ts, src/lib/server/todos.ts, src/lib/server/sprints.ts, src/lib/server/recurring.ts, src/lib/server/db.test.ts, src/hooks.server.ts, src/routes/healthz/+server.ts, src/routes/__test/reset/+server.ts, src/routes/__test/clock/+server.ts, src/routes/__test/seed/+server.ts, e2e/helpers.ts, e2e/runtime.test.ts

- [x] 3.1 Create `src/lib/types.ts` and stubs with the exact signatures from design.md Contracts (`aspects.ts`, `todos.ts`, `sprints.ts`, `recurring.ts`, `week.ts` throw `not implemented`); implement `berlinToday` and `isOverdue`; `npm run check` green
- [x] 3.2 Write `Scenario: Fresh database is migrated` in `src/lib/server/db.test.ts`, then `schema.ts` (migration 1 per Contracts, `user_version`, one transaction per migration) and `db.ts` (`openDb` creates the directory, `foreign_keys`, WAL; `getDb` from `DATABASE_PATH`; `resetDb`)
- [x] 3.3 `clock.ts`, `hooks.server.ts` (`init` opens the DB; on error log and `process.exit(1)`), `/healthz`, and the `LM_TEST`-guarded `/__test/reset`, `/__test/clock`, `/__test/seed` routes plus `e2e/helpers.ts` (`reset`, `seed`, `setClock`); write `Scenario: Health check returns 200` in `e2e/runtime.test.ts` first
- [x] 3.4 In `e2e/runtime.test.ts`, spawn `node build` on `$PORT + 1000` with a temp directory and write `Scenario: Port and database path come from the environment`, `Scenario: Missing database directory is created`, `Scenario: Migration failure exits non-zero`; run `PORT=<port> npm run proof:full` green

## 4. App shell and UI primitives

> unit: depends=1,2 · scope=S19 · files=src/app.css, src/routes/+layout.svelte, src/lib/components/ui/Button.svelte, src/lib/components/ui/Chip.svelte, src/lib/components/ui/Sheet.svelte, src/lib/components/ui/ConfirmDialog.svelte, src/lib/components/ui/EmptyState.svelte, src/lib/components/ui/AspectIcon.svelte, src/lib/components/ui/AspectTag.svelte, src/lib/components/ui/PageHeader.svelte, src/lib/components/shell/Sidebar.svelte, src/lib/components/shell/HomeList.svelte, src/routes/menu/+page.svelte, e2e/navigation.test.ts

- [x] 4.1 `src/app.css` imports the tokens and sets base type/background (light only); `+layout.svelte` renders the sidebar on desktop and a single column on phone, styled from the approved brief
- [x] 4.2 UI primitives in `src/lib/components/ui/` with the props from design.md Contracts, tokens only (no raw colours); `Sheet` is a bottom sheet on phone and a dialog on desktop
- [x] 4.3 Write `Scenario: Desktop shows a sidebar` and `Scenario: Phone home list shows the five lists` in `e2e/navigation.test.ts`, then `Sidebar`, `HomeList` and `/menu` (Things-style list, back link to `/menu` from `PageHeader` on phone)

## 5. Aspects and todos services

> unit: depends=3 · scope=S3,S4,S5,S6,S7,S8,S9 · files=src/lib/server/aspects.ts, src/lib/server/todos.ts, src/lib/server/aspects.test.ts, src/lib/server/todos.test.ts

- [x] 5.1 Write `Scenario: Duplicate aspect name is rejected`, then implement `listAspects`, `countAspects`, `createAspect`, `updateAspect`, `aspectUsage` (trimmed non-empty name, case-insensitive uniqueness, palette/icon keys validated)
- [x] 5.2 Write `Scenario: Deleting an aspect moves its todos and rules` and `Scenario: Rule follows its deleted aspect` (insert rules with plain SQL), then `deleteAspect` (`target-required` when in use, `only-aspect-in-use`, one transaction)
- [x] 5.3 Write `Scenario: Todo without an existing aspect is rejected`, `Scenario: Todo stores all optional fields`, `Scenario: Empty todo title is rejected`, then `createTodo` with targets backlog / sprint / day (active sprint read with plain SQL; `no-active-sprint`, `day-outside-sprint`) and `getTodo`
- [x] 5.4 Write `Scenario: Changing the aspect keeps sprint, status and day` and `Scenario: Deleting a recurring instance keeps its rule`, then `updateTodo`, `deleteTodo` and the checklist functions
- [x] 5.5 Write `Scenario: Backlog lists only todos not in a sprint, in order` and `Scenario: Overdue means due before today and not done`, then `listBacklog` and `listOverdue`

## 6. Sprint and recurring engine

> unit: depends=3 · scope=S10,S11,S12,S13,S17,S18 · files=src/lib/week.ts, src/lib/week.test.ts, src/lib/server/sprints.ts, src/lib/server/sprints.test.ts, src/lib/server/recurring.ts, src/lib/server/recurring.test.ts

Tests create aspects and todos with plain SQL (unit 5 runs in parallel).

- [x] 6.1 Write `Scenario: Sprint covers one ISO week in Europe/Berlin`, `Scenario: Week boundary across a DST change`, `Scenario: Target week is the current week before Sunday`, `Scenario: Target week on Sunday is next week`, then the rest of `week.ts`
- [x] 6.2 Write `Scenario: Start a sprint with zero todos`, `Scenario: Only one sprint can be active`, `Scenario: Planning is blocked while a review is pending`, `Scenario: Review is available from the sprint's Sunday`, `Scenario: Review is required from the Monday after`, then `sprintPhase`, `getActiveSprint`, `openPlanning`, `suggestedTodos`, `pullTodo`, `unpullTodo`, `startSprint`
- [x] 6.3 Write `Scenario: Moving back to the backlog clears day and status` and `Scenario: Unchecking done returns to To do`, then `listSprintTodos`, `listToday`, `addToActiveSprint`, `moveToBacklog`, `setStatus`, `toggleDone`, `setDay` (`completedAt` set/cleared)
- [x] 6.4 Write `Scenario: Open recurring instance is carried or dropped`, `Scenario: Done todos stay with the closed sprint`, `Scenario: Weeks away review only the last sprint`, then `reviewSummary` and `closeReview` (one transaction; new planning draft holds carried todos)
- [x] 6.5 Write `Scenario: Rule without weekdays is rejected`, `Scenario: Starting a sprint adds one instance per weekday`, `Scenario: Rule created mid-sprint fills the remaining days`, `Scenario: Editing a rule affects only future sprints`, `Scenario: Deleting a rule keeps existing instances`, then `recurring.ts` and its calls from `startSprint` and `createRule`

## 7. Aspects UI and onboarding

> unit: depends=4,5 · scope=S3,S4,S5 · files=src/routes/+layout.server.ts, src/routes/welcome/+page.svelte, src/routes/welcome/+page.server.ts, src/routes/aspects/+page.svelte, src/routes/aspects/+page.server.ts, src/lib/components/aspects/AspectForm.svelte, src/lib/components/aspects/DeleteAspectDialog.svelte, e2e/aspects.test.ts

- [x] 7.1 Write `Scenario: First run shows onboarding` and `Scenario: Onboarding creates the chosen aspects`, then the first-run redirect in `+layout.server.ts` and `/welcome` (Finch-style toggle rows + add custom; redirect to `/backlog`)
- [x] 7.2 Write `Scenario: Create an aspect with colour and icon`, `Scenario: Edit an aspect`, `Scenario: Empty aspect name is rejected inline`, then `/aspects` (list with todo counts) and `AspectForm` (name field with icon button, colour dots, icon grid — Linear/ChatGPT pattern)
- [x] 7.3 Write `Scenario: Delete confirmation asks for a target aspect`, `Scenario: Aspect without todos is deleted with a simple confirm`, `Scenario: Only aspect with todos cannot be deleted`, `Scenario: Deleting the last aspect returns to first run`, then `DeleteAspectDialog` and `?/delete`

## 8. Todo UI and backlog

> unit: depends=4,5,6 · scope=S6,S7,S8,S9,S12 · files=src/routes/todos/+page.server.ts, src/routes/todos/+page.svelte, src/routes/backlog/+page.svelte, src/routes/backlog/+page.server.ts, src/lib/components/todo/TodoRow.svelte, src/lib/components/todo/StatusControl.svelte, src/lib/components/todo/DayPicker.svelte, src/lib/components/todo/QuickAdd.svelte, src/lib/components/todo/TodoEditor.svelte, src/lib/components/todo/SprintPrompt.svelte, e2e/todos.test.ts, e2e/backlog.test.ts

- [x] 8.1 `/todos` form actions per design.md Contracts (validation via the services, `fail(400, { error, field, values })`); `/todos` GET redirects to `/backlog`
- [x] 8.2 `TodoRow` (Things two-line row: aspect as grey second line, tiny metadata icons, priority, due date with "Nd left" / red overdue marker at the right edge, done struck through, test ids from Contracts), `StatusControl`, `DayPicker`, `SprintPrompt`
- [x] 8.3 Write `Scenario: Quick add creates a todo in the backlog` and `Scenario: Past due date is allowed and shown overdue`, then `QuickAdd` (title field + aspect/priority/due chips, no parsing) and `/backlog`
- [x] 8.4 Write `Scenario: Edit every field of a todo`, `Scenario: Checklist items are added, renamed, toggled and deleted`, `Scenario: Deleting a todo asks for confirmation`, then `TodoEditor` (expand-in-place card on desktop, sheet on phone; delete via `ConfirmDialog`)
- [x] 8.5 Write `Scenario: Backlog is grouped by aspect`, `Scenario: Filter the backlog to one aspect`, `Scenario: Empty backlog shows an empty state`, `Scenario: Overdue todos are marked in the backlog`, `Scenario: Add a backlog todo to the active sprint`, then finish `/backlog` (groups, `?aspect=` filter, empty state, "Add to sprint" row action during an active sprint)

## 9. Recurring rules UI

> unit: depends=4,6 · scope=S18 · files=src/routes/recurring/+page.svelte, src/routes/recurring/+page.server.ts, src/lib/components/recurring/RuleForm.svelte, e2e/recurring.test.ts

- [x] 9.1 Write `Scenario: Create and list a recurring rule`, then `/recurring` (list with aspect + weekday chips) and `RuleForm` (title, aspect, weekday toggles, notes, priority, checklist template; inline `weekdays-required` error), edit and delete with confirm

## 10. Planning and review UI

> unit: depends=4,6,8 · scope=S10,S11,S12,S17 · files=src/routes/sprint/plan/+page.svelte, src/routes/sprint/plan/+page.server.ts, src/routes/sprint/review/+page.svelte, src/routes/sprint/review/+page.server.ts, e2e/planning.test.ts, e2e/review.test.ts

- [x] 10.1 Write `Scenario: First run can plan immediately`, `Scenario: Pull todos by drag and start the sprint`, `Scenario: Pull todos with the picker on touch`, then `/sprint/plan` (desktop two-pane: backlog rail ↔ sprint grouped by aspect with native drag; picker on touch; week date range in the header; start button)
- [x] 10.2 Write `Scenario: Due-this-week todos are suggested pre-marked`, `Scenario: Unmarked suggestion stays in the backlog`, `Scenario: No suggestion section when nothing is due`, then the suggestion section and `?/start` with `suggested`
- [x] 10.3 Write `Scenario: Review carries over and returns open todos` and `Scenario: All-done review closes in one tap`, then `/sprint/review` (done struck through and collapsible above open rows; per-row carry/backlog or carry/drop toggle defaulting to carry; counted CTA, e.g. "Carry 4 · return 2"); closing redirects to `/sprint/plan`

## 11. Sprint views

> unit: depends=4,6,8 · scope=S6,S12,S13,S14,S15,S16,S17,S18 · files=src/routes/sprint/+page.svelte, src/routes/sprint/+page.server.ts, src/lib/components/sprint/AspectView.svelte, src/lib/components/sprint/BoardView.svelte, src/lib/components/sprint/WeekView.svelte, src/lib/components/sprint/ViewSwitch.svelte, e2e/sprint-views.test.ts

- [x] 11.1 Write `Scenario: Sprint screens prompt to review when pending`, `Scenario: Sprint by aspect groups todos with status`, `Scenario: Aspects without sprint todos are hidden`, `Scenario: Empty sprint points to the backlog`, `Scenario: Todo created from a sprint view joins the active sprint`, then `/sprint` load (phase → `SprintPrompt`), `ViewSwitch` and `AspectView` with `QuickAdd` target sprint
- [x] 11.2 Write `Scenario: Change status from every sprint view` and `Scenario: Checkbox toggles done`, then wire `StatusControl` and the checkbox into all three views
- [x] 11.3 Write `Scenario: Move a todo between board columns by drag`, `Scenario: Move a todo between board columns with the status menu on touch`, `Scenario: Empty board column shows a placeholder`, then `BoardView` (aspect colour/icon tag per card; drag only under `(hover: hover) and (pointer: fine)`)
- [x] 11.4 Write `Scenario: Assign a todo to a day by drag`, `Scenario: Assign a todo to a day with the day picker on touch`, `Scenario: Day picker offers only days of the active sprint`, `Scenario: Today is highlighted in the week view`, `Scenario: Phone shows one day at a time`, `Scenario: Done todos stay on their day`, `Scenario: Todo created in a day column is assigned to that day`, `Scenario: Recurring instances appear in the week view`, then `WeekView` (Mon–Sun + Unscheduled, per-column `QuickAdd` target day, one day at a time on phone)

## 12. Today view

> unit: depends=4,6,8 · scope=S21 · files=src/routes/+page.svelte, src/routes/+page.server.ts, e2e/today.test.ts

- [x] 12.1 Write `Scenario: Today shows today's sprint todos and overdue todos`, `Scenario: Status toggle on Today`, `Scenario: Quick add on Today adds to the sprint on today`, then `/` (replaces the placeholder; groups by aspect, `QuickAdd` target day = today)
- [x] 12.2 Write `Scenario: Today without an active sprint prompts to plan`, `Scenario: Today with a pending review prompts to review`, `Scenario: Nothing today shows a calm empty state`, `Scenario: Sunday after the review prompts to plan next week`, then the phase prompts and the empty state linking to `/sprint?view=week`

## 13. Responsive pass and end-to-end journey

> unit: depends=7,8,9,10,11,12 · scope=S19,S20,S22 · files=e2e/responsive.test.ts, e2e/journey.test.ts, e2e/runtime.test.ts, README.md, plus style fixes in any `.svelte` file the tests expose

- [ ] 13.1 Write `Scenario: Every screen fits 375 px without horizontal scroll` (screenshot per screen to `test-results/shots/`) and `Scenario: Phone home list drills into each list`, then fix any overflow or broken back link they expose
- [ ] 13.2 Write `Scenario: Touch-only device completes the sprint ritual` (touch phone viewport, no drag) and fix what it exposes
- [ ] 13.3 Write `Scenario: Data survives a restart` in `e2e/runtime.test.ts` (create an aspect through `/aspects?/create`, restart `node build` on the same `DATABASE_PATH`, aspect still listed)
- [ ] 13.4 Write a desktop journey test "Done-when journey" in `e2e/journey.test.ts` (onboarding → capture → plan → work in all three views → review → plan next, with a recurring rule appearing on its day), with desktop screenshots; run `PORT=<port> npm run proof:full` green
- [ ] 13.5 Write `README.md` per `Requirement: Setup README` (setup incl. Node >= 22.5 and `npx playwright install chromium`; scripts `dev`, `build`, `check`, `proof`, `proof:full`; `node build`; env vars `PORT`, `DATABASE_PATH` (default `./data/life-manager.db`), `LM_TEST` (test hooks only, never in production))
