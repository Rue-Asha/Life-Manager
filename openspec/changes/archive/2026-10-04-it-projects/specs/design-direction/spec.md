## ADDED Requirements

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
