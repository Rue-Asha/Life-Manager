import { expect, test, reset, seed, setClock } from './helpers';

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

test('Scenario: No todo row draws its own border', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Morning run', inSprint: true, day: '2026-10-07' },
			{ title: 'Stretch', inSprint: true, day: '2026-10-07' },
			{ title: 'Book a physio appointment' },
			{ title: 'Buy running shoes' }
		]
	});
	await page.setViewportSize({ width: 1280, height: 900 });

	for (const path of ['/', '/sprint?view=aspect', '/backlog', `/aspects/${aspects[0]}`]) {
		await page.goto(path);
		const rows = page.getByRole('main').getByTestId('todo-row');
		await expect(rows.first()).toBeVisible();
		expect(await rows.count(), path).toBeGreaterThanOrEqual(2);
		const checks = await rows.evaluateAll((els) =>
			els.map((el) => {
				const style = getComputedStyle(el);
				const group = el.closest('[data-testid="list-group"]');
				const probe = document.createElement('div');
				probe.style.background = 'var(--surface)';
				document.body.append(probe);
				const surface = getComputedStyle(probe).backgroundColor;
				probe.remove();
				return {
					borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
					grouped: group !== null,
					onSurface: group !== null && getComputedStyle(group).backgroundColor === surface
				};
			})
		);
		for (const check of checks) {
			expect(check.borders, path).toEqual(['0px', '0px', '0px', '0px']);
			expect(check.grouped, path).toBe(true);
			expect(check.onSurface, path).toBe(true);
		}
	}
});
