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
