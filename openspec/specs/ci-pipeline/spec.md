# ci-pipeline Specification

## Purpose
TBD - created by archiving change ci-life-manager. Update Purpose after archive.
## Requirements
### Requirement: CI gate on every change to main
`.github/workflows/ci.yml` SHALL run on `pull_request` targeting `main` and on `push` to `main`, on a
GitHub-hosted runner, using the Node major from Homelab's `nodejs_version`. It SHALL run, in order:
`npm ci`, `npm run proof:full`, `npm run package`, the checksum check, and the e2e suite with
`E2E_APP_DIR` pointing at the unpacked tarball. It SHALL upload the tarball as a workflow artifact and
SHALL define no checks of its own beyond calling these commands.

#### Scenario: A clean PR
- **WHEN** a PR changes only code that passes every check
- **THEN** the `ci` check is green and the run has a downloadable `life-manager-<version>.tgz` artifact
- **proof:** manual (runs on GitHub Actions; the PR checks are the evidence)

#### Scenario: Lockfile out of sync
- **WHEN** a PR changes `package.json` dependencies without updating `package-lock.json`
- **THEN** the `ci` check is red at `npm ci`
- **proof:** manual (runs on GitHub Actions; proven once by mutation)

### Requirement: Shared security baseline
CI SHALL call `Rue-Asha/ci/.github/workflows/security-baseline.yml` pinned to a full commit SHA, and the
repo SHALL have a Dependabot config for `github-actions` that proposes bumps of every pinned SHA.

#### Scenario: Baseline runs on a PR
- **WHEN** a PR is opened
- **THEN** the PR shows the baseline's workflow-lint, secret-scan and dependency-review checks
- **proof:** manual (runs on GitHub Actions)

### Requirement: Workflows follow the publishing controls
Every workflow SHALL declare `permissions` with `contents: read` at the top level and widen it only on
the job that needs it, SHALL pin third-party actions to full commit SHAs with the release in a trailing
comment, and SHALL NOT trigger on `pull_request_target`.

#### Scenario: Release job permissions
- **WHEN** `release.yml` is inspected
- **THEN** only the publishing job holds `contents: write`, `id-token: write` and `attestations: write`
- **proof:** manual (enforced by the baseline's zizmor run; inspection is the evidence)

### Requirement: CI is a required merge check
`main` SHALL be protected so a PR cannot merge unless `ci` and the baseline checks are green.

#### Scenario: Merge with a red check
- **WHEN** a PR's `ci` check is red
- **THEN** GitHub refuses the merge
- **proof:** manual (a GitHub setting)

