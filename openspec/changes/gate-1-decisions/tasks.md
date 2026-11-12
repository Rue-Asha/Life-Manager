## 1. Aspect order (server)

> unit: depends=none · files=src/lib/server/aspects.ts, src/lib/server/aspects.test.ts, src/routes/aspects/+page.server.ts

- [ ] 1.1 Write the tests "Scenario: Reordering persists", "Scenario: A list that is not the full set is rejected", "Scenario: New aspects go last after a reorder" and "Scenario: Deleting an aspect keeps the others' order" in `aspects.test.ts`
- [ ] 1.2 Implement `reorderAspects(db, ids)` in `aspects.ts` (permutation check, positions 0..n-1 in one transaction)
- [ ] 1.3 Add the `?/reorder` action to `src/routes/aspects/+page.server.ts` (repeated `order` field, `fail(400, ...)` on `invalid`) and write "Scenario: The reorder action rewrites the order" (server-level test of the action or its pure handler)
- [ ] 1.4 Confirm by `graphify query`/`rg` that every aspect list (layout nav, pickers, `/aspects`, backlog groups, rule form) comes from `listAspects` and none re-sorts by name; list any exception in the change notes

## 2. Welcome presets (server)

> unit: depends=none · files=src/routes/welcome/+page.server.ts, src/lib/server/aspects.ts (helper only if shared), a test file next to the route or in aspects.test.ts

- [ ] 2.1 Write "Scenario: Existing presets are reported as existing", "Scenario: Submitting an existing preset creates nothing and does not fail", "Scenario: Only existing presets selected is not a duplicate error" and "Scenario: A custom name equal to an existing aspect is still a duplicate"
- [ ] 2.2 Add `load` to `welcome/+page.server.ts` returning `existingPresets` (preset names matching an existing aspect, case-insensitive)
- [ ] 2.3 Make `?/create` skip existing presets before creating; keep the `required` and custom `duplicate` paths and the all-or-nothing transaction

## 3. Backlog filter (server)

> unit: depends=none · files=src/lib/aspect-filter.ts, src/lib/aspect-filter.test.ts, src/routes/backlog/+page.server.ts

- [ ] 3.1 Write tests for `parseAspectFilter` and the scenarios "Non-numeric aspect parameter shows an empty list", "Unknown aspect id shows an empty list", "Missing or empty aspect parameter shows everything", "Valid aspect parameter filters"
- [ ] 3.2 Implement `parseAspectFilter` and use it in the backlog load (`aspectId` is `number | null`, never `NaN`; unknown -> empty list)
- [ ] 3.3 Fix the one place the page reads `data.aspectId` if its type needs adjusting (type check only, no visual change)

## 4. Project statuses (spec only)

> unit: depends=none · files=openspec/specs/it-projects/spec.md (via archive), src/lib/server/projects.test.ts

- [ ] 4.1 Confirm `projects.test.ts` exercises all 20 ordered status pairs and the five-group overview order; add the missing cases
- [ ] 4.2 Spec text lands through the delta in this change at archive/sync (`opsx:sync`); verify `openspec/specs/it-projects/spec.md` lists five statuses afterwards

## 5. Menu redirect (client)

> unit: depends=none · files=src/lib/layout.ts, src/routes/menu/+page.svelte, e2e/navigation.test.ts, e2e/proton-nav.test.ts, e2e/responsive.test.ts

- [ ] 5.1 Write the e2e tests "Scenario: Wide screen redirects /menu to Today" (1280 px, ends on `/`, Back does not return) and "Scenario: Phone keeps /menu" (375 px)
- [ ] 5.2 Add `WIDE_QUERY` (`(min-width: 768px)`, comment naming the layout CSS breakpoint) and the `onMount` replace-redirect in `menu/+page.svelte`
- [ ] 5.3 Move existing e2e specs that open `/menu` at a wide width to 375 px (navigation, proton-nav, responsive)
- [ ] 5.4 Hand-off note for the redesign: whoever moves the primary-navigation breakpoint changes `WIDE_QUERY` too

## 6. README deployment requirement

> unit: depends=none · files=README.md

- [ ] 6.1 Add a labelled "Deployment requirement" paragraph (plain-http access without `PROTOCOL_HEADER` or `ORIGIN` gives every form post a 403 and a read-only app; app shows no warning) next to the env table, linking to "Behind a reverse proxy"

## 7. Verify and close

> unit: depends=1,2,3,4,5,6 · files=none

- [ ] 7.1 Run `proof` (and `proof:full` once, as a background job) and keep it green
- [ ] 7.2 Run `graphify update .` and `openspec validate gate-1-decisions --strict`
- [ ] 7.3 Archive the change so the delta specs sync into `openspec/specs/`
