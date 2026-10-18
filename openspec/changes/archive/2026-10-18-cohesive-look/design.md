## Context

Life Manager was designed as "Things 3 on cream paper" (palette C, forest accent) and built screen by screen.
A walk through every screen at 1440 px and 390 px with seeded data (2026-10-18) shows the drift:

| Frame | What is off today |
|---|---|
| Todo rows (Today, Sprint, Backlog, aspect, project, class) | Each row is its own bordered card with 4 px gaps — the brief said "hairlines, never boxes around rows" |
| Recurring | Bare hairline rows — the one list that followed the brief, so now it's the odd one out |
| Sprint rows | Every row repeats an outlined "To do" chip and a date chip; "Unscheduled" appears as a chip too |
| Backlog rail | Rows boxed, the "+" button sits outside the box, filter input is white-outlined while quick add is sunk-filled |
| Board | Card inside a sunk card, aspect tag hangs below the inner card, status chip duplicates the column |
| Week | Cards ~110 px wide carry the full row anatomy: class names wrap letter by letter, chips stack, "Add a todo" is as loud as a todo |
| Page headers | Sprint's date range floats right of the title; Week pushes the title down with a "Backlog" button above it; Projects indents its subtitle under the title text, Uni under the icon |
| Rails | Stone `--paper-sunk` like the sidebar: Today's progress and the aspect rail are sparse text on beige; project/class "Details" are label/value text without grouping |
| Buttons/inputs | Three input looks (sunk quick add, white outlined filter, outlined chips), "Edit details" is a white pill on stone |

Rue picked the direction in a question round: from **C24** the hero header with one big number, white cards on
grey and bold titles (+ tab bar, deferred, see Open questions); from **Proton** the dark sidebar, calm dense lists,
field cards in details and a strong accent; colour "Hybrid" (cool white/grey, dark sidebar, new accent, aspects
kept); scope "look + components", navigation structure unchanged.

**C24 is not on Mobbin** (searched "C24 Bank", "C24 Smartbanking": only Lloyds, Monzo, Starling, Revolut… came
back; the web shows the 4.0 redesign with 100+ wallpapers but no usable screens). C24 decisions therefore cite
Mobbin screens that show the same pattern. Proton is on Mobbin as web only (Mail, Calendar, Drive, Pass, Settings).

## Goals / Non-Goals

**Goals:**
- One visual system: every frame built from the same five surfaces (canvas, surface, sunk, chrome, accent) and the same list, card, field-card and header primitives.
- Remove noise from rows and cards without removing any control (accessible names stay).
- Give Today and Sprint a "glance" moment (C24 hero) and the shell a recognisable frame (Proton chrome).

**Non-Goals:**
- Dark mode, phone tab bar, new font, new data, motion changes (see proposal).
- Re-laying out Projects/Uni beyond adopting the primitives — their structure was approved in their own mockups.

## Decisions

### 1. Surfaces and tokens (rename + new values)

Five surfaces, light theme:

| Token | Value | Use | Was |
|---|---|---|---|
| `--canvas` | `#f3f4f7` | page background behind cards, board/week lanes | `--paper` (cream) |
| `--surface` | `#ffffff` | grouped cards, rows, rails, dialogs, inputs | `--paper` |
| `--sunk` | `#eceef3` | chips, segmented track, empty boxes, hover on canvas | `--paper-sunk` |
| `--hover` | `#f6f7f9` | row hover on surface | `--paper-hover` |
| `--chrome` | `#1c1730` | sidebar, hero header, toast | new |
| `--chrome-2` / `--chrome-hover` | `#2a2442` | selected/hovered sidebar item, hero bar track | new |
| `--on-chrome` / `--on-chrome-2` | `#ffffff` / `#b8b4cc` | sidebar text / counts, labels | new |
| `--line` / `--line-strong` | `#e3e5eb` / `#8c8f9c` | hairlines / checkbox outline (3.2:1 on surface) | same names |
| `--ink` / `--ink-2` / `--ink-3` | `#17151f` / `#4a4858` / `#63626f` | text (ink-3 ≥ 5.4:1 on canvas) | same names |
| `--accent` / `--accent-hover` / `--accent-soft` | `#6d4aff` / `#5b3be6` / `#efebff` | primary, focus, today, links (5.15:1 on surface; text on `--accent-soft` uses `--accent-hover`) | forest green |
| `--overdue` | `#c42f25` | overdue only | `#b8382a` |

The `--paper*` names are renamed mechanically (`--paper` → `--surface`, `--paper-sunk` → `--sunk`,
`--paper-hover` → `--hover`, `--paper-scrim` → `--scrim`) in one contract task before the restyle units, so
every later unit works against the final names. *Alternative:* keep `--paper*` and change values — smaller diff,
but `--paper` would then mean "white card" while the page is grey, which reads wrong in every future patch.

Aspects re-tuned for white (all ≥ 4.4:1 on surface, ≥ 3:1 everywhere they appear as icons): sage `#3f7f36`,
sky `#2f6f9c`, lavender `#9a4c8f` (moved towards plum so a Uni checkbox never reads as the violet accent — key
and label stay "lavender"), ochre `#9a6c0c`, berry `#b03a5b`, lagoon `#1d766c`, tangerine `#b9531a`,
slate `#5f6870`. Tints stay 16 % `in oklab`, now against `--surface`.
— Proton Mail inbox, white list on violet-ink sidebar, https://mobbin.com/screens/f1689311-286a-43d5-9b58-7e703db7b592;
Proton Drive, one violet primary on the dark sidebar, https://mobbin.com/screens/fe61cd6a-e4e3-4df8-9360-e28b80e43519;
C24 stand-in — Airtasker white cards on grey canvas, https://mobbin.com/screens/98d9c40c-e3c2-4697-931d-95d790b9cd0a;
Asana dark sidebar next to a white board, https://mobbin.com/screens/0a9f2bf5-409a-4af8-9493-531dd6868124

### 2. Shell: Proton chrome sidebar

```
┌──────────────┬───────────────────────────────────────────┬──────────────┐
│ Life Manager │  canvas #f3f4f7                            │ surface rail │
│ [+ New todo] │   Today                       (bold 36)    │ │ This sprint│
│              │   ┌ hero (chrome) ───────────────────────┐ │ │ ┌────────┐ │
│ ☀ Today    1 │   │ 4  open today                        │ │ │ ♥ Health│ │
│ ▦ Sprint   9 │   │ Sprint 3 / 9 done · 3 days left      │ │ │ 1/3 ━━─ │ │
│ ▭ Backlog  6 │   │ ███▒▒▒ ██▒▒ ▒▒ ▒▒ ▒ █               │ │ │ …       │ │
│ ↻ Recurring  │   └───────────────────────────────────────┘ │ └────────┘ │
│ …            │   [ + Add a todo                        ]  │              │
│ Aspects      │   Overdue                              1   │              │
│ ♥ Health   1 │   ┌───────────────────────────────────────┐│              │
│ 🎓 Uni       │   │ ☐ Book dentist   ● Health    ▮▮▮ 2d late││              │
│ …            │   └───────────────────────────────────────┘│              │
└──────────────┴───────────────────────────────────────────┴──────────────┘
```

Sidebar on `--chrome`, 248 px. Top: app name, then a full-width accent "New todo" button (Proton's "New
message" / "New event"). Items in `--on-chrome` at 14 px, counts in `--on-chrome-2`, red count for overdue stays
(`#ff8a80`-ish on chrome is checked by the contrast script as an extra pair). Selected item: `--chrome-hover`
fill, radius 8, white text, icon in its own colour (aspect colour or white). Aspects under a sentence-case label
"Aspects" with a hairline in `--chrome-hover` above. "New todo" opens `Sheet`/dialog with the existing
`QuickAdd` targeting the backlog — no new server code.
— Proton Mail sidebar with "New message" and counts, https://mobbin.com/screens/e0fea5e4-cf4b-4110-8794-1fcc0ab5536b;
Proton Calendar "New event" on chrome, https://mobbin.com/screens/fd9a9a93-b244-41da-b363-6f779e5682ed;
Proton Pass vault list with counts, https://mobbin.com/screens/e5a2c038-4f70-4f56-bf2a-d5f5e56a7ba7

*Alternative:* light sidebar on `--sunk` (today's model, re-coloured). Rejected: Rue chose the dark sidebar, and
it is what gives the app a frame against the now-grey canvas.

### 3. One list anatomy (C24 grouped cards × Proton density)

```
  ♥ Health                                   1 / 3 ━━──
  ┌──────────────────────────────────────────────────────┐
  │ ☐  Book dentist appointment          ○  Tue 13  ▮▮▮ │
  │    ● Health                                   2d late│
  ├──────────────────────────────────────────────────────┤
  │ ☐  Gym — legs                        ○  Thu 15  ▮▮  │
  │    ↻ Recurring                                       │
  ├──────────────────────────────────────────────────────┤
  │ ☑  M̶e̶a̶l̶ ̶p̶r̶e̶p̶                            Mon 12      │
  └──────────────────────────────────────────────────────┘
```

New `ListGroup` primitive (`data-testid="list-group"`): `--surface`, radius 14, no shadow, `overflow: clip`,
rows separated by a `--line` hairline inset to the title's left edge (iOS inset separators). Group header sits
above it on the canvas: icon 20 px, 17 px semibold name, right-aligned count or progress. `TodoRow` loses its
border, margin and radius; hover is `--hover`. The expanded editor still lifts out as the 16 px card with the
scrim. Used by every list in the spec's "One list anatomy" requirement, including Recurring and the backlog rail
(rail rows get their "+" inside the row's trailing slot).
— Todoist iOS widget, rows in one rounded card with hairlines, https://mobbin.com/screens/d830160f-31d4-4753-b2d7-37e3739ff398;
Monzo "Activity" card with rows inside, https://mobbin.com/screens/3bf008da-4e7f-467a-b556-64ebe1aa04fa;
Proton Mail dense hairline rows, https://mobbin.com/screens/ef5134a8-70b3-43e5-93d1-437cc33d7e35

*Alternative:* Proton-pure — rows full-bleed on white with hairlines, no cards. Rejected: without the card the
grey canvas loses its job and aspect groups blur together; the card is the C24 half of the brief.

### 4. Quiet todo row

Left to right: checkbox · title (15 px) over meta line (13 px `--ink-3`: aspect dot+name where mixed, project /
class badge, checklist "0/5", recurring glyph, revised marker) · trailing cluster in fixed slots so they line up down the list: relative due ("2d late" in `--overdue`),
priority bars, day as plain text "Thu 15" (or a calendar icon button "Pick a day" when unscheduled), status glyph
(○ To do, ◐ Doing in `--accent`, ● Done in grey — it stays, because the status menu is how a done todo goes back). `StatusControl`
keeps its native `<select>` but renders a 24 px glyph instead of the labelled pill; its accessible name becomes
"Status: <status>". `DayPicker` renders text instead of an outlined chip. On phone the trailing cluster wraps
under the meta line, left-aligned in reading order (status, day, priority, due).
— Linear status glyph + priority bars in rows, https://mobbin.com/screens/410846e7-09d4-4ed8-baf2-ec94d96c29f4;
Things-style two-line row kept from the brief, https://mobbin.com/screens/29f65b3c-d42a-4873-a072-ff9de00f0121

### 5. Board and Week

Board: columns are `--sunk` lanes (radius 14) on the canvas with "To do 7" headers; cards are `--surface`, radius
10, padding 12: title (two lines max), then one meta line `● Uni · Tomorrow · ▮▮▮` (aspect, due date or else day,
priority), overdue date in red; badges and checklist only in the opened card, because at 1440 px with the docked
rail a lane is ~230 px and a full meta line truncates mid-word (seen in the mockup's first pass). The status
glyph sits at the card's top right (touch status menu); no chip, no tag below. Drag lift stays `--shadow-float`, no tilt.
— Linear board, compact cards with one meta line, https://mobbin.com/screens/410846e7-09d4-4ed8-baf2-ec94d96c29f4;
Todoist board, title + inline meta, https://mobbin.com/screens/81403143-59c8-4506-9094-72a4669c3d9e

Week (≥768 px): day columns on `--surface` with a hairline between them (one white sheet, not seven boxes),
header "Thu 15" with today's number in an accent badge and an `--accent-soft` header band. Todos are one-line
chips 32 px tall: checkbox 14 px, title with ellipsis, aspect dot at the right. A quiet "+" at the column foot.
Phone keeps one day at a time with full rows (status + day picker), since touch has no drag.
— Asana week calendar, one-line task chips per day, https://mobbin.com/screens/c3a2ce0b-22ad-4bcf-b13e-9bfd5a87e821;
Proton Calendar week header with boxed today, https://mobbin.com/screens/fd9a9a93-b244-41da-b363-6f779e5682ed

### 6. Hero summary header (C24)

New `SummaryHeader` primitive on `--chrome`, radius 20, padding 20/24: label in `--on-chrome-2` 13 px, the
figure in 44 px bold tabular `--on-chrome` (C24's balance), a secondary line, and a segmented bar (6 px, gap
2 px) with one segment per aspect, width ∝ its sprint todos, filled ∝ done in the aspect colour over
`--chrome-hover`. Today: figure = open on Today; Sprint: figure = "done / total", line = date range · days left
("days left" = sprint days after today). On phone the hero spans the column (16 px gutters) directly under the
title and drops its context label (the title and the line carry it), so it stays ≤ 125 px; the per-aspect
progress lives in the group headers. Page actions ("Manage", "New semester") move to the back-link row, iOS
nav-bar style, so the title keeps the full width. All data is already loaded by the pages (Today's rail progress, Sprint's todo list); if not, the load
adds counts, no schema change.
— Revolut home, big number on a coloured hero above white cards, https://mobbin.com/screens/5be4e584-20cf-45a5-aade-d505997121b7;
Chime "Available $5.00" on a dark hero, https://mobbin.com/screens/7f32e177-2c9a-4d29-a885-874140ea26d6;
Mercury balance with a thin progress graphic, https://mobbin.com/screens/646c4676-c9c8-403d-86aa-fe93e411daf0

*Alternative:* a white hero card. Rejected: on a grey canvas full of white cards it disappears; the chrome
colour ties it to the sidebar, which is the cohesion move.

### 7. Field cards in rails and details (Proton Pass)

New `FieldCard` primitive: `--surface`, 1 px `--line` border, radius 12; rows of icon 16 px `--ink-3` · label
12 px `--ink-3` above value 14 px `--ink` (Pass layout), hairline between rows; a group per topic. Project
details (Repo · Tags · Todos · Created/Updated), class details (Lecturer/Room · ECTS/Grade · Exam · Links),
aspect rail (Colour · This sprint · Backlog), Today rail (one row per aspect with done/total and a hairline bar),
Uni "Due next" (rows with date right). Below 1280 px the project/class pill row under the title stays (approved
in their mockups) but uses the new chip style. Rails are `--surface` with a hairline left edge.
— Proton Pass item detail, grouped icon + label/value cards, https://mobbin.com/screens/e1dedc83-7827-4530-b5a2-098bf81663fe;
Proton Pass detail with field groups and "More info", https://mobbin.com/screens/e54b93d3-8155-4f37-b5e4-27ac0d7e1a9d

### 8. Page header, segmented control, chips, buttons, inputs

- **PageHeader**: one line title (36 px desktop / 34 px phone, weight 800, tracking -0.025em) with actions
  right-aligned on the same baseline; subtitle under it, aligned with the title text. Entity pages (aspect, class,
  project) put a 44 px icon tile left of the title; list pages drop the icon (the sidebar shows it). Week's
  "Backlog" toggle moves into the actions slot; Sprint's date range moves into the hero.
  — Cleo "Spend" bold title with pill tabs, https://mobbin.com/screens/628a69b6-0842-482e-be0c-51c11601e104;
  Proton settings bold section titles, https://mobbin.com/screens/e6c03bda-f827-40e1-a3ec-ae2481075f53
- **Segmented control** (`ViewSwitch`, Backlog filters): `--sunk` pill track, white thumb with `--shadow-pop`,
  13 px medium; Backlog aspect filters become the same pills scrolling horizontally on phone.
  — Cleo pill tabs, https://mobbin.com/screens/628a69b6-0842-482e-be0c-51c11601e104
- **Chips**: property chip = `--sunk` fill, no border, pill radius, 24 px; aspect tag = tint fill + icon; type
  tag LEC/EXC/OTH unchanged; link chips in `--accent`. Selected = `--chrome` fill, white text.
- **Buttons**: primary `--accent` 36 px radius 10; secondary `--surface` + `--line` border (Proton "Cancel");
  quiet = text in `--ink-2`; destructive stays ink (red is overdue only).
  — Proton dialog Cancel / primary pair, https://mobbin.com/screens/efef0764-c2cc-4b9f-8e48-8ad2f66b8494
- **Inputs**: `--surface` with `--line` border, radius 10, focus = 2 px `--accent` ring; the quick add is a
  white field with "+" on the canvas (one input look everywhere, filter included).
- **Toast**: Proton pill — `--chrome` background, white text, undo action in `--accent-soft`, bottom centre.
  — Proton Mail "Message sent. Undo" toast, https://mobbin.com/screens/e0fea5e4-cf4b-4110-8794-1fcc0ab5536b
- **Cards** (aspects, projects, classes): `--surface`, no border, radius 16, padding 16, no shadow; the dashed
  "New class" tile becomes a dashed `--line-strong` outline on the canvas.

### 9. Phone editor as grouped field rows (C24/iOS)

On phone the todo editor sheet shows title + notes in one `ListGroup`, then a second group of rows
"icon · label · value ›" for Aspect, Day, Due, Priority, Checklist, Class/Type (Uni), Project (IT), and Delete
as a quiet row at the end. Desktop keeps the chip row inside the expanded card.
— Me+ task sheet, grouped rows with value and chevron, https://mobbin.com/screens/91470e45-4c88-4d57-8391-7bca3c65247b;
Structured task detail, grouped rows on a sheet, https://mobbin.com/screens/dbc45f09-9767-46ec-a5ee-9cd0dfcb4263;
Tiimo add-task fields with value pills, https://mobbin.com/screens/dacff541-c6e9-413c-a5e6-20213e5bbb85

## Contracts

Created in the contract task group, used by all restyle groups:

- Tokens (`src/lib/styles/tokens.css`): `--canvas --surface --sunk --hover --scrim --chrome --chrome-hover
  --on-chrome --on-chrome-2 --line --line-strong --ink --ink-2 --ink-3 --accent --accent-hover --accent-soft
  --overdue --overdue-soft`, aspect `--aspect-<key>` / `--aspect-<key>-tint`; radius adds `--radius-group: 14px`.
  `--paper*` no longer exist.
- `src/lib/components/ui/ListGroup.svelte`: `{ children: Snippet; variant?: 'card' | 'outline' }` (outline on white
  rails) → `data-testid="list-group"`; inset hairline above every direct child but the first, or every `ul > li` but
  the first; `--list-inset` sets the inset.
- `src/lib/components/ui/SummaryHeader.svelte`: `{ figure: string; label: string; context?: string; line?: Snippet;
  segments?: { color: AspectColor; total: number; done: number }[] }`; test ids `summary-header`, `summary-figure`,
  `summary-line`, `summary-bar`. `context` shows from 768 px up only.
- `src/lib/components/ui/FieldCard.svelte` (`{ children }`, `data-testid="field-card"`) holding
  `FieldRow.svelte` (`{ label?; icon?: AspectIcon | UiIcon; color?: AspectColor; end?: Snippet; children }`).
- `PageHeader.svelte`: `{ title; subtitle?: string | Snippet; icon?; color?; children? }` — `icon` renders the
  44 px tinted tile (`data-testid="page-icon"`), so only entity pages pass it; `children` are the actions (on the
  back-link row on phone).
- `ASPECT_COLORS[key].bright` → `var(--aspect-<key>-bright)` for icons and bar fills on chrome.
- `StatusControl` accessible name: "Status: <To do|Doing|Done>"; `DayPicker` unscheduled trigger name "Pick a day".

## Risks / Trade-offs

- [e2e selectors that read visible chip text or `--paper-sunk`] → the contract group runs the rename and fixes
  `sprint-rail.test.ts`'s probe; restyle groups update selectors to accessible names in the same unit.
- [Violet accent near the lavender aspect] → lavender re-tuned to plum `#9a4c8f`; mockup shows a Uni group next
  to the accent so Rue judges it at the gate.
- [Dark sidebar reads as "dark mode" against the light-only decision] → the brief states it is chrome; content,
  dialogs and sheets stay light.
- [Hero adds height above the list on phone] → ≤ 125 px on phone (no context label, no legend), no illustration; the first group starts in the first screen.
- [Many components touched in one change] → contract group first, then parallel units on disjoint files; the
  mockup gate catches taste issues before any of them.
- [Week chips hide metadata] → the editor shows everything; status/day remain on the phone rows where touch needs them.

## Migration Plan

Visual only, no data. Ship as v0.4.0 per the release rule; rollback is the previous tag's tarball.

## Open Questions

- **Phone tab bar (C24).** Rue liked it; this change keeps the Things home list so navigation specs stay put. A
  follow-up change could add a 4-item bottom bar (Today, Sprint, Backlog, More) — it would buy one-tap switching
  on the phone at the cost of the `/menu` drill-down and its e2e.
- **Accent hue.** Proton violet `#6d4aff` is the proposal; the mockup shows a deep-blue `#2f5bea` swatch beside it
  so Rue can pick at the gate.
