## MODIFIED Requirements

### Requirement: Harness commands
The repo SHALL provide `npm run proof` (typecheck, build, unit tests), `npm run proof:full` (proof plus
e2e against the Node build), `npm run package` (build and write the release tarball, see
release-artifact) and `npm run dev`. Both proof commands MUST exit non-zero on failure and
print the name of every passed test. When `E2E_APP_DIR` is set, the e2e suite SHALL start the Node build
from that directory instead of the working tree, so the same suite can test an unpacked artifact. (S1)

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

#### Scenario: e2e runs against an unpacked artifact
- **WHEN** the tarball is unpacked into an empty directory and the e2e suite runs with `E2E_APP_DIR` set to it
- **THEN** the server is started from that directory, not from the repo's `build/`
- **AND** `/` answers with status 200
- **proof:** e2e ("Scenario: Built app serves a page in e2e", run with `E2E_APP_DIR` in CI)
