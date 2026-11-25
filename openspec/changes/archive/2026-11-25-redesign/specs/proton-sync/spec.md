## ADDED Requirements

### Requirement: Sync page on the fingerprint
`/sync` SHALL render on the fingerprint in all five states (Off, Up to date, Syncing…, Re-login needed, Error) with "Last sync" ("Never" before the first pass), pending changes, the last error, the failed items under the next step "Edit an item to try it again, or press Sync now.", "Sync now" and "Resync all". While Syncing the buttons SHALL be disabled and the page polls; in Re-login needed the CLI command `proton account login --profile <profile>` SHALL be shown in a copyable block; Off shows only its notice. Outside Off the note "How sync works" sits in a side panel: a right column from 1280 px and a card stacked below the state under 1280 px (gate 4 pick a). (S22)

#### Scenario: Sync page renders every state
- **WHEN** `/sync` is opened in Off, Up to date, Syncing, Re-login needed and Error (fake proton CLI)
- **THEN** Off shows only the notice naming `PROTON_CLI`, Up to date shows the state rows and both buttons, Syncing shows both buttons disabled, Re-login needed shows the login command, and Error shows the last error
- **proof:** e2e

#### Scenario: Re-login command can be copied
- **WHEN** the state is Re-login needed and Rue activates the copy control next to the command
- **THEN** the clipboard holds `proton account login --profile default`
- **proof:** e2e

#### Scenario: Never synced and no failed items
- **WHEN** no pass has run and no item failed
- **THEN** "Last sync" reads "Never" and no "Failed items" region exists
- **proof:** e2e

#### Scenario: Many failed items wrap
- **WHEN** 20 items failed with 300-character errors and the page is opened at 375 px
- **THEN** every failed item is listed with its error wrapped and the page does not scroll horizontally
- **proof:** e2e
