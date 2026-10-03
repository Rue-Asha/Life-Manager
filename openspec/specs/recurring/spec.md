# recurring Specification

## Purpose
TBD - created by archiving change build-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Recurring rules
Rue SHALL create recurring rules with title, aspect, at least one weekday, and optional notes, priority
and checklist template. Rules can be listed, edited (affecting future sprints only) and deleted (existing
instances stay). (S18)

#### Scenario: Create and list a recurring rule
- **WHEN** Rue creates the rule "Gym" for Health on Monday and Thursday
- **THEN** it appears in the recurring list with its aspect and weekdays
- **proof:** e2e

#### Scenario: Rule without weekdays is rejected
- **WHEN** a rule is saved with no weekday chosen
- **THEN** it fails with `weekdays-required` on field `weekdays` and nothing is stored
- **proof:** unit

#### Scenario: Editing a rule affects only future sprints
- **WHEN** a rule with instances in the active sprint is renamed and its weekdays changed
- **THEN** the existing instances are unchanged and the next sprint's instances use the new title and weekdays
- **proof:** unit

#### Scenario: Deleting a rule keeps existing instances
- **WHEN** a rule with instances in the active sprint is deleted
- **THEN** the rule is gone and its instances remain, still marked recurring
- **proof:** unit

#### Scenario: Rule follows its deleted aspect
- **WHEN** a rule's aspect is deleted with a target aspect
- **THEN** the rule belongs to the target aspect
- **proof:** unit

### Requirement: Recurring instances
When a sprint starts, one instance per chosen weekday SHALL be added, pre-assigned to that day. Open
instances carried over by the review count against their rule: per rule, carried instances take the
rule's weekday slots in the new week in order (the first carried instance gets the first weekday), and
only the remaining weekdays get fresh instances; carried instances beyond the rule's weekday count, and
carried instances whose rule was deleted, keep no day. A rule created during an active sprint adds
instances for the remaining days, today onward. (S18, S8)

#### Scenario: Starting a sprint adds one instance per weekday
- **WHEN** a sprint starts and a rule exists for Monday and Thursday with a two-item checklist template
- **THEN** the sprint contains two instances of it, on that Monday and Thursday, status To do, each with its own copy of the checklist
- **proof:** unit

#### Scenario: Rule created mid-sprint fills the remaining days
- **WHEN** on Wednesday of the active sprint a rule for Monday, Wednesday and Friday is created
- **THEN** instances are added for Wednesday and Friday only
- **proof:** unit

#### Scenario: Recurring instances appear in the week view
- **WHEN** a rule for Tuesday exists and Rue starts a sprint
- **THEN** the week view shows the instance in the Tuesday column
- **proof:** e2e

#### Scenario: Carried recurring instance is not duplicated
- **WHEN** a rule for Monday and Thursday has one open instance carried over by the review and the next sprint starts
- **THEN** the sprint holds exactly two instances of the rule: the carried one, now on Monday with its status kept, and one fresh instance on Thursday
- **proof:** unit

#### Scenario: Carried instance of a deleted rule keeps no day
- **WHEN** an open instance is carried over, its rule is deleted before the next sprint starts, and the sprint starts
- **THEN** the carried instance is in the sprint with no day and no instance is generated for it
- **proof:** unit

#### Scenario: More carried instances than weekdays
- **WHEN** a rule for Monday only has two open instances carried over and the next sprint starts
- **THEN** no fresh instance is generated, one carried instance is on Monday and the other has no day
- **proof:** unit

#### Scenario: Start sprint shows a carried recurring todo once
- **WHEN** Rue closes a review that carries an open instance of a Tuesday rule, then starts the next sprint from Plan
- **THEN** the week view lists that rule's title exactly once, in the Tuesday column
- **proof:** e2e

