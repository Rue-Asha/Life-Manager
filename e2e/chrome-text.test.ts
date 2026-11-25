import type { Locator } from '@playwright/test';
import { aspectGroup, expect, reset, seed, setClock, test, todoRow, type SeedInput } from './helpers';

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

const SEED: SeedInput = {
	aspects: [
		{ name: 'Health', color: 'sage', icon: 'heart' },
		{ name: 'IT', color: 'sky', icon: 'briefcase' }
	],
	itAspect: 1,
	sprint: { state: 'active', weekStart: WEEK },
	projects: [{ name: 'Life Manager', notes: '## Ideas\n\nA **dark mode** for the week view.', status: 'active' }],
	todos: [
		{ title: 'Book a physio appointment', aspect: 0, inSprint: true, day: '2026-10-07' },
		{ title: 'Clean the fridge', aspect: 0 }
	]
};

test.beforeEach(async ({ page, request }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 900 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const textStyle = (locator: Locator) =>
	locator.evaluate((el) => {
		const style = getComputedStyle(el);
		return { cursor: style.cursor, userSelect: style.userSelect || style.webkitUserSelect };
	});

async function expectChrome(locator: Locator, what: string) {
	await expect(locator, what).toBeVisible();
	const { cursor, userSelect } = await textStyle(locator);
	expect(['default', 'pointer'], `${what} cursor`).toContain(cursor);
	expect(userSelect, `${what} user-select`).toBe('none');
}

test('Scenario: Chrome and reading text show the default cursor', async ({ page, request }) => {
	const { projects } = await seed(request, SEED);
	const nav = page.getByRole('navigation', { name: 'Main' });

	await page.goto('/');
	await expectChrome(page.getByRole('heading', { level: 1 }), 'Today heading');
	await expectChrome(page.getByText('Wednesday 7 October', { exact: true }).first(), 'Today kicker');
	await expectChrome(nav.getByRole('link', { name: /^Backlog/ }).getByText('1', { exact: true }), 'Backlog count');
	await expectChrome(nav.getByRole('link', { name: /^Sprint/ }), 'Sprint link');
	await expectChrome(aspectGroup(page, 'Health').getByRole('heading').first(), 'Health group heading');
	await expectChrome(nav.getByRole('button', { name: 'New todo' }), 'New todo button');

	await page.goto(`/projects/${projects[0]}`);
	await expectChrome(page.getByRole('heading', { level: 1, name: 'Life Manager' }), 'project heading');
	await expectChrome(page.getByRole('heading', { level: 2, name: 'Notes', exact: true }), 'Notes heading');
	await expectChrome(page.getByRole('button', { name: 'Edit notes' }), 'Edit notes button');
});

test('Scenario: Fields and own notes stay selectable', async ({ page, request }) => {
	const { projects } = await seed(request, SEED);

	await page.goto('/');
	await todoRow(page, 'Book a physio appointment').getByRole('button', { name: 'Book a physio appointment', exact: true }).click();
	const editor = page.getByRole('form', { name: 'Edit todo' });
	for (const field of [editor.getByLabel('Title'), editor.getByLabel('Description')]) {
		await expect(field).toBeVisible();
		expect((await textStyle(field)).cursor).toBe('text');
	}
	await page.keyboard.press('Escape');

	await page.goto(`/projects/${projects[0]}`);
	const rendered = page.getByRole('group', { name: 'Rendered notes' });
	const strong = rendered.getByText('dark mode', { exact: true });
	await expect(strong).toBeVisible();
	expect(await textStyle(strong)).toEqual({ cursor: 'text', userSelect: 'text' });
	await strong.selectText();
	expect(await page.evaluate(() => getSelection()?.toString())).toContain('dark mode');

	await rendered.getByRole('heading', { name: 'Ideas' }).waitFor();
	await page.getByRole('button', { name: 'Edit notes' }).click();
	expect((await textStyle(page.getByRole('textbox', { name: 'Notes' }))).cursor).toBe('text');
});

test('Scenario: Group labels are chrome, semester names stay the user\'s text', async ({ page, request }) => {
	const { projects } = await seed(request, {
		aspects: [{ name: 'IT', color: 'sky', icon: 'briefcase' }, { name: 'Uni', color: 'lavender', icon: 'cap' }],
		itAspect: 0,
		uniAspect: 1,
		semesters: [{ name: 'WS 25/26', archivedAt: '2026-03-01T10:00:00Z' }],
		projects: [{ name: 'Life Manager', status: 'active' }],
		todos: [{ title: 'Ship it', aspect: 0, project: 0, status: 'done', completedAt: '2026-10-06T09:00:00Z' }]
	});

	await page.goto(`/projects/${projects[0]}`);
	await expectChrome(page.getByRole('button', { name: /^Done \(1\)/ }).locator('.disc-label'), 'Done group label');

	await page.goto('/uni');
	const archived = page.getByRole('button', { name: /^Archived \(1\)/ });
	await expectChrome(archived.locator('.disc-label'), 'Archived group label');
	await archived.click();
	const name = page.getByRole('button', { name: 'WS 25/26', exact: true }).locator('.disc-label');
	await expect(name).toBeVisible();
	expect(await textStyle(name)).toEqual({ cursor: 'text', userSelect: 'text' });
});
