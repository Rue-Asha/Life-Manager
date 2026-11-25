import { expect, test, reset, seed, setClock } from './helpers';

// Thursday 15 October 2026 in Berlin; the active sprint runs Monday 12 to Sunday 18 October.
const NOW = '2026-10-15T10:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Sprint header shows progress and days left', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }],
		sprint: { state: 'active', weekStart: '2026-10-12' },
		todos: Array.from({ length: 12 }, (_, i) => ({
			title: `Todo ${i + 1}`,
			inSprint: true,
			status: i < 4 ? ('done' as const) : ('todo' as const)
		}))
	});

	// The header is the screen's title (the figure, accented) and its lede, in every view.
	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		const title = page.getByRole('heading', { level: 1 });
		await expect(title).toContainText('4 / 12 done');
		await expect(page.getByText('Mon 12 – Sun 18 Oct')).toBeVisible();
		await expect(page.getByText('3 days left')).toBeVisible();
	}
});
