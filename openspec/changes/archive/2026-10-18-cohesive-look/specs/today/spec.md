## ADDED Requirements

### Requirement: Today summary header
Today SHALL open with a summary header under the page title: one large tabular number, the count of open
todos listed on Today (today's sprint todos not done, overdue todos and listed due-today backlog todos), labelled
"open today"; while a sprint is active a second line "Sprint <done> / <total> done · <n> days left" and a
segmented bar with one segment per aspect, sized by its sprint todos and filled by its done share in the aspect
colour. Without an active sprint the header shows only the number. The header is the `--chrome` surface with
light text. (cohesive-look)

#### Scenario: Header counts open todos on Today
- **WHEN** Rue opens `/` during a running sprint with two open and one done todo on today and one overdue backlog todo
- **THEN** the summary header shows "3" with "open today"
- **proof:** e2e

#### Scenario: Header shows sprint progress during a sprint
- **WHEN** the active sprint has 9 todos, 3 done, and today is Thursday of the sprint
- **THEN** the header reads "Sprint 3 / 9 done · 3 days left" and its bar has one segment per aspect with sprint todos
- **proof:** e2e

#### Scenario: Header without a sprint shows only the count
- **WHEN** no sprint is active and one backlog todo is due today
- **THEN** the header shows "1" with "open today" and no sprint line or bar
- **proof:** e2e
