## Why

The app grew screen by screen (sprint, projects, uni) and the frames drifted apart: Today, Sprint, Backlog and the
detail pages box every todo row in its own bordered card, Recurring uses bare hairlines, the backlog rail puts its
"+" outside the row, Board cards nest a card inside a sunk card with the aspect tag hanging below, and Week cards
wrap metadata letter by letter ("Opera / ting / Syste / ms"). Each sprint row repeats "To do" and "Unscheduled"
chips, so the lists read busy rather than calm. Rue wants one cohesive look modelled on what they like in
**Proton** (dark sidebar, calm dense lists, field cards in details, a strong accent) and the **C24** app (a hero
header with one big number, white cards on grey, bold titles).

## What Changes

- **New look, light theme only.** A cool grey canvas with white grouped cards replaces the cream page; a deep
  violet-ink sidebar (Proton chrome, not a dark mode) frames the app; a vivid violet accent replaces forest green.
  Aspect colours stay the only saturation and are re-tuned for white; lavender moves towards plum so it no longer
  reads as the accent. All values live in `tokens.css`, checked by `check-contrast.mjs`.
- **One list anatomy everywhere.** Section header above a white grouped card; rows inside it separated by
  hairlines, no per-row border. Applies to Today, Sprint By aspect, Backlog, aspect page, project and class todos,
  Recurring, Plan, Review and the backlog rail.
- **Quieter todo row.** Checkbox · title · one meta line (aspect, badges, checklist, recurring) · trailing date and
  priority. The status shows as a compact glyph button (○ To do, ◐ Doing) and the day as plain text, instead of two
  outlined chips; an unscheduled day is a calendar icon button. Accessible names stay, so every control remains.
- **Board and Week cards are compact.** Board: white card with title and one meta line (aspect dot, date); no status
  chip, no aspect tag below the card. Week: one-line chips (checkbox, title, aspect dot), today's column tinted,
  a small "+" at the column foot.
- **C24 hero header on Today and Sprint.** A violet-ink card with one big tabular number (Today: open today;
  Sprint: done / total) and a segmented bar in the aspect colours.
- **Proton field cards in rails and details.** Project, class and aspect details, Today's sprint progress and Uni's
  "Due next" use bordered groups of icon + label + value rows. Rails become white with a hairline edge.
- **Sidebar "New todo" button** (Proton "New message"): opens the quick add in a dialog that files the todo in the
  backlog.
- **Consistent primitives.** Page header (bold title, subtitle, actions on one line; the sprint date range moves
  into the subtitle, Week's "Backlog" toggle joins the actions), pill segmented control, one chip system, buttons,
  inputs, cards, dark Proton toast, todo editor fields as grouped rows on phone.
- **Design record.** `design/brief.md` gets a "Cohesive look" section citing Mobbin for each decision, and a mockup
  `design/cohesive-mockup.html` is approved by Rue before any restyle unit starts.
- Released as v0.4.0 (visible new look, minor).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `design-direction`: brief direction becomes Proton/C24; new mockup gate for the cohesive look.
- `navigation`: rail surface and edge change; sidebar gains the "New todo" action.
- `today`: summary header with today's open count and sprint progress.
- `sprint-views`: summary header; compact board and week cards; status glyph and day text in rows.

## Non-Goals

- Dark mode — the sidebar is dark chrome, the theme stays light.
- Phone bottom tab bar — Rue liked it in C24, but this change keeps the Things-style home list (see design.md, Open questions).
- New data, fields or server behaviour beyond the sidebar dialog reusing the existing backlog quick add.
- Changing motion: durations, crossfades and the expand-in-place editor stay as specified.
- Changing the font family (Bricolage Grotesque stays; titles get heavier).

## Appetite

One weekend: a mockup evening plus a build day.

## Done criteria

- [ ] `design/cohesive-mockup.html` shows Today, Sprint (all views), Backlog, a project detail, Uni and a class detail at 1440 px and 390 px, and Rue approved it.
- [ ] `node design/palettes/check-contrast.mjs --tokens` passes with the new tokens.
- [ ] No list in the app draws a border around a single todo row; rows sit in grouped white cards.
- [ ] Week cards at 1440 px are one line tall; no metadata wraps inside a day column.
- [ ] Today and Sprint show the hero header; the sidebar "New todo" button adds a backlog todo.
- [ ] `npm run proof:full` is green; v0.4.0 tagged.

## Impact

`src/lib/styles/tokens.css`, `src/app.css`, `src/lib/aspect-style.ts` (colour values only), all components under
`src/lib/components/{ui,shell,todo,sprint,rail,projects,uni,aspects,recurring}`, the route pages for the headers,
`src/routes/+page.server.ts` and `src/routes/sprint/+page.server.ts` only if the hero needs a count they don't
load yet, e2e tests that assert visible chip text or the `--paper-sunk` rail colour, `design/brief.md`,
`design/cohesive-mockup.html`, `design/palettes/check-contrast.mjs`. No schema change.
