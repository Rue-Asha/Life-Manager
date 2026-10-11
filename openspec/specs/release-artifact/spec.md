# release-artifact Specification

## Purpose
TBD - created by archiving change ci-life-manager. Update Purpose after archive.
## Requirements
### Requirement: Release tarball contract
`npm run package` SHALL write `dist/life-manager-<version>.tgz`, where `<version>` is `package.json`
`version`, and next to it `dist/life-manager-<version>.tgz.sha256` in `sha256sum` format. The tarball
SHALL unpack into a single top-level directory `life-manager-<version>/` containing `build/`,
`package.json` and a `node_modules/` holding production dependencies only, so that
`node build` runs from it with no install step and no build toolchain. It SHALL NOT contain `src/`,
`.svelte-kit/`, tests, or development dependencies.

#### Scenario: Artifact runs without an install step
- **WHEN** the tarball is unpacked into an empty directory and `node build` is started there with `PORT` and `DATABASE_PATH` set
- **THEN** `/` answers with status 200
- **proof:** e2e ("Scenario: Built app serves a page in e2e", run with `E2E_APP_DIR`)

#### Scenario: The artifact ships without its production dependencies
- **WHEN** the tarball's `node_modules/` lacks a package listed in `dependencies`
- **THEN** the artifact e2e run fails while `npm run proof:full` from the working tree passes
- **proof:** manual (proven once by mutation: skip the `npm ci --omit=dev` step in `scripts/package.mjs`; adapter-node bundles `devDependencies`, so moving `marked` there does not break the artifact)

#### Scenario: Checksum matches
- **WHEN** `sha256sum -c life-manager-<version>.tgz.sha256` runs next to the tarball
- **THEN** it reports `OK`
- **proof:** manual (runs as a step in the CI and release workflows; its log is the evidence)

### Requirement: Releases are published only from matching tags
A GitHub Release SHALL be published only by `.github/workflows/release.yml`, only for a pushed tag `v<version>` equal to `package.json` `version`, and only from the `release-tarball` artifact of the `ci.yml` push run for the tagged commit, which SHALL have passed. The workflow SHALL NOT build or test the app again. It SHALL check the tag against `package.json` first, then find that push run (polling up to about 2 minutes for it to appear), watch it to completion, and fail unless it passed and its artifact is not expired. It SHALL verify the tarball's checksum, attach the tarball, its `.sha256`, and a build-provenance attestation for the tarball. The `bump` job SHALL stay unchanged.

#### Scenario: Matching tag publishes a release
- **WHEN** tag `v0.1.0` is pushed on a merged `main` commit whose `ci` push run is green, and `package.json` `version` is `0.1.0`
- **THEN** a Release `v0.1.0` exists with `life-manager-0.1.0.tgz` and `life-manager-0.1.0.tgz.sha256` taken from that run's `release-tarball`, and the release run contains no gate job
- **AND** `gh attestation verify life-manager-0.1.0.tgz --repo Rue-Asha/Life-Manager` succeeds
- **proof:** manual (needs a real tag push to GitHub; the checksum on the release equals the push run's artifact)

#### Scenario: Mismatched tag publishes nothing
- **WHEN** tag `v9.9.9` is pushed and `package.json` `version` is `0.1.0`
- **THEN** the `check-tag` job fails before looking for a run and no Release is created
- **proof:** manual (needs a real tag push to GitHub)

#### Scenario: Tag pushed before the push run is listed
- **WHEN** the tag arrives right after the merge, before the `ci` push run for that commit appears in the run list
- **THEN** `check-tag` keeps polling for up to about 2 minutes, then watches the run once it appears
- **proof:** manual (needs a real tag push right after a merge; the `check-tag` log shows the wait)

#### Scenario: Tagged commit has no push run
- **WHEN** a tag is pushed on a commit that has no `ci` push run
- **THEN** `check-tag` fails with an error naming the commit SHA and no Release is created
- **proof:** manual (needs a real tag push on such a commit; not forced artificially)

#### Scenario: Red push run publishes nothing
- **WHEN** a matching tag points at a commit whose `ci` push run failed
- **THEN** `check-tag` fails with an error naming the run id and no Release is created
- **proof:** manual (needs a real tag push to GitHub)

#### Scenario: Expired or missing artifact
- **WHEN** the push run passed but its `release-tarball` artifact is expired or missing
- **THEN** `check-tag` fails with an error telling to run `gh run rerun <id>` and push the tag again, and no Release is created
- **proof:** manual (needs an expired artifact; the error text is read in `release.yml`)

#### Scenario: Release workflow has no gate call
- **WHEN** `release.yml` is inspected
- **THEN** it has no call to `gate.yml`, `publish` downloads `release-tarball` by the run id that `check-tag` outputs, and `bump` is unchanged
- **proof:** manual (static structure of `release.yml`; `actionlint` clean)

