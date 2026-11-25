import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRow as row, todoRows } from './helpers';
import { statusOf } from './row-locators';
import { sprintList } from './sprint-locators';

// Wednesday 7 October 2026 in Berlin; the target week runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';

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

const planSprint = (page: Page) => page.getByRole('region', { name: /^This sprint\b/ });
const planBacklog = (page: Page) => page.getByRole('region', { name: /^Backlog\b/ });
const noSideScroll = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe('desktop', () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test('Scenario: Draft and backlog sit side by side on desktop', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [{ title: 'Book a physio appointment' }, { title: 'Read chapter 4', aspect: 1 }]
		});
		await page.goto('/sprint/plan');
		await expect(planBacklog(page)).toBeVisible();

		const [draft, backlog] = [await planSprint(page).boundingBox(), await planBacklog(page).boundingBox()];
		expect(Math.abs(draft!.y - backlog!.y)).toBeLessThanOrEqual(4);
		expect(backlog!.x).toBeGreaterThan(draft!.x + draft!.width - 1);
		expect(await noSideScroll(page)).toBe(true);
	});

	test('Scenario: Empty draft hint differs for pointer and touch (pointer)', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Clean the fridge' }] });
		await page.goto('/sprint/plan');
		await expect(planSprint(page).getByText('Drag todos here from the backlog.')).toBeVisible();
		await expect(page.getByText('Add todos from the backlog below.')).toHaveCount(0);
	});

	test('Scenario: Due this week suggestions can be unmarked', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [
				{ title: 'Tax return', dueDate: '2026-10-09' },
				{ title: 'Submit lab report', aspect: 1, dueDate: '2026-10-08' }
			]
		});
		await page.goto('/sprint/plan');

		const due = page.getByRole('region', { name: /^Due this week\b/ });
		await expect(due).toContainText('2 of 2');
		await due.getByRole('checkbox', { name: 'Include: Tax return' }).uncheck();
		await expect(due).toContainText('1 of 2');

		await page.getByRole('button', { name: 'Start sprint with 1 todo' }).click();
		await expect(page).toHaveURL(/\/sprint$/);
		await expect(statusOf(row(page, 'Submit lab report'), 'To do')).toBeVisible();
		await expect(todoRows(sprintList(page))).toHaveCount(1);
		await page.goto('/backlog');
		await expect(row(page, 'Tax return')).toBeVisible();
	});

	for (const [error, text] of [
		['sprint-active', 'A sprint is already running.'],
		['review-pending', 'The last sprint needs a review first.']
	] as const) {
		test(`Scenario: Start errors show next to the start action (${error})`, async ({ page, request, baseURL }) => {
			await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Clean the fridge' }] });
			await page.goto('/sprint/plan');
			await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plan your week');

			// The sprint starts elsewhere (and ends, for review-pending) while this page stays open.
			const started = await request.post('/sprint/plan?/start', {
				headers: { origin: baseURL!, 'x-sveltekit-action': 'true' },
				form: {}
			});
			expect(started.ok()).toBe(true);
			if (error === 'review-pending') await setClock(request, '2026-10-12T10:00:00Z');

			const start = page.getByRole('button', { name: /^Start sprint/ });
			await start.click();
			const alert = page.getByRole('alert').filter({ hasText: text });
			await expect(alert).toBeVisible();
			await expect(start).toHaveAccessibleDescription(new RegExp(text.replace('.', '\\.')));
			const [a, b] = [await alert.boundingBox(), await start.boundingBox()];
			expect(Math.abs(a!.y - b!.y)).toBeLessThan(120);
			if (error === 'review-pending') await expect(alert.getByRole('link', { name: 'Review the sprint' })).toBeVisible();
		});
	}

	test('Scenario: Empty backlog and many items in the plan (empty backlog)', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], todos: [] });
		await page.goto('/sprint/plan');
		const backlog = planBacklog(page);
		await expect(backlog.getByRole('heading', { name: 'The backlog is empty' })).toBeVisible();
		await expect(backlog.getByRole('link', { name: 'Open backlog' })).toHaveAttribute('href', '/backlog');
	});
});

test.describe('touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: Phone plans with Add to sprint buttons', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Gym bag' }, { title: 'Clean the fridge' }] });
		await page.goto('/sprint/plan');

		await page.getByRole('button', { name: 'Add to sprint: Gym bag' }).tap();
		await expect(todoRows(planSprint(page))).toHaveText([/Gym bag/]);
		await page.getByRole('button', { name: 'Start sprint with 1 todo' }).tap();
		await expect(page).toHaveURL(/\/sprint$/);
		await expect(row(page, 'Gym bag')).toBeVisible();
	});

	test('Scenario: Empty draft hint differs for pointer and touch (touch)', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Clean the fridge' }] });
		await page.goto('/sprint/plan');
		await expect(planSprint(page).getByText('Add todos from the backlog below.')).toBeVisible();
		await expect(page.getByText('Drag todos here from the backlog.')).toHaveCount(0);
	});

	test('Scenario: Empty backlog and many items in the plan (80 todos)', async ({ page, request }) => {
		const aspects = ['sage', 'sky', 'lavender', 'ochre', 'berry', 'lagoon', 'tangerine', 'slate'].map((color, i) => ({
			name: `Aspect ${i + 1} with a rather long name`,
			color: color as 'sage',
			icon: 'heart' as const
		}));
		await seed(request, {
			aspects,
			todos: Array.from({ length: 80 }, (_, i) => ({
				title: `Todo ${i + 1} ${'with a very long title that keeps going '.repeat(2)}`,
				aspect: i % 8
			}))
		});
		for (const width of [375, 1280]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/sprint/plan');
			await expect(planBacklog(page)).toContainText('80');
			for (let i = 1; i <= 8; i++) {
				await expect(planBacklog(page).getByRole('region', { name: `In backlog: Aspect ${i} with a rather long name` })).toBeVisible();
			}
			expect(await noSideScroll(page)).toBe(true);
		}
	});
});
