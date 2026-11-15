import type { Page } from '@playwright/test';
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

const syncRow = (page: Page, label: string) => page.getByRole('group', { name: label, exact: true });
const failedItems = (page: Page) => page.getByRole('region', { name: 'Failed items' }).getByRole('group', { name: /\S/ });

test('Scenario: Sync off page names PROTON_CLI and shows no buttons', async ({ page, request, baseURL }) => {
	const { todos } = await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Stretch' }] });
	const response = await request.post('/todos?/setDay', {
		form: { id: String(todos[0]), day: TODAY },
		headers: { origin: baseURL!, 'x-sveltekit-action': 'true' }
	});
	expect((await response.json()).type).toBe('success');

	await page.goto('/sync');
	await expect(page.getByRole('heading', { name: 'Proton sync' })).toBeVisible();
	await expect(page.getByText('Sync is off.')).toContainText('PROTON_CLI');
	await expect(page.getByRole('button', { name: 'Sync now' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Resync all' })).toHaveCount(0);
	expect(fake().calls()).toEqual([]);
});

const ASPECTS = [{ name: 'Health', color: 'sage' as const, icon: 'heart' as const }];

test('Scenario: Sync page shows state, last sync and pending count', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Stretch', day: TODAY }, { title: 'Run', day: TODAY }] });
	await protonOn(request);

	await page.goto('/sync');
	await expect(syncRow(page, 'State')).toHaveText(/^State\s*Up to date$/);
	await expect(syncRow(page, 'Last sync')).toHaveText(/^Last sync\s*Never$/);
	await expect(syncRow(page, 'Pending changes')).toHaveText(/^Pending changes\s*2$/);

	await protonPass(request);
	await page.reload();
	await expect(syncRow(page, 'State')).toHaveText(/^State\s*Up to date$/);
	await expect(syncRow(page, 'Last sync')).not.toHaveText(/^Last sync\s*Never$/);
	await expect(syncRow(page, 'Pending changes')).toHaveText(/^Pending changes\s*0$/);
	await expect(page.getByText(/renaming or recolouring/i)).toBeVisible();
});

test('Scenario: Sync page lists failed items with their error', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Stretch', day: TODAY }] });
	await protonOn(request);
	fake().fail({ kind: 'event.create', code: 1, error: 'Error: ambiguous local time' });
	await protonPass(request);

	await page.goto('/sync');
	await expect(syncRow(page, 'State')).toHaveText(/^State\s*Up to date$/);
	const failed = failedItems(page);
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
	await expect(syncRow(page, 'State')).toHaveText(/^State\s*Re-login needed$/);
	await expect(page.getByText('proton account login --profile default', { exact: true })).toBeVisible();
	await expect(page.getByText('Error: not logged in', { exact: true })).toBeVisible();

	fake().clearFailures();
	await page.getByRole('button', { name: 'Sync now' }).click();
	await expect(syncRow(page, 'State')).toHaveText(/^State\s*Up to date$/);
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

	const calls = fake().calls().slice(before);
	const updates = calls.filter((c) => c.op!.kind === 'event.update');
	expect(updates.map((c) => (c.op as { ref: string }).ref).sort()).toEqual([...refs].sort());
	const gone = updates.findIndex((c) => c.code === 3);
	expect((updates[gone].op as { ref: string }).ref).toBe(refs[0]);
	expect(updates.filter((c) => c.code === 3)).toHaveLength(1);
	const afterGone = calls[calls.indexOf(updates[gone]) + 1];
	expect(afterGone.op!.kind).toBe('event.create');
	expect(calls.filter((c) => c.op!.kind === 'event.create')).toHaveLength(1);
});

test('Scenario: Sync page fits a phone', async ({ page, request }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	const fits = async (name: string) => {
		await expect(page.getByRole('heading', { name: 'Proton sync' })).toBeVisible();
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);
		await page.screenshot({ path: `test-results/shots/sync-${name}-375.png`, fullPage: true });
	};

	await seed(request, {
		aspects: ASPECTS,
		todos: [{ title: 'Draft the cover letter for the summer internship application and send it to everyone', day: TODAY }]
	});
	await page.goto('/sync');
	await expect(page.getByText('Sync is off.')).toBeVisible();
	await fits('off');

	await protonOn(request, { profile: 'a-rather-long-profile-name-for-the-server-login' });
	fake().fail({ kind: '*', code: 2, error: 'Error: session expired, run the login command again to get a new token' });
	await protonPass(request);
	await page.goto('/sync');
	await expect(page.getByText(/^proton account login --profile /)).toBeVisible();
	await fits('relogin');

	fake().clearFailures();
	fake().fail({ kind: 'event.create', code: 1, error: 'Error: ambiguous local time between two offsets in Europe/Berlin' });
	await protonPass(request);
	await page.goto('/sync');
	await expect(failedItems(page)).toBeVisible();
	await fits('failed');
});
