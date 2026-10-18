# Scope: calendar-planning

Triage: feature — plan todos onto any future day with an optional time slot, recurring rules with time slots and future projection, read-only month calendar view. Proton sync is the follow-up change. Appetite: three evenings.

## Problem
Rue can only plan a todo onto a day of the active sprint week, so anything further ahead lives as an undated backlog item, and there is no place to see planned time across weeks. This blocks the Proton Calendar integration (next change), whose events are the planned time slots.

## Flows
- Plan ahead: open a todo (backlog or sprint) → set "Eingeplant" date (+ optional from–to) → save → if the date is outside the active sprint week the todo sits in the backlog with its date, else it is in the sprint on that day.
- Week arrives: Sunday/Monday plan the sprint → plan page lists the backlog todos planned into that week as included automatically → start → they appear in the Week view on their day with their slot.
- Missed day: a todo was planned for a day of a week that never got a sprint → next sprint start pulls it in as Unscheduled with day and slot cleared.
- Recurring with time: edit a rule → set optional from–to → next sprint's instances carry the slot → the calendar shows the rule's occurrences for later weeks as a projection.
- Look ahead: nav → Kalender → month grid (current month) → ‹ › to other months → select a day → see its entries → tap a todo entry → TodoEditor opens.

## Entity model (confirmed with Rue)
```
Todo
 ├ due_date            optional "fällig am", date only — NOT shown in the calendar
 ├ day                 "eingeplant am": any day of the active sprint week, or any date ≥ today
 ├ start_time, end_time  optional slot on `day` (HH:MM, Europe/Berlin)
 └ sprint_id           set ⇔ the todo is in a sprint; a backlog todo may now carry a future `day`
RecurringRule (weekdays) ── optional start_time/end_time, inherited by instances
Calendar entry = todo with explicit `day` | projected rule occurrence | uni exam (exam_at)
```

## In scope
- **S1** The todo editor has a "Eingeplant" field: a date plus optional start and end time, settable on backlog and sprint todos; clearing the date clears the times.
  - edges: date before today outside the active sprint week → rejected with a message; any day of the active sprint week (incl. past ones) stays allowed as today; todos of archived semesters stay read-only; done todos follow the existing edit rules.
- **S2** Setting a day outside the active sprint week on a sprint todo moves it to the backlog keeping day and slot; setting a day inside the active sprint week on a backlog todo moves it into the active sprint on that day.
  - edges: no active sprint → the todo stays in the backlog with its day; a day in the planning draft's target week → stays in the backlog until start (S5); the Week view DayPicker/drag keep working within the week.
- **S3** Time slot rules: start alone is allowed (shown "18:00"), start–end shown "18:00–19:30"; end requires start and must be after start, same day; no slot = all-day ("ganztägig").
  - edges: end without start → rejected; end ≤ start → rejected; clearing start clears end.
- **S4** The planned date and slot are shown wherever a todo row appears (Today, Sprint views, Backlog, plan/review, aspect pages), e.g. "Di 27.10. · 18:00–19:30"; inside the Week view the day is implicit, so only the slot shows.
  - edges: no slot → date only; no day → nothing shown (due label unchanged).
- **S5** The Backlog shows future-planned todos in their own section "Eingeplant", sorted by day then start time, above the unplanned backlog.
  - edges: none planned → section hidden.
- **S6** Starting a sprint pulls every not-done backlog todo whose `day` falls in the new sprint's week into the sprint, keeping day and slot; the plan page lists these as "kommt automatisch rein" (not unpullable there; to exclude one, change its day).
  - edges: done todos are not pulled; a todo both due-date-suggested and planned keeps its day; the existing suggested-todos pull no longer clears a day it doesn't need to.
- **S7** Starting a sprint also pulls every not-done backlog todo whose `day` lies before the new sprint's week into the sprint as Unscheduled, with day and slot cleared.
  - edges: archived-semester todos are skipped (read-only).
- **S8** Between sprints (today not a sprint day), a backlog todo planned for today shows on Today, like a backlog todo due today.
  - edges: also due today → shown once.
- **S9** Carry-over at review and moving a todo back to the backlog keep their existing behaviour and clear the slot together with the day.
  - edges: none (existing behaviour, slot just follows day).
- **S10** A recurring rule has an optional start/end time (same rules as S3); instances materialised at sprint start carry it; an instance's slot can be edited like any todo; rule edits affect future sprints only (existing rule).
  - edges: instances added mid-sprint for a new rule also carry the slot; carried instances keep the existing re-placement behaviour.
- **S11** A new nav entry "Kalender" (route `/calendar`) placed after Sprint, on Sidebar and HomeList; the page shows a Mon–Sun month grid (Europe/Berlin) of the current month, ‹ › to the previous/next month, a "Heute" control, and the month in the URL (`?month=YYYY-MM`) so it deep-links.
  - edges: invalid `month` param → current month; the "seven lists" navigation scenarios become eight.
- **S12** Calendar entries per day: todos with an explicit `day` (aspect colour, slot or "ganztägig", done ones struck through); for weeks after the active sprint week (or from today when there is no active sprint) one projected occurrence per recurring rule weekday, marked as a projection; uni exams at their `exam_at` time with room. Order within a day: all-day first, then by start time.
  - edges: due dates are not shown; sprint todos without an explicit day are not shown; past weeks show only real todos (no projection); the active sprint week shows real instances only (no double entries); archived-semester exams are shown.
- **S13** Phone (<768): compact grid with aspect-coloured dots per day (max 3 dots, then "+"), and the selected day's entry list below; the selected day defaults to today when it's in the shown month, else the 1st. Wide (≥1280): cells show up to 3 entry titles plus "+n weitere", and the selected day's list sits in the context rail; 768–1279 uses the rail overlay. No horizontal scroll at 375 px.
  - edges: a month with no entries → grid plus "Nichts eingeplant" in the day list; days outside the month are muted.
- **S14** Selecting a todo entry opens the TodoEditor; a projected occurrence links to its rule on /recurring; an exam links to its class page.
  - edges: a todo edited from the calendar that leaves the day disappears/moves after save.

## Non-goals
- Proton Calendar sync — split off as `proton-calendar-sync` (next change).
- Due dates in the calendar — Rue's decision: the calendar shows planned slots only; due date stays an optional field.
- Editing in the calendar (drag to move, click empty day to create) — read-only view chosen.
- Week/day calendar views with an hour grid — the Sprint Week view covers the current week.
- Sorting Today or Week-view columns by time — ordering stays as specified today; slots are displayed only.
- Slots across midnight, time zones other than Europe/Berlin, reminders/notifications.
- Recurring rules with intervals, start/end dates or monthly patterns — rules stay "every week on weekdays X", so the projection repeats weekly without end (no "every 2 weeks", "monthly on the 15th", "until semester end").
- Exam duration (exam_at is a point in time).

## Codebase touchpoints
- `src/lib/server/schema.ts` — append migration: `todos.start_time`, `todos.end_time`, `recurring_rules.start_time`, `recurring_rules.end_time` (nullable, additive) (explorer: due-date model, runtime)
- `src/lib/server/todos.ts` — `createTodo`/`updateTodo`/`TodoPatch`: day + slot, loosen `day-outside-sprint` (~L87-93) (explorer: how day is set)
- `src/lib/server/sprints.ts` — `setDay`, `addToActiveSprint`, `startSprint` (auto-pull + missed pull, stop nulling day in the suggested pull), `pullTodo`, `closeReview`/`toBacklog` (clear slot), `listToday` (explorer: how day is set)
- `src/lib/server/recurring.ts` — rule slot, `generateInstances` inherits slot; new projection helper (explorer: views/recurring)
- `src/routes/todos/+page.server.ts` — `update`/`create`/`setDay` actions parse day + times (explorer: how day is set)
- `src/lib/components/todo/TodoFields.svelte`, `TodoEditor.svelte`, `TodoRow.svelte`, `format.ts` — field chip, display (explorer: how day is set)
- `src/routes/backlog`, `src/routes/sprint/plan`, `src/routes/+page.server.ts` (Today) — Eingeplant section, auto-included list, planned-today (explorer: due-date model)
- `src/routes/calendar/` (new), `src/lib/week.ts` (month-grid helper), `shell/Sidebar.svelte`, `HomeList.svelte`, `RailLayout.svelte` (explorer: views)
- `src/lib/server/uni.ts` — exams for a date range (explorer: views)
- Specs with deltas: todos, backlog, sprint-lifecycle, sprint-views, today, recurring, navigation; new capability `calendar`.
- Tests: `sprints.test.ts`, `todos.test.ts` (`day-outside-sprint`), `db.test.ts` (migration N), `e2e/*` navigation counts, `src/routes/__test/seed` (day/slot seeding).

## Risks
- R1 Invariant "backlog ⇒ day NULL" is spread over queries and specs → resolved: explicit deltas for sprint-lifecycle/backlog/sprint-views/today; planner lists every e2e/unit file reached.
- R2 Navigation scenarios hard-code seven entries → resolved: navigation delta; one unit owns Sidebar/HomeList.
- R3 Projection doubling with real instances → resolved: project only weeks after the active sprint week (from today with no sprint).
- R4 Migrations must stay additive (deploy rollback restores code, not data) → resolved: nullable columns only.
- R5 Proton write path is unofficial → accepted for the next change; research recorded under Decisions.

## Decisions
- The calendar shows the planned slot (`day` + times), not the due date — Rue corrected the initial request.
- Slot = optional from–to on the planned day — Rue's choice.
- Future-planned todos join their week's sprint automatically at start — Rue's choice.
- Missed planned days are pulled into the next sprint as Unscheduled — Rue's choice, nothing gets lost.
- Recurring rules get an optional slot — Rue's choice.
- Calendar view: month grid, read-only; phone = grid with dots + day list — Rue's choice.
- Split: date model + view now, Proton sync next — Rue's choice.
- UI copy is English like the rest of the app (Calendar, Planned, all day, Today, Nothing planned, +n more, "Tue 27 Oct", "joins automatically"); German labels elsewhere in this file are descriptive only — Rue's choice at Gate 1.
- Gate 1 addition B accepted: rules of archived-semester classes are not projected in the calendar (they never become instances).
- Gate 1 addition C accepted: backlog todos planned for a later week are not offered as due-this-week suggestions on the plan page (starting would otherwise pull them in and silently clear day and slot).
- Gate 1 addition A declined: no `release: tag` line added to CLAUDE.md ## Harness.
- For the next change (recorded so it isn't lost): sync via `roman-16/proton-cli` (Go, MIT, v5.1.0 2026-10-15) as a sidecar, writing only on change; one Proton calendar per aspect (paid plan, ≤25 calendars); done todos stay with "✓" in the title, deleted todos are removed; recurring occurrences, exams and planned slots are synced, due dates are not. ICS subscription rejected: 4–16 h lag and the app is LAN-only. Accepted cost: the Proton session + key passphrase live on life-manager01; ToS §2.10 grey zone; occasional CAPTCHA re-login.

## Done when
- Rue plans a todo for a day three weeks out with 18:00–19:30, sees it under "Eingeplant" in the Backlog, and after starting that week's sprint finds it on its day in the Week view with the slot.
- A recurring rule with a slot shows its occurrences in later months of the calendar, and its next sprint instances carry the slot.
- `/calendar` on phone and desktop shows the month with aspect colours, exams and planned todos, without due dates.
- Existing unit and e2e tests that encode the old behaviour (`day-outside-sprint`, backlog ⇒ day cleared on every path, seven nav entries, Week-view seeding) are rewritten to the new behaviour, not deleted or skipped; every S-item has its own tests (Rue's explicit requirement at Gate 0).
- `npm run proof:full` is green.

## Split off
- `proton-calendar-sync` — intent, decisions, research and open questions in `proton-sync-notes.md` (this dir); push planned slots, recurring occurrences and exams to Proton via proton-cli (one calendar per aspect, ✓ for done, sync state, background worker, status/re-login UI, Homelab-Managment deploy: binary, vault, egress).
- Homelab chore — `/var/lib/life-manager` has no backup (found during explore).
