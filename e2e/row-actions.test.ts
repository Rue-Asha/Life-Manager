import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRow as row, type SeedInput } from './helpers';
import { sprintList } from './sprint-locators';

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

async function openActions(page: Page, title: string) {
	await row(page, title).getByRole('button', { name: 'More actions' }).click();
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

	await expect(row(sprintList(page), 'Book a physio appointment')).toHaveCount(0);
	await expect(row(page, 'Stretch for ten minutes')).toBeVisible();
	await expect(page).toHaveURL(/\/sprint$/);

	await page.goto('/backlog');
	const moved = row(page, 'Book a physio appointment');
	await expect(moved).toContainText('Status: To do');
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

	await expect(row(sprintList(page), 'Book a physio appointment')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('alertdialog')).toHaveCount(0);

	await page.goto('/backlog');
	await expect(row(page, 'Book a physio appointment')).toContainText('Status: To do');
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
	const toast = page.getByRole('status');
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
	await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();

	await expect(page.getByRole('status')).toHaveCount(0);
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
	await expect(page.getByRole('status')).toBeVisible();
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
	const list = sprintList(page);

	const first = row(list, 'Book a physio appointment');
	await expect(first.getByLabel('Status: To do')).toBeVisible();
	await expect(row(list, 'Stretch for ten minutes').getByLabel('Status: Doing')).toBeVisible();
	for (const title of ['Book a physio appointment', 'Stretch for ten minutes']) {
		await expect(row(list, title).getByRole('button', { name: 'More actions' })).toBeVisible();
		await expect(row(list, title).getByRole('button', { name: 'Pick a day' })).toHaveCount(0);
		// "Unscheduled" may read as meta text; the status word never does.
		const visible = await row(list, title).evaluate((el) => {
			const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
			const parts: string[] = [];
			for (let n = walker.nextNode(); n; n = walker.nextNode()) {
				const parent = n.parentElement!;
				if (parent.closest('[popover], .visually-hidden')) continue;
				if (parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) parts.push(n.textContent!);
			}
			return parts.join(' ');
		});
		expect(visible).not.toMatch(/To do/);
	}

	await first.getByRole('button', { name: 'More actions' }).click();
	const day = page.getByRole('menu', { name: 'More actions' });
	await expect(day.getByRole('menuitemradio', { name: 'Unscheduled' })).toHaveAttribute('aria-checked', 'true');
	await expect(day.getByRole('menuitemradio')).toHaveCount(8);
	await page.keyboard.press('Escape');

	await first.getByLabel('Status: To do').click();
	await page.getByRole('menu', { name: 'Status' }).getByRole('menuitemradio', { name: 'Doing' }).click();
	await expect(first.getByLabel('Status: Doing')).toBeVisible();
	await page.reload();
	await expect(row(list, 'Book a physio appointment').getByLabel('Status: Doing')).toBeVisible();
});
