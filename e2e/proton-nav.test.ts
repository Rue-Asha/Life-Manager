import { expect, test, fake, protonOn, protonPass, reset, seed, setClock } from './helpers';

const NOW = '2026-10-12T08:00:00Z';
const LISTS = ['Today', 'Sprint', 'Calendar', 'Backlog', 'Recurring', 'Projects', 'Uni', 'Aspects'];

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Sync link in the sidebar and the home list', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Home' }] });

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const sidebar = page.getByRole('navigation', { name: 'Main' });
	const names = await sidebar
		.locator('a.item')
		.evaluateAll((els) => els.map((el) => el.textContent!.replace(/\d+$/, '').trim()));
	expect(names).toEqual([...LISTS, 'Health', 'Home', 'Proton sync']);
	const link = sidebar.getByTestId('sync-link');
	const lastAspect = sidebar.getByRole('link', { name: 'Home', exact: true });
	const after = await lastAspect.evaluate(
		(a, b) => !!(a.compareDocumentPosition(b!) & Node.DOCUMENT_POSITION_FOLLOWING),
		await link.elementHandle()
	);
	expect(after).toBe(true);

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	const lists = page.getByRole('navigation', { name: 'Lists' });
	await expect(lists.getByRole('link')).toHaveCount(8);
	await expect(lists.getByTestId('sync-link')).toHaveCount(0);
	const home = page.getByRole('main').getByTestId('sync-link');
	await expect(home).toHaveText('Proton sync');
	const [listsBox, homeBox] = [await lists.boundingBox(), await home.boundingBox()];
	expect(homeBox!.y).toBeGreaterThanOrEqual(listsBox!.y + listsBox!.height);

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await sidebar.getByTestId('sync-link').click();
	await expect(page).toHaveURL(/\/sync$/);
	await expect(page.getByRole('heading', { name: 'Proton sync' })).toBeVisible();
	await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
	await expect(sidebar.getByTestId('sync-link')).toHaveAttribute('aria-current', 'page');
});

test('Scenario: Sync link warns on re-login needed or error', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Stretch', day: '2026-10-12' }] });
	const sidebarLink = page.getByRole('navigation', { name: 'Main' }).getByTestId('sync-link');
	const homeLink = page.getByRole('main').getByTestId('sync-link');
	const visit = async (marked: boolean) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await expect(sidebarLink).toBeVisible();
		await expect(sidebarLink.getByTestId('sync-marker')).toHaveCount(marked ? 1 : 0);
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/menu');
		await expect(homeLink).toBeVisible();
		await expect(homeLink.getByTestId('sync-marker')).toHaveCount(marked ? 1 : 0);
		if (marked) await expect(homeLink.getByLabel('Needs attention')).toHaveCount(1);
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
