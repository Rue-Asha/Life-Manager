import { expect, test, type Page } from '@playwright/test';
import { ASPECT_ICONS } from '../src/lib/aspect-style';
import { reset, seed, setClock, type SeedInput } from './helpers';

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS: SeedInput['aspects'] = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'sky', icon: 'cap' }
];

const RUNNING: SeedInput = {
	aspects: ASPECTS,
	sprint: { state: 'active', weekStart: WEEK },
	todos: [
		{ title: 'Book a physio appointment', inSprint: true, status: 'done', day: '2026-10-06' },
		{ title: 'Stretch for ten minutes', inSprint: true },
		{ title: 'Buy running shoes' },
		{ title: 'Submit lab report', aspect: 1, inSprint: true },
		{ title: 'Read chapter 4', aspect: 1 }
	]
};

const sprintSection = (page: Page) => page.getByTestId('aspect-sprint');
const backlogSection = (page: Page) => page.getByTestId('aspect-backlog');
const row = (scope: ReturnType<Page['getByTestId']>, title: string) =>
	scope.getByTestId('todo-row').filter({ hasText: title });

test('Scenario: Aspect page shows this sprint and its backlog', async ({ page, request }) => {
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[0]}`);

	const heading = page.getByRole('heading', { level: 1 });
	await expect(heading).toHaveText('Health');
	await expect(heading.locator('path')).toHaveAttribute('d', ASPECT_ICONS.heart);
	await expect(page).toHaveTitle(/Health/);

	await expect(sprintSection(page).getByTestId('todo-row')).toHaveText([
		/Book a physio appointment/,
		/Stretch for ten minutes/
	]);
	await expect(sprintSection(page).getByTestId('progress')).toContainText('1 / 2');
	await expect(backlogSection(page).getByTestId('todo-row')).toHaveText([/Buy running shoes/]);
	await expect(page.getByText('Submit lab report')).toHaveCount(0);
	await expect(page.getByText('Read chapter 4')).toHaveCount(0);
});

test('Scenario: Unknown aspect shows a 404 page', async ({ page, request }) => {
	const ids = await seed(request, { aspects: ASPECTS });
	const response = await page.goto(`/aspects/${ids.aspects[1] + 100}`);

	expect(response?.status()).toBe(404);
	await page.getByRole('main').getByRole('link', { name: 'Aspects' }).click();
	await expect(page).toHaveURL(/\/aspects$/);
});

test('Scenario: Aspect page without a running sprint', async ({ page, request }) => {
	for (const sprint of [undefined, { state: 'planning' as const }]) {
		await reset(request);
		const ids = await seed(request, { aspects: ASPECTS, sprint, todos: [{ title: 'Buy running shoes' }] });
		await page.goto(`/aspects/${ids.aspects[0]}`);

		await expect(sprintSection(page)).toContainText('No sprint running');
		await sprintSection(page).getByRole('link', { name: /Plan/ }).click();
		await expect(page).toHaveURL(/\/sprint\/plan$/);

		await page.goto(`/aspects/${ids.aspects[0]}`);
		await expect(row(backlogSection(page), 'Buy running shoes')).toBeVisible();
		await expect(page.getByRole('button', { name: /Add to sprint/ })).toHaveCount(0);
	}
});

test('Scenario: Aspect without todos shows an empty state with quick add', async ({ page, request }) => {
	const ids = await seed(request, { ...RUNNING, aspects: [...ASPECTS, { name: 'Music', icon: 'music' }] });
	await page.goto(`/aspects/${ids.aspects[2]}`);

	const empty = page.getByTestId('empty-state');
	await expect(empty).toBeVisible();
	await empty.getByRole('button', { name: 'Add a todo' }).click();
	await expect(page.getByRole('form', { name: 'New todo' })).toBeVisible();
});

test('Scenario: Aspect page rail shows the aspect\'s details', async ({ page, request }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[0]}`);

	const rail = page.getByTestId('context-rail');
	await expect(rail).toBeVisible();
	await expect(rail.getByTestId('aspect-color')).toHaveText('Sage');
	await expect(rail.getByTestId('progress')).toContainText('1 / 2');
	await expect(rail.getByTestId('backlog-count')).toHaveText('1 in backlog');
});
