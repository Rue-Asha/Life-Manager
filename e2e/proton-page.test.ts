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

const ASPECTS = [{ name: 'Health', color: 'sage' as const, icon: 'heart' as const }];

test('Scenario: Sync page shows state, last sync and pending count', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Stretch', day: TODAY }, { title: 'Run', day: TODAY }] });
	await protonOn(request);

	await page.goto('/sync');
	await expect(page.getByTestId('sync-state')).toHaveText('Up to date');
	await expect(page.getByTestId('sync-last')).toHaveText('Never');
	await expect(page.getByTestId('sync-pending')).toHaveText('2');

	await protonPass(request);
	await page.reload();
	await expect(page.getByTestId('sync-state')).toHaveText('Up to date');
	await expect(page.getByTestId('sync-last')).not.toHaveText('Never');
	await expect(page.getByTestId('sync-pending')).toHaveText('0');
	await expect(page.getByTestId('sync-note')).toContainText(/renaming or recolouring/i);
});

test('Scenario: Sync page lists failed items with their error', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Stretch', day: TODAY }] });
	await protonOn(request);
	fake().fail({ kind: 'event.create', code: 1, error: 'Error: ambiguous local time' });
	await protonPass(request);

	await page.goto('/sync');
	await expect(page.getByTestId('sync-state')).toHaveText('Up to date');
	const failed = page.getByTestId('sync-failed').getByTestId('sync-failed-item');
	await expect(failed).toHaveCount(1);
	await expect(failed).toContainText('Stretch');
	await expect(failed).toContainText('Error: ambiguous local time');
});

test('Scenario: Re-login needed shows the login command and recovers after Sync now', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Stretch', day: TODAY }] });
	await protonOn(request);
	fake().fail({ kind: '*', code: 2, error: 'Error: not logged in' });
	await protonPass(request);

	await page.goto('/sync');
	await expect(page.getByTestId('sync-state')).toHaveText('Re-login needed');
	await expect(page.getByTestId('sync-login-command')).toHaveText('proton account login --profile default');
	await expect(page.getByTestId('sync-last-error')).toContainText('not logged in');

	fake().clearFailures();
	await page.getByRole('button', { name: 'Sync now' }).click();
	await expect(page.getByTestId('sync-state')).toHaveText('Up to date');
	expect(Object.keys(fake().state().events)).toHaveLength(1);
});

test('Scenario: Resync all re-pushes every item and recreates missing events', async ({ page, request }) => {
	await seed(request, {
		aspects: ASPECTS,
		todos: [{ title: 'Stretch', day: TODAY }, { title: 'Run', day: TODAY }, { title: 'Read', day: TODAY }]
	});
	await protonOn(request);
	await protonPass(request);
	const refs = Object.keys(fake().state().events);
	expect(refs).toHaveLength(3);
	fake().dropEvent(refs[0]);
	const before = fake().calls().length;

	await page.goto('/sync');
	await page.getByRole('button', { name: 'Resync all' }).click();
	await expect
		.poll(async () => {
			const status = await protonStatus(request);
			return status.passes === 2 && status.state === 'idle';
		})
		.toBe(true);
	expect(Object.keys(fake().state().events)).toHaveLength(3);

	const ops = fake().calls().slice(before).map((c) => c.op!.kind);
	expect(ops.filter((k) => k === 'event.update')).toHaveLength(3);
	expect(ops.filter((k) => k === 'event.create')).toHaveLength(1);
	expect(fake().calls().slice(before).find((c) => c.op!.kind === 'event.update' && c.code === 3)).toBeTruthy();
});
