# Graph Report - Life-Manager  (2026-11-12)

## Corpus Check
- 11 files · ~210,463 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1815 nodes · 3595 edges · 113 communities (94 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Svelte Component Imports
- Community 2
- Community 3
- Proton Sync Change and Runtime Specs
- Community 5
- Uni Server Service
- Community 7
- Sprint Lifecycle Service
- Todo Editor and Backlog Rail
- Community 10
- Community 11
- Community 12
- Todo Fields and Date Formatting
- Todos Service
- Shared Domain Types
- E2E Seed and Clock Helpers
- Community 17
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
- Community 28
- Semester Sections and Archive
- Release Workflow Image Steps
- Community 31
- Desired State and Calendar Month
- Planning Placement Rule
- Proton Types, Hash and Packaging
- Recurring Rule Form
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Aspect Detail Page
- Community 47
- Community 48
- Community 49
- Uni Paging Helpers
- Community 51
- Test Hooks and Server Routes
- Community 53
- Community 54
- Drag and Drop Module
- Community 56
- Week and Date Math
- Community 58
- Time Slot Helpers
- Aspects Page
- Sprint Page
- Uni Sprint Todos E2E
- Community 63
- Dev Dependencies
- TypeScript Config
- Community 66
- Class Detail Page
- Layout and Motion
- Community 69
- Community 70
- Proton CLI Runner and Hooks
- Todos Spec and Aspect Links
- Design Direction Spec
- Project Status Pill
- Today Page
- Release Bump Job
- Community 77
- Community 78
- Community 79
- Community 80
- NPM Scripts
- Todos Form Actions
- Community 83
- Desired State Tests
- Calendar Page
- Project Detail Page
- Project Detail E2E
- Sprint Rail E2E
- Sprint Views E2E
- Dependabot Config
- Community 91
- Community 92
- Community 93
- Community 94
- Runtime Dependencies
- Projects Overview Page
- Sprint Review Page
- Journey E2E
- Responsive E2E
- Workflow Permissions
- Release Workflow Steps
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Todo Planning E2E

## God Nodes (most connected - your core abstractions)
1. `seed()` - 47 edges
2. `reset()` - 41 edges
3. `test` - 40 edges
4. `setClock()` - 37 edges
5. `svelte` - 36 edges
6. `UI_ICONS` - 30 edges
7. `@playwright/test` - 26 edges
8. `now()` - 25 edges
9. `vitest` - 25 edges
10. `with` - 22 edges

## Surprising Connections (you probably didn't know these)
- `/healthz` --references--> `ok()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/proton/sync.test.ts
- `Offline / runtime facts` --references--> `ok()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/proton/sync.test.ts
- `/uni/classes/[id]` --references--> `today()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/clock.ts
- `3.3 Calendar items and Proton sync items` --references--> `calendarMonth()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/calendar.ts
- `/uni` --references--> `Grade`  [INFERRED]
  docs/functional-contract.md → src/lib/types.ts

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

## Communities (113 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (55): Backlog View (aspect groups, Planned section), backlog Specification, Planned Label on Todo Rows, Slot Data Model (Migration 5: start_time/end_time), setTestNow(), inWeek(), Landing, landing() (+47 more)

### Community 1 - "Svelte Component Imports"
Cohesion: 0.05
Nodes (54): 5. Routes, /aspects, /aspects/[id], `/backlog`, /calendar, /healthz, /menu, /projects (+46 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (32): describe(), failure, fieldError(), id, { oncancel, onsaved }, { todoId, day, sprintDays }, { classRef, type, href = true }, { grades, overall = false } (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (33): ASPECT_COLORS, ASPECT_ICONS, AspectColor, AspectIcon, PRESET_ASPECTS, ASPECT_ERRORS, {
		name = '',
		color = 'sage',
		icon = 'star',
		error
	}, uid (+25 more)

### Community 4 - "Proton Sync Change and Runtime Specs"
Cohesion: 0.09
Nodes (25): OPSX: Apply command, OPSX: Archive command, OPSX: Explore command, OPSX: Propose command, OPSX: Sync command, openspec-apply-change skill, Workspace-planning guard (actionContext.mode), Dated archive move (changesDir/archive/YYYY-MM-DD-<name>) (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (34): `/todos`, Unplanned and Deleted Todos Lose Their Event, Planned Todos Join Their Week's Sprint, addToActiveSprint(), aspectProgress(), blockedBy(), closeReview(), DECISIONS (+26 more)

### Community 6 - "Uni Server Service"
Cohesion: 0.06
Nodes (31): 10. Graph notes, 11. Open questions for Rue, 1. Purpose and usage context, 2. Jobs to be done, 3.2 Aspects, recurring rules, IT projects, Uni, 3.3 Calendar items and Proton sync items, 3. Entities, 4.1 Weekly sprint lifecycle (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (32): /uni, classCounts(), ClassRow, ClassValues, countClassLinks(), countOpenClassTodos(), createClass(), createSemester() (+24 more)

### Community 8 - "Sprint Lifecycle Service"
Cohesion: 0.06
Nodes (27): flipOpts(), MOVE_MS, NAV_MS, RAIL_MS, reducedMotion(), [send, receive], addForm, adding (+19 more)

### Community 9 - "Todo Editor and Backlog Rail"
Cohesion: 0.08
Nodes (21): svelte, aspects, showDone, {
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
	}, id (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (27): PROTON_COLORS, specHash(), Abort, expectOk(), failedItems(), Failure, frozen(), pendingCount() (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (21): aspectColor(), { day, entries, due, aspects }, editing, entryColor(), {
		month,
		weeks,
		entries,
		due,
		selected,
		today,
		aspects,
		onselect
	}, tablet, WEEKDAYS, {
		aspects,
		current = null,
		linkCount,
		oncancel,
		onsaved
	} (+13 more)

### Community 12 - "Community 12"
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
Cohesion: 0.14
Nodes (25): today(), readConfig(), runPass(), forgetHashes(), PassOutcome, ProtonConfig, Runner, block() (+17 more)

### Community 14 - "Todos Service"
Cohesion: 0.07
Nodes (28): AddToSprintError, AspectInput, AspectProgress, ChecklistItem, ClassInput, ClassLink, ClassSummary, ClassTodos (+20 more)

### Community 15 - "Shared Domain Types"
Cohesion: 0.16
Nodes (12): ASPECTS, seed(), setClock(), test, waitForHydration(), LISTS, IT, ASPECTS (+4 more)

### Community 16 - "E2E Seed and Clock Helpers"
Cohesion: 0.08
Nodes (20): {
		backlog,
		aspects,
		progress,
		onadd
	}, open, {
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
	}, { message, href, actionLabel }, {
		open,
		title,
		onclose,
		children
	}, titleId, {
		aspects,
		current = null,
		linkCount,
		oncancel,
		onsaved
	} (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (25): name, runs-on, steps, runner, jobs, ci, name, on (+17 more)

### Community 18 - "Quick Add Form"
Cohesion: 0.08
Nodes (18): actionsEl, addError, aspects, checkable, checked, classRef, desktop, done (+10 more)

### Community 19 - "Proton E2E Tests"
Cohesion: 0.15
Nodes (17): aspect(), classInput(), kinds(), klass(), ok(), ops(), pass(), plan() (+9 more)

### Community 20 - "Aspect Styling and Page Header"
Cohesion: 0.14
Nodes (17): fake(), FAKE_PROTON_CLI, FAKE_PROTON_DIR, protonOn(), ProtonOnOptions, protonPass(), protonStatus(), LISTS (+9 more)

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
Nodes (20): ActionError, planError(), aspectColor, aspectId, classId, confirming, deleteForm, desktop (+12 more)

### Community 24 - "Proton Sync Worker"
Cohesion: 0.20
Nodes (20): Calendar Entries, Calendar Layouts (dots / titles / rail), Due Marker and Due List, Month Calendar Page (/calendar), Opening Calendar Entries, Projected Recurring Occurrence, calendar Specification, Due Dates Become Bundled All-Day Events per Aspect and Day (+12 more)

### Community 25 - "Proton Sync Journey Tests"
Cohesion: 0.12
Nodes (14): hash, root, staging, { version }, FAKE, FLAGS, series, base (+6 more)

### Community 26 - "Recurring Rules and Sprint Start"
Cohesion: 0.12
Nodes (16): viewportTop(), {
		todo,
		aspect,
		today,
		sprintDays,
		variant = 'card'
	}, typing, aspects, cards, { todos, sprintDays, today }, chips, chosen (+8 more)

### Community 27 - "Fake Proton CLI"
Cohesion: 0.10
Nodes (21): with, context, file, github-token, images, labels, name, password (+13 more)

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (17): Environment Configuration, Harness Commands (proof, proof:full, package, dev), Health Check (GET /healthz), Node Version Declared (engines.node >=22.5 for node:sqlite), Persistence Across Restarts (SQLite file), Setup README Requirement, app-runtime Specification, CI Gate (ci.yml -> gate.yml) (+9 more)

### Community 29 - "Semester Sections and Archive"
Cohesion: 0.17
Nodes (19): ACCENTS, bad(), createFake(), injected(), load(), log(), perform(), run() (+11 more)

### Community 30 - "Release Workflow Image Steps"
Cohesion: 0.11
Nodes (10): ASPECTS, RUNNING, ASPECTS, openActions(), RECURRING, row(), ASPECTS, UNI (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (18): archivedRuleIds(), byTime(), calendarMonth(), DueTodo, projectionStart(), Row, classRooms(), DAY_CODES (+10 more)

### Community 32 - "Desired State and Calendar Month"
Cohesion: 0.11
Nodes (18): uses, with, concurrency, cancel-in-progress, group, jobs, ci, security-baseline (+10 more)

### Community 33 - "Planning Placement Rule"
Cohesion: 0.12
Nodes (19): Aspect Page (/aspects/<id>), Wide Desktop Layout with Context Rail, Aspect Progress in Group Headers, Backlog Rail on the Sprint Tab, Board View, By-Aspect View, Compact Week Cards, Manage Sheet on Phone (+11 more)

### Community 34 - "Proton Types, Hash and Packaging"
Cohesion: 0.23
Nodes (18): Recurring Rules Become Weekly Series, now(), classFor(), columns(), createRule(), deleteRule(), generateInstances(), getRule() (+10 more)

### Community 35 - "Recurring Rule Form"
Cohesion: 0.11
Nodes (17): aspectId, {
		aspects,
		rule = null,
		oncancel,
		onsaved,
		ondelete
	}, checklist, CLASS_MESSAGES, classes, classId, classShown, endTime (+9 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (12): arrive(), ghost(), leave(), moved, moveForm, PLACEHOLDERS, rendered(), STATUSES (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.13
Nodes (8): seedSunday(), navigateAndSwitchView(), transitions(), HEALTH, ASPECTS, expectStarted(), row(), @playwright/test

### Community 38 - "Community 38"
Cohesion: 0.24
Nodes (9): Migrations on Start, Uni Data Model (Migration 4: semesters, classes), getDb(), migrate(), openDb(), resetDb(), CFG, DONE (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (13): dependencies, marked@^18.1.1, @sveltejs/adapter-node@^6.0.0, vitest@^5.0.4, engines, node, name, private (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.19
Nodes (15): dateLabel(), dayLabel(), dayMonth, daysFrom(), dueLabel(), utc(), weekdayShort, weekLabel() (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.16
Nodes (16): IT Aspect Setting, Exams Become Events in the Uni Calendar, Recurring Instances, Recurring Rules per Class (Uni), recurring Specification, Mid-Sprint Changes, Week-by-Day View, Class Link Follows the Aspect (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (13): Sprint List Paging (6 per page), ClassType, Grade, IsoDate, clampPage(), CLASS_TYPES, daysFrom(), examCountdown() (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (16): devDependencies, @fontsource-variable/bricolage-grotesque@^5.3.0, @playwright/test@^1.64.1, svelte@^5.57.2, svelte-check@^4.7.6, @sveltejs/kit@^3.1.0, @sveltejs/vite-plugin-svelte@^7.3.1, @types/node@^26.6.5 (+8 more)

### Community 44 - "Community 44"
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

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (7): { data }, deleting, editing, error, menuEl, menuFor, Row

### Community 46 - "Aspect Detail Page"
Cohesion: 0.13
Nodes (11): backlog, { data }, daysLeft, doing, failure, moves, placements, progress (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (7): ASPECTS, PROJECTS, contrast(), luminance(), Rgb, seedClassTodos(), UNI

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (13): Diff Reconciliation, Done Todos Keep Event with Check Mark, Due Bundles Follow Their Todos, Edits Follow the Todo, Event Content Hash, Fake Proton CLI (scripts/fake-proton.mjs), First-Run Backfill, Pass Scheduling (30 s debounce, 5 min tick, Sync now) (+5 more)

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (12): Time Slot Rules, endAfter(), lengthLabel(), nextHour(), plannedLabel(), shiftEnd(), SlotError, slotLabel() (+4 more)

### Community 50 - "Uni Paging Helpers"
Cohesion: 0.14
Nodes (13): $app/tsconfig, compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, resolveJsonModule, skipLibCheck (+5 more)

### Community 52 - "Test Hooks and Server Routes"
Cohesion: 0.19
Nodes (9): nav, adding, aspectHref, nav, NAV_ITEMS, NavCount, NavData, syncNeedsAttention() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (11): archived, cls, { data }, deleteForm, deleteMessage, deleting, edit, editing (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.15
Nodes (13): Add Todos on the Class, Archive a Semester (read-only), Class Card (exam countdown, grade), Create and Edit a Class, Delete a Class, Delete a Semester, Grade Averages (ECTS-weighted), Last Revised Date (+5 more)

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (10): confirming, desktop, form, menuOpen, pick(), save(), { status, openCount }, target (+2 more)

### Community 57 - "Week and Date Math"
Cohesion: 0.15
Nodes (7): canDrag, DragFrom, draggableTodo(), DragPayload, dropZone(), DropZoneOptions, TODO_MIME

### Community 58 - "Community 58"
Cohesion: 0.26
Nodes (10): CHILD_ENV, createRunner(), errorLine(), exec(), specFlags(), calendar(), FAKE, run() (+2 more)

### Community 59 - "Time Slot Helpers"
Cohesion: 0.15
Nodes (11): { data }, daysLeft, groups, inSprint, longDate, onSprintDay, openToday, sprintAspects (+3 more)

### Community 60 - "Aspects Page"
Cohesion: 0.17
Nodes (12): name, needs, secrets, uses, with, bump, app_id, app_private_key (+4 more)

### Community 61 - "Sprint Page"
Cohesion: 0.26
Nodes (10): C24 (design reference, not on Mobbin), Cohesive Look Mockup (design/cohesive-mockup.html), Design Brief (design/brief.md), Design Tokens and Style Tile, Mobbin, One List Anatomy, Projects Mockup (design/projects-mockup.html), Proton (design reference) (+2 more)

### Community 62 - "Uni Sprint Todos E2E"
Cohesion: 0.17
Nodes (12): Project Status Pill (backlog/active/paused/implemented), Approved Visual Result, New Todo from the Sidebar, Projects Count in Navigation, Proton Sync Link with Warning Marker, Responsive Layout and Navigation (sidebar / phone home list), navigation Specification, Touch Alternatives to Drag (+4 more)

### Community 63 - "Community 63"
Cohesion: 0.17
Nodes (12): scripts, build, check, check:watch, dev, package, prepare, preview (+4 more)

### Community 64 - "Dev Dependencies"
Cohesion: 0.26
Nodes (8): actions, classType(), num(), optionalDate(), optionalId(), optionalText(), target(), text()

### Community 65 - "TypeScript Config"
Cohesion: 0.18
Nodes (11): Create a Project, Delete a Project, Linked Todos on the Project (Open/Planned/Done), IT Project Data Model (Migration 2), Project Detail Page, Project Markdown Notes, Projects Overview (/projects), it-projects Specification (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.18
Nodes (8): { data }, due, entries, month, monthLabel, picked, selected, tablet

### Community 67 - "Class Detail Page"
Cohesion: 0.18
Nodes (8): { data }, deleteForm, deleting, editing, error, project, uid, wide

### Community 68 - "Layout and Motion"
Cohesion: 0.20
Nodes (10): 6. Cross-cutting behavior, Confirmations, Date handling, Drag and drop, Error pages, Navigation between routes, Offline / runtime facts, Persistence (+2 more)

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (5): ASPECTS, LINKED, OPEN_TODOS, PROJECT, seedProject()

### Community 71 - "Proton CLI Runner and Hooks"
Cohesion: 0.27
Nodes (7): ASPECTS, day(), expectDocked(), expectStatusInEveryView(), row(), settled(), weekdays()

### Community 72 - "Todos Spec and Aspect Links"
Cohesion: 0.20
Nodes (9): dependency-name, update-types, interval, updates, directory, ignore, package-ecosystem, schedule (+1 more)

### Community 73 - "Design Direction Spec"
Cohesion: 0.20
Nodes (9): jobs, publish, name, on, push, name, needs, runs-on (+1 more)

### Community 74 - "Project Status Pill"
Cohesion: 0.20
Nodes (10): Europe/Berlin Time Zone, Planned Todos Become Events, Due-This-Week Suggestions, Missed Planned Days Join Next Sprint Unscheduled, Sprint Planning, sprint-lifecycle Specification, Sprint Phase (running / review-available / review-required / planning / none), Sprint Review (available Sunday, required Monday after) (+2 more)

### Community 75 - "Today Page"
Cohesion: 0.20
Nodes (7): {
		backlog,
		aspects,
		progress = {},
		canAdd,
		addAction,
		addLabel = 'Add to sprint',
		onadd,
		onreturn,
		testid = 'backlog-rail'
	}, collapsed, failure, groups, matches, query, today

### Community 76 - "Release Bump Job"
Cohesion: 0.31
Nodes (7): CalendarEntry, insert(), rule(), semester(), sprint(), todo(), uniClass()

### Community 77 - "Community 77"
Cohesion: 0.31
Nodes (6): insert(), rule(), semester(), sprint(), todo(), uniClass()

### Community 78 - "Community 78"
Cohesion: 0.20
Nodes (9): active, adding, changing, { data }, groups, implemented, itAspect, prompting (+1 more)

### Community 79 - "Community 79"
Cohesion: 0.31
Nodes (7): Markdown rendering, decodeEntities(), escapeHtml(), marked, NAMED, renderMarkdown(), safeHref()

### Community 80 - "Community 80"
Cohesion: 0.31
Nodes (5): reset(), expectAspectPage(), quickAdd(), row(), seedManaged()

### Community 81 - "NPM Scripts"
Cohesion: 0.22
Nodes (6): ASPECTS, CLASSES, PROJECTS, seedSunday(), SEMESTERS, TODOS

### Community 82 - "Todos Form Actions"
Cohesion: 0.25
Nodes (9): permissions, permissions, permissions, actions, attestations, contents, id-token, packages (+1 more)

### Community 83 - "Community 83"
Cohesion: 0.33
Nodes (9): steps, GH_TOKEN, steps, env, id, name, run, uses (+1 more)

### Community 84 - "Desired State Tests"
Cohesion: 0.31
Nodes (6): activeTodos(), carryInto(), gym(), lecture(), listSprintTodos(), onDueDay()

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

### Community 91 - "Community 91"
Cohesion: 0.29
Nodes (5): OVERVIEW_GROUPS, PROJECT_MESSAGES, PROJECT_STATUSES, STATUS_LABELS, ProjectStatus

### Community 92 - "Community 92"
Cohesion: 0.33
Nodes (3): 3.1 Todo, Sprint, Aspect, Backlog, Review decisions, actions, status()

### Community 93 - "Community 93"
Cohesion: 0.40
Nodes (6): /recurring, Shared todo behavior (appears on Today, Sprint, Backlog, Plan, Review), create(), Aspect, Priority, Project

### Community 94 - "Community 94"
Cohesion: 0.53
Nodes (4): aspectRow(), expectStyle(), openDelete(), openEdit()

### Community 97 - "Sprint Review Page"
Cohesion: 0.60
Nodes (3): editor(), openTodo(), row()

### Community 98 - "Journey E2E"
Cohesion: 0.40
Nodes (5): name, outputs, runs-on, check-tag, ci-run-id

### Community 101 - "Release Workflow Steps"
Cohesion: 0.50
Nodes (3): db, fakeProtonDir, port

## Knowledge Gaps
- **57 isolated node(s):** `$app/tsconfig`, `GET /healthz and migrations on start`, `Create a Project`, `Delete a Project`, `Linked Todos on the Project (Open/Planned/Done)` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 907 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `svelte` connect `Todo Editor and Backlog Rail` to `Community 2`, `Community 3`, `Sprint Lifecycle Service`, `Community 11`, `Community 12`, `E2E Seed and Clock Helpers`, `Quick Add Form`, `Todo Row and Badges`, `SQLite Database and Proton Tests`, `CI Gate Workflow`, `Recurring Rules and Sprint Start`, `Community 36`, `Community 39`, `Community 43`, `Community 44`, `Community 45`, `Community 53`, `Community 56`, `Week and Date Math`, `Community 66`, `Class Detail Page`, `Today Page`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `$app/tsconfig`, `GET /healthz and migrations on start`, `Create a Project` to the rest of the system?**
  _57 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06180733162830349 - nodes in this community are weakly interconnected._
- **Why does `uni-hub Specification` connect `Community 54` to `TypeScript Config`, `Community 38`, `Community 41`, `Community 42`, `Dependabot Config`, `Uni Sprint Todos E2E`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `Svelte Component Imports` be split into smaller, more focused modules?**
  _Cohesion score 0.05064935064935065 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Community 39` to `Community 0`, `Svelte Component Imports`, `Community 5`, `Community 38`, `Community 7`, `Community 10`, `Community 42`, `Release Bump Job`, `Todo Fields and Date Formatting`, `Community 77`, `Community 79`, `Community 49`, `Proton E2E Tests`, `Desired State Tests`, `Proton Sync Worker`, `Proton Sync Journey Tests`, `Community 58`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05870020964360587 - nodes in this community are weakly interconnected._