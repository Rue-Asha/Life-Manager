import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026 in Berlin; its sprint week runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

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
	{ name: 'Uni', color: 'lavender', icon: 'cap' },
	{ name: 'Home', color: 'ochre', icon: 'house' }
] as const;

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });

test('Scenario: Sprint screens prompt to review when pending', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-09-28' },
		todos: [{ title: 'Clean the fridge', inSprint: true }]
	});

	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		const prompt = page.getByTestId('sprint-prompt');
		await expect(prompt).toHaveAttribute('data-phase', 'review-required');
		await expect(prompt.getByRole('link')).toHaveAttribute('href', '/sprint/review');
		await expect(page.locator('a[href="/sprint/plan"]')).toHaveCount(0);
		await expect(page.getByRole('button', { name: /start/i })).toHaveCount(0);
		await expect(page.getByTestId('todo-row')).toHaveCount(0);
	}
});

test('Scenario: Sunday shows the review prompt above the sprint', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Weekly reset', inSprint: true, day: '2026-10-11' }]
	});
	await setClock(request, '2026-10-11T10:00:00Z');

	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		const prompt = page.getByTestId('sprint-prompt');
		await expect(prompt).toHaveAttribute('data-phase', 'review-available');
		await expect(prompt.getByRole('link')).toHaveAttribute('href', '/sprint/review');
		await expect(row(page, 'Weekly reset')).toBeVisible();
	}

	await page.goto('/sprint');
	await page.getByRole('checkbox', { name: 'Done: Weekly reset' }).click();
	await expect(row(page, 'Weekly reset')).toHaveAttribute('data-status', 'done');
	await page.reload();
	await expect(row(page, 'Weekly reset')).toHaveAttribute('data-status', 'done');
});

test('Scenario: Sprint by aspect groups todos with status', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, status: 'done' },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, status: 'doing' },
			{ title: 'Read chapter 4', aspect: 1, inSprint: true }
		]
	});
	await page.goto('/sprint');

	const health = page.getByTestId(`aspect-group-${aspects[0]}`);
	await expect(health.getByRole('heading', { name: 'Health' })).toBeVisible();
	await expect(health.getByRole('heading').locator('svg')).toBeVisible();
	await expect(health.getByTestId('todo-row')).toHaveCount(2);
	await expect(row(page, 'Morning run').getByLabel('Status')).toHaveValue('done');
	await expect(row(page, 'Book a physio appointment').getByLabel('Status')).toHaveValue('doing');

	const uni = page.getByTestId(`aspect-group-${aspects[1]}`);
	await expect(uni.getByRole('heading', { name: 'Uni' })).toBeVisible();
	await expect(uni.getByTestId('todo-row')).toHaveCount(1);
	await expect(row(page, 'Read chapter 4').getByLabel('Status')).toHaveValue('todo');
});

test('Scenario: Aspects without sprint todos are hidden', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true },
			{ title: 'Clean the fridge', aspect: 2 }
		]
	});
	await page.goto('/sprint?view=aspect');

	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toBeVisible();
	await expect(page.getByTestId(`aspect-group-${aspects[1]}`)).toHaveCount(0);
	await expect(page.getByTestId(`aspect-group-${aspects[2]}`)).toHaveCount(0);
});

test('Scenario: Empty sprint points to the backlog', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge' }]
	});
	await page.goto('/sprint');

	const empty = page.getByTestId('empty-state');
	await expect(empty).toBeVisible();
	await empty.getByRole('link', { name: /backlog/i }).click();
	await expect(page).toHaveURL(/\/backlog$/);
});

test('Scenario: Todo created from a sprint view joins the active sprint', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK }
	});
	await page.goto('/sprint?view=aspect');

	await page.getByRole('button', { name: 'Add a todo' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill('Read chapter 4');
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await form.getByRole('button', { name: 'Add todo' }).click();

	const created = page.getByTestId(`aspect-group-${aspects[1]}`).getByTestId('todo-row');
	await expect(created).toContainText('Read chapter 4');
	await page.reload();
	await expect(created).toHaveAttribute('data-status', 'todo');
	await expect(created).toHaveAttribute('data-day', '');
	await page.goto('/backlog');
	await expect(page.getByTestId('empty-state')).toBeVisible();
});

test('Switching views keeps the sprint and marks the current view', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	await page.goto('/sprint');
	const views = page.getByRole('navigation', { name: 'Sprint view' });
	await expect(views.getByRole('link', { name: 'By aspect' })).toHaveAttribute('aria-current', 'page');

	await views.getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await expect(views.getByRole('link', { name: 'Board' })).toHaveAttribute('aria-current', 'page');

	await views.getByRole('link', { name: 'Week' }).click();
	await expect(page).toHaveURL(/view=week$/);
	await expect(row(page, 'Clean the fridge')).toBeVisible();
});

async function expectStatusInEveryView(page: Page, title: string, status: string) {
	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		await page.reload();
		await expect(row(page, title)).toHaveAttribute('data-status', status);
		await expect(row(page, title).getByLabel('Status')).toHaveValue(status);
		if (view === 'board') await expect(page.getByTestId(`board-column-${status}`)).toContainText(title);
	}
}

test('Scenario: Change status from every sprint view', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true, day: '2026-10-06' }]
	});
	const title = 'Draft the cover letter';

	await page.goto('/sprint?view=aspect');
	await row(page, title).getByLabel('Status').selectOption('doing');
	await expect(row(page, title)).toHaveAttribute('data-status', 'doing');
	await expectStatusInEveryView(page, title, 'doing');

	await page.goto('/sprint?view=board');
	await row(page, title).getByLabel('Status').selectOption('done');
	await expect(page.getByTestId('board-column-done')).toContainText(title);
	await expectStatusInEveryView(page, title, 'done');

	await page.goto('/sprint?view=week');
	await row(page, title).getByLabel('Status').selectOption('todo');
	await expect(row(page, title)).toHaveAttribute('data-status', 'todo');
	await expectStatusInEveryView(page, title, 'todo');
});

test('Scenario: Checkbox toggles done', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Clean the fridge', aspect: 2, inSprint: true },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, status: 'doing' }
		]
	});

	for (const [view, title] of [
		['aspect', 'Clean the fridge'],
		['board', 'Book a physio appointment']
	]) {
		await page.goto(`/sprint?view=${view}`);
		await page.getByRole('checkbox', { name: `Done: ${title}` }).click();
		await expect(row(page, title)).toHaveAttribute('data-status', 'done');
		await page.reload();
		await expect(row(page, title)).toBeVisible();
		await expect(page.getByRole('checkbox', { name: `Done: ${title}` })).toHaveAttribute('aria-checked', 'true');
		await expect(row(page, title).getByRole('button', { name: title })).toHaveCSS(
			'text-decoration-line',
			'line-through'
		);
	}
});

test('Scenario: Move a todo between board columns by drag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true }]
	});
	await page.goto('/sprint?view=board');

	await row(page, 'Draft the cover letter').dragTo(page.getByTestId('board-column-doing'));
	await expect(page.getByTestId('board-column-doing')).toContainText('Draft the cover letter');

	await page.reload();
	await expect(page.getByTestId('board-column-doing')).toContainText('Draft the cover letter');
	await expect(row(page, 'Draft the cover letter')).toHaveAttribute('data-status', 'doing');
});

test('Scenario: Empty board column shows a placeholder', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Clean the fridge', aspect: 2, inSprint: true },
			{ title: 'Morning run', aspect: 0, inSprint: true, status: 'done' }
		]
	});
	await page.goto('/sprint?view=board');

	await expect(page.getByTestId('board-column-doing').getByTestId('column-placeholder')).toBeVisible();
	await expect(page.getByTestId('board-column-doing').getByTestId('todo-row')).toHaveCount(0);
	await expect(page.getByTestId('board-column-todo').getByTestId('column-placeholder')).toHaveCount(0);
});

test('Board cards show their aspect as a tag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Read chapter 4', aspect: 1, inSprint: true }]
	});
	await page.goto('/sprint?view=board');

	const card = page.getByTestId('sprint-card').filter({ hasText: 'Read chapter 4' });
	await expect(card.getByTestId('aspect-tag')).toHaveText('Uni');
	await expect(card.getByTestId('aspect-tag').locator('svg')).toBeVisible();
});

const day = (page: Page, key: string) => page.getByTestId(`day-column-${key}`);

test('Scenario: Assign a todo to a day by drag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	await page.goto('/sprint?view=week');
	await expect(day(page, 'unscheduled')).toContainText('Clean the fridge');

	await row(page, 'Clean the fridge').dragTo(day(page, '2026-10-06'));
	await expect(day(page, '2026-10-06')).toContainText('Clean the fridge');

	await page.reload();
	await expect(day(page, '2026-10-06')).toContainText('Clean the fridge');
	await expect(day(page, 'unscheduled').getByTestId('todo-row')).toHaveCount(0);
	await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-06');
});

test('Scenario: Day picker offers only days of the active sprint', async ({ page, request, baseURL }) => {
	const { todos } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	await page.goto('/sprint?view=week');

	await expect(row(page, 'Clean the fridge').getByLabel('Day').locator('option')).toHaveText([
		'Unscheduled',
		'Mon 5',
		'Tue 6',
		'Wed 7',
		'Thu 8',
		'Fri 9',
		'Sat 10',
		'Sun 11'
	]);

	const refused = await request.post('/todos?/setDay', {
		form: { id: String(todos[0]), day: '2026-10-12' },
		headers: { origin: baseURL!, 'x-sveltekit-action': 'true' }
	});
	const body = await refused.json();
	expect(body.type).toBe('failure');
	expect(body.data).toContain('day-outside-sprint');
	await page.reload();
	await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '');
});

test('Scenario: Today is highlighted in the week view', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');

	const badge = day(page, '2026-10-07').getByRole('heading').locator('[aria-current="date"]');
	await expect(badge).toHaveText('7');
	await expect(badge).toHaveCSS('background-color', 'rgb(31, 90, 68)');
	await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
});

test('Scenario: Done todos stay on their day', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true, day: '2026-10-05' }]
	});
	await page.goto('/sprint?view=week');

	await page.getByRole('checkbox', { name: 'Done: Morning run' }).click();
	await expect(row(page, 'Morning run')).toHaveAttribute('data-status', 'done');
	await page.reload();
	await expect(day(page, '2026-10-05').getByTestId('todo-row')).toHaveAttribute('data-status', 'done');
	await expect(day(page, '2026-10-05').getByRole('checkbox', { name: 'Done: Morning run' })).toHaveAttribute(
		'aria-checked',
		'true'
	);
});

test('Scenario: Todo created in a day column is assigned to that day', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');

	await day(page, '2026-10-07').getByRole('button', { name: 'Add a todo' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill('Return library books');
	await form.getByRole('button', { name: 'Add todo' }).click();

	await expect(day(page, '2026-10-07')).toContainText('Return library books');
	await page.reload();
	await expect(row(page, 'Return library books')).toHaveAttribute('data-day', '2026-10-07');
	await page.goto('/sprint?view=aspect');
	await expect(row(page, 'Return library books')).toBeVisible();
});

test('Scenario: Recurring instances appear in the week view', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		rules: [{ title: 'Gym', aspect: 0, weekdays: [2] }]
	});
	await page.goto('/sprint/plan');
	await page.getByRole('button', { name: 'Start sprint' }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await page.goto('/sprint?view=week');

	await expect(day(page, '2026-10-06').getByTestId('todo-row')).toContainText('Gym');
	await expect(day(page, '2026-10-06').getByTestId('todo-row')).toContainText('Recurring');
});

test.describe('on a touch phone', () => {
	test.use({ hasTouch: true, isMobile: true });

	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 800 });
	});

	test('Scenario: Move a todo between board columns with the status menu on touch', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
		});
		await page.goto('/sprint?view=board');
		await expect(page.getByTestId('sprint-card').first()).not.toHaveAttribute('draggable', 'true');

		await row(page, 'Clean the fridge').getByLabel('Status').selectOption('done');
		await expect(page.getByTestId('board-column-done')).toContainText('Clean the fridge');
		await expect(page.getByTestId('board-column-todo').getByTestId('todo-row')).toHaveCount(0);
	});

	test('Scenario: Assign a todo to a day with the day picker on touch', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
		});
		await page.goto('/sprint?view=week');
		await expect(row(page, 'Clean the fridge')).toBeHidden();

		await page.getByRole('button', { name: 'Unscheduled' }).click();
		await expect(page.getByTestId('sprint-card').first()).not.toHaveAttribute('draggable', 'true');
		await row(page, 'Clean the fridge').getByLabel('Day').selectOption({ label: 'Fri 9' });
		await expect(day(page, 'unscheduled').getByTestId('todo-row')).toHaveCount(0);

		await page.getByRole('button', { name: 'Fri 9' }).click();
		await expect(row(page, 'Clean the fridge')).toBeVisible();
		await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-09');
	});

	test('Scenario: Phone shows one day at a time', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
		await page.goto('/sprint?view=week');

		const columns = page.locator('[data-testid^="day-column-"]');
		await expect(columns.filter({ visible: true })).toHaveCount(1);
		await expect(day(page, '2026-10-07')).toBeVisible();

		const days = page.getByRole('navigation', { name: 'Days' });
		await expect(days.getByRole('button')).toHaveCount(8);
		for (const name of ['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10', 'Sun 11', 'Unscheduled']) {
			await expect(days.getByRole('button', { name, exact: true })).toBeVisible();
		}
		await expect(days.getByRole('button', { name: 'Wed 7' })).toHaveAttribute('aria-pressed', 'true');

		await days.getByRole('button', { name: 'Fri 9' }).click();
		await expect(day(page, '2026-10-09')).toBeVisible();
		await expect(columns.filter({ visible: true })).toHaveCount(1);

		await days.getByRole('button', { name: 'Unscheduled' }).click();
		await expect(day(page, 'unscheduled')).toBeVisible();
		await expect(columns.filter({ visible: true })).toHaveCount(1);
	});
});
