import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026, midday in Berlin.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

async function quickAdd(page: Page, fields: { title: string; aspect?: string; due?: string }) {
	await page.getByRole('button', { name: 'Add a todo' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill(fields.title);
	if (fields.aspect) await form.getByLabel('Aspect').selectOption({ label: fields.aspect });
	if (fields.due) await form.getByLabel('Due date').fill(fields.due);
	await form.getByRole('button', { name: 'Add todo' }).click();
}

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });

test('GET /todos redirects to the backlog', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/todos');
	await expect(page).toHaveURL(/\/backlog$/);
});

test('Scenario: Quick add creates a todo in the backlog', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [
			{ name: 'Health', color: 'sage', icon: 'heart' },
			{ name: 'Uni', color: 'lavender', icon: 'cap' }
		]
	});
	await page.goto('/backlog');

	await quickAdd(page, { title: 'Read chapter 4', aspect: 'Uni' });

	const group = page.getByTestId(`aspect-group-${aspects[1]}`);
	await expect(group.getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toBeVisible();
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toHaveCount(0);

	await page.reload();
	await expect(group.getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toBeVisible();
});

test('Quick add rejects an empty title inline', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/backlog');

	await quickAdd(page, { title: '   ' });

	await expect(page.getByRole('form', { name: 'New todo' }).getByText('Give the todo a title.')).toBeVisible();
	await expect(page.getByTestId('todo-row')).toHaveCount(0);
});

test('Scenario: Past due date is allowed and shown overdue', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Finance', color: 'lagoon', icon: 'wallet' }] });
	await page.goto('/backlog');

	await quickAdd(page, { title: 'Send tax receipts', due: '2026-10-05' });

	const created = row(page, 'Send tax receipts');
	await expect(created).toHaveAttribute('data-overdue', 'true');
	await expect(created.getByText('2d late')).toBeVisible();
});

test('Quick add on phone opens a sheet', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/backlog');

	await quickAdd(page, { title: 'Book a physio appointment' });

	await expect(row(page, 'Book a physio appointment')).toBeVisible();
	await expect(page.getByRole('form', { name: 'New todo' })).toBeHidden();
});
