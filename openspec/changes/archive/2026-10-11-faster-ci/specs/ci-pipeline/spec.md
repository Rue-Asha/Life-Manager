## MODIFIED Requirements

### Requirement: CI gate on every change to main
`.github/workflows/ci.yml` SHALL run on `pull_request` targeting `main` and on `push` to `main`, calling `.github/workflows/gate.yml` on the `["self-hosted","homelab-check"]` runner for pull requests and on `ubuntu-24.04` for pushes to `main`, using the Node major from Homelab's `nodejs_version`. The gate SHALL run, in order: `npm ci`, `npm run check`, `npm run package`, `npm run test:unit`, the checksum check, and the e2e suite with `E2E_APP_DIR` pointing at the unpacked tarball, and SHALL upload the tarball and checksum as the `release-tarball` workflow artifact. The app SHALL be built exactly once per gate run (by `npm run package`), the gate SHALL NOT call `npm run proof`, and it SHALL define no checks of its own beyond calling these commands. The required check name SHALL stay `ci / ci`.

#### Scenario: A clean PR
- **WHEN** a PR changes only code that passes every check
- **THEN** the `ci` check is green and the run has a downloadable `life-manager-<version>.tgz` artifact
- **proof:** manual (runs on GitHub Actions; the change's own PR checks are the evidence)

#### Scenario: Lockfile out of sync
- **WHEN** a PR changes `package.json` dependencies without updating `package-lock.json`
- **THEN** the `ci` check is red at `npm ci`
- **proof:** manual (runs on GitHub Actions; proven once by mutation)

#### Scenario: Gate builds once
- **WHEN** the gate job runs
- **THEN** its log shows exactly one `vite build` before the e2e step, and `gate.yml` lists `npm run check`, `npm run package`, `npm run test:unit` in that order with no `npm run proof`
- **proof:** manual (CI log of the change's PR run; `actionlint` on `gate.yml` plus reading the step order for the static part)

#### Scenario: Unit tests run after package
- **WHEN** `gate.yml` is inspected
- **THEN** the `npm run test:unit` step comes after the `npm run package` step, so a unit test that reads `build/` finds it
- **proof:** manual (static structure of `gate.yml`; `actionlint` clean and step order read)

#### Scenario: Local proof is unchanged
- **WHEN** `npm run proof` or `npm run proof:full` runs locally
- **THEN** it still runs check, build and unit tests (and e2e for `proof:full`) as before
- **proof:** manual (`package.json` scripts are not in the diff; `git diff --stat` shows no change to it)

### Requirement: Workflows follow the publishing controls
Every workflow SHALL declare `permissions` with `contents: read` at the top level and widen it only on the job that needs it, SHALL pin third-party actions to full commit SHAs with the release in a trailing comment, and SHALL NOT trigger on `pull_request_target`. In `release.yml`, `check-tag` and `publish` MAY additionally hold `actions: read` to find the push run and download its artifact, and nothing broader than that.

#### Scenario: Release job permissions
- **WHEN** `release.yml` is inspected
- **THEN** only the publishing job holds `contents: write`, `id-token: write` and `attestations: write`
- **proof:** manual (enforced by the baseline's zizmor run; inspection is the evidence)

#### Scenario: Release jobs read runs and nothing more
- **WHEN** `release.yml` is inspected
- **THEN** `check-tag` holds `contents: read` and `actions: read`, and `publish` adds only `actions: read` to its existing grants
- **proof:** manual (inspection of `release.yml`; `actionlint` clean and the baseline's zizmor run on the PR)

## ADDED Requirements

### Requirement: CI cancels superseded PR runs
`ci.yml` SHALL declare a `concurrency` group keyed on the pull request number for `pull_request` events and on `github.sha` for `push` events, with `cancel-in-progress` true only for `pull_request`. A newer push to a PR SHALL cancel that PR's still-running check; runs for different PRs SHALL NOT cancel each other, and push runs on `main` SHALL NOT be cancelled.

#### Scenario: Superseded PR run is cancelled
- **WHEN** a second commit is pushed to a pull request branch while its `ci` run is still running
- **THEN** the earlier run ends as cancelled and the new run starts
- **proof:** manual (runs on GitHub; proven by pushing twice to the change's own PR)

#### Scenario: Two PRs do not cancel each other
- **WHEN** two different pull requests have a `ci` run in progress
- **THEN** neither run is cancelled by the other
- **proof:** manual (the concurrency group differs per PR number; read in `ci.yml`, `actionlint` clean)

#### Scenario: Push runs on main are not cancelled
- **WHEN** two commits land on `main` in quick succession
- **THEN** both push runs complete, each in its own SHA-keyed group
- **proof:** manual (the group key is `github.sha` and `cancel-in-progress` is false for push; read in `ci.yml`)

#### Scenario: Required check name is stable
- **WHEN** `ci.yml` runs
- **THEN** the gate job is still reported as `ci / ci`
- **proof:** manual (job name on the PR checks list)

### Requirement: CI picks its runner by event
`ci.yml` SHALL pass `["ubuntu-24.04"]` as the gate's runner for `push` events and `["self-hosted","homelab-check"]` for `pull_request` events, so pushes to `main` do not queue behind PRs on the homelab runner and the tarball a release publishes is built on a GitHub-hosted runner. The `security-baseline` job SHALL stay unchanged.

#### Scenario: Push to main runs on a GitHub-hosted runner
- **WHEN** a commit is pushed to `main`
- **THEN** the `ci` job of its run reports the `ubuntu-24.04` runner and uploads `release-tarball`
- **proof:** manual (runs on GitHub after merge; the run's job page shows the runner)

#### Scenario: PR runs stay on the homelab runner
- **WHEN** a pull request is opened or updated
- **THEN** the `ci` job runs on the `homelab-check` runner and the `security-baseline` jobs still run
- **proof:** manual (runs on GitHub; the change's own PR run shows the runner)
