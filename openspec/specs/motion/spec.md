# motion Specification

## Purpose
TBD - created by archiving change sprint-management. Update Purpose after archive.
## Requirements
### Requirement: Moves travel to their new place
A todo moving between rail and sprint, between board columns, or between days SHALL animate to its new
place (FLIP / crossfade on the fingerprint motion tokens) while the gap it left closes over the same duration and counts
update. Dragging shows the fingerprint's drag ghost without tilt and a hairline drop slot. A move the server refuses
animates back to where it was. Under `prefers-reduced-motion: reduce` moves are instant. (S12, S10)

#### Scenario: Moving a todo from the rail starts a move animation
- **WHEN** Rue clicks "Add to sprint" on a rail todo with motion allowed
- **THEN** an animation is running on the page within 100 ms of the click, and after 400 ms the todo is in the sprint list and the rail count has decreased by one
- **proof:** e2e

#### Scenario: Reduced motion moves instantly
- **WHEN** with `prefers-reduced-motion: reduce` Rue adds a rail todo to the sprint and moves a board card to Doing
- **THEN** no animation is running on the page at any point after either action, and both todos are in their new place
- **proof:** e2e

#### Scenario: Refused move returns the item to where it was
- **WHEN** on desktop Rue drags a board card from To do to Doing and the server refuses the status change
- **THEN** the card ends up back in the To do column
- **proof:** e2e

#### Scenario: Moves look like they travel
- **WHEN** Rue moves todos between rail and sprint, between board columns and between days, and drags a card
- **THEN** each todo visibly travels to its new place, the gap closes, the dragged card floats without tilt over a hairline drop slot
- **proof:** manual (motion quality is a visual judgement, made by Rue at Gate 2)

### Requirement: Navigation cross-fades
Route changes and sprint view switches SHALL cross-fade the content in 120–200 ms using the View
Transitions API where available; the top bar and the pill bar stay in place during the transition. Without View Transitions, or
under `prefers-reduced-motion: reduce`, navigation is instant. (S13, S24)

**Removed scenario** (REMOVED works per requirement, so this MODIFIED block retires it by omission): main-spec "Rail slides in with the content reflowing". Reason: the context-rail overlay is removed (the rail is a card below 1280 px and a column from 1280 px), so there is no overlay to slide in; content cross-fade on navigation stays proven by the scenarios below and "Navigation keeps the bars still". Migration: none.

#### Scenario: Route changes and view switches use a view transition
- **WHEN** with motion allowed Rue clicks a top bar link and then switches the sprint view from "By aspect" to "Board"
- **THEN** `document.startViewTransition` was called once for each navigation
- **proof:** e2e

#### Scenario: Navigation without View Transitions is instant
- **WHEN** `document.startViewTransition` is unavailable and Rue clicks a top bar link
- **THEN** the target screen's heading is shown and no error is logged to the console
- **proof:** e2e

#### Scenario: Reduced motion navigates without a transition
- **WHEN** with `prefers-reduced-motion: reduce` Rue clicks a top bar link and switches the sprint view
- **THEN** `document.startViewTransition` was never called
- **proof:** e2e

#### Scenario: Navigation keeps the bars still
- **WHEN** Rue navigates between screens at 375 px and at 1280 px with motion allowed
- **THEN** the content cross-fades while the pill bar and the top bar do not move or fade
- **proof:** e2e (the bar is its own transition group and runs no animation while the root group does; how the motion looks stays Rue's call at Gate 2)

### Requirement: Family press and overlay motion
Buttons, links, rows and pills SHALL give press feedback with the fingerprint press scale (also on iOS through a passive `touchstart` listener so `:active` fires); the current-tab pill SHALL glide between tabs; menus SHALL open in 160 ms and close in 120 ms from their trigger (opacity and scale from 0.97), bottom sheets slide up in 260 ms, centred cards rise and grow from 0.97 in 160 ms; a created row settles in, a removed row fades and the rest glide (FLIP); cards settle on a full page load only. All durations and curves come from the fingerprint motion tokens. Keyboard activation, status changes and ticking stay instant. Under `prefers-reduced-motion: reduce` only colour and opacity change. (S24)

#### Scenario: Menus and sheets open softly
- **WHEN** with motion allowed Rue opens a todo row's status menu at 1280 px and the todo editor at 375 px
- **THEN** an animation is running on the menu within 50 ms and finishes within 200 ms, and the sheet's animation finishes within 300 ms
- **proof:** e2e

#### Scenario: A todo added on Today settles in and ticking stays instant
- **WHEN** with motion allowed Rue adds a todo through Today's own quick add and then ticks another row done
- **THEN** the new row has a running animation within 200 ms of appearing, and the ticked row has none
- **proof:** e2e

#### Scenario: Reduced motion opens overlays without movement
- **WHEN** with `prefers-reduced-motion: reduce` Rue opens a todo row's status menu and the todo editor
- **THEN** no running animation changes `transform`, `translate` or `scale`
- **proof:** e2e

#### Scenario: Press feedback feels native on the phone
- **WHEN** Rue taps the pill bar tabs, the "+", a row and a dialog button on her phone
- **THEN** each shows the press state on touch and the current pill glides
- **proof:** manual (`:active` timing and feel need real hardware)

