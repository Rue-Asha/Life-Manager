## Context

Life-Manager is a single-user SvelteKit app on SQLite (`node:sqlite`) with append-only migrations in
`src/lib/server/schema.ts` (now at `user_version` 3). Aspects are user-created, so "Uni" has no fixed id —
the IT-projects change solved the same problem with the `settings` table and `getItAspectId`, which this
change copies. Server modules return `Result<T>` and take the `DatabaseSync` first; there are two todo read
models (`todoColumns` in `todos.ts`, `selectTodos()` in `sprints.ts`). The shell (`Sidebar.svelte`
`NAV_ITEMS`, `HomeList.svelte`) and `+layout.server.ts` drive navigation, counts and the refs that
`TodoRow` / `QuickAdd` / `TodoFields` read from `page.data`. `RailLayout.svelte` gives the ≥1280 px rail.
Projects already brought `renderMarkdown` (sanitized), `ProjectNotes`, `LinkedTodos`, `ConfirmDialog`
patterns; `AspectForm` holds the colour/icon picker.

## Goals / Non-Goals

**Goals:** a Uni module embedded in the app (S1–S18): semesters and classes in their own tables, todos and
recurring rules optionally linked to a class with a type, overview with grades and deadlines, class detail
with notes / todos / revised dates / rules, archive as read-only with server-side enforcement, cascade
delete, a seventh nav entry, and a mockup gate before UI.

**Non-Goals:** (from scope.md, unchanged)
- Exams as a list or as todos — one exam date + room per class (Rue).
- Semester start/end/lecture-period dates and "current semester" auto-detection (Rue didn't pick it).
- Weekly timetable / calendar view (Rue didn't pick it).
- Grade predictions, target grades, other grading scales.
- Making the class mandatory on every Uni-aspect todo — general uni todos without a class stay possible.
- Automatic revision reminders / spaced repetition from `revised_at`.
- File attachments, ICS/Moodle import.
- A shared generic module with IT-Projects — built separately, components reused where they fit.
- Dark theme, extra motion.

## Decisions

From scope.md (Gate 0), carried as they are:
- Uni todos are regular todos with the Uni aspect + class link, so they flow through Backlog/Sprint/Today (Rue, A).
- "Last revisioned" = when Rue last revised the material, set by hand (Rue).
- Archived = read-only + collapsed; archiving sets open todos done after a warning (Rue).
- Deleting a semester deletes classes, todos and everything associated (Rue).
- Extras in scope: class metadata, exam (single field on class), grades (German 1.0–5.0 + passed, ECTS-weighted), recurring per class, deadline overview (Rue).
- Appetite 3–4 sessions, one change (Rue).
- Defaults set by flow, open to veto at Gate 0: Type default OTH; class optional on Uni todos; unarchive allowed;
  5.0 excluded from average and ECTS; nav count = open class todos in active semesters; route `/uni/classes/[id]`;
  UI copy English; mockup gate before UI.

Technical choices for this change:
- **`ON DELETE CASCADE` on `todos.class_id` and `recurring_rules.class_id`** (R2). Deleting a class or a
  semester is one `DELETE`; SQLite cascades semester → classes → todos → checklist items, and → rules. The
  confirm dialogs get their counts from `semesterCounts` / `classCounts` before the delete. Alternative
  (manual deletes in a transaction) buys nothing but code.
- **`type` CHECK is final** (R3). Changing a CHECK later means a table rebuild; dropping `todos` would
  cascade-delete checklist items and null/delete child FKs. If it is ever needed, follow migration 3's
  TEMP-table pattern (save child links, rebuild, restore). `ADD COLUMN … NULL REFERENCES … ON DELETE
  CASCADE` and `ADD COLUMN … CHECK` are both allowed without a rebuild.
- **Uni aspect setting** in `settings` under `uni_aspect_id`, read with a join against `aspects` so a deleted
  aspect reads as unset (same as `getItAspectId`). `setUniAspectId` clears `class_id`, `type`, `revised_at`
  on todos and `class_id`, `type` on rules; returns the number of cleared links (todos + rules).
- **Link follows the aspect, in SQL** (S11, S15). `updateTodo` clears class/type/revised whenever the
  resulting aspect is not the Uni aspect; `deleteAspect` does the same on moved todos and rules;
  `createTodo`/`updateTodo`/`createRule`/`updateRule` drop a posted class unless the resulting aspect is the
  Uni aspect, store `type` only with a class (default `OTH`), and validate the class (`not-found`,
  `archived` on `classId`).
- **Read-only is enforced on the server** (R4, S5). One helper `todoWritable(db, todoId): Result<void>` in
  `uni.ts` returns `archived` when the todo's class belongs to an archived semester. The `/todos` route calls
  it before every todo-id action that edits (update, checklist*, setStatus, toggleDone, setDay, addToSprint,
  removeFromSprint, moveToBacklog); `setRevisedAt` and all class/semester writes in `uni.ts` check
  `archived_at` themselves. Deleting a single todo stays allowed (scope only forbids add/edit) and so do
  semester/class delete and unarchive. Renaming an archived semester is refused (read-only semester).
- **Archive** = one transaction: `UPDATE todos SET status='done', completed_at=now WHERE class_id IN (…) AND
  status != 'done'`, then `archived_at = now`. The dialog is a UI step with the open count from the load; the
  action itself does not refuse.
- **Rules of archived classes** are skipped in `generateInstances` by filtering `listRules` through a join
  (`class_id IS NULL OR semester not archived`).
- **Class names reach `TodoRow` through layout data**, like project names: the layout returns
  `classes: ClassRef[]` (all classes incl. archived, for badges) and `uniAspectId`; the selects filter
  `!archived`. Both read models only add `class_id AS classId, type, revised_at AS revisedAt` (R1).
- **Values:** ECTS stored as `REAL` (≥ 0, multiple of 0.5); grade as `TEXT` from `GRADES`; links as a JSON
  array `[{label,url}]` (`'[]'`), a row with empty URL and label dropped, an empty label shown as the URL;
  `exam_at` as `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM` (from `<input type="datetime-local">` or date only),
  anything else `invalid`@`examAt`. Countdowns compare the date part with `today()` (Berlin clock).
- **Grades** computed server-side in `uni.ts` (`gradeSummary`), exact value returned; the UI formats with two
  decimals (`2.23`) and "—" for null.
- **Ordering:** semesters `created_at DESC, id DESC` (active and archived alike); classes `id ASC` (creation
  order); deadlines by date, todos before exams on the same date.
- **Picker extracted** from `AspectForm` into `ui/ColorIconPicker.svelte` taking `name`-attributes and using
  `$props.id()` for ids, so two pickers on one page don't collide (R6). `AspectForm` and `ClassForm` use it.
- **Reuse:** `ProjectNotes` gains `testid` / placeholder props (default unchanged) and is used for class notes;
  `LinkedTodos` gains `testidPrefix`, `emptyText` and a per-row `extra` snippet (for the revised control);
  project-detail e2e must stay green.
- **Detail and overview rails** use `RailLayout` with a `rail` snippet at ≥1280 px and render the same content
  in the column below 1280 px (MediaQuery), no overlay toggle — the project-detail pattern.

### Design references
None fixed at Gate 0. The mockup unit researches Mobbin (semester sections / collapsed archive group,
course card with countdown, deadline list, properties rail, badge) and cites the screens in `design/brief.md`.

## Contracts

Created by unit 1; later units only consume them. Stubs are not needed: unit 1 implements the functions
listed under "unit 1", unit 3 implements the rest of `uni.ts` (declared in unit 1 as stubs returning
`{ ok: false, error: 'not-implemented' }` / empty values so units 4 and 5 typecheck).

**Schema (migration 4, appended):**
```sql
CREATE TABLE semesters (id INTEGER PRIMARY KEY, name TEXT NOT NULL, archived_at TEXT NULL, created_at TEXT NOT NULL);
CREATE TABLE classes (
  id INTEGER PRIMARY KEY, semester_id INTEGER NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
  name TEXT NOT NULL, color TEXT NOT NULL, icon TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
  lecturer TEXT NULL, room TEXT NULL, ects REAL NULL, links TEXT NOT NULL DEFAULT '[]',
  exam_at TEXT NULL, exam_room TEXT NULL, grade TEXT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
ALTER TABLE todos ADD COLUMN class_id INTEGER NULL REFERENCES classes (id) ON DELETE CASCADE;
ALTER TABLE todos ADD COLUMN type TEXT NULL CHECK (type IN ('LEC', 'EXC', 'OTH'));
ALTER TABLE todos ADD COLUMN revised_at TEXT NULL;
ALTER TABLE recurring_rules ADD COLUMN class_id INTEGER NULL REFERENCES classes (id) ON DELETE CASCADE;
ALTER TABLE recurring_rules ADD COLUMN type TEXT NULL CHECK (type IN ('LEC', 'EXC', 'OTH'));
```
`resetDb()` order: `checklist_items, todos, recurring_rules, classes, semesters, settings, it_projects, sprints, aspects`.

**Types (`src/lib/types.ts`):**
```ts
export type ClassType = 'LEC' | 'EXC' | 'OTH';
export type Grade = '1.0'|'1.3'|'1.7'|'2.0'|'2.3'|'2.7'|'3.0'|'3.3'|'3.7'|'4.0'|'5.0'|'passed';
export interface ClassLink { label: string; url: string }
export interface Semester { id: Id; name: string; archivedAt: string | null; createdAt: string }
export interface UniClass { id: Id; semesterId: Id; name: string; color: AspectColor; icon: AspectIcon; notes: string;
  lecturer: string | null; room: string | null; ects: number | null; links: ClassLink[]; examAt: string | null;
  examRoom: string | null; grade: Grade | null; createdAt: string; updatedAt: string }
export interface ClassSummary extends Omit<UniClass, 'notes'> { openTodos: number; nextDue: IsoDate | null }
export interface ClassRef { id: Id; name: string; color: AspectColor; icon: AspectIcon; semesterId: Id; archived: boolean }
export interface ClassInput { name: string; color: string; icon: string; lecturer?: string; room?: string; ects?: string;
  links?: ClassLink[]; examAt?: string; examRoom?: string; grade?: string }   // raw form strings
export interface GradeSummary { average: number | null; earnedEcts: number }
export interface SemesterView extends Semester { classes: ClassSummary[]; grades: GradeSummary }
export interface Deadline { kind: 'todo' | 'exam'; date: IsoDate; title: string; classId: Id; todoId: Id | null; type: ClassType | null; overdue: boolean }
export interface ClassTodos { open: Todo[]; planned: Todo[]; done: Todo[] }
// Todo gains classId: Id | null; type: ClassType | null; revisedAt: IsoDate | null
// NewTodo, TodoPatch gain classId?: Id | null; type?: ClassType | null
// RecurringRule gains classId: Id | null; type: ClassType | null; RuleInput gains classId?, type?
```

**Server (`src/lib/server/uni.ts`):**
```ts
// unit 1
getUniAspectId(db): Id | null
setUniAspectId(db, aspectId: Id): Result<{ unlinked: number }>   // 'not-found'@aspectId
countClassLinks(db): number                                       // todos + rules with class_id
listClassRefs(db): ClassRef[]
countOpenClassTodos(db): number                                   // not done, class in active semester
classWritable(db, classId: Id): Result<void>                      // 'not-found' | 'archived' (field classId)
todoWritable(db, todoId: Id): Result<void>                        // 'archived' if the todo's class is archived
// unit 3
listSemesters(db): { active: SemesterView[]; archived: SemesterView[]; overall: GradeSummary }
createSemester(db, name: string): Result<Semester>               // 'required'@name
renameSemester(db, id, name: string): Result<Semester>           // + 'not-found', 'archived'
archiveSemester(db, id): Result<{ completed: number }>
unarchiveSemester(db, id): Result<Semester>
semesterCounts(db, id): { classes: number; todos: number; openTodos: number }
deleteSemester(db, id): Result<{ classes: number; todos: number }>
getClass(db, id): (UniClass & { semester: Semester }) | null
createClass(db, semesterId: Id, input: ClassInput): Result<UniClass>  // errors per spec, 'archived'@semesterId
updateClass(db, id, input: ClassInput): Result<UniClass>
setClassNotes(db, id, notes: string): Result<UniClass>
classCounts(db, id): { todos: number }
deleteClass(db, id): Result<{ todos: number }>
classTodos(db, id): ClassTodos
classRules(db, id): RecurringRule[]
gradeSummary(classes: Pick<UniClass, 'ects' | 'grade'>[]): GradeSummary
listDeadlines(db, today: IsoDate): Deadline[]
```
`todos.ts` (unit 1): `createTodo`/`updateTodo` accept `classId`/`type` (rules above);
`setRevisedAt(db, todoId, date: IsoDate | null): Result<Todo>` (`invalid` without class, `archived`).
`recurring.ts` (unit 1): `createRule`/`updateRule` accept `classId`/`type`; `generateInstances` copies them and skips archived classes.

**Client-safe (`src/lib/uni.ts`, unit 1):** `CLASS_TYPES: ClassType[]` (`['LEC','EXC','OTH']`),
`TYPE_LABELS`, `GRADES: Grade[]`, `UNI_MESSAGES` (error code → English copy, incl. `archived`),
`formatAverage(n: number | null): string` ("2.23" / "—"), `examCountdown(examAt, today): string | null`,
`revisedLabel(revisedAt, today): string` ("Not revised" / "Revised today" / "Revised 3 days ago").

**Icons (`ui/icons.ts`, unit 1):** `graduation-cap` (Uni nav entry).

**Layout data (`+layout.server.ts`, unit 1):** returns additionally `classes: ClassRef[]`, `uniAspectId: Id | null`;
`NavCount` gains `'uni'` and `nav.counts.uni = countOpenClassTodos(db)`. The `NAV_ITEMS` entry is added by unit 8.

**Routes and form fields:**
- `/todos` actions `create`/`update`: fields `classId` (empty → null), `type`; every todo-id write action
  runs `todoWritable` first and returns `fail(409, { error: 'archived' })`.
- `/recurring` actions `create`/`update`: fields `classId`, `type`.
- `/uni` (unit 6): load `{ uniAspectId, linkCount, active, archived, overall, deadlines, today }`; actions
  `setUniAspect` (`aspectId`), `createSemester` (`name`), `renameSemester` (`id`, `name`), `archive` (`id`),
  `unarchive` (`id`), `deleteSemester` (`id`), `createClass` (`semesterId` + class fields).
- `/uni/classes/[id]` (unit 7): load `{ cls, notesHtml, todos: ClassTodos, rules, counts, today, sprintDays }`;
  actions `update` (class fields), `notes` (`notes`), `revised` (`todoId`, `date` — empty clears), `delete`
  (redirect 303 to `/uni`). Unknown id → `error(404)`.
- Class form fields: `name`, `color`, `icon`, `lecturer`, `room`, `ects`, `linkLabel`/`linkUrl` (repeated,
  zipped in order), `examAt`, `examRoom`, `grade`.

**Components (props):**
- `ui/ColorIconPicker.svelte` (unit 5): `{ color: AspectColor; icon: AspectIcon }` bindable, emits inputs `name="color"` / `name="icon"`.
- `uni/ClassForm.svelte` (unit 5): `{ cls?: UniClass; error?: { error: string; field?: string } }` — fields only, the caller owns the `<form>`.
- `uni/ClassBadge.svelte` (unit 4): `{ classRef: ClassRef; type: ClassType | null; href?: boolean }`, test id `class-badge`.
- `todo/QuickAdd.svelte` (unit 4) gains `defaultAspectId?: Id`, `defaultClassId?: Id`, `defaultType?: ClassType`.

**Test seam (`__test/seed`, unit 1):** `SeedInput` gains `uniAspect?: number`, `semesters?: { name; archivedAt?;
createdAt? }[]`, `classes?: { semester: number; name; color?; icon?; notes?; lecturer?; room?; ects?; links?;
examAt?; examRoom?; grade? }[]`, per todo `class?: number`, `type?`, `revisedAt?`, per rule `class?: number`,
`type?`; `SeedResult` gains `semesters: Id[]`, `classes: Id[]`.

**Test ids (shared by e2e across units):** `semester-section`, `semester-archived-group`, `class-card`,
`class-grid`, `grade-summary` (section header) / `grade-overall`, `deadline-list`, `deadline-row`,
`class-meta` (rail or row), `class-notes`, `class-todos-open|planned|done`, `class-rules`, `revised`,
`class-badge`, `class-field`, `type-field`, `uni-aspect-prompt`.

## Risks / Trade-offs

- [R1 Two todo read models drift] → both map the new fields; a unit test per path (as in it-projects).
- [R2 CASCADE on `todos.class_id` deletes todos on class/semester delete] → intended (Rue: "all gone"); confirm dialogs name counts.
- [R3 Future CHECK changes need table rebuilds that null child FKs] → `type` CHECK is final; migration-3 TEMP-table pattern noted above.
- [R4 Read-only enforced only in UI] → server-side guard on every class/todo/rule write (S5), unit + e2e tested.
- [R5 Nav spec/e2e hard-code the list] → S17 delta + tests (unit 8).
- [R6 Two picker instances on one page] → picker extracted with `$props.id()` ids.
- [Layout data grows] → one more small query (`listClassRefs`); single user, negligible.
- [`/todos` guard misses an action] → the unit-1 task lists every action; e2e "Archived class todo edited via todos is rejected" plus unit tests on the helper.

## Migration Plan

Migration 4 runs on the next start after deploy (`openDb` → `migrate`, one transaction). It only adds;
v3 code ignores the extra tables and columns, but the database stays at `user_version` 4 (no down-migration).
Take the usual SQLite file backup before the deploy.

## Open Questions

None blocking. Single-todo delete on an archived class is allowed (scope names only add/edit); renaming an
archived semester is refused as part of read-only — both open to Rue's veto at Gate 1.
