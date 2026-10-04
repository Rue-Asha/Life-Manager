import { expect, test } from '@playwright/test';
import { reset, seed } from './helpers';

const LISTS = ['Today', 'Sprint', 'Backlog', 'Recurring', 'Projects', 'Aspects'];

test.beforeEach(async ({ request }) => {
	await reset(request);
	await seed(request, { aspects: [{ name: 'Health' }] });
});

test('Scenario: Desktop shows a sidebar', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	const screens: [string, string][] = [
		['/', 'Today'],
		['/sprint', 'Sprint'],
		['/backlog', 'Backlog'],
		['/aspects', 'Aspects'],
		['/recurring', 'Recurring'],
		['/projects', 'Projects'],
		['/sprint/plan', 'Sprint']
	];

	for (const [path, current] of screens) {
		await page.goto(path);
		const sidebar = page.getByRole('navigation', { name: 'Main' });
		await expect(sidebar).toBeVisible();
		const names = await sidebar.locator('a.item').evaluateAll((els) =>
			els.slice(0, 6).map((el) => el.textContent!.replace(/\d+$/, '').trim())
		);
		expect(names).toEqual(LISTS);
		await expect(sidebar.getByRole('link', { name: current, exact: true })).toHaveAttribute(
			'aria-current',
			'page'
		);
		await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
	}
});

test('Scenario: Desktop sidebar marks Projects on a project detail page', async ({ page, request }) => {
	await reset(request);
	const { projects } = await seed(request, { aspects: [{ name: 'IT' }], itAspect: 0, projects: [{ name: 'Life Manager' }] });
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto(`/projects/${projects[0]}`);
	const sidebar = page.getByRole('navigation', { name: 'Main' });
	await expect(sidebar.getByRole('link', { name: 'Projects', exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
});

test('Scenario: Phone home list shows the six lists', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');

	const list = page.getByRole('navigation', { name: 'Lists' });
	const names = await list
		.getByRole('link')
		.evaluateAll((els) => els.map((el) => el.textContent!.replace(/\d+$/, '').trim()));
	expect(names).toEqual(LISTS);
	await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
});

test('Scenario: Projects entry counts active projects', async ({ page, request }) => {
	await reset(request);
	await seed(request, {
		aspects: [{ name: 'IT' }],
		itAspect: 0,
		projects: [
			{ name: 'A', status: 'active' },
			{ name: 'B', status: 'active' },
			{ name: 'C', status: 'backlog' },
			{ name: 'D', status: 'implemented' }
		]
	});

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await expect(
		page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects', exact: true }).locator('.count')
	).toHaveText('2');

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	await expect(
		page.getByRole('navigation', { name: 'Lists' }).getByRole('link', { name: 'Projects', exact: true }).locator('.count')
	).toHaveText('2');
});

test('Scenario: Zero active projects is shown like other zero counts', async ({ page, request }) => {
	await reset(request);
	await seed(request, { aspects: [{ name: 'IT' }], itAspect: 0, projects: [{ name: 'Idea', status: 'backlog' }] });

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const sidebar = page.getByRole('navigation', { name: 'Main' });
	const recurring = sidebar.getByRole('link', { name: 'Recurring', exact: true });
	const projects = sidebar.getByRole('link', { name: 'Projects', exact: true });
	await expect(recurring.locator('.count')).toHaveCount(0);
	await expect(projects.locator('.count')).toHaveCount(0);
	await expect(projects).toHaveText('Projects');
});
