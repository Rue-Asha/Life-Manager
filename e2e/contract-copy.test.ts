import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { copy } from '../src/lib/copy';
import { expect, reset, seed, setClock, test } from './helpers';

const contract = readFileSync('docs/functional-contract.md', 'utf8');
const section7 = contract.slice(contract.indexOf('## 7. Copy list'), contract.indexOf('## 8. '));

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (path.includes('__mockups')) continue;
		if (statSync(path).isDirectory()) walk(path, out);
		else if (/\.(svelte|ts)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(path);
	}
	return out;
}
const source = walk('src')
	.map((path) => readFileSync(path, 'utf8'))
	.join('\n')
	.replaceAll('’', "'");

// Rows of the §7 tables: the English target is the second cell.
const targets = section7
	.split('\n')
	.filter((line) => line.startsWith('|') && !/^\|[-| ]+\|$/.test(line) && !line.startsWith('| current string'))
	.map((line) => line.split('|')[2].trim());

// Strings the source builds from parts, or that live in fixtures and fake CLIs rather than in a copy literal.
const NOT_LITERAL = new Set([
	'Class not found',
	'Due next',
	'Exam topics',
	'Dumbbell',
	'Leaf',
	'not logged in',
	'proton account login --profile default',
	'Error: ambiguous local time',
	'Status: Doing',
	'1 in backlog',
	// Pluralised, Intl-formatted or formatted from a number in code; the feature tests assert the rendered text.
	'Sprint 3 / 9 done · 3 days left',
	'3 days left',
	'September 2026',
	'October 2026',
	'November 2026',
	'February 2027',
	'Add a todo to Thu 15',
	'{n} linked todos will be unlinked [and kept.]',
	'{n} todos or rules are linked ... / Remove {n} links and change (aspect-change confirm)',
	'{n} classes and {n} todos / {n} class todos are still open / {n} todos and rules',
	'{n} ECTS / {n} open / Average — · / Overall average — ·',
	'Winter {yy}/{yy} (semester long name)',
	'Thu 8 / Tue 6 / Wed 7 / Fri 9 day picker entry names ({weekday} {d})',
	// Rows that are notes about a test pattern, split at an escaped pipe in the table.
	'Add to sprint:\\',
	'EXC\\',
	'Today\\',
	'Status label regexes (/Active/,  /Done/)',
	'{grade} / {ects} decimal numbers with a point (1.3,  1.7,  2.23,  7.5)'
]);
// A string with numbers or {placeholders} is checked by its literal fragments, each of which must stay in the source.
const fragments = (s: string) =>
	s
		.replaceAll('’', "'")
		.replace(/\s*\([^)]*[a-z]{4,}[^)]*\)/g, '')
		.replace(/\s*`[^`]*`/g, '')
		.split(/\{[^}]*\}|\d+|[/()[\],]/)
		.map((f) => f.trim())
		.filter((f) => f.length >= 4);
const isRegex = (s: string) => /^\/|\bregex\b/.test(s);

test('Scenario: Contract strings stay', async ({ page, request }) => {
	const missing = targets.flatMap((s) => (NOT_LITERAL.has(s) || isRegex(s) ? [] : fragments(s).filter((f) => !source.includes(f)).map((f) => `${s} -> ${f}`)));
	expect(missing, 'contract §7 strings that no longer appear in src/').toEqual([]);

	// The copy module's empty states are the contract's, word for word.
	expect(copy.empty.today).toEqual({ heading: 'Nothing planned for today', body: 'The week view has the rest of your sprint.' });
	expect(copy.empty.backlog).toEqual({ heading: 'Your backlog is empty', body: 'Add a todo to start planning.' });
	expect(copy.empty.recurring).toEqual({ heading: 'No recurring rules yet', body: 'Add one for anything you do every week.' });
	expect(copy.empty.projects).toEqual({ heading: 'No projects yet', body: 'A project starts in the backlog.' });
	expect(copy.empty.uni).toEqual({ heading: 'Start with the semester you are in now' });
	for (const s of [
		...Object.values(copy.empty.today),
		...Object.values(copy.empty.backlog),
		...Object.values(copy.empty.recurring),
		...Object.values(copy.empty.projects),
		...Object.values(copy.empty.uni)
	])
		expect(contract.replaceAll('’', "'"), s).toContain(s);

	// And they are what the screens render.
	await reset(request);
	await setClock(request, '2026-10-07T10:00:00Z');
	await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'University' }, { name: 'IT' }],
		itAspect: 2,
		uniAspect: 1,
		sprint: { state: 'active', weekStart: '2026-10-05' }
	});
	const screens: [string, { heading: string; body?: string }][] = [
		['/', copy.empty.today],
		['/backlog', copy.empty.backlog],
		['/recurring', copy.empty.recurring],
		['/projects', copy.empty.projects],
		['/uni', copy.empty.uni]
	];
	for (const [path, empty] of screens) {
		await page.goto(path);
		await expect(page.getByRole('heading', { name: empty.heading, exact: true }), path).toBeVisible();
		if (empty.body) await expect(page.getByText(empty.body, { exact: true }), path).toBeVisible();
	}
	await setClock(request, null);
});
