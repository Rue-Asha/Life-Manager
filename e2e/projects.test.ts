import { expect, test, reset, seed, projectCards } from './helpers';

test.beforeEach(async ({ request }) => {
	await reset(request);
});

const IT = { name: 'IT', color: 'sky', icon: 'code' } as const;

test('Scenario: Cards are grouped by status', async ({ page, request }) => {
	await seed(request, {
		aspects: [IT],
		itAspect: 0,
		projects: [
			{ name: 'Paused one', status: 'paused' },
			{ name: 'Implemented one', status: 'implemented' },
			{ name: 'Backlog one', status: 'backlog' },
			{ name: 'Active one', status: 'active' },
			{ name: 'In progress one', status: 'in_progress' }
		]
	});
	await page.goto('/projects');

	await expect(page.getByRole('heading', { level: 2 })).toHaveText([
		/^In progress/,
		/^Active/,
		/^Backlog/,
		/^Paused/,
		/^\s*Implemented/
	]);

	const implemented = page.getByRole('region', { name: /^Implemented/ });
	const toggle = implemented.getByRole('button', { name: 'Implemented (1)' });
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(projectCards(page)).toHaveCount(4);
	await expect(projectCards(implemented)).toHaveCount(0);
	await toggle.click();
	await expect(projectCards(implemented)).toHaveText(/Implemented one/);
});

test('Scenario: Card shows the project summary', async ({ page, request }) => {
	await seed(request, {
		aspects: [IT],
		itAspect: 0,
		projects: [
			{
				name: 'Life Manager',
				status: 'active',
				description: 'Weekly-sprint planner for every part of life, self-hosted on the homelab, with a long tail of words.',
				repoUrl: 'https://github.com/rue/life-manager',
				tags: ['svelte', 'sqlite']
			}
		],
		todos: [
			{ title: 'One', project: 0 },
			{ title: 'Two', project: 0 },
			{ title: 'Three', project: 0, status: 'done' }
		]
	});
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/projects');

	const card = projectCards(page);
	await expect(card).toContainText('Life Manager');
	await expect(card.getByText('svelte', { exact: true })).toBeVisible();
	await expect(card.getByText('sqlite', { exact: true })).toBeVisible();
	await expect(card.getByText('Repository linked')).toBeVisible();
	await expect(card).toContainText('2 open');
	const lineHeight = await card.getByText('Weekly-sprint planner').evaluate((el) => el.getBoundingClientRect().height);
	expect(lineHeight, 'description wraps').toBeLessThan(30);
});

test('Scenario: No projects shows an empty state', async ({ page, request }) => {
	await seed(request, { aspects: [IT], itAspect: 0 });
	await page.goto('/projects');

	const empty = page.getByText(/Capture your first idea/);
	await expect(empty.getByRole('button', { name: 'New project' })).toBeVisible();
	await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
});

test('Scenario: Empty groups are not rendered', async ({ page, request }) => {
	await seed(request, { aspects: [IT], itAspect: 0, projects: [{ name: 'Only', status: 'active' }] });
	await page.goto('/projects');

	await expect(page.getByRole('heading', { level: 2, name: /Active/ })).toBeVisible();
	for (const name of [/Backlog/, /Paused/, /Implemented/]) {
		await expect(page.getByRole('heading', { level: 2, name })).toHaveCount(0);
	}
});

test('Scenario: Phone shows one card per row', async ({ page, request }) => {
	await seed(request, {
		aspects: [IT],
		itAspect: 0,
		projects: [
			{ name: 'One', status: 'active' },
			{ name: 'Two', status: 'active' },
			{ name: 'Three', status: 'active' }
		]
	});
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/projects');

	const boxes = await projectCards(page).getByRole('link').evaluateAll((els) =>
		els.map((el) => {
			const r = el.getBoundingClientRect();
			return { left: r.left, top: r.top, bottom: r.bottom };
		})
	);
	expect(boxes).toHaveLength(3);
	expect(new Set(boxes.map((b) => b.left)).size).toBe(1);
	expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom);
	expect(boxes[2].top).toBeGreaterThanOrEqual(boxes[1].bottom);
});

test('Scenario: Wide desktop grid fills the content column', async ({ page, request }) => {
	await seed(request, {
		aspects: [IT],
		itAspect: 0,
		projects: ['One', 'Two', 'Three', 'Four'].map((name) => ({ name, status: 'active' as const }))
	});
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/projects');

	await expect(projectCards(page)).toHaveCount(4);
	const column = await page.getByRole('main').evaluate((main) => {
		const style = getComputedStyle(main);
		return main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
	});
	const grid = await page.getByRole('list', { name: 'Active projects' }).evaluate((el) => el.getBoundingClientRect().width);
	const cards = await projectCards(page).getByRole('link').evaluateAll((els) => els.map((c) => c.getBoundingClientRect().top));
	const firstRow = cards.filter((top) => top === cards[0]).length;
	expect(Math.abs(grid - column)).toBeLessThanOrEqual(2);
	expect(column, 'the column cap does not bind at 1600').toBeLessThan(1000);
	expect(firstRow).toBeGreaterThan(1);
});

test('Scenario: New project lands in Backlog', async ({ page, request }) => {
	await seed(request, { aspects: [IT], itAspect: 0, projects: [{ name: 'Existing', status: 'active' }] });
	await page.goto('/projects');

	await page.getByRole('button', { name: 'New project' }).click();
	await page.getByLabel('Name').fill('Photo indexer');
	await page.getByRole('button', { name: 'Add project' }).click();

	const backlog = page.getByRole('region', { name: /^Backlog/ });
	await expect(projectCards(backlog)).toContainText('Photo indexer');
});

test('Scenario: New project form shows field errors', async ({ page, request }) => {
	await seed(request, { aspects: [IT], itAspect: 0 });
	await page.goto('/projects');

	await page.getByText(/Capture your first idea/).getByRole('button', { name: 'New project' }).click();
	await page.getByLabel('Name').fill('   ');
	await page.getByRole('button', { name: 'Add project' }).click();
	await expect(page.getByRole('alert')).toHaveText('Give the project a name.');

	await page.getByLabel('Name').fill('Valid');
	await page.getByLabel('Repository URL').fill('github.com/x');
	await page.getByRole('button', { name: 'Add project' }).click();
	await expect(page.getByRole('alert')).toHaveText('Enter a link starting with http:// or https://.');
	await expect(projectCards(page)).toHaveCount(0);
});

test('Scenario: First run prompts for the IT aspect', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, IT] });
	await page.goto('/projects');

	const prompt = page.getByRole('region', { name: /aspect/i });
	await expect(prompt).toBeVisible();
	await expect(page.getByRole('button', { name: 'New project' })).toHaveCount(0);
	await prompt.getByRole('radio', { name: 'IT' }).check();
	await prompt.getByRole('button', { name: 'Use IT for projects' }).click();

	await expect(prompt).toHaveCount(0);
	await expect(page.getByRole('strong')).toHaveText('IT');
	await expect(page.getByRole('button', { name: 'New project' }).first()).toBeVisible();
});

test('Scenario: Changing the IT aspect removes links after confirmation', async ({ page, request }) => {
	await seed(request, {
		aspects: [IT, { name: 'Health' }],
		itAspect: 0,
		projects: [{ name: 'Linked', status: 'active' }],
		todos: [
			{ title: 'A', project: 0 },
			{ title: 'B', project: 0 }
		]
	});
	await page.goto('/projects');
	await expect(projectCards(page)).toContainText('2 open');

	await page.getByRole('button', { name: 'Change IT aspect' }).click();
	const prompt = page.getByRole('region', { name: /aspect/i });
	await prompt.getByRole('radio', { name: 'Health' }).check();
	await prompt.getByRole('button', { name: 'Use Health for projects' }).click();

	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('2 todos');
	await dialog.getByRole('button', { name: 'Change aspect' }).click();

	await expect(page.getByRole('strong')).toHaveText('Health');
	await expect(projectCards(page)).toContainText('No open todos');
});

test('Scenario: Changing the IT aspect without links needs no confirmation', async ({ page, request }) => {
	await seed(request, {
		aspects: [IT, { name: 'Health' }],
		itAspect: 0,
		projects: [{ name: 'Unlinked', status: 'active' }]
	});
	await page.goto('/projects');

	await page.getByRole('button', { name: 'Change IT aspect' }).click();
	const prompt = page.getByRole('region', { name: /aspect/i });
	await prompt.getByRole('radio', { name: 'Health' }).check();
	await prompt.getByRole('button', { name: 'Use Health for projects' }).click();

	await expect(page.getByRole('strong')).toHaveText('Health');
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Scenario: Without aspects Projects leads to creating one', async ({ page }) => {
	await page.goto('/projects');
	await expect(page).toHaveURL(/\/welcome$/);
});
