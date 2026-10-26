## Why

Rue plans with the Proton sync and the in-app calendar, but todo deadlines (`due_date`) appear in neither, so a deadline is invisible when looking at the week. The calendar-planning and proton-calendar-sync changes excluded due dates on purpose; this change reverses that without treating deadlines like planned slots.

## What Changes

- **Proton bundle (S1):** for every aspect and every date (today or later) with at least one open (not done) todo whose `due_date` is that date, the sync keeps exactly one all-day event in that aspect's existing Proton calendar, item key `due:<aspectId>:<date>`. Backlog todos, sprint todos and todos that also have a planned `day` all count; the planned event stays as it is. Two deadlines of one aspect and day share one event; two aspects get one event each; an aspect without a calendar gets it through the existing first-item path; the first run backfills from today on.
- **Event content (S2):** title `Due: <title> · <title>` in todo-title order (case-insensitive); with more than 3 todos `Due (<n>): <t1> · <t2> · <t3> …`. Description lists every title, one per line. No location, no time. One todo gives `Due: <title>`; titles are never truncated beyond the 3-item rule.
- **Reconcile (S3):** done, deleted, cleared or moved due date and aspect change update the affected bundle(s) on the next pass; a bundle with no open todos is deleted; an unchanged bundle makes no CLI call. A todo that is un-done reappears; a bundle whose date has passed is frozen as last synced (no update, no delete); a deleted aspect goes through the existing aspect-delete path.
- **In-app month calendar (S4):** a day cell with open due todos shows a due marker (flag + count) that does not count against the 3 visible titles and shows on phone cells too; the day list (phone and wide) gets a "Due" section above the planned entries listing those todos with their aspect. Done todos are not shown. A day with only deadlines shows marker and section; past days show open (overdue) deadlines on their due date; no deadlines means no marker and no section.
- **Release:** minor version bump 0.8.0 to 0.9.0 (`package.json` + `package-lock.json`, commit `chore(release): v0.9.0`); the tag `v0.9.0` is pushed by the shipper after the merge.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `proton-sync`: "Planned todos become events" no longer says a due date never produces an event (it only produces no planned-todo event); new requirement for the per-aspect, per-day due bundle, its content and its reconcile behaviour (S1-S3).
- `calendar`: "Calendar entries" and "Calendar layouts" no longer exclude due dates; they gain the due marker and the "Due" section (S4).

## Non-Goals

- Due time / timed deadline events — `due_date` is date-only; no schema change in a tweak.
- Reminders/alarms in Proton — the CLI wrapper has no alarm flag.
- A separate "Deadlines" Proton calendar or one bundle across aspects — Rue chose per-aspect bundles to keep aspect colours.
- Showing done deadlines (with a check mark) — done deadlines disappear.
- New calendar views (week/day) — the month view exists alone and stays.
- Overdue styling in the calendar — overdue already shows on Today and the sprint views.

## Done criteria

- [ ] Setting a due date on a todo and running a sync shows a `Due: …` all-day event in that aspect's Proton calendar; a second deadline on the same day and aspect updates that same event instead of adding one.
- [ ] Marking the todo done removes it from the event, or deletes the event when it was the last one.
- [ ] The month calendar shows a due marker on that day (also on a phone cell) and a "Due" section in the day list.
- [ ] No existing test still asserts that due dates are hidden or produce no event; the flipped ones are renamed per the delta specs.
- [ ] `npm run proof:full` is green, `package.json` says 0.9.0, and the shipper tags `v0.9.0`.

## Appetite

One evening.

## Decisions

- One bundled all-day event per aspect and day, in the aspect's calendar — avoids one-row-per-deadline stacking while keeping aspect colours (Rue chose it over a separate Deadlines calendar).
- All open todos with a due date, backlog included — a deadline is a deadline regardless of sprint.
- Done todos leave the bundle; an empty bundle is deleted.
- In-app: own due marker and "Due" section, not mixed into the planned entries.
- Past bundles are frozen, not deleted — mirrors how already-synced past todo events are kept.
- UI and event copy in English.

## Impact

- Server: `src/lib/server/proton/types.ts` (`ItemKey`), `desired.ts` (bundles), `reconciler.ts` and `pass.ts` (frozen past bundles), `src/lib/server/calendar.ts` (`due` per day).
- UI: `src/routes/calendar/+page.svelte` (marker, "Due" section).
- Tests: `src/lib/server/proton/desired.test.ts`, `sync.test.ts`, `reconciler.test.ts`, `src/lib/server/calendar.test.ts`, `e2e/calendar.test.ts`, `e2e/proton-sync.test.ts`.
- Release: `package.json` / `package-lock.json` to 0.9.0; tag `v0.9.0` after the merge.
