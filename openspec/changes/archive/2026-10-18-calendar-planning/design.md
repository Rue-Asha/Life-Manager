## Context

Life-Manager keeps the invariant "a todo has a `day` only while it is in a sprint, and only a day of that sprint's
week": `createTodo`, `setDay` and `addToActiveSprint` refuse other days with `day-outside-sprint`, and every path to the
backlog (`toBacklog`, `pullTodo`, the suggested pull in `startSprint`, review carry) sets `day = NULL`. There are two
todo read models (`todoColumns` in `todos.ts`, `selectTodos()` in `sprints.ts`, the latter also used by `recurring.ts`
and `uni.ts`), migrations are append-only in `schema.ts` (now `user_version` 4), the `__test/seed` endpoint writes rows
directly, and the shell's `NAV_ITEMS` in `Sidebar.svelte` drives both the sidebar and `HomeList`. `TodoFields` is shared
by `QuickAdd` and `TodoEditor`; `TodoRow` renders every todo list, Board cards (`variant="card"`) and Week chips
(`variant="chip"`). `RailLayout` gives the docked rail at ≥1280 px, the overlay toggle below, and has a `wide` mode.

This change loosens the invariant to "a todo is in a sprint ⇔ its `day` (if any) lies in that sprint's week; a backlog
todo may carry a future day" and adds a time slot next to `day`.

## Goals / Non-Goals

**Goals:** S1–S14 of `scope.md`: planned date + slot on any future day, sprint membership following the date, auto-pull
of planned and missed todos at sprint start, slot display everywhere, Planned backlog section, planned-today on
Today, rule slots with instances and projection, a read-only month calendar with phone/wide layouts and links, an eighth
nav entry; every old-behaviour test rewritten, never deleted or skipped.

**Non-Goals:** (from scope.md, unchanged)
- Proton Calendar sync — split off as `proton-calendar-sync` (next change).
- Due dates in the calendar — Rue's decision: the calendar shows planned slots only; due date stays an optional field.
- Editing in the calendar (drag to move, click empty day to create) — read-only view chosen.
- Week/day calendar views with an hour grid — the Sprint Week view covers the current week.
- Sorting Today or Week-view columns by time — ordering stays as specified today; slots are displayed only.
- Slots across midnight, time zones other than Europe/Berlin, reminders/notifications.
- Recurring rules with intervals, start/end dates or monthly patterns — rules stay "every week on weekdays X", so the
  projection repeats weekly without end.
- Exam duration (exam_at is a point in time).

## Decisions

From scope.md (Gate 0), carried as they are:
- The calendar shows the planned slot (`day` + times), not the due date — Rue corrected the initial request.
- Slot = optional from–to on the planned day — Rue's choice.
- Future-planned todos join their week's sprint automatically at start — Rue's choice.
- Missed planned days are pulled into the next sprint as Unscheduled — Rue's choice, nothing gets lost.
- Recurring rules get an optional slot — Rue's choice.
- Calendar view: month grid, read-only; phone = grid with dots + day list — Rue's choice.
- Split: date model + view now, Proton sync next — Rue's choice.
- Recorded for the next change (not built here): sync via `roman-16/proton-cli` as a sidecar, one Proton calendar per
  aspect, ✓ for done, recurring occurrences, exams and planned slots synced, due dates not; ICS subscription rejected.

Technical choices for this change:
- **Additive migration 5, no CHECK** (R4). Four nullable `TEXT` columns. Validation lives in `$lib/slot.ts`, shared by
  server and forms; a CHECK would be final (migration 4's note) and buys nothing over the server check.
- **One placement rule in `src/lib/server/planning.ts`.** `setDay` (sprints.ts) and `createTodo` (todos.ts) both need
  "where does a todo with this date live"; sprints.ts already imports todos.ts, so the rule sits in its own module with
  raw SQL instead of creating an import cycle. The rule, for a non-null date `d`, with `A` = the active sprint:
  - todo in a closed sprint → keeps its sprint; `d` must lie in that sprint's week, else `day-outside-sprint`;
  - `d` before today and not in `A`'s week → `day-in-past`;
  - `d` in `A`'s week → into `A` on `d` (from the backlog: status To do; refused `review-required` while `A`'s review
    is required); a todo already in `A` just changes day;
  - otherwise → backlog with `d` (from `A`: status To do, like "Move to backlog"; from the planning draft: it leaves the
    draft and S6 brings it back if `d` is in the target week).
  `d = null` keeps sprint membership and clears day and slot. The status of a todo that stays in its sprint is untouched.
- **Slot follows day.** Invariant: no `day` ⇒ no slot. Every SQL path that sets `day = NULL` also nulls
  `start_time`/`end_time`; paths that change the day without times (DayPicker, drag, rail drop on a day, carried
  recurring placement) keep or assign the slot.
- **`setDay` is the one planning entry point.** `setDay(db, id, day, today, slot?)`: `slot` omitted keeps the current
  slot (DayPicker/drag); passed (editor) replaces it. The editor's Save posts `?/update` with `day`, `startTime`,
  `endTime` in the same form; the action validates the plan before writing the patch, so a refused date or slot
  changes nothing.
- **`day-outside-sprint` stays only where the request names the sprint**: `addToActiveSprint` with a day outside the
  active week (the rail drop always sends a sprint day) and a closed-sprint todo. `createTodo` with a day target and
  `setDay` follow the placement rule instead (scope touchpoint "loosen `day-outside-sprint`").
- **Sprint start order** (`startSprint`, one transaction): suggested pull (keeps an in-week day, clears others) →
  auto-pull of not-done backlog todos planned in the week (keep day + slot) → missed pull of not-done backlog todos
  planned before the week (Unscheduled, day + slot cleared) → `generateInstances`. Archived-semester todos are skipped by
  `todoWritable`, as the suggested pull already does. `pullTodo` keeps clearing day and slot (a hand-pulled todo's date
  lies outside the target week, since in-week ones are listed as automatic and not offered).
- **Projection in `calendar.ts`, not `recurring.ts`.** It only reads rules (`listRules`) and is used only by the
  calendar; keeping it out of `recurring.ts` lets the recurring and calendar units run in parallel.
- **Calendar grid** uses `RailLayout` with `wide` (fills the content width like Board) and the selected day's list as
  the rail; below 768 px the list renders under the grid instead. Muted days outside the month carry no entries, so a
  projection never shows in another month's cell. Exams use their class colour (the class is the exam's identity).
  Cells are buttons that select the day; entries open from the day list only.
- **UI copy is English like the rest of the app** (Rue at Gate 1): "Calendar", "Planned", "From"/"To", "all day",
  "Today", "Nothing planned", "+n more", "Joins automatically", "Projected".
- **Planned label** `plannedLabel(day, start, end, withDate)` in `$lib/slot.ts`, the date in the app's existing
  `dateLabel` style from `components/todo/format.ts` ("Tue 27 Oct", "Tue 3 Nov"), then " · " and the slot. In sprint rows (which show the day through the DayPicker) and Week chips
  the row passes `withDate = false`. The editor's "Planned" field is a prop of `TodoFields` that only `TodoEditor`
  turns on; QuickAdd stays as it is.
- **Nav entry "Calendar"** uses the existing `calendar` icon (Sprint keeps `calendar-days`); `NAV_ITEMS[].count`
  becomes optional and Calendar has none.
- **Release v0.5.0** (feature → minor) per the repo's ship memory; no spec or test pins the version (release-artifact
  derives it from `package.json`), so there is no release delta spec.

## Contracts

Unit 1 creates these; later units only use them.

```sql
-- migration 5 (appended to `migrations` in schema.ts)
ALTER TABLE todos ADD COLUMN start_time TEXT NULL;
ALTER TABLE todos ADD COLUMN end_time TEXT NULL;
ALTER TABLE recurring_rules ADD COLUMN start_time TEXT NULL;
ALTER TABLE recurring_rules ADD COLUMN end_time TEXT NULL;
```

```ts
// src/lib/types.ts
export type HhMm = string; // 'HH:MM', 00:00–23:59, Europe/Berlin wall time
export interface Slot { startTime: HhMm | null; endTime: HhMm | null }
// Todo: + startTime: HhMm | null; endTime: HhMm | null   (both read models: start_time AS startTime, end_time AS endTime)
// RecurringRule: + startTime: HhMm | null; endTime: HhMm | null   (toRule in recurring.ts)
// RuleInput: + startTime?: HhMm | null; endTime?: HhMm | null

// src/lib/slot.ts (U1, implemented and tested)
export type SlotError = 'invalid' | 'end-without-start' | 'end-before-start';
export function validateSlot(startTime: HhMm | null, endTime: HhMm | null):
	{ error: SlotError; field: 'startTime' | 'endTime' } | null;
export function slotLabel(startTime: HhMm | null, endTime: HhMm | null): string; // '18:00' | '18:00–19:30' | 'all day'
export function plannedLabel(day: IsoDate, startTime: HhMm | null, endTime: HhMm | null, withDate?: boolean): string;
	// withDate (default true): 'Tue 27 Oct · 18:00–19:30' | 'Tue 27 Oct'; withDate=false: '18:00–19:30' | '18:00' | ''
```

```ts
// src/lib/server/sprints.ts (U2)
export function setDay(db: DatabaseSync, todoId: Id, day: IsoDate | null, today: IsoDate, slot?: Slot): Result<Todo>;
	// errors: not-found · day-in-past@day · review-required · day-outside-sprint@day (closed sprint)
	//         · invalid@startTime|endTime · end-without-start@endTime · end-before-start@endTime
export function listPlannedForWeek(db: DatabaseSync, weekStart: IsoDate): Todo[];
	// not-done backlog todos with day in [weekStart, weekStart+6], ordered by day, start_time IS NOT NULL, start_time, title
// src/lib/server/todos.ts (U2)
export function createTodo(db: DatabaseSync, input: NewTodo, today?: IsoDate): Result<Todo>; // day target → placement rule
export function listBacklogDueToday(db: DatabaseSync, today: IsoDate): Todo[]; // due today OR planned today, once each
// src/lib/server/planning.ts (U2, internal to U2)
```

Form fields:
- `/todos?/setDay`: `id`, `day` (`''` clears), optional `startTime`, `endTime` (`''` = none). Without a `startTime` key
  the slot is kept (DayPicker posts only `day`).
- `/todos?/update`: as today, plus `day`, `startTime`, `endTime` when the editor's Planned field is present (the `day`
  key decides); validation before any write.
- `/recurring?/create|update`: plus `startTime`, `endTime` (`''` = none).

Markup and test ids:
- `TodoRow`: `data-testid="planned-label"` (U5); `/recurring` rule rows `id="rule-<id>"` (U3).
- Backlog section `data-testid="planned-section"`, plan page section `data-testid="plan-auto"` (U6).
- Calendar (U4): cells `data-testid="calendar-cell-<iso>"` (button, `aria-pressed`, `data-outside`),
  entries `data-testid="calendar-entry"` with `data-kind="todo|projection|exam"`, dots `calendar-dot`, day list
  `calendar-day-list`, controls named "‹" / "›" (accessible names "Previous month" / "Next month") and "Today".
- Seed endpoint (U1): `todos[].startTime`, `todos[].endTime`, `rules[].startTime`, `rules[].endTime`.

Calendar (U4, internal):
```ts
// src/lib/week.ts
export function monthGrid(month: string): IsoDate[][]; // 'YYYY-MM' → weeks Mon–Sun covering the month
export function parseMonth(param: string | null, today: IsoDate): string; // valid 'YYYY-MM' or today's month
// src/lib/server/calendar.ts
export type CalendarEntry =
	| { kind: 'todo'; todo: Todo; startTime: HhMm | null; endTime: HhMm | null; title: string; aspectId: Id; done: boolean }
	| { kind: 'projection'; ruleId: Id; title: string; aspectId: Id; startTime: HhMm | null; endTime: HhMm | null }
	| { kind: 'exam'; classId: Id; title: string; color: AspectColor; room: string | null; startTime: HhMm | null; endTime: null };
export function calendarMonth(db: DatabaseSync, month: string, today: IsoDate):
	{ month: string; weeks: IsoDate[][]; entries: Record<IsoDate, CalendarEntry[]> };
```

## Risks / Trade-offs

- [The "backlog ⇒ no day" invariant is assumed in more places than the touchpoints list (R1)] → every SQL path that
  writes `day` is named above; U2 greps `day = NULL` / `day IS NULL` and the rewritten tests cover each path.
- [Projection could double real instances (R3)] → projection only after the active sprint's week, from today without a
  sprint; the active week shows real instances only; unit scenario "Rules are projected after the active sprint week".
- [Migration must stay additive (R4)] → nullable columns only; a rolled-back build ignores them.
- [The calendar's "Today" control shares its name with the sidebar's "Today" link] → e2e locators scope the control to
  the calendar header (repo learning: scope locators to a container test id).
- [Month cells at 768–1279 px are narrow] → titles ellipsize; the day list in the overlay rail carries the full entries.
- [Editor Save writes patch and plan in one action] → the plan is validated first, so a refused date never leaves a
  half-saved todo.

## Migration Plan

Migration 5 runs on the next start (`user_version` 4 → 5) and only adds columns. Rollback = deploy the previous release;
the extra columns stay unread. No data backfill.

## Open Questions

None.
