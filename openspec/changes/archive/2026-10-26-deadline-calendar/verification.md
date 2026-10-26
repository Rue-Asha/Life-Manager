verified-at: 2e5cfa7

## Layer 1 — proof:full

green (exit 0). `check`, `build`, unit: Test Files 22 passed (22), Tests 319 passed (319); e2e: 346 passed (2.7m).

```
  ✓  345 e2e/uni.test.ts:552:1 › Scenario: Grades are shown on the overview (...)
  ✓  346 e2e/uni.test.ts:574:1 › Scenario: No grades shows a dash (123ms)

  346 passed (2.7m)
```

## Layer 2 — spec coverage

e2e rows were found by name in the green run output; unit rows by name in the test files, with the unit run green (319/319).

### calendar

| Scenario | proof | Evidence |
|---|---|---|
| Planned todos are entries, due dates are a separate list | unit | `src/lib/server/calendar.test.ts:91` ✓ |
| Rules are projected after the active sprint week | unit | `calendar.test.ts` ✓ |
| Sunday after the review closes does not show an instance twice | unit | `calendar.test.ts` ✓ |
| Without an active sprint projection starts today | unit | `calendar.test.ts` ✓ |
| Past months show only real todos | unit | `calendar.test.ts` ✓ |
| Rules of archived classes are not projected | unit | `calendar.test.ts` ✓ |
| Exams appear at their time with room | unit | `calendar.test.ts` ✓ |
| Entries within a day are ordered | unit | `calendar.test.ts` ✓ |
| Calendar shows aspect colours and marks projections | e2e | `e2e/calendar.test.ts:79` ✓ |
| Recurring rule with a slot shows in later months | e2e | `e2e/calendar.test.ts:116` ✓ |
| Phone shows dots and the selected day's list | e2e | `e2e/calendar.test.ts:190` ✓ |
| Selected day defaults to the 1st in another month | e2e | `e2e/calendar.test.ts:228` ✓ |
| Wide cells show up to three titles | e2e | `e2e/calendar.test.ts:141` ✓ |
| Day list in the rail overlay below 1280 | e2e | `e2e/calendar.test.ts:166` ✓ |
| Empty month shows Nothing planned | e2e | `e2e/calendar.test.ts:180` ✓ |
| Calendar looks right on phone and desktop | manual (visual judgement on real hardware) | see checklist |
| Cell shows a due marker beside the titles | e2e ("Scenario: Due todos show as marker and Due section") | `e2e/calendar.test.ts:274` ✓ |
| Phone cell shows the marker and the Due section | e2e (same) | `e2e/calendar.test.ts:274` ✓ |
| Day with only a deadline has no empty-state text | e2e ("Scenario: Deadline-only day shows Due without empty text") | `e2e/calendar.test.ts:334` ✓ |
| Overdue and done deadlines | unit ("Scenario: Due lists open todos per day including past days") | `calendar.test.ts:110` ✓ |
| Backlog, sprint and planned todos count | unit (same) | `calendar.test.ts:110` ✓ |
| No deadlines means no marker and no section | e2e ("Scenario: Due todos show as marker and Due section") | `e2e/calendar.test.ts:274` ✓ (now pinned by a done-only month: zero `calendar-due` in grid, zero `calendar-due-list`) |

### proton-sync

| Scenario | proof | Evidence |
|---|---|---|
| Todo with a full slot becomes a timed event | unit | `src/lib/server/proton/desired.test.ts` ✓ |
| Start-only slot becomes a 30-minute event | unit | `desired.test.ts` ✓ |
| Todo without a slot becomes an all-day event | unit | `desired.test.ts` ✓ |
| Event carries notes and the class room | unit | `desired.test.ts` ✓ |
| Due date alone creates no planned-todo event | unit | `desired.test.ts:155` ✓ |
| Backlog and draft-sprint todos with a day get events | unit | `desired.test.ts` ✓ |
| Timed events are sent in Europe/Berlin | unit | `desired.test.ts` ✓ |
| Failing item does not stop the pass | unit | `sync.test.ts`/`desired.test.ts` ✓ |
| Planning a todo creates its event | unit | ✓ |
| Open due todos become one all-day bundle per aspect and day | unit | `desired.test.ts:358` ✓ |
| Bundle title and description | unit | `desired.test.ts:379` ✓ |
| More than three todos show a count | unit ("Scenario: Bundle title and description") | `desired.test.ts:379` ✓ |
| Planned todo with a due date keeps its own event | unit ("Scenario: Open due todos become one all-day bundle per aspect and day") | `desired.test.ts:358` ✓ |
| Due bundle needs no migration | unit ("Scenario: Bundle is created in the aspect's calendar and stored under its key") | `sync.test.ts:495` ✓ |
| Bundle is created in the aspect's calendar and stored under its key | unit | `sync.test.ts:495` ✓ |
| Second deadline joins the existing event | unit | `sync.test.ts:509` ✓ |
| Done todo leaves the bundle, the last one deletes it | unit | `sync.test.ts:525` ✓ |
| Todo marked done between two passes | unit ("Scenario: Unchanged bundle makes no call in a second pass") | `sync.test.ts:562` ✓ |
| Unchanged bundle makes no call in a second pass | unit | `sync.test.ts:562` ✓ |
| Cleared or deleted due date deletes the event | unit ("Scenario: Done todo leaves the bundle, the last one deletes it") | `sync.test.ts:525` ✓ |
| Moved due date changes both bundles | unit ("Scenario: Moved due date and aspect change update both bundles") | `sync.test.ts:581` ✓ |
| Aspect change moves the deadline to the other aspect's bundle | unit (same) | `sync.test.ts:581` ✓ |
| Un-done todo reappears | unit ("Scenario: Done todo leaves the bundle, the last one deletes it") | `sync.test.ts:525` ✓ |
| Passed bundle is frozen | unit | `sync.test.ts:619` ✓ |
| Deleting an aspect deletes or moves its bundles with the existing path | unit ("Scenario: Moved due date and aspect change update both bundles") | `sync.test.ts:581` ✓ |
| Setting a due date puts an event into the sync | e2e ("Scenario: Due date syncs as a bundled event and done removes it") | `e2e/proton-sync.test.ts:202` ✓ |

Gaps: none.

## Manual checklist

- `npm run dev`, open /calendar at 375 px and 1280 px: a day with due todos plus planned entries shows the flag marker with a count beside the day number, entries below, and the Due section (aspect name under each title) above the entries in the day list.
- Same pages: a deadline-only day shows the marker, a Due section, and no "Nothing planned" text.
- Judge the marker's size and contrast on a real phone (scenario "Calendar looks right on phone and desktop").
- Proton (real account, optional): set a due date on a todo, Sync now, check the all-day `Due: <title>` event in the aspect's calendar; mark it done, sync, the event is gone.

## Diffstat

`git diff --stat origin/main...HEAD`: 26 files changed, 1083 insertions(+), 28 deletions(-)

```
 e2e/calendar.test.ts                               |  76 +++++++++++
 e2e/proton-sync.test.ts                            |  31 +++++
 openspec/changes/deadline-calendar/ (artifacts: 9 files, no screenshots)
 package-lock.json                                  |   4 +-
 package.json                                       |   2 +-
 src/lib/components/calendar/DayList.svelte         |  51 ++++++-
 src/lib/components/calendar/MonthGrid.svelte       |  45 ++++++-
 src/lib/server/calendar.test.ts                    |  26 +++-
 src/lib/server/calendar.ts                         |  21 ++-
 src/lib/server/proton/desired.test.ts              |  55 +++++++-
 src/lib/server/proton/desired.ts                   |  40 +++++-
 src/lib/server/proton/pass.ts                      |   2 +-
 src/lib/server/proton/reconciler.test.ts           |  13 +-
 src/lib/server/proton/reconciler.ts                |  15 ++-
 src/lib/server/proton/sync.test.ts                 | 147 ++++++++++++++++++++
 src/lib/server/proton/types.ts                     |   2 +-
 src/routes/calendar/+page.svelte                   |   4 +-
 src/routes/sync/+page.server.ts                    |   2 +-
```

## Screenshots

Verifier's own, not committed:

- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/84a45a41-0f50-454e-8e36-cb3b699d1485/scratchpad/verify/calendar-2026-10-21-375.png`
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/84a45a41-0f50-454e-8e36-cb3b699d1485/scratchpad/verify/calendar-2026-10-21-1280.png`
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/84a45a41-0f50-454e-8e36-cb3b699d1485/scratchpad/verify/calendar-2026-10-23-375.png`
- `/tmp/claude-1001/-home-Rue-Repos-Life-Manager/84a45a41-0f50-454e-8e36-cb3b699d1485/scratchpad/verify/calendar-2026-10-23-1280.png`

## Review

Round 1 (fresh-context reviewer, diff origin/main...d239182): no weakened tests, no spec mismatch, no correctness bugs. Six weak-test findings, all resolved by the fixer (4057cdd, ef5505d) with fail-checks:
- Moved due date / aspect change: now asserts old empty bundle deleted, existing target bundle updated, no other call — fixed.
- Un-done todo reappears after its bundle was deleted: now asserts a fresh `event.create` — fixed.
- Bundle created: now seeds a todo due yesterday (no row) and asserts `user_version === migrations.length` — fixed.
- Unchanged bundle: now asserts event ref and hash unchanged — fixed.
- No-deadlines month (e2e): now a month with only a done due todo, no marker, no Due section — fixed.
- Aspect delete: now asserts `event.delete` on the old ref and the create in the new calendar — fixed.
Orchestrator: verifier round 1 committed 50 e2e shots; removed in 946612f.
Round 2 verifier at 2e5cfa7: proof:full green, no gaps.
