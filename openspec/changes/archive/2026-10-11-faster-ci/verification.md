verified-at: e131884

## Layer 1

`npm run proof:full` green (256 e2e passed, rc=0); `actionlint` clean (rc=0); `openspec validate faster-ci --strict` valid.

```
  ✓  250 e2e/uni.test.ts:486:1 › Scenario: Archiving without open todos needs no confirmation (283ms)
  ✓  251 e2e/uni.test.ts:502:1 › Scenario: Deleting a semester asks for confirmation naming counts (869ms)
  ✓  252 e2e/uni.test.ts:534:1 › Scenario: Deleting an empty semester uses a plain confirm (493ms)
  ✓  253 e2e/uni.test.ts:550:1 › Scenario: Grades are shown on the overview (174ms)
  ✓  254 e2e/uni.test.ts:572:1 › Scenario: No grades shows a dash (169ms)
  ✓  255 e2e/uni.test.ts:585:1 › Scenario: Deadline overview sits in the rail at 1280 (233ms)
  ✓  256 e2e/uni.test.ts:623:1 › Scenario: Nothing due shows an empty line (173ms)

  256 passed (2.1m)
```

## Layer 2

| Scenario | proof | Evidence |
|---|---|---|
| A clean PR | manual (PR checks) | checklist |
| Lockfile out of sync | manual (mutation) | checklist; `gate.yml:32` `npm ci` precedes everything else |
| Gate builds once | manual (CI log + static) | ✓ `gate.yml:36,39,41` check → package → test:unit; no `npm run proof`; only build is inside `npm run package` (`package.json:20`); e2e webServer runs `node build` (`playwright.config.ts:16`); actionlint clean. Log part: checklist |
| Unit tests run after package | manual (static) | ✓ `gate.yml:39` package, `:41` test:unit; actionlint clean |
| Local proof is unchanged | manual (package.json untouched) | ✓ `git diff --stat origin/main...` has no package.json; proof:full green |
| Superseded PR run is cancelled | manual (push twice) | ✓ static: `ci.yml:13-15` group `ci-${{ pull_request.number \|\| github.sha }}`, cancel `event_name == 'pull_request'`; live part: checklist |
| Two PRs do not cancel each other | manual (static) | ✓ `ci.yml:14` per-PR-number group |
| Push runs on main are not cancelled | manual (static) | ✓ `ci.yml:14-15` sha group, cancel false for push |
| Required check name is stable | manual (PR checks list) | ✓ static: `ci.yml:18` job id `ci`, `gate.yml:18-19` job `ci`; displayed name: checklist |
| Push to main runs on GitHub-hosted runner | manual (post-merge) | ✓ static: `ci.yml:21` push -> `["ubuntu-24.04"]`; `gate.yml:20` fromJSON; upload `gate.yml:58-64`; live: checklist |
| PR runs stay on the homelab runner | manual (PR run) | ✓ static: `ci.yml:21` else `["self-hosted","homelab-check"]`; `security-baseline` `ci.yml:23-24` unchanged; live: checklist |
| Release job permissions | manual (inspection) | ✓ `release.yml:64-68` only publish has contents/id-token/attestations write; top-level `:7-8` contents read |
| Release jobs read runs and nothing more | manual (inspection) | ✓ `release.yml:14-16` check-tag contents+actions read; `:64-68` publish adds only `actions: read` |
| Matching tag publishes a release | manual (real tag) | ✓ static: `release.yml:70-75` download by run-id + github-token, `:77-88` checksum, attest, release; no gate job; live: checklist |
| Mismatched tag publishes nothing | manual (real tag) | ✓ static: `release.yml:24-30` first step in check-tag, before run lookup |
| Tag pushed before the push run is listed | manual (real tag) | ✓ static: `release.yml:40-44` 12 x 10s poll (~2 min), then `:49` watch; live: checklist |
| Tagged commit has no push run | manual (real tag) | ✓ static: `release.yml:45-48` error names `$GITHUB_SHA` |
| Red push run publishes nothing | manual (real tag) | ✓ static: `release.yml:49-52` error names run id |
| Expired or missing artifact | manual (expired artifact) | ✓ `release.yml:53-57` error text includes `gh run rerun $run_id` and push tag again; empty result (missing) also != "false" |
| Release workflow has no gate call | manual (static) | ✓ no `gate:` job / no `gate.yml` ref in `release.yml`; `:74` run-id from `needs.check-tag.outputs.ci-run-id` (`:18`); `:90-103` bump unchanged vs origin/main (diff touches only check-tag/publish); actionlint clean |

Other static checks: every `uses:` in `.github/workflows` is pinned to a 40-hex SHA (or is a local `./` ref); no `pull_request_target`; README `## Releases` paragraph (`README.md:56-59`) matches the new flow (waits for green push run, publishes that run's tarball, rerun on expiry).

## Manual checklist

- Open the change's PR: the `ci / ci` check is green and the run has a `release-tarball` artifact with `life-manager-<version>.tgz` + `.sha256`.
- On that PR run, the `ci` job shows runner `homelab-check` and `security-baseline` jobs run; its log shows exactly one `vite build` before the e2e step.
- Push a second commit to the PR while `ci` runs: the first run ends cancelled.
- Temporarily change a dependency in `package.json` without the lockfile on a throwaway PR: `ci` is red at `npm ci`.
- After merge: the push run on main reports `ubuntu-24.04` and uploads `release-tarball`.
- Tag the merge commit `v<version>`: Release has tarball + `.sha256` equal to the push run's artifact, release run has no gate job, `gh attestation verify life-manager-<version>.tgz --repo Rue-Asha/Life-Manager` succeeds, bump runs.
- Tag right after merge: `check-tag` log shows the wait for the push run. Push a mismatched tag: `check-tag` fails, no Release.

## Diffstat

```
 .github/workflows/ci.yml                           |  7 +-
 .github/workflows/gate.yml                         | 13 ++--
 .github/workflows/release.yml                      | 42 ++++++++++--
 README.md                                          |  7 +-
 openspec/changes/faster-ci/.openspec.yaml          |  2 +
 openspec/changes/faster-ci/flow.yaml               |  6 ++
 openspec/changes/faster-ci/proposal.md             | 61 +++++++++++++++++
 openspec/changes/faster-ci/scope.md                | 60 +++++++++++++++++
 .../changes/faster-ci/specs/ci-pipeline/spec.md    | 78 ++++++++++++++++++++++
 .../faster-ci/specs/release-artifact/spec.md       | 40 +++++++++++
 openspec/changes/faster-ci/tasks.md                | 12 ++++
 11 files changed, 313 insertions(+), 15 deletions(-)
```

## Review

Reviewer (fresh context, round 1): no findings in weakened tests, weak tests, spec mismatch or correctness.

Note outside the categories, accepted: the build-provenance attestation is now created in `release.yml` for a tarball built by the `ci.yml` push run, so the provenance records `release.yml` as builder. `gh attestation verify --repo` still passes and the spec is met. Rues-Arcade makes the same trade-off.
