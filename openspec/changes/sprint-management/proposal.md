## Why

Rue plans life by aspect, but the Sprint tab never shows where its todos come from: the backlog is
invisible there, aspects have no page of their own, and pulling work in only happens on Plan or the
Backlog page. On desktop the app uses a left-pinned 720 px column, leaving most of a wide screen empty,
and moving things has no motion to show where they went.

## What Changes

- The Sprint tab gets a permanent backlog rail (grouped by aspect, title filter) while a sprint runs (S1).
- Todos join the running sprint from the rail by button or, on desktop, by drag onto the list, a board
  column or a day column (S2); sprint todos go back from their row or by drag onto the rail (S3).
- Aspect group headers show this sprint's progress "done / total" with a hairline bar; rail headers show
  backlog counts (S4).
- Each aspect gets a page `/aspects/<id>` with "This sprint" and "Backlog" sections (S5); sidebar aspect
  links and Aspects rows open it. The Aspects page becomes a card grid at ≥1024 (S11).
- Phone: a "Manage" button on the Sprint tab opens the rail content in a sheet (S6).
- Lifecycle fixes: adding to a sprint is refused while the review is required (S7); starting a sprint no
  longer duplicates a carried recurring todo (S8).
- Desktop ≥1280: sidebar | content | context rail, centred columns on screens without a rail, overlay
  rail at 1024–1279 (S9); board and week fill the width, Week in one row (S10).
- Motion: moves travel to their new place, navigation cross-fades, the rail slides in; all instant under
  reduced motion (S12, S13).
- `design/brief.md` records the new motion stance and the three-column layout with Mobbin references (S14).

No schema change: `todo.aspect_id` + nullable `sprint_id` already model the aspect → backlog → sprint pipeline.

## Capabilities

### New Capabilities
- `motion`: moves animate to their new place, navigation and view switches cross-fade, reduced motion is instant (S12, S13).

### Modified Capabilities
- `sprint-views`: backlog rail, add/send-back from the Sprint tab, per-aspect progress headers, phone Manage sheet, full-width board and one-row week (S1, S2, S3, S4, S6, S10).
- `sprint-lifecycle`: mid-sprint adds take an optional day/status and are refused while the review is required (S2, S7).
- `recurring`: a carried open instance fills its rule's first weekday instead of being duplicated (S8).
- `aspects`: aspect page and card grid (S5, S11).
- `navigation`: three-column desktop layout with context rail, overlay rail at 1024–1279, centred rail-less screens (S9).
- `design-direction`: brief updated for motion and the wide layout (S14).

## Non-Goals

- Weekly goals or capacity per aspect (needs a new table) — split off.
- Manual reordering of todos (needs a position column/migration) — order stays priority/due date.
- Changing the end-of-week mechanism (Review → Plan → Start) — Rue: keep as is.
- Retiring /sprint/plan or the Backlog page's "Add to sprint" — both stay; Plan reuses the rail component.
- Docked todo inspector panel instead of in-place row expansion — the expansion stays the signature interaction.
- Dark mode, keyboard shortcuts, search beyond the rail title filter.

## Done criteria

- [ ] On a running sprint, Rue can pull a backlog todo into the sprint, give it a day and send another back — all from the Sprint tab, on desktop and phone.
- [ ] Each aspect has a page showing its sprint todos with progress and its backlog.
- [ ] At 1280 px no screen has an empty right third; Week shows the whole week in one row.
- [ ] Moving a todo visibly travels to its new place; navigation cross-fades; with reduced motion everything is instant.
- [ ] After a review that carries a recurring todo, Start sprint shows it once; adding to a sprint before the review is refused.
- [ ] `npm run proof:full` green; fresh 375 and 1280 screenshots for every screen.

## Appetite

2–3 sessions.

## Impact

- Server: `src/lib/server/sprints.ts` (placement-aware, phase-aware add; `removeFromSprint`; `aspectProgress`),
  `src/lib/server/recurring.ts` (carried-instance dedupe), `src/lib/server/todos.ts` (`backlogCounts`),
  `/todos` actions (`addToSprint` with `day`/`status`, new `removeFromSprint`). New error code `review-required`.
- UI: shell layout, new rail/motion/drag modules, Sprint tab, sprint views, new `/aspects/[id]` route,
  Aspects page, Sidebar links, TodoRow row actions, Plan page (rail component reuse), Today rail.
- Tests: e2e suites that pin current behaviour are updated (see design.md Risks, R1).
- Depends on build-life-manager being merged/archived first (R4, R5).
