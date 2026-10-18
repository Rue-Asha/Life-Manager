verified-at: 8d4b067

## Layer 1: proof:full (PORT=4700), exit 0

```
Test Files  21 passed (21)
     Tests  297 passed (297)
  323 passed (2.5m)   (e2e)
```

Last e2e line: `✓ 323 e2e/uni.test.ts:623:1 › Scenario: Nothing due shows an empty line`

`openspec validate proton-calendar-sync --strict`: valid.

## Layer 2: spec coverage (112 scenarios: 91 unit, 19 e2e, 2 manual)

Every unit/e2e scenario has a test named `Scenario: <title>` (or the name in its proof line) that appears as passed in the proof:full output: 110 of 110 covered, 0 gaps. Round 3 added 3 scenarios (109 -> 112), all with a direct name match in the output.
Aliased proof lines, all resolved:

| Scenario | proof | Evidence |
|---|---|---|
| Proton settings come from the environment | unit | `src/lib/server/proton/config.test.ts` › "Scenario: Profile defaults to default", "Scenario: PROTON_CLI unset turns sync off" ✓ |
| Never logged in shows re-login needed | e2e | `e2e/proton-page.test.ts:64` › "Scenario: Re-login needed shows the login command and recovers after Sync now" ✓ |
| CI without a proton binary is unaffected | e2e | `e2e/proton-page.test.ts:15` › "Scenario: Sync off page names PROTON_CLI and shows no buttons" ✓ |
| README documents setup, scripts and env vars | manual (documentation) | see checklist |
| Planned todo appears in a real Proton calendar | manual (needs a real Proton account) | see checklist |

All other 107 scenarios: direct name match, passed in the output.

## Manual checklist

- README: read it; confirm it covers setup, npm scripts and the env vars PROTON_CLI, profile and XDG_CONFIG_HOME.
- Real Proton: set PROTON_CLI to the real `proton` binary, run `proton account login --profile <profile>`, `npm run dev`, plan a todo for today, open http://localhost:5173/sync, press Sync now, and check the event appears in the aspect's calendar in Proton.
- Judge the /sync screenshots below (375 px and 1280 px states).

## Diffstat (origin/main...flow/proton-calendar-sync)

```
50 files changed, 5357 insertions(+), 21 deletions(-)
```

## Screenshots (not committed; no UI file changed since round 1)

Directory: /tmp/claude-1001/-home-Rue-Repos-Life-Manager/8b9ca9f3-3e49-4367-b766-ad5c19780bf0/scratchpad/shots/

- sync-off-375.png, sync-relogin-375.png, sync-failed-375.png (from the phone-fit e2e)
- sync-off-1280.png, sync-pending-1280.png, sync-synced-1280.png (own Playwright script against build on 4709, fake CLI)
