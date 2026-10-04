Harness exists (`npm run proof`, `npm run proof:full` in CLAUDE.md ## Harness), so no harness unit.
Builders: `npm run proof` is the per-task gate. Before running any e2e, run `npm run build` first —
Playwright's webServer runs `node build` (adapter-node), so without it the run tests the stale build.
Run only your own e2e files with your unit's `PORT`, e.g. `npm run build && PORT=<port> npx playwright test e2e/<file>`.
Scope e2e count assertions to container test ids, never page-wide (repo learning).

## 1. Data layer and contracts

> unit: depends=none · scope=S1,S3,S5,S7,S8,S9,S11,S13 · files=src/lib/server/schema.ts, src/lib/server/db.ts, src/lib/server/db.test.ts, src/lib/server/projects.ts, src/lib/server/projects.test.ts, src/lib/server/todos.ts, src/lib/server/todos.test.ts, src/lib/server/sprints.ts, src/lib/server/aspects.ts, src/lib/server/aspects.test.ts, src/lib/types.ts, src/lib/projects.ts, src/lib/components/ui/icons.ts, src/lib/components/shell/Sidebar.svelte, src/routes/+layout.server.ts, src/routes/todos/+page.server.ts, src/routes/__test/seed/+server.ts

- [x] 1.1 ⚠ irreversible (schema migration; production DB moves to `user_version` 2 on next start, no down-migration) — Write "Scenario: Migration 2 adds projects without touching existing data" in `db.test.ts` from its THEN clauses, then append migration 2 to `schema.ts` exactly as in design.md ## Contracts and extend `resetDb()` (delete `settings`, `it_projects` after `todos`)
- [x] 1.2 Add the contract types to `types.ts` (`ProjectStatus`, `Project`, `ProjectSummary`, `ProjectRef`, `ProjectInput`, `ProjectTodos`, `projectId` on `Todo`/`NewTodo`/`TodoPatch`), `src/lib/projects.ts` (statuses, groups, labels, messages, `parseTags`), and the `folder` / `git-branch` icons in `icons.ts`; `npm run check` green
- [x] 1.3 Write the unit tests "Scenario: Project fields round-trip", "Scenario: Most recently updated project comes first", "Scenario: Empty project name is rejected", "Scenario: Non-http repo URL is rejected", "Scenario: Tags are trimmed and deduplicated", "Scenario: Metadata edit uses the create validation", "Scenario: Every status transition is allowed", "Scenario: Deleting a project unlinks its todos", "Scenario: Changing the IT aspect unlinks every todo", "Scenario: Linked todos are grouped Open, Planned, Done" in `projects.test.ts`, then implement `src/lib/server/projects.ts` per ## Contracts until they pass
- [x] 1.4 Write "Scenario: Aspect change removes the project link", "Scenario: Project link on a non-IT todo is not stored", "Scenario: Unknown project id is rejected", "Scenario: Both todo read models carry the project link" in `todos.test.ts` and "Scenario: Deleting the IT aspect unsets the setting" in `aspects.test.ts`, then add `projectId` to `todoColumns`, `selectTodos()`, `createTodo`, `updateTodo` and make `deleteAspect` clear `project_id` on moved todos
- [x] 1.5 Wire the app seams: `/todos` `create`/`update` parse `projectId` (empty → null); `+layout.server.ts` returns `projects` (`listProjectRefs`) and `itAspectId`, and `nav.counts.projects` (`countActiveProjects`) with `NavCount` gaining `'projects'` in `Sidebar.svelte` (type only, no `NAV_ITEMS` entry); `__test/seed` gains `itAspect`, `projects`, todo `project` / `completedAt`, `SeedResult.projects`
- [x] 1.6 `npm run proof` green, and `npm run build && npx playwright test` still green (existing e2e must be unaffected by the new column and layout data)

## 2. Projects mockup and design brief (design gate)

> unit: depends=none · scope=S15 · files=design/brief.md, design/projects-mockup.html, design/shots/projects-overview-1600.png, design/shots/projects-overview-375.png, design/shots/projects-detail-1600.png, design/shots/projects-detail-375.png

- [x] 2.1 Research with the Mobbin MCP (`search_screens` / `search_flows`): confirm the Gate-0 references in design.md (Things 3 collapsed "later projects" row, Linear grouped status headers, Linear status pill flow, Linear properties rail, Linear Mobile pill row, Todoist / Things project badge) and find the exact Things 3 and Linear grouped-header screen URLs
- [x] 2.2 Build `design/projects-mockup.html` as a static page styled only through `src/lib/styles/tokens.css` (like `design/style-tile.html`): overview (Active / Backlog / Paused sections, collapsed "Implemented (n)" row, cards with name, one-line description, tags, repo glyph, open count, the empty state and the IT aspect prompt) and detail (title, status pill with its open menu, description, notes rendered + placeholder, linked todos Open / Planned / Done collapsed, metadata rail at 1600 and wrapping row at 375, a todo row with the project badge, the sidebar with Projects after Recurring)
- [x] 2.3 Write the four screenshots (overview and detail at 1600 px and 375 px) to `design/shots/projects-*.png`
- [x] 2.4 Add a "Projects" section to `design/brief.md` (and the Projects entry to §6 Navigation) citing a Mobbin URL for every decision; state that motion is unchanged (route cross-fade only) and that copy is English
- [x] 2.5 ⏸ HUMAN APPROVAL STOP — Rue approves the mockup. Do not mark this done yourself: stop here and report `needs-human: Rue approves the Projects mockup (design/projects-mockup.html, design/shots/projects-*.png, brief.md Projects section)`. Units 3, 4 and 5 must not start until Rue has approved.

## 3. Projects overview, IT aspect setting and nav entry

> unit: depends=1,2 · scope=S2,S3,S9,S14 · files=src/routes/projects/+page.server.ts, src/routes/projects/+page.svelte, src/lib/components/projects/ProjectCard.svelte, src/lib/components/projects/NewProjectForm.svelte, src/lib/components/projects/ItAspectPrompt.svelte, src/lib/components/shell/Sidebar.svelte, src/lib/components/shell/HomeList.svelte, e2e/projects.test.ts, e2e/navigation.test.ts

- [x] 3.1 Write e2e "Scenario: Cards are grouped by status", "Scenario: Card shows the project summary", "Scenario: No projects shows an empty state", "Scenario: Empty groups are not rendered", "Scenario: Phone shows one card per row", "Scenario: Wide desktop grid fills the content column" (assert at 1600 px, where the column cap binds) in `e2e/projects.test.ts`, then build the `/projects` load and page with `ProjectCard` per the approved mockup (no rail; column centred like Backlog)
- [x] 3.2 Write e2e "Scenario: New project lands in Backlog", then build `NewProjectForm` and the `create` action, showing field errors from `PROJECT_MESSAGES`
- [x] 3.3 Write e2e "Scenario: First run prompts for the IT aspect", "Scenario: Changing the IT aspect removes links after confirmation", "Scenario: Changing the IT aspect without links needs no confirmation", "Scenario: Without aspects Projects leads to creating one", then build `ItAspectPrompt` and the `setItAspect` action (ConfirmDialog naming the link count only when > 0)
- [x] 3.4 Update `e2e/navigation.test.ts` ("Scenario: Desktop shows a sidebar" with six entries in order, rename to "Scenario: Phone home list shows the six lists") and write "Scenario: Projects entry counts active projects", "Scenario: Zero active projects is shown like other zero counts"; then add the Projects entry (`folder` icon, count `projects`) after Recurring in `NAV_ITEMS` and adjust `HomeList` if needed
- [x] 3.5 `npm run proof` green; `npm run build` then run `e2e/projects.test.ts`, `e2e/navigation.test.ts` and `e2e/responsive.test.ts` green

## 4. Project detail page

> unit: depends=1,2 · scope=S4,S5,S6,S7,S8,S13 · files=src/routes/projects/[id]/+page.server.ts, src/routes/projects/[id]/+page.svelte, src/routes/projects/[id]/+error.svelte, src/lib/components/projects/StatusPill.svelte, src/lib/components/projects/ProjectMeta.svelte, src/lib/components/projects/ProjectNotes.svelte, src/lib/components/projects/LinkedTodos.svelte, src/lib/markdown.ts, src/lib/markdown.test.ts, package.json, package-lock.json, e2e/project-detail.test.ts

- [x] 4.1 Add `marked` (npm, lockfile updated); write unit "Scenario: Raw HTML in notes is escaped" in `markdown.test.ts`, then implement `renderMarkdown` with the `html` renderer escaping raw HTML
- [x] 4.2 Write e2e "Scenario: Metadata sits in the rail at 1280", "Scenario: Metadata wraps under the title below 1280", "Scenario: Unknown project id shows 404" (open the detail by URL from seeded ids — the overview is unit 3, so the card-click scenario is written in unit 6), then build the load, `+error.svelte`, page and `ProjectMeta` (RailLayout rail ≥1280 px, wrapping row below, no rail toggle)
- [x] 4.3 Write e2e "Scenario: Edit metadata on the detail page", "Scenario: Notes are edited as Markdown and shown rendered", "Scenario: Empty notes show a placeholder", "Scenario: Long notes are not truncated", then build the metadata edit (`update` action) and `ProjectNotes` (`notes` action, rendered ↔ textarea toggle)
- [x] 4.4 Write e2e "Scenario: Status pill offers the four states", "Scenario: Implemented with open todos asks for confirmation", "Scenario: Cancelling the implemented warning changes nothing", "Scenario: Implemented without open todos needs no confirmation", "Scenario: Reopening an implemented project needs no confirmation", "Scenario: Deleting a project asks for confirmation", then build `StatusPill` (`status` action) and delete (`delete` action, ConfirmDialog naming the unlink count)
- [x] 4.5 Write e2e "Scenario: Done group starts collapsed", "Scenario: Project without linked todos explains linking", then build `LinkedTodos` rendering existing `TodoRow`s (Open → `backlog`, Planned/Done → `sprint` context) with the Done group collapsed
- [x] 4.6 `npm run proof` green; `npm run build` then run `e2e/project-detail.test.ts` green

## 5. Todo project link and badge

> unit: depends=1,2 · scope=S10,S12 · files=src/lib/components/todo/QuickAdd.svelte, src/lib/components/todo/TodoFields.svelte, src/lib/components/todo/TodoEditor.svelte, src/lib/components/todo/TodoRow.svelte, e2e/todo-projects.test.ts

- [x] 5.1 Write e2e "Scenario: Quick add links a todo to a project", "Scenario: Project field appears only for the IT aspect", "Scenario: Project field lists projects that are not implemented", "Scenario: Project field is hidden without IT aspect or projects", "Scenario: Switching the aspect away drops the project" in `e2e/todo-projects.test.ts`
- [x] 5.2 Add the conditional Project select (`name="projectId"`, test id `project-field`) to `TodoFields`, fed from `page.data.projects` / `page.data.itAspectId`, bound in `QuickAdd` and `TodoEditor`; when hidden, nothing is submitted for `projectId` on create, and an empty value on edit
- [x] 5.3 Write e2e "Scenario: Linked todo shows the project badge", "Scenario: Unlinked todo shows no badge", "Scenario: Badge wraps under the title on a phone", then add the muted badge (`folder` glyph + name, link to `/projects/<id>`, test id `project-badge`) to `TodoRow`'s `.meta` (the detail page is unit 4, so assert the URL after the click, not the page content)
- [x] 5.4 `npm run proof` green; `npm run build` then run `e2e/todo-projects.test.ts`, `e2e/todos.test.ts`, `e2e/backlog.test.ts` green

## 6. Layout, responsive, motion and journey checks

> unit: depends=3,4,5 · scope=S13,S14,S15 · files=e2e/layout.test.ts, e2e/responsive.test.ts, e2e/navigation.test.ts, e2e/motion.test.ts, e2e/project-journey.test.ts, e2e/project-detail.test.ts

- [ ] 6.1 Extend `e2e/layout.test.ts`: Projects in "Scenario: Screens without a rail centre their column" and the project detail in "Scenario: Screens with a rail centre their column" (1600 px, where the cap binds, and 1100 px); prove the new assertions by a temporary mutation (e.g. shift the column) that makes them fail, then revert
- [ ] 6.2 Extend `e2e/responsive.test.ts`: Projects and a project's detail in "Scenario: Every screen fits 375 px without horizontal scroll" and "Scenario: No screen scrolls horizontally at any width", and Projects in "Scenario: Phone home list drills into each list"; extend "Scenario: Desktop shows a sidebar" in `e2e/navigation.test.ts` with Projects marked current on a detail page
- [ ] 6.3 Write "Scenario: Opening a project uses only the route cross-fade" in `e2e/motion.test.ts`
- [ ] 6.4 Write "Scenario: Card opens the project detail" in `e2e/project-detail.test.ts` (overview card click → detail content) and "Scenario: Linked todo moves through the project's groups" in `e2e/project-journey.test.ts` (Done-criteria journey across Backlog, Sprint, Today and the detail page)
- [ ] 6.5 Any failure that needs an app fix goes into the file that owns it (report the extra file); `npm run build && npm run proof:full` green
