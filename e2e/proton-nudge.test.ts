import { expect, test, reset, seed, setClock, protonOn, protonStatus } from './helpers';

// Wednesday 7 October 2026, midday in Berlin.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: A form post nudges a pass', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }],
		todos: [{ title: 'Book a physio appointment', aspect: 0 }]
	});
	await protonOn(request, { debounceMs: 300 });
	// configureWorker schedules one catch-up pass after the debounce.
	await expect.poll(async () => (await protonStatus(request)).passes).toBe(1);

	await page.goto('/backlog');
	await page.goto('/calendar');
	await page.waitForTimeout(1000);
	expect((await protonStatus(request)).passes).toBe(1);

	await page.goto('/backlog');
	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill('Stretch');
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Stretch' })).toBeVisible();
	await expect.poll(async () => (await protonStatus(request)).passes).toBe(2);
});
