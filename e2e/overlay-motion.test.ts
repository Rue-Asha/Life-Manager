import type { Locator, Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRow } from './helpers';

const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
	await seed(request, {
		aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Stretch for ten minutes', aspect: 0, inSprint: true }]
	});
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const statusButton = (page: Page) => todoRow(page, 'Stretch for ten minutes').getByRole('button', { name: /^Status: / });

// Clicks inside the page; returns how many animations under `selector` ran, within how many frames the first one started, and their configured
// timing (delay + duration, easing). Configured timing, not wall-clock time, so a loaded machine can't fail it.
function measure(trigger: Locator, within: string) {
	return trigger.evaluate(async (el, selector) => {
		const inside = (a: Animation) => {
			const target = (a.effect as KeyframeEffect | null)?.target;
			const root = document.querySelector(selector);
			return !!target && !!root && (target === root || root.contains(target as Node));
		};
		const clicked = performance.now();
		(el as HTMLElement).click();
		let running: Animation[] = [];
		let frames = Infinity;
		for (let i = 0; i < 20 && !running.length; i++) {
			await new Promise((r) => requestAnimationFrame(r));
			running = document.getAnimations().filter(inside);
			if (running.length) frames = i + 1;
		}
		await new Promise((r) => requestAnimationFrame(r)); // a pending animation gets its start time on the next frame
		// When the first animation began on the document timeline, measured from the click: independent of how late the polling noticed it.
		const started = Math.min(Infinity, ...running.map((a) => Number(a.startTime ?? Infinity))) - clicked;
		const timing = running.map((a) => a.effect!.getTiming());
		// A CSS animation eases per keyframe, a transition on the effect.
		const eased = (a: Animation, i: number) => (timing[i].easing !== 'linear' ? timing[i].easing : ((a.effect as KeyframeEffect).getKeyframes()[0]?.easing ?? 'linear'));
		const easings = running.map(eased);
		await Promise.all(running.map((a) => a.finished.catch(() => null)));
		return {
			count: running.length,
			frames,
			started,
			delay: Math.max(0, ...timing.map((t) => Number(t.delay ?? 0))),
			total: Math.max(0, ...timing.map((t) => Number(t.delay ?? 0) + Number(t.duration ?? 0))),
			easings
		};
	}, within);
}

test('Scenario: Menus and sheets open softly', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/sprint');
	// The page's own settle animation runs at load; measure the menu after it.
	await page.waitForFunction(() => document.getAnimations().length === 0);
	const menu = await measure(statusButton(page), '[popover]:has([role="menu"][aria-label="Status"])');
	expect(menu.count).toBeGreaterThan(0);
	// Spec: an animation runs within 50 ms. It is configured without delay and began within 50 ms plus one frame (17 ms) of runner jitter.
	expect(menu.delay).toBe(0);
	expect(menu.started).toBeLessThanOrEqual(50 + 17);
	// 160 ms in, eased
	expect(menu.total).toBeGreaterThan(0);
	expect(menu.total).toBeLessThanOrEqual(160);
	expect(menu.easings.every((e) => e !== 'linear')).toBe(true);
	await expect(page.getByRole('menu', { name: 'Status' })).toBeVisible();
	await page.keyboard.press('Escape');

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/sprint');
	await page.waitForFunction(() => document.getAnimations().length === 0);
	const open = todoRow(page, 'Stretch for ten minutes').getByRole('button', { name: 'Stretch for ten minutes', exact: true });
	const sheet = await measure(open, 'dialog[open]');
	expect(sheet.count).toBeGreaterThan(0);
	// the bottom sheet slides up in 260 ms
	expect(sheet.total).toBeGreaterThan(0);
	expect(sheet.total).toBeLessThanOrEqual(260);
	expect(sheet.easings.every((e) => e !== 'linear')).toBe(true);
	await expect(page.getByRole('dialog', { name: 'Edit todo' })).toBeVisible();
});

test('Scenario: Reduced motion opens overlays without movement', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	// Clicks, then samples every frame for 600 ms (past the longest overlay animation), so an animation that finishes before a one-off read still counts.
	const opensWithout = (trigger: Locator) =>
		trigger.evaluate(async (el) => {
			const seen = new Set<string>();
			let frames = 0;
			(el as HTMLElement).click();
			const end = performance.now() + 600;
			while (performance.now() < end) {
				await new Promise((r) => requestAnimationFrame(r));
				frames++;
				for (const a of document.getAnimations()) {
					for (const k of (a.effect as KeyframeEffect | null)?.getKeyframes() ?? []) {
						for (const p of Object.keys(k)) if (['transform', 'translate', 'scale', 'rotate'].includes(p)) seen.add(p);
					}
				}
			}
			return { frames, seen: [...seen] };
		});

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/sprint');
	const menu = await opensWithout(statusButton(page));
	expect(menu.frames).toBeGreaterThan(10);
	expect(menu.seen).toEqual([]);
	await expect(page.getByRole('menu', { name: 'Status' })).toBeVisible();
	await page.keyboard.press('Escape');

	const sheet = await opensWithout(todoRow(page, 'Stretch for ten minutes').getByRole('button', { name: 'Stretch for ten minutes', exact: true }));
	expect(sheet.frames).toBeGreaterThan(10);
	expect(sheet.seen).toEqual([]);
	await expect(page.getByRole('dialog', { name: 'Edit todo' })).toBeVisible();
});
