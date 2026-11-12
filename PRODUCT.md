# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
One person (the owner) planning their own life in weekly sprints. No accounts, no sharing. Uses it from a phone (its own UI, see principle 5) for quick capture and ticking things off, and from a wide desktop screen for planning, reviewing and upkeep. Usage is many short visits a day plus a weekly planning and review ritual. Many of the owner's aspects include university study, so semesters, classes, exams and grades are first-class; IT side projects are tracked too.

## Product Purpose
A self-hosted weekly-sprint todo app for the aspects of a life (health, uni, job, home, finance, social, ...): one backlog, one Monday-Sunday sprint with planning and review, and a Today view. Success means the owner always knows what matters today, can plan a week in minutes, closes each week with an explicit decision for every open item, and captures a todo in seconds. Full behavior is in `docs/functional-contract.md`.

## Positioning
A single-user, self-hosted sprint ritual for a whole life rather than a team backlog: the sprint is a fixed calendar week, review is mandatory before the next sprint starts, and every item belongs to a life aspect. It optionally mirrors planned items one-way to Proton Calendar, one calendar per aspect.

## Operating Context
- Runs on a LAN or VPN behind a reverse proxy; Node with SQLite, Docker image or release tarball. No login.
- Dates use the Europe/Berlin calendar day. Weeks start Monday. Display formats follow en-GB.
- Weekly rhythm: plan before or on Monday, work the sprint (week, board or aspect view), review when the week ends, then plan the next one.
- First run has no data and asks for aspects before anything else is usable.
- Proton sync runs only when the `proton` CLI is configured; the app never logs in itself and needs a re-login when the session expires.

## Capabilities and Constraints
- Todos: title, aspect, priority, due date, notes (Markdown), checklist, status (To do, Doing, Done), planned day with optional time slot, optional IT project or uni class link.
- Backlog, sprint lifecycle (planning draft, active, closed), review decisions per open item (carry over, back to backlog, drop).
- Today view, month calendar (planned todos, projected recurring items, exams, due lists), recurring weekly rules.
- Aspects with name, colour and icon, in an order the owner sets by hand; safe delete by moving todos to another aspect. Onboarding presets that already exist are shown as existing and cannot be added twice.
- Uni hub: semesters (archive/unarchive/delete), classes (lecturer, room, ECTS, links, exam, grade), class todos by type (lecture, exercise, other), revision tracking, grade summary.
- IT projects: five statuses (backlog, active, in progress, paused, implemented), description, repo URL, tags, Markdown notes, linked todos.
- Constraints: single user, no auth; form posts need a correct origin/protocol configuration (a deployment requirement documented in the README, no in-app warning); drag and drop is a pointer-only convenience and every action has a non-drag equivalent; all UI copy is English; the framework default error page stays.
- Decided: Rue's gate-1 decisions are in "Gate-1 decisions" in `docs/functional-contract.md`; nothing is left open there.

## Brand Commitments
Name: Life Manager. All UI copy is English. No other brand constraints are confirmed.

## Evidence on Hand
README, `openspec/specs/*`, the Playwright suite in `e2e/`, and `docs/functional-contract.md` (route-by-route behavior, copy list, state hooks, gate-1 decisions). No testimonials, customers or benchmarks exist; none may be invented.

## Product Principles
1. The week is the unit: sprints are Monday-Sunday and a review closes each one.
2. Capture first, decide later: adding a todo never forces a date.
3. Every item belongs to an aspect of life, and aspects stay visible.
4. Every action has a keyboard and touch path; pointer drag is never the only way.
5. The phone is its own UI, designed for the phone and not a squeezed desktop: it may omit display-only secondary data, but every action and decision stays reachable.
6. The app never loses or silently rewrites user data: destructive actions confirm, deletes move or cascade explicitly, and failures say what happened.

## Accessibility & Inclusion

Target: WCAG 2.2 AA, set for every app in the shared design fingerprint (Design-System).

Keyboard and touch operation are required on every route. State must be exposed through roles, labels and ARIA (not only visuals); only the two hooks allow-listed in the contract (`data-hydrated`, `data-day`) may carry state outside the accessibility tree. No formal conformance standard has been confirmed.
