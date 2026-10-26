## Context

`proton_items.key` is `TEXT PRIMARY KEY` and the reconciler only uses it as an opaque string, so a bundle needs no migration and no schema change. The hash (`specHash`) already covers title, description and date, so any change in a bundle's todos changes the hash and an unchanged bundle makes no call.

## Decisions

- The bundle is a plain `DesiredItem` with key `due:<aspectId>:<date>`, built in `desired.ts` next to the todo, series and exam items. Keeping the aspect in the key means a todo that changes aspect leaves the old bundle and joins the new one through the normal desired/stored diff.
- Frozen past bundles: `desiredState` emits only bundles with date >= today. The reconciler's "no longer desired" delete pass (and `pendingCount`) skips rows whose key is `due:<aspectId>:<date>` with date < today, so the last synced event stays untouched. `today` reaches the reconciler through `runPass` (builder's choice of signature as long as `reconcile` stays testable with a fixed today).
- A deleted aspect: its bundles are no longer desired and are deleted by the normal pass; frozen past bundles of that aspect remain as inert rows (accepted, no cleanup).
- In-app, `calendarMonth` returns a separate `due: Record<IsoDate, DueTodo[]>` next to `entries`; due todos never enter `entries`, so the 3-title rule, the dots and the entry ordering stay unchanged.

## Contracts

- `ItemKey` gains `` `due:${number}:${string}` `` (aspect id, ISO date). Stored: the `proton_items` row (key, label, calendar id, event ref, hash). Derived each pass, never stored: the bundle's title, description and todo order.
- Bundle `EventSpec`: title and description per S2, `location: ''`, `date`, `start: null`, `end: null`, `durationMin: null`, `rrule: null`, `exdates: []` (all-day). Label = the title.
- Bundle membership: `status != 'done'` and `due_date` equals the date, any sprint or backlog, with or without `day`. Order: title, case-insensitive (`localeCompare` with `sensitivity: 'base'`), ties by id.
- `calendarMonth(...)` returns `{ month, weeks, entries, due }` with `due[date]` a list of `{ id, title, aspectId }` of open todos due that date, ordered like the bundle (title, then id).
- Test ids in the page: `calendar-due` (marker on a cell, text = count), `calendar-due-list` (the "Due" section in the day list) with `calendar-due-row` per todo.
