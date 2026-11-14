# Graph Report - gate-1-decisions  (2026-11-14)

## Corpus Check
- 257 files · ~212,659 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 1840 nodes · 3645 edges · 118 communities (100 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d88b04ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- todos.ts
- server/aspects.test.ts
- ref_lib
- aspect-style.ts
- Proton Sync Change and Runtime Specs
- sprints.ts
- Uni Server Service
- server/uni.test.ts
- Sprint Lifecycle Service
- Todo Editor and Backlog Rail
- reconciler.test.ts
- icons.ts
- QuickAdd.svelte
- Todo Fields and Date Formatting
- Todos Service
- Shared Domain Types
- recurring/+page.svelte
- steps
- Quick Add Form
- Proton E2E Tests
- Aspect Styling and Page Header
- Todo Row and Badges
- SQLite Database and Proton Tests
- CI Gate Workflow
- Proton Sync Worker
- Proton Sync Journey Tests
- Recurring Rules and Sprint Start
- Fake Proton CLI
- proton-sync Specification
- Semester Sections and Archive
- aspect-page.test.ts
- desired.ts
- Desired State and Calendar Month
- Planning Placement Rule
- Proton Types, Hash and Packaging
- Recurring Rule Form
- BoardView.svelte
- @playwright/test
- cli.test.ts
- vitest
- format.ts
- 5. Routes
- lib/uni.ts
- package.json
- TodoFields.svelte
- aspects/+page.svelte
- Aspect Detail Page
- uni-sprint-todos.test.ts
- Button.svelte
- slot.ts
- Uni Paging Helpers
- @sveltejs/kit
- Test Hooks and Server Routes
- classes/[id]/+page.svelte
- uni-hub Specification
- Drag and Drop Module
- StatusPill.svelte
- Week and Date Math
- Gate-1 decisions (16 decisions by Rue, with type)
- Time Slot Helpers
- Aspects Page
- Sprint Page
- Uni Sprint Todos E2E
- scripts
- Dev Dependencies
- todos Specification
- calendar/+page.svelte
- Class Detail Page
- Layout and Motion
- project-detail.test.ts
- seed
- Proton CLI Runner and Hooks
- Todos Spec and Aspect Links
- Design Direction Spec
- setDay
- Today Page
- Release Bump Job
- desired.test.ts
- projects/+page.svelte
- markdown.ts
- journey.test.ts
- ClassForm.svelte
- Todos Form Actions
- steps
- +layout.svelte
- Calendar Page
- Project Detail Page
- Project Detail E2E
- Sprint Rail E2E
- Sprint Views E2E
- Dependabot Config
- lib/projects.ts
- classes/[id]/+page.server.ts
- Aspect
- e2e/aspects.test.ts
- plan/+page.svelte
- Projects Overview Page
- Sprint Review Page
- Journey E2E
- Responsive E2E
- Workflow Permissions
- review/+page.svelte
- aspects/+page.server.ts
- projects/[id]/+page.server.ts
- plan/+page.server.ts
- sync/+page.server.ts
- proton/+server.ts
- ViewSwitch.svelte
- uni/+page.svelte
- app.d.ts
- Todo Planning E2E
- row-actions.test.ts
- todo-classes.test.ts
- backlog/+page.svelte
- welcome/page.server.test.ts
- welcome/+page.server.ts

## God Nodes (most connected - your core abstractions)
1. `seed()` - 48 edges
2. `reset()` - 43 edges
3. `test` - 41 edges
4. `setClock()` - 38 edges
5. `svelte` - 37 edges
6. `UI_ICONS` - 30 edges
7. `vitest` - 29 edges
8. `@playwright/test` - 26 edges
9. `now()` - 25 edges
10. `with` - 22 edges

## Surprising Connections (you probably didn't know these)
- `/uni/classes/[id]` --references--> `today()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/clock.ts
- `Offline / runtime facts` --references--> `ok()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/proton/sync.test.ts
- `3.3 Calendar items and Proton sync items` --references--> `calendarMonth()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/calendar.ts
- `/recurring` --references--> `create()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/aspects.test.ts
- ``/todos`` --references--> `create()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/aspects.test.ts

## Import Cycles
- 2-file cycle: `src/lib/server/recurring.ts -> src/lib/server/uni.ts -> src/lib/server/recurring.ts`
- 2-file cycle: `src/lib/server/sprints.ts -> src/lib/server/uni.ts -> src/lib/server/sprints.ts`
- 2-file cycle: `src/lib/server/recurring.ts -> src/lib/server/sprints.ts -> src/lib/server/recurring.ts`
- 3-file cycle: `src/lib/server/recurring.ts -> src/lib/server/sprints.ts -> src/lib/server/uni.ts -> src/lib/server/recurring.ts`
- 3-file cycle: `src/lib/server/sprints.ts -> src/lib/server/todos.ts -> src/lib/server/uni.ts -> src/lib/server/sprints.ts`
- 3-file cycle: `src/lib/server/recurring.ts -> src/lib/server/uni.ts -> src/lib/server/sprints.ts -> src/lib/server/recurring.ts`
- 3-file cycle: `src/lib/server/projects.ts -> src/lib/server/sprints.ts -> src/lib/server/todos.ts -> src/lib/server/projects.ts`
- 4-file cycle: `src/lib/server/recurring.ts -> src/lib/server/sprints.ts -> src/lib/server/todos.ts -> src/lib/server/uni.ts -> src/lib/server/recurring.ts`

## Hyperedges (group relationships)
- **Human Taste Gates Before UI** — openspec_specs_design_direction_spec_approval_before_feature_ui, openspec_specs_design_direction_spec_projects_mockup, openspec_specs_design_direction_spec_uni_mockup, openspec_specs_design_direction_spec_cohesive_look_mockup [EXTRACTED 1.00]
- **OpenSpec change lifecycle (explore, propose, apply, sync, archive)** — _claude_skills_openspec_explore_skill_openspec_explore, _claude_skills_openspec_propose_skill_openspec_propose, _claude_skills_openspec_apply_change_skill_openspec_apply_change, _claude_skills_openspec_sync_specs_skill_openspec_sync_specs, _claude_skills_openspec_archive_change_skill_openspec_archive_change [EXTRACTED 1.00]
- **Proton Sync Reconciliation Flow** — openspec_specs_proton_sync_spec_diff_reconciliation, openspec_specs_proton_sync_spec_pass_scheduling, openspec_specs_proton_sync_spec_cli_call_discipline, openspec_specs_proton_sync_spec_sync_state_storage, openspec_specs_proton_sync_spec_one_calendar_per_aspect [EXTRACTED 1.00]
- **Aspect-Bound Link Settings (IT project / Uni class)** — openspec_specs_it_projects_spec_it_aspect_setting, openspec_specs_uni_hub_spec_uni_aspect_setting, openspec_specs_todos_spec_project_link_follows_aspect, openspec_specs_todos_spec_class_link_follows_aspect [INFERRED 0.85]

## Communities (118 total, 18 thin omitted)

### Community 0 - "todos.ts"
Cohesion: 0.07
Nodes (52): Edits Follow the Todo, Slot Data Model (Migration 5: start_time/end_time), inWeek(), Landing, landing(), sprintOf(), SprintRow, createProject() (+44 more)

### Community 1 - "server/aspects.test.ts"
Cohesion: 0.17
Nodes (21): Aspect Cards on Wide Screens, Create and Edit Aspects (unique name, fixed palette and icons), Delete Aspects (move todos and rules to target), First-Run Onboarding (aspect presets), aspects Specification, One Proton Calendar per Aspect, aspectUsage(), countAspects() (+13 more)

### Community 2 - "ref_lib"
Cohesion: 0.08
Nodes (20): describe(), failure, fieldError(), id, { oncancel, onsaved }, { classRef, type, href = true }, { grades, overall = false }, failure (+12 more)

### Community 3 - "aspect-style.ts"
Cohesion: 0.15
Nodes (19): ASPECT_COLORS, ASPECT_ICONS, AspectColor, AspectIcon, ASPECT_ERRORS, {
		name = '',
		color = 'sage',
		icon = 'star',
		error
	}, uid, { icon, color, size = 'md' } (+11 more)

### Community 4 - "Proton Sync Change and Runtime Specs"
Cohesion: 0.09
Nodes (25): OPSX: Apply command, OPSX: Archive command, OPSX: Explore command, OPSX: Propose command, OPSX: Sync command, openspec-apply-change skill, Workspace-planning guard (actionContext.mode), Dated archive move (changesDir/archive/YYYY-MM-DD-<name>) (+17 more)

### Community 5 - "sprints.ts"
Cohesion: 0.12
Nodes (37): `/todos`, Unplanned and Deleted Todos Lose Their Event, Aspect Progress in Group Headers, activeTodos(), carryInto(), addToActiveSprint(), aspectProgress(), blockedBy() (+29 more)

### Community 6 - "Uni Server Service"
Cohesion: 0.05
Nodes (32): 10. Graph notes, 11. Open questions for Rue, 1. Purpose and usage context, 2. Jobs to be done, 3.2 Aspects, recurring rules, IT projects, Uni, 3.3 Calendar items and Proton sync items, 3. Entities, 4.1 Weekly sprint lifecycle (+24 more)

### Community 7 - "server/uni.test.ts"
Cohesion: 0.10
Nodes (40): /uni, now(), setTestNow(), archiveSemester(), classCounts(), ClassRow, classRules(), classTodos() (+32 more)

### Community 8 - "Sprint Lifecycle Service"
Cohesion: 0.12
Nodes (15): addForm, adding, all, aspect, backForm, backlogList, { data }, moved (+7 more)

### Community 9 - "Todo Editor and Backlog Rail"
Cohesion: 0.11
Nodes (15): svelte, aspects, showDone, {
		todos,
		today,
		sprintDays,
		title = 'Linked todos',
		testidPrefix = 'project-todos',
		emptyText = 'No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field.',
		top,
		extra,
		readonly = false
	}, total, uid, {
		children,
		rail,
		railTitle,
		wide = false,
		overlay = false
	}, id (+7 more)

### Community 10 - "reconciler.test.ts"
Cohesion: 0.10
Nodes (35): PROTON_COLORS, specHash(), base, Abort, expectOk(), failedItems(), Failure, frozen() (+27 more)

### Community 11 - "icons.ts"
Cohesion: 0.11
Nodes (18): aspectColor(), { day, entries, due, aspects }, editing, entryColor(), {
		month,
		weeks,
		entries,
		due,
		selected,
		today,
		aspects,
		onselect
	}, tablet, WEEKDAYS, { project } (+10 more)

### Community 12 - "QuickAdd.svelte"
Cohesion: 0.07
Nodes (28): added(), aspectId, {
		aspects,
		target,
		defaultAspectId,
		defaultClassId,
		defaultType,
		defaultDueDate,
		variant = 'inline',
		sprintWeekStart = null,
		reviewRequired = false,
		compactLabel,
		open = $bindable(false)
	}, checklist, chosenAspectId, chosenClassId, chosenDueDate, chosenPlannedDay (+20 more)

### Community 13 - "Todo Fields and Date Formatting"
Cohesion: 0.16
Nodes (23): today(), createRunner(), readConfig(), runPass(), forgetHashes(), ProtonConfig, block(), configureWorker() (+15 more)

### Community 14 - "Todos Service"
Cohesion: 0.07
Nodes (28): AddToSprintError, AspectInput, AspectProgress, ChecklistItem, ClassInput, ClassLink, ClassSummary, ClassTodos (+20 more)

### Community 15 - "Shared Domain Types"
Cohesion: 0.13
Nodes (11): ASPECTS, reset(), setClock(), test, LISTS, IT, ASPECTS, SPRINT (+3 more)

### Community 16 - "recurring/+page.svelte"
Cohesion: 0.17
Nodes (9): { message, href, actionLabel }, RecurringRule, aspectById, classById, { data }, deleting, editing, formKey (+1 more)

### Community 17 - "steps"
Cohesion: 0.08
Nodes (25): name, runs-on, steps, runner, jobs, ci, name, on (+17 more)

### Community 18 - "Quick Add Form"
Cohesion: 0.08
Nodes (18): actionsEl, addError, aspects, checkable, checked, classRef, desktop, done (+10 more)

### Community 19 - "Proton E2E Tests"
Cohesion: 0.14
Nodes (17): /healthz, aspect(), classInput(), kinds(), klass(), ok(), ops(), pass() (+9 more)

### Community 20 - "Aspect Styling and Page Header"
Cohesion: 0.12
Nodes (20): fake(), FAKE_PROTON_CLI, FAKE_PROTON_DIR, protonOn(), ProtonOnOptions, protonPass(), protonStatus(), LISTS (+12 more)

### Community 21 - "Todo Row and Badges"
Cohesion: 0.10
Nodes (17): GLYPHS, dateFull, dateShort, {
		project,
		todos,
		mode,
		onedit
	}, repoLabel, editing, {
		html,
		notes,
		testid = 'project-notes',
		placeholder = 'No notes yet. Write down the plan, decisions or change requests.',
		editable = true
	}, uid (+9 more)

### Community 22 - "SQLite Database and Proton Tests"
Cohesion: 0.09
Nodes (18): expanded, {
		semesters,
		counts,
		today
	}, action, adding, archived, classError, confirm, expanded (+10 more)

### Community 23 - "CI Gate Workflow"
Cohesion: 0.09
Nodes (22): { todoId, day, sprintDays }, ActionError, planError(), submit(), aspectColor, aspectId, classId, confirming (+14 more)

### Community 24 - "Proton Sync Worker"
Cohesion: 0.20
Nodes (20): Calendar Entries, Calendar Layouts (dots / titles / rail), Due Marker and Due List, Month Calendar Page (/calendar), Opening Calendar Entries, Projected Recurring Occurrence, calendar Specification, Due Dates Become Bundled All-Day Events per Aspect and Day (+12 more)

### Community 25 - "Proton Sync Journey Tests"
Cohesion: 0.12
Nodes (14): hash, root, staging, { version }, CHILD_ENV, errorLine(), exec(), specFlags() (+6 more)

### Community 26 - "Recurring Rules and Sprint Start"
Cohesion: 0.12
Nodes (15): {
		todo,
		aspect,
		today,
		sprintDays,
		variant = 'card'
	}, typing, aspects, cards, { todos, sprintDays, today }, chips, chosen, columns (+7 more)

### Community 27 - "Fake Proton CLI"
Cohesion: 0.10
Nodes (21): with, context, file, github-token, images, labels, name, password (+13 more)

### Community 28 - "proton-sync Specification"
Cohesion: 0.06
Nodes (32): Environment Configuration, Harness Commands (proof, proof:full, package, dev), Health Check (GET /healthz), Node Version Declared (engines.node >=22.5 for node:sqlite), Persistence Across Restarts (SQLite file), Setup README Requirement, app-runtime Specification, CI Gate (ci.yml -> gate.yml) (+24 more)

### Community 29 - "Semester Sections and Archive"
Cohesion: 0.17
Nodes (19): ACCENTS, bad(), createFake(), injected(), load(), log(), perform(), run() (+11 more)

### Community 30 - "aspect-page.test.ts"
Cohesion: 0.16
Nodes (6): Harness, Learnings, Life-Manager, Specs, ASPECTS, RUNNING

### Community 31 - "desired.ts"
Cohesion: 0.25
Nodes (15): archivedRuleIds(), byTime(), calendarMonth(), DueTodo, projectionStart(), Row, classRooms(), DAY_CODES (+7 more)

### Community 32 - "Desired State and Calendar Month"
Cohesion: 0.11
Nodes (18): uses, with, concurrency, cancel-in-progress, group, jobs, ci, security-baseline (+10 more)

### Community 33 - "Planning Placement Rule"
Cohesion: 0.12
Nodes (17): Aspect Page (/aspects/<id>), Wide Desktop Layout with Context Rail, Backlog Rail on the Sprint Tab, Board View, By-Aspect View, Compact Week Cards, Manage Sheet on Phone, Quiet Status and Day Controls in Rows (+9 more)

### Community 34 - "Proton Types, Hash and Packaging"
Cohesion: 0.17
Nodes (21): Exams Become Events in the Uni Calendar, Recurring Rules Become Weekly Series, Recurring Rules per Class (Uni), recurring Specification, Uni Aspect Setting, classFor(), columns(), createRule() (+13 more)

### Community 35 - "Recurring Rule Form"
Cohesion: 0.11
Nodes (17): aspectId, {
		aspects,
		rule = null,
		oncancel,
		onsaved,
		ondelete
	}, checklist, CLASS_MESSAGES, classes, classId, classShown, endTime (+9 more)

### Community 36 - "BoardView.svelte"
Cohesion: 0.14
Nodes (12): arrive(), ghost(), leave(), moved, moveForm, PLACEHOLDERS, rendered(), STATUSES (+4 more)

### Community 37 - "@playwright/test"
Cohesion: 0.12
Nodes (10): navigateAndSwitchView(), transitions(), HEALTH, ASPECTS, expectStarted(), row(), db, fakeProtonDir (+2 more)

### Community 38 - "cli.test.ts"
Cohesion: 0.19
Nodes (12): Migrations on Start, Uni Data Model (Migration 4: semesters, classes), getDb(), migrate(), openDb(), resetDb(), calendar(), FAKE (+4 more)

### Community 39 - "vitest"
Cohesion: 0.20
Nodes (6): @sveltejs/adapter-node@^6.0.0, vitest@^5.1.0, @sveltejs/adapter-node, vitest, AspectFilter, parseAspectFilter()

### Community 40 - "format.ts"
Cohesion: 0.19
Nodes (15): dateLabel(), dayLabel(), dayMonth, daysFrom(), dueLabel(), utc(), weekdayShort, weekLabel() (+7 more)

### Community 41 - "5. Routes"
Cohesion: 0.11
Nodes (20): 5. Routes, /aspects, /aspects/[id], /calendar, /menu, /projects, /projects/[id], `/sprint` (+12 more)

### Community 42 - "lib/uni.ts"
Cohesion: 0.19
Nodes (12): Sprint List Paging (6 per page), ClassType, Grade, clampPage(), CLASS_TYPES, daysFrom(), examCountdown(), PAGE_SIZE (+4 more)

### Community 43 - "package.json"
Cohesion: 0.11
Nodes (22): devDependencies, @fontsource-variable/bricolage-grotesque@^5.3.0, @playwright/test@^1.64.1, svelte@^5.57.3, svelte-check@^4.7.8, @sveltejs/kit@^3.1.0, @sveltejs/vite-plugin-svelte@^7.3.1, @types/node@^26.6.6 (+14 more)

### Community 44 - "TodoFields.svelte"
Cohesion: 0.12
Nodes (12): aspect, {
		aspects,
		aspectId = $bindable(),
		priority = $bindable(),
		dueDate = $bindable(),
		projectId = $bindable(''),
		classId = $bindable(''),
		type = $bindable('OTH'),
		planned = false,
		plannedDay = $bindable(''),
		startTime = $bindable(''),
		endTime = $bindable(''),
		linkedId = null,
		clearProject = false,
		clearClass = false,
		children
	}, backwards, classes, classShown, cls, length, LENGTHS (+4 more)

### Community 45 - "aspects/+page.svelte"
Cohesion: 0.13
Nodes (7): { data }, deleting, editing, error, menuEl, menuFor, Row

### Community 46 - "Aspect Detail Page"
Cohesion: 0.13
Nodes (11): backlog, { data }, daysLeft, doing, failure, moves, placements, progress (+3 more)

### Community 47 - "uni-sprint-todos.test.ts"
Cohesion: 0.15
Nodes (7): ASPECTS, PROJECTS, contrast(), luminance(), Rgb, seedClassTodos(), UNI

### Community 48 - "Button.svelte"
Cohesion: 0.14
Nodes (12): {
		aspects,
		current = null,
		linkCount,
		oncancel,
		onsaved
	}, confirming, dropsLinks, name, selected, {
		variant = 'secondary',
		children,
		...rest
	}, {
		open,
		title,
		message,
		confirmLabel,
		onconfirm,
		oncancel,
		children
	}, {
		aspects,
		current = null,
		linkCount,
		oncancel,
		onsaved
	} (+4 more)

### Community 49 - "slot.ts"
Cohesion: 0.33
Nodes (12): Time Slot Rules, endAfter(), lengthLabel(), nextHour(), plannedLabel(), shiftEnd(), SlotError, slotLabel() (+4 more)

### Community 50 - "Uni Paging Helpers"
Cohesion: 0.14
Nodes (13): $app/tsconfig, compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, resolveJsonModule, skipLibCheck (+5 more)

### Community 52 - "Test Hooks and Server Routes"
Cohesion: 0.19
Nodes (10): nav, adding, aspectHref, nav, NAV_ITEMS, NavCount, NavData, syncNeedsAttention() (+2 more)

### Community 53 - "classes/[id]/+page.svelte"
Cohesion: 0.15
Nodes (11): archived, cls, { data }, deleteForm, deleteMessage, deleting, edit, editing (+3 more)

### Community 54 - "uni-hub Specification"
Cohesion: 0.17
Nodes (12): Add Todos on the Class, Archive a Semester (read-only), Class Card (exam countdown, grade), Create and Edit a Class, Delete a Class, Delete a Semester, Grade Averages (ECTS-weighted), Last Revised Date (+4 more)

### Community 56 - "StatusPill.svelte"
Cohesion: 0.17
Nodes (10): confirming, desktop, form, menuOpen, pick(), save(), { status, openCount }, target (+2 more)

### Community 57 - "Week and Date Math"
Cohesion: 0.15
Nodes (7): canDrag, DragFrom, draggableTodo(), DragPayload, dropZone(), DropZoneOptions, TODO_MIME

### Community 58 - "Gate-1 decisions (16 decisions by Rue, with type)"
Cohesion: 0.13
Nodes (15): `/backlog`, gate-1-decisions design: reorder via position column (no migration), preset skip, parseAspectFilter, WIDE_QUERY redirect, OpenSpec change gate-1-decisions: proposal, gate-1-decisions tasks (20 tasks, 7 groups), Decision 11: plain-http 403 is a README deployment requirement, no in-app warning, Decision 15: accessible three-state status on every todo presentation, data-status dropped, Decision 1: project statuses stay five (incl. in_progress), Decision 4: /backlog?aspect non-numeric shows empty filtered list (+7 more)

### Community 59 - "Time Slot Helpers"
Cohesion: 0.15
Nodes (11): { data }, daysLeft, groups, inSprint, longDate, onSprintDay, openToday, sprintAspects (+3 more)

### Community 60 - "Aspects Page"
Cohesion: 0.17
Nodes (12): name, needs, secrets, uses, with, bump, app_id, app_private_key (+4 more)

### Community 61 - "Sprint Page"
Cohesion: 0.21
Nodes (12): C24 (design reference, not on Mobbin), Cohesive Look Mockup (design/cohesive-mockup.html), Design Brief (design/brief.md), Design Tokens and Style Tile, Mobbin, One List Anatomy, Projects Mockup (design/projects-mockup.html), Proton (design reference) (+4 more)

### Community 62 - "Uni Sprint Todos E2E"
Cohesion: 0.17
Nodes (12): Project Status Pill (backlog/active/paused/implemented), Approved Visual Result, New Todo from the Sidebar, Projects Count in Navigation, Proton Sync Link with Warning Marker, Responsive Layout and Navigation (sidebar / phone home list), navigation Specification, Touch Alternatives to Drag (+4 more)

### Community 63 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, check:watch, dev, package, prepare, preview (+4 more)

### Community 64 - "Dev Dependencies"
Cohesion: 0.26
Nodes (8): actions, classType(), num(), optionalDate(), optionalId(), optionalText(), target(), text()

### Community 65 - "todos Specification"
Cohesion: 0.11
Nodes (21): Backlog View (aspect groups, Planned section), backlog Specification, Create a Project, Delete a Project, IT Aspect Setting, Linked Todos on the Project (Open/Planned/Done), IT Project Data Model (Migration 2), Project Detail Page (+13 more)

### Community 66 - "calendar/+page.svelte"
Cohesion: 0.18
Nodes (8): { data }, due, entries, month, monthLabel, picked, selected, tablet

### Community 67 - "Class Detail Page"
Cohesion: 0.18
Nodes (8): { data }, deleteForm, deleting, editing, error, project, uid, wide

### Community 68 - "Layout and Motion"
Cohesion: 0.20
Nodes (10): 6. Cross-cutting behavior, Confirmations, Date handling, Drag and drop, Error pages, Navigation between routes, Offline / runtime facts, Persistence (+2 more)

### Community 69 - "project-detail.test.ts"
Cohesion: 0.20
Nodes (5): ASPECTS, LINKED, OPEN_TODOS, PROJECT, seedProject()

### Community 70 - "seed"
Cohesion: 0.09
Nodes (11): seed(), seedSunday(), ASPECTS, CLASSES, PROJECTS, seedSunday(), SEMESTERS, TODOS (+3 more)

### Community 71 - "Proton CLI Runner and Hooks"
Cohesion: 0.27
Nodes (7): ASPECTS, day(), expectDocked(), expectStatusInEveryView(), row(), settled(), weekdays()

### Community 72 - "Todos Spec and Aspect Links"
Cohesion: 0.20
Nodes (9): dependency-name, update-types, interval, updates, directory, ignore, package-ecosystem, schedule (+1 more)

### Community 73 - "Design Direction Spec"
Cohesion: 0.20
Nodes (9): jobs, publish, name, on, push, name, needs, runs-on (+1 more)

### Community 74 - "setDay"
Cohesion: 0.16
Nodes (14): Recurring Instances, Due-This-Week Suggestions, Mid-Sprint Changes, Missed Planned Days Join Next Sprint Unscheduled, Planned Todos Join Their Week's Sprint, Sprint Planning, sprint-lifecycle Specification, Sprint Phase (running / review-available / review-required / planning / none) (+6 more)

### Community 75 - "Today Page"
Cohesion: 0.15
Nodes (9): {
		backlog,
		aspects,
		progress = {},
		canAdd,
		addAction,
		addLabel = 'Add to sprint',
		onadd,
		onreturn,
		testid = 'backlog-rail'
	}, collapsed, failure, groups, matches, query, today, {
		backlog,
		aspects,
		progress,
		onadd
	} (+1 more)

### Community 76 - "Release Bump Job"
Cohesion: 0.31
Nodes (7): CalendarEntry, insert(), rule(), semester(), sprint(), todo(), uniClass()

### Community 77 - "desired.test.ts"
Cohesion: 0.31
Nodes (6): insert(), rule(), semester(), sprint(), todo(), uniClass()

### Community 78 - "projects/+page.svelte"
Cohesion: 0.20
Nodes (9): active, adding, changing, { data }, groups, implemented, itAspect, prompting (+1 more)

### Community 79 - "markdown.ts"
Cohesion: 0.21
Nodes (10): Markdown rendering, dependencies, marked@^18.1.1, marked, decodeEntities(), escapeHtml(), marked, NAMED (+2 more)

### Community 80 - "journey.test.ts"
Cohesion: 0.32
Nodes (4): expectAspectPage(), quickAdd(), row(), seedManaged()

### Community 81 - "ClassForm.svelte"
Cohesion: 0.16
Nodes (13): { cls, error }, color, errorId(), examAt, examDate, examTime, icon, links (+5 more)

### Community 82 - "Todos Form Actions"
Cohesion: 0.25
Nodes (9): permissions, permissions, permissions, actions, attestations, contents, id-token, packages (+1 more)

### Community 83 - "steps"
Cohesion: 0.33
Nodes (9): steps, GH_TOKEN, steps, env, id, name, run, uses (+1 more)

### Community 84 - "+layout.svelte"
Cohesion: 0.24
Nodes (7): flipOpts(), MOVE_MS, NAV_MS, RAIL_MS, reducedMotion(), [send, receive], { children }

### Community 85 - "Calendar Page"
Cohesion: 0.29
Nodes (4): ASPECTS, editor(), HEALTH, openEditor()

### Community 86 - "Project Detail Page"
Cohesion: 0.25
Nodes (7): context, rules, design, proposal, specs, tasks, schema

### Community 87 - "Project Detail E2E"
Cohesion: 0.29
Nodes (7): {
		aspect,
		usage,
		targets,
		onclose
	}, error, ERRORS, form, message, moved, plural()

### Community 89 - "Sprint Views E2E"
Cohesion: 0.29
Nodes (4): ASPECTS, CLASS, CLASS_TODOS, seedClass()

### Community 90 - "Dependabot Config"
Cohesion: 0.33
Nodes (7): Project Screens Keep Existing Motion, Moves Travel to Their New Place (FLIP/crossfade 200 ms), Navigation Cross-Fades (View Transitions API), prefers-reduced-motion, motion Specification, Add to the Sprint from the Rail, Uni Screens Keep Existing Motion

### Community 91 - "lib/projects.ts"
Cohesion: 0.29
Nodes (5): OVERVIEW_GROUPS, PROJECT_MESSAGES, PROJECT_STATUSES, STATUS_LABELS, ProjectStatus

### Community 92 - "classes/[id]/+page.server.ts"
Cohesion: 0.33
Nodes (3): 3.1 Todo, Sprint, Aspect, Backlog, Review decisions, actions, status()

### Community 93 - "Aspect"
Cohesion: 0.50
Nodes (5): /recurring, Shared todo behavior (appears on Today, Sprint, Backlog, Plan, Review), Aspect, Priority, Project

### Community 94 - "e2e/aspects.test.ts"
Cohesion: 0.43
Nodes (5): aspectRow(), expectStyle(), openDelete(), openEdit(), PRESET_ASPECTS

### Community 95 - "plan/+page.svelte"
Cohesion: 0.20
Nodes (7): count, { data, form }, drop, ERRORS, marked, startLabel, unmarked

### Community 97 - "Sprint Review Page"
Cohesion: 0.60
Nodes (3): editor(), openTodo(), row()

### Community 98 - "Journey E2E"
Cohesion: 0.40
Nodes (5): name, outputs, runs-on, check-tag, ci-run-id

### Community 101 - "review/+page.svelte"
Cohesion: 0.22
Nodes (6): closeLabel, { data, form }, decisionOf(), decisions, LABELS, VERBS

### Community 108 - "uni/+page.svelte"
Cohesion: 0.25
Nodes (6): adding, changing, { data }, prompting, uniAspect, wide

### Community 113 - "row-actions.test.ts"
Cohesion: 0.50
Nodes (4): ASPECTS, openActions(), RECURRING, row()

### Community 115 - "backlog/+page.svelte"
Cohesion: 0.40
Nodes (4): adding, { data }, groups, planned

### Community 117 - "welcome/+page.server.ts"
Cohesion: 0.67
Nodes (3): actions, load(), takenNames()

## Knowledge Gaps
- **57 isolated node(s):** `$app/tsconfig`, `backlog Specification`, `Aspect Cards on Wide Screens`, `First-Run Onboarding (aspect presets)`, `SvelteKit App HTML Shell` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 916 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `svelte` connect `Todo Editor and Backlog Rail` to `aspect-style.ts`, `Sprint Lifecycle Service`, `icons.ts`, `QuickAdd.svelte`, `Quick Add Form`, `Todo Row and Badges`, `SQLite Database and Proton Tests`, `CI Gate Workflow`, `Recurring Rules and Sprint Start`, `BoardView.svelte`, `package.json`, `TodoFields.svelte`, `aspects/+page.svelte`, `Button.svelte`, `classes/[id]/+page.svelte`, `StatusPill.svelte`, `Week and Date Math`, `calendar/+page.svelte`, `Class Detail Page`, `Today Page`, `+layout.svelte`, `plan/+page.svelte`, `uni/+page.svelte`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `$app/tsconfig`, `backlog Specification`, `Aspect Cards on Wide Screens` to the rest of the system?**
  _57 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `todos.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06634615384615385 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `todos.ts`, `server/aspects.test.ts`, `ref_lib`, `sprints.ts`, `server/uni.test.ts`, `reconciler.test.ts`, `Todo Fields and Date Formatting`, `Proton E2E Tests`, `Proton Sync Worker`, `Proton Sync Journey Tests`, `Proton Types, Hash and Packaging`, `cli.test.ts`, `lib/uni.ts`, `package.json`, `slot.ts`, `Release Bump Job`, `desired.test.ts`, `markdown.ts`, `aspects/+page.server.ts`, `welcome/page.server.test.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `ref_lib` be split into smaller, more focused modules?**
  _Cohesion score 0.08048780487804878 - nodes in this community are weakly interconnected._
- **Why does `uni-hub Specification` connect `uni-hub Specification` to `todos Specification`, `Proton Types, Hash and Packaging`, `cli.test.ts`, `lib/uni.ts`, `Dependabot Config`, `Sprint Page`, `Uni Sprint Todos E2E`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Proton Sync Change and Runtime Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.08846153846153847 - nodes in this community are weakly interconnected._