## ADDED Requirements

### Requirement: Recurring rules per class
RuleForm SHALL show a Class select (classes of active semesters) and a Type chip while the rule's aspect is
the Uni aspect; the server stores class and type only on Uni-aspect rules, with the same validation as todos
(`not-found` / `archived` on `classId`, OTH when a class has no type). Generated instances inherit the rule's
class and type. A rule whose aspect changes away from the Uni aspect loses class and type. Rules whose class
belongs to an archived semester generate nothing; their carried-over instances are already done by the
archive, so nothing is placed. (uni-hub S15)

#### Scenario: Rule with a class generates linked instances
- **WHEN** Rue creates on `/recurring` a rule for the Uni aspect on Tuesday with class "Analysis" and type EXC, then starts a sprint
- **THEN** the rule list shows the class, and the Tuesday instance carries the class badge "Analysis · EXC"
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
