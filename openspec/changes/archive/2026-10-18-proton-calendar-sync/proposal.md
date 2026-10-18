## Why

Rue plans her week in Life-Manager, but her planned time slots only exist in the app, so her Proton Calendar (phone,
other devices) doesn't show what she has planned. `calendar-planning` built the date model (planned day + optional
slot, recurring projection, exams); this change pushes it to Proton.

## What Changes

- **One-way sync into Proton Calendar** through the `proton` CLI (roman-16/proton-cli v5.1.0) as a sidecar, called with
  `execFile` and `--output json`. Proton is never read back.
- **What is synced:** every todo with an explicit planned `day` (timed event with a slot, 30-minute event with a start
  only, all-day without a slot; "✓ " in front of the title when done), one weekly RRULE series per recurring rule for the
  weeks the in-app calendar projects (excluding, as EXDATEs, days that already have a real instance of the rule — Gate 1
  addition a), and one event per class exam in the Uni aspect's calendar. Due dates are never
  synced. A todo that loses its day or is deleted loses its event.
- **One Proton calendar per aspect**, created by the app on first need, named after the aspect, coloured from a fixed
  palette table; its ID is stored, so renaming or recolouring in either place is safe.
- **Additive migration 6:** sync state per item (event ref, calendar ID, hash of the last pushed state, last error) and
  per aspect (calendar ID).
- **Diff reconciler in the app process:** builds the desired state from the DB, compares it with the stored hashes and
  only calls `proton` for differences. Runs ~30 s after any non-GET request (debounced), every 5 minutes, and on "Sync
  now"; never two passes at once. Calls are sequential, ≥ 1 s apart, non-interactive; network failures back off,
  auth failures pause sync until Rue logs in again over ssh.
- **First run backfills** everything from today on; past items are never created.
- **Proton sync page** at `/sync`: state, last sync, pending count, failed items, last error, "Sync now", "Resync all";
  the login command when Proton needs a new login; an explanation of `PROTON_CLI` when sync is off. Linked from the
  sidebar and the phone home list, with a warning marker on "re-login needed" or "error".
- **Configuration:** `PROTON_CLI` (unset = sync off, the app behaves exactly as before) and `PROTON_PROFILE` (default
  `default`); the session follows the service's `XDG_CONFIG_HOME`. The last successful sync time is stored in `settings`
  (`proton_last_sync_at`) and survives a restart (Gate 1 addition b). Documented in the README and the app-runtime spec.
- **Tests never talk to Proton:** a fake `proton` executable with the same CLI contract records calls; unit tests cover
  the diff and the journeys, e2e runs with the fake.
- Released as v0.6.0 (new feature, minor).

## Non-Goals

- Two-way sync (edits or deletions in Proton are not read back; "Resync all" restores the app's state) — write-only keeps
  API usage minimal (ToS §2.10).
- Due dates in Proton — calendar shows planned slots only (calendar-planning decision).
- Login from the app (password/TOTP/CAPTCHA form) — the app is LAN-only without auth; re-login happens over ssh.
- Renaming/recolouring/deleting Proton calendars from the app — proton-cli can't rename/recolour; delete needs the
  password again and wipes events.
- Reminders on events — Proton's per-calendar default applies.
- Syncing items before today on first run (no history backfill).
- Homelab deploy (binary in `ansible/roles/life_manager`, vault secrets, `env.j2`, egress to Proton, first interactive
  login) — separate change in Homelab-Managment.
- Per-event colours — one calendar per aspect already carries the colour.

## Done criteria

- [ ] Planning, editing, ticking done, unplanning and deleting a todo, editing a rule, starting a sprint and setting an
      exam each produce the expected `proton` calls against the fake CLI (unit + e2e).
- [ ] With `PROTON_CLI` unset the app behaves exactly as before and the sync page says sync is off.
- [ ] The sync page shows re-login needed when the fake exits 2, and recovers after "Sync now" once the fake succeeds.
- [ ] Manual (Rue, local, real account): with proton-cli logged in on her machine and `PROTON_CLI` set, `npm run dev`,
      plan a todo with a slot → it appears in a new "<Aspect>" calendar in Proton; tick it done → "✓ " title.
- [ ] `npm run proof:full` is green.

## Appetite

Three evenings.

## Capabilities

### New Capabilities
- `proton-sync`: one-way sync of planned todos, recurring series and exams into Proton Calendar through the `proton`
  CLI — sync state, desired state, diff reconciler, worker scheduling and failure handling, calendars per aspect,
  configuration, the sync page and the test fake (S1–S14).

### Modified Capabilities
- `app-runtime`: env list gains `PROTON_CLI` and `PROTON_PROFILE` (session under `XDG_CONFIG_HOME`); the README
  documents them (S13).
- `navigation`: a "Proton sync" link in the sidebar and the phone home list, outside the eight lists, with a warning
  marker (S12).

## Impact

- DB: migration 6 adds `proton_calendars` and `proton_items` (additive; a code rollback leaves them unread); a new
  `settings` key `proton_last_sync_at` (no migration).
- Server: new `src/lib/server/proton/` (types, config, hash, CLI runner, desired state, reconciler, worker, pass glue);
  `calendar.ts` exports the projection start it already computes; `hooks.server.ts` starts the worker and nudges it
  after non-GET requests; `db.ts` `resetDb()` clears the new tables.
- UI: new route `src/routes/sync/`; `Sidebar.svelte`, `HomeList.svelte` and `+layout.server.ts` get the link and marker.
- Tests: new fake `scripts/fake-proton.mjs`; new unit files under `src/lib/server/proton/`; `db.test.ts`; new e2e files
  `proton-nudge`, `proton-page`, `proton-sync`; `e2e/helpers.ts` and `playwright.config.ts` gain the fake's per-port
  state dir; new test hook `routes/__test/proton`, `__test/reset` also resets the worker.
- Docs: `README.md` env vars.
- Release: `package.json` / `package-lock.json` to 0.6.0; tag `v0.6.0` after the merge.
- Follow-up (separate change): `life-manager-proton` in Homelab-Managment.
