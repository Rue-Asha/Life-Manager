# Notes for the follow-up change `proton-calendar-sync`

Captured during explore of `calendar-planning` (2026-10-18). This is input for that change's
explore: confirm these with Rue instead of re-deriving them. `calendar-planning` builds the data
model (planned day + optional slot, recurring slots + projection, exams) that this sync pushes.

## Intent (Rue)
- Rue's planned time slots appear in her Proton Calendar, marked by life aspect.
- What goes to Proton: planned todos (explicit `day`, with slot as a timed event, without slot as
  an all-day event), recurring occurrences, uni exams. **Due dates do not** — Rue corrected her
  initial request: the calendar shows the planned slot, the due date stays an app-only field.
- Done todos stay in Proton with "✓" in the title; deleted todos are removed from Proton.
- Rue has a paid Proton plan (Mail Plus/Unlimited): up to 25 calendars, per-event colour.

## Decisions already taken
- Write path: `roman-16/proton-cli` as a sidecar, called from the app (`execFile`, `--output json`).
- One Proton calendar per aspect, so the aspect colour is the calendar colour.
- ICS subscription rejected: Proton refreshes subscribed calendars every 4–16 h, and the app is
  LAN-only (life-manager01, 192.168.0.223, nginx :80, no TLS, no public exposure), so Proton's
  servers could not fetch a feed without a new public tunnel.
- Accepted costs: the Proton session + derived key passphrase live on life-manager01 (that unlocks
  the whole account, mail included); ToS §2.10 grey zone; occasional CAPTCHA needs Rue to re-login;
  the private API can break without notice.

## Research (2026-10-18, web)
- Proton has no official Calendar API, no CalDAV; Proton Bridge is mail only. Proton's own
  `go-proton-api` has calendar read calls only.
  https://blog.mailfence.com/proton-calendar-support-caldav/ ·
  https://proton.me/blog/2026-spring-summer-roadmaps
- **roman-16/proton-cli** — https://github.com/roman-16/proton-cli — Go, MIT, ~97 stars,
  v5.1.0 released 2026-10-15, very active. Event create/update/delete with `--calendar`,
  `--rrule`, `--all-day`, reminders, `--color` (per-event colour renders on paid plans only).
  Auth: SRP, TOTP, security keys, two-password mode, CAPTCHA (prints the verification page and
  waits). Session and unlocked keys persist; `account login --password-file` again is a no-op,
  so a job can recover from an expired session. `--output json`, meaningful exit codes.
- Alternatives considered:
  - `cheeseandcereal/proton-cal` (Go, Unlicense, 4 stars, last push 2026-06-25) — same feature
    set, stores a derived key passphrase instead of the password; smaller, less active.
  - CalDAV bridges + a Node CalDAV client (tsdav): `develonrails/carbonate` (WIP, unreleased),
    `mathewcsims/protoxide` (idle since 2026-07, manual re-auth), hydroxide CalDAV PRs never
    merged, repo archived 2026-08.
  - Not recommended: `TactlessAutist/proton-calendar-client` (TS, GPL-3.0, one commit),
    `Nojuza/proton-calendar-cli` (Python, no licence, no recurrence),
    `t4t5/caldir-provider-proton` (tool-specific), browser-automation MCPs.
- ICS subscription facts (kept for reference): https://proton.me/support/subscribe-to-external-calendar
  (4–16 h refresh); Proton validates the URL server-side (WebClients
  `packages/shared/lib/calendar/subscribe/helpers.ts`), errors include 401/403/404/timeout and
  `ICS_SIZE_EXCEED_LIMIT`. Calendar limits: https://proton.me/support/proton-plans.
- ToS §2.10 — https://proton.me/legal/terms — automated access must stay "indistinguishable from
  the standard client behavior of human users", otherwise "immediate suspension". → write only on
  change, never poll in a tight loop.
- Not verified: how often these clients break in practice; documented lockouts.

## What the integration needs (to scope in that change)
- Sync state per synced item: Proton event id + hash of the last pushed state (additive migration).
- A background sync in the app (none exists today; `hooks.server.ts` only has `init`): outbox/queue,
  retry with backoff, write-on-change only.
- Event-changing cases: todo created/edited/done/deleted, moved between aspects (move calendar),
  carried over or back to backlog (slot cleared → event removed?), missed day pulled in; aspect
  renamed/recoloured/deleted; recurring rule edited (RRULE event vs individual occurrences — open);
  archived-semester todos are read-only.
- Initial backfill and a "rebuild calendar" action; mapping aspect → Proton calendar (create or pick).
- Status in the app: last sync, errors, "re-login needed" (CAPTCHA).
- Tests: a fake `proton-cli` contract in tests; CI never talks to Proton.
- Config/secrets: env via ansible `templates/env.j2`, Proton credentials in ansible vault,
  session file under `/var/lib/life-manager`.
- Homelab-Managment (cross-repo): install the proton-cli binary in `ansible/roles/life_manager`,
  allow outbound HTTPS from life-manager01 to Proton.
- Timezone: Europe/Berlin for timed events; all-day events for slot-less items.

## Open questions for that change's explore
- Recurring: one Proton RRULE event per rule, or individual events per occurrence (how far ahead)?
- Carried / back-to-backlog todos lose their slot: remove the event, or keep it?
- Sync trigger: on every write, or a periodic job with a change outbox?
- Proton calendar naming and creation (app creates "LM · Health", or Rue maps existing ones)?
