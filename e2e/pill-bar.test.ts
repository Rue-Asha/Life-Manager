import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRows, openNewTodo } from './helpers';

// Sunday 11 October 2026 in Berlin: the sprint of 5–11 October is still running and its review is open.
const SUNDAY = '2026-10-11T10:00:00Z';

test.use({ viewport: { width: 375, height: 812 } });

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, SUNDAY);
	await seed(request, { aspects: [{ name: 'Health' }], sprint: { state: 'active', weekStart: '2026-10-05' } });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const main = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const dock = (page: Page) => page.locator('nav.dock');

test('Scenario: Pill bar shows five tabs and the round add button', async ({ page }) => {
	await page.goto('/');

	await expect(main(page)).toHaveCount(1);
	await expect(main(page).getByRole('link')).toHaveText([/^\s*Today/, /^\s*Sprint/, /^\s*Backlog/, /^\s*Calendar/, /^\s*More/]);
	await expect(main(page).getByRole('button', { name: 'New todo' })).toBeVisible();
	await expect(main(page).getByRole('list').getByRole('button')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'New todo' })).toHaveCount(1);
	await expect(page.locator('header.app-bar .app-nav')).toBeHidden();
});

test('Scenario: Active tab is marked on the phone', async ({ page }) => {
	for (const [path, tab] of [
		['/sprint/review', 'Sprint'],
		['/calendar', 'Calendar'],
		['/menu', 'More'],
		['/uni', 'More']
	]) {
		await page.goto(path);
		await expect(page).toHaveURL(new RegExp(`${path}$`));
		await expect(main(page).locator('[aria-current="page"]')).toHaveCount(1);
		await expect(main(page).getByRole('link', { name: new RegExp(`^${tab}`) })).toHaveAttribute('aria-current', 'page');
	}
});

test('Scenario: Pill bar fits at 320 px', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await page.goto('/');

	const targets = main(page).getByRole('link').or(main(page).getByRole('button', { name: 'New todo' }));
	await expect(targets).toHaveCount(6);
	for (const box of await targets.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))) {
		expect(box.left).toBeGreaterThanOrEqual(0);
		expect(box.right).toBeLessThanOrEqual(320);
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
	const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
	expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

test('Scenario: Pill bar hides while a text field has focus', async ({ page }) => {
	await page.goto('/backlog');
	await expect(dock(page)).toBeVisible();

	const field = page.getByRole('main').getByLabel('Title', { exact: true });
	await field.focus();
	await expect(dock(page)).toBeHidden();
	await expect(dock(page)).toHaveJSProperty('inert', true);
	await expect(dock(page).getByRole('button', { name: 'New todo' })).toBeHidden();

	await field.blur();
	await expect(dock(page)).toBeVisible();
	await expect(dock(page)).toHaveJSProperty('inert', false);
	await expect(main(page).getByRole('button', { name: 'New todo' })).toBeVisible();

	const form = await openNewTodo(page);
	await form.getByLabel('Title', { exact: true }).focus();
	await expect(form.getByLabel('Title', { exact: true })).toBeFocused();
	await expect(dock(page)).toBeHidden();
	await expect(dock(page)).toHaveJSProperty('inert', true);

	await page.keyboard.press('Escape');
	await expect(form).toBeHidden();
	await expect(dock(page)).toBeVisible();
	await expect(dock(page)).toHaveJSProperty('inert', false);
	await expect(main(page).getByRole('button', { name: 'New todo' })).toBeVisible();
});

test('Scenario: Content never sits under the pill bar', async ({ page, request }) => {
	await reset(request);
	await setClock(request, SUNDAY);
	await seed(request, { aspects: [{ name: 'Health' }], todos: Array.from({ length: 60 }, (_, i) => ({ title: `Todo ${String(i).padStart(2, '0')}` })) });
	await page.goto('/backlog');
	await expect(todoRows(page.getByRole('main'))).toHaveCount(60);

	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	const last = todoRows(page.getByRole('main')).last();
	await expect(last).toBeInViewport();
	const [row, bar] = [await last.boundingBox(), await dock(page).boundingBox()];
	expect(row!.y + row!.height).toBeLessThanOrEqual(bar!.y);
});
