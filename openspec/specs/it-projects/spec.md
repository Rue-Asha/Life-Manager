# it-projects Specification

## Purpose
TBD - created by archiving change it-projects. Update Purpose after archive.
## Requirements
### Requirement: Project data model
Migration 2, appended to `src/lib/server/schema.ts`, SHALL add an `it_projects` table (id, name,
description, repo_url, tags, notes, status ∈ backlog | active | paused | implemented, created_at,
updated_at), a setting holding the IT aspect id, and `todos.project_id INTEGER NULL REFERENCES
it_projects(id) ON DELETE SET NULL`. Migration 3 rebuilds `it_projects` so the status CHECK also allows
`in_progress` (five states: backlog | active | in_progress | paused | implemented), keeping every row and todo
link. Migration 2 only adds; no existing row is rewritten. When the IT
aspect no longer exists the setting reads as unset, exactly as on first run. Both todo read models
(`todoColumns` in `todos.ts` and `selectTodos()` in `sprints.ts`) carry the project link. (S1)

#### Scenario: Migration 2 adds projects without touching existing data
- **WHEN** a database at `user_version` 1 holding aspects, a sprint, a rule, todos and checklist items is opened
- **THEN** it is at `user_version` 2, `it_projects` and the setting exist, every todo has `project_id` NULL, and every pre-existing row reads back unchanged
- **proof:** unit

#### Scenario: Project fields round-trip
- **WHEN** a project is created with name, description, repo URL, two tags and notes
- **THEN** reading it back returns those values, status `backlog`, and `createdAt` equal to `updatedAt`
- **proof:** unit

#### Scenario: Deleting the IT aspect unsets the setting
- **WHEN** the aspect chosen as IT aspect is deleted with its todos moved to another aspect
- **THEN** the IT aspect setting reads as unset and none of the moved todos keeps a project link
- **proof:** unit

#### Scenario: Both todo read models carry the project link
- **WHEN** a linked todo is read through `getTodo`/`listBacklog` and through `listSprintTodos`/`listToday`
- **THEN** each path returns its `projectId`
- **proof:** unit

### Requirement: Projects overview
`/projects` SHALL show one row per project (as signed at gate 5), grouped in cards In progress, Active, Backlog and Paused, in
that order, each with its count, followed by a collapsed group "Implemented (n)". A row shows the name, the description in at most two
lines, up to three tags (then "+n"), "Repository linked" with its glyph if a repo is set, and the open linked todos (linked, not done) as "<n> open" ("No open todos" at zero); the whole row is a link to the project.
Within a group the most recently updated project comes first. An empty group is not rendered. With no
projects at all an empty state offers "New project". Rows are one per line at every width. The IT aspect line with "Change IT aspect" sits in a side panel "IT aspect": a right column from 1280 px and a card stacked below the groups under 1280 px (gate 4 pick a). (S2, S18)

#### Scenario: Cards are grouped by status
- **WHEN** Rue opens `/projects` with one project in each of the five states
- **THEN** sections appear in the order In progress, Active, Backlog, Paused, and below them a collapsed "Implemented (1)" group whose card is shown only after expanding it
- **proof:** e2e

#### Scenario: Row shows the project summary
- **WHEN** a project has a description, two tags, a repo URL and three linked todos of which one is done
- **THEN** its row shows the name, the description in at most two lines, both tags, "Repository linked" and "2 open"
- **proof:** e2e

#### Scenario: Most recently updated project comes first
- **WHEN** two backlog projects exist and the older one is edited
- **THEN** listing projects returns the edited one first within the backlog group
- **proof:** unit

#### Scenario: No projects shows an empty state
- **WHEN** Rue opens `/projects` with the IT aspect set and no projects
- **THEN** an empty state with a "New project" action is shown and no group heading is rendered
- **proof:** e2e

#### Scenario: Empty groups are not rendered
- **WHEN** only active projects exist
- **THEN** the Active section is shown and no Backlog, Paused or Implemented heading is rendered
- **proof:** e2e

#### Scenario: Projects are one row each
- **WHEN** `/projects` with three projects in one group is opened at 375 px and at 1600 px
- **THEN** at both widths every project row's left edge lines up and no two rows share a top edge
- **proof:** e2e

#### Scenario: IT aspect panel sits beside the groups from 1280
- **WHEN** `/projects` with four projects in one group is opened at 1600 px and at 375 px
- **THEN** at 1600 px the "IT aspect" panel's left edge is right of the group card's right edge, and at 375 px the panel starts below the last group
- **proof:** e2e

### Requirement: Create a project
Rue SHALL create a project with a required name and optional description, repo URL and tags. New
projects start in status backlog. A whitespace-only name is rejected with error `required` on `name`; a
repo URL that is not http(s) is rejected with error `invalid` on `repoUrl`; tags are entered as free
text (comma-separated), trimmed, with empties and duplicates dropped. (S3)

#### Scenario: New project lands in Backlog
- **WHEN** Rue chooses "New project" on `/projects`, enters a name and saves
- **THEN** a card with that name appears in the Backlog section
- **proof:** e2e

#### Scenario: Empty project name is rejected
- **WHEN** a project is created with an empty or whitespace-only name
- **THEN** creation fails with error `required` on field `name` and nothing is stored
- **proof:** unit

#### Scenario: Non-http repo URL is rejected
- **WHEN** a project is created with repo URL `ftp://host/repo` or `github.com/x`
- **THEN** creation fails with error `invalid` on field `repoUrl` and nothing is stored
- **proof:** unit

#### Scenario: Tags are trimmed and deduplicated
- **WHEN** a project is created with tags `" svelte, ,sqlite, svelte "`
- **THEN** it is stored with the tags `svelte` and `sqlite`, in that order
- **proof:** unit

### Requirement: Project detail page
Clicking a project row SHALL open `/projects/[id]`, showing the breadcrumb "Projects › Project", the name with the "Project actions" menu, a status pill button (accessible name "Status: <status>. Set status", with a chevron, opening the "Set status" menu), the description, the repo
link (opening in a new tab), the tags, the notes and the linked todos, with the open / planned / done counts as the key-facts card from 768 px. The metadata (repo,
tags, created, updated) sits in a "Details" panel with "Edit details": a right column from 1280 px; below 1280 px a collapsible "Details" disclosure at the top, closed on load (gate 4 pick b), where phones leave out created and updated. There is no rail toggle. An unknown id shows the 404 error page. (S4, S19)

#### Scenario: Card opens the project detail
- **WHEN** Rue clicks a project row on `/projects`
- **THEN** `/projects/<id>` shows the name as heading, the status pill, the description, the tags, the notes and the linked todos, and the repo link has `target="_blank"`
- **proof:** e2e

#### Scenario: Details sit beside the main column at 1280
- **WHEN** a project with repo and tags is opened at 1280 px and at 1600 px
- **THEN** repo, tags, created and updated are shown inside the "Details" panel, whose left edge is right of the main column's right edge
- **proof:** e2e

#### Scenario: Details are a closed disclosure below 1280
- **WHEN** the same project is opened at 1100 px and at 375 px and Rue expands "Details"
- **THEN** before expanding, a "Details" button with `aria-expanded="false"` sits above the notes and no rail toggle exists; after expanding, repo and tags are shown (and at 1100 px created and updated, which 375 px leaves out) without horizontal scroll
- **proof:** e2e

#### Scenario: Unknown project id shows 404
- **WHEN** Rue opens `/projects/999999`
- **THEN** the error page with status 404 is shown
- **proof:** e2e

### Requirement: Edit project metadata
Rue SHALL edit name, description, repo URL and tags on the detail page, with the same validation as
creating a project. A successful edit updates `updated_at`. (S5)

#### Scenario: Edit metadata on the detail page
- **WHEN** Rue changes name, description, repo URL and tags on a project's detail page and saves
- **THEN** the page and, after reload, the overview card show the new values
- **proof:** e2e

#### Scenario: Metadata edit uses the create validation
- **WHEN** a project is updated with a blank name, or with repo URL `ftp://host/repo`
- **THEN** the update fails with `required` on `name` or `invalid` on `repoUrl` and the stored project is unchanged
- **proof:** unit

### Requirement: Project notes
Each project SHALL have one Markdown notes document, shown rendered and toggled into a textarea to edit
and save. Raw HTML in the Markdown is escaped, not rendered. Empty notes show a placeholder prompting
to write; long notes clip behind "Show more" / "Show less" (as signed at gate 5) but are never truncated, expanded they grow with the page. (S6)

#### Scenario: Notes are edited as Markdown and shown rendered
- **WHEN** Rue opens the notes editor, enters `## Ideas` and `- **dark mode**`, and saves
- **THEN** the notes show an `h2` "Ideas" and a list item with bold "dark mode", and after reload the editor holds the raw Markdown
- **proof:** e2e

#### Scenario: Raw HTML in notes is escaped
- **WHEN** notes containing `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>` are rendered
- **THEN** the output contains them as escaped text and no `script` or `img` element
- **proof:** unit

#### Scenario: Empty notes show a placeholder
- **WHEN** a project without notes is opened
- **THEN** a placeholder prompting Rue to write notes is shown in place of the notes
- **proof:** e2e

#### Scenario: Long notes are not truncated
- **WHEN** a project whose notes have 200 lines is opened at 375 px, "Show more" is pressed (collapsed, the notes clip behind "Show more" as signed at gate 5) and the page is scrolled to the end
- **THEN** the last line of the notes is visible and the notes area does not scroll on its own
- **proof:** e2e

### Requirement: Project status
The status SHALL change through a pill dropdown with the five states; any state is reachable from any
other. Moving to implemented while linked todos are open shows a confirm dialog naming the count;
confirming changes the status and leaves the todos untouched, cancelling changes nothing. Without open
todos, and when leaving implemented, no dialog is shown. (S7)

#### Scenario: Status pill offers the five states
- **WHEN** Rue opens the status pill on a backlog project and picks Active
- **THEN** the menu listed Backlog, Active, In progress, Paused and Implemented, and the pill now shows Active
- **proof:** e2e

#### Scenario: Every status transition is allowed
- **WHEN** a project is moved through each of the twenty ordered pairs of distinct states
- **THEN** every change succeeds and updates `updated_at`
- **proof:** unit

#### Scenario: Implemented with open todos asks for confirmation
- **WHEN** Rue picks Implemented on a project with two open linked todos and confirms the dialog
- **THEN** the dialog named 2 open todos, the status is Implemented, and both todos are still open and linked
- **proof:** e2e

#### Scenario: Cancelling the implemented warning changes nothing
- **WHEN** Rue picks Implemented on a project with open linked todos and cancels the dialog
- **THEN** the status is unchanged
- **proof:** e2e

#### Scenario: Implemented without open todos needs no confirmation
- **WHEN** Rue picks Implemented on a project whose linked todos are all done
- **THEN** no dialog is shown and the status is Implemented
- **proof:** e2e

#### Scenario: Reopening an implemented project needs no confirmation
- **WHEN** Rue picks Active on an implemented project with open linked todos
- **THEN** no dialog is shown and the status is Active
- **proof:** e2e

### Requirement: Delete a project
Rue SHALL delete a project from its detail page after a confirm dialog. Linked todos stay and lose their
link; the dialog names how many will be unlinked. (S8)

#### Scenario: Deleting a project asks for confirmation
- **WHEN** Rue chooses delete on a project with three linked todos
- **THEN** the dialog names 3 todos to be unlinked; cancelling keeps the project, confirming removes it and returns to `/projects`
- **proof:** e2e

#### Scenario: Deleting a project unlinks its todos
- **WHEN** a project with linked todos is deleted
- **THEN** those todos still exist with `projectId` null
- **proof:** unit

### Requirement: IT aspect setting
The aspect used for IT todos SHALL be chosen on `/projects`: a prompt on first run (no IT aspect set),
changeable later. Changing it removes every existing todo→project link, after a confirm dialog naming
the count; with no links no dialog is shown. With no aspects at all, `/projects` leads to creating one
(the app's onboarding). (S9)

#### Scenario: First run prompts for the IT aspect
- **WHEN** Rue opens `/projects` with two aspects and no IT aspect set, picks one and saves
- **THEN** the prompt was shown instead of the overview, and afterwards the overview is shown with that aspect named as the IT aspect
- **proof:** e2e

#### Scenario: Changing the IT aspect removes links after confirmation
- **WHEN** Rue changes the IT aspect while two todos are linked to projects and confirms the dialog
- **THEN** the dialog named 2 links, the new aspect is the IT aspect, and no todo has a project link
- **proof:** e2e

#### Scenario: Changing the IT aspect unlinks every todo
- **WHEN** the IT aspect setting is changed to another aspect
- **THEN** every todo's `projectId` is null and the number of removed links is returned
- **proof:** unit

#### Scenario: Changing the IT aspect without links needs no confirmation
- **WHEN** Rue changes the IT aspect while no todo is linked
- **THEN** no dialog is shown and the new aspect is the IT aspect
- **proof:** e2e

#### Scenario: Without aspects Projects leads to creating one
- **WHEN** no aspect exists and Rue opens `/projects`
- **THEN** Rue lands on the onboarding screen where aspects are created
- **proof:** e2e

### Requirement: Linked todos on the project
The detail page SHALL list linked todos in three groups: Open (not in a sprint, not done), Planned (in
a sprint, active or still in planning, not done) and Done (collapsed by default, newest completion first — the project's
history). With no linked todos a short empty state explains how to link one (IT aspect + Project
field). (S13)

#### Scenario: Linked todos are grouped Open, Planned, Done
- **WHEN** a project has a backlog todo, a todo in the active sprint, a todo in a sprint still in planning, and two done todos completed on different days
- **THEN** the project's todos come back as Open with the backlog todo, Planned with both sprint todos, and Done with the later completion first
- **proof:** unit

#### Scenario: Done group starts collapsed
- **WHEN** Rue opens a project with open, planned and done linked todos
- **THEN** Open and Planned rows are visible, Done shows its count and its rows appear only after expanding it
- **proof:** e2e

#### Scenario: Project without linked todos explains linking
- **WHEN** Rue opens a project with no linked todos
- **THEN** an empty state says that todos of the IT aspect can be linked through the Project field
- **proof:** e2e

#### Scenario: Linked todo moves through the project's groups
- **WHEN** during a running sprint Rue creates an IT todo with a project via QuickAdd on the backlog, adds it to the sprint, then ticks it done on Today
- **THEN** the todo shows the project badge in Backlog, Sprint and Today, and the project detail lists it under Open, then Planned, then Done
- **proof:** e2e

### Requirement: Project screens use the family motion
Projects screens SHALL use the route cross-fade from the motion spec for opening a project, and, as signed at gate 5, expanding a collapsed group (Implemented, a project's Done group, the Details disclosure) SHALL grow open in about 220 ms with its content fading in, on the fingerprint motion tokens; under `prefers-reduced-motion: reduce` only the opacity changes. Collapsed content is inert. (S15, S24)

#### Scenario: Opening a project cross-fades and groups expand softly
- **WHEN** with motion allowed Rue clicks a project row and then, back on the overview, expands the Implemented group; then with `prefers-reduced-motion: reduce` collapses and expands it again
- **THEN** `document.startViewTransition` was called once for the navigation, the expand runs an animation or transition that has finished within 300 ms, and under reduced motion the expand changes only opacity (no running animation changes size, `transform`, `translate` or `scale`)
- **proof:** e2e

### Requirement: Projects screen on the fingerprint
`/projects` SHALL render on the fingerprint with projects grouped by status (In progress, Active, Backlog, Paused, then a collapsed Implemented group) and the capture form. With no projects it SHALL show the empty-state heading "No projects yet" and "A project starts in the backlog." with "New project". Before the IT aspect is chosen, only the one-time IT aspect prompt is shown; changing it later keeps its confirmation. "New project" in the page head is a secondary (glass) pill (gate 5, Q3); the IT aspect line sits in the "IT aspect" panel, a right column from 1280 px and a card stacked below the groups under 1280 px (gate 4 pick a). Rows as in "Projects overview". (S18)

#### Scenario: Projects are grouped by status
- **WHEN** one in-progress, two active and one implemented project exist and `/projects` is opened
- **THEN** the groups In progress (1) and Active (2) are listed in that order and Implemented (1) is collapsed with `aria-expanded="false"`
- **proof:** e2e

#### Scenario: No projects shows the capture prompt
- **WHEN** the IT aspect is set and no project exists
- **THEN** the page reads "No projects yet" and "A project starts in the backlog.", and "New project" opens the capture form
- **proof:** e2e

#### Scenario: IT aspect prompt before the first use
- **WHEN** no IT aspect is set and `/projects` is opened
- **THEN** only the prompt "Which aspect holds your IT todos?" with "Use <aspect> for projects" is shown, and after choosing an aspect the overview appears
- **proof:** e2e

#### Scenario: Changing the IT aspect asks first
- **WHEN** a todo is linked to a project and Rue changes the IT aspect to another aspect
- **THEN** the confirmation "Change the IT aspect?" with "Change aspect" appears before anything changes
- **proof:** e2e

#### Scenario: Projects kicker names the section, not the chosen aspect
- **WHEN** Rue opens `/projects` with the IT aspect set to an aspect named "Work"
- **THEN** the kicker above the heading reads "Life" then "IT"
- **proof:** e2e

#### Scenario: Project title hyphenation does not leak to other screens
- **WHEN** Rue opens `/projects` and then follows the Today link
- **THEN** the Today heading does not use automatic hyphenation
- **proof:** e2e

### Requirement: Project page on the fingerprint
`/projects/[id]` SHALL render on the fingerprint with the status menu, description, repo, tags, Markdown notes and the linked todos in Open, Planned and Done. No linked todos SHALL read "No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field."; long notes are never truncated; an unknown id SHALL show the fingerprint 404 page "Project not found" with a link to Projects. (S19) The details sit in a "Details" panel beside the main column from 1280 px and in a collapsible "Details" disclosure at the top, closed, below 1280 px (gate 4 pick b), as in "Project detail page"; the status pill carries a chevron (gate 4 follow-up).

#### Scenario: Project page shows details and linked todos
- **WHEN** a project with a repo, two tags, notes and one open, one planned and one done linked todo is opened
- **THEN** status, description, repo, tags and rendered notes are shown, and Open, Planned and Done each list their todo with Done collapsed
- **proof:** e2e

#### Scenario: Project without linked todos
- **WHEN** a project without linked todos is opened
- **THEN** it reads "No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field."
- **proof:** e2e

#### Scenario: Long notes stay whole on the project page
- **WHEN** a project's notes hold 4,000 characters with an unbroken 80-character URL and the page is opened at 375 px
- **THEN** the full notes are rendered and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Unknown project shows Project not found
- **WHEN** `/projects/99999` is opened
- **THEN** the status is 404 and the page reads "Project not found" with a link "Projects"
- **proof:** e2e

#### Scenario: Linked todo rows name no project and keep their actions
- **WHEN** Rue opens a project page whose Open group holds a linked todo "Wire the router"
- **THEN** the row has no link to the project it already sits under, and its "More actions: Wire the router" menu offers "Plan a day"
- **proof:** e2e

