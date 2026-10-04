verified-at: 36b35a5

## Layer 1 — proof-full

`npm run build` then `npm run proof:full`: green. Unit: 11 files, 147 tests passed. e2e: 255 passed. svelte-check: 0 errors, 0 warnings.

```
  ✓  233 e2e/uni.test.ts:85:1 › Scenario: Changing the Uni aspect without links needs no confirmation (300ms)
  ✓  234 e2e/uni.test.ts:103:1 › Scenario: Without aspects Uni leads to creating one (87ms)
  ✓  235 e2e/uni.test.ts:110:1 › Scenario: Semesters are listed newest first with archived ones collapsed (218ms)
  ✓  236 e2e/uni.test.ts:148:1 › Scenario: No semesters shows an empty state (118ms)
  ✓  237 e2e/uni.test.ts:156:1 › Scenario: Semester without classes offers New class (116ms)
  ✓  238 e2e/uni.test.ts:170:1 › Scenario: Phone shows one class card per row (114ms)
  ✓  239 e2e/uni.test.ts:195:1 › Scenario: Wide desktop class grid fills the content column (138ms)
  ✓  240 e2e/uni.test.ts:227:1 › Scenario: Card shows the class summary (131ms)
  ✓  241 e2e/uni.test.ts:270:1 › Scenario: Exam today and past exams (126ms)
  ✓  242 e2e/uni.test.ts:288:1 › Scenario: Sparse card keeps the row height (151ms)
  ✓  243 e2e/uni.test.ts:319:1 › Scenario: New semester appears among the active ones (244ms)
  ✓  244 e2e/uni.test.ts:337:1 › Scenario: Rename a semester (302ms)
  ✓  245 e2e/uni.test.ts:355:1 › Scenario: Add a class from the semester section (303ms)
  ✓  246 e2e/uni.test.ts:393:1 › Scenario: Field errors show on the class form (240ms)
  ✓  247 e2e/uni.test.ts:412:1 › Scenario: Archiving with open todos asks for confirmation (601ms)
  ✓  248 e2e/uni.test.ts:446:1 › Scenario: Cancelling the archive warning changes nothing (505ms)
  ✓  249 e2e/uni.test.ts:466:1 › Scenario: Archiving without open todos needs no confirmation (239ms)
  ✓  250 e2e/uni.test.ts:482:1 › Scenario: Deleting a semester asks for confirmation naming counts (851ms)
  ✓  251 e2e/uni.test.ts:514:1 › Scenario: Deleting an empty semester uses a plain confirm (492ms)
  ✓  252 e2e/uni.test.ts:530:1 › Scenario: Grades are shown on the overview (134ms)
  ✓  253 e2e/uni.test.ts:552:1 › Scenario: No grades shows a dash (127ms)
  ✓  254 e2e/uni.test.ts:565:1 › Scenario: Deadline overview sits in the rail at 1280 (193ms)
  ✓  255 e2e/uni.test.ts:603:1 › Scenario: Nothing due shows an empty line (129ms)

  255 passed (2.0m)
```

## Layer 2 — spec coverage

103 scenarios: 31 unit ✓, 69 e2e ✓, 3 manual, 0 gaps.

| Scenario | proof | Evidence |
|---|---|---|
| Brief cites Mobbin references for the Uni screens (design-direction) | manual (taste document, judged by Rue) | `design/brief.md` § 11 Uni (uni-hub S18) |
| Uni mockup shows overview and class detail at both widths (design-direction) | manual (visual judgement) | `design/uni-mockup.html`, `design/shots/uni-*.png` |
| Uni UI waits for the approved mockup (design-direction) | manual (human taste gate, recorded by the orchestrator) | commit b8a0947 "mockup approved by Rue (2.5)" precedes the first Uni UI commit (a5062cc, 5.1) |
| Desktop shows a sidebar (navigation) | e2e | `e2e/navigation.test.ts` › "Scenario: Desktop shows a sidebar" ✓ |
| Phone home list shows the seven lists (navigation) | e2e | `e2e/navigation.test.ts` › "Scenario: Phone home list shows the seven lists" ✓ |
| Phone home list drills into each list (navigation) | e2e | `e2e/responsive.test.ts` › "Scenario: Phone home list drills into each list" ✓ |
| Every screen fits 375 px without horizontal scroll (navigation) | e2e | `e2e/responsive.test.ts` › "Scenario: Every screen fits 375 px without horizontal scroll" ✓ |
| Sprint at 1280 shows a context rail (navigation) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Sprint at 1280 shows a context rail" ✓ |
| Today at 1280 shows sprint progress per aspect (navigation) | e2e | `e2e/today.test.ts` › "Scenario: Today at 1280 shows sprint progress per aspect" ✓ |
| Aspect page rail shows the aspect's details (navigation) | e2e | `e2e/aspect-page.test.ts` › "Scenario: Aspect page rail shows the aspect's details" ✓ |
| Screens without a rail centre their column (navigation) | e2e | `e2e/layout.test.ts` › "Scenario: Screens without a rail centre their column" ✓ |
| Screens with a rail centre their column (navigation) | e2e | `e2e/layout.test.ts` › "Scenario: Screens with a rail centre their column" ✓ |
| Rail becomes an overlay toggle below 1280 (navigation) | e2e | `e2e/sprint-rail.test.ts` › "Scenario: Rail becomes an overlay toggle below 1280" ✓ |
| No screen scrolls horizontally at any width (navigation) | e2e | `e2e/responsive.test.ts` › "Scenario: No screen scrolls horizontally at any width" ✓ |
| Uni entry counts open class todos in active semesters (navigation) | e2e | `e2e/navigation.test.ts` › "Scenario: Uni entry counts open class todos in active semesters" ✓ |
| Zero open class todos is shown like other zero counts (navigation) | e2e | `e2e/navigation.test.ts` › "Scenario: Zero open class todos is shown like other zero counts" ✓ |
| Rule with a class generates linked instances (recurring) | e2e | `e2e/recurring-classes.test.ts` › "Scenario: Rule with a class generates linked instances" ✓ |
| Generated instances inherit class and type (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Generated instances inherit class and type" ✓ |
| Rule class fields appear only for the Uni aspect (recurring) | e2e | `e2e/recurring-classes.test.ts` › "Scenario: Rule class fields appear only for the Uni aspect" ✓ |
| Rule leaving the Uni aspect loses its class (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule leaving the Uni aspect loses its class" ✓ |
| Rules of archived classes generate nothing (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rules of archived classes generate nothing" ✓ |
| Rule with an unknown or archived class is rejected (recurring) | unit | `src/lib/server/recurring.test.ts` › "Scenario: Rule with an unknown or archived class is rejected" ✓ |
| Editing a rule of an archived class keeps its class (recurring) | e2e | `e2e/recurring-classes.test.ts` › "Scenario: Editing a rule of an archived class keeps its class" ✓ |
| Quick add links a todo to a class (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Quick add links a todo to a class" ✓ |
| Class field appears only for the Uni aspect (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Class field appears only for the Uni aspect" ✓ |
| Class field lists classes of active semesters (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Class field lists classes of active semesters" ✓ |
| Class field is hidden without Uni aspect or classes (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Class field is hidden without Uni aspect or classes" ✓ |
| Switching the aspect away drops class and type (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Switching the aspect away drops class and type" ✓ |
| Aspect change removes class, type and revised date (todos) | unit | `src/lib/server/todos.test.ts` › "Scenario: Aspect change removes class, type and revised date" ✓ |
| Class link on a non-Uni todo is not stored (todos) | unit | `src/lib/server/todos.test.ts` › "Scenario: Class link on a non-Uni todo is not stored" ✓ |
| Type needs a class (todos) | unit | `src/lib/server/todos.test.ts` › "Scenario: Type needs a class" ✓ |
| Unknown or archived class id is rejected (todos) | unit | `src/lib/server/todos.test.ts` › "Scenario: Unknown or archived class id is rejected" ✓ |
| Linked todo shows the class badge (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Linked todo shows the class badge" ✓ |
| Todo without class shows no class badge (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Todo without class shows no class badge" ✓ |
| Class badge wraps under the title on a phone (todos) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Class badge wraps under the title on a phone" ✓ |
| Class detail rows show the type instead of the badge (todos) | e2e | `e2e/class-detail.test.ts` › "Scenario: Class detail rows show the type instead of the badge" ✓ |
| Migration 4 adds the Uni tables without touching existing data (uni-hub) | unit | `src/lib/server/db.test.ts` › "Scenario: Migration 4 adds the Uni tables without touching existing data" ✓ |
| Reset clears the Uni tables (uni-hub) | unit | `src/lib/server/db.test.ts` › "Scenario: Reset clears the Uni tables" ✓ |
| Both todo read models carry the class fields (uni-hub) | unit | `src/lib/server/todos.test.ts` › "Scenario: Both todo read models carry the class fields" ✓ |
| First run prompts for the Uni aspect (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: First run prompts for the Uni aspect" ✓ |
| Changing the Uni aspect removes links after confirmation (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Changing the Uni aspect removes links after confirmation" ✓ |
| Changing the Uni aspect clears class, type and revised date (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Changing the Uni aspect clears class, type and revised date" ✓ |
| Changing the Uni aspect without links needs no confirmation (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Changing the Uni aspect without links needs no confirmation" ✓ |
| Without aspects Uni leads to creating one (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Without aspects Uni leads to creating one" ✓ |
| Deleting the Uni aspect unsets the setting (uni-hub) | unit | `src/lib/server/aspects.test.ts` › "Scenario: Deleting the Uni aspect unsets the setting" ✓ |
| Semesters are listed newest first with archived ones collapsed (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Semesters are listed newest first with archived ones collapsed" ✓ |
| No semesters shows an empty state (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: No semesters shows an empty state" ✓ |
| Semester without classes offers New class (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Semester without classes offers New class" ✓ |
| Phone shows one class card per row (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Phone shows one class card per row" ✓ |
| Wide desktop class grid fills the content column (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Wide desktop class grid fills the content column" ✓ |
| New semester appears among the active ones (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: New semester appears among the active ones" ✓ |
| Rename a semester (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Rename a semester" ✓ |
| Empty semester name is rejected (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Empty semester name is rejected" ✓ |
| Duplicate semester names are allowed (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Duplicate semester names are allowed" ✓ |
| Archiving with open todos asks for confirmation (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Archiving with open todos asks for confirmation" ✓ |
| Cancelling the archive warning changes nothing (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Cancelling the archive warning changes nothing" ✓ |
| Archiving without open todos needs no confirmation (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Archiving without open todos needs no confirmation" ✓ |
| Archiving completes open todos (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Archiving completes open todos" ✓ |
| Archived semester refuses writes (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Archived semester refuses writes" ✓ |
| Archived class todo edited via todos is rejected (uni-hub) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Archived class todo edited via todos is rejected" ✓ |
| Deleting a single todo of an archived class is allowed (uni-hub) | e2e | `e2e/todo-classes.test.ts` › "Scenario: Deleting a single todo of an archived class is allowed" ✓ |
| Archived todos leave the backlog (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Archived todos leave the backlog" ✓ |
| Sprint planning refuses archived class todos (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Sprint planning refuses archived class todos" ✓ |
| Unarchive lifts read-only (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Unarchive lifts read-only" ✓ |
| Deleting a semester asks for confirmation naming counts (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Deleting a semester asks for confirmation naming counts" ✓ |
| Deleting a semester removes everything belonging to it (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Deleting a semester removes everything belonging to it" ✓ |
| Deleting an empty semester uses a plain confirm (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Deleting an empty semester uses a plain confirm" ✓ |
| Add a class from the semester section (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Add a class from the semester section" ✓ |
| Class fields round-trip (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Class fields round-trip" ✓ |
| Invalid class input is rejected (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Invalid class input is rejected" ✓ |
| Empty link rows are dropped (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Empty link rows are dropped" ✓ |
| Edit a class on its detail page (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Edit a class on its detail page" ✓ |
| Field errors show on the class form (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Field errors show on the class form" ✓ |
| Card shows the class summary (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Card shows the class summary" ✓ |
| Exam today and past exams (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Exam today and past exams" ✓ |
| Sparse card keeps the row height (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Sparse card keeps the row height" ✓ |
| Card summary counts open todos and the next due date (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Card summary counts open todos and the next due date" ✓ |
| Class metadata sits in the rail at 1280 (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Class metadata sits in the rail at 1280" ✓ |
| Class metadata wraps under the title below 1280 (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Class metadata wraps under the title below 1280" ✓ |
| Class notes are edited as Markdown and shown rendered (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Class notes are edited as Markdown and shown rendered" ✓ |
| Class without notes or todos shows placeholders (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Class without notes or todos shows placeholders" ✓ |
| Class todos are grouped Open, Planned, Done (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Class todos are grouped Open, Planned, Done" ✓ |
| Class Done group starts collapsed (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Class Done group starts collapsed" ✓ |
| Class rules are listed with a link to Recurring (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Class rules are listed with a link to Recurring" ✓ |
| Unknown class id shows 404 (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Unknown class id shows 404" ✓ |
| Archived class has no edit controls (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Archived class has no edit controls" ✓ |
| Deleting a class asks for confirmation naming the todo count (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Deleting a class asks for confirmation naming the todo count" ✓ |
| Deleting a class removes its todos and rules (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Deleting a class removes its todos and rules" ✓ |
| Quick add on class detail creates a linked todo (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Quick add on class detail creates a linked todo" ✓ |
| Type defaults to OTH (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Type defaults to OTH" ✓ |
| Revised today sets the date (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Revised today sets the date" ✓ |
| Revised date can be cleared (uni-hub) | e2e | `e2e/class-detail.test.ts` › "Scenario: Revised date can be cleared" ✓ |
| Revised date is stored only on class todos (uni-hub) | unit | `src/lib/server/todos.test.ts` › "Scenario: Revised date is stored only on class todos" ✓ |
| Weighted average matches a hand calculation (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Weighted average matches a hand calculation" ✓ |
| Overall figures include archived semesters (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Overall figures include archived semesters" ✓ |
| Grades are shown on the overview (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Grades are shown on the overview" ✓ |
| No grades shows a dash (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: No grades shows a dash" ✓ |
| Deadlines list todos and exams in date order (uni-hub) | unit | `src/lib/server/uni.test.ts` › "Scenario: Deadlines list todos and exams in date order" ✓ |
| Deadline overview sits in the rail at 1280 (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Deadline overview sits in the rail at 1280" ✓ |
| Nothing due shows an empty line (uni-hub) | e2e | `e2e/uni.test.ts` › "Scenario: Nothing due shows an empty line" ✓ |
| Opening a class uses only the route cross-fade (uni-hub) | e2e | `e2e/motion.test.ts` › "Scenario: Opening a class uses only the route cross-fade" ✓ |
| Class card opens the class detail (uni-hub) | e2e | `e2e/uni-journey.test.ts` › "Scenario: Class card opens the class detail" ✓ |
| Class todo moves through the class's groups (uni-hub) | e2e | `e2e/uni-journey.test.ts` › "Scenario: Class todo moves through the class's groups" ✓ |

## Manual (Gate 2)

- [ ] Open `design/brief.md` § 11 Uni: every decision cites a Mobbin URL and adds no motion beyond the route cross-fade.
- [ ] Open `design/uni-mockup.html` and `design/shots/uni-*.png`: overview and class detail at 1600 px and 375 px, tokens only.
- [ ] Confirm the mockup approval (commit b8a0947) was yours and came before the Uni UI units (first: a5062cc).
- [ ] `npm run dev` → http://localhost:5173/uni: compare the overview and one class detail with the mockup at desktop and phone width (or `shots/uni-*.png`, `shots/class-detail-*.png`).

## Diffstat

 121 files changed, 8916 insertions(+), 236 deletions(-)

## Screenshots

- `shots/aspect-page-375.png`
- `shots/aspect-page-1280.png`
- `shots/aspects-375.png`
- `shots/aspects-1280.png`
- `shots/backlog-375.png`
- `shots/backlog-1280.png`
- `shots/class-detail-375.png`
- `shots/class-detail-1280.png`
- `shots/journey-backlog-1280.png`
- `shots/journey-manage-aspect-375.png`
- `shots/journey-manage-aspect-1280.png`
- `shots/journey-manage-week-1280.png`
- `shots/journey-next-week-1280.png`
- `shots/journey-plan-1280.png`
- `shots/journey-recurring-1280.png`
- `shots/journey-review-1280.png`
- `shots/journey-sprint-aspect-1280.png`
- `shots/journey-sprint-board-1280.png`
- `shots/journey-sprint-week-1280.png`
- `shots/journey-today-1280.png`
- `shots/journey-welcome-1280.png`
- `shots/plan-375.png`
- `shots/plan-1280.png`
- `shots/project-detail-375.png`
- `shots/project-detail-1280.png`
- `shots/projects-375.png`
- `shots/projects-1280.png`
- `shots/recurring-375.png`
- `shots/recurring-1280.png`
- `shots/review-375.png`
- `shots/review-1280.png`
- `shots/sprint-aspect-375.png`
- `shots/sprint-aspect-1280.png`
- `shots/sprint-board-375.png`
- `shots/sprint-board-1280.png`
- `shots/sprint-manage-375.png`
- `shots/sprint-overlay-rail-1100.png`
- `shots/sprint-week-375.png`
- `shots/sprint-week-1280.png`
- `shots/today-375.png`
- `shots/today-1280.png`
- `shots/uni-375.png`
- `shots/uni-1280.png`
- `shots/welcome-375.png`
- `shots/welcome-1280.png`

## Review

Three fresh-context review rounds (diff `main...flow/uni-hub`). No weakened tests in any round; every edit to an existing test is backed by the spec (seven nav lists, migration-4 columns, rule read model, the "Uni" link collision in journey.test.ts).

Round 1 → fixer 2e5062e
- [spec/weak] Class form showed one field error per save → `validate()` collects all errors (`fields`), ClassForm shows each; e2e checks both errors from a single save. Fixed.
- [spec] Archived class page offered row controls that always 409 → TodoRow `readonly` (no editor, status, day, sprint actions); e2e extended. Fixed.
- [spec] `/todos?/delete` has no archived guard → kept by design (Gate 1: deleting a single todo of an archived class stays allowed); spec made explicit + scenario "Deleting a single todo of an archived class is allowed". Spec clarified.
- [correctness] Editing a rule of an archived class silently unlinked it → RuleForm keeps the current archived class as an option, `updateRule` accepts the unchanged class; scenario "Editing a rule of an archived class keeps its class". Fixed.
- [orchestrator] ECTS "7,5" rejected though the input is text/decimal → comma accepted as decimal separator. Fixed.

Round 2 → fixer 8997fc3
- [weak] ECTS assertion matched the exam time "10:00" → asserts the ECTS `<dd>`; proven by mutation. Fixed.
- [weak] Motion test never expanded the archived semester → expands it and targets the archived card exactly; proven by mutation. Fixed.
- [spec] Class-detail rows show type + revised instead of the badge → behaviour kept (approved mockup); todos delta reworded + scenario "Class detail rows show the type instead of the badge". Spec clarified.

Round 3 → fixer 36b35a5
- [correctness] Archived semester left done todos in the backlog; `/sprint/plan` pull/unpull could reopen them → backlog/counts/suggestions exclude done todos; pull/unpull/start refuse archived class todos (plan actions report `fail(400, {error:'archived'})` like the page's other errors); scenarios "Archived todos leave the backlog", "Sprint planning refuses archived class todos". Fixed.
- [weak] Quick-add test found the backlog row page-wide → scoped to the Uni aspect group; proven by mutation. Fixed.

Round-3 fixes were verified (Layers 1–2, verified-at 36b35a5) but not re-reviewed: the 3-round limit was reached.
