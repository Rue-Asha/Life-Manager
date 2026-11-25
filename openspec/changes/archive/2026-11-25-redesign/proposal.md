## Why

Life-Manager is the last of the four apps still on its own pre-fingerprint look (sidebar + `/menu` hub, `tokens.css`, `design/`), so Rue's most-used app looks and navigates unlike Notes, Cooking and Creative. The redesign brings it onto the shared fingerprint and family IA without changing what it does. This change runs gates 3–8 of the ecosystem pipeline (Design-System `ecosystem-ui-revamp` section 13) for Life-Manager; gate 3 (`scope.md`) was signed off at flow Gate 0 on 2026-11-17.

## What Changes

- **Fingerprint.** Vendor fingerprint 2.1.0 with `Design-System/scripts/sync.sh`; `check-slop` and `check-drift` run in `proof`; accent lagoon; Life-Manager joins Design-System `apps.txt`; a temporary app-owned slop baseline keeps `proof` green over the old UI until the cleanup (S1). Stored aspect colours already use the eight `--aspect-*` token names (R5, checked at plan time).
- **Shell and navigation.** **BREAKING (UI):** the sidebar and the phone `/menu` drill-down are replaced. Desktop (≥768 px): a fingerprint top bar with Today, Sprint, Backlog, Calendar, a menu holding Aspects (with each aspect's link), Projects, Uni, Recurring and Sync, a New todo button, list counts and the sync-attention marker (S2). Phone (<768 px): a pill bar Today · Sprint · Backlog · Calendar · More plus a separate round "+" (S3). `/menu` becomes the More hub, reachable at every width and in two columns from 1280 px (S4; Rue's wave-10 call, which supersedes the gate-1 redirect to `/` on wide screens).
- **Global quick add.** The phone "+" and the desktop New todo open "New todo" from any screen, context-aware (aspect pre-filled on an aspect page, destination pre-set to the sprint on `/sprint`), with the destination always stated and the same `/todos?/create` action (S5). The functional contract's "no global New todo on phones" line is amended.
- **Overlays.** Todo editor with every field restyled (S6); sync attention as a marker in both bars and a Today banner (S7); shared dialogs/sheets, confirm dialogs, the undo toast, menus, empty states and the three detail-route 404 pages on the fingerprint (S23).
- **Screens.** Today (S8), Welcome (S9), Sprint in By aspect / Board / Week with a menu path for every drag and the backlog as a rail ≥1280 px and a sheet below (S10), Sprint plan (S11), Sprint review (S12), Backlog (S13), Calendar (S14), Recurring (S15), Aspects with Move up/down (S16), Aspect page (S17), Projects (S18), Project page (S19), Uni (S20), Class page (S21), Sync (S22).
- **Cross-cutting.** Every contract state per route, English (UK) copy without exclamation marks, WCAG 2.2 AA, phone targets ≥44 px, no horizontal scroll at 320 / 390 px, reduced motion, family motion, a keyboard and touch path for every drag, and chrome text that does not select (S24).
- **Master icon** `Design-System/icons/Life-Manager/icon.svg`, vendored by sync, with `app.html` icon links and a web manifest (S25).
- **Cleanup.** `src/lib/styles/tokens.css`, `design/`, the old shell, the slop baseline are removed before Verify, every `/__mockups/redesign` route after Rue's final acceptance (Gate 2), so signed and built can be compared there; `aspect-style.ts` resolves onto the fingerprint's `--aspect-*` tokens (S26).
- **e2e** follows the new UI: shell geometry tests rewritten for the bars, copy-dependent locators updated, every test a `proof:` line names kept or migrated, `__test/*` untouched (S27).
- **Gates.** Gate 4 `references.md` and greyscale wireframes (S28) and gate 5 hi-fi with the master icon (S29) each end with Rue's sign-off before the build waves; gate 7 is flow's Verify, gate 8 is Ship with tag v0.11.0.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `navigation`: sidebar, phone home list, wide context-rail layout and sidebar New todo are replaced by the top bar, pill bar, More hub, global quick add and sync-attention marker; counts and the sync link move with them; touch alternatives cover every drag site.
- `design-direction`: the old brief, tokens, style tile, mockup gates and list anatomy are removed; the vendored fingerprint, gate 4/5 mockups, master icon, contract-state and copy rule, accessibility floor, chrome-text rule, shared overlays, aspect-colour mapping, spec-named-test guard and the removal of the old styling are added.
- `motion`: moves and navigation transitions are reworded off the sidebar and old tokens; family press, menu and sheet motion added.
- `today`: summary header reworded off the old chrome surface; Today states on the fingerprint, tick done with undo, sync-attention banner.
- `sprint-views`: sprint header and compact week cards reworded off old tokens; the backlog sheet below 1280 px; views, menu moves and edge states on the fingerprint.
- `sprint-lifecycle`: Sprint plan and Sprint review screens on the fingerprint.
- `backlog`: Backlog screen on the fingerprint.
- `calendar`: Calendar screen on the fingerprint.
- `recurring`: Recurring screen on the fingerprint.
- `aspects`: Welcome, Aspects (with Move up/down) and Aspect page on the fingerprint.
- `it-projects`: Projects and Project page on the fingerprint.
- `uni-hub`: Uni and Class page on the fingerprint.
- `proton-sync`: Sync page on the fingerprint.
- `todos`: Todo editor on the fingerprint.
- `app-runtime`: `proof` runs the fingerprint guards.
- `release-artifact`: version 0.11.0.

## Impact

- UI layer: `src/routes/**/+page.svelte`, `+layout.svelte`, `+error.svelte`, `src/lib/components/**`, `src/lib/{layout,motion,dnd,aspect-style}.ts`, new `src/lib/nav.ts` and copy module, `src/app.html`, `src/app.css`, `static/` (fingerprint fonts, icon set, manifest), `package.json` (`proof`, version), `vite.config.ts` (unit tests under `scripts/`), `src/routes/__mockups/redesign/**` (frozen at gate 5 as tag `gate5-signed`, removed after Gate 2), `fidelity/**` (pair shots against the signed hi-fi, removed after Gate 2), the e2e suite.
- Route files move into a `(app)` layout group with unchanged URLs and unchanged content of every `+page.server.ts` / `+layout.server.ts` (design.md → P2, accepted at Gate 1 as A1); the `NavData` type import in the layout server load moves to `src/lib/nav.ts` (design.md → P6, accepted at Gate 1 as A2). The backlog load and the `__test/seed` checklist input are the only other server-side edits (see Non-Goals); apart from those, no server, schema, migration, load or action change; copy strings in server `fail()` messages are the only allowed server edits.
- Vendored, never edited here: `DESIGN.md`, `DESIGN.json`, `DESIGN-reference.md`, `fingerprint.lock`, `.gitleaks.toml`, `src/lib/styles/fingerprint/`, `scripts/fingerprint/`.
- Docs: `docs/functional-contract.md` (phone global add, navigation model, new strings) and `PRODUCT.md`.
- Cross-repo (Design-System, separate commits by the orchestrator, shipped with consent): `apps.txt` gets the Life-Manager path; `icons/Life-Manager/icon.svg` and its built set.
- Homelab PR #75 (life-manager v0.10.1) is merged or closed by Rue before the release bump (R9).

## Non-Goals

- Dark mode — Rue decided 2026-11-17 to leave it behind.
- Checkpoint B (wave-1 retrospective, fingerprint bump, sibling re-sync) — skipped by Rue's decision; stays open in the Design-System plan.
- Server, schema, migration, load-function, action or URL changes — UI layer only; copy strings in server `fail()` messages are the only server edits allowed. Two explicit exceptions, both decided during the build: (1) `src/routes/(app)/backlog/+page.server.ts` loads the key-facts numbers (open, planned, overdue over the whole backlog) and filters the aspect in memory, because the signed Backlog screen shows a key-facts card with real counts that stay the same under a filter (Rue, gate-5 Q4); the data returned for the list is unchanged. (2) `src/routes/__test/seed/+server.ts` accepts a checklist item as `{ text, done }` besides a string, so the fidelity seeds can reproduce a half-done checklist (test harness only, no app behaviour).
- New features: global search, offline / PWA, notifications, per-action sync feedback beyond S7.
- Changing first-run landing (`/welcome` → `/backlog` stays) — it is a server redirect.
- Creative's per-world night stage (`data-world` / `data-stage`) — optional in 2.1.0, not needed here.
- Four-app sibling sheet (revamp task 13.3) — Design-System work after this ships.
- Deploying — the Homelab bump stays a separate, confirmed step.

## Appetite

Several sessions, in phases: gate 4 wireframes, gate 5 hi-fi, then the build in waves (each gate ends with Rue's sign-off).

## Done criteria

- [ ] Rue has signed off the gate 4 wireframes and the gate 5 hi-fi (with the master icon) for every screen in the inventory (SC1–SC16, G1–G8); both sign-offs are in design.md → Gate log.
- [ ] Every route and overlay in the inventory renders on the fingerprint at 375 / 768 / 1280, and Rue has looked at the screenshots.
- [ ] Every built route is paired with its signed hi-fi shot (tag `gate5-signed`); every deviation the per-wave design pass found is fixed or accepted by Rue (design.md → Fidelity log).
- [ ] `npm run proof:full` is green with `check-slop` and `check-drift` in `proof`, no slop baseline left, and `tokens.css`, `design/` and the old shell gone.
- [ ] Phone pill bar, "+" quick add and desktop top bar work on Rue's phone (safe areas, `:active`) and desktop.
- [ ] Every contract job J1–J13 still works end to end; `git diff --stat -M main` shows no server or schema change beyond renames into `(app)`, the `NavData` import path and copy strings.
- [ ] Every e2e test a `proof:` line in `openspec/specs` names still exists or its requirement is REMOVED/MODIFIED by this change.
- [ ] Released as v0.11.0 (tag pushed, release published) and the Homelab bump PR opened; deploying stays Rue's call.
