# Design references — Life Manager

Source: Mobbin (MCP search, 2026-10-03). All URLs are exactly as returned by the tool.

**Coverage note.** Mobbin has **Things 3 (iOS only)**, Linear, Todoist, Amie, Motion,
Superlist, Tiimo, Craft, Finch. It has **no Sunsama, no Akiflow** (named searches
returned only unrelated apps), and no Things 3 web/mac. There is also **no
"sprint review / carry-over" screen** anywhere in what Mobbin returned — the
closest analogues are Linear's cycle roll-over setting, Tiimo's bulk "Move (5)
to …" sheet and Todoist's overdue "Reschedule". The planning-ritual feel of
Sunsama/Akiflow is therefore approximated from Amie, Motion, Jira and Asana.

---

## 1. Sprint / week planning (backlog → week)

- **Jira — Calendar with "Unscheduled work" side panel** —
  https://mobbin.com/screens/5fddb893-f912-443e-bd23-ec673aa6a254
  Right-hand panel lists unscheduled items with search + sort, helper line "Drag
  each work item onto the calendar"; the closest thing to Sunsama's backlog rail.
  Take the two-pane split: backlog rail right, week left, drag across.
- **Amie — Working List next to week calendar** —
  https://mobbin.com/screens/bee84100-3923-4963-83a5-0a3b98f77ff4
  Left list is grouped by "No date / Today / Later" with an inline "New todo @list"
  field at the top; row context menu has single-letter shortcuts (D done, H schedule).
  Take: grouped source list + keyboard-first row menu.
- **Linear — Adding an issue to cycle (flow)** —
  https://mobbin.com/flows/337d1b3b-d345-4ab9-8e68-0fb26927b48b
  Cycle is just a property in the right sidebar; picker shows "No cycle / Cycle 1
  Jul 15–Jul 21 / Cycle 2" with date ranges. Take: a non-drag fallback (and the
  mobile path) — "Sprint" as a picker field with the week's date range in it.
- **Cherrypick — "Hold & drag meals to plan your week"** (iOS) —
  https://mobbin.com/screens/9bbc44e4-b706-45d8-8a2f-26548baf235a
  Mon–Sun stacked as empty pill slots, a lifted card being dragged in. Proof that
  drag-to-plan works on a phone when days are rows, not columns.

## 2. Review / shutdown / carry-over

- **Tiimo — bulk move sheet** (iOS) —
  https://mobbin.com/screens/6fbbaf97-0b97-40cb-82c5-d53ea54f842b
  Bottom sheet lists the affected tasks, then a calendar, then one full-width
  primary button with a live count: "Move (5) to Friday, Jan 23". Take the
  count-in-the-CTA pattern for "Carry 4 into next sprint".
- **Linear — Enabling cycles (flow)** —
  https://mobbin.com/flows/3e336ef4-2102-4ea8-bdd0-720e4bbae81b
  Explains the rule in one sentence: unfinished issues "are automatically moved
  to the next cycle". Useful as the default for our per-todo decision (carry by
  default, opt out to backlog) — shows the rule should be stated, not hidden.
- **Todoist — Today with Overdue section + "Reschedule"** (web) —
  https://mobbin.com/screens/fedfc0e2-73d1-42b6-853c-fb41ec5919f7 and flow
  https://mobbin.com/flows/642fa7f4-6e2f-4b77-bcb7-3e612981da0a
  Overdue gets its own section header with a single red text action on the right.
  Take: open items grouped under a header with a group-level action, not per-row buttons only.
- **Rox — Marking a task as complete (flow)** —
  https://mobbin.com/flows/2702b66f-8544-4c03-b2b0-4171f11d3b9f
  Completion → toast with Undo, "All tasks completed" quiet empty state, toggle
  "Show completed" to strike-through list. Take for the "done" half of review:
  done items shown struck-through and dimmed, collapsible.
- **Jira Cloud — Summary tiles** (iOS) —
  https://mobbin.com/screens/70e65408-4923-4c05-8acd-bda458c58602
  Four small tiles ("2 done in the last 7 days", "0 due…") above a donut. Take
  the tile header only (done / carried / returned counts); skip the chart.

## 3. Main list grouped by area/aspect

- **Things 3 — Anytime grouped by area** (iOS) —
  https://mobbin.com/screens/9f0d2a69-0445-4c6d-a4ab-94275b5be1b7
  Bold area header with icon + chevron, hairline rule under it, plain checkbox
  rows, "Show 21 more" truncation per group. This is the core layout to copy.
- **Things 3 — Today with "This Evening" section** (iOS) —
  https://mobbin.com/screens/29f65b3c-d42a-4873-a072-ff9de00f0121
  Each row carries its area as a grey second line ("Work", "Family"); metadata
  icons (notes, checklist, tag) are tiny and grey; deadline flag in red at the
  right edge ("today", "4d left"). Take the two-line row and right-edge deadline.
- **Things 3 — Area page "Work"** (iOS) —
  https://mobbin.com/screens/f16197bf-3c84-4272-8f80-fa8c7c03a2aa
  Large title with area icon tinted in its colour, "•••" next to title, upcoming
  items with "Fri" day chips. Take: aspect page = big tinted icon + title.
- **Linear — Issues grouped by status with coloured label dots** (web) —
  https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759
  Tinted group header bars with count ("Todo 2/3"), labels as small dot + text
  chips. Take the dot+text chip for aspect on desktop dense view.

## 4. Todo detail / editor

- **Things 3 — inline expanded to-do with checklist** (iOS) —
  https://mobbin.com/screens/18b05379-2af1-41ab-afef-0ca4870933c1
  The row expands in place into a white card (list dims behind it): title,
  "Notes" placeholder, checklist with hollow-circle items + drag handles, tag
  pills, then "★ Today 🔔10:00 PM" and a flag icon at the bottom; floating dark
  pill toolbar "Move · trash · •••". The signature interaction to steal.
- **Things 3 — project detail with date + deadline rows** (iOS) —
  https://mobbin.com/screens/56745161-59bd-421d-93ac-e74fa5f7f1b8
  Under the title: calendar row "Fri, Mar 31", flag row "Thu, Mar 30 · 14 days
  left" (relative time in grey), then Notes. Take "N days left" next to due date.
- **Linear — issue detail with properties sidebar** (web), from flow "Adding an
  issue to cycle" — https://mobbin.com/flows/337d1b3b-d345-4ab9-8e68-0fb26927b48b
  (screen IDs a9e8ca62-7809-4deb-a861-9524482dbb54 → 36fcffe3-6e93-499d-a8e0-02fd861221d8).
  Title + body left, properties column right (status, priority, labels, cycle, due date),
  sub-issues as a collapsible block with "0/4". Take for desktop detail pane.
- **Motion — task modal with metadata column** (web) —
  https://mobbin.com/screens/aea77620-3f59-4c42-b7fc-a120caf82dd6
  Rich-text notes left, label/value list right (Priority, Deadline, Labels),
  "Save task ⌘S" with the shortcut printed in the button. Take printed shortcuts.

## 5. Quick capture

- **Todoist — Quick add with natural language** (web) —
  https://mobbin.com/screens/97edbdf7-2860-4176-9cb8-946b6d886b2a
  Typed tokens ("14 Feb", "p1", "@design-request") highlight inline in the title
  and spawn removable chips below; project picker bottom-left, Cancel/Add
  bottom-right. Take: parse `#aspect`, `!p1`, `fri` in the title.
- **Todoist — mobile add sheet over keyboard** (iOS) —
  https://mobbin.com/screens/c0cf3743-238a-46c0-967c-ad91f7df8513
  Title + description, horizontal chip row (Date, Deadline, Priority, Reminder),
  "Inbox ▾" destination left and a round send button right, all docked above the
  keyboard. Direct template for mobile capture (destination = Backlog ▾).
- **Things 3 — draggable "+" button / Add to Inbox** (iOS) —
  https://mobbin.com/screens/7b3b0c24-d817-4909-8cc1-f27edd0c7fac
  Blue floating "+" expands into a radial "Add to Inbox" target; in lists it can
  be dragged to the insertion point (https://mobbin.com/screens/3b3a210d-25a0-4603-abba-66c9995c867e,
  "Tap or drag the plus button to create a new to-do"). Signature delight detail.
- **Amie — inline "New todo @list @2pm" field** (web) —
  https://mobbin.com/screens/bee84100-3923-4963-83a5-0a3b98f77ff4
  Always-visible capture input at the top of the list with a shortcut hint
  ("N") at its right edge. Take for desktop: no modal needed for the common case.

## 6. Aspect (area) management

- **Linear — New project icon/colour popover** (web) —
  https://mobbin.com/screens/a86f5e89-4f58-4e0f-94a5-c2687116c75e
  One popover: Icons/Emojis tabs, a row of ~9 colour dots + custom, search
  field, dense monochrome icon grid; the icon is recoloured by the chosen dot.
  Best single model for "name + colour + icon".
- **ChatGPT — Create project colour + icon picker** (web) —
  https://mobbin.com/screens/cbb0211c-cd4c-4af7-81af-3e37991645ca
  Smaller curated set: 8 colours, 30 line icons, selected colour ringed. Take
  the curated-not-exhaustive size for a personal app.
- **ClickUp — Create a Space** (web) —
  https://mobbin.com/screens/64582ed0-451a-4432-bb3c-2317bc289e14
  Icon tile sits left of the name field and opens the picker; colour swatches
  above the icon search. Take: icon-button-inside-name-field composition.
- **Todoist — Add project** (web) —
  https://mobbin.com/screens/71ad4f52-738e-4ebd-97b6-5b04a40d9c0e
  Counter-example: colour as a dropdown ("● Violet") in a long form. Avoid.

## 7. Empty states & first run

- **Things 3 — empty project** (iOS) —
  https://mobbin.com/screens/3b3a210d-25a0-4603-abba-66c9995c867e
  No illustration: one centered italic grey sentence that teaches the gesture
  ("Tap or drag the plus button…"). Matches the calm tone best.
- **Todoist — "Your peace of mind is priceless"** (web), last screen of the Inbox
  flow — https://mobbin.com/flows/c6e666d6-cd63-4731-99fd-f200b784aa35
  (screen ID 792d0cbb-c14d-4686-976a-286c3fcff451)
  Inbox-zero illustration + reward card "3 tasks completed · 3 more than
  yesterday". Take the reward tone for an empty sprint after review, not for first run.
- **Craft — inline empty sections** (iOS) —
  https://mobbin.com/screens/52f90aa9-0074-4a60-9f4b-55d493c86e50
  Each empty section is a soft grey rounded box with a line icon + one sentence
  ("Your Inbox is clear!…"). Take for empty aspect groups inside the sprint list.
- **Finch — choose areas / starter plan (flows)** (iOS) —
  https://mobbin.com/flows/19212698-61fe-43ca-9144-60c9e73bbcd2 and
  https://mobbin.com/flows/3c1f0562-bf74-4b0a-8d30-8b98ecf11ab5
  First run asks "What areas would you like support with?" as tappable rows
  with emoji + check, then shows a starter list. Take: first run = pick/rename
  3–5 suggested aspects (Health, Uni, Job…), skip the mascot.

## 8. Mobile navigation

- **Things 3 — home list as navigation** (iOS) —
  https://mobbin.com/screens/70077bc2-0d33-4247-845d-3b656f8fb324
  (dark: https://mobbin.com/screens/a5c66118-447c-49b9-9b6b-994d19799f45)
  No tab bar: "Quick Find" search pill, fixed lists (Inbox, Today, Upcoming…,
  coloured icons, counts right-aligned, red badge for overdue), divider, then
  areas. Floating "+" bottom-right. Drill-down with back chevron.
- **Todoist — floating tab bar + FAB** (iOS) —
  https://mobbin.com/screens/c5d9fdb1-36d4-4cdc-a9ea-cd2d14fe8b12
  Four tabs (Inbox, Today, Upcoming, Browse) in a floating rounded bar, active
  tab as filled pill; separate red "+" FAB above it; "Browse" holds projects.
- **Craft — pill tab bar with detached "+"** (iOS) —
  https://mobbin.com/screens/52f90aa9-0074-4a60-9f4b-55d493c86e50
  Icon-only floating capsule with 4 items and the "+" as its own circle to the
  right — compact, thumb-reachable, reads as premium.

---

## Proposed direction

1. **Light-first, Things-calm, with a true dark mode** — white canvas, hairline
   dividers, generous row height (~44px), no cards around list rows; dark mode
   as a straight token swap. (Things 3 Today/Anytime e90634cd…, 9f0d2a69…, dark
   home a5c66118…)
2. **Aspects carry the only saturated colour** — aspect = tinted line icon + a
   small dot/second-line label on rows; everything else greyscale, red reserved
   for deadlines/overdue. (Things 3 Work f16197bf…, Linear label dots 10d46768…,
   Linear icon/colour popover a86f5e89…)
3. **Typography: big bold page titles, quiet rows** — ~28–32px bold titles with
   tinted icon, 15–16px regular rows, grey 13px metadata, relative dates ("4d
   left"). (Things 3 56745161…, 29f65b3c…)
4. **Signature interaction: expand-in-place todo** — clicking/tapping a row
   grows it into a card with notes, checklist, chips and a dimmed list behind;
   desktop adds a Linear-style properties column only in a full-detail view.
   (Things 3 18b05379…, Linear flow 337d1b3b…)
5. **Planning = two-pane ritual on desktop, picker on mobile** — backlog rail on
   one side, the sprint grouped by aspect on the other, drag across; on phone,
   rows with a "Sprint" chip/picker or day-row drag. (Jira 5fddb893…, Amie
   bee84100…, Cherrypick 9bbc44e4…, Linear flow 337d1b3b…)
6. **Review = one calm screen with a counted CTA** — done (struck-through,
   collapsed) above open items; each open row has a carry/backlog toggle
   defaulting to carry; footer button states the outcome ("Carry 4 · return 2").
   (Tiimo 6fbbaf97…, Linear cycles flow 3e336ef4…, Rox flow 2702b66f…, Jira tiles 70e65408…)
7. **Keyboard + natural-language capture** — always-visible inline add with a
   shortcut hint on desktop, `#aspect !1 fri` tokens highlighted inline; mobile
   sheet docked above keyboard with chip row. (Amie bee84100…, Todoist web
   97edbdf7…, Todoist iOS c0cf3743…, Motion ⌘S aea77620…)
8. **Delight in small motions, not illustrations** — FAB that can be dragged to
   an insertion point, toast-with-undo on complete, one-sentence empty states;
   a single celebratory moment at sprint close. (Things 3 7b3b0c24…/3b3a210d…,
   Rox 2702b66f…, Todoist inbox flow c6e666d6…)

## Flow implications (open choices for scope)

- **Today sub-view inside the sprint?** Things 3 and Todoist both centre on
  "Today"; Amie groups by "Today / Later". Do we need a per-day focus inside the
  weekly sprint, or is the week the smallest unit?
- **Drag-to-plan vs picker-to-plan.** Drag on desktop (Jira, Amie) is the
  delightful path; mobile needs a non-drag path (Linear cycle picker). Build
  both, or picker only for v1?
- **Carry-over default.** Linear auto-rolls unfinished work; Sunsama-style asks
  per item. Default every open todo to "carry" with opt-out, or force an
  explicit decision per row?
- **Review gating.** Must the review be completed before the next sprint can be
  planned/started, or can a new week start with an implicit carry-over?
- **Natural-language parsing in quick add** (`#aspect`, priority, date) — in
  v1 scope or later?
- **Keyboard shortcuts** (N new, D done, ⌘K find, single-letter row actions as
  in Amie) — scope for v1?
- **Mobile nav model.** Things-style list-as-home with drill-down (no tab bar)
  vs a 3–4-tab floating bar (Sprint · Backlog · Aspects + FAB). Decide before layout.
- **First-run aspect suggestions.** Offer preset aspects to pick (Finch) or
  start empty with a one-line empty state (Things)?
- **Evening/later split within a group** (Things "This Evening") — want a
  lightweight secondary bucket, or is priority enough?
- **Completed items visibility.** Hide on check (Things), or keep struck-through
  until sprint end (Rox "Show completed")?
