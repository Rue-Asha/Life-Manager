import { expect, test, fake, protonOn, protonPass, protonStatus, reset, seed, setClock } from './helpers';

const NOW = '2026-10-12T08:00:00Z';
const TODAY = '2026-10-12';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Sync off page names PROTON_CLI and shows no buttons', async ({ page, request, baseURL }) => {
	const { todos } = await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Stretch' }] });
	const response = await request.post('/todos?/setDay', {
		form: { id: String(todos[0]), day: TODAY },
		headers: { origin: baseURL!, 'x-sveltekit-action': 'true' }
	});
	expect((await response.json()).type).toBe('success');

	await page.goto('/sync');
	await expect(page.getByRole('heading', { name: 'Proton sync' })).toBeVisible();
	await expect(page.getByTestId('sync-off')).toContainText('PROTON_CLI');
	await expect(page.getByRole('button', { name: 'Sync now' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Resync all' })).toHaveCount(0);
	expect(fake().calls()).toEqual([]);
});
