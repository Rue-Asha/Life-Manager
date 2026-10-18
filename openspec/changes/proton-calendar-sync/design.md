## Context

`calendar-planning` gave todos an explicit planned `day` plus an optional slot (`start_time`, `end_time`), rules a slot
and a projection (`calendarMonth` in `src/lib/server/calendar.ts` is the only merge of todos, projections and exams,
projecting from the active sprint's week start + 7 or from today), and classes an `exam_at`. Nothing leaves the app
today. Writes are spread over ~15 domain functions, several of them bulk `UPDATE`s (`startSprint`, `closeReview`,
`deleteAspect`, `archiveSemester`, FK cascades), so per-write hooks would miss changes. `hooks.server.ts` only has
`init` (opens the DB); `clock.ts` gives `now()`/`today()` with the `LM_TEST` override; migrations are append-only in
`schema.ts` (`user_version` 5). The e2e server is the Node build on `$PORT` with `.e2e/<port>.db`, one worker, test hooks
under `routes/__test/*` guarded by `LM_TEST=1`. CI runs Node 22 and has no `proton` binary.

## Goals / Non-Goals

**Goals:** S1–S14 of `scope.md`: sync state migration, desired state from the DB, a diff reconciler with failure
handling, worker scheduling from `hooks.server.ts`, one calendar per aspect, first-run backfill, the sync page with nav
link and marker, env configuration, and a fake CLI so tests never talk to Proton.

**Non-Goals:** (from scope.md, unchanged)
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

## Decisions

From scope.md (Gate 0), carried as they are:
- One-way diff reconciler, nudged ~30 s after writes + 5-minute local tick, no per-write outbox — Rue's choice (write
  paths are spread and bulk updates bypass the domain functions).
- A todo that loses its day/slot has its Proton event removed — Rue's choice (Proton mirrors the in-app calendar).
- Homelab-Managment part is a separate follow-up change; Life-Manager ships with sync off until `PROTON_CLI` is set —
  Rue's choice.
- Recurring rules = one RRULE series for the projected weeks + individual events for real instances — Rue's choice.
- The app creates one Proton calendar per aspect on demand and stores its ID — Rue's choice; rename/recolour don't
  propagate.
- First-run backfill from today on — Rue's choice.
- Re-login over ssh, the app only shows state and the command — Rue's choice.
- Start-only todo slot = 30 min, timed exam = 2 h, date-only exam = all-day — Rue's choice.
- Event content: title (✓ prefix when done), notes → description, room → location, no reminders — Rue's choice.
- Exams go to the Uni aspect's calendar (`uni_aspect_id`) — follows from one-calendar-per-aspect.
- proton-cli contract pinned from the v5.1.0 source (2026-10-18): event ref = `<calendarId>/<eventId>` (stored whole),
  update with a bare series ref rewrites the whole series, no move between calendars (delete + create), no calendar
  rename/recolour.
- Inherited from calendar-planning: proton-cli sidecar via `execFile` + `--output json`; due dates never synced; ICS
  subscription rejected (4–16 h lag, LAN-only app).
- UI copy is English (app UI language).
- Gate 1 addition (a), accepted: a rule's series excludes (EXDATE) the days that already have a real instance of that
  rule, so no occurrence shows twice between review close and the next sprint start.
- Gate 1 addition (b), accepted: the last successful sync time is stored in `settings` and survives a restart.

Technical choices for this change:
- **Module split under `src/lib/server/proton/`** so the wave-2 units are disjoint: `types.ts` (contract), `config.ts`,
  `hash.ts`, `desired.ts` (DB → desired items), `reconciler.ts` (diff + calls + sync rows), `colors.ts`, `cli.ts`
  (argv + `execFile` runner + pacing), `worker.ts` (scheduling + status), `pass.ts` (glue: desired → reconcile). The
  reconciler takes the desired list as an argument, so its tests don't need `desired.ts`; the worker takes an
  injectable pass, so its tests don't need either. Alternative rejected: one `sync.ts` — every unit would edit it.
- **Desired state reads stored fields only.** Todos come from `selectTodos(db, …)` filtered on the stored `day` — never
  from the sprint read models that add the derived `dueDay`, and never from `due_date`. Rules come from `listRules`
  minus `archivedRuleIds`, started at `projectionStart` — both exported from `calendar.ts` and used by `calendarMonth`
  too, so the in-app calendar and Proton can't drift. Exams come from `classes.exam_at` when `getUniAspectId` is set.
- **Series exclusions (Gate 1 a).** A series' `exdates` are the distinct days on or after its start that are one of the
  rule's weekdays and carry a todo with that `rule_id` (any status, any sprint) — the same days `calendarMonth` leaves
  without a projection. proton-cli has no EXDATE flag; deleting one occurrence (`events delete <ref>@<occurrence>`) is
  what adds an EXDATE (`ExcludeOccurrence` in v5.1.0), and an update that touches the times or the rule (ours always
  sends the full spec) drops all EXDATEs. So after every series create or update the reconciler deletes each excluded
  occurrence again. During a running sprint the instances lie before the series start, so `exdates` is empty and this
  costs nothing; it matters between review close and the next sprint start, and for instances planned onto a later
  week. Alternative rejected: moving the series start past the last instance — it would also drop the occurrences
  between instances.
- **Window:** an item is desired when its date is today or later, or when it already has an `event_ref` (past synced
  items are still updated or deleted, never created). Rules have no past. This one rule is also the first-run backfill.
- **Reconciler algorithm** (one pass, `today` from `clock.today()`):
  1. For each stored row whose key is not desired: delete its `event_ref` (exit 3 = gone = success), remove the row. A
     row without `event_ref` is just removed.
  2. For each desired item in key order (todos, rules, exams; ascending id): the target calendar is
     `proton_calendars[aspectId]`, created first if missing (name = aspect name, colour = `PROTON_COLORS[aspect.color]`).
     - no row, or a row without `event_ref` → create; a row with `error_hash = specHash` is skipped unless `retryFailed`.
     - row with `calendar_id` ≠ target → delete old ref (exit 3 ok), then create in target.
     - row with `hash` ≠ `specHash(spec)` → update the stored ref; exit 3 → create in target.
     - otherwise nothing.
     - after a series create or update, one occurrence delete per `exdates` day (occurrence = the day, or day +
       series start time for a timed series); exit 3 (not an occurrence / already gone) counts as success. A create
       stores the row with its `event_ref` and `hash = NULL` at once, the hash follows once all occurrence deletes
       succeeded, so an interrupted series push is redone (update + deletes) by the next pass.
     - a create that exits 3 means the calendar is gone: drop the `proton_calendars` row, create the calendar again,
       retry the create once.
  3. After every successful call the row is written at once (`event_ref`, `calendar_id`, `hash`, `label`, errors
     cleared), so an interrupted pass resumes from the stored state (R4 duplicates accepted).
  4. Exit 2 → stop, outcome `relogin`; exit 5 → stop, outcome `retry`; spawn failure → stop, outcome `error`; any
     other non-zero → store `error` (stderr's `Error:` line) and `error_hash` (for a failed delete: `'delete'`), keep the
     previous ref and hash, go on.
  `pendingCount` runs steps 1–2 as a plan without calls and counts event calls including occurrence deletes (calendar
  creates excluded, skipped failed items excluded). `forgetHashes` sets `hash`, `error`, `error_hash` to NULL on every row ("Resync all").
- **Hash** = sha256 hex of `JSON.stringify` of the `EventSpec` with its keys in the fixed order of the type. Aspect and
  calendar are not hashed; a calendar change is detected by comparing `calendar_id`.
- **Runner** (`createRunner`): `execFile(cli, argv, { env: { ...process.env, PROTON_NO_INPUT: '1',
  PROTON_NO_UPDATE_CHECK: '1', PROTON_NO_LOG: '1', TZ: 'Europe/Berlin' } })`, one call at a time through a promise chain, `gapMs` (default
  1000) between the end of one call and the start of the next. Exit 0 → parse stdout's envelope, return `ids`. Non-zero
  → first stderr line starting with `Error:` (else the last stderr line). `ENOENT`/`EACCES` → `{ code: 'spawn' }`.
  `TZ` is set because proton-cli v5.1.0 reads a timed occurrence reference (`@YYYY-MM-DDTHH:MM`) in the process's
  local zone (`ParseOccurrence` uses `time.Local`), not in `--zone`. `process.env` passes `XDG_CONFIG_HOME` through, so the session follows the service's config dir. The adapter is the
  only place that builds argv or parses CLI output (R2/R3).
- **Worker** (module singleton): `configureWorker(cfg, opts)` stops any timers; with `cfg = null` the state is `off` and
  nothing runs. Otherwise it schedules a first pass after `debounceMs` (catches changes made while the app was down),
  a pass every `tickMs`, and `nudge()` restarts the debounce timer. A request while a pass runs sets a flag for one more
  pass after it. Outcomes: `done` → `idle`, `lastSyncAt`, backoff reset; `retry` → `error`, next pass after 1, 2, 4, 8,
  16, 30, 30 … min, nudges/ticks ignored until then; `relogin` → `relogin`, nudges/ticks ignored, retry after 30 min;
  `error` (spawn) → `error`, normal schedule continues. `syncNow()` always runs at once (retrying failed items) and
  clears a backoff or pause. After each pass that ends `done` the worker writes its end instant to `settings` key
  `proton_last_sync_at` (Gate 1 b), and `syncStatus().lastSyncAt` reads it from there, so it survives a restart; the
  rest of the status is in memory (a restart starts at `idle`).
- **hooks.server.ts:** `init` calls `configureWorker(readConfig(process.env))` after `getDb()`; a new `handle` resolves
  the request, then calls `nudge()` for every non-GET request outside `/__test/`, so seeding and resets in e2e don't
  nudge.
- **Fake CLI** `scripts/fake-proton.mjs` (plain JS + JSDoc, executable, `#!/usr/bin/env node` — CI runs Node 22, which
  can't run `.ts`): one core (`createFake(dir)`) used two ways — as the executable (parses argv, checks the env flags,
  `--output json`, `--zone` on timed events, `--yes` on deletes, prints the envelope or `Error: …`) and in-process
  through `apply(op)` for reconciler and journey unit tests. State, call log and failure rules are JSON files in the
  state dir, so the test process and the server's child processes see the same fake.
- **e2e isolation:** the fake's state dir is `.e2e/<port>-proton/` (passed as `FAKE_PROTON_DIR` in `playwright.config.ts`
  next to the per-port DB); `reset()` clears it and `/__test/reset` resets the worker to the env config (off in e2e,
  since the e2e server has no `PROTON_CLI`). A test turns sync on through `/__test/proton` with the fake's absolute path
  and short timings (`gapMs: 0`, long debounce/tick so only explicit passes run), and runs passes through it. Every test
  starts with an empty call log; assertions use the log's length before and after an action, never absolute totals
  from earlier tests.
- **Sync page** `/sync` ("Proton sync"): a centred column without a rail (like Recurring), built from the existing
  `PageHeader`, `FieldCard`/`FieldRow`, `ListGroup` and `Button` — no new visual direction, so no mockup gate. Buttons
  are form actions `?/syncNow` and `?/resyncAll` that start a pass and return without waiting; while the state is
  `syncing` the page re-runs its load every 2 s (`invalidateAll`), so pending and state stay current during a backfill.
- **Nav link outside `NAV_ITEMS`:** the sidebar gets "Proton sync" below the aspects, the home list a separate card below
  the lists card, so the eight lists, their order and the existing navigation tests stay as they are. The marker reads
  `nav.sync` (the `SyncState`) from the root layout load.
- **Colour table** (nearest Proton accent to each palette token in `tokens.css`): see Contracts. Fixed, never computed
  at runtime.
- **Release v0.6.0** (feature → minor) per the repo's ship memory. As in calendar-planning, no spec or test pins the
  version (release-artifact derives it from `package.json`), so there is no release delta spec.

## Contracts

Unit 1 creates these (types, stubs that typecheck, the fake and the test hooks); later units only fill them.

### Stored vs derived fields

| Field | Kind | Used by sync |
|---|---|---|
| `todos.day`, `todos.start_time`, `todos.end_time` | stored (the plan) | yes — the only todo date synced |
| `Todo.dueDay` (sprint read models), `todos.due_date` | derived / due date | **never** |
| `recurring_rules.weekdays`, `start_time`, `end_time` | stored | yes |
| series start date | derived per pass (`projectionStart` → first rule weekday on/after it) | yes, in the spec |
| `classes.exam_at`, `exam_room`, settings `uni_aspect_id` | stored | yes |
| `proton_calendars.calendar_id` | stored (bare ID from calendar create `ids[0]`) | target calendar of an aspect |
| `proton_items.event_ref` | stored whole, `<calendarId>/<eventId>` from event create `ids[0]` | update/delete ref |
| `proton_items.calendar_id` | stored (calendar the event was created in) | detects aspect moves |
| `proton_items.hash` | stored `specHash` of the last pushed spec; NULL = push again | diff |
| `proton_items.error`, `error_hash` | stored last item failure and the spec hash (or `'delete'`) that failed | skip until change / Sync now |
| `exdates` of a series | derived per pass (days ≥ series start on a rule weekday with a todo of that rule) | yes, in the spec and hash |
| `settings` key `proton_last_sync_at` | stored ISO instant of the end of the last pass that ended `done`; cleared by `resetDb()` (settings) | `SyncStatus.lastSyncAt` |
| rest of `SyncStatus` | in memory only | sync page, nav marker |

Item keys: `todo:<todos.id>`, `rule:<recurring_rules.id>`, `exam:<classes.id>`. Labels: todo title (without "✓ "), rule
title, `Exam · <class name>`.

### Migration 6 (appended to `migrations` in `schema.ts`)

```sql
CREATE TABLE proton_calendars (
	aspect_id INTEGER PRIMARY KEY REFERENCES aspects (id) ON DELETE CASCADE,
	calendar_id TEXT NOT NULL
);
CREATE TABLE proton_items (
	key TEXT PRIMARY KEY,
	label TEXT NOT NULL,
	calendar_id TEXT NULL,
	event_ref TEXT NULL,
	hash TEXT NULL,
	error TEXT NULL,
	error_hash TEXT NULL,
	updated_at TEXT NOT NULL
);
```
`resetDb()` adds `DELETE FROM proton_items; DELETE FROM proton_calendars;` before `DELETE FROM aspects`.

### Types (`src/lib/server/proton/types.ts`, U1)

```ts
import type { HhMm, Id, IsoDate } from '$lib/types';

export type ItemKey = `todo:${number}` | `rule:${number}` | `exam:${number}`;
export interface EventSpec {          // field order = hash order
	title: string;                    // '✓ ' + title when done; 'Exam · <class name>'
	description: string;              // notes; '' for exams
	location: string;                 // class room / exam room; '' when none
	date: IsoDate;                    // todo.day | series start | exam date
	start: HhMm | null;               // null = all-day
	end: HhMm | null;                 // slot end; null for start-only, all-day, exams
	durationMin: number | null;       // 30 for a start-only slot, 120 for a timed exam, else null
	rrule: string | null;             // 'FREQ=WEEKLY;BYDAY=TU,TH' for a series, else null
	exdates: IsoDate[];               // series only, ascending: days with a real instance of the rule; [] otherwise
}
export interface DesiredItem { key: ItemKey; aspectId: Id; label: string; spec: EventSpec }
export type ProtonOp =
	| { kind: 'calendar.create'; name: string; color: string }
	| { kind: 'event.create'; calendarId: string; spec: EventSpec }
	| { kind: 'event.update'; ref: string; spec: EventSpec }
	| { kind: 'event.delete'; ref: string }
	| { kind: 'event.deleteOccurrence'; ref: string; occurrence: string }; // 'YYYY-MM-DD' (all-day) | 'YYYY-MM-DDTHH:MM'
export type CliResult =
	| { ok: true; ids: string[] }
	| { ok: false; code: number; error: string }    // exit code ≠ 0; error = stderr's 'Error: …' line
	| { ok: false; code: 'spawn'; error: string };  // binary missing / not executable
export type Runner = (op: ProtonOp) => Promise<CliResult>;
export interface ProtonConfig { cli: string; profile: string }
export type PassOutcome =
	| { kind: 'done'; calls: number; failed: number }
	| { kind: 'retry'; error: string }              // exit 5
	| { kind: 'relogin'; error: string }            // exit 2
	| { kind: 'error'; error: string };             // spawn failure
export type SyncState = 'off' | 'idle' | 'syncing' | 'relogin' | 'error';
export interface SyncStatus {
	state: SyncState;
	profile: string | null;                         // null when off
	lastSyncAt: string | null;                      // settings 'proton_last_sync_at': end of the last pass that ended 'done'
	lastError: string | null;
	nextRetryAt: string | null;                     // backoff or re-login retry
	passes: number;                                 // passes started since configureWorker
}
export interface WorkerOptions {
	debounceMs?: number;                            // 30_000
	tickMs?: number;                                // 300_000
	gapMs?: number;                                 // 1_000
	pass?: (o: { retryFailed: boolean }) => Promise<PassOutcome>; // tests; default: runPass with createRunner
	db?: DatabaseSync;                              // tests; default getDb() — holds proton_last_sync_at
}
export interface FailedItem { key: ItemKey; label: string; error: string }
```

### Functions (owner unit; U1 stubs return the value in brackets)

```ts
// config.ts (U1, implemented)
export function readConfig(env: Record<string, string | undefined>): ProtonConfig | null; // '' or unset PROTON_CLI → null
// hash.ts (U1, implemented)
export function specHash(spec: EventSpec): string;
// pass.ts (U1, implemented glue)
export function runPass(db: DatabaseSync, today: IsoDate, run: Runner, o?: { retryFailed?: boolean }): Promise<PassOutcome>;
	// = reconcile(db, desiredState(db, today), run, o)
// desired.ts (U3) [[]]
export function desiredState(db: DatabaseSync, today: IsoDate): DesiredItem[]; // key order: todos, rules, exams; id asc
// calendar.ts (U3; calendarMonth uses both)
export function projectionStart(db: DatabaseSync, today: IsoDate): IsoDate;    // active weekStart + 7, else today
export function archivedRuleIds(db: DatabaseSync): Set<Id>;
// colors.ts (U4)
export const PROTON_COLORS: Record<AspectColor, string>;
// reconciler.ts (U4) [{kind:'done',calls:0,failed:0}] [0] [[]] [no-op]
export function reconcile(db: DatabaseSync, desired: DesiredItem[], run: Runner, o?: { retryFailed?: boolean }): Promise<PassOutcome>;
export function pendingCount(db: DatabaseSync, desired: DesiredItem[]): number;
export function failedItems(db: DatabaseSync): FailedItem[];
export function forgetHashes(db: DatabaseSync): void;
// cli.ts (U2) [[]] [run → {ok:false, code:'spawn', error:'not implemented'}]
export function toArgv(op: ProtonOp, profile: string): string[];
export function createRunner(cfg: ProtonConfig, o?: { gapMs?: number }): Runner;
// worker.ts (U2) [no-op] [no-op] [null] [null] [{state:'off', profile:null, lastSyncAt:null, lastError:null, nextRetryAt:null, passes:0}] [resolved]
export function configureWorker(cfg: ProtonConfig | null, o?: WorkerOptions): void;
export function nudge(): void;
export function syncNow(o?: { retryFailed?: boolean }): Promise<PassOutcome | null>; // retryFailed defaults to true; null when off
export function resyncAll(): Promise<PassOutcome | null>;                            // forgetHashes + syncNow
export function syncStatus(): SyncStatus;
export function resetWorker(): Promise<void>; // stop timers, await a running pass, configureWorker(readConfig(process.env))
```

### Colour table (`PROTON_COLORS`, U4)

Proton accepts only its 20 accent colours (proton-cli v5.1.0 `internal/accent/accent.go`, mirroring `ACCENT_COLORS` in
WebClients): purple `#8080FF`, pink `#DB60D6`, strawberry `#EC3E7C`, carrot `#F78400`, sahara `#936D58`, enzian
`#5252CC`, plum `#A839A4`, cerise `#BA1E55`, copper `#C44800`, soil `#54473F`, slateblue `#415DF0`, pacific `#179FD9`,
reef `#1DA583`, fern `#3CBB3A`, olive `#B4A40E`, cobalt `#273EB2`, ocean `#0A77A6`, pine `#0F735A`, forest `#258723`,
pickle `#807304`. Each palette colour maps to the nearest by squared RGB distance (the arithmetic of proton-cli's
`accent.Nearest`); `--color` gets the hex.

| Aspect colour | token | Proton accent |
|---|---|---|
| sage | #3f7f36 | forest `#258723` |
| sky | #2f6f9c | ocean `#0A77A6` |
| lavender | #9a4c8f | plum `#A839A4` |
| ochre | #9a6c0c | pickle `#807304` |
| berry | #b03a5b | cerise `#BA1E55` |
| lagoon | #1d766c | pine `#0F735A` |
| tangerine | #b9531a | copper `#C44800` |
| slate | #5f6870 | sahara `#936D58` |

### CLI argv (proton-cli v5.1.0, pinned; built only by `toArgv` in U2, parsed by the fake in U1)

```
proton --output json --profile <p> calendar settings calendars create --name <name> --color <#hex>
proton --output json --profile <p> calendar events create --calendar <calendarId> <spec flags>
proton --output json --profile <p> calendar events update <calendarId>/<eventId> <spec flags>
proton --output json --profile <p> calendar events delete <calendarId>/<eventId> --yes
proton --output json --profile <p> calendar events delete <calendarId>/<eventId>@<occurrence> --yes   (adds an EXDATE)

spec flags (always the full spec, also on update, where unmentioned fields would stay untouched):
  --title <t> --description <d> --location <l> --zone Europe/Berlin     ('' clears description/location)
  all-day     --start <YYYY-MM-DD> --all-day                             (no --end: an all-day --end is the inclusive last day)
  timed       --start <date>T<start> --end <date>T<end>                  (+ --all-day=false on update)
  start-only  --start <date>T<start> --duration <d>                      (+ --all-day=false on update)
              d = '<n>h' when durationMin % 60 = 0 ('2h'), else '<n>m' ('30m'); --end and --duration are mutually exclusive
  series      + --rrule 'FREQ=WEEKLY;BYDAY=<MO,TU,…>'                     (update with the bare ref rewrites the whole series
                                                                          and drops its EXDATEs)
  occurrence  '<YYYY-MM-DD>' for an all-day series, '<YYYY-MM-DD>T<HH:MM>' (series start time) for a timed one
```
`EventSpec.exdates` is never sent as a flag: `toArgv` ignores it (exclusions go out as occurrence deletes), the fake's
parser yields `[]`, and `apply` ignores it on create/update.
Child env adds `PROTON_NO_INPUT=1`, `PROTON_NO_UPDATE_CHECK=1`, `PROTON_NO_LOG=1`, `TZ=Europe/Berlin`. The app never reads Proton (no
`calendars list`, no `events list`): write-only.

Envelope on stdout (exit 0), keys `action,count,dry_run,ids,kind,name`:
- calendar create: `{"action":"created","count":1,"dry_run":false,"ids":["<calendarId>"],"kind":"calendar","name":"<name>"}` (bare ID)
- event create: `{"action":"created",…,"ids":["<calendarId>/<eventId>"],"kind":"event","name":"<title>"}`
- event update: `"action":"updated"`, `ids` = the ref as typed; event delete (also of an occurrence): `"action":"deleted"`.

Errors: stdout empty, stderr plain text whose first line is `Error: …` (optionally followed by `Try:` lines), never JSON.
Exit codes: 0 ok, 1 user error / bad args (e.g. ambiguous DST time, delete without `--yes` under `PROTON_NO_INPUT`),
2 auth (incl. CAPTCHA / human verification / no session), 3 not found, 4 conflict, 5 network / server / rate limit
(429 already retried ≤ 5 times), 6 refused by confirmation policy, 7 bug. The reconciler treats 2, 3 and 5 specially;
every other non-zero code (1, 4, 6, 7) marks the item failed.

### Fake (`scripts/fake-proton.mjs`, U1)

```js
export function createFake(dir) → {
	apply(op): CliResult,                 // in-process, same state machine, logs the call
	run(argv, env): { code, stdout, stderr }, // what the executable does
	calls(): FakeCall[],                  // { at, end, argv|null, op|null, code, env: { PROTON_NO_INPUT, PROTON_NO_UPDATE_CHECK, PROTON_NO_LOG, TZ, XDG_CONFIG_HOME } }
	state(): { calendars: Record<id, { name, color }>, events: Record<ref, { calendarId, spec, exdates: IsoDate[] }> },
	fail(rule): void,                     // { kind: op kind | '*', code: 1|2|3|5, error: string, times?: number, match?: string }
	clearFailures(): void,
	dropEvent(ref): void, dropCalendar(id): void,   // "deleted by hand in Proton"
	reset(): void,                        // empty state, log and failures
}
export function parseArgv(argv) → { op, profile, output, yes, zone } | { error }
```
Files in `dir`: `state.json`, `calls.jsonl`, `failures.json`. The executable reads `FAKE_PROTON_DIR`. IDs: `cal-<n>`,
`evt-<n>`. Beyond the env and flag checks it refuses with exit 1 what the real CLI refuses: a `--color` outside the 20
accents, `--end` together with `--duration`, an all-day `--start` with a time, an occurrence delete on a non-recurring
event. It keeps a series' EXDATEs: an occurrence delete adds the day (exit 3 when the day is not an occurrence of the
rule on or after the start; timed occurrences are read in the child's `TZ`), an update drops them. Failure rules may
inject any exit code (1–7).

### Test hooks (U1)

- `POST /__test/proton` (`LM_TEST=1` only): `{ enable: { cli, profile?, debounceMs?, tickMs?, gapMs? } }` →
  `configureWorker`; `{ disable: true }` → `configureWorker(null)`; `{ pass: { retryFailed? } }` → `await syncNow(…)`,
  returns the outcome. `GET /__test/proton` → `syncStatus()`.
- `POST /__test/reset` also awaits `resetWorker()`.
- `playwright.config.ts` webServer env: `FAKE_PROTON_DIR: resolve('.e2e/<port>-proton')`.
- `e2e/helpers.ts`: `reset()` also calls `createFake(FAKE_PROTON_DIR).reset()`; new `FAKE_PROTON_CLI` (absolute path),
  `protonOn(request, opts?)` (defaults `gapMs: 0`, `debounceMs: 3_600_000`, `tickMs: 3_600_000`), `protonPass(request,
  opts?)`, `protonStatus(request)`, `fake()` (= `createFake(FAKE_PROTON_DIR)` for calls/state/fail/drop).

### Markup and test ids (U5)

- `/sync`: heading "Proton sync"; `sync-state` (Off · Up to date · Syncing… · Re-login needed · Error), `sync-last`
  (time or "Never"), `sync-pending` (number), `sync-failed` (`ListGroup`) with rows `sync-failed-item` (label + error),
  `sync-last-error`, `sync-login-command` (`<code>proton account login --profile <p></code>`), `sync-off` (explains
  `PROTON_CLI`), `sync-note` (rename/recolour note); buttons "Sync now", "Resync all".
- Nav: link "Proton sync" `data-testid="sync-link"` in sidebar and home list; marker `sync-marker`
  (`aria-label="Needs attention"`); `NavData.sync: SyncState` from `+layout.server.ts`.

## Risks / Trade-offs

- [The fake drifts from the real CLI] → argv, envelope and exit codes are pinned from the v5.1.0 docs and source in
  Contracts; argv is built only in `toArgv` and parsed only in the fake; the manual real-account scenario catches a
  mismatch.
- [Sync off must leave the app unchanged] → no timer and no child process without `PROTON_CLI`; the `handle` hook only
  calls `nudge()`, a no-op when off; all existing e2e run with sync off.
- [Long passes during a backfill or semester archive (R6)] → 1 s pacing; passes never overlap; the page shows pending.
- [Stale desired state within a long pass] → each pass reads the DB once; a change made during the pass is picked up by
  the next one (nudged by the same request).
- [Duplicate event after a crash between create and store, or an exit 5 after Proton applied it (R4)] → accepted;
  rows are written immediately after each call to keep the window small.
- [Series DTSTART moves daily between sprints] → one update per rule per day, accepted in scope (S6).
- [A failed item retried every pass would hammer Proton] → `error_hash` skips it until its content changes or Rue
  presses "Sync now".
- [Shared e2e server state] → per-port DB and fake dir, `reset()` clears both and the worker; assertions use log deltas.

## Migration Plan

Migration 6 runs on the next start (`user_version` 5 → 6) and only adds two tables. With `PROTON_CLI` unset (today's
prod) nothing else changes. Rollback = deploy the previous release; the tables stay unread. Turning sync on later is the
Homelab change: set `PROTON_CLI`, log in once over ssh, the first pass backfills from today.

## Open Questions

None. (The proton-cli argv, envelope, exit codes and accent palette were pinned from the v5.1.0 docs and source on
2026-10-18; see Contracts.)
