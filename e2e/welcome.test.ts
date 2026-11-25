import { ASPECT_ICONS, PRESET_ASPECTS } from '../src/lib/aspect-style';
import { expect, test, reset, seed } from './helpers';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await page.setViewportSize({ width: 1280, height: 900 });
});

const preset = (page: import('@playwright/test').Page, name: string) => page.getByRole('checkbox', { name, exact: true });

test('Scenario: Submit waits for a choice', async ({ page }) => {
	await page.goto('/welcome');
	const submit = page.getByRole('button', { name: /^Continue/ });
	await expect(submit).toBeDisabled();

	await preset(page, 'Health').check();
	await expect(page.getByRole('button', { name: 'Continue with 1 aspect' })).toBeEnabled();
	await preset(page, 'Uni').check();
	await expect(page.getByRole('button', { name: 'Continue with 2 aspects' })).toBeEnabled();
	await page.getByRole('button', { name: 'Continue with 2 aspects' }).click();
	await expect(page).toHaveURL(/\/backlog$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
});

test('Scenario: Duplicate custom name shows its error', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/welcome');

	await preset(page, 'Uni').check();
	await page.getByRole('button', { name: 'Add your own' }).click();
	await page.getByRole('textbox', { name: 'Aspect name' }).fill('health');
	await expect(page.getByRole('button', { name: 'Continue with 2 aspects' })).toBeEnabled();
	await page.getByRole('button', { name: 'Continue with 2 aspects' }).click();

	await expect(page.getByRole('alert').filter({ hasText: 'You already have an aspect with this name.' })).toBeVisible();
	await expect(page).toHaveURL(/\/welcome$/);
	await expect(preset(page, 'Uni')).toBeChecked();
	// The refused name is not counted until it changes.
	await expect(page.getByRole('button', { name: 'Continue with 1 aspect' })).toBeEnabled();

	await page.getByRole('textbox', { name: 'Aspect name' }).fill('Music');
	await expect(page.getByRole('button', { name: 'Continue with 2 aspects' })).toBeEnabled();
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('Scenario: Revisiting welcome marks existing presets', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/welcome');

	const health = preset(page, 'Health');
	await expect(health).toBeDisabled();
	await expect(health).not.toBeChecked();
	await expect(health).toHaveAccessibleDescription('Already an aspect');
	await expect(preset(page, 'Uni')).toBeEnabled();

	await preset(page, 'Uni').check();
	await page.getByRole('button', { name: 'Continue with 1 aspect' }).click();
	await expect(page).toHaveURL(/\/backlog$/);
	await expect(page.getByRole('navigation', { name: 'Filter by aspect' }).getByRole('link', { name: /^Uni/ })).toBeVisible();
});

test('Scenario: Zero aspects redirect to welcome from every route', async ({ page }) => {
	for (const route of ['/', '/sprint', '/backlog', '/calendar', '/menu', '/sync']) {
		await page.goto(route);
		await expect(page, route).toHaveURL(/\/welcome$/);
	}
});

test('Scenario: First-run Welcome shows no bars', async ({ page, request }) => {
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/welcome');
		await expect(page.getByRole('heading', { level: 1, name: /Set up your aspects/ })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'New todo' })).toHaveCount(0);
	}

	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/welcome');
	await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'New todo' })).toBeVisible();
});

test('Scenario: First run shows onboarding', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/welcome$/);
	for (const p of PRESET_ASPECTS) {
		const toggle = preset(page, p.name);
		await expect(toggle).toBeVisible();
		await expect(toggle).not.toBeChecked();
		const chip = page.getByRole('listitem').filter({ has: toggle }).locator('.chip');
		const token = await page.evaluate((c) => {
			const probe = document.createElement('span');
			probe.style.background = `var(--aspect-${c})`;
			document.body.append(probe);
			const value = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return value;
		}, p.color);
		await expect(chip).toHaveCSS('background-color', token);
		await expect(chip.locator('path')).toHaveAttribute('d', ASPECT_ICONS[p.icon]);
	}
	await expect(page.getByRole('button', { name: 'Add your own' })).toBeVisible();
});

test('Onboarding rejects an empty custom name inline', async ({ page }) => {
	await page.goto('/welcome');
	await preset(page, 'Health').check();
	await page.getByRole('button', { name: 'Add your own' }).click();
	await page.getByRole('textbox', { name: 'Aspect name' }).fill('   ');
	await page.getByRole('button', { name: 'Continue with 1 aspect' }).click();

	await expect(page.getByRole('alert').filter({ hasText: 'Give the aspect a name.' })).toBeVisible();
	await expect(page).toHaveURL(/\/welcome$/);
	await expect(preset(page, 'Health')).toBeChecked();
});

test('Picked presets are charcoal with a check, existing ones stay plain', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/welcome');
	const pill = (name: string) => page.locator('label').filter({ has: preset(page, name) });
	const bg = (name: string) => pill(name).evaluate((el) => getComputedStyle(el).backgroundColor);

	const charcoal = await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'New todo' }).evaluate((el) => getComputedStyle(el).backgroundColor);
	const before = await bg('Uni');
	expect(before).not.toBe(charcoal);
	await preset(page, 'Uni').check();
	await expect.poll(() => bg('Uni')).toBe(charcoal);
	expect(await bg('Health')).toBe(before);
});
