# Life-Manager

Self-hosted weekly-sprint todo app for several life aspects. SvelteKit + Vite + TypeScript,
npm with `package-lock.json`, SQLite via `node:sqlite` (Node ≥ 22.5), `adapter-node`.
Single user, no auth; light theme only.

## Harness
- proof: `npm run proof`
- proof-full: `npm run proof:full`
- run: `npm run dev` → http://localhost:5173
- ship: ask

## Specs
- Before changing app-runtime, read openspec/specs/app-runtime/spec.md.
- Before changing aspects, read openspec/specs/aspects/spec.md.
- Before changing backlog, read openspec/specs/backlog/spec.md.
- Before changing design-direction, read openspec/specs/design-direction/spec.md.
- Before changing it-projects, read openspec/specs/it-projects/spec.md.
- Before changing motion, read openspec/specs/motion/spec.md.
- Before changing navigation, read openspec/specs/navigation/spec.md.
- Before changing recurring, read openspec/specs/recurring/spec.md.
- Before changing sprint-lifecycle, read openspec/specs/sprint-lifecycle/spec.md.
- Before changing sprint-views, read openspec/specs/sprint-views/spec.md.
- Before changing today, read openspec/specs/today/spec.md.
- Before changing todos, read openspec/specs/todos/spec.md.
- Before changing uni-hub, read openspec/specs/uni-hub/spec.md.

## Learnings
- **Font tokens for fontsource variable fonts** → use the `'<Family> Variable'` name (e.g. `'Bricolage Grotesque Variable'`). (weil: that's the name fontsource registers; the plain family silently falls back) [2026-10-03 · build-life-manager]
- **e2e after client-side navigation** → wait for the URL or heading before the next locator. (weil: otherwise it matches the old page) [2026-10-03 · build-life-manager]
- **e2e count assertions** → scope them to a container test id (e.g. the sprint list), never page-wide. (weil: a unit adding the backlog rail beside the sprint broke other units' counts) [2026-10-03 · sprint-management]
- **Svelte `crossfade` on a new element** → route it through the guard in `motion.ts`. (weil: crossfade divides by target width; a display:none counterpart yields NaN and leaves the outgoing node stuck — AspectView/BacklogRail still use it raw) [2026-10-03 · sprint-management]
- **Elements that crossfade (200 ms)** → mark the outgoing copy `aria-hidden` and rename its test ids. (weil: two copies exist mid-transition and page-wide strict locators fail) [2026-10-03 · sprint-management]
- **Rendering user markdown via `{@html}` (marked)** → sanitize with an allowlist after entity decoding, and test entity variants red-first. (weil: marked leaves entities in hrefs, so a scheme blocklist was bypassed by `&#115;`/`&colon;`) [2026-10-04 · it-projects]
- **Previewing a component in a worktree via dev server** → set `DATABASE_PATH` to `.e2e/<port>.db`. (weil: plain `npm run dev` creates data/life-manager.db in the worktree; the /welcome redirect without aspects blocked the preview anyway) [2026-10-04 · uni-hub]
- **Formatting in this repo** → don't run `npx prettier --write`. (weil: no prettier config; it rewrote files to double quotes/spaces and needed a revert commit) [2026-10-04 · uni-hub]
- **e2e measurement at ≥1280 on RailLayout pages** → wait for `context-rail` before measuring. (weil: the MediaQuery swap after hydration re-mounts the column; earlier measurements read a detached node) [2026-10-04 · uni-hub]
