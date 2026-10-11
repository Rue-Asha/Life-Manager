## Why

Rue waits too long on CI checks. On `origin/main` the gate builds twice (`npm run proof` builds, then `npm run package` builds again), superseded PR runs keep running, pushes to `main` queue behind PRs on the single homelab runner, and a release tag re-runs the whole gate although the push run on `main` already built and tested the same commit's tarball.

Already on `origin/main` and not part of this change: `gate.yml` as reusable workflow, PRs on `["self-hosted","homelab-check"]`, e2e only against the unpacked tarball (PR #11).

Appetite: one evening.

## What Changes

- **S1** The gate builds once: `gate.yml` runs `npm run check`, then `npm run package` (the only build), then `npm run test:unit`, then the checksum / unpack / e2e-on-tarball steps. It no longer calls `npm run proof`. `proof` and `proof:full` stay as they are for local use.
- **S2** A newer push to a PR cancels that PR's still-running check; push runs on `main` are never cancelled. The required check name stays `ci / ci`.
- **S3** Pushes to `main` run the gate on `ubuntu-24.04`; pull requests keep the homelab runner. `security-baseline` stays as is.
- **S4** `release.yml` no longer re-runs the gate. `check-tag` finds the `ci.yml` push run for the tagged commit (polling up to ~2 min), watches it, and fails unless it passed and its `release-tarball` is not expired. `publish` downloads that run's tarball and publishes it with the existing checksum verify, attestation and `gh release create`. `bump` is untouched.
- **S5** Delta specs for `ci-pipeline` and `release-artifact`, and README/CLAUDE.md lines that are now wrong.

## Capabilities

### New Capabilities

none

### Modified Capabilities

- `ci-pipeline`: the gate builds once (check, package, unit, tarball e2e), PR runs are cancelled when superseded, the runner depends on the event; the permissions requirement allows `actions: read` on the release jobs that read runs.
- `release-artifact`: a release publishes the tarball of the tagged commit's passing push run instead of re-running the gate on the tag.

## Non-Goals

- Homelab runner setup or changes to `gate.yml`'s runner input: already there.
- Splitting or merging Playwright projects (Rues-Arcade's look-test sharing): not measured for Life-Manager.
- npm caching in CI: `gate.yml` says no cache on purpose (a poisoned cache would ship).
- Changing the `bump` job, the security baseline, or the version/tag policy.
- Local `proof` / `proof:full` behaviour.

## Done criteria

- [ ] `actionlint` is clean on all three workflows and `openspec validate faster-ci --strict` passes.
- [ ] `gate.yml` shows check, package, test:unit, e2e-on-tarball with a single build; `ci.yml` shows the concurrency block and the per-event runner; `release.yml` has no gate call and downloads the artifact by run id.
- [ ] The PR's own CI run is green and faster than the previous one on `main`.
- [ ] Rue can read the specs and see the new release rule.

## Decisions

- All four parts in one unit, one builder, serial (Rue asked for "alle vier in einem Rutsch").
- Skip the homelab runner work from the earlier plan: it is already on `origin/main`.
- Base is `origin/main` (81dfd6e), worked in worktree `../Life-Manager-faster-ci`; local `main` is stale and untouched.

## Risks

- Workflow changes can't run locally: `actionlint` and `openspec validate` are the local proof; the PR's own CI run is the evidence for S1-S3, the next real tag for S4 (manual scenarios).
- A tag pushed on a commit with no push run (e.g. a branch commit) now fails instead of rebuilding: accepted, tags are cut on merged `main` commits.
- The push run's tarball expires with the repo's retention: the error message says how to rerun.

## Impact

`.github/workflows/{ci,gate,release}.yml`, `openspec/specs/ci-pipeline/spec.md`, `openspec/specs/release-artifact/spec.md` (via delta), `README.md`. No app code.

## Split off

- Look/e2e project consolidation for Life-Manager, if measured worthwhile.
