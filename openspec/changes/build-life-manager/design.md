## Context

New, empty repo. Rue's web standard (SvelteKit + Vite + TS, npm) plus the SISTEMA precedent
(`adapter-node` + `node:sqlite` already runs on the homelab), so the later deploy (split off) stays
identical. Single user, no auth, light theme only. Scope, flows and decisions: `scope.md`.
Design references: `design-refs.md` — its dark-mode, keyboard and natural-language bullets do not
apply (Non-goals).

## Goals / Non-Goals

**Goals:** everything in `scope.md` S1–S21, built as layered units: harness → design spike →
contract/runtime → services → UI → responsive pass.

**Non-Goals:** as in the proposal. In particular no auth, no dark mode, no shortcuts, no NL quick add,
no stats UI, no homelab deploy.

## Decisions

- **Data access: plain SQL over `node:sqlite` (`DatabaseSync`), no ORM.** Every service function takes
  the `db` as its first argument, so unit tests run against `openDb(':memory:')`. Alternative
  (Drizzle/Kysely) adds a dependency for five tables.
- **Migrations: ordered SQL strings in `src/lib/server/schema.ts`, tracked with `PRAGMA user_version`,**
  each in a transaction. Run from SvelteKit's `init` hook in `src/hooks.server.ts`; any error →
  `console.error` + `process.exit(1)`. `openDb` creates the parent directory of `DATABASE_PATH`.
- **Env:** `PORT` (adapter-node default), `DATABASE_PATH` (default `./data/life-manager.db`),
  `LM_TEST=1` enables test hooks only.
- **Dates are `IsoDate` strings (`YYYY-MM-DD`) on the Europe/Berlin calendar.** The only place an
  instant becomes a date is `berlinToday(now)` (Intl, `timeZone: 'Europe/Berlin'`); after that all
  week arithmetic is calendar arithmetic on UTC-midnight dates, so DST cannot shift a boundary.
  "Today" is always computed server-side from `clock.now()`.
- **Clock is injectable for e2e.** `clock.now()` returns a test override set via `POST /__test/clock`
  when `LM_TEST=1`, else `new Date()`. Unit tests pass `today` explicitly.
- **Sprint states: `planning` → `active` → `closed`.** A `planning` draft holds pulled todos (so
  pulls survive reloads and carried todos have a home between review and start). Its `weekStart`
  is set at start time to `targetWeek(today)`. Review availability is derived, never stored:
  `reviewState(weekStart, today)` → running (before Sunday) / review-available (Sunday) /
  review-required (after Sunday). Weeks away: the one active sprint is reviewed; no sprints are
  created for skipped weeks.
- **Planning suggestions** are computed, not stored: backlog todos with `dueDate` in the target week,
  rendered pre-checked; `startSprint` pulls the ids still checked.
- **Review close** (one transaction): done todos stay on the closed sprint; `carry` → moves to a new
  `planning` draft, keeps status, `day = null`; `backlog` → `sprintId = null`, `day = null`,
  `status = 'todo'`; `drop` (recurring instances only) → deleted. Decisions default to `carry`.
- **Recurring instances** are ordinary todos with `recurring = 1` and `ruleId` (FK `ON DELETE SET NULL`,
  so deleting a rule keeps its instances, which stay "recurring" for review). `generateInstances`
  inserts one todo per rule weekday on or after `fromDay` within the sprint, `day` pre-assigned,
  checklist copied from the template. Called by `startSprint` (fromDay = weekStart) and by
  `createRule` during an active sprint (fromDay = today).
- **Todo mutations are form actions on one route, `/todos`,** posted from every view with
  `use:enhance` (then `invalidateAll`). One place for validation; views stay load-only.
- **Drag on desktop = native HTML5 drag-and-drop** enabled under `(hover: hover) and (pointer: fine)`;
  touch uses the status menu / day picker / pull picker, which also exist on desktop.
- **First-run redirect** in `src/routes/+layout.server.ts` (U7): zero aspects → `/welcome` (except on `/welcome`, `/healthz`, `/__test/*`).
- **Design tokens** are CSS custom properties on `:root` in `src/lib/styles/tokens.css` (from the
  S2 spike); the fixed aspect palette, icon set (inline SVG paths) and the six presets live in
  `src/lib/aspect-style.ts`. Components use tokens only — no raw colours.
- **E2E isolation:** Playwright runs `node build` on `$PORT` with `DATABASE_PATH=.e2e/$PORT.db`,
  `LM_TEST=1`, `workers: 1`; every test starts with `POST /__test/reset`, then seeds what it needs
  through `e2e/helpers.ts` (`reset`, `seed`, `setClock`; U3). The runtime tests (S20)
  spawn their own `node build` on `$PORT + 1000` with a temp directory.

## Contracts

Created by U3 (types + stubs that typecheck; `berlinToday`, `isOverdue`, db, clock, hooks and test
routes fully implemented). Units U4–U13 use these; changing one is a deviation to report.

### Schema (`src/lib/server/schema.ts`, migration 1)

```sql
aspects(id INTEGER PK, name TEXT NOT NULL, color TEXT NOT NULL, icon TEXT NOT NULL,
        position INTEGER NOT NULL, created_at TEXT NOT NULL)
  -- UNIQUE INDEX on lower(name)
sprints(id INTEGER PK, week_start TEXT NULL, state TEXT NOT NULL CHECK (state IN ('planning','active','closed')),
        started_at TEXT NULL, closed_at TEXT NULL)
recurring_rules(id INTEGER PK, title TEXT NOT NULL, aspect_id INTEGER NOT NULL REFERENCES aspects(id),
        weekdays TEXT NOT NULL /* '1,3,5' ISO */, notes TEXT NOT NULL DEFAULT '', priority INTEGER NOT NULL DEFAULT 0,
        checklist TEXT NOT NULL DEFAULT '[]' /* JSON string[] */, created_at TEXT NOT NULL)
todos(id INTEGER PK, title TEXT NOT NULL, aspect_id INTEGER NOT NULL REFERENCES aspects(id),
        notes TEXT NOT NULL DEFAULT '', priority INTEGER NOT NULL DEFAULT 0 /* 0 none, 1..3 = P1..P3 */,
        due_date TEXT NULL, sprint_id INTEGER NULL REFERENCES sprints(id),
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')), day TEXT NULL,
        recurring INTEGER NOT NULL DEFAULT 0, rule_id INTEGER NULL REFERENCES recurring_rules(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL, completed_at TEXT NULL)
checklist_items(id INTEGER PK, todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
        text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL)
```
Backlog = `sprint_id IS NULL`. At most one row with `state = 'active'` and one with `state = 'planning'`
(partial unique indexes).

### Types (`src/lib/types.ts`)

```ts
export type Id = number;
export type IsoDate = string;                       // 'YYYY-MM-DD', Europe/Berlin calendar
export type Priority = 0 | 1 | 2 | 3;               // 0 = none, 1 = P1 (highest)
export type Status = 'todo' | 'doing' | 'done';
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;    // ISO, 1 = Monday
export type ReviewState = 'running' | 'review-available' | 'review-required';
export type SprintPhase = 'none' | 'planning' | ReviewState;  // 'none' = no active/planning sprint
export type ReviewDecision = 'carry' | 'backlog' | 'drop';
export type Target = { kind: 'backlog' } | { kind: 'sprint' } | { kind: 'day'; day: IsoDate };
export type Result<T> = { ok: true; value: T } | { ok: false; error: string; field?: string };

export interface Aspect { id: Id; name: string; color: AspectColor; icon: AspectIcon; position: number }
export interface ChecklistItem { id: Id; todoId: Id; text: string; done: boolean; position: number }
export interface Todo {
  id: Id; title: string; aspectId: Id; notes: string; priority: Priority; dueDate: IsoDate | null;
  sprintId: Id | null; status: Status; day: IsoDate | null; recurring: boolean; ruleId: Id | null;
  checklist: ChecklistItem[]; createdAt: string; completedAt: string | null;
}
export interface Sprint { id: Id; weekStart: IsoDate | null; state: 'planning' | 'active' | 'closed';
  startedAt: string | null; closedAt: string | null }
export interface RecurringRule { id: Id; title: string; aspectId: Id; weekdays: Weekday[]; notes: string;
  priority: Priority; checklist: string[] }
export interface NewTodo { title: string; aspectId: Id; notes?: string; priority?: Priority;
  dueDate?: IsoDate | null; checklist?: string[]; target?: Target }
export interface TodoPatch { title?: string; aspectId?: Id; notes?: string; priority?: Priority; dueDate?: IsoDate | null }
export interface AspectInput { name: string; color: AspectColor; icon: AspectIcon }
export interface RuleInput { title: string; aspectId: Id; weekdays: Weekday[]; notes?: string;
  priority?: Priority; checklist?: string[] }
```
`AspectColor`, `AspectIcon` come from `src/lib/aspect-style.ts` (U2): `ASPECT_COLORS`, `ASPECT_ICONS`
(`as const` records) and `PRESET_ASPECTS: AspectInput[]` (Health, Uni, Job, Home, Finance, Social).

Error codes (`Result.error`): `'required'`, `'duplicate'`, `'not-found'`, `'target-required'`,
`'only-aspect-in-use'`, `'no-aspect'`, `'no-active-sprint'`, `'review-pending'`, `'sprint-active'`,
`'day-outside-sprint'`, `'weekdays-required'`, `'not-recurring'`.

### Pure modules

- `src/lib/week.ts` (U6; `berlinToday` by U3): `berlinToday(now: Date): IsoDate`, `addDays(d, n): IsoDate`,
  `weekStartOf(d): IsoDate`, `weekDays(weekStart): IsoDate[]` (7), `weekdayOf(d): Weekday`,
  `targetWeek(today): IsoDate`, `reviewState(weekStart, today): ReviewState`.
- `src/lib/todo-utils.ts` (U3): `isOverdue(todo, today): boolean` — `dueDate < today && status !== 'done'`.

### Server modules (`src/lib/server/`)

- `db.ts` (U3): `openDb(path: string): DatabaseSync` (mkdir, `foreign_keys = ON`, WAL, migrate, throws),
  `getDb(): DatabaseSync` (singleton from env), `resetDb(): void` (test hook).
- `clock.ts` (U3): `now(): Date`, `today(): IsoDate`, `setTestNow(d: Date | null): void`.
- `aspects.ts` (U5): `listAspects(db)`, `countAspects(db)`, `createAspect(db, input): Result<Aspect>`,
  `updateAspect(db, id, input): Result<Aspect>`, `aspectUsage(db, id): { todos: number; rules: number }`,
  `deleteAspect(db, id, targetId?: Id): Result<void>`.
- `todos.ts` (U5): `createTodo(db, input: NewTodo): Result<Todo>`, `getTodo(db, id)`, `updateTodo(db, id, patch): Result<Todo>`,
  `deleteTodo(db, id): Result<void>`, `addChecklistItem(db, todoId, text)`, `renameChecklistItem(db, itemId, text)`,
  `toggleChecklistItem(db, itemId, done)`, `deleteChecklistItem(db, itemId)` (all `Result`),
  `listBacklog(db, aspectId?: Id): Todo[]` (priority P1→P3→none, then due date, nulls last),
  `listOverdue(db, today): Todo[]`.
- `sprints.ts` (U6): `sprintPhase(db, today): { phase: SprintPhase; sprint: Sprint | null }`,
  `getActiveSprint(db)`, `openPlanning(db, today): Result<{ sprint: Sprint; weekStart: IsoDate }>`,
  `suggestedTodos(db, today): Todo[]`, `pullTodo(db, todoId)`, `unpullTodo(db, todoId)`,
  `startSprint(db, today, suggestedIds: Id[]): Result<Sprint>`, `listSprintTodos(db, sprintId): Todo[]`,
  `listToday(db, today): Todo[]`, `addToActiveSprint(db, todoId)`, `moveToBacklog(db, todoId)`,
  `setStatus(db, todoId, status)`, `toggleDone(db, todoId)`, `setDay(db, todoId, day: IsoDate | null)`,
  `reviewSummary(db): { sprint: Sprint; done: Todo[]; open: Todo[] } | null`,
  `closeReview(db, today, decisions: Record<Id, ReviewDecision>): Result<Sprint>` (returns the new planning draft).
- `recurring.ts` (U6): `listRules(db)`, `createRule(db, input, today): Result<RecurringRule>`,
  `updateRule(db, id, input): Result<RecurringRule>`, `deleteRule(db, id): Result<void>`,
  `generateInstances(db, sprint: Sprint, fromDay: IsoDate): Todo[]`.

### Routes and form actions

| Route | Owner | Load / actions (form field names) |
|---|---|---|
| `GET /healthz` | U3 | `200 ok` |
| `POST /__test/reset`, `POST /__test/clock` (`{ now: ISO string \| null }`), `POST /__test/seed` (`{ aspects?, todos?, sprint?, rules? }` → created ids) | U3 | 404 unless `LM_TEST=1`; seed writes plain SQL so e2e never depends on another unit's UI |
| `/welcome` | U7 | presets + `?/create` (`preset` repeated, `name`/`color`/`icon` for custom) |
| `/aspects` | U7 | `?/create`, `?/update` (`id`, `name`, `color`, `icon`), `?/delete` (`id`, `targetId?`) |
| `/todos` | U8 | `?/create` (`title`, `aspectId`, `notes`, `priority`, `dueDate`, `checklist` repeated, `target` = backlog\|sprint\|day, `day`), `?/update` (`id` + fields), `?/delete` (`id`), `?/checklistAdd` (`todoId`, `text`), `?/checklistRename` (`itemId`, `text`), `?/checklistToggle` (`itemId`, `done`), `?/checklistDelete` (`itemId`), `?/setStatus` (`id`, `status`), `?/toggleDone` (`id`), `?/setDay` (`id`, `day`), `?/addToSprint` (`id`), `?/moveToBacklog` (`id`) |
| `/backlog?aspect=<id>` | U8 | grouped backlog |
| `/recurring` | U9 | `?/create`, `?/update` (`id`, `title`, `aspectId`, `weekday` repeated, `notes`, `priority`, `checklist` repeated), `?/delete` (`id`) |
| `/sprint/plan` | U10 | `?/pull` (`id`), `?/unpull` (`id`), `?/start` (`suggested` repeated) |
| `/sprint/review` | U10 | `?/close` (`decision-<todoId>` = carry\|backlog\|drop) |
| `/sprint?view=aspect\|board\|week` | U11 | sprint views; `SprintPrompt` when no active sprint or review pending |
| `/` | U12 | Today |
| `/menu` | U4 | phone home list |

Failed actions return `fail(400, { error, field, values })`; forms render the error inline next to `field`.

### Components (`src/lib/components/`)

- U4 `ui/`: `Button`, `Chip`, `Sheet` (`open`, `title`, `onclose`, children; bottom sheet on phone, dialog
  on desktop), `ConfirmDialog` (`open`, `title`, `message`, `confirmLabel`, `onconfirm`, `oncancel`, children),
  `EmptyState` (`message`, `href?`, `actionLabel?`), `AspectIcon` (`icon`, `color`, `size?`),
  `AspectTag` (`name`, `color`, `icon`), `PageHeader` (`title`, `icon?`, `color?`, children for actions;
  shows a back link to `/menu` on phone). `shell/`: `Sidebar`, `HomeList` (items: Today `/`, Sprint
  `/sprint`, Backlog `/backlog`, Aspects `/aspects`, Recurring `/recurring`).
- U8 `todo/`: `TodoRow` (`todo`, `aspect`, `today`, `context: 'backlog' | 'sprint' | 'today' | 'planning'`,
  `sprintDays?: IsoDate[]`), `QuickAdd` (`aspects`, `target: Target`, `defaultAspectId?`), `TodoEditor`
  (`todo`, `aspects`, `open`, `onclose`), `StatusControl` (`todoId`, `status`), `DayPicker` (`todoId`,
  `day`, `sprintDays`), `SprintPrompt` (`phase: SprintPhase`). All post to `/todos` actions.
- Test ids used by e2e: `data-testid="todo-row"` with `data-todo-id`, `data-status`, `data-day`;
  `board-column-<status>`, `day-column-<IsoDate|unscheduled>`, `aspect-group-<aspectId>`.

## Risks / Trade-offs

- [Vitest/Vite may rewrite `node:sqlite` to bare `sqlite`] → U1's first unit test opens `node:sqlite`
  under Vitest; if it fails, mark it external (`ssr.external` / `server.deps`) or load via `createRequire`.
- [Native HTML5 drag is flaky in Playwright] → e2e uses `locator.dragTo`; the touch-path tests carry
  the status/day assertions if drag needs a retry strategy.
- [One shared DB per e2e run] → `workers: 1` + reset before each test; slower but deterministic.
- [Scope is large for the appetite] → cut candidates S11, S16, S18, S21 map to U10 (suggestion task),
  U11 (week-view tasks), U9 + task 6.5, U12.
- [R4: `node:sqlite` needs Node ≥ 22.5] → accepted; `engines.node >= 22.5` in `package.json`.

## Migration Plan

None — new repo, empty database. Homelab deploy is split off.

## Open Questions

None blocking. The visual direction is settled at U2's taste gate.
