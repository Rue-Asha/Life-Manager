## Why

Rue wants to add todos directly on the Today page for things to do right now. The quick add exists, but it is
only rendered while a sprint is running and today is one of its days, so on Sunday after the review, during
review-required and with no sprint there is no add control on Today at all.

## What Changes

- Today shows the "Add a todo" quick add in every phase (running, review-available, review-required, planning, none, Sunday after review).
- While an active sprint has today among its days, quick add is unchanged: todo in the sprint, To do, day = today.
- Otherwise quick add creates the todo in the backlog with due date today (QuickAdd gets a small `defaultDueDate` prop; `createTodo` already accepts a backlog target with a due date, so no server or schema change there).
- Today lists open backlog todos due today (in no sprint) under their aspect, only when today is not one of the active sprint's days. They get no checkbox; they offer "Add to sprint" when a sprint is active, like overdue ones.
- Released as v0.3.0 (new behaviour, minor): version bump is the last task of the unit; the tag is pushed in the ship step. No release-artifact spec change: it names no current version.
- New query `listBacklogDueToday` in `src/lib/server/todos.ts`; the Today load returns them in the fallback states.

## Capabilities

### Modified Capabilities
- `today`: quick add in every state, backlog fallback with due date today, listing of due-today backlog todos.

## Non-Goals

- A "+" in the sidebar or on other pages — the request is about the Today page.
- Changing the quick add form or its look — only when it is shown.
- Auto-moving fallback todos into the next sprint at planning — they sit in the backlog like any other.

## Decisions

- Fallback is backlog + due today, not a new sprint — no sprint exists to receive it, and creating one would change sprint lifecycle.

## Appetite

One evening.

## Done criteria

- [ ] On Sunday after the review, and with no sprint, Today shows "Add a todo"; the todo added there appears on Today.
- [ ] During a running sprint on a sprint day nothing changes: quick add puts the todo in the sprint on today, a backlog todo due today is not listed.
- [ ] `npm run proof:full` is green.
- [ ] `package.json` and `package-lock.json` say 0.3.0 and tag `v0.3.0` publishes a GitHub Release.

## Impact

`src/routes/+page.svelte`, `src/routes/+page.server.ts`, `src/lib/server/todos.ts`, `src/lib/components/todo/QuickAdd.svelte`, `e2e/today.test.ts`, `src/lib/server/todos.test.ts`. No schema change.
