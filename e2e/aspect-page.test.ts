import type { Page } from '@playwright/test';
import { ASPECT_ICONS } from '../src/lib/aspect-style';
import { expect, test, reset, seed, setClock, todoRow as row, todoRows, type SeedInput } from './helpers';

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

const sprintSection = (page: Page) => page.getByRole('region', { name: /^This sprint\b/ });
const backlogSection = (page: Page) => page.getByRole('region', { name: /^Backlog\b/ });

test('Scenario: Aspect page shows this sprint and its backlog', async ({ page, request }) => {
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[0]}`);

	const heading = page.getByRole('heading', { level: 1 });
	await expect(heading).toHaveText('Health');
	await expect(heading.locator('xpath=../preceding-sibling::span').locator('path')).toHaveAttribute('d', ASPECT_ICONS.heart);
	await expect(page).toHaveTitle(/Health/);

	await expect(todoRows(sprintSection(page))).toHaveText([
		/Book a physio appointment/,
		/Stretch for ten minutes/
	]);
	await expect(sprintSection(page).getByRole('heading', { level: 2 })).toContainText('1 / 2');
	await expect(todoRows(backlogSection(page))).toHaveText([/Buy running shoes/]);
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

	await expect(page.getByRole('heading', { level: 2, name: 'Nothing in Music yet' })).toBeVisible();
	await expect(page.getByText('Add a todo to start.', { exact: true })).toBeVisible();
	await page.getByRole('main').getByRole('button', { name: 'Add a todo' }).click();
	await expect(page.getByRole('dialog', { name: 'New todo' })).toBeVisible();
});

test('Scenario: Aspect page rail shows the aspect\'s details', async ({ page, request }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[0]}`);

	const rail = page.getByRole('complementary');
	await expect(rail).toBeVisible();
	await expect(rail.getByText('Sage', { exact: true })).toBeVisible();
	await expect(rail.getByText('1 / 2')).toBeVisible();
	await expect(rail.getByText('1 in backlog', { exact: true })).toBeVisible();
});

test('Scenario: Move todos between sprint and backlog on the aspect page', async ({ page, request }) => {
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[0]}`);

	await row(backlogSection(page), 'Buy running shoes').hover();
	await page.getByRole('button', { name: 'Add to sprint: Buy running shoes' }).click();
	await expect(row(sprintSection(page), 'Buy running shoes')).toBeVisible();
	await expect(sprintSection(page).getByRole('heading', { level: 2 })).toContainText('1 / 3');

	await row(sprintSection(page), 'Stretch for ten minutes').getByRole('button', { name: 'More actions' }).click();
	await page.getByRole('menuitem', { name: 'Move to backlog' }).click();
	await expect(row(backlogSection(page), 'Stretch for ten minutes')).toBeVisible();
	await expect(row(sprintSection(page), 'Stretch for ten minutes')).toHaveCount(0);
	await expect(sprintSection(page).getByRole('heading', { level: 2 })).toContainText('1 / 2');
});

test('Scenario: Drag between sections on the aspect page', async ({ page, request }) => {
	// Both sections fit the viewport, so the page does not scroll under the pointer while it drags.
	await page.setViewportSize({ width: 1280, height: 1100 });
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[0]}`);

	await row(backlogSection(page), 'Buy running shoes').dragTo(sprintSection(page));
	await expect(row(sprintSection(page), 'Buy running shoes')).toBeVisible();

	await page.reload();
	await expect(row(sprintSection(page), 'Buy running shoes')).toBeVisible();
	await expect(row(backlogSection(page), 'Buy running shoes')).toHaveCount(0);

	await row(sprintSection(page), 'Stretch for ten minutes').dragTo(backlogSection(page));
	await page.reload();
	await expect(row(backlogSection(page), 'Stretch for ten minutes')).toBeVisible();
});

test('Scenario: Quick add on the aspect page defaults to the aspect', async ({ page, request }) => {
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[1]}`);

	const form = backlogSection(page).getByRole('form', { name: 'Add a todo to Uni' });
	await expect(form).toContainText('Goes to the backlog, aspect Uni');
	await form.getByRole('textbox', { name: 'Title' }).fill('Email the tutor');
	await form.getByRole('button', { name: 'Add', exact: true }).click();
	await expect(row(backlogSection(page), 'Email the tutor')).toBeVisible();
	await expect(form.getByRole('textbox', { name: 'Title' })).toHaveValue('');

	await page.goto('/backlog');
	await expect(row(page.getByRole('region', { name: /^Uni\b/ }), 'Email the tutor')).toBeVisible();
});

test('Scenario: Aspect page during a required review points to Review', async ({ page, request }) => {
	// Monday 12 October: the sprint of 5–11 October is over and its review is required.
	await setClock(request, '2026-10-12T10:00:00Z');
	const ids = await seed(request, RUNNING);
	await page.goto(`/aspects/${ids.aspects[0]}`);

	await expect(row(backlogSection(page), 'Buy running shoes')).toBeVisible();
	await expect(page.getByRole('button', { name: /Add to sprint/ })).toHaveCount(0);
	await page.getByText('This week’s sprint is over, so nothing can join it.').getByRole('link', { name: /review/i }).click();
	await expect(page).toHaveURL(/\/sprint\/review$/);
});
