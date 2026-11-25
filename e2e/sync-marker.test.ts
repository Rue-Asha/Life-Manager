import type { Locator, Page } from '@playwright/test';
import { expect, test, fake, protonOn, protonPass, reset, seed, setClock } from './helpers';

const NOW = '2026-10-12T08:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Marker shows in both bars on attention states', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Stretch', day: '2026-10-12' }] });
	const marker = (scope: Page | Locator) => scope.getByRole('img', { name: 'Needs attention' });

	const visit = async (marked: boolean) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		const bar = page.getByRole('navigation', { name: 'Main' });
		await expect(marker(page)).toHaveCount(marked ? 1 : 0);
		await expect(marker(bar.getByRole('button', { name: /^More/ }))).toHaveCount(marked ? 1 : 0);
		await bar.getByRole('button', { name: /^More/ }).click();
		await expect(marker(page.getByRole('menuitem', { name: /^Proton sync/ }))).toHaveCount(marked ? 1 : 0);
		await page.keyboard.press('Escape');

		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/');
		await expect(marker(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^More/ }))).toHaveCount(marked ? 1 : 0);
		await expect(marker(page)).toHaveCount(marked ? 1 : 0);
	};

	await protonOn(request);
	await visit(false);

	fake().fail({ kind: '*', code: 2, error: 'Error: not logged in' });
	await protonPass(request);
	await visit(true);

	const response = await request.post('/__test/proton', {
		data: { enable: { cli: '/nonexistent/proton', gapMs: 0, debounceMs: 3_600_000, tickMs: 3_600_000 } }
	});
	expect(response.ok()).toBe(true);
	await protonPass(request);
	await visit(true);
});
