## MODIFIED Requirements

### Requirement: Environment configuration
`node build` SHALL read the port from `PORT` and the SQLite file from `DATABASE_PATH`, and the Proton sync settings from
`PROTON_CLI` (path to the `proton` binary; unset or empty = sync off) and `PROTON_PROFILE` (default `default`); the
`proton` child process inherits the environment, so its session lives under `XDG_CONFIG_HOME`
(`$XDG_CONFIG_HOME/proton-cli/sessions/<profile>.json`). (S20, proton-calendar-sync S13)

#### Scenario: Port and database path come from the environment
- **WHEN** `node build` starts with `PORT=<p>` and `DATABASE_PATH=<dir>/db.sqlite`
- **THEN** the app listens on port `<p>` and the database file exists at `<dir>/db.sqlite`
- **proof:** e2e

#### Scenario: Missing database directory is created
- **WHEN** `node build` starts with a `DATABASE_PATH` whose directory does not exist
- **THEN** the directory is created and the app starts
- **proof:** e2e

#### Scenario: Proton settings come from the environment
- **WHEN** the sync config is read with `PROTON_CLI` set and `PROTON_PROFILE` unset, then set
- **THEN** sync is on with that binary and the profile "default", then the given profile; without `PROTON_CLI` sync is off
- **proof:** unit ("Scenario: Profile defaults to default", "Scenario: PROTON_CLI unset turns sync off")

### Requirement: Setup README
The repo SHALL have a README covering setup (Node version, `npm install`, Playwright browser), the npm
scripts (`dev`, `build`, `check`, `proof`, `proof:full`), running `node build`, and the env vars
`PORT`, `DATABASE_PATH`, `LM_TEST`, `PROTON_CLI` and `PROTON_PROFILE`, including where the proton-cli session lives
(`XDG_CONFIG_HOME`) and the `proton account login --profile <profile>` command for a first or renewed login. (S22,
proton-calendar-sync S13)

#### Scenario: README documents setup, scripts and env vars
- **WHEN** Rue reads `README.md`
- **THEN** it explains setup, every npm script above, how to run `node build`, what `PORT`, `DATABASE_PATH`, `LM_TEST`, `PROTON_CLI` and `PROTON_PROFILE` do and default to, where the proton-cli session lives and how to log in again
- **proof:** manual (documentation, judged by reading it)
