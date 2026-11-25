import type { Page } from '@playwright/test';
import { expect, reset, setClock, test } from './helpers';
import { seedWorstCase, SUNDAY } from './worst-case';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, SUNDAY);
	await seedWorstCase(request);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const settle = (page: Page) =>
	page.evaluate(async () => {
		for (let last = -1, same = 0, n = 0; same < 6 && n < 80; n++) {
			await new Promise((done) => requestAnimationFrame(done));
			same = scrollY === last ? same + 1 : 0;
			last = scrollY;
		}
	});

// Tall enough to scroll at both postures; scrolled part-way so a jump to the top is as visible as a jump down.
async function scrolled(page: Page, path: string) {
	await page.goto(path);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const y = await page.evaluate(() => {
		const room = document.documentElement.scrollHeight - innerHeight;
		scrollTo(0, Math.min(300, Math.floor(room / 2)));
		return scrollY;
	});
	// From 768 px the top bar turns into the sticky capsule once the page has scrolled; focus before that scrolls it back into view.
	if ((page.viewportSize()?.width ?? 0) >= 768) await expect(page.locator('.app-bar[data-scrolled]')).toHaveCount(1);
	return y;
}

for (const [width, height] of [
	[375, 812],
	[1280, 900]
]) {
	test.describe(`at ${width}`, () => {
		test.use({ viewport: { width, height }, hasTouch: width < 768, isMobile: width < 768 });

		test('Scenario: Opening and closing an overlay keeps the scroll position', async ({ page }) => {
			const nav = page.getByRole('navigation', { name: 'Main' });
			for (const path of ['/', '/sprint', '/backlog']) {
				const before = await scrolled(page, path);
				await nav.getByRole('button', { name: 'New todo' }).click();
				await expect(page.getByRole('dialog', { name: 'New todo' })).toBeVisible();
				await settle(page);
				expect(await page.evaluate(() => scrollY), `${path}: scroll with New todo open`).toBe(before);
				await page.keyboard.press('Escape');
				await expect(page.getByRole('dialog', { name: 'New todo' })).toHaveCount(0);
				await settle(page);
				expect(await page.evaluate(() => scrollY), `${path}: scroll after New todo closed`).toBe(before);

				const title = page.locator('li.row .text > button.title').first();
				await title.evaluate((el) => (el.closest('li') as HTMLElement).scrollIntoView({ block: 'center' }));
				const mid = await page.evaluate(() => scrollY);
				await title.click();
				await expect(page.getByRole('dialog', { name: 'Edit todo' })).toBeVisible();
				await settle(page);
				expect(await page.evaluate(() => scrollY), `${path}: scroll with the editor open`).toBe(mid);
				await page.keyboard.press('Escape');
				await expect(page.getByRole('dialog', { name: 'Edit todo' })).toHaveCount(0);
				await settle(page);
				expect(await page.evaluate(() => scrollY), `${path}: scroll after the editor closed`).toBe(mid);
			}
		});

		test('Scenario: Focusing a bar control keeps the scroll position', async ({ page }) => {
			const before = await scrolled(page, '/');
			const nav = page.getByRole('navigation', { name: 'Main' });
			for (const link of await nav.getByRole('link').all()) {
				await link.focus();
				await settle(page);
				expect(await page.evaluate(() => scrollY), `focus on "${await link.textContent()}"`).toBe(before);
			}
		});
	});
}

// A click that lands on the lower edge of a row belongs to that row, never to the title of the row under it.
for (const [width, height] of [
	[375, 812],
	[1280, 900]
]) {
	test.describe(`hit areas at ${width}`, () => {
		test.use({ viewport: { width, height }, hasTouch: width < 768, isMobile: width < 768 });

		const strays = (page: Page) =>
			page.evaluate(() => {
				const out: string[] = [];
				const rows = [...document.querySelectorAll<HTMLElement>('li.row')];
				for (const row of rows) {
					const r = row.getBoundingClientRect();
					const title = row.querySelector<HTMLElement>('.text > button.title');
					if (!title || r.height === 0) continue;
					const t = title.getBoundingClientRect();
					row.scrollIntoView({ block: 'center' });
					const y = row.getBoundingClientRect().bottom - 4;
					const hit = document.elementFromPoint(t.left + 8, y);
					if (hit && !row.contains(hit)) out.push(`${(title.textContent ?? '').trim().slice(0, 30)}: bottom edge hits ${hit.tagName.toLowerCase()}.${hit.className.toString().split(' ')[0]}`);
				}
				for (const toggle of document.querySelectorAll<HTMLElement>('button.toggle')) {
					toggle.scrollIntoView({ block: 'center' });
					const r = toggle.getBoundingClientRect();
					const hit = document.elementFromPoint(r.left + 20, r.bottom - 4);
					if (hit && !toggle.contains(hit)) out.push(`toggle "${(toggle.textContent ?? '').trim().slice(0, 20)}": bottom edge hits ${hit.tagName.toLowerCase()}.${hit.className.toString().split(' ')[0]}`);
				}
				return out;
			});

		test('Scenario: A row title only takes clicks inside its own row', async ({ page }) => {
			for (const path of ['/', '/backlog', '/sprint']) {
				await page.goto(path);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				expect(await strays(page), path).toEqual([]);
			}

			await page.goto('/backlog');
			const toggle = page.locator('button.toggle').first();
			await expect(toggle).toHaveAttribute('aria-expanded', 'true');
			await toggle.evaluate((el) => el.scrollIntoView({ block: 'center' }));
			await settle(page);
			const box = (await toggle.boundingBox())!;
			await page.mouse.click(box.x + 20, box.y + box.height - 4);
			await expect(page.getByRole('dialog', { name: 'Edit todo' })).toHaveCount(0);
			await expect(toggle).toHaveAttribute('aria-expanded', 'false');

			await page.goto('/backlog');
			const pair = page.locator('.trow + .trow > li.row').filter({ has: page.locator('.text > button.title') }).first();
			await pair.evaluate((el) => el.scrollIntoView({ block: 'center' }));
			await settle(page);
			const next = (await pair.boundingBox())!;
			const nextTitle = (((await pair.locator('.text > button.title').textContent()) ?? '').trim());
			const tb = (await pair.locator('.text > button.title').boundingBox())!;
			await page.mouse.click(tb.x + 8, next.y - 3);
			await page.waitForTimeout(400);
			const editor = page.getByRole('dialog', { name: 'Edit todo' });
			if (await editor.count()) await expect(editor.getByLabel('Title')).not.toHaveValue(nextTitle);
		});
	});
}
