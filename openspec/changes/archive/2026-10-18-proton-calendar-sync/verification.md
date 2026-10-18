verified-at: f9990ec

## Layer 1: proof:full (PORT=4700), exit 0

```
Test Files  21 passed (21)
     Tests  301 passed (301)
  323 passed (2.6m)   (e2e)
```

Last e2e line: `✓ 323 e2e/uni.test.ts:623:1 › Scenario: Nothing due shows an empty line`

`openspec validate proton-calendar-sync --strict`: valid.

## Layer 2: spec coverage (115 scenarios: 94 unit, 19 e2e, 2 manual)

Every unit/e2e scenario has a test named `Scenario: <title>` (or the names in its proof line) that appears as passed in the proof:full output: 113 of 113 covered, 0 gaps. Since the previous verification (8d4b067) three scenarios were added (112 -> 115), all with a direct name match in the output:
- "Failed move clears when the item returns to its calendar"
- "Failed item is retried when its target aspect changes"
- "A hung proton call times out and backs off"

Aliased proof lines, all resolved:

| Scenario | proof | Evidence |
|---|---|---|
| Proton settings come from the environment | unit | `src/lib/server/proton/config.test.ts` › "Scenario: Profile defaults to default", "Scenario: PROTON_CLI unset turns sync off" ✓ |
| Never logged in shows re-login needed | e2e | `e2e/proton-page.test.ts:64` › "Scenario: Re-login needed shows the login command and recovers after Sync now" ✓ |
| CI without a proton binary is unaffected | e2e | `e2e/proton-page.test.ts:15` › "Scenario: Sync off page names PROTON_CLI and shows no buttons" ✓ |
| README documents setup, scripts and env vars | manual (documentation) | see checklist |
| Planned todo appears in a real Proton calendar | manual (needs a real Proton account) | see checklist |

All other 110 scenarios: direct name match, passed in the output.

## Manual checklist

- README: read it; confirm it covers setup, npm scripts and the env vars PROTON_CLI, profile and XDG_CONFIG_HOME.
- Real Proton: set PROTON_CLI to the real `proton` binary, run `proton account login --profile <profile>`, `npm run dev`, plan a todo for today, open http://localhost:5173/sync, press Sync now, and check the event appears in the aspect's calendar in Proton.
- Judge the /sync screenshots below (375 px and 1280 px states).

## Diffstat (origin/main...flow/proton-calendar-sync)

```
50 files changed, 5480 insertions(+), 21 deletions(-)
```

## Screenshots (not committed; no UI file changed since round 1)

Directory: /tmp/claude-1001/-home-Rue-Repos-Life-Manager/8b9ca9f3-3e49-4367-b766-ad5c19780bf0/scratchpad/shots/

- sync-off-375.png, sync-relogin-375.png, sync-failed-375.png (from the phone-fit e2e)
- sync-off-1280.png, sync-pending-1280.png, sync-synced-1280.png (own Playwright script against build on 4709, fake CLI)

## Review

Fresh-context reviewer (opus), three rounds; fixer (sonnet) after rounds 1 and 2.

### Round 1 — 16 findings, all fixed (6f2c55e, cbbef5c, 0df3b94)
- correctness: 1 s pacing only held within one pass (new runner per pass) → one runner per configured worker; test "Mutations stay one gap apart across passes".
- correctness: stale error kept on /sync when an item matched its synced hash again → cleared without a call; tests "Failed update clears when the item matches Proton again", "Failed delete clears when the item is desired again".
- correctness: a throwing pass left state "syncing" forever and crashed Node (unhandled rejection; FK failure when an aspect is deleted during its calendar create) → thrown pass ends in state error, queue proceeds; missing aspect skips the item; tests "A pass that throws ends in state error and the next pass runs", "Aspect deleted during its calendar create skips the item".
- spec: startup catch-up pass had no scenario → orchestrator kept it (catches changes made while the app was down, first-run backfill); scenario "Startup runs one catch-up pass" added, nudge scenario reworded to the post-startup baseline.
- 12 weak tests tightened (cli, worker, desired, sync, e2e Resync all); mutation-checked for cli and worker.

### Round 2 — 6 findings, all fixed (a084c24, 05f865b, e603ac8)
- correctness: aspect deleted mid-pass (before its item) stalled the item as failed → `Skip` instead of `Failure`; test "Aspect deleted mid-pass leaves the item for the next pass".
- correctness: `proton` exiting 0 with non-JSON stdout threw an uncaught SyntaxError (process crash) → resolves as a failure; test "Non-JSON output ends the pass in state error".
- spec: successful delete before a calendar-move create wasn't stored → row nulled before the create; test "Failed create after a calendar move keeps no deleted ref".
- 3 weak tests tightened (series start weekday, done-todo prefix, last-sync on retry).

### Round 3 — 6 findings, OPEN (round limit reached; for Rue at Gate 2)
- correctness: `execFile` has no timeout (cli.ts:172) — a hung `proton` child (stalled network, unexpected prompt) blocks every later pass; state stays "Syncing…" until an app restart.
- spec: reconciler.ts:231-235 — the `error_hash === hash` skip runs before the clear check, so a failed delete during an aspect move followed by moving the todo back keeps the item listed as failed until Sync now (S11 "cleared once its content matches Proton again").
- weak: worker tests pass explicit `debounceMs`/`tickMs`, so the production defaults (30 s, 5 min) are not pinned.
- weak: "Series start lands on a rule weekday" never runs its no-sprint WHEN (roll into next week from Wed 2026-10-21).
- weak (minor): "Non-JSON output ends the pass in state error" asserts the runner result only, not the pass state.
- known gap (fixer round 2, not a reviewer finding): an item with a stored error whose aspect is later deleted, with an identical spec under the target aspect, stays skipped until Sync now / Resync all.

### Extra round (Rue at Gate 2) — round-3 findings fixed (48dfacc, 15744dd, f9990ec)
- correctness: no timeout on `proton` → 120 s per call (SIGKILL), resolves as exit 5 → network backoff; test "A hung proton call times out and backs off".
- spec: failure skip ran before the clear check → clear first; test "Failed move clears when the item returns to its calendar".
- known gap: failure skip now compares spec hash + target aspect (`error_hash = <specHash>:<aspectId>`); test "Failed item is retried when its target aspect changes".
- weak tests tightened: worker scenarios use production defaults (30 s / 5 min), series-start no-sprint WHEN, non-JSON through a worker pass.

### Extra-round review — no correctness or spec findings; 3 weak tests OPEN (for Rue at Gate 2)
- weak: cli.test.ts:177 "A hung proton call times out and backs off" drives only the runner — "a pass ends 'retry' and enters backoff" not pinned; the follow-up call isn't queued behind the hung one.
- weak: desired.test.ts:323 "Desired state starts today" lacks a tomorrow todo and a tomorrow exam — `>= today` vs `=== today` not pinned.
- weak: desired.test.ts:250 "Series excludes days with a real instance" doesn't run its WHEN (no sprint, Sun 2026-10-25, done instance on the start day); only the journey test sync.test.ts:352 would catch done instances missing from exdates.
- side effect (not a finding): db.test.ts:180 leaves the getDb() singleton open, so the existing Uni reset test runs on the previous test's DB instead of its own.
