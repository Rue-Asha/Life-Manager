import { expect, test, reset, seed, setClock, todoRow as row } from './helpers';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';
const TODAY = '2026-10-07';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
	await seed(request, {
		aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Water plants', inSprint: true, day: TODAY }]
	});
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Ticking done offers undo', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('checkbox', { name: 'Done: Water plants' }).click();

	const toast = page.getByRole('status').filter({ hasText: 'Done: Water plants' });
	await expect(toast).toBeVisible();
	await expect(toast.getByRole('button', { name: 'Undo' })).toBeVisible();
	await expect(row(page, 'Water plants')).toContainText('Status: Done');

	await page.reload();
	await expect(row(page, 'Water plants')).toContainText('Status: Done');
});

test('Scenario: Undo returns the todo to To do', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('checkbox', { name: 'Done: Water plants' }).click();
	const toast = page.getByRole('status').filter({ hasText: 'Done: Water plants' });
	await toast.getByRole('button', { name: 'Undo' }).click();

	await expect(toast).toHaveCount(0);
	await expect(page.getByRole('checkbox', { name: 'Done: Water plants' })).toHaveAttribute('aria-checked', 'false');
	await page.reload();
	await expect(row(page, 'Water plants')).toContainText('Status: To do');
	await expect(page.getByRole('status').filter({ hasText: 'Done: Water plants' })).toHaveCount(0);
});

test('Scenario: Toast does not cover the pill bar', async ({ page }) => {
	// The real dock, at the widest and the narrowest phone: the toast clears it by its own clearance, not by luck.
	for (const width of [375, 320]) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto('/');
		await page.getByRole('checkbox', { name: 'Done: Water plants' }).click();

		const toast = page.getByRole('status').filter({ hasText: 'Done: Water plants' });
		await expect(toast).toBeVisible();
		const bar = page.getByRole('navigation', { name: 'Main' });
		const plus = page.getByRole('button', { name: 'New todo' });
		await expect(bar).toBeVisible();
		const t = (await toast.locator('.toast').boundingBox())!;
		const b = (await bar.boundingBox())!;
		const p = (await plus.boundingBox())!;
		expect(t.y + t.height).toBeLessThanOrEqual(b.y);
		expect(t.y + t.height).toBeLessThanOrEqual(p.y);
		expect(await page.evaluate(() => document.activeElement?.closest('[role="status"]') === null)).toBe(true);
		await toast.getByRole('button', { name: 'Undo' }).click();
		await expect(toast).toHaveCount(0);
	}
});
