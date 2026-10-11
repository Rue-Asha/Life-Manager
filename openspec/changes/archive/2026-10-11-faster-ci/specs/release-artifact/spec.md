## MODIFIED Requirements

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
