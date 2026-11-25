import { expect, openNewTodo, test, reset, seed, setClock, todoRow, todoRows } from './helpers';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS = [{ name: 'Health', color: 'sage', icon: 'heart' }, { name: 'IT', color: 'sky', icon: 'briefcase' }] as const;
const PROJECTS = [
	{ name: 'Backlog thing', status: 'backlog' },
	{ name: 'Active thing', status: 'active' },
	{ name: 'Paused thing', status: 'paused' },
	{ name: 'Done thing', status: 'implemented' }
] as const;

async function openQuickAdd(page: import('@playwright/test').Page) {
	await page.goto('/backlog');
	return openNewTodo(page);
}

test('Scenario: Quick add links a todo to a project', async ({ page, request }) => {
	const { projects } = await seed(request, { aspects: [...ASPECTS], itAspect: 1, projects: [...PROJECTS] });
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'IT' });
	await form.getByLabel('Project').selectOption({ label: 'Active thing' });
	await form.getByLabel('Title').fill('Wire the thing');
	await form.getByRole('button', { name: 'Add todo' }).click();

	const row = todoRow(page, 'Wire the thing');
	await expect(row.getByRole('link', { name: 'Active thing' })).toHaveAttribute('href', `/projects/${projects[1]}`);
});

test('Scenario: Project field appears only for the IT aspect', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		itAspect: 1,
		projects: [...PROJECTS],
		todos: [{ title: 'Existing', aspect: 0 }]
	});
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Health' });
	await expect(form.getByLabel('Project')).toHaveCount(0);
	await form.getByLabel('Aspect').selectOption({ label: 'IT' });
	await expect(form.getByLabel('Project')).toBeVisible();
	await form.getByRole('button', { name: 'Cancel' }).click();

	await page.getByRole('button', { name: 'Existing', exact: true }).click();
	const editor = page.getByRole('form', { name: 'Edit todo' });
	await expect(editor.getByLabel('Project')).toHaveCount(0);
	await editor.getByLabel('Aspect').selectOption({ label: 'IT' });
	await expect(editor.getByLabel('Project')).toBeVisible();
});

test('Scenario: Project field lists projects that are not implemented', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		itAspect: 1,
		projects: [...PROJECTS],
		todos: [{ title: 'Linked to done', aspect: 1, project: 3 }]
	});
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'IT' });
	await expect(form.getByLabel('Project').getByRole('option')).toHaveText([
		'No project',
		'Active thing',
		'Backlog thing',
		'Paused thing'
	]);
	await form.getByRole('button', { name: 'Cancel' }).click();

	await page.getByRole('button', { name: 'Linked to done', exact: true }).click();
	const editor = page.getByRole('form', { name: 'Edit todo' });
	await expect(editor.getByLabel('Project').getByRole('option')).toHaveText([
		'No project',
		'Active thing',
		'Backlog thing',
		'Done thing',
		'Paused thing'
	]);
	await expect(editor.getByLabel('Project')).toHaveValue(/\d+/);
});

test('Scenario: Project field is hidden without IT aspect or projects', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], projects: [...PROJECTS] });
	let form = await openQuickAdd(page);
	for (const name of ['Health', 'IT']) {
		await form.getByLabel('Aspect').selectOption({ label: name });
		await expect(form.getByLabel('Project')).toHaveCount(0);
	}

	await reset(request);
	await seed(request, { aspects: [...ASPECTS], itAspect: 1 });
	form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'IT' });
	await expect(form.getByLabel('Project')).toHaveCount(0);
});

test('Scenario: Switching the aspect away drops the project', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], itAspect: 1, projects: [...PROJECTS] });
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'IT' });
	await form.getByLabel('Project').selectOption({ label: 'Active thing' });
	await form.getByLabel('Aspect').selectOption({ label: 'Health' });
	await expect(form.getByLabel('Project')).toHaveCount(0);
	await form.getByLabel('Title').fill('Run a lap');
	await form.getByRole('button', { name: 'Add todo' }).click();

	const row = todoRow(page, 'Run a lap');
	await expect(row).toBeVisible();
	await expect(row.getByRole('link')).toHaveCount(0);
});

test('Scenario: Linked todo shows the project badge', async ({ page, request }) => {
	const { projects } = await seed(request, {
		aspects: [...ASPECTS],
		itAspect: 1,
		sprint: { state: 'active', weekStart: '2026-10-05' },
		projects: [{ name: 'Life Manager', status: 'active' }],
		todos: [
			{ title: 'On backlog', aspect: 1, project: 0 },
			{ title: 'In sprint', aspect: 1, project: 0, inSprint: true, day: '2026-10-07' }
		]
	});
	await page.goto('/backlog');
	const backlogRow = todoRow(page, 'On backlog');
	await expect(backlogRow.getByRole('link', { name: 'Life Manager' })).toHaveText('Life Manager');

	await page.goto('/');
	await expect(todoRow(page, 'In sprint').getByRole('link', { name: 'Life Manager' })).toHaveText('Life Manager');
	await page.goto('/sprint');
	await expect(todoRow(page, 'In sprint').getByRole('link', { name: 'Life Manager' })).toHaveText('Life Manager');

	await page.goto('/backlog');
	await todoRow(page, 'On backlog').getByRole('link', { name: 'Life Manager' }).click();
	await expect(page).toHaveURL(new RegExp(`/projects/${projects[0]}$`));
});

test('Scenario: Unlinked todo shows no badge', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		itAspect: 1,
		projects: [{ name: 'Life Manager' }],
		todos: [{ title: 'Plain', aspect: 1 }]
	});
	await page.goto('/backlog');
	await expect(todoRows(page)).toHaveCount(1);
	await expect(todoRows(page).getByRole('link')).toHaveCount(0);
});

test('Scenario: Badge wraps under the title on a phone', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		itAspect: 1,
		projects: [{ name: 'Life Manager' }],
		todos: [{ title: 'A very long todo title that cannot possibly fit on one line of a phone screen', aspect: 1, project: 0 }]
	});
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('/backlog');
	const row = todoRows(page);
	const title = (await row.getByRole('button', { name: /^A very long todo title/ }).boundingBox())!;
	const badge = (await row.getByRole('link', { name: 'Life Manager' }).boundingBox())!;
	expect(badge.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
