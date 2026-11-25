import type { Page } from '@playwright/test';
import { expect, test, reset, seed } from './helpers';

const hub = (page: Page) => page.getByRole('main');

test.describe('on the phone', () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test('Scenario: More hub lists the secondary destinations', async ({ page, request }) => {
		const { aspects, projects } = await seed(request, {
			aspects: [
				{ name: 'Health', color: 'sage', icon: 'heart' },
				{ name: 'Home', color: 'ochre', icon: 'house' },
				{ name: 'IT', color: 'sky', icon: 'briefcase' }
			],
			itAspect: 2,
			projects: [
				{ name: 'A', status: 'active' },
				{ name: 'B', status: 'active' },
				{ name: 'C', status: 'backlog' }
			],
			rules: [{ title: 'Gym', aspect: 0, weekdays: [1] }]
		});
		await page.goto('/menu');

		await expect(hub(page).getByRole('heading', { level: 1 })).toHaveText('More');
		const rows = hub(page).getByRole('list', { name: 'Aspects' }).getByRole('link');
		await expect(rows).toHaveText([/^\s*Health/, /^\s*Home/, /^\s*IT/, /^\s*All aspects/]);
		await expect(hub(page).locator('.nav-tile svg')).toHaveCount(3);
		expect(await hub(page).locator('.nav-tile').evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.color))).toEqual(['sage', 'ochre', 'sky']);
		await expect(hub(page).getByRole('link', { name: /^Projects/ })).toContainText('2');
		await expect(hub(page).getByRole('link', { name: /^Recurring/ })).toContainText('1');
		await expect(hub(page).getByRole('link', { name: /^Uni/ })).toBeVisible();
		await expect(hub(page).getByRole('link', { name: /^Proton sync/ })).toBeVisible();
		await expect(hub(page).locator('a.main .chevron[aria-hidden="true"]')).toHaveCount(8);

		for (const [name, path] of [
			['Health', `/aspects/${aspects[0]}`],
			['Projects', '/projects'],
			['Uni', '/uni'],
			['Recurring', '/recurring'],
			['Proton sync', '/sync']
		]) {
			await page.goto('/menu');
			await hub(page).getByRole('link', { name: new RegExp(`^${name}`) }).click();
			await expect.poll(() => new URL(page.url()).pathname).toBe(path);
		}
		expect(projects).toHaveLength(3);
	});

	test('Scenario: Many aspects scroll in the More hub', async ({ page, request }) => {
		await seed(request, { aspects: Array.from({ length: 25 }, (_, i) => ({ name: `Aspect ${i + 1}` })) });
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/menu');

		await expect(hub(page).getByRole('list', { name: 'Aspects' }).getByRole('link')).toHaveCount(26);
		expect(await page.evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight)).toBe(true);
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		const last = hub(page).getByRole('link', { name: /^Aspect 25/ });
		await expect(last).toBeInViewport();
		const [row, bar] = [await last.boundingBox(), await page.locator('nav.dock').boundingBox()];
		expect(row!.y + row!.height).toBeLessThanOrEqual(bar!.y);
		const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	});

	test('Scenario: Sync Off shows no marker in the hub', async ({ page, request }) => {
		await seed(request, { aspects: [{ name: 'Health' }] });
		await page.goto('/menu');

		await expect(hub(page).getByRole('link', { name: /^Proton sync/ })).toContainText('Off');
		await expect(page.getByRole('img', { name: 'Needs attention' })).toHaveCount(0);
	});

	test('Scenario: Phone keeps /menu', async ({ page, request }) => {
		await seed(request, { aspects: [{ name: 'Health' }] });
		await page.goto('/menu');
		await expect(hub(page).getByRole('heading', { level: 1, name: 'More' })).toBeVisible();
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveURL(/\/menu$/);
	});
});

test('Scenario: Wide screen keeps /menu', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/menu');
	await expect(hub(page).getByRole('heading', { level: 1, name: 'More' })).toBeVisible();
	await page.waitForLoadState('networkidle');
	await expect(page).toHaveURL(/\/menu$/);
	const [first, second] = await page.locator('.hub > .card').all();
	const [a, b] = [await first.boundingBox(), await second.boundingBox()];
	expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);
	expect(Math.abs(b!.y - a!.y)).toBeLessThan(2);
});

test.beforeEach(async ({ request }) => {
	await reset(request);
});
