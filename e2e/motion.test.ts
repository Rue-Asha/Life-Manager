import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026 in Berlin, mid-sprint.
const WEDNESDAY = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, WEDNESDAY);
	await seed(request, {
		aspects: [{ name: 'Health' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Morning run', inSprint: true }]
	});
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

async function spyOnViewTransitions(page: Page) {
	await page.addInitScript(() => {
		const w = window as unknown as { __transitions: number };
		w.__transitions = 0;
		const original = document.startViewTransition?.bind(document);
		if (!original) return;
		document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
			w.__transitions++;
			return original(arg);
		}) as typeof document.startViewTransition;
	});
}

const transitions = (page: Page) =>
	page.evaluate(() => (window as unknown as { __transitions: number }).__transitions);

async function navigateAndSwitchView(page: Page) {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sprint', exact: true }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Sprint' })).toBeVisible();
	const afterLink = await transitions(page);
	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await expect(page.getByTestId('board-column-doing')).toBeVisible();
	return { afterLink, afterSwitch: await transitions(page) };
}

test('Scenario: Route changes and view switches use a view transition', async ({ page }) => {
	await spyOnViewTransitions(page);
	const { afterLink, afterSwitch } = await navigateAndSwitchView(page);
	expect(afterLink).toBe(1);
	expect(afterSwitch).toBe(2);
});

test('Scenario: Navigation without View Transitions is instant', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));
	await page.addInitScript(() => {
		delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition;
	});

	await page.goto('/');
	expect(await page.evaluate(() => 'startViewTransition' in document)).toBe(false);
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Backlog', exact: true }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	expect(errors).toEqual([]);
});

test('Scenario: Reduced motion navigates without a transition', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await spyOnViewTransitions(page);
	const { afterLink, afterSwitch } = await navigateAndSwitchView(page);
	expect(afterLink).toBe(0);
	expect(afterSwitch).toBe(0);
});

test('Scenario: Opening a project uses only the route cross-fade', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'IT' }],
		itAspect: 0,
		projects: [{ name: 'Life Manager', status: 'active' }, { name: 'Old thing', status: 'implemented' }]
	});
	await spyOnViewTransitions(page);
	await page.goto('/projects');
	await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
	await page.waitForFunction(() => document.getAnimations().length === 0);

	await page.getByTestId('project-card').filter({ hasText: 'Life Manager' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Life Manager' })).toBeVisible();
	expect(await transitions(page)).toBe(1);
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
	expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);

	await page.goto('/projects');
	await page.getByTestId('project-group-implemented').getByRole('button', { name: 'Implemented (1)' }).click();
	await expect(page.getByTestId('project-card').filter({ hasText: 'Old thing' })).toBeVisible();
	expect(await transitions(page)).toBe(0);
	expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('Scenario: Opening a class uses only the route cross-fade', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'Studies' }],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }, { name: 'SS 26', archivedAt: '2026-09-30T10:00:00Z' }],
		classes: [
			{ semester: 0, name: 'Analysis II' },
			{ semester: 1, name: 'Analysis I' }
		]
	});
	await spyOnViewTransitions(page);
	await page.goto('/uni');
	await expect(page.getByRole('heading', { level: 1, name: 'Uni' })).toBeVisible();
	await page.waitForFunction(() => document.getAnimations().length === 0);

	await page.getByTestId('class-card').filter({ hasText: 'Analysis II' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Analysis II' })).toBeVisible();
	expect(await transitions(page)).toBe(1);
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
	expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);

	await page.goto('/uni');
	await expect(page.getByRole('heading', { level: 1, name: 'Uni' })).toBeVisible();
	await page.getByTestId('semester-archived-group').getByRole('button', { name: 'Archived (1)' }).click();
	await expect(page.getByTestId('class-card').filter({ hasText: 'Analysis I' }).first()).toBeVisible();
	expect(await transitions(page)).toBe(0);
	expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
