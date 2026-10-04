## Why

`npm run proof` and `proof:full` only run inside the agent harness, so nothing
independent stands between a commit and `main`. And what gets deployed is not
what got tested: the Ansible role checks out the pinned ref and builds again on
the LXC. With CI in place, the condition Homelab's CLAUDE.md names for moving to
a shipped tarball ("or builds need CI") is met — build once in CI, test that
exact build, ship it.

## What Changes

- New `npm run package`: builds and writes `dist/life-manager-<version>.tgz`
  (`build/`, `package.json`, production `node_modules`) plus its `.sha256`.
- Playwright can run e2e against an unpacked artifact (`E2E_APP_DIR`) instead of
  the working tree's `build/`.
- New `.github/workflows/ci.yml`: on PR and push to `main`, runs
  `proof:full`, packages, runs e2e against the unpacked tarball, and calls the
  shared security baseline from `Rue-Asha/ci`.
- New `.github/workflows/release.yml`: on a `v*` tag matching
  `package.json` `version`, repeats the CI gate, then publishes a GitHub Release
  with the tarball, its checksum, and a build-provenance attestation.
- Node major pinned in CI to the Ansible role's `nodejs_version` (the role is
  the reference).

## Capabilities

### New Capabilities
- `ci-pipeline`: the CI gate — triggers, the checks it runs, testing the
  packaged artifact, required merge check.
- `release-artifact`: the tarball contract — contents, naming, checksum,
  provenance, and when a release is published.

### Modified Capabilities
- `app-runtime`: the Harness commands requirement gains `npm run package` and
  e2e against an unpacked artifact.

## Non-Goals

- **Deploying the tarball.** Switching the Homelab `life_manager` role from
  checkout+build to download+verify is the CD change, in Homelab-Managment.
- Upgrade/migration test (old release's DB opened by the new artifact) —
  valuable, separate change.
- A central `node-app` reusable workflow — extracted when a second Node service
  exists.
- CodeQL.

## Done criteria

- [ ] A PR shows green `ci` and `security-baseline` checks; the `ci` log shows e2e running against an unpacked tarball, not `./build`.
- [ ] Packaging without production `node_modules` makes the artifact e2e red while `proof:full` stays green. (Moving `marked` to dev doesn't: adapter-node bundles devDependencies.)
- [ ] Pushing tag `v0.1.0` produces a GitHub Release with `life-manager-0.1.0.tgz`, a `.sha256` that `sha256sum -c` accepts, and an attestation `gh attestation verify` accepts.
- [ ] Pushing a tag that does not match `package.json` `version` publishes nothing.
- [ ] `main` cannot be merged with a red check.

## Appetite

Two evenings. Depends on `Rue-Asha/ci` existing (Homelab change `ci-homelab`, group 2).
