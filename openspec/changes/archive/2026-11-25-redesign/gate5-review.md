# Gate 5 review state (2026-11-22)

Three fresh-context review rounds (Design-System `scripts/review-brief.md`), three fixer rounds. Round 3 verdict from all three reviewers: **partly, gate closed**. The family reads as a sibling (frame over photo, Gilda title with one accent word, charcoal current pill, charcoal key-facts card); what remains is below.

## Still broken after round 3 (mechanical, no taste needed)

1. Uni / Class forms: icon picker shows 23 empty pill outlines, only the selected glyph renders; swatches and icon buttons are ovals, not circles.
2. Sprint @1280 normal data: backlog rail missing (shows only with worst data); with worst data the rail glass is translucent, list text ~2:1 over the photo, list cut by a fade with no scroll affordance.
3. Calendar: day cells ~40 px wide at 375; "Planned" and "Exam" legend markers are both filled dots; busy @375 exam title breaks per character ("Exam · / Database / s"); 1280 worst day-panel header on see-through glass.
4. Long pages @375 (sprint, plan, backlog, overlays, today worst): the photo backdrop ends before the page does, flat beige band below the frame.
5. Confirm dialogs @375 (aspect delete, project mark-implemented, overlays confirms): footer buttons wrap into a staircase.
6. Editor / quick add @375 touch: duration chips ~30 px tall, checklist tick and trash ~24 px (round 3 reported them fixed; the review shots disagree — recheck).
7. Toast two-line clamp leaks the top of a third line (overlays toast, today undo @375).
8. Today worst: segmented progress bar with 25 aspects unreadable and short of the card edge at 375; Overdue 30 uncollapsed pushes the day ~4,000 px down.
9. State by colour alone: pale-blue unticked circles on some Today rows and Aspect sprint rows; top-bar overdue count red only.
10. Plan @1280: backlog card clipped mid-row without scroll cue.
11. Sprint Week @1280/768: day-cell titles cut to ~12 chars even with normal data.
12. Sprint phase review-available @375: "This sprint ends today." beside "5 days left".
13. Project @375: linked-todo titles cramped and unclamped (10+ lines); Aspect @375 worst: 100+ backlog rows unpaged (~13,000 px) while Uni pages.
14. Recurring form @375: checklist input and "Add item" ~12 px left of the other fields; Uni semester card head in Gilda with wide tracking unlike other card heads.
15. Class worst: title clamps before the accent word (no accent), @1280 ends "-…"; Aspect @768/1280 worst: icon floats mid-height beside a 3-line title.
16. Truncation without affordance: Sync failed titles (lede says full text is in the tooltip), Project repo link and 40-char tag, More menu long aspect name.
17. Overlays editor @375: kicker on the dark forest band without scrim (low contrast).
18. Today empty @375: "Week view" white pill on white card has no visible edge.
19. Sprint Manage sheet @375: "Close" charcoal pill and × both close; Close takes the primary slot.
20. Copy (voice, not contract): "All 4 done. Nice week." (cheery), Projects empty "Capture your first idea." (marketing tone), Class "✓ Revised today" (state, not verb + object), Sync "Error: invalid event end time" (no next step).

## Taste questions (Rue, gate 5) — see the gallery

Q1 Aspects Move up/down (all reviewers, three rounds) · Q2 icon (all reviewers: stock glyph; hinted 16 illegible) · Q3 dark "New …" head pills · Q4 key-facts card on Welcome/Aspects/Backlog/More/phase prompts (and on phone for Aspect/Project/Class, dropped per gate-4 pick c) · Q5 Week @1280 · Q6 Board status chips + Doing colour · Q7 Calendar card · Q8 LEC/EXC/OTH · Q9 Move 3 vs 4 · Q10 sticky Review panel · Q11 More/Recurring @1280 single wide column · Q12 contract copy · new: Welcome picked presets in accent fill instead of the charcoal pressed state · Backlog "Plan a day" + "Add to sprint" pill pair on every row.

## Polish carried from the late round-3 measurement

See `flow.yaml` → `gate5_polish_candidates`.

## Rue's answers (2026-11-22, interactive)

- Q1 Aspects reorder: Move up/Move down go into the row's ··· menu; the drag handle stays (supersedes the gate-4 pick "Move buttons stay visible on phones").
- Q2 Icon: new round; A/B/C rejected as stock glyphs.
- Q3 Head "New …" pills on Projects, Uni, Recurring: secondary (glass), charcoal stays for the current thing and the one main action.
- Q4 Key-facts card: add a small one on Aspects and Backlog (real counts); Welcome, More and the phase prompts are recorded exceptions.
- Q5 Sprint Week @1280: the backlog rail becomes collapsible in the Week view; collapsed = 7 full columns (titles readable), expanded = days wrap (supersedes the gate-4 pick "Week at 1280 keeps the rail, ~131 px columns").
- Q6 Board: the per-card status chip goes; status changes via the card's ··· menu and drag. Doing column stays light (one charcoal card per screen).
- Q7 Calendar key-facts card "November": keep.
- Q8 Uni types LEC/EXC/OTH: letters + glyph + fill as proposed by U12 (LEC sunken + lines glyph, EXC raised + pencil, OTH no fill + dot).
- Q9 Delete-aspect count: follow the spec, todos only ("Move 3 and delete"); recurring rules are named separately in the sentence below.
- Q10 Review close on phones: compact sticky bar (button + short count); the full summary text sits at the end of the list.
- Q11 More hub and Recurring @1280: two columns from 1280 (More: groups side by side; Recurring: two-column grid).
- Q13 Welcome picked presets: charcoal pressed state with a check, like menus and segments (no accent fill).
- Q12 Contract copy: accept all proposals — specific error copy instead of "(<code>)" / "That didn't work…" ("Couldn't save the todo — try again.", "Couldn't close the sprint…", "Couldn't start the sprint…", "Couldn't move that todo…", "Couldn't add that todo…"); next step in sync banners ("Open sync to see what failed." / "Open sync to do it.") and 404s ("Try again, or go back to Projects." and the aspect/class equivalents); "Open Backlog" → "Open backlog"; no trailing period on empty-state headings; plus the voice fixes "All 4 done. Nice week." → calm wording, "Capture your first idea." → "No projects yet …" voice, "✓ Revised today" → verb + object ("Mark revised today"), sync item errors get a next step. docs/functional-contract.md §5/§7 must be updated to match.
- Q14 Backlog rows: "Add to sprint" stays visible; "Plan a day" moves into the row's ··· menu.
- Icon (Q2 follow-up): new round in the direction "week rhythm" — seven strokes/segments with one highlighted (the sprint week as a pattern), no ticks, calendars or checklists; per Design-System icons/TEMPLATE.md; 2–3 variants plus hinted 16/32; must read at 16 px.
- Process: a 4th fixer round (beyond flow's 3-round cap, approved by Rue) implements all answers above + the 20 open findings + the new icon round; then a short fresh-context control review; then Rue signs off gate 5 (13.3) and the freeze (13.5) follows.

## Next steps (resume here in a fresh session)

1. Planner (strong): update docs/functional-contract.md copy per Q12 and record the gate-5 answers that supersede gate-4 picks (Q1, Q5, Q10 compact sticky, Q14) in design.md → Gate log as "pending sign-off"; validate --strict; commit. (Contract/spec files only.)
2. In parallel, worktree via `flow-unit start … redesign U13`: fixer round 4 on src/routes/__mockups/redesign/** + e2e/redesign-shots.test.ts — implement Q1, Q3, Q4 (Aspects + Backlog cards), Q5, Q6, Q9, Q10, Q11, Q13, Q14, the copy in the mockups per Q12, and the 20 findings in "Still broken after round 3". Full frontend workflow via the Skill tool (impeccable context + critique A/B + polish, break-ui reading every worst shot of touched pages, emil-design-eng/animate for the collapsible rail and moved menus, mobile-native), 44 px touch sweep, green proof:full. Split by collection across sub-agents if needed, one proof at the end.
3. Icon designer (standard, can run in the same wave on hifi/icon/** only): new variants per the icon direction above; preview at 16/32/180/512 beside the siblings.
4. Merge, proof:full green, re-shoot, then a short fresh-context control review (2–3 reviewers by collection, ~60 shots each) on the changed pages; findings → Rue, not another loop.
5. Republish the gallery (scratchpad gate5-gallery build or rebuild; artifact https://claude.ai/artifact/QmgJwiMYnsMk72SgugXrzG) and ask Rue to sign off: icon pick + "Abgenommen". Then 13.3 Gate log, 13.4 icon hand-over to Design-System, 13.5 tag gate5-signed + frozen shots, then wave 8 (U14).

## Round 4 result (2026-11-22)

- Fixer round 4 (0e1300a, 48e1f59, 3cb747c) + icon round 4 (d5e04ac: A Arc, B Beads, C Bricks) merged; proof:full green at 5af6afd (390 passed). Planner copy: cf2b63a. Shots: /home/Rue/.cache/flow/Life-Manager/redesign/gate5-r4-shots/.
- Control review (3 fresh reviewers): sprint flow sibling, lists/details partly. One high: More menu clips the 80-char aspect name (shell menu-open, 375/1280 worst; confirmed). Full list in the gallery (#control) and /home/Rue/.cache/flow/Life-Manager/redesign/control-review.html.
- Gallery republished (version 2): https://claude.ai/artifact/QmgJwiMYnsMk72SgugXrzG. Waiting on Rue: icon pick, planner copy confirmation, what to do with control findings, then "Abgenommen" → 13.3–13.5.
