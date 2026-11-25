## ADDED Requirements

### Requirement: Recurring screen on the fingerprint
`/recurring` SHALL render on the fingerprint with the rule list and the rule form (title, aspect, weekdays, slot, checklist template, and the class field only when the aspect is the Uni aspect); delete keeps its confirmation. From 1280 px the rule list runs in two columns (gate 5, Q11); "New rule" in the page head is a secondary (glass) pill (gate 5, Q3) and the empty state carries its own add, with no header copy about a new rule (gate 4 pick). (S15)

#### Scenario: No rules shows the empty copy
- **WHEN** no recurring rule exists and `/recurring` is opened
- **THEN** it reads the heading "No recurring rules yet" and offers adding a rule
- **proof:** e2e

#### Scenario: Class field only for the Uni aspect
- **WHEN** Rue opens the rule form with the aspect Health, then switches the aspect to the Uni aspect
- **THEN** no Class field is shown for Health, and a Class field appears for Uni
- **proof:** e2e

#### Scenario: Long checklist template stays usable
- **WHEN** a rule with a 25-item checklist template of 120-character items is edited at 375 px
- **THEN** every item can be reached and edited, save stays reachable, and the page does not scroll horizontally
- **proof:** e2e

#### Scenario: Rules sit in two columns from 1280
- **WHEN** four rules exist and `/recurring` is opened at 1280 px and at 1100 px
- **THEN** at 1280 px the first two rules share one top edge, and at 1100 px every rule starts below the previous one
- **proof:** e2e

## MODIFIED Requirements

### Requirement: Recurring rules per class
RuleForm SHALL show a Class select (classes of active semesters) and a Type chip while the rule's aspect is
the Uni aspect; the server stores class and type only on Uni-aspect rules, with the same validation as todos
(`not-found` / `archived` on `classId`, OTH when a class has no type). Generated instances inherit the rule's
class and type. A rule whose aspect changes away from the Uni aspect loses class and type. Editing a rule
whose class belongs to an archived semester keeps that class unless Rue picks another one; the form lists it
marked as archived. Rules whose class belongs to an archived semester generate nothing; their carried-over
instances are already done by the archive, so nothing is placed. (uni-hub S15)

#### Scenario: Rule with a class generates linked instances
- **WHEN** Rue creates on `/recurring` a rule for the Uni aspect on Tuesday with class "Analysis" and type EXC, then starts a sprint
- **THEN** the rule row shows the class name "Analysis" and the type tag EXC beside it (as signed at gate 5), and the Tuesday instance carries the class badge "Analysis · EXC"
- **proof:** e2e

#### Scenario: Generated instances inherit class and type
- **WHEN** a sprint starts with a Uni rule for Monday and Thursday linked to a class with type LEC
- **THEN** both instances have the rule's `classId` and type LEC
- **proof:** unit

#### Scenario: Rule class fields appear only for the Uni aspect
- **WHEN** Rue opens the rule form with a non-Uni aspect, then selects the Uni aspect
- **THEN** Class and Type are hidden first and shown afterwards
- **proof:** e2e

#### Scenario: Rule leaving the Uni aspect loses its class
- **WHEN** a rule linked to a class with type LEC is updated to another aspect
- **THEN** its `classId` and type are null
- **proof:** unit

#### Scenario: Rules of archived classes generate nothing
- **WHEN** a sprint starts while a rule's class belongs to an archived semester
- **THEN** no instance of that rule is generated and no carried todo is placed
- **proof:** unit

#### Scenario: Rule with an unknown or archived class is rejected
- **WHEN** a Uni rule is created with a `classId` that does not exist, or with a class of an archived semester
- **THEN** it fails with `not-found` or `archived` on field `classId` and nothing is stored
- **proof:** unit

#### Scenario: Editing a rule of an archived class keeps its class
- **WHEN** Rue renames on `/recurring` a rule whose class "Statistics" (type LEC) belongs to an archived semester and saves
- **THEN** after reload the rule row still shows the class name "Statistics" and the type tag LEC
- **proof:** e2e

