# Scope: redesign

Triage: feature — from-scratch UI redesign of Life-Manager on the ecosystem fingerprint 2.1.0 (Design-System `ecosystem-ui-revamp` section 13, pipeline gates 3–8), all routes in one change, UI layer only. Appetite: several sessions, in phases (gate 4 wireframes, gate 5 hi-fi, then the build in waves).

## Problem
Life-Manager is the last of the four apps still on its own pre-fingerprint look (sidebar + `/menu` hub, `tokens.css`, `design/`), so Rue's most-used app looks and navigates unlike Notes, Cooking and Creative. The redesign brings it onto the shared fingerprint and family IA without changing what it does.

## Usage
One owner (Rue), no accounts, LAN/VPN, light theme only. Phone is its own UI: quick capture, checking Today, ticking things off. Wide desktop: planning, reviewing, upkeep. Many short visits a day plus the weekly plan-and-review ritual (sprint Mon–Sun, Europe/Berlin, en-GB). Touch and keyboard are both first-class (WCAG 2.2 AA).

## Entities (from the contract, s3)
- Aspect (name, 1 of 8 colours, 1 of 24 icons, manual order) contains todos and recurring rules; zero aspects forces onboarding.
- Todo (title, aspect, priority, due, Markdown notes, checklist, status, optional day + slot) lives in the backlog (no sprint) or a sprint; optional link to an IT project or a uni class.
- Backlog = open todos without a sprint; "Planned" subset has a day.
- Sprint: draft → active → closed; derived phase (none / planning / running / review-available / review-required) drives Today, Sprint, Plan, Review, Backlog.
- Review decision per open todo: carry / back to backlog / drop (recurring: carry / drop).
- Recurring rule generates todo instances at sprint start; projected onto future calendar weeks.
- IT project (5 statuses) shows its linked todos. Uni: semester → classes → class todos by type; grade summary drawn from graded classes; one global notes document.
- Calendar items are derived (dated todos, projected recurring, exams) plus a Due list.
- Proton sync: one-way push; states Off / Up to date / Syncing / Re-login needed / Error.

## Flows (contract jobs J1–J13)
- Capture (J1): "+" (phone) or New todo (desktop) from any screen → title, aspect (pre-filled from context), optional day → destination stated (sprint or backlog) → added.
- Today check (J2, J4): `/` → summary, overdue, aspect groups, sprint progress → tick done (undo toast) or "Add to sprint" on a due backlog item; phase prompt links to plan or review.
- Plan (J3, J6): plan prompt → `/sprint/plan` → add/remove backlog todos, un-mark "Due this week" suggestions → Start sprint → `/sprint`.
- Work the week (J4): `/sprint` → By aspect / Board / Week → change status or day (drag on pointer, menu on touch/keyboard) → pull from or send back to the backlog.
- Review (J5): prompt or block → `/sprint/review` → decision per open todo → generated close label → `/sprint/plan`.
- Backlog triage (J6): `/backlog` → aspect filter → edit, plan a day, add to sprint.
- Aspects (J7): `/aspects` → add, edit, reorder (drag or Move up/down), delete with move-to → "Move n and delete".
- Recurring (J8): `/recurring` → add/edit rule → instances at next sprint start.
- Uni (J9): `/uni` → semester → class → `/uni/classes/[id]` (details, exam, grade, links, notes, todos by type, revised) → archive semester.
- IT projects (J10): `/projects` → capture → `/projects/[id]` (status, notes, linked todos).
- Calendar (J11): `/calendar?month=` → pick a day → entries + Due list → open todo editor or follow link.
- Sync (J12): attention marker / Today banner → `/sync` → read status → CLI re-login on server → Sync now / Resync all.
- Onboarding (J13): any route → `/welcome` → presets or custom → Continue → `/backlog`.
- Navigation: phone pill bar (Today · Sprint · Backlog · Calendar · More) + round "+"; desktop top bar.

## Screen inventory (gate 3)
| # | Screen | Route | Jobs | Posture |
|---|---|---|---|---|
| SC1 | Today | `/` | J2, J1, J4 | both, phone primary |
| SC2 | Welcome | `/welcome` | J13, J7 | both |
| SC3 | Sprint (By aspect / Board / Week) | `/sprint?view=` | J4 | both; drag pointer-only, menu path |
| SC4 | Sprint plan | `/sprint/plan` | J3 | desktop two lists; phone "Add to sprint" |
| SC5 | Sprint review | `/sprint/review` | J5 | both |
| SC6 | Backlog | `/backlog?aspect=` | J6, J1 | both |
| SC7 | Calendar | `/calendar?month=` | J11 | phone marks + day list; desktop titles + side day list |
| SC8 | Recurring | `/recurring` | J8 | both |
| SC9 | Aspects | `/aspects` | J7 | both |
| SC10 | Aspect page | `/aspects/[id]` | J7, J6 | both |
| SC11 | Projects | `/projects` | J10 | both |
| SC12 | Project page | `/projects/[id]` | J10 | both |
| SC13 | Uni | `/uni` | J9 | both |
| SC14 | Class page | `/uni/classes/[id]` | J9 | both |
| SC15 | Sync | `/sync` | J12 | both |
| SC16 | More (phone hub) | `/menu` | nav | reachable at every width (Rue, wave10_rue) |
| G1 | Desktop top bar | shell | all | pointer |
| G2 | Phone pill bar + round "+" | shell | all | touch |
| G3 | Quick add "New todo" | overlay | J1 | both |
| G4 | Todo editor | overlay | J1, J4, J6 | both |
| G5 | Backlog rail / sheet | overlay on SC3, SC4 | J3, J4, J6 | rail ≥1280, sheet below |
| G6 | Confirm dialogs (~10) | overlay | J5, J7, J9 | both |
| G7 | Undo toast | overlay | J2, J4 | both |
| G8 | 404 / error for SC10, SC12, SC14 | route error | — | both |

`/todos` (form-action endpoint), `/healthz` and `__test/*` are not screens and stay as they are.

## In scope
- **S1** Fingerprint 2.1.0 vendored via `Design-System/scripts/sync.sh`; `check-slop` + `check-drift` run in `proof`; accent lagoon; Life-Manager added to `Design-System/apps.txt`; a temporary app-owned slop baseline keeps `proof` green over the old UI and is deleted in S26.
  - edges: `fingerprint.lock` hashes trip gitleaks → the vendored `.gitleaks.toml` covers them; check-slop false positive on comma-joined token lists → allowed in the baseline filter, not by changing vendored files.
- **S2** Desktop top bar (≥768 px) on the fingerprint: Today, Sprint, Backlog, Calendar, a menu holding Aspects (with each aspect's link), Projects, Uni, Recurring and Sync, plus a New todo button; list counts; sync-attention marker.
  - edges: count 0 → hidden; count ≥100 → "99+"; long aspect names truncate with full name on hover/focus; fits at exactly 768 px without wrapping; current route marked.
- **S3** Phone pill bar (<768 px): Today · Sprint · Backlog · Calendar · More, plus a separate round "+".
  - edges: fits at 320 px; hidden while a text field has focus; respects safe-area insets; More carries a dot on sync attention; active tab marked; content never hidden behind the bar.
- **S4** More (`/menu`) becomes the More hub: Aspects (colour + icon), Projects, Uni, Recurring, Sync with counts and sync state; reachable at every width, in two columns from 1280 px (Rue, flow.yaml → wave10_rue, supersedes the gate-1 redirect from 768 px).
  - edges: counts 0 hidden; many aspects scroll; sync Off shows no marker.
- **S5** Global quick add: the phone "+" and the desktop New todo open "New todo" from any screen; aspect pre-filled on `/aspects/[id]`, destination pre-set to sprint on `/sprint`; destination always stated; same form action as today. The contract line "no global New todo on phones" is amended.
  - edges: validation error inline (`role="alert"`); Enter submits; Esc / backdrop closes; no active sprint → destination backlog only; review-required → sprint destination disabled with the review link.
- **S6** Todo editor restyled with every field (title, aspect, priority, due, status, day + slot, Markdown notes, checklist, project link for IT, class link + type for Uni) and delete confirm.
  - edges: long title/notes; empty checklist; archived-semester class todo read-only; link fields shown only for the matching aspect.
- **S7** Sync attention surfaced: marker in both bars and a Today banner linking `/sync` when sync is Re-login needed or Error.
  - edges: Off / Up to date / Syncing → no banner; banner not dismissable while the state holds.
- **S8** Today on the fingerprint: summary, overdue, aspect groups, sprint progress, phase prompt, due backlog items with "Add to sprint", tick done with undo toast (new behaviour, Today only: "Done: <title>" with "Undo", Undo sets it back to To do; Gate 1 A4).
  - edges: empty copy per phase; many aspects; long titles; many overdue; no sprint; review-required block.
- **S9** Welcome: preset aspects + custom aspect, submit disabled until one is chosen, also reachable later to add more.
  - edges: duplicate name error; zero-aspect redirect from every route kept.
- **S10** Sprint: By aspect (default on all sizes), Board, Week via `?view=`; moves by drag on pointer and by a status/day menu on touch and keyboard; backlog as side rail ≥1280 px and as a sheet below; phase prompts in none / planning / review-required; optimistic moves revert on refusal.
  - edges: empty groups and empty days; many todos per day; long titles; refusal shows the error and reverts.
- **S11** Sprint plan: draft and backlog lists side by side on desktop (drag optional), "Add to sprint" buttons on phone; "Due this week" suggestions; start errors ("The last sprint needs a review first.", "A sprint is already running.").
  - edges: empty draft hint differs for pointer and touch; empty backlog; many items.
- **S12** Sprint review: one decision per open todo (recurring: carry / drop only), generated close label ("Carry 2, return 1 and close"), all-done one-tap close, redirect to plan.
  - edges: "Nothing was planned this week."; "All N done"; many items.
- **S13** Backlog: aspect filter (`?aspect=`), collapsible aspect groups, Planned subset, edit, plan a day (a day inside the week pulls it into the sprint), add to sprint.
  - edges: empty / filtered-empty copy; many aspects; long titles.
- **S14** Calendar month: phone month marks + day list, desktop titles in cells + side day list; planned todos, projected recurring, exams, Due list; month navigation; opens the todo editor or links to the rule/class.
  - edges: "Nothing planned"; a day with many entries; month starting on Sunday; today marked.
- **S15** Recurring: rule list and rule form (weekdays, slot, checklist template, aspect, optional class).
  - edges: "No recurring rules yet."; long checklist; class field only for the Uni aspect.
- **S16** Aspects: list, add/edit (8 colours, 24 icons), reorder by drag on pointer and Move up/down on touch and keyboard, delete with move-to target and "Move n and delete".
  - edges: last aspect cannot leave zero (redirect to welcome as today); delete of an aspect with 0 todos needs no move target.
- **S17** Aspect page: its todos, quick add pre-filled, secondary details.
  - edges: "Nothing in <name> yet."; custom 404.
- **S18** Projects: grouped by status, capture a project.
  - edges: "No projects yet" with "A project starts in the backlog."; IT aspect not chosen → the one-time IT aspect prompt with its confirm.
- **S19** Project page: status, description, repo, tags, Markdown notes, linked todos (Open / Planned / Done).
  - edges: no linked todos; long notes; custom 404.
- **S20** Uni: semesters, "This week", grade summary, global notes, new semester / class, archive semester with confirm.
  - edges: "Start with the semester you are in now."; "No classes yet."; Uni aspect not chosen → the one-time Uni aspect prompt; archived semester read-only.
- **S21** Class page: details (lecturer, room, ECTS, links), exam, grade, notes, todos by type (LEC / EXC / OTH) with "revised" date, class rules.
  - edges: archived → read-only; no exam / grade; custom 404.
- **S22** Sync page: all 5 states, polling while syncing (buttons disabled), Sync now / Resync all, failed items, the CLI re-login command shown copyable.
  - edges: "Never" synced; no failed items; Off.
- **S23** Shared primitives on the fingerprint: dialogs/sheets, confirm dialogs (~10), undo toast (the only toast), menus, empty states, 404 / error pages for the three detail routes.
  - edges: focus trap and return; Esc closes; toast does not cover the pill bar.
- **S24** Cross-cutting: every contract state per route; English (UK) copy, no exclamation marks; WCAG 2.2 AA; targets ≥44 px on phone (≥24 min); no horizontal scroll at 320 / 390; reduced motion honoured; family motion on transitions and press states; every drag has a keyboard and touch path; chrome text (bars, buttons, labels) is not selectable.
- **S25** Master icon `Design-System/icons/Life-Manager/icon.svg`, built and vendored by sync; `app.html` icon links and the web manifest added by hand.
- **S26** Old styling removed: `src/lib/styles/tokens.css`, `design/`, colour literals in `aspect-style.ts` mapped onto the 8 `--aspect-*` tokens, the slop baseline from S1, all `/__mockups/redesign` routes; `openspec/specs/design-direction` gets a REMOVED/MODIFIED delta.
- **S27** e2e follows the new UI: shell geometry tests (`layout`, `navigation`, `responsive`, `motion`) rewritten for the bars; copy-dependent locators updated; every test named by a `proof:` line in `openspec/specs` kept or migrated; `__test/*` hooks untouched except that `__test/seed` accepts checklist items as `{ text, done }` for the fidelity seeds.
- **S28** Gate 4: `references.md` (Mobbin per flow, cited as URL + screen id), then greyscale wireframes at `/__mockups/redesign/wire/**` at 375 / 768 / 1280 with worst-case data, fingerprint type and spacing only; Rue signs; sign-off logged in design.md "## Gate log".
- **S29** Gate 5: hi-fi mockups at `/__mockups/redesign/hifi/**` built with `impeccable` on the vendored fingerprint, every contract state, English copy; pass `check-slop`, `break-ui` and a fresh-context review; Rue signs together with the master icon.

## Non-goals
- Dark mode — Rue decided 2026-11-17 to leave it behind.
- Checkpoint B (wave-1 retrospective, fingerprint bump, sibling re-sync) — skipped by Rue's decision; stays open in the Design-System plan.
- Server, schema, migration, load-function, action or URL changes — UI layer only; copy strings in server `fail()` messages are the only server edits allowed.
- New features: global search, offline / PWA, notifications, per-action sync feedback beyond S7.
- Changing first-run landing (`/welcome` → `/backlog` stays) — it is a server redirect.
- Creative's per-world night stage (`data-world` / `data-stage`) — optional in 2.1.0, not needed here.
- Four-app sibling sheet (revamp task 13.3) — Design-System work after this ships.
- Deploying — the Homelab bump stays a separate, confirmed step.

## Codebase touchpoints
- `src/routes/+layout.svelte`, `src/lib/components/shell/*` (Sidebar, RailLayout, HomeList), `src/lib/layout.ts` — replaced by the top bar / pill bar shell (explorer: pipeline + touchpoints).
- `src/lib/components/{ui,todo,sprint,rail,calendar,aspects,projects,uni,recurring}` — 78 `.svelte` files, ~9,800 lines, restyled or rebuilt; styles are scoped `<style>` blocks.
- `src/lib/styles/tokens.css`, `design/`, `src/lib/aspect-style.ts`, `src/lib/motion.ts`, `src/lib/dnd.ts` (7 drag sites).
- `e2e/` — 42 files, ~349 tests, role/label/text locators, no `data-testid`; helpers `helpers.ts`, `sprint-locators.ts`, `uni-locators.ts`.
- `docs/functional-contract.md` — amend the phone global-add line (S5) and the nav model.
- `openspec/specs/design-direction/spec.md` — delta (S26).
- Design-System: `apps.txt`, `icons/Life-Manager/` (S1, S25).

## Risks
- R1 Scale: biggest app in one long branch → accepted; waves of ≤3 builders with their own ports; 3–5 verify rounds and a CI-fixer round expected; CI e2e runs 40–60 min.
- R2 Drag on touch/keyboard (7 sites) → resolved by S10 / S11 / S16 menu and Move up/down paths.
- R3 e2e churn on shell geometry and copy → S27.
- R4 check-slop red on first sync → S1 baseline, removed in S26.
- R5 Stored aspect colours may not map 1:1 onto the 8 `--aspect-*` tokens → planner checks the stored values in wave 1; a mismatch that needs a data change goes back to Rue (UI-only rule).
- R6 Pipeline says gate 3 only after Checkpoint B → accepted, Rue's decision.
- R7 Redesign agents must not see the current `.svelte`, CSS, screenshots or `design/` → enforced in every gate-4/5 brief.
- R8 Design-System edits (apps.txt, icon) are a second repo → its own small commit, shipped with consent at ship time.
- R9 Homelab PR #75 (life-manager v0.10.1) still open → Rue merges or closes it before this change's release bump.

## Decisions
- One change for all routes — Rue, 2026-11-17.
- Skip Checkpoint B; no dark mode — Rue, 2026-11-17.
- Phone bar Today · Sprint · Backlog · Calendar · More + round "+" — Rue, 2026-11-17.
- "+" is a global, context-aware quick add; the contract line is amended — Rue, 2026-11-17.
- Desktop gets the fingerprint top bar; backlog stays a side rail on sprint / plan at ≥1280 — Rue, 2026-11-17.
- Sprint keeps all three views on phone, By aspect default everywhere, moves by menu on touch — Rue, 2026-11-17.
- Defaults taken (veto at Gate 0): Today keeps the single overdue-aware count; IT / Uni aspect prompts stay on `/projects` and `/uni`; sync attention also shows as a Today banner (S7).
- Gate 1 additions accepted — Rue, 2026-11-17 (verbatim: A1 "Yes (Recommended)", A2 "Yes (Recommended)", A3 "Yes", A4 "Yes"):
  - A1: every app route moves into a `src/routes/(app)/` layout group with `git mv`; URLs unchanged, server files renamed byte-identical.
  - A2: the `NavData` type moves from `Sidebar.svelte` to `src/lib/nav.ts`; the one type-only import line in `(app)/+layout.server.ts` changes, no runtime change.
  - A3: Design-System's `lake-moraine.jpg` (CC0, Wikimedia) is Life's stage photo, shipped in `static/` with a credit line.
  - A4 (new behaviour, S8): on Today only, ticking done saves at once and shows the undo toast "Done: <title>" with "Undo"; Undo sets the todo back to To do.
- Gate mapping like the siblings: flow Gate 0 = pipeline gate 3; ⛔ tasks for gate 4 and 5 sign-offs; flow Gate 2 = gate 7; release tag + Homelab bump PR = gate 8 on Rue's confirm.

## Done when
- Every route and overlay in the inventory renders on the fingerprint at 375 / 768 / 1280, screenshots looked at by Rue.
- `proof:full` green with `check-slop` and `check-drift`, no slop baseline left, old styling gone.
- Phone bar, "+" quick add and desktop top bar work on Rue's phone (safe areas, :active) and desktop.
- Every contract job still works end to end; no server or schema diff beyond copy strings, the `(app)` renames (A1) and the `NavData` import line (A2).
- Released as a minor version tag; Homelab bump PR opened.

## Split off
- none (Checkpoint B and the sibling sheet stay in the Design-System plan).
