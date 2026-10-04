# design-direction Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Design brief grounded in Mobbin
A design brief SHALL define the visual direction (calm, high-end, Things 3 / Sunsama-Akiflow feel),
citing a Mobbin reference for every aesthetic decision. It MUST follow `scope.md` Decisions where
`design-refs.md` conflicts: light theme only, no keyboard shortcuts, no natural-language quick add. (S2)

#### Scenario: Brief cites a reference for every decision
- **WHEN** Rue reads `design/brief.md`
- **THEN** every aesthetic decision (colour, type, spacing, row layout, navigation, empty states, motion) cites at least one Mobbin URL
- **AND** it contains no dark-mode, keyboard-shortcut or natural-language-parsing direction
- **proof:** manual (taste document, judged by Rue)

### Requirement: Design tokens and style tile
The spike SHALL produce design tokens (`src/lib/styles/tokens.css`), the fixed aspect palette, icon set
and presets (`src/lib/aspect-style.ts`), and a static style tile that shows them applied to a sample
todo row, aspect header, chips, button, quick-add field and empty state. (S2)

#### Scenario: Style tile renders from the tokens
- **WHEN** Rue opens `design/style-tile.html`
- **THEN** it shows the palette, type scale, aspect colours and icons, and the sample components, styled only through the tokens
- **proof:** manual (visual judgement)

### Requirement: Approval before feature UI
No feature-UI work SHALL start before Rue approves the visual direction. (S2)

#### Scenario: Feature UI waits for the approved style tile
- **WHEN** the style tile has not been approved
- **THEN** no unit that builds feature UI is started
- **proof:** manual (human taste gate, recorded by the orchestrator)

### Requirement: Brief records motion and wide-layout decisions
`design/brief.md` SHALL record Rue's decisions from this change: its motion section states that moves and
navigation animate (S12/S13 replace "motion only answers an action" for those two cases, durations stay on
the 120/200/320 ms tokens, reduced motion is instant), and a layout section describes the ≥1280 px
three-column layout with context rail, the 768–1279 px overlay and the Week view's overlay rail at ≥1280 px. Each decision cites the Mobbin
references listed in the change's scope Decisions. (S14)

#### Scenario: Brief documents motion and the three-column layout with references
- **WHEN** Rue reads `design/brief.md`
- **THEN** the motion section describes move and navigation motion as in S12/S13, a layout section describes sidebar | content | context rail at ≥1280 px the overlay rail at 768–1279 px and in Week at ≥1280 px, and each of these decisions cites at least one of the scope's Mobbin URLs
- **proof:** manual (taste document, judged by Rue)

### Requirement: Projects mockup approved before Projects UI
A static Projects mockup SHALL exist before any Projects feature UI is built: `design/projects-mockup.html`,
styled only through the tokens, shows the Projects overview and the project detail at 1600 px and 375 px, and
`design/brief.md` gains a Projects section citing a Mobbin URL for each of its decisions: overview
as cards grouped by status sections with a collapsed Implemented row, detail as a single scroll page,
status as a pill dropdown, metadata in a right properties rail becoming a wrapping pill row on mobile,
and the project badge as muted text with a glyph. Rue approves the mockup before Projects UI units
start. Motion stays as in the motion spec. (it-projects S15)

#### Scenario: Brief cites Mobbin references for the Projects screens
- **WHEN** Rue reads the Projects section of `design/brief.md`
- **THEN** every decision in it (overview grouping, collapsed group, detail layout, status pill, properties rail and its mobile row, project badge, navigation entry) cites at least one Mobbin URL, and it adds no motion beyond the route cross-fade
- **proof:** manual (taste document, judged by Rue)

#### Scenario: Mockup shows overview and detail at both widths
- **WHEN** Rue opens `design/projects-mockup.html` and its screenshots at 1600 px and 375 px
- **THEN** the overview and the detail are each shown at both widths, styled only through the tokens
- **proof:** manual (visual judgement)

#### Scenario: Projects UI waits for the approved mockup
- **WHEN** the Projects mockup has not been approved by Rue
- **THEN** no unit that builds Projects feature UI is started
- **proof:** manual (human taste gate, recorded by the orchestrator)

### Requirement: Uni mockup approved before Uni UI
A static Uni mockup SHALL exist before any Uni feature UI is built: `design/uni-mockup.html`, styled only
through the tokens, shows `/uni` (active semester sections with class cards, collapsed "Archived (n)" group,
grade line, deadline overview, empty states, Uni aspect prompt) and the class detail (header, metadata rail
and its mobile row, notes, todos with revised dates, rules) at 1600 px and 375 px, plus a todo row with the
class badge and the QuickAdd Class/Type fields. `design/brief.md` gains a Uni section citing a Mobbin URL for
each of its decisions. Rue approves the mockup before Uni UI units start. Motion stays as in the motion spec
(route cross-fade only). (uni-hub S18)

#### Scenario: Brief cites Mobbin references for the Uni screens
- **WHEN** Rue reads the Uni section of `design/brief.md`
- **THEN** every decision in it (semester sections, archived group, class card with countdown and grade, deadline overview, class detail and its metadata rail / mobile row, revised marker, class badge, Class/Type fields, navigation entry) cites at least one Mobbin URL, and it adds no motion beyond the route cross-fade
- **proof:** manual (taste document, judged by Rue)

#### Scenario: Uni mockup shows overview and class detail at both widths
- **WHEN** Rue opens `design/uni-mockup.html` and its screenshots at 1600 px and 375 px
- **THEN** the overview and the class detail are each shown at both widths, styled only through the tokens
- **proof:** manual (visual judgement)

#### Scenario: Uni UI waits for the approved mockup
- **WHEN** the Uni mockup has not been approved by Rue
- **THEN** no unit that builds Uni feature UI is started
- **proof:** manual (human taste gate, recorded by the orchestrator)

