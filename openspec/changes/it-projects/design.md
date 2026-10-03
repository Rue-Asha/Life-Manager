## Context

Life-Manager is a single-user SvelteKit app on SQLite (`node:sqlite`) with append-only migrations in
`src/lib/server/schema.ts` (`PRAGMA user_version`). Todos belong to user-created aspects, so "IT" has no
fixed id. Server modules (`aspects.ts`, `todos.ts`, `sprints.ts`) return `Result<T>` and take the
`DatabaseSync` as first argument; there are two todo read models (`todoColumns` in `todos.ts`,
`selectTodos()` in `sprints.ts`). The shell (`Sidebar.svelte` `NAV_ITEMS`, `HomeList.svelte`) and the
layout load (`+layout.server.ts`) drive navigation and counts. `RailLayout.svelte` gives the ≥1280 px
docked rail and the 768–1279 px overlay toggle. Every form posts to a route action and errors come back
as `{ error, field }`. The design-direction spec requires an approved visual direction before feature UI.

## Goals / Non-Goals

**Goals:** a Projects module embedded in the app (S1–S15): its own tables, overview and detail screens,
Markdown notes, a todo→project link restricted to the IT aspect, a badge on todo rows, a sixth nav entry,
and a mockup gate before the UI.

**Non-Goals:** (from scope.md, unchanged)
- Ideas / change requests as their own items or table — an idea is a backlog project; change requests go into the notes.
- "Pull into week" from a project — todos are created and linked by hand via QuickAdd.
- Linking recurring rules to projects.
- Tag filtering or search on the overview.
- A generic, reusable "projects" building block — the later uni module is built separately.
- Multiple notes / note history per project.
- Extra motion (card→detail transition, collapse animation).
- Dark theme.

## Decisions

From scope.md (Gate 0), carried as they are:
- Embedded module, not a separate service — a bridge to the week would otherwise be a cross-service API and a new LXC/role/nginx.
- IT-specific module with its own tables and UI, no generic projects component.
- Aspects are only the label of linked todos, not how projects are organised.
- Ideas are projects in status backlog; no project_items table, no "pull into week" (Rue: "Ideen sind ihre eigenen Projekte, nur noch nicht umgesetzt, haben nichts mit Todos zu tun").
- Lifecycle backlog → active → paused → implemented, no dropped state or reason.
- All UI copy in English.
- Overview is cards grouped by status, click opens a detail page.
- Project link only for todos of the IT aspect; an aspect change or an IT-aspect change removes links — keeps the field off every other todo.
- Implemented with open todos: warn, todos stay.
- Mockup gate before feature UI, motion unchanged.
- Defaults set by flow, not vetoed at Gate 0: new projects start in backlog; repo URL must be http(s); delete allowed with confirm; Markdown raw HTML escaped; nav count = active projects; group order Active, Backlog, Paused.

Technical choices for this change:
- **Settings table, not a column on aspects.** Migration 2 adds `settings (key TEXT PRIMARY KEY, value
  TEXT NOT NULL)` with key `it_aspect_id`. `getItAspectId` joins against `aspects`, so a deleted IT aspect
  reads as unset without a trigger. Alternative `aspects.is_it` flag: needs a uniqueness rule and leaks a
  module concern into the aspects table.
- **Tags as a JSON array in a TEXT column** (`'[]'`), like `recurring_rules.checklist`. No tag table: tags
  are display-only (non-goal: filtering).
- **Unlink on every aspect change, in SQL.** `updateTodo` sets `project_id = NULL` whenever `aspect_id`
  changes, and `deleteAspect` moves todos with `SET aspect_id = ?, project_id = NULL`. `createTodo` /
  `updateTodo` drop a posted `projectId` unless the (resulting) aspect is the IT aspect; an unknown id is
  `not-found` on `projectId`. Server-side, so the UI cannot get it wrong (S11).
- **"Open" for counts and the implemented warning = linked and not done**, regardless of sprint. The
  detail page splits that into Open (no sprint) and Planned (active sprint); Done = status done, ordered
  `completed_at DESC`.
- **Project names reach `TodoRow` through layout data**, not a join in the todo read models: the layout
  load returns `projects: ProjectRef[]` and `itAspectId`; `TodoRow`, `QuickAdd` and `TodoFields` read
  `page.data`. Keeps both read models to one added column (`project_id AS projectId`, R2) and avoids
  threading a prop through every list. Bigger alternative (`projectName` on `Todo` via LEFT JOIN in both
  read models) would buy rows that are self-contained outside the layout, at the cost of two query rewrites.
- **Markdown: `marked`** (R1), wrapped in `src/lib/markdown.ts` `renderMarkdown(src): string`, with the
  `html` renderer overridden to emit the escaped source text, so raw HTML (block and inline) is shown as
  text. Rendered server-side in the detail load and output with `{@html}` only from that function.
- **Detail layout:** `RailLayout` with a `rail` snippet at ≥1280 px; below 1280 px the page renders the
  same metadata as a wrapping row under the title and passes no rail (a `MediaQuery('min-width: 1280px')`
  decides), so no overlay toggle appears (S4).
- **Status change confirm** uses `ConfirmDialog` client-side with the open count from the load; the
  server action itself does not refuse (the warning is a UI step, scope: "todos stay").
- **Grouping order** lives in one client-safe module (`src/lib/projects.ts`), used by the overview and the
  status pill.

### Design references (Gate-0 Mobbin research, to be cited in `design/brief.md` by the mockup unit)
- Overview = cards grouped by status sections: Things 3 "later projects" collapsed row; Linear grouped
  status headers (search via Mobbin MCP and cite the screens used).
- Detail = single scroll page; status via a pill dropdown — Linear,
  https://mobbin.com/flows/babe3b2d-d8f7-4081-a6b9-c17097ea3e06 (screen 5bc1daea-c0a9-4e20-8f0d-77163691df63).
- Metadata in a right properties rail — Linear, https://mobbin.com/screens/ead350e6-9cb3-4f96-9b57-605402828ef9;
  becoming a wrapping pill row on mobile — Linear Mobile, https://mobbin.com/screens/f8e3aa03-00f2-4985-a6ae-1055ae0f4144.
- Project badge as muted text with a glyph — Todoist, https://mobbin.com/screens/ff7aab78-3405-4ccc-9c31-3788709b94eb;
  Things, https://mobbin.com/screens/feadd020-045b-477e-b54f-d4c405995a58.

## Contracts

Created by unit 1 (data layer); units 3–6 only consume them.

**Schema (migration 2, appended):**
```sql
CREATE TABLE it_projects (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  repo_url TEXT NULL, tags TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog','active','paused','implemented')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
ALTER TABLE todos ADD COLUMN project_id INTEGER NULL REFERENCES it_projects (id) ON DELETE SET NULL;
```
`resetDb()` also deletes `settings` and `it_projects` (after `todos`).

**Types (`src/lib/types.ts`):**
```ts
export type ProjectStatus = 'backlog' | 'active' | 'paused' | 'implemented';
export interface Project { id: Id; name: string; description: string; repoUrl: string | null; tags: string[];
  notes: string; status: ProjectStatus; createdAt: string; updatedAt: string }
export interface ProjectSummary extends Omit<Project, 'notes'> { openTodos: number }
export interface ProjectRef { id: Id; name: string; status: ProjectStatus }
export interface ProjectInput { name: string; description?: string; repoUrl?: string; tags?: string } // tags = raw comma text
export interface ProjectTodos { open: Todo[]; planned: Todo[]; done: Todo[] }
// Todo gains projectId: Id | null; NewTodo and TodoPatch gain projectId?: Id | null
```

**Server (`src/lib/server/projects.ts`):**
```ts
listProjects(db): ProjectSummary[]            // updated_at DESC, id DESC
listProjectRefs(db): ProjectRef[]
getProject(db, id): Project | null
createProject(db, input: ProjectInput): Result<Project>        // 'required'@name, 'invalid'@repoUrl
updateProject(db, id, input: ProjectInput): Result<Project>    // + 'not-found'
setProjectNotes(db, id, notes: string): Result<Project>
setProjectStatus(db, id, status: ProjectStatus): Result<Project> // 'invalid'@status
deleteProject(db, id): Result<{ unlinked: number }>
projectLinkCounts(db, id): { linked: number; open: number }    // open = linked and not done
projectTodos(db, id): ProjectTodos
countActiveProjects(db): number
countProjectLinks(db): number
getItAspectId(db): Id | null
setItAspectId(db, aspectId: Id): Result<{ unlinked: number }>  // 'not-found'@aspectId
```
`todos.ts`: `createTodo` / `updateTodo` accept `projectId` (rules above, error `not-found`@`projectId`).

**Client-safe (`src/lib/projects.ts`):** `PROJECT_STATUSES` (lifecycle order Backlog, Active, Paused,
Implemented), `OVERVIEW_GROUPS = ['active', 'backlog', 'paused']`, `STATUS_LABELS`, `PROJECT_MESSAGES`
(error code → English copy), `parseTags(text): string[]`.

**Icons (`src/lib/components/ui/icons.ts`):** `folder` (Projects nav + badge glyph) and `git-branch`
(repo glyph) added to `UiIcon` / `UI_ICONS`.

**Layout data (`+layout.server.ts`):** returns `{ aspects, nav, projects: ProjectRef[], itAspectId: Id | null }`;
`NavCount` gains `'projects'` and `nav.counts.projects = countActiveProjects(db)`. The `NAV_ITEMS` entry is
added by unit 3.

**Routes and form fields:**
- `/todos` actions `create`/`update`: field `projectId` (empty → `null`).
- `/projects` (unit 3): load `{ projects: ProjectSummary[], itAspectId, linkCount }`; actions `create`
  (`name`, `description`, `repoUrl`, `tags`) and `setItAspect` (`aspectId`).
- `/projects/[id]` (unit 4): load `{ project, notesHtml, todos: ProjectTodos, counts, today, sprintDays }`;
  actions `update` (`name`, `description`, `repoUrl`, `tags`), `notes` (`notes`), `status` (`status`),
  `delete` (redirect 303 to `/projects`). Unknown id → `error(404)`.

**Test seam (`__test/seed`):** `SeedInput` gains `itAspect?: number` (index into `aspects`),
`projects?: { name; description?; repoUrl?; tags?: string[]; notes?; status?; updatedAt? }[]`, and per todo
`project?: number` (index into `projects`) and `completedAt?: string`; `SeedResult` gains `projects: Id[]`.

**Test ids (shared by e2e across units):** `project-group-<status>` (section), `project-card`,
`project-meta` (rail or row), `status-pill`, `project-todos-open|planned|done`, `project-badge`,
`project-field` (the Project select in QuickAdd/TodoFields), `it-aspect-prompt`.

## Risks / Trade-offs

- [R1 Markdown needs a dependency] → one small parser (`marked`), raw HTML escaped by renderer override, unit-tested with script/img payloads.
- [R2 two todo read models drift] → both select `project_id AS projectId`; a unit test asserts it on each path.
- [R3 nav spec and e2e say "five lists"] → navigation delta + test updates (units 3 and 6).
- [R4 SQLite ALTER limits] → `ADD COLUMN … NULL REFERENCES … ON DELETE SET NULL` is allowed; no table rebuild.
- [R5 aspects are user-created] → `settings.it_aspect_id`, prompted on first run.
- [Layout data grows on every request] → one extra small query (`listProjectRefs`); single user, negligible.
- [Seeded e2e count assertions break when the sidebar grows] → scope counts to container test ids (repo learning).

## Migration Plan

Migration 2 runs on the next start after deploy (`openDb` → `migrate`, one transaction). It only adds;
rollback of the code is safe because v1 code ignores the extra column and tables, but the database stays
at `user_version` 2 (no down-migration). Take the usual SQLite file backup before the deploy.

## Open Questions

None blocking. Planning-sprint (draft) todos are neither Open nor Planned per S13; see the planner's
`additions` for Gate 1.
