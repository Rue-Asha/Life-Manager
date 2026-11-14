## Why

Rue answered the 16 open questions in `docs/functional-contract.md` (now "Gate-1 decisions") ahead of a full UI/UX redesign. Five of them change server, data or load behavior and must land before the redesign starts, so the designers work against a backend that already matches the contract; the rest are contract-only or UI work.

## What Changes

- **Aspect order (#8):** aspects become manually reorderable. New server action `?/reorder` on `/aspects` and a `reorderAspects` function rewrite `aspects.position`; every list that follows aspect order follows the new order. No schema migration (the `position` column exists).
- **`/welcome` presets (#2):** the `/welcome` load reports which presets already exist; the create action skips existing presets instead of failing with `duplicate`.
- **`/backlog?aspect=` (#4):** strict parsing; a non-numeric or unknown value gives an empty filtered list, never `All`, never `NaN` in page data.
- **`/menu` on wide screens (#12):** client-side replace-redirect to `/` where the persistent primary navigation is shown.
- **Project statuses (#1):** the it-projects spec is updated from four statuses to the code's five (`in_progress` added).
- **Deployment note (#11):** README states the origin/protocol requirement as a requirement; no app code.
- **Docs:** contract and `PRODUCT.md` carry the decisions (done alongside this change).
- UI affordances stay out of this change and come with the redesign: reorder interaction, disabled/marked presets, the accessible three-state status (#15), the phone-own-UI principle (#9).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `aspects`: onboarding skips and disables existing presets; new requirement to reorder aspects; aspect order is the app-wide order.
- `backlog`: aspect filter parameter handling.
- `navigation`: `/menu` redirects to `/` on wide screens.
- `it-projects`: five project statuses (data model, overview grouping, status control).
- `app-runtime`: README documents the origin/protocol deployment requirement.

## Impact

- `src/lib/server/aspects.ts` (+ `aspects.test.ts`), `src/routes/aspects/+page.server.ts`, `src/routes/welcome/+page.server.ts`, `src/routes/backlog/+page.server.ts`, `src/routes/menu/+page.svelte`, a new pure helper for the filter parameter, `README.md`.
- No migration, no new dependency. Existing e2e specs for `/menu` at wide widths need updating.
- UI work is deferred to the redesign: `/welcome` and `/aspects` pages get new data/actions they do not yet render.

## Non-Goals

- No visual or interaction design: how reordering looks, how existing presets are marked, how status is exposed.
- No change to decisions that are contract-only (#3, #5, #6, #7, #10, #13, #14, #16) and no code for the phone-UI principle (#9).
- No in-app warning for the plain-http 403 (#11).
- No unknown-route error page (#10).
- No live re-evaluation of `/menu` on window resize.

## Appetite

One evening.

## Done criteria

- [ ] Reordering aspects through the server action persists and is reflected by `listAspects` and the layout navigation data.
- [ ] `/welcome` load lists which presets exist; submitting an existing preset does not create a duplicate or fail.
- [ ] `/backlog?aspect=abc` and `?aspect=999` return an empty todo list and `aspectId: null`; `?aspect=` and no param return all.
- [ ] `/menu` at 1280 px ends on `/` with no extra history entry; at 375 px it stays.
- [ ] `openspec/specs/it-projects` lists five statuses after archive.
- [ ] README states the origin/protocol requirement in its own labelled paragraph.
- [ ] `proof` is green.
