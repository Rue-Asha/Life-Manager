## Context

Five gate-1 decisions need backend work before the redesign. Facts found in the code: `aspects.position INTEGER NOT NULL` already exists and `listAspects` already sorts by `position, id`; new aspects get `max(position)+1`, and deleting leaves gaps. `/welcome` has no `load` (only `?/create`, which runs `createAspect` per input and rolls back on the first `duplicate`). `/backlog` does `Number(param)`, so `?aspect=abc` becomes `NaN` in page data and only returns nothing by accident of SQLite binding. `/menu` is a static page; the wide-screen shell switches at the CSS breakpoint `min-width: 768px` in `src/routes/+layout.svelte`.

## Goals / Non-Goals

**Goals:** make the five behaviors exist, tested at unit/server level, with data the redesign can render.
**Non-Goals:** any UI for reorder, existing-preset marking or status exposure; a live-resize redirect; a migration to compact positions.

## Decisions

**Aspect order: reuse `position`, no migration.** `reorderAspects(db, ids)` checks `ids` is a permutation of the current aspect ids (same set, no duplicates, no unknown) and rewrites `position = index` inside `BEGIN/COMMIT` (rollback on throw, like `deleteAspect`). Mismatch returns `{ ok: false, error: 'invalid', field: 'order' }`. The action `?/reorder` on `/aspects` reads repeated form fields `order` (aspect ids in the new order) and calls it; failure is `fail(400, ...)` as the other actions. A full ordered list instead of `moveUp`/`moveDown`: one function serves drag, keyboard and touch equivalents (the UI computes the list), and a stale list is detected instead of guessed at. Alternative considered: `moveAspect(id, delta)`: smaller call, but races between tabs silently swap the wrong rows. Ties and gaps are harmless (`ORDER BY position, id`); the first reorder makes positions dense. No `ALTER TABLE`, so no `⚠ irreversible` step.

**Everything that lists aspects already goes through `listAspects`**, so nav, pickers, `/aspects` and backlog groups follow the order with no further change; task 1.4 verifies this by reading call sites and the e2e scenario of task 1.5 proves it for backlog groups, the todo picker and the rule form, and the redesign must not re-sort by name.

**Preset exists: report in `load`, skip in the action.** New `load` in `welcome/+page.server.ts` returns `existingPresets: string[]` (names of `PRESET_ASPECTS` that match an existing aspect name, case-insensitive, using the same fold as `createAspect`'s `validate`: `toLowerCase`). The action filters submitted presets by the same rule before creating. Skipping (not failing) is chosen because the UI disables them, so a submit containing one is a race or a hand-made request and a hard error would be the "silent duplicate error" Rue rejected. If nothing is left (no presets, no custom) it returns the existing `required` on `preset`. The custom path still fails with `duplicate` (that error is legitimate and stays beside the name field). Alternative: filter in the page component only: rejected, the server must not depend on the client for this.

**Backlog parameter: one pure parser.** `parseAspectFilter(param: string | null)` in `src/lib/aspect-filter.ts` returns `{ kind: 'all' }` for `null`/`''`, `{ kind: 'id', id }` for `/^\d+$/` that is a safe integer, else `{ kind: 'unknown' }`. The load: `all` -> `listBacklog(db)`, `aspectId: null`; `id` -> if an aspect with that id exists, `listBacklog(db, id)` and `aspectId: id`, else empty list and `aspectId: null`; `unknown` -> `todos: []`, `aspectId: null`. So `NaN` never reaches page data, and "numeric but nonexistent" behaves the same as "non-numeric" (one rule for the designers). Because `aspectId` is null the existing empty copy falls to the generic branch; the redesign owns whether it says something more specific.

**`/menu` redirect: client-side, on mount, `replaceState`.** The server cannot know the viewport: no `Sec-CH-Viewport-Width` on the first request without a prior `Accept-CH` round trip, and User-Agent sniffing mislabels tablets and resized windows. A CSS-only hide is not a redirect. So `menu/+page.svelte` does, in `onMount`, `if (matchMedia(WIDE_QUERY).matches) goto('/', { replaceState: true })`, with `WIDE_QUERY` exported from `src/lib/layout.ts` next to a comment naming the CSS breakpoint it mirrors. `replaceState` keeps Back from bouncing. Without script the hub renders at any width, which is acceptable (the page works). A brief flash of the hub on wide screens before the replace is accepted; the redesign may hide the hub with the same media query to remove it. Only on mount: a window resized while on `/menu` is not redirected. The redesign changes the breakpoint where the primary navigation appears; `WIDE_QUERY` must change with it (task 5.4).

**Project statuses: docs only.** Code (`ProjectStatus`, `PROJECT_STATUSES`, schema CHECK) already has five; the delta spec brings the spec in line (data model, overview group order In progress/Active/Backlog/Paused, status control, 20 ordered pairs). Check `src/lib/server/projects.test.ts` covers all 20 pairs (task 4.1).

**README:** the proxy section already explains the 403; add a short labelled "Deployment requirement" paragraph near the env table so it is not buried, no app code.

## Contracts

- `reorderAspects(db: DatabaseSync, ids: Id[]): Result<void>`; error `invalid`, field `order`.
- `?/reorder` on `/aspects`: form field `order` repeated (ids), success returns `{ ok: true }`.
- `/welcome` load data: `{ existingPresets: string[] }` (preset names).
- `/backlog` load data: `aspectId: number | null` (never `NaN`).
- `parseAspectFilter(param: string | null): { kind: 'all' } | { kind: 'id'; id: number } | { kind: 'unknown' }`.
- `WIDE_QUERY: string` in `src/lib/layout.ts`.

## Risks / Trade-offs

- [Redesign changes the wide breakpoint and forgets `WIDE_QUERY`] -> task 5.4 and the comment on the constant; the e2e scenarios at 1280 px and 375 px catch a regression only if the breakpoint moves across them.
- [Two tabs reorder at once] -> the second gets `invalid`; the UI reloads the list.
- [Existing e2e specs open `/menu` at wide widths] -> they will now land on `/`; task 5.3 moves them to 375 px.
- Pages do not render the new data yet (`existingPresets`, reorder action): harmless, additive.

## Migration Plan

No schema migration. Deploy is a normal release; rollback is reverting the code (positions written by `reorderAspects` stay valid for the old code since it only sorts by `position, id`).

## Gate-1 sign-off

Confirmed by Rue on 2026-11-13 (gate 1 / task 2.5), as written in this design: `/menu` redirects client-side at 768 px and wider; `/welcome` skips presets that already exist; an invalid `aspect` parameter gives an empty list.

## Open Questions

None. Whether the empty `/backlog` copy for an unknown filter is generic or specific is a redesign decision.
