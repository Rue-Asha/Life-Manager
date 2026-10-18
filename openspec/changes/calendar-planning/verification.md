verified-at: aa64055

## Layer 1: `npm run proof:full` green

```
Test Files  13 passed (13)
     Tests  193 passed (193)
  ✓  304 e2e/uni.test.ts:585:1 › Scenario: Deadline overview sits in the rail at 1280
  ✓  305 e2e/uni.test.ts:623:1 › Scenario: Nothing due shows an empty line
  305 passed (2.3m)
```

## Layer 2: spec coverage

147 scenarios, 146 with unit/e2e proof (each found by name as passed in the proof-full output), 1 manual. 0 gaps.

| Capability | Scenarios | unit/e2e ✓ | manual | gaps |
|---|---|---|---|---|
| backlog | 7 | 7 | 0 | 0 |
| calendar | 24 | 23 | 1 | 0 |
| navigation | 11 | 11 | 0 | 0 |
| recurring | 16 | 16 | 0 | 0 |
| sprint-lifecycle | 35 | 35 | 0 | 0 |
| sprint-views | 17 | 17 | 0 | 0 |
| today | 20 | 20 | 0 | 0 |
| todos | 17 | 17 | 0 | 0 |

Regression-named proofs (`Regression: dated sprint todos are missing from their day in the week view`, `Regression: sprint todos dated today without a day are missing from Today`) also passed.

## Manual checklist

- Calendar looks right on phone and desktop (manual, visual): `npm run dev`, open /calendar at 375 px and 1440 px, compare with the screenshots below.

## Diffstat (main...flow/calendar-planning)

```
 src/lib/server/sprints.test.ts                     | 301 +++++++++++++++++++--
 e2e/calendar.test.ts                               | 271 +++++++++++++++++++
 src/lib/components/calendar/MonthGrid.svelte       | 236 ++++++++++++++++
 e2e/todo-planning.test.ts                          | 223 +++++++++++++++
 .../specs/sprint-lifecycle/spec.md                 | 220 +++++++++++++++
 src/lib/server/calendar.test.ts                    | 185 +++++++++++++
 openspec/changes/calendar-planning/design.md       | 182 +++++++++++++
 src/lib/components/calendar/DayList.svelte         | 175 ++++++++++++
 .../calendar-planning/specs/calendar/spec.md       | 154 +++++++++++
 src/routes/calendar/+page.svelte                   | 131 +++++++++
 63 files changed, 4090 insertions(+), 137 deletions(-)
```

## Screenshots (not committed; produced from this run on a test DB)

Directory: /tmp/claude-1001/-home-Rue-Repos-Life-Manager/7a0fc7a3-a8ec-4868-84ca-c29395789b5d/scratchpad/shots/

- calendar-oct-mobile.png, calendar-oct-desktop.png, calendar-oct-selected-day-mobile.png
- calendar-nov-projection-mobile.png, calendar-nov-projection-desktop.png
- backlog-planned-mobile.png
- todo-editor-planned-mobile.png, todo-editor-planned-desktop.png
- plan-joins-automatically-mobile.png, plan-joins-automatically-desktop.png
