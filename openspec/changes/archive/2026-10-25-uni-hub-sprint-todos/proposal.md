## Why

The Uni Hub opens with the "Due next" list of every dated open todo (and the same list in the rail at >=1280 px), which pushes the class cards down. Rue wants the class cards first, then only this week's sprint todos, tinted by LEC / EXC / OTH.

## What Changes

- **Hub order (S1):** PageHeader, GradeLine, active semesters with their class cards, the sprint-todo list, ArchivedGroup, ProjectNotes. The "Due next" list (inline and in the rail) and its exam rows are removed from the hub. On >=1280 px the rail keeps only the aspect line (its `railTitle` "Deadlines" no longer fits and becomes "Uni"). No Uni aspect: unchanged (UniAspectPrompt). No semesters: empty state as today, no todo list.
- **"This week" list (S2):** open (status != done) todos that have a class in a non-archived semester and sit in the active sprint (`sprints.state = 'active'`). Row = title, class badge, due date if any, type chip. Order: due date ascending, undated last, then id. Heading "This week" with the total count. Nothing matching: one empty line "Nothing in this week's sprint", no pager.
- **Paging (S3):** 6 rows per page, client-side, "Previous" / "Next" and "Page n of m"; no pager at <=6 todos; Previous disabled on the first and Next on the last page; the page clamps when the list shrinks.
- **Type colours (S4):** the whole todo card (background tint + border) is coloured by `todo.type`: LEC orange, EXC turquoise, OTH grey, type null grey like OTH. New tokens `--lec`, `--exc`, `--oth` with tint variants; ink keeps AA contrast on the tint. Hub list only; overdue rows keep their overdue marking on top of the tint.
- **Removed:** `DeadlineList.svelte` and `listDeadlines` (and the `Deadline` type) once nothing else uses them; `dueText` moves out of `DeadlineList.svelte` because the class card imports it.
- **Release (S5):** version 0.8.0 (`package.json` + `package-lock.json`, commit `chore(release): v0.8.0`); the tag `v0.8.0` is pushed by the shipper after the merge.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `uni-hub`: Deadline overview removed; Uni overview gains the new order and its edge states; new requirements for the sprint-todo list, paging and the type colours (S1-S4).
- `navigation`: the Uni rail content is the aspect line, not the deadline overview; the 768-1279 px exception no longer places a deadline section above the semesters (S1).

## Non-Goals

- Colours on the class page or elsewhere — Rue said Uni Hub only; class page rows and ClassBadge stay as they are.
- Exams on the hub — "Due next" is replaced, the exam rows go with it (decided with Rue).
- Server-side paging, a page-size setting, persistent page state — a small client pager is enough.
- Changing which todos count for class cards (open count, next due) — untouched.
- Schema changes — none; the list reads existing columns.

## Done criteria

- [ ] `/uni` shows the class cards first, then "This week" with at most 6 tinted todo cards and a pager when there are more.
- [ ] LEC cards are orange, EXC turquoise, OTH grey; the class page looks as before.
- [ ] No "Due next" list, no `deadline-row` and no exam rows on `/uni` at 375 px or 1600 px; the rail holds only the aspect line.
- [ ] `rg "DeadlineList|listDeadlines|deadline-row"` finds nothing in `src/` and `e2e/`.
- [ ] `npm run proof:full` is green, `package.json` says 0.8.0, and the shipper tags `v0.8.0`.

## Appetite

One evening.

## Decisions

- Due next is replaced, not kept — Rue chose "Ersetzen".
- Only uni todos in the active sprint, open only — Rue chose the recommended option.
- 6 per page with Previous/Next — Rue's choice.
- Colour on the hub list only, whole card tinted — Rue's choice.
- UI copy in English.
- Only `state = 'active'` counts (todos planned for a day while the sprint is in review or planning do not show), as in the sprint views (accepted risk R3 in scope.md).
- The tint tokens are hex literals, not `color-mix()`: computed styles of `color-mix()` come back as `color(...)` strings, which the contrast check in e2e cannot parse.
- Paging logic lives in two pure helpers in `src/lib/uni.ts` (`PAGE_SIZE`, `pageCount`, `clampPage`) so the clamp edge is unit-tested without a UI that can shrink the list.

## Impact

- Server: `src/lib/server/uni.ts` gains `listSprintClassTodos`, loses `listDeadlines`; `src/routes/uni/+page.server.ts` loads the sprint todos instead of deadlines.
- UI: `src/routes/uni/+page.svelte` (order, rail), new `src/lib/components/uni/SprintTodos.svelte`, `DeadlineList.svelte` deleted, `ClassCard.svelte` import of `dueText`; `src/lib/styles/tokens.css` (type tokens); `src/lib/types.ts` (`Deadline` removed, `SprintClassTodo` added).
- Tests: `e2e/uni.test.ts` (rail/deadline scenarios replaced), `src/lib/server/uni.test.ts` (deadline tests replaced), new `e2e/uni-sprint-todos.test.ts`, new `src/lib/uni.test.ts`.
- Release: `package.json` / `package-lock.json` to 0.8.0; tag `v0.8.0` after the merge.
