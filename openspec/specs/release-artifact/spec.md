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
A GitHub Release SHALL be published only by `.github/workflows/release.yml`, only for a pushed tag
`v<version>` equal to `package.json` `version`, and only after the full CI gate passes on that tag.
It SHALL attach the tarball, its `.sha256`, and a build-provenance attestation for the tarball.

#### Scenario: Matching tag publishes a release
- **WHEN** tag `v0.1.0` is pushed and `package.json` `version` is `0.1.0`
- **THEN** a Release `v0.1.0` exists with `life-manager-0.1.0.tgz` and `life-manager-0.1.0.tgz.sha256`
- **AND** `gh attestation verify life-manager-0.1.0.tgz --repo Rue-Asha/Life-Manager` succeeds
- **proof:** manual (needs a real tag push to GitHub)

#### Scenario: Mismatched tag publishes nothing
- **WHEN** tag `v9.9.9` is pushed and `package.json` `version` is `0.1.0`
- **THEN** the release workflow fails before packaging and no Release is created
- **proof:** manual (needs a real tag push to GitHub)

#### Scenario: Red gate publishes nothing
- **WHEN** a matching tag points at a commit whose e2e suite fails
- **THEN** no Release is created
- **proof:** manual (needs a real tag push to GitHub)

