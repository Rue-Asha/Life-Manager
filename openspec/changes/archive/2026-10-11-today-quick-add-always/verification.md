verified-at: 6f7c0a5

## Layer 1 — proof-full (green)

```
  ✓  259 e2e/uni.test.ts:550:1 › Scenario: Grades are shown on the overview (130ms)
  ✓  260 e2e/uni.test.ts:572:1 › Scenario: No grades shows a dash (128ms)
  ✓  261 e2e/uni.test.ts:585:1 › Scenario: Deadline overview sits in the rail at 1280 (177ms)
  ✓  262 e2e/uni.test.ts:623:1 › Scenario: Nothing due shows an empty line (138ms)
  262 passed (2.0m)
```

Unit: 11 files, 152 tests passed. package.json and package-lock.json: version 0.3.0.

## Layer 2 — spec coverage

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
| Backlog todos due today are listed only when today is not a sprint day | e2e | `e2e/today.test.ts` › "Scenario: Backlog todos due today are listed only when today is not a sprint day" ✓ |
| Due-today backlog todos offer the sprint instead of a checkbox | e2e | `e2e/today.test.ts` › "Scenario: Due-today backlog todos offer the sprint instead of a checkbox" ✓ |
| A fallback todo is overdue the next day | unit | `src/lib/server/todos.test.ts` › "Scenario: A fallback todo is overdue the next day" ✓ |
| Today without an active sprint prompts to plan | e2e | `e2e/today.test.ts` › "Scenario: Today without an active sprint prompts to plan" ✓ |
| Today with a pending review prompts to review | e2e | `e2e/today.test.ts` › "Scenario: Today with a pending review prompts to review" ✓ |
| Nothing today shows a calm empty state | e2e | `e2e/today.test.ts` › "Scenario: Nothing today shows a calm empty state" ✓ |
| Sunday after the review prompts to plan next week | e2e | `e2e/today.test.ts` › "Scenario: Sunday after the review prompts to plan next week" ✓ |

Gaps: none.

## Manual checklist

- `npm run dev` → http://localhost:5173 with no sprint: Today shows "Add a todo"; add one, it appears under its aspect and survives a reload.
- With an active sprint: quick-add on Today lands in the sprint as To do on today.
- At phone width: tap "Add a todo" on Today, the sheet opens.

## Diffstat (`git diff --stat origin/main...flow/today-quick-add-always`)

```
 e2e/today.test.ts                                  | 173 ++++++++++++++++++++-
 .../changes/today-quick-add-always/.openspec.yaml  |   2 +
 openspec/changes/today-quick-add-always/flow.yaml  |   6 +
 .../changes/today-quick-add-always/proposal.md     |  44 ++++++
 openspec/changes/today-quick-add-always/scope.md   |  45 ++++++
 .../today-quick-add-always/specs/today/spec.md     |  99 +++++++++++++
 openspec/changes/today-quick-add-always/tasks.md   |  12 ++
 .../changes/today-quick-add-always/verification.md |  68 ++++++++
 package-lock.json                                  |   4 +-
 package.json                                       |   2 +-
 src/lib/components/todo/QuickAdd.svelte            |   9 +-
 src/lib/server/todos.test.ts                       |  21 +++
 src/lib/server/todos.ts                            |  11 ++
 src/routes/+page.server.ts                         |   8 +-
 src/routes/+page.svelte                            |  25 +++-
 15 files changed, 510 insertions(+), 19 deletions(-)
```

## Screenshots (not copied into the repo)

Verifier run, in `/home/Rue/Repos/Life-Manager-wt-today-quick-add/test-results/shots/`: `today-1280.png`, `today-375.png`, `journey-today-1280.png`.

## Review

Reviewer (fresh context, round 1): no weakened tests without spec reason, no spec mismatch, no correctness findings. Two weak tests:

- `e2e/today.test.ts` "Scenario: Quick add on Today adds to the sprint on today" never asserted status To do → fixed (cab6bb2): asserts `data-status="todo"` before and after reload, watched red first.
- `e2e/today.test.ts` "Scenario: Quick add on Today outside the sprint's days saves a backlog todo due today" covered only the Sunday case → fixed (6f7c0a5): extended with the review-required phase, watched red first.

Round 2 verify at 6f7c0a5: proof-full green, no gaps.
