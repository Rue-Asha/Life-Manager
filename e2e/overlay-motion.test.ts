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

// Clicks inside the page; returns how many animations under `selector` ran, in which rendered frame after the click the first one started, and
// their configured timing (delay + duration, easing). Animations are collected from their start events, not polled, and the start is counted in
// frames of the page's own timeline, so a loaded machine that renders slowly (or runs a whole animation between two frames) can't fail it.
function measure(trigger: Locator, within: string) {
	return trigger.evaluate(async (el, selector) => {
		const inside = (a: Animation) => {
			const target = (a.effect as KeyframeEffect | null)?.target;
			const root = document.querySelector(selector);
			return !!target && !!root && (target === root || root.contains(target as Node));
		};
		const found = new Set<Animation>();
		const collect = (e: Event) => {
			for (const a of (e.target as Element).getAnimations({ subtree: true })) if (inside(a)) found.add(a);
		};
		const animate = Element.prototype.animate;
		Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) {
			const a = animate.apply(this, args);
			queueMicrotask(() => inside(a) && found.add(a));
			return a;
		};
		document.addEventListener('animationstart', collect, true);
		document.addEventListener('transitionrun', collect, true);
		const frames: number[] = [];
		(el as HTMLElement).click();
		const give = performance.now() + 3000;
		while (performance.now() < give && !found.size) frames.push(await new Promise<number>((r) => requestAnimationFrame(r)));
		document.removeEventListener('animationstart', collect, true);
		document.removeEventListener('transitionrun', collect, true);
		Element.prototype.animate = animate;
		const running = [...found];
		await Promise.all(running.map((a) => a.finished.catch(() => null)));
		// The frame in which the first animation got its start time on the document timeline, counted from the click.
		const startTimes = running.map((a) => Number(a.startTime ?? Infinity));
		const startedFrame = frames.filter((t) => t < Math.min(Infinity, ...startTimes)).length;
		const timing = running.map((a) => a.effect!.getTiming());
		// A CSS animation eases per keyframe, a transition on the effect.
		const eased = (a: Animation, i: number) => (timing[i].easing !== 'linear' ? timing[i].easing : ((a.effect as KeyframeEffect).getKeyframes()[0]?.easing ?? 'linear'));
		return {
			count: running.length,
			startedFrame,
			delay: Math.max(0, ...timing.map((t) => Number(t.delay ?? 0))),
			total: Math.max(0, ...timing.map((t) => Number(t.delay ?? 0) + Number(t.duration ?? 0))),
			easings: running.map(eased)
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
	// Spec: an animation runs within 50 ms. It is configured without delay and began within two frames of the click (33 ms at 60 Hz).
	expect(menu.delay).toBe(0);
	expect(menu.startedFrame).toBeLessThanOrEqual(2);
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
	// Clicks, then watches 600 ms (past the longest overlay animation) for every animation or transition that starts, from the start events, so
	// one that begins and ends between two slow frames still counts.
	const opensWithout = (trigger: Locator) =>
		trigger.evaluate(async (el) => {
			const seen = new Set<string>();
			const moves = ['transform', 'translate', 'scale', 'rotate'];
			const collect = (e: Event) => {
				if (e.type === 'transitionrun') {
					const p = (e as TransitionEvent).propertyName;
					if (moves.includes(p)) seen.add(p);
				}
				for (const a of (e.target as Element).getAnimations({ subtree: true })) {
					for (const k of (a.effect as KeyframeEffect | null)?.getKeyframes() ?? []) {
						for (const p of Object.keys(k)) if (moves.includes(p)) seen.add(p);
					}
				}
			};
			const animate = Element.prototype.animate;
			Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) {
				const a = animate.apply(this, args);
				for (const k of (a.effect as KeyframeEffect).getKeyframes()) for (const p of Object.keys(k)) if (moves.includes(p)) seen.add(p);
				return a;
			};
			document.addEventListener('animationstart', collect, true);
			document.addEventListener('transitionrun', collect, true);
			(el as HTMLElement).click();
			await new Promise((r) => setTimeout(r, 600));
			document.removeEventListener('animationstart', collect, true);
			document.removeEventListener('transitionrun', collect, true);
			Element.prototype.animate = animate;
			return { seen: [...seen] };
		});

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/sprint');
	const menu = await opensWithout(statusButton(page));
	expect(menu.seen).toEqual([]);
	await expect(page.getByRole('menu', { name: 'Status' })).toBeVisible();
	await page.keyboard.press('Escape');

	const sheet = await opensWithout(todoRow(page, 'Stretch for ten minutes').getByRole('button', { name: 'Stretch for ten minutes', exact: true }));
	expect(sheet.seen).toEqual([]);
	await expect(page.getByRole('dialog', { name: 'Edit todo' })).toBeVisible();
});
