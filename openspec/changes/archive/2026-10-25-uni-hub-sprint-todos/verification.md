verified-at: 6012d34

## Layer 1: PORT=4761 npm run proof:full (exit 0, 0 failures)

```
  ✓  341 e2e/uni.test.ts:536:1 › Scenario: Deleting an empty semester uses a plain confirm (458ms)
  ✓  342 e2e/uni.test.ts:552:1 › Scenario: Grades are shown on the overview (142ms)
  ✓  343 e2e/uni.test.ts:574:1 › Scenario: No grades shows a dash (131ms)

  343 passed (2.7m)
```

## Layer 2: spec coverage (22 scenarios, 0 gaps)

| Scenario | proof | Evidence |
|---|---|---|
| Semesters are listed newest first with archived ones collapsed | e2e | `e2e/uni.test.ts` ✓ |
| Class cards come before This week, notes come last | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Due next and exams are gone from the hub | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Rail holds only the aspect line at 1600 | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| No semesters shows an empty state | e2e | `e2e/uni.test.ts` ✓ |
| Semester without classes offers New class | e2e | `e2e/uni.test.ts` ✓ |
| Phone shows one class card per row | e2e | `e2e/uni.test.ts` ✓ |
| Wide desktop class grid fills the content column | e2e | `e2e/uni.test.ts` ✓ |
| Without a Uni aspect the prompt replaces the hub | e2e ("Scenario: First run prompts for the Uni aspect") | `e2e/uni.test.ts` ✓ |
| Sprint list holds the open class todos of the active sprint | unit | `src/lib/server/uni.test.ts` ✓ |
| Sprint list is ordered by due date, undated last, then id | unit | `src/lib/server/uni.test.ts` ✓ |
| Sprint list is empty without an active sprint | unit | `src/lib/server/uni.test.ts` ✓ |
| Hub shows This week with count and row details | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Hub shows an empty line without sprint todos | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Seven todos make two pages | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Exactly six todos show no pager | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Page clamps into range | unit | `src/lib/uni.test.ts` ✓ |
| Cards are tinted by type | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Ink keeps AA contrast on every tint | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Overdue rows keep their marking on the tint | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Class page rows are not tinted | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Uni aspect line sits in the rail at 1600 and below the notes at 1100 | e2e | `e2e/uni-sprint-todos.test.ts` ✓ |
| Requirement: Wide desktop layout with context rail (taste gate) | manual (human taste gate) | checklist below |

## Manual checklist

1. `npm run dev`, open http://localhost:5173/uni with a Uni aspect, semester, classes and a few sprint todos.
2. At >=1600 wide: rail holds only the Uni aspect line, class grid fills the content column; judge the layout.
3. At 1100 wide: aspect line sits below the notes; judge spacing and balance.
4. Check the tinted This week cards read well (type colours, overdue marking).

## Diffstat

```
 e2e/uni-sprint-todos.test.ts                       | 333 +++++++++++++++++++++
 e2e/uni.test.ts                                    |  59 +---
 .../changes/uni-hub-sprint-todos/.openspec.yaml    |   2 +
 openspec/changes/uni-hub-sprint-todos/flow.yaml    |   5 +
 openspec/changes/uni-hub-sprint-todos/proposal.md  |  61 ++++
 openspec/changes/uni-hub-sprint-todos/scope.md     |  54 ++++
 .../uni-hub-sprint-todos/specs/navigation/spec.md  |  23 ++
 .../uni-hub-sprint-todos/specs/uni-hub/spec.md     | 129 ++++++++
 openspec/changes/uni-hub-sprint-todos/tasks.md     |  13 +
 .../changes/uni-hub-sprint-todos/verification.md   |  80 +++++
 package-lock.json                                  |   4 +-
 package.json                                       |   2 +-
 src/lib/components/uni/ClassCard.svelte            |   2 +-
 src/lib/components/uni/DeadlineList.svelte         | 154 ----------
 src/lib/components/uni/SprintTodos.svelte          | 163 ++++++++++
 src/lib/server/uni.test.ts                         |  73 +++--
 src/lib/server/uni.ts                              |  36 +--
 src/lib/styles/tokens.css                          |  11 +
 src/lib/types.ts                                   |   8 +-
 src/lib/uni.test.ts                                |  13 +
 src/lib/uni.ts                                     |  10 +
 src/routes/uni/+page.server.ts                     |   4 +-
 src/routes/uni/+page.svelte                        |  28 +-
 23 files changed, 974 insertions(+), 293 deletions(-)
```

Screenshots: none

## Review

Reviewer (fresh context, diff origin/main...flow/uni-hub-sprint-todos), round 1: no correctness findings.
- WEAKENED TESTS: none unjustified. Four tests deleted (two e2e, two unit), all covered by the REMOVED "Deadline overview" requirement and the rewritten "Uni overview". No skip/only added.
- WEAK TEST: "Sprint list holds the open class todos of the active sprint" used a closed sprint, not a planning one → fixed in 6012d34 (planning sprint seeded; with the `state = 'active'` filter broken the test goes red).
- SPEC MISMATCH (low): scenario said "Tue 6 Oct", test and code show "Tomorrow" via `dueText` → spec wording changed to "OTH (Tomorrow)" in 6012d34.
Round 2: proof:full green at 6012d34 (343 passed), 0 gaps.
