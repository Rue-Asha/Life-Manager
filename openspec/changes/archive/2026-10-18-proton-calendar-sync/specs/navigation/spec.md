## ADDED Requirements

### Requirement: Proton sync link
The sidebar and the phone home list SHALL link the "Proton sync" page (`/sync`) outside the eight lists: in the
sidebar below the aspects, on the home list as its own grouped card below the lists card (not part of the "Lists"
navigation). The link SHALL show a warning marker (`data-testid="sync-marker"`, accessible name "Needs attention") while
the sync state is "re-login needed" or "error", and none otherwise. (proton-calendar-sync S12)

#### Scenario: Sync link in the sidebar and the home list
- **WHEN** `/` is opened at 1280 px and `/menu` at 375 px, and then the sidebar link is followed
- **THEN** the sidebar shows "Proton sync" after the aspects with the eight lists unchanged before it, the home list shows it in a card of its own below the eight lists, and on `/sync` the sidebar link is the only current entry
- **proof:** e2e

#### Scenario: Sync link warns on re-login needed or error
- **WHEN** the sync state is "up to date", then "re-login needed" (fake exits 2), then "error" (missing binary)
- **THEN** neither the sidebar nor the home list link shows `sync-marker` in the first state, and both show it in the other two
- **proof:** e2e
