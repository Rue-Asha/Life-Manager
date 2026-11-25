import type { Page } from '@playwright/test';
import { expect, reset, setClock, test, todoRow } from './helpers';
import { routes, seedWorstCase, SUNDAY } from './worst-case';

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

async function expectNoPageScroll(page: Page, name: string) {
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const { scrollWidth, clientWidth } = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(scrollWidth, `${name} scrolls horizontally at ${page.viewportSize()!.width}`).toBeLessThanOrEqual(clientWidth);
}

test.describe('on a phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: No horizontal page scroll from 320 to 1920', async ({ page, request }) => {
		test.setTimeout(300_000);
		await reset(request);
		await page.goto('/welcome');
		for (const width of [320, 390, 768, 1280, 1920]) {
			await page.setViewportSize({ width, height: 900 });
			await expectNoPageScroll(page, 'welcome');
		}

		const { aspects, projects, classes } = await seedWorstCase(request);
		for (const width of [320, 390, 768, 1280, 1920]) {
			await page.setViewportSize({ width, height: 900 });
			for (const [path, name] of routes(aspects[1], projects[0], classes[0])) {
				await page.goto(path);
				await expectNoPageScroll(page, name);
			}
		}

		await page.setViewportSize({ width: 320, height: 812 });
		await page.goto('/sprint');
		await page.getByRole('button', { name: 'Manage', exact: true }).tap();
		await expect(page.getByRole('dialog', { name: 'Backlog' })).toBeVisible();
		await expectNoPageScroll(page, 'sprint-manage');

		await page.setViewportSize({ width: 320, height: 812 });
		await reset(request);
		await setClock(request, SUNDAY);
		await seedWorstCase(request);
		await page.goto('/sprint/review');
		await page.getByRole('button', { name: /close/i }).tap();
		await expect(page).toHaveURL(/\/sprint\/plan$/);
		await expectNoPageScroll(page, 'plan');
	});

	test('Scenario: Controls meet the target sizes', async ({ page, request }) => {
		test.setTimeout(300_000);
		const { aspects, projects, classes } = await seedWorstCase(request);

		const undersized = () =>
			page.evaluate(() => {
				const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=menuitem], [role=menuitemradio], [role=checkbox], [role=tab], [role=switch], [role=option]';
				const failures = new Set<string>();
				for (const el of document.querySelectorAll<HTMLElement>(SEL)) {
					if (!el.checkVisibility({ checkVisibilityCSS: true, opacityProperty: false })) continue;
					const box = el.matches('input, textarea, select') ? (el.closest('.control') ?? el) : el;
					let rect = box.getBoundingClientRect();
					if (rect.width <= 1 || rect.height <= 1) continue;
					if (rect.width >= 43.5 && rect.height >= 43.5) continue;
					// A list row's title stretches over its own text block and the row's padding: that box is the target, whatever meta link sits in the way of a ray.
					if (el.matches('.row.list > .text > button.title')) {
						const text = el.parentElement!.getBoundingClientRect();
						const row = el.closest('.row')!.getBoundingClientRect();
						if (text.width >= 43.5 && row.height >= 43.5) continue;
					}
					// A stretched ::after is part of the control: measure how far hits on it reach from the centre.
					el.scrollIntoView({ block: 'center', inline: 'center' });
					rect = box.getBoundingClientRect();
					const cx = rect.left + rect.width / 2;
					const cy = rect.top + rect.height / 2;
					const owns = (x: number, y: number) => {
						const hit = document.elementFromPoint(x, y);
						return !!hit && (box === hit || box.contains(hit) || el.contains(hit));
					};
					const reach = (dx: number, dy: number) => {
						let n = 0;
						while (n < 80 && owns(cx + dx * (n + 1), cy + dy * (n + 1))) n++;
						return n;
					};
					const w = Math.max(rect.width, reach(1, 0) + reach(-1, 0) + 1);
					const h = Math.max(rect.height, reach(0, 1) + reach(0, -1) + 1);
					if (w >= 43.5 && h >= 43.5) continue;
					const parent = el.parentElement;
					const inline =
						!!el.closest('.meta') ||
						(getComputedStyle(el).display === 'inline' &&
						!!parent &&
						[...parent.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0));
					if (inline && w >= 24 && h >= 24) continue;
					const name = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 30) ?? '';
					failures.add(`${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]} "${name}" ${Math.round(w)}x${Math.round(h)}`);
				}
				return [...failures];
			});

		const found: string[] = [];
		const check = async (name: string) => {
			await page.waitForFunction(() => document.getAnimations().every((a) => a.playState === 'finished' || a.playState === 'idle' || a.effect?.getComputedTiming().iterations === Infinity));
			found.push(...(await undersized()).map((f) => `${name}: ${f}`));
		};

		for (const [path, name] of routes(aspects[1], projects[0], classes[0])) {
			await page.goto(path);
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			await check(name);
		}

		// Dialogs and menus.
		await page.goto('/sprint');
		await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'New todo' }).tap();
		await expect(page.getByRole('dialog', { name: 'New todo' })).toBeVisible();
		await check('quick-add');
		await page.keyboard.press('Escape');

		await page.getByRole('button', { name: 'Manage', exact: true }).tap();
		await expect(page.getByRole('dialog', { name: 'Backlog' })).toBeVisible();
		await check('sprint-manage');
		await page.keyboard.press('Escape');

		await todoRow(page, 'Clean the fridge').getByRole('button', { name: 'Clean the fridge', exact: true }).tap();
		await expect(page.getByRole('dialog', { name: 'Edit todo' })).toBeVisible();
		await check('editor');
		await page.keyboard.press('Escape');

		await todoRow(page, 'Clean the fridge').getByRole('button', { name: /^More actions/ }).tap();
		await expect(page.getByRole('menu')).toBeVisible();
		await check('row-menu');
		expect(found).toEqual([]);
	});
});

test.describe('on the desktop', () => {
	test.use({ hasTouch: false, isMobile: false });

	// The element in focus draws a ring that no scroller clips and no bar, pill or toast covers.
	const focusProblem = (page: Page) =>
		page.evaluate(async () => {
			// Focus scrolls the element into view, smoothly where the page asks for it: read it once it stands still.
			const still = () => {
				const r = document.activeElement?.getBoundingClientRect();
				return r ? `${r.left}|${r.top}|${scrollY}` : '';
			};
			for (let last = '', same = 0, n = 0; same < 3 && n < 60; n++) {
				await new Promise((done) => requestAnimationFrame(done));
				const now = still();
				same = now === last ? same + 1 : 0;
				last = now;
			}
			const el = document.activeElement as HTMLElement | null;
			if (!el || el === document.body || el === document.documentElement) return 'body';
			const label = `${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}"`;
			const ring = el.matches('input, textarea, select') ? (el.closest('.control') ?? el) : el;
			const cs = getComputedStyle(ring.matches('.control:has(:focus-visible)') ? ring : el);
			const width = parseFloat(cs.outlineWidth);
			if (!(cs.outlineStyle !== 'none' && width > 0) && cs.boxShadow === 'none') return `${label}: no focus ring`;
			const reach = Math.max(0, width + Math.max(0, parseFloat(cs.outlineOffset) || 0));
			const r = el.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) return null;
			if (r.bottom <= 0 || r.top >= innerHeight) return `${label}: out of view`;
			const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
			const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
			const hit = document.elementFromPoint(x, y);
			if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) return `${label}: covered by ${hit?.tagName.toLowerCase()}.${hit?.className.toString().split(' ')[0]}`;
			for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
				const s = getComputedStyle(a);
				if (s.display === 'contents') continue;
				const clipsX = s.overflowX !== 'visible';
				const clipsY = s.overflowY !== 'visible';
				if (!clipsX && !clipsY) continue;
				const b = a.getBoundingClientRect();
				if (clipsX && (r.left - reach < b.left - 0.5 || r.right + reach > b.right + 0.5)) return `${label}: ring clipped sideways by ${a.tagName.toLowerCase()}.${a.className.toString().split(' ')[0]}`;
				if (clipsY && (r.top - reach < b.top - 0.5 || r.bottom + reach > b.bottom + 0.5)) return `${label}: ring clipped vertically by ${a.tagName.toLowerCase()}.${a.className.toString().split(' ')[0]}`;
			}
			return null;
		});

	test('Scenario: Focus is visible and not obscured', async ({ page, request }) => {
		test.setTimeout(360_000);
		await seedWorstCase(request);
		const problems: string[] = [];
		for (const width of [375, 1280]) {
			await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
			for (const path of ['/', '/sprint', '/backlog']) {
				await page.goto(path);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
				const seen = new Set<string>();
				for (let i = 0; i < 90; i++) {
					await page.keyboard.press('Tab');
					const key = await page.evaluate(() => {
						const el = document.activeElement as HTMLElement;
						return `${el.tagName}|${el.className}|${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30)}|${Math.round(el.getBoundingClientRect().top + scrollY)}`;
					});
					if (seen.has(key)) break;
					seen.add(key);
					const problem = await focusProblem(page);
					if (problem && problem !== 'body') problems.push(`${path} ${width}: ${problem}`);
				}
			}
		}
		expect([...new Set(problems)]).toEqual([]);
	});
});

test('Scenario: Reduced motion removes movement', async ({ page, request }) => {
	test.setTimeout(120_000);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript(() => {
		const moving = new Set<string>();
		(window as unknown as { __moving: Set<string> }).__moving = moving;
		const MOVEMENT = /^(transform|translate|scale|rotate|top|left|right|bottom|inset.*|margin.*|offset.*)$/;
		const sample = () => {
			for (const a of document.getAnimations()) {
				for (const k of (a.effect as KeyframeEffect | null)?.getKeyframes() ?? []) {
					for (const p of Object.keys(k)) if (MOVEMENT.test(p) && k[p as keyof Keyframe] !== undefined && !['offset', 'easing', 'composite', 'computedOffset'].includes(p)) moving.add(p);
				}
			}
			requestAnimationFrame(sample);
		};
		requestAnimationFrame(sample);
	});
	const movement = () => page.evaluate(() => [...(window as unknown as { __moving: Set<string> }).__moving]);

	await seedWorstCase(request);
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Sprint/ }).click();
	await expect(page).toHaveURL(/\/sprint/);
	await expect(page.getByRole('heading', { level: 1, name: 'Sprint' })).toBeVisible();

	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'By aspect' }).click();

	await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'New todo' }).click();
	await expect(page.getByRole('dialog', { name: 'New todo' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'New todo' })).toHaveCount(0);

	await todoRow(page, 'Clean the fridge').getByRole('button', { name: /^More actions/ }).click();
	await expect(page.getByRole('menu')).toBeVisible();
	await page.keyboard.press('Escape');

	await todoRow(page, 'Clean the fridge').getByRole('button', { name: 'Clean the fridge', exact: true }).click();
	await expect(page.getByRole('dialog', { name: 'Edit todo' })).toBeVisible();
	await page.keyboard.press('Escape');

	// Moving a todo: the Sprint's backlog rail adds one to the sprint.
	const add = page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' });
	await add.click();
	await expect(todoRow(page, 'Book a physio appointment').first()).toBeVisible();
	await page.waitForTimeout(500);
	expect(await movement()).toEqual([]);
});
