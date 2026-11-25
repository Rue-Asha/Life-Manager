import type { Page } from '@playwright/test';
import { aspectGroup, expect, test, reset, seed, setClock, todoRow as row, todoRows } from './helpers';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';
const TODAY = '2026-10-07';
const ACTIVE = { state: 'active', weekStart: '2026-10-05' } as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Finance', color: 'lagoon', icon: 'wallet' }
] as const;

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const link = (page: Page, name: string) => page.getByRole('link', { name, exact: true });
const WIDTHS = [375, 1280];

test('Scenario: Today renders every phase on the fingerprint', async ({ page, request }) => {
	const phases = [
		{ name: 'none', prompt: 'Plan your week', now: NOW, sprint: undefined },
		{ name: 'planning', prompt: 'Continue planning', now: NOW, sprint: { state: 'planning' } as const },
		{ name: 'running', prompt: null, now: NOW, sprint: ACTIVE },
		{ name: 'review-available', prompt: 'Review it', now: '2026-10-11T10:00:00Z', sprint: ACTIVE },
		{ name: 'review-required', prompt: 'Review the sprint', now: '2026-10-12T10:00:00Z', sprint: ACTIVE }
	];
	for (const width of WIDTHS) {
		await page.setViewportSize({ width, height: 800 });
		for (const phase of phases) {
			await reset(request);
			await setClock(request, phase.now);
			await seed(request, {
				aspects: [...ASPECTS],
				sprint: phase.sprint,
				todos: [{ title: 'Water plants', aspect: 0, dueDate: '2026-10-01' }]
			});
			await page.goto('/');
			await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
			await expect(page.locator('main.screen .screen-head')).toBeVisible();
			await expect(page.getByRole('region', { name: 'Summary' })).toBeVisible();
			const prompts = page.getByRole('region', { name: 'Sprint prompt' });
			if (phase.prompt) await expect(link(page, phase.prompt)).toBeVisible();
			else await expect(prompts).toHaveCount(0);
			expect(await overflow(page), `${phase.name} at ${width}`).toBeLessThanOrEqual(0);
		}
	}
});

test('Scenario: Today empty copy per phase', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE, todos: [{ title: 'Later', inSprint: true, day: '2026-10-09' }] });
	await page.goto('/');
	const empty = page.getByRole('heading', { level: 2, name: 'Nothing planned for today' });
	await expect(empty).toBeVisible();
	await expect(page.getByText('The week view has the rest of your sprint.')).toBeVisible();
	await expect(link(page, 'Week view')).toHaveAttribute('href', '/sprint?view=week');

	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: [...ASPECTS] });
	await page.goto('/');
	const summary = page.getByRole('region', { name: 'Summary' });
	await expect(summary.getByText('0', { exact: true })).toBeVisible();
	await expect(summary.getByText('open today')).toBeVisible();
	await expect(link(page, 'Plan your week')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Nothing planned for today' })).toHaveCount(0);
});

test('Scenario: Many aspects and many overdue todos stay readable', async ({ page, request }) => {
	const aspects = Array.from({ length: 12 }, (_, i) => ({
		name: `Aspect number ${i + 1}`,
		color: (['sage', 'sky', 'lavender', 'ochre', 'berry', 'lagoon', 'tangerine', 'slate'] as const)[i % 8],
		icon: 'heart' as const
	}));
	await seed(request, {
		aspects,
		sprint: ACTIVE,
		todos: [
			...aspects.map((_, i) => ({ title: `Plan ${i + 1}`, aspect: i, inSprint: true, day: TODAY })),
			...Array.from({ length: 30 }, (_, i) => ({ title: `Late ${i + 1}`, aspect: i % 12, dueDate: '2026-10-01' }))
		]
	});
	for (const width of WIDTHS) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 2, name: /^Overdue\s*30$/ })).toBeVisible();
		for (let i = 1; i <= 12; i++) await expect(aspectGroup(page, `Aspect number ${i}`)).toBeVisible();
		await page.getByRole('button', { name: 'Show all 30' }).click();
		await expect(todoRows(page.getByRole('region', { name: /^Overdue\b/ }))).toHaveCount(30);
		expect(await overflow(page), `at ${width}`).toBeLessThanOrEqual(0);
	}
});

test('Scenario: Long titles stay inside their rows on Today', async ({ page, request }) => {
	const long = 'A very long title that keeps going and going '.repeat(5).slice(0, 200).trim();
	const word = 'x'.repeat(60);
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: long, inSprint: true, day: TODAY },
			{ title: word, inSprint: true, day: TODAY }
		]
	});
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('/');
	for (const title of [long, word]) {
		const item = row(page, title);
		await expect(item).toBeVisible();
		const fits = await item.evaluate((el) => el.scrollWidth <= el.clientWidth);
		expect(fits).toBe(true);
		expect(await item.getAttribute('aria-label')).toBe(title);
	}
	expect(await overflow(page)).toBeLessThanOrEqual(0);
});

test('Scenario: Review required blocks with the review prompt', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE, todos: [{ title: 'Weekly reset', inSprint: true, day: '2026-10-11' }] });
	await setClock(request, '2026-10-12T10:00:00Z');
	await page.goto('/');
	const prompt = page.getByRole('region', { name: 'Sprint prompt' });
	await expect(prompt).toBeVisible();
	await expect(link(page, 'Review the sprint')).toHaveAttribute('href', '/sprint/review');
	const summary = page.getByRole('region', { name: 'Summary' });
	const above = await prompt.evaluate((el, other) => !!(el.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING), await summary.elementHandle());
	expect(above).toBe(true);
});
