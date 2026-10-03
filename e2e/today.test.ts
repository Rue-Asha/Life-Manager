import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';
const TODAY = '2026-10-07';

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
	{ name: 'Finance', color: 'lagoon', icon: 'wallet' }
] as const;

const ACTIVE = { state: 'active', weekStart: '2026-10-05' } as const;

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });

test('Scenario: Today shows today\'s sprint todos and overdue todos', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, day: TODAY },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, day: '2026-10-08' },
			{ title: 'Send tax receipts', aspect: 1, dueDate: '2026-10-06' }
		]
	});
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await expect(page.getByTestId('todo-row')).toHaveCount(2);
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`).getByRole('heading', { name: 'Health' })).toBeVisible();
	await expect(row(page, 'Morning run')).toBeVisible();
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`).getByTestId('todo-row')).toHaveText(/Morning run/);

	const overdue = page.getByTestId('overdue-group');
	await expect(overdue.getByRole('heading', { name: /Overdue/ })).toBeVisible();
	await expect(overdue.getByTestId('todo-row')).toHaveCount(1);
	await expect(overdue.getByTestId('todo-row')).toContainText('Send tax receipts');
	await expect(overdue.getByTestId('todo-row')).toContainText('Finance');
	await expect(overdue.getByTestId('todo-row')).toHaveAttribute('data-overdue', 'true');

	await expect(row(page, 'Book a physio appointment')).toHaveCount(0);
});

test('An overdue todo planned for today is listed once, under Overdue', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [{ title: 'Pay the rent', aspect: 1, inSprint: true, day: TODAY, dueDate: '2026-10-01' }]
	});
	await page.goto('/');

	await expect(row(page, 'Pay the rent')).toHaveCount(1);
	await expect(page.getByTestId('overdue-group').getByTestId('todo-row')).toContainText('Pay the rent');
});

test('Scenario: Status toggle on Today', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [{ title: 'Morning run', inSprint: true, day: TODAY }]
	});
	await page.goto('/');

	const checkbox = page.getByRole('checkbox', { name: 'Done: Morning run' });
	await checkbox.click();
	await expect(checkbox).toHaveAttribute('aria-checked', 'true');
	await expect(row(page, 'Morning run')).toHaveAttribute('data-status', 'done');
	await expect(row(page, 'Morning run').locator('.title')).toHaveCSS('text-decoration-line', 'line-through');

	await page.reload();
	await expect(row(page, 'Morning run')).toHaveAttribute('data-status', 'done');
});

test('Scenario: Quick add on Today adds to the sprint on today', async ({ page, request }) => {
	const { aspects } = await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE });
	await page.goto('/');

	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill('Stretch for ten minutes');
	await form.getByRole('button', { name: 'Add todo' }).click();

	const added = row(page, 'Stretch for ten minutes');
	await expect(added).toHaveAttribute('data-day', TODAY);
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toContainText('Stretch for ten minutes');

	// Today lists only active-sprint todos, so surviving a reload proves the membership.
	await page.reload();
	await expect(row(page, 'Stretch for ten minutes')).toHaveAttribute('data-day', TODAY);
	await page.goto('/backlog');
	await expect(row(page, 'Stretch for ten minutes')).toHaveCount(0);
});
