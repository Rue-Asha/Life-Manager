import type { Page } from '@playwright/test';
import { expect, projectCard, test, reset, seed, setClock } from './helpers';
import { boardColumn } from './sprint-locators';
import { archivedGroup, classCards } from './uni-locators';

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
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Sprint/ }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Sprint' })).toBeVisible();
	const afterLink = await transitions(page);
	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await expect(boardColumn(page, 'doing')).toBeVisible();
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
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Backlog/ }).click();
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

test('Scenario: Navigation keeps the bars still', async ({ page }) => {
	await page.addInitScript(() => {
		const w = window as unknown as { __pseudos: string[] };
		w.__pseudos = [];
		const original = document.startViewTransition.bind(document);
		document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
			const transition = original(arg);
			transition.ready.then(() => {
				w.__pseudos = document.getAnimations().map((a) => (a.effect as KeyframeEffect).pseudoElement ?? '');
			});
			return transition;
		}) as typeof document.startViewTransition;
	});
	for (const [size, bar, link] of [
		[{ width: 1280, height: 800 }, '.app-bar', 'Main'],
		[{ width: 375, height: 812 }, '.dock', 'Main']
	] as const) {
		await page.setViewportSize(size);
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
		const name = await page.locator(bar).evaluate((el) => getComputedStyle(el).viewTransitionName);
		expect(name, `${bar} at ${size.width}`).not.toBe('none');
		await page.getByRole('navigation', { name: link }).getByRole('link', { name: /^Sprint/ }).click();
		await expect(page.getByRole('heading', { level: 1, name: 'Sprint' })).toBeVisible();
		await page.waitForFunction(() => (window as unknown as { __pseudos: string[] }).__pseudos.length > 0);
		const pseudos = await page.evaluate(() => (window as unknown as { __pseudos: string[] }).__pseudos);
		expect(pseudos.some((p) => p.includes('(root)'))).toBe(true);
		expect(pseudos.filter((p) => p.includes(`(${name})`))).toEqual([]);
	}
});

test('Scenario: Opening a project cross-fades and groups expand softly', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'IT' }],
		itAspect: 0,
		projects: [{ name: 'Life Manager', status: 'active' }, { name: 'Old thing', status: 'implemented' }]
	});
	await spyOnViewTransitions(page);
	await page.goto('/projects');
	await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
	await page.waitForFunction(() => document.getAnimations().length === 0);

	await projectCard(page, 'Life Manager').getByRole('link').click();
	await expect(page.getByRole('heading', { level: 1, name: 'Life Manager' })).toBeVisible();
	expect(await transitions(page)).toBe(1);
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
	await page.waitForFunction(() => document.getAnimations().length === 0);

	// The expand is a CSS transition on the group's own panel: the row track grows, the content fades in.
	const toggle = page.getByRole('button', { name: 'Implemented (1)' });
	const panelStyle = () =>
		page.getByRole('region', { name: 'Implemented' }).locator('.disc-panel').evaluate((el) => {
			const style = getComputedStyle(el);
			return { property: style.transitionProperty, duration: style.transitionDuration };
		});
	await page.goto('/projects');
	await toggle.click();
	await expect(projectCard(page, 'Old thing')).toBeVisible();
	expect(await transitions(page)).toBe(0);
	const soft = await panelStyle();
	expect(soft.property).toContain('grid-template-rows');
	const longest = Math.max(...soft.duration.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 1 : 1000)));
	expect(longest).toBeLessThanOrEqual(300);
	expect(longest).toBeGreaterThan(0);

	await page.emulateMedia({ reducedMotion: 'reduce' });
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await toggle.click();
	await expect(projectCard(page, 'Old thing')).toBeVisible();
	const still = await panelStyle();
	expect(still.property).not.toMatch(/grid-template-rows|height|transform|translate|scale/);
	const moving = await page.evaluate(() =>
		document.getAnimations().flatMap((a) => ((a.effect as KeyframeEffect | null)?.getKeyframes() ?? []).flatMap((k) => Object.keys(k))).filter((k) => /^(gridTemplateRows|height|transform|translate|scale|rotate)$/.test(k))
	);
	expect(moving).toEqual([]);
});

// Clicks the toggle and reports the properties the animations inside `panel` and the toggle changed, and their configured total time
// (delay + duration): configured timing, so a loaded machine can't fail it.
function toggleMotion(toggle: import('@playwright/test').Locator, panel: string) {
	return toggle.evaluate(async (el, selector) => {
		const root = document.querySelector(selector)!;
		const inside = (a: Animation) => {
			const target = (a.effect as KeyframeEffect | null)?.target as Node | null;
			return !!target && (root.contains(target) || el.contains(target));
		};
		(el as HTMLElement).click();
		const seen = new Map<Animation, string[]>();
		for (let i = 0; i < 8; i++) {
			await new Promise((r) => requestAnimationFrame(r));
			for (const a of document.getAnimations().filter(inside)) {
				seen.set(a, ((a.effect as KeyframeEffect).getKeyframes() ?? []).flatMap((k) => Object.keys(k)));
			}
		}
		const running = [...seen.keys()];
		const total = Math.max(0, ...running.map((a) => Number(a.effect!.getTiming().delay ?? 0) + Number(a.effect!.getTiming().duration ?? 0)));
		await Promise.all(running.map((a) => a.finished.catch(() => null)));
		return { count: running.length, total, properties: [...new Set([...seen.values()].flat())] };
	}, panel);
}

test('Scenario: Opening a class cross-fades and groups expand softly', async ({ page, request }) => {
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

	await classCards(page).filter({ hasText: 'Analysis II' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Analysis II' })).toBeVisible();
	expect(await transitions(page)).toBe(1);
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
	await page.waitForFunction(() => document.getAnimations().length === 0);

	await page.goto('/uni');
	await expect(page.getByRole('heading', { level: 1, name: 'Uni' })).toBeVisible();
	await page.waitForFunction(() => document.getAnimations().length === 0);
	const toggle = archivedGroup(page).getByRole('button', { name: 'Archived (1)' });
	const grown = await toggleMotion(toggle, '#uni-arch-panel');
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	expect(grown.count).toBeGreaterThan(0);
	expect(grown.total).toBeLessThanOrEqual(300);
	expect(await page.evaluate(() => document.getElementById('uni-arch-panel')!.inert)).toBe(false);

	await page.emulateMedia({ reducedMotion: 'reduce' });
	await toggleMotion(toggle, '#uni-arch-panel');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	expect(await page.evaluate(() => document.getElementById('uni-arch-panel')!.inert)).toBe(true);
	const plain = await toggleMotion(toggle, '#uni-arch-panel');
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	const moving = ['gridTemplateRows', 'height', 'transform', 'translate', 'scale', 'rotate'];
	expect(plain.properties.filter((p) => moving.includes(p))).toEqual([]);
});
