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
- Before changing navigation, read openspec/specs/navigation/spec.md.
- Before changing recurring, read openspec/specs/recurring/spec.md.
- Before changing sprint-lifecycle, read openspec/specs/sprint-lifecycle/spec.md.
- Before changing sprint-views, read openspec/specs/sprint-views/spec.md.
- Before changing today, read openspec/specs/today/spec.md.
- Before changing todos, read openspec/specs/todos/spec.md.

## Learnings
- **Font tokens for fontsource variable fonts** → use the `'<Family> Variable'` name (e.g. `'Bricolage Grotesque Variable'`). (weil: that's the name fontsource registers; the plain family silently falls back) [2026-10-03 · build-life-manager]
- **e2e after client-side navigation** → wait for the URL or heading before the next locator. (weil: otherwise it matches the old page) [2026-10-03 · build-life-manager]
