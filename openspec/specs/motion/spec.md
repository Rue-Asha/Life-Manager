# motion Specification

## Purpose
TBD - created by archiving change sprint-management. Update Purpose after archive.
## Requirements
### Requirement: Moves travel to their new place
A todo moving between rail and sprint, between board columns, or between days SHALL animate to its new
place (FLIP / crossfade, 200 ms ease-out) while the gap it left closes over the same 200 ms and counts
update. Dragging shows `--shadow-float` without tilt and a hairline drop slot. A move the server refuses
animates back to where it was. Under `prefers-reduced-motion: reduce` moves are instant. (S12)

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
- **THEN** each todo visibly travels to its new place in about 200 ms, the gap closes, the dragged card floats without tilt over a hairline drop slot
- **proof:** manual (motion quality is a visual judgement, made by Rue at Gate 2)

### Requirement: Navigation cross-fades
Route changes and sprint view switches SHALL cross-fade the content in 120–200 ms using the View
Transitions API where available; opening or closing the rail on desktop slides it in over 320 ms while the
content reflows, without a scrim. There are no entrance or hover animations. Without View Transitions, or
under `prefers-reduced-motion: reduce`, navigation is instant. (S13)

#### Scenario: Route changes and view switches use a view transition
- **WHEN** with motion allowed Rue clicks a sidebar link and then switches the sprint view from "By aspect" to "Board"
- **THEN** `document.startViewTransition` was called once for each navigation
- **proof:** e2e

#### Scenario: Navigation without View Transitions is instant
- **WHEN** `document.startViewTransition` is unavailable and Rue clicks a sidebar link
- **THEN** the target screen's heading is shown and no error is logged to the console
- **proof:** e2e

#### Scenario: Reduced motion navigates without a transition
- **WHEN** with `prefers-reduced-motion: reduce` Rue clicks a sidebar link and switches the sprint view
- **THEN** `document.startViewTransition` was never called
- **proof:** e2e

#### Scenario: Rail slides in with the content reflowing
- **WHEN** Rue opens and closes the rail overlay at 1100 px and navigates between screens at 1280 px
- **THEN** the rail slides in over about 320 ms without a scrim, content cross-fades on navigation, and nothing animates on page load or hover
- **proof:** manual (motion quality is a visual judgement, made by Rue at Gate 2)

