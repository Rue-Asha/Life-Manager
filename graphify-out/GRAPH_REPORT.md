# Graph Report - Life-Manager  (2026-11-05)

## Corpus Check
- Large corpus: 601 files · ~380,182 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2432 nodes · 4707 edges · 161 communities (139 shown, 22 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 342 edges (avg confidence: 0.9)
- Token cost: 941,457 input · 0 output

## Community Hubs (Navigation)
- Design Brief and Cohesive Mockup
- Svelte Component Imports
- Style Tile and Palette Options
- Aspects and Projects Services
- Proton Sync Change and Runtime Specs
- Shared UI Components
- Uni Server Service
- Icons, Sidebar and Day Pickers
- Sprint Lifecycle Service
- Todo Editor and Backlog Rail
- Week and Board Views
- Proton Reconciler
- Sprint Management Change
- Todo Fields and Date Formatting
- Todos Service
- Shared Domain Types
- E2E Seed and Clock Helpers
- Linked Todos and Meta Panels
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
- Uni Hub Sprint Todos Change
- Semester Sections and Archive
- Release Workflow Image Steps
- Uni Hub Change Spec
- Desired State and Calendar Month
- Planning Placement Rule
- Proton Types, Hash and Packaging
- Recurring Rule Form
- OpenSpec Commands and Skills
- Build Life Manager Runtime Units
- Build Life Manager Scope
- Calendar Planning Calendar Spec
- Contrast Check Script
- Uni Mockup
- Playwright Today and Motion Tests
- Faster CI Change
- Mid-Sprint Changes Delta
- Sprint Views and Layout Specs
- Aspect Detail Page
- Build Life Manager Sprint Specs
- IT Projects Design
- Calendar Planning Design
- Uni Paging Helpers
- SvelteKit Server Loads
- Test Hooks and Server Routes
- Build Life Manager Tasks
- CI and Release Workflow Structure
- Drag and Drop Module
- Mobbin Design References
- Week and Date Math
- CI Life Manager Design
- Time Slot Helpers
- Aspects Page
- Sprint Page
- Uni Sprint Todos E2E
- Deadline Calendar Change
- Dev Dependencies
- TypeScript Config
- Class Form
- Class Detail Page
- Layout and Motion
- Cohesive Look Tokens and Proton Colours
- Cohesive Look UI Primitives
- Proton CLI Runner and Hooks
- Todos Spec and Aspect Links
- Design Direction Spec
- Project Status Pill
- Today Page
- Release Bump Job
- Build Life Manager Design
- Sprint Management Tasks
- Uni Todo Class Links
- Planned Label and Week Cards
- NPM Scripts
- Todos Form Actions
- IT Projects Notes and Markdown
- Desired State Tests
- Calendar Page
- Project Detail Page
- Project Detail E2E
- Sprint Rail E2E
- Sprint Views E2E
- Dependabot Config
- Release Check-Tag and Publish
- Sprint Management Flow State
- Proton CLI Research Notes
- Calendar Spec
- Runtime Dependencies
- Projects Overview Page
- Sprint Review Page
- Journey E2E
- Responsive E2E
- Workflow Permissions
- Release Workflow Steps
- Design Direction Spike
- Uni Hub Design
- Rail Layout Pattern
- Today Quick Add Always
- Calendar Planning Flow State
- Calendar Planning Todos Delta
- Proton Calendar Sync Flow State
- Delete Aspect Dialog
- Calendar Service Tests
- Todo Planning E2E
- Build Life Manager Flow State
- Sprint Rail Delta Spec
- Today Quick Add Flow State
- Proton Sync Task Units
- OpenSpec Config
- IT Projects Spec
- Navigation Spec
- Proton Sync Spec
- Markdown Sanitizer
- Calendar E2E
- Class Detail E2E
- CI Security Baseline Job
- Context Rail Requirement
- IT Projects Flow State
- Uni Hub Flow State
- Faster CI Flow State
- Uni Sprint Todos Flow State
- Deadline Calendar Flow State
- Motion Spec
- Vite and Vitest Setup
- Projects Client Helpers
- Aspect Page E2E
- Aspects E2E
- Runtime E2E
- Motion Delta Spec
- IT Projects Scope
- Proton Sync Design
- Plan Ahead E2E
- Row Actions E2E
- Todo Classes E2E
- Todos E2E
- CI Triggers
- Recurring Page Server
- Uni Page Server
- Aspect Progress Counts
- Aspects Page Server
- Project Detail Server
- Plan Page Server
- Sync Page Server
- Recurring Instances Delta
- View Switch
- Today Planned Delta
- App Type Declarations
- Workflow Publishing Controls
- Projects Nav Count
- Responsive Navigation Requirement
- App HTML Shell

## God Nodes (most connected - your core abstractions)
1. `seed()` - 47 edges
2. `reset()` - 41 edges
3. `test` - 40 edges
4. `setClock()` - 37 edges
5. `svelte` - 36 edges
6. `UI_ICONS` - 30 edges
7. `@playwright/test` - 26 edges
8. `vitest` - 25 edges
9. `now()` - 25 edges
10. `Design: build-life-manager` - 25 edges

## Surprising Connections (you probably didn't know these)
- `PROTON_CLI / PROTON_PROFILE configuration` --references--> `readConfig()`  [INFERRED]
  openspec/changes/archive/2026-10-18-proton-calendar-sync/proposal.md → src/lib/server/proton/config.ts
- `error_hash = specHash:aspectId` --references--> `reconcile()`  [INFERRED]
  openspec/changes/archive/2026-10-18-proton-calendar-sync/verification.md → src/lib/server/proton/reconciler.ts
- `Requirement: Missed planned days join the next sprint` --implements--> `startSprint()`  [INFERRED]
  openspec/changes/archive/2026-10-18-calendar-planning/specs/sprint-lifecycle/spec.md → src/lib/server/sprints.ts
- `Requirement: Calendar entries` --implements--> `calendarMonth()`  [INFERRED]
  openspec/changes/archive/2026-10-18-calendar-planning/specs/calendar/spec.md → src/lib/server/calendar.ts
- `proton Call Timeout Fix (120 s SIGKILL -> exit 5)` --references--> `createRunner()`  [INFERRED]
  openspec/changes/archive/2026-10-18-proton-calendar-sync/verification.md → src/lib/server/proton/cli.ts

## Import Cycles
- 2-file cycle: `src/lib/server/recurring.ts -> src/lib/server/sprints.ts -> src/lib/server/recurring.ts`
- 2-file cycle: `src/lib/server/sprints.ts -> src/lib/server/uni.ts -> src/lib/server/sprints.ts`
- 2-file cycle: `src/lib/server/recurring.ts -> src/lib/server/uni.ts -> src/lib/server/recurring.ts`
- 3-file cycle: `src/lib/server/projects.ts -> src/lib/server/sprints.ts -> src/lib/server/todos.ts -> src/lib/server/projects.ts`
- 3-file cycle: `src/lib/server/recurring.ts -> src/lib/server/uni.ts -> src/lib/server/sprints.ts -> src/lib/server/recurring.ts`
- 3-file cycle: `src/lib/server/sprints.ts -> src/lib/server/todos.ts -> src/lib/server/uni.ts -> src/lib/server/sprints.ts`
- 3-file cycle: `src/lib/server/recurring.ts -> src/lib/server/sprints.ts -> src/lib/server/uni.ts -> src/lib/server/recurring.ts`
- 4-file cycle: `src/lib/server/recurring.ts -> src/lib/server/sprints.ts -> src/lib/server/todos.ts -> src/lib/server/uni.ts -> src/lib/server/recurring.ts`

## Hyperedges (group relationships)
- **OpenSpec change lifecycle (explore, propose, apply, sync, archive)** — _claude_skills_openspec_explore_skill_openspec_explore, _claude_skills_openspec_propose_skill_openspec_propose, _claude_skills_openspec_apply_change_skill_openspec_apply_change, _claude_skills_openspec_sync_specs_skill_openspec_sync_specs, _claude_skills_openspec_archive_change_skill_openspec_archive_change [EXTRACTED 1.00]
- **Cohesive look (Proton x C24) design system** — design_brief_cohesive_look, design_brief_hero_header, design_brief_field_cards, design_brief_proton_violet_accent, design_brief_list_anatomy, design_cohesive_mockup_cohesive_mockup [EXTRACTED 1.00]
- **Palette taste-gate options and contrast check** — design_brief_palette_options, design_brief_palette_a_cool_indigo, design_brief_palette_b_warm_paper, design_brief_palette_c_forest_and_stone, design_palettes_a_cool_indigo_palette_a_style_tile, design_palettes_b_warm_paper_palette_b_style_tile, design_brief_check_contrast_script [EXTRACTED 1.00]
- **Palette options A-E compared** — design_palettes_index_palette_a_cool_indigo, design_palettes_index_palette_b_warm_paper, design_palettes_c_forest_stone_palette, design_palettes_d_lilac_ink_palette, design_palettes_e_clear_vivid_palette [EXTRACTED 1.00]
- **Project status flow across overview, pill menu and implemented dialog** — design_projects_mockup_project_status_lifecycle, design_projects_mockup_projects_overview, design_projects_mockup_status_pill_menu, design_projects_mockup_mark_implemented_dialog [INFERRED 0.85]
- **Style tile design language rules** — design_style_tile_overdue_red_rule, design_style_tile_aspect_colour_system, design_style_tile_bricolage_grotesque_type, design_style_tile_float_shadow_radius_rule, design_style_tile_lucide_icon_set [INFERRED 0.85]
- **Weekly sprint ritual: plan -> work -> review -> plan** — openspec_changes_archive_2026_10_03_build_life_manager_specs_sprint_lifecycle_spec_planning, openspec_changes_archive_2026_10_03_build_life_manager_specs_sprint_lifecycle_spec_due_this_week_suggestions, openspec_changes_archive_2026_10_03_build_life_manager_specs_sprint_views_spec_sprint_todo_status, openspec_changes_archive_2026_10_03_build_life_manager_specs_sprint_lifecycle_spec_sprint_review, openspec_changes_archive_2026_10_03_build_life_manager_design_sprint_states, openspec_changes_archive_2026_10_03_build_life_manager_design_review_close_transaction, src_lib_server_sprints_startsprint, src_lib_server_sprints_closereview [EXTRACTED 1.00]
- **Sprint-management rail, drag and motion system** — openspec_changes_archive_2026_10_03_sprint_management_design_rail_is_per_page_component, openspec_changes_archive_2026_10_03_sprint_management_design_raillayout_bands, openspec_changes_archive_2026_10_03_sprint_management_design_shared_drag_module, openspec_changes_archive_2026_10_03_sprint_management_design_move_motion_crossfade, openspec_changes_archive_2026_10_03_sprint_management_scope_s1_backlog_rail, openspec_changes_archive_2026_10_03_sprint_management_scope_s2_add_from_rail, openspec_changes_archive_2026_10_03_sprint_management_scope_s3_send_back_to_backlog [INFERRED 0.85]
- **build-life-manager capabilities (10 specs)** — openspec_changes_archive_2026_10_03_build_life_manager_specs_app_runtime_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_aspects_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_backlog_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_design_direction_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_navigation_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_recurring_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_sprint_lifecycle_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_sprint_views_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_today_spec_spec, openspec_changes_archive_2026_10_03_build_life_manager_specs_todos_spec_spec [EXTRACTED 1.00]
- **Build-once CI and release pipeline** — openspec_changes_archive_2026_10_04_ci_life_manager_specs_ci_pipeline_spec_ci_gate_on_every_change_to_main, openspec_changes_archive_2026_10_04_ci_life_manager_specs_release_artifact_spec_release_tarball_contract, openspec_changes_archive_2026_10_04_ci_life_manager_specs_release_artifact_spec_releases_published_only_from_matching_tags, scripts_package, github_workflows_ci, github_workflows_release, openspec_changes_archive_2026_10_04_ci_life_manager_design_artifact_e2e_reuses_existing_suite [EXTRACTED 1.00]
- **IT todo to project link flow** — openspec_changes_archive_2026_10_04_it_projects_specs_it_projects_spec_it_aspect_setting, openspec_changes_archive_2026_10_04_it_projects_specs_todos_spec_link_it_todos_to_a_project, openspec_changes_archive_2026_10_04_it_projects_specs_todos_spec_project_link_follows_the_aspect, openspec_changes_archive_2026_10_04_it_projects_specs_todos_spec_project_badge_on_todo_rows, openspec_changes_archive_2026_10_04_it_projects_specs_it_projects_spec_linked_todos_on_the_project, openspec_changes_archive_2026_10_04_it_projects_design_unlink_on_every_aspect_change_in_sql [INFERRED 0.85]
- **Wide desktop layout and context rail system** — openspec_changes_archive_2026_10_03_sprint_management_specs_navigation_spec_wide_desktop_layout_with_context_rail, openspec_changes_archive_2026_10_03_sprint_management_specs_sprint_views_spec_backlog_rail_on_the_sprint_tab, openspec_changes_archive_2026_10_03_sprint_management_specs_sprint_views_spec_wide_board_and_week, openspec_changes_archive_2026_10_03_sprint_management_tasks_raillayout, openspec_changes_archive_2026_10_04_it_projects_specs_navigation_spec_wide_desktop_layout_with_context_rail, openspec_changes_archive_2026_10_04_it_projects_specs_it_projects_spec_project_detail_page [INFERRED 0.85]
- **Uni archive read-only enforcement** — openspec_changes_archive_2026_10_04_uni_hub_design_server_side_read_only, openspec_changes_archive_2026_10_04_uni_hub_design_todowritable, openspec_changes_archive_2026_10_04_uni_hub_design_archive_transaction, openspec_changes_archive_2026_10_04_uni_hub_specs_uni_hub_spec_archive_semester [EXTRACTED 1.00]
- **Faster CI build-once and promote-tarball flow** — openspec_changes_archive_2026_10_11_faster_ci_proposal_gate_builds_once, openspec_changes_archive_2026_10_11_faster_ci_specs_ci_pipeline_spec_cancel_superseded_pr_runs, openspec_changes_archive_2026_10_11_faster_ci_specs_ci_pipeline_spec_runner_by_event, openspec_changes_archive_2026_10_11_faster_ci_specs_release_artifact_spec_releases_from_matching_tags [EXTRACTED 1.00]
- **Calendar planning date/slot model** — openspec_changes_archive_2026_10_18_calendar_planning_design_loosened_day_invariant, openspec_changes_archive_2026_10_18_calendar_planning_design_placement_rule, openspec_changes_archive_2026_10_18_calendar_planning_design_setday_entry_point, openspec_changes_archive_2026_10_18_calendar_planning_design_slot_follows_day, openspec_changes_archive_2026_10_18_calendar_planning_design_sprint_start_order [EXTRACTED 1.00]
- **Planned date drives sprint placement, calendar and sync** — openspec_changes_archive_2026_10_18_calendar_planning_specs_todos_spec_planned_date_and_time_slot, openspec_changes_archive_2026_10_18_calendar_planning_proposal_sprint_membership_follows_planned_date, openspec_changes_archive_2026_10_18_calendar_planning_specs_sprint_lifecycle_spec_planned_todos_join_their_week_sprint, openspec_changes_archive_2026_10_18_calendar_planning_specs_sprint_lifecycle_spec_missed_planned_days_join_next_sprint, openspec_changes_archive_2026_10_18_calendar_planning_specs_calendar_spec_calendar_entries, openspec_changes_archive_2026_10_18_proton_calendar_sync_design_desired_state_stored_fields_only [INFERRED 0.85]
- **Cohesive-look UI primitives** — openspec_changes_archive_2026_10_18_cohesive_look_design_listgroup_primitive, openspec_changes_archive_2026_10_18_cohesive_look_design_summaryheader_primitive, openspec_changes_archive_2026_10_18_cohesive_look_design_fieldcard_primitive, openspec_changes_archive_2026_10_18_cohesive_look_design_pageheader_primitive, openspec_changes_archive_2026_10_18_cohesive_look_design_surfaces_and_tokens [EXTRACTED 1.00]
- **Proton sync pipeline: desired state -> reconciler -> CLI runner -> proton-cli** — openspec_changes_archive_2026_10_18_proton_calendar_sync_design_desired_state_stored_fields_only, openspec_changes_archive_2026_10_18_proton_calendar_sync_design_diff_reconciler, openspec_changes_archive_2026_10_18_proton_calendar_sync_design_cli_runner, openspec_changes_archive_2026_10_18_proton_calendar_sync_design_sync_worker, openspec_changes_archive_2026_10_18_calendar_planning_proton_sync_notes_roman_16_proton_cli [EXTRACTED 1.00]
- **Proton Sync Change Lineage** — openspec_changes_archive_2026_10_18_proton_calendar_sync_scope_proton_calendar_sync_change, openspec_changes_archive_2026_10_26_deadline_calendar_proposal_deadline_calendar_change, openspec_specs_proton_sync_spec_specification, openspec_changes_archive_2026_10_18_proton_calendar_sync_specs_proton_sync_spec_document, openspec_changes_archive_2026_10_26_deadline_calendar_specs_proton_sync_spec_document [EXTRACTED 1.00]
- **proton-calendar-sync Implementation Units** — openspec_changes_archive_2026_10_18_proton_calendar_sync_tasks_unit_contract, openspec_changes_archive_2026_10_18_proton_calendar_sync_tasks_unit_cli_worker, openspec_changes_archive_2026_10_18_proton_calendar_sync_tasks_unit_desired_state, openspec_changes_archive_2026_10_18_proton_calendar_sync_tasks_unit_reconciler, openspec_changes_archive_2026_10_18_proton_calendar_sync_tasks_unit_sync_page, openspec_changes_archive_2026_10_18_proton_calendar_sync_tasks_unit_sync_journeys, openspec_changes_archive_2026_10_18_proton_calendar_sync_tasks_unit_release_0_6_0 [EXTRACTED 1.00]
- **Deadline Visibility (bundle, key, calendar marker)** — openspec_changes_archive_2026_10_26_deadline_calendar_proposal_per_aspect_due_bundle, openspec_changes_archive_2026_10_26_deadline_calendar_design_due_item_key, openspec_specs_calendar_spec_due_marker_and_due_list, openspec_specs_proton_sync_spec_due_bundles [INFERRED 0.85]
- **Proton Sync Reconciliation Flow** — openspec_specs_proton_sync_spec_diff_reconciliation, openspec_specs_proton_sync_spec_pass_scheduling, openspec_specs_proton_sync_spec_cli_call_discipline, openspec_specs_proton_sync_spec_sync_state_storage, openspec_specs_proton_sync_spec_one_calendar_per_aspect [EXTRACTED 1.00]
- **Aspect-Bound Link Settings (IT project / Uni class)** — openspec_specs_it_projects_spec_it_aspect_setting, openspec_specs_uni_hub_spec_uni_aspect_setting, openspec_specs_todos_spec_project_link_follows_aspect, openspec_specs_todos_spec_class_link_follows_aspect [INFERRED 0.85]
- **Human Taste Gates Before UI** — openspec_specs_design_direction_spec_approval_before_feature_ui, openspec_specs_design_direction_spec_projects_mockup, openspec_specs_design_direction_spec_uni_mockup, openspec_specs_design_direction_spec_cohesive_look_mockup [EXTRACTED 1.00]

## Communities (161 total, 22 thin omitted)

### Community 0 - "Design Brief and Cohesive Mockup"
Cohesion: 0.06
Nodes (60): Harness (proof, proof:full, run, package, ship: merge), Life-Manager project (CLAUDE.md), src/lib/aspect-style.ts (ASPECT_COLORS, ASPECT_ICONS), Bricolage Grotesque single family (optical size hierarchy), check-contrast.mjs contrast checker, Cohesive look: Proton x C24 (section 12), Context rail layout (sidebar | content | rail at >=1280), Life Manager design brief (+52 more)

### Community 1 - "Svelte Component Imports"
Cohesion: 0.05
Nodes (40): {
		aspects,
		current = null,
		linkCount,
		oncancel,
		onsaved
	}, confirming, dropsLinks, name, selected, describe(), failure, fieldError() (+32 more)

### Community 2 - "Style Tile and Palette Options"
Cohesion: 0.08
Nodes (45): Palette C: Forest and stone, Palette C style tile, Palette D: Lilac and ink, Palette D style tile, Palette E: Clear and vivid, Palette E style tile, Palette options comparison page, Amie (Mobbin reference) (+37 more)

### Community 3 - "Aspects and Projects Services"
Cohesion: 0.08
Nodes (37): Aspect Cards on Wide Screens, Create and Edit Aspects (unique name, fixed palette and icons), Delete Aspects (move todos and rules to target), First-Run Onboarding (aspect presets), aspects Specification, One Proton Calendar per Aspect, aspectUsage(), countAspects() (+29 more)

### Community 4 - "Proton Sync Change and Runtime Specs"
Cohesion: 0.05
Nodes (33): Scope: proton-calendar-sync, life-manager-proton (Homelab-Managment split-off), proton-calendar-sync Change, proton-cli (roman-16/proton-cli) v5.1.0, proton-calendar-sync Delta: app-runtime, Environment Configuration (PORT, DATABASE_PATH, PROTON_CLI, PROTON_PROFILE), proton-calendar-sync Delta: navigation, Verification: proton-calendar-sync (115 scenarios, 3 review rounds) (+25 more)

### Community 5 - "Shared UI Components"
Cohesion: 0.06
Nodes (30): svelte, {
		children,
		rail,
		railTitle,
		wide = false,
		overlay = false
	}, id, open, groups, {
		todos,
		aspects,
		today,
		sprintDays,
		onadd
	}, typing, {
		backlog,
		aspects,
		progress,
		onadd
	} (+22 more)

### Community 6 - "Uni Server Service"
Cohesion: 0.10
Nodes (36): Exams Become Events in the Uni Calendar, setTestNow(), classCounts(), ClassRow, classRules(), classTodos(), ClassValues, countClassLinks() (+28 more)

### Community 7 - "Icons, Sidebar and Day Pickers"
Cohesion: 0.08
Nodes (26): aspectColor(), { day, entries, due, aspects }, editing, entryColor(), {
		month,
		weeks,
		entries,
		due,
		selected,
		today,
		aspects,
		onselect
	}, tablet, WEEKDAYS, { project } (+18 more)

### Community 8 - "Sprint Lifecycle Service"
Cohesion: 0.14
Nodes (32): Unplanned and Deleted Todos Lose Their Event, addToActiveSprint(), blockedBy(), closeReview(), DECISIONS, getActiveSprint(), getSprint(), getTodo() (+24 more)

### Community 9 - "Todo Editor and Backlog Rail"
Cohesion: 0.06
Nodes (30): {
		backlog,
		aspects,
		progress = {},
		canAdd,
		addAction,
		addLabel = 'Add to sprint',
		onadd,
		onreturn,
		testid = 'backlog-rail'
	}, collapsed, failure, groups, matches, query, today, ActionError (+22 more)

### Community 10 - "Week and Board Views"
Cohesion: 0.08
Nodes (25): arrive(), ghost(), leave(), moved, moveForm, PLACEHOLDERS, rendered(), STATUSES (+17 more)

### Community 11 - "Proton Reconciler"
Cohesion: 0.12
Nodes (31): U4 Reconciler and Calendars per Aspect, Design: deadline-calendar, PROTON_COLORS, specHash(), Abort, expectOk(), failedItems(), Failure (+23 more)

### Community 12 - "Sprint Management Change"
Cohesion: 0.09
Nodes (27): Requirement: Mid-sprint changes (add to sprint, move to backlog), Design: sprint-management, Move motion: Svelte crossfade pair + animate:flip with optimistic moved state, Navigation motion via onNavigate + document.startViewTransition, Tokens --rail-width: 340px, --day-col-min: 120px, RailLayout bands: >=1280 docked, 768–1279 overlay, <768 none, removeFromSprint with client-side 5 s undo toast, Proposal: sprint-management (+19 more)

### Community 13 - "Todo Fields and Date Formatting"
Cohesion: 0.08
Nodes (27): dateLabel(), dayLabel(), dayMonth, daysFrom(), dueLabel(), utc(), weekdayShort, weekLabel() (+19 more)

### Community 14 - "Todos Service"
Cohesion: 0.14
Nodes (29): addChecklistItem(), aspectExists(), checklistTodoId(), ClassLink, classLinkFor(), createTodo(), deleteChecklistItem(), getItem() (+21 more)

### Community 15 - "Shared Domain Types"
Cohesion: 0.06
Nodes (31): AddToSprintError, AspectInput, AspectProgress, ChecklistItem, ClassInput, ClassLink, ClassSummary, ClassTodos (+23 more)

### Community 16 - "E2E Seed and Clock Helpers"
Cohesion: 0.15
Nodes (13): ASPECTS, seed(), setClock(), test, waitForHydration(), seedSunday(), LISTS, IT (+5 more)

### Community 17 - "Linked Todos and Meta Panels"
Cohesion: 0.08
Nodes (22): GLYPHS, aspects, showDone, {
		todos,
		today,
		sprintDays,
		title = 'Linked todos',
		testidPrefix = 'project-todos',
		emptyText = 'No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field.',
		top,
		extra,
		readonly = false
	}, total, uid, dateFull, dateShort (+14 more)

### Community 18 - "Quick Add Form"
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

### Community 19 - "Proton E2E Tests"
Cohesion: 0.12
Nodes (20): fake(), FAKE_PROTON_CLI, FAKE_PROTON_DIR, protonOn(), ProtonOnOptions, protonPass(), protonStatus(), LISTS (+12 more)

### Community 20 - "Aspect Styling and Page Header"
Cohesion: 0.14
Nodes (20): ASPECT_COLORS, ASPECT_ICONS, AspectColor, AspectIcon, PRESET_ASPECTS, ASPECT_ERRORS, {
		name = '',
		color = 'sage',
		icon = 'star',
		error
	}, uid (+12 more)

### Community 21 - "Todo Row and Badges"
Cohesion: 0.07
Nodes (19): actionsEl, addError, aspects, checkable, checked, classRef, desktop, done (+11 more)

### Community 22 - "SQLite Database and Proton Tests"
Cohesion: 0.15
Nodes (16): Migrations on Start, Uni Data Model (Migration 4: semesters, classes), getDb(), migrate(), openDb(), resetDb(), calendar(), FAKE (+8 more)

### Community 23 - "CI Gate Workflow"
Cohesion: 0.08
Nodes (25): name, runs-on, steps, runner, jobs, ci, name, on (+17 more)

### Community 24 - "Proton Sync Worker"
Cohesion: 0.13
Nodes (22): Sync worker (debounce 30 s, tick 5 min, backoff, relogin pause), today(), readConfig(), PassOutcome, ProtonConfig, SyncState, SyncStatus, WorkerOptions (+14 more)

### Community 25 - "Proton Sync Journey Tests"
Cohesion: 0.14
Nodes (18): aspect(), classInput(), kinds(), klass(), ok(), ops(), pass(), plan() (+10 more)

### Community 26 - "Recurring Rules and Sprint Start"
Cohesion: 0.19
Nodes (21): Requirement: Planned todos join their week's sprint, Recurring Rules Become Weekly Series, now(), classFor(), columns(), createRule(), deleteRule(), generateInstances() (+13 more)

### Community 27 - "Fake Proton CLI"
Cohesion: 0.14
Nodes (22): proton-calendar-sync Delta: proton-sync (ADDED), Due Date Alone Creates No Event (superseded), Fake proton CLI Contract (v5.1.0 envelope, exit codes 0/1/2/3/5), ACCENTS, bad(), createFake(), injected(), load() (+14 more)

### Community 28 - "Uni Hub Sprint Todos Change"
Cohesion: 0.10
Nodes (22): DeadlineList / listDeadlines Removed, Proposal: uni-hub-sprint-todos, uni-hub-sprint-todos Change, Scope: uni-hub-sprint-todos, Deadline Overview Requirement (REMOVED), uni-hub-sprint-todos Delta: uni-hub, Tasks: uni-hub-sprint-todos, Verification: uni-hub-sprint-todos (22 scenarios, 0 gaps) (+14 more)

### Community 29 - "Semester Sections and Archive"
Cohesion: 0.09
Nodes (18): expanded, {
		semesters,
		counts,
		today
	}, action, adding, archived, classError, confirm, expanded (+10 more)

### Community 30 - "Release Workflow Image Steps"
Cohesion: 0.10
Nodes (21): with, context, file, github-token, images, labels, name, password (+13 more)

### Community 31 - "Uni Hub Change Spec"
Cohesion: 0.12
Nodes (20): uni_aspect_id setting, Uni Hub Proposal, uni-hub capability, Uni Design-Direction Delta Spec, Uni mockup approved before Uni UI, Class card, Delete a class, Delete a semester (+12 more)

### Community 32 - "Desired State and Calendar Month"
Cohesion: 0.20
Nodes (17): U3 Desired State, Tasks: deadline-calendar, archivedRuleIds(), byTime(), CalendarEntry, calendarMonth(), DueTodo, projectionStart() (+9 more)

### Community 33 - "Planning Placement Rule"
Cohesion: 0.11
Nodes (20): Recurring Instances, Recurring Rules per Class (Uni), recurring Specification, Due-This-Week Suggestions, Mid-Sprint Changes, Missed Planned Days Join Next Sprint Unscheduled, Planned Todos Join Their Week's Sprint, Sprint Planning (+12 more)

### Community 34 - "Proton Types, Hash and Packaging"
Cohesion: 0.13
Nodes (11): hash, root, staging, { version }, FAKE, FLAGS, series, base (+3 more)

### Community 35 - "Recurring Rule Form"
Cohesion: 0.10
Nodes (18): aspectId, {
		aspects,
		rule = null,
		oncancel,
		onsaved,
		ondelete
	}, checklist, CLASS_MESSAGES, classes, classId, classShown, endTime (+10 more)

### Community 36 - "OpenSpec Commands and Skills"
Cohesion: 0.23
Nodes (15): OPSX: Apply command, OPSX: Archive command, OPSX: Explore command, OPSX: Propose command, OPSX: Sync command, openspec-apply-change skill, Workspace-planning guard (actionContext.mode), Dated archive move (changesDir/archive/YYYY-MM-DD-<name>) (+7 more)

### Community 37 - "Build Life Manager Runtime Units"
Cohesion: 0.14
Nodes (16): E2E isolation (node build, .e2e/$PORT.db, LM_TEST=1, workers: 1), Types contract (Todo, Sprint, ReviewDecision, Target, Result), Requirement: Environment configuration (PORT, DATABASE_PATH), Requirement: Harness commands (proof, proof:full, dev), Requirement: Health check GET /healthz, Requirement: Migrations on start, Requirement: Node >=22.5 declared (engines.node), Requirement: Persistence across restarts (+8 more)

### Community 38 - "Build Life Manager Scope"
Cohesion: 0.16
Nodes (16): Proposal: build-life-manager, Life Manager app (self-hosted weekly-sprint todo app), Scope: build-life-manager (S1–S23), Homelab deploy split off (LXC + Ansible + nginx), Spec: backlog, Requirement: Approved visual result, Spec: navigation, Requirement: Touch alternatives for every drag (+8 more)

### Community 39 - "Calendar Planning Calendar Spec"
Cohesion: 0.13
Nodes (14): calendar-planning proposal, calendar-planning change (v0.5.0), calendar-planning scope, calendar-planning calendar spec, Requirement: Calendar entries, Requirement: Calendar layouts, Requirement: Month calendar page (/calendar), Requirement: Opening calendar entries (+6 more)

### Community 40 - "Contrast Check Script"
Cohesion: 0.16
Nodes (14): ASPECTS, COHESIVE, dir, files, fromLin(), hex(), load(), lum() (+6 more)

### Community 41 - "Uni Mockup"
Cohesion: 0.19
Nodes (17): Archived semesters group (collapsed, read-only), Aspect colour hook classes (.a-sage … .a-slate), Class badge on todo rows (class icon, name, type), Class card (icon tile, lecturer, open count, next due, exam countdown), Class detail screen (meta, notes, todos, recurring rules), Class form (name, colour+icon, lecturer, room, ECTS, grade, links, exam), Quick add with Class select and Type chip, Context rail at >=1280 (frame.has-rail) (+9 more)

### Community 42 - "Playwright Today and Motion Tests"
Cohesion: 0.12
Nodes (11): navigateAndSwitchView(), transitions(), ASPECTS, expectStarted(), row(), ACTIVE, ASPECTS, db (+3 more)

### Community 43 - "Faster CI Change"
Cohesion: 0.16
Nodes (15): Faster CI Proposal, Gate builds once, Faster CI Scope, Rues-Arcade faster-ci reference (d63b3fb), CI cancels superseded PR runs, CI gate on every change to main, CI Pipeline Delta Spec (faster-ci), Workflows follow the publishing controls (+7 more)

### Community 44 - "Mid-Sprint Changes Delta"
Cohesion: 0.13
Nodes (11): calendar-planning recurring spec delta, Requirement: Recurring instances carry the rule slot, Requirement: Recurring rules (with time slot), calendar-planning sprint-lifecycle spec delta, Requirement: Due-this-week suggestions, Requirement: Mid-sprint changes, Error code review-required, Requirement: Sprint review (carry clears day and slot) (+3 more)

### Community 45 - "Sprint Views and Layout Specs"
Cohesion: 0.12
Nodes (18): uni-hub-sprint-todos Delta: navigation, Aspect Page (/aspects/<id>), Wide Desktop Layout with Context Rail, Backlog Rail on the Sprint Tab, Board View, By-Aspect View, Compact Week Cards, Manage Sheet on Phone (+10 more)

### Community 46 - "Aspect Detail Page"
Cohesion: 0.12
Nodes (15): addForm, adding, all, aspect, backForm, backlogList, { data }, moved (+7 more)

### Community 47 - "Build Life Manager Sprint Specs"
Cohesion: 0.18
Nodes (15): Recurring instances are ordinary todos with rule_id (ON DELETE SET NULL), Requirement: Recurring instances (one per weekday at sprint start), Requirement: Recurring rules (weekly on chosen weekdays), Spec: recurring, Requirement: Due-this-week suggestions, Requirement: Planning (pull backlog todos, start sprint), Spec: sprint-lifecycle, Requirement: Sprint review (carry over / backlog / drop) (+7 more)

### Community 48 - "IT Projects Design"
Cohesion: 0.17
Nodes (16): IT projects design, Migration 2 (it_projects, settings, todos.project_id), Decision: project names reach TodoRow through layout data, src/lib/server/projects.ts contract, Decision: settings table holding it_aspect_id, Decision: tags as JSON array in a TEXT column, Two todo read models (todoColumns, selectTodos), Decision: unlink project on every aspect change, in SQL (+8 more)

### Community 49 - "Calendar Planning Design"
Cohesion: 0.19
Nodes (12): Migration 4 (semesters, classes, class_id/type/revised_at), Two todo read models (todoColumns / selectTodos), Uni data model, Read-only month calendar grid, Calendar Planning Design, Loosened todo day invariant, Placement rule in planning.ts, Proton Calendar sync (split off) (+4 more)

### Community 50 - "Uni Paging Helpers"
Cohesion: 0.19
Nodes (12): Sprint List Paging (6 per page), ClassType, Grade, clampPage(), CLASS_TYPES, daysFrom(), examCountdown(), PAGE_SIZE (+4 more)

### Community 51 - "SvelteKit Server Loads"
Cohesion: 0.12
Nodes (4): @sveltejs/kit, actions, actions, actions

### Community 53 - "Build Life Manager Tasks"
Cohesion: 0.24
Nodes (15): Uni aspect prompt (which aspect holds uni todos), First-run redirect to /welcome when zero aspects, Requirement: Create and edit aspects (name, colour, icon), Requirement: Delete aspects (move todos/rules to target), Requirement: First-run onboarding (six preset aspects), Spec: aspects, Requirement: Backlog view (grouped by aspect, priority then due date), Requirement: Create todos (plain quick-add form) (+7 more)

### Community 54 - "CI and Release Workflow Structure"
Cohesion: 0.14
Nodes (13): concurrency, cancel-in-progress, group, name, permissions, contents, name, on (+5 more)

### Community 55 - "Drag and Drop Module"
Cohesion: 0.13
Nodes (7): canDrag, DragFrom, draggableTodo(), DragPayload, dropZone(), DropZoneOptions, TODO_MIME

### Community 56 - "Mobbin Design References"
Cohesion: 0.25
Nodes (10): Amie working list next to week calendar, Design references (Mobbin) for Life Manager, Flow implications (open scope choices), Jira calendar with 'Unscheduled work' side panel, Linear references (cycles, label dots, properties sidebar, icon/colour popover), Mobbin (design reference library), Things 3 references (grouped areas, two-line rows, area page), Things-style home list as mobile navigation (+2 more)

### Community 57 - "Week and Date Math"
Cohesion: 0.36
Nodes (13): Sprint states planning -> active -> closed (review state derived), Month Calendar Page (/calendar), addDays(), berlinDate, berlinToday(), monthGrid(), parseMonth(), reviewState() (+5 more)

### Community 58 - "CI Life Manager Design"
Cohesion: 0.19
Nodes (15): Current deploy: Ansible checkout + build on Debian LXC, Decision: artifact e2e reuses the existing suite via E2E_APP_DIR, Decision: CI workflow owned in repo, not central, CI life-manager design, Decision: Node major comes from the Homelab nodejs role, Decision: release.yml calls ci.yml via workflow_call, Decision: release = tag v<version>, gate re-run on the tag, Decision: tarball carries production node_modules (+7 more)

### Community 59 - "Time Slot Helpers"
Cohesion: 0.30
Nodes (13): Requirement: Time slot rules, Time Slot Rules, endAfter(), lengthLabel(), nextHour(), plannedLabel(), shiftEnd(), SlotError (+5 more)

### Community 60 - "Aspects Page"
Cohesion: 0.13
Nodes (7): { data }, deleting, editing, error, menuEl, menuFor, Row

### Community 61 - "Sprint Page"
Cohesion: 0.13
Nodes (11): backlog, { data }, daysLeft, doing, failure, moves, placements, progress (+3 more)

### Community 62 - "Uni Sprint Todos E2E"
Cohesion: 0.15
Nodes (7): ASPECTS, PROJECTS, contrast(), luminance(), Rgb, seedClassTodos(), UNI

### Community 63 - "Deadline Calendar Change"
Cohesion: 0.19
Nodes (11): Item Key due:<aspectId>:<date>, deadline-calendar Change, Proposal: deadline-calendar, Scope: deadline-calendar, deadline-calendar Delta: proton-sync, Verification: deadline-calendar (0 gaps), Due Dates Become Bundled All-Day Events per Aspect and Day, Due Bundles Follow Their Todos (+3 more)

### Community 64 - "Dev Dependencies"
Cohesion: 0.14
Nodes (14): devDependencies, @playwright/test@^1.64.1, svelte@^5.57.2, svelte-check@^4.7.6, @sveltejs/kit@^3.1.0, @sveltejs/vite-plugin-svelte@^7.3.1, @types/node@^26.6.5, typescript@^6.0.3 (+6 more)

### Community 65 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): $app/tsconfig, compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, resolveJsonModule, skipLibCheck (+5 more)

### Community 66 - "Class Form"
Cohesion: 0.16
Nodes (13): { cls, error }, color, errorId(), examAt, examDate, examTime, icon, links (+5 more)

### Community 67 - "Class Detail Page"
Cohesion: 0.15
Nodes (11): archived, cls, { data }, deleteForm, deleteMessage, deleting, edit, editing (+3 more)

### Community 68 - "Layout and Motion"
Cohesion: 0.19
Nodes (9): @fontsource-variable/bricolage-grotesque@^5.3.0, @fontsource-variable/bricolage-grotesque, flipOpts(), MOVE_MS, NAV_MS, RAIL_MS, reducedMotion(), [send, receive] (+1 more)

### Community 69 - "Cohesive Look Tokens and Proton Colours"
Cohesion: 0.17
Nodes (10): Accent Proton violet #6d4aff, cohesive-look proposal, cohesive-look change (v0.4.0), cohesive-look design-direction spec delta, Requirement: Design brief grounded in Mobbin, Requirement: Tokens pass contrast (check-contrast.mjs), cohesive-look tasks, design/cohesive-mockup.html (approved 2026-10-18) (+2 more)

### Community 70 - "Cohesive Look UI Primitives"
Cohesion: 0.21
Nodes (9): cohesive-look design, C24 app reference (absent from Mobbin), FieldCard / FieldRow primitive (Proton Pass), PageHeader primitive, Proton apps reference (Mail, Calendar, Drive, Pass), Requirement: One list anatomy, cohesive-look today spec delta, Requirement: Today summary header (+1 more)

### Community 71 - "Proton CLI Runner and Hooks"
Cohesion: 0.24
Nodes (10): U2 CLI Runner, Worker Scheduling, Hooks, handle(), init(), CHILD_ENV, createRunner(), errorLine(), exec(), specFlags() (+2 more)

### Community 72 - "Todos Spec and Aspect Links"
Cohesion: 0.19
Nodes (13): Backlog View (aspect groups, Planned section), backlog Specification, IT Aspect Setting, Class Link Follows the Aspect, Delete Todos, Edit Todos, Link IT Todos to a Project, Link Uni Todos to a Class (Class + Type LEC/EXC/OTH) (+5 more)

### Community 73 - "Design Direction Spec"
Cohesion: 0.23
Nodes (11): C24 (design reference, not on Mobbin), Cohesive Look Mockup (design/cohesive-mockup.html), Design Brief (design/brief.md), Design Tokens and Style Tile, Mobbin, One List Anatomy, Projects Mockup (design/projects-mockup.html), Proton (design reference) (+3 more)

### Community 74 - "Project Status Pill"
Cohesion: 0.17
Nodes (10): confirming, desktop, form, menuOpen, pick(), save(), { status, openCount }, target (+2 more)

### Community 75 - "Today Page"
Cohesion: 0.15
Nodes (11): { data }, daysLeft, groups, inSprint, longDate, onSprintDay, openToday, sprintAspects (+3 more)

### Community 76 - "Release Bump Job"
Cohesion: 0.17
Nodes (12): name, needs, secrets, uses, with, bump, app_id, app_private_key (+4 more)

### Community 77 - "Build Life Manager Design"
Cohesion: 0.17
Nodes (6): Build notes (read before building UI), Design: build-life-manager, Review close in one transaction (carry/backlog/drop), Schema migration 1 (aspects, sprints, recurring_rules, todos, checklist_items), SISTEMA precedent (adapter-node + node:sqlite on homelab), isOverdue()

### Community 78 - "Sprint Management Tasks"
Cohesion: 0.24
Nodes (12): Requirement: Mid-sprint changes, Error code review-required, Sprint-management sprint-lifecycle delta spec, Requirement: Send back from the Sprint tab, addToActiveSprint(db, todoId, today, placement?), BacklogRail.svelte, src/lib/dnd.ts drag-and-drop module, src/lib/motion.ts (send/receive, flip; reduced motion -> 0 ms) (+4 more)

### Community 79 - "Uni Todo Class Links"
Cohesion: 0.17
Nodes (10): ClassRef layout data, Uni Hub Scope, Semester-Class-Todo entity model, Uni Recurring Delta Spec, Recurring rules per class, Class badge on todo rows, Class link follows the aspect, Uni Todos Delta Spec (+2 more)

### Community 80 - "Planned Label and Week Cards"
Cohesion: 0.21
Nodes (12): calendar-planning sprint-views spec delta, Requirement: Board view (planned label on cards), Requirement: Compact week cards (slot only), Requirement: Quiet status and day controls in rows, Requirement: Week-by-day view, Requirement: Planned label on todo rows, Quiet todo row (status glyph, day text), cohesive-look sprint-views spec delta (+4 more)

### Community 81 - "NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, check:watch, dev, package, prepare, preview (+4 more)

### Community 82 - "Todos Form Actions"
Cohesion: 0.26
Nodes (8): actions, classType(), num(), optionalDate(), optionalId(), optionalText(), target(), text()

### Community 83 - "IT Projects Notes and Markdown"
Cohesion: 0.22
Nodes (11): Decision: Markdown via marked with escaped raw HTML (renderMarkdown), Requirement: Create a project, Requirement: Delete a project, Requirement: Edit project metadata, Requirement: Linked todos on the project, Requirement: Project notes, Requirement: Projects overview, IT projects capability spec (+3 more)

### Community 84 - "Desired State Tests"
Cohesion: 0.27
Nodes (7): insert(), rule(), semester(), sprint(), todo(), uniClass(), DesiredItem

### Community 85 - "Calendar Page"
Cohesion: 0.18
Nodes (8): { data }, due, entries, month, monthLabel, picked, selected, tablet

### Community 86 - "Project Detail Page"
Cohesion: 0.18
Nodes (8): { data }, deleteForm, deleting, editing, error, project, uid, wide

### Community 87 - "Project Detail E2E"
Cohesion: 0.20
Nodes (5): ASPECTS, LINKED, OPEN_TODOS, PROJECT, seedProject()

### Community 89 - "Sprint Views E2E"
Cohesion: 0.27
Nodes (7): ASPECTS, day(), expectDocked(), expectStatusInEveryView(), row(), settled(), weekdays()

### Community 90 - "Dependabot Config"
Cohesion: 0.20
Nodes (9): dependency-name, update-types, interval, updates, directory, ignore, package-ecosystem, schedule (+1 more)

### Community 91 - "Release Check-Tag and Publish"
Cohesion: 0.20
Nodes (10): name, outputs, runs-on, jobs, check-tag, publish, ci-run-id, name (+2 more)

### Community 92 - "Sprint Management Flow State"
Cohesion: 0.20
Nodes (9): base, decisions, gate0, gate1, gate2, gate2_notes, learnings, review_log (+1 more)

### Community 93 - "Proton CLI Research Notes"
Cohesion: 0.29
Nodes (8): Proton sync notes (calendar-planning), life-manager01 (LAN host, 192.168.0.223), Proton has no official Calendar API / CalDAV, Proton ToS §2.10 automated-access constraint, roman-16/proton-cli (Go, MIT, v5.1.0), proton-calendar-sync proposal, proton-calendar-sync change (v0.6.0), PROTON_CLI / PROTON_PROFILE configuration

### Community 94 - "Calendar Spec"
Cohesion: 0.31
Nodes (10): deadline-calendar Delta: calendar (MODIFIED), Calendar Entries, Calendar Layouts (dots / titles / rail), Due Marker and Due List, Opening Calendar Entries, Projected Recurring Occurrence, calendar Specification, Recurring Rules (with optional time slot) (+2 more)

### Community 95 - "Runtime Dependencies"
Cohesion: 0.22
Nodes (9): dependencies, marked@^18.1.1, engines, node, name, private, type, version (+1 more)

### Community 96 - "Projects Overview Page"
Cohesion: 0.20
Nodes (9): active, adding, changing, { data }, groups, implemented, itAspect, prompting (+1 more)

### Community 97 - "Sprint Review Page"
Cohesion: 0.22
Nodes (6): closeLabel, { data, form }, decisionOf(), decisions, LABELS, VERBS

### Community 98 - "Journey E2E"
Cohesion: 0.31
Nodes (5): reset(), expectAspectPage(), quickAdd(), row(), seedManaged()

### Community 99 - "Responsive E2E"
Cohesion: 0.22
Nodes (6): ASPECTS, CLASSES, PROJECTS, seedSunday(), SEMESTERS, TODOS

### Community 100 - "Workflow Permissions"
Cohesion: 0.25
Nodes (9): permissions, permissions, permissions, actions, attestations, contents, id-token, packages (+1 more)

### Community 101 - "Release Workflow Steps"
Cohesion: 0.33
Nodes (9): steps, GH_TOKEN, steps, env, id, name, run, uses (+1 more)

### Community 102 - "Design Direction Spike"
Cohesion: 0.33
Nodes (9): Requirement: Approval before feature UI (taste gate), Requirement: Design brief grounded in Mobbin, Requirement: Design tokens and style tile, Spec: design-direction, U2 Design direction spike (taste gate), S14 design/brief.md records motion and wide layout, Requirement: Brief records motion and wide-layout decisions, Spec delta: design-direction (sprint-management) (+1 more)

### Community 103 - "Uni Hub Design"
Cohesion: 0.33
Nodes (8): Archive semester transaction, ColorIconPicker extraction, Uni Hub Design, gradeSummary (ECTS-weighted average), todoWritable helper, uni.ts server contract, Archive a semester, Create and edit a class

### Community 104 - "Rail Layout Pattern"
Cohesion: 0.22
Nodes (9): RailLayout rail / in-column pattern, Reuse of ProjectNotes / LinkedTodos, Uni Navigation Delta Spec, Responsive layout and navigation (seven lists), Uni count in navigation, Wide desktop layout with context rail, Class detail page, Deadline overview (+1 more)

### Community 105 - "Today Quick Add Always"
Cohesion: 0.36
Nodes (8): Today Quick Add Always Proposal, listBacklogDueToday query, QuickAdd defaultDueDate prop, Today Quick Add Always Scope, Today Delta Spec (quick add always), Today view requirement, Today Quick Add Always Tasks, Today Quick Add Always Verification

### Community 106 - "Calendar Planning Flow State"
Cohesion: 0.22
Nodes (8): base, gate0, gate1, gate2, learnings, ship_note, track, triage

### Community 107 - "Calendar Planning Todos Delta"
Cohesion: 0.25
Nodes (8): calendar-planning backlog spec delta, Requirement: Backlog view with Planned section, calendar-planning todos spec delta, Error code day-in-past, Requirement: Planned date and time slot, Slot data model (migration 5), calendar-planning tasks, Migration 5 (irreversible, user_version 5)

### Community 108 - "Proton Calendar Sync Flow State"
Cohesion: 0.22
Nodes (8): base, gate0, gate1, gate2, learnings, ship_note, track, triage

### Community 109 - "Delete Aspect Dialog"
Cohesion: 0.25
Nodes (8): {
		aspect,
		usage,
		targets,
		onclose
	}, error, ERRORS, form, message, moved, plural(), Aspect

### Community 110 - "Calendar Service Tests"
Cohesion: 0.36
Nodes (6): insert(), rule(), semester(), sprint(), todo(), uniClass()

### Community 111 - "Todo Planning E2E"
Cohesion: 0.29
Nodes (4): ASPECTS, editor(), HEALTH, openEditor()

### Community 112 - "Build Life Manager Flow State"
Cohesion: 0.25
Nodes (7): base, gate0, gate1, gate2, learnings, review_log, triage

### Community 113 - "Sprint Rail Delta Spec"
Cohesion: 0.36
Nodes (8): Requirement: Add to the sprint from the rail, Requirement: Aspect progress in group headers, Requirement: Backlog rail on the Sprint tab, Requirement: Manage sheet on phone, Sprint-management sprint-views delta spec, Requirement: Week-by-day view, Requirement: Wide board and week, aspectProgress / backlogCounts queries

### Community 114 - "Today Quick Add Flow State"
Cohesion: 0.25
Nodes (7): base, gate1, gate2, learnings, release, track, triage

### Community 115 - "Proton Sync Task Units"
Cohesion: 0.25
Nodes (5): Tasks: proton-calendar-sync (7 units), U1 Contract: sync tables, types, stubs, fake CLI, test hooks, U7 Release 0.6.0, U6 Sync Journeys, Body

### Community 116 - "OpenSpec Config"
Cohesion: 0.25
Nodes (7): context, rules, design, proposal, specs, tasks, schema

### Community 117 - "IT Projects Spec"
Cohesion: 0.25
Nodes (8): Create a Project, Delete a Project, Linked Todos on the Project (Open/Planned/Done), IT Project Data Model (Migration 2), Project Detail Page, Project Markdown Notes, it-projects Specification, Project Badge on Todo Rows

### Community 118 - "Navigation Spec"
Cohesion: 0.25
Nodes (8): Project Status Pill (backlog/active/paused/implemented), Approved Visual Result, New Todo from the Sidebar, Projects Count in Navigation, Responsive Layout and Navigation (sidebar / phone home list), navigation Specification, Touch Alternatives to Drag, Create Todos (quick add)

### Community 119 - "Proton Sync Spec"
Cohesion: 0.25
Nodes (8): Done Todos Keep Event with Check Mark, Edits Follow the Todo, First-Run Backfill, Works Against Real Proton Account, proton-sync Specification, Sync Through the App, Archive a Semester (read-only), archiveSemester()

### Community 120 - "Markdown Sanitizer"
Cohesion: 0.36
Nodes (6): decodeEntities(), escapeHtml(), marked, NAMED, renderMarkdown(), safeHref()

### Community 122 - "Class Detail E2E"
Cohesion: 0.29
Nodes (4): ASPECTS, CLASS, CLASS_TODOS, seedClass()

### Community 123 - "CI Security Baseline Job"
Cohesion: 0.29
Nodes (7): uses, with, jobs, ci, security-baseline, uses, runner

### Community 124 - "Context Rail Requirement"
Cohesion: 0.43
Nodes (7): Context rail, Sprint-management navigation delta spec, Requirement: Wide desktop layout with context rail, RailLayout.svelte, Gate 2 correction: centred main column on every screen, Requirement: Project detail page, Requirement: Wide desktop layout with context rail (with project detail)

### Community 125 - "IT Projects Flow State"
Cohesion: 0.29
Nodes (6): base, gate0, gate1, gate2, learnings, triage

### Community 126 - "Uni Hub Flow State"
Cohesion: 0.29
Nodes (6): base, gate0, gate1, gate2, learnings, triage

### Community 127 - "Faster CI Flow State"
Cohesion: 0.29
Nodes (6): base, gate1, gate2, learnings, track, triage

### Community 128 - "Uni Sprint Todos Flow State"
Cohesion: 0.29
Nodes (6): base, gate1, gate2, learnings, track, triage

### Community 129 - "Deadline Calendar Flow State"
Cohesion: 0.29
Nodes (6): base, gate1, gate2, learnings, track, triage

### Community 130 - "Motion Spec"
Cohesion: 0.33
Nodes (7): Project Screens Keep Existing Motion, Moves Travel to Their New Place (FLIP/crossfade 200 ms), Navigation Cross-Fades (View Transitions API), prefers-reduced-motion, motion Specification, Add to the Sprint from the Rail, Uni Screens Keep Existing Motion

### Community 131 - "Vite and Vitest Setup"
Cohesion: 0.29
Nodes (4): @sveltejs/adapter-node@^6.0.0, vitest@^5.0.4, @sveltejs/adapter-node, vitest

### Community 132 - "Projects Client Helpers"
Cohesion: 0.29
Nodes (5): OVERVIEW_GROUPS, PROJECT_MESSAGES, PROJECT_STATUSES, STATUS_LABELS, ProjectStatus

### Community 134 - "Aspects E2E"
Cohesion: 0.53
Nodes (4): aspectRow(), expectStyle(), openDelete(), openEdit()

### Community 136 - "Motion Delta Spec"
Cohesion: 0.40
Nodes (6): Requirement: Moves travel to their new place, Requirement: Navigation cross-fades, prefers-reduced-motion: reduce, Sprint-management motion delta spec, View Transitions API (document.startViewTransition), Requirement: Project screens keep the existing motion

### Community 137 - "IT Projects Scope"
Cohesion: 0.40
Nodes (6): Decision: embedded module, not a separate service, IT projects proposal, Decision: ideas are projects in status backlog, Project lifecycle backlog -> active -> paused -> implemented, IT projects scope (S1-S15), Requirement: Project status

### Community 138 - "Proton Sync Design"
Cohesion: 0.60
Nodes (4): proton-calendar-sync design, EventSpec type (hash field order), Migration 6: proton_calendars and proton_items, proton-cli exit codes (2 auth, 3 not found, 5 network)

### Community 140 - "Row Actions E2E"
Cohesion: 0.50
Nodes (4): ASPECTS, openActions(), RECURRING, row()

### Community 142 - "Todos E2E"
Cohesion: 0.60
Nodes (3): editor(), openTodo(), row()

### Community 143 - "CI Triggers"
Cohesion: 0.40
Nodes (5): on, pull_request, push, branches, branches

### Community 146 - "Aspect Progress Counts"
Cohesion: 0.67
Nodes (4): Progress computed server-side (aspectProgress, backlogCounts), Aspect Progress in Group Headers, aspectProgress(), backlogCounts()

### Community 151 - "Recurring Instances Delta"
Cohesion: 0.67
Nodes (3): Requirement: Recurring instances, Sprint-management recurring delta spec, generateInstances carried-first slot assignment

## Ambiguous Edges - Review These
- `Cream paper, stone surfaces, forest-green accent colour scheme` → `Palette A: Cool indigo (current U2 palette)`  [AMBIGUOUS]
  design/palettes/index.html · relation: conceptually_related_to

## Knowledge Gaps
- **101 isolated node(s):** `$app/tsconfig`, `GET /healthz and migrations on start`, `Quick add: plain form, always visible on desktop`, `Navigation: phone home list, 248 px desktop sidebar`, `Mobbin screen references` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1000 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Design: build-life-manager` connect `Build Life Manager Design` to `Build Life Manager Runtime Units`, `Build Life Manager Scope`, `Design Direction Spike`, `Sprint Lifecycle Service`, `Sprint Management Change`, `Todos Service`, `Build Life Manager Sprint Specs`, `Aspect Styling and Page Header`, `Build Life Manager Tasks`, `Drag and Drop Module`, `Mobbin Design References`, `Week and Date Math`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `$app/tsconfig`, `GET /healthz and migrations on start`, `Quick add: plain form, always visible on desktop` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design Brief and Cohesive Mockup` be split into smaller, more focused modules?**
  _Cohesion score 0.056842105263157895 - nodes in this community are weakly interconnected._
- **Why does `CI life-manager tasks` connect `CI and Release Workflow Structure` to `Proton Types, Hash and Packaging`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `Svelte Component Imports` be split into smaller, more focused modules?**
  _Cohesion score 0.04970914859862507 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Vite and Vitest Setup` to `Proton Types, Hash and Packaging`, `Aspects and Projects Services`, `Uni Server Service`, `Sprint Lifecycle Service`, `Proton Reconciler`, `Calendar Service Tests`, `Todos Service`, `Uni Paging Helpers`, `Desired State Tests`, `SQLite Database and Proton Tests`, `Markdown Sanitizer`, `Proton Sync Worker`, `Recurring Rules and Sprint Start`, `Time Slot Helpers`, `Week and Date Math`, `Proton Sync Journey Tests`, `Runtime Dependencies`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Cream paper, stone surfaces, forest-green accent colour scheme` and `Palette A: Cool indigo (current U2 palette)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._