import type { Page } from '@playwright/test';
import { dayColumn, expect, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import { boardColumn } from './sprint-locators';
import { chooseStatus, statusOf } from './row-locators';

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

// Tab until the focus is on the control, so the path is keyboard only; fails when the control is not in the tab order.
async function tabTo(page: Page, control: ReturnType<Page['getByRole']>) {
	const target = await control.elementHandle();
	for (let i = 0; i < 200; i++) {
		if (await target!.evaluate((el) => el === document.activeElement)) return;
		await page.keyboard.press('Tab');
	}
	throw new Error('the control is not reachable with Tab');
}

// In an open menu: arrows to the item, Enter to pick it.
async function pickWithKeys(page: Page, name: string) {
	const menu = page.getByRole('menu');
	await expect(menu).toBeVisible();
	// Opening puts the focus on the checked item.
	await expect(menu.locator(':focus')).toHaveCount(1);
	for (let i = 0; i < 20; i++) {
		const focused = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? '');
		if (focused === name) return page.keyboard.press('Enter');
		await page.keyboard.press('ArrowDown');
	}
	throw new Error(`no menu item "${name}"`);
}

test('Scenario: Status and day change by menu with the keyboard', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true }]
	});
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/sprint?view=board');
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));

	// Board: the card's "More actions" menu, opened with Enter, Doing under Status.
	const card = boardColumn(page, 'todo').getByRole('group', { name: 'Draft the cover letter' });
	await tabTo(page, card.getByRole('button', { name: 'More actions' }));
	await page.keyboard.press('Enter');
	await pickWithKeys(page, 'Doing');
	await expect(boardColumn(page, 'doing')).toContainText('Draft the cover letter');

	// Week: the same todo's "Status and day" menu from its status glyph, Thursday.
	await page.goto('/sprint?view=week');
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
	const chip = page.getByRole('group', { name: 'Draft the cover letter' });
	await tabTo(page, chip.getByRole('button', { name: /^Status: / }));
	await page.keyboard.press('Enter');
	await expect(page.getByRole('menu', { name: 'Status and day' })).toBeVisible();
	await pickWithKeys(page, 'Thu 8');

	await page.reload();
	await expect(dayColumn(page, '2026-10-08')).toContainText('Draft the cover letter');
	await page.goto('/sprint?view=board');
	await expect(boardColumn(page, 'doing')).toContainText('Draft the cover letter');
});

test.describe('on a touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: Board status changes by menu on touch', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [{ title: 'Clean the fridge', aspect: 0, inSprint: true }]
		});
		await page.goto('/sprint?view=board');

		const card = todoRow(boardColumn(page, 'todo'), 'Clean the fridge');
		await card.getByRole('button', { name: 'More actions' }).tap();
		await page.getByRole('menu', { name: 'More actions' }).getByRole('menuitemradio', { name: 'Done', exact: true }).tap();

		// No drag happened: the card is in the Done column, shown through the Column switch.
		await page.getByRole('group', { name: 'Column' }).getByRole('button', { name: /^Done/ }).tap();
		await expect(todoRows(boardColumn(page, 'done'))).toHaveText([/Clean the fridge/]);
		await page.reload();
		await page.getByRole('group', { name: 'Column' }).getByRole('button', { name: /^Done/ }).tap();
		await expect(statusOf(todoRow(boardColumn(page, 'done'), 'Clean the fridge'), 'Done')).toBeVisible();
	});
});

test('Scenario: Refused menu move reverts and shows the error', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true }]
	});
	// The server refuses the status change (a failure action result, as SvelteKit serialises it).
	await page.route(
		(url) => url.pathname === '/todos' && url.search === '?/setStatus',
		(route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ type: 'failure', status: 400, data: JSON.stringify([{ error: 1 }, 'refused']) })
			})
	);
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/sprint?view=aspect');

	const row = todoRow(page, 'Draft the cover letter');
	await chooseStatus(page, row, 'Doing');

	await expect(row.getByRole('alert')).toHaveText('Couldn’t move that todo — try again.');
	await expect(statusOf(row, 'To do')).toBeVisible();
	await expect(statusOf(row, 'Doing')).toHaveCount(0);
	await page.reload();
	await expect(statusOf(todoRow(page, 'Draft the cover letter'), 'To do')).toBeVisible();
});
