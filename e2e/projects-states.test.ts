import { expect, test, reset, seed, setClock, todoRows } from './helpers';

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';
const IT = { name: 'IT', color: 'sky', icon: 'code' } as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Projects are grouped by status', async ({ page, request }) => {
	await seed(request, {
		aspects: [IT],
		itAspect: 0,
		projects: [
			{ name: 'Mid build', status: 'in_progress' },
			{ name: 'Active one', status: 'active' },
			{ name: 'Active two', status: 'active' },
			{ name: 'Shipped', status: 'implemented' }
		]
	});
	await page.goto('/projects');

	const groups = page.getByRole('main').getByRole('heading', { level: 2 });
	await expect(groups).toHaveText([/^In progress/, /^Active/, /^\s*Implemented/, 'IT aspect']);
	await expect(page.getByRole('region', { name: /^In progress/ })).toContainText('1');
	await expect(page.getByRole('region', { name: /^Active/ })).toContainText('2');
	await expect(page.getByRole('button', { name: 'Implemented (1)' })).toHaveAttribute('aria-expanded', 'false');
});

test('Scenario: No projects shows the capture prompt', async ({ page, request }) => {
	await seed(request, { aspects: [IT], itAspect: 0 });
	await page.goto('/projects');

	await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible();
	await expect(page.getByText('A project starts in the backlog.')).toBeVisible();
	await page.getByRole('button', { name: 'New project' }).click();
	const form = page.getByRole('dialog', { name: 'New project' });
	await expect(form.getByLabel('Name')).toBeFocused();
	await expect(form.getByRole('button', { name: 'Add project' })).toBeVisible();
});

test('Scenario: IT aspect prompt before the first use', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, IT] });
	await page.goto('/projects');

	await expect(page.getByRole('heading', { name: 'Which aspect holds your IT todos?' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'New project' })).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1);
	await expect(page.getByRole('radio', { name: 'IT' })).toBeChecked();
	await page.getByRole('radio', { name: 'Health' }).check();
	await page.getByRole('button', { name: 'Use Health for projects' }).click();

	await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible();
	await expect(page.getByRole('strong')).toHaveText('Health');
});

test('Scenario: Changing the IT aspect asks first', async ({ page, request }) => {
	await seed(request, { aspects: [IT, { name: 'Health' }], itAspect: 0, projects: [{ name: 'Linked', status: 'active' }], todos: [{ title: 'A', project: 0 }] });
	await page.goto('/projects');

	await page.getByRole('button', { name: 'Change IT aspect' }).click();
	await page.getByRole('radio', { name: 'Health' }).check();
	await page.getByRole('button', { name: 'Use Health for projects' }).click();

	const dialog = page.getByRole('dialog', { name: 'Change the IT aspect?' });
	await expect(dialog).toContainText('1 todo loses its project link');
	await expect(page.getByRole('strong')).toHaveText('IT');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(dialog).toBeHidden();
	await expect(page.getByRole('strong')).toHaveText('IT');
});

const aspects = [{ name: 'Health' }, IT];
const project = { name: 'Home server', description: 'Runs the homelab', repoUrl: 'https://github.com/rue-asha/home-server', tags: ['homelab', 'tools'], status: 'active' as const, notes: 'Plan the **next** steps' };

test('Scenario: Project page shows details and linked todos', async ({ page, request }) => {
	const { projects } = await seed(request, {
		aspects,
		itAspect: 1,
		sprint: { state: 'active', weekStart: WEEK },
		projects: [project],
		todos: [
			{ title: 'Pick a case', aspect: 1, project: 0 },
			{ title: 'Flash the firmware', aspect: 1, project: 0, inSprint: true },
			{ title: 'Order the disks', aspect: 1, project: 0, inSprint: true, status: 'done', completedAt: '2026-10-06T09:00:00Z' }
		]
	});
	await page.goto(`/projects/${projects[0]}`);

	await expect(page.getByRole('heading', { level: 1, name: 'Home server' })).toBeVisible();
	await expect(page.getByRole('button', { name: /^Status: Active\./ })).toBeVisible();
	await expect(page.getByText('Runs the homelab')).toBeVisible();
	const details = page.getByRole('group', { name: 'Project details' });
	await expect(details).toContainText('rue-asha/home-server');
	await expect(details.getByText('homelab', { exact: true })).toBeVisible();
	await expect(details.getByText('tools', { exact: true })).toBeVisible();
	await expect(page.getByRole('group', { name: 'Rendered notes' }).getByRole('strong')).toHaveText('next');

	const rows = (name: string) => todoRows(page.getByRole('group', { name, exact: true }));
	await expect(rows('Open')).toHaveText([/Pick a case/]);
	await expect(rows('Planned')).toHaveText([/Flash the firmware/]);
	const done = page.getByRole('group', { name: 'Done', exact: true });
	await expect(done.getByRole('button', { name: /^Done/ })).toHaveAttribute('aria-expanded', 'false');
	await expect(rows('Done')).toHaveCount(0);
});

test('Scenario: Project without linked todos', async ({ page, request }) => {
	const { projects } = await seed(request, { aspects, itAspect: 1, projects: [{ name: 'Bare', status: 'backlog' }] });
	await page.goto(`/projects/${projects[0]}`);

	await expect(page.getByText('No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field.')).toBeVisible();
	await expect(page.getByRole('group', { name: 'Open', exact: true })).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Project details' })).toBeVisible();
	await expect(page.getByText('No notes yet.')).toBeVisible();
});

test('Scenario: Long notes stay whole on the project page', async ({ page, request }) => {
	const url = `https://example.org/an-unbroken-address/${'x'.repeat(40)}`;
	const body = Array.from({ length: 70 }, (_, i) => `Paragraph ${i + 1} with some words to fill the line.`).join('\n\n');
	const notes = `${body}\n\n${url}\n\nThe very last line`;
	const { projects } = await seed(request, { aspects, itAspect: 1, projects: [{ name: 'Long', status: 'active', notes }] });
	await page.setViewportSize({ width: 375, height: 700 });
	await page.goto(`/projects/${projects[0]}`);

	const rendered = page.getByRole('group', { name: 'Rendered notes' });
	await expect(rendered).toContainText('The very last line');
	await expect(page.getByRole('button', { name: 'Show more' })).toHaveAttribute('aria-expanded', 'false');
	await page.getByRole('button', { name: 'Show more' }).click();
	await page.getByText('The very last line').scrollIntoViewIfNeeded();
	await expect(page.getByText('The very last line')).toBeInViewport();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
