## 1. Aspect order (server)

> unit: depends=none · files=src/lib/server/aspects.ts, src/lib/server/aspects.test.ts, src/routes/aspects/+page.server.ts, src/routes/aspects/page.server.test.ts, e2e/aspect-order.test.ts

- [x] 1.1 Write the tests "Scenario: Reordering persists", "Scenario: A list that is not the full set is rejected", "Scenario: New aspects go last after a reorder" and "Scenario: Deleting an aspect keeps the others' order" in `aspects.test.ts`
- [x] 1.2 Implement `reorderAspects(db, ids)` in `aspects.ts` (permutation check, positions 0..n-1 in one transaction)
- [x] 1.3 Add the `?/reorder` action to `src/routes/aspects/+page.server.ts` (repeated `order` field, `fail(400, ...)` on `invalid`) and write "Scenario: The reorder action rewrites the order" in `src/routes/aspects/page.server.test.ts` (calls the action, then the `/aspects` load and the layout load from `src/routes/+layout.server.ts`, read-only)
- [x] 1.4 Confirm by `graphify query`/`rg` that every aspect list (layout nav, pickers, `/aspects`, backlog groups, rule form) comes from `listAspects` and none re-sorts by name; name any exception in the unit report (no fix in this change)
- [x] 1.5 Write the e2e test "Scenario: Pickers, backlog groups and the rule form follow the manual order" in the new `e2e/aspect-order.test.ts` (its own file, so no wave overlaps): seed Health, Uni, Job with a backlog todo each, POST `/aspects?/reorder` through `request` (set an `Origin` header equal to the base URL, or SvelteKit's CSRF check rejects the form post), then assert the order in the backlog aspect groups, the `TodoFields` aspect options and the `RuleForm` aspect options, each scoped to its container; `npm run build` before the single-file run

## 2. Welcome presets (server)

> unit: depends=none · files=src/routes/welcome/+page.server.ts, src/routes/welcome/page.server.test.ts

- [x] 2.1 Write "Scenario: Existing presets are reported as existing", "Scenario: Submitting an existing preset creates nothing and does not fail", "Scenario: Only existing presets selected is not a duplicate error" and "Scenario: A custom name equal to an existing aspect is still a duplicate" in `src/routes/welcome/page.server.test.ts`
- [x] 2.2 Add `load` to `welcome/+page.server.ts` returning `existingPresets` (preset names matching an existing aspect, case-insensitive); keep any helper in this file, `aspects.ts` belongs to unit 1
- [x] 2.3 Make `?/create` skip existing presets before creating; keep the `required` and custom `duplicate` paths and the all-or-nothing transaction

## 3. Backlog filter (server)

> unit: depends=none · files=src/lib/aspect-filter.ts, src/lib/aspect-filter.test.ts, src/routes/backlog/+page.server.ts, src/routes/backlog/page.server.test.ts, src/routes/backlog/+page.svelte

- [x] 3.1 Write tests for `parseAspectFilter` in `aspect-filter.test.ts` and the scenarios "Non-numeric aspect parameter shows an empty list", "Unknown aspect id shows an empty list", "Missing or empty aspect parameter shows everything", "Valid aspect parameter filters" against the backlog load in `src/routes/backlog/page.server.test.ts`
- [x] 3.2 Implement `parseAspectFilter` and use it in the backlog load (`aspectId` is `number | null`, never `NaN`; unknown -> empty list)
- [x] 3.3 Fix the one place the page reads `data.aspectId` if its type needs adjusting (type check only, no visual change; likely a no-op)

## 4. Project statuses (spec only)

> unit: depends=none · files=src/lib/server/projects.test.ts (only if a case is missing), openspec/changes/gate-1-decisions/specs/it-projects/spec.md (only if it differs from the code)

- [x] 4.1 Confirm `projects.test.ts` "Scenario: Every status transition is allowed" covers all 20 ordered pairs (it loops over `PROJECT_STATUSES`) and e2e "Scenario: Cards are grouped by status" checks the five-group order; add the missing cases
- [x] 4.2 Compare the it-projects delta spec with the code (`PROJECT_STATUSES`, `STATUS_LABELS`, the migration's CHECK, overview group order) and fix the delta where it differs; the main spec is synced by the archive

## 5. Menu redirect (client)

> unit: depends=none · files=src/lib/layout.ts, src/routes/menu/+page.svelte, e2e/navigation.test.ts, e2e/proton-nav.test.ts, e2e/responsive.test.ts

- [x] 5.1 Write the e2e tests "Scenario: Wide screen redirects /menu to Today" (1280 px; open another page first, then `/menu`; ends on `/`, Back returns to the first page, not `/menu`) and "Scenario: Phone keeps /menu" (375 px) in `e2e/navigation.test.ts`; seed an aspect first (an empty DB redirects to `/welcome`)
- [x] 5.2 Add `WIDE_QUERY` (`(min-width: 768px)`, comment naming the layout CSS breakpoint in `src/routes/+layout.svelte`) in the new `src/lib/layout.ts` and the `onMount` replace-redirect in `menu/+page.svelte`
- [x] 5.3 Check the existing e2e specs that open `/menu` (navigation, proton-nav, responsive, journey) still run at 375 px; move any that open it at a wide width (at planning time all set 375 px first)
- [x] 5.4 Hand-off note for the redesign in the comment on `WIDE_QUERY`: whoever moves the primary-navigation breakpoint changes `WIDE_QUERY` too

## 6. README deployment requirement

> unit: depends=none · files=README.md

- [x] 6.1 Add a labelled "Deployment requirement" paragraph (plain-http access without `PROTOCOL_HEADER` or `ORIGIN` gives every form post a 403 and a read-only app; app shows no warning) next to the env table, linking to "Behind a reverse proxy"

## 7. Verify and graph

> unit: depends=1,2,3,4,5,6 · files=graphify-out/

- [x] 7.1 Run `proof:full` once on the merged branch (background job, with `PORT` set) and keep it green
- [x] 7.2 Run `graphify update .` and `openspec validate gate-1-decisions --strict`; commit `graphify-out/`
