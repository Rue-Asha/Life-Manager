## ADDED Requirements

### Requirement: Version 0.11.0
`package.json` and `package-lock.json` SHALL carry version 0.11.0 (a minor bump for the redesign feature, from 0.10.1). After the
change is merged, tag `v0.11.0` SHALL be pushed so the release workflow publishes `life-manager-0.11.0.tgz` with its
sha256 and the Homelab bump PR is opened.

#### Scenario: Package and lockfile carry 0.11.0
- **WHEN** `package.json` and `package-lock.json` (root and `packages[""]`) are read
- **THEN** all three versions are "0.11.0"
- **proof:** unit

#### Scenario: Release v0.11.0 published
- **WHEN** tag `v0.11.0` is pushed on the merged `main`
- **THEN** the release workflow passes its tag check and a GitHub release v0.11.0 holds `life-manager-0.11.0.tgz` and its `.sha256`
- **proof:** manual (runs on GitHub after the ship-time tag push)
