# Scope: deadline-calendar

Triage: tweak — due dates of open todos shown in the in-app month calendar and as one bundled all-day Proton event per aspect and day; no schema, one session. Appetite: one evening.

## Problem
Rue plans with the Proton sync and the in-app calendar, but todo deadlines (`due_date`) appear in neither,
so a deadline is invisible when looking at the week. The calendar-planning and proton-calendar-sync changes
excluded due dates on purpose; this change reverses that, without treating deadlines like planned slots.

## Flows
- Set a deadline: edit todo, set due date → next sync pass → the aspect's Proton calendar shows one all-day
  "Due: …" event on that date; the in-app month calendar shows a due marker on that day.
- Finish / move / clear a deadline: mark done, change or clear the due date, change aspect, delete the todo →
  next pass updates the bundle, or deletes it when it becomes empty; the app marker updates at once.

## In scope
- **S1** Proton: for every aspect and every date (today or later) with ≥1 open (not done) todo whose `due_date`
  is that date, the sync keeps exactly one all-day event in that aspect's existing Proton calendar. Includes
  backlog todos, sprint todos and todos that also have a planned `day` (the planned event stays as it is; the
  deadline appears additionally in the bundle).
  - edges: two deadlines same aspect same day → one event, not two · deadlines of two aspects same day → one
    event per aspect calendar · aspect without a Proton calendar yet → created via the existing first-item path ·
    first run → backfills from today on, like todo events.
- **S2** Event content (UI copy in English): title `Due: <title> · <title>` in the bundle's sort order (sorted by
  todo title, case-insensitive); with more than 3 todos the title is `Due (<n>): <t1> · <t2> · <t3> …`.
  Description lists every todo title, one per line. No location, no time.
  - edges: one todo → `Due: <title>` · very long titles → no truncation by the app beyond the 3-item rule.
- **S3** Reconcile: a todo marked done, deleted, its due date cleared or moved, or moved to another aspect
  updates the affected bundle(s) on the next pass; a bundle left with no open todos is deleted. Unchanged
  bundles cause no CLI call (existing hash diff).
  - edges: todo un-done again → reappears · due date moved to another day → leaves old bundle, joins new one ·
    date passes (bundle date < today) → the already-synced event is left as last synced, no further update or
    delete · aspect deleted → handled by the existing aspect-delete path.
- **S4** In-app month calendar: each day cell with open due todos shows a due marker (flag + count) that does
  not count against the 3 visible titles on wide cells and is visible on phone cells too. The selected-day list
  (phone) and the day list (wide) show a "Due" section above the planned entries, listing those todos with
  their aspect. Done todos are not shown.
  - edges: day with only deadlines and no planned entries → marker + "Due" section, no empty-state text for the
    section · past days show open (overdue) deadlines on their due date · no deadlines → no marker, no section.

## Non-goals
- Due time / timed deadline events — `due_date` is date-only; no schema change in a tweak.
- Reminders/alarms in Proton — the CLI wrapper has no alarm flag.
- A separate "Deadlines" Proton calendar or one bundle across aspects — Rue chose per-aspect bundles to keep aspect colours.
- Showing done deadlines (with ✓) — Rue chose: done deadlines disappear.
- New calendar views (week/day) — month view only exists and stays.
- Overdue styling in the calendar — overdue already shows on Today and sprint views.

## Codebase touchpoints
- `src/lib/server/proton/types.ts` — `ItemKey` widened with a due-bundle kind (explorer: sync model)
- `src/lib/server/proton/desired.ts` — `desiredState` adds due bundles per aspect+date (explorer)
- `src/lib/server/proton/hash.ts` / `cli.ts` — reused as is; all-day path `--start <date> --all-day` exists (explorer)
- `src/lib/server/calendar.ts`, `src/routes/calendar/+page.svelte`, `+page.server.ts` — due query in
  `calendarMonth`, marker and "Due" section (explorer: in-app calendar)
- `openspec/specs/proton-sync/spec.md:32-34,57-59` — "A due date alone … SHALL never produce an event" → MODIFIED
- `openspec/specs/calendar/spec.md:45-52,91-92` — "Due dates are never shown" → MODIFIED

## Risks
- R1 A todo with both `day` and `due_date` must not collide with its planned event → resolved: separate item key
  per aspect+date bundle, independent of `todo:<id>`.
- R2 Item key for a bundle has no DB row of its own (aspect+date, not a todo id) → accepted: `proton_items` keys are
  text; planner confirms the key format fits without migration, else escalate.
- R3 Existing scenario "Due date alone creates no event" (desired.test.ts) and the calendar "never shown" scenarios
  flip → accepted: spec delta MODIFIES them; changing those tests is a spec change, not a cheat.

## Decisions
- One bundled all-day event per aspect and day, in the aspect's calendar — avoids one-row-per-deadline stacking while
  keeping aspect colours (Rue's choice over a separate Deadlines calendar).
- All open todos with a due date, backlog included — a deadline is a deadline regardless of sprint (Rue).
- Done todos leave the bundle; empty bundle is deleted (Rue).
- In-app: own due marker + "Due" section, not mixed into planned entries (Rue).
- Past bundles are frozen, not deleted — mirrors how already-synced past todo events are kept.

## Done when
- Setting a due date on a todo and running a sync shows a `Due: …` all-day event in that aspect's Proton calendar;
  a second deadline on the same day and aspect updates that same event instead of adding one.
- Marking it done removes it from the event (or the event, if it was the last).
- The month calendar shows a due marker on that day and a "Due" section in the day list.
- `npm run proof:full` green.

## Split off
- none
