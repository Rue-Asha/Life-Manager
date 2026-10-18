## MODIFIED Requirements

### Requirement: Design brief grounded in Mobbin
A design brief SHALL define the visual direction, citing a Mobbin reference for every aesthetic decision. Since
cohesive-look the direction is calm and dense like Proton (dark violet-ink sidebar, quiet hairline lists, field
cards in details, one vivid accent) with C24's hero header, white cards on a grey canvas and bold titles; the
earlier Things 3 / Sunsama-Akiflow sections stay as the record where cohesive-look does not replace them. It MUST
follow `scope.md` Decisions where `design-refs.md` conflicts: light theme only (a dark sidebar is chrome, not a
dark mode), no keyboard shortcuts, no natural-language quick add. Where the reference app is not on Mobbin
(C24), the brief says so and cites the Mobbin screens that show the same pattern. (S2, cohesive-look)

#### Scenario: Brief cites a reference for every decision
- **WHEN** Rue reads `design/brief.md`
- **THEN** every aesthetic decision (colour, type, spacing, row layout, navigation, empty states, motion) cites at least one Mobbin URL
- **AND** it contains no dark-mode, keyboard-shortcut or natural-language-parsing direction
- **proof:** manual (taste document, judged by Rue)

#### Scenario: Cohesive-look section cites Proton and C24-like references
- **WHEN** Rue reads the "Cohesive look" section of `design/brief.md`
- **THEN** each of its decisions (canvas and cards, sidebar chrome, accent, aspect re-tune, list anatomy, todo row, board and week cards, hero header, field cards, page header, segmented control, chips, buttons, inputs, toast, phone editor) cites at least one Mobbin URL, Proton decisions cite Proton screens, and C24 decisions name C24 as absent from Mobbin and cite the stand-in screens
- **proof:** manual (taste document, judged by Rue)

## ADDED Requirements

### Requirement: Cohesive look mockup approved before restyle
A static mockup `design/cohesive-mockup.html`, styled only through the new tokens, SHALL show Today, Sprint
(By aspect, Board, Week), Backlog, a project detail, Uni and a class detail at 1440 px and 390 px, plus the
sidebar "New todo" dialog, the phone todo editor, a toast and the palette with every aspect colour. Its
screenshots go to `design/shots/cohesive-*.png`. No unit that restyles feature UI starts before Rue approves it.
Motion is unchanged. (cohesive-look)

#### Scenario: Mockup shows every main frame at both widths
- **WHEN** Rue opens `design/cohesive-mockup.html` and its screenshots
- **THEN** Today, Sprint in all three views, Backlog, a project detail, Uni and a class detail are each shown at 1440 px and 390 px, styled only through the tokens
- **proof:** manual (visual judgement)

#### Scenario: Restyle waits for the approved mockup
- **WHEN** the cohesive mockup has not been approved by Rue
- **THEN** no unit that restyles feature UI is started
- **proof:** manual (human taste gate, recorded by the orchestrator)

### Requirement: Tokens pass contrast with the new palette
`src/lib/styles/tokens.css` SHALL define the cohesive-look palette (canvas, surface, sunk, chrome, ink levels,
accent, overdue, aspects and their tints mixed `in oklab` with the surface) and every text pair SHALL reach
4.5:1, aspect icons, the white tick and the unchecked checkbox outline on the surface 3:1, checked by
`node design/palettes/check-contrast.mjs --tokens`. (cohesive-look)

#### Scenario: Contrast check passes on the shipped tokens
- **WHEN** `node design/palettes/check-contrast.mjs --tokens` runs
- **THEN** it exits 0 and lists no failing pair
- **proof:** manual (script run recorded in the verification; it is not part of proof)

### Requirement: One list anatomy
Every list of todos or rules SHALL render its rows inside a grouped card on the `--surface` with hairline
separators between rows (Today, Sprint By aspect, Backlog, an aspect page, project and class todos, Recurring,
Plan, Review and the backlog rail); a single row SHALL NOT draw its own border. The group's header (icon,
name, count or progress) sits above the card. (cohesive-look)

#### Scenario: No todo row draws its own border
- **WHEN** Today, Sprint By aspect, Backlog and an aspect page are opened at 1280 px with at least two todos each
- **THEN** every todo row's computed border widths are 0, each row sits inside an element with the test id `list-group`, and that group's background is the `--surface` colour
- **proof:** e2e
