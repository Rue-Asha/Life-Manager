import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Sunday 11 October 2026 in Berlin: the sprint of 5–11 October is still running and its review is open.
const SUNDAY = '2026-10-11T10:00:00Z';
const WEEK = '2026-10-05';

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

async function expectCentred(page: Page, name: string) {
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const { column, free } = await page.evaluate(() => {
		const main = document.querySelector('main')!.getBoundingClientRect();
		const sidebar = document.querySelector('main')!.previousElementSibling!.getBoundingClientRect();
		const width = document.documentElement.clientWidth;
		return { column: main.left + main.width / 2, free: sidebar.right + (width - sidebar.right) / 2 };
	});
	expect(Math.abs(column - free), `${name} column is off-centre`).toBeLessThanOrEqual(8);
}

test('Scenario: Screens without a rail centre their column', async ({ page, request }) => {
	await page.setViewportSize({ width: 1600, height: 900 });
	await reset(request);
	await page.goto('/welcome');
	await expectCentred(page, 'welcome');

	await setClock(request, SUNDAY);
	await seed(request, {
		aspects: [{ name: 'Health' }],
		sprint: { state: 'active', weekStart: WEEK },
		rules: [{ title: 'Gym', weekdays: [1, 4] }],
		todos: [{ title: 'Morning run', inSprint: true, day: '2026-10-11' }, { title: 'Read chapter 4' }]
	});
	for (const [path, name] of [
		['/backlog', 'backlog'],
		['/sprint/review', 'review'],
		['/recurring', 'recurring']
	]) {
		await page.goto(path);
		await expect(page).toHaveURL(new RegExp(`${path}$`));
		await expectCentred(page, name);
	}
});
