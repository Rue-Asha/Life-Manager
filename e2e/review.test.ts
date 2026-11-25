import { dayColumn, expect, test, reset, seed, setClock, todoRow as row, todoRows } from './helpers';

// Sunday 11 October 2026 in Berlin, the last day of the sprint that started Monday 5 October.
const NOW = '2026-10-11T16:00:00Z';
const SPRINT = { state: 'active', weekStart: '2026-10-05' } as const;

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' }
] as const;

test('Scenario: Review carries over and returns open todos', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: SPRINT,
		todos: [
			{ title: 'Book a physio appointment', inSprint: true, status: 'done', day: '2026-10-06' },
			{ title: 'Finish exercise sheet 3', aspect: 1, inSprint: true, status: 'doing', day: '2026-10-08' },
			{ title: 'Clean the fridge', inSprint: true, status: 'doing', day: '2026-10-09' }
		]
	});
	await page.goto('/sprint/review');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Review your sprint');
	const done = page.getByRole('group', { name: 'Done todos' });
	await expect(done).toContainText('Done 1');
	await done.getByText('Done 1', { exact: true }).click();
	await expect(row(page, 'Book a physio appointment')).toContainText('Status: Done');

	const carried = page.getByRole('radiogroup', { name: 'Finish exercise sheet 3' });
	await expect(carried.getByRole('radio', { name: 'Carry over' })).toBeChecked();
	const returned = page.getByRole('radiogroup', { name: 'Clean the fridge' });
	await expect(returned.getByRole('radio', { name: 'Carry over' })).toBeChecked();
	await returned.getByRole('radio', { name: 'Back to backlog' }).check();

	await page.getByRole('button', { name: 'Carry 1, return 1 and close' }).click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);

	const sprint = page.getByRole('region', { name: /^This sprint\b/ });
	await expect(todoRows(sprint)).toHaveCount(1);
	await expect(row(page, 'Finish exercise sheet 3')).toContainText('Status: Doing');
	await expect(row(page, 'Finish exercise sheet 3')).toHaveAttribute('data-day', '');
	const backlog = page.getByRole('region', { name: /^Backlog\b/ });
	await expect(todoRows(backlog)).toHaveCount(1);
	await expect(row(page, 'Clean the fridge')).toContainText('Status: To do');
	await expect(row(page, 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: All-done review closes in one tap', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: SPRINT,
		todos: [
			{ title: 'Book a physio appointment', inSprint: true, status: 'done' },
			{ title: 'Read chapter 4', aspect: 1, inSprint: true, status: 'done' }
		]
	});
	await page.goto('/sprint/review');

	await expect(page.getByText('All 2 done. Nothing to carry over.')).toBeVisible();
	await expect(page.getByRole('radio')).toHaveCount(0);
	await page.getByRole('button', { name: 'Close sprint' }).click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expect(todoRows(page)).toHaveCount(0);
});

test('Recurring instances offer carry or drop, and the label counts drops', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: SPRINT,
		rules: [{ title: 'Gym', weekdays: [1, 5] }],
		todos: [
			{ title: 'Gym', inSprint: true, rule: 0, day: '2026-10-09' },
			{ title: 'Clean the fridge', inSprint: true }
		]
	});
	await page.goto('/sprint/review');

	const gym = page.getByRole('radiogroup', { name: 'Gym' });
	await expect(gym.getByRole('radio')).toHaveCount(2);
	await expect(gym.getByRole('radio', { name: 'Back to backlog' })).toHaveCount(0);
	await gym.getByRole('radio', { name: 'Drop' }).check();

	await page.getByRole('button', { name: 'Carry 1, drop 1 and close' }).click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expect(todoRows(page.getByRole('region', { name: /^This sprint\b/ }))).toHaveText([/Clean the fridge/]);
	await expect(row(page, 'Gym')).toHaveCount(0);
});

test('Review waits for the sprint’s Sunday', async ({ page, request }) => {
	await setClock(request, '2026-10-08T10:00:00Z');
	await seed(request, { aspects: [...ASPECTS], sprint: SPRINT });
	await page.goto('/sprint/review');
	await expect(page).toHaveURL(/\/sprint$/);
});

test('Scenario: Start sprint shows a carried recurring todo once', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: SPRINT,
		rules: [{ title: 'Laundry', weekdays: [2] }],
		todos: [{ title: 'Laundry', inSprint: true, rule: 0, day: '2026-10-06' }]
	});
	await page.goto('/sprint/review');
	await page.getByRole('button', { name: 'Carry 1 and close' }).click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);

	await page.getByRole('button', { name: 'Start sprint with 1 todo' }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await page.goto('/sprint?view=week');
	await expect(dayColumn(page, '2026-10-13')).toBeVisible();
	await expect(row(page, 'Laundry')).toHaveCount(1);
	await expect(todoRows(dayColumn(page, '2026-10-13'))).toHaveText([/Laundry/]);
});
