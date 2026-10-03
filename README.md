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

`proof:full` starts the build on `$PORT` (default 4173) with a throwaway database under `.e2e/`;
the runtime tests start their own servers on `$PORT + 1000`. Set `PORT` if those ports are taken.

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
| `LM_TEST` | unset | `1` enables the test hooks (`/__test/reset`, `/__test/seed`, `/__test/clock`) that wipe and seed the database. For the e2e suite only — **never set it in production** |

`HOST` and the rest of adapter-node's variables work as documented for
[`@sveltejs/adapter-node`](https://svelte.dev/docs/kit/adapter-node#Environment-variables).

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
