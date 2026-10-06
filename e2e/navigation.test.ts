import { expect, test, reset, seed } from './helpers';

const LISTS = ['Today', 'Sprint', 'Backlog', 'Recurring', 'Projects', 'Uni', 'Aspects'];

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
		['/uni', 'Uni'],
		['/sprint/plan', 'Sprint']
	];

	for (const [path, current] of screens) {
		await page.goto(path);
		const sidebar = page.getByRole('navigation', { name: 'Main' });
		await expect(sidebar).toBeVisible();
		const names = await sidebar.locator('a.item').evaluateAll((els) =>
			els.slice(0, 7).map((el) => el.textContent!.replace(/\d+$/, '').trim())
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

test('Scenario: Desktop sidebar marks Uni on a class detail page', async ({ page, request }) => {
	await reset(request);
	const { classes } = await seed(request, {
		aspects: [{ name: 'Studies' }],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis I' }]
	});
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto(`/uni/classes/${classes[0]}`);
	const sidebar = page.getByRole('navigation', { name: 'Main' });
	await expect(sidebar.getByRole('link', { name: 'Uni', exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
});

test('Scenario: Phone home list shows the seven lists', async ({ page }) => {
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

test('Scenario: Uni entry counts open class todos in active semesters', async ({ page, request }) => {
	await reset(request);
	await seed(request, {
		aspects: [{ name: 'Studies' }],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }, { name: 'SS 26', archivedAt: '2026-09-01T10:00:00.000Z' }],
		classes: [
			{ semester: 0, name: 'Analysis I' },
			{ semester: 0, name: 'Algorithms' },
			{ semester: 1, name: 'Old class' }
		],
		todos: [
			{ title: 'Sheet 1', aspect: 0, class: 0, type: 'EXC' },
			{ title: 'Sheet 2', aspect: 0, class: 1, type: 'EXC' },
			{ title: 'Sheet 0', aspect: 0, class: 0, type: 'EXC', status: 'done', completedAt: '2026-10-01T10:00:00.000Z' },
			{ title: 'Archived sheet', aspect: 0, class: 2, type: 'EXC' },
			{ title: 'Enrol', aspect: 0 }
		]
	});

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await expect(
		page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Uni', exact: true }).locator('.count')
	).toHaveText('2');

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	await expect(
		page.getByRole('navigation', { name: 'Lists' }).getByRole('link', { name: 'Uni', exact: true }).locator('.count')
	).toHaveText('2');
});

test('Scenario: Zero open class todos is shown like other zero counts', async ({ page, request }) => {
	await reset(request);
	await seed(request, {
		aspects: [{ name: 'Studies' }],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis I' }]
	});

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const sidebar = page.getByRole('navigation', { name: 'Main' });
	const recurring = sidebar.getByRole('link', { name: 'Recurring', exact: true });
	const uni = sidebar.getByRole('link', { name: 'Uni', exact: true });
	await expect(recurring.locator('.count')).toHaveCount(0);
	await expect(uni).toBeVisible();
	await expect(uni.locator('.count')).toHaveCount(0);
	await expect(uni).toHaveText('Uni');
});
