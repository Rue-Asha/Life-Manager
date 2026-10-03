## Context

Builds on the archived change build-life-manager (`openspec/changes/archive/2026-10-03-build-life-manager/`,
read its design.md "Build notes" before touching UI). Scope, flows and Mobbin references: `scope.md`.
The data model already supports the aspect → backlog → sprint pipeline (`todo.aspect_id`, nullable
`sprint_id`), so there is no schema change and no migration. All todo mutations stay form actions on
`/todos`, posted with `use:enhance` + `submit()` from `src/lib/components/todo/form.ts`.

## Goals / Non-Goals

**Goals:** S1–S14 from `scope.md`, cut as contract → server rules ∥ shell ∥ rail+row actions →
Sprint tab ∥ aspect page → board/week ∥ Today+polish.

**Non-Goals:** as in the proposal — no goals/capacity, no manual ordering, no change to Review → Plan →
Start, Plan and Backlog "Add to sprint" stay, no docked inspector, no dark mode, no shortcuts, no search
beyond the rail filter.

## Decisions

From `scope.md` (Rue's decisions, unchanged):
- The sprint organises todos *by aspect*: aspect → backlog → sprint is one pipeline shown on the Sprint tab (rail) and on each aspect page — no schema change.
- Sprint management lives permanently on the Sprint tab; Plan stays for the next-week draft and shares the rail component.
- Progress is done/total per aspect, not points/capacity — no estimates exist in the model.
- Rail on the right at ≥1280, overlay toggle below — Mobbin: Jira "Unscheduled work" rail https://mobbin.com/screens/5fddb893-f912-443e-bd23-ec673aa6a254, Linear cycle + inspector flow https://mobbin.com/flows/801fe69f-8f59-4bdc-a28a-9837f93fcd39 (screen 890e49aa-ac99-4fa8-b15c-d21076cbc045), ClickUp Planner https://mobbin.com/screens/87aa6e25-826f-425c-8456-d385d344fc83, Todoist Insights panel https://mobbin.com/screens/46dab991-e521-44bc-984a-c936e31610a8, Superlist panes https://mobbin.com/flows/495f838e-56fa-4539-ae58-4ea2dba639a1 (screen 73df32d9-dd60-4545-ae47-d09410fd0cfc).
- Per-aspect progress in group headers — Jira per-team cells https://mobbin.com/screens/994f09c1-4ca4-4127-8039-af78b1801a94.
- Week in one row filling width — Todoist Upcoming https://mobbin.com/screens/009edfa2-d70c-4e02-a9ee-ba3b81c33a6a, Amie list + grid https://mobbin.com/screens/41dde7c0-c4c4-4f68-a6bc-8c3e50977d13.
- Move motion without tilt, source closes, drop slot — ClickUp status flow https://mobbin.com/flows/1a8d1ee2-e9e2-47da-ba44-b7e37f20de7b, Basecamp placeholder https://mobbin.com/flows/0c8d2cf2-4132-42b1-ba65-91a17fed7d35 (screen 7c517ff9-2478-4b18-8ba7-b7ed515bfecc), Todoist drag https://mobbin.com/screens/349a1427-9550-4ec9-ab52-d3ddb0fa73a9 (tilt rejected).
- Panels dock with reflow, no scrim — Jira sidebar flow https://mobbin.com/flows/03bcd9ae-4012-41dc-aac6-98673a6fe3d4 (screen d4a9c031-0cba-41a8-b0f0-63499d51119c).
- Durations stay on the existing tokens (120/200/320 ms, ease-out) — Mobbin shows no timings; tokens already zero out under reduced motion.
- Recurring dedupe: carried instance fills the rule's first weekday — keeps Rue's review mechanism unchanged while removing the duplicate.

Technical (planner):
- **Rail is a per-page component, not a layout slot.** `RailLayout` (content + `rail` snippet) is rendered
  by the pages that have a rail; the root layout only stops capping `.page` at ≥1280 and centres a 720 px
  column for pages without one (`.page:has(.rail-layout)` opts out). Alternative — a layout-level slot fed
  through a store or page data — needs cross-route plumbing for three screens.
- **`RailLayout` bands:** ≥1280 docked rail; 768–1279 toggle + overlay panel (widened from 1024–1279 at
  Gate 1: the overlay is the smaller choice for the tablet band than a third layout); <768 no rail at all —
  the page supplies its phone alternative (Sprint: the Manage sheet).
- **Week keeps the overlay rail at ≥1280** (Rue, 2026-10-03, during build): sidebar 248 + docked rail 340 +
  gutters leave ~628 px, too little for 7 × 120 px columns, so U6's in-week sideways scroll is replaced.
  `RailLayout` gets an `overlay` flag that keeps the 768–1279 toggle + overlay band at every width ≥768;
  `/sprint` passes `overlay={view === 'week'}`, leaving ~968 px for seven ~138 px columns. When `overlay`
  turns false (leaving Week) `open` resets to false, so a later return to Week starts closed. `WeekView`
  keeps rendering `UnscheduledList` into the rail from 1280 and drops its `overflow-x` on the week row.
  Alternatives: narrower rail (still doesn't fit 7 × 120 at 1280) or keeping sideways scroll (rejected by Rue).
- **Breakpoints are literal media queries** (768 / 1024 / 1280); CSS custom properties can't be used in
  `@media`. Rail width and min day-column width become tokens (`--rail-width`, `--day-col-min`).
- **One add function with placement.** `addToActiveSprint(db, todoId, today, placement?)` covers button,
  drop on list (no placement), drop on a day (`day`) and drop on a board column (`status`). It checks the
  phase first (S7: `review-required`, no write), then that the todo is still in the backlog (`not-found` →
  the UI reloads without a message, S2 race), then validates the day like `setDay`.
- **`removeFromSprint`** sends a normal todo to the backlog (`moveToBacklog`) and deletes a recurring
  instance (`deleteTodo`). Undo is client-side: the row hides at once and the toast holds the delete for
  5 s; Undo cancels it, expiry or navigation (`beforeNavigate`) posts it. Alternative — delete at once and
  restore from a server-side snapshot — needs a restore action and checklist copying; not worth it for one
  toast. Trade-off: closing the tab within 5 s keeps the instance (harmless).
- **S8 lives in `generateInstances`**: for each rule, open carried instances already in the sprint
  (`rule_id` = rule, ordered by id) take the rule's weekdays in order (`day` set, status kept); fresh
  instances are inserted only for the weekdays left. Instances with `rule_id IS NULL` are untouched (keep
  `day = null`). The mid-sprint `createRule` path is unaffected (no carried instances of a new rule).
  "Paused" rules don't exist in the model; the deleted-rule edge covers it.
- **Progress is computed server-side** by `aspectProgress(db, sprintId)` and `backlogCounts(db)`, loaded by
  Sprint, Today, Aspects and the aspect page. Views that move todos optimistically recompute from their
  local list, so counts change with the motion.
- **Drag: one shared module.** `src/lib/dnd.ts` replaces the ad-hoc drag code in Plan and `SprintCard`'s
  `dropTarget`: a `draggableTodo` action (only under `(hover: hover) and (pointer: fine)`) and a `dropZone`
  action that sets `data-over` for the hairline drop slot. Payload is JSON under one MIME type.
- **Move motion:** one Svelte `crossfade` pair from `src/lib/motion.ts`, keyed by todo id, used by the rail,
  the sprint lists, board columns and day columns, plus `animate:flip` for the closing gap; optimistic
  `moved` state (pattern already in `WeekView`/`BoardView`) so the item travels before the reload; on a
  failed action the optimistic state is dropped and the item travels back. Durations read
  `prefers-reduced-motion` and become 0.
- **Navigation motion:** `onNavigate` in `src/routes/+layout.svelte` wraps the navigation in
  `document.startViewTransition` when it exists and reduced motion is off; the cross-fade duration is set on
  `::view-transition-old/new(root)` from the `--dur-fast`/`--dur-base` tokens (120–200 ms). The rail overlay slides with a CSS
  transform transition on `--dur-slow` (320 ms); no scrim element.

## Contracts

Created by U1 (types, signatures and stubs that typecheck; small shared pieces fully implemented as
noted). Units U2–U8 use these; changing one is a deviation to report.

### Types (`src/lib/types.ts`)

```ts
export interface AspectProgress { done: number; total: number }
export interface Placement { day?: IsoDate | null; status?: Status }
```
New error code: `'review-required'` (adding to the sprint while the review is required).

### Server (`src/lib/server/`)

- `sprints.ts`
  - `addToActiveSprint(db, todoId: Id, today: IsoDate, placement?: Placement): Result<Todo>` — U1 adds the
    parameters (behaviour as today); U2 implements placement and the `review-required` check.
    Errors: `no-active-sprint`, `review-required`, `not-found`, `day-outside-sprint` (field `day`).
  - `removeFromSprint(db, todoId: Id): Result<{ deleted: boolean; todo: Todo }>` — **implemented by U1**
    (recurring → delete, else `moveToBacklog`); errors from `moveToBacklog` / `not-found`.
  - `aspectProgress(db, sprintId: Id): Record<Id, AspectProgress>` — stub `{}` in U1, U2 implements;
    only aspects with ≥1 todo in that sprint have a key.
- `todos.ts`: `backlogCounts(db): Record<Id, number>` — stub `{}` in U1, U2 implements; only aspects with
  ≥1 backlog todo have a key.
- `recurring.ts`: `generateInstances` keeps its signature; U2 changes its behaviour (S8).

### `/todos` form actions (U1)

| Action | Fields | Calls |
|---|---|---|
| `?/addToSprint` | `id`, `day?` (IsoDate or empty), `status?` (todo\|doing\|done) | `addToActiveSprint(db, id, today(), { day, status })` |
| `?/removeFromSprint` | `id` | `removeFromSprint` |

Failures keep the existing shape `fail(400, { error, field, values })`. UI rule: `not-found` from
`addToSprint` → `invalidateAll()` without a message; `review-required` → message "The sprint needs its
review first." with a link to `/sprint/review`.

### Shared client modules (U1, fully implemented)

- `src/lib/dnd.ts`
  ```ts
  export const TODO_MIME = 'application/x-lm-todo';
  export type DragFrom = 'backlog' | 'sprint';
  export interface DragPayload { id: Id; from: DragFrom; recurring: boolean }
  export const canDrag: MediaQuery;                       // (hover: hover) and (pointer: fine)
  export function draggableTodo(node: HTMLElement, payload: DragPayload): ActionReturn<DragPayload>;
  export function dropZone(node: HTMLElement, opts: { accepts: (p: DragPayload) => boolean;
    ondrop: (p: DragPayload) => void }): ActionReturn;     // sets data-over="" while a matching drag is over
  ```
- `src/lib/motion.ts`
  ```ts
  export const MOVE_MS = 200, NAV_MS = 160, RAIL_MS = 320;
  export function reducedMotion(): boolean;               // matchMedia('(prefers-reduced-motion: reduce)')
  export const [send, receive]: [CrossfadeFn, CrossfadeFn]; // crossfade keyed by todo id, MOVE_MS, cubicOut; 0 ms when reduced
  export function flipOpts(): { duration: number };        // MOVE_MS or 0
  ```
- `src/lib/styles/tokens.css`: `--rail-width: 340px`, `--day-col-min: 120px`.

### Components (`src/lib/components/`)

| Component | Props | Stub in U1 / owner |
|---|---|---|
| `ui/ProgressBar.svelte` | `done: number; total: number; color: AspectColor` — renders "done / total" (`data-testid="progress"`) and a hairline bar | **implemented by U1** |
| `ui/Toast.svelte` | `message: string; actionLabel?: string; onaction?: () => void; ontimeout: () => void; duration?: number` (default 5000) — `data-testid="toast"` | stub · U4 |
| `rail/BacklogRail.svelte` | `backlog: Todo[]; aspects: Aspect[]; progress?: Record<Id, AspectProgress>; canAdd: boolean; addAction: string` (e.g. `/todos?/addToSprint`, `?/pull`)`; addLabel?: string; onreturn?: (id: Id) => void` (set → the rail is a drop zone for `from: 'sprint'` payloads with `recurring: false`; recurring instances have no backlog)`; testid?: string` (default `backlog-rail`) | stub lists titles · U4 |
| `shell/RailLayout.svelte` | `children: Snippet; rail?: Snippet; railTitle: string; wide?: boolean; overlay?: boolean` (wide → content not capped at 720; overlay → toggle + overlay panel instead of docking at ≥1280, `open` resets when it turns false — added by U9) | stub renders children then rail · U3 |
| `sprint/UnscheduledList.svelte` | `todos: Todo[]; sprintDays: IsoDate[]; today: IsoDate` | stub renders nothing · U6 |

### Test ids (new)

`backlog-rail`, `rail-filter`, `rail-group-<aspectId>` (with `data-collapsed`), `rail-count`, `progress`,
`context-rail`, `rail-toggle`, `manage-button`, `manage-sheet`, `toast`, `aspect-card`, `aspect-sprint`,
`aspect-backlog`, `row-actions` (TodoRow/SprintCard action trigger). Kept as they are: `plan-backlog`,
`plan-sprint`, `plan-week`, `plan-suggestions`, `day-column-unscheduled` (moves with the list into the
rail at ≥1280), `aspect-group-<id>`, `board-column-<status>`, `day-column-<IsoDate>`.

### Page data (owners)

- `/sprint` (U5) adds `aspects`, `backlog: Todo[]`, `progress`, `backlogCounts`.
- `/aspects/[id]` (U7) returns `aspect`, `aspects`, `phase`, `today`, `sprintDays | null`,
  `sprintTodos`, `backlog`, `progress: AspectProgress | null`, `backlogCount`; unknown id → `error(404)`.
- `/aspects` (U7) adds `progress`, `backlogCounts`. `/` (U8) adds `progress`.

## Risks / Trade-offs

- [R1 e2e tests pin current behaviour] → accepted, updated with the change by their unit: `aspects.test.ts`
  (sidebar links `/backlog?aspect=` → `/aspects/<id>`, `aspect-row` list → cards at ≥1024; U7),
  `backlog.test.ts` (S7; U7), `planning.test.ts` (rail extraction keeps `plan-*` ids; U4),
  `sprint-views.test.ts` (Unscheduled at 1280 lives in the rail, default viewport is 1280; U6),
  `review.test.ts` (S8 journey; U2), `responsive.test.ts`, `journey.test.ts`, `today.test.ts` (U8).
- [R2 cross-list FLIP may jump when data reloads] → optimistic `moved` state keyed by todo id across lists;
  fallback is an instant move.
- [R3 View Transitions not in every browser] → progressive enhancement via `onNavigate`, instant elsewhere.
- [R4 `openspec/specs/` holds build-life-manager's synced specs now] → deltas are written against them;
  build-life-manager is archived before this change is archived.
- [R5 base branch `flow/build-life-manager` is still at Gate 2] → merge order is build-life-manager first.
- [Week's rail is an overlay at ≥1280, so `day-column-unscheduled` is inside a closed panel there] → tests that
  use it at 1280 open the rail toggle first (U9 updates `sprint-views.test.ts`).
- [Unscheduled list moves between WeekView and the rail] → U6 owns both the hiding and `UnscheduledList`,
  so the `day-column-unscheduled` test id exists exactly once at every width.
- [Toast-delayed delete] → a tab closed within 5 s keeps the instance; acceptable.

## Migration Plan

None — no schema change.

## Open Questions

None blocking.
