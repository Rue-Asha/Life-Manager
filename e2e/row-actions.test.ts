import type { Locator, Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, type SeedInput } from './helpers';

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

const row = (scope: Page | Locator, title: string) => scope.getByTestId('todo-row').filter({ hasText: title });

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

	await expect(row(page.getByTestId('sprint-list'), 'Book a physio appointment')).toHaveCount(0);
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

	await expect(row(page.getByTestId('sprint-list'), 'Book a physio appointment')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);

	await page.goto('/backlog');
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-status', 'todo');
});

const RECURRING: SeedInput = {
	aspects: ASPECTS,
	sprint: { state: 'active', weekStart: WEEK },
	rules: [{ title: 'Morning run', weekdays: [3, 5] }],
	todos: [
		{ title: 'Morning run', inSprint: true, rule: 0, day: '2026-10-07' },
		{ title: 'Book a physio appointment', inSprint: true }
	]
};

test('Scenario: Removing a recurring instance deletes it with undo', async ({ page, request }) => {
	await seed(request, RECURRING);
	await page.goto('/sprint');

	const menu = await openActions(page, 'Morning run');
	await expect(menu.getByRole('menuitem', { name: 'Remove from sprint' })).toBeVisible();
	await expect(menu.getByRole('menuitem', { name: 'Move to backlog' })).toHaveCount(0);
	await menu.getByRole('menuitem', { name: 'Remove from sprint' }).click();

	await expect(row(page, 'Morning run')).toHaveCount(0);
	const toast = page.getByTestId('toast');
	await expect(toast).toBeVisible();
	await expect(toast.getByRole('button', { name: 'Undo' })).toBeVisible();

	await expect(toast).toHaveCount(0, { timeout: 8000 });
	await page.reload();
	await expect(row(page, 'Book a physio appointment')).toBeVisible();
	await expect(row(page, 'Morning run')).toHaveCount(0);
	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Backlog');
	await expect(row(page, 'Morning run')).toHaveCount(0);
});

test('Scenario: Undo keeps a removed recurring instance', async ({ page, request }) => {
	await seed(request, RECURRING);
	await page.goto('/sprint');

	const menu = await openActions(page, 'Morning run');
	await menu.getByRole('menuitem', { name: 'Remove from sprint' }).click();
	await expect(row(page, 'Morning run')).toHaveCount(0);
	await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click();

	await expect(page.getByTestId('toast')).toHaveCount(0);
	await expect(row(page, 'Morning run')).toBeVisible();
	// Past the toast's 5 s, so a delete that wasn't cancelled would have been posted.
	await page.waitForTimeout(5500);
	await page.reload();
	await expect(row(page, 'Morning run')).toHaveAttribute('data-day', '2026-10-07');
});

test('A pending removal is posted when Rue navigates away', async ({ page, request }) => {
	await seed(request, RECURRING);
	await page.goto('/sprint');

	const menu = await openActions(page, 'Morning run');
	await menu.getByRole('menuitem', { name: 'Remove from sprint' }).click();
	await expect(page.getByTestId('toast')).toBeVisible();
	await page.getByRole('link', { name: /Backlog/ }).first().click();
	await expect(page).toHaveURL(/\/backlog$/);

	await page.goto('/sprint');
	await expect(row(page, 'Book a physio appointment')).toBeVisible();
	await expect(row(page, 'Morning run')).toHaveCount(0);
});

test('Scenario: Row shows status as a glyph with its name', async ({ page, request }) => {
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Book a physio appointment', inSprint: true },
			{ title: 'Stretch for ten minutes', inSprint: true, status: 'doing' }
		]
	});
	await page.goto('/sprint?view=aspect');
	const list = page.getByTestId('sprint-list');

	const first = row(list, 'Book a physio appointment');
	await expect(first.getByLabel('Status: To do')).toBeVisible();
	await expect(row(list, 'Stretch for ten minutes').getByLabel('Status: Doing')).toBeVisible();
	for (const title of ['Book a physio appointment', 'Stretch for ten minutes']) {
		await expect(row(list, title).getByLabel('Pick a day')).toBeVisible();
		// Visible text only: the native selects keep their option names for assistive tech and the menu.
		const visible = await row(list, title).evaluate((el) => {
			const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
			const parts: string[] = [];
			for (let n = walker.nextNode(); n; n = walker.nextNode()) {
				const parent = n.parentElement!;
				if (parent.closest('select, .visually-hidden')) continue;
				if (parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) parts.push(n.textContent!);
			}
			return parts.join(' ');
		});
		expect(visible).not.toMatch(/To do|Unscheduled/);
	}

	await first.getByLabel('Status: To do').selectOption({ label: 'Doing' });
	await expect(first).toHaveAttribute('data-status', 'doing');
	await page.reload();
	await expect(row(list, 'Book a physio appointment')).toHaveAttribute('data-status', 'doing');
});
