# Scope: faster-ci

Triage: tweak — port the remaining faster-CI changes from Rues-Arcade commit d63b3fb (reference: `/home/Rue/Repos/Rues-Arcade/openspec/changes/faster-ci/`, `.github/workflows/{ci,gate,release}.yml` there) to Life-Manager's workflows. One session, workflow files and specs only, no app code. Appetite: one evening.

## Problem
Rue waits too long on CI checks. On `origin/main` the gate builds twice (`npm run proof` builds, then `npm run package` builds again), superseded PR runs keep running, pushes to `main` queue behind PRs on the single homelab runner, and a release tag re-runs the whole gate although the push run on `main` already built and tested the same commit's tarball.

Already on `origin/main` (not part of this change): `gate.yml` as reusable workflow, PRs on `["self-hosted","homelab-check"]`, e2e only against the unpacked tarball (PR #11).

## Flows
- PR check: push to a PR branch → `ci.yml` → `gate.yml` on the homelab runner → superseded run cancelled by the next push.
- Main check: merge to `main` → `ci.yml` → `gate.yml` on `ubuntu-24.04` → uploads `release-tarball`.
- Release: push tag `v<version>` → `release.yml` `check-tag` → finds and waits for the push run of `ci.yml` on the tagged commit → `publish` downloads that run's `release-tarball` → attest → GitHub release → `bump`.

## In scope
- **S1** The gate builds once: `gate.yml` runs `npm run check`, then `npm run package` (the only build), then `npm run test:unit`, then the checksum/unpack/e2e-on-tarball steps; it no longer calls `npm run proof`.
  - edges: unit tests run after `package` because they may read `build/` (Rues-Arcade's `package.test.ts` does; verify whether Life-Manager's tests do, and keep the order either way) · `npm run proof` / `proof:full` in package.json stay unchanged for local use.
- **S2** A newer push to a PR cancels that PR's still-running check; push runs on `main` are never cancelled.
  - edges: group keyed on PR number for pull_request, on `github.sha` for push · two PRs don't cancel each other · the required check name stays `ci / ci`.
- **S3** Pushes to `main` run the gate on `ubuntu-24.04`; pull requests keep the homelab runner.
  - edges: `ci.yml` keeps the `security-baseline` job as is.
- **S4** `release.yml` no longer re-runs the gate: `check-tag` finds the `ci.yml` push run for the tagged commit (polling up to ~2 min for it to appear), watches it to completion, fails unless it passed and its `release-tarball` artifact is not expired; `publish` downloads the tarball from that run id and publishes it with the existing checksum verify, attestation and `gh release create`; `bump` stays as it is.
  - edges: tag pushed right after the merge before the run is listed → wait · no push run for that commit → fail with a clear error · run failed → publish nothing · artifact expired/missing → fail telling to `gh run rerun <id>` and push the tag again · tag/version mismatch check stays first · `check-tag` gets `actions: read`, `publish` gets `actions: read` and a token for cross-run artifact download, nothing broader.
- **S5** Specs and docs say what now holds: delta specs for `ci-pipeline` (build once, concurrency, runner per event) and `release-artifact` (release publishes the tarball of the tagged commit's passing push run, not a re-run on the tag); CLAUDE.md/README lines that describe the gate or release path are updated where they are now wrong.
  - edges: scenarios that need a real GitHub run use `proof: manual` with the evidence named.

## Non-goals
- Homelab runner setup or changes to `gate.yml`'s runner input — already there.
- Splitting or merging Playwright projects (Rues-Arcade's look-test sharing) — not measured for Life-Manager; Split off if wanted.
- npm caching in CI — `gate.yml` says no cache on purpose (poisoned cache would ship).
- Changing the `bump` job, the security baseline, or the version/tag policy.
- Local `proof` / `proof:full` behaviour.

## Codebase touchpoints
- `.github/workflows/ci.yml` — concurrency, runner per event (S2, S3)
- `.github/workflows/gate.yml` — step order (S1)
- `.github/workflows/release.yml` — check-tag lookup/wait, publish from run id (S4)
- `openspec/specs/ci-pipeline/spec.md`, `openspec/specs/release-artifact/spec.md` — delta specs (S5)
- `CLAUDE.md`, `README.md` — wording where stale (S5)
- Reference implementation: Rues-Arcade commit `d63b3fb` (`git -C /home/Rue/Repos/Rues-Arcade show d63b3fb -- .github`).

## Risks
- R1 Workflow changes can't run locally → accepted: `actionlint` (installed) and `openspec validate` are the local proof; the PR's own CI run is the evidence for S1–S3, the next real tag for S4 (manual scenario).
- R2 The first tag after merge: its commit's push run uses the new gate, so a tarball exists → resolved: the release tag comes after the merge, as per the ship policy.
- R3 A tag pushed on a commit that has no push run (e.g. tagged on a branch commit) now fails instead of rebuilding → accepted: tags are cut on merged `main` commits.
- R4 Artifact retention: the push run's tarball expires with the repo's retention → accepted: error message says how to rerun.

## Decisions
- All four parts in one unit, one builder, serial — Rue asked for "alle vier in einem Rutsch".
- Skip the homelab runner work from the earlier plan — it is already on `origin/main`.
- Base is `origin/main` (81dfd6e), worked in worktree `../Life-Manager-faster-ci`; local `main` is stale and untouched.

## Done when
- `actionlint` is clean on all three workflows and `openspec validate faster-ci --strict` passes.
- `gate.yml` shows check → package → test:unit → e2e-on-tarball with a single build; `ci.yml` shows the concurrency block and the per-event runner; `release.yml` has no gate call and downloads the artifact by run id.
- The PR's own CI run is green and faster than the previous one on `main`.
- Rue can read the specs and see the new release rule.

## Split off
- Look/e2e project consolidation for Life-Manager, if measured worthwhile.
