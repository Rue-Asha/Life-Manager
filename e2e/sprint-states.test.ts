import { aspectGroup, dayColumn, expect, test, reset, seed, setClock, todoRows } from './helpers';
import { sprintList, sprintPrompt, weekGrid } from './sprint-locators';

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

const ASPECTS = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' }
] as const;

test('Scenario: By aspect is the default view at every width', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', inSprint: true }, { title: 'Read chapter 4', aspect: 1, inSprint: true }]
	});

	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto('/sprint');
		const views = page.getByRole('navigation', { name: 'Sprint view' });
		await expect(views.getByRole('link', { name: 'By aspect' })).toHaveAttribute('aria-current', 'page');
		await expect(views.getByRole('link', { name: 'Board' })).not.toHaveAttribute('aria-current', 'page');
		await expect(views.getByRole('link', { name: 'Week' })).not.toHaveAttribute('aria-current', 'page');
		await expect(aspectGroup(sprintList(page), 'Health')).toBeVisible();
		await expect(aspectGroup(sprintList(page), 'Uni')).toBeVisible();
	}
});

test.describe('on a phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: All three views are available on the phone', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [{ title: 'Morning run', inSprint: true, day: '2026-10-07' }, { title: 'Read chapter 4', aspect: 1, inSprint: true, day: '2026-10-07' }]
		});
		await page.goto('/sprint');
		const views = page.getByRole('navigation', { name: 'Sprint view' });

		await views.getByRole('link', { name: 'Board' }).tap();
		await expect(page).toHaveURL(/\/sprint\?view=board$/);
		await expect(todoRows(page)).toHaveText([/Morning run/, /Read chapter 4/]);

		await views.getByRole('link', { name: 'Week' }).tap();
		await expect(page).toHaveURL(/\/sprint\?view=week$/);
		await expect(todoRows(page)).toHaveText([/Morning run/, /Read chapter 4/]);
	});
});

test('Scenario: Phase prompts replace the sprint', async ({ page, request }) => {
	const views = page.getByRole('navigation', { name: 'Sprint view' });
	const todos = [{ title: 'Morning run', inSprint: true }, { title: 'Read chapter 4', aspect: 1 }];

	// none: no sprint at all
	await seed(request, { aspects: [...ASPECTS], todos });
	await page.goto('/sprint');
	await expect(sprintPrompt(page).getByRole('link', { name: 'Plan your week', exact: true })).toBeVisible();
	await expect(views).toHaveCount(0);

	// planning
	await reset(request);
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'planning' }, todos });
	await page.goto('/sprint');
	await expect(sprintPrompt(page).getByRole('link', { name: 'Continue planning', exact: true })).toBeVisible();
	await expect(views).toHaveCount(0);

	// review-required: the sprint of the week before is still active, so only the review prompt shows
	await reset(request);
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: '2026-09-28' }, todos });
	await page.goto('/sprint');
	await expect(sprintPrompt(page).getByRole('link', { name: 'Review the sprint', exact: true })).toBeVisible();
	await expect(sprintPrompt(page).getByRole('link')).toHaveCount(1);
	await expect(page.getByRole('link', { name: 'Plan your week' })).toHaveCount(0);
	await expect(views).toHaveCount(0);
	await expect(todoRows(page)).toHaveCount(0);
});

test('Scenario: Empty days and many todos per day stay in the layout', async ({ page, request }) => {
	const titles = Array.from({ length: 15 }, (_, i) => `Thursday errand ${i + 1} with a long title that keeps going and going until it has to wrap onto several lines`);
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: titles.map((title) => ({ title, aspect: 0, inSprint: true, day: '2026-10-08' }))
	});
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/sprint?view=week');

	// Monday is empty and says so, with its add control.
	const monday = dayColumn(page, '2026-10-05');
	await expect(monday).toContainText('Nothing planned');
	await expect(monday.getByRole('button', { name: 'Add a todo to Mon 5' })).toBeVisible();

	// Thursday holds all fifteen, and nothing scrolls sideways.
	const thursday = dayColumn(page, '2026-10-08');
	await expect(todoRows(thursday)).toHaveCount(15);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
	expect(await weekGrid(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
	for (const title of titles) await expect(thursday.getByRole('group', { name: title })).toHaveCount(1);
});
