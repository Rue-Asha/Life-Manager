import { expect, test } from '@playwright/test';

const LISTS = ['Today', 'Sprint', 'Backlog', 'Aspects', 'Recurring'];

test('Scenario: Desktop shows a sidebar', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');

	const sidebar = page.getByRole('navigation', { name: 'Main' });
	await expect(sidebar).toBeVisible();
	for (const name of LISTS) {
		await expect(sidebar.getByRole('link', { name, exact: true })).toBeVisible();
	}
	await expect(sidebar.getByRole('link', { name: 'Today', exact: true })).toHaveAttribute(
		'aria-current',
		'page'
	);
	await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
});

test('Scenario: Phone home list shows the five lists', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');

	const list = page.getByRole('navigation', { name: 'Lists' });
	for (const name of LISTS) {
		await expect(list.getByRole('link', { name, exact: true })).toBeVisible();
	}
	await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
});
