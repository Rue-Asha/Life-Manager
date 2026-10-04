# Scope: it-projects

Triage: feature — new tables + migration, new module UI, nav spec delta, >1 session. Appetite: 2–3 sessions.

## Problem
Rue has no place to keep their IT projects (ideas, running, implemented) together with notes, repo link
and stack. Work on a project shows up as loose IT todos in the week, with no tie back to the project
and no history of what was done.

## Flows
- Capture an idea: Projects → "New project" → name (+ optional description, repo, tags) → card appears under Backlog.
- Work on a project: Projects → click card → detail → edit notes (Markdown) / metadata / status.
- Link a todo: QuickAdd or todo edit with the IT aspect selected → optional "Project" field → todo shows a
  project badge everywhere; the project detail lists it.
- Finish a project: detail → status pill → implemented → (if linked todos are open) warning with count →
  confirm → card moves to the collapsed "Implemented" group.
- First run: Projects with no IT aspect chosen → prompt to pick the aspect used for IT todos.

## In scope
- **S1** Data model: migration 2 (append-only in `src/lib/server/schema.ts`) adds `it_projects`
  (id, name, description, repo_url, tags, notes, status ∈ backlog|active|paused|implemented, created_at,
  updated_at), a module setting holding the IT aspect id, and `todos.project_id INTEGER NULL
  REFERENCES it_projects(id) ON DELETE SET NULL`.
  - edges: existing database with data → migration only adds, nothing rewritten; IT aspect deleted →
    setting falls back to unset (same as first run).
- **S2** `/projects` overview shows one card per project, grouped in sections Active, Backlog, Paused (in
  that order); Implemented is a collapsed group "Implemented (n)" below. Card: name, description (one
  line), tags, repo glyph if a repo is set, count of open linked todos. Within a group, most recently
  updated first.
  - edges: no projects → empty state with "New project"; an empty group is not rendered; 375 px → one
    card per row; 1600 px → grid fills the content column, alignment per navigation spec.
- **S3** Create a project: name required; description, repo URL, tags optional; new projects start in
  backlog (an idea is a backlog project).
  - edges: empty/whitespace name → field error; repo URL not http(s) → field error; tags entered as
    free text, trimmed, duplicates and empties dropped.
- **S4** Clicking a card opens `/projects/[id]`: name, status pill, description, repo link (opens in new
  tab), tags, notes, linked todos. At ≥1280 metadata (repo, tags, created/updated) sits in the context
  rail (RailLayout); below 1280 as a wrapping row under the title.
  - edges: unknown id → 404 error page; project without notes → placeholder prompting to write.
- **S5** Edit metadata (name, description, repo, tags) on the detail page; same validation as S3.
  - edges: none beyond S3 (same validation).
- **S6** Notes: one Markdown document per project, shown rendered, toggled into a textarea to edit and saved.
  Raw HTML in the Markdown is escaped, not rendered. Change requests for a project live here.
  - edges: empty notes → placeholder; very long notes → page scrolls, no truncation.
- **S7** Status change via a pill dropdown with the four states; any state reachable from any other.
  Moving to implemented while linked todos are open shows a confirm dialog naming the count; confirming
  changes the status and leaves the todos untouched; cancelling changes nothing.
  - edges: no open todos → no dialog; reopening an implemented project → no dialog.
- **S8** Delete a project from the detail page after a confirm dialog; linked todos stay and lose
  their link (FK SET NULL).
  - edges: project with linked todos → dialog names the count that will be unlinked.
- **S9** IT aspect setting: chosen once on `/projects` (prompt on first run, changeable later). Changing
  it removes every existing todo→project link, after a confirm dialog naming the count.
  - edges: no aspects exist at all → prompt links to creating one; 0 links → no dialog.
- **S10** QuickAdd and the todo edit form show an optional "Project" select only while the selected
  aspect is the IT aspect; it lists projects that aren't implemented (an already linked implemented
  project stays selectable on that todo).
  - edges: no IT aspect set or no projects → field hidden; switching the aspect away in the form hides
    the field and submits no project.
- **S11** A todo that gets a different aspect loses its project link (server-side, regardless of UI).
  - edges: posting a project_id with a non-IT aspect → link not stored; posting an unknown project id
    → field error.
- **S12** Linked todos show a muted project badge (glyph + name) in `TodoRow` wherever it renders;
  clicking it opens the project.
  - edges: 375 px → badge wraps under the title; todos without a link → no badge.
- **S13** Project detail lists linked todos in three groups: Open (not in a sprint, not done), Planned
  (in the active sprint, not done), Done (collapsed by default, newest completion first — the project's
  history).
  - edges: no linked todos → short empty state explaining how to link (IT aspect + Project field).
- **S14** Navigation: "Projects" entry after Recurring, before the Aspects divider, in Sidebar and
  `/menu`; its count is the number of active projects. navigation spec delta (five → six lists) and the
  layout/responsive e2e checks include the new screens.
  - edges: count 0 → shown the same way as other zero counts.
- **S15** Design gate: before feature UI, a static mockup of overview and detail (1600 px and 375 px)
  with Mobbin references added to `design/brief.md`; Rue approves it before UI units start.
  Motion stays as in the motion spec (route cross-fade only).
  - edges: none (a review step).

## Non-goals
- Ideas / change requests as their own items or table — an idea is a backlog project; change requests go
  into the notes (Rue, explore).
- "Pull into week" from a project — todos are created and linked by hand via QuickAdd.
- Linking recurring rules to projects — not needed now.
- Tag filtering or search on the overview — tags display only until there are many projects.
- A generic, reusable "projects" building block — the later uni module is built separately.
- Multiple notes / note history per project — one Markdown document.
- Extra motion (card→detail transition, collapse animation).
- Dark theme — design-direction is light only.

## Codebase touchpoints
- `src/lib/server/schema.ts` — append migration 2 (explorer: data layer).
- `src/lib/server/db.ts` — `resetDb()` must delete the new table(s) in FK-safe order (explorer: data layer).
- `src/lib/server/todos.ts` — `todoColumns`, `createTodo`, `updateTodo` gain `projectId`; aspect-change unlink (explorer: data layer).
- `src/lib/server/sprints.ts` — second read model `selectTodos()` maps `projectId` too (explorer: data layer).
- `src/lib/server/aspects.ts` — CRUD template for a new `projects.ts` (explorer: data layer).
- `src/lib/types.ts` — `Todo`, `NewTodo`, `TodoPatch` (explorer: data layer).
- `src/routes/todos/+page.server.ts` — create/update actions parse `projectId` (explorer: data layer).
- `src/lib/components/todo/TodoRow.svelte` — badge in `.meta` next to "Recurring" (explorer: data layer).
- `src/lib/components/todo/QuickAdd.svelte`, `TodoFields.svelte` — conditional Project select (explorer: shell).
- `src/lib/components/shell/Sidebar.svelte` (`NAV_ITEMS`, `NavCount`), `HomeList.svelte`, `src/routes/+layout.server.ts` (counts) (explorer: shell).
- `src/lib/components/shell/RailLayout.svelte`, `ui/PageHeader.svelte`, `ui/ConfirmDialog.svelte`, `ui/EmptyState.svelte`, `ui/Chip.svelte` — reuse (explorer: shell).
- `src/routes/__test/seed/+server.ts`, `__test/reset/+server.ts` — seed projects + links for e2e (explorer: data layer).
- `e2e/navigation.test.ts`, `layout.test.ts`, `responsive.test.ts` — six entries, new screens (explorer: shell).
- `openspec/specs/navigation/spec.md` — delta; new capability spec for it-projects; todos spec delta for the link (explorer: shell).
- `design/brief.md` — Mobbin references for the new screens (explorer: shell).

## Risks
- R1 Markdown rendering needs a new dependency → accepted: one small parser (e.g. `marked`) with raw HTML
  escaped; single-user app, but no HTML pass-through.
- R2 Two todo read models (`todoColumns`, `selectTodos`) can drift → accepted: both get `projectId`; a unit
  test asserts it on each path.
- R3 Nav spec says "five lists" and e2e asserts it → resolved: spec delta + test update in S14.
- R4 SQLite ALTER limits → resolved: `ADD COLUMN ... NULL REFERENCES ... ON DELETE SET NULL` is allowed; no table rebuild.
- R5 Aspects are user-created, so "IT" has no fixed id → resolved: module setting (S9).

## Decisions
- Embedded module, not a separate service — bridge to the week would otherwise be a cross-service API and a new LXC/role/nginx (prior explore session).
- IT-specific module with its own tables and UI, no generic projects component (prior explore session).
- Aspects are only the label of linked todos, not how projects are organised (prior explore session).
- Ideas are projects in status backlog; no project_items table, no "pull into week" — reverses the earlier brief; Rue: "Ideen sind ihre eigenen Projekte, nur noch nicht umgesetzt, haben nichts mit Todos zu tun".
- Lifecycle backlog → active → paused → implemented, no dropped state or reason (Rue).
- All UI copy in English (Rue).
- Overview is cards grouped by status, click opens a detail page (Rue).
- Project link only for todos of the IT aspect; aspect change or IT-aspect change removes links (Rue) — keeps the field off every other todo.
- Implemented with open todos: warn, todos stay (Rue).
- Mockup gate before feature UI, motion unchanged (Rue; design-direction spec requires approval).
- Defaults set by flow, open to veto at Gate 0: new projects start in backlog; repo URL must be http(s); delete allowed with confirm; Markdown raw HTML escaped; nav count = active projects; group order Active, Backlog, Paused.

## Done when
- Rue can create a project, see it as a card, open it, write Markdown notes, set repo/tags, and move it through all four states.
- An IT todo created via QuickAdd with a project shows the badge in Today/Sprint/Backlog and appears under the project's Open/Planned/Done groups as it moves.
- Setting a project to implemented with open todos warns with the count.
- `npm run proof:full` is green, including updated navigation/layout e2e at 375–1600 px.

## Split off
- none
