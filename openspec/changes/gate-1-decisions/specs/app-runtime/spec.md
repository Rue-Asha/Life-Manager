## MODIFIED Requirements

### Requirement: Setup README
The repo SHALL have a README covering setup (Node version, `npm install`, Playwright browser), the npm
scripts (`dev`, `build`, `check`, `proof`, `proof:full`), running `node build`, and the env vars
`PORT`, `DATABASE_PATH`, `LM_TEST`, `PROTON_CLI` and `PROTON_PROFILE`, including where the proton-cli session lives
(`XDG_CONFIG_HOME`) and the `proton account login --profile <profile>` command for a first or renewed login. It SHALL also state, as a labelled deployment requirement, that plain-http access without `PROTOCOL_HEADER` (behind a proxy) or `ORIGIN` makes every form post fail with HTTP 403 and leaves the app read-only; the app itself shows no warning for it. (S22,
proton-calendar-sync S13)

#### Scenario: README documents setup, scripts and env vars
- **WHEN** Rue reads `README.md`
- **THEN** it explains setup, every npm script above, how to run `node build`, what `PORT`, `DATABASE_PATH`, `LM_TEST`, `PROTON_CLI` and `PROTON_PROFILE` do and default to, where the proton-cli session lives and how to log in again, and a paragraph labelled as a deployment requirement that explains the 403 and names `PROTOCOL_HEADER` and `ORIGIN` as the fix
- **proof:** manual (documentation, judged by reading it)
