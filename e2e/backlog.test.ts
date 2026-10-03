import { expect, test } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';

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

test('Scenario: Backlog is grouped by aspect', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		todos: [
			{ title: 'Undated, no priority', aspect: 0 },
			{ title: 'P2 due later', aspect: 0, priority: 2, dueDate: '2026-10-20' },
			{ title: 'P2 due sooner', aspect: 0, priority: 2, dueDate: '2026-10-10' },
			{ title: 'P1 undated', aspect: 0, priority: 1 },
			{ title: 'Read chapter 4', aspect: 1, priority: 3 }
		]
	});
	await page.goto('/backlog');

	const health = page.getByTestId(`aspect-group-${aspects[0]}`);
	await expect(health.getByRole('heading', { name: 'Health' })).toBeVisible();
	await expect(health.getByRole('heading').locator('svg')).toBeVisible();
	await expect(health.getByTestId('todo-row').locator('.title')).toHaveText([
		'P1 undated',
		'P2 due sooner',
		'P2 due later',
		'Undated, no priority'
	]);

	const uni = page.getByTestId(`aspect-group-${aspects[1]}`);
	await expect(uni.getByRole('heading', { name: 'Uni' })).toBeVisible();
	await expect(uni.getByTestId('todo-row')).toHaveCount(1);
	await expect(uni.getByTestId('todo-row')).toContainText('Read chapter 4');
});

test('Scenario: Filter the backlog to one aspect', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		todos: [
			{ title: 'Book a physio appointment', aspect: 0 },
			{ title: 'Read chapter 4', aspect: 1 }
		]
	});
	await page.goto('/backlog');
	const filter = page.getByRole('navigation', { name: 'Filter by aspect' });

	await filter.getByRole('link', { name: 'Uni' }).click();
	await expect(page).toHaveURL(new RegExp(`aspect=${aspects[1]}$`));
	await expect(page.getByTestId(`aspect-group-${aspects[1]}`)).toBeVisible();
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toHaveCount(0);
	await expect(filter.getByRole('link', { name: 'Uni' })).toHaveAttribute('aria-current', 'true');

	await filter.getByRole('link', { name: 'All' }).click();
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toBeVisible();
	await expect(page.getByTestId(`aspect-group-${aspects[1]}`)).toBeVisible();
});

test('Scenario: Empty backlog shows an empty state', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS] });
	await page.goto('/backlog');

	const empty = page.getByTestId('empty-state');
	await expect(empty).toContainText('Your backlog is empty.');
	await empty.getByRole('button', { name: 'Add a todo' }).click();
	await expect(page.getByRole('form', { name: 'New todo' })).toBeVisible();
	await expect(page.getByRole('form', { name: 'New todo' }).getByLabel('Title')).toBeFocused();
});

test('Scenario: Overdue todos are marked in the backlog', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		todos: [
			{ title: 'Send tax receipts', dueDate: '2026-10-04' },
			{ title: 'Renew the bike insurance', dueDate: '2026-10-09' }
		]
	});
	await page.goto('/backlog');

	const late = page.getByTestId('todo-row').filter({ hasText: 'Send tax receipts' });
	await expect(late).toHaveAttribute('data-overdue', 'true');
	await expect(late.getByText('Overdue, 3d late')).toBeVisible();

	const onTime = page.getByTestId('todo-row').filter({ hasText: 'Renew the bike insurance' });
	await expect(onTime).toHaveAttribute('data-overdue', 'false');
	await expect(onTime).toContainText('2d left');
});

test('Scenario: Add a backlog todo to the active sprint', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Clean the fridge' }, { title: 'Water the plants' }]
	});
	await page.goto('/backlog');

	await page.getByRole('button', { name: 'Add to sprint: Clean the fridge' }).click();
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Clean the fridge' })).toHaveCount(0);
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Water the plants' })).toBeVisible();

	await page.goto('/sprint');
	const added = page.getByTestId('todo-row').filter({ hasText: 'Clean the fridge' });
	await expect(added).toHaveAttribute('data-status', 'todo');
	await expect(added.getByLabel('Status')).toHaveValue('todo');
	await expect(page.getByTestId('sprint-list').getByTestId('todo-row').filter({ hasText: 'Water the plants' })).toHaveCount(0);
});

test('No "Add to sprint" without an active sprint', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Clean the fridge' }] });
	await page.goto('/backlog');

	await expect(page.getByTestId('todo-row')).toBeVisible();
	await expect(page.getByRole('button', { name: /^Add to sprint/ })).toHaveCount(0);
});
