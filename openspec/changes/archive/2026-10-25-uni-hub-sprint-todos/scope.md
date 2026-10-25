# Scope: uni-hub-sprint-todos

Triage: tweak — Uni Hub only: sprint-week todo list under the class cards, colour-coded by class type, paged. Appetite: one evening. Ships as minor release 0.8.0.

## Problem
The Uni Hub opens with the "Due next" list of every dated open todo (and the rail on >=1280px), which pushes the class cards down. Rue wants the class cards first, then only this week's sprint todos, tinted by LEC / EXC / OTH.

## Flows
- Open /uni: header, grade line, class cards (per active semester), then "This week" todo list (max 6 rows) → Next → page 2 → Previous → page 1.

## In scope
- **S1** Hub order: PageHeader, GradeLine, active semesters with their class cards, the sprint-todo list (S2), ArchivedGroup, ProjectNotes. The "Due next" DeadlineList (inline and in the rail) and its exam rows are removed from the hub. On >=1280px the rail keeps only the aspect line.
  - edges: no Uni aspect → unchanged (UniAspectPrompt); no semesters → empty state as today, no todo list.
- **S2** Sprint-todo list on the hub: open (status != done) todos that have a class in a non-archived semester and sit in the active sprint (`sprints.state = 'active'`). Row = title, class badge, due date if any, type chip. Order: due date ascending, undated last, then id. Heading "This week" with the total count.
  - edges: no active sprint or no matching todos → one empty line ("Nothing in this week's sprint"), no pager; done todos and todos of archived semesters never appear; a todo outside the sprint (open backlog, other sprint) never appears.
- **S3** Paging: 6 rows per page, client-side, "Previous" / "Next" buttons and "Page n of m". Pager is hidden when there are <=6 todos.
  - edges: first page disables Previous, last page disables Next; a page never goes out of range when the list shrinks (page clamps); exactly 6 todos → no pager, 7 → 2 pages.
- **S4** Colour coding on the hub list: the whole todo card (background tint + border) is coloured by `todo.type`: LEC orange, EXC turquoise, OTH grey. Type null → grey like OTH. New tokens (e.g. `--lec`, `--exc`, `--oth` with tint variants) in the design tokens; text keeps AA contrast on the tint. Hub only: class page rows and ClassBadge stay as they are.
  - edges: overdue rows keep their overdue marking on top of the tint.
- **S5** Release: bump to 0.8.0 (package.json + package-lock.json, `chore(release): v0.8.0`), tag `v0.8.0` after the merge and watch the release run (memory: every ship tags).

## Non-goals
- Colours on the class page or elsewhere — Rue said Uni Hub only.
- Exams on the hub — "Due next" is replaced, the exam rows go with it (decided with Rue).
- Server-side paging, page-size setting, persistent page state — small client pager is enough.
- Changing which todos count for class cards (open count, next due) — untouched.

## Codebase touchpoints
- `src/routes/uni/+page.svelte`, `+page.server.ts` — order, load of sprint todos, rail content (explorer: hub layout)
- `src/lib/server/uni.ts` — new query for class todos in the active sprint; `listDeadlines` becomes unused (explorer: listDeadlines at line 351)
- `src/lib/components/uni/DeadlineList.svelte` — removed with its tests; new sprint-todo list component beside it
- `src/lib/uni.ts`, design tokens — type colours; `TYPE_LABELS` exists
- `openspec/specs/uni-hub/spec.md` — Deadline overview requirement removed, new requirements for the sprint list and colours; Uni overview order scenarios checked
- `e2e/uni.test.ts` (rail/deadline scenarios), `src/lib/server/uni.test.ts` (deadline tests) — replaced

## Risks
- R1 Deadline overview scenarios and the rail tests at 1280 assert the old layout → resolved: planner removes the requirement via delta spec and rewrites those e2e scenarios.
- R2 Tint contrast for orange/turquoise text → resolved: tokens use light tints with dark ink; reviewer checks.
- R3 Todos planned for a day but sprint not active (review phase, next week's sprint) → accepted: only `state = 'active'` counts, as in the sprint views.

## Decisions
- Due next is replaced, not kept — Rue chose "Ersetzen".
- Only uni todos in the active sprint, open only — Rue chose the recommended option.
- 6 per page with Previous/Next — Rue's choice.
- Colour on the hub list only, whole card tinted — Rue's choice.
- UI copy in English.

## Done when
- /uni shows the class cards first, then "This week" with at most 6 tinted todo cards and a pager when there are more.
- LEC cards are orange, EXC turquoise, OTH grey; the class page looks as before.
- `npm run proof:full` is green, version is 0.8.0 and tagged.

## Split off
- none
