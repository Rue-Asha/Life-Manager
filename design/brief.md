# Design brief — Life Manager

A calm, high-end personal planner for a handful of life aspects and one weekly sprint.
The feel is Things 3: a quiet page, quiet rows, big titles, and colour that belongs only
to the aspects. Mobbin has no Sunsama, Akiflow or Things for web/Mac
(see `openspec/changes/build-life-manager/design-refs.md`), so the desktop and
planning patterns come from Linear, Amie, Todoist and Motion on web.

Applies scope.md Decisions over design-refs.md: **light theme only**, **no keyboard
shortcuts**, **plain quick-add form (no natural-language tokens)**. design-refs.md's
"true dark mode", "printed shortcuts" and "`#aspect !1 fri` parsing" bullets are dropped.

Tokens: `src/lib/styles/tokens.css`. Palette, icons, presets: `src/lib/aspect-style.ts`.
Applied: `design/style-tile.html` (screenshots in `design/shots/`).

## 1. Colour

**Chosen palette: C — Forest and stone** (taste gate 2.5, 2026-10-03; scope.md Decisions).
A botanical journal: cream page, stone-beige sunk surfaces, green-black ink, a deep
forest-green accent `#1f5a44` and moss-and-clay aspects. Its values live in
`src/lib/styles/tokens.css`; A, B, D and E were considered and are kept as the record
under "Palette options" below.
— Lifesum diary on beige with forest-green brand, https://mobbin.com/screens/7f1180e8-1839-4859-90cc-96b966c08c77;
Lifesum cream cards, https://mobbin.com/screens/47f02898-978e-4ff9-a9d0-7d6b32a39a3f;
Lifesum calendar with green-ringed today, https://mobbin.com/screens/3a530be6-95f5-4a70-8eb1-155b5da7275b

- **Cream page, stone surfaces.** `--paper` is cream `#fbf9f4`; the sidebar,
  quick-add field and empty-state boxes sit on `--paper-sunk` (stone `#f0ece2`).
  Dividers are single hairlines (`--line`), never boxes around rows.
  — Things 3 Anytime, https://mobbin.com/screens/9f0d2a69-0445-4c6d-a4ab-94275b5be1b7;
  Lifesum beige sunk surface, https://mobbin.com/screens/7f1180e8-1839-4859-90cc-96b966c08c77
- **Aspects carry the only saturation.** Eight fixed colours (sage, sky, lavender, ochre,
  berry, lagoon, tangerine, slate), each with a 16 % tint mixed `in oklab`. The colour shows up as the
  aspect icon, the aspect dot on a row, the tag chip tint, and the fill of a checked
  checkbox. Everything else is greyscale.
  — Things 3 area page with tinted icon, https://mobbin.com/screens/f16197bf-3c84-4272-8f80-fa8c7c03a2aa;
  Linear label dots, https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759;
  Linear icon/colour popover, https://mobbin.com/screens/a86f5e89-4f58-4e0f-94a5-c2687116c75e
- **Eight colours, not a colour wheel.** A curated set with the selected swatch ringed.
  — ChatGPT project picker (8 colours), https://mobbin.com/screens/cbb0211c-cd4c-4af7-81af-3e37991645ca
- **One accent, forest green (`--accent`).** It marks the primary button, focus rings, the
  selected sidebar item's icon and "today" in the week view. It is deliberately dark and
  low-chroma so it reads as "ink with intent", not as another aspect colour. Todoist uses a
  loud red for the same jobs; we keep the job and drop the loudness.
  — Lifesum forest-green brand on stone, https://mobbin.com/screens/7f1180e8-1839-4859-90cc-96b966c08c77;
  Todoist sidebar + "Add task" primary, https://mobbin.com/screens/9a3efd63-6ad3-48a4-a655-2c5e6c4a8bbe;
  Motion "today" as a solid square date badge, https://mobbin.com/screens/28001df3-b3ba-4ed4-854c-cea779f7ec2f
- **Red means overdue, nothing else.** Overdue due dates are red text at the row's right
  edge. The Today view's overdue section gets a red count in its header. Delete buttons
  use ink, not red, so red always means late.
  — Things 3 Today, red deadline at the right edge, https://mobbin.com/screens/29f65b3c-d42a-4873-a072-ff9de00f0121;
  Todoist overdue section header, https://mobbin.com/screens/fedfc0e2-73d1-42b6-853c-fb41ec5919f7

## 2. Type

- **One family: Bricolage Grotesque.** Its optical-size axis does the hierarchy. At 30–36 px
  it is a characterful, tightly tracked grotesque that gives each page a recognisable
  title. At 15 px it settles into a plain, friendly text face. No second family and no
  monospace. Load it self-hosted in the app (`@fontsource-variable/bricolage-grotesque`,
  U4's call); the style tile uses Google Fonts.
- **Big bold page titles, quiet rows.** Page title 30 px phone / 36 px desktop, bold, with the
  page's icon tinted beside it. Aspect group headers are 17 px semibold. Rows are 15 px
  regular. Metadata is 13 px in `--ink-3`.
  — Things 3 area page title, https://mobbin.com/screens/f16197bf-3c84-4272-8f80-fa8c7c03a2aa;
  Things 3 project detail, https://mobbin.com/screens/56745161-59bd-421d-93ac-e74fa5f7f1b8
- **Relative dates in words.** "Today", "Fri", "4d left", "2d late". The absolute date
  appears only in the editor. Counts and dates use tabular figures.
  — Things 3 "14 days left", https://mobbin.com/screens/56745161-59bd-421d-93ac-e74fa5f7f1b8
- **Sentence case everywhere.** No all-caps labels and no eyebrow text above headings.
  Small grey section labels are written in sentence case.
  — Linear sidebar section labels, https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e

## 3. Spacing and density

- **4 px grid, generous rows.** Rows are at least 44 px (`--row-height`), which is also the
  phone touch target. Lists have no cards; one hairline sits under each group header. Page
  gutter is 16 px on phone and 32 px on desktop, and content is capped at 720 px so a
  desktop list never turns into a spreadsheet.
  — Things 3 Anytime, https://mobbin.com/screens/9f0d2a69-0445-4c6d-a4ab-94275b5be1b7
- **Radius grows with the surface.** Checkbox 5, chip/input 7, button/menu 10, expanded
  card/dialog 16, bottom sheet 22. This avoids one radius on everything.
  — Things 3 expanded to-do card, https://mobbin.com/screens/18b05379-2af1-41ab-afef-0ca4870933c1;
  Todoist quick-add chips (~6 px), https://mobbin.com/screens/9a3efd63-6ad3-48a4-a655-2c5e6c4a8bbe
- **Shadows only on things that float.** The expanded todo, sheets, menus and popovers get a
  shadow. Rows, chips and group headers never do.
  — Things 3 expanded to-do (list dims behind a lifted card), https://mobbin.com/screens/18b05379-2af1-41ab-afef-0ca4870933c1

## 4. Rows and components

- **Todo row.** Left to right: checkbox, then title (one line, ellipsis), then a second line in
  13 px grey (aspect dot + name, only where aspects are mixed; checklist "2/5"; a recurring
  glyph), then due date at the right edge and the priority marker before it.
  — Things 3 two-line row, https://mobbin.com/screens/29f65b3c-d42a-4873-a072-ff9de00f0121;
  Amie right-aligned date chips, https://mobbin.com/screens/1ad438ff-b489-41ba-aa9d-01d7c8b8317d
- **Checkbox: a rounded square that takes the aspect's colour when done.** Unchecked is a
  1.5 px `--line-strong` outline, at least 3:1 on `--paper` and `--paper-hover` (WCAG 1.4.11). Checked fills with the aspect colour and shows a white tick.
  Done rows stay in the list with the title struck through in `--ink-3` until the sprint
  closes. Completing a todo is where the aspect colour appears.
  — Rox filled checkbox + struck-through completed task, https://mobbin.com/screens/9afac370-aa6f-4ff5-9679-9d9d4c02cf3d;
  Rox completion flow, https://mobbin.com/flows/2702b66f-8544-4c03-b2b0-4171f11d3b9f
- **Priority: a three-bar signal glyph in ink.** P1 has three bars filled, P2 two, P3 one,
  and "none" shows nothing. It is never coloured, because red belongs to overdue and colour
  belongs to aspects. ClickUp's coloured flags are the counter-example.
  — Linear signal-bar priority, https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e;
  counter-example ClickUp, https://mobbin.com/screens/dd452938-3574-42ae-8c31-963b42d3b390
- **Aspect group header.** Tinted icon (20 px), name in 17 px semibold, count in grey on the
  right, one hairline below. On an aspect page the same icon grows to 28 px beside the
  page title.
  — Things 3 Anytime area header, https://mobbin.com/screens/9f0d2a69-0445-4c6d-a4ab-94275b5be1b7;
  Amie group headers with counts, https://mobbin.com/screens/1ad438ff-b489-41ba-aa9d-01d7c8b8317d
- **Chips.** There are two kinds. An *aspect tag* has a tinted background, the aspect's icon
  and its name in ink. A *property chip* (date, priority, checklist) is a hairline-outlined
  chip with a grey icon and label. Selected property chips turn ink-filled.
  — Todoist outlined chips row, https://mobbin.com/screens/9a3efd63-6ad3-48a4-a655-2c5e6c4a8bbe;
  Linear dot+text label chips, https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759
- **Buttons.** Primary is accent-filled with white text and 36 px height. Secondary has an
  ink label on `--paper-sunk`. Quiet buttons are a text label only. Labels say what happens
  ("Add todo", "Start sprint", "Carry 4 into next week"). A count goes into the CTA whenever
  the action applies to several items.
  — Todoist Cancel / Add task pair, https://mobbin.com/screens/9a3efd63-6ad3-48a4-a655-2c5e6c4a8bbe;
  Tiimo "Move (5) to Friday", https://mobbin.com/screens/6fbbaf97-0b97-40cb-82c5-d53ea54f842b
- **Quick add: a plain form, always visible on desktop.** A sunk title field ("Add a todo")
  sits at the top of the list. Focusing it expands it in place into a card with notes and a
  chip row (Aspect, Priority, Due, Checklist), plus Cancel and Add todo at the bottom right.
  On phone it is a bottom sheet docked above the keyboard with the same chips. There is no
  token parsing and no shortcut hint.
  — Amie always-visible inline field, https://mobbin.com/screens/bee84100-3923-4963-83a5-0a3b98f77ff4;
  Todoist web quick-add card, https://mobbin.com/screens/9a3efd63-6ad3-48a4-a655-2c5e6c4a8bbe;
  Todoist iOS sheet over keyboard, https://mobbin.com/screens/c0cf3743-238a-46c0-967c-ad91f7df8513
- **Aspect editor.** The icon tile sits inside the left edge of the name field and opens the
  picker. Below it are the 8 colour dots and a 6×4 icon grid recoloured by the chosen dot.
  Colour is never offered as a dropdown.
  — ClickUp Create a Space, https://mobbin.com/screens/64582ed0-451a-4432-bb3c-2317bc289e14;
  Linear popover, https://mobbin.com/screens/a86f5e89-4f58-4e0f-94a5-c2687116c75e;
  counter-example Todoist, https://mobbin.com/screens/71ad4f52-738e-4ebd-97b6-5b04a40d9c0e
- **Icons.** 24 Lucide line icons (ISC), 2 px stroke, round caps. They match Things' and
  Linear's thin monochrome glyphs and are recoloured only by the aspect.
  — Linear icon grid, https://mobbin.com/screens/a86f5e89-4f58-4e0f-94a5-c2687116c75e;
  ChatGPT 30 line icons, https://mobbin.com/screens/cbb0211c-cd4c-4af7-81af-3e37991645ca

## 5. Views

- **Board (To do / Doing / Done)** has three columns on `--paper-sunk` with the column name
  and count on top. Cards are `--paper` with the aspect tag chip, without shadow until lifted
  for a drag. An empty column shows a dashed hairline placeholder.
  — Linear grouped-by-status with counts, https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759
- **Week by day** has seven day columns plus Unscheduled, each with "Mon 6" as the header in
  sentence case with a tabular figure. Today's header is an accent-filled date badge. On
  phone it shows one day at a time with a day strip on top.
  — Asana day columns with per-column add, https://mobbin.com/screens/c3a2ce0b-22ad-4bcf-b13e-9bfd5a87e821;
  Motion today badge, https://mobbin.com/screens/28001df3-b3ba-4ed4-854c-cea779f7ec2f;
  Cherrypick days as rows on phone, https://mobbin.com/screens/9bbc44e4-b706-45d8-8a2f-26548baf235a
- **Planning (desktop)** puts the backlog rail on the right and the draft sprint grouped by
  aspect on the left, with drag across. Each row also has an "Add to sprint" control, which
  is the only path on phone.
  — Jira unscheduled-work panel, https://mobbin.com/screens/5fddb893-f912-443e-bd23-ec673aa6a254;
  Linear cycle picker, https://mobbin.com/flows/337d1b3b-d345-4ab9-8e68-0fb26927b48b
- **Review** is one calm screen. Done items are collapsed and struck through, open items
  sit below with a carry / backlog toggle defaulting to carry, and a counted CTA in the
  footer ("Carry 4, return 2 and close").
  — Tiimo bulk move sheet, https://mobbin.com/screens/6fbbaf97-0b97-40cb-82c5-d53ea54f842b;
  Linear cycle roll-over rule, https://mobbin.com/flows/3e336ef4-2102-4ea8-bdd0-720e4bbae81b

## 6. Navigation

- **Phone: Things-style home list, no tab bar.** The home list has Today, Sprint, Backlog,
  Aspects, Recurring and Projects as rows with tinted icons and right-aligned counts (red count for
  overdue on Today). Rows drill down, and every page has a back chevron to the list.
  — Things 3 home list, https://mobbin.com/screens/70077bc2-0d33-4247-845d-3b656f8fb324
- **Projects is the sixth list (it-projects S14).** It sits after Recurring and before the Aspects
  divider, in the sidebar and in the phone home list, with a folder icon and a grey count of
  *active* projects (0 is shown like any other zero).
  — Things 3 sidebar with project rows and counts, https://mobbin.com/screens/70077bc2-0d33-4247-845d-3b656f8fb324;
  Todoist Browse with per-project counts, https://mobbin.com/screens/7a1c1206-9f30-49c8-84e0-ec5f2d935574
- **Desktop: a 248 px sidebar on `--paper-sunk`.** It holds the same items with grey counts.
  The selected item gets a `--paper` rounded fill and an accent-tinted icon, with no border and
  no left bar. Aspects are listed under a small sentence-case "Aspects" label.
  — Todoist web sidebar, https://mobbin.com/screens/9a3efd63-6ad3-48a4-a655-2c5e6c4a8bbe;
  Linear sidebar, https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e

## 7. Empty states

- **One sentence, no illustration.** It is centred grey text that says what to do next, plus
  one quiet action link ("Your backlog is empty. Add a todo to start planning."). An empty
  aspect group inside a list is a soft `--paper-sunk` rounded box with a line icon and one
  sentence. First run shows the six presets as tappable rows with tinted icon and a check,
  plus "Add your own".
  — Things 3 empty project, https://mobbin.com/screens/3b3a210d-25a0-4603-abba-66c9995c867e;
  Craft inline empty sections, https://mobbin.com/screens/52f90aa9-0074-4a60-9f4b-55d493c86e50;
  Finch choose-areas flow, https://mobbin.com/flows/19212698-61fe-43ca-9144-60c9e73bbcd2
- **One reward moment.** Closing a review with everything done says so in one line
  ("All 12 done. Nice week."). It is the only celebratory copy in the app.
  — Todoist inbox-zero reward, https://mobbin.com/flows/c6e666d6-cd63-4731-99fd-f200b784aa35

## 8. Motion

- **Motion shows where things went, never decorates.** The first brief let motion only
  answer an action; sprint-management (S12/S13) widens that to two more cases: a todo that
  moves travels to its new place, and navigation cross-fades. Durations stay on the
  existing tokens, 120 / 200 / 320 ms with one ease-out curve; Mobbin shows no timings, so
  nothing new was invented. Under `prefers-reduced-motion` every case below is instant.
  - Checking a box: the fill and tick draw in 120 ms, then the title strikes through in
    200 ms. The row stays where it is.
  - Opening a todo: the row expands in place into a 16 px-radius card (320 ms) while the list
    behind dims to `--paper-scrim`. This is the signature interaction.
  - Sheets slide up 320 ms on phone and dialogs fade-scale in 200 ms on desktop.
  - There are no page-load entrances or hover animations on rows; hover only changes the
    background to `--paper-hover`.
  — Things 3 expand-in-place, https://mobbin.com/screens/18b05379-2af1-41ab-afef-0ca4870933c1;
  Rox completion flow, https://mobbin.com/flows/2702b66f-8544-4c03-b2b0-4171f11d3b9f
- **Moves travel (S12).** A todo moving between the backlog rail and the sprint, between
  board columns or between days crossfades to its new place in 200 ms while the gap it left
  closes over the same 200 ms, and the counts update with it. A move the server refuses
  travels back. Drag (desktop only) lifts the card with `--shadow-float` and **no tilt**;
  the target shows a hairline drop slot, not a filled box, and the source closes up as the
  card leaves. Todoist's tilted drag card was looked at and rejected.
  — ClickUp status change flow, https://mobbin.com/flows/1a8d1ee2-e9e2-47da-ba44-b7e37f20de7b;
  Basecamp drop placeholder, https://mobbin.com/flows/0c8d2cf2-4132-42b1-ba65-91a17fed7d35
  (screen 7c517ff9-2478-4b18-8ba7-b7ed515bfecc);
  counter-example Todoist tilted drag, https://mobbin.com/screens/349a1427-9550-4ec9-ab52-d3ddb0fa73a9
- **Navigation cross-fades (S13).** Route changes and the sprint view switch (By aspect /
  Board / Week) cross-fade the content in 120–200 ms through the View Transitions API; a
  browser without it navigates instantly. The rail overlay slides in from the right over
  320 ms while the content reflows, **without a scrim**: the rail is a panel next to the
  work, not a modal over it.
  — Jira sidebar open/close flow, https://mobbin.com/flows/03bcd9ae-4012-41dc-aac6-98673a6fe3d4
  (screen d4a9c031-0cba-41a8-b0f0-63499d51119c)

## 9. Layout

- **Phone (<768 px)** is unchanged: one column, no rail. A screen that needs the rail's
  content brings its own way to it (Sprint: the "Manage" sheet).
- **Wide desktop (≥1280 px): sidebar | content | context rail.** Lists keep the 720 px
  measure, centred in the space between the sidebar and the rail; the context rail (`--rail-width`, 340 px) docks
  at the right edge on `--paper-sunk`, the same stone as the sidebar, so the content sits
  between two quiet surfaces. Each rail answers the screen's question: Sprint → the backlog
  rail plus Unscheduled; Today → this sprint's progress per aspect ("done / total" with a
  hairline bar in the aspect colour); an aspect page → that aspect's colour and counts.
  Board and Week drop the 720 px cap and fill the width, Week in one row. By aspect and
  Board dock the rail; Week keeps it as an overlay (below).
  — Jira "Unscheduled work" rail, https://mobbin.com/screens/5fddb893-f912-443e-bd23-ec673aa6a254;
  Linear cycle + inspector flow, https://mobbin.com/flows/801fe69f-8f59-4bdc-a28a-9837f93fcd39
  (screen 890e49aa-ac99-4fa8-b15c-d21076cbc045);
  ClickUp Planner, https://mobbin.com/screens/87aa6e25-826f-425c-8456-d385d344fc83;
  Todoist Insights panel, https://mobbin.com/screens/46dab991-e521-44bc-984a-c936e31610a8;
  Superlist panes, https://mobbin.com/flows/495f838e-56fa-4539-ae58-4ea2dba639a1
  (screen 73df32d9-dd60-4545-ae47-d09410fd0cfc)
- **Progress per aspect is done / total, not capacity.** There are no estimates in the
  model, so a group header or rail row shows a count and a hairline bar, never points.
  — Jira per-team progress cells, https://mobbin.com/screens/994f09c1-4ca4-4127-8039-af78b1801a94
- **Week in one row, rail as an overlay.** At ≥1280 Mon–Sun sit side by side across the
  full content width (columns at least `--day-col-min`, 120 px) and Unscheduled moves into
  the rail. In Week the rail (Unscheduled above the backlog) stays the toggle + overlay
  panel even at ≥1280: sidebar 248 + docked rail 340 + gutters leave ~628 px at 1280, too
  little for 7 × 120 px, and a week that scrolls sideways hides the weekend (Rue's call
  during the build). Without the docked rail the seven columns get ~138 px each. Switching
  to By aspect or Board docks the rail again, and an open overlay closes when leaving Week,
  so coming back starts closed. Drops from the overlay onto a day work as from the docked
  rail; a busy day scrolls inside its column.
  — Todoist Upcoming, https://mobbin.com/screens/009edfa2-d70c-4e02-a9ee-ba3b81c33a6a;
  Amie list + grid, https://mobbin.com/screens/41dde7c0-c4c4-4f68-a6bc-8c3e50977d13
- **Narrow desktop and tablet (768–1279 px, and Week at every width ≥768): overlay rail.** The rail collapses behind a
  toggle button at the top right of the content; pressing it slides the rail in as a
  floating panel over the content's right edge, without a scrim, and pressing it again
  closes it. The scope named 1024–1279; the overlay also covers 768–1023, the smaller choice
  than a third layout for a band the scope left open.
  — Jira sidebar open/close flow, https://mobbin.com/flows/03bcd9ae-4012-41dc-aac6-98673a6fe3d4
  (screen d4a9c031-0cba-41a8-b0f0-63499d51119c)
- **Every main screen centres its column.** Screens with a docked rail (Today, Sprint By
  aspect, an aspect page) centre the 720 px column between sidebar and rail; screens without
  one (Backlog, Plan, Review, Recurring, Aspects, Welcome) and every screen at 768–1279 px
  centre it in the space right of the sidebar, so no screen has an empty right third and
  switching tabs never shifts the column sideways (Rue at Gate 2). Board and Week are the
  exception: they fill the content width. No screen scrolls horizontally at any width.

## 10. Projects (it-projects S15)

Mockup: `design/projects-mockup.html` (tokens only), screenshots
`design/shots/projects-overview-1600.png`, `projects-overview-375.png`, `projects-detail-1600.png`,
`projects-detail-375.png`. It also shows the first-run IT aspect prompt, the empty state, the new-project
form, the implemented confirm, the phone status sheet, the badge and the six-entry home list. All copy is
English. **Motion is unchanged**: the route cross-fade only; no card-to-detail transition, no collapse
animation, no new durations. Mobbin shows Linear's project status taxonomy, not timings.

- **Overview: cards grouped by status sections.** Section headers (status glyph, 17 px semibold name,
  grey count, one hairline) in the order Active, Backlog, Paused; an empty group is not rendered. Cards
  are hairline-outlined on `--paper`, no shadow, in a grid that fills the centred 720 px column (two per
  row on desktop, one at 375 px). A card shows name, one-line description, plain stone tags, a repo glyph
  and the open-todo count.
  — Linear grouped-by-status headers with counts, https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e;
  Linear In Progress / Todo / Backlog with count badges, https://mobbin.com/screens/212fda35-366e-4dc0-a1d1-3b679659d6ab;
  Linear project statuses as grouped headers, https://mobbin.com/flows/4677eaad-e0aa-4508-8923-bee5b412622d
  (screen 67e3829a-23ce-4e20-a601-ba8959c04d9a);
  Notion gallery of cards with property tags, https://mobbin.com/screens/0bd76f5f-9281-4d76-933e-cafe385ef965
- **Implemented is one collapsed row, "Implemented (n)".** A chevron row under the last section; it
  expands in place, instantly.
  — Things 3 collapsed "2 later projects" row below the project list, https://mobbin.com/screens/70077bc2-0d33-4247-845d-3b656f8fb324
  (the row there is not expandable; ours is)
- **Detail is a single scroll page.** Title, status pill, description, notes rendered as Markdown, then
  linked todos as Open, Planned and a collapsed Done; Delete is a quiet button at the end. No tabs.
  — Linear project overview with description body, https://mobbin.com/screens/fed68772-ccc3-48be-8c28-3691a441728b;
  Things 3 project detail, https://mobbin.com/screens/56745161-59bd-421d-93ac-e74fa5f7f1b8
- **Status is a pill dropdown.** A pill with the state's glyph under the title; the menu lists the four
  states with the current one ticked, any state reachable from any other. Active is the only glyph in
  accent; the rest are grey, so status adds no saturation. On phone the menu is a bottom sheet.
  — Linear "Changing project status" flow, https://mobbin.com/flows/babe3b2d-d8f7-4081-a6b9-c17097ea3e06
  (screen 5bc1daea-c0a9-4e20-8f0d-77163691df63)
- **Metadata sits in a right properties rail at 1280 px and up.** Repo, tags, todo counts, created,
  updated, as label and value rows on `--paper-sunk` (`--rail-width`), the same rail as elsewhere
  (section 9). The detail centres its column between sidebar and rail.
  — Linear project Properties rail, https://mobbin.com/screens/ead350e6-9cb3-4f96-9b57-605402828ef9;
  Linear project overview with rail, https://mobbin.com/screens/fed68772-ccc3-48be-8c28-3691a441728b
- **Below 1280 px the same metadata is a wrapping pill row under the title**, with no overlay toggle:
  repo link, tag chips, created and updated chips, "Edit details".
  — Linear Mobile project pill cluster under the title, https://mobbin.com/screens/f8e3aa03-00f2-4985-a6ae-1055ae0f4144
- **Project badge: muted text with a folder glyph** in the todo row's second line, next to the aspect
  dot; it wraps under the title on phone and turns ink on hover.
  — Things 3 Today with the project name under each task, https://mobbin.com/screens/edf4fbc7-d3e0-4666-a709-4fe12f672689;
  Todoist Today with a project label per task, https://mobbin.com/screens/7ff218cf-1ddd-47ee-9123-72535e5f9283
- **Navigation entry:** see section 6.

## 11. Uni (uni-hub S18)

### Mobbin research (uni-hub 2.1)

Searched with `search_screens` (web and iOS) for semester sections with an archive group, course cards
with countdown and grade, deadline lists, grade summaries, a revised marker, a type chip in a quick-add
and a muted class badge. Every app name below was checked on the returned screen. Mobbin has no
university-specific planner (Saturn Calendar is the only one, and it is a school timetable), so most
patterns come from course platforms (Brilliant, Coursera), planners (Motion, Todoist, ClickUp) and
grouped data views (Mercury, Airtable).

- Brilliant course sections with a collapsed "Archived courses" row, https://mobbin.com/screens/4c4267e5-11b9-42e4-8d5d-85f31a207901
- Saturn Calendar "My Classes": icon, class name, teacher line, https://mobbin.com/screens/e9572bcf-347b-4fd3-8680-eda6f59cb547
- Eventbrite "Your event is in 39 days!" next to a date tile, https://mobbin.com/screens/899b1cf7-679b-44ba-9bd0-d9db9852a4ed
- Coursera course timeline in the right column, "Your next two deadlines · Due in 11 days", https://mobbin.com/screens/b7931f44-6fa5-4920-b892-c9bd340e496a
- Coursera iOS grades list, weight and grade right-aligned per row, https://mobbin.com/screens/58a40a06-8525-46ec-aeb2-d67f838ea306
- Motion right panel of upcoming tasks by date, https://mobbin.com/screens/4ef5e33f-7a9e-4b62-a46a-1a56b3a4e08d
- Todoist iOS "Overdue" group with dates in red, https://mobbin.com/screens/e3664e12-9fd4-4240-aca2-522f44003b9e
- Mercury group headers with count and totals on the right, https://mobbin.com/screens/ee50b360-f122-40cf-8e96-61567d032bc0
- Airtable group headers with an "Avg" figure, https://mobbin.com/screens/7612f4c4-4104-4dbc-8e5f-579dde687f2b
- Handshake "Cumulative GPA: 4.00" as plain text, https://mobbin.com/screens/ed0b9a14-3ce0-4f05-886f-c602e4e0b6b6
- Charma muted "Completed Oct 23, 2023" under each row, https://mobbin.com/screens/07096715-f6a3-4493-b5ac-8ac6bda166e1
- ClickUp relative dates ("4 days ago") in a task list, https://mobbin.com/screens/27113b60-6baf-4b1e-bd2c-3deebad34c58
- ClickUp create-task card: list chip plus a "Task" type chip above the title, https://mobbin.com/screens/f04da4a2-805f-49b3-b5c2-16f36799522e
- Todoist web quick-add with chip row and project select, https://mobbin.com/screens/97edbdf7-2860-4176-9cb8-946b6d886b2a
- Todoist web row with a label under the title, https://mobbin.com/screens/9172d8f0-f57b-4778-ab12-10efefe80c2c
- ClickUp iOS "In Personal List · Today 9:00 PM" meta under the title, https://mobbin.com/screens/ecb1790e-e9b8-494c-8022-224b41476d34
- Reused from section 10: Linear properties rail (ead350e6), Linear Mobile pill cluster (f8e3aa03),
  Things 3 home list (70077bc2), Things 3 Today with project names (edf4fbc7).

## Hand-off notes for feature units

- Components reference tokens only. Aspect colour comes from `ASPECT_COLORS[color].fg` / `.tint`,
  which are `var(...)` strings, so they can go straight into `style:`.
- Icons render as `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round"><path d={ASPECT_ICONS[icon]} /></svg>`.
- Focus is always visible as `box-shadow: var(--ring-focus)` on `:focus-visible`.

## Palette options

**Resolved: C was chosen** (see the top of section 1). A, B, D and E are considered options,
kept with their files as the record. The text below describes the options as they were offered.

Taste-gate revision: Rue asked for alternative palettes. Five options sit side by side in
`design/palettes/index.html` (screenshot `design/shots/palettes-index.png`), each with a full
style tile (`design/palettes/<letter>-<slug>.html`, shots `design/shots/palettes-*.png`). Each
`<letter>-<slug>.css` overrides only colour tokens, scoped to `[data-palette='<letter>']`; whichever
is picked gets folded into `src/lib/styles/tokens.css`. All five keep the fixed decisions: light
theme only, aspects carry the saturation, red only for overdue. New palettes mix tints
`in oklab`, because `in oklch` swings an aspect's hue toward a warm paper's hue.

`node design/palettes/check-contrast.mjs` checks 67 pairs per palette (ink levels on every
paper, accent and overdue text, white on accent, ink on each aspect tint at 4.5:1; aspect icons on
paper, sunk and tint, and the white tick on each aspect at 3:1). B–E pass. **A, as first shipped in
tokens.css, fails 8**: `--ink-3` is 2.8–3.1:1 on the papers (metadata text needs 4.5),
`--overdue` is 4.2–4.4:1 on sunk and overdue-soft, ochre and tangerine sit just under 3:1 on
their tints. If A is kept, these values pass (checked): `--ink-3` `#686e79`, `--overdue` `#c4342a`,
`--aspect-ochre` `#a87712`, `--aspect-tangerine` `#cc6a1a`.
Unchecked checkbox outlines (`--line-strong`) are 1.4–1.6:1 in every palette, a Things-like
choice that falls short of WCAG 1.4.11's 3:1. Folding C into tokens.css raised it from
`#d0c8b8` (1.58:1) to `#948c7d` (3.16:1 on paper, 3.00:1 on paper-hover), the lightest stone of
the same hue that passes; `node design/palettes/check-contrast.mjs --tokens` checks tokens.css
with those two outline pairs added.

- **A — Cool indigo** (considered; `#3a4699`, cool neutrals). The first U2 palette: white, cool greys, muted
  indigo. — Things 3 Anytime, https://mobbin.com/screens/9f0d2a69-0445-4c6d-a4ab-94275b5be1b7;
  Linear sidebar, https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e
- **B — Warm paper** (considered; `#7a4a2b` umber, warm neutrals). A writing desk: warm off-white `#fdfcfa`,
  greige sunk surfaces, graphite ink with a brown undertone, earthy dusty aspects.
  — Notion web warm-grey sidebar and earthy swatch set, https://mobbin.com/screens/f9ac8f67-4813-4e30-9a68-88bbceee49c8;
  Notion muted tinted select chips, https://mobbin.com/screens/fffb95e6-b486-471e-936a-fdfec96f1039;
  Bear Red Graphite theme, https://mobbin.com/screens/eb0ecb23-69b4-4edb-aa50-2057f0fb9567
- **C — Forest and stone** (**chosen**; `#1f5a44` forest green, warm cream neutrals). A botanical journal:
  cream page `#fbf9f4`, stone-beige sunk, green-black ink, moss-and-clay aspects.
  — Lifesum diary on beige with forest-green brand, https://mobbin.com/screens/7f1180e8-1839-4859-90cc-96b966c08c77;
  Lifesum cream cards, https://mobbin.com/screens/47f02898-978e-4ff9-a9d0-7d6b32a39a3f;
  Lifesum calendar with green-ringed today, https://mobbin.com/screens/3a530be6-95f5-4a70-8eb1-155b5da7275b
- **D — Lilac and ink** (considered; `#1d1b26` near-black ink, lilac-tinted neutrals). Soft and kind: white
  page, lilac-grey surfaces, black primary buttons, pastel-leaning aspects with fuller 18 % tints.
  — Tiimo Today with time-of-day pills, https://mobbin.com/screens/f6a61b24-612d-4536-8ca0-375231808968;
  Tiimo remaining tasks, lilac date pill and black counted CTA, https://mobbin.com/screens/f7678d38-0b0e-4451-a6fa-9b1952438e77;
  Tiimo assistant on lilac haze, https://mobbin.com/screens/ed164b6c-6952-48e5-b56b-32a747e08c73
- **E — Clear and vivid** (considered; `#0b63d1` azure, true-neutral greys). Bright daylight: pure white,
  no colour cast in the greys, saturated aspects carried by their tints.
  — Amie web week view with pastel blocks and azure Share, https://mobbin.com/screens/ff9b0ff4-cdf3-465c-9959-eba67c46fa3f;
  Amie event popover, https://mobbin.com/screens/e0aa2b7a-da53-4755-a486-887651fc5e54;
  Things 3 Today, blue add button and red only for deadlines, https://mobbin.com/screens/feadd020-045b-477e-b54f-d4c405995a58

Mobbin has no Craft, Daylio, Fantastical, Notion Calendar or Structured web; searches for them
returned other apps and are not cited. Structured (iOS) was found but its coral accent
collides with overdue red, so it was not used.
