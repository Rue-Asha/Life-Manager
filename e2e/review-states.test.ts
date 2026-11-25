import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRows } from './helpers';

// Sunday 11 October 2026 in Berlin, the last day of the sprint that started Monday 5 October.
const NOW = '2026-10-11T16:00:00Z';
const SPRINT = { state: 'active', weekStart: '2026-10-05' } as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' }
] as const;

const noSideScroll = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe('desktop', () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test('Scenario: Close label follows the decisions', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: SPRINT,
			todos: [
				{ title: 'Finish exercise sheet 3', aspect: 1, inSprint: true, status: 'doing' },
				{ title: 'Read chapter 4', aspect: 1, inSprint: true },
				{ title: 'Clean the fridge', inSprint: true }
			]
		});
		await page.goto('/sprint/review');
		await expect(page.getByRole('button', { name: 'Carry 3 and close' })).toBeVisible();

		await page.getByRole('radiogroup', { name: 'Clean the fridge' }).getByRole('radio', { name: 'Back to backlog' }).check();
		const close = page.getByRole('button', { name: 'Carry 2, return 1 and close' });
		await expect(close).toBeVisible();
		await close.click();

		await expect(page).toHaveURL(/\/sprint\/plan$/);
		await expect(todoRows(page.getByRole('region', { name: /^This sprint\b/ }))).toHaveCount(2);
		await expect(todoRows(page.getByRole('region', { name: /^Backlog\b/ }))).toHaveText([/Clean the fridge/]);
	});

	test('Scenario: Recurring instances offer only carry and drop', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: SPRINT,
			rules: [{ title: 'Gym', weekdays: [1, 5] }],
			todos: [{ title: 'Gym', inSprint: true, rule: 0, day: '2026-10-09' }]
		});
		await page.goto('/sprint/review');

		const gym = page.getByRole('radiogroup', { name: 'Gym' });
		await expect(gym.getByRole('radio')).toHaveCount(2);
		await expect(gym.getByRole('radio', { name: 'Carry over' })).toBeChecked();
		await expect(gym.getByRole('radio', { name: 'Drop' })).toBeAttached();
		await expect(gym.getByRole('radio', { name: 'Back to backlog' })).toHaveCount(0);
	});

	test('Scenario: All done closes in one tap', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: SPRINT,
			todos: [1, 2, 3, 4].map((n) => ({ title: `Done todo ${n}`, inSprint: true, status: 'done' as const }))
		});
		await page.goto('/sprint/review');

		await expect(page.getByText('All 4 done. Nothing to carry over.', { exact: true })).toBeVisible();
		await expect(page.getByRole('radio')).toHaveCount(0);
		await page.getByRole('button', { name: 'Close sprint' }).click();
		await expect(page).toHaveURL(/\/sprint\/plan$/);
	});

	test('Scenario: Nothing was planned', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], sprint: SPRINT });
		await page.goto('/sprint/review');

		await expect(page.getByText('Nothing was planned this week.', { exact: true })).toBeVisible();
		await expect(page.getByRole('radio')).toHaveCount(0);
		await page.getByRole('button', { name: 'Close sprint' }).click();
		await expect(page).toHaveURL(/\/sprint\/plan$/);
	});

	test('Scenario: A refused close shows its alert next to the close action', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], sprint: SPRINT, todos: [{ title: 'Clean the fridge', inSprint: true }] });
		await page.goto('/sprint/review');
		await expect(page.getByRole('button', { name: 'Carry 1 and close' })).toBeVisible();

		// Closing before the sprint's Sunday is refused.
		await setClock(request, '2026-10-08T10:00:00Z');
		await page.getByRole('button', { name: 'Carry 1 and close' }).click();
		const alert = page.getByRole('alert').filter({ hasText: 'Couldn’t close the sprint — try again.' });
		await expect(alert).toBeVisible();
		await expect(page.getByRole('button', { name: 'Carry 1 and close' })).toHaveAccessibleDescription(/Couldn’t close the sprint/);
	});
});

test.describe('touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: Many open todos stay usable in the review', async ({ page, request }) => {
		const aspects = ['sage', 'sky', 'lavender', 'ochre', 'berry', 'lagoon', 'tangerine', 'slate'].map((color, i) => ({
			name: `Aspect ${i + 1} with a rather long name`,
			color: color as 'sage',
			icon: 'heart' as const
		}));
		await seed(request, {
			aspects,
			sprint: SPRINT,
			todos: Array.from({ length: 40 }, (_, i) => ({
				title: `Open todo ${i + 1} ${'with a very long title that keeps going '.repeat(2)}`,
				aspect: i % 8,
				inSprint: true
			}))
		});
		await page.goto('/sprint/review');

		const groups = page.getByRole('radiogroup');
		await expect(groups).toHaveCount(40);
		for (const i of [0, 17, 39]) {
			await groups.nth(i).scrollIntoViewIfNeeded();
			const radios = groups.nth(i).getByRole('radio');
			await expect(radios).toHaveCount(2);
			for (let r = 0; r < 2; r++) expect((await radios.nth(r).boundingBox())!.height).toBeGreaterThanOrEqual(44);
		}
		expect(await noSideScroll(page)).toBe(true);
	});

	test('Scenario: Phone close bar sticks above the pill bar', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: SPRINT,
			todos: [
				{ title: 'Finish exercise sheet 3', aspect: 1, inSprint: true, status: 'doing' },
				{ title: 'Read chapter 4', aspect: 1, inSprint: true },
				{ title: 'Clean the fridge', inSprint: true },
				{ title: 'Book a physio appointment', inSprint: true, status: 'done' }
			]
		});
		await page.goto('/sprint/review');
		await page.evaluate(() => window.scrollTo(0, 0));

		const bar = page.getByRole('region', { name: 'Close' });
		await expect(bar.getByText('3 open · 1 done', { exact: true })).toBeVisible();
		const button = bar.getByRole('button', { name: 'Close sprint', exact: true });
		await expect(button).toBeVisible();
		await expect(bar.getByText(/Nothing changes until you close/)).toBeHidden();

		// the bar rises into place (260 ms); measure once it has settled
		await expect(async () => {
			const [b, dock] = [await bar.boundingBox(), await page.locator('nav.dock').boundingBox()];
			expect(b!.y + b!.height).toBeLessThanOrEqual(dock!.y);
		}).toPass({ timeout: 3000 });

		const summary = page.locator('#hr-summary');
		await expect(summary).toContainText('Carry 3 and close');
		await expect(summary).toContainText('Nothing changes until you close');
		await summary.scrollIntoViewIfNeeded();
		await expect(summary).toBeVisible();
	});
});
