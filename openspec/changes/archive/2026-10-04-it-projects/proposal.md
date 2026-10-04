## Why

Rue has no place to keep their IT projects (ideas, running, implemented) together with notes, repo link
and stack. Work on a project shows up as loose IT todos in the week, with no tie back to the project
and no history of what was done.

## What Changes

- New data: migration 2 adds an `it_projects` table, a `settings` table holding the IT aspect id, and a
  nullable `todos.project_id` (FK, `ON DELETE SET NULL`). Additive only; existing rows are untouched. (S1)
- New `/projects` overview: cards grouped Active, Backlog, Paused, with a collapsed "Implemented (n)"
  group; a "New project" form; the one-time IT aspect prompt, changeable later. (S2, S3, S9)
- New `/projects/[id]` detail page: status pill dropdown, editable metadata, one Markdown notes document,
  linked todos grouped Open / Planned / Done, delete with confirm. Metadata in the context rail at
  ≥1280 px, a wrapping row under the title below. (S4–S8, S13)
- Todos of the IT aspect can link to a project from QuickAdd and the todo editor; a todo that changes
  aspect loses its link on the server; linked todos show a muted project badge in every `TodoRow`. (S10–S12)
- Navigation grows from five to six lists: "Projects" after Recurring, counting active projects. (S14)
- Design gate: a static mockup of overview and detail at 1600 px and 375 px, with Mobbin references in
  `design/brief.md`, approved by Rue before any feature UI is built. Motion is unchanged. (S15)
- New dependency: one small Markdown parser (`marked`) with raw HTML escaped.

## Capabilities

### New Capabilities
- `it-projects`: IT project records, their lifecycle, overview and detail screens, notes, the IT aspect
  setting and the project's view of its linked todos.

### Modified Capabilities
- `todos`: optional project link on IT-aspect todos (create/edit), server-side unlink on aspect change,
  project badge on todo rows.
- `navigation`: six lists instead of five (sidebar, phone home list), Projects count, the new screens in
  the responsive / wide-layout requirements (overview without rail, detail with rail at ≥1280 px).
- `design-direction`: the Projects mockup and its Mobbin references in `design/brief.md`, approved before
  the Projects feature UI.

## Non-Goals

- Ideas / change requests as their own items or table — an idea is a backlog project; change requests go
  into the notes.
- "Pull into week" from a project — todos are created and linked by hand via QuickAdd.
- Linking recurring rules to projects.
- Tag filtering or search on the overview — tags display only.
- A generic, reusable "projects" building block — the later uni module is built separately.
- Multiple notes / note history per project — one Markdown document.
- Extra motion (card→detail transition, collapse animation).
- Dark theme — design-direction is light only.

## Done criteria

- [ ] Rue can create a project, see it as a card, open it, write Markdown notes, set repo/tags, and move it through all four states.
- [ ] An IT todo created via QuickAdd with a project shows the badge in Today/Sprint/Backlog and appears under the project's Open/Planned/Done groups as it moves.
- [ ] Setting a project to implemented with open todos warns with the count.
- [ ] `npm run proof:full` is green, including updated navigation/layout e2e at 375–1600 px.

## Appetite

2–3 sessions.

## Impact

- `src/lib/server/schema.ts` (migration 2), `db.ts` (`resetDb`), new `src/lib/server/projects.ts`,
  `todos.ts`, `sprints.ts` (`selectTodos`), `aspects.ts` (delete moves todos → unlink), `src/lib/types.ts`.
- New routes `src/routes/projects/`, `src/routes/projects/[id]/`; `src/routes/+layout.server.ts`
  (nav count, project refs, IT aspect id); `src/routes/todos/+page.server.ts` (`projectId`).
- Components: `Sidebar.svelte`, `HomeList.svelte`, `TodoRow.svelte`, `QuickAdd.svelte`,
  `TodoFields.svelte`, `TodoEditor.svelte`, new `src/lib/components/projects/*`.
- Test routes `__test/seed`, `__test/reset`; e2e `navigation`, `layout`, `responsive` plus new project tests.
- `design/brief.md`, new `design/projects-mockup.html` and screenshots.
- Dependency: `marked`.
