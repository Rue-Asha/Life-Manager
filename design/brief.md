# Design brief — Life Manager

A calm, high-end personal planner for a handful of life aspects and one weekly sprint.
The feel is Things 3: a white page, quiet rows, big titles, and colour that belongs only
to the aspects. Mobbin has no Sunsama, Akiflow or Things for web/Mac
(see `openspec/changes/build-life-manager/design-refs.md`), so the desktop and
planning patterns come from Linear, Amie, Todoist and Motion on web.

Applies scope.md Decisions over design-refs.md: **light theme only**, **no keyboard
shortcuts**, **plain quick-add form (no natural-language tokens)**. design-refs.md's
"true dark mode", "printed shortcuts" and "`#aspect !1 fri` parsing" bullets are dropped.

Tokens: `src/lib/styles/tokens.css`. Palette, icons, presets: `src/lib/aspect-style.ts`.
Applied: `design/style-tile.html` (screenshots in `design/shots/`).

## 1. Colour

- **White page, cool greys, no cream.** `--paper` is pure white; the sidebar,
  quick-add field and empty-state boxes sit on `--paper-sunk` (a cool `#f4f5f7`).
  Dividers are single hairlines (`--line`), never boxes around rows.
  — Things 3 Anytime, https://mobbin.com/screens/9f0d2a69-0445-4c6d-a4ab-94275b5be1b7;
  Linear sidebar on a barely-grey surface, https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e
- **Aspects carry the only saturation.** Eight fixed colours (sage, sky, lavender, ochre,
  berry, lagoon, tangerine, slate), each with an 11 % tint. The colour shows up as the
  aspect icon, the aspect dot on a row, the tag chip tint, and the fill of a checked
  checkbox. Everything else is greyscale.
  — Things 3 area page with tinted icon, https://mobbin.com/screens/f16197bf-3c84-4272-8f80-fa8c7c03a2aa;
  Linear label dots, https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759;
  Linear icon/colour popover, https://mobbin.com/screens/a86f5e89-4f58-4e0f-94a5-c2687116c75e
- **Eight colours, not a colour wheel.** A curated set with the selected swatch ringed.
  — ChatGPT project picker (8 colours), https://mobbin.com/screens/cbb0211c-cd4c-4af7-81af-3e37991645ca
- **One accent, muted indigo (`--accent`).** It marks the primary button, focus rings, the
  selected sidebar item's icon and "today" in the week view. It is deliberately dark and
  low-chroma so it reads as "ink with intent", not as another aspect colour. Todoist uses a
  loud red for the same jobs; we keep the job and drop the loudness.
  — Todoist sidebar + "Add task" primary, https://mobbin.com/screens/9a3efd63-6ad3-48a4-a655-2c5e6c4a8bbe;
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
  1.5 px `--line-strong` outline. Checked fills with the aspect colour and shows a white tick.
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
  and count on top. Cards are white with the aspect tag chip, without shadow until lifted
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
  Aspects and Recurring as rows with tinted icons and right-aligned counts (red count for
  overdue on Today). Rows drill down, and every page has a back chevron to the list.
  — Things 3 home list, https://mobbin.com/screens/70077bc2-0d33-4247-845d-3b656f8fb324
- **Desktop: a 248 px sidebar on `--paper-sunk`.** It holds the same items with grey counts.
  The selected item gets a white rounded fill and an accent-tinted icon, with no border and
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

- **Motion answers an action, never decorates.** Durations are 120 / 200 / 320 ms with one
  ease-out curve, and all drop to 0 under `prefers-reduced-motion`.
  - Checking a box: the fill and tick draw in 120 ms, then the title strikes through in
    200 ms. The row stays where it is.
  - Opening a todo: the row expands in place into a 16 px-radius card (320 ms) while the list
    behind dims to `--paper-scrim`. This is the signature interaction.
  - Sheets slide up 320 ms on phone and dialogs fade-scale in 200 ms on desktop.
  - Drag (desktop only) lifts the card with `--shadow-float`.
  - There are no page-load entrances or hover animations on rows; hover only changes the
    background to `--paper-hover`.
  — Things 3 expand-in-place, https://mobbin.com/screens/18b05379-2af1-41ab-afef-0ca4870933c1;
  Rox completion flow, https://mobbin.com/flows/2702b66f-8544-4c03-b2b0-4171f11d3b9f

## Hand-off notes for feature units

- Components reference tokens only. Aspect colour comes from `ASPECT_COLORS[color].fg` / `.tint`,
  which are `var(...)` strings, so they can go straight into `style:`.
- Icons render as `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round"><path d={ASPECT_ICONS[icon]} /></svg>`.
- Focus is always visible as `box-shadow: var(--ring-focus)` on `:focus-visible`.
