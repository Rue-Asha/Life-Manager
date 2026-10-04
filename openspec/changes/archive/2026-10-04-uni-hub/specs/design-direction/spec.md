## ADDED Requirements

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
