## Why

Rue has no place for their studies. Semesters, classes and their assignments live as loose todos under the
Uni aspect, with no tie to a class, no class notes, no exam date or grade, and no overview of what is due next.

## What Changes

- New data: migration 4 adds `semesters` and `classes`, and on `todos` / `recurring_rules` a `class_id`
  (FK, `ON DELETE CASCADE`) and a `type` (LEC / EXC / OTH), plus `todos.revised_at`; a `uni_aspect_id`
  setting. Additive only; existing rows are untouched. (S1)
- New `/uni` overview: active semesters as sections of class cards (newest first), archived semesters in a
  collapsed "Archived (n)" group, grade averages and earned ECTS, a deadline overview, and the one-time
  Uni aspect prompt, changeable later. (S2–S6, S8, S14, S16)
- Semester lifecycle: create, rename, archive (sets open class todos done after a warning, then read-only),
  unarchive, delete (removes classes, their todos and rules after a confirm naming counts). (S4–S6)
- Classes with colour, icon, notes (Markdown), lecturer, room, ECTS, links, exam date/time + room and grade;
  a detail page `/uni/classes/[id]` with metadata rail, notes, the class's todos (Open / Planned / Done)
  with a hand-set "last revised" date, and its recurring rules. (S7, S9, S10, S12)
- Uni-aspect todos and recurring rules can link to a class with a type; the link follows the aspect on the
  server; linked todos show a class badge in every `TodoRow`; generated instances inherit class and type. (S11, S13, S15)
- Navigation grows from six to seven lists: "Uni" after Projects, counting open class todos in active
  semesters. (S17)
- Design gate: a static mockup of `/uni` and class detail at 1600 px and 375 px with Mobbin references in
  `design/brief.md`, approved by Rue before any Uni feature UI. Motion unchanged. (S18)

## Capabilities

### New Capabilities
- `uni-hub`: semesters, classes, their lifecycle (archive / read-only / delete cascade), overview with
  grades and deadlines, class detail with notes, todos, revised dates and rules, the Uni aspect setting.

### Modified Capabilities
- `todos`: optional class + type on Uni-aspect todos (create/edit), server-side reset on aspect change,
  read-only class todos of archived semesters, class badge on todo rows.
- `recurring`: optional class + type on Uni-aspect rules, inherited by generated instances; archived
  classes generate nothing.
- `navigation`: seven lists instead of six, the Uni count, the new screens in the responsive / wide-layout
  requirements (overview with deadline rail, class detail with metadata rail).
- `design-direction`: the Uni mockup and its Mobbin references, approved before Uni feature UI.

## Non-Goals

- Exams as a list or as todos — one exam date + room per class (Rue).
- Semester start/end/lecture-period dates and "current semester" auto-detection (Rue didn't pick it).
- Weekly timetable / calendar view (Rue didn't pick it).
- Grade predictions, target grades, other grading scales.
- Making the class mandatory on every Uni-aspect todo — general uni todos without a class stay possible.
- Automatic revision reminders / spaced repetition from `revised_at`.
- File attachments, ICS/Moodle import.
- A shared generic module with IT-Projects — built separately, components reused where they fit.
- Dark theme, extra motion.

## Done criteria

- [ ] Rue can create a semester, add classes with colour/icon/metadata/exam/grade, write notes, and see cards with exam countdown and grade.
- [ ] A todo added on class detail shows the class badge in Today/Sprint/Backlog and moves through Open/Planned/Done on the class.
- [ ] "Revised today" sets the date; a Uni recurring rule with a class generates linked instances at sprint start.
- [ ] The deadline overview lists upcoming todos and exams; grade averages match a hand calculation.
- [ ] Archiving warns, sets open todos done and collapses the semester read-only; deleting a semester removes everything.
- [ ] `npm run proof:full` is green, incl. navigation/layout e2e at 375–1600 px.

## Appetite

3–4 sessions, one change.

## Impact

- `src/lib/server/schema.ts` (migration 4), `db.ts` (`resetDb`), new `src/lib/server/uni.ts`, `todos.ts`,
  `sprints.ts` (`selectTodos`), `aspects.ts`, `recurring.ts`, `src/lib/types.ts`, new `src/lib/uni.ts`.
- New routes `src/routes/uni/`, `src/routes/uni/classes/[id]/`; `+layout.server.ts` (nav count, class refs,
  Uni aspect id); `todos/+page.server.ts`, `recurring/+page.server.ts` (class/type, read-only guard).
- Components: `Sidebar`, `HomeList`, `TodoRow`, `QuickAdd`, `TodoFields`, `TodoEditor`, `RuleForm`,
  `AspectForm` (picker extracted), `ProjectNotes` / `LinkedTodos` (generalised), new `src/lib/components/uni/*`.
- Test routes `__test/seed`, `__test/reset`; e2e `navigation`, `layout`, `responsive`, `motion` plus new Uni tests.
- `design/brief.md`, new `design/uni-mockup.html` and screenshots. No new dependency.
