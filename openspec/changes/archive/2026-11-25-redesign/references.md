# Redesign references (Mobbin)

Structure only: what is on the screen and how the flow steps. No look decisions; the look comes from the fingerprint.
Citation form: flow URL + screen id. Every app name was checked in the result.

## Capture and Today

- **J1 capture** (phone, global add): Superlist "Creating a new task" https://mobbin.com/flows/81926f94-1d7b-4271-bcfc-d639b3251d99 · 57dc18fa-5f94-4e91-a1be-a402917e0c3b shows a bottom bar with a detached add control; 63f4bc4a-8939-4d48-ab69-6aa499dab4fc shows the compose sheet with the title first and optional chips (list, due date) in one row.
- **J1 capture** (phone, add from every screen): ClickUp "Create" https://mobbin.com/flows/b482560f-e282-4b2b-b0a5-6226f15b76d0 · ef4381bc-ea7c-4c86-9480-b8110f04b591 shows a tab bar with a separate create tab; 0e44273f-368a-4510-8de7-dc5c991ab92d shows the sheet it opens, with the primary action pinned at the bottom.
- **J2 Today** (overdue first): Todoist "Today" https://mobbin.com/flows/0a060d26-a86f-4c9c-9216-05518cd1f207 · 7ff218cf-1ddd-47ee-9123-72535e5f9283 shows an Overdue group with its count and a bulk action ahead of today's rows, each row with a check circle and metadata under the title.
- **J2/J4 Today** (day strip): ClickUp "Overdue" https://mobbin.com/flows/8ce1832e-4ef0-4225-bfc6-d54ceffed4f2 · 99d9d5ab-d435-4fa1-aad0-1588f34fb2b8 shows a strip of days with an Overdue chip first, then per-day sections with an inline "create one" in empty days.
- **J2/J4 tick off** (done in place): Me+ "Skipping a task" https://mobbin.com/flows/40df168b-5ab3-4f19-afdb-328fbea497aa · 3c3aaa3e-7415-4dda-a41a-38510733ab61 shows a row swiped open to reveal per-row actions beside a done circle.

## Plan, sprint views, review, backlog

- **J3/J6 plan** (backlog into the week): Numo "Moving backlog tasks to today" https://mobbin.com/flows/5d57c00c-8e88-406f-b928-b6a8f0d9654f · 228b054c-e31f-4905-9a44-e60fd25206d1 lists backlog rows with select circles; 5208d01f-16c0-433a-8568-2eb7ca02a7c1 shows selected rows and a single "Move to today" action above "Add new".
- **J4 board** (status columns, move between): Plane "Changing a status (board view)" https://mobbin.com/flows/675c7f20-98a2-4095-8651-fdf093b92110 · a9d6ca3f-15b3-4827-b5c3-dd4379fa4486 shows columns with a count and "New work item" at each column foot; 49755d68-e23a-408f-b410-5af426694992 shows a card lifted mid-drag between columns.
- **J4 board** (non-drag move): ClickUp "Updating task status (board view)" https://mobbin.com/flows/1a8d1ee2-e9e2-47da-ba44-b7e37f20de7b · d8c3fa69-5813-4ad2-bda8-1973bbaf1bcb shows a grouped board with an add control per column.
- **J4 week** (week, one day at a time): Microsoft Outlook "Choosing a different date" https://mobbin.com/flows/8fafb4b3-38e4-481a-89be-6edfab9dc36f · 7c44fcd6-a3a0-43c8-81a1-dac8619cf607 shows a collapsed week strip with the selected day over a day-grouped body; 5df44b2c-c249-49a6-989e-25f34a8267c9 shows the strip expanded to a month.
- **J4 by aspect** (grouped list with menu moves): no direct hit; the grouped board (Plane a9d6ca3f) and Numo backlog rows cover the grouping structure, and the row menu for "Move to backlog" has no reference of its own.
- **J5 review** (carry over, drop, finish): Tiimo "Completing a review" https://mobbin.com/flows/24c9dd03-5c60-45eb-bded-79e8583e450c · 801f4d99-d0b6-4eb8-bfbc-f166ba3b1eec shows leftover items with checks, one bulk "move" action, a "more options" action and a skip link; 752121c8-6f87-45d9-a1ad-bf1bace82f9a shows the closing state.
- **J6 backlog** (list with add): Numo "Backlog" https://mobbin.com/flows/156ace3b-b2da-4285-8827-55a13d6f7bb3 · fdf30bd1-5a41-48a4-b644-011df49c5273 shows a flat backlog list with a drag handle, a check circle and a bottom "Add new".

## Aspects, recurring, uni, projects, calendar, sync, onboarding

- **J7 aspects** (name, colour, icon picker): Reminders "Creating a new list" https://mobbin.com/flows/abe85abf-3e4c-4d4e-9396-ddcf49cf2ef5 · a74ff30e-6594-4ef4-9839-ea224f3ebea6 shows one sheet with a name field, a colour grid and an icon grid, with cancel and confirm at the top.
- **J7 aspects** (reorder): no reference found; the Numo drag handle (fdf30bd1) shows the handle-per-row idea only.
- **J8 recurring** (weekly rule): Perplexity "Creating a task" https://mobbin.com/flows/da95fbfd-4ba3-477e-8008-a2ec24ee191b · 12c23db7-c262-4674-9e28-8489176355c3 shows a form with Weekly plus a weekday and a time as selects; be80b9f7-f891-44b9-85ef-c8b6180d76c8 shows the rule list with an add control in the header.
- **J9 uni** (classes list): Saturn Calendar "View class" https://mobbin.com/flows/9ca0531f-3e60-44fd-abd0-e55aaff20fd9 · e9572bcf-347b-4fd3-8680-eda6f59cb547 shows a class list with an edit control per filled row and an "Add your class" row for empty ones. Exam date, grade and semester structure have no reference.
- **J10 projects** (status menu): Linear "Changing project status" https://mobbin.com/flows/babe3b2d-d8f7-4081-a6b9-c17097ea3e06 · 5bc1daea-c0a9-4e20-8f0d-77163691df63 shows the status chip opening a menu of statuses with the current one checked.
- **J11 month calendar** (day selection): Microsoft Outlook "Choosing a different date" https://mobbin.com/flows/8fafb4b3-38e4-481a-89be-6edfab9dc36f · 5df44b2c-c249-49a6-989e-25f34a8267c9 shows a month grid with the selected day marked above that day's list.
- **J12 sync status**: no good reference; the Clockwise search (https://mobbin.com/flows/fcc19065-d6a0-48c9-876a-c98ab61727c6) only returned sign-in and log-out screens, no status or re-login-needed state.
- **J13 onboarding** (pick aspects first): Finch "Setting up goals" https://mobbin.com/flows/19212698-61fe-43ca-9144-60c9e73bbcd2 · 440380e1-c53a-4479-bc1a-4f777185dba2 shows a multi-select list of areas with checks and one "Next" below.

## Navigation

- **Phone pill bar with a detached "+"**: Todoist https://mobbin.com/flows/0a060d26-a86f-4c9c-9216-05518cd1f207 · da55b0b7-581f-4b7c-90ea-5e1e57da7c21 shows four tabs in a floating pill with a separate round add button at the lower right; Superlist https://mobbin.com/flows/81926f94-1d7b-4271-bcfc-d639b3251d99 · 57dc18fa-5f94-4e91-a1be-a402917e0c3b puts the add control between the bar's items.
- **Phone More hub**: no reference found; the search for a tab bar with a More tab returned an unrelated app (Play), not cited.
- **Desktop top bar with an overflow menu**: Krea AI "Showing menu" https://mobbin.com/flows/46e654eb-6985-49fa-94c0-383d68ea537f · 99090ec6-f550-4f18-8c2d-a37268cfda55 shows a centred top bar whose item opens a grouped menu panel under it; the "More" label and the "New todo" button have no direct reference.
