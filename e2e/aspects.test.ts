import { expect, test, type Page } from '@playwright/test';
import { ASPECT_ICONS, PRESET_ASPECTS } from '../src/lib/aspect-style';
import { reset, seed } from './helpers';

function aspectRow(page: Page, name: string) {
	return page.getByTestId('aspect-row').filter({ has: page.getByText(name, { exact: true }) });
}

async function expectStyle(page: Page, name: string, color: string, icon: keyof typeof ASPECT_ICONS) {
	const svg = aspectRow(page, name).locator('svg').first();
	await expect(svg).toHaveAttribute('style', new RegExp(`--aspect-${color}\\)`));
	await expect(svg.locator('path')).toHaveAttribute('d', ASPECT_ICONS[icon]);
}

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

test('Scenario: Create an aspect with colour and icon', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/aspects');

	await page.getByRole('button', { name: 'New aspect' }).click();
	const sheet = page.getByRole('dialog', { name: 'New aspect' });
	await sheet.getByRole('textbox', { name: 'Name' }).fill('Sport');
	await sheet.getByRole('radio', { name: 'Tangerine' }).check();
	await sheet.getByRole('radio', { name: 'Dumbbell' }).check();
	await sheet.getByRole('button', { name: 'Create aspect' }).click();

	await expect(sheet).toBeHidden();
	await expect(aspectRow(page, 'Sport')).toBeVisible();
	await expectStyle(page, 'Sport', 'tangerine', 'dumbbell');
});

test('Scenario: Edit an aspect', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Sport', color: 'tangerine', icon: 'dumbbell' }] });
	await page.goto('/aspects');

	await aspectRow(page, 'Sport').getByRole('button', { name: /Sport/ }).click();
	const sheet = page.getByRole('dialog', { name: 'Edit aspect' });
	await sheet.getByRole('textbox', { name: 'Name' }).fill('Fitness');
	await sheet.getByRole('radio', { name: 'Lagoon' }).check();
	await sheet.getByRole('radio', { name: 'Leaf' }).check();
	await sheet.getByRole('button', { name: 'Save' }).click();

	await expect(sheet).toBeHidden();
	await expectStyle(page, 'Fitness', 'lagoon', 'leaf');
	await expect(aspectRow(page, 'Sport')).toHaveCount(0);
	await expect(page.getByTestId('aspect-row')).toHaveCount(2);
});

test('Scenario: Empty aspect name is rejected inline', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/aspects');

	await page.getByRole('button', { name: 'New aspect' }).click();
	const sheet = page.getByRole('dialog', { name: 'New aspect' });
	const name = sheet.getByRole('textbox', { name: 'Name' });
	await name.fill('   ');
	await sheet.getByRole('button', { name: 'Create aspect' }).click();

	await expect(sheet).toBeVisible();
	await expect(name).toHaveAttribute('aria-invalid', 'true');
	await expect(name).toHaveAccessibleDescription('Give the aspect a name.');
	await page.reload();
	await expect(page.getByTestId('aspect-row')).toHaveCount(1);
});

test('renaming to an existing name is rejected inline', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Sport' }] });
	await page.goto('/aspects');

	await aspectRow(page, 'Sport').getByRole('button', { name: /Sport/ }).click();
	const sheet = page.getByRole('dialog', { name: 'Edit aspect' });
	await sheet.getByRole('textbox', { name: 'Name' }).fill('health');
	await sheet.getByRole('button', { name: 'Save' }).click();

	await expect(sheet.getByText('You already have an aspect with this name.')).toBeVisible();
});

test('aspect list shows each todo count', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Uni' }],
		todos: [{ title: 'Run', aspect: 0 }, { title: 'Swim', aspect: 0 }]
	});
	await page.goto('/aspects');

	await expect(aspectRow(page, 'Health')).toContainText('2 todos');
	await expect(aspectRow(page, 'Uni')).toContainText('No todos');
});
