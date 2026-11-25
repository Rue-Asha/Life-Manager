import { expect, test, fake, protonOn, protonPass, reset, seed, setClock } from './helpers';

const NOW = '2026-10-12T08:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Sync link in the top bar menu and the More hub', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Home' }] });

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const bar = page.getByRole('navigation', { name: 'Main' });
	await bar.getByRole('button', { name: /^More/ }).click();
	const menu = page.getByRole('menu', { name: 'More' });
	await expect(menu.getByRole('menuitem')).toHaveText([/^\s*Aspects/, /^\s*Health/, /^\s*Home/, /^\s*Projects/, /^\s*Uni/, /^\s*Recurring/, /^\s*Proton sync/]);

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	const lists = page.getByRole('main').getByRole('list', { name: 'Lists' });
	await expect(lists.getByRole('link')).toHaveText([/^\s*Projects/, /^\s*Uni/, /^\s*Recurring/, /^\s*Proton sync/]);
	await expect(page.getByRole('main').getByRole('list', { name: 'Aspects' }).getByRole('link', { name: /^Proton sync/ })).toHaveCount(0);

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await bar.getByRole('button', { name: /^More/ }).click();
	await menu.getByRole('menuitem', { name: /^Proton sync/ }).click();
	await expect(page).toHaveURL(/\/sync$/);
	await expect(page.getByRole('heading', { name: 'Proton sync' })).toBeVisible();
	await bar.getByRole('button', { name: /^More/ }).click();
	await expect(menu.locator('[aria-current="page"]')).toHaveCount(1);
	await expect(menu.getByRole('menuitem', { name: /^Proton sync/ })).toHaveAttribute('aria-current', 'page');
	await expect(bar.locator('[aria-current="page"]')).toHaveCount(1);
});

test('Scenario: Sync link warns on re-login needed or error', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Stretch', day: '2026-10-12' }] });
	const bar = page.getByRole('navigation', { name: 'Main' });
	const menuLink = page.getByRole('menuitem', { name: /^Proton sync/ });
	const hubRow = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('link', { name: /^Proton sync/ }) });
	const visit = async (marked: boolean) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await bar.getByRole('button', { name: /^More/ }).click();
		await expect(menuLink).toBeVisible();
		await expect(menuLink.getByRole('img', { name: 'Needs attention' })).toHaveCount(marked ? 1 : 0);
		await page.keyboard.press('Escape');
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/menu');
		await expect(hubRow).toBeVisible();
		await expect(hubRow.getByRole('img', { name: 'Needs attention' })).toHaveCount(marked ? 1 : 0);
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
