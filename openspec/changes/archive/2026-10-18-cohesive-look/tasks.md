Harness exists (`npm run proof`, `npm run proof:full` in CLAUDE.md ## Harness), so no harness unit.
Builders: `npm run proof` is the per-task gate. Before running any e2e, run `npm run build` first —
Playwright's webServer runs `node build`, so without it the run tests the stale build. Run only your own e2e
files with your unit's `PORT`, e.g. `npm run build && PORT=<port> npx playwright test e2e/<file>`.
Scope e2e count assertions to container test ids (repo learning). Don't run `npx prettier --write` (repo
learning). Shared token names, primitives and accessible names: design.md ## Contracts. Every restyle unit
matches the approved `design/cohesive-mockup.html`; when the mockup and design.md disagree, the mockup wins.

## 1. Cohesive mockup and design brief (design gate)

> unit: depends=none · files=design/brief.md, design/cohesive-mockup.html, design/cohesive-tokens.css, design/shots/cohesive-*.png, design/palettes/check-contrast.mjs

- [x] 1.1 Write `design/cohesive-tokens.css` with the design.md §1 values under the new token names (the mockup's only colour source), and extend `check-contrast.mjs` with the cohesive pairs: text on canvas/surface/sunk, `--on-chrome`/`--on-chrome-2` and the overdue count on `--chrome` and `--chrome-hover`, white on accent, `--accent-hover` on `--accent-soft`, aspects and the white tick on surface, `--line-strong` on surface; it must pass
- [x] 1.2 Build `design/cohesive-mockup.html` (static, tokens only, like `design/uni-mockup.html`): shell with chrome sidebar and "New todo"; Today with hero, overdue and aspect groups, sprint-progress rail as field card; Sprint By aspect (hero, segmented switch, quiet rows with status glyph / day text / "Pick a day"), Board (lanes + compact cards), Week (one white sheet, one-line chips, today band); Backlog with pill filters and the rail's grouped rows; project detail and class detail with field-card rails; Uni with cards and "Due next"; phone editor sheet with grouped field rows; sidebar "New todo" dialog; toast; palette strip with all eight aspects and the accent next to a Uni group; a deep-blue accent swatch for the Open question. Each frame at 1440 px and 390 px
- [x] 1.3 Write screenshots of every frame at both widths to `design/shots/cohesive-*.png`
- [x] 1.4 Add a "Cohesive look" section to `design/brief.md` citing a Mobbin URL for every decision listed in the spec scenario (design.md has them), noting C24 is not on Mobbin and naming the stand-ins, stating that the dark sidebar is chrome (light theme only) and that motion is unchanged; mark the superseded colour/surface bullets of sections 1, 3, 4 and 9 as "replaced by Cohesive look"
- [x] 1.5 ⏸ HUMAN APPROVAL STOP — Rue approves the mockup and picks the accent (violet or deep blue). Do not mark this done yourself: stop and report `needs-human: Rue approves design/cohesive-mockup.html (shots design/shots/cohesive-*.png, brief "Cohesive look") and picks the accent`. Units 2–8 must not start before approval.
  - Approved by Rue on 2026-10-18 ("Das sieht super aus approved"); accent: Proton violet `#6d4aff` (the proposed default, no alternative picked).

## 2. Tokens, rename and primitives (contract)

> unit: depends=1 · files=src/lib/styles/tokens.css, src/app.css, src/lib/components/**/*.svelte (token rename only), src/routes/**/*.svelte (token rename only), src/lib/components/ui/ListGroup.svelte, src/lib/components/ui/SummaryHeader.svelte, src/lib/components/ui/FieldCard.svelte, src/lib/components/ui/PageHeader.svelte, design/palettes/check-contrast.mjs, e2e/sprint-rail.test.ts

- [x] 2.1 Move the approved values into `tokens.css` under the ## Contracts names (incl. the picked accent and `--radius-group`), body on `--canvas` in `app.css`; rename `--paper` → `--surface`, `--paper-sunk` → `--sunk`, `--paper-hover` → `--hover`, `--paper-scrim` → `--scrim` across `src/` (whole-token match: `rg -l -- '--paper'` must be empty afterwards); point `check-contrast.mjs --tokens` at the new names and run it green
- [x] 2.2 Add `ListGroup`, `SummaryHeader` and `FieldCard` exactly as in ## Contracts (styled per design.md §3, §6, §7) and give `PageHeader` the `subtitle`, `actions` and `icon` props; no screen uses them yet
- [x] 2.3 Update the rail-colour probe in `e2e/sprint-rail.test.ts` to `var(--surface)` and add the hairline left-edge check from the modified "Sprint at 1280 shows a context rail" scenario; `npm run proof` green and `npm run build && npx playwright test` green (look changes, behaviour doesn't)

## 3. Shell, sidebar "New todo" and UI primitives

> unit: depends=2 · files=src/lib/components/shell/Sidebar.svelte, src/lib/components/shell/HomeList.svelte, src/routes/+layout.svelte, src/routes/menu/+page.svelte, src/lib/components/ui/Button.svelte, src/lib/components/ui/Chip.svelte, src/lib/components/ui/Toast.svelte, src/lib/components/ui/Sheet.svelte, src/lib/components/ui/ConfirmDialog.svelte, src/lib/components/ui/EmptyState.svelte, src/lib/components/ui/ProgressBar.svelte, src/lib/components/sprint/ViewSwitch.svelte, e2e/navigation.test.ts

- [x] 3.1 Write e2e "Scenario: Sidebar button adds a backlog todo", "Scenario: Cancelling the sidebar dialog adds nothing", "Scenario: Phone home list has no New todo button" in `e2e/navigation.test.ts`
- [x] 3.2 Restyle `Sidebar` on `--chrome` per design.md §2 and add the "New todo" button that opens the existing `QuickAdd` (backlog target, as on `/backlog`) in a `Sheet`/dialog, closing on add, Cancel and Escape; `HomeList`/`menu` get the new list look without the button
- [x] 3.3 Restyle `Button` (primary/secondary/quiet), `Chip` (property, aspect tag, selected = chrome), `Toast` (chrome pill, bottom centre), `Sheet`/`ConfirmDialog` (surface, radius, secondary Cancel), `EmptyState` (inside a surface box), `ProgressBar` and `ViewSwitch` (pill segmented control) per design.md §8
- [x] 3.4 `npm run proof` green; `npm run build` then `e2e/navigation.test.ts`, `e2e/layout.test.ts`, `e2e/responsive.test.ts` green

## 4. Todo row and list anatomy

> unit: depends=2 · files=src/lib/components/todo/TodoRow.svelte, src/lib/components/todo/StatusControl.svelte, src/lib/components/todo/DayPicker.svelte, src/lib/components/todo/QuickAdd.svelte, src/lib/components/sprint/AspectView.svelte, src/lib/components/sprint/UnscheduledList.svelte, src/lib/components/rail/BacklogRail.svelte, src/lib/components/projects/LinkedTodos.svelte, src/routes/backlog/+page.svelte, src/routes/recurring/+page.svelte, src/routes/sprint/plan/+page.svelte, src/routes/sprint/review/+page.svelte, e2e/list-anatomy.test.ts, e2e/row-actions.test.ts, e2e/backlog.test.ts, e2e/planning.test.ts, e2e/review.test.ts, e2e/recurring.test.ts

- [x] 4.1 Write e2e "Scenario: No todo row draws its own border" in `e2e/list-anatomy.test.ts` and "Scenario: Row shows status as a glyph with its name" in `e2e/row-actions.test.ts` from their THEN clauses
- [x] 4.2 Strip `TodoRow`'s own border/margin/radius and lay out the trailing cluster per design.md §4; `StatusControl` renders the glyph with the accessible name "Status: <status>" (native select kept); `DayPicker` renders day text or the "Pick a day" calendar button; `QuickAdd` gets the white-field look
- [x] 4.3 Wrap every list in `ListGroup` with its header above: `AspectView`, `UnscheduledList`, `BacklogRail` (the "+" moves into the row's trailing slot, filter input gets the shared input look), `LinkedTodos` (project and class detail), Backlog (pill filters), Recurring, Plan and Review
- [x] 4.4 Update selectors in the listed existing e2e files that read the old visible "To do"/"Unscheduled" chip text to the accessible names from ## Contracts; behaviour assertions stay unchanged
- [x] 4.5 `npm run proof` green; `npm run build` then the e2e files of this unit plus `e2e/todos.test.ts`, `e2e/todo-projects.test.ts`, `e2e/todo-classes.test.ts`, `e2e/project-detail.test.ts`, `e2e/class-detail.test.ts` green

## 5. Board and Week

> unit: depends=2 · files=src/lib/components/sprint/BoardView.svelte, src/lib/components/sprint/WeekView.svelte, src/lib/components/sprint/SprintCard.svelte, e2e/sprint-views.test.ts

- [x] 5.1 Write e2e "Scenario: Board card shows the aspect in its meta line" and "Scenario: Week cards stay one line at 1440" in `e2e/sprint-views.test.ts`
- [x] 5.2 Board per design.md §5: `--sunk` lanes, compact `SprintCard` (title, one meta line with aspect dot+name, date, badges; status glyph top right as the touch status menu; no tag below)
- [x] 5.3 Week per design.md §5: one white sheet with hairline column dividers, today header band, one-line chips at ≥768 px, quiet "+" labelled "Add a todo to <day>"; phone keeps full rows with status and day picker
- [x] 5.4 `npm run proof` green; `npm run build` then `e2e/sprint-views.test.ts`, `e2e/motion.test.ts`, `e2e/journey.test.ts` green

## 6. Today and Sprint screens with the hero header

> unit: depends=2 · files=src/routes/+page.svelte, src/routes/+page.server.ts, src/routes/sprint/+page.svelte, src/routes/sprint/+page.server.ts, e2e/today.test.ts, e2e/sprint-hero.test.ts

- [x] 6.1 Write e2e "Scenario: Header counts open todos on Today", "Scenario: Header shows sprint progress during a sprint", "Scenario: Header without a sprint shows only the count" in `e2e/today.test.ts` and "Scenario: Sprint header shows progress and days left" in `e2e/sprint-hero.test.ts` (seed with `setClock` after every `reset`, repo learning)
- [x] 6.2 Today: `PageHeader` without icon, `SummaryHeader` (figure, label, sprint line, segments from the data the rail already uses; add counts to the load only if missing), lists in `ListGroup`, the rail's per-aspect progress as a `FieldCard`
- [x] 6.3 Sprint: `PageHeader` with the Week "Backlog" toggle in `actions`, `SummaryHeader` with "done / total", date range and days left above the view switch in all three views; the old floating date range is removed
- [x] 6.4 `npm run proof` green; `npm run build` then `e2e/today.test.ts`, `e2e/sprint-hero.test.ts`, `e2e/sprint-rail.test.ts`, `e2e/layout.test.ts` green

## 7. Rails, field cards and entity cards

> unit: depends=2 · files=src/lib/components/shell/RailLayout.svelte, src/lib/components/projects/ProjectMeta.svelte, src/lib/components/projects/ProjectCard.svelte, src/lib/components/projects/StatusPill.svelte, src/lib/components/uni/ClassMeta.svelte, src/lib/components/uni/ClassCard.svelte, src/lib/components/uni/DeadlineList.svelte, src/lib/components/uni/SemesterSection.svelte, src/routes/aspects/+page.svelte, src/routes/aspects/[id]/+page.svelte, src/routes/projects/+page.svelte, src/routes/projects/[id]/+page.svelte, src/routes/uni/+page.svelte, src/routes/uni/classes/[id]/+page.svelte

- [x] 7.1 `RailLayout`: rail on `--surface` with a `--line` left edge (docked and overlay)
- [x] 7.2 `ProjectMeta`, `ClassMeta`, `DeadlineList` and the aspect page rail as `FieldCard`s per design.md §7; below 1280 px their pill rows use the new chip look
- [x] 7.3 Aspect, project and class cards per design.md §8 (surface, no border, radius 16; dashed "New class" tile); entity pages (aspect, project, class) use `PageHeader` with `icon`, list pages (Aspects, Projects, Uni) without; aspect page list in `ListGroup`
- [x] 7.4 `npm run proof` green; `npm run build` then `e2e/aspect-page.test.ts`, `e2e/aspects.test.ts`, `e2e/projects.test.ts`, `e2e/project-detail.test.ts`, `e2e/uni.test.ts`, `e2e/class-detail.test.ts`, `e2e/layout.test.ts` green

## 8. Phone todo editor as grouped field rows

> unit: depends=2 · files=src/lib/components/todo/TodoEditor.svelte, src/lib/components/todo/TodoFields.svelte, src/lib/components/todo/SprintPrompt.svelte

- [x] 8.1 Below 768 px render `TodoFields` as grouped rows "icon · label · value ›" (Aspect, Day, Due, Priority, Checklist, Class/Type for Uni, Project for IT) in a `ListGroup`, title + notes in a first group, Delete as a quiet last row; desktop keeps the chip row in the expanded card; field names and test ids unchanged
  - Built: the field chips become grouped rows on phone (name · value ›, unset values hidden). Not built: title + notes as their own group and Delete as a row — the sheet keeps its existing title, notes and footer.
- [x] 8.2 `npm run proof` green; `npm run build` then `e2e/todos.test.ts`, `e2e/todo-classes.test.ts`, `e2e/todo-projects.test.ts`, `e2e/responsive.test.ts` green

## 9. Release

> unit: depends=3,4,5,6,7,8 · files=package.json, package-lock.json, design/shots/final-cohesive-*.png

- [x] 9.1 Screenshot every screen at 1440 px and 390 px with seeded data to `design/shots/final-cohesive-*.png` and compare against the mockup; fix drift in the owning unit's files
- [x] 9.2 `node design/palettes/check-contrast.mjs --tokens` green; `rg -n -- '--paper' src` empty
- [x] 9.3 Bump version to 0.4.0 in `package.json` and `package-lock.json`; `npm run proof:full` green (run in the background, full rerun on red)
- [x] 9.4 ⏸ HUMAN APPROVAL STOP — Rue walks through the app on phone and desktop ("Approved visual result"). Report `needs-human: Rue approves the cohesive look on real hardware`.
  - Approved by Rue on 2026-10-18 ("approved"), with the request to open the PR, merge and tag the release.
