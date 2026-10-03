import { expect, test, type Page } from '@playwright/test';
import { ASPECT_ICONS, PRESET_ASPECTS } from '../src/lib/aspect-style';
import { reset } from './helpers';

function sidebarAspects(page: Page) {
	return page.getByRole('navigation', { name: 'Main' }).locator('a[href^="/backlog?aspect="]');
}

test.beforeEach(async ({ request }) => {
	await reset(request);
});

test('Scenario: First run shows onboarding', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/welcome$/);

	for (const preset of PRESET_ASPECTS) {
		const toggle = page.getByRole('checkbox', { name: preset.name, exact: true });
		await expect(toggle).toBeVisible();
		await expect(toggle).not.toBeChecked();
		const icon = page.locator('label', { has: toggle }).locator('svg').first();
		await expect(icon).toHaveAttribute('style', new RegExp(`--aspect-${preset.color}\\)`));
		await expect(icon.locator('path')).toHaveAttribute('d', ASPECT_ICONS[preset.icon]);
	}
	await expect(page.getByRole('button', { name: 'Add your own' })).toBeVisible();
});

test('Scenario: Onboarding creates the chosen aspects', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/welcome');

	await page.getByRole('checkbox', { name: 'Health', exact: true }).check();
	await page.getByRole('checkbox', { name: 'Uni', exact: true }).check();
	await page.getByRole('button', { name: 'Add your own' }).click();
	await page.getByRole('textbox', { name: 'Name' }).fill('Music');
	await page.getByRole('radio', { name: 'Tangerine' }).check();
	await page.getByRole('radio', { name: 'Music' }).check();
	await page.getByRole('button', { name: 'Continue with 3 aspects' }).click();

	await expect(page).toHaveURL(/\/backlog$/);
	await page.goto('/');
	await expect(sidebarAspects(page)).toHaveText(['Health', 'Uni', 'Music']);
});

test('onboarding needs at least one aspect', async ({ page }) => {
	await page.goto('/welcome');
	await expect(page.getByRole('button', { name: /^Continue/ })).toBeDisabled();
});

test('onboarding rejects an empty custom name inline', async ({ page }) => {
	await page.goto('/welcome');
	await page.getByRole('button', { name: 'Add your own' }).click();
	await page.getByRole('textbox', { name: 'Name' }).fill('   ');
	await page.getByRole('button', { name: 'Continue with 1 aspect' }).click();

	await expect(page.getByText('Give the aspect a name.')).toBeVisible();
	await expect(page).toHaveURL(/\/welcome$/);
});
