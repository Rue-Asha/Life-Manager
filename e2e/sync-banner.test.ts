import { expect, test, reset, seed, setClock, fake, protonOn, protonPass } from './helpers';
import type { APIRequestContext, Page } from '@playwright/test';

const NOW = '2026-10-07T10:00:00Z';
// A planned todo gives a pass something to push, so the fake CLI is called and its failure counts.
const SEED = { aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }], todos: [{ title: 'Stretch', day: '2026-10-07' }] } as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: [...SEED.aspects], todos: [...SEED.todos] });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const banner = (page: Page) => page.getByRole('region', { name: 'Sync needs attention' });

async function error(request: APIRequestContext) {
	const response = await request.post('/__test/proton', {
		data: { enable: { cli: '/nonexistent/proton', gapMs: 0, debounceMs: 3_600_000, tickMs: 3_600_000 } }
	});
	if (!response.ok()) throw new Error('proton enable failed');
	await protonPass(request);
}

test('Scenario: Banner shows on attention states', async ({ page, request }) => {
	await protonOn(request);
	fake().fail({ kind: '*', code: 2, error: 'Error: not logged in' });
	await protonPass(request);
	await page.goto('/');
	await expect(banner(page)).toContainText('Proton sync needs you to log in again. Open sync to do it.');
	await expect(banner(page).getByRole('link', { name: 'Open sync' })).toHaveAttribute('href', '/sync');
	await expect(banner(page).getByRole('button')).toHaveCount(0);

	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: [...SEED.aspects], todos: [...SEED.todos] });
	await error(request);
	await page.goto('/');
	await expect(banner(page)).toContainText('Proton sync stopped with an error. Open sync to see what failed.');
	await expect(banner(page).getByRole('link', { name: 'Open sync' })).toHaveAttribute('href', '/sync');
	await expect(banner(page).getByRole('button')).toHaveCount(0);
});

test('Scenario: No banner when sync is fine or off', async ({ page, request }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await expect(banner(page)).toHaveCount(0);

	await protonOn(request);
	await protonPass(request);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await expect(banner(page)).toHaveCount(0);

	// Syncing and Off (the integration never started).
	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: [...SEED.aspects], todos: [...SEED.todos] });
	await protonOn(request, { gapMs: 0 });
	await page.goto('/');
	await expect(banner(page)).toHaveCount(0);
});
