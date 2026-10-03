# Scope: sprint-management

Triage: feature — connects sprint ⇄ aspects/backlog in the UI, permanent sprint management, desktop layout + motion pass, two lifecycle bug fixes; >1 session. Appetite: 2–3 sessions.

## Problem
Rue plans life by aspect, but the Sprint tab never shows where its todos come from: the backlog is invisible there, aspects have no page of their own, and pulling work in only happens on Plan or the Backlog page. On desktop the app uses a left-pinned 720 px column, leaving most of a wide screen empty, and moving things has no motion to show where they went.

## Flows
- Manage the running sprint: Sprint tab → backlog rail (grouped by aspect) → add a todo / remove one / give it a day → sprint views update in place.
- Work an aspect: sidebar aspect link → aspect page → see "This sprint" (with progress) and "Backlog" → move todos between them.
- End of week (unchanged): Sunday review prompt → Review (carry / backlog / drop) → Plan → Start sprint.
- Desktop at ≥1280: every screen uses the width (rail, grid, or full-width view) instead of a left-pinned column.

## In scope
- **S1** The Sprint tab always shows a backlog rail next to the sprint while a sprint is running (incl. its Sunday): backlog todos grouped by aspect in the same order and aspect colours as the sprint's "By aspect" view, with a title filter.
  - edges: empty backlog → empty state with link to Backlog; filter with no match → "No backlog todo matches"; collapsed aspect groups remember state per viewer (localStorage, optional); phase none/planning → Sprint tab keeps today's prompt to Plan, no rail; review-required → rail hidden, review prompt only.
- **S2** From the rail a todo joins the running sprint with one action ("Add to sprint"), on desktop also by dragging it onto the sprint list, a board column or a day column (drop on a day sets that day).
  - edges: drag on touch → not offered, button only; todo already moved by another tab → refused quietly, list reloads; drop on "Done" column → joins with status done.
- **S3** Any sprint todo can be sent back to the backlog from the Sprint tab directly (row menu / hover action, plus drag onto the rail on desktop), not only from inside the editor.
  - edges: done todo → asks nothing, resets to To do as today; recurring instance → "Remove from sprint" deletes the instance (recurring todos have no backlog), with undo toast.
- **S4** Each aspect group header in the sprint (views and rail) shows progress for this sprint: "done / total" plus a hairline bar in the aspect colour; the rail header shows the backlog count per aspect.
  - edges: aspect with 0 sprint todos → stays hidden in sprint view (current spec), shown in rail with its backlog count; 0 backlog todos in an aspect → group omitted from rail.
- **S5** Each aspect has its own page (`/aspects/<id>`): "This sprint" section with progress and the S2/S3 actions, then its "Backlog" section with quick add defaulting to that aspect. Sidebar aspect links and rows on the Aspects page open it.
  - edges: unknown/deleted id → 404 page with link to Aspects; no running sprint → "This sprint" section replaced by "No sprint running" + link to Plan; aspect with no todos → empty state with quick add.
- **S6** On phone the Sprint tab has a "Manage" button opening a sheet with the S1 rail content and S2/S3 buttons.
  - edges: none beyond S1–S3 (same content, no drag).
- **S7** Adding to a sprint is refused while the review is required (Monday after the sprint until review closes), everywhere (Backlog page, rail, aspect page) — instead the todo stays in backlog and the UI points to Review.
  - edges: race where review becomes required between page load and click → refused with message, no write.
- **S8** Starting a sprint never creates a second copy of a recurring todo that was carried over: per rule, a carried open instance takes the first weekday slot of that rule in the new week, and only the remaining weekdays get fresh instances.
  - edges: rule deleted/paused since → carried instance kept with no day, nothing generated; rule with N weekdays and M carried instances (M≥N) → no fresh instances, extra carried ones keep no day.
- **S9** Desktop layout ≥1280 px: sidebar | content (list max 720, centred in the space between sidebar and rail — Rue at Gate 2, 2026-10-03: every main screen centres its column, with or without a rail) | context rail (~320–360 px, `--paper-sunk`). Rail per screen: Sprint → backlog rail (S1) + "Unscheduled"; Today → this sprint's per-aspect progress; Aspect page → the other section's summary is not needed, rail shows aspect details (colour, counts). Screens without a rail (Backlog, Review, Recurring, Welcome) centre their column in the free space.
  - edges: 768–1279 → rail collapses into a toggle button that opens it as an overlay panel (band widened from 1024–1279 at Gate 1, planner decision); <768 → unchanged phone layout; no horizontal page scroll at any width.
- **S10** Board and Week fill the available width at ≥1280: board columns stretch evenly with equal min height to the bottom of the page content area (viewport bottom less the page's bottom padding; orchestrator call during verify 2026-10-03, Rue may veto at Gate 2); Week shows Mon–Sun in one row (min column ~120 px) with Unscheduled moved into the rail. In Week view the rail (backlog + Unscheduled) is the toggle overlay even at ≥1280, so the seven columns get the full content width (Rue, 2026-10-03, during build: docked rail + 7×120 px doesn't fit at 1280). By aspect and Board keep the docked rail.
  - edges: a day with many todos scrolls within its column; switching Week ↔ Board/By aspect at ≥1280 swaps overlay ↔ docked rail; an open overlay closes when leaving Week; drops from the overlay rail onto a day still work; 1024–1279 → week keeps today's wrapped layout.
- **S11** Aspects page at ≥1024 is a grid of aspect cards (icon, name, S4 progress, backlog count) instead of a short list; phone stays a list.
  - edges: one aspect → single card, left-aligned; delete/edit stay in the card menu.
- **S12** Motion — moves: a todo moving between rail and sprint, between board columns, or between days animates to its new place (FLIP/crossfade, 200 ms ease-out), the gap it left closes over the same 200 ms, and counts update; drag shows `--shadow-float` (no tilt) and a hairline drop slot.
  - edges: reduced motion → instant; move refused by server → item animates back.
- **S13** Motion — navigation: route changes and view switches (By aspect/Board/Week, rail open/close) cross-fade content in 120–200 ms; on desktop the rail/overlay slides in over 320 ms with the content reflowing, no scrim. No entrance or hover animations.
  - edges: browser without View Transitions → instant navigation; reduced motion → instant.
- **S14** design/brief.md is updated to Rue's decisions: motion section (S12/S13 replace "motion only answers an action" for moves and navigation) and the ≥1280 three-column layout, each with the Mobbin references below.
  - edges: none (document).

## Non-goals
- Weekly goals or capacity per aspect (needs a new table) — split off.
- Manual reordering of todos (needs a position column/migration) — order stays priority/due date.
- Changing the end-of-week mechanism (Review → Plan → Start) — Rue: keep as is.
- Retiring /sprint/plan or the Backlog page's "Add to sprint" — both stay; Plan reuses the rail component.
- Docked todo inspector panel instead of in-place row expansion — the expansion stays the signature interaction.
- Dark mode, keyboard shortcuts, search beyond the rail title filter.

## Codebase touchpoints
- `src/routes/+layout.svelte:18-47` — shell grid, `.page` max-width without centring; add ≥1024/≥1280 layout and rail slot (explorer: desktop whitespace).
- `src/lib/styles/tokens.css` — breakpoint/rail tokens; motion tokens reused (explorer: desktop whitespace).
- `src/routes/sprint/+page.svelte`, `+page.server.ts` — load backlog, rail, manage sheet, phase handling (explorer: data model).
- `src/lib/components/sprint/{AspectView,BoardView,WeekView,SprintCard}.svelte` — drop targets, progress headers, full-width layout, FLIP (both explorers).
- `src/routes/sprint/plan/+page.svelte` — extract the two-pane backlog list into a shared rail component.
- `src/lib/server/sprints.ts` — phase-aware add (S7), recurring dedupe in `startSprint` (S8), per-aspect progress query (S4).
- `src/lib/server/recurring.ts:86-108` — `generateInstances` dedupe (S8).
- `src/routes/todos/+page.server.ts` — shared actions (`addToSprint` with optional day).
- `src/routes/aspects/[id]/` (new), `src/routes/aspects/+page.svelte`, `src/lib/components/Sidebar.svelte` — aspect page, card grid, links.
- `src/lib/components/todo/TodoRow.svelte` — hover/menu remove action.
- e2e: planning, sprint-views, backlog, aspects, navigation, journey, responsive tests; unit: sprints.test.ts, todos.test.ts.

## Risks
- R1 e2e tests pin current behaviour (sidebar aspect links → /backlog, aspects list, plan pane test ids) → accepted: tests updated with the change; planner lists which.
- R2 Cross-list FLIP with SvelteKit form actions + invalidation may jump when data reloads → accepted: Svelte `crossfade`/`flip` keyed by todo id across lists with optimistic move state (pattern exists in WeekView/BoardView `moved`); fallback is instant move.
- R3 View Transitions API not in every browser → accepted: progressive enhancement via `onNavigate`, instant elsewhere.
- R4 build-life-manager's specs were never synced (`openspec/specs/` empty), so this change's delta specs modify capabilities that only exist in the unarchived change → accepted: build-life-manager is archived before this change is archived; planner writes deltas against its specs.
- R5 Base branch is `flow/build-life-manager`, which is still at Gate 2 → accepted: merge order is build-life-manager first.

## Decisions
- The sprint organises todos *by aspect*: aspect → backlog → sprint is one pipeline shown on the Sprint tab (rail) and on each aspect page — Rue: "the sprint is supposed to organise the to-dos from backlog / the different aspects"; data already supports it (todo.aspect_id + nullable sprint_id), so no schema change.
- Sprint management lives permanently on the Sprint tab — Rue's request; Plan stays for the next-week draft and shares the rail component.
- Progress is done/total per aspect, not points/capacity — no estimates exist in the model (Linear/Jira show capacity only because they have points).
- Rail on the right at ≥1280, overlay toggle below — Mobbin: Jira "Unscheduled work" rail https://mobbin.com/screens/5fddb893-f912-443e-bd23-ec673aa6a254, Linear cycle + inspector flow https://mobbin.com/flows/801fe69f-8f59-4bdc-a28a-9837f93fcd39 (screen 890e49aa-ac99-4fa8-b15c-d21076cbc045), ClickUp Planner https://mobbin.com/screens/87aa6e25-826f-425c-8456-d385d344fc83, Todoist Insights panel https://mobbin.com/screens/46dab991-e521-44bc-984a-c936e31610a8, Superlist panes https://mobbin.com/flows/495f838e-56fa-4539-ae58-4ea2dba639a1 (screen 73df32d9-dd60-4545-ae47-d09410fd0cfc).
- Per-aspect progress in group headers — Jira per-team cells https://mobbin.com/screens/994f09c1-4ca4-4127-8039-af78b1801a94.
- Week in one row filling width — Todoist Upcoming https://mobbin.com/screens/009edfa2-d70c-4e02-a9ee-ba3b81c33a6a, Amie list + grid https://mobbin.com/screens/41dde7c0-c4c4-4f68-a6bc-8c3e50977d13.
- Move motion without tilt, source closes, drop slot — ClickUp status flow https://mobbin.com/flows/1a8d1ee2-e9e2-47da-ba44-b7e37f20de7b, Basecamp placeholder https://mobbin.com/flows/0c8d2cf2-4132-42b1-ba65-91a17fed7d35 (screen 7c517ff9-2478-4b18-8ba7-b7ed515bfecc), Todoist drag https://mobbin.com/screens/349a1427-9550-4ec9-ab52-d3ddb0fa73a9 (tilt rejected).
- Panels dock with reflow, no scrim — Jira sidebar flow https://mobbin.com/flows/03bcd9ae-4012-41dc-aac6-98673a6fe3d4 (screen d4a9c031-0cba-41a8-b0f0-63499d51119c).
- Durations stay on the existing tokens (120/200/320 ms, ease-out) — Mobbin shows no timings; tokens already zero out under reduced motion.
- Recurring dedupe: carried instance fills the rule's first weekday — keeps Rue's review mechanism unchanged while removing the duplicate.

## Done when
- On a running sprint, Rue can pull a backlog todo into the sprint, give it a day and send another back — all from the Sprint tab, on desktop and phone.
- Each aspect has a page showing its sprint todos with progress and its backlog.
- At 1280 px no screen has an empty right third; Week shows the whole week in one row.
- Moving a todo visibly travels to its new place; navigation cross-fades; with reduced motion everything is instant.
- After a review that carries a recurring todo, Start sprint shows it once; adding to a sprint before the review is refused.
- `npm run proof:full` green; fresh 375 and 1280 screenshots for every screen.

## Split off
- aspect-weekly-goals: per-aspect weekly goal/capacity (new table), would replace done/total with a target.
- manual-ordering: drag to reorder within backlog and sprint (position column + migration).
