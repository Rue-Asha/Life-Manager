# Life Manager

A self-hosted weekly-sprint todo app for the aspects of a life (health, uni, job, …): one backlog,
one Monday–Sunday sprint with planning and review, and a Today view. Single user, no login; it is
meant to sit on a LAN or VPN. SvelteKit, SQLite via `node:sqlite`, `adapter-node`.

## Setup

Requires **Node 22.5 or newer** (`node:sqlite` first ships there).

```sh
npm install
npx playwright install chromium   # browser for the e2e suite
npm run dev                       # http://localhost:5173
```

The first visit asks for your aspects; the database starts empty.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:5173 |
| `npm run build` | Production build into `build/` |
| `npm run check` | Typecheck (svelte-check) |
| `npm run proof` | `check`, `build` and the unit tests (Vitest) |
| `npm run proof:full` | `proof`, then the Playwright e2e suite against `node build` |
| `npm run package` | `build`, then the release tarball `dist/life-manager-<version>.tgz` and its `.sha256` |

`proof:full` starts the build on `$PORT` (default 4173) with a throwaway database under `.e2e/`;
the runtime tests start their own servers on `$PORT + 1000`. Set `PORT` if those ports are taken.
Set `E2E_APP_DIR` to an unpacked release tarball to run the same e2e suite against it instead of
the working tree's `build/`; CI does this on every PR.

## Releases

Each [GitHub Release](https://github.com/Rue-Asha/Life-Manager/releases) carries
`life-manager-<version>.tgz`: `build/`, `package.json` and the production `node_modules`, so it
runs with Node alone, no install or build step. Check it before unpacking:

```sh
sha256sum -c life-manager-<version>.tgz.sha256
gh attestation verify life-manager-<version>.tgz --repo Rue-Asha/Life-Manager
tar -xzf life-manager-<version>.tgz && cd life-manager-<version>
```

Then start it as in [Running the build](#running-the-build), skipping `npm run build`.

To cut a release, bump `version` in `package.json` (and `package-lock.json` via
`npm install --package-lock-only`), merge that to `main`, then tag the merge commit:

```sh
git tag -a v<version> -m v<version> && git push origin v<version>
```

The release workflow refuses a tag that doesn't match `package.json`, waits for the green CI push
run on the tagged commit, and publishes that run's tarball, with its checksum and a
build-provenance attestation. Tag soon after the merge: the tarball expires with the artifact
retention, and if it has, `gh run rerun <id>` the push run and push the tag again.

## Docker

Each release also publishes an image to `ghcr.io/rue-asha/life-manager` (tags `<version>`,
`<major>.<minor>`, `latest`). It is built in the release workflow from the verified release
tarball, not from source, and only on a version tag, never on pushes to `main` or PRs.

```yaml
services:
  life-manager:
    image: ghcr.io/rue-asha/life-manager:<version>
    ports:
      - "3000:3000"
    volumes:
      - life-manager-data:/data
    environment:
      ORIGIN: http://localhost:3000   # the URL you open the app at, else form posts get a 403
    restart: unless-stopped

volumes:
  life-manager-data:
```

The server binds `0.0.0.0:3000` as the unprivileged `node` user and keeps its SQLite database in
`/data`. Behind a reverse proxy, drop `ORIGIN` and set `PROTOCOL_HEADER=x-forwarded-proto` as in
[Behind a reverse proxy](#behind-a-reverse-proxy). The other variables from
[Environment](#environment) apply too.

## Running the build

```sh
npm run build
PORT=3000 DATABASE_PATH=/var/lib/life-manager/life-manager.db PROTOCOL_HEADER=x-forwarded-proto node build
```

This expects a reverse proxy in front that sends `X-Forwarded-Proto` (see
[Behind a reverse proxy](#behind-a-reverse-proxy)). Opened directly over plain http, pages load but
every form post is rejected with a 403, so the app is effectively read-only.

Migrations run on start; a failing migration exits non-zero. The database directory is created if
it is missing. `GET /healthz` answers `200 ok` once the database is open.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port `node build` listens on |
| `DATABASE_PATH` | `./data/life-manager.db` | SQLite file; relative paths resolve against the working directory |
| `PROTOCOL_HEADER` | unset | Header that carries the original protocol. Set to `x-forwarded-proto` behind a proxy (see below) |
| `HOST_HEADER` | unset | Header that carries the original host. Set to `x-forwarded-host` only if the proxy rewrites `Host` |
| `PROTON_CLI` | unset | Path to the [`proton`](https://github.com/roman-16/proton-cli) binary (v5.1.0). Unset or empty turns the Proton Calendar sync off |
| `PROTON_PROFILE` | `default` | proton-cli profile the sync uses |
| `LM_TEST` | unset | `1` enables the test hooks (`/__test/reset`, `/__test/seed`, `/__test/clock`) that wipe and seed the database. For the e2e suite only — **never set it in production** |

`HOST` and the rest of adapter-node's variables work as documented for
[`@sveltejs/adapter-node`](https://svelte.dev/docs/kit/adapter-node#Environment-variables).

### Proton Calendar sync

Planned todos, recurring rules and exams are pushed one way to Proton Calendar (one calendar per
aspect) by the `proton` CLI. Sync is off without `PROTON_CLI`; set it to the binary's path and
restart. The app never logs in itself. It reads the CLI's session from
`$XDG_CONFIG_HOME/proton-cli/sessions/<profile>.json` (`PROTON_PROFILE`, default `default`), so the
service and the login must share `XDG_CONFIG_HOME`. For the first login, and again whenever Proton
asks for CAPTCHA or the session expires, run on the server:

```sh
proton account login --profile <profile>
```

### Behind a reverse proxy

Without a protocol header adapter-node assumes `https`, so over plain http every form post fails
SvelteKit's origin check with a 403. Run the app behind a proxy that sends the protocol, and point
`PROTOCOL_HEADER` at it. For nginx:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

```sh
PROTOCOL_HEADER=x-forwarded-proto node build
```

If nginx passes a different `Host` upstream, also send `X-Forwarded-Host $host` and set
`HOST_HEADER=x-forwarded-host`.
