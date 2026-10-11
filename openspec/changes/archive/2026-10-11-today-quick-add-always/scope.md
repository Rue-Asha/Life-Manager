# Scope: today-quick-add-always

Triage: tweak — Today quick add shown in every state, existing capability (today), no schema. Appetite: one evening.

## Problem
Rue wants to add todos directly on the Today page for things to do right now. The quick add exists, but it is
only rendered while a sprint is running and today is one of its days, so on Sunday after the review, during
review-required and with no sprint there is no add control on Today at all.

## Flows
- Add on a sprint day: Today → "Add a todo" → title + aspect → submit → todo in the active sprint on today, listed on Today (exists).
- Add with no sprint taking today: Today → "Add a todo" → submit → todo saved with due date today, listed on Today.

## In scope
- **S1** Today shows the "Add a todo" quick add in every phase (running, review-available, review-required, planning, none, Sunday after review).
  - edges: phone → same Sheet as now; no aspects → unchanged (welcome redirect covers it)
- **S2** While an active sprint has today among its days, quick add behaves as today: todo in the sprint, status To do, day = today.
  - edges: none (unchanged behaviour, existing scenario stays)
- **S3** When no active sprint has today among its days, quick add creates the todo in the backlog with due date today, and Today lists open todos due today that are in no sprint under their aspect.
  - edges: due-today backlog todo ticked → no checkbox, offers "Add to sprint" like the overdue ones when a sprint is active, otherwise plain row; next day it is overdue by the existing rule; during an active sprint on a sprint day the existing rule stays (backlog todo due today is not listed)

## Non-goals
- A "+" in the sidebar or on other pages — request is about the Today page.
- Changing the quick add form or its look — only when it is shown.
- Auto-moving fallback todos into the next sprint at planning — they sit in the backlog like any other.

## Codebase touchpoints
- `src/routes/+page.svelte` — render QuickAdd regardless of phase/`onSprintDay`, pick the target (explorer: Today page)
- `src/routes/+page.server.ts` — load the due-today non-sprint todos in the fallback states (explorer: Today page)
- `src/lib/server/sprints.ts` / `todos.ts` — `listToday`, `listOverdue`; new list for due-today without sprint
- `src/lib/components/todo/QuickAdd.svelte` — `target` `backlog` with a preset due date, if not already supported
- `e2e/today.test.ts` — "no quick add on Sunday" scenario at line 156 flips; `src/lib/server/sprints.test.ts`

## Risks
- R1 QuickAdd has no preset due date prop → accepted: planner checks, adds a small prop or a hidden field

## Decisions
- Fallback is backlog + due today, not a new sprint — no sprint exists to receive it, and creating one would change sprint lifecycle.

## Done when
- On Sunday after the review, and with no sprint, Today shows "Add a todo"; the added todo appears on Today.
- During a running sprint nothing changes.

## Split off
- none
