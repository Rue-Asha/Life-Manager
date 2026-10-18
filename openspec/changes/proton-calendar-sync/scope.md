# Scope: proton-calendar-sync

Triage: feature — one-way sync of planned todos, recurring rules and exams into Proton Calendar via the `proton` CLI (roman-16/proton-cli) as a sidecar: additive sync-state migration, background diff reconciler, status page. Homelab deploy is a separate change. Appetite: three evenings.

## Problem
Rue plans her week in Life-Manager, but her planned time slots only exist in the app, so her Proton Calendar (phone, other devices) doesn't show what she has planned. `calendar-planning` built the date model (planned day + optional slot, recurring projection, exams); this change pushes it to Proton.

## Flows
- Plan: Rue plans a todo on a day (with or without a slot) → within ~30 s an event appears in the aspect's Proton calendar (timed, or all-day without a slot).
- Edit: Rue changes title, notes, day, slot or aspect → the Proton event follows (aspect change = event moves to the other aspect's calendar).
- Done: Rue ticks a todo done → the Proton event stays, title gets "✓ " in front; un-ticking removes the ✓.
- Unplan/delete: Rue moves a todo to the backlog, a sprint start/review carries it over without a day, or she deletes it → the Proton event is removed.
- Recurring: Rue creates/edits/deletes a rule → one Proton series for the rule's future weeks; at sprint start the current week's occurrences become individual events (real instances) and the series starts a week later.
- Exams: Rue sets/changes/clears a class's exam date → an event in the Uni aspect's calendar.
- Status: Rue opens the Proton sync page → sees state, last sync, pending changes, last error; can trigger "Sync now" and "Resync all".
- Re-login: Proton asks for CAPTCHA / session expired → sync pauses, the page (and a marker on its nav link) says "re-login needed" and shows the `proton account login` command to run on the server; after re-login Rue presses "Sync now".
- First run: `PROTON_CLI` is configured for the first time → backfill of everything from today on, paced.
- Off: `PROTON_CLI` unset (dev, CI, today's prod) → no worker runs, the page says sync is off and names the env var.

## Entity model (confirmed with Rue)
- Aspect 1 — 1 Proton calendar (created by the app on first need, named after the aspect, colour mapped from the app palette to the nearest Proton accent; the app stores the calendar ID, so a later rename/recolour in Proton is safe).
- Planned todo (explicit `day`, any sprint/backlog state, incl. real recurring instances) 1 — 1 Proton event in its aspect's calendar.
- Recurring rule (not of an archived-semester class) 1 — 1 Proton RRULE series in its aspect's calendar, covering the weeks the in-app calendar projects (from the week after the active sprint, or from today with no active sprint; unbounded).
- Class with `exam_at` 1 — 1 Proton event in the Uni aspect's calendar (setting `uni_aspect_id`).
- Due dates are never synced (Rue's decision in calendar-planning). Proton → app is never read back (one-way).

## In scope
- **S1** Sync state is stored in an additive migration: per synced item (todo, rule series, exam) its Proton event ID, calendar ID and a hash of the last pushed state; per aspect its Proton calendar ID.
  - edges: existing DB at the current `user_version` → migration only adds, no row rewritten; `resetDb()` clears the new tables.
- **S2** A planned todo (explicit `day`) gets one Proton event in its aspect's calendar: with start+end slot → timed event start–end; start only → 30-minute event (explicit `--duration 30m`, not the calendar default); no slot → all-day event on `day`. Times are Europe/Berlin, passed explicitly (`--zone Europe/Berlin`), since proton-cli otherwise reads wall times in the account zone. Title = todo title, description = todo notes, location = class room if class-linked.
  - edges: todo with only a due date and no `day` → no event; todo planned in backlog or a draft sprint → event (it has a day); DST-ambiguous start (proton exits 1) → item marked failed with the error, others continue.
- **S3** Editing a synced todo (title, notes, day, slot) updates its Proton event in place; changing its aspect deletes the event and creates it in the new aspect's calendar.
  - edges: event deleted by hand in Proton (update exits 3) → event is created again and the new ID stored.
- **S4** A done todo keeps its event with "✓ " prepended to the title; reopening removes the ✓.
  - edges: bulk done via `archiveSemester` → each todo updated, paced (S10); done todo on a past day that was synced before → still updated.
- **S5** A todo that no longer has a `day` (to backlog, carried over by sprint start/review, `setDay` clearing it) or is deleted (incl. cascade from class/aspect deletion) has its Proton event deleted.
  - edges: delete exits 3 (already gone) → treated as success, sync record removed.
- **S6** Each recurring rule gets one Proton RRULE series (`FREQ=WEEKLY;BYDAY=<weekdays>`) starting on the first of its weekdays on or after the in-app projection start (active sprint week start + 7, or today with no active sprint) — DTSTART must match BYDAY or clients may show an extra first occurrence; with slot → timed, without → all-day. Title, notes, class room as for todos. Real instances of the active week are ordinary todos (S2–S5), so no occurrence appears twice.
  - edges: rule edited (weekdays, slot, title, aspect) → series updated (aspect change = delete + create); rule deleted → series deleted, existing instances keep their events; rule of an archived-semester class → series deleted / never created; sprint start → series start moves one week, the week's instances get individual events; no active sprint → series start moves with today (one update per rule per day, accepted).
- **S7** A class with `exam_at` gets one event in the Uni aspect's calendar: title "Exam · <class name>", location = exam room; date-only → all-day, date+time → 2-hour event.
  - edges: exam cleared → event deleted; class deleted → event deleted; Uni aspect changed → event moves to the new aspect's calendar; no Uni aspect set → exams not synced; archived-semester exams are synced like the in-app calendar shows them.
- **S8** An aspect's Proton calendar is created on the first item that needs it, named after the aspect, with the Proton accent mapped from the aspect's palette colour (fixed table); its ID is stored and reused.
  - edges: aspect renamed/recoloured in the app → Proton calendar unchanged (proton-cli can't rename/recolour; stated on the status page); aspect deleted → its todos/rules are reassigned, so their events move to the target aspect's calendar; the orphaned Proton calendar is left alone; stored calendar no longer exists in Proton (create exits 3) → calendar created again.
- **S9** The reconciler builds the desired state from the DB (planned todos, rule series, exams), compares it with the stored hashes and only calls `proton` for differences. It runs ~30 s after any non-GET request (debounced, from `hooks.server.ts`), every 5 minutes locally (catches day rollover and sprint start), and on "Sync now". A pass never overlaps another.
  - edges: no differences → zero `proton` calls; app restart mid-pass → next pass picks up from the stored hashes; create succeeded but the app died before storing the ID → a duplicate event is possible (accepted, R4).
- **S10** First run backfills: todos with `day` ≥ today, all non-archived rules, exams ≥ today. Past items are never created; past items already synced are still updated or deleted.
  - edges: large backlog → paced per S11, status shows pending count.
- **S11** Calls to `proton` are sequential with ≥ 1 s between mutations and run with `PROTON_NO_INPUT=1` (never prompts, never hangs), `PROTON_NO_UPDATE_CHECK=1`, `PROTON_NO_LOG=1`; deletes pass `--yes`. proton-cli already retries 429 internally (≤ 5 attempts); exit 5 (network / server / rate limit exhausted) → the pass stops and retries with backoff (1, 2, 4 … capped at 30 min); exit 2 (auth / CAPTCHA) → sync pauses in state "re-login needed" until "Sync now" or the next 30-minute retry; any other non-zero exit → that item is marked failed with stderr's `Error:` line, the rest continue.
  - edges: binary missing / not executable → state "error" with the message, no crash of the app.
- **S12** A Proton sync page lists: state (off / idle / syncing / re-login needed / error), last successful sync time, pending item count, failed items with their error, last error; buttons "Sync now" and "Resync all" (forgets hashes and re-pushes every item, recreating events that no longer exist). It's linked from Sidebar and HomeList; the link shows a warning marker in state re-login needed or error.
  - edges: sync off → page explains `PROTON_CLI` and shows no buttons; re-login needed → page shows `proton account login --profile <profile>` to run on the server; mobile layout.
- **S13** Configuration via env: `PROTON_CLI` (path to the binary; unset = sync off) and optional `PROTON_PROFILE` (default `default`); the session location follows the service's `XDG_CONFIG_HOME` (`$XDG_CONFIG_HOME/proton-cli/sessions/<profile>.json`, set by the Homelab change to a dir under `/var/lib/life-manager`) and is inherited by the child process. Documented in README and the app-runtime spec's env list.
  - edges: env set but never logged in → first call exits 2 → state re-login needed.
- **S14** Tests never talk to Proton: a fake `proton` executable (same CLI contract: args, `--output json` mutation envelope `{action,count,dry_run,kind,ids,name}` with create's `ids[0]` = `<calendarId>/<eventId>` and calendar create's `ids[0]` = bare calendar ID, errors as `Error: …` on stderr with empty stdout, exit codes 0/1/2/3/5) records calls; unit tests cover the reconciler diff, e2e runs with `PROTON_CLI` pointing at the fake.
  - edges: CI has no proton binary → unaffected (sync off unless the test sets the fake).

## Non-goals
- Two-way sync (edits or deletions in Proton are not read back; "Resync all" restores the app's state) — write-only keeps API usage minimal (ToS §2.10).
- Due dates in Proton — calendar shows planned slots only (calendar-planning decision).
- Login from the app (password/TOTP/CAPTCHA form) — the app is LAN-only without auth; re-login happens over ssh.
- Renaming/recolouring/deleting Proton calendars from the app — proton-cli can't rename/recolour; delete needs the password again and wipes events.
- Reminders on events — Proton's per-calendar default applies.
- Syncing items before today on first run (no history backfill).
- Homelab deploy (binary in `ansible/roles/life_manager`, vault secrets, `env.j2`, egress to Proton, first interactive login) — separate change in Homelab-Managment.
- Per-event colours — one calendar per aspect already carries the colour.

## Codebase touchpoints
- `src/lib/server/calendar.ts` — `calendarMonth` is the only merge of todos, projections and exams; generalise into a range/desired-state source the reconciler can use (explorer: data model).
- `src/lib/server/recurring.ts` — rules, `generateInstances`, projection start (`projectFrom`) (explorer: data model).
- `src/lib/server/schema.ts`, `db.ts` — append-only migrations (`migrations: string[]`, `user_version`), `resetDb()`; `db.test.ts`/`sqlite.test.ts` assert migration count (explorer: write paths).
- `src/hooks.server.ts` — only `init` today; worker start + debounced nudge after non-GET requests go here (explorer: write paths).
- `src/lib/server/clock.ts` — `now()` with the `LM_TEST` clock override; the reconciler uses it for "today" (explorer: write paths).
- New `src/lib/server/proton/*` — CLI adapter (execFile), reconciler, worker.
- New route for the sync page; `Sidebar.svelte` + `HomeList.svelte` get the link (explorer: write paths).
- `routes/__test/*` (LM_TEST-guarded) — test hooks to trigger a pass / read fake-CLI calls.
- `README.md`, `openspec/specs/app-runtime/spec.md` — env vars (explorer: write paths).
- Write paths are spread over ~15 domain functions incl. bulk UPDATEs (`startSprint`, `closeReview`, `deleteAspect`, `archiveSemester`, cascades) — the reason for diff-based reconciliation instead of per-write hooks (explorer: write paths).

## Risks
- R1 Unofficial API / ToS §2.10 grey zone / account suspension → accepted (calendar-planning decision); mitigated by write-only-on-diff, sequential pacing (S11), no polling of Proton.
- R2 proton-cli contract only partly documented → resolved from the v5.1.0 source (envelope, ID format, exit-code mapping, `PROTON_NO_INPUT`, session under `os.UserConfigDir()`, start-only duration, series update via bare ref); remaining gaps (JSON whitespace, how Proton's web client renders a mismatched DTSTART) accepted — the adapter is the only place that parses CLI output and S6 avoids the mismatch.
- R3 proton-cli breaks or changes its contract → accepted: pin v5.1.0 in the Homelab change; adapter isolated; failures surface on the status page.
- R4 Duplicate event when the app dies between a successful create and storing its ID, or when a create exits 5 after Proton already applied it (proton-cli doesn't retry non-429 mutations) → accepted (rare; Rue deletes the duplicate by hand).
- R5 Session + key passphrase on life-manager01 unlock the whole Proton account → accepted (calendar-planning decision); handled in the Homelab change (file modes, vault).
- R6 Bulk changes (archiving a semester, first backfill) cause bursts of writes → accepted, paced at ≥ 1 s per mutation.

## Decisions
- One-way diff reconciler, nudged ~30 s after writes + 5-minute local tick, no per-write outbox — Rue's choice (write paths are spread and bulk updates bypass the domain functions).
- A todo that loses its day/slot has its Proton event removed — Rue's choice (Proton mirrors the in-app calendar).
- Homelab-Managment part is a separate follow-up change; Life-Manager ships with sync off until `PROTON_CLI` is set — Rue's choice.
- Recurring rules = one RRULE series for the projected weeks + individual events for real instances — Rue's choice.
- The app creates one Proton calendar per aspect on demand and stores its ID — Rue's choice; rename/recolour don't propagate.
- First-run backfill from today on — Rue's choice.
- Re-login over ssh, the app only shows state and the command — Rue's choice.
- Start-only todo slot = 30 min, timed exam = 2 h, date-only exam = all-day — Rue's choice.
- Event content: title (✓ prefix when done), notes → description, room → location, no reminders — Rue's choice.
- Exams go to the Uni aspect's calendar (`uni_aspect_id`) — follows from one-calendar-per-aspect.
- proton-cli contract pinned from the v5.1.0 source (2026-10-18): event ref = `<calendarId>/<eventId>` (stored whole), update with a bare series ref rewrites the whole series, no move between calendars (delete + create), no calendar rename/recolour.
- Inherited from calendar-planning: proton-cli sidecar via `execFile` + `--output json`; due dates never synced; ICS subscription rejected (4–16 h lag, LAN-only app).
- UI copy is English (app UI language).
- Gate 1 addition (a) accepted: a rule's series excludes (EXDATE) days that already have a real instance of that rule, so no occurrence shows twice between review close and the next sprint start.
- Gate 1 addition (b) accepted: the last successful sync time is stored in `settings` and survives a restart.

## Done when
- Planning, editing, ticking done, unplanning and deleting a todo, editing a rule, starting a sprint and setting an exam each produce the expected `proton` calls against the fake CLI (unit + e2e).
- With `PROTON_CLI` unset the app behaves exactly as before and the sync page says sync is off.
- The sync page shows re-login needed when the fake exits 2, and recovers after "Sync now" once the fake succeeds.
- Manual (Rue, local, real account): with proton-cli logged in on her machine and `PROTON_CLI` set, `npm run dev`, plan a todo with a slot → it appears in a new "<Aspect>" calendar in Proton; tick it done → "✓ " title.
- `npm run proof:full` is green.

## Split off
- `life-manager-proton` in Homelab-Managment (`--live`): install proton-cli v5.1.0 in `ansible/roles/life_manager`, env in `templates/env.j2`, session dir under `/var/lib/life-manager`, Proton password in vault, egress HTTPS to Proton, first interactive login on life-manager01.
