# Graph Report - e2e-decouple  (2026-11-15)

## Corpus Check
- 249 files · ~210,960 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 1887 nodes · 3870 edges · 124 communities (106 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8922dc85`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- todos.ts
- server/aspects.test.ts
- ref_lib
- aspect-style.ts
- Proton Sync Change and Runtime Specs
- sprints.ts
- Life-Manager: Functional Contract
- server/uni.test.ts
- Sprint Lifecycle Service
- Todo Editor and Backlog Rail
- reconciler.test.ts
- icons.ts
- QuickAdd.svelte
- Todo Fields and Date Formatting
- Todos Service
- reset
- Recurring Rules (with optional time slot)
- steps
- Quick Add Form
- Proton E2E Tests
- helpers.ts
- SemesterSection.svelte
- proton/types.ts
- CI Gate Workflow
- Proton Sync Worker
- Proton Sync Journey Tests
- Recurring Rules and Sprint Start
- Fake Proton CLI
- app-runtime Specification
- Semester Sections and Archive
- Life-Manager
- server/projects.ts
- Desired State and Calendar Month
- Planning Placement Rule
- Proton Types, Hash and Packaging
- Recurring Rule Form
- proton-sync.test.ts
- sprints.test.ts
- db.ts
- @sveltejs/adapter-node
- TodoFields.svelte
- 5. Routes
- lib/uni.ts
- package.json
- TodoFields.svelte
- aspects/+page.svelte
- Aspect Detail Page
- uni-sprint-todos.test.ts
- recurring/+page.svelte
- slot.ts
- Uni Paging Helpers
- @sveltejs/kit
- Test Hooks and Server Routes
- classes/[id]/+page.svelte
- uni-hub Specification
- Drag and Drop Module
- StatusPill.svelte
- Week and Date Math
- package.json
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
- aspect-page.test.ts
- sprint-views.test.ts
- BacklogRail.svelte
- Todos Spec and Aspect Links
- Design Direction Spec
- sprint-lifecycle Specification
- Product
- 4. Rituals
- desired.ts
- projects/+page.svelte
- markdown.ts
- project-detail.test.ts
- proton-sync Specification
- Todos Form Actions
- steps
- +layout.svelte
- 8. Behavioral data-* allow-list
- Project Detail Page
- Project Detail E2E
- e2e/calendar.test.ts
- Sprint Views E2E
- it-projects Specification
- lib/projects.ts
- classes/[id]/+page.server.ts
- Aspect
- e2e/aspects.test.ts
- plan/+page.svelte
- today.test.ts
- server/calendar.test.ts
- Journey E2E
- calendar Specification
- Workflow Permissions
- review/+page.svelte
- aspects/+page.server.ts
- backlog/+page.svelte
- plan/+page.server.ts
- sync/+page.server.ts
- proton/+server.ts
- ViewSwitch.svelte
- playwright.config.ts
- app.d.ts
- Todo Planning E2E
- @fontsource-variable/bricolage-grotesque
- uni/+page.svelte
- LinkedTodos.svelte
- welcome/page.server.test.ts
- runtime.test.ts
- NewProjectForm.svelte
- insert
- 3. Entities
- recurring/+page.server.ts
- aspect-filter.ts
- projects/[id]/+page.server.ts

## God Nodes (most connected - your core abstractions)
1. `seed()` - 48 edges
2. `reset()` - 43 edges
3. `test` - 41 edges
4. `setClock()` - 38 edges
5. `svelte` - 37 edges
6. `todoRow()` - 33 edges
7. `UI_ICONS` - 30 edges
8. `vitest` - 29 edges
9. `@playwright/test` - 28 edges
10. `todoRows()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Offline / runtime facts` --references--> `ok()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/proton/sync.test.ts
- `/uni/classes/[id]` --references--> `today()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/clock.ts
- `3.3 Calendar items and Proton sync items` --references--> `calendarMonth()`  [INFERRED]
  docs/functional-contract.md → src/lib/server/calendar.ts
- `/uni` --references--> `Grade`  [INFERRED]
  docs/functional-contract.md → src/lib/types.ts
- `Backlog View (aspect groups, Planned section)` --references--> `listBacklog()`  [INFERRED]
  openspec/specs/backlog/spec.md → src/lib/server/todos.ts

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

## Communities (124 total, 18 thin omitted)

### Community 0 - "todos.ts"
Cohesion: 0.11
Nodes (33): Slot Data Model (Migration 5: start_time/end_time), inWeek(), Landing, landing(), sprintOf(), SprintRow, addChecklistItem(), aspectExists() (+25 more)

### Community 1 - "server/aspects.test.ts"
Cohesion: 0.17
Nodes (21): Aspect Cards on Wide Screens, Create and Edit Aspects (unique name, fixed palette and icons), Delete Aspects (move todos and rules to target), First-Run Onboarding (aspect presets), aspects Specification, One Proton Calendar per Aspect, aspectUsage(), countAspects() (+13 more)

### Community 2 - "ref_lib"
Cohesion: 0.08
Nodes (17): {
		backlog,
		aspects,
		progress,
		onadd
	}, open, { classRef, type, href = true }, { grades, overall = false }, failure, id, { oncancel, onsaved }, revisedToday (+9 more)

### Community 3 - "aspect-style.ts"
Cohesion: 0.09
Nodes (32): ASPECT_COLORS, ASPECT_ICONS, AspectColor, AspectIcon, PRESET_ASPECTS, ASPECT_ERRORS, {
		name = '',
		color = 'sage',
		icon = 'star',
		error
	}, uid (+24 more)

### Community 4 - "Proton Sync Change and Runtime Specs"
Cohesion: 0.09
Nodes (25): OPSX: Apply command, OPSX: Archive command, OPSX: Explore command, OPSX: Propose command, OPSX: Sync command, openspec-apply-change skill, Workspace-planning guard (actionContext.mode), Dated archive move (changesDir/archive/YYYY-MM-DD-<name>) (+17 more)

### Community 5 - "sprints.ts"
Cohesion: 0.18
Nodes (23): activeTodos(), carryInto(), gym(), lecture(), blockedBy(), closeReview(), DECISIONS, getActiveSprint() (+15 more)

### Community 6 - "Life-Manager: Functional Contract"
Cohesion: 0.25
Nodes (7): 10. Graph notes, 11. Open questions for Rue, 1. Purpose and usage context, 2. Jobs to be done, 7. Copy list, 9. Route coverage check, Life-Manager: Functional Contract

### Community 7 - "server/uni.test.ts"
Cohesion: 0.12
Nodes (35): /uni, Archive a Semester (read-only), Delete a Class, archiveSemester(), classCounts(), ClassRow, classRules(), classTodos() (+27 more)

### Community 8 - "Sprint Lifecycle Service"
Cohesion: 0.12
Nodes (15): addForm, adding, all, aspect, backForm, backlogList, { data }, moved (+7 more)

### Community 9 - "Todo Editor and Backlog Rail"
Cohesion: 0.08
Nodes (24): svelte, {
		aspects,
		current = null,
		linkCount,
		oncancel,
		onsaved
	}, confirming, dropsLinks, name, selected, {
		children,
		rail,
		railTitle,
		wide = false,
		overlay = false
	}, id (+16 more)

### Community 10 - "reconciler.test.ts"
Cohesion: 0.11
Nodes (31): PROTON_COLORS, specHash(), runPass(), Abort, expectOk(), failedItems(), Failure, frozen() (+23 more)

### Community 11 - "icons.ts"
Cohesion: 0.12
Nodes (16): aspectColor(), { day, entries, due, aspects }, editing, entryColor(), {
		month,
		weeks,
		entries,
		due,
		selected,
		today,
		aspects,
		onselect
	}, tablet, WEEKDAYS, { project } (+8 more)

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
Cohesion: 0.18
Nodes (20): readConfig(), forgetHashes(), ProtonConfig, block(), configureWorker(), database(), defaultPass(), finish() (+12 more)

### Community 14 - "Todos Service"
Cohesion: 0.07
Nodes (28): AddToSprintError, AspectInput, AspectProgress, ChecklistItem, ClassInput, ClassLink, ClassSummary, ClassTodos (+20 more)

### Community 15 - "reset"
Cohesion: 0.09
Nodes (28): Learnings, ASPECTS, aspectGroup(), dayColumn(), reset(), seed(), setClock(), todoRow() (+20 more)

### Community 16 - "Recurring Rules (with optional time slot)"
Cohesion: 0.38
Nodes (7): Recurring Instances, Recurring Rules per Class (Uni), recurring Specification, Mid-Sprint Changes, Week-by-Day View, Planned Date and Time Slot, setDay()

### Community 17 - "steps"
Cohesion: 0.08
Nodes (25): name, runs-on, steps, runner, jobs, ci, name, on (+17 more)

### Community 18 - "Quick Add Form"
Cohesion: 0.08
Nodes (18): actionsEl, addError, aspects, checkable, checked, classRef, desktop, done (+10 more)

### Community 19 - "Proton E2E Tests"
Cohesion: 0.14
Nodes (17): /healthz, aspect(), classInput(), kinds(), klass(), ok(), ops(), pass() (+9 more)

### Community 20 - "helpers.ts"
Cohesion: 0.12
Nodes (18): calendarCell(), dayMonth, FAKE_PROTON_CLI, FAKE_PROTON_DIR, projectCards(), protonOn(), ProtonOnOptions, protonPass() (+10 more)

### Community 21 - "SemesterSection.svelte"
Cohesion: 0.06
Nodes (29): GLYPHS, dateFull, dateShort, {
		project,
		todos,
		mode,
		onedit
	}, repoLabel, editing, {
		html,
		notes,
		placeholder = 'No notes yet. Write down the plan, decisions or change requests.',
		editable = true
	}, uid (+21 more)

### Community 22 - "proton/types.ts"
Cohesion: 0.14
Nodes (14): insert(), rule(), semester(), sprint(), todo(), uniClass(), base, CliResult (+6 more)

### Community 23 - "CI Gate Workflow"
Cohesion: 0.09
Nodes (19): planError(), aspectColor, aspectId, classId, confirming, deleteForm, desktop, dueDate (+11 more)

### Community 24 - "Proton Sync Worker"
Cohesion: 0.40
Nodes (12): Month Calendar Page (/calendar), addDays(), berlinDate, berlinToday(), monthGrid(), parseMonth(), reviewState(), targetWeek() (+4 more)

### Community 25 - "Proton Sync Journey Tests"
Cohesion: 0.27
Nodes (10): CHILD_ENV, createRunner(), errorLine(), exec(), specFlags(), calendar(), FAKE, run() (+2 more)

### Community 26 - "Recurring Rules and Sprint Start"
Cohesion: 0.08
Nodes (26): arrive(), ghost(), leave(), moved, moveForm, PLACEHOLDERS, rendered(), STATUSES (+18 more)

### Community 27 - "Fake Proton CLI"
Cohesion: 0.10
Nodes (21): with, context, file, github-token, images, labels, name, password (+13 more)

### Community 28 - "app-runtime Specification"
Cohesion: 0.10
Nodes (17): Environment Configuration, Harness Commands (proof, proof:full, package, dev), Health Check (GET /healthz), Node Version Declared (engines.node >=22.5 for node:sqlite), Persistence Across Restarts (SQLite file), Setup README Requirement, app-runtime Specification, CI Gate (ci.yml -> gate.yml) (+9 more)

### Community 29 - "Semester Sections and Archive"
Cohesion: 0.17
Nodes (19): ACCENTS, bad(), createFake(), injected(), load(), log(), perform(), run() (+11 more)

### Community 30 - "Life-Manager"
Cohesion: 0.50
Nodes (3): Harness, Life-Manager, Specs

### Community 31 - "server/projects.ts"
Cohesion: 0.14
Nodes (21): now(), setTestNow(), today(), createProject(), deleteProject(), getItAspectId(), getProject(), listProjects() (+13 more)

### Community 32 - "Desired State and Calendar Month"
Cohesion: 0.11
Nodes (18): uses, with, concurrency, cancel-in-progress, group, jobs, ci, security-baseline (+10 more)

### Community 33 - "Planning Placement Rule"
Cohesion: 0.09
Nodes (26): Aspect Page (/aspects/<id>), Project Screens Keep Existing Motion, Moves Travel to Their New Place (FLIP/crossfade 200 ms), Navigation Cross-Fades (View Transitions API), prefers-reduced-motion, motion Specification, Wide Desktop Layout with Context Rail, Add to the Sprint from the Rail (+18 more)

### Community 34 - "Proton Types, Hash and Packaging"
Cohesion: 0.33
Nodes (12): Recurring Rules Become Weekly Series, classFor(), columns(), createRule(), deleteRule(), generateInstances(), getRule(), Row (+4 more)

### Community 35 - "Recurring Rule Form"
Cohesion: 0.11
Nodes (17): aspectId, {
		aspects,
		rule = null,
		oncancel,
		onsaved,
		ondelete
	}, checklist, CLASS_MESSAGES, classes, classId, classShown, endTime (+9 more)

### Community 36 - "proton-sync.test.ts"
Cohesion: 0.27
Nodes (9): fake(), delta(), editor(), HEALTH, mark(), onlyRef(), openTodo(), ops() (+1 more)

### Community 37 - "sprints.test.ts"
Cohesion: 0.20
Nodes (14): `/todos`, Unplanned and Deleted Todos Lose Their Event, addToActiveSprint(), aspectProgress(), getTodo(), inSprint(), listToday(), moveToBacklog() (+6 more)

### Community 38 - "db.ts"
Cohesion: 0.11
Nodes (17): Migrations on Start, Uni Data Model (Migration 4: semesters, classes), vitest, hash, root, staging, { version }, getDb() (+9 more)

### Community 40 - "TodoFields.svelte"
Cohesion: 0.12
Nodes (21): dateLabel(), dayLabel(), dayMonth, daysFrom(), dueLabel(), utc(), weekdayShort, weekLabel() (+13 more)

### Community 41 - "5. Routes"
Cohesion: 0.09
Nodes (26): 5. Routes, /aspects, /aspects/[id], `/backlog`, /calendar, /menu, /projects, /projects/[id] (+18 more)

### Community 42 - "lib/uni.ts"
Cohesion: 0.17
Nodes (13): Sprint List Paging (6 per page), ClassType, Grade, clampPage(), CLASS_TYPES, daysFrom(), examCountdown(), GRADES (+5 more)

### Community 43 - "package.json"
Cohesion: 0.15
Nodes (13): devDependencies, @playwright/test@^1.64.1, svelte@^5.57.3, svelte-check@^4.7.8, @sveltejs/kit@^3.1.0, @types/node@^26.6.6, typescript@^6.0.3, vite@^8.3.6 (+5 more)

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
Cohesion: 0.13
Nodes (22): activeSemesters(), archivedGroup(), classCards(), classGrid(), emptyState(), notesRegion(), semesterSection(), semesterSections() (+14 more)

### Community 48 - "recurring/+page.svelte"
Cohesion: 0.15
Nodes (10): WEEKDAYS, { message, href, actionLabel }, RecurringRule, aspectById, classById, { data }, deleting, editing (+2 more)

### Community 49 - "slot.ts"
Cohesion: 0.33
Nodes (12): Time Slot Rules, endAfter(), lengthLabel(), nextHour(), plannedLabel(), shiftEnd(), SlotError, slotLabel() (+4 more)

### Community 50 - "Uni Paging Helpers"
Cohesion: 0.14
Nodes (13): $app/tsconfig, compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, resolveJsonModule, skipLibCheck (+5 more)

### Community 52 - "Test Hooks and Server Routes"
Cohesion: 0.21
Nodes (9): nav, adding, aspectHref, nav, NAV_ITEMS, NavCount, NavData, syncNeedsAttention() (+1 more)

### Community 53 - "classes/[id]/+page.svelte"
Cohesion: 0.15
Nodes (11): archived, cls, { data }, deleteForm, deleteMessage, deleting, edit, editing (+3 more)

### Community 54 - "uni-hub Specification"
Cohesion: 0.17
Nodes (13): Exams Become Events in the Uni Calendar, Add Todos on the Class, Class Card (exam countdown, grade), Create and Edit a Class, Delete a Semester, Grade Averages (ECTS-weighted), Last Revised Date, Semester Management (+5 more)

### Community 55 - "Drag and Drop Module"
Cohesion: 0.14
Nodes (3): VIEWS, actions, SeedResult

### Community 56 - "StatusPill.svelte"
Cohesion: 0.17
Nodes (10): confirming, desktop, form, menuOpen, pick(), save(), { status, openCount }, target (+2 more)

### Community 57 - "Week and Date Math"
Cohesion: 0.15
Nodes (7): canDrag, DragFrom, draggableTodo(), DragPayload, dropZone(), DropZoneOptions, TODO_MIME

### Community 58 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, marked@^18.1.1, @sveltejs/vite-plugin-svelte@^7.3.1, engines, node, name, private, type (+3 more)

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
Cohesion: 0.20
Nodes (10): Approved Visual Result, New Todo from the Sidebar, Proton Sync Link with Warning Marker, Responsive Layout and Navigation (sidebar / phone home list), navigation Specification, Touch Alternatives to Drag, Uni Count in Navigation, Proton Sync Page (/sync) (+2 more)

### Community 63 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, check:watch, dev, package, prepare, preview (+4 more)

### Community 64 - "Dev Dependencies"
Cohesion: 0.26
Nodes (8): actions, classType(), num(), optionalDate(), optionalId(), optionalText(), target(), text()

### Community 65 - "todos Specification"
Cohesion: 0.15
Nodes (15): Backlog View (aspect groups, Planned section), backlog Specification, IT Aspect Setting, Project Detail Page, Class Badge on Todo Rows, Class Link Follows the Aspect, Delete Todos, Edit Todos (+7 more)

### Community 66 - "calendar/+page.svelte"
Cohesion: 0.18
Nodes (8): { data }, due, entries, month, monthLabel, picked, selected, tablet

### Community 67 - "Class Detail Page"
Cohesion: 0.18
Nodes (8): { data }, deleteForm, deleting, editing, error, project, uid, wide

### Community 68 - "Layout and Motion"
Cohesion: 0.20
Nodes (10): 6. Cross-cutting behavior, Confirmations, Date handling, Drag and drop, Error pages, Navigation between routes, Offline / runtime facts, Persistence (+2 more)

### Community 69 - "aspect-page.test.ts"
Cohesion: 0.14
Nodes (8): ASPECTS, RUNNING, ASPECTS, openActions(), RECURRING, ASPECTS, UNI, SeedInput

### Community 70 - "sprint-views.test.ts"
Cohesion: 0.07
Nodes (33): cellEntries(), navigateAndSwitchView(), transitions(), ASPECTS, CLASSES, PROJECTS, SEMESTERS, TODOS (+25 more)

### Community 71 - "BacklogRail.svelte"
Cohesion: 0.16
Nodes (11): {
		backlog,
		aspects,
		progress = {},
		canAdd,
		addAction,
		addLabel = 'Add to sprint',
		onadd,
		onreturn
	}, collapsed, failure, groups, matches, query, today, { todoId, day, sprintDays } (+3 more)

### Community 72 - "Todos Spec and Aspect Links"
Cohesion: 0.20
Nodes (9): dependency-name, update-types, interval, updates, directory, ignore, package-ecosystem, schedule (+1 more)

### Community 73 - "Design Direction Spec"
Cohesion: 0.20
Nodes (9): jobs, publish, name, on, push, name, needs, runs-on (+1 more)

### Community 74 - "sprint-lifecycle Specification"
Cohesion: 0.15
Nodes (13): Europe/Berlin Time Zone, Planned Todos Become Events, Due-This-Week Suggestions, Missed Planned Days Join Next Sprint Unscheduled, Planned Todos Join Their Week's Sprint, Sprint Planning, sprint-lifecycle Specification, Sprint Phase (running / review-available / review-required / planning / none) (+5 more)

### Community 75 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Platform, Positioning, Product, Product Principles (+2 more)

### Community 76 - "4. Rituals"
Cohesion: 0.25
Nodes (8): 4.1 Weekly sprint lifecycle, 4.2 Planning flow (`/sprint/plan`), 4.3 Review flow (`/sprint/review`), 4.4 Onboarding (`/welcome`), 4.5 Sync ritual (`/sync`), 4. Rituals, Operating Context, proton()

### Community 77 - "desired.ts"
Cohesion: 0.25
Nodes (15): archivedRuleIds(), byTime(), calendarMonth(), DueTodo, projectionStart(), Row, classRooms(), DAY_CODES (+7 more)

### Community 78 - "projects/+page.svelte"
Cohesion: 0.20
Nodes (9): active, adding, changing, { data }, groups, implemented, itAspect, prompting (+1 more)

### Community 79 - "markdown.ts"
Cohesion: 0.31
Nodes (7): Markdown rendering, decodeEntities(), escapeHtml(), marked, NAMED, renderMarkdown(), safeHref()

### Community 80 - "project-detail.test.ts"
Cohesion: 0.14
Nodes (6): projectCard(), ASPECTS, LINKED, OPEN_TODOS, PROJECT, seedProject()

### Community 81 - "proton-sync Specification"
Cohesion: 0.16
Nodes (13): Diff Reconciliation, Done Todos Keep Event with Check Mark, Due Bundles Follow Their Todos, Edits Follow the Todo, Event Content Hash, Fake Proton CLI (scripts/fake-proton.mjs), First-Run Backfill, Pass Scheduling (30 s debounce, 5 min tick, Sync now) (+5 more)

### Community 82 - "Todos Form Actions"
Cohesion: 0.25
Nodes (9): permissions, permissions, permissions, actions, attestations, contents, id-token, packages (+1 more)

### Community 83 - "steps"
Cohesion: 0.33
Nodes (9): steps, GH_TOKEN, steps, env, id, name, run, uses (+1 more)

### Community 84 - "+layout.svelte"
Cohesion: 0.24
Nodes (7): flipOpts(), MOVE_MS, NAV_MS, RAIL_MS, reducedMotion(), [send, receive], { children }

### Community 85 - "8. Behavioral data-* allow-list"
Cohesion: 0.33
Nodes (3): 8. Behavioral data-* allow-list, shownDay(), Status

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

### Community 88 - "e2e/calendar.test.ts"
Cohesion: 0.14
Nodes (5): HEALTH, JOB, openCalendar(), rail(), dayListEntries()

### Community 89 - "Sprint Views E2E"
Cohesion: 0.21
Nodes (8): ASPECTS, CLASS, CLASS_TODOS, markRevised(), revised(), revisedRow(), seedClass(), todoGroup()

### Community 90 - "it-projects Specification"
Cohesion: 0.25
Nodes (8): Create a Project, Delete a Project, Linked Todos on the Project (Open/Planned/Done), IT Project Data Model (Migration 2), Project Markdown Notes, Project Status Pill (backlog/active/paused/implemented), it-projects Specification, Projects Count in Navigation

### Community 91 - "lib/projects.ts"
Cohesion: 0.29
Nodes (5): OVERVIEW_GROUPS, PROJECT_MESSAGES, PROJECT_STATUSES, STATUS_LABELS, ProjectStatus

### Community 93 - "Aspect"
Cohesion: 0.50
Nodes (5): /recurring, Shared todo behavior (appears on Today, Sprint, Backlog, Plan, Review), Aspect, Priority, Project

### Community 94 - "e2e/aspects.test.ts"
Cohesion: 0.43
Nodes (4): aspectRow(), expectStyle(), openDelete(), openEdit()

### Community 95 - "plan/+page.svelte"
Cohesion: 0.20
Nodes (7): count, { data, form }, drop, ERRORS, marked, startLabel, unmarked

### Community 96 - "today.test.ts"
Cohesion: 0.25
Nodes (3): ACTIVE, ASPECTS, PROMPT_LINKS

### Community 97 - "server/calendar.test.ts"
Cohesion: 0.31
Nodes (7): CalendarEntry, insert(), rule(), semester(), sprint(), todo(), uniClass()

### Community 98 - "Journey E2E"
Cohesion: 0.40
Nodes (5): name, outputs, runs-on, check-tag, ci-run-id

### Community 99 - "calendar Specification"
Cohesion: 0.36
Nodes (8): Calendar Entries, Calendar Layouts (dots / titles / rail), Due Marker and Due List, Opening Calendar Entries, Projected Recurring Occurrence, calendar Specification, Due Dates Become Bundled All-Day Events per Aspect and Day, Recurring Rules (with optional time slot)

### Community 101 - "review/+page.svelte"
Cohesion: 0.22
Nodes (6): closeLabel, { data, form }, decisionOf(), decisions, LABELS, VERBS

### Community 103 - "backlog/+page.svelte"
Cohesion: 0.40
Nodes (4): adding, { data }, groups, planned

### Community 108 - "playwright.config.ts"
Cohesion: 0.50
Nodes (3): db, fakeProtonDir, port

### Community 114 - "uni/+page.svelte"
Cohesion: 0.25
Nodes (6): adding, changing, { data }, prompting, uniAspect, wide

### Community 115 - "LinkedTodos.svelte"
Cohesion: 0.29
Nodes (5): aspects, showDone, {
		todos,
		today,
		sprintDays,
		title = 'Linked todos',
		emptyText = 'No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field.',
		top,
		extra,
		readonly = false
	}, total, uid

### Community 116 - "welcome/page.server.test.ts"
Cohesion: 0.25
Nodes (4): actions, load(), takenNames(), db

### Community 118 - "NewProjectForm.svelte"
Cohesion: 0.40
Nodes (5): describe(), failure, fieldError(), id, { oncancel, onsaved }

### Community 119 - "insert"
Cohesion: 0.40
Nodes (6): dated(), insert(), semester(), sprint(), todo(), uniClass()

### Community 120 - "3. Entities"
Cohesion: 0.40
Nodes (5): 3.1 Todo, Sprint, Aspect, Backlog, Review decisions, 3.2 Aspects, recurring rules, IT projects, Uni, 3.3 Calendar items and Proton sync items, 3. Entities, status()

## Knowledge Gaps
- **52 isolated node(s):** `$app/tsconfig`, `Aspect Cards on Wide Screens`, `First-Run Onboarding (aspect presets)`, `SvelteKit App HTML Shell`, `Node Version Declared (engines.node >=22.5 for node:sqlite)` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 922 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `db.ts` to `todos.ts`, `server/aspects.test.ts`, `ref_lib`, `sprints.ts`, `server/uni.test.ts`, `reconciler.test.ts`, `Todo Fields and Date Formatting`, `Proton E2E Tests`, `proton/types.ts`, `Proton Sync Worker`, `Proton Sync Journey Tests`, `server/projects.ts`, `sprints.test.ts`, `@sveltejs/adapter-node`, `lib/uni.ts`, `package.json`, `slot.ts`, `package.json`, `markdown.ts`, `server/calendar.test.ts`, `aspects/+page.server.ts`, `welcome/page.server.test.ts`, `aspect-filter.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$app/tsconfig`, `Aspect Cards on Wide Screens`, `First-Run Onboarding (aspect presets)` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `todos.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11379800853485064 - nodes in this community are weakly interconnected._
- **Why does `svelte` connect `Todo Editor and Backlog Rail` to `aspect-style.ts`, `Sprint Lifecycle Service`, `icons.ts`, `QuickAdd.svelte`, `Quick Add Form`, `SemesterSection.svelte`, `CI Gate Workflow`, `Recurring Rules and Sprint Start`, `package.json`, `TodoFields.svelte`, `aspects/+page.svelte`, `classes/[id]/+page.svelte`, `StatusPill.svelte`, `Week and Date Math`, `package.json`, `calendar/+page.svelte`, `Class Detail Page`, `BacklogRail.svelte`, `+layout.svelte`, `plan/+page.svelte`, `uni/+page.svelte`, `LinkedTodos.svelte`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `ref_lib` be split into smaller, more focused modules?**
  _Cohesion score 0.07957957957957958 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `sprint-views.test.ts` to `today.test.ts`, `proton-sync.test.ts`, `aspect-page.test.ts`, `package.json`, `playwright.config.ts`, `reset`, `project-detail.test.ts`, `uni-sprint-todos.test.ts`, `helpers.ts`, `e2e/calendar.test.ts`, `Sprint Views E2E`, `package.json`, `e2e/aspects.test.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `aspect-style.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09059233449477352 - nodes in this community are weakly interconnected._