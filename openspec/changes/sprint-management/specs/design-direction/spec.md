## ADDED Requirements

### Requirement: Brief records motion and wide-layout decisions
`design/brief.md` SHALL record Rue's decisions from this change: its motion section states that moves and
navigation animate (S12/S13 replace "motion only answers an action" for those two cases, durations stay on
the 120/200/320 ms tokens, reduced motion is instant), and a layout section describes the ≥1280 px
three-column layout with context rail and the 1024–1279 px overlay. Each decision cites the Mobbin
references listed in the change's scope Decisions. (S14)

#### Scenario: Brief documents motion and the three-column layout with references
- **WHEN** Rue reads `design/brief.md`
- **THEN** the motion section describes move and navigation motion as in S12/S13, a layout section describes sidebar | content | context rail at ≥1280 px and the overlay rail at 1024–1279 px, and each of these decisions cites at least one of the scope's Mobbin URLs
- **proof:** manual (taste document, judged by Rue)
