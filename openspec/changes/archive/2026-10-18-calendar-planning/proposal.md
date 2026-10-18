## Why

Rue can only plan a todo onto a day of the active sprint week, so anything further ahead lives as an undated
backlog item, and there is no place to see planned time across weeks. This blocks the Proton Calendar integration
(next change), whose events are the planned time slots.

## What Changes

- **Plan onto any future day with an optional slot.** The todo editor gets a "Planned" field: a date plus
  optional start and end time (Europe/Berlin), on backlog and sprint todos. A date before today outside the active
  sprint week is refused; every day of the active sprint week stays allowed. Clearing the date clears the times.
- **Sprint membership follows the planned date.** A sprint todo planned outside the active week moves to the backlog
  keeping date and slot; a backlog todo planned inside the active week joins the sprint on that day. Without an active
  sprint the todo stays in the backlog with its date. **BREAKING** for the old invariant "backlog ⇒ no day": a backlog
  todo may now carry a future `day`, and `day-outside-sprint` no longer refuses an edit by date.
- **Planned todos arrive with their week.** Sprint start pulls every open backlog todo planned in the new week (keeping
  day and slot; the plan page lists them as "Joins automatically") and every open backlog todo planned before it
  (as Unscheduled, day and slot cleared). A todo planned for a later week is no longer offered as a due-this-week
  suggestion (Gate 1 addition C).
- **UI copy in English like the rest of the app** (Rue at Gate 1).
- **Slot shown everywhere a todo row appears**, e.g. "Tue 27 Oct · 18:00–19:30"; in the Week view only the slot.
  The Backlog lists planned todos in their own section "Planned" above the unplanned ones. Between sprints a
  backlog todo planned for today shows on Today.
- **Recurring rules get an optional slot** that their instances inherit; the calendar projects rule occurrences for
  the weeks after the active sprint, except rules of archived-semester classes (Gate 1 addition B).
- **New read-only month calendar** at `/calendar` ("Calendar" in the navigation after Sprint): Mon–Sun month grid,
  ‹ › and "Today", `?month=YYYY-MM` deep link; entries are planned todos, projected rule occurrences and uni exams,
  never due dates. Phone shows aspect-coloured dots plus the selected day's list; desktop shows titles in the cells
  and the day's list in the context rail. Entries open the todo editor, the rule or the class.
- Existing unit and e2e tests that encode the old behaviour are rewritten to the new behaviour, never deleted or
  skipped; every S-item gets its own tests.
- Released as v0.5.0 (new feature, minor).

## Non-Goals

- Proton Calendar sync — split off as `proton-calendar-sync` (next change).
- Due dates in the calendar — Rue's decision: the calendar shows planned slots only; due date stays an optional field.
- Editing in the calendar (drag to move, click empty day to create) — read-only view chosen.
- Week/day calendar views with an hour grid — the Sprint Week view covers the current week.
- Sorting Today or Week-view columns by time — ordering stays as specified today; slots are displayed only.
- Slots across midnight, time zones other than Europe/Berlin, reminders/notifications.
- Recurring rules with intervals, start/end dates or monthly patterns — rules stay "every week on weekdays X", so the
  projection repeats weekly without end (no "every 2 weeks", "monthly on the 15th", "until semester end").
- Exam duration (exam_at is a point in time).

## Done criteria

- [ ] Rue plans a todo for a day three weeks out with 18:00–19:30, sees it under "Planned" in the Backlog, and after
      starting that week's sprint finds it on its day in the Week view with the slot.
- [ ] A recurring rule with a slot shows its occurrences in later months of the calendar, and its next sprint instances
      carry the slot.
- [ ] `/calendar` on phone and desktop shows the month with aspect colours, exams and planned todos, without due dates.
- [ ] Existing unit and e2e tests that encode the old behaviour (`day-outside-sprint`, backlog ⇒ day cleared on every
      path, seven nav entries, Week-view seeding) are rewritten to the new behaviour, not deleted or skipped; every
      S-item has its own tests (Rue's explicit requirement at Gate 0).
- [ ] `npm run proof:full` is green.

## Appetite

Three evenings.

## Capabilities

### New Capabilities
- `calendar`: read-only month calendar at `/calendar` with planned todos, projected recurring occurrences and uni
  exams; phone and wide layouts; entries open the editor, the rule or the class (S11–S14).

### Modified Capabilities
- `todos`: "Planned" date and optional time slot in the editor, slot rules, planned label on rows (S1, S3, S4).
- `backlog`: backlog todos may carry a planned date; "Planned" section above the aspect groups (S5).
- `sprint-lifecycle`: mid-sprint moves by planned date, sprint start pulls the week's and missed planned todos, the
  slot is cleared with the day on carry-over and back-to-backlog (S2, S6, S7, S9).
- `sprint-views`: day picker no longer the only gate on days (out-of-week dates follow S2), slot on board cards, week
  cards and sprint rows (S2, S4).
- `today`: backlog todos planned for today show between sprints (S8).
- `recurring`: optional rule slot inherited by instances (S10).
- `navigation`: eighth entry "Calendar" after Sprint; calendar in the layout and fit checks (S11, S13).

## Impact

- DB: migration 5 adds nullable `todos.start_time`, `todos.end_time`, `recurring_rules.start_time`,
  `recurring_rules.end_time` (additive; a code rollback leaves them unread).
- Server: `todos.ts`, `sprints.ts`, `recurring.ts`, new `planning.ts` and `calendar.ts`; `/todos` actions parse day
  and times; new route `src/routes/calendar/`.
- UI: `TodoFields`, `TodoEditor`, `TodoRow`, `RuleForm`, Backlog, Plan, Recurring, Sidebar, HomeList; new calendar
  components; new `$lib/slot.ts` helpers and `monthGrid` in `$lib/week.ts`.
- Tests: `db.test.ts`, `todos.test.ts`, `sprints.test.ts`, `recurring.test.ts`, `week.test.ts`, e2e `sprint-views`,
  `navigation`, `responsive`, `backlog`, `planning`, `today`, `recurring`, plus new unit and e2e files; the `__test/seed`
  endpoint gains slots.
- Release: `package.json` / `package-lock.json` to 0.5.0; tag `v0.5.0` after the merge.
