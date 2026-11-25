## ADDED Requirements

### Requirement: Vendored fingerprint
The app SHALL vendor fingerprint 2.1.0 through `Design-System/scripts/sync.sh` (`DESIGN.md`, `DESIGN.json`, `DESIGN-reference.md`, `fingerprint.lock`, `.gitleaks.toml`, `src/lib/styles/fingerprint/`, `scripts/fingerprint/`, the fingerprint fonts) and never edit those files. `proof` SHALL run `check-slop` and `check-drift`. The app's accent SHALL be lagoon (`data-accent="lagoon"` on `<html>`). Life-Manager SHALL be listed in Design-System `apps.txt` by its repo path. Until the cleanup, `check-slop` runs against an app-owned baseline file recorded once at sync time over the old UI; new or changed declarations are checked in full. The vendored `.gitleaks.toml` SHALL keep the `fingerprint.lock` hashes from tripping the secret scan. (S1)

#### Scenario: Proof runs the fingerprint guards
- **WHEN** `package.json` is read
- **THEN** the `proof` script runs `check-slop` (with the baseline until the cleanup) and `check-drift` before the unit tests
- **proof:** unit

#### Scenario: Vendored files match the lock
- **WHEN** `check-drift` runs on the tree
- **THEN** every vendored file hashes to its entry in `fingerprint.lock` (version 2.1.0) and the run exits 0
- **proof:** unit

#### Scenario: Proof fails on a raw colour or an edited vendored file
- **WHEN** a new `.svelte` file with a raw hex colour is added, and separately a vendored fingerprint file is edited
- **THEN** `npm run proof` exits non-zero in each case
- **proof:** manual (mutation check run once by the builder and recorded in the unit report; the files are reverted)

#### Scenario: Lock hashes do not trip the secret scan
- **WHEN** `.gitleaks.toml` is read
- **THEN** it extends the default rules and allowlists the path `fingerprint.lock`
- **proof:** unit

#### Scenario: Life-Manager is a fingerprint app
- **WHEN** Design-System `apps.txt` is read after the change ships
- **THEN** it contains the line `/home/Rue/Repos/RA-Echosystem/Life-Manager`
- **proof:** manual (Design-System is a separate repo; the orchestrator commits the line there and records it in verification.md)

### Requirement: Aspect colours on fingerprint tokens
The eight aspect colours (sage, sky, lavender, ochre, berry, lagoon, tangerine, slate) SHALL resolve to the fingerprint's `--aspect-<name>` tokens, with `--aspect-ink` for an icon on its chip; tints derive from those tokens. Stored aspect colours SHALL keep their current names, so no data changes. An aspect colour is content: it SHALL never stand in for the accent or carry a state alone. (S26, R5)

#### Scenario: Every aspect colour has a fingerprint token
- **WHEN** the keys of `ASPECT_COLORS` and the vendored `src/lib/styles/fingerprint/tokens.css` are read
- **THEN** each of the eight keys has a `--aspect-<key>` token, and every colour `aspect-style.ts` returns is a `var(--aspect-…)` reference, no literal
- **proof:** unit

#### Scenario: Stored aspect colours render without a data change
- **WHEN** aspects with each of the eight colours exist and `/aspects` is opened
- **THEN** each aspect's icon chip has the computed background of its `--aspect-<colour>` token
- **proof:** e2e

### Requirement: Wireframes at gate 4
Before hi-fi work, `openspec/changes/redesign/references.md` SHALL cite Mobbin references per flow (URL plus screen id), and greyscale wireframes SHALL exist for every screen and overlay in the inventory (SC1–SC16, G1–G8) at `/__mockups/redesign/wire/**`, using fingerprint type and spacing only (no accent, imagery, shadow or decoration), each with normal and worst-case data. The mockup routes SHALL answer 404 unless `LM_TEST=1`. A shots e2e SHALL render every mockup page at 375, 768 and 1280 px with normal and worst-case data. Rue's sign-off SHALL be recorded in design.md → "Gate log" before any hi-fi unit starts. (S28)

#### Scenario: Redesign mockups are hidden without the test flag
- **WHEN** a `/__mockups/redesign` route's server load runs without `LM_TEST=1`
- **THEN** it answers 404
- **proof:** manual (mockups removed after Gate 2; evidence in design.md Fidelity log and Gate log, tag gate5-signed)

#### Scenario: Every mockup screen is shot at three widths
- **WHEN** the shots e2e runs
- **THEN** every page directory under `/__mockups/redesign/` renders at 375, 768 and 1280 px with normal and with worst-case data and a screenshot of each lands in `test-results/shots/redesign/`
- **proof:** manual (mockups removed after Gate 2; evidence in design.md Fidelity log and Gate log, tag gate5-signed)

#### Scenario: Worst-case data switches the fixtures
- **WHEN** a mockup page is opened with `?data=worst`
- **THEN** it renders the worst-case set (long titles, many items, empty sets) instead of the normal set
- **proof:** manual (mockups removed after Gate 2; evidence in design.md Fidelity log and Gate log, tag gate5-signed)

#### Scenario: Mockups load no external resources
- **WHEN** any mockup page is opened
- **THEN** every request goes to the app's own origin
- **proof:** manual (mockups removed after Gate 2; evidence in design.md Fidelity log and Gate log, tag gate5-signed)

#### Scenario: References cite Mobbin per flow
- **WHEN** `openspec/changes/redesign/references.md` is read at the gate-4 sign-off
- **THEN** each flow (J1–J13 and navigation) has at least one Mobbin reference given as URL plus screen id
- **proof:** manual (document checked by the orchestrator at gate 4; the file moves with the change on archive)

#### Scenario: Gate 4 sign-off precedes hi-fi
- **WHEN** a gate-5 hi-fi unit is about to start
- **THEN** design.md → Gate log records Rue's gate-4 sign-off with date and picks
- **proof:** manual (human taste gate, recorded by the orchestrator)

### Requirement: Hi-fi mockups at gate 5
Hi-fi mockups SHALL exist at `/__mockups/redesign/hifi/**` for every screen and overlay in the inventory, built on the vendored fingerprint with accent lagoon, showing every contract state per route in English (UK) copy with normal and worst-case data. They SHALL pass `check-slop`, a `break-ui` pass and a fresh-context review per Design-System `scripts/review-brief.md`. Rue's sign-off, together with the master icon, SHALL be recorded in design.md → "Gate log" before any build unit starts. Right after the sign-off the signed commit SHALL be tagged `gate5-signed` and its hi-fi shots frozen as a reference set outside the worktree with a committed checksum manifest, so the signed state survives the mockup deletion. (S29)

#### Scenario: Hi-fi pages render every contract state
- **WHEN** the shots e2e runs over `hifi/**`
- **THEN** each screen has a shot per required contract state (contract §5 "States") at 375, 768 and 1280 px
- **proof:** manual (the orchestrator checks the shot list against contract §5 "States" before the gate-5 review)

#### Scenario: Gate 5 sign-off precedes the build
- **WHEN** the first build unit is about to start
- **THEN** design.md → Gate log records the fresh-context review verdict and Rue's gate-5 sign-off with the master icon, the accent and the new strings
- **proof:** manual (human taste gate, recorded by the orchestrator)

#### Scenario: Signed hi-fi is frozen at gate 5
- **WHEN** Rue has signed off gate 5
- **THEN** the tag `gate5-signed` points at the signed commit, every `hifi-*` shot of that commit sits in the reference set with a `SHA256SUMS` manifest, the same manifest is committed as `fidelity/reference.sha256`, and design.md → Gate log records the tag commit and the shot count
- **AND** no later commit before the mockup deletion changes `src/routes/__mockups/**`
- **proof:** manual (mockups removed after Gate 2; evidence in design.md Gate log: tag gate5-signed and the reference set with its SHA256SUMS outside the worktree)

### Requirement: Built routes match the signed hi-fi
Every built route and overlay SHALL be compared with its signed hi-fi state: a fidelity run SHALL render each real route with seed data equal to the hi-fi fixture (normal and worst case) at 375, 768 and 1280 px, pair each shot with the frozen signed shot, and flag pairs whose pixel diff exceeds the threshold in design.md → Contracts. A flagged pair is a finding, not a failure of `proof` or `proof:full`. After every build wave an agent that is not one of the wave's builders SHALL list every deviation of built from signed; each SHALL be fixed before the wave closes or shown to Rue and recorded with her decision, never kept silently. Build units SHALL lift the markup and CSS of the signed hi-fi into the real components. (S24, S29)

#### Scenario: Built routes are paired with the signed hi-fi
- **WHEN** `npm run fidelity` runs for a set of units
- **THEN** for every pair of those units it writes the signed, built and diff view shots at 375, 768 and 1280 px with normal and worst-case data into `test-results/fidelity/`, plus `report.json` with each pair's diff ratio and flag and the list of unpaired hi-fi pages with their reason
- **AND** a pair over the threshold is flagged while the run still passes, and a missing or checksum-mismatched reference fails the run
- **proof:** manual (mockups and fidelity tooling removed after Gate 2; evidence in design.md Fidelity log: every wave run and the final pass, tag gate5-signed)

#### Scenario: Every deviation of a build wave is fixed or shown to Rue
- **WHEN** a build wave of units 16–26 has been merged
- **THEN** design.md → "Fidelity log" records that wave's fidelity run and the independent design pass, and every deviation it lists is either fixed by a commit or accepted by Rue in her words
- **proof:** manual (orchestrator wave rule, design.md → "Wave rule: fidelity pass"; checked at Verify)

### Requirement: App icon
The master icon SHALL be `Design-System/icons/Life-Manager/icon.svg` per Design-System `icons/TEMPLATE.md` on a lagoon field, built with `build-icons.mjs` and vendored into `static/` by `sync.sh`. `src/app.html` SHALL link the favicon, apple-touch icon and `manifest.webmanifest`, and `theme-color` SHALL come from the icon's `app.json`. The manifest serves the icon only; there is no service worker. (S25)

#### Scenario: Icon files are served
- **WHEN** the icon paths named in `manifest.webmanifest` and the `app.html` links are requested
- **THEN** each answers 200 with an image type
- **proof:** e2e

#### Scenario: Head carries the icon links
- **WHEN** `/` is loaded
- **THEN** the document head has the favicon, apple-touch icon, manifest and `theme-color` entries
- **proof:** e2e

#### Scenario: Icon reads at 16 px
- **WHEN** Rue looks at the icon sheet at 16, 32, 180 and 512 px beside the other apps' icons
- **THEN** the glyph is legible at 16 px and sits in the family
- **proof:** manual (visual judgement at gate 5)

### Requirement: Contract states and English copy
Every route SHALL render every state its contract section lists as applying (empty, single, many, overlong, error, loading where it applies), with English (UK) copy, sentence case and no exclamation marks; copy that the contract lists SHALL stay word for word unless this change's specs rename it. (S24)

#### Scenario: Copy has no exclamation marks
- **WHEN** every `.svelte` file under `src/routes` and `src/lib/components` and the copy module are scanned for user-facing strings
- **THEN** none contains "!" in visible copy
- **proof:** unit

#### Scenario: Contract strings stay
- **WHEN** the copy module and the rendered empty states of Today, Backlog, Recurring, Projects and Uni are compared with contract §7
- **THEN** each listed string appears unchanged
- **proof:** e2e

### Requirement: Accessibility floor
Every screen SHALL meet WCAG 2.2 AA: phone targets of at least 44 × 44 px (24 × 24 minimum for inline controls), visible focus that is not obscured by the bars, no horizontal scroll from 320 to 1920 px, and reduced motion honoured. (S24)

#### Scenario: No horizontal page scroll from 320 to 1920
- **WHEN** every route is opened with the worst-case seed at 320, 390, 768, 1280 and 1920 px
- **THEN** none scrolls horizontally
- **proof:** e2e

#### Scenario: Controls meet the target sizes
- **WHEN** every route is opened at 375 px on a touch viewport
- **THEN** every button, link and form control in the bars, lists and dialogs is at least 44 × 44 px, and inline controls inside text are at least 24 × 24 px
- **proof:** e2e

#### Scenario: Focus is visible and not obscured
- **WHEN** Rue tabs through Today, Sprint and Backlog at 375 px and 1280 px
- **THEN** each focused element shows a focus ring and is not covered by the top bar, the pill bar or the toast
- **proof:** e2e

#### Scenario: Reduced motion removes movement
- **WHEN** with `prefers-reduced-motion: reduce` Rue navigates, opens a dialog and a menu, and moves a todo
- **THEN** no transform or position animation runs; only colour and opacity change
- **proof:** e2e

#### Scenario: WCAG 2.2 AA review passes
- **WHEN** the gate-7 accessibility review runs over every route at 375 and 1280 px
- **THEN** it reports no AA failure
- **proof:** manual (review recorded in verification.md)

#### Scenario: Focusing a bar control keeps the scroll position
- **WHEN** with Today scrolled at 375 px and at 1280 px Rue focuses each link of the main navigation in turn
- **THEN** the page does not scroll
- **proof:** e2e

#### Scenario: A row title only takes clicks inside its own row
- **WHEN** Rue clicks the lower edge of a todo row, or the lower edge of a group toggle, on Today, Backlog and Sprint at 375 px and at 1280 px
- **THEN** the click belongs to that row or toggle: no editor opens for the title of the row below, and the toggle changes its `aria-expanded`
- **proof:** e2e

### Requirement: Chrome text must not select
Chrome text must not select. Text that cannot be edited — kickers, headings, ledes, counts, card text, navigation links, labels, chips, menu items and buttons — SHALL show the default cursor (or its control's pointer inside a link or button), never the text cursor, and SHALL NOT start a text selection or the long-press callout. Only fields (inputs, textareas, selects, editable text) and what Rue wrote herself (todo, project and class notes rendered from Markdown, todo titles in the editor) SHALL be selectable and show the text cursor. (S24)

#### Scenario: Chrome and reading text show the default cursor
- **WHEN** Today and a project page are opened on the desktop with seeded data
- **THEN** the page heading, a kicker, a count, a navigation link, a list group heading and a button have computed cursor `default` or `pointer` and `user-select: none`, never `text` or `auto`
- **proof:** e2e

#### Scenario: Fields and own notes stay selectable
- **WHEN** the todo editor and a project page with Markdown notes are opened on the desktop
- **THEN** the title field and the notes textarea have computed cursor `text`, and the rendered notes allow text selection
- **proof:** e2e

#### Scenario: Group labels are chrome, semester names stay the user's text
- **WHEN** Rue opens a project page with a Done group and `/uni` with an archived semester
- **THEN** the labels "Done (1)" and "Archived (1)" show the default or pointer cursor and do not select, while the semester name inside the opened Archived group keeps the text cursor and selects
- **proof:** e2e

### Requirement: Shared dialogs, menus, toast and error pages
Dialogs and sheets SHALL be built on the fingerprint `sheet` primitive (a centred card from 768 px, a bottom sheet below), trap focus, return it to their trigger, and close on Escape, their close control and an outside click. Every confirmation dialog of contract §6 "Confirmations" SHALL keep its title, message and button labels. The undo toast SHALL be the only toast (`role="status"`, 5 s, "Undo"), announced without taking focus, and SHALL sit above the pill bar, never covering it. Menus SHALL be built on the fingerprint `menu` primitive. Empty states SHALL use the `empty-state` primitive. Unknown ids on `/aspects/[id]`, `/projects/[id]` and `/uni/classes/[id]` SHALL show a fingerprint 404 page with status 404 and a link back to the list. (S23)

#### Scenario: Every dialog traps focus and returns it
- **WHEN** the todo editor, the quick add, each confirmation dialog and the backlog sheet are opened in turn and closed with Escape
- **THEN** focus stays inside each while open and returns to its trigger after closing
- **proof:** e2e

#### Scenario: Dialogs are bottom sheets on the phone and cards from 768 px
- **WHEN** the todo editor is opened at 375 px and at 1280 px
- **THEN** at 375 px it is anchored to the bottom edge of the viewport and at 1280 px it is centred
- **proof:** e2e

#### Scenario: Confirmation dialogs keep their copy
- **WHEN** each confirmation of contract §6 is opened (delete todo, rule, project, class, semester, aspect; mark implemented; archive semester; change IT aspect; change Uni aspect)
- **THEN** each shows its listed title and confirm label and "Cancel"
- **proof:** e2e

#### Scenario: Toast does not cover the pill bar
- **WHEN** at 375 px Rue ticks a todo done on Today and the undo toast shows
- **THEN** the toast's bottom edge is above the pill bar's top edge and it is announced by a `role="status"` element without moving focus
- **proof:** e2e

#### Scenario: Unknown detail ids show the 404 page
- **WHEN** `/aspects/99999`, `/projects/99999` and `/uni/classes/99999` are opened
- **THEN** each answers 404, renders inside the fingerprint frame and links back to its list
- **proof:** e2e

#### Scenario: Opening and closing an overlay keeps the scroll position
- **WHEN** with the page scrolled on Today, Sprint and Backlog at 375 px and at 1280 px Rue opens "New todo" and the todo editor and closes each with Escape
- **THEN** the scroll position is unchanged while each is open and after each closes
- **proof:** e2e

### Requirement: Spec-named tests survive the redesign
Every e2e test that a `proof:` line in `openspec/specs` names (by quoted name, or as "Scenario: <title>" for a bare `e2e` line) and that exists at the start of this change SHALL be recorded in `scripts/spec-tests.txt` and SHALL still exist in `e2e/` at every merge, unless this change REMOVES or MODIFIES its requirement and the delta names the test's replacement or deletion; the unit that retires such a test removes its line in the same commit. `__test/*` hooks stay unchanged. (S27)

#### Scenario: Every spec-named e2e test still exists
- **WHEN** every title in `scripts/spec-tests.txt` is looked up among the test titles in `e2e/`
- **THEN** each is found, and every line removed from the list since it was recorded is a test that a delta of this change retires or renames
- **AND** the removal check is done by the reviewer against the deltas (`git log -p scripts/spec-tests.txt`)
- **proof:** unit

### Requirement: No old styling
`src/lib/styles/tokens.css`, `design/`, the old shell components, the Bricolage Grotesque font and the slop baseline SHALL be gone before Verify, and `proof` SHALL run `check-slop` without a baseline. Every `/__mockups/redesign` route, its shots e2e and the fidelity tooling SHALL stay until Rue's final acceptance (flow Gate 2), so she can open the signed hi-fi beside the built route, and SHALL be gone before the release is tagged. (S26)

#### Scenario: Old style files are gone
- **WHEN** the tree is listed
- **THEN** `src/lib/styles/tokens.css`, `design/`, `src/lib/components/shell/Sidebar.svelte`, `src/lib/components/shell/HomeList.svelte`, `src/lib/components/shell/RailLayout.svelte` and `scripts/slop-baseline.txt` do not exist and `package.json` has no `@fontsource-variable/bricolage-grotesque`
- **proof:** unit

#### Scenario: Mockup routes are gone after the final acceptance
- **WHEN** the tree is listed after Gate 2
- **THEN** `src/routes/__mockups/`, `e2e/redesign-shots.test.ts` and `fidelity/` do not exist and `package.json` has no `fidelity` script, `pixelmatch` or `pngjs`
- **proof:** unit

#### Scenario: Proof runs check-slop without a baseline
- **WHEN** `package.json` is read
- **THEN** the `proof` script is the line `sync.sh` writes, with `check-slop` and no `--baseline`
- **proof:** unit

## REMOVED Requirements

### Requirement: Design brief grounded in Mobbin
**Reason**: The direction is the shared fingerprint (Design-System `DESIGN.md`); `design/brief.md` is deleted (S26).
**Migration**: Mobbin references for this change live in `openspec/changes/redesign/references.md` ("Wireframes at gate 4").

### Requirement: Design tokens and style tile
**Reason**: Tokens come from the vendored fingerprint; `tokens.css` and `design/style-tile.html` are deleted (S1, S26).
**Migration**: "Vendored fingerprint" and "Aspect colours on fingerprint tokens".

### Requirement: Approval before feature UI
**Reason**: Replaced by the gate 4 and gate 5 sign-offs.
**Migration**: "Wireframes at gate 4", "Hi-fi mockups at gate 5".

### Requirement: Brief records motion and wide-layout decisions
**Reason**: The brief and the three-column layout are gone; motion follows the fingerprint and the motion spec.
**Migration**: motion "Moves travel to their new place", "Navigation cross-fades", "Family press and overlay motion".

### Requirement: Projects mockup approved before Projects UI
**Reason**: Historical gate of an archived change; `design/projects-mockup.html` is deleted.
**Migration**: Projects screens are covered by the gate 4 and gate 5 mockups.

### Requirement: Uni mockup approved before Uni UI
**Reason**: Historical gate of an archived change; `design/uni-mockup.html` is deleted.
**Migration**: Uni screens are covered by the gate 4 and gate 5 mockups.

### Requirement: Cohesive look mockup approved before restyle
**Reason**: Historical gate; `design/cohesive-mockup.html` and `design/shots/` are deleted.
**Migration**: "Hi-fi mockups at gate 5".

### Requirement: Tokens pass contrast with the new palette
**Reason**: `tokens.css` and `design/palettes/check-contrast.mjs` are deleted; contrast is the fingerprint's responsibility (Design-System `check-contrast.mjs`, `contrast-pairs.json`).
**Migration**: "Accessibility floor" (gate-7 WCAG 2.2 AA review).

### Requirement: One list anatomy
**Reason**: The `--surface` grouped-card anatomy is replaced by the fingerprint's solid cards and `list-row` primitive as signed at gate 5.
**Migration**: The test "Scenario: No todo row draws its own border" (`e2e/list-anatomy.test.ts`) is deleted with the file.
