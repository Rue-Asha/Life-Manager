verified-at: 4ebe184

## Layer 1 — `PORT=4700 npm run proof:full` (green, exit 0)

- `npm run check`: svelte-check 433 files, 0 errors, 0 warnings (svelte-kit sync prints a `config_option_deprecated_alias` notice for `alias: { $lib }` in `vite.config.ts`)
- `npm run build`: ok
- `npm run test:unit`: 8 files, 68 tests passed
- `npm run test:e2e`: 89 passed

```
  ✓  71 e2e/today.test.ts:27:1 › Scenario: Today shows today's sprint todos and overdue todos (118ms)
  ✓  72 e2e/today.test.ts:55:1 › An overdue todo planned for today is listed once, under Overdue (118ms)
  ✓  73 e2e/today.test.ts:67:1 › Scenario: Status toggle on Today (253ms)
  ✓  74 e2e/today.test.ts:94:1 › Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox (188ms)
  ✓  75 e2e/today.test.ts:114:1 › Scenario: Quick add on Today adds to the sprint on today (483ms)
  ✓  76 e2e/today.test.ts:134:1 › No quick add on the Sunday before next week's sprint starts (92ms)
  ✓  77 e2e/today.test.ts:143:1 › Scenario: Today without an active sprint prompts to plan (112ms)
  ✓  78 e2e/today.test.ts:155:1 › Scenario: Today with a pending review prompts to review (137ms)
  ✓  79 e2e/today.test.ts:179:1 › Scenario: Nothing today shows a calm empty state (104ms)
  ✓  80 e2e/today.test.ts:197:1 › Scenario: Sunday after the review prompts to plan next week (253ms)
  ✓  81 e2e/todos.test.ts:28:1 › GET /todos redirects to the backlog (105ms)
  ✓  82 e2e/todos.test.ts:34:1 › Scenario: Quick add creates a todo in the backlog (451ms)
  ✓  83 e2e/todos.test.ts:53:1 › Quick add rejects an empty title inline (403ms)
  ✓  84 e2e/todos.test.ts:63:1 › Scenario: Past due date is allowed and shown overdue (427ms)
  ✓  85 e2e/todos.test.ts:74:1 › Quick add on phone opens a sheet (573ms)
  ✓  86 e2e/todos.test.ts:92:1 › Scenario: Edit every field of a todo (663ms)
  ✓  87 e2e/todos.test.ts:127:1 › Scenario: Checklist items are added, renamed, toggled and deleted (823ms)
  ✓  88 e2e/todos.test.ts:163:1 › Scenario: Deleting a todo asks for confirmation (1.6s)
  ✓  89 e2e/todos.test.ts:184:1 › Editing on phone uses a sheet (580ms)

  89 passed (33.2s)
```

## Layer 2 — spec coverage

104 scenarios: unit 32/32 ✓ · e2e 66/66 ✓ · manual 6 · gaps 0.
Each unit/e2e row was matched by its exact `Scenario: <title>` in the passed lines of the run above.

| Capability | Scenario | proof | Evidence |
|---|---|---|---|
| app-runtime | Unit suite opens node:sqlite | unit | `src/lib/sqlite.test.ts` › "Scenario: Unit suite opens node:sqlite" ✓ |
| app-runtime | Built app serves a page in e2e | e2e | `e2e/smoke.test.ts` › "Scenario: Built app serves a page in e2e" ✓ |
| app-runtime | Dev server serves the app | manual (starting the dev server is the Gate 2 `run` step itself) | manual — Gate 2 checklist |
| app-runtime | Port and database path come from the environment | e2e | `e2e/runtime.test.ts` › "Scenario: Port and database path come from the environment" ✓ |
| app-runtime | Missing database directory is created | e2e | `e2e/runtime.test.ts` › "Scenario: Missing database directory is created" ✓ |
| app-runtime | Fresh database is migrated | unit | `src/lib/server/db.test.ts` › "Scenario: Fresh database is migrated" ✓ |
| app-runtime | Migration failure exits non-zero | e2e | `e2e/runtime.test.ts` › "Scenario: Migration failure exits non-zero" ✓ |
| app-runtime | Health check returns 200 | e2e | `e2e/runtime.test.ts` › "Scenario: Health check returns 200" ✓ |
| app-runtime | Data survives a restart | e2e | `e2e/runtime.test.ts` › "Scenario: Data survives a restart" ✓ |
| app-runtime | Package declares the Node engine | unit | `src/lib/engines.test.ts` › "Scenario: Package declares the Node engine" ✓ |
| app-runtime | README documents setup, scripts and env vars | manual (documentation, judged by reading it) | manual — Gate 2 checklist |
| aspects | First run shows onboarding | e2e | `e2e/aspects.test.ts` › "Scenario: First run shows onboarding" ✓ |
| aspects | Onboarding creates the chosen aspects | e2e | `e2e/aspects.test.ts` › "Scenario: Onboarding creates the chosen aspects" ✓ |
| aspects | Todo without an existing aspect is rejected | unit | `src/lib/server/todos.test.ts` › "Scenario: Todo without an existing aspect is rejected" ✓ |
| aspects | Deleting the last aspect returns to first run | e2e | `e2e/aspects.test.ts` › "Scenario: Deleting the last aspect returns to first run" ✓ |
| aspects | Create an aspect with colour and icon | e2e | `e2e/aspects.test.ts` › "Scenario: Create an aspect with colour and icon" ✓ |
| aspects | Edit an aspect | e2e | `e2e/aspects.test.ts` › "Scenario: Edit an aspect" ✓ |
| aspects | Empty aspect name is rejected inline | e2e | `e2e/aspects.test.ts` › "Scenario: Empty aspect name is rejected inline" ✓ |
| aspects | Duplicate aspect name is rejected | unit | `src/lib/server/aspects.test.ts` › "Scenario: Duplicate aspect name is rejected" ✓ |
| aspects | Deleting an aspect moves its todos and rules | unit | `src/lib/server/aspects.test.ts` › "Scenario: Deleting an aspect moves its todos and rules" ✓ |
| aspects | Delete confirmation asks for a target aspect | e2e | `e2e/aspects.test.ts` › "Scenario: Delete confirmation asks for a target aspect" ✓ |
| aspects | Aspect without todos is deleted with a simple confirm | e2e | `e2e/aspects.test.ts` › "Scenario: Aspect without todos is deleted with a simple confirm" ✓ |
| aspects | Only aspect with todos cannot be deleted | e2e | `e2e/aspects.test.ts` › "Scenario: Only aspect with todos cannot be deleted" ✓ |
| backlog | Backlog lists only todos not in a sprint, in order | unit | `src/lib/server/todos.test.ts` › "Scenario: Backlog lists only todos not in a sprint, in order" ✓ |
| backlog | Backlog is grouped by aspect | e2e | `e2e/backlog.test.ts` › "Scenario: Backlog is grouped by aspect" ✓ |
| backlog | Filter the backlog to one aspect | e2e | `e2e/backlog.test.ts` › "Scenario: Filter the backlog to one aspect" ✓ |
| backlog | Empty backlog shows an empty state | e2e | `e2e/backlog.test.ts` › "Scenario: Empty backlog shows an empty state" ✓ |
| backlog | Overdue todos are marked in the backlog | e2e | `e2e/backlog.test.ts` › "Scenario: Overdue todos are marked in the backlog" ✓ |
| design-direction | Brief cites a reference for every decision | manual (taste document, judged by Rue) | manual — Gate 2 checklist |
| design-direction | Style tile renders from the tokens | manual (visual judgement) | manual — Gate 2 checklist |
| design-direction | Feature UI waits for the approved style tile | manual (human taste gate, recorded by the orchestrator) | manual — Gate 2 checklist |
| navigation | Desktop shows a sidebar | e2e | `e2e/navigation.test.ts` › "Scenario: Desktop shows a sidebar" ✓ |
| navigation | Phone home list shows the five lists | e2e | `e2e/navigation.test.ts` › "Scenario: Phone home list shows the five lists" ✓ |
| navigation | Phone home list drills into each list | e2e | `e2e/responsive.test.ts` › "Scenario: Phone home list drills into each list" ✓ |
| navigation | Every screen fits 375 px without horizontal scroll | e2e | `e2e/responsive.test.ts` › "Scenario: Every screen fits 375 px without horizontal scroll" ✓ |
| navigation | Touch-only device completes the sprint ritual | e2e | `e2e/responsive.test.ts` › "Scenario: Touch-only device completes the sprint ritual" ✓ |
| navigation | Visual result matches the approved direction | manual (visual judgement on real hardware) | manual — Gate 2 checklist |
| recurring | Create and list a recurring rule | e2e | `e2e/recurring.test.ts` › "Scenario: Create and list a recurring rule" ✓ |
| recurring | Rule without weekdays is rejected | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule without weekdays is rejected" ✓ |
| recurring | Editing a rule affects only future sprints | unit | `src/lib/server/recurring.test.ts` › "Scenario: Editing a rule affects only future sprints" ✓ |
| recurring | Deleting a rule keeps existing instances | unit | `src/lib/server/recurring.test.ts` › "Scenario: Deleting a rule keeps existing instances" ✓ |
| recurring | Rule follows its deleted aspect | unit | `src/lib/server/aspects.test.ts` › "Scenario: Rule follows its deleted aspect" ✓ |
| recurring | Starting a sprint adds one instance per weekday | unit | `src/lib/server/recurring.test.ts` › "Scenario: Starting a sprint adds one instance per weekday" ✓ |
| recurring | Rule created mid-sprint fills the remaining days | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule created mid-sprint fills the remaining days" ✓ |
| recurring | Recurring instances appear in the week view | e2e | `e2e/sprint-views.test.ts` › "Scenario: Recurring instances appear in the week view" ✓ |
| sprint-lifecycle | Sprint covers one ISO week in Europe/Berlin | unit | `src/lib/week.test.ts` › "Scenario: Sprint covers one ISO week in Europe/Berlin" ✓ |
| sprint-lifecycle | Week boundary across a DST change | unit | `src/lib/week.test.ts` › "Scenario: Week boundary across a DST change" ✓ |
| sprint-lifecycle | Target week is the current week before Sunday | unit | `src/lib/week.test.ts` › "Scenario: Target week is the current week before Sunday" ✓ |
| sprint-lifecycle | Target week on Sunday is next week | unit | `src/lib/week.test.ts` › "Scenario: Target week on Sunday is next week" ✓ |
| sprint-lifecycle | Only one sprint can be active | unit | `src/lib/server/sprints.test.ts` › "Scenario: Only one sprint can be active" ✓ |
| sprint-lifecycle | First run can plan immediately | e2e | `e2e/planning.test.ts` › "Scenario: First run can plan immediately" ✓ |
| sprint-lifecycle | Pull todos by drag and start the sprint | e2e | `e2e/planning.test.ts` › "Scenario: Pull todos by drag and start the sprint" ✓ |
| sprint-lifecycle | Pull todos with the picker on touch | e2e | `e2e/planning.test.ts` › "Scenario: Pull todos with the picker on touch" ✓ |
| sprint-lifecycle | Start a sprint with zero todos | unit | `src/lib/server/sprints.test.ts` › "Scenario: Start a sprint with zero todos" ✓ |
| sprint-lifecycle | Planning is blocked while a review is pending | unit | `src/lib/server/sprints.test.ts` › "Scenario: Planning is blocked while a review is pending" ✓ |
| sprint-lifecycle | Due-this-week todos are suggested pre-marked | e2e | `e2e/planning.test.ts` › "Scenario: Due-this-week todos are suggested pre-marked" ✓ |
| sprint-lifecycle | Unmarked suggestion stays in the backlog | e2e | `e2e/planning.test.ts` › "Scenario: Unmarked suggestion stays in the backlog" ✓ |
| sprint-lifecycle | No suggestion section when nothing is due | e2e | `e2e/planning.test.ts` › "Scenario: No suggestion section when nothing is due" ✓ |
| sprint-lifecycle | Add a backlog todo to the active sprint | e2e | `e2e/backlog.test.ts` › "Scenario: Add a backlog todo to the active sprint" ✓ |
| sprint-lifecycle | Moving back to the backlog clears day and status | unit | `src/lib/server/sprints.test.ts` › "Scenario: Moving back to the backlog clears day and status" ✓ |
| sprint-lifecycle | Review is available from the sprint's Sunday | unit | `src/lib/server/sprints.test.ts` › "Scenario: Review is available from the sprint's Sunday" ✓ |
| sprint-lifecycle | Review is required from the Monday after | unit | `src/lib/server/sprints.test.ts` › "Scenario: Review is required from the Monday after" ✓ |
| sprint-lifecycle | Review carries over and returns open todos | e2e | `e2e/review.test.ts` › "Scenario: Review carries over and returns open todos" ✓ |
| sprint-lifecycle | Open recurring instance is carried or dropped | unit | `src/lib/server/sprints.test.ts` › "Scenario: Open recurring instance is carried or dropped" ✓ |
| sprint-lifecycle | Done todos stay with the closed sprint | unit | `src/lib/server/sprints.test.ts` › "Scenario: Done todos stay with the closed sprint" ✓ |
| sprint-lifecycle | All-done review closes in one tap | e2e | `e2e/review.test.ts` › "Scenario: All-done review closes in one tap" ✓ |
| sprint-lifecycle | Weeks away review only the last sprint | unit | `src/lib/server/sprints.test.ts` › "Scenario: Weeks away review only the last sprint" ✓ |
| sprint-views | Change status from every sprint view | e2e | `e2e/sprint-views.test.ts` › "Scenario: Change status from every sprint view" ✓ |
| sprint-views | Checkbox toggles done | e2e | `e2e/sprint-views.test.ts` › "Scenario: Checkbox toggles done" ✓ |
| sprint-views | Unchecking done returns to To do | unit | `src/lib/server/sprints.test.ts` › "Scenario: Unchecking done returns to To do" ✓ |
| sprint-views | Sprint screens prompt to review when pending | e2e | `e2e/sprint-views.test.ts` › "Scenario: Sprint screens prompt to review when pending" ✓ |
| sprint-views | Sunday shows the review prompt above the sprint | e2e | `e2e/sprint-views.test.ts` › "Scenario: Sunday shows the review prompt above the sprint" ✓ |
| sprint-views | Sprint by aspect groups todos with status | e2e | `e2e/sprint-views.test.ts` › "Scenario: Sprint by aspect groups todos with status" ✓ |
| sprint-views | Aspects without sprint todos are hidden | e2e | `e2e/sprint-views.test.ts` › "Scenario: Aspects without sprint todos are hidden" ✓ |
| sprint-views | Empty sprint points to the backlog | e2e | `e2e/sprint-views.test.ts` › "Scenario: Empty sprint points to the backlog" ✓ |
| sprint-views | Move a todo between board columns by drag | e2e | `e2e/sprint-views.test.ts` › "Scenario: Move a todo between board columns by drag" ✓ |
| sprint-views | Move a todo between board columns with the status menu on touch | e2e | `e2e/sprint-views.test.ts` › "Scenario: Move a todo between board columns with the status menu on touch" ✓ |
| sprint-views | Empty board column shows a placeholder | e2e | `e2e/sprint-views.test.ts` › "Scenario: Empty board column shows a placeholder" ✓ |
| sprint-views | Assign a todo to a day by drag | e2e | `e2e/sprint-views.test.ts` › "Scenario: Assign a todo to a day by drag" ✓ |
| sprint-views | Assign a todo to a day with the day picker on touch | e2e | `e2e/sprint-views.test.ts` › "Scenario: Assign a todo to a day with the day picker on touch" ✓ |
| sprint-views | Day picker offers only days of the active sprint | e2e | `e2e/sprint-views.test.ts` › "Scenario: Day picker offers only days of the active sprint" ✓ |
| sprint-views | Today is highlighted in the week view | e2e | `e2e/sprint-views.test.ts` › "Scenario: Today is highlighted in the week view" ✓ |
| sprint-views | Phone shows one day at a time | e2e | `e2e/sprint-views.test.ts` › "Scenario: Phone shows one day at a time" ✓ |
| sprint-views | Done todos stay on their day | e2e | `e2e/sprint-views.test.ts` › "Scenario: Done todos stay on their day" ✓ |
| today | Today shows today's sprint todos and overdue todos | e2e | `e2e/today.test.ts` › "Scenario: Today shows today's sprint todos and overdue todos" ✓ |
| today | Overdue means due before today and not done | unit | `src/lib/server/todos.test.ts` › "Scenario: Overdue means due before today and not done" ✓ |
| today | Status toggle on Today | e2e | `e2e/today.test.ts` › "Scenario: Status toggle on Today" ✓ |
| today | Overdue todos outside the sprint offer the sprint instead of a checkbox | e2e | `e2e/today.test.ts` › "Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox" ✓ |
| today | Quick add on Today adds to the sprint on today | e2e | `e2e/today.test.ts` › "Scenario: Quick add on Today adds to the sprint on today" ✓ |
| today | Today without an active sprint prompts to plan | e2e | `e2e/today.test.ts` › "Scenario: Today without an active sprint prompts to plan" ✓ |
| today | Today with a pending review prompts to review | e2e | `e2e/today.test.ts` › "Scenario: Today with a pending review prompts to review" ✓ |
| today | Nothing today shows a calm empty state | e2e | `e2e/today.test.ts` › "Scenario: Nothing today shows a calm empty state" ✓ |
| today | Sunday after the review prompts to plan next week | e2e | `e2e/today.test.ts` › "Scenario: Sunday after the review prompts to plan next week" ✓ |
| todos | Quick add creates a todo in the backlog | e2e | `e2e/todos.test.ts` › "Scenario: Quick add creates a todo in the backlog" ✓ |
| todos | Todo stores all optional fields | unit | `src/lib/server/todos.test.ts` › "Scenario: Todo stores all optional fields" ✓ |
| todos | Todo created from a sprint view joins the active sprint | e2e | `e2e/sprint-views.test.ts` › "Scenario: Todo created from a sprint view joins the active sprint" ✓ |
| todos | Todo created in a day column is assigned to that day | e2e | `e2e/sprint-views.test.ts` › "Scenario: Todo created in a day column is assigned to that day" ✓ |
| todos | Empty todo title is rejected | unit | `src/lib/server/todos.test.ts` › "Scenario: Empty todo title is rejected" ✓ |
| todos | Past due date is allowed and shown overdue | e2e | `e2e/todos.test.ts` › "Scenario: Past due date is allowed and shown overdue" ✓ |
| todos | Edit every field of a todo | e2e | `e2e/todos.test.ts` › "Scenario: Edit every field of a todo" ✓ |
| todos | Checklist items are added, renamed, toggled and deleted | e2e | `e2e/todos.test.ts` › "Scenario: Checklist items are added, renamed, toggled and deleted" ✓ |
| todos | Changing the aspect keeps sprint, status and day | unit | `src/lib/server/todos.test.ts` › "Scenario: Changing the aspect keeps sprint, status and day" ✓ |
| todos | Deleting a todo asks for confirmation | e2e | `e2e/todos.test.ts` › "Scenario: Deleting a todo asks for confirmation" ✓ |
| todos | Deleting a recurring instance keeps its rule | unit | `src/lib/server/todos.test.ts` › "Scenario: Deleting a recurring instance keeps its rule" ✓ |

## Manual checklist (Gate 2)

Start: `npm run dev` → http://localhost:5173 (empty DB redirects to `/welcome`).

- [ ] Dev server serves the app — after `npm run dev`, http://localhost:5173 loads (lands on `/welcome` with an empty DB).
- [ ] Visual result matches the approved direction — walk Welcome → Today → Backlog → Plan → Sprint (aspect/board/week) → Review on your phone and on desktop; compare with `design/shots/final-*.png`.
- [ ] Brief cites a reference for every decision — skim `design/brief.md`: each decision (colour, type, spacing, row layout, navigation, empty states, motion) has a Mobbin URL; no dark mode, shortcuts or NL parsing.
- [ ] Style tile renders from the tokens — open `design/style-tile.html` in a browser: palette, type scale, aspect colours/icons, sample components.
- [ ] Feature UI waits for the approved style tile — confirm the style-tile approval was recorded before feature units started (orchestrator record, `flow.yaml` gate1 2026-10-03).
- [ ] README documents setup, scripts and env vars — read `README.md`: setup, `dev`/`build`/`check`/`proof`/`proof:full`, `node build`, `PORT`/`DATABASE_PATH`/`LM_TEST` with defaults.

## Diffstat

`git diff --stat 4b825dc642cb6eb9a060e54bf8d69288fbee4904 flow/build-life-manager` (at 4ebe184, before this commit):

- total: 224 files changed, 20316 insertions(+)
- src/: 77 files changed, 8270 insertions(+)
- e2e/: 14 files changed, 2069 insertions(+)
- design/: 76 files changed, 4851 insertions(+)
- openspec/: 39 files changed, 1765 insertions(+)
- other (root config, README, lockfile): 18 files changed, 3361 insertions(+)

## Screenshots

From this e2e run (copied to `shots/`):
- `shots/aspects-375.png`
- `shots/backlog-375.png`
- `shots/journey-backlog-1280.png`
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
- `shots/recurring-375.png`
- `shots/review-375.png`
- `shots/sprint-aspect-375.png`
- `shots/sprint-board-375.png`
- `shots/sprint-week-375.png`
- `shots/today-375.png`
- `shots/welcome-375.png`

Committed references (not copied):
- `design/shots/final-aspects-1280.png`
- `design/shots/final-aspects-375.png`
- `design/shots/final-backlog-1280.png`
- `design/shots/final-backlog-375.png`
- `design/shots/final-plan-1280.png`
- `design/shots/final-plan-375.png`
- `design/shots/final-recurring-1280.png`
- `design/shots/final-recurring-375.png`
- `design/shots/final-review-1280.png`
- `design/shots/final-review-375.png`
- `design/shots/final-sprint-aspect-1280.png`
- `design/shots/final-sprint-aspect-375.png`
- `design/shots/final-sprint-board-1280.png`
- `design/shots/final-sprint-board-375.png`
- `design/shots/final-sprint-week-1280.png`
- `design/shots/final-sprint-week-375.png`
- `design/shots/final-today-1280.png`
- `design/shots/final-today-375.png`
- `design/shots/final-welcome-1280.png`
- `design/shots/final-welcome-375.png`
