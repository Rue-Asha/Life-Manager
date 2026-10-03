## ADDED Requirements

### Requirement: Harness commands
The repo SHALL provide `npm run proof` (typecheck, build, unit tests), `npm run proof:full` (proof plus
e2e against the Node build) and `npm run dev`. Both proof commands MUST exit non-zero on failure and
print the name of every passed test. (S1)

#### Scenario: Unit suite opens node:sqlite
- **WHEN** `npm run proof` runs the unit suite
- **THEN** a test opens an in-memory `node:sqlite` database and reads back a query result
- **AND** the test's name is printed as passed
- **proof:** unit

#### Scenario: Built app serves a page in e2e
- **WHEN** `npm run proof:full` runs the e2e suite
- **THEN** the Node build is started on `$PORT` with a throwaway database and `/` answers with status 200
- **proof:** e2e

#### Scenario: Dev server serves the app
- **WHEN** Rue runs `npm run dev`
- **THEN** the app is reachable at http://localhost:5173
- **proof:** manual (starting the dev server is the Gate 2 `run` step itself)

### Requirement: Environment configuration
`node build` SHALL read the port from `PORT` and the SQLite file from `DATABASE_PATH`. (S20)

#### Scenario: Port and database path come from the environment
- **WHEN** `node build` starts with `PORT=<p>` and `DATABASE_PATH=<dir>/db.sqlite`
- **THEN** the app listens on port `<p>` and the database file exists at `<dir>/db.sqlite`
- **proof:** e2e

#### Scenario: Missing database directory is created
- **WHEN** `node build` starts with a `DATABASE_PATH` whose directory does not exist
- **THEN** the directory is created and the app starts
- **proof:** e2e

### Requirement: Migrations on start
Schema migrations SHALL run on start; a failing migration MUST stop the process with a non-zero exit code. (S20)

#### Scenario: Fresh database is migrated
- **WHEN** `openDb` opens a new, empty database
- **THEN** the tables aspects, todos, checklist_items, sprints and recurring_rules exist and `user_version` equals the latest migration
- **proof:** unit

#### Scenario: Migration failure exits non-zero
- **WHEN** `node build` starts against a database whose existing `aspects` table conflicts with migration 1
- **THEN** the process exits with a non-zero code
- **proof:** e2e

### Requirement: Health check
`GET /healthz` SHALL return 200 when the app is up and the database is open. (S20)

#### Scenario: Health check returns 200
- **WHEN** a client requests `GET /healthz`
- **THEN** the response status is 200
- **proof:** e2e

### Requirement: Persistence across restarts
Data SHALL be stored in the SQLite file and survive a process restart. (S20)

#### Scenario: Data survives a restart
- **WHEN** an aspect is created, the `node build` process is stopped and started again on the same `DATABASE_PATH`
- **THEN** the aspect is still listed
- **proof:** e2e

### Requirement: Node version declared
`package.json` SHALL declare `engines.node` as `>=22.5`, the first Node with `node:sqlite`. (S23)

#### Scenario: Package declares the Node engine
- **WHEN** the unit suite reads `package.json`
- **THEN** `engines.node` is `>=22.5`
- **proof:** unit

### Requirement: Setup README
The repo SHALL have a README covering setup (Node version, `npm install`, Playwright browser), the npm
scripts (`dev`, `build`, `check`, `proof`, `proof:full`), running `node build`, and the env vars
`PORT`, `DATABASE_PATH` and `LM_TEST`. (S22)

#### Scenario: README documents setup, scripts and env vars
- **WHEN** Rue reads `README.md`
- **THEN** it explains setup, every npm script above, how to run `node build`, and what `PORT`, `DATABASE_PATH` and `LM_TEST` do and default to
- **proof:** manual (documentation, judged by reading it)
