## ADDED Requirements

### Requirement: Project data model
Migration 2, appended to `src/lib/server/schema.ts`, SHALL add an `it_projects` table (id, name,
description, repo_url, tags, notes, status ∈ backlog | active | paused | implemented, created_at,
updated_at), a setting holding the IT aspect id, and `todos.project_id INTEGER NULL REFERENCES
it_projects(id) ON DELETE SET NULL`. The migration only adds; no existing row is rewritten. When the IT
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
`/projects` SHALL show one card per project, grouped in sections Active, Backlog and Paused, in that
order, followed by a collapsed group "Implemented (n)". A card shows the name, the description on one
line, the tags, a repo glyph if a repo is set, and the count of open linked todos (linked, not done).
Within a group the most recently updated project comes first. An empty group is not rendered. With no
projects at all an empty state offers "New project". At 375 px there is one card per row; at ≥1280 px
the screen has no context rail and its grid fills the centred content column. (S2)

#### Scenario: Cards are grouped by status
- **WHEN** Rue opens `/projects` with one project in each of the four states
- **THEN** sections appear in the order Active, Backlog, Paused, and below them a collapsed "Implemented (1)" group whose card is shown only after expanding it
- **proof:** e2e

#### Scenario: Card shows the project summary
- **WHEN** a project has a description, two tags, a repo URL and three linked todos of which one is done
- **THEN** its card shows the name, the description on a single line, both tags, a repo glyph and the open count 2
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

#### Scenario: Phone shows one card per row
- **WHEN** `/projects` with three projects in one group is opened at 375 px
- **THEN** every card's left edge lines up and no two cards share a row
- **proof:** e2e

#### Scenario: Wide desktop grid fills the content column
- **WHEN** `/projects` with four projects in one group is opened at 1600 px
- **THEN** the card grid's width equals the content column's width (within 2 px) and its first row holds more than one card
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
Clicking a card SHALL open `/projects/[id]`, showing the name, a status pill, the description, the repo
link (opening in a new tab), the tags, the notes and the linked todos. At ≥1280 px the metadata (repo,
tags, created, updated) sits in the context rail (RailLayout); below 1280 px it is a wrapping row under
the title, with no rail toggle. An unknown id shows the 404 error page. (S4)

#### Scenario: Card opens the project detail
- **WHEN** Rue clicks a project card on `/projects`
- **THEN** `/projects/<id>` shows the name as heading, the status pill, the description, the tags, the notes and the linked todos, and the repo link has `target="_blank"`
- **proof:** e2e

#### Scenario: Metadata sits in the rail at 1280
- **WHEN** a project with repo and tags is opened at 1280 px and at 1600 px
- **THEN** repo, tags, created and updated are shown inside the docked context rail
- **proof:** e2e

#### Scenario: Metadata wraps under the title below 1280
- **WHEN** the same project is opened at 1100 px and at 375 px
- **THEN** no rail and no rail toggle are shown, and repo, tags, created and updated are shown in a row below the heading without horizontal scroll
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
to write; long notes are never truncated, the page scrolls. (S6)

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
- **WHEN** a project whose notes have 200 lines is opened at 375 px and the page is scrolled to the end
- **THEN** the last line of the notes is visible and the notes area does not scroll on its own
- **proof:** e2e

### Requirement: Project status
The status SHALL change through a pill dropdown with the four states; any state is reachable from any
other. Moving to implemented while linked todos are open shows a confirm dialog naming the count;
confirming changes the status and leaves the todos untouched, cancelling changes nothing. Without open
todos, and when leaving implemented, no dialog is shown. (S7)

#### Scenario: Status pill offers the four states
- **WHEN** Rue opens the status pill on a backlog project and picks Active
- **THEN** the menu listed Backlog, Active, Paused and Implemented, and the pill now shows Active
- **proof:** e2e

#### Scenario: Every status transition is allowed
- **WHEN** a project is moved through each of the twelve ordered pairs of distinct states
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

### Requirement: Project screens keep the existing motion
Projects screens SHALL use only the route cross-fade from the motion spec; opening a card and expanding
a collapsed group do not animate. (S15)

#### Scenario: Opening a project uses only the route cross-fade
- **WHEN** with motion allowed Rue clicks a project card and then expands the Implemented group on the overview
- **THEN** `document.startViewTransition` was called once for the navigation and no other animation is running after either action
- **proof:** e2e
