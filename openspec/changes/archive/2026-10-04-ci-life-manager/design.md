## Context

Life-Manager runs as `node build` (adapter-node) on a Debian LXC under systemd, deployed today by Ansible
checking out a pinned commit and building on the host. The only runtime dependency is `marked`; SQLite
comes from `node:sqlite`, so there are no native modules and a tarball built on `ubuntu-latest` runs on
the LXC unchanged. adapter-node leaves `dependencies` external, so the artifact must carry them.

## Decisions

**Tarball carries production `node_modules`.** `npm run package` builds, copies `build/` and
`package.json` into a staging dir, runs `npm ci --omit=dev` there against the lockfile, and tars it. The
host then needs Node and nothing else. *Alternative:* ship without `node_modules` and run `npm ci
--omit=dev` on the host — smaller tarball, but the host needs network and npm at deploy time, and the
tested bits are no longer the deployed bits.

**Artifact e2e reuses the existing suite.** `playwright.config.ts` reads `E2E_APP_DIR`; when set,
`webServer` starts `node build` with that `cwd` and an absolute `DATABASE_PATH`. No second suite. The
smoke scenario already asserts `/` → 200; the whole suite running against the artifact is the stronger
check and costs one more e2e pass in CI.

**Node major comes from the Homelab role.** `nodejs_version: "22"` in `ansible/roles/nodejs` is the
reference; CI writes `node-version: 22` with a comment naming that file. Drift is caught by a human, not
a check — a cross-repo read in CI would need a token for no real gain at one consumer.

**Release = tag `v<version>`, gate re-run on the tag.** `release.yml` does not trust an earlier PR run:
it checks the tag against `package.json`, reruns the CI steps, then publishes with `gh release create`
and `actions/attest-build-provenance`. `version` in `package.json` becomes meaningful and is bumped by
hand before tagging.

**release.yml calls ci.yml rather than repeating its steps.** `ci.yml` also has `workflow_call`; the
release runs `check-tag` → the CI gate on the tag → `publish`, which downloads the gate's uploaded
tarball. The published bytes are the ones the gate tested, and the step list exists once. No npm cache
in CI, since the same job feeds a release.

**CI workflow owned here, not central.** Only the security baseline comes from `Rue-Asha/ci`. A shared
`node-app` workflow is extracted when a second Node service exists; the `proof` / `proof:full` /
`package` script names are the contract it will call.

## Contracts

- `npm run package` → `dist/life-manager-<version>.tgz` + `dist/life-manager-<version>.tgz.sha256`;
  tarball root `life-manager-<version>/` with `build/`, `package.json`, `node_modules/` (prod only).
- `E2E_APP_DIR=<abs path to unpacked root>` → e2e targets that directory's `node build`.
- Runtime env unchanged: `PORT`, `DATABASE_PATH`, `PROTOCOL_HEADER` (app-runtime spec).

## Risks / Trade-offs

- [Release gate can't be proven locally] → The first tag (`v0.1.0`) is the proof run; the mismatch and
  red-gate scenarios are checked once by deliberate bad tags, deleted afterwards.
- [Tarball grows if heavy runtime deps arrive] → Fine at one dependency; revisit if it passes ~50 MB.
- [Node patch differs between CI (setup-node latest 22.x) and LXC (NodeSource latest 22.x)] → Same major,
  same source line; accepted.
