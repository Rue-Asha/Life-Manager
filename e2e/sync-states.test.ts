import type { Page } from '@playwright/test';
import { expect, test, fake, protonOn, protonPass, reset, seed, setClock } from './helpers';

const NOW = '2026-10-12T08:00:00Z';
const TODAY = '2026-10-12';
const ASPECTS = [{ name: 'Health', color: 'sage' as const, icon: 'heart' as const }];

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const state = (page: Page) => page.getByRole('group', { name: 'State' });
const todos = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `Stretch ${i + 1}`, day: TODAY }));

test('Scenario: Sync page renders every state', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: todos(3) });

	await page.goto('/sync');
	await expect(page.getByText('Sync is off.')).toContainText('PROTON_CLI');
	await expect(page.getByRole('button', { name: 'Sync now' })).toHaveCount(0);
	await expect(state(page)).toHaveCount(0);

	await protonOn(request, { gapMs: 1500 });
	await page.reload();
	await expect(state(page)).toContainText('Up to date');
	await expect(page.getByRole('button', { name: 'Sync now' })).toBeEnabled();
	await expect(page.getByRole('button', { name: 'Resync all' })).toBeEnabled();

	await page.getByRole('button', { name: 'Sync now' }).click();
	await expect(state(page)).toContainText('Syncing…');
	await expect(page.getByRole('button', { name: 'Sync now' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Resync all' })).toBeDisabled();
	await expect(state(page)).toContainText('Up to date', { timeout: 20_000 });
	await expect(page.getByRole('button', { name: 'Sync now' })).toBeEnabled();

	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: ASPECTS, todos: todos(3) });
	await protonOn(request);
	fake().fail({ kind: '*', code: 2, error: 'Error: not logged in' });
	await protonPass(request);
	await page.reload();
	await expect(state(page)).toContainText('Re-login needed');
	await expect(state(page)).toContainText('Needs attention');
	await expect(page.getByText('proton account login --profile default', { exact: true })).toBeVisible();

	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: ASPECTS, todos: todos(3) });
	await protonOn(request);
	fake().fail({ kind: '*', code: 5, error: 'Error: the calendar server is not reachable' });
	await protonPass(request);
	await page.reload();
	await expect(state(page)).toContainText('Error');
	await expect(page.getByRole('alert')).toContainText('Error: the calendar server is not reachable');
});

test('Scenario: Re-login command can be copied', async ({ page, request, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await seed(request, { aspects: ASPECTS, todos: todos(1) });
	await protonOn(request);
	fake().fail({ kind: '*', code: 2, error: 'Error: not logged in' });
	await protonPass(request);

	await page.goto('/sync');
	const copy = page.getByRole('button', { name: 'Copy command' });
	await expect(copy).toContainText('Copy');
	await copy.click();
	await expect(copy).toContainText('Copied');
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('proton account login --profile default');
});

test('Scenario: Never synced and no failed items', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: todos(2) });
	await protonOn(request);

	await page.goto('/sync');
	await expect(page.getByRole('group', { name: 'Last sync' })).toContainText('Never');
	await expect(page.getByRole('region', { name: 'Failed items' })).toHaveCount(0);
});

test('Scenario: Many failed items wrap', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: todos(20) });
	await protonOn(request);
	fake().fail({ kind: 'event.create', code: 1, error: `Error: ${'the calendar server answered with an unexpected response while the item was written, '.repeat(4)}`.slice(0, 300) });
	await protonPass(request);
	await page.setViewportSize({ width: 375, height: 812 });

	await page.goto('/sync');
	const failed = page.getByRole('region', { name: 'Failed items' }).getByRole('group', { name: /\S/ });
	await expect(failed).toHaveCount(20);
	await expect(state(page)).toContainText('20 items failed');
	await failed.last().scrollIntoViewIfNeeded();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	const first = failed.first();
	await expect(first).toContainText('Error: the calendar server');
	expect(await first.evaluate((el) => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
});
