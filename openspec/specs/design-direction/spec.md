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

