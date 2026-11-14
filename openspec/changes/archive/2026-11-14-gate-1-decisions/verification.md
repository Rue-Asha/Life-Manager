verified-at: 98b7766

## Layer 1: proof:full (green, exit 0)
```
  ✓  332 e2e/uni.test.ts:169:1 › Scenario: No semesters shows an empty state (156ms)
  ✓  333 e2e/uni.test.ts:178:1 › Scenario: Semester without classes offers New class (163ms)
  ✓  334 e2e/uni.test.ts:192:1 › Scenario: Phone shows one class card per row (167ms)
  ✓  335 e2e/uni.test.ts:217:1 › Scenario: Wide desktop class grid fills the content column (237ms)
  ✓  336 e2e/uni.test.ts:249:1 › Scenario: Card shows the class summary (176ms)
  ✓  337 e2e/uni.test.ts:292:1 › Scenario: Exam today and past exams (222ms)
  ✓  338 e2e/uni.test.ts:310:1 › Scenario: Sparse card keeps the row height (297ms)
  ✓  339 e2e/uni.test.ts:341:1 › Scenario: New semester appears among the active ones (315ms)
  ✓  340 e2e/uni.test.ts:359:1 › Scenario: Rename a semester (409ms)
  ✓  341 e2e/uni.test.ts:377:1 › Scenario: Add a class from the semester section (456ms)
  ✓  342 e2e/uni.test.ts:415:1 › Scenario: Field errors show on the class form (370ms)
  ✓  343 e2e/uni.test.ts:434:1 › Scenario: Archiving with open todos asks for confirmation (694ms)
  ✓  344 e2e/uni.test.ts:468:1 › Scenario: Cancelling the archive warning changes nothing (572ms)
  ✓  345 e2e/uni.test.ts:488:1 › Scenario: Archiving without open todos needs no confirmation (305ms)
  ✓  346 e2e/uni.test.ts:504:1 › Scenario: Deleting a semester asks for confirmation naming counts (1.6s)
  ✓  347 e2e/uni.test.ts:536:1 › Scenario: Deleting an empty semester uses a plain confirm (1.6s)
  ✓  348 e2e/uni.test.ts:552:1 › Scenario: Grades are shown on the overview (298ms)
  ✓  349 e2e/uni.test.ts:574:1 › Scenario: No grades shows a dash (175ms)

  349 passed (3.0m)
```
vitest: 26 files, 336 tests passed (also in the proof:full log).

## Layer 2: coverage

| Scenario | proof | Evidence |
|---|---|---|
| README documents setup, scripts and env vars | manual (documentation, judged by reading it) | manual checklist |
| First run shows onboarding | e2e | `e2e/aspects.test.ts:29:1 › Scenario: First run shows onboarding` ✓ |
| Onboarding creates the chosen aspects | e2e | `e2e/aspects.test.ts:44:1 › Scenario: Onboarding creates the chosen aspects` ✓ |
| Todo without an existing aspect is rejected | unit | `src/lib/server/todos.test.ts > createTodo > Scenario: Todo without an existing aspect is rejected` ✓ |
| Deleting the last aspect returns to first run | e2e | `e2e/aspects.test.ts:201:1 › Scenario: Deleting the last aspect returns to first run` ✓ |
| Existing presets are reported as existing | unit | `src/routes/welcome/page.server.test.ts > welcome presets > Scenario: Existing presets are reported as existing` ✓ |
| Submitting an existing preset creates nothing and does not fail | unit | `src/routes/welcome/page.server.test.ts > welcome create > Scenario: Submitting an existing preset creates nothing and does not fail` ✓ |
| Only existing presets selected is not a duplicate error | unit | `src/routes/welcome/page.server.test.ts > welcome create > Scenario: Only existing presets selected is not a duplicate error` ✓ |
| A custom name equal to an existing aspect is still a duplicate | unit | `src/routes/welcome/page.server.test.ts > welcome create > Scenario: A custom name equal to an existing aspect is still a duplicate` ✓ |
| Reordering persists | unit | `src/lib/server/aspects.test.ts > aspects > order > Scenario: Reordering persists` ✓ |
| A list that is not the full set is rejected | unit | `src/lib/server/aspects.test.ts > aspects > order > Scenario: A list that is not the full set is rejected` ✓ |
| New aspects go last after a reorder | unit | `src/lib/server/aspects.test.ts > aspects > order > Scenario: New aspects go last after a reorder` ✓ |
| Deleting an aspect keeps the others' order | unit | `src/lib/server/aspects.test.ts > aspects > order > Scenario: Deleting an aspect keeps the others' order` ✓ |
| The reorder action rewrites the order | unit | `src/routes/aspects/page.server.test.ts > /aspects reorder action > Scenario: The reorder action rewrites the order` ✓ |
| Pickers, backlog groups and the rule form follow the manual order | e2e | `e2e/aspect-order.test.ts:8:1 › Scenario: Pickers, backlog groups and the rule form follow the manual order` ✓ |
| Backlog lists only todos not in a sprint, in order | unit | `src/lib/server/todos.test.ts > lists > Scenario: Backlog lists only todos not in a sprint, in order` ✓ |
| Backlog is grouped by aspect | e2e | `e2e/backlog.test.ts:21:1 › Scenario: Backlog is grouped by aspect` ✓ |
| Filter the backlog to one aspect | e2e | `e2e/backlog.test.ts:50:1 › Scenario: Filter the backlog to one aspect` ✓ |
| Empty backlog shows an empty state | e2e | `e2e/backlog.test.ts:72:1 › Scenario: Empty backlog shows an empty state` ✓ |
| Overdue todos are marked in the backlog | e2e | `e2e/backlog.test.ts:83:1 › Scenario: Overdue todos are marked in the backlog` ✓ |
| Planned todos are listed in the Planned section | e2e | `e2e/backlog.test.ts:166:1 › Scenario: Planned todos are listed in the Planned section` ✓ |
| No Planned section without planned todos | e2e | `e2e/backlog.test.ts:190:1 › Scenario: No Planned section without planned todos` ✓ |
| Non-numeric aspect parameter shows an empty list | unit | `src/routes/backlog/page.server.test.ts > backlog load > Scenario: Non-numeric aspect parameter shows an empty list` ✓ |
| Unknown aspect id shows an empty list | unit | `src/routes/backlog/page.server.test.ts > backlog load > Scenario: Unknown aspect id shows an empty list` ✓ |
| Missing or empty aspect parameter shows everything | unit | `src/routes/backlog/page.server.test.ts > backlog load > Scenario: Missing or empty aspect parameter shows everything` ✓ |
| Valid aspect parameter filters | unit | `src/routes/backlog/page.server.test.ts > backlog load > Scenario: Valid aspect parameter filters` ✓ |
| Migration 2 adds projects without touching existing data | unit | `src/lib/server/db.test.ts > db > Scenario: Migration 2 adds projects without touching existing data` ✓ |
| Project fields round-trip | unit | `src/lib/server/projects.test.ts > projects > Scenario: Project fields round-trip` ✓ |
| Deleting the IT aspect unsets the setting | unit | `src/lib/server/aspects.test.ts > aspects > delete > Scenario: Deleting the IT aspect unsets the setting` ✓ |
| Both todo read models carry the project link | unit | `src/lib/server/todos.test.ts > project link > Scenario: Both todo read models carry the project link` ✓ |
| Cards are grouped by status | e2e | `e2e/projects.test.ts:9:1 › Scenario: Cards are grouped by status` ✓ |
| Card shows the project summary | e2e | `e2e/projects.test.ts:43:1 › Scenario: Card shows the project summary` ✓ |
| Most recently updated project comes first | unit | `src/lib/server/projects.test.ts > projects > Scenario: Most recently updated project comes first` ✓ |
| No projects shows an empty state | e2e | `e2e/projects.test.ts:75:1 › Scenario: No projects shows an empty state` ✓ |
| Empty groups are not rendered | e2e | `e2e/projects.test.ts:84:1 › Scenario: Empty groups are not rendered` ✓ |
| Phone shows one card per row | e2e | `e2e/projects.test.ts:94:1 › Scenario: Phone shows one card per row` ✓ |
| Wide desktop grid fills the content column | e2e | `e2e/projects.test.ts:119:1 › Scenario: Wide desktop grid fills the content column` ✓ |
| Status pill offers the five states | e2e | `e2e/project-detail.test.ts:192:1 › Scenario: Status pill offers the five states` ✓ |
| Every status transition is allowed | unit | `src/lib/server/projects.test.ts > projects > Scenario: Every status transition is allowed` ✓ |
| Implemented with open todos asks for confirmation | e2e | `e2e/project-detail.test.ts:207:1 › Scenario: Implemented with open todos asks for confirmation` ✓ |
| Cancelling the implemented warning changes nothing | e2e | `e2e/project-detail.test.ts:224:1 › Scenario: Cancelling the implemented warning changes nothing` ✓ |
| Implemented without open todos needs no confirmation | e2e | `e2e/project-detail.test.ts:238:1 › Scenario: Implemented without open todos needs no confirmation` ✓ |
| Reopening an implemented project needs no confirmation | e2e | `e2e/project-detail.test.ts:250:1 › Scenario: Reopening an implemented project needs no confirmation` ✓ |
| Desktop shows a sidebar | e2e | `e2e/navigation.test.ts:10:1 › Scenario: Desktop shows a sidebar` ✓ |
| Phone home list shows the eight lists | e2e | `e2e/navigation.test.ts:66:1 › Scenario: Phone home list shows the eight lists` ✓ |
| Phone home list drills into each list | e2e | `e2e/responsive.test.ts:203:1 › Scenario: Phone home list drills into each list` ✓ |
| Every screen fits 375 px without horizontal scroll | e2e | `e2e/responsive.test.ts:136:1 › Scenario: Every screen fits 375 px without horizontal scroll` ✓ |
| Wide screen redirects /menu to Today | e2e | `e2e/navigation.test.ts:219:1 › Scenario: Wide screen redirects /menu to Today` ✓ |
| Phone keeps /menu | e2e | `e2e/navigation.test.ts:229:1 › Scenario: Phone keeps /menu` ✓ |

## Gaps
none

## Manual checklist
- README documents setup, scripts and env vars: read README.md (setup, npm scripts, env vars, deployment requirement).

## Diffstat
```
 src/routes/welcome/+page.server.ts                 |   17 +-
 src/routes/welcome/page.server.test.ts             |   65 +
 221 files changed, 5242 insertions(+), 9 deletions(-)
```

## Screenshots
none

## Review

Fresh-context review (2026-11-14) of `git diff origin/main...flow/gate-1-decisions`: no findings.
- Weakened tests: none; e2e/projects.test.ts "Cards are grouped by status" became stricter (five states, In progress first), justified by the it-projects delta.
- Weak tests: none; every new scenario test pins its THEN (reorder ids and positions incl. rejection cases, backlog empty list with aspectId null, welcome existingPresets exact, /menu replace-redirect and Back target, aspect order in backlog groups, editor and rule form).
- Spec mismatch: none; preset "not selectable" is enforced server-side only, UI marking is a Non-Goal (redesign).
- Correctness: none; NaN ids, whitespace/sign/decimal/hex/1e3 aspect params and the reorder transaction checked.
