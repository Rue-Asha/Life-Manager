# Scope: uni-hub

Triage: feature — new tables + migration 4, new module UI, todo/recurring/navigation deltas, >1 session. Appetite: 3–4 sessions, one change.

## Problem
Rue has no place for their studies. Semesters, classes and their assignments live as loose todos under the
Uni aspect, with no tie to a class, no class notes, no exam date or grade, and no overview of what is due next.

## Flows
- Start a semester: Uni → "New semester" → name → empty semester section appears among the active ones.
- Add a class: semester section → "New class" → name, colour, icon (+ optional metadata) → card appears in the semester.
- Work on a class: click card → class detail → edit notes (Markdown) / metadata / exam / grade, see its todos and recurring rules.
- Add a class todo: class detail → QuickAdd (aspect = Uni aspect, class preset, type chip, due, priority) →
  todo is linked; it is a normal backlog todo and flows through Sprint/Today like any other.
- Add from elsewhere: QuickAdd / todo edit with the Uni aspect selected → Class select + Type chip appear.
- Revise: class detail → todo → "Revised today" → last-revised date set to today.
- Recurring per class: /recurring → rule with the Uni aspect → Class + Type fields → generated instances inherit both.
- See what's due: Uni → deadline overview lists open dated class todos and exam dates across active semesters.
- Finish a semester: semester → Archive → (open todos) dialog with count → confirm → open todos set done,
  semester moves to collapsed "Archived (n)", becomes read-only.
- Remove a semester / class: delete → confirm dialog naming counts → everything belonging to it is gone.
- First run: Uni with no Uni aspect chosen → prompt to pick the aspect used for uni todos.

## Entity model (confirmed with Rue)
```
Semester ──< Class ──< Todo (aspect = Uni aspect, class_id, type, revised_at)
 name         name, colour, icon, notes, lecturer, room, ECTS, links,
 archived     exam date/time + exam room, grade
                       ──< Recurring rule (class_id, type) → generated todos inherit both
```

## In scope
- **S1** Data model: migration 4 (append-only in `src/lib/server/schema.ts`) adds `semesters` (id, name,
  archived_at NULL, created_at), `classes` (id, semester_id FK ON DELETE CASCADE, name, color, icon, notes,
  lecturer, room, ects, links JSON, exam_at, exam_room, grade, created_at, updated_at), on `todos`:
  `class_id NULL REFERENCES classes(id) ON DELETE CASCADE`, `type TEXT NULL CHECK (type IN ('LEC','EXC','OTH'))`,
  `revised_at TEXT NULL`; on `recurring_rules`: `class_id ... ON DELETE CASCADE`, `type` (same CHECK);
  a `uni_aspect_id` setting.
  - edges: existing DB with data → only adds, nothing rewritten; existing Uni-aspect todos stay unlinked;
    `resetDb()` deletes the new tables in FK-safe order.
- **S2** Uni aspect setting: chosen on `/uni` (prompt on first run, preselecting an aspect named "Uni" if one
  exists; changeable later). Changing it removes every class link (and type/revised) from todos and rules,
  after a confirm dialog naming the count.
  - edges: no aspects → prompt links to creating one; 0 links → no dialog; Uni aspect deleted → links
    cleared and setting unset (same as first run), like the IT aspect.
- **S3** `/uni` overview: active semesters as sections (newest first), each a grid of class cards; archived
  semesters in a collapsed group "Archived (n)" below, each archived semester collapsed inside it.
  - edges: no semesters → empty state with "New semester"; active semester without classes → inline empty
    state with "New class"; 375 px → one card per row; 1600 px → grid fills the content column, alignment per
    navigation spec.
- **S4** Semester CRUD: create (name required), rename, archive, unarchive, delete.
  - edges: empty/whitespace name → field error; duplicate names allowed.
- **S5** Archive: with open todos (not done) in its classes, a dialog names the count; confirming sets them
  done (completed now) and archives; cancelling changes nothing. Archived semesters and their classes are
  read-only: no add/edit of classes, notes, metadata, todos, revised; delete and unarchive stay possible.
  Unarchive lifts read-only; todos stay done.
  - edges: no open todos → no dialog; a class todo of an archived semester edited via `/todos` → rejected server-side.
- **S6** Delete a semester: confirm dialog naming the number of classes and todos; deleting removes the
  semester, its classes, all their todos (done ones included) and their recurring rules.
  - edges: empty semester → plain confirm.
- **S7** Class create/edit: name required; colour from the 8 aspect colours, icon from the aspect icon set
  (picker reused from AspectForm); optional lecturer, room, ECTS, links (label + URL), exam date/time, exam
  room, grade.
  - edges: empty name → field error; colour/icon not in the set → rejected server-side; ECTS not a number
    ≥ 0 (halves allowed) → field error; link URL not http(s) → field error, empty link rows dropped; grade
    not one of 1.0/1.3/1.7/2.0/2.3/2.7/3.0/3.3/3.7/4.0/5.0/"passed" → field error.
- **S8** Class card: icon tile in the class colour, name, lecturer (if set), number of open todos, next due
  date, exam countdown ("Exam in 12 d" / "Exam today"; past exams not shown), grade if set.
  - edges: no todos / no exam / no grade → those bits absent, card height stays consistent.
- **S9** Class detail `/uni/classes/[id]`: header with icon + name, metadata (lecturer, room, ECTS, links open
  in new tab, exam, grade) in the context rail at ≥ 1280, a wrapping row below; Markdown notes (reuse
  ProjectNotes/renderMarkdown, sanitized); class todos in Open / Planned / Done (Done collapsed); recurring
  rules of the class listed by name with a link to `/recurring`.
  - edges: unknown id → 404; no notes → placeholder; no todos → empty state; archived → no edit controls.
- **S10** Delete a class: confirm dialog naming the todo count; deletes the class, its todos and rules.
  - edges: none beyond S6 (same cascade).
- **S11** Class todos: QuickAdd on class detail creates a todo with the Uni aspect, the class preset and a
  Type chip (LEC/EXC/OTH, default OTH), plus due date and priority. QuickAdd and the todo edit form show
  Class select + Type chip only while the selected aspect is the Uni aspect; the select lists classes of
  active semesters. Type is stored only on class-linked todos.
  - edges: no Uni aspect / no classes → fields hidden; switching aspect away → class/type not submitted;
    a todo whose aspect changes away from Uni loses class, type and revised_at (server-side); unknown class
    id or class of an archived semester → field error.
- **S12** Last revised: each class todo on class detail has a "Revised today" action setting `revised_at`
  to today and shows "Revised <relative date>"; the date can also be cleared.
  - edges: never revised → "Not revised"; archived → read-only.
- **S13** Class badge: class-linked todos show a muted badge (class icon in its colour + name + type) in
  `TodoRow` wherever it renders; clicking opens the class.
  - edges: 375 px → wraps under the title; unlinked todos → no badge.
- **S14** Grades: per semester and overall, the ECTS-weighted average of graded classes and the earned
  ECTS, shown on `/uni` (semester section header and an overall line). "Passed" counts toward ECTS, not the
  average; 5.0 counts toward neither; classes without ECTS are excluded from the average.
  - edges: no grades → "—"; archived semesters count toward the overall figures.
- **S15** Recurring per class: RuleForm shows Class + Type while the aspect is the Uni aspect; generated
  instances inherit class_id and type. Rules whose class's semester is archived generate nothing.
  - edges: aspect changed away from Uni → class/type cleared; carried-over instances of an archived
    semester are already done (S5), so nothing is placed.
- **S16** Deadline overview on `/uni`: open class todos with a due date and future exam dates, across active
  semesters, ascending; overdue items flagged; each row shows class badge, title/"Exam", date. At ≥ 1280 in
  the context rail, below as a section above the semesters.
  - edges: nothing due → short empty line; undated todos excluded.
- **S17** Navigation: "Uni" entry after Projects, before the Aspects divider, in Sidebar and `/menu`; count =
  open class todos in active semesters. Navigation spec delta (six → seven lists) and the
  layout/responsive e2e checks include the new screens.
  - edges: count 0 → same as other zero counts.
- **S18** Design gate: before feature UI, a static mockup of `/uni` and class detail (1600 px and 375 px)
  with Mobbin references added to `design/brief.md`; Rue approves before UI units start. Motion as in the
  motion spec (route cross-fade only).
  - edges: none (a review step).

## Non-goals
- Exams as a list or as todos — one exam date + room per class (Rue).
- Semester start/end/lecture-period dates and "current semester" auto-detection (Rue didn't pick it).
- Weekly timetable / calendar view (Rue didn't pick it).
- Grade predictions, target grades, other grading scales.
- Making the class mandatory on every Uni-aspect todo — general uni todos without a class stay possible.
- Automatic revision reminders / spaced repetition from `revised_at`.
- File attachments, ICS/Moodle import.
- A shared generic module with IT-Projects — built separately, components reused where they fit.
- Dark theme, extra motion.

## Codebase touchpoints
- `src/lib/server/schema.ts` — migration 4 (explorer: data model).
- `src/lib/server/db.ts` — `resetDb()` deletes new tables (explorer: recurring).
- `src/lib/server/todos.ts` — `todoColumns`, create/update gain classId/type/revisedAt, `linkFor`-style guard, aspect-change reset (explorer: data model).
- `src/lib/server/sprints.ts` — `selectTodos()` maps the new fields (explorer: data model, IT-projects R2).
- `src/lib/server/projects.ts` — `getItAspectId`/`setItAspectId` as template for the Uni aspect setting (explorer: data model).
- `src/lib/server/aspects.ts` — aspect delete clears class links + uni setting (explorer: data model).
- `src/lib/server/recurring.ts`, `src/routes/recurring/+page.server.ts`, `components/recurring/RuleForm.svelte` — class/type on rules, archived filter in `generateInstances` (explorer: recurring).
- `src/lib/types.ts` — Todo, NewTodo, TodoPatch, RecurringRule, RuleInput, new Semester/Class types.
- `src/routes/todos/+page.server.ts` — create/update parse classId/type (explorer: recurring).
- `components/todo/QuickAdd.svelte` (needs `defaultClassId`/`defaultType`), `TodoFields.svelte`, `TodoRow.svelte` (explorer: UI, recurring).
- `components/aspects/AspectForm.svelte`, `src/lib/aspect-style.ts`, `ui/AspectIcon.svelte` — colour/icon picker + sets (explorer: UI).
- `components/projects/ProjectNotes.svelte`, `LinkedTodos.svelte`, `src/lib/markdown.ts` — reuse/generalise (explorer: UI).
- `components/shell/Sidebar.svelte`, `HomeList.svelte`, `ui/icons.ts`, `src/routes/+layout.server.ts` — nav + count (explorer: UI).
- `src/routes/__test/seed/+server.ts` — seed semesters/classes for e2e.
- `e2e/navigation.test.ts`, `layout.test.ts`, `responsive.test.ts` — seven entries, new screens (explorer: UI).
- `openspec/specs/navigation`, `todos`, `recurring` — deltas; new capability `uni-hub`.
- `design/brief.md` — Mobbin references.

## Risks
- R1 Two todo read models drift → accepted: both map the new fields; a unit test per path (as in it-projects).
- R2 CASCADE on `todos.class_id` deletes todos on class/semester delete → intended (Rue: "all gone"); confirm dialogs name counts.
- R3 Future CHECK changes need table rebuilds that null child FKs → accepted: `type` CHECK is final; note the migration-3 TEMP-table pattern in design.md.
- R4 Read-only enforced only in UI → resolved: server-side guard on every class/todo/rule write (S5).
- R5 Nav spec/e2e hard-code the list → resolved: S17 delta + tests.
- R6 Two picker instances on one page (ids/testids) → accepted: picker extracted with an id prefix.

## Decisions
- Uni todos are regular todos with the Uni aspect + class link, so they flow through Backlog/Sprint/Today (Rue, A).
- "Last revisioned" = when Rue last revised the material, set by hand (Rue).
- Archived = read-only + collapsed; archiving sets open todos done after a warning (Rue).
- Deleting a semester deletes classes, todos and everything associated (Rue).
- Extras in scope: class metadata, exam (single field on class), grades (German 1.0–5.0 + passed, ECTS-weighted), recurring per class, deadline overview (Rue).
- Appetite 3–4 sessions, one change (Rue).
- Defaults set by flow, open to veto at Gate 0: Type default OTH; class optional on Uni todos; unarchive allowed;
  5.0 excluded from average and ECTS; nav count = open class todos in active semesters; route `/uni/classes/[id]`;
  UI copy English; mockup gate before UI.

## Done when
- Rue can create a semester, add classes with colour/icon/metadata/exam/grade, write notes, and see cards with exam countdown and grade.
- A todo added on class detail shows the class badge in Today/Sprint/Backlog and moves through Open/Planned/Done on the class.
- "Revised today" sets the date; a Uni recurring rule with a class generates linked instances at sprint start.
- The deadline overview lists upcoming todos and exams; grade averages match a hand calculation.
- Archiving warns, sets open todos done and collapses the semester read-only; deleting a semester removes everything.
- `npm run proof:full` is green, incl. navigation/layout e2e at 375–1600 px.

## Split off
- none
