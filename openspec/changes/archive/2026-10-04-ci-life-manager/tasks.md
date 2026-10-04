## 1. Package the artifact

> unit: depends=none · files=scripts/package.mjs, package.json, .gitignore

- [x] 1.1 Add `scripts/package.mjs` and `"package": "npm run build && node scripts/package.mjs"` producing the tarball + `.sha256` per the Contracts in design.md
- [x] 1.2 Add `/dist` to `.gitignore`
- [x] 1.3 Run `npm run package` locally; check with `tar -tzf` that `src/`, `.svelte-kit/` and dev deps are absent, and `sha256sum -c` reports OK

## 2. e2e against an unpacked artifact

> unit: depends=1 · files=playwright.config.ts, e2e/runtime.test.ts

- [x] 2.1 Make `playwright.config.ts` honour `E2E_APP_DIR` (webServer `cwd`, absolute `DATABASE_PATH`); default behaviour unchanged
- [x] 2.2 Unpack the tarball into a scratch dir and run `E2E_APP_DIR=<dir> npm run test:e2e`; confirm green
- [x] 2.3 Prove by mutation: skip `npm ci --omit=dev` in the package script, repackage, confirm the artifact e2e is red and `proof:full` is green; revert (moving `marked` to dev stays green — adapter-node bundles devDependencies)

## 3. CI workflow

> unit: depends=2 · files=.github/workflows/ci.yml, .github/dependabot.yml

- [x] 3.1 Add `.github/workflows/ci.yml`: Node 22 (comment → Homelab `ansible/roles/nodejs/defaults/main.yml`), Playwright browsers, `npm ci`, `proof:full`, `package`, checksum, unpack, artifact e2e, upload artifact; `security-baseline` job calling `Rue-Asha/ci@<sha> # v1.0.0` (needs `ci-homelab` group 2)
- [x] 3.2 Add `.github/dependabot.yml` for `github-actions` (and `npm`, weekly)
- [x] 3.3 Ask first: push a branch and open a PR; confirm `ci` and baseline checks green and the artifact is downloadable

## 4. Release workflow

> unit: depends=3 · files=.github/workflows/release.yml, package.json

- [x] 4.1 Add `.github/workflows/release.yml` on `push: tags: ['v*']`: tag/version check, the CI steps, `gh release create` with tarball + `.sha256`, `actions/attest-build-provenance`; write permissions on the publish job only
- [x] 4.2 Set `package.json` `version` to `0.1.0`
- [x] 4.3 ⚠ irreversible — publish: after merge, push tag `v0.1.0`; verify the Release assets, `sha256sum -c`, and `gh attestation verify`
- [ ] 4.4 ⚠ irreversible — publish: push a mismatched tag, confirm no Release is created, delete the tag

## 5. Enforce and document

> unit: depends=4 · files=CLAUDE.md, README.md

- [x] 5.1 Ask first: create a `main` ruleset requiring `ci` and the baseline checks
- [x] 5.2 Add the `package` command under `## Harness` and the new specs under `## Specs` in CLAUDE.md
- [x] 5.3 Run `update-docs` (README: how to cut a release)
