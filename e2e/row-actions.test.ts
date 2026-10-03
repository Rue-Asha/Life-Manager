import { expect, test, type Page } from '@playwright/test';
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

const ASPECTS: SeedInput['aspects'] = [{ name: 'Health', color: 'sage', icon: 'heart' }];

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });

async function openActions(page: Page, title: string) {
	await row(page, title).getByTestId('row-actions').click();
	return page.getByRole('menu');
}

test('Scenario: Move a sprint todo back to the backlog from its row', async ({ page, request }) => {
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Book a physio appointment', inSprint: true, status: 'doing', day: '2026-10-07' },
			{ title: 'Stretch for ten minutes', inSprint: true }
		]
	});
	await page.goto('/sprint');

	const menu = await openActions(page, 'Book a physio appointment');
	await menu.getByRole('menuitem', { name: 'Move to backlog' }).click();

	await expect(row(page, 'Book a physio appointment')).toHaveCount(0);
	await expect(row(page, 'Stretch for ten minutes')).toBeVisible();
	await expect(page).toHaveURL(/\/sprint$/);

	await page.goto('/backlog');
	const moved = row(page, 'Book a physio appointment');
	await expect(moved).toHaveAttribute('data-status', 'todo');
	await expect(moved).toHaveAttribute('data-day', '');
});

test('Scenario: Done todo goes back without a question', async ({ page, request }) => {
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Book a physio appointment', inSprint: true, status: 'done', day: '2026-10-06' }]
	});
	await page.goto('/sprint');

	const menu = await openActions(page, 'Book a physio appointment');
	await menu.getByRole('menuitem', { name: 'Move to backlog' }).click();

	await expect(row(page, 'Book a physio appointment')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);

	await page.goto('/backlog');
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-status', 'todo');
});
