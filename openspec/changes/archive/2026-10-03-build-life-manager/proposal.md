## Why

Rue keeps todos for several areas of life (health, uni, job, …) without one place that
plans them together. They want a calm, high-end, self-hosted web app that organises
all of them in one weekly sprint, with a planning and review ritual.

## What Changes

New app in the empty repo `~/Repos/Life-Manager` (SvelteKit + Vite + TS, npm, SQLite via
`node:sqlite`, `adapter-node`):

- A working harness: `npm run proof`, `npm run proof:full`, `npm run dev` (S1); `engines.node >= 22.5` declared (S23).
- A README with setup, scripts and env vars (S22).
- A design direction spike grounded in Mobbin, ending in Rue's approval of a style tile (S2).
- Aspects (user-defined life areas) with first-run onboarding, create/edit/delete (S3–S5).
- Todos with title, aspect, notes, priority, due date and checklist; quick-add form; edit; delete (S6–S8).
- Backlog view grouped by aspect (S9).
- One global weekly sprint (ISO week, Mon–Sun, Europe/Berlin) with planning, mid-sprint changes,
  statuses, and a blocking review that carries over or returns open todos (S10–S13, S17).
- Three sprint views: by aspect, board, week by day (S14–S16), and a Today landing view (S21).
- Weekly recurring rules that add instances to each new sprint (S18).
- Responsive phone + desktop layout with Things-style mobile navigation (S19).
- Deploy-ready Node build: env config, migrations on start, `/healthz`, persistent data (S20).

## Capabilities

### New Capabilities
- `app-runtime`: harness commands, Node build, env config, migrations on start, health check, persistence, Node engine, setup README (S1, S20, S22, S23).
- `design-direction`: Mobbin-grounded brief, design tokens, style tile, Rue's approval (S2).
- `aspects`: first-run onboarding, create/edit/delete aspects (S3, S4, S5).
- `todos`: create, edit, delete todos and their checklists (S6, S7, S8).
- `backlog`: backlog view of all todos not in a sprint (S9).
- `sprint-lifecycle`: week rules, planning, suggestions, mid-sprint moves, review (S10, S11, S12, S17).
- `sprint-views`: statuses and the by-aspect, board and week-by-day views (S13, S14, S15, S16).
- `today`: the Today landing view (S21).
- `recurring`: weekly recurring rules and their instances (S18).
- `navigation`: responsive layout, sidebar on desktop, home list on phone, touch alternatives (S19).

### Modified Capabilities
- none (new repo)

## Non-Goals

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

## Done criteria

- [ ] Rue can, on phone and desktop: create aspects, capture todos, plan a sprint, work it in all three
      views, review it, and plan the next — with recurring todos appearing on their days.
- [ ] `npm run proof:full` is green.
- [ ] `node build` runs with env config, `/healthz` is 200, and data survives a restart.
- [ ] Rue has approved the visual result.

## Appetite

5–7 sessions. Cut candidates if it runs over: S11, S16, S18, S21.

## Impact

- New repo, no existing code. New runtime dependency on Node ≥ 22.5 (`node:sqlite`), which the
  homelab already runs for SISTEMA.
- New SQLite schema (aspects, todos, checklist items, sprints, recurring rules).
- The later homelab deploy (split off) reuses `node build` + env config unchanged.
