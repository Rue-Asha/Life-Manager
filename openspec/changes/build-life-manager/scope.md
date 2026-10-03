# Scope: build-life-manager

Triage: feature — new app from scratch, new data model, deploy target on the home server, multi-session. Appetite: 5–7 sessions.

## Problem
Rue keeps todos for several areas of life (health, uni, job, …) without one place that
plans them together. They want a calm, high-end, self-hosted web app that organises
all of them in one weekly sprint, with a planning and review ritual.

## Flows
- First run: open app → no aspects yet → onboarding with preset aspects to toggle + custom → empty backlog → add todos → plan first sprint.
- Capture: anywhere → add todo (title, aspect, optional fields) → lands in backlog, or in the
  active sprint / a day when added from a sprint view.
- Planning: no active sprint → planning screen → pull backlog todos (due-this-week ones suggested)
  → recurring instances are added automatically → start sprint.
- Daily use: open app → lands on Today (todos for today + overdue) → open sprint → switch view (by aspect / board / week by day) → move status
  To do → Doing → Done, assign todos to days, add/remove todos mid-sprint.
- Review: sprint ended (from its Sunday onward) → review screen → done vs open → per open todo:
  carry over / back to backlog (recurring instances: carry over / drop) → close sprint → planning.
- Aspect management: create / edit / delete (delete moves todos to another aspect).
- Recurring: create rule (weekdays) → instances appear in each new sprint on those days.

## In scope
- **S1** Repo has a working harness: SvelteKit + TS + SQLite app, `npm run proof` (typecheck, build,
  unit tests) and `npm run proof:full` (+ e2e), `npm run dev` serves the app.
  - edges: none (infrastructure)
- **S2** spike: design direction — design brief grounded in Mobbin references (Things 3, Sunsama/Akiflow
  feel; see `design-refs.md`) plus design tokens and a static style tile. Rue approves the visual
  direction before any feature UI is built.
  - edges: none (taste checkpoint)
- **S3** First run: with no aspects, the app shows onboarding offering ~6 preset aspects (Health, Uni,
  Job, Home, Finance, Social — each with colour + icon) to toggle on, plus "add custom". Todos cannot
  be created until at least one aspect exists.
  - edges: last aspect deleted (no todos left) → back to first-run state.
- **S4** Create/edit aspect: name, colour (from a fixed palette), icon (from a fixed icon set).
  - edges: empty name → rejected inline; duplicate name (case-insensitive) → rejected inline.
- **S5** Delete aspect: confirmation asks which other aspect its todos and recurring rules move to;
  after deletion they show under the target aspect.
  - edges: aspect without todos/rules → simple confirm, no target needed; only aspect and it has
    todos → delete disabled with explanation.
- **S6** Create todo: title + aspect required; optional notes, priority (none/P1/P2/P3), due date,
  checklist, via a plain quick-add form (title field + chips/pickers, no natural-language parsing).
  Created in the backlog by default; in the active sprint when created from a sprint view;
  on a specific day when created in a week-by-day column.
  - edges: empty/whitespace title → rejected; due date in the past → allowed, shown overdue.
- **S7** Edit todo: change every field; checklist items can be added, renamed, checked/unchecked, deleted.
  - edges: changing the aspect keeps sprint, status and day.
- **S8** Delete todo with confirmation (it carries content).
  - edges: deleting a recurring instance deletes only that instance, not the rule.
- **S9** Backlog view: all todos not in a sprint, grouped by aspect, sorted by priority then due date;
  can filter to one aspect.
  - edges: empty backlog → empty state with "add todo"; overdue todos visibly marked.
- **S10** Sprint = one ISO week, Monday–Sunday, Europe/Berlin. At most one active sprint.
  Planning, when there is no active sprint and no pending review: target week is the week containing
  today, or next week if today is Sunday. Rue pulls backlog todos in, then starts the sprint.
  - edges: first run (no sprints ever) → planning available immediately; starting with zero todos
    allowed; week boundary computed in Europe/Berlin (test with fixed clock, incl. DST weeks).
- **S11** Planning suggests backlog todos whose due date falls in the target week (pre-marked, can be unmarked).
  - edges: none due → no suggestion section.
- **S12** Mid-sprint: a backlog todo can be added to the active sprint, a sprint todo moved back to the backlog.
  - edges: moving back clears day and resets status to To do.
- **S13** Sprint todos have a status To do / Doing / Done; changeable from every sprint view;
  a checkbox toggles Done.
  - edges: un-checking Done → To do.
- **S14** Sprint view "by aspect": Things-style list grouped by aspect, status visible.
  - edges: aspect with no sprint todos → hidden; empty sprint → empty state pointing to backlog.
- **S15** Sprint view "board": columns To do / Doing / Done; move between columns (drag on desktop,
  status menu on touch); aspect shown as colour/icon tag.
  - edges: empty column → placeholder.
- **S16** Sprint view "week by day": columns Mon–Sun plus "Unscheduled"; assign/move a todo to a day
  (drag on desktop, day picker on touch); today highlighted; on phone one day at a time.
  - edges: only days of the active sprint selectable; done todos stay on their day, marked done.
- **S17** Review: from the sprint's Sunday on, a review is available; from Monday after the sprint, it
  is required. Review lists done and open todos; for each open todo Rue picks carry over or back to
  backlog (recurring instances: carry over or drop). Closing the review ends the sprint and opens planning.
  Carried todos keep status and lose their day.
  - edges: review pending → no new sprint can start, sprint screens show a prompt to review;
    weeks away → only the last sprint is reviewed, skipped weeks have no sprint; all done → review
    is a one-tap close; done todos stay with the closed sprint and don't return to the backlog.
- **S18** Recurring rule: title, aspect, weekdays (≥1), optional notes/priority/checklist template.
  When a sprint starts, one instance per chosen weekday is added, pre-assigned to that day.
  Rules can be listed, edited (affects future sprints only), and deleted (existing instances stay).
  - edges: rule created mid-sprint → instances for the remaining days (today onward) of the active
    sprint; no weekday chosen → rejected; rule's aspect deleted → moves with S5.
- **S19** Responsive: every screen works at 375 px phone width and desktop. Mobile navigation is a
  Things-style home list (Today, Sprint, Backlog, Aspects, Recurring) you drill into; desktop has a sidebar.
  - edges: touch alternatives for every drag interaction (S15, S16).
- **S20** Deploy-ready: `npm run build` + `node build` runs the app with port and SQLite path from env,
  schema migrations run on start, `GET /healthz` returns 200, data survives a restart.
  - edges: missing DB directory → created; migration failure → process exits non-zero.

- **S21** Today view, the default landing screen: active-sprint todos assigned to today plus overdue
  todos (due date before today, not done), grouped by aspect, with status toggles and quick add
  (adds to the sprint on today).
  - edges: no active sprint → prompt to plan (or to review if pending); nothing today → calm empty
    state linking to the week view; Sunday after review closed → shows prompt to plan next week.

- **S22** README with setup, scripts and env vars (`PORT`, `DATABASE_PATH`, test flag) — accepted at Gate 1.
  - edges: none (docs)
- **S23** `package.json` declares `engines.node >= 22.5` (R4) — accepted at Gate 1.
  - edges: none (config)

## Non-goals
- Login / auth / multi-user — LAN/VPN is the boundary; single user.
- Homelab deployment (LXC, Ansible role, nginx) — split off; Homelab is at its WIP limit.
- Data migration from SISTEMA (Life-Managment-Dashboard) — start empty.
- Dark mode — one theme from the design direction.
- Keyboard shortcuts.
- Sprint stats / history views — closed sprints are stored, but no UI.
- Recurrence beyond weekly-on-days (every N weeks, monthly).
- Natural-language quick add (`#aspect !1 fri`) — plain form in v1.
- Reminders / notifications, calendar sync, search, offline/PWA, undo.
- Configurable sprint length or start day.

## Codebase touchpoints
- New, empty repo `~/Repos/Life-Manager`; no existing code.
- Precedent (from the SISTEMA README): SvelteKit + `adapter-node` + `node:sqlite` already runs on the
  homelab, so the same runtime choice keeps the later deploy identical.

## Risks
- R1 "High-end" is taste, not testable → spike S2: Rue approves the design direction before feature UI.
- R2 Week boundaries / DST / Sunday rules → resolved: fixed Europe/Berlin, computed server-side, unit-tested with a fixed clock.
- R3 Drag-and-drop on touch → resolved: touch uses menus/pickers (S15, S16); drag is desktop enhancement.
- R4 `node:sqlite` needs Node ≥ 22.5 on the server → accepted: SISTEMA already runs it on the homelab.
- R5 Scope is large for one change → appetite set at Gate 0; cut candidates: S11, S16, S18, S21.
- R6 Mobbin has no Sunsama/Akiflow and no sprint-review screen → accepted: stand-ins (Linear cycles,
  Amie, Jira, Tiimo, Rox) cited in `design-refs.md`.

## Decisions
- New repo `Life-Manager`, not a rebuild of SISTEMA — Rue's call.
- Stack: SvelteKit + Vite + TS, npm, SQLite via `node:sqlite`, `adapter-node` — Rue's web standard + homelab precedent.
- One global weekly sprint, Mon–Sun; planning possible from Sunday — Rue.
- Review blocks the next sprint — Rue.
- Aspects user-defined and required on every todo; delete moves todos — Rue.
- Recurring: weekly on chosen days only — Rue.
- Open recurring instances at review: carry over or drop (not backlog) — a "gym Monday" in the backlog makes no sense.
- No login; responsive phone + desktop — Rue.
- Light theme only — `design-refs.md` proposes a dark-mode token swap; that bullet does not apply (Non-goal).
- Completed todos stay visible, struck through, until the sprint closes; review toggles default to
  "carry over" — matches the Things/Linear references, keeps the review one calm screen.
- Planning: drag between backlog panel and sprint on desktop, picker on touch.
- Gate 1: Today's overdue list includes backlog todos; "back to backlog" at review resets status and
  day (as S12); planned todos sit in a draft sprint until started; test-only routes behind `LM_TEST=1` — planner's interpretations, approved by Rue.
- Design grounded in Mobbin (Things 3, Sunsama/Akiflow), cited in `design-refs.md` — Rue's standing instruction.

## Done when
- Rue can, on phone and desktop: create aspects, capture todos, plan a sprint, work it in all three
  views, review it, and plan the next — with recurring todos appearing on their days.
- `npm run proof:full` is green.
- `node build` runs with env config, `/healthz` is 200, and data survives a restart.
- Rue has approved the visual result.

## Split off
- Homelab deploy for Life-Manager (LXC + Ansible role + nginx, reusing the party-games pattern) —
  start once Homelab's WIP frees up.
