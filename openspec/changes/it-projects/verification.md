verified-at: 5dca910

## Layer 1: proof-full (green, exit 0)
```
Test Files  10 passed (10) / Tests  99 passed (99) [unit]
  ✓  195 e2e/todos.test.ts:163:1 › Scenario: Deleting a todo asks for confirmation (1.7s)
  ✓  196 e2e/todos.test.ts:184:1 › Editing on phone uses a sheet (735ms)

  196 passed (2.1m)
```

## Layer 2: spec coverage

| Scenario | proof | Evidence |
|---|---|---|
| Brief cites Mobbin references for the Projects screens | manual (taste document, judged by Rue) | manual checklist below (design.md) |
| Mockup shows overview and detail at both widths | manual (visual judgement) | manual checklist below; built-UI shots in shots/ |
| Projects UI waits for the approved mockup | manual (human taste gate, recorded by the orchestrator) | manual checklist below |
| Migration 2 adds projects without touching existing data | unit | `src/lib/server/db.test.ts` › "Scenario: Migration 2 adds projects without touching existing data" ✓ |
| Project fields round-trip | unit | `src/lib/server/projects.test.ts` › "Scenario: Project fields round-trip" ✓ |
| Deleting the IT aspect unsets the setting | unit | `src/lib/server/aspects.test.ts` › "Scenario: Deleting the IT aspect unsets the setting" ✓ |
| Both todo read models carry the project link | unit | `src/lib/server/todos.test.ts` › "Scenario: Both todo read models carry the project link" ✓ |
| Cards are grouped by status | e2e | `e2e/projects.test.ts` › "Scenario: Cards are grouped by status" ✓ |
| Card shows the project summary | e2e | `e2e/projects.test.ts` › "Scenario: Card shows the project summary" ✓ |
| Most recently updated project comes first | unit | `src/lib/server/projects.test.ts` › "Scenario: Most recently updated project comes first" ✓ |
| No projects shows an empty state | e2e | `e2e/projects.test.ts` › "Scenario: No projects shows an empty state" ✓ |
| Empty groups are not rendered | e2e | `e2e/projects.test.ts` › "Scenario: Empty groups are not rendered" ✓ |
| Phone shows one card per row | e2e | `e2e/projects.test.ts` › "Scenario: Phone shows one card per row" ✓ |
| Wide desktop grid fills the content column | e2e | `e2e/projects.test.ts` › "Scenario: Wide desktop grid fills the content column" ✓ |
| New project lands in Backlog | e2e | `e2e/projects.test.ts` › "Scenario: New project lands in Backlog" ✓ |
| Empty project name is rejected | unit | `src/lib/server/projects.test.ts` › "Scenario: Empty project name is rejected" ✓ |
| Non-http repo URL is rejected | unit | `src/lib/server/projects.test.ts` › "Scenario: Non-http repo URL is rejected" ✓ |
| Tags are trimmed and deduplicated | unit | `src/lib/server/projects.test.ts` › "Scenario: Tags are trimmed and deduplicated" ✓ |
| Card opens the project detail | e2e | `e2e/project-detail.test.ts` › "Scenario: Card opens the project detail" ✓ |
| Metadata sits in the rail at 1280 | e2e | `e2e/project-detail.test.ts` › "Scenario: Metadata sits in the rail at 1280" ✓ |
| Metadata wraps under the title below 1280 | e2e | `e2e/project-detail.test.ts` › "Scenario: Metadata wraps under the title below 1280" ✓ |
| Unknown project id shows 404 | e2e | `e2e/project-detail.test.ts` › "Scenario: Unknown project id shows 404" ✓ |
| Edit metadata on the detail page | e2e | `e2e/project-detail.test.ts` › "Scenario: Edit metadata on the detail page" ✓ |
| Metadata edit uses the create validation | unit | `src/lib/server/projects.test.ts` › "Scenario: Metadata edit uses the create validation" ✓ |
| Notes are edited as Markdown and shown rendered | e2e | `e2e/project-detail.test.ts` › "Scenario: Notes are edited as Markdown and shown rendered" ✓ |
| Raw HTML in notes is escaped | unit | `src/lib/markdown.test.ts` › "Scenario: Raw HTML in notes is escaped" ✓ |
| Empty notes show a placeholder | e2e | `e2e/project-detail.test.ts` › "Scenario: Empty notes show a placeholder" ✓ |
| Long notes are not truncated | e2e | `e2e/project-detail.test.ts` › "Scenario: Long notes are not truncated" ✓ |
| Status pill offers the four states | e2e | `e2e/project-detail.test.ts` › "Scenario: Status pill offers the four states" ✓ |
| Every status transition is allowed | unit | `src/lib/server/projects.test.ts` › "Scenario: Every status transition is allowed" ✓ |
| Implemented with open todos asks for confirmation | e2e | `e2e/project-detail.test.ts` › "Scenario: Implemented with open todos asks for confirmation" ✓ |
| Cancelling the implemented warning changes nothing | e2e | `e2e/project-detail.test.ts` › "Scenario: Cancelling the implemented warning changes nothing" ✓ |
| Implemented without open todos needs no confirmation | e2e | `e2e/project-detail.test.ts` › "Scenario: Implemented without open todos needs no confirmation" ✓ |
| Reopening an implemented project needs no confirmation | e2e | `e2e/project-detail.test.ts` › "Scenario: Reopening an implemented project needs no confirmation" ✓ |
| Deleting a project asks for confirmation | e2e | `e2e/project-detail.test.ts` › "Scenario: Deleting a project asks for confirmation" ✓ |
| Deleting a project unlinks its todos | unit | `src/lib/server/projects.test.ts` › "Scenario: Deleting a project unlinks its todos" ✓ |
| First run prompts for the IT aspect | e2e | `e2e/projects.test.ts` › "Scenario: First run prompts for the IT aspect" ✓ |
| Changing the IT aspect removes links after confirmation | e2e | `e2e/projects.test.ts` › "Scenario: Changing the IT aspect removes links after confirmation" ✓ |
| Changing the IT aspect unlinks every todo | unit | `src/lib/server/projects.test.ts` › "Scenario: Changing the IT aspect unlinks every todo" ✓ |
| Changing the IT aspect without links needs no confirmation | e2e | `e2e/projects.test.ts` › "Scenario: Changing the IT aspect without links needs no confirmation" ✓ |
| Without aspects Projects leads to creating one | e2e | `e2e/projects.test.ts` › "Scenario: Without aspects Projects leads to creating one" ✓ |
| Linked todos are grouped Open, Planned, Done | unit | `src/lib/server/projects.test.ts` › "Scenario: Linked todos are grouped Open, Planned, Done" ✓ |
| Done group starts collapsed | e2e | `e2e/project-detail.test.ts` › "Scenario: Done group starts collapsed" ✓ |
| Project without linked todos explains linking | e2e | `e2e/project-detail.test.ts` › "Scenario: Project without linked todos explains linking" ✓ |
| Linked todo moves through the project's groups | e2e | `e2e/project-journey.test.ts` › "Scenario: Linked todo moves through the project's groups" ✓ |
| Opening a project uses only the route cross-fade | e2e | `e2e/motion.test.ts` › "Scenario: Opening a project uses only the route cross-fade" ✓ |
| Desktop shows a sidebar | e2e | `e2e/navigation.test.ts` › "Scenario: Desktop shows a sidebar" ✓ |
| Phone home list shows the six lists | e2e | `e2e/navigation.test.ts` › "Scenario: Phone home list shows the six lists" ✓ |
| Phone home list drills into each list | e2e | `e2e/responsive.test.ts` › "Scenario: Phone home list drills into each list" ✓ |
| Every screen fits 375 px without horizontal scroll | e2e | `e2e/responsive.test.ts` › "Scenario: Every screen fits 375 px without horizontal scroll" ✓ |
| Sprint at 1280 shows a context rail | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Sprint at 1280 shows a context rail" ✓ |
| Today at 1280 shows sprint progress per aspect | e2e | `e2e/today.test.ts` › "Scenario: Today at 1280 shows sprint progress per aspect" ✓ |
| Aspect page rail shows the aspect's details | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect page rail shows the aspect's details" ✓ |
| Screens without a rail centre their column | e2e | `e2e/layout.test.ts` › "Scenario: Screens without a rail centre their column" ✓ |
| Screens with a rail centre their column | e2e | `e2e/layout.test.ts` › "Scenario: Screens with a rail centre their column" ✓ |
| Rail becomes an overlay toggle below 1280 | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail becomes an overlay toggle below 1280" ✓ |
| No screen scrolls horizontally at any width | e2e | `e2e/responsive.test.ts` › "Scenario: No screen scrolls horizontally at any width" ✓ |
| Projects entry counts active projects | e2e | `e2e/navigation.test.ts` › "Scenario: Projects entry counts active projects" ✓ |
| Zero active projects is shown like other zero counts | e2e | `e2e/navigation.test.ts` › "Scenario: Zero active projects is shown like other zero counts" ✓ |
| Quick add links a todo to a project | e2e | `e2e/todo-projects.test.ts` › "Scenario: Quick add links a todo to a project" ✓ |
| Project field appears only for the IT aspect | e2e | `e2e/todo-projects.test.ts` › "Scenario: Project field appears only for the IT aspect" ✓ |
| Project field lists projects that are not implemented | e2e | `e2e/todo-projects.test.ts` › "Scenario: Project field lists projects that are not implemented" ✓ |
| Project field is hidden without IT aspect or projects | e2e | `e2e/todo-projects.test.ts` › "Scenario: Project field is hidden without IT aspect or projects" ✓ |
| Switching the aspect away drops the project | e2e | `e2e/todo-projects.test.ts` › "Scenario: Switching the aspect away drops the project" ✓ |
| Aspect change removes the project link | unit | `src/lib/server/todos.test.ts` › "Scenario: Aspect change removes the project link" ✓ |
| Project link on a non-IT todo is not stored | unit | `src/lib/server/todos.test.ts` › "Scenario: Project link on a non-IT todo is not stored" ✓ |
| Unknown project id is rejected | unit | `src/lib/server/todos.test.ts` › "Scenario: Unknown project id is rejected" ✓ |
| Linked todo shows the project badge | e2e | `e2e/todo-projects.test.ts` › "Scenario: Linked todo shows the project badge" ✓ |
| Unlinked todo shows no badge | e2e | `e2e/todo-projects.test.ts` › "Scenario: Unlinked todo shows no badge" ✓ |
| Badge wraps under the title on a phone | e2e | `e2e/todo-projects.test.ts` › "Scenario: Badge wraps under the title on a phone" ✓ |
Gaps: none

Note: `src/lib/markdown.test.ts` › "Scenario: Script-scheme link and image URLs are inert" ✓ runs green but matches no scenario in the delta specs (extra test, not counted).

## Manual checklist

\`npm run dev\` → http://localhost:5173

- [ ] Brief cites Mobbin references for the Projects screens: open openspec/changes/it-projects/design.md, check the cited references exist and fit (U2 builder noted Todoist/Things/Linear refs may be missing)
- [ ] Mockup shows overview and detail at both widths: check the approved mockup covers Projects overview and detail at 1280 and 375
- [ ] Projects UI waits for the approved mockup: confirm the mockup approval predates the Projects UI work

## Diffstat
```
 design/brief.md                                    |  53 +-
 design/projects-mockup.html                        | 634 +++++++++++++++++++++
 design/shots/projects-detail-1600.png              | Bin 0 -> 108136 bytes
 design/shots/projects-detail-375.png               | Bin 0 -> 67613 bytes
 design/shots/projects-overview-1600.png            | Bin 0 -> 93140 bytes
 design/shots/projects-overview-375.png             | Bin 0 -> 74285 bytes
 e2e/layout.test.ts                                 |  22 +-
 e2e/motion.test.ts                                 |  24 +
 e2e/navigation.test.ts                             |  69 ++-
 e2e/project-detail.test.ts                         | 334 +++++++++++
 e2e/project-journey.test.ts                        |  66 +++
 e2e/projects.test.ts                               | 230 ++++++++
 e2e/responsive.test.ts                             |  38 +-
 e2e/todo-projects.test.ts                          | 174 ++++++
 openspec/changes/it-projects/.openspec.yaml        |   2 +
 openspec/changes/it-projects/design.md             | 176 ++++++
 openspec/changes/it-projects/flow.yaml             |   9 +
 openspec/changes/it-projects/proposal.md           |  70 +++
 openspec/changes/it-projects/scope.md              | 136 +++++
 .../it-projects/shots/project-detail-1280.png      | Bin 0 -> 105815 bytes
 .../it-projects/shots/project-detail-375.png       | Bin 0 -> 68752 bytes
 .../changes/it-projects/shots/projects-1280.png    | Bin 0 -> 60934 bytes
 .../changes/it-projects/shots/projects-375.png     | Bin 0 -> 35751 bytes
 .../it-projects/specs/design-direction/spec.md     |  25 +
 .../changes/it-projects/specs/it-projects/spec.md  | 279 +++++++++
 .../changes/it-projects/specs/navigation/spec.md   |  91 +++
 openspec/changes/it-projects/specs/todos/spec.md   |  72 +++
 openspec/changes/it-projects/tasks.md              |  66 +++
 openspec/changes/it-projects/verification.md       | 174 ++++++
 package-lock.json                                  |  15 +
 package.json                                       |   3 +
 src/lib/components/projects/ItAspectPrompt.svelte  | 150 +++++
 src/lib/components/projects/LinkedTodos.svelte     | 135 +++++
 src/lib/components/projects/NewProjectForm.svelte  | 128 +++++
 src/lib/components/projects/ProjectCard.svelte     | 109 ++++
 src/lib/components/projects/ProjectMeta.svelte     | 192 +++++++
 src/lib/components/projects/ProjectNotes.svelte    | 194 +++++++
 src/lib/components/projects/StatusPill.svelte      | 217 +++++++
 src/lib/components/projects/glyphs.ts              |   7 +
 src/lib/components/shell/HomeList.svelte           |   2 +-
 src/lib/components/shell/Sidebar.svelte            |   3 +-
 src/lib/components/todo/QuickAdd.svelte            |   4 +-
 src/lib/components/todo/TodoEditor.svelte          |   6 +-
 src/lib/components/todo/TodoFields.svelte          |  37 +-
 src/lib/components/todo/TodoRow.svelte             |  22 +-
 src/lib/components/ui/icons.ts                     |   4 +
 src/lib/markdown.test.ts                           |  64 +++
 src/lib/markdown.ts                                |  35 ++
 src/lib/projects.ts                                |  22 +
 src/lib/server/aspects.test.ts                     |  24 +
 src/lib/server/aspects.ts                          |   4 +-
 src/lib/server/db.test.ts                          |  42 ++
 src/lib/server/db.ts                               |   2 +
 src/lib/server/projects.test.ts                    | 228 ++++++++
 src/lib/server/projects.ts                         | 152 +++++
 src/lib/server/schema.ts                           |  20 +
 src/lib/server/sprints.ts                          |   1 +
 src/lib/server/todos.test.ts                       |  73 +++
 src/lib/server/todos.ts                            |  33 +-
 src/lib/types.ts                                   |  41 ++
 src/routes/+layout.server.ts                       |   6 +-
 src/routes/__test/seed/+server.ts                  |  48 +-
 src/routes/projects/+page.server.ts                |  28 +
 src/routes/projects/+page.svelte                   | 256 +++++++++
 src/routes/projects/[id]/+error.svelte             |  17 +
 src/routes/projects/[id]/+page.server.ts           |  68 +++
 src/routes/projects/[id]/+page.svelte              | 239 ++++++++
 src/routes/todos/+page.server.ts                   |   5 +-
 68 files changed, 5338 insertions(+), 42 deletions(-)
```

## Screenshots

- openspec/changes/it-projects/shots/project-detail-375.png
- openspec/changes/it-projects/shots/project-detail-1280.png
- openspec/changes/it-projects/shots/projects-375.png
- openspec/changes/it-projects/shots/projects-1280.png

## Review

Three rounds. Round 1 reviewer (fresh context) and the fixes, then round 2 and 3 on the fix diffs.

| Finding | Resolution |
|---|---|
| Todo in a planning-sprint counted open but listed in neither Open nor Planned | fixed: Planned = in a sprint (active or planning), not done; delta spec, design.md and unit test updated (spec adjustment) |
| Weak: "Edit metadata on the detail page" never checked the overview card or the dropped duplicate tag | test strengthened |
| Weak: "Aspect change removes the project link" did not assert sprint/status/day | test strengthened |
| Weak: "Project fields round-trip" compared the wrong object; no-op `inDraft > 0` | tests strengthened |
| `[x](javascript:…)` live href in `{@html}` notes | fixed: script-scheme links/images blanked |
| Round 2: HTML-entity bypass (`java&#115;cript:`, `&colon;`) of that fix | fixed: entities decoded, strict allowlist (relative, http, https, mailto); test red-first with entity variants. Round 3 reviewer: no findings after ~45 bypass attempts |
| IT aspect preselected by name in ItAspectPrompt, not in any scenario | rejected: harmless convenience, listed at Gate 2 |
| `setProjectNotes` bumps `updated_at`, not in any scenario | rejected: plausible, listed at Gate 2 |
| Test "Scenario: Script-scheme link and image URLs are inert" has no matching scenario in the delta spec | open: not counted as evidence; user may want a scenario added |
