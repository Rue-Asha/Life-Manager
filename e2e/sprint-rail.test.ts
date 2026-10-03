import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock, type SeedInput } from './helpers';

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const SUNDAY = '2026-10-11T10:00:00Z';
const WEEK = '2026-10-05';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS: SeedInput['aspects'] = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' }
];

const rail = (page: Page) => page.getByTestId('backlog-rail');
const sprintList = (page: Page) => page.getByTestId('sprint-list');
const row = (scope: ReturnType<Page['getByTestId']>, title: string) =>
	scope.getByTestId('todo-row').filter({ hasText: title });

const iconColor = (scope: ReturnType<Page['getByTestId']>) =>
	scope.locator('svg').nth(1).evaluate((svg) => getComputedStyle(svg).color);

async function seedRunning(request: Parameters<typeof seed>[0], todos: SeedInput['todos']) {
	return seed(request, { aspects: ASPECTS, sprint: { state: 'active', weekStart: WEEK }, todos });
}

test('Scenario: Sprint tab shows the backlog rail grouped by aspect', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Read chapter 4', aspect: 1, inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Stretch for ten minutes' },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	await expect(rail(page)).toBeVisible();
	const groups = rail(page).locator('[data-testid^="rail-group-"]');
	await expect(groups).toHaveCount(2);
	await expect(groups.nth(0)).toHaveAttribute('data-testid', `rail-group-${aspects[0]}`);
	await expect(groups.nth(1)).toHaveAttribute('data-testid', `rail-group-${aspects[1]}`);

	const health = page.getByTestId(`rail-group-${aspects[0]}`);
	await expect(health.getByTestId('todo-row')).toHaveText([/Book a physio appointment/, /Stretch for ten minutes/]);
	await expect(page.getByTestId(`rail-group-${aspects[1]}`).getByTestId('todo-row')).toHaveText([/Email the tutor/]);

	const sprintGroups = sprintList(page).locator('[data-testid^="aspect-group-"]');
	await expect(sprintGroups).toHaveCount(2);
	for (const [i, id] of aspects.entries()) {
		await expect(sprintGroups.nth(i)).toHaveAttribute('data-testid', `aspect-group-${id}`);
		const sprintColor = await page.getByTestId(`aspect-group-${id}`).locator('h2 svg').first()
			.evaluate((svg) => getComputedStyle(svg).color);
		expect(await iconColor(page.getByTestId(`rail-group-${id}`))).toBe(sprintColor);
	}
});

test('Scenario: Rail is shown on the sprint\'s Sunday', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Weekly reset', inSprint: true, day: '2026-10-11' },
		{ title: 'Book a physio appointment' }
	]);
	await setClock(request, SUNDAY);
	await page.goto('/sprint');

	const prompt = page.getByTestId('sprint-prompt');
	await expect(prompt).toHaveAttribute('data-phase', 'review-available');
	const promptBox = (await prompt.boundingBox())!;
	const listBox = (await sprintList(page).boundingBox())!;
	expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(listBox.y);
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();
});

test('Scenario: No rail without a running sprint', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Book a physio appointment' }] });
	await page.goto('/sprint');
	await expect(page.getByTestId('sprint-prompt')).toHaveAttribute('data-phase', 'none');
	await expect(page.getByTestId('sprint-prompt').getByRole('link')).toHaveAttribute('href', '/sprint/plan');
	await expect(rail(page)).toHaveCount(0);
	await expect(page.getByTestId('context-rail')).toHaveCount(0);

	await reset(request);
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'planning' },
		todos: [{ title: 'Book a physio appointment' }]
	});
	await page.goto('/sprint');
	await expect(page.getByTestId('sprint-prompt')).toHaveAttribute('data-phase', 'planning');
	await expect(rail(page)).toHaveCount(0);
	await expect(page.getByTestId('context-rail')).toHaveCount(0);
});

test('Scenario: No rail while the review is required', async ({ page, request }) => {
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: '2026-09-28' },
		todos: [{ title: 'Clean the fridge', inSprint: true }, { title: 'Book a physio appointment' }]
	});
	await page.goto('/sprint');
	await expect(page.getByTestId('sprint-prompt')).toHaveAttribute('data-phase', 'review-required');
	await expect(rail(page)).toHaveCount(0);
	await expect(page.getByTestId('context-rail')).toHaveCount(0);
	await expect(page.getByTestId('todo-row')).toHaveCount(0);
});

test('Scenario: Sprint at 1280 shows a context rail', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	const context = page.getByTestId('context-rail');
	await expect(context).toBeVisible();
	const box = (await context.boundingBox())!;
	const width = await page.evaluate(() => document.documentElement.clientWidth);
	expect(Math.abs(box.x + box.width - width)).toBeLessThanOrEqual(1);
	const [background, sunk] = await context.evaluate((el) => {
		const probe = document.createElement('div');
		probe.style.background = 'var(--paper-sunk)';
		document.body.append(probe);
		const value = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return [getComputedStyle(el).backgroundColor, value];
	});
	expect(background).toBe(sunk);

	const sidebarRight = await page.evaluate(
		() => document.querySelector('main')!.previousElementSibling!.getBoundingClientRect().right
	);
	const list = (await sprintList(page).boundingBox())!;
	expect(list.width).toBeLessThanOrEqual(720);
	expect(list.x - sidebarRight).toBeLessThanOrEqual(64);
	expect(list.x + list.width).toBeLessThanOrEqual(box.x);
});

test('Scenario: Rail becomes an overlay toggle between 1024 and 1279', async ({ page, request }) => {
	await page.setViewportSize({ width: 1100, height: 800 });
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	const context = page.getByTestId('context-rail');
	const toggle = page.getByTestId('rail-toggle');
	await expect(context).toBeHidden();
	await expect(toggle).toBeVisible();

	await toggle.click();
	await expect(context).toBeVisible();
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();
	await expect(context).toHaveCSS('transform', 'none');
	expect(await page.evaluate(() => document.querySelector('dialog[open]'))).toBeNull();
	// Content stays usable while the overlay is open: no scrim covers it.
	await expect(row(sprintList(page), 'Morning run')).toBeVisible();
	const hit = await page.evaluate(() => {
		const el = document.querySelector('[data-testid="sprint-list"]')!;
		const r = el.getBoundingClientRect();
		return el.contains(document.elementFromPoint(r.left + 10, r.top + 10));
	});
	expect(hit).toBe(true);

	await toggle.click();
	await expect(context).toBeHidden();
});
